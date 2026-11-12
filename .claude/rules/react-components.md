---
description: React components — the compiler owns memoization, functions hoist out, the style prop carries variables
paths:
  - "**/*.tsx"
  - "apps/game/src/**/*.ts"
---

# React components

## Memoization: the compiler owns it

**The React Compiler is enabled** (`react({ compiler })` in
`apps/game/vite.config.ts`, running on Oxc). Inside a component the default is a plain
`const arrow = () => …` and a plain `const value = compute()`: the compiler
already caches every value and callback on dependencies it infers itself, so a
hand-written `useMemo`, `useCallback` or `React.memo` only adds an array to keep
correct.

**The one reason left to write `useCallback`** is a function that is a
**dependency of a `useEffect`**, and anything that function depends on. A fresh
identity on every render re-runs the effect on every render — in
`use-room-socket.ts` that means tearing down and reopening the WebSocket
continuously, which is a correctness bug rather than a slow one.

## A value from outside is an Effect Event, not a ref

Where the value comes _from outside_ the hook — a callback passed in as a prop,
or something that moves on its own like the clock estimate — reach for
**`useEffectEvent`** rather than a latest-ref, and never demand a stable identity
from every caller. It always runs the latest closure, which is what
`use-room-socket.ts` does with `onFrame`: the socket is built once and still
forwards to whatever the current render handed it.

**It is not a stable identity, and that is the trap.** React 19.3's `updateEvent`
returns a _fresh function over a stable ref_ on every render. So an Effect Event
is fine inside the Effect that owns it — where identity is never read — and
wrong the moment it leaves: handed out of a hook, or listed in a `useCallback`'s
dependencies, it changes every render and drags whatever holds it along.
`useSettledStatus` keeps the latest-ref pattern for that reason, written down at
the ref. Two more rules: an Effect Event is **never a dependency**, and it
**cannot be called during render** — the one thing React guards at runtime.

## A function with no closure lives at module scope

If a body does not reference props, state, refs, context or the return value of
a hook, define it outside the component. It is computed once per process where
the compiler would cache it once per render, and it keeps a dependency array
from ever being written about it.

That includes an inline arrow in JSX: `onPress={() => reloadPage()}` is a new
function on every render for a body that closes over nothing — pass
`onPress={reloadPage}`. A DOM method is never passed bare
(`onPress={window.location.reload}`): detached from its object it throws
`Illegal invocation`, and it would receive the press event as its argument.

## Contexts

`createSafeContext` from `@adrienlcp/react` returns
`[Context, useSafe, useOptional]` — `useSafe()` throws outside the provider,
`useOptional()` returns `undefined`.

## An `isInvalid` field stops the form submitting, natively

`TextField` inside a react-aria `Form` sets the input's **native** custom
validity from `isInvalid`. A controlled error that stays on screen therefore
leaves `form.checkValidity()` false and `requestSubmit()` a silent no-op: the
button looks alive, the press does nothing, and nothing is logged. A taken
nickname is refused on purpose and the player is meant to try another, which
they could not.

**Tie the refusal to the value it was given for**, so any other draft drops it,
which is what a form should do anyway:

```tsx
const isRefused = draft.trim() === refusedNickname   // another name submits again
```

It shows one way only: read `input.validationMessage` in a browser after a
refusal, then again after typing.

## The `style` prop carries CSS custom properties, and nothing else

Every value lives in the `.sass` beside the component. The one legitimate use of
`style` is a property computed at runtime and consumed through `var(--foo)`:

```tsx
<div className='cover' style={{ '--cover-url': `url(${track.coverUrl})` }}>
```

A wrapper `<div>` added to receive a layout style is two faults at once — apply
the layout to the existing root, or to the parent.

## Read what a `useCallback` closes over before handing the view out

The compiler treats every call that receives `view` — `hostActionsProps(view)`,
`setupProps(view)` — as one that may mutate it. A value derived from `view`
that a `useCallback` depends on and that is _read again after_ such a call
makes it give up the whole component (`PreserveManualMemo`), and the build
only warns. Compute what reads it (the seated host's round, in
`host-console-page.tsx`) before those calls, and grep the build output for
`react-compiler` after touching a large component.

## A state derived during render has no other no-op setter

`if (next !== shown) { setLeaving(shown); setShown(next) }` — the leaving
state an exit plays from — is lost when an event elsewhere sets the same
state to the value it already holds. React keeps that no-op update queued
at its own priority; a higher-priority render then derives on top of it
without moving the hook's base, and the next render replays the queue from
the base and lands back on the no-op's value. The undo bar vanished at once
instead of playing `page-leave`, because the _entry's_ `animationend` had
already set `leaving` to `null`.

So the setter that ends an exit is attached only while it is leaving
(`onAnimationEnd={leaving === null ? undefined : …}`), checks
`event.target === event.currentTarget` so a child's animation does not end
it, and a handler shared by settled rows guards against setting what is
already there (`use-row-arrivals.ts`). A value kept drawn until its exit
ends is `useLeavingValue`, which owns that guard — `LeavesInPlace` and the
arrival notice are built on it.

## `getAnimations()` is paid per animation in the document

Chromium answers `element.getAnimations()` by walking every animation on the
page, not the element's. Inside a view transition a hundred-case board holds
about 520, and eight calls from a `ResizeObserver` froze the side panel's fold
for two seconds. An animation the code starts itself is kept where it starts
(`use-rows-travel.ts`, `travelsOf`); `getAnimations` stays for a one-off read,
never in an observer or a handler a layout move can fire.

## A view transition is paid per named element, every frame

Each `view-transition-name` is a snapshot captured before the move and a
group whose size is eased through style and layout on every frame. A
hundred cases named one by one cost the side panel's fold 55–85ms a frame
and 300ms before it moved, in a production build; the board named once costs
3ms. A many-piece layout moves as one picture (`board-cases`), and a piece
travels alone only on the move where its travel is the point (`board-relaid`).
`.playwright-mcp/fold-perf.mjs` times a fold.

## Related

- [`design-system.md`](design-system.md) — wrapping a react-aria primitive
- [`../../docs/component-shape.md`](../../docs/component-shape.md) — when a
  component is worth splitting, what stays long, and why the compiler runs on
  Oxc
