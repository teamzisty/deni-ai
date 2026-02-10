//import "server-only";

import { and, eq, isNotNull, sql } from "drizzle-orm";

import { db } from "@/db/drizzle";
import { billing, member } from "@/db/schema";
import { stripe } from "@/lib/stripe";

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
