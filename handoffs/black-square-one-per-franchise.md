# Black square — one film per franchise

> « On a eu des "cases noires" où il y avait 4 "Shrek" différents, c'est
> dommage, il vaut mieux mettre d'autres films, et garder "Shrek" tout court
> plutôt que mettre les suites, qui sont nommées différemment. Idem pour les
> autres licences évidemment. »

Data and build-script work, with no UI. It can run beside any other handoff.

## What exists (audited 2026-11-07)

- There is one bilingual bank,
  `apps/server/src/infrastructure/questions/black-square-bank.json`: 167
  themes, each with exactly 9 answers `{id (Wikidata QID), labels, aliases,
  views}`. Its schema is in `black-square-bank.ts:22-34`.
- It is built by `apps/server/scripts/build-black-square-bank.ts` from Wikidata
  SPARQL templates (`scripts/black-square-templates.ts:145, 264-284`) and
  their instances (`black-square-themes.ts`).
  - `build-black-square-bank.ts:245-252` sorts the truths by French Wikipedia
    views over 60 days and keeps the first 9.
  - The only dedupe is on the normalised French label.
  - Ranking by views also lets **unreleased sequels** in: Shrek 5, Toy Story 5,
    Spider-Man: Brand New Day.
- Dealing: `blackSquareContent` (`black-square-round.ts:49-63`) takes
  `answers.slice(0, answerCount)`, 9 by default. A grid of 3 takes the top 3
  by views, which makes clusters of one franchise worse.
- About **28 themes out of 167** hold a franchise cluster, roughly 55 surplus
  answers, almost all in `films-directed-by` and `films-of-studio`:
  - Pixar: Toy Story 1–5
  - DreamWorks: Shrek ×4
  - Marvel Studios: Spider-Man ×4
  - Peter Jackson: Lord of the Rings ×3 and Hobbit ×3
  - Michael Bay: Transformers ×4
  - Coppola: The Godfather ×3
  - Raimi: Spider-Man ×3 and Evil Dead ×2
  - Soderbergh: Ocean's ×3
  - Cameron: Avatar ×3 and Terminator ×2
  - Nolan: The Dark Knight ×2
  - Tarantino: Kill Bill ×2
  - Zemeckis: Back to the Future ×2
  - Villeneuve: Dune ×2
  - Illumination: Despicable Me / Minions, Sing ×2, Pets ×2
  - Outside film: Queen and Queen II, Daft Punk's Alive 1997 and 2007, Roald
    Dahl's two Charlie books
- `docs/plans/53-black-square-audit.md` never mentions franchises.
  `black-square-bank.test.ts` has no guard for them.

## Decided

1. **Dedupe at build time on Wikidata's series.** For each truth, read P179
   (part of the series), P8345 (media franchise) and P155/P156 (follows,
   followed by). Keep the first by views per series key, inside the loop at
   L245-252, and store the key on the answer. The next films by the same
   director or studio fill the freed places. When the series has a base
   title, keep it ("Shrek", not "Shrek 2"), even if a sequel has more views.
2. **Drop works not yet released** (P577 publication date in the future, or
   missing for a film). Shrek 5 and Toy Story 5 go.
3. **Add a guard in `black-square-bank.test.ts`, with no network.** For each
   label:
   - lowercase it and drop a leading article;
   - cut at the first `:` or ` – `;
   - drop a trailing number or roman numeral, `Part`, `Volume`, `Chapter`,
     `Returns`, `Rises`, `the Third` / `le troisième`;
   - compare the first word or two.
   
   Exempt the `subdivisions-of`, `position-holders` and `paintings-by`
   templates (Swiss cantons, Henri II/III/IV, Turner's two *Snow Storm*). A
   label shape cannot catch Jurassic Park or Ocean's. The stored series key
   catches them, so the test also checks that no theme holds two answers with
   one key.
4. A theme that falls below 9 answers is reported by the script (L296; Peter
   Jackson will be one). It either takes a looser query or is dropped.
   **Quality beats count:** the test requires at least 150 themes, so check
   that the bank stays above it.

## Verify

- Rebuild the bank, then read the diff of the JSON for the ~28 themes named
  above: one film per franchise, and every replacement a film a table knows.
- Break the new guard once on purpose (put Shrek 2 back) and watch it fail.
- Write the rule into `docs/plans/53-black-square-audit.md` (or a new plan
  row in `docs/plans/README.md`), and add a CHANGELOG line.
- **The same flaw may exist elsewhere.** Grep the quiz banks and the most
  likely / estimate banks for franchise clusters. Fix what is cheap, and list
  the rest in the final reply.
