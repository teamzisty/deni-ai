# Base UI migration completion

2026-07-11 — leftover sweep after wrappers were already on `@base-ui/react`.

## Changed

### Data-attribute selectors (Radix → Base UI)

- Collapsible **panel** content: `data-[state=open|closed]` → `data-open` / `data-closed`
- Collapsible **trigger** group styles: `group-data-[state=open]` → `group-data-panel-open`
- Collapsible **root** group styles (tool/sandbox): `group-data-open`
- Popover/Menu **triggers**: `data-[state=open]` → `data-popup-open`
- Tabs: `data-[state=active]` → `data-active`
- Field checkbox card: `has-data-checked`
- Files: ai-elements (chain-of-thought, reasoning, sources, stack-trace, task, tool, sandbox, schema-display, test-results, queue, web-preview), chat-composer, shared-chat-interface, field, sidebar

### Dependencies

- Removed unused: `radix-ui`, `@radix-ui/react-use-controllable-state`
- Kept `@radix-ui/react-tooltip` as peer for `@daveyplate/better-auth-ui`
- Transitive Radix remains via `cmdk`, `vaul`, better-auth-ui (intentional)

### Config

- `components.json` style: `new-york` → `base-nova` (future `shadcn add` delivers Base UI)

### Wrappers

- `button.tsx` → `@base-ui/react/button` (asChild maps to `render` + `nativeButton`)
- `select.tsx` `position` → `alignItemWithTrigger`
- `popover.tsx` `PopoverAnchor` inert passthrough (no Base UI Anchor)
- Prior fix: model selector max-height uses `--available-height`

### Left alone (by design)

- `command.tsx` (cmdk), `drawer.tsx` (vaul) — not Base UI
- `asChild` at call sites — still supported via `@/lib/base-ui-compat` `resolveRenderProps`
- Drawer `data-[state=open|closed]` — vaul/Radix attributes
- Sidebar custom `data-state={expanded|collapsed}`

## Verify by hand

1. Model selector: many models → scrolls, does not grow past viewport
2. Collapsible chevrons rotate on open (search results, tools, reasoning)
3. Popover/dropdown trigger open styles (model picker, sidebar menus)
4. Button links with `asChild` still navigate
5. Auth UI (`better-auth-ui`) still mounts
