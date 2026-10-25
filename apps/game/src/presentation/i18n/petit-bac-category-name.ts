import type { PetitBacCategory } from '@melee/protocol/petit-bac'

import type { Translate } from '@/presentation/i18n/translation'

/** A bank category in the reader's language; the host's own line exactly as it was typed. */
export const petitBacCategoryName = ({
  category,
  translate
}: {
  category: PetitBacCategory
  translate: Translate
}): string =>
  category.kind === 'own'
    ? category.label
    : translate(`petitbac.category.${category.key}`)
