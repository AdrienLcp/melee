# Portuguese 07 — Words and answer matching

Series: `handoffs/README.md`. Read `docs/plans/72-portuguese.md` first, then
`docs/plans/66-mystery-word.md` and `67-longest-word.md`.

## The work

1. **A Portuguese lexicon** for mystery word and longest word, built through
   `scripts/build-word-bank.ts` into `word-bank-pt.json` (same trie encoding
   as `word-bank-fr.json`, `core/words/word-list-coding.ts`). It needs every
   form of 2-9 letters, hidden words of 5-8 letters by tier, and the
   "familiar" mark. Candidates to weigh, licence first because the list ships
   to every browser and the credits page names it: the European Portuguese
   Hunspell dictionary (LibreOffice, Projecto Natura), the _Vocabulário
   Ortográfico do Português_, and a frequency list for "familiar" (e.g. the
   OpenSubtitles-derived lists, CC BY-SA). Post-1990-agreement spelling
   (_ação_, not _acção_).
2. **Folding**: `foldWord` (`core/words/fold.ts`) maps to A-Z, so _ç_, _ã_,
   _õ_ and every accent fold away and the keyboard stays 26 letters. Check
   that no hidden word collides with another once folded in a way that makes
   a grid unfair.
3. **Keyboard**: Portugal types on QWERTY — `KEY_ROWS`
   (`apps/game/src/features/player/word-keyboard.tsx:12`) picks QWERTY for
   `pt`.
4. **Letter draw**: `LETTER_FREQUENCIES` for Portuguese in
   `core/longestword/letter-draw.ts`, from the new lexicon.
5. **Answer matching** (`packages/core/src/round/answer-matching.ts`): add
   the Portuguese leading articles (`o`, `a`, `os`, `as`, `um`, `uma`, `uns`,
   `umas`) to `LEADING_ARTICLE` and `e` to `CONJUNCTIONS`, with tests on a
   typed blind-test guess and a quiz answer. Watch the cost: `a` and `o` are
   one letter, and a title that _is_ _O_ or starts with _A_ as a word must
   still match.
6. **Collation** is pinned to `'fr'` (`core/helpers/collation.ts`): check it
   sorts Portuguese names correctly, or key it on the locale.
7. Credits: the lexicon and the frequency list, with their licences.

## Done when

`word-bank-pt.json` loads, a mystery word and a longest-word draw in `pt`
work in core tests, matching tests pass, `pnpm validate` is green, this file
is deleted and its row struck from `handoffs/README.md`.

<!-- cspell:words Natura Ortográfico Português Projecto Vocabulário acção ação portuguese umas -->
