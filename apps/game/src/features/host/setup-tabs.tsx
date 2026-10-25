import type React from 'react'
import { useState } from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { HostRoomView, RoomSettings } from '@melee/protocol/room'
import type { TrackSource } from '@melee/protocol/track'

import {
  type HostPreferences,
  rememberedSetupFor
} from '@melee/core/room/host-preferences'
import { isRoundInPlay } from '@melee/core/room/room-phase'
import {
  savedEveningOf,
  withSavedEvening
} from '@melee/core/room/saved-evening'

import { PointsRows } from '@/presentation/components/points-rows'
import { Scoreboard } from '@/presentation/components/scoreboard'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'

import { AutoAdvanceChoice } from './auto-advance-choice'
import { BoardSetup } from './board-setup'
import { EveningAddPage } from './evening-add-page'
import { EveningEntryPage } from './evening-entry-page'
import { EveningRounds, ROUND_COUNT_STEPS } from './evening-rounds'
import { GamePicker } from './game-picker'
import { GamePitch } from './lobby-stage'
import { NO_LIMIT, NumberChoice, useDurationLabels } from './number-choice'
import { RoomScene } from './room-scene'
import { SavedEveningsDoor, SavedEveningsPage } from './saved-evenings-page'
import { TeamsSetup } from './teams-setup'
import { useSavedEvenings } from './use-saved-evenings'
import { useSetupSummaries } from './use-settings-summary'

import './setup-tabs.sass'

/**
 * The strip's counts, with the one the room is on when it is none of them —
 * three games ticked in the lobby make twelve, and a strip with nothing pressed
 * says the evening has no length.
 */
const roundCountOptions = (roundCount: number | null): number[] =>
  roundCount === null || ROUND_COUNT_STEPS.some((step) => step === roundCount)
    ? [...ROUND_COUNT_STEPS, NO_LIMIT]
    : [...ROUND_COUNT_STEPS, roundCount]
        .toSorted((a, b) => a - b)
        .concat(NO_LIMIT)
const COUNTDOWN_DURATIONS_MS = [3_000, 5_000, 10_000] as const

export type SetupTabsProps = {
  /** What the picker is showing, which the launch has not committed yet. */
  draftSource: TrackSource | null
  /** The socket is open. Everything inside sends a frame, so none of it works without it. */
  isLive: boolean
  /** Must be stable — the picker reports upward from an effect. */
  onDraftSource: (source: TrackSource | null) => void
  /** Lets the room's screen go, so this one is the speaker again. */
  onDismissWall: () => void
  /** Gives up the seat this console holds. */
  onLeaveSeat: () => void
  /** Files one key of the slate's answer key on this tab. */
  onRememberSlateKey: (itemIndex: number, key: string) => void
  /** Takes a seat off the table; this console's own is left rather than removed. */
  onRemovePlayer: (playerId: PlayerId) => void
  onSettingsChange: (settings: RoomSettings) => void
  onTakeSeat: (nickname: string) => void
  /** What this host last left each game set to, so picking one restores it. */
  preferences: HostPreferences | null
  /** The slate's answer key as typed on this tab, never sent before the sheet opens. */
  preparedSlateKeys: readonly (string | null)[]
  /** The slate's key and item names while its sheets are open and no wall is marking them. */
  slateEditors: React.ReactNode
  view: HostRoomView
}

/** What the games tab shows: the shelf and the planned games, or one page of the evening in their place. */
type GamePage =
  | { kind: 'adding' }
  | { at: number; kind: 'entry' }
  | { kind: 'list' }
  | { kind: 'saved' }

/**
 * What the table plays. In the lobby the shelf comes first, because it is the
 * decision the room is waiting on; past it the planned games are what is left
 * to change, each opening a page of its own — a quiz's subjects alone run to
 * nine rows.
 */
