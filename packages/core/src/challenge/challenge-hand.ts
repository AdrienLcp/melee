/** A line of the console's hand: one the host wrote, or one the server dealt. */
export type ChallengeHandLine =
  | {
      kind: 'dealt'
      /** Its slot in the server's hand, which is what the press names. */
      slot: number
      text: string
    }
  | {
      kind: 'own'
      /** Its place in the host's own list, which is what is marked played. */
      ownAt: number
      text: string
    }

/** What the next challenge round opens on, as the host left it. */
export type ChallengeChoice =
  | { at: number; kind: 'line' }
  | { kind: 'aloud' }
  | { kind: 'typed' }

/** What a round opens on until the host picks otherwise. */
export const FIRST_HAND_LINE: ChallengeChoice = { at: 0, kind: 'line' }

/**
 * The hand the console shows: the host's own unplayed lines first, in the
 * order written and less any set aside this round, then the server's.
 */
export const challengeHandOf = ({
  dealt,
  own,
  setAside,
  size
}: {
  dealt: readonly string[]
  own: readonly { isPlayed: boolean; text: string }[]
  /** Own lines the die moved off the hand, by place in the list, until a round opens. */
  setAside: ReadonlySet<number>
  size: number
}): ChallengeHandLine[] => {
  const ownLines = own.flatMap((line, ownAt): ChallengeHandLine[] =>
    line.isPlayed || setAside.has(ownAt)
      ? []
      : [{ kind: 'own', ownAt, text: line.text }]
  )
  const dealtLines = dealt.map(
    (text, slot): ChallengeHandLine => ({ kind: 'dealt', slot, text })
  )

  return [...ownLines, ...dealtLines].slice(0, size)
}

/** The hand's line a round opens on: the one chosen, or the first once that slot is gone. */
export const chosenLineOf = ({
  choice,
  hand
}: {
  choice: ChallengeChoice
  hand: readonly ChallengeHandLine[]
}): ChallengeHandLine | null =>
  choice.kind === 'line' ? (hand[choice.at] ?? hand[0] ?? null) : null

/**
 * What the press opening a challenge round says about its line. A typed line
 * left blank falls back to the hand's first, as the server would read it.
 */
export const challengePickOf = ({
  choice,
  hand,
  typed
}: {
  choice: ChallengeChoice
  hand: readonly ChallengeHandLine[]
  typed: string
}): {
  challengeAt?: number
  challengeText?: string
  isChallengeSaidAloud?: true
} => {
  if (choice.kind === 'aloud') {
    return { isChallengeSaidAloud: true }
  }

  if (choice.kind === 'typed' && typed.trim() !== '') {
    return { challengeText: typed }
  }

  const line = chosenLineOf({
    choice: choice.kind === 'typed' ? { at: 0, kind: 'line' } : choice,
    hand
  })

  switch (line?.kind) {
    case 'own':
      return { challengeText: line.text }
    case 'dealt':
      return { challengeAt: line.slot }
    case undefined:
      return {}
  }
}
