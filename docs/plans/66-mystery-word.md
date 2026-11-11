# 66 — Mystery word

**Half done** — step 1 landed on 11/11/2026; step 2 is next.

A word is hidden, its first letter and its length are on every screen, and
every seat has six tries to find it on its own screen. Each try is a real word
of that length, and the server colours each of its letters: in place, in the
word elsewhere, or not in it at all. The wall shows every seat's grid filling
in colours **without its letters** — who is one letter away is public, what
they typed is not — and the reveal puts the word up with every grid spelled
out.

The seventeenth game, **everyone at once**. Kind `mysteryword`, translation
prefix `mysteryword.*`, answer mode `word`. _Mot mystère_ in French, _Mystery
word_ in English. The mechanic is the one television and newspapers made
famous; their names and their looks are theirs and appear nowhere — not in a
string, a token or a colour pair.

It is the first of two word games sharing one dictionary;
[67](67-longest-word.md) is the second and costs little once this one has paid
for the words.

## The dictionary — free, credited

Settled on 11/11/2026, licences read in the archives themselves:

| Source                                     | Language | Used for                                             | Licence            | Owed                                                        |
| ------------------------------------------ | -------- | ---------------------------------------------------- | ------------------ | ----------------------------------------------------------- |
| Lexique 3.83 (lexique.org)                 | French   | every valid form, and the answers by lemma frequency | CC BY-SA 4.0       | Credit New, Pallier et al.; the derived list stays CC BY-SA |
| ENABLE                                     | English  | every valid form                                     | public domain      | nothing                                                     |
| SCOWL 2020.12.07, `english-words.10/20/35` | English  | the answers, the size as the tier                    | permissive, no fee | keep its copyright notice in the bank header                |

**Not Lexique 4**: lexique.org's page for it names CC BY-SA and links a CC
BY-NC deed — 3.83's own README is unambiguous. The official tournament word
lists (ODS, Collins) are not free and are not used.

Measured on the raw files: Lexique holds 125 653 distinct forms, 44 817 of five
to eight letters; ENABLE 105 241 words of two to nine letters, 263 KB gzipped;
SCOWL sizes 10 / 20 / 35 hold 2 459 / 3 816 / 15 332 words of five to eight
letters. Both valid lists folded together are under 400 KB gzipped — measure the
Worker with `wrangler deploy --dry-run` before and after, against the free
plan's 3 MB compressed script cap.

## Rules, as settled

- **Letters are folded** to `A`–`Z`: accents dropped, `Œ` → `OE`, `Æ` → `AE`.
  A form holding a hyphen, an apostrophe or a space is not a word here. The
  fold is the whole game's alphabet, so it lives in core once and both games
  use it.
- **The length is the host's**, `wordLength` 5–8, **6 by default**. The first
  letter is given and travels to every screen — it is not the answer.
- **A try** is a word of the length, starting with the given letter, found in
  the dictionary of the round's language. Anything else is refused with its own
  code and **costs no try**: a refused try is a typo, and charging it would
  make the game about spelling.
- **Six tries.** The colours follow the usual rule for a repeated letter: the
  in-place matches are counted first, then _elsewhere_ is given left to right
  only while the word still holds an unclaimed copy.
- **The answers** are common words, never a conjugated form: French lemmas of
  Lexique tagged noun, adjective or infinitive, tiered by film-subtitle lemma
  frequency; English words of SCOWL 10 / 20 / 35 found in ENABLE, the size as
  the tier. The tiers are the banks' `easy`, `medium` and `hard`, which the
  room's level deals through `dealByDifficulty` as every content game does. A hand-kept blocklist strips slurs and crude words from
  the answers (not from the valid tries — a word a seat types is its own), and
  the step reads a seeded sample of each tier by hand before it ships.
- **The language** of the dictionary follows the room's question language, the
  way the quiz's bank does.
- **The pay**: a word found on try _k_ earns `[1, 1, 0.85, 0.7, 0.55, 0.4][k-1]`
  of the round (`pointsForWord`), and `clockedPay` keeps nine tenths of it as
  for every game. **Only a word found on the first two tries races** for the
  clock's tenth, timed at the try that found it — not at the first coloured
  letter, which is what `scoredAfterMs` records today: the shared rule pays no
  speed to an answer short of perfect, and a third-try find is one. The order
  by try holds either way — a third try at once (76.5 + 0) stays under a
  second try at the bell (90). A word not found pays nothing; the grid
  on the reveal is the consolation. The first two tries pay the same because a
  first try that lands is luck.
- **`roundDurationMs`** 60–240 s, **120 s by default**. The round closes when
  every stamped seat has found the word or spent its six tries.
- **Duels**: yes — two seats on one word is the cleanest race on the shelf.
- **Played ids** `mysteryword:<language>:<word>`, so an evening never deals a
  word twice.

## On the wire

