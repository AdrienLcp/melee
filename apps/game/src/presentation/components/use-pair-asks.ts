import type { QuantityAsk } from '@melee/protocol/estimate'

import { useTranslate } from '@/presentation/i18n/i18n-provider'

/** What a pair asks the table: its family's question from the dictionary, or the comparison the evening wrote. */
export const usePairAsks = (): ((ask: QuantityAsk) => string) => {
  const translate = useTranslate()

  return (ask) =>
    ask.kind === 'bank'
      ? translate(`higherlower.asks.${ask.family}`)
      : ask.prompt
}