export const GameTab: React.FC<SetupTabsProps> = ({
  draftSource,
  isLive,
  onDraftSource,
  onRememberSlateKey,
  onSettingsChange,
  preferences,
  preparedSlateKeys,
  slateEditors,
  view
}) => {
  const { locale } = useI18n()
  const [page, setPage] = useState<GamePage>({ kind: 'list' })
  const saved = useSavedEvenings()
  const backToList = () => {
    setPage({ kind: 'list' })
  }

  if (page.kind === 'saved') {
    return (
      <SavedEveningsPage
        evenings={saved.evenings}
        isLive={isLive}
        onBack={backToList}
        onForget={saved.forget}
        onImport={saved.importEvenings}
        onRun={(evening) => {
          onSettingsChange(
            withSavedEvening({
              evening,
              locale,
              rememberedFor: (game) =>
                rememberedSetupFor({ game, preferences }),
              settings: view.settings
            })
          )
          backToList()
        }}
        onSave={(name) => {
          saved.save(savedEveningOf({ name, settings: view.settings }))
        }}
        view={view}
      />
    )
  }

  if (page.kind === 'entry') {
    return (
      <EveningEntryPage
        at={page.at}
        draftSource={draftSource}
        isLive={isLive}
        onBack={backToList}
        onDraftSource={onDraftSource}
        onRememberSlateKey={onRememberSlateKey}
        onSettingsChange={onSettingsChange}
        preferences={preferences}
        preparedSlateKeys={preparedSlateKeys}
        view={view}
      />
    )
  }

  if (page.kind === 'adding') {
    return (
      <EveningAddPage
        isLive={isLive}
        onAdded={(added, at) => {
          onSettingsChange(added)
          setPage({ at, kind: 'entry' })
        }}
        onBack={backToList}
        preferences={preferences}
        settings={view.settings}
      />
    )
  }

  return (
    <>
      {slateEditors}
      {view.phase === 'lobby' && (
        <div className='game-choice'>
          <GamePicker
            isDisabled={!isLive}
            isSeated={view.youId !== null}
            onChange={onSettingsChange}
            preferences={preferences}
            settings={view.settings}
          />
          <GamePitch isUnattended={false} view={view} />
        </div>
      )}
      {view.settings.game !== null && (
        <EveningRounds
          isLive={isLive}
          onAdd={() => {
            setPage({ kind: 'adding' })
          }}
          onOpen={(at) => {
            setPage({ at, kind: 'entry' })
          }}
          onSettingsChange={onSettingsChange}
          preferences={preferences}
          view={view}
        />
      )}
      {(view.settings.game !== null ||
        (view.phase === 'lobby' && saved.evenings.length > 0)) && (
        <SavedEveningsDoor
          count={saved.evenings.length}
          isDisabled={!isLive}
          onOpen={() => {
            setPage({ kind: 'saved' })
          }}
        />
      )}
    </>
  )
}

/** Above the controls it greys out, because a host who has already pressed one has decided it is broken. */
const HeldNote: React.FC<{ view: HostRoomView }> = ({ view }) => {
  const translate = useTranslate()

  return isRoundInPlay(view.phase) ? (
    <p className='held'>{translate('host.setup.roundInPlay')}</p>
  ) : null
}

/**
 * The evening's shape: the teams, the board, the judge and the length. The
 * server refuses a new deal or a new board once the game runs, so past the
 * lobby the two are one line saying what they were settled on rather than
 * controls drawn dead.
 */
