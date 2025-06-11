// Simple token estimation utility
// This is a rough approximation - for production, consider using tiktoken or similar library

export function estimateTokenCount(text: string): number {
  // Simple estimation: ~4 characters per token for English text
  // This is a rough approximation and may not be accurate for all languages
  const averageCharsPerToken = 4;
  return Math.ceil(text.length / averageCharsPerToken);
}

export function calculateContextUsage(
  messages: any[],
  maxContextWindow: number,
): {
  totalTokens: number;
  percentage: number;
  isNearLimit: boolean;
} {
  let totalTokens = 0;

  // Calculate tokens for all messages
  messages.forEach((message) => {
    if (message.content) {
      totalTokens += estimateTokenCount(message.content);
    }

    // Add extra tokens for system prompts, tool calls, etc.
    if (message.role === "system") {
      totalTokens += 50; // Additional overhead for system messages
    }

    if (message.tool_calls || message.experimental_attachments) {
      totalTokens += 100; // Additional overhead for tool calls/attachments
    }
  });

  // Add some overhead for the conversation structure
  totalTokens += messages.length * 10;

  const percentage = Math.min((totalTokens / maxContextWindow) * 100, 100);
  const isNearLimit = percentage > 80; // Consider 80% as "near limit"

  return {
    totalTokens,
    percentage,
    isNearLimit,
  };
}

export function formatTokenCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}
