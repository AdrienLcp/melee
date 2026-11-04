import type React from 'react'

import type { GameSettings } from '@melee/protocol/game'
import type { RoomSettings } from '@melee/protocol/room'

import { trackAnswersOf } from '@melee/core/blindtest/track-answers'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { isClockPaid, scoringKey } from '@/presentation/i18n/translation'

type ScoringRuleProps = {
  className: string
  game: GameSettings
  /** The room's, which say how the next round is answered and whether the clock pays. */
  settings: Pick<RoomSettings, 'mode' | 'paysForSpeed'>
}

/**
 * What a round of `game` pays, as the room is set to play it: the game's own
 * sentence, then the clock's when the room pays for speed and the sentence is
 * one the clock adds to.
 */
export const ScoringRule: React.FC<ScoringRuleProps> = ({
  className,
  game,
  settings
}) => {
  const translate = useTranslate()
  const key = scoringKey({
    answerMode: settings.mode.kind,
    atlas: game.kind === 'atlas' ? game : null,
    doublesLoneFinds: game.kind === 'blacksquare' && game.doublesLoneFinds,
    game: game.kind,
    trackAnswers:
      game.kind === 'blindtest' ? trackAnswersOf(game.source) : 'songs'
  })

  return (
    <p className={className}>
      {translate(key)}
      {settings.paysForSpeed &&
        isClockPaid(key) &&
        ` ${translate('round.speedRule')}`}
    </p>
  )
}
