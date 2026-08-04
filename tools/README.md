# tools

Internal scripts for maintainers. Run from the **repository root** so Bun loads root env files.

| Script                  | npm script                      | Purpose                                        |
| ----------------------- | ------------------------------- | ---------------------------------------------- |
| `codename-generator.ts` | `bun run tools:codename`        | Generate Deni AI version codenames             |
| `commit.ts`             | `bun run tools:commit`          | Conventional commit messages via OpenRouter    |
| `purge-anonymous.ts`    | `bun run tools:purge-anonymous` | Purge anonymous users (uses `.env.production`) |

## Commit helper

Requires `OPENROUTER_API_KEY`. Generates a conventional commit message from the staged (or selected) diff. Creates a commit only when `--commit` is passed.

```sh
bun run tools:commit --it
bun run tools:commit --check
bun run tools:commit --all
bun run tools:commit --all --commit
bun run tools:commit --all --generate-description --commit
bun run tools:commit --all --description "Explain the checkout flow changes" --commit
```

- `--it` → `--all --generate-description --commit`
- `--check` → `--all --generate-description`
- `--description` supplies the commit body yourself

## Codename generator

```sh
bun run tools:codename
```

## Purge anonymous users

Production maintenance. Loads `.env.production` via the package script. Prefer reviewing the script before running against live data.

```sh
bun run tools:purge-anonymous
```
