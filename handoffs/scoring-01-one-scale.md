# Scoring, part 1 — one scale for every game, the answer before the clock

> « Dans le jeu "Atlas", les kilomètres devraient donner plus de points que la
> vitesse de réponse. On a vu plusieurs fois où quelqu'un était plus proche
> qu'un autre joueur mais avait moins de point qu'un autre qui était plus loin
> mais avait répondu plus vite. »

> « Les points sont déséquilibrés entre certains différents jeux, certains en
> rapportent trop […] il faut équilibrer pour que chaque jeu rapporte à peu
> près la même chose pour éviter qu'un joueur s'envole parce qu'il est fort
> qu'à un seul jeu. »

> « Quand on a joué au "plus ou moins", des gens qui étaient très loin de la
> bonne réponse ont quand même eu des points (juste parce qu'ils étaient sur
> le podium). »

> « Au jeu "allumettes", pas besoin d'avoir la phrase qui explique les points
> qui seront marqués et pourquoi, on met juste ce qu'il faut faire. »

Adrien welcomes a full rewrite of scoring ("quitte à faire une refonte
complète"). This session rewrites the **rules**: what a round pays, in core,
server, protocol, tests and docs. **The board-or-points split is part 2**
(`scoring-02-board-or-points.md`). Run that one after this one, because the
number of steps a pawn moves will be derived from the scale defined here.

## What exists (audited 2026-11-07)

- Every figure is in board units. `POINT = 1000`, and a screen prints
  board ÷ 100 (`apps/game/src/helpers/shown-points.ts:11-15`). The constants
  are in `packages/protocol/src/scoring.ts`: choice 1000, typed 3000, claim
  1000, `MOST_A_SPEED_BONUS_PAYS` 3000 (L85).
- The speed bonus is `round(min(3000, answerPaid) × (1 − elapsed/duration))`,
  in `packages/core/src/scoring/speed-bonus.ts:25-45`. It can **double** a
  score. `isPaidForSpeed` (`scoring/verdict.ts:118`) leaves out `cells`,
  `colour` and `number`. A round is assembled in
  `apps/server/src/domain/round/round-service.ts:835-905`
  (`settleSimultaneousRound`). The games that do not go through it are settled
  in their own `*-round.ts`.
- **Atlas** pays in steps, not on a curve (`packages/core/src/atlas/distance-tiers.ts:12-40`).
  For a country: inside 3000, under 500 km 2000, under 1500 km 1000. Speed is
  added on top. The reported bug, with the real constants on a 30 s round:
  A clicks inside at 25 s and gets 3000 + 500 = **35**. B is 400 km off at 2 s
  and gets 2000 + 1867 = **39**. Inside one tier, 1 km and 499 km pay the
  same, and the tier edge makes a cliff.
- **The "far off but on the podium" game is Le juste chiffre (`estimate`),
  not Plus ou moins.** `ESTIMATE_PLACE_PAYS = [3000, 2000, 1000]`
  (`packages/core/src/estimate/estimate-pay.ts:22`) pays by place, and the
  only guard is `OUT_OF_REACH_RATIO = 10` (L9). With a truth of 100, guesses of
  900, 950 and 1000 are paid 30, 20 and 10. Plus ou moins
  (`higherlower/pairs-pay.ts:11`) pays only a right pick. Tell Adrien that the
  game he named is the other one.
- Maximum per round, as printed today: buzzer, reflex and most likely **10**;
  quiz and blind test in choice mode 20; estimate, swatch, inner clock and
  challenge 30; typed modes, atlas, timeline, matchsticks and petit bac 60;
  slate 100, up to **600** with 60 items; black square **180**, up to **360**
  when it doubles lone finds. A full black square sheet is worth eighteen
  reflex rounds. This is the imbalance he felt.
- Tests that pin each game's pay: `packages/core/src/**/*-pay.test.ts`,
  `scoring/*.test.ts`, `board/*.test.ts`, `team/*.test.ts`, and the server
  suites in `apps/server/src/__tests__/<game>.test.ts`.

## What is decided (proposed in chat on 2026-11-07, see "Open" for what he may still change)

1. **One scale: a round pays at most 100 printed points, in every game and
   every mode.** A sheet (black square, petit bac, slate) is one round, so a
   full sheet is worth 100, and its items share that 100. Typed no longer pays
   three times choice: the room plays a single mode, so the ratio only ever
   made one game worth more than another. Inside a round, the order between
   players is unchanged.
2. **The answer pays first, the clock settles near-ties.** In a game with a
   clock, quality is worth up to **90** and speed up to **10**, never more
   than 10% of what the answer earned (a wrong answer earns no speed). Speed
   can only reverse two players whose answers are within 10 points of each
   other.
3. **Atlas pays on a continuous curve, not steps**:
   `90 × max(0, 1 − d / reach)`. A click inside the country pays 90. `reach`
   starts from today's outer tier: country 1500 km, capital 1000 km, city
   150 km. On the bug case, A gets 90 + 1.7 = **91.7** and B gets
   66 + 9.4 = **75.4**. The closer player wins.
4. **Le juste chiffre pays for precision, not for place.** Use the log-ratio
   error `e = |ln(guess/truth)|` and pay `100 × max(0, 1 − e / ln 2)`. That
   gives 100 for an exact guess, about 86 at 10% off, 68 at 25% off, 41 at
   ×1.5 and 0 from ×2. Truth 100 with a guess of 900 pays 0. Tune the cut-off
   (×2 or ×3) against `estimate` bank questions with wide answers before
   fixing it, and show the tuning.
5. **Games paid by rank or by count** move onto the 100 scale:
   - reflex: the first press gets 100;
   - buzzer: a right claim gets 100;
   - most likely: every ballot that went with the room gets 100;
   - challenge: 100 / 66 / 33;
   - timeline: 0, 1 or 2 swapped pairs pay 90 / 60 / 30, plus speed;
   - matchsticks: 90 / 60 / 30, plus speed;
   - swatch and inner clock keep their curves, scaled to 100.
   
   Black square keeps its 1/2/3 tiers by thirds as **shares of 100**. Its
   lone-find doubling must stay under the 100 cap. The cleanest option is
   probably that it changes the shares and not the total.
6. **Remove every "how the points work" sentence a game shows while it is
   played.** Keep only what to do. Audited: matchsticks is the **only** game
   printing one on the answering screen — `matchsticks.numberRule.move` /
   `.buzzer` (`dictionary-en.ts:1399-1400`, `dictionary-fr.ts:1333-1335`),
   rendered by `presentation/components/matchsticks-prompt.tsx:56-65` (player
   `player-round.tsx:876,1204`, seated console `playing-stage.tsx:125`,
   console and wall `room-stage.tsx:438`). Drop the points part and **keep**
   "a number never starts with 0", which is a rule. The between-round
   `ScoringRule` (`presentation/components/scoring-rule.tsx:29`, every
   `*.scoring*` key through `scoringKey()` in
   `presentation/i18n/translation.ts:72-215`, shown on the player's up-next
   card `player-round.tsx:972` and the lobby `lobby-stage.tsx:297`) stays,
   since before a round is where a table reads the rule, but every one of
   those sentences is **rewritten to the new scale**, `round.speedRule`
   included.
7. Keep internal integer units. Either keep `POINT = 1000` and treat 100
   printed as `10 × POINT`, or re-base so printed = board. Pick whichever
   leaves fewer conversions, and fix `shown-points.ts` and
   `host.adjustScore`'s ±step to match.

## Open — weigh it, decide, and say why in the final reply

- Whether a clockless game (swatch, inner clock, estimate, the sheets) pays
  the full 100 on quality, while a clocked game pays 90 + 10. Recommended:
  yes, since the maximum is 100 either way.
- `paysForSpeed: false`: quality alone is then scaled to 100, so a table of
  children loses nothing.
- Teams (`team/team-score.ts:23`, `balanced` mean by default) keep their rule.
  Check that it still reads right on the new scale.

## Docs and changelog that must follow

- The "Answer mode" paragraph in `.claude/CLAUDE.md` (MOST_A_SPEED_BONUS_PAYS,
  "typing pays 3 for the pair", "the clock never pays more than the answer
  did").
- `docs/realtime-protocol.md` L200-202, 514, 543, 564, 624 (it states petit bac
  pays 2/1, which is already wrong: the code pays 1/½), 631-635, 800. Also
  L333: team score is a mean, not a sum.
- `docs/game-catalogue.md` ~L271-285, and the CHANGELOG / PRODUCT.md lines on
  scoring.
- If a wire shape changes (`Award`, settings), bump the protocol version as
  `.claude/rules/realtime-protocol.md` says.

## Verify

- Red-green in core: `pnpm test:core:watch`. Each pay function gets a test
  that pins the new figures. Add one that reproduces the Atlas bug case (A
  inside at 25 s beats B at 400 km at 2 s) and one where a far-off estimate
  pays 0.
- Add a cross-game test: for every game, the best possible round pays exactly
  100 printed points. That test is the balance guarantee.
- The scoreboard and reveal still print correctly. Check in a real browser,
  muted (`docs/browser-driving.md`), with one round each of atlas, estimate,
  black square and quiz, at 1280×800 and 390×844. The printed "90 +7" split
  should read right.
- `pnpm validate` once at the end, unless another session is running it.
