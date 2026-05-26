import disposableDomains from "disposable-email-domains";
import wildcardDomains from "disposable-email-domains/wildcard.json";

const disposableSet = new Set<string>((disposableDomains as string[]).map((d) => d.toLowerCase()));
const wildcardList = (wildcardDomains as string[]).map((d) => d.toLowerCase());

export function isDisposableEmail(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at === -1) return false;
  const domain = email
    .slice(at + 1)
    .toLowerCase()
    .trim();
  if (!domain) return false;
  if (disposableSet.has(domain)) return true;
  return wildcardList.some((suffix) => domain === suffix || domain.endsWith(`.${suffix}`));
}
