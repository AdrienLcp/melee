import type { PlayerRoomView } from '@melee/protocol/room'

import type { ViewLanding } from '@/helpers/stage-replacement'

type PlayerScreen = Pick<
  PlayerRoomView,
  'isHostConnected' | 'isPaused' | 'phase'
>

const LEFT_AS_A_WHOLE: ReadonlySet<PlayerRoomView['phase']> = new Set([
  'finished',
  'lobby',
  'revealed'
])

const ARRIVED_AT_AS_A_WHOLE: ReadonlySet<PlayerRoomView['phase']> = new Set([
  'finished',
  'revealed'
])

/**
 * What swaps a player's screen as one screen replacing another: the lobby,
 * the reveal and the final board leaving, the reveal and the final board
 * arriving, and the round
 * frozen — paused, or its host gone — since nothing is pressed on what any
 * of them gives way to. Never the floor changing hands, nor a freeze lifted:
 * the transition holds every press for its length, and the race reopens the
 * moment either happens. The reveal's own hold says the host left on its own.
 */
export const swapsThePlayerScreen = ({
  from,
  to
}: {
  from: PlayerScreen | null
  to: PlayerScreen
}): boolean => {
  if (from === null) {
    return false
  }

  if (from.phase !== to.phase) {
    return (
      LEFT_AS_A_WHOLE.has(from.phase) || ARRIVED_AT_AS_A_WHOLE.has(to.phase)
    )
  }

  return (
    (!from.isPaused && to.isPaused) ||
    (from.isHostConnected && !to.isHostConnected && to.phase !== 'revealed')
  )
}

const countsTheRoundIn = ({
  from,
  to
}: {
  from: PlayerScreen | null
  to: PlayerScreen
}): boolean => from?.phase === 'countdown' && to.phase === 'playing'

/**
 * How a snapshot lands on a player's screen: swapped where
 * `swapsThePlayerScreen` says, faded over where the countdown gives way to the
 * round it counted in — whose first press a swap would hold — and drawn as it
 * comes everywhere else.
 */
export const playerScreenLanding = (change: {
  from: PlayerScreen | null
  to: PlayerScreen
}): ViewLanding => {
  if (swapsThePlayerScreen(change)) {
    return 'swapped'
  }

  return countsTheRoundIn(change) ? 'faded-over' : 'drawn'
}
