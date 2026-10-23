import type React from 'react'
import { useState } from 'react'
import { DisclosureGroup } from 'react-aria-components'

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
import { EveningAddPage } from './evening-add-page'
import { EveningEntryPage } from './evening-entry-page'
import { EveningRounds, ROUND_COUNT_STEPS } from './evening-rounds'
import { HostSeat } from './host-seat'
import { JudgeSwitch } from './judge-switch'
import { NO_LIMIT, NumberChoice, useDurationLabels } from './number-choice'
import { TeamsSetup } from './teams-setup'
import { useSetupSummaries } from './use-settings-summary'

import './setup-fields.sass'

/**
 * The strip's counts, with the one the room is on when it is none of them —
 * three games ticked on home make twelve, and a strip with nothing pressed
 * says the evening has no length.
 */
const roundCountOptions = (roundCount: number | null): number[] =>
  roundCount === null || ROUND_COUNT_STEPS.some((step) => step === roundCount)
    ? [...ROUND_COUNT_STEPS, NO_LIMIT]
    : [...ROUND_COUNT_STEPS, roundCount]
        .toSorted((a, b) => a - b)
        .concat(NO_LIMIT)
const COUNTDOWN_DURATIONS_MS = [3_000, 5_000, 10_000] as const

export type SetupFieldsProps = {
  /** What the picker is showing, which the launch has not committed yet. */
  draftSource: TrackSource | null
  /** The socket is open. Everything inside sends a frame, so none of it works without it. */
  isLive: boolean
  /** The room's own screen, whose lobby stage draws no slate sheet: its round's page holds it instead. */
  isRoomScreen: boolean
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

/**
 * What the leaflet shows: its groups, or a page of the evening in their
 * place — one entry's, or the shelf a round is added from.
 */
type SetupPage =
  | { kind: 'adding' }
  | { at: number; kind: 'entry' }
  | { kind: 'groups' }

/**
 * How the evening is played, rather than inside the lobby: the countdown, the
 * round count, the answer window and the playlist all land on the round after
 * the one on screen, and a host who has to end the game to reach them is a
 * host who does not change them.
 *
 * Two groups, each closed on what it is set to: **the table** (the evening's
 * rounds, the teams, its length) and **the room** (the hold, the countdown,
 * this screen's volume and seat — what no game answers). The table opens with
 * the leaflet. Each round of the evening opens a page of its own in place of
 * the groups, holding what the game asks of it: a quiz's subjects alone run to
 * nine rows, and ten games' worth under one fold is a scroll nobody finishes.
 *
 * The seat is here for every phase but the lobby, where it is a decision the
 * room is waiting on and the stage draws it instead. A round in play holds it
 * back on top of that, because taking it reopens the socket and a re-seat
 * mid-clip would drop the answer being typed.
 */
export const SetupFields: React.FC<SetupFieldsProps> = ({
  draftSource,
  isLive,
  isRoomScreen,
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
  const { playsSound } = useRoomActions()
  const { setVolume, volume } = useVolume()
  const { seconds } = useDurationLabels()
  const summaries = useSetupSummaries({ draftSource, settings })
  const [page, setPage] = useState<SetupPage>({ kind: 'groups' })
  const backToGroups = () => {
    setPage({ kind: 'groups' })
  }

  if (page.kind === 'entry') {
    return (
      <div className='setup-fields'>
        <EveningEntryPage
          at={page.at}
          draftSource={draftSource}
          isLive={isLive}
          isRoomScreen={isRoomScreen}
          onBack={backToGroups}
          onDraftSource={onDraftSource}
          onRememberSlateKey={onRememberSlateKey}
          onSettingsChange={onSettingsChange}
          preferences={preferences}
          preparedSlateKeys={preparedSlateKeys}
          view={view}
        />
      </div>
    )
  }

  if (page.kind === 'adding') {
    return (
      <div className='setup-fields'>
        <EveningAddPage
          isLive={isLive}
          onAdded={(added, at) => {
            onSettingsChange(added)
            setPage({ at, kind: 'entry' })
          }}
          onBack={backToGroups}
          preferences={preferences}
          settings={settings}
        />
      </div>
    )
  }

  return (
    <div className='setup-fields'>
      {roundInPlay && (
        <p className='held'>{translate('host.setup.roundInPlay')}</p>
      )}
      <DisclosureGroup
        allowsMultipleExpanded
        className='setup-groups'
        defaultExpandedKeys={['table']}
      >
        <Disclosure
          id='table'
          label={translate('host.setup.group.table')}
          summary={summaries.table}
        >
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
            A room of one slate is one sheet, marked once: the next sheet is the
            next game, set up afresh, and a strip offering five of them would
            offer no *one*. An evening counts its rounds whatever they are.
          */}
          {(settings.lineUp.length > 1 || game?.kind !== 'slate') && (
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
        </Disclosure>

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
