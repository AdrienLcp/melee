import type React from 'react'
import { useRef, useState } from 'react'

import type { Deck } from '@melee/protocol/deck'
import type { GameKind } from '@melee/protocol/game'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { HostRoomView, RoomSettings } from '@melee/protocol/room'
import type { Speaker } from '@melee/protocol/sound'

import { dealsAdultContent } from '@melee/core/quiz/adult-content'
import { decksForLineUp } from '@melee/core/room/evening-decks'
import { isEveningPaidForSpeed } from '@melee/core/room/game-capabilities'
import {
  type HostPreferences,
  rememberedSetupFor
} from '@melee/core/room/host-preferences'
import { withNothingPlanned } from '@melee/core/room/line-up'
import {
  isOnReadyMade,
  type ReadyMadeLineUp,
  type ReadyMadeLineUpId,
  readyMadeLineUpsFor,
  rememberedOnReadyMade,
  savedEveningOfReadyMade
} from '@melee/core/room/ready-made-line-ups'
import { isRoundInPlay } from '@melee/core/room/room-phase'
import {
  decksKeptOver,
  type SavedEvening,
  savedEveningOf,
  withSavedEvening
} from '@melee/core/room/saved-evening'

import { PointsRows } from '@/presentation/components/points-rows'
import { Scoreboard } from '@/presentation/components/scoreboard'
import { Switch } from '@/presentation/components/switch'
import { useLastShown } from '@/presentation/components/use-last-shown'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'

import { AutoAdvanceChoice } from './auto-advance-choice'
import { BoardSetup } from './board-setup'
import { EveningAddPage, usePlanGame } from './evening-add-page'
import { EveningDrawPage } from './evening-draw-page'
import { EveningEndChoice } from './evening-end-choice'
import { EveningEntryPage } from './evening-entry-page'
import { EveningRounds } from './evening-rounds'
import { GamePickList } from './game-pick-list'
import { NumberChoice, useDurationLabels } from './number-choice'
import { ReadyMadeNote, ReadyMadeRows } from './ready-made-line-ups'
import { RoomScene } from './room-scene'
import { SavedEveningsDoor, SavedEveningsPage } from './saved-evenings-page'
import { TeamsSetup } from './teams-setup'
import { useCrossFadeOnReshape } from './use-cross-fade-on-reshape'
import { useSavedEvenings } from './use-saved-evenings'
import { useSetupSummaries } from './use-settings-summary'

import './setup-tabs.sass'

const COUNTDOWN_DURATIONS_MS = [3_000, 5_000, 10_000] as const

export type SetupTabsProps = {
  /** The socket is open. Everything inside sends a frame, so none of it works without it. */
  isLive: boolean
  /** Has the clip and the cues play on this console or on one wall. */
  onChooseSpeaker: (speaker: Speaker) => void
  /** Lets the room's screen go, so this one is the speaker again. */
  onDismissWall: () => void
  /** Gives up the seat this console holds. */
  onLeaveSeat: () => void
  /** Hands the room the decks of an evening laid over it; refused once a round has opened. */
  onLoadDecks: (decks: (Deck | null)[]) => void
  /** Notes which ready-made line-up the room was just put on, or `null` once it is taken off. */
  onReadyMade: (id: ReadyMadeLineUpId | null) => void
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
  /** The ready-made line-up this console last put the room on, from a row or from the home page; `null` for none. */
  readyMade: ReadyMadeLineUpId | null
  /** The slate's key and item names while its sheets are open and no wall is marking them. */
  slateEditors: React.ReactNode
  view: HostRoomView
}

/** What the games tab shows: the planned games, or one page of the evening in their place. */
type GamePage =
  | { isDrawnOnly: boolean; kind: 'adding' }
  | { kind: 'draw' }
  | { at: number; from: 'draw' | 'list'; kind: 'entry' }
  | { hasReturned: boolean; kind: 'list'; returnedFrom: number | null }
  | { kind: 'saved' }

/**
 * What the table plays: the planned games, the one place the evening is made,
 * each opening a page of its own — a quiz's subjects alone run to nine rows.
 * A table nobody has decided for yet shows every game instead, one press
 * planning it and opening its settings.
 */
