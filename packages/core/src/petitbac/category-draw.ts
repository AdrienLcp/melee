import {
  type PetitBacCategory,
  petitBacBankCategories
} from '@melee/protocol/petit-bac'

import { shuffled } from '../helpers/random'

/**
 * A round's categories: the host's own list when it fixed one, otherwise
 * `count` drawn from the bank, never one twice in a round.
 */
export const drawCategories = ({
  count,
  fixed
}: {
  count: number
  fixed: readonly PetitBacCategory[] | null
}): PetitBacCategory[] =>
  fixed === null
    ? shuffled(petitBacBankCategories)
        .slice(0, count)
        .map((key) => ({ key, kind: 'bank' }))
    : [...fixed]
