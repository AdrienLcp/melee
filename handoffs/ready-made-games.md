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

## Recommended direction (to show beside the alternatives)

**Ready-made line-ups shipped by the app, offered where the empty lobby is.**
A first-time host opening a table sees, in the Games tab's empty state, three
or four named ready-made games — e.g. a discovery mix of the quickest-to-grasp
games, a music one, a general-knowledge one, a short party one — each one
press to load (games, deals, round count, order), plus "Choose my games" for
the full picker. They are the saved-line-up shape (`saved-evening.ts`) with
app-owned names in the dictionaries, so they run through the existing Saved
path and the host can tweak after loading. Home stays as it is, or its
"Open a table" says which ready-made game it opens on a first visit.

Alternatives to build as pages so Adrien can compare:
- **Ticks back on home**, with the ready-made games as pre-ticked chips above
  the shelf — weigh against the duplication `cda0ad1d` removed.
- **A one-question start**: "Open a table" asks *how long / what mood* and picks
  a ready-made game, picker reachable after.

Also find out what he struggled with — the setup tabs may carry a cost of their
own (entry / draw / order pages for a host who just wants to play). Measure the
presses from home to a first round for a newcomer, today and in each direction,
and put the counts on the index page.

## Done when

Adrien has picked a direction from the index page; it is built, verified in a
muted browser on console (desktop and phone) with a full room, `pnpm validate`
green, CHANGELOG, `docs/plans/` updated if this is a plan stage, this file
deleted, pushed.
