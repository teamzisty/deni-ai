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
import { NextResponse } from "next/server";
import { auth } from "@workspace/firebase-config/client";
import { getTools } from "@/lib/utils";

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
      language,
    }: {
      messages: UIMessage[];
      model: string;
      reasoningEffort: reasoningEffortType;
      toolList?: string[];
      language?: string;
    } = await req.json();

    if (!model || messages.length === 0) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    if (auth && (!authorization || notAvailable)) {
      return new NextResponse("Authorization failed", { status: 401 });
    }

    if (auth && authorization) {
      authAdmin
        ?.verifyIdToken(authorization)
        .then((decodedToken) => {
          if (!decodedToken) {
            return new NextResponse("Authorization failed", { status: 401 });
          }
        })
        .catch((error) => {
          console.error(error);
          return new NextResponse("Authorization failed", { status: 401 });
        });
    }

    const modelDescription = modelDescriptions[model];
    const isReasoning = model.endsWith("-reasoning");

    model = model.replace("-reasoning", "");

    // const isCanary = modelDescription?.canary;

    // // Voids Provider (not used)
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

    return createDataStreamResponse({
      execute: (dataStream) => {
        let tools: { [key: string]: Tool } | undefined = {};
        if (modelDescription?.toolDisabled) {
          tools = undefined;
        } else {
          tools = getTools(dataStream, toolList, modelDescription, language);
        }
        

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
            ...(modelDescription?.reasoning && {
              openai: {
                reasoningEffort: reasoningEffort,
                reasoningSummary: "auto",
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
    return new NextResponse(error as string, { status: 500 });
  }
}
