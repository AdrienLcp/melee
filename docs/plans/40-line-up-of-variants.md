# 40 — A line-up of variants

**To do.** Asked 21/10/2026. The host ticks *variants* for the evening, not
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
