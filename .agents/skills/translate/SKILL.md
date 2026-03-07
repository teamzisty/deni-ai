---
name: translate
description: Sync `messages/en.json` and `messages/ja.json` for this repository. Use when the user asks to update translations, fill missing Japanese strings, or remove stale i18n keys. Run `bun run build` before reading translations, then add missing Japanese entries, fill empty values, remove stale keys, preserve key order from `en.json`, and keep placeholders, ICU syntax, and brand names unchanged.
---

Sync translations between `messages/en.json` and `messages/ja.json`.

1. Run `bun run build` before reading the translation files so extracted messages are current.
2. Read `messages/en.json` and `messages/ja.json`.
3. Add any keys present in `en.json` but missing in `ja.json`.
4. Fill any `ja.json` values that are empty strings using natural Japanese.
5. Remove keys from `ja.json` that no longer exist in `en.json`.
6. Preserve the same key order as `en.json`.
7. Keep brand names untranslated.
8. Keep placeholders such as `{count}`, `{name}`, and `{date}` intact.
9. Keep ICU plural syntax intact.
