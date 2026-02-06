import { TRPCError } from "@trpc/server";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { billing, member, user } from "@/db/schema";
import { env } from "@/env";
import { type BillingPlan, billingPlans, findPlanById, isTeamPlan } from "@/lib/billing";
import { isBillingDisabled } from "@/lib/billing-config";
import { stripe } from "@/lib/stripe";
import { getSubscriptionPeriodEndDate } from "@/lib/stripe-subscriptions";
import { getOrgMemberCount, getTeamBilling, updateTeamSeatCount } from "@/lib/team-billing";
import { type ProtectedContext, protectedProcedure, router } from "../trpc";

import type Stripe from "stripe";

const teamPlanIdSchema = z.enum(["pro_team_monthly", "pro_team_yearly"]);

type BillingRecord = typeof billing.$inferSelect;

const ACTIVE_SUB_STATUSES = new Set(["trialing", "active", "past_due", "incomplete", "unpaid"]);

const billingEnabledProcedure = protectedProcedure.use(({ next }) => {
  if (isBillingDisabled) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Billing is disabled.",
    });
  }
  return next();
});

function deriveModeFromPrice(price: Stripe.Price | null | undefined): "subscription" | "payment" {
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

async function verifyOrgOwner(ctx: ProtectedContext, organizationId: string) {
  const [memberRecord] = await ctx.db
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.organizationId, organizationId), eq(member.userId, ctx.userId)))
    .limit(1);

  if (!memberRecord || memberRecord.role !== "owner") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only organization owners can manage team billing.",
    });
  }
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
  organizationId,
}: {
  email: string;
  name?: string | null;
  userId: string;
  organizationId: string;
}) {
  let customer: Stripe.Customer | undefined;

  try {
    const search = await stripe.customers.search({
      query: `metadata['organizationId']:'${organizationId}'`,
      limit: 1,
    });
    customer = search.data[0];
  } catch (error) {
    console.warn("Stripe customer search failed, falling back to create", error);
  }

  if (customer) {
    return customer;
  }

  return stripe.customers.create({
    email,
    name: name ? `${name} (Team)` : undefined,
    metadata: { userId, organizationId },
  });
}

async function ensureTeamBillingRecord(
  ctx: ProtectedContext,
  userId: string,
  organizationId: string,
) {
  const [existing] = await ctx.db
    .select()
    .from(billing)
    .where(and(eq(billing.userId, userId), eq(billing.organizationId, organizationId)))
    .limit(1);

  if (existing) {
    return existing;
  }

  const profile = await fetchUserProfile(ctx, userId);
  const customer = await findOrCreateStripeCustomer({
    email: profile.email,
    name: profile.name,
    userId,
    organizationId,
  });

  const [created] = await ctx.db
    .insert(billing)
    .values({
      userId,
      organizationId,
      stripeCustomerId: customer.id,
      status: "inactive",
    })
    .onConflictDoUpdate({
      target: [billing.userId, billing.organizationId],
      targetWhere: sql`organization_id IS NOT NULL`,
      set: {
        stripeCustomerId: customer.id,
        updatedAt: new Date(),
      },
    })
    .returning();

  return created;
}

async function syncTeamSubscription(
  ctx: ProtectedContext,
  userId: string,
  organizationId: string,
) {
  const billingRecord = await ensureTeamBillingRecord(ctx, userId, organizationId);

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
      billingPlans.find((p) => p.lookupKey === price?.lookup_key);
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
      organizationId,
      stripeCustomerId: billingRecord.stripeCustomerId,
      ...updates,
    })
    .onConflictDoUpdate({
      target: [billing.userId, billing.organizationId],
      targetWhere: sql`organization_id IS NOT NULL`,
      set: {
        stripeCustomerId: billingRecord.stripeCustomerId,
        ...updates,
        updatedAt: new Date(),
      },
    })
    .returning();

  return updated;
}