export const GameTab: React.FC<SetupTabsProps> = ({
  isLive,
  onLoadDecks,
  onReadyMade,
  onRememberSlateKey,
  onSettingsChange,
  preferences,
  preparedSlateKeys,
  readyMade,
  slateEditors,
  view
}) => {
  const { locale, translate } = useI18n()
  const [page, setPage] = useState<GamePage>({
    hasReturned: false,
    kind: 'list',
    returnedFrom: null
  })
  const saved = useSavedEvenings()
  const [loadedName, setLoadedName] = useState<string | null>(null)
  const list = useRef<HTMLDivElement>(null)

  useCrossFadeOnReshape({
    box: list,
    shape: view.settings.game === null ? 'choosing' : 'planned'
  })
  const keep = (name: string) => {
    const evening = savedEveningOf({
      decks: decksKeptOver({
        evenings: saved.evenings,
        name,
        settings: view.settings
      }),
      name,
      settings: view.settings
    })

    saved.save(evening)
    setLoadedName(evening.name)
  }
  const holdsDecks = view.deckSummaries.some((summary) => summary !== null)
  // A line-up laid over the lobby replaces the room's decks with its own, or
  // the server would keep the last evening's questions on any entry of the
  // same game left at the same index.
  const layOver = ({
    evening,
    settings
  }: {
    evening: SavedEvening
    settings: RoomSettings
  }) => {
    const decks = decksForLineUp({
      decks: evening.decks,
      from: evening.lineUp,
      to: settings.lineUp
    })

    onSettingsChange(settings)

    if (view.phase === 'lobby' && (decks.length > 0 || holdsDecks)) {
      onLoadDecks(decks)
    }
  }
  const backToList = () => {
    setPage({ hasReturned: true, kind: 'list', returnedFrom: null })
  }
  const plannedFrom =
    (from: 'draw' | 'list') => (settings: RoomSettings, at: number) => {
      onSettingsChange(settings)
      setPage({ at, from, kind: 'entry' })
    }
  const rememberedFor = (game: GameKind) =>
    rememberedSetupFor({ game, preferences })
  const loadReadyMade = (lineUp: ReadyMadeLineUp) => {
    const evening = savedEveningOfReadyMade({
      lineUp,
      name: translate(`readyMade.lineUps.${lineUp.id}.name`)
    })

    layOver({
      evening,
      settings: withSavedEvening({
        evening,
        locale,
        rememberedFor: (game) =>
          rememberedOnReadyMade({ game, locale, preferences }),
        settings: view.settings
      })
    })
    onReadyMade(lineUp.id)
  }
  const loadedReadyMade = readyMadeLineUpsFor(locale).find(
    (lineUp) =>
      lineUp.id === readyMade &&
      view.phase === 'lobby' &&
      isOnReadyMade({ lineUp, settings: view.settings })
  )
  const lastReadyMade = useLastShown(loadedReadyMade?.id ?? null)

  const planned = plannedFrom('list')
  const plan = usePlanGame({
    onPlanned: planned,
    preferences,
    settings: view.settings
  })

  if (page.kind === 'saved') {
    return (
      <SavedEveningsPage
        evenings={saved.evenings}
        isLive={isLive}
        loadedName={loadedName}
        onBack={backToList}
        onForget={saved.forget}
        onImport={saved.importEvenings}
        onRun={(evening) => {
          layOver({
            evening,
            settings: withSavedEvening({
              evening,
              locale,
              rememberedFor,
              settings: view.settings
            })
          })
          setLoadedName(evening.name)
          onReadyMade(null)
          backToList()
        }}
        onSave={keep}
        view={view}
      />
    )
  }

  if (page.kind === 'entry') {
    return (
      <EveningEntryPage
        at={page.at}
        isLive={isLive}
        onBack={() => {
          setPage(
            page.from === 'draw'
              ? { kind: 'draw' }
              : { hasReturned: true, kind: 'list', returnedFrom: page.at }
          )
        }}
        onRememberSlateKey={onRememberSlateKey}
        onSettingsChange={onSettingsChange}
        preferences={preferences}
        preparedSlateKeys={preparedSlateKeys}
        view={view}
      />
    )
  }

  if (page.kind === 'draw') {
    return (
      <EveningDrawPage
        isLive={isLive}
        onAdd={() => {
          setPage({ isDrawnOnly: true, kind: 'adding' })
        }}
        onBack={backToList}
        onOpen={(at) => {
          setPage({ at, from: 'draw', kind: 'entry' })
        }}
        onSettingsChange={onSettingsChange}
        preferences={preferences}
        view={view}
      />
    )
  }

  if (page.kind === 'adding') {
    return (
      <EveningAddPage
        isDrawnOnly={page.isDrawnOnly}
        isLive={isLive}
        isSeated={view.youId !== null}
        onAdded={plannedFrom(page.isDrawnOnly ? 'draw' : 'list')}
        onBack={
          page.isDrawnOnly
            ? () => {
                setPage({ kind: 'draw' })
              }
            : backToList
        }
        preferences={preferences}
        settings={view.settings}
      />
    )
  }

  return (
    <div
      className='evening-list'
      data-returned={page.hasReturned || undefined}
      ref={list}
    >
      {slateEditors}
      {view.settings.game === null ? (
        <>
          <ReadyMadeRows isDisabled={!isLive} onLoad={loadReadyMade} />
          <h3 className='one-at-a-time'>{translate('readyMade.oneAtATime')}</h3>
          <p className='tab-summary'>{translate('host.game.prompt')}</p>
          <GamePickList
            aria-label={translate('host.game.label')}
            isDisabled={!isLive}
            isSeated={view.youId !== null}
            onPick={plan}
            settings={view.settings}
          />
        </>
      ) : (
        <div className='planned'>
          <div
            className='ready-made-fold'
            data-open={loadedReadyMade !== undefined || undefined}
            inert={loadedReadyMade === undefined}
          >
            <div>
              {lastReadyMade !== null && (
                <ReadyMadeNote
                  id={lastReadyMade}
                  onChange={() => {
                    onSettingsChange(withNothingPlanned(view.settings))
                    onReadyMade(null)
                  }}
                />
              )}
            </div>
          </div>
          <EveningRounds
            isLive={isLive}
            onAdd={() => {
              setPage({ isDrawnOnly: false, kind: 'adding' })
            }}
            onOpen={(at) => {
              setPage({ at, from: 'list', kind: 'entry' })
            }}
            onOpenDraw={() => {
              setPage({ kind: 'draw' })
            }}
            onSettingsChange={onSettingsChange}
            preferences={preferences}
            returnedFrom={page.returnedFrom}
            view={view}
          />
        </div>
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
    </div>
  )
}

/** Above the controls it greys out, because a host who has already pressed one has decided it is broken. */
const HeldNote: React.FC<{ view: HostRoomView }> = ({ view }) => {
  const translate = useTranslate()
  const isHeld = isRoundInPlay(view.phase)

  return (
    <div className='held' data-open={isHeld || undefined} inert={!isHeld}>
      <p>{translate('host.setup.roundInPlay')}</p>
    </div>
  )
}

/**
 * The evening's shape: the teams, the board, the judge and the length. The
 * server refuses a new deal or a new board once the game runs, so past the
 * lobby the two are one line saying what they were settled on rather than
 * controls drawn dead.
 */
export const TableTab: React.FC<SetupTabsProps> = ({
  isLive,
  onSettingsChange,
  preferences,
  view
}) => {
  const translate = useTranslate()
  const settings = view.settings
  const summaries = useSetupSummaries(settings)
  const isInLobby = view.phase === 'lobby'
  const teams = settings.teams
  const offersSpeedBonus =
    isEveningPaidForSpeed(settings) && settings.board.kind === 'points'
  /*
    A room of one slate is one sheet, marked once: the next sheet is the
    next game, set up afresh, and a strip offering five of them would
    offer no *one*. An evening counts its rounds whatever they are.
  */
  const showsEnd = settings.lineUp.length > 1 || settings.game?.kind !== 'slate'
  const offersFamilyFriendly = dealsAdultContent(settings)
  const shape = useRef<HTMLDivElement>(null)
  const end = useRef<HTMLDivElement>(null)

  useCrossFadeOnReshape({
    box: shape,
    shape: isInLobby ? 'open' : 'settled'
  })
  useCrossFadeOnReshape({
    box: end,
    shape: `${settings.board.kind} ${showsEnd} ${offersSpeedBonus} ${offersFamilyFriendly}`
  })

  return (
    <>
      <div className='tab-column'>
        <HeldNote view={view} />
        <div className='table-shape' ref={shape}>
          {isInLobby ? (
            <>
              <p className='tab-summary' key={summaries.table}>
                {summaries.table}
              </p>
              <TeamsSetup
                hasPhones={view.players.some(
                  (player) => player.id !== view.youId
                )}
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
                    : translate('board.points')
                ].join(' · ')}
              </strong>
              <span>{translate('host.panel.settled')}</span>
            </p>
          )}
        </div>
      </div>
      <div className='evening-end' ref={end}>
        {showsEnd && (
          <EveningEndChoice
            isDisabled={!isLive}
            onChange={onSettingsChange}
            settings={settings}
          />
        )}
        {offersSpeedBonus && (
          <Switch
            description={translate(
              settings.paysForSpeed
                ? 'host.speedBonus.hint.on'
                : 'host.speedBonus.hint.off'
            )}
            isDisabled={!isLive}
            isSelected={settings.paysForSpeed}
            label={translate('host.speedBonus.label')}
            onChange={(paysForSpeed) => {
              onSettingsChange({ ...settings, paysForSpeed })
            }}
          />
        )}
        {offersFamilyFriendly && (
          <Switch
            description={translate(
              settings.isFamilyFriendly
                ? 'host.familyFriendly.hint.on'
                : 'host.familyFriendly.hint.off'
            )}
            isDisabled={!isLive}
            isSelected={settings.isFamilyFriendly}
            label={translate('host.familyFriendly.label')}
            onChange={(isFamilyFriendly) => {
              onSettingsChange({ ...settings, isFamilyFriendly })
            }}
          />
        )}
      </div>
    </>
  )
}

