# 67 — Longest word

**To do.** Starts once [66](66-mystery-word.md) has served its dictionary.

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
2. **On the shelf.** `/impeccable` first, an example page per direction behind
   one link: the nine tiles and the field on a seat, the wall's draw with every
   seat's length, the reveal with the best words. Then screens, setup, spine,
   dictionaries, `shelvedGames`, catalogue and `CLAUDE.md` rows; seen muted at
   full seats, the draw's entry filmed.

## How to tell it is done

A round in each language: a word using a letter twice is refused, a longer word
replaces a shorter one and an equal one does not, the wall shows lengths and no
word, and the reveal names the draw's longest words beside every seat's.
