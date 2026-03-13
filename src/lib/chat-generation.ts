import "server-only";

type ActiveGeneration = {
  userId: string;
  abortController: AbortController;
};

const activeGenerations = new Map<string, ActiveGeneration>();

export function startChatGeneration(chatId: string, userId: string) {
  activeGenerations.get(chatId)?.abortController.abort("replaced");

  const abortController = new AbortController();
  activeGenerations.set(chatId, { userId, abortController });

  return abortController;
}

export function stopChatGeneration(chatId: string, userId: string) {
  const activeGeneration = activeGenerations.get(chatId);
  if (!activeGeneration || activeGeneration.userId !== userId) {
    return false;
  }

  activeGeneration.abortController.abort("stopped");
  activeGenerations.delete(chatId);
  return true;
}

export function clearChatGeneration(chatId: string, abortController: AbortController) {
  const activeGeneration = activeGenerations.get(chatId);
  if (activeGeneration?.abortController !== abortController) {
    return;
  }

  activeGenerations.delete(chatId);
}
