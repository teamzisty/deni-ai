import { isDisposableEmail as checkDisposable } from "@deni-ai/disposable-email-domains";

export function isDisposableEmail(email: string): boolean {
  return checkDisposable(email);
}
