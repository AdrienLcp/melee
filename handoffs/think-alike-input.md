# Handoff — Think alike's invisible field, the first field focused

_Saved 2026-11-28 · `C:/git/melee`, on `main`. Wave 1. Start with the
`impeccable` skill._

## 1. Think alike: nobody finds where to write

Adrien: « on ne trouve pas l'input, il est invisible […]. Il faut le montrer
mieux quand même, on ne comprend pas où il est, s'il y a un input ».

`apps/game/src/features/player/think-alike-answer.tsx:115-137` uses the shared
`TextField`, but `think-alike-answer.sass` strips every cue: label
visually-hidden, textarea `background: transparent; border: 0; box-shadow:
none`, no placeholder. What is left is an empty white card on a light board —
it reads as decoration. **Fix:** a field that looks like a field before it is
touched: keep the primitive's fill and ring (`text-field.sass:24-37`), a
visible label or a placeholder in the dictionary (« Ton mot »), the send button
beside it. Compare with `TypedAnswer` (`answer-forms.tsx:242-262`), which reads
right.

## 2. The first field is focused when typing is all there is to do

Adrien: « ce serait bien de le focus par défaut vu qu'on a rien d'autre à
faire. Et idem pour les inputs des autres jeux ou la première action à faire
est d'écrire ».

Already `autoFocus`: typed quiz / blind test, black square, estimate, five
clues, think alike. **Missing:** Petit Bac's first line
(`petit-bac-sheet.tsx:232`) and Slate's open item (`slate-sheet.tsx:154`).
Check each really takes focus on a round opening (they mount from a socket
snapshot, not a tap — iOS Safari may not open the keyboard then; that is the
platform, note it, do not hack around it). Think alike may already focus and
be invisible: confirm in the browser.

## Verify

Muted browser: Think alike, Petit Bac and Slate at phone width and on a
laptop, both palettes — the field is seen before it is touched, nothing to tap
before typing. Film every motion touched. CHANGELOG entries.
