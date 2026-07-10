# `react-hooks-js/hooks`

Validates the rules of hooks

- **Category:** React Compiler
- **Severity:** error
- **Source:** eslint-plugin-react-hooks
- **Framework:** global
- **Enabled when:** eslint-plugin-react-hooks v6+ installed AND React Compiler detected in project
- **Documentation:** <https://react.dev/reference/eslint-plugin-react-hooks>

## Validation prompt

Use this to decide whether a fired diagnostic is real or a false positive.

Fires when a hook (useState, useEffect, useMemo, etc. — anything whose name matches use + UppercaseLetter) is called conditionally, inside a loop, after an early return, inside a callback/event handler, in an async function, in a class method, or at module top level. False positive: the use() hook IS allowed in conditionals and loops — it is the only hook with that exemption (and still cannot live in try/catch).

## Fix prompt

Use this once validation confirms the diagnostic is real.

Pull the hook to the top level of the component or custom hook, then move the condition inside the hook body: useEffect(() => { if (cond) doThing(); }, [cond]) rather than if (cond) useEffect(...). For conditional initial state, pass the conditional into useState's argument: useState(cond ? a : b). React relies on a fixed call order across renders to associate state with each hook slot. See https://react.dev/reference/eslint-plugin-react-hooks
