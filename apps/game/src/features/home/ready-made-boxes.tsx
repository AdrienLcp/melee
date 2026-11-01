import type React from 'react'
import { Button } from 'react-aria-components'

import {
  gameOfEntry,
  gamesOfLineUp,
  type ReadyMadeLineUp,
  readyMadeLineUpsFor
} from '@melee/core/room/ready-made-line-ups'

import { ArrowIcon, GameIcon } from '@/presentation/components/icons'
import { Spinner } from '@/presentation/components/spinner'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'
import { gameNameKey } from '@/presentation/i18n/translation'

import type { CreateRoom } from './use-create-room'

import './ready-made-boxes.sass'

type ReadyMadeBoxesProps = {
  /** The home page's one room opener, shared with the host's door. */
  createRoom: CreateRoom
}

/**
 * The line-ups the app ships, each a box lid banded in its entries' spines —
 * one segment per entry, so three blind tests read as three — with its games
 * named under its own. One press opens a table that plays them in a row.
 *
 * While a table opens every box but the pressed one is disabled, the pressed
 * one keeping its focus and its spinner.
 */
export const ReadyMadeBoxes: React.FC<ReadyMadeBoxesProps> = ({
  createRoom
}) => {
  const { locale } = useI18n()
  const translate = useTranslate()
  const { isOpeningAny, openReadyMade, readyMadeOpening } = createRoom

  return (
    <section
      aria-busy={isOpeningAny}
      aria-describedby='ready-made-hint'
      aria-labelledby='ready-made-title'
      className='ready-made-boxes'
    >
      <div className='shelf-heading'>
        <h2 className='shelf-title' id='ready-made-title'>
          {translate('readyMade.heading')}
        </h2>
        <p className='shelf-hint' id='ready-made-hint'>
          {translate('readyMade.hint')}
        </p>
      </div>
      <ul className='boxes'>
        {readyMadeLineUpsFor(locale).map((lineUp) => (
          <li key={lineUp.id}>
            <Button
              className='box'
              isDisabled={isOpeningAny && readyMadeOpening !== lineUp.id}
              onPress={() => {
                void openReadyMade({ id: lineUp.id })
              }}
            >
              <span aria-hidden='true' className='band'>
                {bandOf(lineUp).map(({ game, key }) => (
                  <span
                    className='segment'
                    key={key}
                    style={{
                      '--spine': `var(--spine-${game})`,
                      '--spine-ink': `var(--on-spine-${game})`
                    }}
                  >
                    <GameIcon game={game} />
                  </span>
                ))}
              </span>
              <span className='body'>
                <span className='name'>
                  {translate(`readyMade.lineUps.${lineUp.id}.name`)}
                </span>
                <span className='games'>
                  {gamesOfLineUp(lineUp)
                    .map((game) => translate(gameNameKey(game)))
                    .join(' · ')}
                </span>
                <span className='caption'>
                  {translate(`readyMade.lineUps.${lineUp.id}.caption`)}
                </span>
              </span>
              <span className='foot'>
                <span>
                  {lineUp.roundCount !== null &&
                    translate('readyMade.rounds', { count: lineUp.roundCount })}
                </span>
                <span className='go'>
                  {translate('readyMade.open')}
                  {readyMadeOpening === lineUp.id ? <Spinner /> : <ArrowIcon />}
                </span>
              </span>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  )
}

const bandOf = (lineUp: ReadyMadeLineUp) =>
  lineUp.lineUp.map((entry, index) => ({
    game: gameOfEntry(entry),
    key: index
  }))
