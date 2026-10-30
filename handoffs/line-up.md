# The line-up: say what each planned game is

Everything Adrien reported about how the line-up names its games. One session;
strike each item as it lands and delete this file once none is left. UI:
`impeccable` first, and Adrien leaves the pattern to best practice — decide it,
don't ask.

## 1. The "next round planned" card names the variant by its source kind

> In the "next round planned" block I get e.g. "blind test – a decade", but
> "blind test – the 70s" is better. And if several things are ticked, maybe
> just "blind test".

The label comes from the source's own name — `blindtest.source.decade`
("a decade" in both dictionaries) — rather than from
what was picked under it (`blindtest.decade.1970s`, "the 70s"). Name the
variant by its one concrete pick (a decade, a genre, the films…), and by the
game alone when more than one thing is ticked. Check every game whose variant
label is built the same way, not only the blind test.

## 2. The running order wants each game's full detail

> In the row of games in order, I think it really needs the detail of what the
> game will be. If space runs short, maybe a tooltip with every detail? Or
> clicking on it? I leave it to best practice.

Each row of the running order (the planned games the host drags) should say
what that entry plays — source, years, difficulty, mode, round count, as the
entry's settings hold them. Where a row cannot hold it, pick the pattern:
react-aria's `Tooltip` does not open on touch and the console is often a phone,
so a press that discloses the detail (a popover or an expandable row) is the
likelier answer; a tooltip alone would leave touch hosts without it.

Verify muted, at phone and desk widths, with a long line-up of several variants
of one game.
