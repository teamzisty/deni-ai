export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") {
    return;
  }
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }
  const { installAbortDiagnostics } = await import("@/lib/abort-diagnostics");
  installAbortDiagnostics();
}
