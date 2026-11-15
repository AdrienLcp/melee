# Deploying

Two Workers on Cloudflare, built from the same commit by the same config
(`apps/server/wrangler.jsonc`):

| Environment | Address                               | Worker          | Deployed by                                     |
| ----------- | ------------------------------------- | --------------- | ----------------------------------------------- |
| staging     | `https://staging.melee.adrienlcp.com` | `melee-staging` | every push to `main`, once CI is green          |
| production  | `https://melee.adrienlcp.com`         | `melee`         | `deploy-production.yaml`, run by hand, and only |

Each has its own Durable Objects: a room opened on staging does not exist in
production, and a test evening never reaches a real table. Staging answers
`Disallow: /` in `robots.txt` (`INDEXABLE=false`), and the analytics server
refuses its origin, so it is neither listed nor counted.

## What each one runs

```sh
curl -s https://staging.melee.adrienlcp.com/api/health
curl -s https://melee.adrienlcp.com/api/health
```

`build` is the short commit.

## Put a commit in production

Production gets nothing on a push. Once staging has been tried:

```sh
gh workflow run deploy-production.yaml                 # the commit staging runs
gh workflow run deploy-production.yaml -f commit=abc1234   # any commit of main
```

Or on GitHub: **Actions → Deploy production → Run workflow**, leaving the
field empty for the commit staging runs.

The workflow refuses a commit that is not on `main` or has no green `validate`
run, then builds that commit and deploys it — about two minutes. Follow it with
`gh run watch <id> --exit-status`, and check `/api/health` reports the commit
before calling it deployed. A room in progress survives a deploy: its Durable
Object keeps its state and the screens reconnect.

## Roll back

The same workflow, with the last good commit:

```sh
gh workflow run deploy-production.yaml -f commit=<last good commit>
```

When even two minutes is too long, `pnpm exec wrangler rollback` from
`apps/server` puts the previous version back at once, with no build — the one
command run from a laptop, since it ships nothing new. The next run of the
workflow replaces it, so follow it with a proper deploy of the fix.

## Nothing else is deployed from a laptop

`wrangler deploy` from a checkout ships whatever the working tree holds,
uncommitted changes included, and stamps no commit. Both environments are
deployed by CI only, with the `CLOUDFLARE_ACCOUNT_ID` and
`CLOUDFLARE_API_TOKEN` repository secrets.

## Browser support

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
