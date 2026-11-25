# Browser support

The floor is **Chrome 87, Edge 88, Firefox 78 and Safari 14.1** — a smart TV
of 2020 among them, whose browser ran our JavaScript and showed the error
screen in Times on white. Three pieces hold it, and each leaves a current
browser untouched:

- **Syntax** is lowered by Oxc to `SUPPORTED_BROWSERS` (`build.target` in
  `apps/game/vite.config.ts`). The entry has no top-level `await`, which
  Chrome 89 and Safari 15 are the first to run. Putting one back also folds
  every chunk the entry shares with a route into one: measured at 101 chunks
  against 76, for the same bytes on the first load.
- **Built-ins** the bundle calls and the floor lacks — `toSorted` and its
  siblings, `at`, `findLast`, `Object.hasOwn`, `AbortSignal.timeout`,
  `URL.canParse`, `checkVisibility` — are defined, where missing, by
  `src/infrastructure/polyfills.ts`, the entry's first import. Oxc adds none.
  A new built-in newer than the floor joins it; grep the built
  `dist/assets/*.js` for its name to find out whether a dependency calls it
  too. A selector handed to `querySelector` throws where `:has()`,
  `:nth-child(… of …)` or `:is()` is not parsed, so none is used there.
- **Stylesheets** keep `build.cssTarget` at Vite's own baseline, so the CSS a
  current browser reads is byte for byte what it was. A browser that cannot
  `color-mix()` — before Chrome 111 and Safari 16.2 — reads none of it: the
  tokens are `oklch()` and `color-mix()`, and before Chrome 99 every
  `@layer` block, which is every rule here, is dropped whole. The script in
  `index.html`'s head hands such a browser the `.legacy.css` copy of each
  stylesheet, written by `scripts/legacy-stylesheets.ts` after the build:
  its layers flattened into specificity (each layer lifted by `:not(#\#)`
  above the most ids the one below carries), `oklch()` lowered to hex by
  Lightning CSS, a `color-mix()` over a token replaced by its larger share,
  and `translate`, `rotate` and `scale` folded into `transform`. A copy is
  named after its source plus a hash of every copy written
  (`name-<hash>.<copies hash>.legacy.css`), stamped over
  `__LEGACY_CSS_VERSION__` in that head script, so a change to the script
  alone renames every copy rather than leaving a cached one stale.

What the floor still lacks degrades rule by rule and is accepted: `:has()`,
container queries, `dvh`, `subgrid`, `text-box` and view transitions. The
console's layout leans on `:has()` most, so a TV running it lays out plainer
than a laptop does. The error screen carries its own unlayered rules for a
browser that read no stylesheet at all, and prints the error and the build.
