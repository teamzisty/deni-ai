import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { projectFiles, projects } from "@/db/schema";

export async function buildProjectPrompt(projectId: string | null | undefined, userId: string) {
  if (!projectId) {
    return null;
  }

  const [project, files] = await Promise.all([
    db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select()
      .from(projectFiles)
      .where(and(eq(projectFiles.projectId, projectId), eq(projectFiles.userId, userId))),
  ]);

  if (!project) {
    return null;
  }

  const filesSummary =
    files.length > 0
      ? files.map((f) => `- ${f.filename} (${f.url})`).join("\n")
      : "No knowledge files.";

  return [
    `Project: ${project.name}`,
    project.description ? `Description: ${project.description}` : null,
    project.instructions ? `Project instructions: ${project.instructions}` : null,
    "Knowledge files:",
    filesSummary,
    "Treat this project context as persistent working memory for the conversation. Use it when relevant.",
  ]
    .filter(Boolean)
    .join("\n");
}
