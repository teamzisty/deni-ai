import {
  modelDescriptions,
  reasoningEffortType,
} from "@/lib/modelDescriptions";
import { getSystemPrompt } from "@/lib/systemPrompt";
import { authAdmin, notAvailable } from "@workspace/firebase-config/server";
import { createVoidsOAI } from "@workspace/voids-oai-provider/index";
import { createVoidsAP } from "@workspace/voids-ap-provider/index";
import {
  convertToCoreMessages,
  createDataStreamResponse,
  extractReasoningMiddleware,
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
    const openai = createVoidsOAI({
      // custom settings, e.g.
      isCanary,
      apiKey: "no", // API key
    });

    const anthropic = createVoidsAP({
      isCanary,
      apiKey: "no",
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

    const visitedWebsites = new Set<string>();

    function errorHandler(error: unknown) {
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
          };

          if (toolList?.includes("search")) {
            tools.search = tool({
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

                const totalCount = toolList?.includes("deepResearch")
                  ? 10
                  : 5;

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
                            // メタディスクリプションを取得
                            if (toolList.includes("deepResearch") || toolList.includes("advancedSearch")) {
                                //content = mainContent.textContent?.trim() || description;
                                content = (mainContent.textContent || description).replace(/\s+/g, ' ').replace(/\n+/g, '').trim();
                            } else {
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
                        }

                        return {
                          title,
                          url,
                          description,
                          content,
                        };
                      }
                    )
                );

                dataStream.writeMessageAnnotation({
                  searchResults,
                  searchQuery: query,
                });

                return JSON.stringify(searchResults);
              },
            });

            // tools.visit = tool({
            //   description: "visit a website and extract information from it.",
            //   parameters: z.object({
            //     url: z.string().describe("URL to visit."),
            //   }),
            //   execute: async ({ url }) => {
            //     const results = await fetch(url, {
            //       headers: {
            //         "User-Agent":
            //           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            //       },
            //     }).then((res) => res.text());

            //     visitedWebsites.add(url);

            //     const dom = new JSDOM(results, {
            //       url: url,
            //     });
            //     const doc = dom.window.document;

            //     // Remove script and style tags
            //     const scripts = doc.getElementsByTagName("script");
            //     const styles = doc.getElementsByTagName("style");
            //     while (scripts.length > 0) scripts[0]?.remove();
            //     while (styles.length > 0) styles[0]?.remove();

            //     // Remove unnecessary sections
            //     const headers = doc.getElementsByTagName("header");
            //     const footers = doc.getElementsByTagName("footer");
            //     const navs = doc.getElementsByTagName("nav");
            //     const asides = doc.getElementsByTagName("aside");
            //     while (headers.length > 0) headers[0]?.remove();
            //     while (footers.length > 0) footers[0]?.remove();
            //     while (navs.length > 0) navs[0]?.remove();
            //     while (asides.length > 0) asides[0]?.remove();

            //     // Extract main content
            //     const mainContent =
            //       doc.querySelector("main") ||
            //       doc.querySelector("article") ||
            //       doc.body;

            //     // Extract text content
            //     let extractedText = mainContent.textContent || "";
            //     extractedText = extractedText.replace(/\s+/g, " ").trim();
            //     extractedText = extractedText.replace(
            //       /(\r\n|\n|\r){2,}/gm,
            //       "\n\n"
            //     );

            //     return extractedText;
            //   },
            // });
          }
        }

        const newModel = wrapLanguageModel({
          model:
            modelDescription?.type === "Claude"
              ? anthropic(model)
              : openai(model),
          middleware: extractReasoningMiddleware({ tagName: "think" }),
        });

        const response = streamText({
          model: newModel,
          messages: coreMessage,
          tools: tools,
          maxSteps: 15,
          maxTokens: model.includes("claude-3-7-sonnet-20250219")
            ? 64000
            : 4096,
          temperature: 1,

          providerOptions: {
            ...(modelDescription?.reasoningEffort && {
              openai: {
                reasoningEffort: reasoningEffort,
              },
            }),
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
            const thinkingTime = Date.now() - startTime;
            dataStream.writeMessageAnnotation({
              thinkingTime,
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
