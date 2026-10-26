# The realtime protocol

Defined in `packages/protocol`, spoken over `ws://…/ws/rooms/:code`. Every frame
is JSON, validated against a Zod schema on arrival, at both ends.

For the rules a contributor must follow, see
[`.claude/rules/realtime-protocol.md`](../.claude/rules/realtime-protocol.md).
This page is the format itself.

## Opening a socket

```
client ──▶  { "type": "time.ping", "clientSentAt": 1786215000123 }
server ──▶  { "type": "time.pong", "clientSentAt": 1786215000123,
              "serverTime": 1786215000160 }

client ──▶  { "type": "hello", "protocolVersion": 1, "role": "player",
              "sessionId": "3f2a…", "nickname": "Alice" }
server ──▶  { "type": "welcome", "protocolVersion": 1, "sessionId": "3f2a…",
              "serverTime": 1786215000171, "view": { … } }
```

`time.ping` is answered **before** `hello`, so a client can start estimating the
clock while the player is still typing their nickname.

`sessionId` is minted by the client and stored per room and role. Replaying it
reclaims the same seat and score — after a reload, a screen lock, or a lost
signal. It is also what makes React's StrictMode double-mount harmless: the
second socket is a reclaim, not a stranger.

`hello` must be the first non-ping frame. Anything else closes the socket.

`hostToken` is the room's own secret, minted with the room and returned by
`POST /api/rooms` to whoever opened it — the one place it reaches a client, and
never on a room view. A host claim carrying it is granted whatever else is
connected, and the console that was there is sent a fatal
`host_already_connected` of its own: **the token is what makes a takeover
undoable**, in both directions. Without one, a second console is refused while a
socket is attached (`host_already_connected`) and for `HOST_RECLAIM_GRACE_MS`
after the last one dropped (`host_reconnecting`), which is the Wi-Fi blink and
the closing lid; past that window the code alone is enough, because a room
nobody can pick up is a party ended by a dead battery.

A console hands itself to another device the same way: its menu offers
`/host/:code#host=<token>`, the fragment no request carries, and the device
that opens it keeps the token and claims with it. The screen that offered it
reads the `host_already_connected` that follows as its cue to reopen as the
wall, on the token it still holds — a client decision, nothing on the wire.

### The wall

`role: 'wall'` is the room's own screen — a television, a projector, a laptop
turned to face the sofa — which shows the game and holds no secret, no control
and no seat. It is a third role rather than a flag on the host, so every check
written for *the* host leaves it out without being touched: it is not a presence
(`isHostConnected`), it cannot send a `host.*` frame (`host_only_action`), a
token claim neither displaces it nor is displaced by it, and its arriving or
leaving freezes and resumes nothing. The console learns it is there from
`isWallConnected` on its view, and leaves the clip to it.

A wall is admitted on the room's token alone, and refused a fatal
`wall_not_paired` without it, because it carries the clip and the clip's URL
names the track. It reaches the token by **pairing**: `POST /api/walls` hands the
waiting screen a six-character code to display and a secret to keep; the host's
device posts the code with the room code and the token to
`/api/walls/:code/pair`; the screen, polling `/api/walls/:code?secret=…`,
collects the token once and the pairing is gone. The code can sit on a screen
the whole room reads, because it pairs nothing without the token beside it.

The wall **sends nothing but its hello**, and nothing it receives names an
answer before the reveal.

The console lets it go with `host.dismissWall`: every wall is sent a fatal
`wall_dismissed`, unregistered, and the room published, so the console is the
speaker again. The token is not rotated — the wall is the host's own screen —
and the screen leaves its room's address for `/wall`, so a reload does not
reconnect on the token it still holds.

## Client → server

