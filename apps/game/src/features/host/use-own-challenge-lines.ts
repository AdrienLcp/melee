import { useSyncExternalStore } from 'react'

import {
  type OwnChallengeLine,
  readOwnChallengeLines,
  writeOwnChallengeLines
} from '@/infrastructure/storage/own-challenge-lines-storage'

const listeners = new Set<() => void>()
let held: readonly OwnChallengeLine[] | null = null

const current = (): readonly OwnChallengeLine[] => {
  held ??= readOwnChallengeLines()

  return held
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

/** Replaces the host's own lines, on this machine and on every screen of the console reading them. */
export const setOwnChallengeLines = (
  lines: readonly OwnChallengeLine[]
): void => {
  held = lines
  writeOwnChallengeLines(lines)

  for (const listener of listeners) {
    listener()
  }
}

/**
 * The challenge lines this host wrote ahead, shared by the setup that edits
 * them and the hand that deals them — two corners of the console no prop runs
 * between.
 */
export const useOwnChallengeLines = (): readonly OwnChallengeLine[] =>
  useSyncExternalStore(subscribe, current)

/** Marks played the first unplayed own line a round just opened on, if it was one. */
export const markOwnLinePlayed = ({
  lines,
  sent
}: {
  lines: readonly OwnChallengeLine[]
  /** The typed line the press sent, which is how an own line rides the wire. */
  sent: string | undefined
}): void => {
  const at = lines.findIndex(
    (line) => !line.isPlayed && line.text === sent?.trim()
  )

  if (at === -1) {
    return
  }

  setOwnChallengeLines(
    lines.map((line, index) =>
      index === at ? { ...line, isPlayed: true } : line
    )
  )
}
