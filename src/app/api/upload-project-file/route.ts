import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile } from "@/lib/upload";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/markdown",
]);

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

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

  if (!ALLOWED_TYPES.has(uploadedFile.type)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });
  }

  if (uploadedFile.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 20 MB)." }, { status: 413 });
  }

  let url: string | null;
  try {
    url = await uploadFile(uploadedFile);
  } catch (error) {
    console.error("Project file upload failed", error);
    return NextResponse.json({ error: "File upload failed." }, { status: 500 });
  }

  if (!url) {
    return NextResponse.json({ error: "File upload failed." }, { status: 500 });
  }

  return NextResponse.json({ url, size: uploadedFile.size, mimeType: uploadedFile.type });
}
