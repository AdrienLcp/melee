import type { SessionId } from '@melee/protocol/identifiers'
import type { Speaker } from '@melee/protocol/sound'

type Wall = { isSpeaker: boolean; number: number; sessionId: SessionId }

/**
 * The wall that sounds, or `null` when the console does. The host's pick wins
 * while that wall is there; otherwise the wall already sounding keeps it, so a
 * pick that left does not shuffle the sound between the others, and the first
 * wall takes it when none holds it. A pick of the console silences them all.
 */
export const speakingWallOf = <W extends Wall>({
  choice,
  walls
}: {
  choice: Speaker | null
  walls: readonly W[]
}): W | null => {
  if (choice?.kind === 'console') {
    return null
  }

  const chosen =
    choice === null
      ? undefined
      : walls.find((wall) => wall.sessionId === choice.wallId)

  return chosen ?? walls.find((wall) => wall.isSpeaker) ?? walls[0] ?? null
}

/** The number a wall arriving is called by: the lowest one no wall holds. */
export const freeWallNumber = (
  walls: readonly Pick<Wall, 'number'>[]
): number => {
  const taken = new Set(walls.map((wall) => wall.number))
  let number = 1

  while (taken.has(number)) {
    number += 1
  }

  return number
}
