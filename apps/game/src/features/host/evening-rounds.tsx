import type React from 'react'
import { useId } from 'react'
import {
  Button as AriaButton,
  DropIndicator,
  GridList,
  GridListItem,
  useDragAndDrop
} from 'react-aria-components'

import type { GameKind, GameSettings } from '@melee/protocol/game'
import type { Locale } from '@melee/protocol/locale'
import {
  type HostRoomView,
  LINE_UP_MAX_ENTRIES,
  type RoomSettings
} from '@melee/protocol/room'

import { eveningChance } from '@melee/core/room/evening-chance'
import { capabilitiesOf } from '@melee/core/room/game-capabilities'
import {
  type HostPreferences,
  rememberedSetupFor
} from '@melee/core/room/host-preferences'
import { endsTheEvening } from '@melee/core/room/next-game'
import { isRoundInPlay } from '@melee/core/room/room-phase'
import { movedToEntry } from '@melee/core/room/room-settings'
import {
  type ComingRound,
  comingRounds,
  listedOrder,
  orderWithComingRounds,
  scheduledEntryAt
} from '@melee/core/room/running-order'

import { Button } from '@/presentation/components/button'
import {
  ChevronRightIcon,
  DiceIcon,
  GameIcon,
  GripIcon,
  PlusIcon
} from '@/presentation/components/icons'
import { Switch } from '@/presentation/components/switch'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'
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

/** The games a chance round is drawn among: those serving their own content, or every one when none does. */
const fillersOf = (lineUp: readonly GameSettings[]): GameKind[] => {
  const games = [...new Set(lineUp.map((entry) => entry.kind))]
  const serving = games.filter(
    (game) => capabilitiesOf(game).servesItsOwnContent
  )

  return serving.length > 0 ? serving : games
}

type EveningRoundsProps = {
  /** The socket is open: adding a round leads to a press that sends one. */
  isLive: boolean
  /** Opens the shelf to add a round from. */
  onAdd: () => void
  /** Opens the page of the line-up's entry at that index. */
  onOpen: (at: number) => void
  onSettingsChange: (settings: RoomSettings) => void
  /** What this host last left each game set to, for the entry a drag puts first. */
  preferences: HostPreferences | null
  view: HostRoomView
}

/**
 * The evening as a short list of its rounds, each opening a page of its own,
 * and a line under it saying how many rounds the draw is left to fill. A round
 * the host brought is fixed once played, and the list says so before anyone
 * opens it.
 *
 * *In order* turns the list into the evening's running order: a numbered row
 * per round still to come, the chance rounds among them, put in order by drag.
 */
export const EveningRounds: React.FC<EveningRoundsProps> = ({
  isLive,
  onAdd,
  onOpen,
  onSettingsChange,
  preferences,
  view
}) => {
  const { locale, translate } = useI18n()
  const detailOf = useLineUpEntryDetail()
  const labelId = useId()
  const { lineUp, lineUpAt, roundCount, runningOrder } = view.settings
  const played = view.lineUpPlayed
  const isEveningOver =
    view.phase === 'revealed' &&
    endsTheEvening({
      lineUp,
      played,
      roundCount,
      roundIndex: view.round?.index ?? 0
    })
  const upcoming = view.round?.index ?? 0
  const isDrawn = !isRoundInPlay(view.phase) && !isEveningOver
  const isEditable = isLive && isDrawn
  const coming =
    runningOrder === null
      ? null
      : comingRounds({
          drawnAt: isDrawn ? lineUpAt : null,
          order: runningOrder,
          roundCount,
          upcoming
        })
  const addRow = lineUp.length < LINE_UP_MAX_ENTRIES && (
    <AriaButton className='round' isDisabled={!isLive} onPress={onAdd}>
      <span className='band' />
      <PlusIcon />
      <span className='name'>{translate('host.evening.add')}</span>
      <ChevronRightIcon className='chevron' />
    </AriaButton>
  )

  return (
    <div className='evening-rounds'>
      <div className='rounds-head'>
        <span className='rounds-label' id={labelId}>
          {translate('host.evening.rounds')}
        </span>
        {(lineUp.length > 1 || runningOrder !== null) && (
          <Switch
            className='in-order'
            isDisabled={!isEditable}
            isSelected={runningOrder !== null}
            label={translate('host.evening.inOrder')}
            onChange={(isOrdered) => {
              onSettingsChange({
                ...view.settings,
                runningOrder: isOrdered
                  ? listedOrder({
                      lineUp,
                      lineUpAt,
                      played,
                      roundCount,
                      upcoming
                    })
                  : null
              })
            }}
          />
        )}
      </div>
      {coming === null ? (
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
          {addRow !== false && <li className='add'>{addRow}</li>}
        </ul>
      ) : (
        <div className='rounds' data-ordered>
          <OrderedRounds
            coming={coming}
            isEditable={isEditable}
            labelId={labelId}
            onArrange={(rows) => {
              onSettingsChange(
                arrangedEvening({ locale, preferences, rows, upcoming, view })
              )
            }}
            onOpen={onOpen}
            view={view}
          />
          {addRow !== false && <div className='add'>{addRow}</div>}
        </div>
      )}
      {lineUp.length > 1 && (
        <EveningChanceLine
          coming={coming}
          isLive={isLive}
          onSettingsChange={onSettingsChange}
          view={view}
        />
      )}
    </div>
  )
}