/**
 * The room from above — which screen does what, the seat, this screen's
 * volume — then how a round is led in and let go, which no game answers.
 */
export const RoomTab: React.FC<SetupTabsProps> = ({
  isLive,
  onChooseSpeaker,
  onDismissWall,
  onLeaveSeat,
  onSettingsChange,
  onTakeSeat,
  view
}) => {
  const translate = useTranslate()
  const settings = view.settings
  const summaries = useSetupSummaries(settings)
  const { seconds } = useDurationLabels()
  const offersAutoAdvance = settings.game?.kind !== 'slate'

  return (
    <>
      <RoomScene
        isLive={isLive}
        onChooseSpeaker={onChooseSpeaker}
        onDismissWall={onDismissWall}
        onLeaveSeat={onLeaveSeat}
        onTakeSeat={onTakeSeat}
        view={view}
      />
      <div className='tab-column'>
        <HeldNote view={view} />
        <p className='tab-summary' key={summaries.room}>
          {summaries.room}
        </p>
        <div
          className='auto-advance-fold'
          data-open={offersAutoAdvance || undefined}
          inert={!offersAutoAdvance}
        >
          <AutoAdvanceChoice
            isLive={isLive}
            onSettingsChange={onSettingsChange}
            settings={settings}
          />
        </div>
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
      </div>
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
  const [seatedWhenOpened] = useState(
    () => new Set(view.players.map((player) => player.id))
  )
  const isEmpty = view.players.length === 0
  const isPlaying = view.phase !== 'lobby'
  const roster = useRef<HTMLDivElement>(null)

  useCrossFadeOnReshape({ box: roster, shape: isEmpty ? 'empty' : 'seated' })

  return (
    <div className='players-roster' ref={roster}>
      {isEmpty ? (
        <p className='tab-summary'>{translate('team.empty')}</p>
      ) : (
        <div className='tab-column'>
          <Scoreboard
            hasPawns
            isRoster={
              view.teams.length > 0 && view.settings.board.kind === 'track'
            }
            onRemove={onRemovePlayer}
            players={view.players}
            seatedBefore={view.phase === 'lobby' ? seatedWhenOpened : undefined}
            trackLength={
              view.settings.board.kind === 'track'
                ? view.settings.board.length
                : undefined
            }
            youId={view.youId}
          />
          <div
            className='hand-points-fold'
            data-open={isPlaying || undefined}
            inert={!isPlaying}
          >
            <section className='hand-points'>
              <h3>
                {translate(
                  view.settings.board.kind === 'track'
                    ? 'board.fix'
                    : 'host.points.label'
                )}
              </h3>
              <PointsRows />
            </section>
          </div>
        </div>
      )}
    </div>
  )
}
