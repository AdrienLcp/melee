# 0 — Taverla becomes Melee

**Goal.** The product is called **Melee** — `melee` in code, URLs and storage,
*Mêlée* on screen. Done first, so every step after it writes new code under the
new name instead of adding to what a rename has to move.

The repository, the local folder, its worktrees and the Claude project directory
are already renamed (17/10/2026); the code is not. Measured at `6c4d06f`: 268
tracked files name *Taverla*.

## In order

- **Package scopes** — `@taverla/protocol`, `@taverla/core`, `@taverla/server`,
  `@taverla/game` become `@melee/*`: every import, `pnpm --filter` in
  `package.json` and `.github/workflows/ci.yaml`, `tsconfig` paths, the root
  `package.json` name.
- **Storage keys** — `taverla:*` in `apps/game/src/infrastructure/storage/`
  and the theme store become `melee:*`, **migrated once on read**: the new key
  is read first, the old one copied over and deleted when the new one is
  missing. Without it every remembered nickname, volume, host setup and host
  token is lost. One test per key family, broken once on purpose.
- **Deploy** — `name` and the custom domain in `apps/server/wrangler.jsonc`
  (`melee.adrienlcp.com`); a new Worker name starts with empty Durable Objects,
  harmless since rooms last an evening. The DNS record, a redirect from
  `taverla.adrienlcp.com`, the analytics site.
- **Prerender and SEO** — `presentation/head/document-head.ts`, canonical and
  `hreflang` URLs, `og:` images, the sitemap.
- **Copy** — the product name in both dictionaries, the legal page (publisher,
  storage-key list), `apps/game/PRODUCT.md` (naming section), `DESIGN.md`,
  README, `.claude/`, `docs/`, `cspell.json`. `CHANGELOG.md` keeps its history
  and gains the rename as an entry.
- **Not touched** — translation keys: they are namespaced by game and by shell
  area (`quiz.*`, `host.*`), never by product, so the rename changes values.

## Done when

`pnpm validate` is green, `git grep -i taverla` finds only the changelog's
history and the migration's old keys, a browser holding Taverla's keys opens
Melee with its nickname and volume intact, and the deployed Worker answers on
the new domain with the old one redirecting.
