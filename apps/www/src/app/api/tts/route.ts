import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "Google API key not configured" },
        { status: 500 }
      );
    }

    // Try multiple Gemini TTS API approaches
    let response;
    let audioData;
    
    // First try with newer API structure
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ 
            parts: [{ text }] 
          }],
          generationConfig: {
            responseModalities: ["AUDIO"]
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        audioData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      }
    } catch (error) {
      console.log("First API approach failed, trying alternative...");
    }

    // If first approach fails, try alternative structure
    if (!response?.ok || !audioData) {
      try {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ 
              parts: [{ text }] 
            }],
            generationConfig: {
              responseMimeType: "audio/mp3"
            }
          }),
        });

        if (response.ok) {
          const result = await response.json();
          audioData = result.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
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
        { error: "Using browser TTS fallback", fallback: true },
        { status: 422 }
      );
    }

    const audioBuffer = Buffer.from(audioData, "base64");
    
    // Detect audio format from first few bytes and set appropriate content type
    let contentType = "audio/wav";
    if (audioBuffer[0] === 0xFF && audioBuffer[1] === 0xFB) {
      contentType = "audio/mp3";
    } else if (audioBuffer[0] === 0x4F && audioBuffer[1] === 0x67) {
      contentType = "audio/ogg";
    }
    
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": audioBuffer.length.toString(),
        "Accept-Ranges": "bytes",
      },
    });
  } catch (error) {
    console.error("TTS API error:", error);
    return NextResponse.json(
      { error: "TTS generation failed, using browser fallback", fallback: true },
      { status: 422 }
    );
  }
}