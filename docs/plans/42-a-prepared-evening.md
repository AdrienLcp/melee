# 42 — A prepared evening

**In progress** — steps 1 to 4 done, step 5's stored order done. Asked 23/10/2026, after stage 41. The host can prepare the
evening's rounds before it starts — one, four or all thirty — each a game with
its own options, and the rest is drawn. Every entry is played at least once,
and nothing is played that the host has not either prepared or left to chance.

## Where it starts

- **Variants already exist** (stage 40): `settings.lineUp` is a list of whole
  game settings, so *a blind test on film scores* and *an easy blind test* are
  two entries of one game today.
- **The draw has no quota.** `nextEntryAt` (`core/room/next-game.ts`) picks any
  entry of another game than the last, at random, every round. Over twenty
  rounds a challenge may come up once or seven times, so a host cannot know
  how many to prepare, and an entry may never come up at all.
- **The slate is prepared** (item labels, the host's memo per item, keys kept
  per tab in `prepared-keys-storage.ts`), the challenge takes its line, the
  buzzer takes nothing but the host's own questions.

## The shape

- **The evening is a deck of rounds**, as long as `roundCount` (or the board's
  length). Every line-up entry is a card at least once; the cards left over
  are drawn among the entries that serve their own content, balanced so none
  comes twice before every other has come once.
- **A prepared entry is played once.** A slate with its questions, a
  challenge with its line: playing it twice replays the same content. An
  entry with nothing prepared in it — a quiz, a blind test with options — may
  fill the deck.
- **The order stays a surprise**: shuffled, never the same game twice in a
  row while another is left; when only one game remains, it plays.
- **Editable until played.** An entry whose round has not been played can be
  changed or removed between rounds, and the deck reflows. A played one is
  fixed. Replacing the next round beside *Next round* puts its card back.
- **Preparing is never owed.** Ticking games and pressing still opens a table
  that draws every round, as in stage 41: the deck is built from the ticks
  alone, and the list of rounds is there for a host who wants it.
- **A round nobody prepared can be skipped.** A buzzer, slate or challenge
  drawn with nothing in it — ticked in a hurry — offers *skip* beside *Next
  round*: that entry leaves the evening, and its cards still in the deck are
  redrawn among the entries that serve their own content, ones already played
  included, so the evening keeps its length. Only the host sees it; the room
  just sees the next game.
- **One host screen to prepare it**: the list of rounds in *Settings › The
  table*, on the console in the lobby while players arrive and between
  rounds — add a round (pick a game, set its options, prepare its content),
  and a line saying how many rounds are left to chance.
- The home press says how the deck is cut (*4 rounds a game*).

## Settled

- **The deck is dealt, not stored.** No list of cards is kept: `nextEntryAt`
  draws each round from how many times each entry has opened, so an edit, a
  skip or a replacement beside *Next round* reflows the rest for free. Every
  entry comes up once before any twice; a counted evening spends its last
  rounds on the entries still owed; another game than the last wins over
  balance.
- **Prepared means host-brought, decided by the game.** `servesItsOwnContent`
  on `capabilitiesOf` is `false` for the buzzer, the slate and the challenge:
  an entry of one plays once an evening, and only the others fill the rounds
  left over. An evening of several entries with nothing left to deal is final
  (`hasEntryLeftToDeal`, read by the server's `isFinalRound`); a room of one
  game plays on as it always did.
- **The server counts, by value.** `room.openedEntries` keeps the entry each
  round opened on, emptied by *play again*; the host view carries
  `lineUpPlayed`, matched by value (`playedPerEntry`) because a tick or a
  variant shifts every index after it. The draw stays on the console.
- **"A played entry is fixed" needs no refusal.** Counted by value, a played
  entry changed in the fold is a new entry, owed once — a different sheet is a
  different round. Refusing it would freeze a room of one game on its first
  quiz, which stage 41 promised plays on as before.
- Remembering a prepared entry past the evening is still open.
- **What a page sets is the entry, never the room.** The entry the next round
  is on is set through the room's own settings, as the fold always set it; any
  other through a copy of the room moved onto it (`movedToEntry`), with only
  its game's settings written back into the line-up. The answer mode, its
  window and the slate's key on this tab are the next round's, so only the
  next entry's page offers them (`SettingsPanel`'s `isNextRound`).
- **A non-next blind test commits its source as it is picked**, since no
  launch is coming to commit it; the next one keeps the picker's draft. The
  console drops that draft whenever `lineUpAt` moves, so a draw or *Play next*
  never hands one blind test's source to another.
- **The list of rounds is direction B** (`.impeccable/directions/prepared-evening/`,
  local), chosen 23/10/2026: a short list in *The table*, each round opening a
  page of its own in the leaflet (*‹ The rounds*), adding one opening the
  shelf of ten as a page. *The round* leaves the setup; setting an entry no
  longer makes it the next one — *Play next* does.
