# `react-hooks-js/immutability`

Validates against mutating props, state, and other values that [are immutable](https://react.dev/reference/rules/components-and-hooks-must-be-pure#props-and-state-are-immutable)

- **Category:** React Compiler
- **Severity:** error
- **Source:** eslint-plugin-react-hooks
- **Framework:** global
- **Enabled when:** eslint-plugin-react-hooks v6+ installed AND React Compiler detected in project
- **Documentation:** <https://react.dev/reference/eslint-plugin-react-hooks/lints/immutability>

## Validation prompt

Use this to decide whether a fired diagnostic is real or a false positive.

Fires on writes to values the compiler proves are immutable — props, useState values, useReducer state — via property assignment (state.x = v), in-place array methods (push, pop, splice, sort, reverse), or Object.assign(state, ...). False positive: the value is an Immer produce() draft (draft.x = v is legal inside the producer) or some other proxy that intentionally exposes mutable semantics.

## Fix prompt

Use this once validation confirms the diagnostic is real.

Always create a new container: setItems([...items, newItem]) or setUser({ ...user, name }) — spread at every nested level you change. For deep updates prefer useReducer with explicit immutable cases, or wrap producer code in Immer's produce(). React relies on reference identity (Object.is) to detect changes, so mutating the same array/object silently skips re-renders. See https://react.dev/reference/eslint-plugin-react-hooks/lints/immutability
