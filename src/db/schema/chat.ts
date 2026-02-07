import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/db/schema";

export const chats = pgTable(
  "chats",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    uid: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    title: text("title"),
    messages: jsonb("messages").default(sql`'[]'`),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("chats_user_id_idx").on(table.uid),
  }),
);
