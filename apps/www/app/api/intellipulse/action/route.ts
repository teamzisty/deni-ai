import { reasoningEffortType } from "@/lib/modelDescriptions";
import { createOpenAI } from "@ai-sdk/openai";
import { validateActionKey } from "@/lib/action-key";
import {
  createDataStreamResponse,
  generateText,
  streamText,
  UIMessage,
} from "ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const authorization = req.headers.get("Authorization");
    let {
      // eslint-disable-next-line prefer-const
      messages,
    }: {
      messages: UIMessage[];
    } = await req.json();
    if (messages.length === 0) {
      return new NextResponse("Invalid request", { status: 400 });
    }

    // Handle authentication if authorization header is present
    if (authorization) {
      const actionKey = authorization.replace("Bearer ", "");
      if (!actionKey) {
        return new NextResponse("Authorization failed", { status: 401 });
      }

      const validatedActionKey = await validateActionKey(actionKey);
      if (!validatedActionKey.success) {
        return new NextResponse("Authorization failed", { status: 401 });
      }
    } else {
      return new NextResponse("Authorization failed", { status: 401 });
    }

    // Official Provider
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    function errorHandler(error: unknown) {
      if (process.env.NODE_ENV === "development") {
        const errorStack = [
          "API Error at " + new Date().toISOString(),
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

    const model = openai.responses("gpt-4.1-2025-04-14");

    const response = await generateText({
      model,
      messages,
    });

    return NextResponse.json(
      { success: true, content: response.text },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return new NextResponse(
      "An error occurred while processing your request. Please try again later.",
      { status: 500 },
    );
  }
}
