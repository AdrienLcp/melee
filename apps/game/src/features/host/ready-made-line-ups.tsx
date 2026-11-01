import type React from 'react'
import { Button as AriaButton } from 'react-aria-components'

import {
  type ReadyMadeLineUp,
  type ReadyMadeLineUpId,
  readyMadeLineUpsFor
} from '@melee/core/room/ready-made-line-ups'

import { Button } from '@/presentation/components/button'
import { ChevronRightIcon } from '@/presentation/components/icons'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'
import { gameNameKey } from '@/presentation/i18n/translation'

import { spinesOf } from './saved-evenings-page'

import './ready-made-line-ups.sass'

type ReadyMadeRowsProps = {
  /** No socket, so a press would send nothing. */
  isDisabled: boolean
  /** Puts the room on `lineUp`, from its first round. */
  onLoad: (lineUp: ReadyMadeLineUp) => void
}

/**
 * The line-ups the app ships, drawn as a kept line-up is — a tick per entry,
 * the name, its games and length — at the head of a table nobody has decided
 * for yet.
 */
export const ReadyMadeRows: React.FC<ReadyMadeRowsProps> = ({
  isDisabled,
  onLoad
}) => {
  const { locale, translate } = useI18n()

  return (
    <section className='ready-made'>
      <VisuallyHidden>
        <h3>{translate('readyMade.heading')}</h3>
      </VisuallyHidden>
      <ul className='line-ups'>
        {readyMadeLineUpsFor(locale).map((lineUp) => {
          const spines = spinesOf(lineUp.lineUp)
          const games = [...new Set(spines.map(({ kind }) => kind))]
            .map((game) => translate(gameNameKey(game)))
            .join(', ')

          return (
            <li key={lineUp.id}>
              <AriaButton
                className='line-up'
                isDisabled={isDisabled}
                onPress={() => {
                  onLoad(lineUp)
                }}
              >
                <span aria-hidden className='spines'>
                  {spines.map(({ id, kind }) => (
                    <span
                      key={id}
                      style={{ '--spine': `var(--spine-${kind})` }}
                    />
                  ))}
                </span>
                <span className='name'>
                  {translate(`readyMade.lineUps.${lineUp.id}.name`)}
                </span>
                <span className='detail'>
                  {games} ·{' '}
                  {lineUp.roundCount === null
                    ? translate('host.saved.endless')
                    : translate('readyMade.rounds', {
                        count: lineUp.roundCount
                      })}
                </span>
                <ChevronRightIcon className='chevron' />
              </AriaButton>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

type ReadyMadeNoteProps = {
  id: ReadyMadeLineUpId
  /** Takes the line-up off the table, back to the ready-made choice. */
  onChange: () => void
}

/** Which ready-made line-up the planned games below came from, and the way back to the choice. */
export const ReadyMadeNote: React.FC<ReadyMadeNoteProps> = ({
  id,
  onChange
}) => {
  const translate = useTranslate()

  return (
    <div className='ready-made-note'>
      <p role='status'>
        {translate('readyMade.loaded', {
          name: translate(`readyMade.lineUps.${id}.name`)
        })}
      </p>
      <Button onPress={onChange} size='small' variant='underlined'>
        {translate('readyMade.change')}
      </Button>
    </div>
  )
}