export const organizationRouter = router({
  teamPlans: billingEnabledProcedure.query(async () => {
    const teamPlans = billingPlans.filter((p) => isTeamPlan(p.id));
    const plans = await Promise.all(
      teamPlans.map(async (plan) => {
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
          isTeamPlan: true,
        };
      }),
    );
    return { plans };
  }),

  teamBillingStatus: billingEnabledProcedure
    .input(z.object({ organizationId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      await verifyOrgOwner(ctx, input.organizationId);
      const subscription = await syncTeamSubscription(
        ctx,
        ctx.userId,
        input.organizationId,
      );
      const memberCount = await getOrgMemberCount(input.organizationId);
      return {
        planId: subscription.planId ?? null,
        status: subscription.status ?? null,
        mode: subscription.mode ?? null,
        cancelAt: subscription.cancelAt,
        priceId: subscription.priceId ?? null,
        currentPeriodEnd: subscription.currentPeriodEnd ?? null,
        stripeCustomerId: subscription.stripeCustomerId,
        memberCount,
      };
    }),

  createTeamCheckoutSession: billingEnabledProcedure
    .input(
      z.object({
        planId: teamPlanIdSchema,
        organizationId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyOrgOwner(ctx, input.organizationId);

      const plan = findPlanById(input.planId);
      if (!plan) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Unknown plan." });
      }

      await syncTeamSubscription(ctx, ctx.userId, input.organizationId);
      const billingRecord = await ensureTeamBillingRecord(
        ctx,
        ctx.userId,
        input.organizationId,
      );

      const price = await getPriceForPlan(plan);

      // Check for existing active subscription
      const existingSubs = await stripe.subscriptions.list({
        customer: billingRecord.stripeCustomerId,
        status: "all",
        limit: 10,
      });

      const activeSub = existingSubs.data.find(
        (sub) => ACTIVE_SUB_STATUSES.has(sub.status) || sub.cancel_at_period_end === true,
      );

      if (activeSub) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "This team already has an active subscription. Use Change plan or cancel first.",
        });
      }

      const memberCount = await getOrgMemberCount(input.organizationId);

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: billingRecord.stripeCustomerId,
        client_reference_id: ctx.userId,
        line_items: [
          {
            price: price.id,
            quantity: memberCount,
          },
        ],
        metadata: {
          userId: ctx.userId,
          planId: plan.id,
          organizationId: input.organizationId,
        },
        subscription_data: {
          metadata: {
            userId: ctx.userId,
            planId: plan.id,
            organizationId: input.organizationId,
          },
        },
        allow_promotion_codes: true,
        success_url: `${env.NEXT_PUBLIC_BETTER_AUTH_URL}/settings/team?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${env.NEXT_PUBLIC_BETTER_AUTH_URL}/settings/team`,
      });

      await ctx.db
        .insert(billing)
        .values({
          userId: ctx.userId,
          organizationId: input.organizationId,
          stripeCustomerId: billingRecord.stripeCustomerId,
          planId: plan.id,
          priceId: price.id,
          status: "pending",
          mode: "subscription",
          checkoutSessionId: session.id,
        })
        .onConflictDoUpdate({
          target: [billing.userId, billing.organizationId],
          targetWhere: sql`organization_id IS NOT NULL`,
          set: {
            planId: plan.id,
            priceId: price.id,
            status: "pending",
            mode: "subscription",
            checkoutSessionId: session.id,
            updatedAt: new Date(),
          },
        });

      return { url: session.url };
    }),

  createTeamPortalSession: billingEnabledProcedure
    .input(z.object({ organizationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await verifyOrgOwner(ctx, input.organizationId);
      const subscription = await syncTeamSubscription(
        ctx,
        ctx.userId,
        input.organizationId,
      );

      const portal = await stripe.billingPortal.sessions.create({
        customer: subscription.stripeCustomerId,
        return_url: `${env.NEXT_PUBLIC_BETTER_AUTH_URL}/settings/team`,
      });

      return { url: portal.url };
    }),

  changeTeamPlan: billingEnabledProcedure
    .input(
      z.object({
        organizationId: z.string().min(1),
        planId: teamPlanIdSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await verifyOrgOwner(ctx, input.organizationId);

      const plan = findPlanById(input.planId);
      if (!plan) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Target plan must be a team subscription plan.",
        });
      }

      const price = await getPriceForPlan(plan);

      const subscriptionState = await syncTeamSubscription(
        ctx,
        ctx.userId,
        input.organizationId,
      );
      if (!subscriptionState.stripeSubscriptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active team subscription found.",
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
        metadata: {
          userId: ctx.userId,
          planId: plan.id,
          organizationId: input.organizationId,
        },
        proration_behavior: "always_invoice",
      });

      const updates: Partial<BillingRecord> = {
        planId: plan.id,
        priceId: price.id,
        mode: "subscription",
        status: updated.cancel_at_period_end ? "canceled" : updated.status,
        currentPeriodEnd: getSubscriptionPeriodEndDate(updated),
        stripeSubscriptionId: updated.id,
      };

      const [saved] = await ctx.db
        .insert(billing)
        .values({
          userId: ctx.userId,
          organizationId: input.organizationId,
          stripeCustomerId: subscription.customer as string,
          ...updates,
        })
        .onConflictDoUpdate({
          target: [billing.userId, billing.organizationId],
          targetWhere: sql`organization_id IS NOT NULL`,
          set: {
            ...updates,
            updatedAt: new Date(),
          },
        })
        .returning();

      return {
        planId: saved.planId ?? null,
        status: saved.status ?? null,
        currentPeriodEnd: saved.currentPeriodEnd ?? null,
      };
    }),

  cancelTeamSubscription: billingEnabledProcedure
    .input(z.object({ organizationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await verifyOrgOwner(ctx, input.organizationId);

      const subscriptionState = await syncTeamSubscription(
        ctx,
        ctx.userId,
        input.organizationId,
      );
      if (!subscriptionState.stripeSubscriptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active team subscription to cancel.",
        });
      }

      const canceled = await stripe.subscriptions.update(
        subscriptionState.stripeSubscriptionId,
        { cancel_at_period_end: true },
      );

      const updates: Partial<BillingRecord> = {
        status: canceled.cancel_at_period_end ? "canceled" : canceled.status,
        currentPeriodEnd:
          getSubscriptionPeriodEndDate(canceled) ?? subscriptionState.currentPeriodEnd,
      };

      const [saved] = await ctx.db
        .insert(billing)
        .values({
          userId: ctx.userId,
          organizationId: input.organizationId,
          stripeCustomerId: subscriptionState.stripeCustomerId,
          stripeSubscriptionId: subscriptionState.stripeSubscriptionId,
          ...updates,
        })
        .onConflictDoUpdate({
          target: [billing.userId, billing.organizationId],
          targetWhere: sql`organization_id IS NOT NULL`,
          set: {
            ...updates,
            updatedAt: new Date(),
          },
        })
        .returning();

      return {
        planId: saved.planId ?? null,
        status: saved.status ?? null,
        currentPeriodEnd: saved.currentPeriodEnd ?? null,
      };
    }),

  resumeTeamSubscription: billingEnabledProcedure
    .input(z.object({ organizationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await verifyOrgOwner(ctx, input.organizationId);

      const subscriptionState = await syncTeamSubscription(
        ctx,
        ctx.userId,
        input.organizationId,
      );
      if (!subscriptionState.stripeSubscriptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No team subscription to resume.",
        });
      }

      const resumed = await stripe.subscriptions.update(
        subscriptionState.stripeSubscriptionId,
        { cancel_at_period_end: false },
      );

      const price = resumed.items.data.at(0)?.price ?? null;
      const plan =
        billingPlans.find((p) => p.lookupKey === price?.lookup_key) ??
        findPlanById(resumed.metadata?.planId ?? "") ??
        (subscriptionState.planId ? findPlanById(subscriptionState.planId) : null);

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
          organizationId: input.organizationId,
          stripeCustomerId: subscriptionState.stripeCustomerId,
          ...updates,
        })
        .onConflictDoUpdate({
          target: [billing.userId, billing.organizationId],
          targetWhere: sql`organization_id IS NOT NULL`,
          set: {
            ...updates,
            updatedAt: new Date(),
          },
        })
        .returning();

      return {
        planId: saved.planId ?? null,
        status: saved.status ?? null,
        currentPeriodEnd: saved.currentPeriodEnd ?? null,
      };
    }),

  syncSeatCount: billingEnabledProcedure
    .input(z.object({ organizationId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await verifyOrgOwner(ctx, input.organizationId);
      await updateTeamSeatCount(input.organizationId);
      return { success: true };
    }),
});
