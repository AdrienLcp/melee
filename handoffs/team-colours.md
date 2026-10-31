# A team picks its colour

One request from Adrien. One session — small enough to share one with
`handoffs/polish.md` if its budget allows. UI: `impeccable` first; check the
lobby and the board **full** (`MAX_PLAYERS_PER_ROOM` seats, the most teams the
room allows), at phone width, muted. Delete this file once it lands.

> It'd be nice if the team could choose the colour of its pawn and/or of its
> team too.

## Today

- A team's colour **is** its pawn: `teamSchema.colour`, 1-based token among
  `PAWN_COLOUR_COUNT` = 8 (`packages/protocol/src/team.ts:11,66-67`), drawn
  everywhere as `var(--pawn-N)` (`apps/game/src/features/host/table-lobby.tsx:118-121`,
  `Pawn`). So "pawn colour" and "team colour" are one setting — keep it one.
- Assigned by creation order: `(index % PAWN_COLOUR_COUNT) + 1`,
  `apps/server/src/domain/room/team-service.ts:63`.
- An unnamed team is called by its colour in each screen's language
  (`team.ts:68-73`): a colour change renames an unnamed team — intended, check
  it reads well.
- With no teams, a seat's pawn colour comes from room order
  (`table-lobby.tsx:199`, `team-roster.tsx:183`).

## To build

- A frame to set a team's colour, open to **any member of that team** and to
  the host, refused for another team's members. Name it beside the existing
  team frames in `packages/protocol/src/client-message.ts` and handle it in
  `team-service.ts`; see `.claude/rules/realtime-protocol.md` for adding a message.
- **Two teams never share a colour**: offer only the free ones (the taken ones
  shown taken), and refuse a taken one on the server — two presses racing for
  the same colour, the second loses. Eight tokens and the teams cap: check a
  full room still has a colour each.
- Lobby only, or between rounds too? Decide: a pawn changing colour mid-game
  makes the track unreadable for a round, so likely the lobby and between
  rounds, never during one.
- Solo seats on a track (no teams): weigh offering the same choice per seat —
  same palette, same uniqueness — or leave it to teams; Adrien said "its pawn
  and/or its team".
- Both palettes already define `--pawn-1…8`
  (`apps/game/src/presentation/styles/_tokens.sass:182-189`); a new colour
  token goes in both (`.claude/rules/sass-architecture.md`).

## Eight colours for a room of 24 (32 on `crowd-32`)

> Only 8 colours when we can have 32 players?! Maybe complete that too. Make
> sure they stand out on the board, though (and everywhere).

- **Teams are fine**: `MAX_TEAMS` = 6 (`team.ts:8`) under 8 colours.
- **Solo seats are not**: on a track with no teams every seat is a pawn
  (`trackPawnNumberOf` → `pawnNumberOf(seat)`,
  `apps/game/src/presentation/components/track-pawn.tsx`), so beyond 8 seats
  colours repeat and two pawns look identical.
- **Don't answer with 24–32 colours**: nobody tells that many apart on a small
  pawn, in both palettes, colour-blind players included — colour alone can
  never be the identity (WCAG 1.4.1). Decided: widen to the most hues that stay
  clearly distinct in both palettes against the track (likely 10–12 — measure
  with `impeccable`, check contrast against the track and each other, simulate
  the common colour blindnesses), **and** give every pawn a second channel that
  scales to the cap: the seat's initial or a number on the token, or a shape
  ring. Pawn identity = colour + mark, unique per seat across the whole room.
- A solo seat picking its colour (above) then picks a hue; the mark keeps two
  seats on one hue apart.
- Verify on every screen that draws a `Pawn` (`grep -rn "<Pawn\|--pawn-"
  apps/game/src`): the track, the board moves, the challenge placing, the
  lobby, the rosters — at `MAX_PLAYERS_PER_ROOM` seats.
