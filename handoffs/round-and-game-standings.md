# The reveal: this round apart from the whole game, on every screen
<!-- cspell:ignore apparait -->

> « Sur mobile, on ne peut plus scroller alors qu'on a récemment ajouté la règle
> que sur le device du joueur on peut scroller quand on est sur l'écran des
> résultats. »
>
> « Là, le bouton "prêt" est collé et passe au dessus du classement j'ai
> l'impression. »
>
> « En parlant du classement, on confond toujours les résultats de la manche
> avec le classement général de toute la partie. C'est relou. Il faut repenser
> la UI. »
>
> « dans la row d'un joueur dans le classement (sur le device joueur je crois,
> en vue mobile, mais vérifie les autres quand même), il y a son classement (par
> exemple le chiffre "1"), puis son pion et le nom du joueur je crois. J'ai
> l'impression qu'il y a beaucoup d'espace entre le numéro de son classement et
> son pion, c'est voulu ? »

He has reported the round/overall confusion over several sessions. This one
ends it. **`impeccable` first** (global rule 1). If it asks for a choice
between directions, each direction becomes a full example page (real content,
a full table, phone and wall), all reached from **one index page** given as a
raw `file:///C:/...` URL, with a recommendation. Everything else here is
already decided.

## The four screens, in his words

