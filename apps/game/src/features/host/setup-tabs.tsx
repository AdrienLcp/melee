import type React from 'react'
import { useState } from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { HostRoomView, RoomSettings } from '@melee/protocol/room'
import type { TrackSource } from '@melee/protocol/track'

import type { HostPreferences } from '@melee/core/room/host-preferences'
import { launchesWithHostSeated } from '@melee/core/room/play-right-away'
import { isRoundInPlay } from '@melee/core/room/room-phase'

import { useVolume } from '@/presentation/audio/volume-provider'
import { Scoreboard } from '@/presentation/components/scoreboard'
import { Slider } from '@/presentation/components/slider'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useRoomActions } from '@/presentation/room-actions/room-actions-provider'

import { AutoAdvanceChoice } from './auto-advance-choice'
import { BoardSetup } from './board-setup'
import { EveningAddPage } from './evening-add-page'
import { EveningEntryPage } from './evening-entry-page'
import { EveningRounds, ROUND_COUNT_STEPS } from './evening-rounds'
import { GamePicker } from './game-picker'
import { HostSeat } from './host-seat'
import { JudgeSwitch } from './judge-switch'
import { GamePitch } from './lobby-stage'
import { NO_LIMIT, NumberChoice, useDurationLabels } from './number-choice'
import { TeamsSetup } from './teams-setup'
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
  const [page, setPage] = useState<GamePage>({ kind: 'list' })
  const backToList = () => {
    setPage({ kind: 'list' })
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
      <JudgeSwitch
        isDisabled={!isLive}
        onChange={onSettingsChange}
        preferences={preferences}
        settings={settings}
      />
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

/** How a round is led in and let go, and this screen's own volume — what no game answers. */
export const RoomTab: React.FC<SetupTabsProps> = ({
  draftSource,
  isLive,
  onSettingsChange,
  view
}) => {
  const translate = useTranslate()
  const settings = view.settings
  const summaries = useSetupSummaries({ draftSource, settings })
  const { playsSound } = useRoomActions()
  const { setVolume, volume } = useVolume()
  const { seconds } = useDurationLabels()

  return (
    <>
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
      {/*
        This screen's, not the room's: the same value as the menu's slider,
        offered again where a host setting up the evening is already looking.
        Absent once a wall is the room's speaker, because this screen is then
        silent.
      */}
      {playsSound && (
        <Slider
          formatOptions={{ style: 'percent' }}
          label={translate('host.setup.volume')}
          maxValue={1}
          minValue={0}
          onChange={setVolume}
          step={0.05}
          value={volume}
        />
      )}
    </>
  )
}

/**
 * Who is at the table, each removable, and this console's own seat. The seat
 * is held back under a round in play, because taking it reopens the socket
 * beneath a running clip; and at an empty table the launch takes it itself,
 * so the form would be a second way to do the same thing.
 */
export const PlayersTab: React.FC<SetupTabsProps> = ({
  onLeaveSeat,
  onRemovePlayer,
  onTakeSeat,
  view
}) => {
  const translate = useTranslate()
  const isInLobby = view.phase === 'lobby'
  const offersSeat =
    !isRoundInPlay(view.phase) &&
    !(
      isInLobby &&
      (view.settings.teams.kind === 'aloud' ||
        launchesWithHostSeated({
          seated: view.players.length,
          settings: view.settings
        }))
    )

  return (
    <>
      {view.players.length === 0 ? (
        <p className='tab-summary'>{translate('team.empty')}</p>
      ) : (
        <Scoreboard
          hasPawns
          onRemove={onRemovePlayer}
          players={view.players}
          youId={view.youId}
        />
      )}
      {offersSeat && (
        <HostSeat
          onLeaveSeat={onLeaveSeat}
          onTakeSeat={onTakeSeat}
          view={view}
        />
      )}
    </>
  )
}
