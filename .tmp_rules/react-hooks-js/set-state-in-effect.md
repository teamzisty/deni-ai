# `react-hooks-js/set-state-in-effect`

Validates against calling setState synchronously in an effect. This can indicate non-local derived data, a derived event pattern, or improper external data synchronization.

- **Category:** React Compiler
- **Severity:** error
- **Source:** eslint-plugin-react-hooks
- **Framework:** global
- **Enabled when:** eslint-plugin-react-hooks v6+ installed AND React Compiler detected in project
- **Documentation:** <https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect>

## Validation prompt

Use this to decide whether a fired diagnostic is real or a false positive.

Fires on a synchronous setState call inside useEffect's body — the textbook 'mirror prop into state on change' pattern that forces a wasted second render before paint. False positive: useLayoutEffect that reads ref.getBoundingClientRect() (or another post-layout DOM measurement) and stores the result in state — the value cannot exist until after layout commits, and useLayoutEffect runs the extra render before paint.

## Fix prompt

Use this once validation confirms the diagnostic is real.

Derive the value during render and drop the state + effect entirely: const filtered = items.filter(...). For prop-driven full resets, pass key={prop} to the child to remount. For DOM-measured values, keep the setState but use useLayoutEffect so the extra render happens before the browser paints (avoiding a visible flash). See https://react.dev/reference/eslint-plugin-react-hooks/lints/set-state-in-effect
