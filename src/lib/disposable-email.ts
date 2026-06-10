import { isDisposableEmail as checkDisposable } from "disposable-email-domains-js";

export function isDisposableEmail(email: string): boolean {
  return checkDisposable(email);
}
