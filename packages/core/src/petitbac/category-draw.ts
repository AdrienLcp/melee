import type { Difficulty } from '@melee/protocol/difficulty'
import {
  type PetitBacBankCategory,
  type PetitBacCategory,
  petitBacBankCategories
} from '@melee/protocol/petit-bac'

import { shuffled } from '../helpers/random'
import { type ContentTier, contentTiers } from '../round/difficulty-draw'

/**
 * How hard a line is to fill on most letters. Easy is what a child writes six
 * of without help — an animal, a colour, a first name; hard is a line a table
 * of adults stalls on — a cheese, a plant, a famous person. A record rather
 * than a list, so a category added to the box has to be tiered.
 */
const CATEGORY_TIERS: Readonly<Record<PetitBacBankCategory, ContentTier>> = {
  animal: 'easy',
  bodyPart: 'easy',
  brand: 'medium',
  cartoonCharacter: 'easy',
  cheese: 'hard',
  city: 'easy',
  clothing: 'easy',
  colour: 'easy',
  country: 'easy',
  dish: 'medium',
  drink: 'medium',
  famousPerson: 'hard',
  fictionalCharacter: 'medium',
  film: 'medium',
  firstName: 'easy',
  fruitOrVegetable: 'easy',
  gift: 'medium',
  hobby: 'medium',
  instrument: 'medium',
  job: 'medium',
  kitchenThing: 'medium',
  lateExcuse: 'hard',
  personalityTrait: 'hard',
  plant: 'hard',
  series: 'hard',
  singer: 'medium',
  sport: 'easy',
  thingInABag: 'medium',
  tool: 'hard',
  toy: 'easy',
  vehicle: 'easy'
}

const shuffledIn = (
  tiers: readonly ContentTier[]
): readonly PetitBacBankCategory[] =>
  shuffled(
    petitBacBankCategories.filter((key) => tiers.includes(CATEGORY_TIERS[key]))
  )

/** One of each list in turn, so the first `n` hold every list in equal shares. */
const interleaved = <TItem>(lists: readonly (readonly TItem[])[]): TItem[] =>
  Array.from(
    { length: Math.max(0, ...lists.map((list) => list.length)) },
    (_, index) => lists.flatMap((list) => list.slice(index, index + 1))
  ).flat()

/**
 * The whole box in the order a sheet takes its lines from. `easy` and `hard`
 * fill up from the nearest tier once their own runs out, never stalling a
 * draw, as every level does.
 */
const preferredAt = (difficulty: Difficulty): PetitBacBankCategory[] => {
  switch (difficulty) {
    case 'easy':
      return [
        ...shuffledIn(['easy']),
        ...shuffledIn(['medium']),
        ...shuffledIn(['hard'])
      ]
    case 'hard':
      return [...shuffledIn(['medium', 'hard']), ...shuffledIn(['easy'])]
    case 'mixed':
      return interleaved(
        shuffled(contentTiers).map((tier) => shuffledIn([tier]))
      )
  }
}

/**
 * A round's categories: the host's own list when it fixed one — the level is
 * the box's, and a host's list is played as written — otherwise `count` drawn
 * from the box at the room's level, never one twice in a round, in an order
 * that says nothing of their tier.
 */
export const drawCategories = ({
  count,
  difficulty,
  fixed
}: {
  count: number
  difficulty: Difficulty
  fixed: readonly PetitBacCategory[] | null
}): PetitBacCategory[] =>
  fixed === null
    ? shuffled(preferredAt(difficulty).slice(0, count)).map((key) => ({
        key,
        kind: 'bank'
      }))
    : [...fixed]

/** Which tier the box files a category under. */
export const categoryTierOf = (key: PetitBacBankCategory): ContentTier =>
  CATEGORY_TIERS[key]
