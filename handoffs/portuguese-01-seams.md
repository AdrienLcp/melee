# Portuguese 01 — Open the seams, write the stage plan

Asked by Adrien on 2026-11-17: add Portuguese everywhere — the interface,
every question bank, Atlas ("villes du Portugal" beside "villes de France").
This is the first of nine sessions (`handoffs/README.md`). It changes no
user-visible string: it makes the third locale a compiler-guided job.

## Decided — carry these into the stage plan

- **pt-PT, Portugal.** Adrien named Portuguese cities, and Portugal shares the
  euro with every price in `price-bank.json`. The `Locale` member is `pt`, its
  BCP-47 tag `pt-PT` (react-aria, `Intl`, Open Graph `pt_PT`). A Brazilian
  locale later is a separate member, not a variant of this one.
- **The model does not change, it gains a member.** Each screen keeps its own
  interface language (URL, `melee:locale`, `navigator.languages`). Content
  written in one language only — quiz questions, rebus titles, the word lists,
  think-alike prompts — is dealt in the game's `language` setting, which the
  host's locale seeds at room creation (`core/room/room-settings.ts:263-277`)
  and the settings panel changes. Content that every row carries in every
  language — timeline, most likely, challenge, black square, estimate, higher
  or lower — goes out whole and each screen reads its own locale. So a
  Portuguese host gets Portuguese content, and a French guest at that table
  still reads timeline cards in French.
- **Atlas adds, never replaces.** A place set is a country, not a language:
  `portugueseCities` sits beside `frenchCities`, and a Portuguese table may
  play either. What the host's locale changes is the default a ready-made
  evening picks (session 09).
- **Every all-locale bank holds `pt` on every row before `pt` joins
  `LOCALES`** (Zod records keyed by the enum are exhaustive). The banks gain
  their `pt` keys first, which today's `z.object({ en, fr })` strips
  harmlessly, and session 08 flips the unions. `Locale` and
  `QuestionLanguage` flip together in 08: there is no window where the
  interface is Portuguese and the quiz quietly falls back to English.
- **Every translated row is Claude's own Portuguese**, written by subagents in
  batches — no machine-translation API. Adrien does not read Portuguese: a
  row's quality rests on the session, so a batch is spot-read by a second
  agent before it lands.

## The work

1. **Derive every hard-coded `{ en, fr }` from the unions**, so adding `pt`
   later fails to compile everywhere it must be written:
   `protocol/atlas.ts:60` (`localizedNameSchema`), `quantity-bank.ts:40,63`,
   `black-square-bank.ts:68-74`, `core/challenge/letter-slot.ts:44`,
   `room-view.ts:557` (copies `{ en, fr }` by hand), `word-bank.ts:31`,
   `scripts/build-word-bank.ts:104,428`, `rebus-questions.ts:58`. Also the
   tests that list `en`/`fr` (`line-up-entry-names.test.ts:151`,
   `ready-made-line-ups.test.ts:250`, `black-square-bank.test.ts:127`,
   `word-bank.test.ts:80`, `capital-questions.test.ts:71`).
2. **Atlas naming rounds use the French name as a choice's identity**
   (`answer-forms.tsx:113`, `use-distance-words.ts:137`,
   `round-service.ts:1705,1718`). Key them on the place's code instead — a
   third name must not be able to change which choice is right.
3. **Fix `askedIn`** (`core/room/host-preferences.ts:47-68`): it re-syncs the
   `language` of the quiz and mystery word to the host's locale, and forgets
   longest word and think alike. Test first, watch it fail.
4. **Measure the Worker.** `apps/server/src/infrastructure/questions/` is
   11 MB of JSON bundled into the Worker; sessions 03-07 add roughly a third.
   Measure the compressed upload (`wrangler deploy --dry-run --outdir`)
   against Cloudflare's limit for the plan in use. `docs/plans/14-question-languages.md:183`
   already says a third language is where loading per language beats parsing
   every bank up front: if the margin is thin, split the banks per language
   now, while only two exist.
5. **The room's country.** Three later steps need to know a table is French
   rather than which language it reads: estimate and higher or lower deal 607 +
   171 rows flagged `isInFrance` (an EDF tariff means nothing in Lisbon), the
   blind test's decade source pairs an international playlist with a French
   one (`deezer-client.ts:316`), and a ready-made Atlas evening picks French
   cities. Read `docs/game-catalogue.md` and decide where that lives — the
   per-game `language` setting each game narrows, or something the room
   holds — with three cases to measure against. Write the decision in the
   plan; sessions 05 and 09 build on it.
6. **Write `docs/plans/72-portuguese.md`** (next free number — check) holding
   the decisions above and step 5's, its row in `docs/plans/README.md`, and
   point every later handoff of the series at it.

## Done when

`pnpm validate` is green, nothing on screen changed, the plan is committed,
this file is deleted and its row struck from `handoffs/README.md`.

<!-- cspell:words outdir portuguese -->

## Progress (2026-11-17, session cut short by token quota)

- [x] Step 3 `askedIn` — done: longest word and think alike now follow the
  host's locale too (test in `host-preferences.test.ts`).
- [x] Step 1 — done: `localizedSchema` and `byLocale` beside `LOCALES`
  (`protocol/locale.ts`); every runtime `{ en, fr }` and the listed tests go
  through them or `questionLanguages`. The bank build scripts still spell
  `en`/`fr` — each wave-2 session extends its own builder.
- [ ] Steps 2, 4, 5, 6 — not started. Resume at step 2.
