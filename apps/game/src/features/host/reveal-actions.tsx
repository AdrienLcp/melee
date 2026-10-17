import type React from 'react'

import { rememberedSetupFor } from '@melee/core/room/host-preferences'
import { movedToGame } from '@melee/core/room/room-settings'
import { isShelvedGame } from '@melee/core/room/shelved-game'

import { Button } from '@/presentation/components/button'
import { SegmentedControl } from '@/presentation/components/segmented-control'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import { gameNameKey } from '@/presentation/i18n/translation'

import type { HostActionsProps } from './host-actions'

export const RevealActions: React.FC<HostActionsProps> = ({
  isLive,
  onOpenRound,
  onSettingsChange,
  preferences,
  send,
  view
}) => {
  const { locale, translate } = useI18n()
  const { settings } = view
  const total = settings.roundCount

  // The server ends the game rather than opening a round past the last one, so
  // on that reveal "next round" is a button that does something else than it
  // says — and the way out beside it reads as abandoning a game that is already
  // over. One control, named after what it opens.
  if (total !== null && (view.round?.index ?? 0) >= total) {
    return (
      <div className='reveal-actions'>
        <Button
          isDisabled={!isLive}
          onPress={() => {
            send({ type: 'host.nextRound' })
          }}
          size='large'
        >
          {translate('host.seeResults')}
        </Button>
      </div>
    )
  }

  return (
    <div className='reveal-actions'>
      {/*
        The game the draw landed on, already selected: one press opens it, and
        the others are one press away when the table shouts for something else.
      */}
      {settings.lineUp.length > 1 && (
        <SegmentedControl
          className='next-game'
          isDisabled={!isLive}
          label={translate('host.lineUp.next')}
          onChange={(game) => {
            if (isShelvedGame(game) && game !== settings.game?.kind) {
              onSettingsChange(
                movedToGame({
                  game,
                  locale,
                  remembered: rememberedSetupFor({ game, preferences }),
                  settings
                })
              )
            }
          }}
          options={settings.lineUp.map((game) => ({
            label: translate(gameNameKey(game)),
            value: game
          }))}
          value={settings.game?.kind ?? null}
        />
      )}
      <Button
        isDisabled={!isLive}
        onPress={() => {
          onOpenRound()
          send({ type: 'host.nextRound' })
        }}
        size='large'
      >
        {translate('host.nextRound')}
      </Button>
      <Button
        isDisabled={!isLive}
        onPress={() => {
          send({ type: 'host.endGame' })
        }}
        variant='underlined'
      >
        {translate('host.endGame')}
      </Button>
    </div>
  )
}
