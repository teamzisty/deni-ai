import type { UIMessage } from "ai";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useRef } from "react";

type PendingMetadata = {
  branchGroupId?: string;
  [key: string]: unknown;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RegenOptions = { body?: any; messageId?: string };

interface UseChatBranchesOptions {
  messages: UIMessage[];
  setMessages: (msgs: UIMessage[] | ((prev: UIMessage[]) => UIMessage[])) => void;
  regenerate: (options?: RegenOptions) => void;
}

export interface BranchGroup {
  type: "branch";
  groupId: string;
  messages: UIMessage[];
}

export interface SingleMessage {
  type: "single";
  message: UIMessage;
}

export type GroupedMessage = BranchGroup | SingleMessage;

function getBranchGroupId(message: UIMessage): string | undefined {
  return (message.metadata as PendingMetadata | undefined)?.branchGroupId;
}

function withBranchGroupId(message: UIMessage, groupId: string): UIMessage {
  return {
    ...message,
    metadata: { ...(message.metadata as PendingMetadata | undefined), branchGroupId: groupId },
  };
}

export function groupMessages(messages: UIMessage[]): GroupedMessage[] {
  const result: GroupedMessage[] = [];
  let i = 0;

  while (i < messages.length) {
    const msg = messages[i];
    const groupId = getBranchGroupId(msg);

    if (groupId && msg.role === "assistant") {
      // Collect all consecutive assistant messages with the same groupId
      const branchMsgs: UIMessage[] = [msg];
      let j = i + 1;
      while (
        j < messages.length &&
        messages[j].role === "assistant" &&
        getBranchGroupId(messages[j]) === groupId
      ) {
        branchMsgs.push(messages[j]);
        j++;
      }
      result.push({ type: "branch", groupId, messages: branchMsgs });
      i = j;
    } else {
      result.push({ type: "single", message: msg });
      i++;
    }
  }

  return result;
}

export function useChatBranches({ messages, setMessages, regenerate }: UseChatBranchesOptions) {
  // Stores the original message and groupId during an active regeneration
  const pendingBranchRef = useRef<{
    groupId: string;
    originalMessage: UIMessage;
    messagesBeforeRegen: UIMessage[];
  } | null>(null);

  const prevStatusRef = useRef<"idle" | "pending">("idle");

  // After regeneration completes: the SDK has replaced the last assistant message.
  // We need to tag it with the branchGroupId and re-insert the original.
  useEffect(() => {
    const pending = pendingBranchRef.current;
    if (!pending) return;

    const lastMsg = messages.at(-1);
    if (!lastMsg || lastMsg.role !== "assistant") return;

    // If the last message already has our groupId, we're done
    if (getBranchGroupId(lastMsg) === pending.groupId) return;

    // The SDK has emitted a new assistant message (no branchGroupId).
    // Tag it and insert the saved original before it.
    const base = pending.messagesBeforeRegen;
    const originalTagged = withBranchGroupId(pending.originalMessage, pending.groupId);
    const newTagged = withBranchGroupId(lastMsg, pending.groupId);

    setMessages([...base, originalTagged, newTagged]);
    pendingBranchRef.current = null;
    prevStatusRef.current = "idle";
  }, [messages, setMessages]);

  const handleRegenerate = useCallback(
    (options?: RegenOptions) => {
      // Find the last assistant message
      const lastAssistantIdx = [...messages].map((m) => m.role).lastIndexOf("assistant");
      if (lastAssistantIdx === -1) {
        regenerate(options);
        return;
      }

      const lastAssistant = messages[lastAssistantIdx];

      // Determine or reuse the branchGroupId
      const existingGroupId = getBranchGroupId(lastAssistant);
      const groupId = existingGroupId ?? nanoid(8);

      // Save state before SDK mutates it
      pendingBranchRef.current = {
        groupId,
        originalMessage: lastAssistant,
        // Keep everything up to (but not including) the last assistant message
        messagesBeforeRegen: messages.slice(0, lastAssistantIdx),
      };
      prevStatusRef.current = "pending";

      regenerate(options);
    },
    [messages, regenerate],
  );

  const groupedMessages = groupMessages(messages);

  return { handleRegenerate, groupedMessages };
}
