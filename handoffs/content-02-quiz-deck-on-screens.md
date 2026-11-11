# Content, part 2 — a quiz deck carried and shown on screens

Read `docs/plans/68-evening-content.md` first. Session 1 put `decks` on the
wire, the server store, `host.setDecks` and the MCP check. This session
carries a deck from the link to the room and shows it. It is UI work, so start
with `impeccable`, then verify muted in a real browser and **film** the
motions (`docs/browser-driving.md`).

## Build

1. **Reading.** `savedEveningSchema`
   (`apps/game/src/infrastructure/storage/preferences-storage.ts:411-475`) reads
   `decks` leniently:
   - a deck that fails becomes `null`, never the whole evening;
   - re-align on the same rule as `isAligned` when entries drop.
2. **Every copy of an evening keeps its decks**, or deliberately not:
   - the saved evenings (one key, `SAVED_EVENINGS_MAX = 20`);
   - the export file (`host-export-file.ts:31`);
   - the router history state on the way to the console
     (`navigation.ts:520-560`, `useHostArrival`).

   Recent tables (`melee:recent-tables`) do **not** keep them: a table
   replayed from history plays the banks. Say that in its type's JSDoc.
3. **Into the room.** `useRestoreStoredSetup`
   (`features/host/use-restore-stored-setup.ts:47-90`) sends `host.setDecks`
   beside the settings frame, on the first lobby view only (a mid-game reload
   re-applies nothing, the same rule as the settings).
4. **Showing it.**
   - The link page (`features/evening-link/evening-link-page.tsx`) and the
     lid say that an entry brings its own questions, and how many. Never
     their text: the wall and the room may be looking.
   - The console setup and the running order show the same, from the host
     view's `{ size, played }` summary, and say when a deck is spent.
   - The strings go in both dictionaries (`i18n` rule).
5. **Privacy and docs.**
   - Update `/legal`'s sentence about what an assistant sends, plus
     `docs/mcp.md` ("What it never does → Carry a host's own content" goes;
     say the link is the answer key).
   - The assistant page (`features/assistant/assistant-page.tsx`) stays in
     step with `docs/mcp.md`, with a second example request: _a quiz about our
     family_.

## Verify

- Muted (`melee:volume` = `'0'` in an init script).
- Produce a link through `/mcp` with a 10-question deck. Open it, save it,
  open a table, and play two rounds with two phones. The deck's questions come
  first, in order, and no phone shows an answer before the reveal (read the
  player frames).
- Check full: `MAX_PLAYERS_PER_ROOM` seats with long names, at phone width.
- Film the link page's lid with its new mark, and the console's spent state
  appearing.

## Done when

Seen in the browser, then the changelog entry, plan 68's table, this file and
its `handoffs/README.md` row ship in one commit, pushed to `main`.

## Left by session 1

- `host.setDecks` and `deckSummaries` are not yet in `docs/realtime-protocol.md`.
- `AskedQuestion` hides the category chip when `category` is `null` (a deck
  item): see it in the browser with the first deck that reaches a screen.
- `decksFollowingLineUp` (`core/room/evening-decks.ts`) is covered by the
  socket reorder test only; a core test of the tuned-entry fallback and of a
  removed entry is cheap.
- `docs/mcp.md` does not yet say the link is the answer key.
