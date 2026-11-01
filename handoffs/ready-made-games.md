# Ready-made games for a first-time host

> « Il a galéré à configurer les jeux qu'il voulait, ce serait bien d'avoir des
> parties pré-fabriquées pour que ce soit plus simple (peut-être revenir à ce
> qu'on avait avant ? Genre pouvoir cocher les jeux auxquels on veut jouer dans
> la page d'accueil ? Pour quelqu'un qui ne connaît pas trop le site c'est
> peut-être plus simple ? Je sais pas trop, je te laisse me faire des
> propositions). »

Adrien asks for **proposals**: this session designs and shows, then builds the
one he picks. UI work: `impeccable` first, and each direction is a **full
example page** (real games, real copy, the empty first visit included), all
reached from **one index page** given as a raw `file:///C:/...` URL (global
rule 1). Words: "la partie" / "the line-up", never "soirée/evening"
(`.claude/rules/i18n.md`).

## Today (facts)

- Home (`apps/game/src/features/home/home-page.tsx:21-54`): code box, "Open a
  table" (`HostDoor`), then the shelf (`game-shelf.tsx:60-93`) — a spine opens a
  table on that one game. The host door reopens the last line-up's games
  (`use-create-room.ts:97-98`, `melee:line-up-games`), **empty on a first
  visit**: a newcomer lands in a lobby with no game.
- Lobby: `HostPanel`, four tabs (`setup-tabs.tsx`: Games :95, Table :284,
  Room :369, Players :423). The Games tab has its own pages: list, entry
  (`evening-entry-page.tsx`), draw (`evening-draw-page.tsx`), add, saved
  (`saved-evenings-page.tsx`), order by drag (`evening-rounds.tsx`).
- Room creation: `POST /api/rooms` `{ games, locale }`
  (`packages/protocol/src/http.ts:37-56`) → `roomSettingsFor`
  (`packages/core/src/room/room-settings.ts:145-195`; several games → 4 rounds
  each, snapped to `[5,10,20,30,40]`, dealt running order).
- Saved line-ups (plan 49): `{ name, lineUp, lineUpDeals, roundCount,
  runningOrder }` (`preferences-storage.ts:363-390`,
  `packages/core/src/room/saved-evening.ts`), host-made, run from the lobby's
  Saved row, exportable. **The app ships none.**
- Per-game defaults: `DEFAULT_GAME_SETTINGS` (`packages/protocol/src/game.ts:389-405`),
  `DEFAULT_MODE_SETTINGS` / `DEFAULT_ROOM_SETTINGS` (`room.ts:321-350`),
  `openedSetup` (`room-settings.ts:220`).

## History — read before proposing

- Ticks on home existed (plan 41, `docs/plans/41-one-table.md:28-35`) and were
  removed a day later (`cda0ad1d`, plan 43): "The game checkboxes duplicated the
  lobby's picker", and setup happens after the code goes up "so people join
  while the host chooses" (`43-host-controls.md:16-19`).
- A preset existed too (`teamNight`, "Une soirée toute prête", five games, 20
  rounds, three teams, a 40-case track) and was dropped
  (`41-one-table.md:47-53`): "ticking five games and choosing teams is two
  gestures, so a preset earns nothing a remembered setup does not."
- The brother's evening is evidence that premise was wrong **for a newcomer**:
  a remembered setup helps only the second visit. Correct that premise; keep
  what still holds (the code goes up first; one place to choose).

## Decided direction — the mix (2026-11-01)

Four directions were shown as example pages (local, git-ignored:
`.handoff/ready-made-games/index.html`; open `e-mix.html` for the target).
Adrien liked A, B and C and asked for a mix. What to build:

1. **Ready-made line-ups shipped by the app** — four, in the saved-line-up
   shape (`packages/core/src/room/saved-evening.ts`), names and captions in
   the dictionaries: *Première partie* (blind test · quiz all subjects ·
   higher-lower · reflex · atlas, 20 rounds — Adrien swapped *most likely* for
   atlas: it falls flat with two players), *Spéciale musique* (three blind test
   variants: French hits, the 80s, film scores; 20), *Culture générale* (quiz
   general · quiz flags · atlas · timeline · estimate; 20), *Partie éclair*
   (reflex · swatch · inner clock · matchsticks; 10). Check every source and
   rubric named exists before shipping it; adjust content, not the shape.
2. **Home (B)**: a row of boxes above the shelf, band of the entries' spine
   colours with their glyphs, name, games, one line, round count. One press
   opens a table already loaded with that line-up (games, deals, round count,
   order) — the `POST /api/rooms` body has to carry it, or the console applies
   it on its first lobby view the way it applies `HostPreferences`.
3. **Home (C)**: spines become ticks; the host door reads *Open a table ·
   4 games* and opens on the ticked games. Ticks are remembered — reuse
   `melee:line-up-games` (`preferences-storage.ts:50`), which the host door
   already reopens. One link: *Tick all but "host judges"*, one *Untick all*.
   **Default on a first visit: Première partie's five games**, not every game
   without a judge — Adrien proposed the latter; rejected because thirteen games
   at four rounds each snaps to 40 rounds of thirteen rules for a newcomer.
   This reverses `cda0ad1d` (plan 43): DESIGN.md's "nothing is ticked on home"
   and the shelf heading change with it; a spine's own game page stays its
   link target for crawlers and modified clicks.
4. **Lobby (A)**: when `settings.game === null` (nothing ticked), the Games
   tab leads with the four ready-made rows (spine ticks + name + caption, the
   saved-line-up row's grammar), then *Or one game at a time* and today's pick
   list. Loading one shows the planned games with a note naming it and a
   *Change* link back.

Presses home → first round, 4-game line-up: today 13, the mix 2.

## Done when

The mix above is built, verified in a
muted browser on console (desktop and phone) with a full room, `pnpm validate`
green, CHANGELOG, `docs/plans/` updated if this is a plan stage, this file
deleted, pushed.
