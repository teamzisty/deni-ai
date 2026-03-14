import "server-only";

import { UTApi } from "uploadthing/server";
import { env } from "@/env";

let utapi: UTApi | null = null;

if (env.UPLOADTHING_TOKEN) {
  utapi = new UTApi();
}

/**
 * Upload a file to UploadThing.
 * Returns the public URL, or null if UploadThing is not configured.
 */
export async function uploadFile(file: File): Promise<string | null> {
  if (!utapi) return null;

  try {
    const response = await utapi.uploadFiles(file);

    if (response.error) {
      console.error("[upload] UploadThing error:", response.error);
      return null;
    }

    return response.data.ufsUrl;
  } catch (error) {
    console.error("[upload] Failed to upload file:", error);
    return null;
  }
}

/**
 * Upload a base64-encoded image to UploadThing.
 * Returns the public URL, or null if UploadThing is not configured.
 */
export async function uploadImage(
  base64Data: string,
  mimeType: string,
  filename?: string,
): Promise<string | null> {
  if (!utapi) return null;

  try {
    const buffer = Buffer.from(base64Data, "base64");
    const ext = mimeType.split("/")[1] ?? "png";
    const name = filename ?? `generated-${Date.now()}.${ext}`;
    const file = new File([buffer], name, { type: mimeType });
    return await uploadFile(file);
  } catch (error) {
    console.error("[upload] Failed to upload image:", error);
    return null;
  }
}
