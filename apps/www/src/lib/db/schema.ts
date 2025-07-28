import { pgTable, uuid, text, jsonb, timestamp, integer, date, boolean, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
export * from "./auth-schema";

// Define enums
export const subscriptionPlanEnum = pgEnum('subscription_plan', [
  'free',
  'pro',
  'max',
  'team',
  'enterprise'
]);

// Bots table
export const bots = pgTable('bots', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  systemInstruction: text('system_instruction'),
  instructions: jsonb('instructions'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

// Chat sessions table (main conversations)
export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title'),
  messages: jsonb('messages').default(sql`'[]'`),
  bot: jsonb('bot'),
  parentSessionId: text('parentSessionId'),
  branchName: text('branchName'),
  hubId: text('hub_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

// Hubs table
export const hubs = pgTable('hubs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  files: jsonb('files').default(sql`'[]'`),
  conversations: jsonb('conversations').default(sql`'[]'`),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

// Uses table (usage tracking)
export const uses = pgTable('uses', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  model: text('model').notNull(),
  count: integer('count').default(1),
  date: date('date').default(sql`CURRENT_DATE`),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

// Users table (custom user profiles)
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  plan: subscriptionPlanEnum('plan').default('free'),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

// User settings table
export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  settings: jsonb('settings').notNull().default(sql`'{}'`),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true }).default(sql`now()`),
});

// Shared conversations table
export const sharedConversations = pgTable('shared_conversations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  sessionId: uuid('session_id').notNull(),
  sessionType: text('session_type').notNull(), // 'chat' | 'intellipulse'
  title: text('title').notNull(),
  messages: jsonb('messages').default(sql`'[]'`),
  viewCount: integer('view_count').default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

// Chat streams table
export const chatStreams = pgTable('chat_streams', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  chatId: text('chat_id').notNull(),
  streamId: text('stream_id').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).default(sql`now()`),
});

// Export table types for use in the application
export type Bot = typeof bots.$inferSelect;
export type NewBot = typeof bots.$inferInsert;

export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;

export type Hub = typeof hubs.$inferSelect;
export type NewHub = typeof hubs.$inferInsert;

export type Use = typeof uses.$inferSelect;
export type NewUse = typeof uses.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;

export type SharedConversation = typeof sharedConversations.$inferSelect;
export type NewSharedConversation = typeof sharedConversations.$inferInsert;

export type ChatStream = typeof chatStreams.$inferSelect;
export type NewChatStream = typeof chatStreams.$inferInsert;