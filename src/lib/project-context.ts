import "server-only";

import { and, eq } from "drizzle-orm";
import { load } from "cheerio";
import { db } from "@/db/drizzle";
import { projectArtifacts, projects, projectSources } from "@/db/schema";
import { assertSafePublicHttpUrl } from "@/lib/network-security";

async function fetchSourceExcerpt(url: string) {
  try {
    await assertSafePublicHttpUrl(url);
  } catch {
    return null;
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Deni AI Project Integrations",
      },
      cache: "no-store",
      redirect: "error",
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const $ = load(html);
    $("script, style, noscript").remove();

    const title = $("title").first().text().trim() || null;
    const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, 1600);

    if (!text) {
      return null;
    }

    return {
      title,
      excerpt: text,
    };
  } catch {
    return null;
  }
}

export async function buildProjectPrompt(projectId: string | null | undefined, userId: string) {
  if (!projectId) {
    return null;
  }

  const [project, sources, artifacts] = await Promise.all([
    db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
      .limit(1)
      .then((rows) => rows[0] ?? null),
    db
      .select()
      .from(projectSources)
      .where(and(eq(projectSources.projectId, projectId), eq(projectSources.userId, userId))),
    db
      .select()
      .from(projectArtifacts)
      .where(and(eq(projectArtifacts.projectId, projectId), eq(projectArtifacts.userId, userId))),
  ]);

  if (!project) {
    return null;
  }

  const fetchedSources = await Promise.all(
    sources.slice(0, 3).map(async (source) => {
      const fetched = await fetchSourceExcerpt(source.url);
      return {
        ...source,
        fetched,
      };
    }),
  );

  const artifactSummary =
    artifacts.length > 0
      ? artifacts
          .slice(0, 12)
          .map((artifact, index) => {
            const content =
              typeof artifact.content === "object" && artifact.content && "body" in artifact.content
                ? String(artifact.content.body)
                : "";
            const preview = content.replace(/\s+/g, " ").trim().slice(0, 240);
            return `${index + 1}. [${artifact.kind}] ${artifact.title}${artifact.summary ? ` - ${artifact.summary}` : ""}${preview ? `\n${preview}` : ""}`;
          })
          .join("\n")
      : "No saved artifacts.";

  const sourceSummary =
    fetchedSources.length > 0
      ? fetchedSources
          .map((source, index) => {
            const details = source.fetched?.excerpt ? `\n${source.fetched.excerpt}` : "";
            return `${index + 1}. ${source.label} (${source.kind})\n${source.url}${details}`;
          })
          .join("\n\n")
      : "No connected sources.";

  return [
    `Project: ${project.name}`,
    project.description ? `Description: ${project.description}` : null,
    project.instructions ? `Project instructions: ${project.instructions}` : null,
    "Connected sources:",
    sourceSummary,
    "Saved artifacts:",
    artifactSummary,
    "Treat this project context as persistent working memory for the conversation. Use it when relevant and keep outputs aligned with the project.",
  ]
    .filter(Boolean)
    .join("\n");
}
