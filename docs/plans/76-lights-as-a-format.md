# 76 — Lumières as a format of Réflexe

**Done** 19/11/2026 — one session.

_Lumières_ (a chase across nine lights) had a card of its own beside
_Réflexe_ (one press against one flip). They became one card: a host opens
_Réflexe_ and picks its **format** — _Top départ_ or _Lumières_ — in the
game's settings. It is the second format after
[75](75-higher-lower-as-a-format.md), and takes its shape whole.

## Shape, as settled

- **Two kinds stay, one card.** `reflex` and `lights` share the fifth
  guarantee and nothing else: the round, the answer mode (`buzzer`, `tap`),
  the verdict, the pay, the tick-published snapshot and the screens all
  differ. `shelf-cards.ts` maps `lights` to `reflex`; `shelvedGames` keeps
  `lights`, which still means _served with screens_.
- **The switch** (`inReflexFormat` in `@melee/core/reflex/reflex-format`)
  carries nothing over — the flip has no setting at all — and opens the chase
  on its defaults. The panel writes the moved game into the entry `lineUpAt`
  points at and narrows the mode, as 75's does.
- **Settings stay mounted across a switch**: the window and the traps fold
  away under the format control rather than unmount.
- **One look.** `--spine-lights` and its edge and ink alias Reflex's, so the
  lights' purple is gone from every row, round and lid.
- **Ready-made line-ups are unchanged.** _Partie éclair_ already held a reflex
  entry and a lights entry — two entries of one card now, which the lobby's
  list counts as two under _Réflexe_.
- Translation prefix `lights.*` stays — the kind owns it.

## Seen

Muted, a console and a seat at 390 px: `/fr/lights` sent on to `/fr/reflex`,
the home shelf without a _Lumières_ card, the switch filmed both ways (the
window and the traps fading in and folding away under the format control), a
lights round opened from Réflexe's card and played to its reveal, then the
same entry switched back to _Top départ_ between two rounds and a flip round
dealt.
