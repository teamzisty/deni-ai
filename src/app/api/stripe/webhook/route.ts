import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { db } from "@/db/drizzle";
import { billing } from "@/db/schema";
import { env } from "@/env";
import { findPlanByLookupKey } from "@/lib/billing";
import { stripe } from "@/lib/stripe";
import { getSubscriptionPeriodEnd } from "@/lib/stripe-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubscriptionPayload = {
  userId: string;
  customerId: string;
  subscriptionId: string;
  lookupKey: string | null | undefined;
  priceId: string | null | undefined;
  status: string | null;
  currentPeriodEnd: number | null;
};

async function saveSubscription(payload: SubscriptionPayload) {
  const plan = findPlanByLookupKey(payload.lookupKey ?? undefined);

  const updates = {
    stripeCustomerId: payload.customerId,
    stripeSubscriptionId: payload.subscriptionId,
    priceId: payload.priceId ?? null,
    planId: plan?.id ?? null,
    status: payload.status ?? null,
    mode: "subscription" as const,
    currentPeriodEnd: payload.currentPeriodEnd
      ? new Date(payload.currentPeriodEnd * 1000)
      : null,
  };

  await db
    .insert(billing)
    .values({
      userId: payload.userId,
      ...updates,
    })
    .onConflictDoUpdate({
      target: billing.userId,
      set: {
        ...updates,
        updatedAt: new Date(),
      },
    });
}

async function clearPlanData({
  userId,
  customerId,
}: {
  userId: string;
  customerId: string;
}) {
  await db
    .insert(billing)
    .values({
      userId,
      stripeCustomerId: customerId,
      stripeSubscriptionId: null,
      priceId: null,
      planId: null,
      status: "inactive",
      mode: null,
      currentPeriodEnd: null,
      checkoutSessionId: null,
    })
    .onConflictDoUpdate({
      target: billing.userId,
      set: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: null,
        priceId: null,
        planId: null,
        status: "inactive",
        mode: null,
        currentPeriodEnd: null,
        checkoutSessionId: null,
        updatedAt: new Date(),
      },
    });
}

async function resolveUserIdFromCustomer(
  stripeCustomerId: string,
  metadataUserId?: string | null,
) {
  if (metadataUserId) return metadataUserId;

  try {
    const customer = await stripe.customers.retrieve(stripeCustomerId);
    if (customer && !("deleted" in customer) && customer.metadata?.userId) {
      return customer.metadata.userId;
    }
  } catch (error) {
    console.warn("Unable to load customer for userId resolution", error);
  }

  const [record] = await db
    .select({ userId: billing.userId })
    .from(billing)
    .where(eq(billing.stripeCustomerId, stripeCustomerId))
    .limit(1);

  return record?.userId ?? null;
}

export async function POST(req: Request) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET not configured" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const body = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        if (
          typeof subscription !== "object" ||
          subscription === null ||
          subscription.object !== "subscription"
        ) {
          break;
        }

        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;
        if (!customerId) {
          break;
        }

        const userId = await resolveUserIdFromCustomer(
          customerId,
          subscription.metadata?.userId,
        );

        if (!userId) {
          console.warn(
            "[stripe:webhook] missing userId for deleted subscription",
            {
              subscriptionId: subscription.id,
            },
          );
          break;
        }

        await clearPlanData({
          userId,
          customerId,
        });
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        if (
          typeof subscription !== "object" ||
          subscription === null ||
          subscription.object !== "subscription"
        ) {
          break;
        }

        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer?.id;
        if (!customerId) {
          break;
        }

        const price = subscription.items?.data?.[0]?.price ?? null;
        const priceId = price?.id ?? null;
        const lookupKey = price?.lookup_key ?? null;
        const userId = await resolveUserIdFromCustomer(
          customerId,
          subscription.metadata?.userId,
        );
        const isCanceled =
          subscription.status === "canceled" ||
          subscription.cancel_at_period_end === true ||
          Boolean(subscription.cancel_at);
        const computedStatus = isCanceled
          ? "canceled"
          : (subscription.status ?? null);

        if (!userId) {
          console.warn("[stripe:webhook] missing userId for subscription", {
            subscriptionId: subscription.id,
          });
          break;
        }

        await saveSubscription({
          userId,
          customerId,
          subscriptionId: subscription.id,
          lookupKey,
          priceId,
          status: computedStatus,
          currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
        });
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && session.subscription) {
          const subscription =
            typeof session.subscription === "string"
              ? await stripe.subscriptions.retrieve(session.subscription)
              : session.subscription;

          let userId =
            session.metadata?.userId ?? subscription.metadata?.userId;

          if (!userId && typeof session.customer === "string") {
            userId = await resolveUserIdFromCustomer(
              session.customer,
              session.metadata?.userId,
            );
          }

          if (userId) {
            const isCanceled =
              subscription.status === "canceled" ||
              subscription.cancel_at_period_end === true ||
              Boolean(subscription.cancel_at);
            const computedStatus = isCanceled
              ? "canceled"
              : subscription.status;

            const price =
              subscription.items.data.at(0)?.price ??
              session.line_items?.data.at(0)?.price ??
              null;
            await saveSubscription({
              userId,
              customerId: session.customer as string,
              subscriptionId: subscription.id,
              lookupKey: price?.lookup_key ?? null,
              priceId: price?.id ?? null,
              status: computedStatus,
              currentPeriodEnd: getSubscriptionPeriodEnd(subscription),
            });
          }
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Error handling Stripe webhook", error);
    return NextResponse.json({ received: true }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
