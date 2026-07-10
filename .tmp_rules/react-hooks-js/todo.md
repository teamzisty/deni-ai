# `react-hooks-js/todo`

Unimplemented features

- **Category:** React Compiler
- **Severity:** error
- **Source:** eslint-plugin-react-hooks
- **Framework:** global
- **Enabled when:** eslint-plugin-react-hooks v6+ installed AND React Compiler detected in project
- **Documentation:** <https://react.dev/reference/eslint-plugin-react-hooks>

## Validation prompt

Use this to decide whether a fired diagnostic is real or a false positive.

Hint-severity diagnostic the Compiler emits when it bails on a feature it should support but has not yet implemented — not a code mistake, more of a 'Compiler cannot optimize this yet' notice. There is no rule-level true/false positive distinction: every diagnostic is a real Compiler limitation rather than a defect in your code.

## Fix prompt

Use this once validation confirms the diagnostic is real.

Refactor the affected code into a shape the Compiler supports today (often hoisting an inner function, splitting a giant component, or removing a dynamic pattern). If a workaround is not feasible, add a 'use no memo' directive at the top of the file so the Compiler skips it, and check the React Compiler issue tracker for an open ticket covering your pattern. See https://react.dev/reference/eslint-plugin-react-hooks
