import { useMediaQuery, useScreenAwake } from '@adrienlcp/browser/react'
import type React from 'react'
import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import { useNavigate } from 'react-router'

import { DEFAULT_BOARD_SETTINGS } from '@melee/protocol/board'
import { CHALLENGE_HAND_SIZE } from '@melee/protocol/challenge'
import type { ScoreTarget } from '@melee/protocol/client-message'
import type { HostToken, PlayerId, RoomCode } from '@melee/protocol/identifiers'
import type {
  HostRoomView,
  RoomSettings,
  RoundView
} from '@melee/protocol/room'
import type { TrackSource } from '@melee/protocol/track'

import { trackPawnsOf } from '@melee/core/board/track-pawns'
import {
  type ChallengeChoice,
  challengeHandOf,
  FIRST_HAND_LINE
} from '@melee/core/challenge/challenge-hand'
import { drawTargetSeconds } from '@melee/core/innerclock/target'
import { seatWithheldReason } from '@melee/core/room/game-modes'
import {
  askedIn,
  type HostPreferences,
  rememberSettings
} from '@melee/core/room/host-preferences'
import { isGameInPlay } from '@melee/core/room/room-phase'
import { withPreparedKey } from '@melee/core/slate/prepared-keys'
import { playsThisRound } from '@melee/core/team/duel'

import { NotFoundPage } from '@/features/not-found/not-found-page'
import { ChoosingRound } from '@/features/player/choosing-round'
import { blackSquareContent } from '@/helpers/round-content'
import { useHostConnection } from '@/infrastructure/messaging/use-host-connection'
import {
  useCameFromWall,
  useHandedHostToken,
  useRoomCodeParam,
  wallPathFor
} from '@/infrastructure/router/navigation'
import {
  readStoredHostPreferences,
  writeStoredHostPreferences,
  writeStoredNickname
} from '@/infrastructure/storage/preferences-storage'
import {
  readPreparedSlateKeys,
  writePreparedSlateKeys
} from '@/infrastructure/storage/prepared-keys-storage'
import {
  forgetHostToken,
  forgetSeatNickname,
  forgetSessionId,
  readSeatNickname,
  writeHostToken,
  writeSeatNickname
} from '@/infrastructure/storage/session-storage'
import { unlockBuzzCue, useBuzzCue } from '@/presentation/audio/buzz-cue'
import { useVolume } from '@/presentation/audio/volume-provider'
import { BlackSquareTurn } from '@/presentation/components/black-square-turn'
import { BoardTrack } from '@/presentation/components/board-track'
import { DuelBadge } from '@/presentation/components/duel-badge'
import { Loader } from '@/presentation/components/loader'
import { RoundChrome } from '@/presentation/components/round-chrome'
import { RoundProgress } from '@/presentation/components/round-progress'
import { useReportConnection } from '@/presentation/connection/connection-provider'
import {
  reflexOutcome,
  useBuzzOutcome
} from '@/presentation/haptics/buzz-outcome'
import { RoomDocumentTitle } from '@/presentation/head/room-document-title'
import { useI18n } from '@/presentation/i18n/i18n-provider'
import { protocolErrorKey } from '@/presentation/i18n/translation'
import {
  NOBODY,
  useReportRoomActions
} from '@/presentation/room-actions/room-actions-provider'
import { DESK_SCREEN_QUERY } from '@/presentation/styles/wide-screen'
import { useMarkingField } from '@/presentation/theme/use-marking-field'
import { usePhaseField } from '@/presentation/theme/use-phase-field'

