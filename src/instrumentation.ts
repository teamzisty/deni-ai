export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }
  // Patching AbortController during `next build` prerender trips Cache
  // Components (`new Date()` / abort of the static shell).
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }
  const { installAbortDiagnostics } = await import("@/lib/abort-diagnostics");
  installAbortDiagnostics();
}
