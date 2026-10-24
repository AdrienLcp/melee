import type React from 'react'
import { useRef } from 'react'
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
  orderWithComingRounds
} from '@melee/core/room/running-order'

import { Button } from '@/presentation/components/button'
import {
  ChevronRightIcon,
  GameIcon,
  GripIcon,
  PlusIcon
} from '@/presentation/components/icons'
import { useTouchReorder } from '@/presentation/components/use-touch-reorder'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'
import { useLineUpEntrySummaries } from '@/presentation/i18n/line-up-entry-names'
import { gameNameKey } from '@/presentation/i18n/translation'

import { EveningStamp, eveningStampOf } from './evening-stamp'

import './evening-rounds.sass'

/**
 * The counts the setup's strip offers, which a raised evening lands on when it
 * can. Forty is every game ticked in the lobby, four rounds each.
 */
export const ROUND_COUNT_STEPS = [5, 10, 20, 30, 40] as const

/** The protocol's ceiling on a room's round count. */
const MAX_ROUND_COUNT = 50

const roundCountHolding = (needed: number): number =>
  ROUND_COUNT_STEPS.find((step) => step >= needed) ??
  Math.min(needed, MAX_ROUND_COUNT)

/** The games the rounds past the evening's rows are drawn among: those serving their own content, or every one when none does. */
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
 * The evening as its planned games: a numbered row per entry still to come,
 * saying what it is set to and opening its page, put in order by drag — the
 * server dealt it the moment the evening was made — and a line under them for
 * the rounds drawn once they are played. A room of one game is that game's row
 * alone, fixed once played if the host brought it.
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
  const roundsLabel = translate('host.evening.rounds')
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
  const coming = comingRounds({
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
  const onlyEntry = lineUp[0]

  return (
    <div className='evening-rounds'>
      {lineUp.length < 2 ? (
        <ul aria-label={roundsLabel} className='rounds'>
          {onlyEntry !== undefined && (
            <OnlyRound
              entry={onlyEntry}
              isEveningOver={isEveningOver}
              onOpen={onOpen}
              view={view}
            />
          )}
          {addRow !== false && <li className='add'>{addRow}</li>}
        </ul>
      ) : (
        <div className='rounds' data-ordered>
          <OrderedRounds
            coming={coming}
            isEditable={isLive && isDrawn}
            label={roundsLabel}
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
          settings={view.settings}
          upcoming={upcoming}
        />
      )}
    </div>
  )
}

const OnlyRound: React.FC<{
  entry: GameSettings
  isEveningOver: boolean
  onOpen: (at: number) => void
  view: HostRoomView
}> = ({ entry, isEveningOver, onOpen, view }) => {
  const [summary] = useLineUpEntrySummaries([entry])
  const timesPlayed = view.lineUpPlayed[0] ?? 0
  const stamp = eveningStampOf({
    entry,
    isEveningOver,
    isNext: view.settings.lineUpAt === 0,
    isOnlyEntry: true,
    phase: view.phase,
    played: timesPlayed
  })

  return (
    <li
      data-played-out={stamp === 'played' || undefined}
      style={{ '--spine': `var(--spine-${entry.kind})` }}
    >
      <AriaButton
        className='round'
        onPress={() => {
          onOpen(0)
        }}
      >
        <span className='band' />
        <GameIcon game={entry.kind} />
        <span className='name'>{summary?.name}</span>
        {summary?.settings != null && (
          <span className='detail'>{summary.settings}</span>
        )}
        {stamp !== null && <EveningStamp kind={stamp} played={timesPlayed} />}
        <ChevronRightIcon className='chevron' />
      </AriaButton>
    </li>
  )
}

/**
 * The evening once a drag has put the rounds to come in `rows`' order. A round
 * put first is the next one, so the room moves onto its entry.
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
  rows: readonly number[]
  /** The round about to open, counted from 0. */
  upcoming: number
  view: HostRoomView
}): RoomSettings => {
  const { settings } = view
  const runningOrder = orderWithComingRounds({
    order: settings.runningOrder,
    rows,
    upcoming
  })
  const first = rows[0]
  const entry = first === undefined ? undefined : settings.lineUp[first]

  if (first === undefined || entry === undefined) {
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

  return { ...moved, runningOrder }
}

/**
 * Each round to come with a key that follows it through a drag: which of the
 * rounds on its entry it is.
 */
const keyedRounds = (coming: readonly ComingRound[]) =>
  coming.map((round, index) => {
    const nth = coming
      .slice(0, index)
      .filter((other) => other.at === round.at).length

    return { ...round, id: `entry:${round.at}:${nth}` }
  })

const OrderedRounds: React.FC<{
  coming: readonly ComingRound[]
  /** Between two rounds, on a live socket: the order can still move. */
  isEditable: boolean
  label: string
  onArrange: (rows: number[]) => void
  onOpen: (at: number) => void
  view: HostRoomView
}> = ({ coming, isEditable, label, onArrange, onOpen, view }) => {
  const translate = useTranslate()
  const { lineUp } = view.settings
  const summaries = useLineUpEntrySummaries(lineUp)
  const rounds = keyedRounds(coming)
  const list = useRef<HTMLDivElement>(null)

  const arrange = ({ at, ids }: { at: number; ids: ReadonlySet<string> }) => {
    const moving = rounds.filter((round) => ids.has(round.id))
    const rest = rounds.filter((round) => !ids.has(round.id))

    onArrange(rest.toSpliced(at, 0, ...moving).map((round) => round.at))
  }

  useTouchReorder({
    grip: '.grip',
    list,
    onMove: (id, at) => {
      arrange({ at, ids: new Set([id]) })
    }
  })

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onReorder: ({ keys, target }) => {
      const ids = new Set([...keys].map(String))
      const targetAt = rounds
        .filter((round) => !ids.has(round.id))
        .findIndex((round) => round.id === target.key)

      arrange({
        at: target.dropPosition === 'after' ? targetAt + 1 : targetAt,
        ids
      })
    },
    renderDropIndicator: (target) => (
      <DropIndicator className='drop-line' target={target} />
    )
  })

  return (
    <GridList
      aria-label={label}
      className='order'
      dragAndDropHooks={isEditable ? dragAndDropHooks : undefined}
      items={rounds}
      onAction={(key) => {
        const at = rounds.find((round) => round.id === key)?.at

        if (at !== undefined) {
          onOpen(at)
        }
      }}
      ref={list}
    >
      {(round) => {
        const entry = lineUp[round.at]
        const summary = summaries[round.at]
        const name = summary?.name ?? ''
        const number = round.roundAt + 1

        return (
          <GridListItem
            className='order-round'
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
            {entry !== undefined && <GameIcon game={entry.kind} />}
            <span className='name'>{name}</span>
            {summary?.settings != null && (
              <span className='detail'>{summary.settings}</span>
            )}
            {round.isPastTheEnd ? (
              <EveningStamp kind='beyond' played={0} />
            ) : (
              round.roundAt === (view.round?.index ?? 0) && (
                <EveningStamp
                  kind={view.phase === 'lobby' ? 'first' : 'next'}
                  played={0}
                />
              )
            )}
            <ChevronRightIcon className='chevron' />
          </GridListItem>
        )
      }}
    </GridList>
  )
}

