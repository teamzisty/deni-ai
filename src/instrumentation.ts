import { installAbortDiagnostics } from "@/lib/abort-diagnostics";

export function register() {
  installAbortDiagnostics();
}
