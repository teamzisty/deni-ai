import type { UIMessage } from "ai";
import { z } from "zod";

export const ChatRequestSchema = z.object({
  id: z.string().min(1),
  messages: z
    .array(z.record(z.string(), z.unknown()))
    .transform((value) => value as unknown as UIMessage[])
    .optional(),
  model: z.string(),
  webSearch: z.boolean().optional(),
  reasoningEffort: z.enum(["none", "minimal", "low", "medium", "high", "xhigh", "max"]).optional(),
  video: z.boolean().optional(),
  image: z.boolean().optional(),
  deepResearch: z.boolean().optional(),
  responseStyle: z.enum(["retry", "detailed", "concise"]).optional(),
  forceWebSearch: z.boolean().optional(),
  additionalInstruction: z.string().trim().min(1).optional(),
});

type PendingMessageMetadata = {
  pending?: boolean;
  [key: string]: unknown;
};

export function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return true;
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "[::1]" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("169.254.") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local")
    ) {
      return true;
    }
    const match172 = hostname.match(/^172\.(\d+)\./);
    if (match172) {
      const second = Number.parseInt(match172[1], 10);
      if (second >= 16 && second <= 31) {
        return true;
      }
    }
    return false;
  } catch {
    return true;
  }
}

export function setPendingState(message: UIMessage, pending: boolean): UIMessage {
  const metadata =
    typeof message.metadata === "object" && message.metadata !== null
      ? ({ ...message.metadata } as PendingMessageMetadata)
      : ({} as PendingMessageMetadata);

  if (pending) {
    metadata.pending = true;
  } else {
    delete metadata.pending;
  }

  return {
    ...message,
    metadata,
  };
}
