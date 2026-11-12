import type React from 'react'

import { petitBacContent } from '@/helpers/round-content'
import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { HostActionsProps } from './host-actions'

type PetitBacActionsProps = Pick<HostActionsProps, 'isLive' | 'send' | 'view'>

/**
 * The console's hand on a round of Petit Bac: stop called for the whole room
 * while the sheets are written, taking back a stop a seat called on a sheet
 * the room disputes, then moving the vote on one category at a time.
 */
export const PetitBacActions: React.FC<PetitBacActionsProps> = ({
  isLive,
  send,
  view
}) => {
  const translate = useTranslate()
  const round = view.round
  const content = petitBacContent(round)

  if (round === null || content === null) {
    return null
  }

  const canCancelStop =
    view.currentContent?.kind === 'petitbac' &&
    view.currentContent.canCancelStop
  const votingIndex = content.categoryStates.indexOf('voting')
  const isLastCategory = votingIndex === content.categories.length - 1
  const canCallStop =
    view.phase === 'playing' &&
    !content.sheetsClosed &&
    content.stopClosesAtElapsedMs === null

  return (
    <>
      {canCallStop && (
        <Button
          isDisabled={!isLive}
          onPress={() => {
            send({ roundId: round.id, type: 'host.reveal' })
          }}
          variant='underlined'
        >
          {translate('petitbac.host.callStop')}
        </Button>
      )}
      {canCancelStop && (
        <Button
          isDisabled={!isLive}
          onPress={() => {
            send({ roundId: round.id, type: 'host.cancelStop' })
          }}
          variant={votingIndex === -1 ? 'filled' : 'underlined'}
        >
          {translate('petitbac.host.cancelStop')}
        </Button>
      )}
      {votingIndex !== -1 && (
        <Button
          isDisabled={!isLive}
          onPress={() => {
            send({
              categoryIndex: votingIndex,
              roundId: round.id,
              type: 'host.nextCategory'
            })
          }}
        >
          {isLastCategory
            ? translate('petitbac.host.toScores')
            : translate('petitbac.host.nextCategory')}
        </Button>
      )}
    </>
  )
}
