import type React from 'react'

import {
  gamesOfLineUp,
  type ReadyMadeLineUp,
  readyMadeLineUpsFor
} from '@melee/core/room/ready-made-line-ups'

import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'

import { PartyLid } from './party-lid'
import { PartyMotif } from './party-motif'
import { PawnCrowd } from './pawn-crowd'
import type { CreateRoom } from './use-create-room'

import './ready-made-row.sass'

type ReadyMadeRowProps = {
  /** The home page's one room opener, shared with every lid and the door. */
  createRoom: CreateRoom
}

const pictureOf = (lineUp: ReadyMadeLineUp): React.ReactNode =>
  lineUp.id === 'grandMix' ? (
    <PawnCrowd games={gamesOfLineUp(lineUp)} />
  ) : (
    <PartyMotif id={lineUp.id} />
  )

/**
 * The line-ups the app ships, each a lid in its own colour: the first set
 * apart and wide, the others in a rack under it. One press opens a table that
 * plays them in a row, already set.
 */
export const ReadyMadeRow: React.FC<ReadyMadeRowProps> = ({ createRoom }) => {
  const { locale } = useI18n()
  const translate = useTranslate()
  const { isOpeningAny, openReadyMade, readyMadeOpening } = createRoom
  const [featured, ...others] = readyMadeLineUpsFor(locale)

  const lidOf = (lineUp: ReadyMadeLineUp, isFeatured: boolean) => (
    <PartyLid
      caption={translate(`readyMade.lineUps.${lineUp.id}.caption`)}
      id={lineUp.id}
      isDisabled={isOpeningAny && readyMadeOpening !== lineUp.id}
      isFeatured={isFeatured}
      isOpening={readyMadeOpening === lineUp.id}
      name={translate(`readyMade.lineUps.${lineUp.id}.name`)}
      onOpen={() => {
        void openReadyMade({ id: lineUp.id })
      }}
      picture={pictureOf(lineUp)}
    />
  )

  return (
    <section
      aria-describedby='ready-made-hint'
      aria-labelledby='ready-made-title'
      className='ready-made-row'
    >
      <div className='shelf-heading'>
        <h2 className='shelf-title' id='ready-made-title'>
          {translate('readyMade.heading')}
        </h2>
        <p className='shelf-hint' id='ready-made-hint'>
          {translate('readyMade.hint')}
        </p>
      </div>
      <ul aria-labelledby='ready-made-title' className='rack'>
        {featured !== undefined && (
          <li className='featured'>{lidOf(featured, true)}</li>
        )}
        {others.map((lineUp) => (
          <li key={lineUp.id}>{lidOf(lineUp, false)}</li>
        ))}
      </ul>
    </section>
  )
}
