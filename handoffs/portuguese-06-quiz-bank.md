# Portuguese 06 — A Portuguese quiz bank

Series: `handoffs/README.md`. Read `docs/plans/72-portuguese.md` first, then
`docs/plans/14-question-languages.md` and the plans that built the French and
English banks (their sources and build scripts in `apps/server/scripts/`).

The quiz deals from `question-bank.json` (6.7 MB), grouped by each row's
`language`: 7,988 French rows, 4,968 English, none Portuguese.

## The work

1. **Look for an open Portuguese source first** — an openly licensed trivia
   set in European Portuguese, the way OpenQuizzDB serves the French bank.
   Licence checked and named in the credits page; Brazilian sets only if the
   wording is fixed to pt-PT.
2. **Translate the international rows of both banks.** Drop what only one
   culture knows (French TV hosts, US college sport), keep the rest, dedupe
   the questions both banks ask. Aim for at least 2,500 rows covering all
   nine categories, no category under 150. Batches of about 200 per subagent,
   each spot-read by a second. A row's four candidates must stay four
   distinct answers in Portuguese, and the "one edit short of a decoy"
   forgiveness rule (`CLAUDE.md`, _Guess_) must still hold after translation —
   the bank test checks it.
3. **Add Portuguese rows** in the categories a Portuguese table would miss
   most — history, geography, sport, music of Portugal.
4. `choiceOnly` carries over from the source row. No adult content in v1
   (`core/quiz/adult-content.ts` covers French alone).

If this runs past the session's budget, stop at a category boundary, commit,
and leave the rest in this file.

## Done when

The bank holds `pt` rows in every category, the question-bank tests pass on
them, the credits name the source, `pnpm validate` is green, this file is
deleted and its row struck from `handoffs/README.md`.
