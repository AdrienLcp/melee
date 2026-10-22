import type React from 'react'

import type { HostRoomView } from '@melee/protocol/room'

import { rememberedSetupFor } from '@melee/core/room/host-preferences'
import { movedToEntry } from '@melee/core/room/room-settings'
import { canPlayDuel } from '@melee/core/team/duel'

import { Button } from '@/presentation/components/button'
import { SegmentedControl } from '@/presentation/components/segmented-control'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import { useLineUpEntryNames } from '@/presentation/i18n/line-up-entry-names'

import { PrimaryPress, SecondaryPresses, useActionSlot } from './action-slot'
import { BoardMoves } from './board-moves'
import { ChallengeLineField } from './challenge-line-field'
import type { HostActionsProps } from './host-actions'
import { InnerclockTargetField, targetToSend } from './innerclock-target-field'

/**
 * Whether the next round may be a duel, read off the room as it stands: two
 * teams holding a seat each, in a game and a mode a duel can be played in.
 */
const offersDuel = (view: HostRoomView): boolean =>
  view.settings.teams.kind !== 'aloud' &&
  canPlayDuel({
    game: view.settings.game?.kind ?? null,
    mode: view.settings.mode.kind,
    teamCount: view.teams.filter((team) => team.seatIds.length > 0).length
  })

export const RevealActions: React.FC<HostActionsProps> = ({
  challengeLine,
  innerclockTarget,
  isLive,
  onOpenRound,
  onSettingsChange,
  preferences,
  send,
  view
}) => {
  const { locale, translate } = useI18n()
  const slot = useActionSlot()
  const { settings } = view
  const entryNames = useLineUpEntryNames(settings.lineUp)
  const total = settings.roundCount

  const openNextRound = ({ isDuel }: { isDuel: boolean }) => {
    onOpenRound()
    send({
      challengeText: challengeLine?.text,
      innerclockTargetSeconds: targetToSend(innerclockTarget),
      isDuel,
      type: 'host.nextRound'
    })
  }

  // The server ends the game rather than opening a round past the last one, so
  // on that reveal "next round" is a button that does something else than it
  // says — and the way out beside it reads as abandoning a game that is already
  // over. One control, named after what it opens.
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
            onChange={(value) => {
              const at = Number(value)
              const entry = settings.lineUp[at]

              if (entry !== undefined && at !== settings.lineUpAt) {
                onSettingsChange(
                  movedToEntry({
                    at,
                    locale,
                    remembered: rememberedSetupFor({
                      game: entry.kind,
                      preferences
                    }),
                    settings
                  })
                )
              }
            }}
            options={entryNames.map((name, at) => ({
              label: name,
              value: String(at)
            }))}
            value={
              settings.lineUpAt === null ? null : String(settings.lineUpAt)
            }
          />
        )}
        {innerclockTarget !== null && (
          <InnerclockTargetField
            isDisabled={!isLive}
            onChange={innerclockTarget.onChange}
            seconds={innerclockTarget.seconds}
          />
        )}
        {challengeLine !== null && (
          <ChallengeLineField
            isDisabled={!isLive}
            onChange={challengeLine.onChange}
            value={challengeLine.text}
          />
        )}
      </SecondaryPresses>
      <PrimaryPress>
        <Button
          isDisabled={!isLive}
          onPress={() => openNextRound({ isDuel: false })}
          size='large'
        >
          {translate('host.nextRound')}
        </Button>
        {/* Beside the press it varies, wherever that press is drawn. */}
        {offersDuel(view) && (
          <Button
            isDisabled={!isLive}
            onPress={() => openNextRound({ isDuel: true })}
            size='large'
            variant='outlined'
          >
            {translate('host.nextDuel')}
          </Button>
        )}
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
