import { sql } from "drizzle-orm";
import { boolean, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export type CustomProviderId = "openai_compatible";

export const customModel = pgTable(
  "custom_model",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    name: text("name").notNull(),
    modelId: text("model_id").notNull(),
    description: text("description"),
    premium: boolean("premium").default(false).notNull(),
    inputPriceMicros: integer("input_price_micros"),
    outputPriceMicros: integer("output_price_micros"),
    reasoningPriceMicros: integer("reasoning_price_micros"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    userModelUnique: uniqueIndex("custom_model_user_model_unique").on(
      table.userId,
      table.provider,
      table.modelId,
    ),
  }),
);
