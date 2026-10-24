# 46 — Straight into the room

**To do.** Asked 24/10/2026. Two fixes to what a host sees first: a game
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