| Type | Sent by | Payload |
|---|---|---|
| `hello` | both | `protocolVersion`, `role`, `sessionId?`, `nickname?`, `hostToken?` |
| `time.ping` | both | `clientSentAt` |
| `player.leave` | any seat | — |
| `player.rename` | any seat | `nickname` |
| `player.chooseTeam` | any seat | `teamId` — under `chosen` teams only |
| `player.ready` | any seat | `isReady` — between two rounds; refused `wrong_phase` while one is under way |
| `player.buzz` | player | `roundId` |
| `player.answer` | player | `roundId`, `answer` — `{kind:'choice', choiceIndex}`, `{kind:'typed', guess}` or `{kind:'point', point}` — a marker on the world map, `{ latitude, longitude }` in degrees |
| `slate.write` | player | `roundId`, `itemIndex`, `answer` — an upsert of one line; `''` clears it |
| `petitbac.write` | player | `roundId`, `categoryIndex`, `answer` — an upsert of one line of the sheet, at most 60 characters; `''` clears it |
| `petitbac.stop` | player | `roundId` — a full sheet closing everyone's, `PETIT_BAC_STOP_GRACE_MS` later |
| `petitbac.vote` | player | `roundId`, `categoryIndex`, `rowKey`, `refuses` — a refusal of a row of the category being voted, or one taken back |
| `petitbac.doneVoting` | player | `roundId`, `categoryIndex` — the seat has read the category being voted |
| `blacksquare.tick` | player | `roundId`, `cell` — a cell index or `'blackWord'` — and `isTicked`; the keeper of a spoken black square alone, the black word once and for good |
| `host.updateSettings` | host | `settings` |
| `host.startRound` | host | `slateKeys` (optional) — the slate's prepared answer key, read by that game alone; `challengeText` (optional) — what a challenge asks the table, at most 140 characters; `challengeAt` (optional) — the slot of `challengeHand` an untyped challenge opens on, the first by default; `isChallengeSaidAloud` (optional) — an untyped challenge opens on no line, the host announcing it; `innerclockTargetSeconds` (optional) — how long an inner clock round asks the table to count, 10 to 180, drawn between 20 and 60 when absent |
| `host.judge` | host | `roundId`, `playerId`, `verdict` |
| `host.reveal` | host | `roundId` |
| `host.clearLockouts` | host | `roundId` |
| `host.addItem` | host | `roundId` |
| `host.setItemKey` | host | `roundId`, `itemIndex`, `key` — `''` clears it |
| `host.revealItemKey` | host | `roundId`, `itemIndex` — a closed item with a key; it joins `round.content.revealedKeys` |
| `host.closeItem` | host | `roundId`, `itemIndex` |
| `host.collectSheets` | host | `roundId` — closes every item still open |
| `host.showItem` | host | `roundId`, `itemIndex` |
| `host.judgeGroup` | host | `roundId`, `itemIndex`, `groupKey`, `verdict` — `{kind:'single', isCorrect}` |
| `host.cancelStop` | host | `roundId` — takes a Petit Bac stop back and reopens every sheet on the time it left, until the vote moves past its first category |
| `host.nextCategory` | host | `roundId`, `categoryIndex` — settles the Petit Bac category being voted and opens the next, or the reveal after the last |
| `host.drawTeams` | host | `assignment` — one list of `playerId`s per team, in team order |
| `host.renameTeam` | host | `teamId`, `name` |
| `host.moveSeat` | host | `playerId`, `teamId` |
| `host.adjustScore` | host | `target` — `{kind:'team', teamId}` or `{kind:'seat', playerId}`, `points` — signed, in board units |
| `host.awardPlaces` | host | `roundId`, `places` — `[{ target, place }]`, `target` as `host.adjustScore`'s, `place` 1, 2 or 3 |
| `host.awardTeams` | host | `roundId`, `verdicts` — `[{ teamId, verdict }]`, the verdict in the shape the game is judged in; a team left out had nothing |
| `host.redealChallenge` | host | `at` (optional, the first by default) — another ready-made line in place of that slot of `challengeHand`, the dropped one left unplayed; `invalid_message` outside a challenge, `no_content_available` when the bank holds no other |
| `host.nextRound` | host | `isDuel` (optional) — the next round is a duel, see *A duel is one round asked for*; `challengeText`, `challengeAt`, `isChallengeSaidAloud` (optional) — as on `host.startRound`; `innerclockTargetSeconds` (optional) — as on `host.startRound` |
| `host.endGame` | host | — |
| `host.playAgain` | host | — |
| `host.removePlayer` | host | `playerId` |
| `host.closeRoom` | host | — |
| `host.dismissWall` | host | — |

**The `player.` prefix names the seat, not the role.** `player.leave` and
`player.rename` are the two a console holding a seat sends as well, which is why
neither is in `HOST_ONLY_MESSAGE_TYPES` and why both guard on
`connection.playerId` rather than on `connection.role`.

`player.buzz` carries **no timestamp**, and must never gain one. Ordering is
decided by arrival at the server; anything the client says about "when" is
clock-skewed and forgeable, and a blind test is decided by exactly that field.

The fairness this buys is bounded by network latency, which the clock handshake
measures but cannot remove. If that ever needs improving, the answer is
compensating with the *measured* round trip the server already knows — never
trusting a number the client sends.

`verdict` is discriminated on `kind`, because what the host judged depends on
the game: `{kind:'halves', titleCorrect, artistCorrect}` for the blind test's
two independent claims, `{kind:'single', isCorrect}` for everything else. The
server refuses a shape the current game is not judged in — halves over a bare
buzzer would pay two points for one charade.

`host.clearLockouts` puts everyone who missed back in, mid-round. A blind test
round is a clip that runs out, so a lockout there expires on its own; a game
whose question the room owns has no such clock.

**An evening is a line-up, not a new object.** `settings.lineUp` holds the
entries ticked, each a game's whole settings arm, so two entries may share a
game — a blind test on the charts and one on film scores. `settings.game` is
the copy the next round is played on and `settings.lineUpAt` the entry it was
opened from; the kinds must agree, a room with no game has ticked none and
points at nothing (`lineUpHolds`, refused `invalid_message`), and the server
writes every accepted frame's `game` back into that entry
(`followedByLineUp`), so a setting changed in the fold belongs to the variant
from then on. One entry is a room playing one game, which is what every game's
front door opens. The draw between two rounds is the console's (`nextEntryAt`:
another game before another entry of the same one, never the entry just
played): it lands as an ordinary settings frame between the reveal and
`host.nextRound`, so the wall reads the next game off `settings.game` like
everything else. `POST /api/rooms` takes the `games` to open on — none from
home, one from a game's own page, or several opened as a line-up of four rounds
a game; it ticks kinds,
each opened on its defaults, because that request has no version handshake and
a tab opened before variants still posts. Teams, board and judge never travel
there: they are the host's, laid over the room by the console's first settings
frame.

- **Scores survive the switch.** Nothing a settings frame carries touches a
  seat's score; only `host.playAgain` starts them again.
- **Ready is a word, not a gate.** `player.ready` sets `isReady` on the public
  seat between two rounds; opening a round clears every seat's, and the host
  starts whenever.

**Teams are the shell's, and no game's arm learns what one is.**
`settings.teams` is `off`, or `drawn`, `chosen` or `aloud` with a `count` of
2–6. Under `drawn`, `chosen` or `aloud` the room holds that many teams,
`team-1` onwards, each coloured by its pawn and named `null` until the host
names it, so every screen says the name its own dictionary gives the colour.

- **Who decides the teams.** `host.drawTeams` sends the whole deal; the console
  shuffles and the server checks it is a partition of the seats into non-empty
  teams within one seat of each other (`isFairDeal`). Under `chosen` each seat
  sends `player.chooseTeam` instead, as often as it likes in the lobby, and
  once afterwards if it arrived holding none.
