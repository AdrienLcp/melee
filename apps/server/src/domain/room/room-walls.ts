import type { RoundId, SessionId } from '@melee/protocol/identifiers'
import type {
  ClipFault,
  SilentClip,
  Speaker,
  WallScreen
} from '@melee/protocol/sound'

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

/**
 * The silent clip the console is told about: the one reported on the round
 * still on screen, by the screen still sounding. A report outlives neither —
 * the next round's clip, or another speaker, has not been heard from yet — so
 * nothing ever has to clear it.
 */
export const silentClipOf = ({
  reported,
  roundId,
  walls
}: {
  reported: {
    cause: ClipFault
    roundId: RoundId
    wallId: SessionId | null
  } | null
  roundId: RoundId | null
  walls: readonly WallScreen[]
}): SilentClip | null => {
  if (reported === null || reported.roundId !== roundId) {
    return null
  }

  const speaking = walls.find((wall) => wall.isSpeaker) ?? null

  if ((speaking?.id ?? null) !== reported.wallId) {
    return null
  }

  return {
    cause: reported.cause,
    roundId: reported.roundId,
    wallNumber: speaking?.number ?? null
  }
}
