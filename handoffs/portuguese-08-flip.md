# Portuguese 08 — Turn Portuguese on

Series: `handoffs/README.md`. Needs 02-07 landed. Read
`docs/plans/72-portuguese.md` and `.claude/rules/locales.md`.

## The work

1. **The unions**: `pt` in `LOCALES` (`packages/protocol/src/locale.ts`) and
   in `QuestionLanguage` (`protocol/question.ts`). The compiler then points at
   every record session 01 derived — fill each.
2. **The registries**: `PT_DICTIONARY` (`dictionary-pt.ts`, already held to the
   English shape) as a lazy chunk in `i18n.ts` like French,
   `pt-PT` in `REACT_ARIA_LOCALES` (`i18n-provider.tsx`) **and** in
   `optimizeLocales` (`apps/game/vite.config.ts:73`) — the compiler does not
   catch the last one, and missing it leaves react-aria's own strings in
   English. `LANGUAGE_NAMES` gets _Português_.
3. **Routes and SEO**: `/pt/…` (`navigation.ts`), `scripts/prerender.ts`
   reciprocal `hreflang`, `llms.txt`. In `document-head.ts`, `PT_PAGE_HEADS`
   and `PT_IMAGE_ALT` (written in 02) move under `PAGE_HEADS.pt` and
   `IMAGE_ALTS.pt`, `OPEN_GRAPH_LOCALES` gets `pt_PT`, and
   `SHARE_IMAGE_PATHS` an `og-pt.png` drawn from the Portuguese front door
   like `og-fr.png` (`apps/game/DESIGN.md`, _The mark_) — it needs the shelf
   rendering in Portuguese, so it waits for the flip. `legal-details.ts` and
   `site-credits.ts` need a `pt` link: the author's site's Portuguese page if
   it has one, else its English one. `COUNTRY_NAMES_PT` joins
   `country-answers.ts` and `map-naming.ts` on the server.
   Written in 03 and waiting: `PORTUGUESE_CAPITAL_PROMPT` folds into
   `PROMPT_BY_LANGUAGE` (`capital-questions.ts`), `PORTUGUESE_ASK_BY_KIND`
   into `ASK_BY_KIND` and `rebus-pt.json` into `AUTHORED_REBUSES`
   (`rebus-questions.ts`, whose test then reads it through the bank), and
   `inQuestionLanguagesOnly` in `think-alike-bank.ts` can go.
4. **cspell**: `@cspell/dict-pt-pt` is in since 02, with a `pt-PT`
   override for the dictionary and the country names; add the new files.
5. **Plurals**: `pt` is the Brazilian CLDR rule (0 is `one`), so every
   inflecting count in `dictionary-pt.ts` declares a `zero` that reads as
   the plural. A test that renders a count in `pt` at 0 holds it.
6. **Tests** that list `en`/`fr` and the e2e journeys: one journey in `pt`.
7. **In a real browser, muted** (`docs/browser-driving.md`): the menu
   switch to Português, the home page, a room hosted in Portuguese — check the
   quiz, mystery word, longest word and think alike open on `pt`, timeline
   cards read in each screen's own locale. Full room
   (`MAX_PLAYERS_PER_ROOM` seats, long names) at phone width on the screens
   with the longest Portuguese strings — settings panel, standings, petit bac
   sheet. Portuguese runs as long as French or longer; fix every overflow.
   Film any transition you touch.

## Done when

`pnpm validate` is green, the browser pass above is done, the push deploys
staging (production only on Adrien's word), this file is deleted and its row
struck from `handoffs/README.md`.

<!-- cspell:words CLDR Português portuguese -->