- **Nobody waits on a phone.** A seat still without a team when a round opens is
  placed by the late-seat rule — the team with the fewest *connected* seats,
  the first on a tie — and so is one arriving under `drawn` once there is a
  deal to join. Before the first deal the lobby is still filling, and a seat
  waits for it.
- **The lobby is the only place the teams change wholesale.** A settings frame
  that moves `teams.kind` or the count, and a deal, are `teams_locked` past it;
  `host.moveSeat`, `host.renameTeam` and `host.adjustScore` are allowed in every
  phase.
- **A team's score is the sum of its seats'.** A round pays each team the sum
  of what it paid the team's seats it opened on (`teamRoundResult`) — a sum
  rather than a mean, because under a mean a teammate's wrong answer lowers the
  team's result — and a team answering as one, in a turn or on a challenge's
  podium, the one answer every seat holds, once. Banked as
  the next round opens or the board goes up; the round on screen is added live,
  because a slate verdict can still be taken back under its reveal. Seat scores
  are untouched, for the individual podium, and a seat's adjustment stays on
  the seat. Neither score goes below zero.
- **A table answering aloud holds no seat.** Under `aloud` a player `hello` is
  refused `room_plays_aloud`, non-fatal; the settings frame moving a room to it
  is refused `teams_locked` while a seat other than a console's is held, and
  the console's own goes as it lands, because every round is the console's to
  judge. A game whose answer is a screen — the map, the reflex race, the
  slate — cannot be ticked under it (`isPlayableAloud`), and nor can a set:
  every round is played `together`. `host.awardTeams` pays each team named
  `pointsFor` its verdict straight onto the round's `teamAwards`, added to the
  seats' sum in the team's round result; it is `host.awardPlaces`'s twin —
  the whole round each time, sent while `playing` it pays and ends the round
  the way its game ends one, sent on the reveal it corrects it — and is
  refused `wrong_phase` outside a room answering aloud or in a challenge,
  whose podium `host.awardPlaces` already pays to the teams themselves, and
  `invalid_message` for a team named twice, a team not there, or a verdict of
  the wrong shape.

**A duel is one round asked for, never a mode.** `isDuel` on `host.nextRound`
asks for the next round alone to be two seats of two teams head to head while
the room watches, drawn so every seat duels before any duels twice
(`drawDuel`, over `duelsBySeat`). The server stamps the round on those two
seats, so the roster rule already refuses everybody else with
`not_your_turn`. `round.duel` — `{ seatIds, teamIds }` — names them, and is
`null` when everyone plays.

- **The wish is spent as the round opens** (`takeDuel`): the reveal hold, which
  sends no frame, always opens a round for everyone.
- **A duel the room cannot play is refused `invalid_message`** — a game whose
  capabilities say no (`playsDuels`), the buzzer mode, a room without two
  teams. Two teams that no longer both hold a seat open the round for everyone.
- **There are no team turns.** A round one team plays while the others watch,
  and a seat answering for its team, were removed at protocol 42: they made
  spectators of a room that came to play.

**The board is the teams' score walked on a track.** `settings.board` is
`off` or `{ kind: 'track', length, strategy, catchUp }`, laid in the lobby only — a
frame that moves it past the lobby is `wrong_phase` — and read only where the
room has teams. Each team carries `board: { case, move }` beside its score,
`null` while the board is off.

- **The server walks the pawns.** As a round settles, the strategy named in the
  setting (`@melee/core/board/`, one file each) turns every team's round result
  into a number of cases; `advanceOnTrack` stops each pawn on the last case.
  `onePointOneCase` moves a case for every whole `POINT`, floored, so the speed
  bonus moves no pawn on its own. `rank` moves the round's teams 3, 2 and 1
  cases by what it paid them, speed bonus included; a tie shares the better
  place and skips the next, and a team paid nothing is not ranked — which is
  what keeps a turn of a set from ranking one team against teams still
  waiting for theirs, so a team on its turn moves 3 cases if it scores at all.
- **Catch-up is the track's, not a strategy's.** With `catchUp` on,
  `advanceOnTrack` gives one case more to a team standing *alone* on the
  rearmost case, on a round its strategy walks it at all. Two pawns level at
  the back are a race, not a team left behind. The field defaults to `false`,
  so a track stored by a host before it existed still parses.
- **The move shows at the reveal and not before.** `move` is what the round on
  screen walked the pawn, nought until `revealed`, so a screen plays the walk
  from `case - move` instead of teleporting the pawn, and nothing moves while
  an answer can still be given. It is banked with the score as the next round
  opens or the board goes up.
- **The host corrects a move with the score.** `host.adjustScore` on a team
  walks its pawn a case for each whole `POINT` of the adjustment, between the
  start and the finish, so the pawn and the score never tell two stories.
- **A pawn home ends the evening.** `isFinalRound` is true once a pawn stands on
  the last case (`isTrackFinished`, read by the console too), whatever the
  round count says — after the set under way, so no team loses its turn.

**The slate's six host frames and its one player frame.** The sheet is one
round, and writing and marking share `playing`: every item carries its own
state instead — `open` (writable on every sheet), `closed` (locked, its answers
on the wall's side) and `marked` (closed and passed by the wall, so an answer
nobody validated is wrong). `host.closeItem` closes one item and puts it on the
wall while every other stays writable; `host.collectSheets` closes every item
still open at once and moves the wall to the first of them; `host.showItem`
moves the wall between closed items — back as well as forward; `host.addItem`
adds an open item until the reveal. `host.reveal` is refused with `wrong_phase`
while any item is open, then ends the sheet into `revealed`. A line written to
a closed item is `wrong_phase`. Every index is 0-based.

