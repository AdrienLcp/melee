# End-to-end ports per worktree

Read `README.md` first. Found on 23/11/2026 while landing `03-small-fixes`.

## The problem

Adrien: "I thought we made worktrees precisely to avoid this kind of thing.
There are 5 or 6 sessions running."

Worktrees isolate files, not ports. `e2e/playwright.config.ts` pins its three
servers — `APP_PORT = 5274`, `SERVER_PORT = 3101`, `CATALOGUE_PORT = 3199` —
with `reuseExistingServer: false`, so a second worktree's `pnpm validate`
(or `pnpm test:e2e`) stops at once on
`http://127.0.0.1:3199/chart/0/tracks is already used`, and a wave of
sessions landing in parallel queues behind one e2e run of about 30 minutes.

## To do

1. **Ports of the worktree's own.** Derive the three ports per checkout: an
   environment variable that wins (`MELEE_E2E_PORT_OFFSET` or one per port),
   else an offset computed from the repository's absolute path (a small
   stable hash), so `C:/git/melee` and every `C:/git/wt-*` differ with no
   setup. Keep them clear of the dev ports (3100, 5273) and of each other;
   check every place that hard-codes one (`e2e/support/`, the Deezer stub,
   `wrangler dev --port`, any spec building a URL) and CI
   (`.github/workflows/ci.yaml`, shards included), which must keep working
   unchanged.
2. **Say it where a session reads it**: `.claude/rules/worktrees.md` and
   `.claude/rules/e2e.md`, and the "How every session here works" list in
   `README.md` (it already says each session picks its own dev ports; the e2e
   ports now pick themselves).
3. **Re-check one failure seen once under load**: `[layout] host,
   mintaka-8db29866: the question and its four choices never scroll`
   (`e2e/choice-fits.spec.ts:538`) found 0 `.answer-tile` instead of 4 on a
   run sharing the machine with other sessions' e2e. Run it alone several
   times: if it passes, say so in the commit; if not, fix it.

## Done when

Two worktrees run `pnpm test:e2e` at the same time and both finish, CI is
green, the rules say it, and this file and its README row are deleted.
