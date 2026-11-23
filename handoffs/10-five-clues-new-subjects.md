# Five clues, step 2: people, characters, films, and more

Starts once `09-five-clues-any-subject.md` has landed (it builds the
subject-agnostic ladder this fills). Read `README.md`, plan 73 as 09 left it,
and `docs/game-catalogue.md`. Every choice is weighed by fun at the table,
never by cost.

Adrien: "other themes — fictional characters, real people, films, I don't
know, a bit of everything. It needs to grow a lot."

## To settle at the start (decide, then tell Adrien in the record)

- **Subjects**: at least real people, fictional characters, films, and
  countries; weigh animals, landmarks, brands, sports clubs, inventions by
  how well five graded clues work for them (vaguest to giveaway) and how
  many a table knows.
- **Source**: hand-authored banks per language (like black square's authored
  themes) or generated from Wikidata (as `apps/server/scripts/mintaka-source.ts`
  does — occupation, birth year, nationality, works), images from the
  Commons `picture-bank.json` / `build-picture-bank.ts`. Generated decoys
  inherit the wrong-kind problem handoff 05 fixed: reuse its narrowing.
  Fun first: a clue ladder written by hand reads better; a generator may
  draft and a review pass keep only good ladders.
- **Languages**: fr, en, pt each, and which subjects are universal vs tied to
  one culture — tag it on every row (`homeCountry`-style, as estimate does),
  because handoff 11's International evening deals only universal rows.
- **Staircase**: each authored ladder names which decoy each rung rules out
  (09's rule); a build check enforces it.
- **Line-up**: how Mêlée générale and Culture générale deal subjects (one
  entry per subject as variants, or a mixed entry), and the game's front
  door setup (a subject picker).

## Size

Aim for a pool deep enough that an evening never repeats: hundreds of
ladders, not dozens. If it doesn't fit one session under ~150k tokens, ship
the subjects one by one (each complete in three languages) and leave the
rest in this file for the next session.

## Done when

The subjects dealt in three languages from the shelf's setup and in the
ready-made line-ups, each ladder passing the staircase check, the screens
seen with text and image rungs, filmed. Plan 73's record, changelog,
CLAUDE.md's game list sentence, delete this file and its README row.
