import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { trpc } from "@/lib/trpc/react";

type NewChatOptions = {
  projectId?: string | null;
};

/**
 * Start a new chat by generating a client-side id and navigating immediately.
 * The chat page upserts the DB row on first render — no round-trip needed.
 * Optimistically prepends the new chat to the sidebar list cache.
 */
export function useNewChat() {
  const { push } = useRouter();
  const utils = trpc.useUtils();

  return useCallback(
    (options?: NewChatOptions): string => {
      const id = crypto.randomUUID();
      const projectId = options?.projectId ?? null;
      const now = new Date();

      utils.chat.getChats.setData(undefined, (old) => [
        {
          id,
          title: "New Chat",
          projectId,
          pinned: false,
          folder: null,
          tags: [],
          created_at: now,
          updated_at: now,
        },
        ...(old ?? []),
      ]);

      const url = projectId
        ? `/chat/${id}?projectId=${encodeURIComponent(projectId)}`
        : `/chat/${id}`;
      push(url);

      return id;
    },
    [push, utils.chat.getChats],
  );
}