import { ArrivalNotice, useArrival } from './arrival-notice'
import { type ChallengeLine, challengePickFor } from './challenge-line'
import { ClipOffer } from './clip-offer'
import { HostActions, type HostActionsProps } from './host-actions'
import { HostPanel } from './host-panel'
import { HostPodium } from './host-podium'
import { HostRefused } from './host-refused'
import { InvitePiece } from './invite-piece'
import { JoinReminder } from './join-reminder'
import { RoomStage, type StageControls } from './room-stage'
import { useRoundAudio } from './round-audio'
import {
  GameTab,
  PlayersTab,
  RoomTab,
  type SetupTabsProps,
  TableTab
} from './setup-tabs'
import { SlateEditors } from './slate-stages'
import { useLineUpDraw } from './use-line-up-draw'
import {
  markOwnLinePlayed,
  useOwnChallengeLines
} from './use-own-challenge-lines'
import { useRememberLineUpGames } from './use-remember-line-up-games'
import { useRestoreStoredSetup } from './use-restore-stored-setup'
import { useSlateWall } from './use-slate-wall'

import './host-console-page.sass'

import { Main } from '@/presentation/components/main'
import { PawnColoursProvider } from '@/presentation/components/pawn-colours'

/** Where a press to play right away is: waiting for its seat, or for its first round. */
type RightAwayStart = 'idle' | 'seating' | 'starting'

const storedHostPreferencesOrNone = (): HostPreferences | null => {
  const stored = readStoredHostPreferences()

  return stored.status === 'success' ? stored.data : null
}

export const HostConsolePage: React.FC = () => {
  const roomCode = useRoomCodeParam()

  // The socket hook must not be called with a code the server would refuse, and
  // hooks cannot be conditional — so the guard lives above the component that
  // owns them.
  return roomCode === null ? (
    <NotFoundPage />
  ) : (
    <HostConsole roomCode={roomCode} />
  )
}

