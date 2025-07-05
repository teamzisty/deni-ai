import { NextRequest, NextResponse } from "next/server";
import { google } from "@ai-sdk/google";
import { env } from "@/lib/env";
import { generateText } from "ai";
import { getApiTranslations } from "@/lib/api-i18n";

export async function POST(request: NextRequest) {
  const t = await getApiTranslations(request, 'common');
  try {
    const formData = await request.formData();
    const audio = formData.get("audio") as File;
    
    if (!audio) {
      return NextResponse.json(
        { error: t('audio_file_required') },
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
          content: t('audio_transcription_prompt'),
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: t('audio_transcription_request'),
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
      { error: t('audio_transcription_failed') },
      { status: 500 }
    );
  }
}