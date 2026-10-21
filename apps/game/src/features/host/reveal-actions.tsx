import type React from 'react'

import { rememberedSetupFor } from '@melee/core/room/host-preferences'
import { movedToGame } from '@melee/core/room/room-settings'
import { isShelvedGame } from '@melee/core/room/shelved-game'
import { hasTurnsAfter } from '@melee/core/team/team-turn'

import { Button } from '@/presentation/components/button'
import { SegmentedControl } from '@/presentation/components/segmented-control'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import { gameNameKey } from '@/presentation/i18n/translation'

import { PrimaryPress, SecondaryPresses, useActionSlot } from './action-slot'
import { BoardMoves } from './board-moves'
import { ChallengeLineField } from './challenge-line-field'
import type { HostActionsProps } from './host-actions'
import { playStyleFor, TurnsChoice } from './turns-choice'

export const RevealActions: React.FC<HostActionsProps> = ({
  challengeLine,
  isLive,
  onOpenRound,
  onPlayStyle,
  onSettingsChange,
  preferences,
  playStyle,
  send,
  view
}) => {
  const { locale, translate } = useI18n()
  const slot = useActionSlot()
  const { settings } = view
  const total = settings.roundCount

  // The server ends the game rather than opening a round past the last one, so
  // on that reveal "next round" is a button that does something else than it
  // says — and the way out beside it reads as abandoning a game that is already
  // over. One control, named after what it opens.
  // A set owes the next team its round, whatever the line-up or the count
  // says: the press opens that team's turn, and nothing here may change the
  // game under the teams still waiting.
  if (hasTurnsAfter(view.round?.turn ?? null)) {
    return (
      <div className='reveal-actions'>
        <PrimaryPress>
          <Button
            isDisabled={!isLive}
            onPress={() => {
              onOpenRound()
              send({ type: 'host.nextRound' })
            }}
            size='large'
          >
            {translate('host.nextTurn')}
          </Button>
        </PrimaryPress>
        {/* The drawer ends a game among the room's other exits. */}
        {slot === 'all' && (
          <Button
            isDisabled={!isLive}
            onPress={() => {
              send({ type: 'host.endGame' })
            }}
            variant='underlined'
          >
            {translate('host.endGame')}
          </Button>
        )}
        <SecondaryPresses>
          <BoardMoves isLive={isLive} send={send} view={view} />
        </SecondaryPresses>
      </div>
    )
  }

  if (total !== null && (view.round?.index ?? 0) >= total) {
    return (
      <div className='reveal-actions'>
        <PrimaryPress>
          <Button
            isDisabled={!isLive}
            onPress={() => {
              send({ type: 'host.nextRound' })
            }}
            size='large'
          >
            {translate('host.seeResults')}
          </Button>
        </PrimaryPress>
        <SecondaryPresses>
          <BoardMoves isLive={isLive} send={send} view={view} />
        </SecondaryPresses>
      </div>
    )
  }

  return (
    <div className='reveal-actions'>
      {/*
        The game the draw landed on, already selected: one press opens it, and
        the others are one press away when the table shouts for something else.
      */}
      <SecondaryPresses>
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
        {challengeLine !== null && (
          <ChallengeLineField
            isDisabled={!isLive}
            onChange={challengeLine.onChange}
            value={challengeLine.text}
          />
        )}
        <TurnsChoice
          isDisabled={!isLive}
          onChange={onPlayStyle}
          playStyle={playStyle}
          view={view}
        />
      </SecondaryPresses>
      <PrimaryPress>
        <Button
          isDisabled={!isLive}
          onPress={() => {
            onOpenRound()
            send({
              challengeText: challengeLine?.text,
              playStyle: playStyleFor({ playStyle, view }),
              type: 'host.nextRound'
            })
          }}
          size='large'
        >
          {translate('host.nextRound')}
        </Button>
      </PrimaryPress>
      {/* The drawer ends a game among the room's other exits. */}
      {slot === 'all' && (
        <Button
          isDisabled={!isLive}
          onPress={() => {
            send({ type: 'host.endGame' })
          }}
          variant='underlined'
        >
          {translate('host.endGame')}
        </Button>
      )}
      <SecondaryPresses>
        <BoardMoves isLive={isLive} send={send} view={view} />
      </SecondaryPresses>
    </div>
  )
}
