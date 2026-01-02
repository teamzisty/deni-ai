import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type Stripe from "stripe";
import { z } from "zod";
import { billing, user } from "@/db/schema";
import { env } from "@/env";
import {
  type BillingPlan,
  billingPlans,
  findPlanById,
  findPlanByLookupKey,
} from "@/lib/billing";
import { isBillingDisabled } from "@/lib/billing-config";
import { stripe } from "@/lib/stripe";
import { getSubscriptionPeriodEndDate } from "@/lib/stripe-subscriptions";
import { getUsageSummary } from "@/lib/usage";
import { type ProtectedContext, protectedProcedure, router } from "../trpc";

const planIdSchema = z.enum([
  "plus_monthly",
  "plus_yearly",
  "pro_monthly",
  "pro_yearly",
]);

type BillingRecord = typeof billing.$inferSelect;
const ACTIVE_SUB_STATUSES = new Set([
  "trialing",
  "active",
  "past_due",
  "incomplete",
  "unpaid",
]);
const billingEnabledProcedure = protectedProcedure.use(({ next }) => {
  if (isBillingDisabled) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Billing is disabled.",
    });
  }
  return next();
});

function deriveModeFromPrice(
  price: Stripe.Price | null | undefined,
): "subscription" | "payment" {
  if (!price) {
    return "subscription";
  }
  return price.recurring ? "subscription" : "payment";
}

