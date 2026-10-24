import type React from 'react'

import type { HostRoomView } from '@melee/protocol/room'

import { rememberedSetupFor } from '@melee/core/room/host-preferences'
import { endsTheEvening } from '@melee/core/room/next-game'
import { movedToEntry } from '@melee/core/room/room-settings'
import { orderWithEntryNext } from '@melee/core/room/running-order'
import { offersSkip, withEntrySkipped } from '@melee/core/room/skipped-entry'
import { canPlayDuel } from '@melee/core/team/duel'

import { Button } from '@/presentation/components/button'
import { SegmentedControl } from '@/presentation/components/segmented-control'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import { useLineUpEntryNames } from '@/presentation/i18n/line-up-entry-names'

import { BoardMoves } from './board-moves'
import { challengePickFor } from './challenge-line'
import { ChallengeLinePicker } from './challenge-line-picker'
import type { HostActionsProps } from './host-actions'
import { InnerclockTargetField, targetToSend } from './innerclock-target-field'

import './reveal-actions.sass'

/** The most entries a row of the next-game strip holds beside the other presses. */
const MOST_ENTRIES_A_ROW = 5

/**
 * As many columns as the fewest rows need, so the rows come out as even as the
 * count allows — six in two rows of three, never five and one.
 */
const balancedColumns = (count: number): number =>
  Math.ceil(count / Math.ceil(count / MOST_ENTRIES_A_ROW))

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
  slateKeys,
  view
}) => {
  const { locale, translate } = useI18n()
  const { settings } = view
  const entryNames = useLineUpEntryNames(settings.lineUp)

  const openNextRound = ({ isDuel }: { isDuel: boolean }) => {
    onOpenRound()
    send({
      ...challengePickFor(challengeLine),
      innerclockTargetSeconds: targetToSend(innerclockTarget),
      isDuel,
      type: 'host.nextRound'
    })
  }

  // The server ends the game rather than opening a round past the last one —
  // the count reached, or nothing left to deal — so on that reveal "next
  // round" is a button that does something else than it
  // says — and the way out beside it reads as abandoning a game that is already
  // over. One control, named after what it opens.
  if (
    endsTheEvening({
      lineUp: settings.lineUp,
      played: view.lineUpPlayed,
      roundCount: settings.roundCount,
      roundIndex: view.round?.index ?? 0
    })
  ) {
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
        <BoardMoves isLive={isLive} send={send} view={view} />
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
          onChange={(value) => {
            const at = Number(value)
            const entry = settings.lineUp[at]

            if (entry !== undefined && at !== settings.lineUpAt) {
              const moved = movedToEntry({
                at,
                locale,
                remembered: rememberedSetupFor({
                  game: entry.kind,
                  preferences
                }),
                settings
              })

              onSettingsChange({
                ...moved,
                runningOrder: orderWithEntryNext({
                  at,
                  order: moved.runningOrder,
                  upcoming: view.round?.index ?? 0
                })
              })
            }
          }}
          options={entryNames.map((name, at) => ({
            label: name,
            value: String(at)
          }))}
          style={{ '--columns': balancedColumns(settings.lineUp.length) }}
          value={settings.lineUpAt === null ? null : String(settings.lineUpAt)}
        />
      )}
      {offersSkip({
        challengeText: challengePickFor(challengeLine).challengeText,
        lineUp: settings.lineUp,
        lineUpAt: settings.lineUpAt,
        played: view.lineUpPlayed,
        slateKeys: slateKeys ?? []
      }) && (
        <Button
          className='skip-round'
          isDisabled={!isLive}
          onPress={() => {
            onSettingsChange(
              withEntrySkipped({
                lastAt: view.round?.lineUpAt ?? null,
                locale,
                played: view.lineUpPlayed,
                random: Math.random,
                rememberedFor: (game) =>
                  rememberedSetupFor({ game, preferences }),
                roundAt: view.round?.index ?? 0,
                roundsLeft:
                  settings.roundCount === null
                    ? null
                    : settings.roundCount - (view.round?.index ?? 0),
                settings
              })
            )
          }}
          variant='underlined'
        >
          {translate('host.skipRound')}
        </Button>
      )}
      {innerclockTarget !== null && (
        <InnerclockTargetField
          isDisabled={!isLive}
          onChange={innerclockTarget.onChange}
          seconds={innerclockTarget.seconds}
        />
      )}
      {challengeLine !== null && (
        <ChallengeLinePicker isDisabled={!isLive} line={challengeLine} />
      )}
      <Button
        isDisabled={!isLive}
        onPress={() => openNextRound({ isDuel: false })}
        size='large'
      >
        {translate('host.nextRound')}
      </Button>
      {/* Beside the press it varies. */}
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
      <Button
        isDisabled={!isLive}
        onPress={() => {
          send({ type: 'host.endGame' })
        }}
        variant='underlined'
      >
        {translate('host.endGame')}
      </Button>
      <BoardMoves isLive={isLive} send={send} view={view} />
    </div>
  )
}
