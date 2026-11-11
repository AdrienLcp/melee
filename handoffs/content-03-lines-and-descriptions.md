# Content, part 3b — the setup shows and edits the evening's lines

Read `docs/plans/68-evening-content.md` first. The wire and the server are
done (see below); what is left is the console. It is UI work: start with
`impeccable`, verify muted in a real browser, and film what moves.

## Already shipped (part 3a)

- `deckSchema` has `challenge` and `mostlikely` arms: `items` are plain strings,
  1–140 and 1–160 characters, at most `LINE_DECK_MAX_ITEMS` (60)
  (`packages/protocol/src/deck.ts`). `QUIZ_DECK_MAX_ITEMS` is the quiz's 30.
- `lineDeckProblems` refuses a line given twice
  (`packages/core/src/room/line-deck.ts`); `isDeckItemId` says whether an id
  is a deck's.
- Server: `unplayedDeckLines` (`domain/round/deck-dealer.ts`). The challenge
  deck is dealt **into the hand** (`challenge-dealer.ts`, `handForCurrentDeck`):
  deck lines lead it, the bank tops it up once none is left outside it, and
  another entry's deck lines leave it. A redealt deck line is marked played
  (set aside for good). Most likely draws the deck before the bank in
  `round-conductor.ts`. `host.setDecks` refills the hand.
- `describe_games` carries `settings` per game (`SETTING_NOTES` in
  `game-notes.ts`) and `HOW_AN_EVENING_WORKS` says what line decks are, the
  most likely bank's rule, `difficulty` and `…Ms`.
- `DeckNote` keys `challenge.deck.*` and `mostlikely.deck.*` in both
  dictionaries.
- Tests: `[challenge]` and `[mostlikely]` socket tests (dealt first, on an
  auto-advanced round, never shown early, redeal sets aside), `[deck]` core
  test, `[mcp]` round trip.

## Build

1. **Decide the fold of `melee:challenge-lines`** (`own-challenge-lines-storage.ts`,
   `core/challenge/challenge-hand.ts`, `OwnChallengeLinesEditor` in
   `evening-entry-page.tsx:151`). Today those lines show first in the console's
   hand and ride `challengeText` when picked, so an auto-advanced round never
   plays them. What folding costs: `host.setDecks` is lobby-only, and the own
   list is editable mid-evening and global to the console (`isPlayed` across
   evenings). Recommended: in the lobby, the console sends the unplayed own
   lines as the first challenge entry's deck when the evening brought none,
   drops them from `challengeHandOf` once sent (the server's hand shows them),
   and marks them played from `deckSummaries`; a line added mid-evening keeps
   riding `challengeText`. Measure before choosing; keep the key.
2. **Most likely gets an own-lines editor** on its settings page, the same
   shape, and the same send-as-deck path.
3. **The setup shows the evening's deck** for both games: a `DeckNote` already
   prints the count; the lines themselves the console only holds in the saved
   evening / link it opened from.
4. Both dictionaries; checked full (60 lines of 160 characters) at phone width.

## Done when

Seen in the browser, filmed, then the changelog entry, plan 68's table, this
file and its `handoffs/README.md` row ship in one commit, pushed to `main`.