/**
 * The evening once a drag has put the rounds to come in `rows`' order. A round
 * put first is the next one, so the room moves onto its entry; a chance round
 * put first is drawn there and then, so the list never says *By chance* over
 * a game the room already shows.
 */
const arrangedEvening = ({
  locale,
  preferences,
  rows,
  upcoming,
  view
}: {
  locale: Locale
  preferences: HostPreferences | null
  rows: readonly (number | null)[]
  /** The round about to open, counted from 0. */
  upcoming: number
  view: HostRoomView
}): RoomSettings => {
  const { settings } = view
  const runningOrder = orderWithComingRounds({
    order: settings.runningOrder ?? [],
    rows,
    upcoming
  })
  const first =
    rows[0] ??
    scheduledEntryAt({
      lastAt: view.round?.lineUpAt ?? null,
      lineUp: settings.lineUp,
      order: runningOrder,
      played: view.lineUpPlayed,
      random: Math.random,
      roundAt: upcoming,
      roundsLeft:
        settings.roundCount === null ? null : settings.roundCount - upcoming
    })
  const entry = first === null ? undefined : settings.lineUp[first]

  if (first === null || entry === undefined) {
    return { ...settings, runningOrder }
  }

  const moved =
    first === settings.lineUpAt
      ? settings
      : movedToEntry({
          at: first,
          locale,
          remembered: rememberedSetupFor({ game: entry.kind, preferences }),
          settings
        })

  return { ...moved, runningOrder: runningOrder.with(upcoming, first) }
}

/**
 * Each round to come with a key that follows it through a drag: which of the
 * rounds on its entry it is, or which of the chance rounds.
 */
const keyedRounds = (coming: readonly ComingRound[]) =>
  coming.map((round, index) => {
    const nth = coming
      .slice(0, index)
      .filter((other) => other.at === round.at).length

    return {
      ...round,
      id: round.at === null ? `chance:${nth}` : `entry:${round.at}:${nth}`
    }
  })

