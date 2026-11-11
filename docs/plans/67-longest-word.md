# 67 — Longest word

**Done** — steps 1 and 2 landed on 11/11/2026, seen muted at full seats on a
paired wall, a console seated and unseated, and two phones.

Nine letters are drawn on every screen and every seat has the clock to type
the longest word it can make from them. A seat may send as many words as it
likes; the server checks each against the dictionary and the draw and keeps the
seat's longest. The reveal shows every seat's word and the longest the draw
held — _there was …_ — which is the moment the table argues.

The eighteenth game, **everyone at once**. Kind `longestword`, translation
prefix `longestword.*`, answer mode `letters`. _Mot le plus long_ in French,
_Longest word_ in English.

## Rules, as settled

- **The draw**: nine letters, three or four of them vowels, each drawn by the
  language's letter frequency, redrawn until the dictionary holds a word of at
  least seven letters from it. The letters are not the answer and travel to
  every screen.
- **A word** uses each drawn letter at most once, is at least two letters, and
  is a form of 66's dictionary — every form, conjugated and plural included,
  folded the same way. A refusal says which: not a word, or a letter not in
  the draw. It costs nothing.
- **The seat's word** is its longest accepted one; a later word of the same
  length does not replace it.
- **The pay** is relative to the draw, so a hard draw is not a poor round:
  `(length − 3) / (best − 3)` of the answer's nine tenths, where _best_ is the
  longest word the draw holds; three letters or fewer pay nothing. A word as
  long as the best is perfect and races for the clock's tenth, timed when it
  was sent.
- **No level**: the content is a draw, as on the swatch.
- **`roundDurationMs`** 30–90 s, **45 s by default**. The round closes on the
  clock or when every stamped seat has sent a word as long as the best.
- **During the round** every view carries the draw and each seat's best length,
  never its word — a length is pressure, a word would be a copy.
- **Duels**: yes.

## Steps

