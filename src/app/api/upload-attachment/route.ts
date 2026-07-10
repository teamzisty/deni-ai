import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/upload";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const uploadedFile = formData.get("file");

  if (!(uploadedFile instanceof File)) {
    return NextResponse.json({ error: "File is required." }, { status: 400 });
  }

  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
  const maxBytes = 10 * 1024 * 1024;

  if (!allowedTypes.has(uploadedFile.type)) {
    return NextResponse.json({ error: "Unsupported attachment type." }, { status: 415 });
  }

  if (uploadedFile.size > maxBytes) {
    return NextResponse.json({ error: "Attachment is too large." }, { status: 413 });
  }

  let url: string | null = null;
  try {
    url = await uploadFile(uploadedFile);
  } catch (error) {
    console.error("Attachment upload failed", error);
  }

  // When UploadThing is not configured (or the upload failed), fall back to an
  // inline base64 data URL so attachments still work. Keep the fallback smaller
  // than maxBytes so chat history / response payloads stay within limits.
  const maxDataUrlBytes = 512 * 1024;
  if (!url) {
    if (uploadedFile.size > maxDataUrlBytes) {
      return NextResponse.json(
        {
          error:
            "Attachment upload failed. Inline fallback is limited to 512KB when storage is unavailable.",
        },
        { status: 500 },
      );
    }
    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      url = `data:${uploadedFile.type};base64,${base64}`;
    } catch (error) {
      console.error("Attachment base64 fallback failed", error);
      return NextResponse.json({ error: "Attachment upload failed." }, { status: 500 });
    }
  }

  return NextResponse.json({ url });
}
