import { useSyncExternalStore } from 'react'

import type { OwnLines, OwnLinesGame } from '@melee/protocol/deck'

import {
  type OwnLine,
  readOwnLines,
  writeOwnLines
} from '@/infrastructure/storage/own-lines-storage'

const listeners = new Set<() => void>()
const held: Partial<Record<OwnLinesGame, readonly OwnLine[]>> = {}

const current = (game: OwnLinesGame): readonly OwnLine[] => {
  held[game] ??= readOwnLines(game)

  return held[game]
}

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

/** Replaces a game's own lines, on this machine and on every corner of the console reading them. */
export const setOwnLines = ({
  game,
  lines
}: {
  game: OwnLinesGame
  lines: readonly OwnLine[]
}): void => {
  held[game] = lines
  writeOwnLines({ game, lines })

  for (const listener of listeners) {
    listener()
  }
}

/**
 * The lines this host wrote ahead for a game, shared by the setup that edits
 * them, the hand that marks them and the frame that sends them — corners of
 * the console no prop runs between.
 */
export const useOwnLines = (game: OwnLinesGame): readonly OwnLine[] =>
  useSyncExternalStore(subscribe, () => current(game))

/** What the room is sent: every game's lines still to be played, in the order written. */
export const unplayedOwnLinesOf = ({
  challenge,
  mostlikely
}: Readonly<Record<OwnLinesGame, readonly OwnLine[]>>): OwnLines => {
  const unplayed = (lines: readonly OwnLine[]) =>
    lines.filter((line) => !line.isPlayed).map((line) => line.text)

  return { challenge: unplayed(challenge), mostlikely: unplayed(mostlikely) }
}

/** Marks played every unplayed own line reading as the line a round just opened on — one id on the server, however often written. */
export const markOwnLinePlayed = ({
  game,
  lines,
  text
}: {
  game: OwnLinesGame
  lines: readonly OwnLine[]
  /** The line the round put on the wall. */
  text: string
}): void => {
  if (!lines.some((line) => !line.isPlayed && line.text === text)) {
    return
  }

  setOwnLines({
    game,
    lines: lines.map((line) =>
      line.text === text ? { ...line, isPlayed: true } : line
    )
  })
}
