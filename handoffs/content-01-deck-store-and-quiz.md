# Content, part 1 — the deck store, and a quiz deck dealt by the server

Read `docs/plans/68-evening-content.md` first: it holds the decisions this
session builds on (why decks never go in settings, ids, caps, strict input).
This session is the server and the MCP. Session 2 does the screens.

## Build

1. **Protocol.**
   - `quizDeckItemSchema`: `prompt`, `answer`, exactly three `decoys`,
     `accepted[]`, `note` (nullable) and `choiceOnly`. Use the bank row's own
     constraints (`packages/protocol/src/question.ts:27`, `:55`), capped
     explicitly with `.max()` on every string and array.
     - A deck item has no `category`. Find what the round's view needs it for
       (`hostQuestionOf`, `apps/server/src/infrastructure/questions/question-bank.ts:145`)
       and give the deck a fixed one, or make the field nullable.
   - `deckSchema`: a discriminated union by game, holding the `quiz` arm only
     for now, capped at **30** items. Session 3 adds `challenge` and
     `mostlikely` arms whose items are bare lines, so nothing in the store,
     the ids or the hand-over to the bank may read an item's answer.
   - `decks` on `eveningSchema` (`packages/protocol/src/evening.ts`):
     parallel to `lineUp`, `null` where an entry has none.
   - `host.setDecks` in the host union (`client-message.ts`).
   - The host view's summary: `{ size, played }` per entry. No deck content
     in any view.
2. **Core.** `quizDeckProblems(deck)` is pure and returns path-addressed
   messages. It catches:
   - a decoy `gradeQuizGuess` grades as right
     (`packages/core/src/quiz/question-answer.ts:31`);
   - an `accepted` spelling that matches a decoy;
   - duplicate decoys;
   - a decoy equal to the answer.

   The bank sweeps already test the first two
   (`question-bank.test.ts:305`, `:501`); reuse their check rather than
   writing a second one. Also add `decksHold({ decks, lineUp })`: aligned
   lengths, and each deck's game matching its entry's game.
3. **Server.**
   - Store `room.decks`, with `deckId` minted on `host.setDecks`. Refuse a
     deck that fails the validator, and accept the message in the lobby only.
   - Remap `room.decks` wherever `lineUp` is edited. Grep for every place
     that remaps `lineUpDeals`, and do the same at each.
   - Persist it in the room blob (`room-object.ts:299`), read back through
     `parseStoredGames` (`domain/room/stored-settings.ts`), leniently.
   - In `round-conductor.ts:345-390`, branch before `drawQuestion`: the entry
     at `lineUpAt` holds a deck with unplayed items → deal the next one as a
     `round.content` of the same shape, with id `deck:<deckId>:<i>`.
     Otherwise use the bank.
   - In a `typed` room, skip `choiceOnly` items as the bank does.
4. **The room's storage goes with the table.** Today `discard`
   (`room-object.ts:292`) deletes the `room` key and the alarm, on
   `host.closeRoom` and on the `expiry` deadline (`round-conductor.ts`), both
   through `closeRoomEngine`, and no test covers either.
   - Wipe the whole object with `ctx.storage.deleteAll()` beside
     `deleteAlarm()`, so a key added later cannot outlive the table.
   - `[worker]` in `worker-object.test.ts`: close a table, restart the runtime,
     and `GET /api/rooms/:code` answers `exists: false`. The restart is what
     makes it a storage test: without it the dropped engine answers alone.
   - `[deadline]` in `room-engine.test.ts`: an abandoned room woken at
     `ABANDONED_ROOM_GRACE_MS` discards itself.
   - `/legal` (`legal.storage.server`, both dictionaries): what the table
     holds now includes the content its line-up brought, deleted with it.
5. **MCP.** `prepare_evening` (`apps/server/src/infrastructure/mcp/evening-tools.ts`)
   should:
   - accept `decks`;
   - run `decksHold` and `quizDeckProblems` inside `problemsOf`;
   - refuse a fragment over `EVENING_LINK_MAX_CHARS` (8 000, in protocol) and
     say what to trim;
   - use `z.strictObject` on the write side, so an unknown key errors.

   Add a `HOW_AN_EVENING_WORKS` paragraph on decks, written for an assistant:
   - what a quiz item holds;
   - three plausible decoys, none of them a spelling of the answer;
   - `choiceOnly` for a question that only makes sense beside its options;
   - 30 items at most;
   - a spent deck hands over to the bank.

## Tests (tag every one, break each once on purpose)

- `[deck]` core: each validator problem, by its path.
- `[deck]` socket harness:
  - the deck is dealt in order, then the bank takes over;
  - a player frame never carries a deck item's answer before the reveal;
  - a seated host gets the summary and no content;
  - a reorder keeps each deck with its entry;
  - a reload of the Durable Object keeps the deck (`worker-object.test.ts`
    restarts the runtime).
- `[mcp]` (`apps/server/src/__tests__/mcp-endpoint.test.ts`):
  - the round trip with a deck;
  - an over-budget fragment is refused;
  - an unknown key is refused.

## Done when

Tests are green, and `CHANGELOG.md`, plan 68's table and this file are deleted
in the same commit (`handoffs/README.md` row too), pushed to `main`. No screen
changes yet: a deck reaches a room only through a test harness until session 2.
