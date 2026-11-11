# Content, part 3 — lines of the evening's own, and describe_games filled in

Read `docs/plans/68-evening-content.md` first. Lines are public content (no
answer exists), so they live on the game's settings arm and are drawn by the
server. Showing them in the setup is UI work: start with `impeccable`, verify
muted in a real browser, and film what moves.

## Build

1. **Challenge.**
   - `lines` on the `challenge` arm (`packages/protocol/src/game.ts:115`,
     `{kind}` today): 1–140 characters each (`challenge.ts:10-15`), at most
     60, matching `melee:challenge-lines`.
   - `pickChallengeLabels` (`challenge-dealer.ts:108-113`) deals the arm's
     unplayed lines before the bank's, so auto-advance plays them too. A line
     becomes `{en: text, fr: text}`, as a typed one does
     (`challenge-round.ts:31-36`).
   - Decide whether the console's own-lines store
     (`own-challenge-lines-storage.ts`, `core/challenge/challenge-hand.ts:29-51`)
     folds into the arm. One list, edited in the setup and remembered per game,
     is simpler than two. If folding loses nothing, fold it, and read the old
     key once into the arm.
2. **Most likely.**
   - `lines` on the `mostlikely` arm (`game.ts:234-238`), 1–160 characters,
     at most 60.
   - Drawn before the bank where `drawMostLikelyLine` is called
     (`round-conductor.ts:530`).
   - Tell the assistant the bank's rule (`most-likely-bank.ts:9-14`): about a
     person, never a moment; no relationship between seats; never naming a
     guest; kind. An assistant "personalising" breaks it first.
3. **The setup shows and edits both lists**, in the game's settings page, in
   both dictionaries.
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

- `[challenge]` and `[mostlikely]` socket tests: arm lines are dealt first,
  including on an auto-advanced round.
- `[mcp]` a round trip with lines.
- A test that every game kind has a note, if one does not exist yet.

## Done when

Seen in the browser (the setup lists full, at phone width), then the
changelog entry, plan 68's table, this file and its `handoffs/README.md` row
ship in one commit, pushed to `main`.
