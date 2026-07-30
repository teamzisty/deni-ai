import { groq } from "@ai-sdk/groq";
import { generateText, tool } from "ai";
import { z } from "zod";
import { env } from "@/env";
import { fetchPageText } from "./fetch-page";
import type { SearchResult } from "./types";

export function createSearchTool() {
  return tool({
    description:
      "Search the web and get short page summaries. Prefer the browse tool when you need the full content of a specific URL.",
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
    execute: async ({ query, amount }, { abortSignal }) => {
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
            signal: abortSignal,
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

        // Fetch and summarize each page
        const summarizer = groq("openai/gpt-oss-20b");
        const summarizedResults = await Promise.all(
          results.map(async (result) => {
            try {
              const page = await fetchPageText(result.url, {
                maxChars: 8000,
                signal: abortSignal,
              });

              if (!page.content) {
                return { ...result, summary: result.description };
              }

              const { text: summary } = await generateText({
                model: summarizer,
                prompt: `Summarize the following webpage content detailed:\n\n${page.content}`,
                maxOutputTokens: 2000,
                abortSignal,
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
  });
}
