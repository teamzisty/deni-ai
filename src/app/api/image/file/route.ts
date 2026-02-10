import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data");
  const mimeType = searchParams.get("mimeType") ?? "image/png";

  // Only allow safe image MIME types to prevent content-type spoofing (e.g. text/html or SVG-based XSS)
  const ALLOWED_MIME_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "image/avif",
  ]);
  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json({ error: "Invalid MIME type." }, { status: 400 });
  }

  if (!data) {
    return NextResponse.json({ error: "Missing data parameter." }, { status: 400 });
  }

  try {
    const imageBuffer = Buffer.from(data, "base64");

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to decode image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
