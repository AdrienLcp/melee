# Handoff — every seat in « Cette manche », answer times, Most likely's voters

_Saved 2026-11-28 · `C:/git/melee`, on `main`. Wave 1. Start with the
`impeccable` skill (layout on three screens). Touches the award schema:
`answer-at-time-out` waits for this one to land._

## 1. The player's « Cette manche » lists every seat

Adrien: « sur l'écran de joueurs, on voit tout le temps le classement générale
de la partie, parfait. Mais le classement de la manche y a que quelques joueurs
des fois, il faut toujours tout mettre, on a la place, ici. Pour le wall ce
serait bien d'en montrer plus, mais […] j'accepte qu'on coupe un peu et qu'on
mette que le top ».

One component, `apps/game/src/presentation/components/round-podium.tsx:87-192`,
cuts three times:

1. only seats that scored (`roundScorers`, `apps/game/src/helpers/round-scorers.ts:22-28`);
2. the top three (`PODIUM_PLACES = 3`, `round-podium.tsx:104`) unless
   `isEveryScorer`, which the player screen passes on the final reveal only
   (`player-round-stage.tsx:323`);
3. a CSS height cut to the first alone + « + N autres »
   (`player-round.sass:51-56, 661-665, 684-685`).

**Decided.** On a player's screen, every reveal lists **every seat the round
opened on** (`openedWithPlayerIds`), scorers first by points then the rest at
0 — a wrong answer and a silence are shown as such, quietly. The player's
reveal scrolls (`screen-roles.md`: its first viewport owes the answer, the
seat's own result and the podium, the standings come after), so the height
cut goes on the player. The wall and the console keep the cut order
`screen-roles.md` lays down, but start from **as many rows as fit** rather
than three — top five on a 1080p wall is the target, then three, then the
first alone, then the count. Update `screen-roles.md` with the new order.

## 2. The time each seat took

Adrien: « afficher le temps que les gens ont mis sur l'écran des résultats pour
blind test, quiz, etc... quand c'est possible ».

The true figure is `PlayerAttempts.scoredAfterMs` — round-clock elapsed when
the seat scored, pauses excluded (`round-service.ts:1106-1112`, `room.ts:343`)
— feeding `clockedPay`; it is **never serialised**. `atServerTime` on answers
is the first guess's wall-clock time, pauses included: not the figure.

**Decided.** Carry `scoredAfterMs` on the award (`packages/protocol`, the
scoring schema) for every clocked game, `null` where there is no clock or no
perfect answer; print it on each podium row as seconds with one decimal
(« 3,4 s », locale-formatted through the dictionary), next to the `90 +7`
split. Safe to send: it is published after the reveal. Reflex already shows
press times — keep its own display.

## 3. Most likely: who voted for whom

Adrien: « sur l'écran des résultats, on ne voit pas qui a voté quoi. Je te
laisse voir c'est quoi la meilleure UI […]. Si c'est trop lourd pour l'écran
wall / hôte, on peut le mettre uniquement sur l'écran joueur ».

Today ballots are secret on purpose (`packages/protocol/src/most-likely.ts:17-25`
says who voted for whom is never sent); the tally carries counts only, and the
awards leak part of it anyway (the seats paid voted with the room). Adrien asks
for it: the reveal is the fun of this game (« qui a voté pour moi ? »), so the
secret ends **at the reveal** — the ballots stay withheld while voting.

**Decided UI.** `MostLikelyTally` (`apps/game/src/presentation/components/most-likely-tally.tsx`)
keeps one row per seat that drew votes; the vote pips become **the voters'
pawns** (small, with their colour and initial, the full names on the player's
screen beside them). At most 24 pawns in total, spread over the rows, fits a
wall. If the wall cannot hold 24 pawns legibly at its smallest shape, it falls
back to today's pips and the names stay on the phones — decide by measuring,
24 seats with long names. Protocol: `tally` gains `voterIds`, through the
player, host and wall schemas; update the doc comment and the server test
that asserts the secret (`most-likely-game.test.ts:183-214`) to the new
contract — still nothing before the reveal.

## Verify

Muted browser, 24 seats with long names: a quiz round where a few score, a
few miss, a few say nothing — the phone lists all 24 with times; the wall
shows its cut. A Most likely reveal with votes spread and with one seat
taking all. Phone width, ~1000px, a 1920×1080 wall, both palettes. Film the
podium's entrance. CHANGELOG entries.
