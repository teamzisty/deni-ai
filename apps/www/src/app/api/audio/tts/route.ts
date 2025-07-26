import { NextRequest, NextResponse } from "next/server";
import { getApiTranslations } from "@/lib/api-i18n";

export async function POST(request: NextRequest) {
  const t = await getApiTranslations(request, "common");
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: t("text_required") }, { status: 400 });
    }

    const apiKey =
      process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: t("api_key_not_configured") },
        { status: 500 },
      );
    }

    // Try multiple Gemini TTS API approaches
    let response;
    let audioData;

    // First try with newer API structure
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text }],
              },
            ],
            generationConfig: {
              responseModalities: ["AUDIO"],
            },
          }),
        },
      );

      if (response.ok) {
        const result = await response.json();
        audioData =
          result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      }
    } catch (error) {
      console.log("First API approach failed, trying alternative...");
    }

    // If first approach fails, try alternative structure
    if (!response?.ok || !audioData) {
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text }],
                },
              ],
              generationConfig: {
                responseMimeType: "audio/mp3",
              },
            }),
          },
        );

        if (response.ok) {
          const result = await response.json();
          audioData =
            result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        }
      } catch (error) {
        console.log("Second API approach failed, using browser TTS fallback");
      }
    }

    if (!response?.ok || !audioData) {
      const errorData = response ? await response.json().catch(() => ({})) : {};
      console.error("Gemini API error:", JSON.stringify(errorData, null, 2));

      // Fallback to browser TTS if Gemini fails
      return NextResponse.json(
        { error: t("tts_browser_fallback"), fallback: true },
        { status: 422 },
      );
    }

    // Validate base64 data before processing
    if (!audioData || typeof audioData !== "string") {
      console.error("Invalid audio data received from API");
      return NextResponse.json(
        { error: t("invalid_audio_data"), fallback: true },
        { status: 422 },
      );
    }

    let audioBuffer;
    try {
      audioBuffer = Buffer.from(audioData, "base64");
    } catch (error) {
      console.error("Failed to decode base64 audio data:", error);
      return NextResponse.json(
        { error: t("audio_decode_failed"), fallback: true },
        { status: 422 },
      );
    }

    // Validate buffer size
    if (audioBuffer.length < 100) {
      console.error("Audio buffer too small:", audioBuffer.length, "bytes");
      return NextResponse.json(
        { error: t("invalid_audio_size"), fallback: true },
        { status: 422 },
      );
    }

    // Detect audio format from first few bytes and set appropriate content type
    let contentType = "audio/wav";
    if (audioBuffer.length >= 2) {
      // MP3 signature
      if (
        audioBuffer[0] !== undefined &&
        audioBuffer[1] !== undefined &&
        audioBuffer[0] === 0xff &&
        (audioBuffer[1] & 0xe0) === 0xe0
      ) {
        contentType = "audio/mpeg";
      }
      // WAV signature
      else if (
        audioBuffer.length >= 4 &&
        audioBuffer[0] !== undefined &&
        audioBuffer[1] !== undefined &&
        audioBuffer[2] !== undefined &&
        audioBuffer[3] !== undefined &&
        audioBuffer[0] === 0x52 &&
        audioBuffer[1] === 0x49 &&
        audioBuffer[2] === 0x46 &&
        audioBuffer[3] === 0x46
      ) {
        contentType = "audio/wav";
      }
      // OGG signature
      else if (
        audioBuffer.length >= 4 &&
        audioBuffer[0] !== undefined &&
        audioBuffer[1] !== undefined &&
        audioBuffer[2] !== undefined &&
        audioBuffer[3] !== undefined &&
        audioBuffer[0] === 0x4f &&
        audioBuffer[1] === 0x67 &&
        audioBuffer[2] === 0x67 &&
        audioBuffer[3] === 0x53
      ) {
        contentType = "audio/ogg";
      }
      // M4A/AAC signature
      else if (
        audioBuffer.length >= 8 &&
        audioBuffer[4] !== undefined &&
        audioBuffer[5] !== undefined &&
        audioBuffer[6] !== undefined &&
        audioBuffer[7] !== undefined &&
        audioBuffer[4] === 0x66 &&
        audioBuffer[5] === 0x74 &&
        audioBuffer[6] === 0x79 &&
        audioBuffer[7] === 0x70
      ) {
        contentType = "audio/mp4";
      }
    }

    console.log(
      `Serving audio: ${audioBuffer.length} bytes, type: ${contentType}`,
    );

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": audioBuffer.length.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("TTS API error:", error);
    return NextResponse.json(
      {
        error: t("tts_generation_failed"),
        fallback: true,
      },
      { status: 422 },
    );
  }
}
