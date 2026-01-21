import { sql } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export type BuiltinProviderId = "openai" | "anthropic" | "google" | "xai";
export type OpenAICompatibleApiStyle = "chat" | "responses";

export const providerSetting = pgTable(
  "provider_setting",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    preferByok: boolean("prefer_byok").default(false).notNull(),
    baseUrl: text("base_url"),
    apiStyle: text("api_style").default("responses").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    userProviderIdx: uniqueIndex("provider_setting_user_provider_idx").on(
      table.userId,
      table.provider,
    ),
  }),
);
