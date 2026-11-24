---
description: Names first — a fact goes in a name; a comment only for a constraint the code cannot say; JSDoc documents what a caller relies on
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.sass"
  - "**/*.css"
---

# Comments: names first

A fact about the code goes in a name: a constant, a function, a type, a test.
A `//` is for a constraint the code cannot say — an unusual business rule, a
value another module depends on, an upstream quirk or worked-around bug, a
decision whose cheaper-looking alternative is wrong. One or two tight lines.

## JSDoc is documentation

- **A `/** … */` on an export, a component, a prop or a type is welcome**: it
  shows on hover and states the contract a caller relies on — enumerate union
  values, state the default, note behaviour the type cannot express. Every prop
  of a `Props` type carries one that adds information. Rewrite it when the
  symbol changes.
- On an internal helper, a doc block is a comment and meets the bar above.

## Stylesheets

- **`///` SassDoc on a pure module's `@mixin` or `@function`**: what it is for,
  what it demands of the element, what it degrades to.
- **The first line of a style module names its kind** — side-effect or pure
  (`sass-architecture.md`).
- **A `//` on a declaration** names a browser bug, a constraint another rule
  depends on, or why the obvious value is wrong. Meaning lives in selector and
  token names.
- **A measurement or a design decision** goes to `apps/game/DESIGN.md`.
