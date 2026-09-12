import { isAbortError } from "@/lib/chat-tools/helpers";

type QueryProbe = {
  at: string;
  sql: string;
  params: string;
};

type AbortProbe = {
  at: string;
  reason: string;
  stack: string;
};

const recentQueries: QueryProbe[] = [];
const recentAborts: AbortProbe[] = [];
const RING = 8;

let installed = false;

function pushRing<T>(list: T[], item: T) {
  list.push(item);
  if (list.length > RING) {
    list.shift();
  }
}

function trimStack(stack: string | undefined) {
  if (!stack) {
    return "(no stack)";
  }
  return stack
    .split("\n")
    .filter((line) => !line.includes("abort-diagnostics.ts"))
    .slice(0, 10)
    .join("\n");
}

function summarizeParams(params: unknown) {
  try {
    const text = JSON.stringify(params);
    return text.length > 400 ? `${text.slice(0, 400)}…` : text;
  } catch {
    return String(params);
  }
}

export function noteDbQuery(sql: string, params?: unknown) {
  pushRing(recentQueries, {
    at: new Date().toISOString(),
    sql: sql.replace(/\s+/g, " ").trim().slice(0, 500),
    params: summarizeParams(params),
  });
}

function noteAbortCall(reason: unknown) {
  pushRing(recentAborts, {
    at: new Date().toISOString(),
    reason: reason === undefined ? "" : String(reason),
    stack: trimStack(new Error("AbortController.abort()").stack),
  });
}

function logAbortDiagnostic(reason: unknown) {
  const error = reason as { name?: string; message?: string; code?: unknown };
  console.error(
    [
      "[abort-diagnostic] unhandled AbortError",
      `name=${error?.name ?? "AbortError"} code=${String(error?.code ?? "")} message=${error?.message ?? ""}`,
      recentAborts.length > 0
        ? `recent abort() calls:\n${recentAborts
            .map((item) => `  - ${item.at} reason=${JSON.stringify(item.reason)}\n${item.stack}`)
            .join("\n")}`
        : "recent abort() calls: (none captured in JS)",
      recentQueries.length > 0
        ? `recent db queries:\n${recentQueries
            .map((item) => `  - ${item.at} ${item.sql} params=${item.params}`)
            .join("\n")}`
        : "recent db queries: (none)",
    ].join("\n"),
  );
}

function installAbortCallProbe() {
  const proto = AbortController.prototype as AbortController & {
    abort: (reason?: unknown) => void;
  };
  if ((proto.abort as { __deniAbortProbe?: boolean }).__deniAbortProbe) {
    return;
  }
  const original = proto.abort;
  const patched = function abort(this: AbortController, reason?: unknown) {
    try {
      noteAbortCall(reason);
    } catch {
      // never block abort
    }
    return original.call(this, reason);
  };
  patched.__deniAbortProbe = true;
  proto.abort = patched;
}

function installRejectionFilter() {
  const handler: NodeJS.UnhandledRejectionListener = (reason) => {
    if (isAbortError(reason)) {
      logAbortDiagnostic(reason);
      return;
    }
    console.error("unhandledRejection:", reason);
  };

  process.removeAllListeners("unhandledRejection");
  process.on("unhandledRejection", handler);
}

export function installAbortDiagnostics() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }
  if (installed) {
    installRejectionFilter();
    return;
  }
  installed = true;
  installAbortCallProbe();
  installRejectionFilter();
  for (const delay of [0, 50, 200, 1000]) {
    setTimeout(installRejectionFilter, delay);
  }
}
