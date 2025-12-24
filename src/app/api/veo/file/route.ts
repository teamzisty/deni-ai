import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/env";
import { auth } from "@/lib/auth";

const ALLOWED_HOSTS = new Set(["generativelanguage.googleapis.com"]);

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const uri = searchParams.get("uri");

  if (!uri) {
    return NextResponse.json({ error: "Missing uri." }, { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(uri);
  } catch {
    return NextResponse.json({ error: "Invalid uri." }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsedUrl.host)) {
    return NextResponse.json(
      { error: "Unsupported uri host." },
      { status: 400 },
    );
  }

  const response = await fetch(parsedUrl.toString(), {
    headers: {
      "x-goog-api-key": env.GOOGLE_GENERATIVE_AI_API_KEY,
    },
  });

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
