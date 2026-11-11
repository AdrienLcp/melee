# Content, part 4 — a timeline deck, and a slate's answer key as a deck

Read `docs/plans/68-evening-content.md` first. Both reuse session 1's deck
store and session 2's carrying and showing. Each adds an arm to `deckSchema`,
a validator, a branch in the conductor and a paragraph for the assistant.

## Timeline

- **Item:** one label (1 language, copied into both locales of `labels`,
  `packages/protocol/src/timeline.ts:20`) and an integer `year`, with at most
  40 items.
- **The trap is the dealer's spacing.** It requires `MIN_YEARS_APART = 5`
  (`packages/core/src/timeline/deal.ts:10`), or 30 at easy. A family timeline
  (children born in 2015 and 2017) would deal nothing.
  - A deck deals with distinct years as its only rule, because the table
    knows its own dates.
  - Ties are refused by the validator, since they make the true order
    ambiguous.
  - Fewer than 5 events are refused.
  - The validator dry-runs the deal.
- **Seam:** branch before `drawTimelineEvents`
  (`timeline-bank.ts:61`, called at
  `round-conductor.ts:466`). Five events a round, so 20 events make 4 rounds.
  - Decide what a deck that does not divide by five does with the
    remainder: top it up from the bank, or deal it at the next round.
    Topping up from the bank mixes a family date with the fall of Rome,
    which is wrong for this table, so prefer dealing whole rounds and
    handing over to the bank once fewer than five remain.
- Players already get no years before the reveal (`timeline-round.ts:13`,
  `room-view.ts:604-614`); custom content takes the same path.

## Slate keys

- **Item:** one key per line, at most 80 characters, which is a memo for the
  host (`prepared-keys-storage.ts:7-42`).
- **Today:** one key list per tab is reused for every sheet
  (`host-console-page.tsx:188, 353-354, 702`) and sent with
  `host.startRound.slateKeys` (`client-message.ts:367`).
- **As a deck:** one list per sheet, so a deck is several sheets (a tasting of
  three flights). The server hands each sheet's keys to the host view when the
  sheet opens. That also fixes the auto-advanced sheet that today opens with
  none (`round-conductor.ts:256-259`).
- Keep the console's typed keys working: a sheet without a deck still takes
  them from the press.
- The validator checks that a sheet holds no more keys than its `itemCount`,
  and labels as the arm already refines them.

## Tests

- `[timeline]`:
  - a deck deals by distinct years;
  - ties are refused;
  - the bank takes over once the deck is spent.
- `[slate]`:
  - each sheet gets its own keys, on an auto-advanced sheet too;
  - a player frame never carries a key.
- `[mcp]` round trips for both.

## Done when

Seen in the browser (a family timeline played on two phones, a slate marked
with a deck's keys), then the changelog entry, plan 68's table, this file and
its `handoffs/README.md` row ship in one commit, pushed to `main`.
