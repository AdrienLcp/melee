# 72 — Portuguese

Asked by Adrien on 2026-11-17: Portuguese everywhere — the interface, every
question bank, Atlas with Portugal's cities beside France's. Nine sessions, one
handoff each (`handoffs/README.md`); this file holds what they share. Session 01
changed no user-visible string: it made the third locale a compiler-guided job.

## Decided

- **pt-PT, Portugal.** Adrien named Portuguese cities, and Portugal shares the
  euro with every price in `price-bank.json`. The `Locale` member is `pt`, its
  BCP-47 tag `pt-PT` (react-aria, `Intl`, Open Graph `pt_PT`). A Brazilian
  locale later is a member of its own, never a variant of this one — which is
  what lets a language member name a country (below).
- **The model gains a member, it does not change.** Each screen keeps its own
  interface language (URL, `melee:locale`, `navigator.languages`). Content
  written in one language only — quiz questions, rebus titles, the word lists,
  think-alike prompts — is dealt in the game's `language`, which the host's
  locale seeds as the room opens (`openedGameSettings`) and the settings panel
  changes. Content every row carries in every language — timeline, most
  likely, challenge, black square, estimate, higher or lower — goes out whole
  and each screen reads its own locale. A French guest at a Portuguese table
  still reads timeline cards in French.
- **Atlas adds, never replaces.** A place set is a country, not a language:
  `portugueseCities` sits beside `frenchCities`, and any table may play either.
- **Every all-locale bank holds `pt` on every row before `pt` joins
  `LOCALES`** — `localizedSchema` is exhaustive over the union. The banks gain
  their `pt` keys first, which today's schemas strip harmlessly, and session 08
  flips the unions. `Locale` and `QuestionLanguage` flip together: there is no
  window where the interface is Portuguese and the quiz quietly falls back to
  English.
- **Every translated row is Claude's own Portuguese**, written by subagents in
  batches — no machine-translation API. Adrien does not read Portuguese, so a
  row's quality rests on the session: a batch is spot-read by a second agent
  before it lands.
- **The quiz translates the international rows and adds Portugal's own.** A
  French-only question (a Tour de France, a French minister) is dropped, not
  translated; a few hundred questions a Portuguese table would miss are written
  fresh — Eusébio, fado, Pessoa, the 25th of April.

## The Worker, measured — no split

Measured on 2026-11-17 with every bank bundled (`wrangler deploy --dry-run`):
**12 047 KiB uploaded, 2 198 KiB gzipped, 119 ms of startup** on the staging
deploy. The banks are 1 539 KiB of the gzip, the quiz alone 961.

The 3 MB compressed cap this series was afraid of is gone: since 2026-09-04
Cloudflare checks only the **uncompressed bundle, 64 MiB** on every plan.
Portuguese costs about what French does — French is the marginal 787 KiB gzipped
of the banks, 588 of it the quiz — and the quiz will hold far fewer Portuguese
rows than French ones. So the bundle lands near 15 MiB of 64 and the startup
near 150 ms of the 1 s limit. Splitting the banks per language buys nothing on
either line today; the one to watch is `Worker Startup Time` in the deploy log
(`28-cloudflare.md`). Past 500 ms, the lever is parsing a language's banks on
its first draw rather than at module scope.

## The table's country — a game setting, `homeCountry`

Three later steps need to know a table is French rather than which language it
reads. Today all three hard-code France:

| Case                     | Today                                                                                                                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estimate, higher / lower | `isInFrance` per row, read only by higher or lower at `easy` (`quantity-bank.ts`); the estimate deals EDF tariffs to every table, and `famous-quantities.ts` tiers by French names |
| Blind test, decades      | `DECADE_PLAYLIST_IDS` pairs an international playlist with a French one (`deezer-client.ts`)                                                                                       |
| Atlas, ready-made        | `grandMixVarietiesOf` deals all three place sets whatever the locale (`ready-made-line-ups.ts`)                                                                                    |

