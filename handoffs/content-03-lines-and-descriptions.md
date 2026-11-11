# Content, part 3 — lines of the evening's own, and describe_games filled in

Read `docs/plans/68-evening-content.md` first. Lines have no answer, but they
are decks all the same: settings ride every snapshot to every screen, and a
_most likely_ line names somebody at the table. They take session 1's path
(`room.decks`, `host.setDecks`, the evening's `decks`) and are dealt by the
server. Showing them in the setup is UI work: start with `impeccable`, verify
muted in a real browser, and film what moves.

## Build

1. **Challenge.**
   - A `challenge` arm in `deckSchema`: lines of 1–140 characters
     (`challenge.ts:10-15`), at most 60, matching `melee:challenge-lines`. The
     `challenge` settings arm stays `{kind}`.
   - `pickChallengeLabels` (`challenge-dealer.ts:108-113`) deals the entry's
     unplayed deck lines before the bank's, so auto-advance plays them too. A
     line becomes `{en: text, fr: text}`, as a typed one does
     (`challenge-round.ts:31-36`).
   - Decide whether the console's own-lines store
     (`own-challenge-lines-storage.ts`, `core/challenge/challenge-hand.ts:29-51`)
     becomes the deck the console sends with `host.setDecks`. One list, edited
     in the setup, is simpler than two. If folding loses nothing, fold it and
     read the old key once. Decks stay out of `GameSettings`, so the list is
     remembered by its own key, never by `HostPreferences`.
2. **Most likely.**
   - A `mostlikely` arm in `deckSchema`, lines of 1–160 characters, at most
     60. The settings arm (`game.ts:234-238`) does not change.
   - Drawn before the bank where `drawMostLikelyLine` is called
     (`round-conductor.ts:530`).
   - Tell the assistant the bank's rule (`most-likely-bank.ts:9-14`): about a
     person, never a moment; no relationship between seats; never naming a
     guest; kind. An assistant "personalising" breaks it first.
3. **The setup shows and edits both lists**, in the game's settings page, in
   both dictionaries. The console holds them and sends them as decks; no
   view carries them back, so the setup reads the console's own copy and the
   host view's `{ size, played }` summary.
4. **`describe_games` explains what it leaves out today** (`game-notes.ts`,
   plus `HOW_AN_EVENING_WORKS`). The protocol has no `.describe()`, so the
   JSON Schema carries no field docs, and the notes are the assistant's only
   source.
   - **Petit Bac:**
     - `categories`: `null` draws, or a fixed list of 3–10, where `own`
       labels are at most 40 characters and `bank` takes one of the 31 keys;
     - `categoryCount` is ignored for a fixed list;
     - `difficulty` applies to drawn categories only;
     - `excludedLetters` and `stopsWhenFull`.
   - **Slate:**
     - `labels`: public, at most 12 characters, unique, `null` for a number;
     - `itemCount` is where a sheet starts, not a cap.
   - **Atlas:** `places` (`countries`, `frenchCities`, `worldCapitals`, one
     drawn a round) and `direction` (`place`, `name`).
   - **Matchsticks:** what `equation`, `biggest` and `smallest` mean.
   - **Inner clock:** the target is drawn between 20 and 60 s.
   - **Shades:** `showMs` against `roundDurationMs`.
   - **Black square:** `answerCount`; `doublesLoneFinds` applies to typed
     rounds only.
   - **Buzzer:** `locksOutOnMiss`.
   - **Blind test:** `search` (a free query) and `playlist` (a Deezer id) are
     how to make a blind test about anything; a list of tracks is not offered.
   - **Everywhere:** what `easy` / `mixed` / `hard` do and which games ignore
     them, and that every `…Ms` is milliseconds.

## Tests

- `[challenge]` and `[mostlikely]` socket tests: deck lines are dealt first,
  including on an auto-advanced round, and no player or wall frame carries an
  undealt line.
- `[mcp]` a round trip with a deck of lines.
- A test that every game kind has a note, if one does not exist yet.

## Done when

Seen in the browser (the setup lists full, at phone width), then the
changelog entry, plan 68's table, this file and its `handoffs/README.md` row
ship in one commit, pushed to `main`.