1. **Served.** `@melee/core/longestword/` — the draw, the solver over the
   dictionary (one pass over the forms, a letter count each), the checks and
   the pay, with tests; protocol arms, the round builder and grader, the views,
   `GAME_NOTES`, the socket suite (no seat's word on another's frame before the
   reveal, a word using a letter twice refused).

   **Done** 11/11/2026. `longestword` is in `gameKinds`, not `shelvedGames`:
   `language` (`fr` by default, the game's own like the mystery word's) and
   `roundDurationMs` 30–90 s (45); eight rounds by default, the reveal held
   for the host. The answer mode is `letters`; `player.answer` carries
   `{ kind: 'letters', guess }`. **Core** `@melee/core/longestword/`:
   `drawLetters` draws three or four vowels at even odds and the rest
   consonants by a frequency table per language (tenths of a percent, read off
   published prose counts, no Scrabble bag); **`Y` counts as a vowel** in both
   languages, and — not in the plan — **no letter is drawn more than twice**
   (`MOST_OF_ONE_LETTER`), because a frequency draw deals four `E`s often
   enough to spoil a round. `drawPlayableLetters` redraws until the forms hold
   a word of `LONGEST_WORD_FLOOR` (7) or more, giving up after 500 draws as
   `no_content_available`; its drawer is injectable for tests. The solver,
   `indexForms` / `longestWordsIn`, files the forms by length beside a 26-bit
   letter mask once per language, then walks down from nine letters and stops
   at the first length that holds one: a mask AND passes over a form needing a
   letter the draw lacks, a letter count over the rest. `shownBestWords` keeps
   three, familiar first (the bank's `f` mark). `checkWord` refuses
   `not_one_word`, **`letter_not_in_draw`** (new, also a letter used twice)
   and `not_in_dictionary`, a single letter included; `pointsForLetters` /
   `isLongestInDraw` price it. **Solver timing** on Node, this machine: the
   index costs 8 ms French and 6 ms English once, beside the bank's own 17 ms
   parse; a solve 0.28 ms French, 0.39 ms English; a playable draw averages
   1.25 attempts, 0.32 ms French and 0.46 ms English. Over 200 draws the best
   was 7 letters 95 times, 8 93 times, 9 12 times in French, and 97 / 95 / 8
   in English. **The verdict** `letters` is `{ length, bestLength }`, withheld
   from its own seat until the reveal (`yourVerdictIn`), because `bestLength`
   would say how long a word to look for. **The timing diverged from 66**:
   `bank` now asks `raisesVerdict` — a longest word raises its verdict by being
   longer, three letters included — and a raised `letters` verdict replaces
   `landed` with that word and stamps `scoredAfterMs` again, so the clock
   reads the seat's longest word rather than its first; every other game is
   unchanged. `letters` joins the retry gate, and `isFinal` holds once a seat's
   word is as long as the draw's longest: a further word is `already_buzzed`,
   and the round closes once every stamped seat is there. **Views**: every
   screen reads `letters`, `language` and `lengths` (each seat's longest
   length, never the word), the reader its own `yourWords` in the order sent —
   the paid one is the first of the greatest length — and the reveal
   `revealedWords`, `bestWords` and `bestLength`; the console reads
   `currentContent.bestWords` and `bestLength` while it holds no seat, `null`
   seated; the wall's arm is bare. The server keeps each seat's accepted words
   on the round (`words: Map<PlayerId, string[]>`,
   `domain/round/longest-word-round.ts`); `word-bank.ts` adds `drawLongestWord`
   and `solvedLongestWordDraw`; nothing goes to `playedContentIds`, a draw
   being no bank item, as on the swatch. The game app compiles with the
   dictionary keys, the refusal string, `CLOCK_PAID_SCORING`, the line-up
   entry name (language, seconds), the `SpellCheck` icon and a provisional
   spine (`oklch(41% 0.1 250)`, step 2 may move it). No `PROTOCOL_VERSION`
   bump: every change is a new arm. `longest-word-game.test.ts` (six tests,
   broken once) deals a fixed French draw through the real solver and covers
   the leak over a seated console, the refusals at no cost, a longer word
   replacing a shorter and an equal one not, the pay order, and the early
   close timed at the best word.
2. **On the shelf.** `/impeccable` first, an example page per direction behind
   one link: the nine tiles and the field on a seat, the wall's draw with every
   seat's length, the reveal with the best words. Then screens, setup, spine,
   dictionaries, `shelvedGames`, catalogue and `CLAUDE.md` rows; seen muted at
   full seats, the draw's entry filmed.

   **Done** 11/11/2026 — A's seat, B's wall, as for 66. `longestword` is in
   `shelvedGames`; `openedGameSettings` and Grand mix deal it in the locale's
   language (`questionLanguageFor`), one entry, and no other ready-made
   line-up takes it. Shared piece `presentation/components/letter-tile`:
   `LetterTile`, `isVowelTile` (vowels on the warm `--tile-2` face,
   `data-vowel`), `data-face` `faceDown` on the spine or `faceUp` turned over
   left to right by `--letter-index`. **The seat**
   `features/player/longest-word-answer.tsx`: the nine drawn tiles pressed
   into a row of nine slots, a laid tile sunk in its socket and disabled so no
   letter serves twice, a physical key laying the first free tile of its
   letter, Effacer / Mélanger / Envoyer under the draw, the accepted words
   listed longest first with the paid one marked, and a refusal folded under
   the row at no cost — `isWordRefusal` keeps it out of the console's error
   line. **Its reveal** `longest-word-revealed.tsx`: a card banded in the
   spine, _Il y avait_ over the draw's first best word dealt face up, the
   other best words under it (_En 8 lettres : …_, from `bestLength`), then the
   seat's own word on the same nine columns — from `revealedWords`, else the
   first longest of `yourWords` — or _Aucun mot_; the pay stays in the round's
   block, as on 66. **The wall and the unseated console**: the draw as big
   tiles, and a tower of face-down tiles per seat with its length on top and
   never the word, two rows of twelve; the reveal ranks every seat's word in
   one column beside the standings, after the best word dealt — two columns
   squeezed beside the standings cut a long name to five letters at 24 seats,
   so a row loses its padding before it leaves the box, and an empty row
   shows its slots alone. **The setup**
   takes the language, defaulted from the locale, and the time at 30, 45 or
   90 seconds. **The spine** moved from the provisional `oklch(41% 0.1 250)`,
   which sat between the inner clock's (235) and the quiz's (262), to a deep
   ultramarine `oklch(36% 0.15 266)`, one value for both palettes like every
   spine: the darkest on the shelf, its nearest neighbour petit bac at 0.11
   in OKLab where the shelf's closest pair already sits at 0.04, and 11:1
   under `--on-spine`. The shelf's `SpellCheck` icon, `ShuffleIcon` and
   `TrophyIcon` for the seat; document heads in both locales.
   **Seen** muted at 24 seats of long names (22 raw sockets, phones at 390
   and 360 wide, the wall at 1440×900 opened with the host token, the
   console unseated at 1440×900 and seated at phone width): a letter used
   twice refused under the row, a shorter and an equal word keeping the
   kept one, a word typed on a physical keyboard, the wall's text holding no
   word the draw makes before the reveal, nothing scrolling on the wall;
   the draw dealing in, a tower rising, the reveal's tiles turning over and
   the reveal leaving filmed. The pass found the reveal leaving every game's
   screens in one frame — it now fades into the countdown
   (`leavesTheReveal`, `e599591b`) — and the console beside a wall ranking in
   two columns of four-letter names, now one column scrolling in its card.
   **Open**: the reveal was measured at 1440×900 only, not on a shorter wall.

## How to tell it is done

A round in each language: a word using a letter twice is refused, a longer word
replaces a shorter one and an equal one does not, the wall shows lengths and no
word, and the reveal names the draw's longest words beside every seat's.