`host.judgeGroup` is its own frame rather than `host.judge` taught an item index.
`host.judge` names one player on the floor and ends in a lockout, a resumed clip
or a reveal; this names every player who wrote the same thing on the item on the
wall, is paid or unpaid on the spot, and can be taken back. The two share the
`single` verdict shape and nothing else. `itemIndex` must be the item on the
wall (`stale_round` otherwise, the way a stale `roundId` is), and `groupKey` must
name a group of it (`invalid_message` otherwise) — a blank line is never a group,
which is the whole guard against validating one.

The slate stamps **each item** with the seats held when it closes, and marks
and pays a player only on the items stamped with them: a sheet has no clock and
no race, so a latecomer is owed every item still open. The round's own roster —
what `joinedAfterStart` reads — stays `null` while an item is open, and is the
union of the item stamps once none is. `slate.write` is not a floor frame — it
moves nothing along, so it is accepted while the console is away.

**Labels are settings, not round state.** `settings.game.labels` is
`(string | null)[]`, at most 60, one per item index, `null` (or absent) for an
item drawn as its 1-based number. Public by nature, so it travels to everyone
with the settings and is edited by `host.updateSettings` in any phase — which is
how an item added mid-sheet gets one. Each label is trimmed, 1 to 12 UTF-16
units, and every position must read differently once case, width and spacing
are folded — a label that reads as another position's number is refused too, so
a tile drawn `2` is always item 2. A refused set is `invalid_message`.

**The challenge is played off screen, so its one frame is the host's word.**
What the table is asked to do rides the press that opens the round —
`challengeText` on `host.startRound` or `host.nextRound` — and lands public in
`round.content` as `{ kind: 'challenge', labels }`, on all three views: it is
the question, and the answer happens where no screen sees it. `labels` holds
the line in every locale, so each screen reads its own; a typed line is the
same text under each. Left empty, the round opens on a ready-made line the
server dealt **ahead** from its bank and showed the host alone as
`challengeHand` on the host view — never the wall's or a seat's, which would
spoil it: three lines to pick from with `challengeAt`, one to a seated console,
which is about to be asked it. The slot taken is dealt again behind it. A host
who would rather announce the line sends `isChallengeSaidAloud`, and the round
opens with `labels: null` and takes nothing from the hand. A line holding a `{letter}` slot
takes its letter as it is dealt, the same in every locale. A line joins
`playedContentIds` only as a round opens on it, so the evening never deals it
twice. `labels` is `null` when said aloud, or once the bank is spent and
nothing was typed. The host and the wall arms carry nothing but the kind. The round is buzzer-moded because its
host judges it, so a seated console sits it out — and `player.buzz` is refused
`wrong_phase`, because the race is at the table.

**The inner clock shows nothing, so its views carry nothing that moves.** The
count rides the press that opens the round — `innerclockTargetSeconds`, drawn
by the server when absent — and the round is `{ kind: 'innerclock',
targetSeconds, hasPressed, revealedPresses }` on the public view. `hasPressed`
is the reader's own and nobody else's; `revealedPresses` is `null` until the
reveal, so no screen holds another seat's press, nor its own time, while
anyone is still counting. The host and wall arms carry the kind alone, and
`round.durationMs` is `null`, so no screen can draw a bar: the cap —
`innerclockRoundDurationMs`, the target and a quarter — lives on the server's
`openPhaseDurationMs`, as the reflex heat's does. A press is `player.buzz`,
routed on the content: one per seat (`already_buzzed` after), stamped on
arrival, and the count is `atServerTime − round.startsAt`. The round closes
once every seat it opened on has pressed, or at the cap.

**Matchsticks carry the puzzle to everyone and the moves to the host
alone.** The public arm is `{ kind: 'matchsticks', puzzle, revealedSolution }`:
`puzzle` is the glyphs drawn (`6+4=4`, `508`) and the goal — an equation to
make true, or a number to make the biggest or the smallest — and
`revealedSolution` is `null` until the reveal, then the first of the moves.
The host arm is `{ kind: 'matchsticks', solutions }`, every move that answers
the puzzle, because a second true equation is not a wrong answer and the judge
has to see it; the wall arm is the kind alone. A move is two stick places,
`{ glyphIndex, slot }`, so a screen can draw the stick leaving and landing
from the glyphs it already holds. The server deals the puzzles itself
(`@melee/core/matchsticks/deal`), so there is no bank and no dealt puzzle
without an answer. On the buzzer the round is judged like the bare buzzer's,
on its `roundDurationMs`.

**A matchstick moved on a screen is judged by the server.** In the `move`
mode, which matchsticks alone offers and opens on, a seat answers with
`player.answer` `{ kind: 'move', move }`: one shot, like a pick. The server
applies it with `applyMove` (`@melee/core/matchsticks/one-move`, the same
function the solver enumerates, so the two cannot disagree); a move the sticks
cannot make — no stick where it is lifted, one already where it is laid, a
glyph left that is no digit or sign — is refused as `illegal_move` and spends
nothing. The grade is a fifth shape of verdict, `{ kind: 'move',
placesFromBest }`: `0` for a true equation or the best number, `1` and `2` for
the next numbers down (each distinct number one stick makes that improves on
the dealt one, best first), `null` for anything that answers nothing — priced
by `@melee/core/matchsticks/move-pay` at 3, 2 and 1 `POINT`s with the clock on
top. No lockouts; the round closes once every stamped seat has moved, or on
its clock. Before the reveal a seat reads back its own move as `yourMove`
and nothing else — not even its own `yourVerdict`, which stays `null` until
the reveal so a right move cannot be whispered on with confidence. At the
reveal `revealedMoves` lists every seat's `{ playerId, move, glyphs }`, the
puzzle as each move left it. Nobody judges, so a console may hold a seat, and
its host arm's `solutions` is then `null`.

