# Difficulty, part 1 — one setting, every game that can take it

Wave 1. Everything after it builds on the shape decided here.

## What Adrien asked (2026-11-08)

> Les jeux concernant les capitales, les drapeaux, etc. sont un peu difficiles,
> on a jamais de trucs facile, j'ai l'impression qu'il n'y a QUE du difficile.
> Je n'ai rien contre avoir du difficile, mais ce serait bien d'avoir TOUT.
> Voire même pouvoir paramétrer le niveau de difficulté.

> Je veux un mélange aléatoire. On ne prend les faciles que quand on coche
> « facile », parce que des enfants jouent par exemple. […] Je me demande s'il
> faut pas un bouton unique où si on choisit « facile », ça passe tous les jeux
> en facile (mais aussi pouvoir gérer chaque difficulté de chaque jeu).

## Decided

- **Three levels, one vocabulary for every game**: `easy | mixed | hard`,
  default `mixed`. Not "normal": beside "mixed" nobody can tell them apart.
- **Every dealt item carries a tier** `easy | medium | hard`.
  - `easy` deals the easy tier alone — the table of children.
  - `mixed` draws a **tier uniformly, then an item inside it**. This is the
    "mélange aléatoire" Adrien asked for: a uniform draw over the item list
    is _not_ a mix, because the flag bank is two thirds obscure (152 of 229
    rows), which is exactly why every evening felt hard.
  - `hard` deals medium and hard, never easy.
  - An empty tier falls through to the nearest one; a level never stalls a
    deal.
- **The points do not change with the level.** Every round still pays at most
  `MOST_A_ROUND_PAYS`; the question gets easier, never the payout. A score must
  mean the same thing from one evening to the next.
- **Look-alike decoys stay** (flags that resemble each other, neighbouring
  countries) in `mixed` and `hard` — Adrien: "les drapeaux qui se ressemblent,
  c'est ok". Only `easy` may soften the shape of a question (part 3 and 4 say
  how, game by game).
- **This reverses a past decision on purpose.** The quiz has a switch,
  `wellKnownOnly`, because the French bank cut in thirds left `difficile` with
  five history questions (`5d6609f4`, `docs/plans/21-well-known-questions.md:76`).
  `docs/plans/22-thin-french-subjects.md:428` deferred the picker until the
  numbers were in; plan 22 filled those subjects, and the country rubrics never
  had the problem (one category of 173–229 rows each).

## The work

1. **Read `docs/game-catalogue.md` first** — this adds a field to many arms of
   `settings.game` and asks whether a room-wide value exists.
2. **Protocol** — a `difficultySchema` (`easy | mixed | hard`) and a
   `difficulty` field with `.default('mixed')` on each arm that deals content
   (so a stored `HostPreferences` written before still parses):
   - quiz — replaces `wellKnownOnly` (`packages/protocol/src/question.ts:129-147`,
     default `game.ts:340`). The quiz arm is `questionDrawSettingsSchema.extend`
     at `game.ts:174-178`; Le Fake shares `questionDrawSettings`, check it.
   - blind test — `trackDifficultySchema` (`track.ts:176`, `game.ts:93`) is
     `wellKnown | mixed | obscure` today. Fold it into the shared one
     (`wellKnown → easy`, `obscure → hard`) and read the old values from stored
     preferences with a `z.preprocess` or `.catch`. Check what its `mixed`
     does today and keep that meaning.
   - atlas (`game.ts:201-212`), timeline (`:196-200`), estimate (`:225-229`),
     higherlower (`:230-234`); defaults at `:352`, `:378`, `:384`.
   - Part 5 decides which of the remaining games take it; leave them out here.
3. **Core** — one tier-aware draw in the shell (`packages/core/src/round/` or
   wherever the existing pickers live), with tests: `drawByDifficulty({ pool,
   tierOf, difficulty, random })`, implementing the rules above including the
   fall-through. Break a test on purpose once.
4. **Server** — pass the arm's `difficulty` to every draw:
   `round-conductor.ts:120-141` (Atlas), `:446`, `:534`, `:565` (timeline,
   estimate, higherlower call their draws with `playedIds` only),
   `questions/question-bank.ts:171-202` (`drawQuestion`, filter at `:189`).
   Until parts 3–5 land the tiers, map what exists: quiz and rubrics
   `isWellKnown → easy`, the rest `hard`; quantities `isFamousQuantity → easy`,
   `isWellKnown → medium`, rest `hard`; Atlas and timeline every row `medium`
   (so `easy` and `hard` fall through to it — today's behaviour).
5. **Tests** in protocol, core and server; `pnpm test`. No UI in this part:
   part 2 draws the picker.

## Out of scope

The picker and the room-wide button (part 2), the tiers in each bank (3, 4, 5).

## Done when

Every arm above parses an old stored setup, a room set to `easy` by frame
deals only easy-tier items in each game (server test), and `mixed` over a
skewed pool deals each tier about a third of the time (core test).
