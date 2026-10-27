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
import {
  type HostRoomView,
  LINE_UP_MAX_ENTRIES,
  type RoomSettings
} from '@melee/protocol/room'

import { capabilitiesOf } from '@melee/core/room/game-capabilities'
import type { HostPreferences } from '@melee/core/room/host-preferences'
import { ROUND_COUNT_STEPS } from '@melee/core/room/room-settings'
import type { ComingRound } from '@melee/core/room/running-order'

import { Button } from '@/presentation/components/button'
import {
  ChevronRightIcon,
  DiceIcon,
  GameIcon,
  GripIcon,
  PlusIcon
} from '@/presentation/components/icons'
import { useRowsTravel } from '@/presentation/components/use-rows-travel'
import { useTouchReorder } from '@/presentation/components/use-touch-reorder'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'
import { useLineUpEntrySummaries } from '@/presentation/i18n/line-up-entry-names'
import { gameNameKey } from '@/presentation/i18n/translation'

import { arrangedEvening, eveningOrderOf } from './evening-order'
import { EveningStamp, eveningStampOf } from './evening-stamp'

import './evening-rounds.sass'

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

const spineOf = (game: GameKind): React.CSSProperties => ({
  '--spine': `var(--spine-${game})`,
  '--spine-ink': `var(--on-spine-${game})`
})

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
 * The evening as its planned games, under a heading saying how many rounds it
 * holds: a row per entry still to come, numbered in its spine, saying what it
 * is set to and opening its page, put in order by drag — the server dealt it
 * the moment the evening was made — then a row for the rounds drawn once they
 * are played. A room of one game is that game's row alone, fixed once played
 * if the host brought it.
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
  const { lineUp } = view.settings
  const { coming, isDrawn, isEveningOver, upcoming } = eveningOrderOf(view)
  const addRow = lineUp.length < LINE_UP_MAX_ENTRIES && (
    <AriaButton className='round' isDisabled={!isLive} onPress={onAdd}>
      <span className='band'>
        <PlusIcon />
      </span>
      <span className='name'>{translate('host.evening.add')}</span>
      <span className='detail'>{translate('host.evening.addHint')}</span>
      <ChevronRightIcon className='chevron' />
    </AriaButton>
  )
  const onlyEntry = lineUp[0]

  return (
    <section className='evening-rounds'>
      <EveningHeading
        firstNumber={(coming[0]?.roundAt ?? upcoming) + 1}
        isEveningOver={isEveningOver}
        view={view}
      />
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
          {!isEveningOver && (
            <DrawnRounds
              coming={coming}
              settings={view.settings}
              upcoming={upcoming}
            />
          )}
          {addRow !== false && <div className='add'>{addRow}</div>}
        </div>
      )}
      {lineUp.length > 1 && (
        <OverTheCount
          coming={coming}
          isLive={isLive}
          onSettingsChange={onSettingsChange}
          settings={view.settings}
        />
      )}
    </section>
  )
}

/**
 * Before the game, how many rounds the evening holds; once it is under way,
 * which of them are still to come.
 */