No floor and no local scheduling: the error being measured is seconds, and a
link's tens of milliseconds are noise under it. `startsAt` is on every view
because the countdown needs it, so a scripted client could always work out
the elapsed time — as a watch under the table could. The guarantee is that no
screen shows it; the table polices the rest.

**A timeline carries the events to everyone and their years to the console
alone.** The public arm is `{ kind: 'timeline', events, revealedEvents }`:
`events` is the round's five, `{ id, labels }` with a label per locale so each
screen reads its own, in the shuffled order they were dealt; `revealedEvents`
is `null` until the reveal, then the same events earliest first with their
`year`. The host arm is `{ kind: 'timeline', datedEvents }`, earliest first with
the years, and `null` while the console holds a seat — nobody judges, so a
seat is offered. The wall arm is the kind alone. A seat answers with
`player.answer` `{ kind: 'order', eventIds }`, every event once, earliest
first: one shot, like a pick, in a mode of its own, `order`, which no other
game offers. The grade is a fourth shape of verdict, `{ kind: 'order',
swappedPairs }` — the pairs the order puts the wrong way round, so one
neighbour swapped is one — priced by `@melee/core/timeline/order-pay`'s tiers
(3, 2 and 1 `POINT`s for none, one and two) with the clock on top, capped by
the tier as everywhere else. An order that is not the round's events once each
is `invalid_message`. The bank is bundled with the server
(`timeline-bank.json`), and a round's events are at least `MIN_YEARS_APART`
from one another.

**Black square sends a seat its own cells and nothing else.** The public arm is
`{ kind: 'blacksquare', theme, foundCellCount, revealed }`: the theme per locale,
how many of the nine cells *any* seat has found — a count, never which — and
`revealed`, `null` until the reveal, then every answer with its `tier` and
`foundBy`, and the black word with its `why` and `hitBy`. The reader's own
cells are `yourVerdict`, a fifth shape of verdict, `{ kind: 'cells',
foundCells, hitBlackWord }`, so a cell's index reaches a seat only once it
typed that answer. The host arm is `{ kind: 'blacksquare', grid }`, the nine
most read first with their tiers and the black word, never an alias, and
`null` while the console holds a seat; the wall arm is the kind alone. A seat
sends as many `player.answer` `{ kind: 'typed', guess }` lines as the round
lasts — a hit never closes its sheet, only all nine or the black word do, and
a line after that is `already_buzzed`. `@melee/core/blacksquare/line-match`
matches a line whole against every name in both languages, each answer's
rivals being the black word and the other eight; `sheet-pay` prices it, 1, 2
and 3 `POINT`s by tier, nothing once the black word is hit, and no clock on
top. `black-square-game.test.ts` searches each seat's and the wall's whole
transcript for a name it never typed.

