Sync translations between en.json and ja.json.

1. Read `messages/en.json` and `messages/ja.json`
2. Find any keys present in en.json but missing in ja.json
3. For each missing key, translate the English value to natural Japanese and add it to ja.json
4. Find any keys present in ja.json but NOT in en.json (stale keys) and remove them
5. Ensure both files have the same set of keys
6. Keep brand names (Deni AI, Flixa, Pro, Plus, Max Mode, BYOK, Stripe, etc.) untranslated
7. Keep placeholder tokens like `{count}`, `{name}`, `{date}` intact
8. Keep ICU plural syntax intact (e.g. `{count, plural, one {#} other {#}}`)
9. Write the updated ja.json preserving the same key order as en.json
