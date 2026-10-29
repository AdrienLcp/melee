# 59 — Higher or lower (plus ou moins)

**To do. Starts after stage 58**, whose quantity bank it pairs.

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
   a second sheet refused).
2. **Screens.** Two cards side by side on the seat (stacked when the box is
   taller than wide), the pair counter, the wall showing the current pair
   count of every seat without their picks, the reveal as five rows with both
   values and every seat's pick dots. Shelf, spine, dictionaries. Seen muted
   on a wall, a seated console and two phones.

## How to tell it is done

- A room opened on *Plus ou moins* deals five pairs, takes one sheet per
  seat, and reveals ten values with who picked what.
- No frame to a player carries a value before the reveal.
- `pnpm validate` green.
