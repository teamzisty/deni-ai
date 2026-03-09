import "server-only";

import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { billing, member } from "@/db/schema";
import { stripe } from "@/lib/stripe";

const ACTIVE_SUB_STATUSES = new Set(["trialing", "active", "past_due"]);

export async function getTeamBilling(organizationId: string) {
  const [record] = await db
    .select()
    .from(billing)
    .where(and(eq(billing.organizationId, organizationId), isNotNull(billing.organizationId)))
    .limit(1);
  return record ?? null;
}

export async function getOrgMemberCount(organizationId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(member)
    .where(eq(member.organizationId, organizationId));
  return result?.count ?? 1;
}

export async function updateTeamSeatCount(organizationId: string) {
  const teamBilling = await getTeamBilling(organizationId);
  if (!teamBilling?.stripeSubscriptionId) return;

  const memberCount = await getOrgMemberCount(organizationId);

  try {
    const subscription = await stripe.subscriptions.retrieve(teamBilling.stripeSubscriptionId, {
      expand: ["items"],
    });
    const item = subscription.items.data[0];
    if (!item) return;

    if (item.quantity === memberCount) return;

    await stripe.subscriptions.update(subscription.id, {
      items: [{ id: item.id, quantity: memberCount }],
      proration_behavior: "always_invoice",
    });
  } catch (error) {
    console.error("[team-billing] Failed to update seat count:", error);
  }
}

/**
 * Cancel a user's personal Stripe subscription (if active) immediately with proration.
 * Called when the user joins an org with an active team plan so they don't get double-billed.
 */
export async function cancelPersonalSubscription(userId: string) {
  const [record] = await db
    .select()
    .from(billing)
    .where(and(eq(billing.userId, userId), isNull(billing.organizationId)))
    .limit(1);

  if (!record?.stripeSubscriptionId) return;

  try {
    const subscription = await stripe.subscriptions.retrieve(record.stripeSubscriptionId);

    if (!ACTIVE_SUB_STATUSES.has(subscription.status)) return;

    await stripe.subscriptions.cancel(record.stripeSubscriptionId, {
      prorate: true,
    });

    await db
      .update(billing)
      .set({
        status: "canceled",
        currentPeriodEnd: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(billing.userId, userId), isNull(billing.organizationId)));

    console.log("[team-billing] Canceled personal subscription for user joining team", { userId });
  } catch (error) {
    console.error("[team-billing] Failed to cancel personal subscription:", error);
  }
}

/**
 * Cancel personal subscriptions for all members of an organization.
 * Called when a team plan is first activated so no member pays for both.
 */
export async function cancelOrgMembersPersonalSubscriptions(organizationId: string) {
  const members = await db
    .select({ userId: member.userId })
    .from(member)
    .where(eq(member.organizationId, organizationId));

  await Promise.allSettled(members.map((m) => cancelPersonalSubscription(m.userId)));
}
