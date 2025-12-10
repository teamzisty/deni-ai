import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { z } from "zod";
import { billing, user } from "@/db/schema";
import { env } from "@/env";
import { billingPlans, findPlanById, findPlanByPriceId } from "@/lib/billing";
import { stripe } from "@/lib/stripe";
import { getSubscriptionPeriodEndDate } from "@/lib/stripe-subscriptions";
import { getUsageSummary } from "@/lib/usage";
import { type ProtectedContext, protectedProcedure, router } from "../trpc";

const planIdSchema = z.enum([
  "pro-monthly",
  "pro-quarterly",
  "pro-yearly",
  "max-yearly",
  "max-lifetime",
]);

type BillingRecord = typeof billing.$inferSelect;
const ACTIVE_SUB_STATUSES = new Set([
  "trialing",
  "active",
  "past_due",
  "incomplete",
  "unpaid",
]);

async function fetchUserProfile(ctx: ProtectedContext, userId: string) {
  const [profile] = await ctx.db
    .select({
      email: user.email,
      name: user.name,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!profile?.email) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "User profile missing an email address.",
    });
  }

  return profile;
}

async function findOrCreateStripeCustomer({
  email,
  name,
  userId,
}: {
  email: string;
  name?: string | null;
  userId: string;
}) {
  let customer: Stripe.Customer | undefined;

  try {
    const search = await stripe.customers.search({
      query: `metadata['userId']:'${userId}'`,
      limit: 1,
    });
    customer = search.data[0];
  } catch (error) {
    console.warn("Stripe customer search failed, falling back to list", error);
  }

  if (!customer) {
    const list = await stripe.customers.list({ email, limit: 1 });
    customer = list.data[0];
  }

  if (customer) {
    return customer;
  }

  return stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { userId },
  });
}

async function ensureBillingRecord(ctx: ProtectedContext, userId: string) {
  const existing = await ctx.db
    .select()
    .from(billing)
    .where(eq(billing.userId, userId))
    .limit(1);

  if (existing[0]) {
    return existing[0];
  }

  const profile = await fetchUserProfile(ctx, userId);
  const customer = await findOrCreateStripeCustomer({
    email: profile.email,
    name: profile.name,
    userId,
  });

  const [created] = await ctx.db
    .insert(billing)
    .values({
      userId,
      stripeCustomerId: customer.id,
      status: "inactive",
    })
    .onConflictDoUpdate({
      target: billing.userId,
      set: {
        stripeCustomerId: customer.id,
        updatedAt: new Date(),
      },
    })
    .returning();

  return created;
}

async function syncSubscription(ctx: ProtectedContext, userId: string) {
  const billingRecord = await ensureBillingRecord(ctx, userId);

  const subscriptions = await stripe.subscriptions.list({
    customer: billingRecord.stripeCustomerId,
    status: "all",
    limit: 1,
    expand: ["data.default_payment_method"],
  });

  const subscription = subscriptions.data.at(0);
  const updates: Partial<BillingRecord> = {};

  if (subscription) {
    const priceId = subscription.items.data.at(0)?.price?.id;
    const plan = findPlanByPriceId(priceId ?? undefined);
    const status = subscription.status;

    updates.stripeSubscriptionId = subscription.id;
    updates.priceId = priceId;
    updates.planId = plan?.id ?? billingRecord.planId;
    updates.cancelAt = subscription.cancel_at;
    updates.status = status;
    updates.mode = "subscription";
    updates.currentPeriodEnd = getSubscriptionPeriodEndDate(subscription);
  } else {
    const intents = await stripe.paymentIntents.list({
      customer: billingRecord.stripeCustomerId,
      limit: 10,
    });

    const lifetimePayment = intents.data.find(
      (intent) =>
        intent.metadata?.planId === "max-lifetime" &&
        intent.status === "succeeded",
    );

    if (lifetimePayment) {
      updates.planId = "max-lifetime";
      updates.priceId = lifetimePayment.metadata?.priceId ?? undefined;
      updates.status = "paid";
      updates.mode = "payment";
    }
  }

  if (Object.keys(updates).length === 0) {
    return billingRecord;
  }

  const [updated] = await ctx.db
    .insert(billing)
    .values({
      userId,
      stripeCustomerId: billingRecord.stripeCustomerId,
      ...updates,
    })
    .onConflictDoUpdate({
      target: billing.userId,
      set: {
        stripeCustomerId: billingRecord.stripeCustomerId,
        ...updates,
        updatedAt: new Date(),
      },
    })
    .returning();

  return updated;
}

