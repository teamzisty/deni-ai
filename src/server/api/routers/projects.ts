import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { nanoid } from "nanoid";
import { and, asc, eq } from "drizzle-orm";
import { z } from "zod";
import { projectArtifacts, projects, projectSources } from "@/db/schema";
import { env } from "@/env";
import { protectedProcedure, router, type ProtectedContext } from "../trpc";

const projectInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240).nullable(),
  instructions: z.string().trim().max(4000),
  color: z.string().trim().min(1).max(32),
});

const sourceInputSchema = z.object({
  projectId: z.string().min(1),
  label: z.string().trim().min(1).max(80),
  url: z.url(),
  kind: z.enum(["website", "docs", "repo"]),
});

const artifactInputSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().max(240).nullable(),
  kind: z.enum(["note", "brief", "checklist", "reference"]),
  content: z.object({
    body: z.string().trim().max(12000).default(""),
  }),
  positionX: z.number().int(),
  positionY: z.number().int(),
});

const artifactSummarySchema = z.object({
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(240),
  body: z.string().trim().min(1).max(12000),
  kind: z.enum(["note", "brief", "checklist", "reference"]),
});

const createArtifactFromTextSchema = z.object({
  projectId: z.string().min(1),
  text: z.string().trim().min(1).max(40000),
  positionX: z.number().int().optional(),
  positionY: z.number().int().optional(),
});

const openrouter = createOpenRouter({
  apiKey: env.OPENROUTER_API_KEY,
  headers: {
    "X-Title": "Deni AI",
    "HTTP-Referer": "https://deniai.app",
  },
});

async function ensureProjectOwnership(ctx: ProtectedContext, projectId: string) {
  const [project] = await ctx.db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, ctx.userId)))
    .limit(1);

  if (!project) {
    throw new Error("Project not found");
  }
}

async function insertArtifact(ctx: ProtectedContext, input: z.infer<typeof artifactInputSchema>) {
  const [artifact] = await ctx.db
    .insert(projectArtifacts)
    .values({
      id: nanoid(),
      projectId: input.projectId,
      userId: ctx.userId,
      title: input.title,
      summary: input.summary ?? null,
      kind: input.kind,
      content: input.content,
      positionX: input.positionX,
      positionY: input.positionY,
    })
    .returning();

  return artifact;
}

export const projectsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(projects)
      .where(eq(projects.userId, ctx.userId))
      .orderBy(asc(projects.name));
  }),

  get: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const [project] = await ctx.db
        .select()
        .from(projects)
        .where(and(eq(projects.id, input.id), eq(projects.userId, ctx.userId)))
        .limit(1);

      if (!project) {
        return null;
      }

      const [sources, artifacts] = await Promise.all([
        ctx.db
          .select()
          .from(projectSources)
          .where(and(eq(projectSources.projectId, input.id), eq(projectSources.userId, ctx.userId)))
          .orderBy(asc(projectSources.createdAt)),
        ctx.db
          .select()
          .from(projectArtifacts)
          .where(
            and(eq(projectArtifacts.projectId, input.id), eq(projectArtifacts.userId, ctx.userId)),
          )
          .orderBy(asc(projectArtifacts.createdAt)),
      ]);

      return { project, sources, artifacts };
    }),

  create: protectedProcedure.input(projectInputSchema).mutation(async ({ ctx, input }) => {
    const [project] = await ctx.db
      .insert(projects)
      .values({
        userId: ctx.userId,
        name: input.name,
        description: input.description ?? null,
        instructions: input.instructions,
        color: input.color,
      })
      .returning();

    return project;
  }),

  update: protectedProcedure
    .input(projectInputSchema.extend({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input;
      const [project] = await ctx.db
        .update(projects)
        .set({
          ...fields,
          description: fields.description ?? null,
          updatedAt: new Date(),
        })
        .where(and(eq(projects.id, id), eq(projects.userId, ctx.userId)))
        .returning();

      return project ?? null;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(projects)
        .where(and(eq(projects.id, input.id), eq(projects.userId, ctx.userId)))
        .returning();

      return deleted ?? null;
    }),

  createSource: protectedProcedure.input(sourceInputSchema).mutation(async ({ ctx, input }) => {
    await ensureProjectOwnership(ctx, input.projectId);

    const [source] = await ctx.db
      .insert(projectSources)
      .values({
        projectId: input.projectId,
        userId: ctx.userId,
        label: input.label,
        url: input.url,
        kind: input.kind,
      })
      .returning();

    return source;
  }),

  deleteSource: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(projectSources)
        .where(and(eq(projectSources.id, input.id), eq(projectSources.userId, ctx.userId)))
        .returning();

      return deleted ?? null;
    }),

  createArtifact: protectedProcedure.input(artifactInputSchema).mutation(async ({ ctx, input }) => {
    await ensureProjectOwnership(ctx, input.projectId);
    return insertArtifact(ctx, input);
  }),

  createArtifactFromText: protectedProcedure
    .input(createArtifactFromTextSchema)
    .mutation(async ({ ctx, input }) => {
      await ensureProjectOwnership(ctx, input.projectId);

      const { object } = await generateObject({
        model: openrouter.chat("google/gemini-3.1-flash-lite-preview", {
          provider: {
            allow_fallbacks: false,
            only: ["google"],
          },
        }),
        schema: artifactSummarySchema,
        system: [
          "You convert an AI assistant response into a concise reusable project artifact.",
          "Return a short title, a one-sentence summary, and a cleaned-up body.",
          "The body must be a compact summary, not the full original response.",
          "Preserve important implementation details, caveats, and concrete next steps.",
          "Use plain markdown when useful.",
          "Choose the most suitable kind. Prefer `brief` unless another kind is clearly better.",
        ].join(" "),
        prompt: input.text,
      });

      return insertArtifact(ctx, {
        projectId: input.projectId,
        title: object.title,
        summary: object.summary,
        kind: object.kind,
        content: {
          body: object.body,
        },
        positionX: input.positionX ?? 120 + (Date.now() % 160),
        positionY: input.positionY ?? 120 + (Date.now() % 120),
      });
    }),

  updateArtifact: protectedProcedure
    .input(artifactInputSchema.extend({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input;
      const [artifact] = await ctx.db
        .update(projectArtifacts)
        .set({
          ...fields,
          summary: fields.summary ?? null,
          updatedAt: new Date(),
        })
        .where(and(eq(projectArtifacts.id, id), eq(projectArtifacts.userId, ctx.userId)))
        .returning();

      return artifact ?? null;
    }),

  deleteArtifact: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(projectArtifacts)
        .where(and(eq(projectArtifacts.id, input.id), eq(projectArtifacts.userId, ctx.userId)))
        .returning();

      return deleted ?? null;
    }),
});

export type ProjectsRouter = typeof projectsRouter;