const EveningHeading: React.FC<{
  /** The number of the first round the list shows. */
  firstNumber: number
  isEveningOver: boolean
  view: HostRoomView
}> = ({ firstNumber, isEveningOver, view }) => {
  const translate = useTranslate()
  const { roundCount } = view.settings
  const isLobby = view.phase === 'lobby'

  const span = (() => {
    if (isLobby) {
      return roundCount === null
        ? translate('host.evening.span.endless')
        : translate('host.evening.span.all', { count: roundCount })
    }

    if (isEveningOver) {
      return null
    }

    if (roundCount === null) {
      return translate('host.evening.span.from', { from: firstNumber })
    }

    if (firstNumber === roundCount) {
      return translate('host.evening.span.last', { number: roundCount })
    }

    return firstNumber < roundCount
      ? translate('host.evening.span.rest', {
          from: firstNumber,
          to: roundCount
        })
      : null
  })()

  return (
    <h3 className='evening-heading'>
      {translate(isLobby ? 'host.evening.rounds' : 'host.evening.next')}
      {span !== null && <span className='span'>{span}</span>}
    </h3>
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
      style={spineOf(entry.kind)}
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
  const order = rounds.map((round) => round.id).join(' ')

  const arrange = ({ at, ids }: { at: number; ids: ReadonlySet<string> }) => {
    remember()

    const moving = rounds.filter((round) => ids.has(round.id))
    const rest = rounds.filter((round) => !ids.has(round.id))

    onArrange(rest.toSpliced(at, 0, ...moving).map((round) => round.at))
  }

  useTouchReorder({
    grip: '.grip',
    list,
    onMove: (id, at) => {
      arrange({ at, ids: new Set([id]) })
    },
    order
  })

  const remember = useRowsTravel({ list, order, pace: 'reorder' })

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    // Disabled rather than withheld: `GridList` calls the drag hooks only when
    // it is handed them, so handing them over mid-life changes its hook order
    // and React throws — which is what the first round's start used to do.
    isDisabled: !isEditable,
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
      dragAndDropHooks={dragAndDropHooks}
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
            style={entry === undefined ? undefined : spineOf(entry.kind)}
            textValue={translate('host.evening.roundNamed', { name, number })}
          >
            <span className='band'>{number}</span>
            {isEditable && (
              <AriaButton
                aria-label={translate('host.evening.drag', { name, number })}
                className='grip'
                slot='drag'
              >
                <GripIcon />
              </AriaButton>
            )}
            {entry !== undefined && <GameIcon game={entry.kind} />}
            <span className='name'>{name}</span>
            {summary?.settings != null && (
              <span className='detail'>{summary.settings}</span>
            )}
            {round.isPastTheEnd && <EveningStamp kind='beyond' played={0} />}
            <ChevronRightIcon className='chevron' />
          </GridListItem>
        )
      }}
    </GridList>
  )
}

/**
 * The rounds past the evening's rows, drawn as they come: so many, or until
 * the host stops. Nothing when a row already lies past the count.
 */
const DrawnRounds: React.FC<{
  coming: readonly ComingRound[]
  settings: RoomSettings
  /** The round about to open, counted from 0. */
  upcoming: number
}> = ({ coming, settings, upcoming }) => {
  const translate = useTranslate()

  if (coming.some((round) => round.isPastTheEnd)) {
    return null
  }

  const from = (coming.at(-1)?.roundAt ?? upcoming - 1) + 2
  const { roundCount } = settings

  if (roundCount !== null && roundCount < from) {
    return null
  }

  const among = translate('host.evening.chance.among', {
    games: fillersOf(settings.lineUp)
      .map((game) => translate(gameNameKey(game)))
      .join(', ')
  })

  return (
    <div className='drawn-rounds'>
      <span className='band'>
        {roundCount === null
          ? `${from}+`
          : roundCount === from
            ? from
            : `${from}–${roundCount}`}
      </span>
      <DiceIcon />
      <span className='name'>
        {roundCount === null
          ? translate('host.evening.chance.endless')
          : translate('host.evening.chance.drawn', {
              count: roundCount - from + 1
            })}
      </span>
      <span className='detail'>{among}</span>
    </div>
  )
}

/** How many rounds the count lacks for every entry the host brought. */
const OverTheCount: React.FC<{
  coming: readonly ComingRound[]
  isLive: boolean
  onSettingsChange: (settings: RoomSettings) => void
  settings: RoomSettings
}> = ({ coming, isLive, onSettingsChange, settings }) => {
  const translate = useTranslate()
  const pastTheEnd = coming.filter((round) => round.isPastTheEnd)
  const lastPast = pastTheEnd.at(-1)

  if (lastPast === undefined) {
    return null
  }

  const needed = lastPast.roundAt + 1
  const raised = roundCountHolding(needed)

  return (
    <div className='evening-chance'>
      <span className='count'>{pastTheEnd.length}</span>
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
