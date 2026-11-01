import type React from 'react'

import {
  gameOfEntry,
  gamesOfLineUp,
  readyMadeLineUpsFor
} from '@melee/core/room/ready-made-line-ups'

import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'
import { gameNameKey } from '@/presentation/i18n/translation'

import { LineUpLid } from './line-up-lid'
import { LineUpRow } from './line-up-row'
import type { CreateRoom } from './use-create-room'
import { useRoundsText } from './use-line-up-face'

type ReadyMadeRowProps = {
  /** The home page's one room opener, shared with every lid and the door. */
  createRoom: CreateRoom
}

/**
 * The line-ups the app ships, one lid each with its games named under its own
 * name. One press opens a table that plays them in a row, already set.
 */
export const ReadyMadeRow: React.FC<ReadyMadeRowProps> = ({ createRoom }) => {
  const { locale } = useI18n()
  const translate = useTranslate()
  const roundsText = useRoundsText()
  const { isOpeningAny, openReadyMade, readyMadeOpening } = createRoom
  const lineUps = readyMadeLineUpsFor(locale)

  return (
    <LineUpRow
      count={lineUps.length}
      hint={translate('readyMade.hint')}
      id='ready-made'
      title={translate('readyMade.heading')}
    >
      {lineUps.map((lineUp) => (
        <LineUpLid
          band={lineUp.lineUp.map(gameOfEntry)}
          caption={translate(`readyMade.lineUps.${lineUp.id}.caption`)}
          games={gamesOfLineUp(lineUp)
            .map((game) => translate(gameNameKey(game)))
            .join(' · ')}
          isDisabled={isOpeningAny && readyMadeOpening !== lineUp.id}
          isOpening={readyMadeOpening === lineUp.id}
          key={lineUp.id}
          meta={roundsText(lineUp.roundCount)}
          name={translate(`readyMade.lineUps.${lineUp.id}.name`)}
          onOpen={() => {
            void openReadyMade({ id: lineUp.id })
          }}
          star={null}
        />
      ))}
    </LineUpRow>
  )
}