**Decided: `homeCountry: CountryCode | null` on the estimate, higher or lower
and blind test arms**, seeded from the host's locale by a `homeCountryFor(locale)`
beside `questionLanguageFor` — `fr` → `FRA`, `pt` → `PRT`, `en` → `null`, a
table with no country of its own — in `openedGameSettings`, and re-synced by
`askedIn` exactly as `language` is. Defaulted so a remembered setup parses.

- **Not the room's.** The catalogue's room owner is _true of any game_, and
  seventeen games never read a country. A room value beside four per-game
  `language`s would need a precedence rule — a Portuguese quiz on a French
  table — that no host can see from the setup (`game-catalogue.md`, the
  `difficulty` precedent).
- **Not read off `language`.** The three arms that need a country carry no
  language, and their content goes out in every language. No arm holds both,
  so the two never disagree.
- **Atlas holds none.** `frenchCities` and `portugueseCities` name the country
  themselves; only the ready-made evenings pick a set, from the locale they are
  built in (session 09).
- **The banks follow** (corrected by 05, below: by source, not by place). `isInFrance` becomes `homeCountry: CountryCode | null`
  per row — the country whose table it belongs to, `null` for an international
  row. A table deals the international rows and its own country's; a `null`
  table deals the international ones alone, which stops an English table
  meeting EDF tariffs. `famous-quantities.ts` and `isWellKnown` (French
  Wikipedia traffic) are France's tiers: session 05 keys them by country.

## Sessions

| #   | Handoff                         | What it lands                                                                 | State               |
| --- | ------------------------------- | ----------------------------------------------------------------------------- | ------------------- |
| 01  | `portuguese-01-seams.md`        | The seams, the measurements and this plan                                     | **done** 17/11/2026 |
| 02  | `portuguese-02-interface.md`    | The interface dictionary in Portuguese                                        | **done** 17/11/2026 |
| 03  | `portuguese-03-small-banks.md`  | `pt` on challenge, most likely, timeline, think alike, capitals; a rebus bank | **done** 17/11/2026 |
| 04  | `portuguese-04-black-square.md` | Black square's themes in Portuguese                                           | **done** 18/11/2026 |
| 05  | `portuguese-05-quantities.md`   | Estimate and higher or lower, `homeCountry` on arms and rows                  | **done** 18/11/2026 |
| 06  | `portuguese-06-quiz-bank.md`    | A Portuguese quiz bank                                                        | **done** 18/11/2026 |
| 07  | `portuguese-07-words.md`        | A Portuguese lexicon and answer matching                                      | **done** 18/11/2026 |
| 08  | `portuguese-08-flip.md`         | `pt` joins `LOCALES` and `questionLanguages` together                         | **done** 18/11/2026 |
| 09  | `portuguese-09-portugal.md`     | Portugal's cities on the map, decades, ready-made evenings                    | to do               |

### 01 — what landed

- Every runtime `{ en, fr }` derives from the unions: `localizedSchema` and
  `byLocale` beside `LOCALES` (`protocol/locale.ts`). The bank build scripts
  still spell `en`/`fr`; each wave-2 session extends its own builder.
- An Atlas pick is recorded as its index among `choices` (`atlasPickSaid`,
  `atlasPickIndexOf`), read back in each screen's language: an English console
  reads _Haiti — Zoe_ where a French one reads _Haïti_. A console reloaded on a
  revealed round comes back whole; the _Loading…_ seen during the session was
  the hidden browser pane, not the app.
- `askedIn` re-syncs the `language` of longest word and think alike too.

### 02 — what landed

