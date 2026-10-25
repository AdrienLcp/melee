import {
  type ChallengeChoice,
  type ChallengeHandLine,
  challengePickOf
} from '@melee/core/challenge/challenge-hand'

/** The line a challenge round opens on, held on the console until the press that sends it. */
export type ChallengeLine = {
  /** Which line of the hand, the typed one, or none said aloud. */
  choice: ChallengeChoice
  /** The host's own unplayed lines first, then the bank's. */
  hand: readonly ChallengeHandLine[]
  onChange: (text: string) => void
  onChoose: (choice: ChallengeChoice) => void
  /** Another line in place of the hand's at that place; an own line is set aside until the round opens. */
  onRedeal: (at: number) => void
  text: string
}

/** What the press opening a round says about its challenge line; nothing when it is not one. */
export const challengePickFor = (
  line: ChallengeLine | null
): ReturnType<typeof challengePickOf> =>
  line === null
    ? {}
    : challengePickOf({
        choice: line.choice,
        hand: line.hand,
        typed: line.text
      })
