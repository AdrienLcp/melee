# Small fixes: fullscreen, the timeline's arrows, Petit Bac's "personnalité", Matchsticks' wording and "007"

Five small reports from Adrien. One session, independent of the other
handoffs. UI items: `impeccable` first, seen in a browser, muted, at phone and
desk widths. Strike each item as it lands, delete this file once none is left.

## 1. Fullscreen can be entered but not left

> We can go fullscreen but not leave it? A shame, add it.

The control already toggles: `Fullscreen`,
`apps/game/src/presentation/components/app-menu.tsx:308-328` (mounted :544),
labels `menu.fullscreen.exit` / `enter`. Likely bug: `canGoFullscreen()`
(`apps/game/src/infrastructure/browser.ts:89-92`) returns false when
`matchMedia('(display-mode: fullscreen)')` matches — which Chromium appears to
do once the page itself is fullscreen, so the component returns `null`
(`app-menu.tsx:312`) exactly when "exit" should show. Skip that check while
`isFullscreen()`. Verify in a real browser in and out of fullscreen (F11
browser fullscreen should keep hiding it: the page cannot leave it).

## 2. The timeline's arrows take the item's width

> I'd like the arrows stacked one above the other instead of side by side, to
> leave the item its width. On a touch screen you only drag & drop anyway —
> maybe remove the arrows there. With keyboard and mouse, side by side is ok;
> a media query on screen size, I think. I leave it to you.

`apps/game/src/presentation/components/timeline-order-list.tsx` (react-aria
`GridList` + `useDragAndDrop`, finger drag by `usePointerReorder`); arrows
:119-141. Sass `timeline-order-list.sass`: row `auto minmax(0,1fr) auto`
(:18-19), `.steps` flex (:89-91), `.step` 2.75rem wide (:93-99).

Decided: **stack them everywhere** — one column, up above down — rather than
remove them on touch. They are the precise move for big fingers on a small
phone (a drag across five cards misses), and the screen-reader path. Gate on
the input (`pointer: coarse`), never on width, if anything ends up differing
(a laptop with a touch screen exists). Keep each half a ≥ 44 px target; if
that makes cards too tall for five events on 360×640, decide the compromise
with `impeccable`.

## 3. Petit Bac: "Personnalité" means two things

> There's a "personnalité" theme, but it started a debate: a personality trait,
> or a famous person? Make it clear, and create both separately.

`petitbac.category.famousPerson`, FR 'Personnalité'
(`apps/game/src/presentation/i18n/dictionary-fr.ts:1304`), EN 'Famous person'
(`dictionary-en.ts:1364`); list `packages/protocol/src/petit-bac.ts:57-90`
(`famousPerson` :69). The server holds keys only (draw
`packages/core/src/petitbac/category-draw.ts:12`). Do: FR value →
'Personne célèbre'; add a `personalityTrait` bank category ('Trait de
caractère' / 'Personality trait'). Check what else lists the categories
(setup, tests, a stored host setup holding the old key keeps working).

## 4. Matchsticks: "LE plus grand nombre" or "UN plus grand nombre"?

> It says "find the biggest number"; shouldn't it be "a bigger number"? Not
> sure, since you get more points for the biggest.

`matchsticks.goal.biggest`, FR 'Déplace une allumette pour faire le plus grand
nombre' (`dictionary-fr.ts:1164`), EN :1206; same for `smallest`. Pay:
`packages/core/src/matchsticks/move-pay.ts` — `MOVE_TIERS` (:13-17) pays 3/2/1
for the best, second and third distinct numbers reachable; any other bigger
number pays **nothing**. So "a bigger number" would promise points it does not
pay. Decided: keep "the biggest", and say the podium where the goal is shown —
e.g. "the biggest pays 3, the next two 2 and 1" — so a near miss is not a
surprise. Same for `smallest`.

## 5. "007" counted as a number

> We saw a result "007" that was accepted as a number; it felt odd, although
> I think it can count as valid.

By the code it is **refused**: `NUMBER = /^(0|[1-9][0-9]*)$/`
(`packages/core/src/matchsticks/one-move.ts:104-108`), so `numberValue('007')`
is `null` and the move pays 0; equations use the same check (:111-140); dealt
puzzles never start with a zero (`deal.ts:55`). Yet Adrien saw it accepted:
find where — a reveal listing, the client's own preview of the move, an
equation operand, the host-judged (`spoken`) variant — and make every screen
agree with the server. Position to defend: keep refusing a leading zero (it
is not how a number is written, and it turns "smallest" into a hunt for
zeros), and when a move makes one, say why it pays nothing.
