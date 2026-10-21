# 40 — A line-up of variants

**Done** 21/10/2026 — see *What was built* at the end. Asked 21/10/2026. The host ticks *variants* for the evening, not
only games: *Blind test — charts*, *Blind test — film scores*, *Quiz —
cinema*, each its own tick, drawn round by round like any game today.

## Where it starts

- `settings.lineUp` is an array of `GameKind`, one tick per game, refused
  twice (`packages/protocol/src/room.ts`). A variant needs the game's own
  settings beside the kind: `{ kind, settings }`, the arm `settings.game`
  already holds (`gameSettingsSchema`).
- What a variant can say today, with no new content: the blind test's
  `source` (chart genres, decades, film composers) and `difficulty`; the
  quiz's categories and *well-known only*; the world map's `places`; the
  buzzer's `locksOutOnMiss`.
- `nextGame` draws from the line-up and the console changes it beside *Next
  round*: both read a variant rather than a kind.

## The shape

- A line-up entry carries its game's settings, and two entries may share a
  kind. Opening a round on one copies its settings onto `settings.game`.
- The host builds a variant from the game's own settings fold, then names it
  or keeps the generated name (*Blind test · Film scores*).
- A preset may hold variants: the game night could open on two blind tests.
- `PROTOCOL_VERSION` moves; the remembered host setup migrates a line-up of
  kinds to one entry each on its default settings.

## Not in this stage

- A quiz of quotes (*Citations*): no bank holds quotes today, so it is a
  content stage of its own once the variant shape exists.

## Done when

- A room ticks two blind-test variants and a quiz variant, the rounds
  alternate between them, and each round plays on its variant's source.
- Seen muted in a browser on the console, the wall and a phone.
- `pnpm validate` passes.

## What was built

- **The shape diverged from the plan in one place**: an entry is the game's
  arm alone, `lineUp: GameSettings[]`, beside a pointer `lineUpAt` to the entry
  `game` was opened from. `{ kind, settings }` would have repeated the kind the
  arm already carries. The server checks the kinds agree (`lineUpHolds`) and
  then writes `game` back into the entry (`followedByLineUp`), so nothing on
  the console has to keep the two in step, and two identical entries are
  harmless rather than refused.
- **No typed name.** The name is generated from what tells an entry from its
  game's other entries (`line-up-entry-names.ts`): the blind test's source then
  its level, the quiz's one subject and *Grand public*, the map's places, a
  number when nothing does. A typed name would be a field and a string that
  travels for what the generated one already says — open to reverse.
- **Presets still tick kinds**: `POST /api/rooms` has no version handshake, so
  a tab opened before variants must still post. The game night opens each game
  on its defaults, then the host's remembered setup per entry.
- **The host's remembered setup needed no migration**: it never stored the
  line-up.
- **The draw** (`nextEntryAt`) prefers another game over another entry of the
  same one, so two blind tests and a quiz alternate blind test, quiz, blind
  test. A reload after a draw between two entries of one game may draw again;
  the guard on the kind cannot tell them apart.
- **The console**: the round's settings open on *Ensuite*, a row of every
  entry — picking one is picking what the next round is on and what the fold
  below sets — with *Ajouter une variante* (games with settings of their own,
  `canHoldVariants`) and *Retirer*. The blind-test picker's draft is committed
  into its entry before the row moves elsewhere.
- **Seen muted** at 1280 on the console and the wall and at 390 on a phone: a
  game night, a film-score variant added beside the charts, a round played on
  film scores (*The Super Mario Galaxy Movie*, Brian Tyler), the draw landing
  on the quiz, *Blind test · Le top du moment* picked on the reveal, and that
  name on the console's next-up, the wall's and the phone's.