- `dictionary-pt.ts` (`PT_DICTIONARY`), typed now through
  `MatchingDictionary<typeof EN_DICTIONARY, …>`: a missing key or a renamed
  placeholder fails to compile though `pt` is not registered. Written by
  eleven agents from one glossary (_tu_, _a mesa_, _a ronda_, _o anfitrião_,
  _o ecrã da sala_, _a partida_ for the line-up), each batch re-read by
  another. The game names: _Adivinha a música, Campainha, Casa negra,
  Desafio, O número certo, Mais ou menos, Relógio interno, Palavra mais
  longa, Conta certa, Fósforos, Quem de nós?, Palavra mistério, Stop, Reflexo,
  A Ardósia, Tons, Pensa como a mesa, Linha do tempo_; Atlas and Quiz unchanged.
- **`pt` plurals are Brazil's.** `@adrienlcp/i18n` hands the dictionary key
  to `Intl.PluralRules`, and the CLDR rule for `pt` counts 0 as `one`
  (`pt-PT` does not). Every inflecting count declares a `zero` reading as the
  plural, which the library selects at 0 before asking `Intl`.
- `COUNTRY_NAMES_PT` (236 countries, `withArticle` written by hand: _a
  França, o Japão, os Estados Unidos_, none on _Portugal, Angola, Cuba_).
- `PT_PAGE_HEADS` and `PT_IMAGE_ALT` in `document-head.ts`, beside the
  records keyed by `Locale` that cannot hold them yet. `og-pt.png`, the legal
  and credits links and `llms.txt` need `pt` registered, and moved to 08.
- `@cspell/dict-pt-pt`, with a `pt-PT` override on the new files.
- Petit bac's default excluded letters stand: K, W and Y are loan letters in
  Portuguese too, and Q, X and Z start too few words for six categories.

### 03 — what landed

- `pt` on every row of the challenge, most-likely, timeline and think-alike
  banks, seven writers and four second readers. Conventions: _Traz algo …_,
  _Quem tem mais hipóteses de …?_ with no adjective agreeing with the seat
  where a verb does, a film _estreia nos cinemas_ under its Portugal title
  (_Psico_, _Regresso ao Futuro_, _O Padrinho_), bands with their article
  (_os ABBA_). Think alike adapts what was French: Lisboa for Paris,
  Euromilhões for the lottery, Carnaval for a costume.
- **Two schemas still refused a key they did not know**:
  `mostLikelyLabelsSchema` and `timelineLabelsSchema` were strict records,
  missed by 01; both are `localizedSchema` now. The think-alike bank keys by
  `QuestionLanguage` and strips the same way (`inQuestionLanguagesOnly`),
  which 08 can delete once `pt` is a question language.
- Capitals: `namesOf` reads `pt` (falling back to `mul`, then English) and
  fetches again a cached entry without it; `aliasesOf` takes `pt`. The build
  replays from cache byte for byte, so the diff is the `pt` keys alone.
  Wikidata files `Categoria:Luanda` among a city's names, filtered.
  `PORTUGUESE_CAPITAL_PROMPT` contracts _de_ with the article (_da França,
  dos Estados Unidos, de Portugal_) and waits beside `PROMPT_BY_LANGUAGE`.
- `rebus-pt.json`, Portugal's own list, parsed and checked by the rebus
  tests from its file; `PORTUGUESE_ASK_BY_KIND` waits beside `ASK_BY_KIND`,
  and `AUTHORED_REBUSES` takes the file at the flip.

### 04 — what landed

- **`pt` on all 259 themes**: label, every answer's label and aliases, the
  black word's label, aliases and `why`. The 202 hand-written themes (3 557
  answers) by nine writers, one per file, each re-read by a second; aliases
  are what a Portuguese table says (_napolitana_, _bebidas brancas_,
  _Tinta Roriz_), the Brazilian word dropped (_suco_, _apontador_,
  _bambolê_). The bank test parses every file with `pt` required and grades
  every name of every language, as a round will once 08 ships it.
- **Every language's names are one pool at grading**, so a Portuguese name
  can collide with another cell's French or English one: _Rouge_ (blusher in
  Portuguese, lipstick in French) and _Viola_ (a guitar in Portugal, the
  viola elsewhere) were dropped for that. A Portuguese word covering two
  cells gives each its precise name: _ratinho / ratazana_, _rola_ for the
  dove, _vespa-asiática_ for the hornet.