> « Il y a plusieurs types de devices. Le device "joueur", le device
> "animateur" / "juge" / "arbitre" / "configurateur", qui n'apparait que si y a
> un wall. Le device "Wall", aucun scroll sur celui ci, normalement on n'y
> touche pratiquement pas de la partie, à part quand on fera des jeux "au
> tableau", mais pour le moment il n'y en a pas. Le device "mix" qui peut
> rassembler à la fois le wall, l'écran d'un joueur (qui serait l'hôte),
> l'animation, etc, dans le cas où le mec qui a lancé la partie veut aussi jouer
> sur cet écran où il a lancé. Il peut toujours animer et configurer. Et il peut
> aussi servir de wall pour montrer la partie aux gens, avec le plateau (ou sans
> plateau). »

That is `.claude/rules/screen-roles.md`:

| His name | The rule's | On the reveal |
|---|---|---|
| joueur | Player | may scroll |
| animateur / juge / configurateur | Console beside a wall | may scroll |
| Wall | Wall | never scrolls |
| mix | Console with no wall, seated or not | may scroll, but what the room reads sits in the first viewport |

The "mix" screen does three jobs at once: the room's screen, the host's
controls, and a seat when the host plays.

## What the triage verified

### Why the player's results don't scroll, and why Ready covers the standings

One mechanism explains both.

- **The tree**: `PlayerPage` renders `<Main className='player-page playing'>`
  (`player-page.tsx:294`), then `RevealedRound` (`player-round.tsx:289-320`):
  `.outcome` (`Revealed`, `YourRound`, `YourTrackStrip`), then `RevealBoard`
  (`RoundBoard`, `round-board.tsx:47`, or `TeamRoster` with teams), then
  `.hold`, then `BackAtTheTable` (the Ready press). The document is the
  scroller.
- **The layout fits the board to the phone by shrinking rows**:
  - `player-page.sass:31-40`: a grid, `min-height: 100dvh`, rows
    `auto minmax(min-content, 1fr)`, only when `.round-board` exists;
  - `player-round.sass:403-412`: `minmax(min-content, 1fr)` with
    `min-height: 0`;
  - `round-board.sass:170-193`: the board is `container-type: size`, each
    row's font is the box height over the row count (:186), with a 14px floor
    (:183), and the answer line is hidden under 26rem (:188-193).

  This comes from `a682f4bc` and `451c1764` (10-29). The page grows only once
  every row is at 14px, so with 8 seats on 390×844 there is nothing to scroll.
  It predates the scroll rule (`876b79db`, 10-31), which the reveal never
  followed.
- **Rows taller than the measured box spill out of it** without growing the
  page, since a size container does not grow with its content. They land
  under `.hold` and Ready, and Ready paints on top (`position: relative`,
  `_control.sass:48`). Past 100dvh, `#root { overflow: clip }`
  (`globals.sass:56-58`) cuts the rest.
  - The likely sources of taller rows (inferred, not measured): the case
    under the score on a track game (`f069e62e`, `round-board.sass:131-142`),
    and browsers without `text-box`, whose `line-height: 1` fallback
    (`_text-box.sass:22-27`) makes split points cells taller.
- **Ready** is `BackAtTheTable` (`player-round.tsx:328-361`), a
  `ToggleButton size='large'`, in the grid's last row
  (`player-round.sass:330-333, 424-425`). It is not sticky; it only overlaps
  through the spill.
- **The e2e test encodes the old contract**: `choice-fits.spec.ts:1552`
  (*"scrolls only at the floor, never clips a row"*) runs in Chromium only,
  with no track and nobody ready. That is why it stayed green.
- **Ruled out**: the reconnecting `inert` (`main.tsx:41`); `9c534cd6` (wide
  screens only); `_framed.sass` (answering screens only); no sticky or fixed
  element in the player screens. **Atlas only**: `touch-action: none`
  (`world-map.sass:21`) on the player's map reveal, so a swipe starting on the
  map can't scroll the page.

### Where the two scopes run together

- **Player, no teams**:
  - `YourRound` prints « +35 », then « 1er de la manche » loud
    (`player-round.tsx:1051-1054`), then « 2e sur 8 au général » small
    (:1064-1070).
  - `RoundBoard` follows with **no heading and no column labels**, and one row
    mixes both scopes. The **overall** rank and order (`buildScoreboard`,
    `round-board.tsx:86-115`) and total (:153-163) sit beside the **round's**
    right/wrong fill (sass :53-55), the round's points as a bare number next
    to a « +15 » speed half (:130-152), and what the seat answered (:165-167).
- **Player, teams**: `TeamRoster`, « Classement » as an aria-label only, with
  « +N » round gains on the trays (`player-round.tsx:215-234`).
- **Console without a wall, and the seated "mix" console**
  (`room-stage.tsx:461-523`): `ScoreTrack`, then `RevealPanel` (the answer,
  then `RoundPodium`: three chips with pawn, name, answer and « +N », **no
  heading, no place numbers**, then « Trouvé : N sur M »,
  `reveal-panel.tsx:478-563`), then `Standings`.
  - `Standings` has an h2 « Classement » in the quietest label type
    (`host-console-page.sass:116-118`, `_boxed-standings.sass:15-18`), over a
    `Scoreboard` with a **« +N » column on the overall rows**
    (`scoreboard.tsx:186-193`). It is the same string as the podium's chips.
  - The seated host only gets its row highlighted. It never sees its own
    « de la manche » / « au général ».
- **Console beside a wall**: no `Standings` (`room-stage.tsx:488`). Its roster
  column (`podium-roster.tsx:85-110`) shows rank and total.
- **Wall**: as the console without a wall (`wall-page.tsx:249-261`). Gains are
  hidden in columns under 22rem (`wall-page.sass:117-124`).

### The gap between rank and pawn

- `RoundBoard`: the rank column is fixed at `1.3em` (sized for « 24 »),
  `grid-template-columns: 1.3em minmax(0, 1fr) auto [auto]`
  (`round-board.sass:65-69`).
  - On top of that: `column-gap: 0.6em` (:46), a left-aligned 0.8em digit
    (:71-76), and the pawn's own inner margin (`PawnShape` in `pawn.tsx`,
    viewBox 24×28, base 3 units in, head 6.5 units in).
  - About 38px at the row cap, wider than the pawn itself.
- `Scoreboard` has the same `1.3em` column plus `gap: var(--space-s)`
  (`scoreboard.sass:21, 37-54`). It is used for the console and wall
  standings, the final board and the player's finish. On the wall the column
  reaches ~52px (rows up to 2.5rem, `wall-page.sass:108`).
