import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
import { chats } from "./chat";

export const shareVisibilityEnum = pgEnum("share_visibility", [
  "public",
  "private",
]);

export const chatShares = pgTable(
  "chat_shares",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    chatId: text("chat_id")
      .notNull()
      .references(() => chats.id, { onDelete: "cascade" }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    visibility: shareVisibilityEnum("visibility").default("public").notNull(),
    allowFork: boolean("allow_fork").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("chat_shares_chat_id_idx").on(table.chatId),
    index("chat_shares_owner_id_idx").on(table.ownerId),
  ],
);

export const chatShareRecipients = pgTable(
  "chat_share_recipients",
  {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    shareId: text("share_id")
      .notNull()
      .references(() => chatShares.id, { onDelete: "cascade" }),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("chat_share_recipients_share_id_idx").on(table.shareId),
    index("chat_share_recipients_recipient_id_idx").on(table.recipientId),
  ],
);
