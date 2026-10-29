# 56 — Most likely (who among us)

**Done** — served and on the shelf.

A line goes up on every screen — *who is most likely to talk to their
plants?* — every seat votes for a seat on its own screen, and the reveal
shows who the room chose. Those who voted with the room score.

The fourteenth game, and the only one about the people at the table rather
than what they know: no answer exists before the votes do, so nobody is
better at it. **Everyone at once** in the catalogue's shapes, with a vote
for a *seat* where Petit Bac votes on an answer
([`game-catalogue.md`](../game-catalogue.md), *Qui est le plus susceptible
de…*).

Kind `mostlikely`, translation prefix `mostlikely.*`, answer mode `vote`.
*Qui de nous ?* in French, *Most likely* in English.

## Rules, as settled

- **A line is never situational.** It assumes no meal, no evening, no room,
  no party, no relationship between the seats — a table plays it at noon in
  an office as at Christmas. It is about the person, never about the moment.
- **A line is kind.** Funny about a habit, never about a body, money
  troubles, a couple, drink or anything a grandmother and a twelve-year-old
  could not both laugh at. Read by hand, row by row, like Black square's
  black words.
- **French lines are gender-neutral**: *Qui a le plus de chances de…* rather
  than *le plus susceptible*, and no adjective that agrees with the person
  voted for, since the line is written before anyone is.
- **The bank** is `apps/server/src/infrastructure/questions/most-likely-bank.json`,
  127 lines in both languages at once, each `{ id, labels: { en, fr } }` like
  the challenge bank. A room is never dealt a line twice; a spent bank
  deals again from the full list.
- **A ballot is one seat**, any seat the round opened on, the voter's own
  included — owning up is half the fun. One shot, like a pick: a vote that
  can move is a vote that waits to see the others.
- **Ballots are secret until the reveal, and anonymous after it.** The
  reveal shows each seat's count, never who voted for whom; a seat sees its
  own ballot back. A table of family members should not have to explain a
  vote.
- **The round closes** when every seat it opened on has voted, or when
  `roundDurationMs` runs out — 30 s by default, 10–90.
- **The pay.** The room's choice is the seat (or seats, on a tie) with the
  most votes, and only if that is at least two: a round where every ballot
  went somewhere different chose nobody. Every ballot for the room's choice
  is paid one point. No speed bonus — a quick vote is not a better one —
  and the seat chosen is paid nothing for it.
- **Nobody judges.** The server decides, so a seated host plays every round:
  there is no answer to withhold.
- **No duel.** Two seats voting for one of themselves is not a round.

## Steps

1. **Protocol, core and server, in one go.** Adding `mostlikely` to
   `gameKinds` breaks every exhaustive table at once (stage 50 learnt it), so
   the kind lands served. `@melee/core/mostlikely/` holds the tally, the
   room's choice and the pay, with tests; the bank's loader sits beside the
   challenge bank's, with a test. The socket suite: a ballot for a seat the
   round did not open on, a second ballot, a latecomer's — all refused — and
   no ballot but the reader's own on any frame before the reveal.
   **Done.** As built: the round keeps `ballots: { playerId, seatId }[]`
   (not `sent[]`); a ballot grades to an empty `said` and a placeholder
   `single` verdict, which `payBallotsWithTheRoom` rewrites at the close, so
   the reveal's answer list never says who voted for whom. A ballot for a
   seat the round did not open on is `invalid_message` — no screen offers
   one, so it needs no code of its own. A spent bank deals any line again.
   The French bank test checks for *qui* anywhere, since two lines open on
   *À qui* and *De qui*. The dictionaries hold only `name`, `scoring` and
   `host.answerMode.vote` so far.
2. **Screens**, and `mostlikely` into `shelvedGames`: the line on the wall
   and on every seat, the seat picker, the reveal as a tally, the console's
   setup, the dictionaries, the spine tokens; seen on a wall, a seated
   console and two phones, muted.
   **Done.** As built: the line on a paper card over a grid of `SeatTile`s
   (pawn and name on a piece, *You* on the voter's own), the pressed one on
   the saffron piece and the rest sunk once spent, like the answer tiles. The
   reveal is `MostLikelyTally`, shared by the console and every seat: a row
   per seat somebody voted for, a dot a vote drawn as one CSS run, the room's
   choice on saffron, the reader's ballot in the keyline. The console lists
   who voted with the table under it, and nothing when nobody did — the
   count already says so. Seen muted in a browser on a 1280 console and a
   390 seat, a chosen round and a scattered one; the seated console's
   ballot shares the seat's component and was not driven.

## Where it lands — swatch is the template

Swatch (stage 54) is the last game added and every file it touched is one
this game touches; `git show --stat 0aea393 14f1f05 bf29c10` lists them.
What differs:

- **The ballot is a `player.answer` arm**, `{ kind: 'seat', playerId }` in
  `client-message.ts`, so the one-shot refusal, `everyoneIsDone`'s early
  close, the roster stamp and `joined_mid_round` all come for free. The
  refusal of a seat the round did not open on goes in `registerAnswer`.
- **Ballots ride on `Round.content` as `sent[]`**, projected like swatch's
  `revealedColours`: the tally `null` until `round.revealed`, `yourBallot`
  for the reader.
- **The pay is a `closeRound` branch of its own**, like slate's and inner
  clock's in `round-service.ts`: grading at answer time cannot know the
  majority. It never reaches `settleSimultaneousRound`, so there is no speed
  bonus to switch off.
- **Exhaustive tables to fill**: `DEFAULT_GAME_SETTINGS` (`game.ts`),
  `DEFAULT_ROUND_COUNT` / `DEFAULT_ANSWER_MODE` / `DEFAULT_HOLD_MS`
  (`room-settings.ts`), `capabilitiesOf` (`game-capabilities.ts`, a
  `VOTE_ONLY` tuple, no duel), `DEFAULT_MODE_SETTINGS` (`room.ts`, the new
  mode), `candidatesIn` (`answer-forms.tsx`), `holdsTheAnswer`
  (`round-content.ts`), `scoringKey` and `ServedMode` (`translation.ts`),
  `GAME_GLYPHS` (`icons.tsx`), `PAGE_HEADS` (`document-head.ts`).
- **The shelf card is not written**: `game-shelf.tsx` maps `shelvedGames`
  over the `mostlikely.tagline`, `.home.description` and `.play` keys.
- **Also**: `abstraction-boundaries.md`'s bank row, `cspell.json`,
  `docs/realtime-protocol.md`, `docs/game-catalogue.md`'s row, and
  `.claude/CLAUDE.md`'s game list and prefixes — which never got `swatch.*`
  either.
