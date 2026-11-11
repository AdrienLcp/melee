# 66 — Mystery word

**To do.**

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

| Source | Language | Used for | Licence | Owed |
| --- | --- | --- | --- | --- |
| Lexique 3.83 (lexique.org) | French | every valid form, and the answers by lemma frequency | CC BY-SA 4.0 | Credit New, Pallier et al.; the derived list stays CC BY-SA |
| ENABLE | English | every valid form | public domain | nothing |
| SCOWL 2020.12.07, `english-words.10/20/35` | English | the answers, the size as the tier | permissive, no fee | keep its copyright notice in the bank header |

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
  the tier. `easy`, `mixed` and `hard` deal through `dealByDifficulty` as every
  content game does. A hand-kept blocklist strips slurs and crude words from
  the answers (not from the valid tries — a word a seat types is its own), and
  the step reads a seeded sample of each tier by hand before it ships.
- **The language** of the dictionary follows the room's question language, the
  way the quiz's bank does.
- **The pay**: a word found on try _k_ earns `[1, 1, 0.85, 0.7, 0.55, 0.4][k-1]`
  of the answer's nine tenths, and a found word races for the clock's tenth,
  timed at the try that found it — not at the first coloured letter, which is
  what `scoredAfterMs` records today. A word not found pays nothing; the grid
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
   other banks, each with an `attributions` header: the valid forms as one
   sorted, folded string per length, the answers with their tier. A bank
   module parsing it once. `@melee/core/words/` for the fold and
   `@melee/core/mysteryword/` for the colours, the try checks and the pay,
   each with tests. `/credits` gains the three sources. Measure the Worker.
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
