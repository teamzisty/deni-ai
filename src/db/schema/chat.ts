import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "@/db/schema";
import { projects } from "./project";

export const chats = pgTable(
  "chats",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    uid: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => projects.id, { onDelete: "set null" }),
    title: text("title"),
    messages: jsonb("messages").default(sql`'[]'`),
    pinned: boolean("pinned").default(false).notNull(),
    folder: text("folder"),
    tags: jsonb("tags")
      .default(sql`'[]'`)
      .notNull(),
    created_at: timestamp("created_at").defaultNow().notNull(),
    updated_at: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("chats_user_id_idx").on(table.uid),
    projectIdIdx: index("chats_project_id_idx").on(table.projectId),
  }),
);