**A spoken black square sends the list to one seat, of a team not playing.**
Under the `spoken` answer mode — offered only while the teams are `drawn` or
`chosen` — each round draws a guessing team and a keeper from another team
(`drawSpokenTurn`: the team that has guessed least, the seat that has kept
least), and refuses to open with `spoken_needs_two_teams` until two teams hold
a connected seat. The public arm's `spoken` is `{ guessingTeamId, keeperId,
tickedCells, list }`: the ticked cells are indices, to everyone, and `list` —
the nine and the black word — is filled for the keeper alone, and taken back
the moment the host moves it into the guessing team, whose seats never receive
it. Nobody answers on a screen: `player.answer` is `invalid_message`, and only
the keeper's `blacksquare.tick` moves the sheet, the black word or all nine
closing the round. The reveal pays the sheet to each seat of the guessing
team and the team once, the challenge's path (`answersAsOne`).

**Petit Bac writes in private, then votes in public, one category at a
time.** No phase is added: the sheets and the vote are both `playing`, and the
arm carries `sheetsClosed` and a state per category, `open | voting | settled`.
While a sheet is open a seat is sent its own lines (`yourSheet`) and nothing
else; the console and the wall are sent `progress` — each seat's count of
filled lines, never a word — seated host and judge alike. A category's `rows`
reach every screen once it is `voting`, which is after every sheet has closed,
and its `lines` once it is `settled`. `petit-bac-game.test.ts` searches the
console's, the wall's and each seat's whole transcript for another seat's word.

The sheets close on the round's clock, or `PETIT_BAC_STOP_GRACE_MS` after a
`petitbac.stop` from a seat whose every line is a word on the letter, two
letters or more after the fold (`sheet_not_full` otherwise, `wrong_phase` when
the room turned the stop off, one is already counting, or the console took
this seat's back). Until a category with a row has settled, the console's
`host.cancelStop` takes the stop back, judge or not: the sheets reopen on the
round clock as it stood when the stop was called, the votes so far are
dropped, and the caller joins `barredStopperIds` for the round —
`canCancelStop` on the console's content says whether it would be taken. The grace is `stopClosesAtElapsedMs`, round time like `durationMs`,
so a console away freezes it with the clock; it is the round's deadline, and a
line written after it is `wrong_phase`. The vote then opens on the first
category with a row — one with none settles on the spot. A row is a group of
the round's answers on the letter under the shared normalisation, named by its
`key`; a seat refuses any row it did not write (`invalid_message` on its own),
and a row falls on a **strict majority** of the round's seats that did not
write it. Every seat sending `petitbac.doneVoting`, or the console's
`host.nextCategory`, settles the category and moves on; a `categoryIndex` that
is not the one being voted is `stale_round`. The room's vote is the only one:
a judge refusing rows alone went with `hasJudge`, because the one fact left to
key it on — the console holds no seat — is a television on the wall, which would
have lost the table its vote. Each vote
re-pays the round from the sheets — 2 `POINT`s for an accepted answer nobody
else wrote, 1 for a shared one, no speed bonus — and `host.reveal` is refused
`wrong_phase` while the sheets are open, then settles what is left on the votes
as they stand. A seat the round did not open on is `joined_mid_round` on every
frame. `petitbac.stop`, `petitbac.vote` and `petitbac.doneVoting` are floor
frames; `petitbac.write` is not, for the slate's reason.

`host.awardPlaces` carries the whole placement, and the server pays it:
3, 2 and 1 `POINT`s down the podium, ties sharing a place, everyone else
nought. A placed team pays every seat it opened the round with the same, so
the team is paid exactly the place's pay, once, and the pawn walks 3, 2 or 1 cases
on the reveal. Sent while the round is `playing`, it pays and reveals; sent
again on that reveal, it corrects it — the awards are rebuilt from the
placement and every score moves by the difference, which is why it is not
`host.adjustScore`, whose adjustment would be banked at once and show no move.
Refused `wrong_phase` in any other phase or in another game's round, and
`invalid_message` for a finisher named twice, one the room does not hold, or a
seat in a room playing in teams (a team in one that is not).

Every `host.*` type is listed in `HOST_ONLY_MESSAGE_TYPES`, which the server
checks before dispatch. A test asserts the set matches the naming convention, so
a new host message cannot quietly become player-callable.

## Server → client

Four types, and two of them are role-scoped.

| Type | Payload |
|---|---|
| `welcome` | `protocolVersion`, `sessionId`, `serverTime`, `view` |
| `room.updated` | `view` |
| `time.pong` | `clientSentAt`, `serverTime` |
| `error` | `code`, `message`, `fatal` |

`room.updated` is the only broadcast: after any state change, every socket
receives its whole view. No deltas — a room is at most 24 players changing at
human speed, so a snapshot costs a few hundred bytes and removes every way for a
client to hold a partially-applied update.

### The three views

The host's and the player's below; the wall's is the player's without a seat,
plus the blind test's `audioUrl` and the slate's `correction`, `filledCounts` and
`progress` — its own schema, `wallRoomViewSchema`, whose arms have no field for
`track`, `question` or `keys` to land in.

Shared by all three:

```jsonc
{
  "code": "K3M9",
  "phase": "playing",              // lobby | countdown | playing | buzzed | revealed | finished
  "players": [{ "id": "…", "nickname": "Alice", "score": 2, "isConnected": true }],
  "teams": [{ "id": "team-1", "colour": 1, "name": null,   // null → the dictionary's name
              "score": 1500, "seatIds": ["…"] }],          // empty when the room plays seat by seat
  "settings": { "roundCount": 10,          // null → until the host ends it
                "countdownMs": 3000,
                "mode": { "kind": "typed" },   // buzzer arm adds answerWindowMs
                "game": { "kind": "blindtest", "roundDurationMs": 30000,
                          "difficulty": "wellKnown",
                          // chart | decade | playlist | search
                          "source": { "kind": "chart" } } },
  "round": {
    "id": "…",
    "index": 3,                    // 1-based
    "startsAt": 1786215012000,     // server clock; schedule against your offset
    "advancesAt": 1786215042000,   // reveal only; null → nothing is counting it down
    "activeBuzz": { "playerId": "…", "atServerTime": 1786215014311,
                    "expiresAt": 1786215024311 },  // null → the host decides
    "lockedOutPlayerIds": ["…"],   // answered wrong, out for this round
    "joinedAfterStart": false,     // you took your seat mid-round; in from the next
    "lineUpAt": 0,                 // the line-up entry this round was opened from
    "awards": [{ "playerId": "…", "points": 2, "verdict": { … } }],
    "content": { "kind": "blindtest", "choices": [],
                 "revealedTrack": null }  // filled at reveal, for everyone
  },
  "roundElapsedMs": 8200          // buzz pauses excluded
}
```

`settings.game`, `settings.mode` and `round.content` are all discriminated on
`kind`. The first and the last are where the split between the shelf and one
game on it is drawn: `roundCount`, `countdownMs`, `autoAdvanceMs`, `startsAt`,
`advancesAt`,
the buzz, the lockout and the awards are every game's, and what the round is
*asking* belongs to the game asking it. A client that does not recognise a `kind` has no business
rendering that room at all, which is why the shape moving bumps the version.

`advancesAt` is read with `settings.autoAdvanceMs` beside it: the deadline says
*when*, the setting says how long the whole wait was, and a screen needs both to
draw how much of it is left. They are stamped together and go `null` together,
so one of them missing means nothing is counting this reveal down — the host
advances by hand, or their screen has gone and the server has the room frozen.
Neither case owes the room a bar, and a bar that never empties is worse than
none. A hold the host changes mid-reveal restarts from the change rather than
keeping the reveal's first deadline, because the number they just picked is the
wait they are expecting to watch.

`advancesAt` is when the next clip **starts**, not when the next round opens:
the server opens that round `countdownMs` earlier — and a blind test draws its
track two seconds before that — so the countdown runs over the answer the room
is still reading and the hold is the whole wait. The new round's `startsAt` is
the old `advancesAt`, and every screen keeps the reveal it drew on screen
while the round counts in. The last reveal opens nothing and ends the game at
`advancesAt` itself. A held draw that fails is tried again three seconds later
rather than leaving the reveal standing, unless the source has nothing left.

The bare buzzer's `content` is `{ "kind": "buzzer" }` and nothing else — the
room owns the question, and the server never learns it. The arm exists rather
than the field going `null` because "no content" and "no round" are different
facts.

`settings.mode` is the room's second axis and is independent of the game: how a
round is answered is not what is being played. The game *narrows* which kinds
are on offer — the bare buzzer offers only `buzzer`, and the server refuses a
frame that sets a mode the current game does not serve — and each kind carries
its own settings, which is why `answerWindowMs` appears on the buzzer arm and
nowhere else. A mode where nobody buzzes has no floor to time.

The host view adds what only the host may see:

```jsonc
{
  "currentContent": { "kind": "blindtest",
                      "audioUrl": "https://cdnt-preview…",
                      "track": { "id": "…", "title": "…", "artist": "…",
                                 "coverUrl": "…", "previewUrl": "…" } },
  "challengeHand": [],
  "remainingPoolSize": 7
}
```

**The slate splits its round between the two views on privacy, not on the
answer.** `round.content` carries `itemCount`, `itemStates` (one per item),
`currentItemIndex` (the item on the wall, always a closed one, `null` until the
first closes) and `yourSheet` — the reader's own lines, one per item, each
`{ answer, closedBeforeYou, verdict }`, and `null` for a reader with no seat. It is the only place
a player's answers travel to them, which is what a reload comes back to. The
host arm carries `progress` (`{ playerId, filledCount }` per seat), `keys` (the
host's memo per item, reaching no player frame ever) and `correction`, which is
`null` until an item closes: **the host screen is the wall**, so of an item
still open it holds counts and not one answer. Once one is on the wall it holds
that item, grouped — `{ key, text, playerIds, isCorrect }` per group, blanks
listed apart as `blankPlayerIds`. A line's verdict is `null` until its group is
judged or the wall has moved past its item, which is when an answer nobody
validated becomes wrong — and stays `null` on an item that closed before the
reader held a seat, which `closedBeforeYou` says outright so a screen does not
draw that line as a blank.

**The world map hides the markers, not the country.** Its question is *place
this country*, so `round.content.target` (`{ kind: 'country', countryCode }`)
is public from the first frame — naming it *is* the question, and every screen
already draws the map that answers it. A French city (`settings.game.places:
'frenchCities'`) is the one target with something to hide: its `{ kind: 'city',
name, point }` carries the name from the first frame and the point `null` until
the reveal, since where it stands is the answer and no screen draws it. A
world capital (`'worldCapitals'`) hides one thing more: `{ kind: 'capital',
names, point, countryCode }` carries its name in both languages from the first
frame, and both the point and the country `null` until the reveal, because a
country named beside Canberra turns *where is it* into *what is the capital of
Australia*. What a player answers is a point in degrees, which the device
inverts from its own projection: the server decides what it hit, against
Natural Earth's 1:50m outlines read once as the round opens, and no screen ever
sends a country or a distance. `revealedPlacements` (`{ playerId, point }` per
seat) is `null` until the reveal, because a marker seen on another screen is an
answer to copy. The grade is a third shape of verdict, `{ kind: 'distance',
distanceKm, target }` — to a country nought inside, otherwise the way to the
nearest border; to a city or a capital the way to the place itself — priced by the
`target`'s own tiers in `@melee/core/atlas/distance-tiers`, the speed bonus capped by
the tier as everywhere else. It is answered in a mode of its own, `point`: one
shot a seat, like a pick, and offered by no other game.

`audioUrl` and `track` are separate because a host who has taken a seat keeps
the first and gets `null` for the second: that screen still has to play the
clip, and must not be handed the answer.

That is the whole of the seated host. One screen is the speaker and a player at
once — the seat is taken by putting a nickname on the host's `hello` — and the
moment it is taken, `toHostView` nulls the answer inside `currentContent`,
because a payload that screen could read in a console is not a guarantee. The
judge's copy and the speaker's copy were one field once, and conflating them is
what made "host and player" impossible. The residual leak is the catalogue id
inside the URL, which is why the seat is offered rather than assumed.

**There is no seat message, so the seat is only ever as durable as the name the
console replays.** A socket blink keeps it because the page never went; a tab
discarded on a screen lock is a *reload*, and a name held in component state
alone died with it. It is kept on `melee:seats` beside that room's session id,
which is what makes the two survive together.

**A round the console has to judge is sat out by its seat**, never taken from
it: the seat keeps its player and its score, is left out of the round's stamp
(`playingSeatIds` in `domain/room/console-seat.ts`), its frames playing that
round are refused `judging_round`, and the host view carries the answer as if
nobody were seated. It plays again on the next round nobody judges — a line-up
mixing a quiz and the bare buzzer used to make the host a spectator for the rest
of the evening, its points gone with the seat. `isJudgedByHost` over what the
round was **opened** on is the rule. Only one thing withholds the seat itself,
on `hello` and on the settings frame that sets it (`hostMustJudge`): teams
answering aloud. Buzzer mode is
what asks for a judge; the reflex race shares that mode and needs none, because
being first *is* being right there. The slate is the other way round: it is
`typed` — a sheet is typed — and still judged, because its host holds the key
and marks the sheets.

**A console's tab closing ends both of the things it was.** `onClose` asks two
questions, and the seated host is the one socket that answers both — whether the
room still has a screen, and whether that seat still has a socket. It used to
return after the first, so a console that had taken a seat left it lit on every
screen for the rest of the evening, and the sweeper never came for it either:
`disconnectedAt` was never stamped, which is the only thing it reads. The seat is
settled first on the way out, because holding the round for an absent host
cancels every timer releasing a buzz would arm.

`roundElapsedMs` is shared rather than the host's, because it is the room's
clock and not the speaker's: the host seeks the track back to it after a reload,
and every screen arms the round bar from it — a player whose screen locked
comes back to where the room is rather than to a full one. It says how long a
round has been open, which the console is already showing to everybody.

The player view adds instead:

```jsonc
{ "youId": "…" }
```

Both views carry `yourVerdict`: the halves *the reader* has banked this round,
and `null` before their first guess or when they hold no seat. Typed mode takes
as many guesses as the clip allows, so a player has to be told which half they
already hold. It is scoped to the reader — everyone else's progress stays secret
until the reveal, like `revealedAnswers`.

`round.joinedAfterStart` is scoped the same way, and is the round's answer to
"what is this one to **you**". A round stamps who it opened on when its clip
starts — the countdown is still *get ready*, so a player who lands inside it is
in the round — and waits for those players and nobody else before closing a
phase. A latecomer keeps its seat and plays from the next round; everything it
could send in this one is refused with `joined_mid_round`, which is the backstop
behind the screen rather than the mechanism. One stamp covers the whole round.

`HostTrack` reaches the wire in exactly two places: the host view, and
`round.content.revealedTrack` once the round is over — and the reveal carries no
`previewUrl`.

This is enforced twice. `HostServerMessage` and `PlayerServerMessage` are
separate unions, so only host variants mention the host view; and player frames
are encoded with `encodeChecked`, which parses through the schema so Zod drops
unknown keys. The second layer exists because TypeScript's excess property check
does not fire on a value passed through a variable.

## The stimulus happens locally, and a floor is what pays for it

The fifth guarantee, and the first one the shelf grew rather than opened with.

Buzz order is stamped on arrival, which is what makes *who was first*
unforgeable. That measures **arrival**, and a game whose whole subject is
reaction needs arrival *minus the moment the stimulus happened*. Broadcasting
the stimulus gets that wrong in the one way that matters: every screen would
flip when the frame lands, so a player on a slow link reacts late by exactly
their latency and the race is won by the best Wi-Fi in the room.

So the moment travels **ahead of itself**. `round.content.flipsAt` is a server
timestamp on both views, and every device schedules against its own estimated
offset — the same mechanism the countdown already runs on, and the reason
`clock-sync.ts` exists. Latency drops out of the measurement entirely.

That hands a scripted client the moment in advance, and the answer is not to
hide it. Hiding buys nothing — the countdown gives it away — and costs the
mechanism. **A press arriving less than `FALSE_START_FLOOR_MS` after `flipsAt`
is a false start**: refused with `false_start`, and the player sits out the rest
of the round. Human simple reaction to a visual stimulus does not go below about
150 ms, so the floor costs an honest player nothing and makes scheduling a press
self-defeating — the scheduled press lands too early to be accepted, and only
jitter could save it.

One rule covers both halves of the problem, because a press that beat the flip
measures negative and a negative is under the floor. `packages/core/src/reflex/`
holds it, with no I/O and a test of its own; the next reflex-shaped game
inherits it rather than re-deciding it.

## Errors

```jsonc
{ "type": "error", "code": "nickname_taken",
  "message": "Someone already took that name", "fatal": false }