const OrderedRounds: React.FC<{
  coming: readonly ComingRound[]
  /** Between two rounds, on a live socket: the order can still move. */
  isEditable: boolean
  labelId: string
  onArrange: (rows: (number | null)[]) => void
  onOpen: (at: number) => void
  view: HostRoomView
}> = ({ coming, isEditable, labelId, onArrange, onOpen, view }) => {
  const translate = useTranslate()
  const detailOf = useLineUpEntryDetail()
  const { lineUp } = view.settings
  const rounds = keyedRounds(coming)

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onReorder: ({ keys, target }) => {
      const moving = rounds.filter((round) => keys.has(round.id))
      const rest = rounds.filter((round) => !keys.has(round.id))
      const targetAt = rest.findIndex((round) => round.id === target.key)

      onArrange(
        rest
          .toSpliced(
            target.dropPosition === 'after' ? targetAt + 1 : targetAt,
            0,
            ...moving
          )
          .map((round) => round.at)
      )
    },
    renderDropIndicator: (target) => (
      <DropIndicator className='drop-line' target={target} />
    )
  })

  return (
    <GridList
      aria-labelledby={labelId}
      className='order'
      dragAndDropHooks={isEditable ? dragAndDropHooks : undefined}
      items={rounds}
      onAction={(key) => {
        const at = rounds.find((round) => round.id === key)?.at

        if (at != null) {
          onOpen(at)
        }
      }}
    >
      {(round) => {
        const entry = round.at === null ? undefined : lineUp[round.at]
        const name =
          entry === undefined
            ? translate('host.evening.byChance')
            : translate(gameNameKey(entry.kind))
        const number = round.roundAt + 1

        return (
          <GridListItem
            className='order-round'
            data-chance={entry === undefined || undefined}
            data-past-the-end={round.isPastTheEnd || undefined}
            style={
              entry === undefined
                ? undefined
                : { '--spine': `var(--spine-${entry.kind})` }
            }
            textValue={translate('host.evening.roundNamed', { name, number })}
          >
            {isEditable && (
              <AriaButton
                aria-label={translate('host.evening.drag', { name, number })}
                className='grip'
                slot='drag'
              >
                <GripIcon />
              </AriaButton>
            )}
            <span className='number'>{number}</span>
            <span className='band' />
            {entry === undefined ? (
              <DiceIcon />
            ) : (
              <GameIcon game={entry.kind} />
            )}
            <span className='name'>{name}</span>
            {entry !== undefined && (
              <span className='detail'>{detailOf(entry)}</span>
            )}
            {round.isPastTheEnd ? (
              <EveningStamp kind='beyond' played={0} />
            ) : (
              round.roundAt === (view.round?.index ?? 0) &&
              entry !== undefined && (
                <EveningStamp
                  kind={view.phase === 'lobby' ? 'first' : 'next'}
                  played={0}
                />
              )
            )}
            {entry !== undefined && <ChevronRightIcon className='chevron' />}
          </GridListItem>
        )
      }}
    </GridList>
  )
}

const EveningChanceLine: React.FC<{
  /** The rounds still to come of an evening in order, `null` while it is drawn. */
  coming: readonly ComingRound[] | null
  isLive: boolean
  onSettingsChange: (settings: RoomSettings) => void
  view: HostRoomView
}> = ({ coming, isLive, onSettingsChange, view }) => {
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

  if (coming !== null) {
    const pastTheEnd = coming.filter((round) => round.isPastTheEnd)
    const lastPast = pastTheEnd.at(-1)

    if (lastPast !== undefined) {
      return (
        <OverTheCount
          excess={pastTheEnd.length}
          isLive={isLive}
          needed={lastPast.roundAt + 1}
          onSettingsChange={onSettingsChange}
          settings={settings}
        />
      )
    }

    if (chance.kind === 'endless') {
      return (
        <ChanceSaid
          count='∞'
          headline={translate('host.evening.chance.endless')}
          hint={amongGames(fillersOf(settings.lineUp))}
        />
      )
    }

    const chanceRounds = coming.filter((round) => round.at === null).length

    return chanceRounds === 0 ? null : (
      <ChanceSaid
        count={String(chanceRounds)}
        headline={translate('host.evening.chance.counted', {
          count: chanceRounds
        })}
        hint={amongGames(fillersOf(settings.lineUp))}
      />
    )
  }

  switch (chance.kind) {
    case 'over':
      return (
        <OverTheCount
          excess={chance.excess}
          isLive={isLive}
          needed={chance.needed}
          onSettingsChange={onSettingsChange}
          settings={settings}
        />
      )
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

const OverTheCount: React.FC<{
  excess: number
  isLive: boolean
  /** The count that would hold every round the host brought. */
  needed: number
  onSettingsChange: (settings: RoomSettings) => void
  settings: RoomSettings
}> = ({ excess, isLive, needed, onSettingsChange, settings }) => {
  const translate = useTranslate()
  const raised = roundCountHolding(needed)

  return (
    <div className='evening-chance' data-over>
      <span className='count'>{excess}</span>
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
      {raised >= needed && (
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
