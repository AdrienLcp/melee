# 49 — Saved evenings

**Done 25/10/2026.** Asked 25/10/2026: keep a whole evening — up to thirty
entries, each game with its own settings — under a name, and run it again on
another night.

## What landed

- **`packages/core/src/room/saved-evening.ts`**: `SavedEvening` is the line-up,
  the round count and the running order, under a name. The teams, the board and
  the judge are not part of it: they are `HostPreferences.room`, laid over
  every table already. `withSavedEvening` puts a room on one — the order kept
  while it still points into the line-up, the room on the entry it opens with,
  a table answering aloud fitted the way ticking would. A name is matched case
  and edges aside, so keeping *soirée raclette* replaces *Soirée raclette*.
  At most `SAVED_EVENINGS_MAX` (20), newest first.
- **`melee:saved-evenings`**, in `preferences-storage.ts`, listed on `/legal`.
  Read entry by entry: an entry whose settings no longer parse keeps its game
  (`SavedEntry` is `GameSettings | GameKind`) and opens on what the host last
  left that game at, else its defaults; an entry naming a game this build does
  not serve is dropped, and the order with it, since every index after it
  moved.
- **`LINE_UP_MAX_ENTRIES` 12 → 30**, `PROTOCOL_VERSION` 57: an old tab would
  refuse a view of more than twelve entries. The cap was the old strip's; the
  console now lists one row per entry.
- **UI** (`saved-evenings-page.tsx`): a *Saved evenings* row under the planned
  games, also in a lobby with no game yet once one evening is kept, opens a
  page in the Games tab's place — the field that keeps this one (*Replace*
  when the name is taken), then one row per kept evening: its entries as
  spines, its name, its games and length, a press running it (lobby only) and
  a ✕ forgetting it.

## Decisions

- **Run in the lobby only.** Past the first round `lineUpPlayed` counts the
  current entries by index; swapping the evening under it would misplace them.
- **No confirmation before running one.** In the lobby the evening it replaces
  costs a few ticks to rebuild, and keeping it first is one field away.
- **The order is kept as saved**, past rounds included: an evening kept
  mid-way runs again from its first round in the order it was dealt.

## Done when

Seen muted at 1280 and 390: an evening of three kept, *Replace* on a
case-changed name, the quiz taken out and the evening run back with its
capitals and 60 s; a stored evening with a broken timeline entry and the order
[2, 0, 1] run on the timeline first at its 45 s default; twenty entries
accepted by the server. `validate` green.
