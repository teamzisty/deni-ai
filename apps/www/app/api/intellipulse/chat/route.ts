import {
  modelDescriptions,
  reasoningEffortType,
} from "@/lib/modelDescriptions";
import { systemPromptDev } from "@/lib/systemPrompt";
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
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  convertToCoreMessages,
  createDataStream,
  createDataStreamResponse,
  extractReasoningMiddleware,
  generateId,
  smoothStream,
  streamText,
  Tool,
  tool,
  UIMessage,
  wrapLanguageModel,
} from "ai";
import { JSDOM } from "jsdom";
import { VirtualConsole } from "jsdom";
import { NextResponse } from "next/server";
import { z } from "zod";
import path from "path";
import {
  loadStreams,
  appendStreamId,
  saveChat,
  getMessagesByChatId,
} from "@/utils/chat-store";
import { after } from "next/server";
import { createResumableStreamContext } from "resumable-stream";

// Only enable resumable streams when Redis is available
const isRedisAvailable = !!process.env.REDIS_URL;
const streamContext = isRedisAvailable
  ? createResumableStreamContext({
      waitUntil: after,
    })
  : null;

export async function GET(request: Request) {
  // Only handle resumable streams if Redis is available
  if (!isRedisAvailable || !streamContext) {
    return new Response("Resumable streams not available", { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const chatId = searchParams.get("chatId");

  if (!chatId) {
    return new Response("chatId is required", { status: 400 });
  }

  const streamIds = await loadStreams(chatId);

  if (!streamIds.length) {
    return new Response("No streams found", { status: 404 });
  }

  const recentStreamId = streamIds.at(-1);

  if (!recentStreamId) {
    return new Response("No recent stream found", { status: 404 });
  }

  const emptyDataStream = createDataStream({
    execute: () => {},
  });

  const stream = await streamContext.resumableStream(
    recentStreamId,
    () => emptyDataStream,
  );

  if (stream) {
    return new Response(stream, { status: 200 });
  }
  /*
   * For when the generation is "active" during SSR but the
   * resumable stream has concluded after reaching this point.
   */
  const recentMessages = await getMessagesByChatId({ id: chatId });

  return createDataStreamResponse({
    execute: (dataStream) => {
      recentMessages.forEach((message) => {
        dataStream.writeData({
          type: "append-message",
          message: JSON.stringify(message),
        });
      });
    },
  });
}

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
      return new NextResponse("Invalid request", { status: 400 });
    }

    let userId: string | undefined;
    let sessionId: string | undefined;

    // Handle authentication if authorization header is present
    if (authorization) {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(authorization.replace("Bearer ", ""));

      if (authError || !user) {
        return new NextResponse("Authorization failed", { status: 401 });
      }

      userId = user.id;
      // Extract sessionId from request URL or body
      const url = new URL(req.url);
      sessionId = url.searchParams.get("id") || undefined;
    } else {
      return new NextResponse("Authorization failed", { status: 401 });
    }

    const modelDescription = modelDescriptions[model];
    const isReasoning = model.endsWith("-reasoning");

    if (modelDescription?.toolDisabled) {
      return new NextResponse("This model is not available on dev mode.", {
        status: 400,
      });
    }

    model = model.replace("-reasoning", "");

    // const isCanary = modelDescription?.canary;

    // Voids Provider (not used)
    // const VoidsOpenAI = createVoidsOAI({
    //   // custom settings, e.g.
    //   isCanary,
    //   apiKey: "no", // API key
    // });

    // const VoidsAnthropic = createVoidsAP({
    //   isCanary,
    //   apiKey: "no",
    // });

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

    const coreMessage = convertToCoreMessages(messages);

    if (modelDescription?.toolDisabled) {
      toolList = ["tooldisabled"];
    }

    coreMessage.unshift({
      role: "system",
      content: systemPromptDev,
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

    // Generate unique stream ID only if Redis is available
    const streamId = isRedisAvailable ? generateId() : null;

    // Record the stream ID if we have a sessionId and Redis is available
    if (sessionId && isRedisAvailable && streamId) {
      try {
        await appendStreamId({ chatId: sessionId, streamId });
      } catch (error) {
        console.error("Failed to record stream ID:", error);
        // Continue without recording - not critical for stream execution
      }
    }

    const stream = createDataStream({
      execute: async (dataStream) => {
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
            read_file: tool({
              description: "Read a file from the virtual filesystem.",
              parameters: z.object({
                path: z.string().describe("File path to read from."),
              }),
            }),

            webcontainer: tool({
              description:
                "Execute commands in WebContainer or manage files in the virtual filesystem.",
              parameters: z.object({
                steps: z
                  .array(
                    z.object({
                      id: z
                        .string()
                        .describe("Unique identifier for this step"),
                      title: z
                        .string()
                        .describe("Human-readable title for this step"),
                      command: z
                        .string()
                        .describe(
                          "Command to execute (only for 'run' action, MAKE NULL TO OTHER ACTIONS, IF NOT, IT WILL ERROR)",
                        )
                        .nullable(),
                      action: z
                        .enum(["run", "write"])
                        .describe("Action type")
                        .nullable(),
                      path: z
                        .string()
                        .describe("File path for file operations")
                        .nullable(),
                      content: z
                        .string()
                        .describe("Content for write operations")
                        .nullable(),
                    }),
                  )
                  .describe("Sequence of steps to execute")
                  .nullable(),
              }),
              execute: async ({ steps }) => {
                // この関数はフロントエンド側でWebContainerインスタンスを管理しているため
                // 実際の処理はフロントエンドで行われます。このツールはAIに情報を提供するためのものです。

                if (steps && steps.length > 0) {
                  // 手順のシーケンスをクライアントに送信
                  dataStream.writeMessageAnnotation({
                    webcontainerAction: {
                      action: "steps",
                      steps: steps,
                    },
                  });

                  // 手順の概要を返す
                  const stepTitles = steps
                    .map((step, index) => `${index + 1}. ${step.title}`)
                    .join("\n");
                  return `STEPS ARE SENDED, BUT NOT COMPLETED, WAIT FOR NEXT USER MESSAGE:\n${stepTitles}`;
                } else {
                  // 従来の単一アクション
                  // タイムスタンプを追加して同じコマンドの連続実行を防止
                  const timestamp = Date.now();
                  dataStream.writeMessageAnnotation({
                    webcontainerAction: {
                      action: "steps",
                      steps: steps,
                      timestamp: timestamp, // タイムスタンプを追加
                    },
                  });
                }
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
                  },
                ).then((res) => res.json());

                const totalCount = toolList?.includes("deepResearch") ? 10 : 5;

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

                        try {
                          const pageResponse = await fetch(url);
                          const pageText = await pageResponse.text();
                          const dom = new JSDOM(pageText, {
                            virtualConsole: new VirtualConsole().sendTo(
                              console,
                              { omitJSDOMErrors: true },
                            ),
                          });
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
                            // メタディスクリプションを取得
                            if (
                              toolList?.includes("deepResearch") ||
                              toolList?.includes("advancedSearch")
                            ) {
                              //content = mainContent.textContent?.trim() || description;
                              content = (mainContent.textContent || description)
                                .replace(/\s+/g, " ")
                                .replace(/\n+/g, "")
                                .trim();
                            } else {
                              const metaDesc = doc.querySelector(
                                'meta[name="description"]',
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
                        }

                        return {
                          title,
                          url,
                          description,
                          content,
                        };
                      },
                    ),
                );

                dataStream.writeMessageAnnotation({
                  searchResults,
                  searchQuery: query,
                });

                return JSON.stringify(searchResults);
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
    });

    // Return a resumable stream to the client if Redis is available, otherwise return regular stream
    if (isRedisAvailable && streamContext && streamId) {
      return new Response(
        await streamContext.resumableStream(streamId, () => stream),
      );
    } else {
      // Fallback to regular stream when Redis is not available
      return new Response(stream);
    }
  } catch (error) {
    console.error(error);
    return new NextResponse(
      "An error occurred while processing your request. Please try again later.",
      { status: 500 },
    );
  }
}
