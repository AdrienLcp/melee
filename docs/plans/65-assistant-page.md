# 65 — A page that says how to hand `/mcp` to an assistant

**Done** 10/11/2026 — asked the day stage 64 landed, built in one session.

## Why

`/mcp` (stage 64) was a door only the repository knew how to open: the steps
lived in `docs/mcp.md`, which a host never reads. Adrien asked for them on the
site.

## The shape

- **`/:locale/assistant`** (`features/assistant/`), prerendered in both
  languages like the credits, and offered by the front door's menu beside
  them — out of a room, for the reason the credits are.
- **Three steps**, numbered in the heading so a screen reader that drops a
  styled list's numbers still hears them: copy the address; add it to the
  assistant (Claude's connector settings, the Claude Code command, any
  Streamable HTTP client); ask in words, with an example to copy. Then what
  comes back: a link that lays the line-up out (`features/evening-link/`).
- **The address is `useMcpUrl()`** (`router/navigation.ts`): `location.origin`
  in the browser, and `CANONICAL_ORIGIN` in a prerendered document, which is
  written with no `location`. Staging serves production's build, so a staging
  document reads production's address until the app starts.
  `canonical-origin.test.ts` holds the constant to `index.html`'s canonical
  link.
- **What is pasted as is** — the address, the command — is set in
  `typography.code`, over `--font-code`, the system's fixed-width face:
  Atkinson draws `--` as one long dash at every weight. The browser also broke
  the command between `--` and `transport` at some widths (measured at
  204–213px), so `VerbatimWords` makes each word atomic.
- **The legal page** names the assistant's provider among who sends what: the
  line-up it composed, nothing about the visitor, and nothing kept.

## Found on the way

Every page scrolls the document itself, so a page reached by a link opened at
the place the page left had been read to: back to the games from the foot of
the credits opened the shelf at its foot. `useNewPageOpensAtTop` (the app
shell) scrolls to the top on a push or a replace; back, forward and a switch
of language keep their place. Filmed both ways.
