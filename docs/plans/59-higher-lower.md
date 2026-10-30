# 59 — Higher or lower (plus ou moins)

**Done** 29/10/2026 — served, then on the shelf with its screens.

Two things go up side by side — *Lyon or Marseille, which has more people?
the Seine or the Rhine, which is longer?* — and every seat picks one. A round
is **five pairs** on the seat's own screen, one after the other, and the
reveal shows every pair with both values.

The sixteenth game, **everyone at once**. Five pairs rather than one because a
single pair is a coin flip: five turn luck into a score, and the reveal of ten
numbers is where the table argues.

Kind `higherlower`, translation prefix `higherlower.*`, answer mode `pairs`.
*Plus ou moins* in French, *Higher or lower* in English.

## Rules, as settled

- **A pair is two rows of one family**, so it is always a fair comparison —
  never a mountain against a river. Dealt with a ratio of at least 1.15
  between them, so two values a rounding apart never decide a pick, and at
  most 4, so the answer is not obvious from the names alone.
- **The five pairs of a round** come from at least three families, and never
  share an entity.
- **One answer for the whole sheet**, `{ kind: 'pairs', picks: ('left' |
  'right')[] }`, sent when the fifth pair is picked. The screen moves forward
  only — a pick is final once the next pair shows — and the server takes one
  sheet per seat, so going back is not something it has to refuse.
- **The values never travel before the reveal**; the player is sent each
  pair's two labels, the family's sentence and the unit. Which side is
  higher is dealt at random by the server, never *the bigger one on the
  left*.
- **The pay**: one pick's price (1) per right pair, the clock on top over the
  whole sheet as on any `choice` round — `isPaidForSpeed` true. Five right is
  `isFullyBanked`.
- **`roundDurationMs`** 20–90 s, **45 s by default**: nine seconds a pair.
- **Duels**: yes. Two seats on the same five pairs is a fair race.

## Steps

1. **Protocol, core, server.** `higher-lower.ts` in protocol (the pair shape
   without values, the sheet), `@melee/core/higherlower/` (the pairing rules
   over the quantity bank's rows, the grade), the kind served with its socket
   suite (no value on any frame before the reveal, a sheet of four refused,
   a second sheet refused). **Done**: `dealPairs` in core over any rows with
   an entity, a family and a value, `drawPairs` in the quantity bank dealing
   well-known rows first and marking each row `higherlower:`-played, a `pairs`
   verdict paid a pick a right pair with the clock on top, and the seat's own
   verdict held back until the reveal like the estimate's. Eight rounds by
   default. A bank test deals twenty rounds of well-known pairs without
   repeating a row.
2. **Screens.** Two cards side by side on the seat (stacked when the box is
   taller than wide), the pair counter, the wall showing the current pair
   count of the seats that have sent, never their picks — the sheet travels
   whole, so there is no per-pair progress to show, the reveal as five rows with both
   values and every seat's pick dots. Shelf, spine, dictionaries. Seen muted
   on a wall, a seated console and two phones.
   **Done**: the seat's two tiles stack below a 36rem box and sit side by
   side above it — a height container query matched nothing in Chromium, so
   width alone decides; the wall prints the five pairs without values, the
   question beside each pair once the list is wide; the reveal inks the higher
   side, rings the seat's own pick right or wrong, and stands every seat's
   pawn under the side it took. Values from a million up are shortened
   (*3,7 M habitants*), and French *habitants* takes a breaking space so a
   population wraps instead of overflowing. Seen muted on a console, its
   reveal at 1280 and 1920, and a phone at 390.

## Revised 30/10/2026 — one famous pair a round

Five pairs a round dealt from the traffic-based `isWellKnown` rows played as
guesswork: every country and 369 cities clear that bar, so a table got Gabon
against Gambia. The deal now draws from `FAMOUS_QUANTITY_NAMES` first
(`apps/server/src/infrastructure/questions/famous-quantities.ts`, ~180 names
picked by hand, by French name per family), and a round is **one pair**:
that famous pool would be spent inside one evening at five a round. Ten
seconds a pick (5–30 s), twelve rounds by default; the seat's pair counter and
its *n sur n* line are hidden while the count is one. A stored 45 s setup no
longer parses, so that game's memory falls back to the default.

## How to tell it is done

- A room opened on *Plus ou moins* deals five pairs, takes one sheet per
  seat, and reveals ten values with who picked what.
- No frame to a player carries a value before the reveal.
- `pnpm validate` green.