export const TableTab: React.FC<SetupTabsProps> = ({
  draftSource,
  isLive,
  onSettingsChange,
  preferences,
  view
}) => {
  const translate = useTranslate()
  const settings = view.settings
  const summaries = useSetupSummaries({ draftSource, settings })
  const isInLobby = view.phase === 'lobby'
  const teams = settings.teams

  return (
    <>
      <HeldNote view={view} />
      {isInLobby ? (
        <>
          <p className='tab-summary'>{summaries.table}</p>
          <TeamsSetup
            hasPhones={view.players.some((player) => player.id !== view.youId)}
            isDisabled={!isLive}
            onChange={onSettingsChange}
            preferences={preferences}
            seatCount={view.players.length}
            settings={settings}
          />
          <BoardSetup
            isDisabled={!isLive}
            onChange={onSettingsChange}
            settings={settings}
          />
        </>
      ) : (
        <p className='settled'>
          <strong>
            {[
              teams.kind === 'off'
                ? translate('team.summary.off')
                : translate(`team.summary.${teams.kind}`, {
                    count: teams.count
                  }),
              settings.board.kind === 'track'
                ? translate('board.summary', {
                    length: settings.board.length
                  })
                : translate('board.none')
            ].join(' · ')}
          </strong>
          <span>{translate('host.panel.settled')}</span>
        </p>
      )}
      {/*
        A room of one slate is one sheet, marked once: the next sheet is the
        next game, set up afresh, and a strip offering five of them would
        offer no *one*. An evening counts its rounds whatever they are.
      */}
      {(settings.lineUp.length > 1 || settings.game?.kind !== 'slate') && (
        <NumberChoice
          className='round-count'
          isDisabled={!isLive}
          label={translate('host.rounds')}
          onChange={(count) => {
            onSettingsChange({
              ...settings,
              roundCount: count === NO_LIMIT ? null : count
            })
          }}
          optionLabel={(count) =>
            count === NO_LIMIT
              ? translate('host.roundCount.open')
              : String(count)
          }
          options={roundCountOptions(settings.roundCount)}
          value={settings.roundCount ?? NO_LIMIT}
        />
      )}
    </>
  )
}

/**
 * The room from above — which screen does what, the seat, this screen's
 * volume — then how a round is led in and let go, which no game answers.
 */
export const RoomTab: React.FC<SetupTabsProps> = ({
  draftSource,
  isLive,
  onDismissWall,
  onLeaveSeat,
  onSettingsChange,
  onTakeSeat,
  view
}) => {
  const translate = useTranslate()
  const settings = view.settings
  const summaries = useSetupSummaries({ draftSource, settings })
  const { seconds } = useDurationLabels()

  return (
    <>
      <RoomScene
        isLive={isLive}
        onDismissWall={onDismissWall}
        onLeaveSeat={onLeaveSeat}
        onTakeSeat={onTakeSeat}
        view={view}
      />
      <HeldNote view={view} />
      <p className='tab-summary'>{summaries.room}</p>
      {settings.game?.kind !== 'slate' && (
        <AutoAdvanceChoice
          isLive={isLive}
          onSettingsChange={onSettingsChange}
          settings={settings}
        />
      )}
      <NumberChoice
        className='countdown-choice'
        isDisabled={!isLive}
        label={translate('host.countdown')}
        onChange={(countdownMs) => {
          onSettingsChange({ ...settings, countdownMs })
        }}
        optionLabel={seconds}
        options={COUNTDOWN_DURATIONS_MS}
        value={settings.countdownMs}
      />
    </>
  )
}

/**
 * Who is at the table, each removable, then points by hand once the game runs:
 * on a desk this tab stands beside the stage, so a bonus called out at the
 * table needs no trip to the menu. This console's own seat is the Room tab's.
 */
export const PlayersTab: React.FC<SetupTabsProps> = ({
  onRemovePlayer,
  view
}) => {
  const translate = useTranslate()

  if (view.players.length === 0) {
    return <p className='tab-summary'>{translate('team.empty')}</p>
  }

  return (
    <>
      <Scoreboard
        hasPawns
        onRemove={onRemovePlayer}
        players={view.players}
        youId={view.youId}
      />
      {view.phase !== 'lobby' && (
        <section className='hand-points'>
          <h3>{translate('menu.points.label')}</h3>
          <PointsRows />
        </section>
      )}
    </>
  )
}
