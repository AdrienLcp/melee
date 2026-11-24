import type React from 'react'

import type { GameSettings } from '@melee/protocol/game'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import {
  type PlayedRound,
  playingRoundName
} from '@/presentation/i18n/line-up-entry-names'

import { LeavesInPlace } from './leaves-in-place'
import { SpineMark } from './spine-mark'
import { useLastShown } from './use-last-shown'

import './round-game.sass'

type RoundGameProps = {
  /** The room's line-up, which names the entry the round was opened from. */
  lineUp: readonly GameSettings[]
  /** The round on screen, `null` while none is: the lobby and the final board. */
  round: PlayedRound | null
}

/**
 * The game the round on screen was opened on, at the head of a room's screen
 * while it plays: its spine and the name its reveal heads it with, so a table
 * playing an evening of several games reads which one this is without waiting
 * for the answer. Nothing in a room of one entry, which knows. A change of
 * game swaps the name where it stands.
 */
export const RoundGame: React.FC<RoundGameProps> = ({ lineUp, round }) => {
  const translate = useTranslate()
  const name =
    round === null ? null : playingRoundName({ lineUp, round, translate })
  const game = useLastShown(
    name === null ? null : (round?.content.kind ?? null)
  )

  return (
    <LeavesInPlace value={name}>
      {(shown) =>
        game !== null && (
          <p className='round-game'>
            <span key={`${game} ${shown}`}>
              <SpineMark game={game} />
              {shown}
            </span>
          </p>
        )
      }
    </LeavesInPlace>
  )
}
