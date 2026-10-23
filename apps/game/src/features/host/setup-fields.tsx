import type React from 'react'
import { DisclosureGroup, type Key } from 'react-aria-components'

import type { HostRoomView, RoomSettings } from '@melee/protocol/room'
import type { TrackSource } from '@melee/protocol/track'

import type { HostPreferences } from '@melee/core/room/host-preferences'
import { isRoundInPlay } from '@melee/core/room/room-phase'

import { useVolume } from '@/presentation/audio/volume-provider'
import { Disclosure } from '@/presentation/components/disclosure'
import { Slider } from '@/presentation/components/slider'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useRoomActions } from '@/presentation/room-actions/room-actions-provider'

import { AutoAdvanceChoice } from './auto-advance-choice'
import { BoardSetup } from './board-setup'
import { GamePicker } from './game-picker'
import { HostSeat } from './host-seat'
import { JudgeSwitch } from './judge-switch'
import { LineUpEntries } from './line-up-entries'
import { NO_LIMIT, NumberChoice, useDurationLabels } from './number-choice'
import { PlaylistPicker } from './playlist-picker'
import { SettingsPanel } from './settings-panel'
import { isSetAsTable } from './table-lobby'
import { TeamsSetup } from './teams-setup'
import { useSetupSummaries } from './use-settings-summary'

import './setup-fields.sass'

const ROUND_COUNT_OPTIONS = [5, 10, 20, 30, NO_LIMIT] as const
const COUNTDOWN_DURATIONS_MS = [3_000, 5_000, 10_000] as const

export type SetupFieldsProps = {
  /** What the picker is showing, which the launch has not committed yet. */
  draftSource: TrackSource | null
  /** The socket is open. Everything inside sends a frame, so none of it works without it. */
  isLive: boolean
  /** Must be stable — the picker reports upward from an effect. */
  onDraftSource: (source: TrackSource | null) => void
  /** Files one key of the slate's answer key on this tab. */
  onRememberSlateKey: (itemIndex: number, key: string) => void
  onSettingsChange: (settings: RoomSettings) => void
  onTakeSeat: (nickname: string) => void
  /** What this host last left each game set to, so picking one restores it. */
  preferences: HostPreferences | null
  /** The slate's answer key as typed on this tab, never sent before the sheet opens. */
  preparedSlateKeys: readonly (string | null)[]
  view: HostRoomView
}

type SetupGroup = 'room' | 'round' | 'table'

/**
 * The group a host opening the setup most likely came for: the evening's shape
 * while nothing has been played and it can still be decided, the game's own
 * settings once a round is what the next press opens.
 */
const groupOpenedFirst = (view: HostRoomView): SetupGroup =>
  view.phase === 'lobby' || view.settings.game === null ? 'table' : 'round'

/**
 * How the evening is played, rather than inside the lobby: the countdown, the
 * round count, the answer window and the playlist all land on the round after
 * the one on screen, and a host who has to end the game to reach them is a
 * host who does not change them.
 *
 * Three groups, each closed on what it is set to: **the evening** (the game on
 * the shelf, the teams, its length), **the round** (what the game asks of each
 * one) and **the room** (the hold, the countdown, this screen's volume and seat
 * — what no game answers). One opens with the leaflet and the host opens the
 * others beside it: a quiz's subjects alone run to nine rows, and a leaflet
 * opening on all three is a scroll nobody finishes reading.
 *
 * The game and the seat are here for every phase but the lobby, where each of
 * them is the decision the room is waiting on and the stage draws it instead. A
 * round in play holds the seat back on top of that, because taking it reopens
 * the socket and a re-seat mid-clip would drop the answer being typed.
 */
