import { createSafeContext } from '@adrienlcp/react'
import type React from 'react'
import { useCallback, useEffect, useState } from 'react'

import type { ScoreTarget } from '@melee/protocol/client-message'
import type { ProtocolErrorCode } from '@melee/protocol/error-code'
import type { PlayerId, RoomCode } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoomPhase } from '@melee/protocol/room'
import type { PawnPiece, Team } from '@melee/protocol/team'

/** The room a seat's pawn is picked against: whose piece is whose, and the phase. */
export type PawnRoom = {
  phase: RoomPhase
  players: readonly PublicPlayer[]
  teams: readonly Team[]
  youId: PlayerId | null
}

/** The refusals a recolour can meet, each with its own words. */
export type RecolourRefusal = Extract<
  ProtocolErrorCode,
  'colour_taken' | 'teams_locked' | 'wrong_phase'
>

/**
 * What a screen inside a room offers the menu above it. The menu in the shell is
 * the only chrome on every surface, so anything that has to be reachable at
 * every phase belongs there — and it holds no socket, so it cannot send a frame
 * on its own.
 *
 * Each entry is `null` on a screen that cannot offer it, and the menu shows what
 * is left. The three exits are three different scopes on purpose: a seat, a game
 * and a room are not the same thing to leave.
 */
export type RoomActions = {
  /**
   * Moves a team's or a seat's score by whole points, in any phase: a bonus
   * nobody planned, a challenge played at the table, a call to put right. The
   * host console's alone.
   */
  adjustScore: ((target: ScoreTarget, points: number) => void) | null
  /** Everyone out and the room gone for good. The host console's alone. */
  closeRoom: (() => void) | null
  /** Ends the game and puts the final board up. `null` while no game is in play. */
  endGame: (() => void) | null
  /**
   * Says this console is handing the room to another screen, so the claim that
   * takes it turns this one into the wall rather than a refusal. The host
   * console's alone.
   */
  handOver: (() => void) | null
  /**
   * The room the menu's invitation lets somebody into. `null` in the lobby,
   * whose stage carries the invitation on every screen; at a table playing
   * aloud, which nobody joins; and on a screen that holds no seat and runs no
   * room.
   */
  invitation: RoomCode | null
  /** Gives the seat up, so the roster on the console is true at once. */
  leaveSeat: (() => void) | null
  /**
   * The name the last rename was refused for, so the menu can hold its field
   * invalid for exactly that draft and let anything else through. A controlled
   * `isInvalid` that outlives its reason makes the native submit a silent no-op.
   */
  refusedNickname: string | null
  /**
   * Holds the whole room mid-round for somebody who had to leave the table.
   * In the menu rather than beside the round's presses, because on a console
   * held in a hand a second row of presses is taken from the stage. The host
   * console's alone, and `null` outside a round or once it is paused.
   */
  pauseRound: (() => void) | null
  /**
   * The room this screen's pawn is picked against — the view itself, so its
   * identity changes only with a snapshot. `null` where no seat is held: the
   * wall, and a console only running the room.
   */
  pawnRoom: PawnRoom | null
  /**
   * Changes this screen's pawn: its team's colour when the seat sits in one,
   * the seat's own piece otherwise. `null` with `pawnRoom`.
   */
  recolourPawn: ((piece: PawnPiece) => void) | null
  /**
   * Why the server turned this screen's last recolour down, until another is
   * asked for or the pawn stands as the piece asked.
   */
  refusedRecolour: RecolourRefusal | null
  /** Changes the name the seat is held under, socket and round untouched. */
  rename: ((nickname: string) => void) | null
  /**
   * Ends the round in play and shows its answer. Offered only where the stage
   * has no room for it: a seated host's four tiles fill the whole screen.
   */
  revealRound: (() => void) | null
  /**
   * How loud the room's speaker plays, whichever screen it is. Set from the
   * console alone, so `null` on every other screen.
   */
  roomVolume: number | null
  /** The seats *Points* lists when the room plays without teams. */
  scoredPlayers: readonly PublicPlayer[]
  /** The teams *Points* lists, which take the seats' place whenever there are any. */
  scoredTeams: readonly Team[]
  /** Sets `roomVolume` for the whole room. The host console's alone. */
  setRoomVolume: ((volume: number) => void) | null
  /** What the room calls this screen right now. `null` where no seat is held. */
  seatNickname: string | null
  /** The board's last case, so *Points* reads a team's pawn rather than its score. */
  trackLength: number | null
}

