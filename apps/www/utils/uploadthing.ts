import { generateReactHelpers } from "@uploadthing/react";
import { OurFileRouter } from "@/app/api/uploadthing/core";
export const { useUploadThing } = generateReactHelpers<OurFileRouter>();

export interface uploadResponse {
  status: "success" | "error";
  error?: {
    message: string;
    code: string;
    error?: Error;
  };
  data?: {
    url: string;
  };
}
