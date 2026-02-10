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