export const SetupFields: React.FC<SetupFieldsProps> = ({
  draftSource,
  isLive,
  onDraftSource,
  onRememberSlateKey,
  onSettingsChange,
  onTakeSeat,
  preferences,
  preparedSlateKeys,
  view
}) => {
  const translate = useTranslate()
  const settings = view.settings
  const game = settings.game
  const isInLobby = view.phase === 'lobby'
  const roundInPlay = isRoundInPlay(view.phase)
  const { isRoomScreen, playsSound } = useRoomActions()
  const { setVolume, volume } = useVolume()
  const { seconds } = useDurationLabels()
  const summaries = useSetupSummaries({ draftSource, settings })
  const defaultExpandedKeys: Key[] = [groupOpenedFirst(view)]

  return (
    <div className='setup-fields'>
      {roundInPlay && (
        <p className='held'>{translate('host.setup.roundInPlay')}</p>
      )}
      <DisclosureGroup
        allowsMultipleExpanded
        className='setup-groups'
        defaultExpandedKeys={defaultExpandedKeys}
      >
        <Disclosure
          id='table'
          label={translate('host.setup.group.table')}
          summary={summaries.table}
        >
          {/*
            In the lobby the game is the stage's, beside the QR code — save on
            the room's own screen set as a table of teams, whose stage is the
            room's to read. Past it,
            a round on screen is one arm of `round.content`, so a game switched
            under it would leave the screens rendering the other; the server
            refuses that, and the control says so first.
          */}
          {(!isInLobby || (isRoomScreen && isSetAsTable(settings))) && (
            <GamePicker
              isDisabled={!isLive || roundInPlay}
              onChange={onSettingsChange}
              preferences={preferences}
              settings={settings}
            />
          )}
          {/*
            Ruled rather than hidden past the lobby: the server refuses a new
            deal once the game runs, and a host looking for the teams should
            find them and the reason they no longer move.
          */}
          <TeamsSetup
            hasPhones={view.players.some((player) => player.id !== view.youId)}
            isDisabled={!isLive || !isInLobby}
            onChange={onSettingsChange}
            preferences={preferences}
            settings={settings}
          />
          <BoardSetup
            isDisabled={!isLive || !isInLobby}
            onChange={onSettingsChange}
            settings={settings}
          />
          {!isInLobby && (
            <p className='hint'>{translate('team.setting.locked')}</p>
          )}
          <JudgeSwitch
            isDisabled={!isLive}
            onChange={onSettingsChange}
            preferences={preferences}
            settings={settings}
          />
          {/*
            A slate is one sheet, marked once: the next sheet is the next game,
            set up afresh, and a strip offering five of them would offer no
            *one*.
          */}
          {game?.kind !== 'slate' && (
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
              options={ROUND_COUNT_OPTIONS}
              value={settings.roundCount ?? NO_LIMIT}
            />
          )}
        </Disclosure>

        {/* Nothing about a round until there is a game to play it. */}
        {game !== null && (
          <Disclosure
            id='round'
            label={translate('host.setup.group.round')}
            summary={summaries.round}
          >
            <LineUpEntries
              draftSource={draftSource}
              isDisabled={!isLive || roundInPlay}
              onChange={onSettingsChange}
              preferences={preferences}
              settings={settings}
            />
            {game.kind === 'blindtest' && (
              <PlaylistPicker
                key={settings.lineUpAt}
                onDraftChange={onDraftSource}
                settings={game}
              />
            )}
            <SettingsPanel
              draftSource={draftSource}
              isLive={isLive}
              isRoundInPlay={roundInPlay}
              isSheetOnStage={isInLobby}
              onChange={onSettingsChange}
              onPrepareSlateKey={onRememberSlateKey}
              preparedSlateKeys={preparedSlateKeys}
              settings={settings}
            />
          </Disclosure>
        )}

        <Disclosure
          id='room'
          label={translate('host.setup.group.room')}
          summary={summaries.room}
        >
          {game?.kind !== 'slate' && (
            <AutoAdvanceChoice
              isLive={isLive}
              onSettingsChange={onSettingsChange}
              settings={settings}
            />
          )}
          <NumberChoice
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
            offered again where a host setting up the evening is already
            looking. Absent once a wall is the room's speaker, because this
            screen is then silent.
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
          {/*
            In the lobby the seat is what the launch is refusing for, so it
            belongs on the stage beside the roster. Later it has to stay
            reachable, because a takeover can hand the room back with the
            roster's ghost still holding the name — except under a round in
            play, where taking it reopens the socket beneath a running clip.
          */}
          {!isInLobby && !roundInPlay && (
            <HostSeat onTakeSeat={onTakeSeat} view={view} />
          )}
        </Disclosure>
      </DisclosureGroup>
    </div>
  )
}
