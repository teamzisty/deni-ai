# `react-doctor/jsx-key`

- **Category:** Correctness
- **Severity:** error
- **Source:** oxlint-builtin:react
- **Framework:** global
- **Enabled when:** always (unless customRulesOnly=true)
- **Documentation:** <https://oxc.rs/docs/guide/usage/linter/rules/react/jsx-key.html>

## Validation prompt

Use this to decide whether a fired diagnostic is real or a false positive.

Fires when a JSXElement sits at the TOP LEVEL of an array literal, or is the (implicit or explicit) return of a '.map'/'.flatMap'/'Array.from' callback, and lacks a 'key' attribute (oxc also flags 'key' placed AFTER a '{...spread}', and, when enabled, duplicate sibling keys). Confirm REAL only when those produced elements actually land as ADJACENT SIBLINGS in a rendered list — the classic tell is '{items.map(i => <Row/>)}' embedded directly in JSX children, an array rendered inline ('{[<A/>,<B/>].filter(...)}'), or an array/'children' passed to a list renderer where neighboring siblings ALREADY carry 'key' (e.g. '<Accordion items={[<X/>, <Y key="..."/>]}/>'); a missing key among keyed siblings is a true bug. SUPPRESS as false positive when the elements are NOT reconciled as a sibling list: (a) the mapped array is transformed downstream so each element is consumed singly — e.g. its result is '.map'ped again into data objects like '{header: el, content: ...}', wrapped one-per-record, or returned from a getter that a caller re-maps (e.g. a getter that returns mapped elements which a caller then re-maps into data objects); (b) the element is one slot of a config/tuple row destructured by position — '[ENUM, <Label/>]', 'Map' entries '[[k, <X/>], ...]', or a JSX value assigned to an object property ('description: [<>...</>]', 'messages: [<Foo/>]') that is read by index/key, never iterated as siblings; (c) a single-element render prop / render slot invoked once. The rule reports on STRUCTURE alone and cannot see these downstream transforms, so trace where the array is consumed before confirming. Shorthand '<></>' is intentionally NOT reported by react-doctor.

## Fix prompt

Use this once validation confirms the diagnostic is real.

Principle: a 'key' is needed only when these elements render as adjacent siblings, and it must be a STABLE per-item identity, not position. (A) Direct list — add a domain-stable key from the item: 'items.map(item => <Row key={item.id} item={item}/>)'; compose when no single field is unique: 'key={`${row.type}-${row.id}`}'. (B) Array literal of siblings — give EACH element its own stable key and keep them consistent with siblings that already have one ('[<A key="a"/>, <B key="b"/>]'); for a conditional slot, 'cond ? <X key="x"/> : <Y key="y"/>'. (C) Fragment as the list item — you must switch from shorthand to 'import { Fragment } from "react"' and put the key on it: 'items.map(i => <Fragment key={i.id}>...</Fragment>)', because '<>' cannot carry a key. (D) key-after-spread diagnostic — only reorder: place 'key' BEFORE any '{...spread}' ('<Row key={i.id} {...props}/>') so the JSX transform can't have the spread overwrite/drop it; do not otherwise change the element. (E) duplicate-key diagnostic — make each sibling key unique (often the index is being reused; replace with a real id). ANTI-PATTERNS: do NOT reach for the array 'index' as key when items can reorder, filter, or insert — it silently corrupts state/focus across re-renders; index is acceptable only for a static, append-only, never-reordered list. Do NOT add a key just to silence the lint when the array is actually transformed into data objects or destructured tuples (see validation) — that key is dead and the fix is to suppress, not annotate. See https://oxc.rs/docs/guide/usage/linter/rules/react/jsx-key and https://react.dev/learn/rendering-lists
