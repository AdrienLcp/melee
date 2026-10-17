# Open decisions

Every choice this stage leaves to Adrien. Each has a **working assumption**
the steps are written against, so work can start; settling one means updating
the step it names and deleting its line here.

| # | Decision | Working assumption | Step |
|---|---|---|---|
| 1 | The product's name | Unchanged until decided; every step is written name-agnostic. What a rename touches is listed below | h |
| 2 | A team's round result | The **mean** of its members' results over the seats the round stamped; alternative: the sum, which pays bigger teams | a |
| 3 | What *1 point = 1 case* means on a board counted in `POINT`s of 1 000 with a speed bonus | Cases = the team's round result in whole `POINT`s, floored: speed breaks ties on the standings and moves no pawn by itself; alternative: cases by the round's team rank | f |
| 4 | Who answers for a team on turn | The first submission from any member's phone or from the wall counts; alternative: a designated seat per set | c |
| 5 | The next game: drawn or picked by default | Drawn from the line-up, never the same game twice in a row when there is another, with *change* beside it; alternative: the host picks, *draw* beside it | b |
| 6 | Map scoring and bank size | Tiers 0 km → 3 `POINT`s, under 500 km → 2, under 1 500 km → 1, beyond → 0, plus the capped speed bonus in a simultaneous round; 150 countries in French and English | d |
| 7 | English country names | A dictionary like the French one, because the French prompt needs an article form no API gives; alternative for English alone: `Intl.DisplayNames` over an alpha-3 → alpha-2 table | d |
| 8 | Re-drawing teams after the start | Lobby only; afterwards the host moves single seats | a |
| 9 | How long a room outlives its last screen | Ten minutes, as today, since the wall stays connected through dinner; alternative: longer when the line-up holds more than one game — the legal page states the duration and must follow | g |
| 10 | A late seat's team | The team with the fewest connected seats, ties to the lowest id; alternative: the host places them | a |
| 11 | A seat's pawn colour with Teams on | Takes its team's colour everywhere; the eight pawn colours become the teams' (2–6 teams fit) | a |
| 12 | Rejoin by pseudo on a new phone | Not built: a seat comes back by its session id, as today; Gamenight's idea (take over a disconnected seat by typing its name) waits for a real case | — |
| 13 | *Ready* between rounds | An indicator on the wall, never a gate | b |
| 14 | Presets for December | *Soirée de Noël*: quiz, blind test, world map, buzzer; Teams drawn; Board on | b |
| 15 | Board default | On whenever Teams is on; off otherwise | f |
| 16 | The December cut | Steps a → g; everything in h after the rehearsal | index |

## What a rename touches

Measured at `6c4d06f`: 268 tracked files name *Taverla*. By kind, in the order
they would be done:

- **Repository** — `github.com/AdrienLcp/taverla` (GitHub redirects the old
  URL), the local `C:/git/taverla` and its worktrees, the root `package.json`
  name.
- **Package scopes** — `@taverla/protocol`, `@taverla/core`, `@taverla/server`,
  `@taverla/game`: every import, `pnpm --filter` in `package.json` and
  `.github/workflows/ci.yaml`, `tsconfig` paths.
- **Storage keys** — `taverla:*` in `apps/game/src/infrastructure/storage/`
  and the theme store: a rename forgets every remembered nickname, volume,
  host setup and host token unless the keys are migrated once on read.
- **Deploy** — `name` and the custom domain in `apps/server/wrangler.jsonc`; a
  new Worker name starts with empty Durable Objects (harmless: rooms are an
  evening long), the DNS record on `adrienlcp.com`, a redirect from the old
  host, the analytics site.
- **Prerender and SEO** — `presentation/head/document-head.ts`, canonical and
  `hreflang` URLs, `og:` images, the sitemap.
- **Copy** — the product name in both dictionaries, the legal page (its
  publisher, its storage-key list), `apps/game/PRODUCT.md` (the naming
  section and its rejected candidates), `DESIGN.md`, README, `.claude/`,
  `docs/`, `CHANGELOG.md`, `cspell.json`.
- **Not touched** — translation keys: they are namespaced by game and by
  shell area (`quiz.*`, `host.*`), never by product, so a rename changes
  values, not keys.
