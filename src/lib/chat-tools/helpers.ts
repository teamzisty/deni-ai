export function extractVeoErrorMessage(responseData: unknown, fallback: string): string {
  if (typeof responseData === "object" && responseData !== null) {
    const message = (responseData as { error?: { message?: string } }).error?.message;
    return message || fallback;
  }
  return fallback;
}

export function createAbortError() {
  if (typeof DOMException !== "undefined") {
    return new DOMException("The operation was aborted.", "AbortError");
  }
  return new Error("operation aborted");
}

export function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

/** Abort after `timeoutMs`, and cancel the timer so a finished run cannot reject later. */
export async function withDeadline<T>(
  timeoutMs: number,
  parent: AbortSignal | undefined,
  run: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  parent?.addEventListener("abort", onAbort);

  try {
    throwIfAborted(parent);
    return await run(controller.signal);
  } finally {
    clearTimeout(timeoutId);
    parent?.removeEventListener("abort", onAbort);
  }
}