- ~~Random by default, an order on request.~~ Superseded 23/10/2026: the
  *In order* switch is gone. Every evening of several entries holds its
  running order from the moment it is made, dealt by `nextEntryAt`'s rule,
  shown as the list and edited by drag — a random evening and an ordered one
  were the same list with a mode between them, and the mode was the
  confusing part.

## Order

1. Core: the deck — build, draw, reflow on an edit — tests first. **Done.**
2. Protocol and server: the deck in the room, consumed per round. **Done**
   — `openedEntries`, `lineUpPlayed`, an exhausted line-up ends the evening.
   The console still labels that last press *Next round*: step 3's.
3. Design pass (`impeccable`), then the list of rounds in *The table*.
   **Done** — `EveningRounds` (a row per entry: spine band, icon, name, a
   detail, one stamp — first/next/now, played, `N×`, once — and *Add a round*),
   the chance line under it (`eveningChance`, with its over-the-count state
   and a press raising the count), a page per entry (`EveningEntryPage`: lid,
   the existing `PlaylistPicker` and `SettingsPanel`, *Play next*, *Take it
   out*, a played-out entry fixed) and the shelf as a page (`PickShelf`, a
   button twin of `TickShelf`, adding with `withEntryAdded`). *The round*
   group, `LineUpEntries` and `withVariantAdded` are gone. The last press of
   an evening with nothing left to deal reads *See the results*
   (`endsTheEvening`). The round count strip shows the count it is on when
   the line-up made it one of no step (twelve for three games).
4. *Skip* for a drawn round nobody prepared. **Done** — `offersSkip` and
   `withEntrySkipped` (`core/room/skipped-entry.ts`): *Skip this round* beside
   the next game on the reveal, for an unplayed buzzer, a slate with no label
   and no key noted, or a challenge with no line typed. Only the next round
   is ever asked, so the line and the keys staying on the console rather than
   on the entry is no obstacle. Never offered when it would leave nothing to
   deal — *End game* says that. A skip keeps the evening's count and hold
   even when it leaves a single entry, which `movedToEntry` alone would hand
   that game's own.
5. The running order — the list as the evening's rounds, reordered by drag,
   its stored order. **Done**: `settings.runningOrder` (protocol 46), a row
   per round from the first, a line-up index; empty for a room of one game,
   never `null`, never remembered past the room. The server deals it
   (`dealtOrder`, `core/room/running-order.ts`) as the room opens
   (`roomSettingsFor`), on every settings frame (`updateSettings`) and on a
   restart: the host's rows stand, a hole — an entry taken out
   (`remappedOrder`), a skip, a raised count — is drawn as if the rounds
   before it had played, every entry still owed gets a row, and rows over the
   count go from the end, a round of a game serving its own content that has
   another one. A host entry the count cannot hold stays past the end, stamped
   *Past the end* with the raise press under it. An endless evening holds one
   row per entry still in the deck and draws past them (`scheduledEntryAt`).
   The round about to open is `lineUpAt`'s in the lobby, and on a reveal once
   the console has drawn it. `EveningRounds` is a numbered react-aria
   `GridList` of the rounds to come (`comingRounds`), dragged by the grip with
   a mouse or the keyboard, and with a finger through `useTouchReorder`; a
   round dragged first becomes the next one (`movedToEntry`). *Play next* and
   the reveal's next-game picker swap rows (`orderWithEntryNext`); an entry
   added is appended and plays last. Locked while a round plays. Preparing a
   second challenge or slate ahead still needs its line and key on the
   entry, which they are not.
6. The planned games — the list as one row per entry rather than one per
   round, after directions A (games and a token tray), B (rounds in tours) and
   C (tabs) were turned down for it. **Done**: `dealtOrder` keeps one row per
   entry still to come, the host's rows first and the entries never played
   dealt after them on `nextEntryAt`'s rule; a hole or a second row closes up,
   and no row is given up over the count — an entry the count cannot reach
   is stamped *Past the end* beside the raise press, as before. A round whose
   row is gone takes the next one (`scheduledEntryAt`), so a skip plays the
   next planned game; every round past the last row is drawn as it comes.
   `EveningRounds` is headed *Planned games*, each row saying every setting
   its name leaves unsaid and the round length (`useLineUpEntrySummaries`:
   the decades, the subjects, the goals, *One go each*; nothing under a game with nothing to set),
   the stamp on the settings line so the name keeps the width, and the chance
   line says *N more rounds, by chance* under a counted evening too. A sheet
   and the wide drawer take the page's gutter back from the board track they
   cover (56px a side at 390 before), and the countdown strip stacks below
   10rem, which `strip-rows.spec.ts` had caught as a 2+1 wrap.
