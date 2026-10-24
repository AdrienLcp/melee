# 46 — Straight into the room

**Done** 24/10/2026. Asked 24/10/2026. Two fixes to what a host sees first: a game
clicked on the home page opens its room, and the console's side panel stops
leaving page background around it.

## Step 1 — a game on the home page opens its room

Today a spine on the home shelf (`GameShelf`) links to the game's own page,
which offers *Open a table* and a nickname field. Whoever is on the home page
already knows the site, so the spine **opens a room on that game** directly —
the same `useCreateRoom` call a game page's button makes, one tick. The link
to the game page stays in the markup (`href`, for search and for a shared
link); the press is what opens the room.

The game pages stay, for the visitor who arrives from a search or a group
chat. Each keeps one call to action, *Open a table*; the nickname field goes —
the name is given in the room, where the console's seat form and the menu
already ask for it. Check that nothing else reads that field (the stored
`melee:nickname` is still written from the name a room accepts).

Playing alone needs nothing new: no rule refuses a round with no seat but the
host's, so a host takes a seat in *Players* and starts — in every mode the host
does not judge.

## Step 2 — the side panel

In a room, the setup panel standing on the right leaves a strip of page
background (blue) between it and the window edge; the inspector lands on
`<html>` there, so it is the root's `scrollbar-gutter` (or the root's own
scrollbar) reserving space beside a panel drawn edge to edge. Fix the cause
rather than move the panel: the panel reaches the window edge on either side
(`melee:panel-side` stays), with no page colour showing past it.

The panel's own scrollbar is painted in the app's blue on the panel's white.
It takes the panel's surface instead — `scrollbar-color` from the panel's
tokens, both palettes.

`impeccable` first for both steps. Verified in a browser, muted: the home
spine opens a room on its game; a game page has no nickname field; the panel on
the right and on the left, wide, with a scrolling tab, shows no strip and a
scrollbar on the panel's colours, light and dark.

## What landed

- A plain press on a spine opens a room on that game through the home page's
  one `useCreateRoom`, which now records the games it is opening for
  (`openingFor`), so the spinner lands on the spine pressed and the tray's
  press stays still. A modified click still follows the `href` to the game's
  page.
- A game page has one door, *Open a table*. The play-right-away door went with
  the nickname field, and so did `canPlayRightAway`, its only reader; the
  console's own *play right away* in the lobby is untouched.
- **The strip was the root's reserved gutter.** On a desk the console's
  document no longer scrolls at all: the stage column scrolls inside itself, as
  the panel already did, so nothing stands between the panel and the window
  edge on either side. A paper surface (`box-lid.paper`) sets its own
  `scrollbar-color`, because the root's is inherited already resolved to the
  board's colours — the same reason the lid redeclares its rules.
- In passing: the *Host judges* stamp on an unticked game, printed on the
  socket in dark, was card ink on a dark socket; it now follows its box's ink.
