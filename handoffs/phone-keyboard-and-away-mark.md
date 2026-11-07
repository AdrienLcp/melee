# Phone: the field stays in sight with the keyboard up, and "away" becomes an icon

> « J'ai encore eu un souci (que tu m'avais dit avoir réparé il y a quelques
> jours) : quand on focus un input, le clavier du smartphone s'ouvre, et ça
> casse la UI, on ne voit plus ce qu'on écrit. Ça n'arrive que sur certains
> smartphones […] au début j'avais cru que c'était que sur iPhone mais là on
> l'a remarqué aussi sur un Android […] je te laisse enquêter et trouver la
> VRAIE cause pour réparer ça bien. »

> « Le tag "hors ligne" prend un peu trop de place quand la largeur est
> serrée, je pense qu'on pourrait juste mettre une icône (soit juste dans un
> bloc serré, ou alors partout même sur les écrans larges, je te laisse voir
> ce qui est le mieux dans chaque cas). »

**`impeccable` first** (global rule 1). Both parts are layout work.
**Muted browser** (project rule 4), and **film** the keyboard opening and
closing (rule 0). The keyboard part is the priority: it is the second time it
has been reported fixed and is not. Use `engineering-discipline:diagnosing-bugs`.

## Part 1: the keyboard, which is a diagnosis, not a guess

### What was tried (`8f9dc974`, then `4f9ba2ef` and `e1a766c1`)

- `interactive-widget=resizes-content` was added to the viewport meta in
  `apps/game/index.html:5`.
- `onShownHeightChange` (`infrastructure/browser.ts:124-143`) publishes
  `visualViewport.height × scale`, on **`resize` only**, through
  `presentation/use-shown-height.ts:10-22`, which is mounted in
  `app-shell.tsx`.
- `--shown-height: min(100dvh, var(--visual-viewport-height, 100dvh))` lives in
  `styles/_tokens.sass:317-321`. Then:
  - `#root { min-block-size: var(--shown-height); overflow: clip }`
    (`styles/globals.sass:69-71`), on **every** screen;
  - framed pages use `height: var(--shown-height); overflow: hidden`
    (`styles/_framed.sass:44-46`, `features/player/player-page.sass:37-47`).
- Container queries make content give way. This is documented in
  `.claude/rules/screen-roles.md:99` and `apps/game/DESIGN.md:526-539`.
- e2e: `e2e/choice-fits.spec.ts:3875-4063`.

### Why it passed and still breaks

The test only shrinks the **layout** viewport (`resizeTo` →
`setViewportSize`, L386-398) and measures against `innerHeight`
(L3941-4011). That is Android Chrome honouring `resizes-content`. It never
covered the case where only the **visual** viewport shrinks and pans
(`offsetTop > 0`): iOS Safari, and Android in-app WebViews (a link opened
from WhatsApp, Messenger or Instagram, which is how the room link travels),
plus probably Samsung Internet or Firefox depending on version.

### Hypotheses, ranked

1. **Shrink after pan.** On focus, the browser pans the visual viewport to
   show the field, measured on the full-height layout. Then `resize` fires,
   and `#root` and the frame shrink to the visible height. The content moves
   into the top of the page while the view is still panned down by
   `offsetTop`. The user sees the bottom of a short page and the field is
   above the screen. Nothing reads `offsetTop` or listens to the visual
   viewport's `scroll` (`browser.ts:134-138`), and the document is no taller
   than the screen, so it cannot scroll back. This hits **every** screen,
   because the shrink is on `#root`. The nickname form (`player-page.tsx:225`,
   centred) shows it too.
2. `@media (height < 30rem)` rules (`host-panel.sass:345-353`,
   `host-console-page.sass:468-473`, `petit-bac-sheet.sass:269`,
   `player-page.sass:91`) follow the **layout** viewport. On an engine that
   overlays the keyboard they never fire, so the bar and the big presses keep
   their room.
