# Small fixes: Petit Bac, focus, number formatting, home, Lights

Five independent fixes. Read `README.md` first. Diagnosed read-only on
23/11/2026, lines from `7ded3593`. Each is seen in a browser at phone width,
muted, before the next.

## 1. Petit Bac: the sheet collapses on the last line's first letter

Adrien (screenshot): "when I type the first letter of the last input it all
jumps; one letter less or more and it's fine."

**Cause (confirmed)**: the sheet is full when every line holds text but
stoppable only when every line passes `isStoppableLine`
(`MIN_STOPPABLE_LETTERS = 2`, `packages/core/src/petitbac/letter-match.ts`),
so one letter on the completing line mounts the `stop-note`
(`apps/game/src/features/player/petit-bac-sheet.tsx:190-193, 289-293`).
`.petit-bac-sheet .stop-note` has `flex: 1 1 12rem`
(`petit-bac-sheet.sass:278-284`), written for the vote footer's wrapping row;
inside `.stop`, a **column** flex box (`:111-114`), that 12rem becomes a
height, and the sheet card (`:20, :27-28`) gives up its list.
**Fix**: scope the 12rem to `.vote-note` (or `flex: none` in `.stop`), and
keep the note mounted, folding it open with `fold.opens-in-column` +
`useLastShown` — it pops in and out today, which breaks rule 0. Film it.

## 2. Keep the keyboard open between two guesses

Adrien: "in black square the input blurs after each guess, annoying. Keep it
focused with the keyboard open after a guess, right or wrong; it should only
lose focus when you land on the black word. Do it in other games too."

**Probable cause** (check first in a browser: does the keyboard's own send
key keep focus?): pressing « Envoyer » moves focus to the button, then
`setGuess('')` disables it (`isDisabled={isEmpty}`) and focus drops to
`body` (`black-square-answer.tsx:67-87`). The repo already met this
(`estimate-answer.tsx:99-100`, `longest-word-answer.tsx:50-54`: a touch
focuses the button even with `preventFocusOnPress`).
**Fix**: a ref on the input, `focus()` inside `onSubmit` during the gesture
after a successful send, and the button not disabled on an empty field. The
blur on the black word comes free: the form unmounts on `isClosed`
(`:64-66`). Same treatment for:

- quiz / blind test typed, `TypedAnswer` (`answer-forms.tsx:231-267`) — only
  a fully banked answer disables it;
- Five clues typed (`five-clues-seat.tsx:214-243`): disabled after each guess
  on a clue, so it always blurs; refocus when the next clue opens;
- Slate (`slate-sheet.tsx:160-176`): Previous/Next take focus.

Not affected: mystery word, longest word, make the number (on-screen
tiles), Petit Bac (Enter moves on), think alike and estimate (one send).

## 3. Estimate: show the number grouped while typing

Adrien: "format in the input, '100 000' rather than '100000' in French — we
can't see what we're about to send."

Today: react-aria `NumberField` via `presentation/components/quantity-field.tsx`,
used at `estimate-answer.tsx:86-98` (`maximumFractionDigits: 2`,
`inputMode='decimal'`, `maxValue` `MAX_ESTIMATE` 1e15). Probably it only
formats on commit (blur/Enter) — confirm in the browser.
**Decided**: group live in the field itself — the number the player reads is
the one they send. If NumberField can't, a text field that reformats on each
change and restores the caret by counting digits before it. Pitfalls: French
groups with U+202F and must parse it back on paste; `decimal` keyboards type
"." where the locale wants ","; keep the numeric keyboard; `maxValue` only
clamps on commit. Test the parse/format helper in core.

## 4. Home page: the wordmark starts below an empty band on mobile

Adrien: "the home page on mobile leaves space at the top, the height of the
menu button, before 'Melee'. Move it up level with the menu."

**Cause (confirmed)**: below 60rem, `features/home/home-page.sass:36` pads
the top by `--menu-block-inset` (`app-shell.sass:33`, reasoning at `:20-29`)
so the wordmark gets the full width under the absolute menu
(`app-menu.sass:26-27, :112`). **Fix**: the plain
`--layout-padding-block-start`, and `padding-inline-end: var(--menu-inset)` on
the title block so the wordmark sits beside the menu. Check its
`clamp(…, 16 stage units, …)` still fits at 320 px wide, in fr, en and pt.

## 5. Lights: an instruction, and one board size for everyone

Adrien: "people don't understand what to do instinctively — add an
instruction. Small devices seem advantaged: taking all the room hurts big
phones; better a square of the same size for everyone, at the bottom or
centred."

Today no player screen says what to do (lobby `player-round.tsx:290-321`,
countdown `:267-272`, board `lights-board.tsx:242-302`;
`lights.home.description` shows only on the game's home and the host lobby),
and the board fills its frame on purpose (`lights-board.sass:5-11, 38-47`,
"taking every pixel", `lights-board.tsx:91-92`).
**Decided**: a square of one size (`aspect-ratio: 1`,
`inline-size: min(100%, ~17rem)`, never taller than the frame) **anchored at
the bottom**, where the thumb is; a one-line instruction ("Touche la lumière
allumée" — the sober wording is the session's, in fr/en/pt) shown on the
countdown and above the board. Rewrite the two comments that defend filling
the frame. Agree with Adrien's reasoning: thumb travel scales with the board.

## Done when

All five seen in a browser at phone width (and the home at 320 px), motions
filmed, changelog, delete this file and its README row.
