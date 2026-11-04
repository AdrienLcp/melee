import { classNames } from '@adrienlcp/react'
import type React from 'react'

import type { GameSettings } from '@melee/protocol/game'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import {
  type PlayedRound,
  usePlayedRoundName
} from '@/presentation/i18n/line-up-entry-names'

import { GameIcon } from './icons'
import { SectionHeading } from './section-heading'

import './this-round-heading.sass'

type ThisRoundHeadingProps = {
  /** Printed at the rule's far end: what the round paid the seat this screen holds. */
  aside?: React.ReactNode
  className?: string
  /** The room's line-up, which names the entry the round was opened from. */
  lineUp: readonly GameSettings[]
  round: PlayedRound
}

/**
 * The round's block on every reveal, headed by what was just played: in a
 * line-up, where the next round may be another game, its glyph on the game's
 * spine and the entry's name — *Blind test · 70s* — and *This round* in a room
 * of one entry, which knows what it is playing.
 */
export const ThisRoundHeading: React.FC<ThisRoundHeadingProps> = ({
  aside,
  className,
  lineUp,
  round
}) => {
  const translate = useTranslate()
  const name = usePlayedRoundName({ lineUp, round })
  const { kind } = round.content

  return (
    <SectionHeading
      aside={aside}
      className={classNames('this-round-heading', className)}
    >
      {name === null ? (
        translate('round.thisRound')
      ) : (
        <>
          <span
            className='spine-mark'
            style={{
              '--spine': `var(--spine-${kind})`,
              '--spine-ink': `var(--on-spine-${kind})`
            }}
          >
            <GameIcon game={kind} />
          </span>
          {name}
        </>
      )}
    </SectionHeading>
  )
}
