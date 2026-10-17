# b — The line-up

**Goal.** The host ticks the games of the evening; between rounds the next
game is drawn at random from them or picked by hand; one tick is today's quick
game with nothing added on screen. The host paces it all from a phone or a laptop.

## Check first

A game already changes between rounds (`reshapesRound` refuses `game.kind`
only while `isRoundInPlay`). Confirm with a socket test that seat scores
survive the switch untouched; if they do not, that is this step's first fix.

## Protocol

- `room.ts` — `settings.lineUp: GameKind[]`, at least one, each a member of
  `shelvedGames`. `settings.game` stays what the *next* round is played on;
  the line-up only says what the draw may choose.
- `player.ready` — a seat says it is back at the table; `isReady` on the
  public seat, cleared when a round opens. Never a gate: the host may start
  regardless.
- `POST /api/rooms` carries a preset's settings exactly as it carries a game
  today; presets themselves are app data.

## Rules (`packages/core/src/room/`)

- `next-game.ts` — draw a game from the line-up, avoiding the one just played
  when there is another; a pure function over the line-up and the last game.
- `game-capabilities.ts` — the per-game table the comparison calls a
  descriptor: whether a game can be played in team turns, whether the wall can
  answer it, which answer modes it offers (`answerModesFor` moves in here). A
  `switch` on `GameKind`, so a new game stops compiling until it says.

## App

- Presets — `features/home/` offers *Soirée de Noël* beside the games' front
  doors; a preset is a `GameSetup` per game plus the line-up and the switches.
- `host/` — a line-up editor in the lobby (the game picker becomes ticks), and
  between rounds one press, *Next round*, with the drawn game named and a
  *change* beside it. The per-game `HostPreferences` already remember each
  game's setup, so switching games costs no question.
- Wall — the game of the next round, and the pawns of who pressed *Ready*.
- `player/` — a *Ready* press between rounds.

## Done when

A room with three games ticked plays six rounds without opening the fold: the
draw never repeats a game back to back, *Ready* shows on the wall, scores carry
across games. A room opened from a game's front door looks exactly as it does
today. Checked muted in a browser on the console, the wall and two phones.
