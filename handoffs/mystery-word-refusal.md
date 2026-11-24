# Handoff — mystery word: one short refusal

_Saved 2026-11-24 · `C:/git/melee`, on `main` at `3a7060d2`._

Adrien: typing a word that does not exist shows « essai non compté » on top
of « ce mot n'est pas dans le dictionnaire ». He wants only « Ce mot n'existe
pas » or « n'est pas dans le dictionnaire ».

- The refusal is `error.not_in_dictionary` (`dictionary-fr.ts:656`):
  _Ce mot n'est pas dans le dictionnaire. Ça ne t'a pas coûté d'essai._, and
  `not_one_word` beside it carries the same tail. Find where else the
  mystery word screen prints a « non compté » line (the player's grid, under
  `features/player/`, `mysteryword.*` keys) — two lines say it twice.
- Keep one short sentence in all three locales (en, fr, pt): « Pas dans le
  dictionnaire. » The grid not losing a row already says no try was spent.
  Check `longestword` uses the same code before changing its words.
- Verify in a muted browser at phone width; CHANGELOG entry; push to `main`.