```

`fatal` decides whether the client stops reconnecting. A refusal the user can
act on is non-fatal, so the socket stays open and the form retries on it:
`nickname_taken`, `room_full`, `room_plays_aloud`, `host_only_action`,
`invalid_message`, `sheet_not_full`.

Fatal, followed by close code 1008: `room_not_found`,
`protocol_version_mismatch`, `host_already_connected`, `host_reconnecting`.

**A fatal frame ends the session on its own.** The client acts on the frame, not
on the socket closing after it, and the difference was invisible while every
fatal refusal came from `reject`, which sends and then closes. `host.closeRoom`
broke the tie: the server is answering a *third party*, so the error lands on
two dozen player sockets nobody is closing, and every screen sat on a stale
scoreboard — live and lying — while the room no longer existed. A fatal code may
therefore be sent to a socket the server keeps open, and that is not a loose end
to tidy up by closing it too. It is the guarantee the client owes.

`removed_by_host` is the same shape one scope down, and it was the whole of what
`host.removePlayer` was missing: the seat came off the roster and the screen was
told nothing, so it kept receiving `room.updated` with a `youId` no longer in
`players` and quietly fell back to *You* and `0` — a screen that had stopped
counting and did not say so. The frame goes to that player's connections only,
before the seat is taken, and their connection is unregistered on the way out so
the broadcast that follows never reaches them. It is one of the two refusals in
`refusalVoidsSeat` for a room that still answers: the code keeps resolving, and a
claim replayed on the next reload would be welcomed straight back in.

A console that took a seat is refused nothing when the host removes it from the
roster. It is losing the seat, not the room it is running, and there is no frame
that says that — the one above would be a lie its own screen would act on.

`host_already_connected` now travels both ways for the same reason: at the door
it is `reject`, and to a console displaced by a screen presenting the token it is
a bare frame on a socket that did nothing wrong. A `Connection` carries a `send`
and never its own socket, so closing somebody else's is not something the server
can do anyway.

**A code exists when something sends it.** `not_implemented` was the one
exception — a placeholder so a half-built stage could answer honestly instead of
borrowing a code that meant something else — and it outlived the last stage that
sent it by four games, as dead vocabulary carrying a translated string in both
locales. It is gone. The next thing that is not built yet does not get a code
for saying so; it gets finished, or it stays off the wire.

## Versioning

`PROTOCOL_VERSION` is sent in `hello` and echoed in `welcome`. A mismatch closes
the socket — both sides ship from this repository, so the only realistic cause
is a tab left open across a redeploy, and a stale tab desynchronising a live
game is worse than a reload.

Bump it only when an older peer could **mis-read** a frame. Adding a field or a
message an old client ignores does not qualify.
