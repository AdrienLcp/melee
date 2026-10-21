import type { PlayerId } from '@melee/protocol/identifiers'

export type CountedRow =
  | {
      countedMs: number
      /** Signed: negative stopped early, positive stopped late. */
      gapMs: number
      kind: 'counted'
      playerId: PlayerId
    }
  | { kind: 'silent'; playerId: PlayerId }

type CountedPress = Extract<CountedRow, { kind: 'counted' }>

export type InnerclockPressRecord = {
  atServerTime: number
  playerId: PlayerId
}

/**
 * The round as the room reads it: everyone who pressed, closest to the target
 * first whichever side they fell, then everyone the round opened on who never
 * pressed. Unlike the reflex board this one sorts, because arrival order here
 * is only who stopped first — and stopping first is not the game.
 */
export const buildCountedBoard = ({
  openedWithPlayerIds,
  presses,
  startsAt,
  targetSeconds
}: {
  openedWithPlayerIds: readonly PlayerId[]
  presses: readonly InnerclockPressRecord[]
  startsAt: number | null
  targetSeconds: number
}): CountedRow[] => {
  if (startsAt === null) {
    return []
  }

  const targetMs = targetSeconds * 1_000
  const counted = presses
    .map((press): CountedPress => {
      const countedMs = press.atServerTime - startsAt

      return {
        countedMs,
        gapMs: countedMs - targetMs,
        kind: 'counted',
        playerId: press.playerId
      }
    })
    .toSorted((one, other) => Math.abs(one.gapMs) - Math.abs(other.gapMs))
  const pressed = new Set(presses.map((press) => press.playerId))

  return [
    ...counted,
    ...openedWithPlayerIds
      .filter((playerId) => !pressed.has(playerId))
      .map((playerId): CountedRow => ({ kind: 'silent', playerId }))
  ]
}
