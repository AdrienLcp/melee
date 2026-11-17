# Portuguese 08 — Turn Portuguese on

Series: `handoffs/README.md`. Needs 02-07 landed. Read
`docs/plans/72-portuguese.md` and `.claude/rules/locales.md`.

## The work

1. **The unions**: `pt` in `LOCALES` (`packages/protocol/src/locale.ts`) and
   in `QuestionLanguage` (`protocol/question.ts`). The compiler then points at
   every record session 01 derived — fill each.
2. **The registries**: `dictionary-pt.ts` in `DICTIONARIES` (`i18n.ts`),
   `pt-PT` in `REACT_ARIA_LOCALES` (`i18n-provider.tsx`) **and** in
   `optimizeLocales` (`apps/game/vite.config.ts:73`) — the compiler does not
   catch the last one, and missing it leaves react-aria's own strings in
   English. `LANGUAGE_NAMES` gets _Português_.
3. **Routes and SEO**: `/pt/…` (`navigation.ts`), `scripts/prerender.ts`
   reciprocal `hreflang`, `llms.txt`.
4. **cspell**: `@cspell/dict-pt-pt` beside `@cspell/dict-fr-fr`, the
   per-file overrides for the new files.
5. **Tests** that list `en`/`fr` and the e2e journeys: one journey in `pt`.
6. **In a real browser, muted** (`docs/browser-driving.md`): the menu
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

<!-- cspell:words Português portuguese -->
