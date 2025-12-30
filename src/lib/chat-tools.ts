import { groq } from "@ai-sdk/groq";
import { generateText, tool } from "ai";
import { load } from "cheerio";
import { z } from "zod";
import { env } from "@/env";
import {
  veoAspectRatios,
  veoDurations,
  veoModelValues,
  veoResolutions,
} from "@/lib/veo";

const VEO_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";
const VEO_POLL_INTERVAL_MS = 5000;
const VEO_MAX_POLL_ATTEMPTS = 90;

type SearchResult = {
  title: string;
  url: string;
  description: string;
};

const veoToolInputSchema = z.object({
  prompt: z.string().min(1).max(4000).describe("Video prompt"),
  model: z.enum(veoModelValues).optional().describe("Veo model"),
  negativePrompt: z.string().max(2000).optional().describe("Negative prompt"),
  aspectRatio: z.enum(veoAspectRatios).optional().describe("Aspect ratio"),
  resolution: z.enum(veoResolutions).optional().describe("Resolution"),
  durationSeconds: z
    .number()
    .int()
    .refine((value) => veoDurations.some((duration) => duration === value), {
      message: "Invalid duration",
    })
    .optional()
    .describe("Duration in seconds"),
  seed: z
    .number()
    .int()
    .min(0)
    .max(2_147_483_647)
    .optional()
    .describe("Optional seed"),
});

function extractVeoErrorMessage(
  responseData: unknown,
  fallback: string,
): string {
  if (typeof responseData === "object" && responseData !== null) {
    const message = (responseData as { error?: { message?: string } }).error
      ?.message;
    return message || fallback;
  }
  return fallback;
}

