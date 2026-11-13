import { useScreenAwake } from '@adrienlcp/browser/react'
import type React from 'react'

import type { RoomCode } from '@melee/protocol/identifiers'
import type { PlayerRoomView } from '@melee/protocol/room'

import { slateContent } from '@/helpers/round-content'
import type { PlayerConnection } from '@/infrastructure/messaging/use-player-connection'
import { ConnectionRefused } from '@/presentation/components/connection-refused'
import { useWorldMapAhead } from '@/presentation/components/lazy-world-map'
import { Main } from '@/presentation/components/main'
import { NoticeCard } from '@/presentation/components/notice-card'
import { PawnPiecesProvider } from '@/presentation/components/pawn-pieces'
import { RoundChrome } from '@/presentation/components/round-chrome'
import { useReportConnection } from '@/presentation/connection/connection-provider'
import { useTimeOutNudge } from '@/presentation/haptics/time-out-nudge'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useMarkingField } from '@/presentation/theme/use-marking-field'
import { usePhaseField } from '@/presentation/theme/use-phase-field'
import { useRoundDealt } from '@/presentation/use-round-dealt'

import { LiftedNotice } from './lifted-notice'
import { PauseHold } from './pause-hold'
import { PlayerRound, showsTheHostAwayCard } from './player-round'
import { RoundClock } from './round-clock'

export type SeatedScreenProps = {
  /** The room socket the page opened, so the hello went out before this module landed. */
  connection: PlayerConnection
  roomCode: RoomCode
}

/**
 * A player's screen once it holds a name: the wait for a seat, the lobby,
 * every round and the final board. Split from the page so a player arriving
 * loads the name form alone; the page fetches it once a name is typed or
 * stored.
 */
export const SeatedScreen: React.FC<SeatedScreenProps> = ({
  connection,
  roomCode
}) => {
  const translate = useTranslate()
  const { clock, error, send, status, view } = connection

  useWorldMapAhead(view?.settings.lineUp ?? [])

  useReportConnection({ clock, status })
  usePhaseField(view?.phase ?? null)
  const isRoundDealt = useRoundDealt(view)
  const slate = slateContent(view?.round)
  useMarkingField(
    view?.phase === 'playing' &&
      slate?.currentItemIndex != null &&
      !slate.itemStates.includes('open')
  )
  useScreenAwake(status !== 'refused' && view?.phase !== 'finished')
  useTimeOutNudge({ clock, view })

  // A table answering aloud turns every phone away without closing the
  // socket, since the host may switch it back; until then this is a dead end.
  if (
    status === 'refused' ||
    (view === null && error?.code === 'room_plays_aloud')
  ) {
    return (
      <Main className='player-page'>
        <ConnectionRefused error={error} />
      </Main>
    )
  }

  const hostReturns = (
    <LiftedNotice
      isShown={view !== null && showsTheHostAwayCard(view)}
      liftsInPlace={view?.isHostConnected === true}
    >
      <NoticeCard title={translate('buzz.blocked.host_away')} />
    </LiftedNotice>
  )

  if (view !== null && isFramed(view)) {
    return (
      <PawnPiecesProvider view={view}>
        <Main
          className='player-page playing framed'
          data-round-dealt={isRoundDealt || undefined}
        >
          {hostReturns}
          <RoundChrome
            duel={view.round?.duel ?? null}
            players={view.players}
            roundCount={view.settings.roundCount}
            roundIndex={view.round?.index ?? 0}
            teams={view.teams}
            youId={view.youId}
          />
          <div className='card-clock'>
            <RoundClock clock={clock} view={view} />
          </div>
          <PauseHold isPaused={view.isPaused}>
            <PlayerRound
              clock={clock}
              onAnswer={(answer, roundId) =>
                send({ answer, roundId, type: 'player.answer' })
              }
              onBuzz={(roundId) => send({ roundId, type: 'player.buzz' })}
              onLean={(answer, roundId) =>
                send({ answer, roundId, type: 'player.lean' })
              }
              onPetitBac={(message) => send(message)}
              onReady={(isReady) => send({ isReady, type: 'player.ready' })}
              onTeam={(message) => send(message)}
              onTick={(tick) => send({ ...tick, type: 'blacksquare.tick' })}
              onWriteLine={(itemIndex, answer, roundId) =>
                send({ answer, itemIndex, roundId, type: 'slate.write' })
              }
              refusal={error}
              view={view}
            />
          </PauseHold>
        </Main>
      </PawnPiecesProvider>
    )
  }

  return (
    <PawnPiecesProvider view={view}>
      <Main
        className='player-page playing'
        data-round-dealt={isRoundDealt || undefined}
      >
        {hostReturns}
        {view === null ? (
          <p className='waiting'>{translate('player.seating')}</p>
        ) : (
          <>
            <RoundChrome
              duel={view.round?.duel ?? null}
              players={view.players}
              roomCode={roomCode}
              roundCount={view.settings.roundCount}
              roundIndex={
                view.round === null ||
                view.phase === 'lobby' ||
                view.phase === 'finished'
                  ? null
                  : view.round.index
              }
              teams={view.teams}
              youId={view.youId}
            />
            <PauseHold isPaused={view.isPaused}>
              <PlayerRound
                clock={clock}
                onAnswer={(answer, roundId) =>
                  send({ answer, roundId, type: 'player.answer' })
                }
                onBuzz={(roundId) => send({ roundId, type: 'player.buzz' })}
                onLean={(answer, roundId) =>
                  send({ answer, roundId, type: 'player.lean' })
                }
                onPetitBac={(message) => send(message)}
                onReady={(isReady) => send({ isReady, type: 'player.ready' })}
                onTeam={(message) => send(message)}
                onTick={(tick) => send({ ...tick, type: 'blacksquare.tick' })}
                onWriteLine={(itemIndex, answer, roundId) =>
                  send({ answer, itemIndex, roundId, type: 'slate.write' })
                }
                refusal={error}
                view={view}
              />
            </PauseHold>
          </>
        )}
      </Main>
    </PawnPiecesProvider>
  )
}

/**
 * The screens held to the viewport: four tiles, or the buzzer and the floor it
 * hands over, visible at once on any screen at any ratio. Everything else on a
 * player's screen may scroll; these may not, because the tile or the buzzer
 * that scrolled away is the round.
 */
const isFramed = (view: PlayerRoomView): boolean =>
  view.isHostConnected &&
  view.round !== null &&
  !view.round.joinedAfterStart &&
  ((view.phase === 'playing' && view.round.answerMode === 'choice') ||
    ((view.phase === 'playing' || view.phase === 'buzzed') &&
      view.round.answerMode === 'buzzer'))