3. Android with `resizes-content` but less than 277 px left on a 360-wide
   phone (Samsung keyboard plus suggestion strip) crosses
   `aspect-ratio >= 13/10`. `framed.lying-down` then turns an upright phone
   into side-by-side columns.
   - Tested heights are 284 / 320 / 422.
   - Untested fields: nickname, join code, rename team, seat offer, play right
     away, the menu's field, and the console settings.
4. `overflow: hidden` on the frame makes it a scroll container that a
   browser's scroll-into-view can leave shifted; `clip` would not. A fixed
   bottom tab bar (`host-panel.sass:293`) can cover a field.

Ruled out: iOS zoom on focus for the answer fields (≥ 1.1rem on a ≥ 16px
root). **Not checked:** the host settings fields.

### How to prove it

- Chrome DevTools and Playwright device emulation have no keyboard and never
  pan.
- **First, reproduce:** in Playwright, keep the full viewport and mock
  `visualViewport` (`height`, `offsetTop`, `scale`, `resize` and `scroll`
  events) through `addInitScript`. Pan by setting `offsetTop`, then measure
  each rect against `[offsetTop, offsetTop + height]`, not `innerHeight`.
  Under mobile emulation, CDP `Emulation.setPageScaleFactor` or
  `Input.synthesizePinchGesture` can produce a real visual-viewport offset.
  **The new test must fail on today's code before the fix.**
- **For real devices:** an Android Studio emulator has a real keyboard.
  Install Chrome, Firefox, Samsung Internet and a WebView shell, open the dev
  server over the LAN and inspect through `chrome://inspect`. If the emulator
  can't be installed in this session, say so plainly. Do not claim the fix
  without it. (Never ask Adrien to test on his phone; that is his to do after.)
- **Done** means, on the nickname screen, one framed typed round, and the
  seated console's typed round, keyboard up: the field, the typed text and the
  send press all sit inside `visualViewport.offsetTop … + height`. That holds
  on the mock, both before (red) and after (green), and on the emulator in at
  least Chrome and a WebView.

### Fix direction, once proven

Follow the visual viewport fully. Publish `offsetTop` as well as `height`,
listen to `scroll` too, and either translate the shown frame by `offsetTop`
or stop shrinking and scroll the focused field into the visible band. Prefer
the smallest change that makes the mock green on every screen. Write the
finding into `docs/browser-driving.md` and `screen-roles.md`, so the next
session does not trust a layout-only test again.

## Part 2: "away" as an icon

- `presentation/components/away-mark.tsx:14-22` renders `OfflineIcon`
  (`icons.tsx:117`, lucide `WifiOff`, the only boundary for icons) **plus** the
  word `player.away` (FR `dictionary-fr.ts:1570` "hors ligne", EN
  `dictionary-en.ts:1658`). It is a bordered, `nowrap` pill
  (`away-mark.sass:4-19`). Seat grids give it a row of its own
  (`styles/_seat-grid.sass:65-67, 83-84`).
- It is used in `features/host/table-lobby.tsx:246`, in
  `presentation/components/scoreboard.tsx:204` (lobby, setup tabs, standings,
  player round) and in `team-roster.tsx:214`.
- `score-track.tsx:111-113` already does without the tag: it uses a visually
  hidden " (away)" and mutes the chip (`score-track.sass:53-56`). That is the
  pattern to reuse.
- **Recommended: the icon everywhere, the word kept for screen readers**
  (`VisuallyHidden`), and the chip muted. One mark reads the same on the wall
  and on a phone. Since the word goes, the extra row in the seat grid goes too.
  There is no tooltip: a react-aria `Tooltip` needs a focusable trigger and
  won't open on touch, and `title` doesn't show on touch either. A crossed
  wifi on a muted chip carries the meaning on its own. If impeccable's pass
  finds the icon alone unclear on the wall's wide roster, keep the word there
  only, through a container query, and say why.
- Check a **full table** (`MAX_PLAYERS_PER_ROOM` seats, long names, several
  away) at 360×640 and 390×844, on the console lobby and the wall at
  1280×720. Film a seat going away and coming back: the mark enters and
  leaves with a motion.
