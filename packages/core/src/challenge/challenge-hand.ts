/** A line of the server's hand, as the console shows it. */
export type ChallengeHandLine = {
  /** Whether the host wrote it ahead, which the hand marks. */
  isOwn: boolean
  /** Its slot in the server's hand, which is what the press names. */
  slot: number
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
 * The hand the console shows: the server's, which deals the host's own lines
 * after the evening's and before the bank's, each marked when the host wrote it.
 */
export const challengeHandOf = ({
  dealt,
  own
}: {
  dealt: readonly string[]
  /** Every line the host wrote ahead, played or not. */
  own: readonly string[]
}): ChallengeHandLine[] =>
  dealt.map((text, slot) => ({ isOwn: own.includes(text), slot, text }))

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

  return line === null ? {} : { challengeAt: line.slot }
}
