// Re-export from the lib directory
export { useUploadThing } from "@/lib/uploadthing";

// Stub for uploadResponse type
export interface uploadResponse {
  url?: string;
  key?: string;
  name?: string;
  size?: number;
  status?: string;
  data?: {
    url: string;
  };
  error?: {
    message: string;
    code: string;
  };
}
