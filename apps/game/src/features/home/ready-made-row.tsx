import type React from 'react'

import type { GameKind } from '@melee/protocol/game'

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

/**
 * Past this many, the names run beyond the lid's two lines and get cut: the
 * band already shows every game and the caption says which, so the list goes.
 */
const MOST_GAMES_A_LID_NAMES = 6

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
  const namedGames = (games: readonly GameKind[]) =>
    games.length > MOST_GAMES_A_LID_NAMES
      ? null
      : games.map((game) => translate(gameNameKey(game))).join(' · ')

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
          games={namedGames(gamesOfLineUp(lineUp))}
          isDisabled={isOpeningAny && readyMadeOpening !== lineUp.id}
          isOpening={readyMadeOpening === lineUp.id}
          key={lineUp.id}
          meta={roundsText(lineUp.roundCount)}
          name={translate(`readyMade.lineUps.${lineUp.id}.name`)}
          onOpen={() => {
            void openReadyMade({ id: lineUp.id })
          }}
          removal={null}
          star={null}
        />
      ))}
    </LineUpRow>
  )
}
