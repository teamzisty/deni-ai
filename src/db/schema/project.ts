import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const projectSourceKindEnum = pgEnum("project_source_kind", ["website", "docs", "repo"]);
export const projectArtifactKindEnum = pgEnum("project_artifact_kind", [
  "note",
  "brief",
  "checklist",
  "reference",
]);

export const projects = pgTable(
  "projects",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    instructions: text("instructions").notNull().default(""),
    color: text("color").notNull().default("amber"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("projects_user_id_idx").on(table.userId)],
);

export const projectSources = pgTable(
  "project_sources",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    url: text("url").notNull(),
    kind: projectSourceKindEnum("kind").notNull().default("website"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("project_sources_project_id_idx").on(table.projectId),
    index("project_sources_user_id_idx").on(table.userId),
  ],
);

export const projectArtifacts = pgTable(
  "project_artifacts",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary"),
    kind: projectArtifactKindEnum("kind").notNull().default("note"),
    content: jsonb("content")
      .notNull()
      .default(sql`'{}'::jsonb`),
    positionX: integer("position_x").notNull().default(0),
    positionY: integer("position_y").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("project_artifacts_project_id_idx").on(table.projectId),
    index("project_artifacts_user_id_idx").on(table.userId),
  ],
);
