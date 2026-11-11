# Content, part 6 — a black square theme of the evening's own

Read `docs/plans/68-evening-content.md` first. This is the hardest content to
author: the plumbing is easy, and the validator carries the session.

## Build

- **Item:** a hand-written theme, the same shape as
  `black-square-authored-*.json` (`black-square-bank.ts:72-94`):
  - a label;
  - 12–20 answers, each with a `tier` and `aliases`, at least 3 per tier;
  - a `blackWord` with aliases and a `why`.

  Written in one language and copied into both locales. At most **3 themes**
  a deck: one theme is about 0.6 KB deflated, and 5 already take 2.4 KB of the
  link's 8 000 characters.
- **Seam:** a deck theme becomes a `PooledBlackSquareTheme`, dealt before
  `drawBlackSquareTheme` (`round-conductor.ts:420`). The cells still go
  through `dealBlackSquareAnswers`
  (`packages/core/src/blacksquare/answer-deal.ts:36`), stratified by tier.
- **Validator:** run what the bank's tests already check, as a pure function
  shared by the tests and the MCP:
  - at least 3 answers per tier (`black-square-bank.test.ts:302`);
  - one answer per thing, never varieties side by side (`:273`);
  - no alias of the black word graded as an answer, and no answer within
    matcher tolerance of it (`:149`);
  - no alias colliding between two answers.

  Extract the checks from the test into `packages/core/src/blacksquare/`, and
  have the test call them, so there is one check and not two.
- **The assistant's paragraph** says:
  - a broad theme with obvious and less obvious answers, the tier reflecting
    how obvious each one is;
  - a black word that belongs to the theme but is a trap;
  - aliases for every common spelling.
- Players and a seated console already get no cell content
  (`blackSquareContentView`, `black-square-round.ts:373`).

## Tests

- `[blacksquare]`:
  - a deck theme is dealt first;
  - every validator problem is reported by its path;
  - the bank's tests still pass through the extracted checks.
- `[mcp]` a round trip with a theme.

## Done when

Seen in the browser (a deck theme played in `typed` and `spoken`), then the
changelog entry and plan 68's table **(stage done)**, this file, and
`handoffs/README.md`'s rows ship in one commit. Then run `pnpm validate` once
for the whole stage, and push to `main`.
