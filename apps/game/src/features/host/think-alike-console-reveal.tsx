import type React from 'react'
import { useState } from 'react'
import { flushSync } from 'react-dom'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'

import { replaceScreen } from '@/infrastructure/browser'
import { Button } from '@/presentation/components/button'
import { MergeIcon, PilesIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { ThinkAlikePiles } from './think-alike-piles'
import {
  type ThinkAlikeRegroup,
  ThinkAlikeSorting
} from './think-alike-sorting'

import './think-alike-console-reveal.sass'

type ThinkAlikeConsoleRevealProps = {
  /**
   * A wall shows the room: it turns the piles over for the table, so the
   * console goes straight to the rows it sorts them on.
   */
  isWallShowing: boolean
  /** Sends a merge or a split; the server pays the round again and every screen regroups. */
  onRegroup: (regroup: ThinkAlikeRegroup) => void
  players: readonly PublicPlayer[]
  round: RoundView
  /** The seat this console holds, whose pile is framed; `null` when it plays no seat. */
  youId: PlayerId | null
}

/**
 * The console's reveal. With no wall, the console is the screen the table
 * watches: it turns the piles over as the wall would, and the rows that
 * merge two answers are one press away, and one press back.
 */
export const ThinkAlikeConsoleReveal: React.FC<
  ThinkAlikeConsoleRevealProps
> = ({ isWallShowing, onRegroup, players, round, youId }) => {
  const translate = useTranslate()
  const [isSorting, setIsSorting] = useState(false)

  if (isWallShowing) {
    return (
      <ThinkAlikeSorting
        onRegroup={onRegroup}
        players={players}
        round={round}
      />
    )
  }

  const toggle = () => {
    replaceScreen(() => {
      flushSync(() => {
        setIsSorting(!isSorting)
      })
    })
  }

  return (
    <div className='think-alike-console-reveal'>
      <Button
        className='sort-toggle'
        icon={isSorting ? <PilesIcon /> : <MergeIcon />}
        onPress={toggle}
        variant='outlined'
      >
        {translate(
          isSorting ? 'thinkalike.sort.close' : 'thinkalike.sort.open'
        )}
      </Button>
      {isSorting ? (
        <ThinkAlikeSorting
          onRegroup={onRegroup}
          players={players}
          round={round}
        />
      ) : (
        <ThinkAlikePiles players={players} round={round} youId={youId} />
      )}
    </div>
  )
}
