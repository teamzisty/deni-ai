import { isAbortError } from "@/lib/chat-tools/helpers";

/**
 * Bun + Cache Components + aborted fetch (prefetch, chat stop, search timeout)
 * rejects AbortError from native async_hooks. Next logs each as
 * `unhandledRejection` even when the awaited fetch was already caught.
 * Swallow only AbortError; forward everything else to Next's handlers.
 */
const forwarded: NodeJS.UnhandledRejectionListener[] = [];
const installedFilters = new WeakSet<NodeJS.UnhandledRejectionListener>();

function installAbortRejectionFilter() {
  for (const listener of process.listeners("unhandledRejection")) {
    if (!installedFilters.has(listener) && !forwarded.includes(listener)) {
      forwarded.push(listener);
    }
  }

  process.removeAllListeners("unhandledRejection");

  const filter: NodeJS.UnhandledRejectionListener = (reason, promise) => {
    if (isAbortError(reason)) {
      return;
    }
    for (const listener of forwarded) {
      listener(reason, promise);
    }
  };
  installedFilters.add(filter);
  process.on("unhandledRejection", filter);
}

export function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }

  installAbortRejectionFilter();
  setTimeout(installAbortRejectionFilter, 0);
  setTimeout(installAbortRejectionFilter, 100);
}