async function getPriceForPlan(plan: BillingPlan) {
  const prices = await stripe.prices.list({
    lookup_keys: [plan.lookupKey],
    active: true,
    limit: 1,
  });

  const price = prices.data.at(0);
  if (!price) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Unable to load ${plan.lookupKey} price. Configure lookup_key=${plan.lookupKey} in Stripe.`,
    });
  }

  return price;
}

function getPlanFromPrice(price: Stripe.Price | null | undefined) {
  return findPlanByLookupKey(price?.lookup_key ?? undefined);
}

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

  const subscriptionId = subscriptions.data.at(0)?.id;
  if (!subscriptionId) {
    return billingRecord;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const updates: Partial<BillingRecord> = {};

  if (subscription) {
    const price = subscription.items.data.at(0)?.price ?? null;
    const plan =
      findPlanById(subscription.metadata?.planId ?? "") ??
      getPlanFromPrice(price);
    const status = subscription.status;

    updates.stripeSubscriptionId = subscription.id;
    updates.priceId = price?.id;
    updates.planId = plan?.id ?? billingRecord.planId;
    updates.cancelAt = subscription.cancel_at;
    updates.status = status;
    updates.mode = deriveModeFromPrice(price);
    updates.currentPeriodEnd = getSubscriptionPeriodEndDate(subscription);
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
  plans: billingEnabledProcedure.query(async () => {
    const plans = await Promise.all(
      billingPlans.map(async (plan) => {
        const price = await getPriceForPlan(plan);
        const mode = deriveModeFromPrice(price);
        return {
          id: plan.id,
          lookupKey: plan.lookupKey,
          mode,
          priceId: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval ?? null,
          intervalCount: price.recurring?.interval_count ?? 1,
        };
      }),
    );

    return { plans };
  }),
  status: billingEnabledProcedure.query(async ({ ctx }) => {
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
  createCheckoutSession: billingEnabledProcedure
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

      await syncSubscription(ctx, ctx.userId);

      const billingRecord = await ensureBillingRecord(ctx, ctx.userId);

      const price = await getPriceForPlan(plan);
      const mode = deriveModeFromPrice(price);

      if (mode === "subscription") {
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
        mode: mode === "payment" ? "payment" : "subscription",
        customer: billingRecord.stripeCustomerId,
        client_reference_id: ctx.userId,
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        metadata: {
          userId: ctx.userId,
          planId: plan.id,
        },
        subscription_data:
          mode === "subscription"
            ? {
                metadata: {
                  userId: ctx.userId,
                  planId: plan.id,
                },
              }
            : undefined,
        payment_intent_data:
          mode === "payment"
            ? {
                metadata: {
                  userId: ctx.userId,
                  planId: plan.id,
                  priceId: price.id,
                },
              }
            : undefined,
        allow_promotion_codes: true,
        success_url: `${env.NEXT_PUBLIC_BETTER_AUTH_URL}/settings/billing?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.NEXT_PUBLIC_BETTER_AUTH_URL}/settings/billing`,
      });

      await ctx.db
        .insert(billing)
        .values({
          userId: ctx.userId,
          stripeCustomerId: billingRecord.stripeCustomerId,
          planId: plan.id,
          priceId: price.id,
          status: "pending",
          mode,
          checkoutSessionId: session.id,
        })
        .onConflictDoUpdate({
          target: billing.userId,
          set: {
            planId: plan.id,
            priceId: price.id,
            status: "pending",
            mode,
            checkoutSessionId: session.id,
            updatedAt: new Date(),
          },
        });

      return { url: session.url };
    }),
  confirmCheckout: billingEnabledProcedure
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
        session.line_items?.data.at(0)?.price ??
        (subscription &&
        typeof subscription !== "string" &&
        "items" in subscription
          ? subscription.items.data.at(0)?.price
          : undefined);

      const plan =
        findPlanById((session.metadata?.planId as string) ?? "") ??
        getPlanFromPrice(linePrice ?? null);

      const resolvedMode =
        deriveModeFromPrice(linePrice ?? null) ??
        (session.mode === "payment" ? "payment" : "subscription");

      const updates: Partial<BillingRecord> = {
        stripeCustomerId:
          (session.customer as string | null | undefined) ??
          billingRecord.stripeCustomerId,
        planId: plan?.id ?? billingRecord.planId,
        priceId: linePrice?.id ?? billingRecord.priceId,
        mode: resolvedMode,
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
  createPortalSession: billingEnabledProcedure.mutation(async ({ ctx }) => {
    const subscription = await syncSubscription(ctx, ctx.userId);

    const portal = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${env.NEXT_PUBLIC_BETTER_AUTH_URL}/settings/billing`,
    });

    return { url: portal.url };
  }),
  changePlan: billingEnabledProcedure
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
          message: "Target plan must be a subscription plan.",
        });
      }

      const price = await getPriceForPlan(plan);
      const mode = deriveModeFromPrice(price);
      if (mode !== "subscription") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Target plan must be a subscription plan.",
        });
      }

      const subscriptionState = await syncSubscription(ctx, ctx.userId);
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
        items: [{ id: item.id, price: price.id }],
        metadata: { userId: ctx.userId, planId: plan.id },
        proration_behavior: "always_invoice",
      });

      const updates: Partial<BillingRecord> = {
        planId: plan.id,
        priceId: price.id,
        mode,
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
  cancelSubscription: billingEnabledProcedure.mutation(async ({ ctx }) => {
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
  resumeSubscription: billingEnabledProcedure.mutation(async ({ ctx }) => {
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

    const price = resumed.items.data.at(0)?.price ?? null;
    const plan =
      getPlanFromPrice(price) ??
      findPlanById(resumed.metadata?.planId ?? "") ??
      (subscriptionState.planId
        ? findPlanById(subscriptionState.planId)
        : null);

    const updates: Partial<BillingRecord> = {
      status: resumed.status,
      currentPeriodEnd: getSubscriptionPeriodEndDate(resumed),
      stripeSubscriptionId: resumed.id,
      priceId: price?.id ?? subscriptionState.priceId,
      planId: plan?.id ?? subscriptionState.planId,
      mode: deriveModeFromPrice(price),
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
    const summary = await getUsageSummary({
      userId: ctx.userId,
      isAnonymous: Boolean(ctx.session?.user?.isAnonymous),
    });
    return summary;
  }),
  estimatePlanChange: billingEnabledProcedure
    .input(
      z.object({
        planId: planIdSchema,
      }),
    )
    .query(async ({ ctx, input }) => {
      const plan = findPlanById(input.planId);
      if (!plan) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Target plan must be a subscription plan.",
        });
      }

      const price = await getPriceForPlan(plan);
      const mode = deriveModeFromPrice(price);
      if (mode !== "subscription") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Target plan must be a subscription plan.",
        });
      }

      const subscriptionState = await syncSubscription(ctx, ctx.userId);

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

      if (item.price?.id === price.id) {
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
              price: price.id,
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