/**
 * What the list cannot show: how many rounds the count lacks for every entry
 * the host brought, or the rounds drawn past the rows — so many, or until the
 * host stops.
 */
const EveningChanceLine: React.FC<{
  coming: readonly ComingRound[]
  isLive: boolean
  onSettingsChange: (settings: RoomSettings) => void
  settings: RoomSettings
  /** The round about to open, counted from 0. */
  upcoming: number
}> = ({ coming, isLive, onSettingsChange, settings, upcoming }) => {
  const translate = useTranslate()
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

  const among = translate('host.evening.chance.among', {
    games: fillersOf(settings.lineUp)
      .map((game) => translate(gameNameKey(game)))
      .join(', ')
  })

  if (settings.roundCount === null) {
    return (
      <ChanceSaid
        count='∞'
        headline={translate('host.evening.chance.endless')}
        hint={among}
      />
    )
  }

  const drawn =
    settings.roundCount - ((coming.at(-1)?.roundAt ?? upcoming - 1) + 1)

  return drawn > 0 ? (
    <ChanceSaid
      count={String(drawn)}
      headline={translate('host.evening.chance.rest', { count: drawn })}
      hint={among}
    />
  ) : null
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
  hint?: string
}> = ({ count, headline, hint }) => (
  <div className='evening-chance'>
    <span className='count'>{count}</span>
    <span className='said'>
      <span className='headline'>{headline}</span>
      {hint !== undefined && <span className='hint'>{hint}</span>}
    </span>
  </div>
)