const HostConsole: React.FC<{ roomCode: RoomCode }> = ({ roomCode }) => {
  const { locale, translate } = useI18n()
  // Read from storage rather than started empty, because this is the only thing
  // that puts the name back on the next `hello` — and a console whose tab was
  // discarded on a screen lock reloads rather than blinks, so a seat kept in
  // component state alone came back as no seat at all.
  const [seatNickname, setSeatNickname] = useState(() =>
    readSeatNickname({ role: 'host', roomCode })
  )
  // Kept before the socket opens, so the claim it makes carries the token and
  // takes the room from the screen that handed it over.
  useHandedHostToken((hostToken) => {
    writeHostToken({ hostToken, roomCode })
  })
  const { clearError, clock, error, retry, send, status, view } =
    useHostConnection(roomCode, seatNickname)
  const [requestedNickname, setRequestedNickname] = useState<string | null>(
    null
  )
  const [hasOfferedToken, setHasOfferedToken] = useState(false)
  const { volume } = useVolume()
  const [draftSource, setDraftSource] = useState<TrackSource | null>(null)
  const lineUpAt = view?.settings.lineUpAt ?? null
  const [draftedForAt, setDraftedForAt] = useState(lineUpAt)

  // The picker's draft is the source of the entry the next round is on. Once
  // the draw or *Play next* moves that round to another entry, the draft is
  // that entry's no longer, and committing it at the launch would hand one
  // blind test's source to the other.
  if (draftedForAt !== lineUpAt) {
    setDraftedForAt(lineUpAt)
    setDraftSource(null)
  }
  const [preferences, setPreferences] = useState(() => {
    const stored = storedHostPreferencesOrNone()

    return stored === null ? null : askedIn({ locale, preferences: stored })
  })
  const [preparedKeys, setPreparedKeys] = useState(readPreparedSlateKeys)
  const [challengeText, setChallengeText] = useState('')
  const [challengeChoice, setChallengeChoice] =
    useState<ChallengeChoice>(FIRST_HAND_LINE)
  const [setAsideOwnLines, setSetAsideOwnLines] = useState<ReadonlySet<number>>(
    () => new Set()
  )
  const ownChallengeLines = useOwnChallengeLines()
  const [targetSeconds, setTargetSeconds] = useState(drawTargetSeconds)
  const arrival = useArrival(view)
  // Set by the empty lobby's launch, spent on the first view that holds this
  // console's seat, and done once the room has left the lobby — never kept
  // anywhere a reload would find it again.
  const [rightAway, setRightAway] = useState<RightAwayStart>('idle')

  useReportConnection({ clock, status })
  usePhaseField(view?.phase ?? null)
  const slateWall = useSlateWall(view)
  useMarkingField(view?.phase === 'playing' && slateWall.isOnWall)
  useScreenAwake(status !== 'refused' && view?.phase !== 'finished')

  // A wall in the room is its speaker, and two screens a few milliseconds apart
  // are the flange stage 10 measured — so the console falls silent while one is
  // there, and picks the clip up again where the room's clock says it is.
  const isSpeaker = view?.isWallConnected !== true
  const isDesk = useMediaQuery(DESK_SCREEN_QUERY)
  const { canPlay, refusal, unlock } = useRoundAudio({
    clock,
    view: isSpeaker ? view : null,
    volume
  })

  useBuzzCue(isSpeaker ? (view?.round?.activeBuzz?.atServerTime ?? null) : null)
  useBuzzOutcome(
    reflexOutcome({ round: view?.round ?? null, youId: view?.youId ?? null })
  )

  // One press, two permissions: the clip's element and the cue's audio context
  // are both granted only from a real gesture, and neither can be asked for
  // later — so the console arms them together or not at all.
  const armAudio = () => {
    unlock()
    unlockBuzzCue()
  }

  const isLive = status === 'open'

  // Every way the console has of changing a setting comes through here, so what
  // the next room opens on is whatever this one was last left on. The stored
  // value is re-read rather than taken from state: two controls pressed in one
  // tick would otherwise have the second overwrite the first's.
  const changeSettings = useCallback(
    (settings: RoomSettings) => {
      const remembered = rememberSettings({
        preferences: storedHostPreferencesOrNone(),
        settings
      })

      writeStoredHostPreferences(remembered)
      setPreferences(remembered)

      // The server takes the seat back on this frame, and the console follows
      // it here rather than by watching the answer come back: a name still
      // remembered would put the seat on the next reconnect, under a room that
      // would then have to refuse it — and inferring the loss from the room's
      // view cannot tell "refused" from "the reconnect has not answered yet".
      if (seatWithheldReason(settings) !== null) {
        forgetSeatNickname({ role: 'host', roomCode })
        setSeatNickname(null)
      }

      send({ settings, type: 'host.updateSettings' })
    },
    [roomCode, send]
  )

  useRememberLineUpGames(view)
  useRestoreStoredSetup({
    onRestore: changeSettings,
    preferences,
    view
  })

  useLineUpDraw({
    isLive,
    onSettingsChange: changeSettings,
    preferences,
    view
  })

  // Inside an effect rather than a press, and that is why it arms the audio
  // here too: the press that asked for it was on the page before, in the same
  // document, so the browser still counts this screen as one somebody touched.
  const startFirstRound = useEffectEvent(() => {
    armAudio()
    send({ type: 'host.startRound' })
  })

  // After the restore above, so the frame carrying the remembered setup
  // reaches the server ahead of the one that builds a round from it.
  useEffect(() => {
    if (rightAway === 'idle' || view === null) {
      return
    }

    if (view.phase !== 'lobby' || error !== null) {
      setRightAway('idle')

      return
    }

    if (rightAway === 'seating' && isLive && view.youId !== null) {
      setRightAway('starting')
      startFirstRound()
    }
  }, [error, isLive, rightAway, view])

  const rememberPreparedKey = (itemIndex: number, key: string) => {
    const remembered = withPreparedKey({
      itemIndex,
      key,
      keys: readPreparedSlateKeys()
    })

    writePreparedSlateKeys(remembered)
    setPreparedKeys(remembered)
  }

  const preparedSlateKeys =
    view?.settings.game?.kind === 'slate' ? preparedKeys : undefined

  const endGame = useCallback(() => {
    send({ type: 'host.endGame' })
  }, [send])

  // The frame goes first: navigating away closes the socket, and a room closed
  // after that is a room nobody was told about. The stored claim goes with it —
  // it is worth nothing once the code stops resolving.
  const closeRoom = useCallback(() => {
    send({ type: 'host.closeRoom' })
    forgetSessionId({ role: 'host', roomCode })
    forgetHostToken(roomCode)
  }, [roomCode, send])

  // The frame first again, and for a second reason: dropping the nickname
  // reopens the socket, so a seat given up on the reconnect alone would sit on
  // the roster until the server timed it out.
  const leaveSeat = useCallback(() => {
    send({ type: 'player.leave' })
    forgetSeatNickname({ role: 'host', roomCode })
    setSeatNickname(null)
  }, [roomCode, send])

  // Kept before the socket carries it, for the same reason the token is: the
  // reopen this triggers builds its `hello` out of storage.
  const takeSeat = (nickname: string) => {
    writeStoredNickname(nickname)
    writeSeatNickname({ nickname, role: 'host', roomCode })
    setSeatNickname(nickname)
  }

  const playRightAway = (nickname: string) => {
    clearError()
    takeSeat(nickname)
    setRightAway('seating')
  }

  // A frame, and the store — never `setSeatNickname`, which is what the socket
  // is keyed on: reopening it to change a label would freeze the round on every
  // player's screen in the room. The stored name is what a reload re-seats
  // under if the seat itself has since expired.
  const renameSeat = useCallback(
    (nickname: string) => {
      clearError()
      setRequestedNickname(nickname)
      writeStoredNickname(nickname)
      writeSeatNickname({ nickname, role: 'host', roomCode })
      send({ nickname, type: 'player.rename' })
    },
    [clearError, roomCode, send]
  )

  // The roster's ✕ sits beside the console's own seat too, and removing
  // yourself is leaving it. Only `player.leave` also drops the nickname, which
  // the socket would otherwise re-seat this screen with on the next reconnect —
  // so an eviction aimed here would not survive a Wi-Fi blink.
  const removePlayer = (playerId: PlayerId) => {
    if (playerId === view?.youId) {
      leaveSeat()

      return
    }

    send({ playerId, type: 'host.removePlayer' })
  }

  // Offered to the menu above, which owns the only way off this screen. What a
  // dead socket takes away is the *press*, which the menu greys out itself —
  // dropping the item would make the menu's contents flap on a Wi-Fi blink.
  const seatedAs =
    view?.players.find((player) => player.id === view.youId)?.nickname ?? null

  const choosing = view === null ? null : seatedChoosingRound(view)
  const choosingRoundId = choosing?.round.id ?? null

  const adjustScore = useCallback(
    (target: ScoreTarget, points: number) => {
      send({ points, target, type: 'host.adjustScore' })
    },
    [send]
  )

  const revealRound = useCallback(() => {
    if (choosingRoundId !== null) {
      send({ roundId: choosingRoundId, type: 'host.reveal' })
    }
  }, [choosingRoundId, send])

  const [isHandingOver, setIsHandingOver] = useState(false)
  const handOver = useCallback(() => {
    setIsHandingOver(true)
  }, [])

  useReportRoomActions({
    adjustScore: view === null ? null : adjustScore,
    closeRoom,
    endGame: view !== null && isGameInPlay(view.phase) ? endGame : null,
    handOver,
    leaveSeat: view?.youId == null ? null : leaveSeat,
    playsSound: isSpeaker,
    refusedNickname:
      requestedNickname !== null && error?.code === 'nickname_taken'
        ? requestedNickname
        : null,
    rename: seatedAs === null ? null : renameSeat,
    revealRound: choosing === null ? null : revealRound,
    scoredPlayers: view?.players ?? NOBODY,
    scoredTeams: view?.teams ?? NOBODY,
    seatNickname: seatedAs,
    trackLength:
      view?.settings.board.kind === 'track' ? view.settings.board.length : null
  })

  // Written before the socket carries it, because the hello is built from
  // storage: the retry is what sends it, and it reads what was just kept.
  const offerHostToken = (hostToken: HostToken) => {
    writeHostToken({ hostToken, roomCode })
    setHasOfferedToken(true)
    retry()
  }

  // A console the wall turned into steps back the moment the host's own screen
  // takes the room again, rather than showing that screen's owner a refusal —
  // and so does one that handed the room over, since the screen the room was
  // handed to is the one the host now holds.
  const cameFromWall = useCameFromWall()
  const navigate = useNavigate()
  const isDisplacedWall =
    (cameFromWall || isHandingOver) &&
    status === 'refused' &&
    error?.code === 'host_already_connected'

  useEffect(() => {
    if (isDisplacedWall) {
      void navigate(wallPathFor(roomCode), { replace: true })
    }
  }, [isDisplacedWall, navigate, roomCode])

  if (status === 'refused') {
    return (
      <Main className='host-console-page'>
        <RoomDocumentTitle game={view?.settings.game?.kind ?? null} />
        <div className='stage solo'>
          <HostRefused
            error={error}
            hasOfferedToken={hasOfferedToken}
            onOfferToken={offerHostToken}
            onRetry={retry}
          />
        </div>
      </Main>
    )
  }

  // The lobby a press to play right away is on its way through: the seat is
  // being taken and the first round asked for, and drawing the table being
  // set for a few frames would be a screen nobody chose to see.
  if (
    rightAway !== 'idle' &&
    error === null &&
    (view === null || view.phase === 'lobby')
  ) {
    return (
      <Main className='host-console-page'>
        <RoomDocumentTitle game={view?.settings.game?.kind ?? null} />
        <div className='stage solo'>
          <Loader label={translate('join.rightAway.starting')} />
        </div>
      </Main>
    )
  }

  const seatedRound =
    view !== null && choosing !== null ? (
      <>
        <RoundChrome
          duel={choosing.round.duel}
          invitation={<InvitePiece roomCode={roomCode} />}
          notice={<ArrivalNotice arrival={arrival} />}
          players={view.players}
          roundCount={view.settings.roundCount}
          roundIndex={choosing.round.index}
          teams={view.teams}
          youId={choosing.youId}
        />
        <div className='card-clock'>
          {choosing.round.durationMs !== null && (
            <RoundProgress
              durationMs={choosing.round.durationMs}
              elapsedMs={view.roundElapsedMs}
            />
          )}
        </div>
        <ChoosingRound
          onAnswer={(answer) =>
            send({
              answer,
              roundId: choosing.round.id,
              type: 'player.answer'
            })
          }
          round={choosing.round}
          youId={choosing.youId}
        />
        <div className='notice'>
          {error !== null && (
            <p className='error' role='alert'>
              {translate(protocolErrorKey(error.code))}
            </p>
          )}
          <ClipOffer
            canPlay={canPlay}
            isSpeaker={isSpeaker}
            onUnlockAudio={armAudio}
            refusal={refusal}
            view={view}
          />
        </div>
      </>
    ) : null

  if (view !== null && choosing !== null && !view.isWallConnected) {
    return (
      <PawnColoursProvider view={view}>
        <Main className='host-console-page framed'>
          <RoomDocumentTitle game={view.settings.game?.kind ?? null} />
          {seatedRound}
        </Main>
      </PawnColoursProvider>
    )
  }

  const challengeLineOf = (current: HostRoomView): ChallengeLine | null => {
    if (current.settings.game?.kind !== 'challenge') {
      return null
    }

    const hand = challengeHandOf({
      dealt: current.challengeHand.map((labels) => labels[locale]),
      own: ownChallengeLines,
      setAside: setAsideOwnLines,
      size: CHALLENGE_HAND_SIZE
    })

    return {
      choice: challengeChoice,
      hand,
      onChange: (text) => {
        setChallengeText(text)
        setChallengeChoice({ kind: 'typed' })
      },
      onChoose: setChallengeChoice,
      onRedeal: (at) => {
        const card = hand[at]

        if (card?.kind === 'own') {
          setSetAsideOwnLines((previous) => new Set([...previous, card.ownAt]))
        } else if (card?.kind === 'dealt') {
          send({ at: card.slot, type: 'host.redealChallenge' })
        }
      },
      text: challengeText
    }
  }

  const hostActionsProps = (current: HostRoomView): HostActionsProps => {
    const challengeLine = challengeLineOf(current)

    return {
      challengeLine,
      draftSource,
      innerclockTarget:
        current.settings.game?.kind === 'innerclock'
          ? { onChange: setTargetSeconds, seconds: targetSeconds }
          : null,
      isLive,
      onOpenRound: () => {
        // Inside the press, never in an effect: the autoplay policy grants
        // permission only from a real gesture, and it cannot be asked for later
        // when the track arrives.
        armAudio()
        // The press has already read the line it sends, and the next challenge
        // is never this one again.
        markOwnLinePlayed({
          lines: ownChallengeLines,
          sent: challengePickFor(challengeLine).challengeText
        })
        setChallengeText('')
        setChallengeChoice(FIRST_HAND_LINE)
        setSetAsideOwnLines(new Set())
        setTargetSeconds(drawTargetSeconds())

        // What the picker is showing is what the host chose, and a round about
        // to be drawn is the moment that means something — which is why every
        // control that opens one comes through here rather than the launch
        // alone. Re-sending an unchanged source is free: the server drops the
        // pool only when it differs.
        const game = current.settings.game

        if (draftSource !== null && game?.kind === 'blindtest') {
          changeSettings({
            ...current.settings,
            game: { ...game, source: draftSource }
          })
        }
      },
      onPlayRightAway: playRightAway,
      onSettingsChange: changeSettings,
      preferences,
      send,
      slateKeys: preparedSlateKeys,
      slateWall,
      view: current
    }
  }

  const spokenTurn = blackSquareContent(view?.round)?.spoken ?? null

  const header = (
    <header>
      <ArrivalNotice arrival={arrival} />
      {view?.round != null && view.phase !== 'finished' && (
        <p className='round-index'>
          {view.settings.roundCount === null
            ? translate('round.indexOpen', { index: view.round.index })
            : translate('round.index', {
                index: view.round.index,
                total: view.settings.roundCount
              })}
        </p>
      )}
      {view?.round?.duel != null && view.phase !== 'finished' && (
        <DuelBadge
          duel={view.round.duel}
          players={view.players}
          seatId={view.youId}
          teams={view.teams}
        />
      )}
      {spokenTurn !== null && view !== null && view.phase !== 'finished' && (
        <BlackSquareTurn
          players={view.players}
          seatId={view.youId}
          spoken={spokenTurn}
          teams={view.teams}
        />
      )}
      {/*
          The lobby is the one phase that excludes it, because the invitation
          is already the stage's larger half there. `finished` used to be
          excluded too and that was backwards: the final board is precisely
          when somebody says *one more, I'll call Marc*, and the room
          still answers.
        */}
      {view !== null &&
        view.phase !== 'lobby' &&
        !view.isWallConnected &&
        view.settings.teams.kind !== 'aloud' && (
          <JoinReminder roomCode={roomCode} />
        )}
    </header>
  )

  const controls: StageControls = {
    isAnswerFolded: cameFromWall,
    isLive,
    isRosterBeside: view?.isWallConnected === true,
    onRememberSlateKey: rememberPreparedKey,
    onRemovePlayer: removePlayer,
    onSettingsChange: changeSettings,
    onTakeSeat: takeSeat,
    preferences,
    preparedSlateKeys: preparedKeys,
    send
  }

  const setupProps = (current: HostRoomView): SetupTabsProps => ({
    draftSource,
    isLive,
    onDismissWall: () => {
      send({ type: 'host.dismissWall' })
    },
    onDraftSource: setDraftSource,
    onLeaveSeat: leaveSeat,
    onRememberSlateKey: rememberPreparedKey,
    onRemovePlayer: removePlayer,
    onSettingsChange: changeSettings,
    onTakeSeat: takeSeat,
    preferences,
    preparedSlateKeys: preparedKeys,
    slateEditors:
      current.phase === 'playing' &&
      current.round?.content.kind === 'slate' &&
      !slateWall.isOnWall ? (
        <SlateEditors controls={controls} view={current} />
      ) : null,
    view: current
  })

  const page = (
    <Main className='host-console-page'>
      <RoomDocumentTitle game={view?.settings.game?.kind ?? null} />
      {header}

      <RoomStage
        canPlay={canPlay}
        clock={clock}
        controls={controls}
        isBoardAround={isSpeaker && isDesk}
        isSpeaker={isSpeaker}
        onUnlockAudio={armAudio}
        refusal={refusal}
        roomCode={roomCode}
        slateWall={slateWall}
        view={view}
      />

      <footer>
        {error !== null && (
          <p className='error' role='alert'>
            {translate(protocolErrorKey(error.code))}
          </p>
        )}
        {view !== null && <HostActions {...hostActionsProps(view)} />}
      </footer>
    </Main>
  )

  if (view === null) {
    return (
      <PawnColoursProvider view={view}>
        <HostPanel
          defaultTab='game'
          isStageFull={false}
          narrowStart={null}
          playerCount={0}
          tabs={null}
        >
          {page}
        </HostPanel>
      </PawnColoursProvider>
    )
  }

  const setup = setupProps(view)

  if (view.isWallConnected) {
    return (
      <PawnColoursProvider view={view}>
        <HostPodium
          round={
            choosing === null ? (
              <div className='host-console-page podium-round'>
                {header}
                <RoomStage
                  canPlay={canPlay}
                  clock={clock}
                  controls={controls}
                  isBoardAround={false}
                  isSpeaker={isSpeaker}
                  onUnlockAudio={armAudio}
                  refusal={refusal}
                  roomCode={roomCode}
                  slateWall={slateWall}
                  view={view}
                />
                <footer>
                  {error !== null && (
                    <p className='error' role='alert'>
                      {translate(protocolErrorKey(error.code))}
                    </p>
                  )}
                  <HostActions {...hostActionsProps(view)} />
                </footer>
              </div>
            ) : (
              <div className='framed-box'>
                <div className='host-console-page framed podium-round'>
                  {seatedRound}
                </div>
              </div>
            )
          }
          setup={setup}
          view={view}
        />
      </PawnColoursProvider>
    )
  }

  return (
    <PawnColoursProvider view={view}>
      <HostPanel
        defaultTab={view.phase === 'lobby' ? 'game' : 'players'}
        isStageFull={
          view.phase === 'playing' && view.round?.answerMode === 'choice'
        }
        narrowStart={
          view.phase === 'lobby' && view.settings.game === null
            ? 'game'
            : 'stage'
        }
        playerCount={view.players.length}
        tabs={{
          game: <GameTab {...setup} />,
          players: <PlayersTab {...setup} />,
          room: <RoomTab {...setup} />,
          table: <TableTab {...setup} />
        }}
      >
        {page}
        {isSpeaker && (
          <BoardTrack
            board={isDesk ? view.settings.board : DEFAULT_BOARD_SETTINGS}
            pawns={trackPawnsOf(view)}
          />
        )}
      </HostPanel>
    </PawnColoursProvider>
  )
}

/**
 * The seated host's four tiles, which take the screen the way a player's do:
 * the header, the footer and the standings fold away for as long as the round
 * runs, and the one control a round in play offers moves into the menu. A seat
 * that arrived after the round opened is refused the round anyway, so it keeps
 * the console's own screen.
 */
type SeatedChoosing = { round: RoundView; youId: PlayerId }

const seatedChoosingRound = (view: HostRoomView): SeatedChoosing | null =>
  view.phase === 'playing' &&
  view.round?.answerMode === 'choice' &&
  view.youId !== null &&
  view.round !== null &&
  !view.round.joinedAfterStart &&
  playsThisRound({ duel: view.round.duel, seatId: view.youId })
    ? { round: view.round, youId: view.youId }
    : null
