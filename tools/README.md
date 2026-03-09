# tools

**Scripts**:

- codename-generator.ts: generates deni ai version codenames
- openrouter-commit.ts: generates conventional commit messages with OpenRouter and can create the commit

## OpenRouter commit tool

Run from the repository root so Bun loads the root `.env` files:

```sh
bun run tools:commit --it
bun run tools:commit --check
bun run tools:commit --all
bun run tools:commit --all --commit
bun run tools:commit --all --generate-description --commit
bun run tools:commit --all --description "Explain the checkout flow changes" --commit
```

The tool reads `OPENROUTER_API_KEY` from the environment, generates a conventional commit message from the staged diff, and only creates the commit when `--commit` is provided. `--it` is a shortcut for `--all --generate-description --commit`, and `--check` is a shortcut for `--all --generate-description`. Use `--description` to supply the body yourself.
