import { createSupabaseServer } from "@/lib/supabase/server";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { streamText, convertToCoreMessages, tool } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("Authorization");
    let {
      messages,
      model,
    }: {
      messages: any[];
      model: string;
    } = await req.json();

    if (!model || messages.length === 0) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    let userId: string | undefined;

    // Handle authentication if authorization header is present
    if (authorization) {
      const supabase = await createSupabaseServer();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser(authorization.replace("Bearer ", ""));

      if (authError || !user) {
        return new NextResponse("Authorization failed", { status: 401 });
      }

      userId = user.id;
    } else {
      return new NextResponse("Authorization failed", { status: 401 });
    }

    // Provider setup
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const coreMessage = convertToCoreMessages(messages);

    coreMessage.unshift({
      role: "system",
      content: "You are Intellipulse, an AI assistant specialized in development tasks.",
    });

    // Simple model selection
    let selectedModel;
    const modelProvider = model.split("/")[0];
    const modelName = model.substring(model.indexOf("/") + 1);

    switch (modelProvider) {
      case "openai":
        selectedModel = openai(modelName);
        break;
      case "anthropic":
        selectedModel = anthropic(modelName);
        break;
      default:
        selectedModel = openai("gpt-4");
        break;
    }

    const tools = {
      setTitle: tool({
        description: "Set title for this conversation",
        parameters: z.object({
          title: z.string().describe("Title for this conversation"),
        }),
        execute: async ({ title }) => {
          return "Title set successfully";
        },
      }),
      webcontainer: tool({
        description: "Execute commands in WebContainer",
        parameters: z.object({
          steps: z.array(
            z.object({
              id: z.string().describe("Unique identifier for this step"),
              title: z.string().describe("Human-readable title for this step"),
              command: z.string().nullable().describe("Command to execute"),
              action: z.enum(["run", "write"]).nullable().describe("Action type"),
              path: z.string().nullable().describe("File path for file operations"),
              content: z.string().nullable().describe("Content for write operations"),
            }),
          ).nullable(),
        }),
        execute: async ({ steps }) => {
          if (steps && steps.length > 0) {
            const stepTitles = steps
              .map((step, index) => `${index + 1}. ${step.title}`)
              .join("\n");
            return `Steps prepared:\n${stepTitles}`;
          }
          return "No steps provided";
        },
      }),
    };

    const response = streamText({
      model: selectedModel,
      messages: coreMessage,
      tools: tools,
      maxSteps: 5,
    });

    return response.toDataStreamResponse();
  } catch (error) {
    console.error(error);
    return new NextResponse(
      "An error occurred while processing your request.",
      { status: 500 },
    );
  }
}