import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { env } from "@/lib/env";
import { generateText } from "ai";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio") as File;
    
    if (!audio) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Convert audio file to base64
    const arrayBuffer = await audio.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    
    // Use Gemini 2.5 Flash for audio transcription
    const model = google("gemini-2.5-flash");

    const response = await generateText({
      model,
      messages: [
        {
          role: "system",
          content: `Transcribe the following audio file. The audio is in English and may contain various accents. Provide a clean and accurate transcription.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please transcribe the following audio file.",
            },
            {
              type: "file",
              mimeType: audio.type,
              data: `data:${audio.type};base64,${base64Audio}`,
            },
          ]
        },
      ],
    })

    const transcript = response.text || "";
    
    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}