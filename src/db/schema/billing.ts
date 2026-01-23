import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export const billing = pgTable(
  "billing",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    stripeCustomerId: text("stripe_customer_id").notNull(),
    stripeSubscriptionId: text("stripe_subscription_id"),
    planId: text("plan_id"),
    priceId: text("price_id"),
    status: text("status").default("inactive"),
    cancelAt: integer("cancel_at"),
    mode: text("mode").default("subscription"),
    currentPeriodEnd: timestamp("current_period_end"),
    checkoutSessionId: text("checkout_session_id"),
    // Max Mode (Usage-based billing for Pro plan)
    maxModeEnabled: boolean("max_mode_enabled").default(false).notNull(),
    maxModeUsageBasic: integer("max_mode_usage_basic").default(0).notNull(),
    maxModeUsagePremium: integer("max_mode_usage_premium").default(0).notNull(),
    maxModePeriodStart: timestamp("max_mode_period_start"),
    stripeMeteredSubscriptionItemId: text("stripe_metered_subscription_item_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    userIdx: uniqueIndex("billing_user_idx").on(table.userId),
    customerIdx: uniqueIndex("billing_customer_idx").on(table.stripeCustomerId),
    subscriptionIdx: uniqueIndex("billing_subscription_idx").on(table.stripeSubscriptionId),
  }),
);
