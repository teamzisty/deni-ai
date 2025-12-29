import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/videos:generate",
    {
      headers: {
        "x-goog-api-key": env.GOOGLE_GENERATIVE_AI_API_KEY,
      },
    },
  );

  if (!response.ok) {
    let message = "Failed to download video.";
    try {
      const errorJson = (await response.json()) as {
        error?: { message?: string };
      };
      message = errorJson?.error?.message ?? message;
    } catch {
      message = response.statusText || message;
    }
    return NextResponse.json({ error: message }, { status: response.status });
  }

  const contentType = response.headers.get("content-type") ?? "video/mp4";
  const contentLength = response.headers.get("content-length");

  return new NextResponse(response.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      ...(contentLength ? { "Content-Length": contentLength } : {}),
      "Cache-Control": "no-store",
    },
  });
}
