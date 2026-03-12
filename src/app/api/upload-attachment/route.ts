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

  const url = await uploadFile(uploadedFile);
  if (!url) {
    return NextResponse.json({ error: "Attachment upload failed." }, { status: 500 });
  }

  return NextResponse.json({ url });
}
