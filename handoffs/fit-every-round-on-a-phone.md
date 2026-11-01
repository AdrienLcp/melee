# Every answering screen fits a phone, for every game

> « Quand on est sur l'écran d'une épreuve avec des propositions, un jeu, etc,
> on évite d'avoir un scroll au maximum, il faut que ce soit responsive et on
> fait tout rentrer dans l'écran. Si tu as des doutes on peut en parler et
> enlever des choses si besoin, faire des choix, changer la UI à certains
> breakpoints. »

The rule already exists. `.claude/rules/screen-roles.md`: *an answering screen
never scrolls — a question and its choices, the floor, a buzzer, anything
pressed against the clock — on a player and on a seated console alike*
(`apps/game/DESIGN.md:468`, *The No-Scroll Rule*). The e2e coverage was built
around the quiz's four choices. Nobody has swept all sixteen games. This
session does.

**`impeccable` first** (global rule 1). He offered cuts and breakpoint
changes. Make those calls yourself, following the order below, and list in
the final reply what each screen gave up.

**Run after `round-and-game-standings.md` has landed.** Both touch
`player-round.sass` and `e2e/choice-fits.spec.ts`. This session covers the
**answering** phase (`countdown` / `playing` / `buzzed`); the reveal is the
other handoff's.

## The sweep

**Every game and every answer mode, on the player screen and on the seated
console with no wall.** Check each in the lobby → countdown → playing →
buzzed states that exist for it:

- **blind test**: choice, typed, buzzer;
- **buzzer**;
- **quiz**: choice and typed, on a long question, and on the flags, emoji
  rebus, capitals and silhouettes rubrics;
- **reflex**, before and after the flip;
- **slate**: writing, then the item `closed` / `marked`;
- **atlas**: point on the map; the name round is covered by
  `choice-fits.spec.ts:617`;
- **challenge**: the player screen while the table plays;
- **inner clock**;
- **matchsticks**: equation and number, the `move` and `spoken` variants;
- **timeline**: order, five events;
- **black square**: the grid at 3 and at 9 answers, `spoken` with the keeper's
  screen;
- **petit bac**: the sheet at its most categories, and the vote;
- **shades**: the colour picker;
- **most likely**: the vote on a seat, at **24 seats with long names**, the
  case most likely to break;
- **le juste chiffre**: the estimate;
- **plus ou moins**: the pair.

The shapes are `VIEWPORTS` in `e2e/choice-fits.spec.ts:19-38`. The phones are
320×568, 360×640, 390×844, 430×932 and the landscape 568×320, 667×375,
812×375. Use a full table, French (it runs longest), and both palettes.

**Typed modes with the on-screen keyboard up**: the field, the question and
the send press stay visible when the visual viewport shrinks to roughly half.
Check `visualViewport` and the viewport meta's `interactive-widget`; decide
and write down the approach.

## What gives way, in order

Before anything scrolls:

1. Decoration and repeats: an illustration, a second copy of the round's
   place, a hint already said elsewhere.
2. Secondary text: a note, an example, a long label with a short form.
3. Size, down to the `--text-xs` floor for text and the 44px floor for a
   touch target.
4. Layout at a breakpoint: stack to side-by-side in landscape, two columns of
   choices, a grid for a long list of seats.

A list too long for any of these may scroll **inside its own box**, never the
page, and only where that is not "pressed against the clock". Petit Bac's
sheet with the keyboard up is the likeliest candidate. Write each screen's
order into `screen-roles.md`, under a player section beside the wall's.

## Tests

Extend `e2e/choice-fits.spec.ts`: one `[layout] player, <game> <mode>: never
scrolls` per screen above at the phone viewports. Copy the existing overflow
checks: `:1353` *never scrolls* and `:1524` *never runs off the side*. Read
what `:1353` already lists first, so nothing is duplicated. The seated console
gets the same checks. Break one on purpose.

## Verify

Muted browser (`docs/browser-driving.md`: `melee:volume` = `'0'` by init
script before the first navigation; several of these games play a clip). Take
a screenshot of every screen at 320×568 and 390×844 and look at each. A green
overflow test says nothing about a clipped label or a press under the fold of
a sticky element.

Then `pnpm validate`, the CHANGELOG, this file deleted, commit with
`-- <paths>`, push.
