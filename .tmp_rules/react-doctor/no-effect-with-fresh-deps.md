# `react-doctor/no-effect-with-fresh-deps`

Move the constructed value into the hook body and depend on its primitive inputs, or memoize it with useMemo/useCallback so its reference is stable.

- **Category:** State & Effects
- **Severity:** error
- **Source:** oxlint-plugin-react-doctor
- **Framework:** global
- **Enabled when:** always
- **Documentation:** <https://react.dev/reference/react/useEffect#removing-unnecessary-object-dependencies>

## Validation prompt

Use this to decide whether a fired diagnostic is real or a false positive.

Fires on a hook in HOOKS_WITH_DEPS (useEffect, useLayoutEffect, useMemo, useCallback, also via React.useEffect) whose SECOND argument is an ArrayExpression containing an element that is, or resolves to, a freshly-allocated reference: a direct ObjectExpression, ArrayExpression, Arrow/FunctionExpression, JSXElement/JSXFragment, or NewExpression at the dep site; OR an Identifier whose binding is an UNCONDITIONAL VariableDeclarator init (const/let/var name = {...}/[...]/() => …/new …) in the same component scope. Such elements break the element-wise === (Object.is) comparison so the effect/memo re-runs every render. False positive: do NOT flag plain identifiers, member expressions like options.value, deps from useMemo/useCallback/useRef/useState/useReducer or any CallExpression including custom hooks (treated as opaque), bindings declared at module/Program scope (allocated once), destructuring or parameter DEFAULTS such as function List({ items = [] }) or const { config = {} } = props (the default only allocates when the source is undefined and can't be hoisted), spread elements [...arr], empty deps [], or effects with no deps array at all (running every render is intentional there).

## Fix prompt

Use this once validation confirms the diagnostic is real.

The flagged dep element is reallocated every render so its === comparison always fails and the hook fires each render. If the value is only used inside the hook, delete it from the dep array and construct it inside the hook body, depending instead on its primitive inputs (e.g. useEffect(() => { const config = { a, b }; … }, [a, b])). If it must be shared, stabilize its reference with const config = useMemo(() => ({ a, b }), [a, b]) or const handler = useCallback(() => …, [deps]) and depend on that, or hoist a truly-constant value to module scope. See https://react.dev/reference/react/useEffect#removing-unnecessary-object-dependencies