- **The Wikidata build reads Portuguese without re-asking its queries**:
  names through `namesOf` (`black-square-labels.json`), aliases through
  `aliasesOf('pt')`, so the queries keep their hash and the en/fr halves
  rebuild byte for byte. Wikidata's `pt` titles are Brazil's more often than
  not: 257 entities take Portugal's name from `PORTUGUESE_LABELS` (_Regresso
  ao Futuro_, _Sacanas Sem Lei_, _Inter de Milão_), the Brazilian or original
  title kept in `PORTUGUESE_SPOKEN_ALIASES`. Templates word a theme in
  Portuguese; 31 themes are worded by hand.
- **Order and tiers untouched, flagged instead** (166 flags on the
  hand-written themes, about twenty on Wikidata's). The strongest: Portugal's
  own answers ranked hard — _Eusébio_, _Benfica_ and _FC Porto_, _bacalhau_,
  _tremoço_, _choco_, _bodyboard_, _futsal_, _hóquei em patins_, _saudade_'s
  _nostalgia_ — and French ones ranked easy — _tartiflette_, _Orangina_,
  _Jean Dujardin_, _Demain dès l'aube_. Themes that are French through and
  through (French dishes, kings and presidents of France, French champions,
  the films of Oury and Veber, the regions) are worded in Portuguese and dealt
  to every table: session 01's `homeCountry` does not cover black square,
  whose rows go out in every language. A per-country tier is the lever if a
  Portuguese table finds them flat.
- **Black words that lean on French**: _Galette des rois_ keeps its entity
  (the row is shared) and never answers to _bolo-rei_, Portugal's Christmas
  cake; _Guiane_ is _Guiana Francesa_ because both Guianas are _Guiana_.

### 06 — what landed

- **3 531 Portuguese rows** in `question-bank.json`, written in
  `scripts/questions-pt.json` and read by `portuguese-source.ts`: 3 146
  translated from the French and English banks and 385 about Portugal
  (history, geography, sport, music, letters, food). Every subject holds
  more than 200 (quotes 215, sport 342, history 498), 2 954 are well known,
  1 966 pay a second spelling, 252 are choice-only, carried from the source.
- **No open pt-PT trivia set exists.** Mintaka's Portuguese is Brazil's and
  its rows are already here through their French half; OpenQuizzDB and Open
  Trivia DB have none. So the translation drew on four sources the bank
  already trusts — Open Trivia DB 1 487, Mintaka 551, OpenQuizzDB 520,
  Vikidia 262 — plus Melee's own quotes (215) and video games (111). PolyFact
  and MMMLU were left out: none of their rows is rated well known. Each
  translated row keeps the source id in `from`, and the build credits each
  source once more, `language: 'pt'`, _translated into European Portuguese
  by Melee_; the credits page says so in four `changes` strings.
- **3 957 rows offered, 751 dropped** by twenty-two translators (French TV
  and regional trivia, US college sport and NFL, questions about a French or
  English word, outdated facts), and about 60 more as the same question asked by
  both banks — the build drops exact repeats, the assembly the near ones
  (same answer, same content words). Each batch was re-read by a second
  agent (about 5 % of rows fixed: Brazilian titles and words, accents, a
  decoy that was also right), the Portugal rows fact-checked one by one.
- **The server leaves them out until 08**: `bankedQuestions()` parses
  `inQuestionLanguagesOnly(bank.questions)`, and the build scripts spell
  the extra language `BankLanguage` (`QuestionLanguage | 'pt'`). A block in
  `question-bank.test.ts` holds the `pt` rows to the sweep's claims and
  floors from the file; 08 deletes all three.
- **The hard tier is thin**: 577 rows are not well known, 10 of them quotes
  and 45 science. 08 should check `[difficulty]` at `hard` once `pt` deals.
- The bank goes from 6.7 to 8.5 MB uncompressed, under the budget measured
  above.

### 05 — what landed

- **`homeCountry` on the blind test, estimate and higher or lower arms**,
  defaulted to `null`, seeded by `homeCountryFor(locale)`
  (`core/room/home-country.ts`, `fr` → `FRA`, `en` → `null`) in
  `openedGameSettings` and re-synced by `askedIn`. 08 adds `pt: 'PRT'`; the
  blind test reads it in 09.
- **The decision above was corrected on one point: a row's `homeCountry` is
  set by the source that measured it, not by where it lies.** Read off
  `isInFrance`, it would have taken the Eiffel Tower, the Seine and Paris
  away from every table but France's. A row is a country's when only that
  country's own sources measure it — French towns, departments and regions,
  Portugal's municipalities of 20 000, its rivers and summits under the
  world's sitelink floor, thirteen landmarks by hand — and a source of the
  world's wins over a country's (Paris is everyone's). Where a row lies is
  `liesIn`, which only `easy` higher or lower reads, preferring a side from
  the table's country.
- **Tiers are per country**: `wellKnownIn` from each table's Wikipedia
  traffic (`wikipediaViewsOf`, `frwiki-notability.ts`, French and
  Portuguese, the same 2 000 views), and a famous list per country —
  France's by French name, Portugal's by entity (`famous-in-portugal.ts`).
  A table with no country plays on France's tiers.
- **273 Portuguese rows, 58 Portuguese prices.** Figures unchanged: the
  build re-fetched its queries, so the 4 993 existing rows were merged back
  with their values and en/fr names as they were, `pt` and `homeCountry`
  added. 1 723 Wikidata `pt` labels rewritten by twelve writers and a second
  reader — Brazilian spellings (_Moscou_, _Teerã_), English labels, rivers
  bare (_Tejo_, _Danúbio_) — and the prices re-read with eight figures
  re-checked. The France-flagged prices that hold across the euro (auction
  records, console launches) are everyone's now, so a table with no
  country keeps every tier stocked.
- Wikidata holds few heights for Portugal: the Torre dos Clérigos' 75 m sits
  on a heritage duplicate with no article, so it is not in the bank.

### 07 — what landed

- `word-bank-pt.json`: **143 310 forms**, 5 154 hidden words (easy / medium /
  hard: 1 141 / 1 447 / 2 566, at least 206 per tier and length) and 7 319
  more familiar long forms. Built from LibreOffice's pt_PT Hunspell
  dictionary (Projecto Natura, GPL / LGPL / MPL, post-1990 spelling: _ação_,
  _ótimo_), unfolded by `hunspell-forms.ts`, and ranked by FrequencyWords'
  OpenSubtitles counts for Portugal (CC BY-SA 4.0) on the French floors
  (20 / 5 / 1 per million). A hidden word is a common noun, adjective or
  infinitive whose `.dic` line names no lemma of its own — the irregular
  forms do (`[$descobrir$…]`), which kept _descobre_ out. 48 words blocked
  after a full read of the list. `words:build -- <folder> pt` builds one
  language, the sources being gone for the other two.
- **`WordLanguage`** (`QuestionLanguage | 'pt'`) keys the word bank and the
  letter draw now, so the Worker holds the Portuguese dictionary and the
  tests deal from it; no room can ask for it until 08 collapses the union.
- **Folding**: 45 pairs of lemmas meet once folded (_força / forca_,
  _manhã / manha_). None is unfair — the grid judges folded letters, either
  spelling typed is the same try — and French lives with _pêcher / pécher_.
- Letter draw: Portuguese counts taken from the same subtitles (A 14.1 %,
  E 13.3, O 10.8, S 8.2).
- **Matching**: `o`, `os`, `as`, `um`, `uma`, `uns`, `umas` join the leading
  articles — on every answer, measured on the 12 956 banked questions: 75
  answers change, no decoy collides. `e` as _and_ was measured to break
  _R.E.M._ typed `rem` and _É.-U. A._ typed `eua`, so it drops only between
  two words one of which is longer than a letter.
- Collation stays on `'fr'`: it orders Portuguese names as Portugal does,
  and a test holds it.
- Keyboard: `KEY_ROWS` is held to `QuestionLanguage`, so `pt` takes QWERTY
  at the flip (noted in 08's handoff).

### 08 — what landed

- **`pt` in `LOCALES` and `questionLanguages` in one commit.** The compiler
  pointed at 30-odd records, each filled: the dictionary as a lazy chunk,
  `pt-PT` for react-aria and `optimizeLocales`, _Português_, `/pt/…` pages
  with reciprocal `hreflang`, `PAGE_HEADS.pt`, `pt_PT`, flags, outlines,
  capitals and rebuses asked in Portuguese, the countries' Portuguese names
  and aliases (_Holanda_, _EUA_, _Chéquia_), `homeCountryFor('pt')` →
  `PRT`, and the keyboard on QWERTY.
- **Every stopgap of 01–07 deleted**: `inQuestionLanguagesOnly` (quiz,
  think alike), `BankLanguage`, `WordLanguage`, the `PORTUGUESE_*` constants
  and the quiz test's Portuguese block, whose rows the sweep now reads — its
  `[difficulty]` draws pass at `hard`. `PT_DICTIONARY` dropped its
  `MatchingDictionary` annotation: the registry checks it now, and the
  annotation's intersection made it refuse every `zero` form.
- **A bank row the capitals rubric already asks is matched on its accepted
  spellings too**: the Portuguese _Qual é a capital dos Estados Unidos?_
  answers _Washington_ and accepts _Washington D.C._, the rubric's name.
- **A third language broke the language strips 2+1** below 312px, which
  `strip-rows` caught in all three locales: the menu's and the four games'
  strips are one `LanguageChoice` now, stacking below 20rem.
- **Portuguese plurals tested at 0**: `portuguese-plurals.test.ts` renders
  `0 lugares` and holds every count with a `one` to a `zero` of its own.
- **`og-pt.png`** drawn from the Portuguese front door to `og-fr.png`'s
  layout, with the same sixteen games. All three share images predate
  mystery word, longest word, make the number and think alike: redrawing
  them is a design change of its own.
- **Tests**: `dead-socket.spec.ts` runs in Portuguese, the one journey that
  reads a stored locale; `strip-rows` sweeps `pt` too, on a third CI shard.
  The author's site has no Portuguese page, so the legal and credit links
  take its English one.
- **Seen in a browser, muted**: the menu switch and front door in
  Portuguese, a Portuguese quiz room full at 24 long names (lobby, round,
  reveal, every panel tab and the quiz's settings at 375px), Portuguese
  content opening mystery word, longest word, think alike, estimate, higher
  or lower and black square, a Stop sheet at 375px, and a French screen
  reading a Portuguese table's timeline cards in French. No overflow found.

<!-- cspell:words Português Chéquia EUA Holanda lugares pontos Categoria Carnaval Cidade Euromilhões Futuro Lisboa México Moscovo Padrinho Psico Regresso Traz estreia hipóteses CLDR portuguese portugal outdir Eusébio Haïti Adivinha Ardósia Campainha Casa Conta Desafio Estados França Fósforos Japão Linha Mais Palavra Pensa Quem Reflexo Relógio Tons Unidos anfitrião certa certo ecrã interno longa menos mesa mistério música negra número partida ronda sala tempo Natura Projecto ação descobre descobrir forca força manha manhã pécher pêcher umas ótimo Benfica Demain Dujardin Francesa Guianas Guiane Milão Orangina Oury Roriz Sacanas Tinta Veber apontador asiática bacalhau bambolê bebidas brancas choco futsal hóquei napolitana patins ratazana ratinho rola suco tartiflette tremoço vespa Danúbio Tejo Torre Clérigos Moscou Teerã Padrão Descobrimentos -->
