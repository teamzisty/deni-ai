import { generateText, tool } from "ai";
import { BraveSearchSDK } from "./brave-search";
import { z } from "zod";
import { PageParser } from "./page-parser";
import { openai } from "@ai-sdk/openai";
import { internalModels } from "./constants";
import { google } from "@ai-sdk/google";

export const canvas = tool({
  description: "Create documents using Canvas.",
  parameters: z.object({
    title: z.string().describe("The title of the document"),
    content: z.string().describe("The content of the document"),
  }),
  execute: async ({ title, content }) => {
    if (!title || !content) {
      return "Title and content are required to create a document.";
    }

    return "Created document successfully with title: " + title;
  },
});

export const search = tool({
  description:
    "Search the web using Brave Search. Use this for finding current information, research, and web content.",
  parameters: z.object({
    query: z.string().describe("The search query to execute"),
    language: z
      .string()
      .nullable()
      .describe(
        "The language to use for the search (ex. 'en', 'fr', 'es', 'all')",
      ),
    country: z
      .string()
      .nullable()
      .describe(
        "The country to use for the search (ex. 'us', 'uk', 'fr', 'all')",
      ),
    depth: z
      .enum(["disabled", "shallow", "deep", "deeper"])
      .nullable()
      .describe(
        "Research depth: disabled (do not deep research) shallow (3 results), deep (5 results), deeper (8 results)",
      ),
  }),
  execute: async ({ query, language, country, depth }) => {
    if (!query) {
      return [];
    }

    // Determine result count based on depth
    const resultCount =
      depth === "shallow"
        ? 3
        : depth === "deep"
          ? 5
          : depth === "deeper"
            ? 8
            : 5;

    const braveSearch = new BraveSearchSDK();
    const searchResult = await braveSearch.getWebResults(query, {
      country: country || "us",
      language: language || "en",
      count: resultCount,
    });
    let result: {
      title: string;
      url: string;
      content: { long: string; short: string };
    }[] = [];

    if (!searchResult || !searchResult.length) {
      return [];
    }

    const promises = searchResult.map(async (item) => {
      try {
        const startTime = Date.now();
        const pageParser = new PageParser();
        const content = await pageParser.parseUrl(item.url);

        const longSummary = await generateText({
          prompt: content.content,
          model: google(
            internalModels["search-summary-model"]?.id ||
              "gemini-2.5-flash-lite-preview-06-17",
          ),
          system:
            "You are a helpful assistant that summarizes web pages. respond as markdown, no concise.",
        });

        const endTime = Date.now();
        const scrapeTime = endTime - startTime;

        return {
          title: item.title,
          description: item.description,
          time: scrapeTime,
          url: item.url,
          content: {
            long: longSummary.text,
            short: item.description,
          },
        };
      } catch (error) {
        console.error("Error processing search result:", error);
        return {
          title: item.title,
          url: item.url,
          content: {
            long: "Error processing content",
            short: "Error processing content",
          },
        };
      }
    });

    result = await Promise.all(promises);

    return result;
  },
});
