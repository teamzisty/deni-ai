import { groq } from "@ai-sdk/groq";
import { generateText, tool } from "ai";
import { load } from "cheerio";
import { z } from "zod";
import { env } from "@/env";
import type { SearchResult } from "./types";

export function createSearchTool() {
  return tool({
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

        // Fetch and summarize each page
        const summarizer = groq("openai/gpt-oss-20b");
        const summarizedResults = await Promise.all(
          results.map(async (result) => {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 10000);
              const pageResponse = await fetch(result.url, {
                headers: {
                  "User-Agent": "Mozilla/5.0 (compatible; DeniAI/1.0)",
                },
                signal: controller.signal,
              });

              clearTimeout(timeoutId);

              if (!pageResponse.ok) {
                return { ...result, summary: result.description };
              }

              const html = await pageResponse.text();
              const $ = load(html);

              // Extract text content
              $("script, style, nav, footer, header").remove();
              const textContent = $("body").text().replace(/\s+/g, " ").trim().slice(0, 8000); // Limit to 8000 chars

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
  });
}
