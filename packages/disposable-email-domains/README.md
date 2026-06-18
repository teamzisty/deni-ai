# @deni-ai/disposable-email-domains

Local (non-published) workspace package that bundles the disposable email domain
blocklist from
[disposable-email-domains/disposable-email-domains](https://github.com/disposable-email-domains/disposable-email-domains).

The domain list (`data/domains.json`) is the upstream **blocklist** minus the
upstream **allowlist**, deduplicated and sorted.

## Usage

```ts
import { isDisposableEmail } from "@deni-ai/disposable-email-domains";

isDisposableEmail("foo@mailinator.com"); // true
```

Also exported: `isDisposableDomain(domain)` and the `disposableDomains` set.

## Refreshing the domain list

```bash
# from the repo root
bun run disposable:refresh

# or from this package
bun run refresh
```

This re-fetches the latest lists from the upstream repo and rewrites
`data/domains.json`. Commit the updated file.