export const billingRouter = router({
  plans: protectedProcedure.query(async () => {
    const plans = await Promise.all(
      billingPlans.map(async (plan) => {
        const price = await stripe.prices
          .retrieve(plan.priceId)
          .catch((error) => {
            console.error("Failed to load Stripe price", {
              planId: plan.id,
              priceId: plan.priceId,
              error,
            });
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Unable to load ${plan.name} price. Check your STRIPE_PRICE_* envs.`,
            });
          });
        return {
          id: plan.id,
          name: plan.name,
          tagline: plan.tagline,
          highlights: plan.highlights,
          badge: plan.badge,
          mode: plan.mode,
          priceId: plan.priceId,
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval ?? null,
          intervalCount: price.recurring?.interval_count ?? 1,
        };
      }),
    );

    return { plans };
  }),
  status: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await syncSubscription(ctx, ctx.userId);

    return {
      planId: subscription.planId ?? null,
      status: subscription.status ?? null,
      mode: subscription.mode ?? null,
      cancelAt: subscription.cancelAt,
      priceId: subscription.priceId ?? null,
      currentPeriodEnd: subscription.currentPeriodEnd ?? null,
      stripeCustomerId: subscription.stripeCustomerId,
    };
  }),
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        planId: planIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const plan = findPlanById(input.planId);
      if (!plan) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unknown plan.",
        });
      }

      const current = await syncSubscription(ctx, ctx.userId);
      if (
        current.planId === "max-lifetime" &&
        (current.status === "paid" || current.status === "active")
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Lifetime plan is active. No additional plans can be purchased.",
        });
      }

      const billingRecord = await ensureBillingRecord(ctx, ctx.userId);

      if (plan.mode === "subscription") {
        const existingSubs = await stripe.subscriptions.list({
          customer: billingRecord.stripeCustomerId,
          status: "all",
          limit: 10,
        });

        const activeSub = existingSubs.data.find(
          (sub) =>
            ACTIVE_SUB_STATUSES.has(sub.status) ||
            sub.cancel_at_period_end === true,
        );

        if (activeSub) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "You already have an active subscription. Use Change plan or cancel first.",
          });
        }
      }

      const session = await stripe.checkout.sessions.create({
        mode: plan.mode === "payment" ? "payment" : "subscription",
        customer: billingRecord.stripeCustomerId,
        client_reference_id: ctx.userId,
        line_items: [
          {
            price: plan.priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId: ctx.userId,
          planId: plan.id,
        },
        subscription_data:
          plan.mode === "subscription"
            ? {
                metadata: {
                  userId: ctx.userId,
                  planId: plan.id,
                },
              }
            : undefined,
        payment_intent_data:
          plan.mode === "payment"
            ? {
                metadata: {
                  userId: ctx.userId,
                  planId: plan.id,
                  priceId: plan.priceId,
                },
              }
            : undefined,
        allow_promotion_codes: true,
        success_url: `${env.BETTER_AUTH_URL}/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.BETTER_AUTH_URL}/settings/billing`,
      });

      await ctx.db
        .insert(billing)
        .values({
          userId: ctx.userId,
          stripeCustomerId: billingRecord.stripeCustomerId,
          planId: plan.id,
          priceId: plan.priceId,
          status: "pending",
          mode: plan.mode,
          checkoutSessionId: session.id,
        })
        .onConflictDoUpdate({
          target: billing.userId,
          set: {
            planId: plan.id,
            priceId: plan.priceId,
            status: "pending",
            mode: plan.mode,
            checkoutSessionId: session.id,
            updatedAt: new Date(),
          },
        });

      return { url: session.url };
    }),
  confirmCheckout: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = await stripe.checkout.sessions.retrieve(input.sessionId, {
        expand: ["subscription", "payment_intent", "line_items"],
      });

      if (
        session.client_reference_id &&
        session.client_reference_id !== ctx.userId
      ) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Session does not belong to the current user.",
        });
      }

      const billingRecord = await ensureBillingRecord(ctx, ctx.userId);
      const subscription =
        session.subscription &&
        typeof session.subscription !== "string" &&
        session.subscription;

      const paymentIntent = session.payment_intent;

      const linePrice =
        session.line_items?.data.at(0)?.price?.id ??
        (subscription &&
        typeof subscription !== "string" &&
        "items" in subscription
          ? subscription.items.data.at(0)?.price?.id
          : undefined);

      const plan =
        findPlanById((session.metadata?.planId as string) ?? "") ??
        findPlanByPriceId(linePrice ?? undefined);

      const updates: Partial<BillingRecord> = {
        stripeCustomerId:
          (session.customer as string | null | undefined) ??
          billingRecord.stripeCustomerId,
        planId: plan?.id ?? billingRecord.planId,
        priceId: plan?.priceId ?? billingRecord.priceId ?? linePrice,
        mode:
          plan?.mode ??
          (session.mode === "payment" ? "payment" : "subscription"),
        checkoutSessionId: session.id,
      };

      if (subscription) {
        updates.stripeSubscriptionId = subscription.id;
        updates.status = subscription.status;
        updates.currentPeriodEnd = getSubscriptionPeriodEndDate(subscription);
      } else if (
        paymentIntent &&
        typeof paymentIntent !== "string" &&
        paymentIntent.status === "succeeded"
      ) {
        updates.status = "paid";
        updates.mode = "payment";
      } else if (session.payment_status === "paid") {
        updates.status = "paid";
      }

      const [saved] = await ctx.db
        .insert(billing)
        .values([
          {
            userId: ctx.userId,
            stripeCustomerId: updates.stripeCustomerId ?? "",
            ...updates,
          },
        ])
        .onConflictDoUpdate({
          target: billing.userId,
          set: {
            ...updates,
            updatedAt: new Date(),
          },
        })
        .returning();

      return {
        planId: saved.planId ?? null,
        status: saved.status ?? null,
        mode: saved.mode ?? null,
        currentPeriodEnd: saved.currentPeriodEnd ?? null,
      };
    }),
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const subscription = await syncSubscription(ctx, ctx.userId);

    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${env.BETTER_AUTH_URL}/settings/billing`,
    });

    return { url: portal.url };
  }),
  changePlan: protectedProcedure
    .input(
      z.object({
        planId: planIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const plan = findPlanById(input.planId);
      if (!plan || plan.mode !== "subscription") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Target plan must be a subscription plan.",
        });
      }

      const subscriptionState = await syncSubscription(ctx, ctx.userId);
      if (
        subscriptionState.planId === "max-lifetime" &&
        (subscriptionState.status === "paid" ||
          subscriptionState.status === "active")
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Lifetime plan is active. No changes allowed.",
        });
      }
      if (!subscriptionState.stripeSubscriptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active subscription found. Start with checkout instead.",
        });
      }

      const subscription = await stripe.subscriptions.retrieve(
        subscriptionState.stripeSubscriptionId,
        { expand: ["items"] },
      );

      const item = subscription.items.data.at(0);
      if (!item?.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Subscription has no billable items to update.",
        });
      }

      const updated = await stripe.subscriptions.update(subscription.id, {
        items: [{ id: item.id, price: plan.priceId }],
        metadata: { userId: ctx.userId, planId: plan.id },
        proration_behavior: "always_invoice",
      });

      const updates: Partial<BillingRecord> = {
        planId: plan.id,
        priceId: plan.priceId,
        mode: "subscription",
        status: updated.cancel_at_period_end ? "canceled" : updated.status,
        currentPeriodEnd: getSubscriptionPeriodEndDate(updated),
        stripeSubscriptionId: updated.id,
      };

      const [saved] = await ctx.db
        .insert(billing)
        .values({
          userId: ctx.userId,
          stripeCustomerId: subscription.customer as string,
          ...updates,
        })
        .onConflictDoUpdate({
          target: billing.userId,
          set: {
            ...updates,
            updatedAt: new Date(),
          },
        })
        .returning();

      return {
        planId: saved.planId ?? null,
        status: saved.status ?? null,
        mode: saved.mode ?? null,
        currentPeriodEnd: saved.currentPeriodEnd ?? null,
      };
    }),
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const subscriptionState = await syncSubscription(ctx, ctx.userId);
    if (!subscriptionState.stripeSubscriptionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No active subscription to cancel.",
      });
    }

    const canceled = await stripe.subscriptions.update(
      subscriptionState.stripeSubscriptionId,
      { cancel_at_period_end: true },
    );

    const updates: Partial<BillingRecord> = {
      status: canceled.cancel_at_period_end ? "canceled" : canceled.status,
      currentPeriodEnd:
        getSubscriptionPeriodEndDate(canceled) ??
        subscriptionState.currentPeriodEnd,
    };

    const [saved] = await ctx.db
      .insert(billing)
      .values({
        userId: ctx.userId,
        stripeCustomerId: subscriptionState.stripeCustomerId,
        stripeSubscriptionId: subscriptionState.stripeSubscriptionId,
        ...updates,
      })
      .onConflictDoUpdate({
        target: billing.userId,
        set: {
          ...updates,
          updatedAt: new Date(),
        },
      })
      .returning();

    return {
      planId: saved.planId ?? null,
      status: saved.status ?? null,
      mode: saved.mode ?? null,
      currentPeriodEnd: saved.currentPeriodEnd ?? null,
    };
  }),
  resumeSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const subscriptionState = await syncSubscription(ctx, ctx.userId);
    if (!subscriptionState.stripeSubscriptionId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No subscription to resume.",
      });
    }

    const resumed = await stripe.subscriptions.update(
      subscriptionState.stripeSubscriptionId,
      { cancel_at_period_end: false },
    );

    const updates: Partial<BillingRecord> = {
      status: resumed.status,
      currentPeriodEnd: getSubscriptionPeriodEndDate(resumed),
      stripeSubscriptionId: resumed.id,
      priceId: resumed.items.data.at(0)?.price?.id ?? subscriptionState.priceId,
      planId:
        findPlanByPriceId(
          resumed.items.data.at(0)?.price?.id ??
            subscriptionState.priceId ??
            undefined,
        )?.id ?? subscriptionState.planId,
      mode: "subscription",
    };

    const [saved] = await ctx.db
      .insert(billing)
      .values({
        userId: ctx.userId,
        stripeCustomerId: subscriptionState.stripeCustomerId,
        ...updates,
      })
      .onConflictDoUpdate({
        target: billing.userId,
        set: {
          ...updates,
          updatedAt: new Date(),
        },
      })
      .returning();

    return {
      planId: saved.planId ?? null,
      status: saved.status ?? null,
      mode: saved.mode ?? null,
      currentPeriodEnd: saved.currentPeriodEnd ?? null,
    };
  }),
  usage: protectedProcedure.query(async ({ ctx }) => {
    const summary = await getUsageSummary({ userId: ctx.userId });
    return summary;
  }),
  estimatePlanChange: protectedProcedure
    .input(
      z.object({
        planId: planIdSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const plan = findPlanById(input.planId);
      if (!plan || plan.mode !== "subscription") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Target plan must be a subscription plan.",
        });
      }

      const subscriptionState = await syncSubscription(ctx, ctx.userId);
      if (
        subscriptionState.planId === "max-lifetime" &&
        (subscriptionState.status === "paid" ||
          subscriptionState.status === "active")
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Lifetime plan is active. No changes allowed.",
        });
      }

      if (!subscriptionState.stripeSubscriptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active subscription to estimate against.",
        });
      }

      const subscription = await stripe.subscriptions.retrieve(
        subscriptionState.stripeSubscriptionId,
        { expand: ["items"] },
      );
      const item = subscription.items.data.at(0);
      if (!item?.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Subscription has no billable items to estimate.",
        });
      }

      if (item.price?.id === plan.priceId) {
        return {
          amountDue: 0,
          currency: item.price?.currency ?? subscription.currency ?? null,
        };
      }

      const upcoming = await stripe.invoices.createPreview({
        customer: subscription.customer as string,
        subscription: subscription.id,
        subscription_details: {
          items: [
            {
              id: item.id,
              price: plan.priceId,
            },
          ],
          proration_behavior: "always_invoice",
        },
      });

      return {
        amountDue: upcoming.amount_due ?? 0,
        currency: upcoming.currency ?? item.price?.currency ?? null,
        nextPaymentAttempt: upcoming.next_payment_attempt
          ? new Date(upcoming.next_payment_attempt * 1000)
          : null,
      };
    }),
});
