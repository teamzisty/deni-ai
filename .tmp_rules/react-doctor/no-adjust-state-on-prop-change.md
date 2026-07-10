# `react-doctor/no-adjust-state-on-prop-change`

Disallow adjusting state in an effect when a prop changes.

- **Category:** State & Effects
- **Severity:** warn
- **Source:** eslint-plugin-react-you-might-not-need-an-effect
- **Framework:** global
- **Enabled when:** eslint-plugin-react-you-might-not-need-an-effect installed in project
- **Documentation:** <https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes>

## Validation prompt

Use this to decide whether a fired diagnostic is real or a false positive.

Fires when a useEffect's deps array contains an upstream prop AND the effect synchronously calls a state setter whose arguments do NOT also derive from that prop — i.e. the effect resets/adjusts state purely because a prop changed. False positive: the effect actually kicks off async work (fetch, debounce, subscription) whose later callback sets the state — the rule already requires the setter call to be synchronous.

## Fix prompt

Use this once validation confirms the diagnostic is real.

The adjustment reveals duplicated state. The fix is removing the duplication so no setter is needed — not moving the setter somewhere else. Ask: 'Why does this state need resetting? Because it duplicates something already knowable from props/state. How do I make it derive its own staleness?' Patterns: (A) Store context, derive validity. If the effect resets a boolean flag, store the discriminator instead of the flag: `const [failedUrl, setFailedUrl] = useState(null); const hasFailed = failedUrl === currentUrl;` — when currentUrl changes, hasFailed becomes false automatically. If the effect resets a collection (cursor stack, list, etc.), store which inputs produced it: `const items = state.forId === id ? state.items : DEFAULT;` — stale items are never returned. If the effect clears an override when fresh data arrives, store what the override was set for: `const override = entry?.forProp === prop ? entry.value : null;` — override evicts itself when prop updates. (B) Compute inline. If the effect sets state to a value computable from existing state/props, delete that state entirely and compute it: `return active ? phase : 0;` instead of setPhase(0). For transition/animation classes, derive from state comparisons: `const cls = text !== displayedText ? 'is-exit' : isEntering ? 'is-enter-start' : '';`. (C) For resetting ALL state in a subtree, use a key prop: `<Child key={userId} />`. Do NOT use the prevProps-in-state pattern (tracking a previous value to detect changes during render) — it preserves the duplicated state instead of eliminating it. See https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