- `player.answer` with `{ kind: 'word', guess }`, sent once per try. The retry
  gate in `registerAnswer` is hard-coded to `typed` today; it becomes _the
  held verdict is not final_, which is what it always meant.
- **The word never travels before the reveal**, to a seated console neither.
  Every view carries the first letter, the length, and each seat's rows as
  colours alone; the reader's own rows carry their letters (`yourTries`).
- The verdict, `word`: the tries' colours and the try that found it, or
  `null`.
- The socket suite searches every frame of a whole round, seated console
  included, for the word before the reveal — broken on purpose once.

## Steps

1. **The dictionary and the rules.** `apps/server/scripts/build-word-bank.ts`
   (with a `words:build` script) reading the three sources from a download
   folder and writing `word-bank-fr.json` and `word-bank-en.json` beside the
   other banks, each with an `attributions` header and every form as one
   front-coded string, each answer marked with its tier. A bank
   module parsing it once. `@melee/core/words/` for the fold and
   `@melee/core/mysteryword/` for the colours, the try checks and the pay,
   each with tests. `/credits` gains the three sources. Measure the Worker.

   **Done** 11/11/2026. `pnpm --filter @melee/server words:build -- <folder>`
   reads Lexique, ENABLE and SCOWL from a download folder (default
   `scripts/.cache/words`, git-ignored) and writes both banks. **The format
   diverged**: one string per length gzipped to 741 KB for the two banks, on a
   Worker already at 1 886 KiB of its 3 072 KiB cap, so each bank is one
   **front-coded** string (`@melee/core/words/word-list-coding`: per entry, the
   letters shared with the previous word as a digit, the new letters, and a
   mark — `e`/`m`/`h` an answer's tier, `f` a familiar long form for 67).
   **Forms** 70 101 French (Lexique's 125 653 less compounds, elisions and
   lengths outside 2–9), 105 241 English. **Answers** (5/6/7/8 letters) — French
   easy 368/405/392/280, medium 372/466/520/483, hard 572/920/1 116/1 038, on
   `freqlemfilms2` floors of 20, 5 and 1 per million; English easy
   381/371/306/241, medium 439/532/477/439, hard 1 088/1 558/1 537/1 464.
   **Familiar** long forms besides the answers: 13 450 French (a form read once
   per million words, films or books), 13 657 English (SCOWL 10–35).
   **Gzipped** 91 KB French, 146 KB English. **Worker** 1 886.16 → 2 116.91 KiB
   gzipped (11 095 → 11 643 KiB raw), measured with a temporary import since
   nothing serves the bank yet.
   SCOWL lists every inflection beside its lemma, so the build drops an English
   answer whose stem by ending (-s, -es, -ies, -ed, -ing, -men, -ves) is a
   SCOWL word, a comparative whose superlative is one, and a hand list of
   irregular pasts and plurals. The answers also lose SCOWL's own
   `misc/offensive.*` and `profane.*`, and `scripts/word-answer-blocklist.json`:
   crude and sexual words and slurs found by a search, plus what three seeded
   samples of 40 per tier and language read by hand turned up — French
   _antan_, _group_, _lupus_, _marshal_, _poindre_, _polack_, _pongo_,
   _prion_, _staff_; English _foreskin_, _genocide_, _pseudo_, _rebind_,
   _sexually_, _swisher_, _tripos_. Core: `foldWord`, `marksForTry` /
   `isFoundBy`, `checkTry` (refusals `not_one_word`, `wrong_length`,
   `wrong_first_letter`, `not_in_dictionary`, the dictionary injected),
   `pointsForWord`; `@melee/protocol/mystery-word` holds `letterMarkSchema` and
   `MYSTERY_WORD_TRY_COUNT`. The bank: `isValidWord`, `mysteryWordAnswers`,
   `drawMysteryWord`, `playedMysteryWordId`, `wordFormsByLength` and
   `isFamiliarWord` for 67.
2. **Served.** Protocol arms, capabilities, the round builder and grader, the
   conductor's draw, the views, `GAME_NOTES`, the socket suite. Reachable by a
   settings frame, not on the shelf.
3. **On the shelf.** Starts with `/impeccable`: one complete example page per
   direction — the seat's grid and keyboard, the wall's colour grids at
   `MAX_PLAYERS_PER_ROOM`, the reveal — behind one index link for Adrien to
   compare. Then the screens, the setup (length, duration, level), the spine,
   both dictionaries, `shelvedGames`, the catalogue and `CLAUDE.md` rows. Seen
   muted on a wall, a seated console and two phones at full seats; the reveal
   and the grid's entry filmed.

## How to tell it is done

A room plays a six-letter French word and an English one: a non-word is
refused without costing a try, the colours are right on a word with a repeated
letter, the wall shows every seat's grid in colours with no letter, a seated
console never holds the word, and the reveal pays a word found on the third try
less than one found on the second.