/** The empty roster, one array for every screen that scores nobody. */
export const NOBODY: readonly never[] = []

const NO_ACTIONS: RoomActions = {
  adjustScore: null,
  closeRoom: null,
  endGame: null,
  handOver: null,
  invitation: null,
  leaveSeat: null,
  pauseRound: null,
  pawnRoom: null,
  recolourPawn: null,
  refusedNickname: null,
  refusedRecolour: null,
  rename: null,
  revealRound: null,
  roomVolume: null,
  scoredPlayers: NOBODY,
  scoredTeams: NOBODY,
  seatNickname: null,
  setRoomVolume: null,
  trackLength: null
}

type ActionChannel = {
  actions: RoomActions
  report: (actions: RoomActions) => void
}

const [ActionContext, useChannel] = createSafeContext<ActionChannel>(
  'RoomActionsProvider'
)

export const RoomActionsProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [actions, setActions] = useState<RoomActions>(NO_ACTIONS)

  // Stable, because it is a dependency of the effect that reports: rebuilt each
  // render, that effect would run on every one of them and set state from
  // inside itself.
  const report = useCallback((next: RoomActions) => {
    setActions(next)
  }, [])

  return <ActionContext value={{ actions, report }}>{children}</ActionContext>
}

/** Every entry `null` on a screen that is not inside a room. */
export const useRoomActions = (): RoomActions => useChannel().actions

/**
 * Whether the screen below is inside a room at all, which is what the menu asks
 * before offering a plain link out. Navigating away closes the socket, and the
 * server cannot tell that from a closed tab: a host who followed one would leave
 * the round frozen on every player with their own screen saying nothing.
 *
 * Any one of the three exits answers it — a console always offers to close the
 * room, and a seated player always offers to leave.
 */
export const useIsInsideRoom = (): boolean => {
  const { closeRoom, endGame, leaveSeat } = useRoomActions()

  return closeRoom !== null || endGame !== null || leaveSeat !== null
}

/**
 * Each function has to keep its identity across renders or this reports on
 * every one of them — see the `useCallback` note in
 * `.claude/rules/react-components.md`, which is about exactly this case. The
 * two names are plain strings for the same reason: an object built here would
 * be a fresh dependency on every render.
 */
export const useReportRoomActions = ({
  adjustScore,
  closeRoom,
  endGame,
  handOver,
  invitation,
  leaveSeat,
  pauseRound,
  pawnRoom,
  recolourPawn,
  refusedNickname,
  refusedRecolour,
  rename,
  revealRound,
  roomVolume,
  scoredPlayers,
  scoredTeams,
  seatNickname,
  setRoomVolume,
  trackLength
}: RoomActions) => {
  const { report } = useChannel()

  useEffect(() => {
    report({
      adjustScore,
      closeRoom,
      endGame,
      handOver,
      invitation,
      leaveSeat,
      pauseRound,
      pawnRoom,
      recolourPawn,
      refusedNickname,
      refusedRecolour,
      rename,
      revealRound,
      roomVolume,
      scoredPlayers,
      scoredTeams,
      seatNickname,
      setRoomVolume,
      trackLength
    })

    return () => {
      report(NO_ACTIONS)
    }
  }, [
    adjustScore,
    closeRoom,
    endGame,
    handOver,
    invitation,
    leaveSeat,
    pauseRound,
    pawnRoom,
    recolourPawn,
    refusedNickname,
    refusedRecolour,
    rename,
    report,
    revealRound,
    roomVolume,
    scoredPlayers,
    scoredTeams,
    seatNickname,
    setRoomVolume,
    trackLength
  ])
}
