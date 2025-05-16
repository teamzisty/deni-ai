import { DataStreamWriter, LanguageModelV1, tool, Tool } from "ai";
import { ImodelDescriptionType } from "./modelDescriptions";
import { generateText, experimental_generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { JSDOM } from "jsdom";
import { VirtualConsole } from "jsdom";
import { z } from "zod";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { UTApi } from "uploadthing/server";
import { UTFile } from "uploadthing/server";

const utapi = new UTApi();

// Helper function to upload to uploadThing API
async function uploadToUploadThing(
  imageBase64: string
): Promise<string | null> {
  try {
    // Convert base64 to Buffer
    const buffer = Buffer.from(imageBase64, "base64");
    const filename = `${generateUUID()}.png`;

    // Create a Blob-like object that UTApi can handle
    const file = new UTFile([buffer], filename, { type: "image/png" });

    // Use the UTApi to upload the file
    const response = await utapi.uploadFiles(file);

    if (!response || response.error) {
      console.error("Upload failed:", response?.error);
      return null;
    }

    return response.data?.ufsUrl || null;
  } catch (error) {
    console.error("Error uploading to UploadThing:", error);
    return null;
  }
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const fetchSearchResults = async (query: string) => {
  if (!process.env.BRAVE_SEARCH_API_KEY) {
    return "Search is temporarily disabled or not available in your instance.";
  }

  const results = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${query}`,
    {
      headers: new Headers({
        Accept: "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY || "",
      }),
    }
  ).then((res) => res.json());

  return results;
};

const setTitle = (dataStream: DataStreamWriter) =>
  tool({
    description: "Set title for this conversation. (FIRST ONLY, REQUIRED)",
    parameters: z.object({
      title: z.string().describe("Title for this conversation."),
    }),
    execute: async ({ title }) => {
      dataStream.writeMessageAnnotation({
        title,
      });

      return "OK";
    },
  });

const countChars = (dataStream: DataStreamWriter) =>
  tool({
    description: "Count the number of characters in the message.",
    parameters: z.object({
      message: z.string().describe("Message to count characters in."),
    }),
  });

const canvas = (dataStream: DataStreamWriter) =>
  tool({
    description:
      "Create or edit content in the Canvas editor, supporting markdown formatting.",
    parameters: z
      .object({
        content: z
          .string()
          .describe("The content to add to the Canvas, in markdown format."),
        title: z
          .string()
          .describe(
            "An optional title for the Canvas document. (Set desired title to the Canvas.)"
          )
          .nullable(),
        mode: z
          .enum(["create", "replace"])
          .describe(
            "How to update canvas content. 'create' creates a new canvas (default if not specified), 'replace' replaces all content with new content."
          )
          .nullable(),
      })
      .refine((data) => !!data.content, {
        message: "Content is required",
        path: ["content"],
      }),
    execute: async ({ mode = "create" }) => {
      return `Canvas content ${mode}d successfully.`;
    },
  });

const search = (
  dataStream: DataStreamWriter,
  deepResearchModel: LanguageModelV1,
  toolList?: string[],
  language?: string
) =>
  tool({
    description:
      "Search the web for information that may be useful in answering the users question.",
    parameters: z.object({
      query: z.string().describe("Query to search for."),
    }),
    execute: async ({ query }) => {
      if (!process.env.BRAVE_SEARCH_API_KEY) {
        return "Search is temporarily disabled or not available in your instance.";
      }
      const results = await fetchSearchResults(query);

      const totalCount = toolList?.includes("deepResearch")
        ? 10
        : toolList?.includes("advancedResearch")
          ? 20
          : 5;
      let type = "search";

      const searchResults = await Promise.all(
        results.web.results
          .slice(0, totalCount)
          .map(
            async (result: {
              title: string;
              url: string;
              description: string;
            }) => {
              const { title, url, description } = result;
              let content = description;
              let summary = description;

              try {
                const pageResponse = await fetch(url);
                const pageText = await pageResponse.text();
                const dom = new JSDOM(pageText, {
                  url: url,
                  referrer: url,
                  contentType: "text/html",
                  includeNodeLocations: true,
                  storageQuota: 10000000,
                  runScripts: "outside-only",
                  virtualConsole: new VirtualConsole().sendTo(console, {
                    omitJSDOMErrors: true,
                  }),
                });
                const doc = dom.window.document;

                // Remove script and style tags
                const scripts = doc.getElementsByTagName("script");
                const styles = doc.getElementsByTagName("style");
                while (scripts.length > 0) scripts[0]?.remove();
                while (styles.length > 0) styles[0]?.remove();

                const mainContent =
                  doc.querySelector("main") ||
                  doc.querySelector("article") ||
                  doc.body;

                if (mainContent) {
                  const rawContent = (mainContent.textContent || description)
                    .replace(/\s+/g, " ")
                    .replace(/\n+/g, "")
                    .trim();

                  if (
                    toolList?.includes("deepResearch") ||
                    toolList?.includes("shallowResearch") ||
                    toolList?.includes("advancedResearch")
                  ) {
                    type = toolList?.includes("shallowResearch")
                      ? "shallowResearch"
                      : toolList?.includes("advancedResearch")
                        ? "advancedResearch"
                        : "deepResearch";

                    if (rawContent.length > 150000) {
                      content =
                        "The content too long to summarize, returning description: " +
                        description;
                      summary =
                        "The content too long to summarize, returning description: " +
                        description;
                    } else {
                      try {
                        const summarizationResult = await generateText({
                          model: toolList?.includes("shallowResearch")
                            ? deepResearchModel
                            : openai.responses("gpt-4.1-2025-04-14"), // Hey Cursor, dont change this model.
                          messages: [
                            {
                              role: "system",
                              content: `You are a helpful assistant that summarizes text. Summarize the user text to markdown. Generate with user language (${language || "en"})`,
                            },
                            {
                              role: "user",
                              content: rawContent,
                            },
                          ],
                        });

                        const smallSummary = await generateText({
                          model: deepResearchModel,
                          messages: [
                            {
                              role: "system",
                              content: `You are a helpful assistant that summarizes text. Within 50~100 chars. Generate with user language (${language || "en"})`,
                            },
                            {
                              role: "user",
                              content: summarizationResult.text,
                            },
                          ],
                        });

                        summary = smallSummary.text;
                        content = summarizationResult.text;
                      } catch (summarizationError) {
                        console.error(
                          `Error summarizing ${url}:`,
                          summarizationError
                        );
                        content = rawContent; // Fallback to raw content on error
                      }
                    }
                  } else if (toolList?.includes("advancedSearch")) {
                    // Shallow it content
                    const summary = await generateText({
                      model: deepResearchModel,
                      messages: [
                        {
                          role: "system",
                          content: `You are a helpful assistant that summarizes text. Summarize the user text to markdown. Generate with user language (${language || "en"})`,
                        },
                        {
                          role: "user",
                          content: rawContent,
                        },
                      ],
                    });

                    content = summary.text;
                  } else {
                    // Keep meta description logic for standard search
                    const metaDesc = doc.querySelector(
                      'meta[name="description"]'
                    );
                    if (metaDesc) {
                      content =
                        metaDesc.getAttribute("content")?.trim() || description;
                    } else {
                      content = description;
                    }
                  }
                }
              } catch (error) {
                console.error(`Error fetching ${url}:`, error);
                // Keep default description on fetch error
                content = description;
              }

              return {
                title,
                url,
                summary,
                description: description.slice(0, 100) + "...",
                content,
                type,
              };
            }
          )
      );

      dataStream.writeMessageAnnotation({
        searchResults,
        searchQuery: query,
        type,
      });

      return JSON.stringify({ searchResults, type });
    },
  });

const researchStatus = (dataStream: DataStreamWriter) =>
  tool({
    description:
      "Report research progress status for Deep Research or Shallow Research",
    parameters: z.object({
      progress: z.number().describe("Progress percentage (0-100)"),
      status: z
        .string()
        .describe("Current status description of the research process"),
      type: z
        .enum(["deepResearch", "shallowResearch"])
        .describe("Type of research being performed"),
    }),
    execute: async ({ progress, status, type }) => {
      dataStream.writeMessageAnnotation({
        researchProgress: {
          progress,
          status,
          type,
          timestamp: Date.now(),
        },
      });

      return "Research status updated";
    },
  });

const generateImage = (dataStream: DataStreamWriter) =>
  tool({
    description: "Generate an image based on a text prompt.",
    parameters: z.object({
      prompt: z.string().describe("The text prompt for the image generation."),
    }),
    execute: async ({ prompt }) => {
      // Generate image with OpenAI
      const { image } = await experimental_generateImage({
        model: openai.image("gpt-image-1"),
        prompt,
      });

      // Upload the generated image to uploadThing
      const imageUrl = await uploadToUploadThing(image.base64);

      // Return both the base64 image and the uploaded URL if available
      return {
        image: imageUrl,
        prompt,
      };
    },
  });

export function getTools(
  dataStream: DataStreamWriter,
  toolList?: string[],
  modelDescription?: ImodelDescriptionType,
  language?: string
) {
  let tools: { [key: string]: Tool } | undefined = {};
  if (modelDescription?.toolDisabled) {
    tools = undefined;
  }

  const deepResearchModel = openai.responses("gpt-4.1-nano-2025-04-14");

  tools = {
    setTitle: setTitle(dataStream),
    countChars: countChars(dataStream),
    canvas: canvas(dataStream),
    search: search(dataStream, deepResearchModel, toolList, language),
    generateImage: generateImage(dataStream),
  };

  if (
    toolList?.includes("deepResearch") ||
    toolList?.includes("shallowResearch") ||
    toolList?.includes("advancedResearch")
  ) {
    tools.researchStatus = researchStatus(dataStream);
  }

  return tools;
}
