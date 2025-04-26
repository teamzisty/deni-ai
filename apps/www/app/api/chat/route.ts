import {
  modelDescriptions,
  reasoningEffortType,
} from "@/lib/modelDescriptions";
import { getSystemPrompt } from "@/lib/systemPrompt";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createXai } from "@ai-sdk/xai";
import {
  createGoogleGenerativeAI,
  GoogleGenerativeAIProviderOptions,
} from "@ai-sdk/google";
import {
  createOpenRouter,
  OpenRouterProviderOptions,
} from "@openrouter/ai-sdk-provider";
import { createGroq } from "@ai-sdk/groq";
import { authAdmin, notAvailable } from "@workspace/firebase-config/server";
import { createVoidsOAI } from "@workspace/voids-oai-provider/index";
import { createVoidsAP } from "@workspace/voids-ap-provider/index";
import {
  convertToCoreMessages,
  createDataStreamResponse,
  extractReasoningMiddleware,
  generateText,
  smoothStream,
  streamText,
  Tool,
  tool,
  UIMessage,
  wrapLanguageModel,
} from "ai";
import { JSDOM } from "jsdom";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@workspace/firebase-config/client";

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("Authorization");
    let {
      // eslint-disable-next-line prefer-const
      messages,
      model,
      toolList,
      // eslint-disable-next-line prefer-const
      reasoningEffort,
    }: {
      messages: UIMessage[];
      model: string;
      reasoningEffort: reasoningEffortType;
      toolList?: string[];
    } = await req.json();

    if (!model || messages.length === 0) {
      return Response.json({ error: "Invalid request" });
    }

    if (auth && (!authorization || notAvailable)) {
      return Response.json({ error: "Authorization failed" });
    }

    if (auth && authorization) {
      authAdmin
        ?.verifyIdToken(authorization)
        .then((decodedToken) => {
          if (!decodedToken) {
            return Response.json({ error: "Authorization failed" });
          }
        })
        .catch((error) => {
          console.error(error);
          return Response.json({ error: "Authorization failed" });
        });
    }

    const modelDescription = modelDescriptions[model];
    const isReasoning = model.endsWith("-reasoning");

    model = model.replace("-reasoning", "");

    const isCanary = modelDescription?.canary;

    // Voids Provider (not used)
    const VoidsOpenAI = createVoidsOAI({
      // custom settings, e.g.
      isCanary,
      apiKey: "no", // API key
    });

    const VoidsAnthropic = createVoidsAP({
      isCanary,
      apiKey: "no",
    });

    // Official Provider
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const xai = createXai({
      apiKey: process.env.XAI_API_KEY,
    });

    if (modelDescription?.offline) {
      return NextResponse.json({
        state: "error",
        error: "This model is currently not available.",
      });
    }

    const coreMessage = convertToCoreMessages(messages);

    if (modelDescription?.toolDisabled) {
      toolList = ["tooldisabled"];
    }

    coreMessage.unshift({
      role: "system",
      content: getSystemPrompt(toolList || []),
    });

    const startTime = Date.now();
    let firstChunk = false;

    function errorHandler(error: unknown) {
      if (process.env.NODE_ENV === "development") {
        const errorStack = [
          "API Error at " + new Date().toISOString(),
          "Model: " + model,
          "Error: " + error,
        ].join("\n");

        console.error(errorStack);

        if (error == null) {
          return "unknown error";
        }

        if (typeof error === "string") {
          return error;
        }

        if (error instanceof Error) {
          return error.message;
        }

        return JSON.stringify(error);
      } else {
        // hide error details in production
        return "An error occurred while processing your request. Please try again later.";
      }
    }

    return createDataStreamResponse({
      execute: (dataStream) => {
        let tools: { [key: string]: Tool } | undefined = {};
        if (modelDescription?.toolDisabled) {
          tools = undefined;
        } else {
          tools = {
            setTitle: tool({
              description:
                "Set title for this conversation. (FIRST ONLY, REQUIRED)",
              parameters: z.object({
                title: z.string().describe("Title for this conversation."),
              }),
              execute: async ({ title }) => {
                dataStream.writeMessageAnnotation({
                  title,
                });

                return "OK";
              },
            }),
            countChars: tool({
              description: "Count the number of characters in the message.",
              parameters: z.object({
                message: z.string().describe("Message to count characters in."),
              }),
              execute: async ({ message }) => {
                return message.length;
              },
            }),
            canvas: tool({
              description:
                "Create or edit content in the Canvas editor, supporting markdown formatting.",
              parameters: z
                .object({
                  content: z
                    .string()
                    .describe(
                      "The content to add to the Canvas, in markdown format."
                    ),
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
              execute: async ({ content, title, mode = "create" }) => {
                let finalContent = content;

                dataStream.writeMessageAnnotation({
                  canvasContent: finalContent,
                  canvasTitle: title || "Untitled Document",
                });

                return `Canvas content ${mode}d successfully.`;
              },
            }),
            search: tool({
              description:
                "Search the web for information that may be useful in answering the users question.",
              parameters: z.object({
                query: z.string().describe("Query to search for."),
              }),
              execute: async ({ query }) => {
                if (!process.env.BRAVE_SEARCH_API_KEY) {
                  return "Search is temporarily disabled or not available in your instance.";
                }
                const results = await fetch(
                  `https://api.search.brave.com/res/v1/web/search?q=${query}`,
                  {
                    headers: new Headers({
                      Accept: "application/json",
                      "Accept-Encoding": "gzip",
                      "X-Subscription-Token":
                        process.env.BRAVE_SEARCH_API_KEY || "",
                    }),
                  }
                ).then((res) => res.json());

                const totalCount = toolList?.includes("deepResearch") ? 10 : 5;
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
                        let summary = "";

                        try {
                          const pageResponse = await fetch(url);
                          const pageText = await pageResponse.text();
                          const dom = new JSDOM(pageText);
                          const doc = dom.window.document;

                          // Remove script and style tags
                          const scripts = doc.getElementsByTagName("script");
                          const styles = doc.getElementsByTagName("style");
                          while (scripts.length > 0) scripts[0]?.remove();
                          while (styles.length > 0) styles[0]?.remove();

                          // Extract main content
                          const mainContent =
                            doc.querySelector("main") ||
                            doc.querySelector("article") ||
                            doc.body;


                          if (mainContent) {
                            const rawContent = (
                              mainContent.textContent || description
                            )
                              .replace(/\s+/g, " ")
                              .replace(/\n+/g, "")
                              .trim();

                            if (toolList?.includes("deepResearch")) {
                              type = "deepResearch";
                              // Summarize using gpt-4.1-nano for deep research
                              
                              const lastMessage = messages.slice(-1)[0];
                              const lastMessageContent = lastMessage?.content || "Sorry, no last message found.";
                              try {
                                const summarizationResult = await generateText({
                                  model: openai("gpt-4.1-nano-2025-04-14"), // Use gpt-4.1-nano
                                  messages: [
                                    {
                                      role: "system",
                                      content: `You are a helpful assistant that summarizes text. Summarize the user text to markdown. Generate with user language, user prompt is: ${lastMessageContent}`,
                                    },
                                    {
                                      role: "user",
                                      content: rawContent,
                                    },
                                  ],
                                  tools: {
                                    countChars: tool({
                                      description: "Count the number of characters in the text.",
                                      parameters: z.object({
                                        text: z.string().describe("The text to count characters in."),
                                      }),
                                      execute: async ({ text }) => {
                                        return text.length;
                                      },
                                    }),
                                    summary: tool({
                                      description: "Save the generated summary.",
                                      parameters: z.object({
                                        text: z.string().describe("The 50~70 chars simple summary of the text. (use count chars tool to check the length)"),
                                      }),
                                      execute: async ({ text }) => {
                                        summary = text;
                                        return "OK";
                                      },
                                    }),
                                  },
                                  maxTokens: 1000, // Limit summary length
                                });
                                content =
                                  summarizationResult.text || rawContent; // Fallback to raw content if summary fails
                              } catch (summarizationError) {
                                console.error(
                                  `Error summarizing ${url}:`,
                                  summarizationError
                                );
                                content = rawContent; // Fallback to raw content on error
                              }
                            } else if (toolList?.includes("advancedSearch")) {
                              // Keep full content for advanced search (non-deep research)
                              content = rawContent;
                            } else {
                              // Keep meta description logic for standard search
                              const metaDesc = doc.querySelector(
                                'meta[name="description"]'
                              );
                              if (metaDesc) {
                                content =
                                  metaDesc.getAttribute("content")?.trim() ||
                                  description;
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
                          description: description.slice(0, 100) + "...",
                          summary,
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
            }),
          };
        }

        let selectedModel;
        const modelProvider = model.split("/")[0];
        const modelName = model.substring(model.indexOf("/") + 1);

        // switch (modelDescription?.type) {
        //   case "Claude":
        //     selectedModel = anthropic(model);
        //     break;
        //   default:
        //     if (modelDescription?.officialAPI) {
        //       selectedModel = officialOpenAI(model);
        //     } else {
        //       selectedModel = openai(model);
        //     }
        //     break;
        // }

        switch (modelProvider) {
          case "openai":
            selectedModel = openai(modelName, {
              structuredOutputs: false,
            });
            break;
          case "anthropic":
            selectedModel = anthropic(modelName);
            break;
          case "google":
            selectedModel = google(modelName);
            break;
          case "openrouter":
            selectedModel = openrouter(modelName);
            break;
          case "groq":
            selectedModel = groq(modelName);
            break;
          case "xai":
            selectedModel = xai(modelName);
            break;
          default:
            selectedModel = openai(modelName);
            break;
        }

        const newModel = wrapLanguageModel({
          model: selectedModel,
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        });

        const response = streamText({
          model:
            modelDescription?.type == "ChatGPT"
              ? openai.responses(modelName)
              : newModel,
          messages: coreMessage,
          tools: tools,
          maxSteps: 15,
          experimental_transform: smoothStream({
            chunking: /[\u3040-\u309F\u30A0-\u30FF]|\S+\s+/,
          }),
          toolCallStreaming: true,
          temperature: 1,

          providerOptions: {
            ...(modelDescription?.reasoningEffort && {
              openai: {
                reasoningEffort: reasoningEffort,
                reasoningSummary: "detailed",
              },
            }),
            google: {
              thinkingConfig: {
                thinkingBudget: 2048,
              },
            } as GoogleGenerativeAIProviderOptions,
            openrouter: {
              reasoning: { effort: "medium" },
            } as OpenRouterProviderOptions,
            ...(isReasoning && {
              anthropic: {
                thinking: { type: "enabled", budgetTokens: 8192 },
              },
            }),
          },
          onChunk() {
            if (!firstChunk) {
              firstChunk = true;
              dataStream.writeMessageAnnotation({
                model,
              });
            }
          },
          onFinish() {
            // Calculate generation time and send it as an annotation
            const endTime = Date.now();
            const generationTime = endTime - startTime;
            dataStream.writeMessageAnnotation({
              generationTime,
            });
          },
        });

        response.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: errorHandler,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error });
  }
}
