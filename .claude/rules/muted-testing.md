# Test the game at volume 0

Sound comes out of Adrien's speakers, not yours, and has woken him at night.
Any browser you drive (Playwright, Claude in Chrome, the app's built-in pane)
plays at volume **0** — never "low", never whatever the app remembered, and
you never raise it.

- The volume persists in `localStorage` under `melee:volume` (a number from
  `0` to `1`, see `preferences-storage.ts`). Write `"0"` there **before** the
  page loads — Playwright `addInitScript`, or set it then reload before the
  first click. Moving the slider after load is too late: the sound already
  played.
- The Playwright MCP launches Chromium with `--mute-audio`; the other browsers
  are only covered by the stored volume.
