import { modelDescriptions } from "@/lib/modelDescriptions";
import { getSystemPrompt } from "@/lib/systemPrompt";
import { createOpenAI } from "@ai-sdk/openai";
import { authAdmin, notAvailable } from "@/lib/firebase/server";
import {
  convertToCoreMessages,
  createDataStreamResponse,
  smoothStream,
  streamText,
  tool,
  UIMessage,
} from "ai";
import { JSDOM } from "jsdom";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("Authorization");
    const {
      messages,
      model,
      toolList,
    }: { messages: UIMessage[]; model: string; toolList?: string[] } =
      await req.json();

    if (!model || messages.length === 0) {
      return Response.json({ error: "Invalid request" });
    }

    if (!authorization || notAvailable) {
      return Response.json({ error: "Authorization failed" });
    }

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

    const modelDescription = modelDescriptions[model.replace("-high", "")];
    const isCanary = modelDescription?.canary;
    const openai = createOpenAI({
      // custom settings, e.g.
      compatibility: "strict", // strict mode, enable when using the OpenAI API
      baseURL: isCanary
        ? "https://capi.voids.top/v1"
        : "https://api.voids.top/v1", // custom base URL
      apiKey: "no", // API key
    });

    if (modelDescription?.offline) {
      return NextResponse.json({
        state: "error",
        error: "This model is currently not available.",
      });
    }

    const coreMessage = convertToCoreMessages(messages);

    console.log(toolList);

    coreMessage.unshift({
      role: "system",
      content: getSystemPrompt(toolList || []),
    });

    const startTime = Date.now();
    let firstChunk = false;

    const visitedWebsites = new Set<string>();

    return createDataStreamResponse({
      execute: (dataStream) => {
        let tools: any = undefined;
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
          };

          if (toolList?.includes("search")) {
            tools.search = tool({
              description:
                "Search the web for information that may be useful in answering the users question.",
              parameters: z.object({
                query: z.string().describe("Query to search for."),
              }),
              execute: async ({ query }) => {
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

                const searchResults = results.web.results
                  .slice(0, 5)
                  .map((result: any) => {
                    const { title, url, description } = result;
                    return {
                      title,
                      url,
                      description,
                    };
                  });

                dataStream.writeMessageAnnotation({
                  searchResults,
                  searchQuery: query,
                });

                return JSON.stringify(searchResults);
              },
            });

            tools.visit = tool({
              description: "visit a website and extract information from it.",
              parameters: z.object({
                url: z.string().describe("URL to visit."),
              }),
              execute: async ({ url }) => {
                const results = await fetch(url, {
                  headers: {
                    "User-Agent":
                      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                  },
                }).then((res) => res.text());

                visitedWebsites.add(url);

                const dom = new JSDOM(results, {
                  url: url,
                });
                const doc = dom.window.document;

                // Remove script and style tags
                const scripts = doc.getElementsByTagName("script");
                const styles = doc.getElementsByTagName("style");
                while (scripts.length > 0) scripts[0]?.remove();
                while (styles.length > 0) styles[0]?.remove();

                // Handle SPA and React content
                const body = doc.body?.innerHTML || "";
                const cleanedContent = body
                  .replace(/data-react[^=]*="[^"]*"/g, "")
                  .replace(/<!--[\s\S]*?-->/g, "")
                  .replace(/class="[^"]*"/g, "");

                return cleanedContent;
              },
            });
          }
        }

        const response = streamText({
          model: openai(model),
          messages: coreMessage,
          experimental_transform: smoothStream({
            delayInMs: 20,
            chunking: "word",
          }),
          tools: tools,
          toolChoice: "auto",
          maxSteps: 15,
          maxTokens: 2048,
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
              visitedWebsites: Array.from(visitedWebsites),
            });
          },
          onError(error) {
            if (
              (error.error as any).message ==
              "litellm.APIConnectionError: APIConnectionError: GroqException - list index out of range"
            ) {
              const thinkingTime = Date.now() - startTime;
              dataStream.writeMessageAnnotation({
                thinkingTime,
              });
              return;
            } else {
              console.error(error);
            }
          },
        });

        response.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: error });
  }
}