- The console roster beside a wall has its own `.podium-rank`.

## Decided

1. **Two scopes, two blocks, never one row.** On every screen the reveal reads
   top to bottom:
   - **« Cette manche »**: the answer, who scored and how much, and on a
     player screen your own result (« +35 · 1er de la manche ») and what each
     seat answered. Place numbers here are round places. Every round figure
     lives here and nowhere else.
   - **« Classement général »**: rank, pawn, name, total, and the movement
     stamp (↑2). **No round points on these rows**: drop the « +N » column
     (`scoreboard.tsx:186-193`), the bare round points and right/wrong fill on
     the player's rows, and the team trays' « +N ». The heading is visible
     (not an aria-label) and is not the quietest text on screen.
   - Different row anatomy for each block, so neither reads as the other.
     Exact styling is `impeccable`'s.
2. **The player's results scroll.** Drop the shrink-to-fit board on the player
   reveal: no size container, rows at a fixed legible size, the document
   scrolls. **Ready and the hold sit in the flow right after « Cette
   manche »**: in the first viewport, before the overall standings, never over
   anything. Check `#root`'s `overflow: clip` cuts nothing, and that a swipe
   on the Atlas reveal map can still scroll the page (or the map leaves room
   to swipe beside it).
3. **The seated "mix" console** gets its own one-line result in « Cette
   manche », as a player does. The console with no wall keeps the first
   viewport rule: the round's block, the head of the standings and the
   next-round press.
4. **The console beside a wall**: label its roster column « Classement
   général ». The wall follows the same two blocks inside its no-scroll budget.
   The give-way order in `screen-roles.md` loses its "round gain beside a row"
   step, since rows no longer carry one.
5. **Rank against pawn**: size the rank column to its content (two digits at
   the rank's own size), right-align the digit toward the pawn, and close the
   gap so rank-to-pawn reads like pawn-to-name, allowing for the pawn's inner
   margin. Apply this in `RoundBoard`, `Scoreboard` (console, wall, final
   board, player finish) and `.podium-rank`.
6. **Final board**: the player's finish (`player-round.tsx:509-526`,
   `Scoreboard isResult hasPawns`) gets a « Classement final » heading. There
   is no round left to confuse it with; this is just consistency.
7. **Strings** in both dictionaries (`.claude/rules/i18n.md`). **Docs**:
   `screen-roles.md` (the player reveal's first viewport, the give-way order),
   `apps/game/DESIGN.md`, and the protocol doc where `d087b8e7` described
   gains on the standings. The wire may keep carrying gains; it's the screens
   that stop printing them on overall rows.

## Tests

Rewrite `choice-fits.spec.ts:1552` to the new contract, at 24 seats
(`MAX_PLAYERS_PER_ROOM`) with long names, in French:

- « Cette manche », the hold and Ready are inside the first viewport;
- the page scrolls to the last standings row;
- **no two boxes intersect**: Ready's rect against every row's rect.

Run it with and without a track (the case under the score), with every seat
ready, and through the `text-box` fallback (a WebKit project if the config
can carry one, else the fallback forced). Keep the wall's no-scroll tests
(`:792`, `:1986`) green under the new blocks. Break the new test once on
purpose.

## Verify

Muted browser (`docs/browser-driving.md`: `melee:volume` = `'0'` by init
script before the first navigation), at 24 seats with long names, in French,
both palettes.

- **Player** at 390×844 and 320×568: it scrolls; Ready covers nothing; the two
  blocks can't be mistaken; the rank sits next to the pawn.
- **Player with teams**: the same.
- **Mix console**, seated, no wall, at phone and laptop sizes.
- **Console beside a wall.**
- **Wall** at 16:9 and 9:16.

Screenshot each and look at them; a green test is not the check.

Then `pnpm validate`, the CHANGELOG, this file deleted, commit with
`-- <paths>`, push.

## Order

Run this before `fit-every-round-on-a-phone.md`. Both touch
`player-round.sass` and `choice-fits.spec.ts`.
