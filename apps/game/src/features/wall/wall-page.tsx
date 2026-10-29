import { useScreenAwake } from '@adrienlcp/browser/react'
import type React from 'react'
import { useEffect, useEffectEvent } from 'react'

import type { RoomCode } from '@melee/protocol/identifiers'

import { trackPawnsOf } from '@melee/core/board/track-pawns'
import { isEveningSilent } from '@melee/core/room/game-capabilities'

import { JoinReminder } from '@/features/host/join-reminder'
import { RoomStage } from '@/features/host/room-stage'
import { useRoundAudio } from '@/features/host/round-audio'
import { useSlateWall } from '@/features/host/use-slate-wall'
import { NotFoundPage } from '@/features/not-found/not-found-page'
import { useWallConnection } from '@/infrastructure/messaging/use-wall-connection'
import {
  hostFromWallPathFor,
  paths,
  useReturnToWallPairing,
  useRoomCodeParam
} from '@/infrastructure/router/navigation'
import { useBuzzCue } from '@/presentation/audio/buzz-cue'
import { unlockCues } from '@/presentation/audio/cue-audio'
import { useTimerCue } from '@/presentation/audio/timer-cue'
import { useVolume } from '@/presentation/audio/volume-provider'
import { BoardTrack } from '@/presentation/components/board-track'
import { Button } from '@/presentation/components/button'
import { ConnectionRefused } from '@/presentation/components/connection-refused'
import { Link } from '@/presentation/components/link'
import { useReportConnection } from '@/presentation/connection/connection-provider'
import { RoomDocumentTitle } from '@/presentation/head/room-document-title'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import {
  NOBODY,
  useReportRoomActions
} from '@/presentation/room-actions/room-actions-provider'
import { useMarkingField } from '@/presentation/theme/use-marking-field'
import { usePhaseField } from '@/presentation/theme/use-phase-field'
import { useIdleChrome } from '@/presentation/use-idle-chrome'

import { useAbsentFor } from './use-absent-for'
import { asRoomScreenView } from './wall-view'

import '@/features/host/host-console-page.sass'
import './wall-page.sass'

import { blackSquareContent } from '@/helpers/round-content'
import { BlackSquareTurn } from '@/presentation/components/black-square-turn'
import { DuelBadge } from '@/presentation/components/duel-badge'
import { Main } from '@/presentation/components/main'
import { PawnColoursProvider } from '@/presentation/components/pawn-colours'

/**
 * Long enough for a lid closing and reopening, or a phone's screen locking and
 * waking, to come and go without the wall saying anything about it.
 */
const HOST_AWAY_GRACE_MS = 5_000

export const WallPage: React.FC = () => {
  const roomCode = useRoomCodeParam()

  return roomCode === null ? <NotFoundPage /> : <Wall roomCode={roomCode} />
}

/**
 * The room on the screen everyone reads, with nobody at it: the same stage the
 * console draws, without a single control and without the answer, which the
 * server never sends here. One wall of several is the room's speaker, which
 * is the one thing it has to ask a hand for; the rest show the game in silence.
 * Every wall still arms its sound on arrival, so the one that inherits the
 * speaker can play at once.
 */
const Wall: React.FC<{ roomCode: RoomCode }> = ({ roomCode }) => {
  const translate = useTranslate()
  const { clock, error, status, view: wallView } = useWallConnection(roomCode)
  const view = wallView === null ? null : asRoomScreenView(wallView)
  const isSpeaker = wallView?.isSpeaker === true
  const speakingView = isSpeaker ? view : null
  const { volume } = useVolume()
  const slateWall = useSlateWall(view)
  const isRefused = status === 'refused'
  const isHostAway = useAbsentFor({
    graceMs: HOST_AWAY_GRACE_MS,
    isAbsent: view !== null && !view.isHostConnected
  })

  useReportConnection({ clock, status })
  useReturnToWallPairing(error?.code === 'wall_dismissed')
  usePhaseField(view?.phase ?? null)
  useMarkingField(view?.phase === 'playing' && slateWall.isOnWall)
  useScreenAwake(!isRefused)
  useIdleChrome(!isRefused)

  const { canPlay, refusal, unlock } = useRoundAudio({
    clock,
    view: speakingView,
    volume
  })

  useBuzzCue(speakingView?.round?.activeBuzz?.atServerTime ?? null)
  useTimerCue({ clock, view: speakingView })
  useReportRoomActions({
    adjustScore: null,
    closeRoom: null,
    endGame: null,
    handOver: null,
    leaveSeat: null,
    playsSound: isSpeaker,
    refusedNickname: null,
    rename: null,
    revealRound: null,
    scoredPlayers: NOBODY,
    scoredTeams: NOBODY,
    seatNickname: null,
    trackLength: null
  })

  const armAudio = () => {
    unlock()
    unlockCues()
  }

  // Tried once without a press, because a screen reached by a click inside
  // this tab already carries the browser's permission to play. When it does
  // not, the offer in the header stays until somebody presses it.
  const tryArmingUnasked = useEffectEvent(armAudio)

  useEffect(() => {
    tryArmingUnasked()
  }, [])

  if (isRefused) {
    return (
      <Main className='host-console-page wall-page'>
        <RoomDocumentTitle settings={view?.settings ?? null} />
        <div className='stage solo'>
          <ConnectionRefused error={error}>
            {error?.code === 'wall_not_paired' && (
              <Link href={paths.wallPairing} size='large' variant='filled'>
                {translate('wall.pairAgain')}
              </Link>
            )}
          </ConnectionRefused>
        </div>
      </Main>
    )
  }

  const spokenTurn = blackSquareContent(view?.round)?.spoken ?? null

  return (
    <PawnColoursProvider view={view}>
      <Main className='host-console-page wall-page'>
        <RoomDocumentTitle settings={view?.settings ?? null} />
        <header>
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
          {spokenTurn !== null &&
            view !== null &&
            view.phase !== 'finished' && (
              <BlackSquareTurn
                players={view.players}
                seatId={view.youId}
                spoken={spokenTurn}
                teams={view.teams}
              />
            )}
          {!canPlay &&
            (view === null ||
              (isSpeaker && !isEveningSilent(view.settings))) && (
              <Button
                className='sound-offer'
                onPress={armAudio}
                size='small'
                variant='outlined'
              >
                {translate('wall.sound')}
              </Button>
            )}
          {view !== null &&
            view.phase !== 'lobby' &&
            view.settings.teams.kind !== 'aloud' && (
              <JoinReminder roomCode={roomCode} />
            )}
        </header>

        {isHostAway && (
          <aside className='host-away'>
            <p>{translate('wall.hostAway.title')}</p>
            <Link
              href={hostFromWallPathFor(roomCode)}
              size='small'
              variant='outlined'
            >
              {translate('wall.hostAway.takeOver')}
            </Link>
          </aside>
        )}

        {view === null ? (
          <div className='stage arriving'>
            <p role='status'>{translate('wall.arriving')}</p>
          </div>
        ) : (
          <RoomStage
            canPlay={canPlay}
            clock={clock}
            controls={null}
            isBoardAround
            isSpeaker={isSpeaker}
            onUnlockAudio={armAudio}
            refusal={refusal}
            roomCode={roomCode}
            slateWall={slateWall}
            view={view}
          />
        )}
      </Main>
      {view !== null && (
        <BoardTrack board={view.settings.board} pawns={trackPawnsOf(view)} />
      )}
    </PawnColoursProvider>
  )
}