async function pollVeoOperation(operationName: string) {
  for (let attempt = 0; attempt < VEO_MAX_POLL_ATTEMPTS; attempt += 1) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationName}`,
      {
        headers: {
          "x-goog-api-key": env.GOOGLE_GENERATIVE_AI_API_KEY,
        },
      },
    );

    let responseData: unknown = null;
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }

    if (!response.ok) {
      throw new Error(
        extractVeoErrorMessage(responseData, "Failed to check video status."),
      );
    }

    const done =
      typeof responseData === "object" && responseData !== null
        ? Boolean((responseData as { done?: boolean }).done)
        : false;
    const errorMessage =
      typeof responseData === "object" && responseData !== null
        ? (responseData as { error?: { message?: string } }).error?.message
        : null;
    const videoUri =
      typeof responseData === "object" && responseData !== null
        ? ((
            responseData as {
              response?: {
                generateVideoResponse?: {
                  generatedSamples?: Array<{ video?: { uri?: string } }>;
                };
              };
            }
          ).response?.generateVideoResponse?.generatedSamples?.[0]?.video
            ?.uri ?? null)
        : null;

    if (done) {
      if (errorMessage) {
        throw new Error(errorMessage);
      }

      if (!videoUri) {
        throw new Error("Video generation finished without a file.");
      }

      return videoUri;
    }

    await new Promise((resolve) => setTimeout(resolve, VEO_POLL_INTERVAL_MS));
  }

  throw new Error("Timed out waiting for the video.");
}

type CreateChatToolsOptions = {
  videoMode: boolean;
};

export function createChatTools({ videoMode }: CreateChatToolsOptions) {
  const tools = {
    search: tool({
      description: "Surf web and get page summary",
      inputSchema: z.object({
        query: z.string().min(1).describe("Search query"),
        amount: z
          .number()
          .int()
          .min(5)
          .max(15)
          .optional()
          .describe("Number of search pages (min 5, max 15)"),
      }),
      execute: async ({ query, amount }) => {
        const maxResults = Math.min(Math.max(amount ?? 10, 5), 15);
        try {
          const BRAVE_API_KEY = env.BRAVE_SEARCH_API_KEY;
          if (!BRAVE_API_KEY) {
            throw new Error("Brave Search API key not configured");
          }

          const params = new URLSearchParams({
            q: query,
            count: maxResults.toString(),
          });

          const response = await fetch(
            `https://api.search.brave.com/res/v1/web/search?${params.toString()}`,
            {
              headers: {
                Accept: "application/json",
                "Accept-Encoding": "gzip",
                "X-Subscription-Token": BRAVE_API_KEY,
              },
            },
          );

          if (!response.ok) {
            throw new Error(`Brave Search API error: ${response.status}`);
          }

          const data = await response.json();
          const results: SearchResult[] = (data.web?.results ?? []).map(
            (item: { title: string; url: string; description: string }) => ({
              title: item.title,
              url: item.url,
              description: item.description,
            }),
          );

          console.log("Brave search results:", results);

          // Fetch and summarize each page
          const summarizer = groq("openai/gpt-oss-20b");
          const summarizedResults = await Promise.all(
            results.map(async (result) => {
              try {
                const pageResponse = await fetch(result.url, {
                  headers: {
                    "User-Agent": "Mozilla/5.0 (compatible; DeniAI/1.0)",
                  },
                });

                if (!pageResponse.ok) {
                  return { ...result, summary: result.description };
                }

                const html = await pageResponse.text();
                const $ = load(html);

                // Extract text content
                $("script, style, nav, footer, header").remove();
                const textContent = $("body")
                  .text()
                  .replace(/\s+/g, " ")
                  .trim()
                  .slice(0, 8000); // Limit to 8000 chars

                if (!textContent) {
                  return { ...result, summary: result.description };
                }

                // Generate summary with AI
                const { text: summary } = await generateText({
                  model: summarizer,
                  prompt: `Summarize the following webpage content detailed:\n\n${textContent}`,
                  maxOutputTokens: 2000,
                });

                return { ...result, summary: summary.trim() };
              } catch (error) {
                console.error(`Failed to summarize ${result.url}:`, error);
                return { ...result, summary: result.description };
              }
            }),
          );

          return summarizedResults;
        } catch (error) {
          console.error("Search tool error:", error);
          throw new Error("Web search failed. Please try again later.");
        }
      },
    }),
    ...(videoMode
      ? {
          video: tool({
            description:
              "Generate a short video with Veo. Provide a vivid visual prompt and optional settings.",
            inputSchema: veoToolInputSchema,
            execute: async ({
              prompt,
              model: requestedModel,
              negativePrompt,
              aspectRatio,
              resolution,
              durationSeconds,
              seed,
            }) => {
              const model = requestedModel ?? veoModelValues[0];
              const finalAspectRatio = aspectRatio ?? "16:9";
              const finalResolution = resolution ?? "720p";
              const finalDuration =
                finalResolution === "1080p" ? 8 : (durationSeconds ?? 6);
              const trimmedNegative = negativePrompt?.trim() || undefined;

              const instances: Record<string, unknown>[] = [
                {
                  prompt,
                },
              ];

              const parameters: Record<string, unknown> = {
                aspectRatio: finalAspectRatio,
                resolution: finalResolution,
                durationSeconds: finalDuration,
              };

              if (trimmedNegative) {
                parameters.negativePrompt = trimmedNegative;
              }
              if (seed !== undefined) {
                parameters.seed = seed;
              }

              const response = await fetch(
                `${VEO_BASE_URL}/models/${model}:predictLongRunning`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": env.GOOGLE_GENERATIVE_AI_API_KEY,
                  },
                  body: JSON.stringify({ instances, parameters }),
                },
              );

              let responseData: unknown = null;
              try {
                responseData = await response.json();
              } catch {
                responseData = null;
              }

              if (!response.ok) {
                throw new Error(
                  extractVeoErrorMessage(
                    responseData,
                    "Failed to start video generation.",
                  ),
                );
              }

              const operationName =
                typeof responseData === "object" && responseData !== null
                  ? (responseData as { name?: string }).name
                  : undefined;

              if (!operationName) {
                throw new Error("Missing operation name.");
              }

              const videoUri = await pollVeoOperation(operationName);
              const proxyUrl = `/api/veo/file?uri=${encodeURIComponent(
                videoUri,
              )}`;
              const modelLabel = model;

              return {
                videoUrl: proxyUrl,
                operationName,
                model,
                modelLabel,
                aspectRatio: finalAspectRatio,
                resolution: finalResolution,
                durationSeconds: finalDuration,
                seed: seed ?? null,
                negativePrompt: trimmedNegative ?? null,
              };
            },
          }),
        }
      : {}),
  };

  return tools;
}
