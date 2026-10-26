import type React from 'react'

import type { RoundView } from '@melee/protocol/room'

import { atlasContent, quizContent } from '@/helpers/round-content'
import { AskedQuestion } from '@/presentation/components/asked-question'
import { MapQuestion } from '@/presentation/components/map-question'

/**
 * What a round asks on its card, whichever game wrote it: the quiz's
 * question, or the place a map round shows to be named.
 */
export const RoundQuestion: React.FC<{ round: RoundView }> = ({ round }) => {
  const shown = atlasContent(round)?.shown ?? null

  return shown === null ? (
    <AskedQuestion prompt={quizContent(round)?.prompt ?? null} />
  ) : (
    <MapQuestion shown={shown} />
  )
}
