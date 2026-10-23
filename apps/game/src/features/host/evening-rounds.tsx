import type React from 'react'
import { useId } from 'react'
import { Button as AriaButton } from 'react-aria-components'

import type { GameKind, GameSettings } from '@melee/protocol/game'
import {
  type HostRoomView,
  LINE_UP_MAX_ENTRIES,
  type RoomSettings
} from '@melee/protocol/room'

import { eveningChance } from '@melee/core/room/evening-chance'
import { endsTheEvening } from '@melee/core/room/next-game'

import { Button } from '@/presentation/components/button'
import {
  ChevronRightIcon,
  GameIcon,
  PlusIcon
} from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useLineUpEntryDetail } from '@/presentation/i18n/line-up-entry-names'
import { gameNameKey } from '@/presentation/i18n/translation'

import { EveningStamp, eveningStampOf } from './evening-stamp'

import './evening-rounds.sass'

/** The counts the setup's strip offers, which a raised evening lands on when it can. */
export const ROUND_COUNT_STEPS = [5, 10, 20, 30] as const

/** The protocol's ceiling on a room's round count. */
const MAX_ROUND_COUNT = 50

const roundCountHolding = (needed: number): number =>
  ROUND_COUNT_STEPS.find((step) => step >= needed) ??
  Math.min(needed, MAX_ROUND_COUNT)

/**
 * Each entry with its index and a key: two entries of one game may hold the
 * same settings, so the only identity an entry has is which of its game's
 * entries it is.
 */
const rowsOf = (lineUp: readonly GameSettings[]) =>
  lineUp.map((entry, at) => ({
    at,
    entry,
    key: `${entry.kind}:${lineUp.slice(0, at).filter((other) => other.kind === entry.kind).length}`
  }))

type EveningRoundsProps = {
  /** The socket is open: adding a round leads to a press that sends one. */
  isLive: boolean
  /** Opens the shelf to add a round from. */
  onAdd: () => void
  /** Opens the page of the line-up's entry at that index. */
  onOpen: (at: number) => void
  onSettingsChange: (settings: RoomSettings) => void
  view: HostRoomView
}

/**
 * The evening as a short list of its rounds, each opening a page of its own,
 * and a line under it saying how many rounds the draw is left to fill. A round
 * the host brought is fixed once played, and the list says so before anyone
 * opens it.
 */
export const EveningRounds: React.FC<EveningRoundsProps> = ({
  isLive,
  onAdd,
  onOpen,
  onSettingsChange,
  view
}) => {
  const translate = useTranslate()
  const detailOf = useLineUpEntryDetail()
  const labelId = useId()
  const { lineUp, lineUpAt, roundCount } = view.settings
  const played = view.lineUpPlayed
  const isEveningOver =
    view.phase === 'revealed' &&
    endsTheEvening({
      lineUp,
      played,
      roundCount,
      roundIndex: view.round?.index ?? 0
    })

  return (
    <div className='evening-rounds'>
      <span className='rounds-label' id={labelId}>
        {translate('host.evening.rounds')}
      </span>
      <ul aria-labelledby={labelId} className='rounds'>
        {rowsOf(lineUp).map(({ at, entry, key }) => {
          const timesPlayed = played[at] ?? 0
          const stamp = eveningStampOf({
            entry,
            isEveningOver,
            isNext: at === lineUpAt,
            isOnlyEntry: lineUp.length < 2,
            phase: view.phase,
            played: timesPlayed
          })

          return (
            <li
              data-played-out={stamp === 'played' || undefined}
              key={key}
              style={{ '--spine': `var(--spine-${entry.kind})` }}
            >
              <AriaButton
                className='round'
                onPress={() => {
                  onOpen(at)
                }}
              >
                <span className='band' />
                <GameIcon game={entry.kind} />
                <span className='name'>
                  {translate(gameNameKey(entry.kind))}
                </span>
                <span className='detail'>{detailOf(entry)}</span>
                {stamp !== null && (
                  <EveningStamp kind={stamp} played={timesPlayed} />
                )}
                <ChevronRightIcon className='chevron' />
              </AriaButton>
            </li>
          )
        })}
        {lineUp.length < LINE_UP_MAX_ENTRIES && (
          <li className='add'>
            <AriaButton className='round' isDisabled={!isLive} onPress={onAdd}>
              <span className='band' />
              <PlusIcon />
              <span className='name'>{translate('host.evening.add')}</span>
              <ChevronRightIcon className='chevron' />
            </AriaButton>
          </li>
        )}
      </ul>
      {lineUp.length > 1 && (
        <EveningChanceLine
          isLive={isLive}
          onSettingsChange={onSettingsChange}
          view={view}
        />
      )}
    </div>
  )
}

const EveningChanceLine: React.FC<{
  isLive: boolean
  onSettingsChange: (settings: RoomSettings) => void
  view: HostRoomView
}> = ({ isLive, onSettingsChange, view }) => {
  const translate = useTranslate()
  const { settings } = view
  const chance = eveningChance({
    lineUp: settings.lineUp,
    played: view.lineUpPlayed,
    roundCount: settings.roundCount,
    roundsOpened: view.round?.index ?? 0
  })
  const amongGames = (fillers: readonly GameKind[]) =>
    translate('host.evening.chance.among', {
      games: fillers.map((game) => translate(gameNameKey(game))).join(', ')
    })

  switch (chance.kind) {
    case 'over': {
      const raised = roundCountHolding(chance.needed)

      return (
        <div className='evening-chance' data-over>
          <span className='count'>{chance.excess}</span>
          <span className='said'>
            <span className='headline'>
              {translate('host.evening.chance.over', {
                total: settings.roundCount ?? 0
              })}
            </span>
            <span className='hint'>
              {translate('host.evening.chance.overHint')}
            </span>
          </span>
          {raised >= chance.needed && (
            <Button
              className='raise'
              isDisabled={!isLive}
              onPress={() => {
                onSettingsChange({ ...settings, roundCount: raised })
              }}
              size='small'
              variant='outlined'
            >
              {translate('host.evening.chance.raise', { count: raised })}
            </Button>
          )}
        </div>
      )
    }
    case 'closed':
      return (
        <ChanceSaid
          count='0'
          headline={translate('host.evening.chance.closed')}
          hint={translate('host.evening.chance.closedHint')}
        />
      )
    case 'endless':
      return (
        <ChanceSaid
          count='∞'
          headline={translate('host.evening.chance.endless')}
          hint={amongGames(chance.fillers)}
        />
      )
    case 'counted':
      return chance.count === 0 ? (
        <ChanceSaid
          count='0'
          headline={translate('host.evening.chance.none')}
          hint={translate('host.evening.chance.noneHint')}
        />
      ) : (
        <ChanceSaid
          count={String(chance.count)}
          headline={translate('host.evening.chance.counted', {
            count: chance.count
          })}
          hint={amongGames(chance.fillers)}
        />
      )
  }
}

const ChanceSaid: React.FC<{
  count: string
  headline: string
  hint: string
}> = ({ count, headline, hint }) => (
  <div className='evening-chance'>
    <span className='count'>{count}</span>
    <span className='said'>
      <span className='headline'>{headline}</span>
      <span className='hint'>{hint}</span>
    </span>
  </div>
)
