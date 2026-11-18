import type React from 'react'

import type { FiveCluesClue as Clue } from '@melee/protocol/five-clues'

import { worthOfClue } from '@melee/core/fiveclues/clue-pay'

import { shownPoints } from '@/helpers/shown-points'
import { FiveCluesClue } from '@/presentation/components/five-clues-clue'
import {
  CitiesIcon,
  FlagIcon,
  OutlineIcon,
  PlayersIcon,
  WorldIcon
} from '@/presentation/components/icons'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './five-clues-ladder.sass'

/** What every rung asks, vaguest first — the ladder's order is the protocol's tuple. */
const CLUE_KINDS = [
  'size',
  'region',
  'outline',
  'cities',
  'flag'
] as const satisfies readonly Clue['kind'][]

const KIND_ICONS = {
  cities: CitiesIcon,
  flag: FlagIcon,
  outline: OutlineIcon,
  region: WorldIcon,
  size: PlayersIcon
} satisfies Record<Clue['kind'], React.FC>

/** A rung still shut, the one open now, or one the climb went past (every rung once revealed). */
export type RungState = 'closed' | 'open' | 'past'

type FiveCluesLadderProps = {
  /** The clues open so far, vaguest first — the whole ladder once revealed. */
  clues: readonly Clue[]
  /** The clue open now; ignored once revealed. */
  openClueIndex: number
  /** Every rung shown as climbed: the reveal. */
  isRevealed?: boolean
  /** Which screen draws it, which sets every rung's proportions. */
  size: 'seat' | 'wall' | 'reveal'
  /** Laid on the open rung under its clue: the window's bar. */
  window?: React.ReactNode
  /** What stands at a rung's start, before its worth: the seat's own pawn. */
  laneOf?: (clueIndex: number) => React.ReactNode
  /** What stands at a rung's end: who found on it, the crowd still climbing. */
  peopleOf?: (clueIndex: number, state: RungState) => React.ReactNode
}

/**
 * Five rungs climbed from the bottom, each printed with what finding on it
 * pays: a shut one a socket with its kind's glyph, the open one a paper card
 * ringed in the phase's ink, the ones below it the board's printed blue.
 * The list runs in clue order, so a screen reader climbs it the way the room
 * does; it is laid bottom up.
 */
export const FiveCluesLadder: React.FC<FiveCluesLadderProps> = ({
  clues,
  isRevealed = false,
  laneOf,
  openClueIndex,
  peopleOf,
  size,
  window
}) => {
  const translate = useTranslate()

  return (
    <ol className='five-clues-ladder' data-size={size}>
      {CLUE_KINDS.map((kind, clueIndex) => {
        const clue = clues[clueIndex]
        const state: RungState =
          clue === undefined
            ? 'closed'
            : clueIndex === openClueIndex && !isRevealed
              ? 'open'
              : 'past'
        const KindIcon = KIND_ICONS[kind]
        const worth = shownPoints(worthOfClue(clueIndex))

        return (
          <li className='rung' data-state={state} key={kind}>
            {laneOf !== undefined && (
              <span className='lane'>{laneOf(clueIndex)}</span>
            )}
            <span aria-hidden className='worth'>
              {worth}
            </span>
            <VisuallyHidden elementType='span'>
              {translate('fiveclues.rung', {
                index: clueIndex + 1,
                worth
              })}
            </VisuallyHidden>
            <div className='face'>
              <span className='shut'>
                <KindIcon />
                <VisuallyHidden elementType='span'>
                  {translate(`fiveclues.kind.${kind}`)}
                </VisuallyHidden>
              </span>
              {clue !== undefined && (
                <div className='clue'>
                  {state === 'open' && window}
                  <FiveCluesClue clue={clue} />
                </div>
              )}
            </div>
            {peopleOf?.(clueIndex, state)}
          </li>
        )
      })}
    </ol>
  )
}
