import { type PetitBacLetter, petitBacLetters } from '@melee/protocol/petit-bac'

import { pickRandom } from '../helpers/random'

/** Every letter the room has not left out, or all of them if it left out everything. */
export const playableLetters = (
  excluded: readonly PetitBacLetter[]
): PetitBacLetter[] => {
  const playable = petitBacLetters.filter(
    (letter) => !excluded.includes(letter)
  )

  return playable.length === 0 ? [...petitBacLetters] : playable
}

/**
 * The next round's letter: one this game has not played yet, so a letter comes
 * back only once every playable one has gone — then the cycle starts over.
 */
export const drawLetter = ({
  excluded,
  played
}: {
  excluded: readonly PetitBacLetter[]
  /** Every letter this game has played, oldest first. */
  played: readonly PetitBacLetter[]
}): PetitBacLetter => {
  const playable = playableLetters(excluded)
  const playedThisCycle = played.slice(
    played.length - (played.length % playable.length)
  )
  const fresh = playable.filter((letter) => !playedThisCycle.includes(letter))

  return pickRandom(fresh) ?? pickRandom(playable) ?? 'A'
}
