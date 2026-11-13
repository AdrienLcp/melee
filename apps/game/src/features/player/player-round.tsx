import type React from 'react'
import { Suspense, use, useEffect } from 'react'

import type { BlackSquareCell } from '@melee/protocol/black-square'
import type {
  LeanAnswer,
  PlayerClientMessage
} from '@melee/protocol/client-message'
import type { PlayerRoomView, RoomPhase } from '@melee/protocol/room'
import type { ProtocolErrorMessage } from '@melee/protocol/server-message'

import { isShelvedGame } from '@melee/core/room/shelved-game'
import { teamOfSeat } from '@melee/core/team/team-board'
import type { ClockEstimate } from '@melee/core/time/clock-sync'

import type { PlayerAnswer } from '@/features/player/answer-forms'
import {
  LobbyTeams,
  type TeamSeatMessage
} from '@/features/player/player-teams'
import { YourTrackStrip } from '@/features/player/your-track-strip'
import { innerclockContent } from '@/helpers/round-content'
import { lazyModule } from '@/infrastructure/lazy-module'
import { BoardKindProvider } from '@/presentation/components/board-kind'
import { CountPrompt } from '@/presentation/components/count-prompt'
import { Countdown } from '@/presentation/components/countdown'
import { EmptySockets } from '@/presentation/components/empty-sockets'
import { NoticeCard } from '@/presentation/components/notice-card'
import { OwnPawnPress } from '@/presentation/components/own-pawn-press'
import { RoomInvitation } from '@/presentation/components/room-invitation'
import { Scoreboard } from '@/presentation/components/scoreboard'
import { ScoringRule } from '@/presentation/components/scoring-rule'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import {
  reflexOutcome,
  useBuzzOutcome
} from '@/presentation/haptics/buzz-outcome'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useEntryName } from '@/presentation/i18n/line-up-entry-names'

import './player-round.sass'

type PetitBacSeatMessage = Extract<
  PlayerClientMessage,
  { type: `petitbac.${string}` }
>

const ROUND_IS_RUNNING = new Set<RoomPhase>(['buzzed', 'countdown', 'playing'])

/**
 * Whether the round gives way to the host-away card, ahead of every mode,
 * because the server has frozen the round and none of the screens would say
 * why. The buzzer carries its own reason through `findBuzzBlocker`; a grid of
 * choices and a pair of text fields have nowhere to put one, and would sit
 * there looking answerable. A sheet is the exception: a line moves nothing
 * along, so the server keeps taking them while the console is away, and the
 * pen stays in the hand.
 */
export const showsTheHostAwayCard = (view: PlayerRoomView): boolean => {
  const round = view.round
  const isWritingASheet =
    view.phase === 'playing' &&
    (round?.content.kind === 'slate' ||
      (round?.content.kind === 'petitbac' && !round.content.sheetsClosed))

  return (
    !view.isHostConnected &&
    !isWritingASheet &&
    ROUND_IS_RUNNING.has(view.phase)
  )
}

export type PlayerRoundProps = {
  clock: ClockEstimate | null
  /** `false` from the socket means the frame was never written. */
  onAnswer: (answer: PlayerAnswer, roundId: string) => boolean
  /** `false` from the socket means the frame was never written. */
  onBuzz: (roundId: string) => boolean
  /** Saves what the seat's screen holds before it is sent; `false` from the socket means the frame was never written. */
  onLean: (answer: LeanAnswer | null, roundId: string) => boolean
  /** A seat's own team frames, joining one or repainting it; `false` from the socket means the frame was never written. */
  onTeam: (message: TeamSeatMessage) => boolean
  /** `false` from the socket means the frame was never written. */
  onReady: (isReady: boolean) => boolean
  /** The keeper's tick in a spoken black square; `false` from the socket means the frame was never written. */
  onTick: (tick: {
    cell: BlackSquareCell | 'blackWord'
    isTicked: boolean
    roundId: string
  }) => boolean
  /** A Petit Bac line, stop, vote or done; `false` from the socket means the frame was never written. */
  onPetitBac: (message: PetitBacSeatMessage) => boolean
  /** `false` from the socket means the frame was never written. */
  onWriteLine: (itemIndex: number, answer: string, roundId: string) => boolean
  /** The server's last refusal to this screen, which a hidden word's seat says under its grid. */
  refusal: ProtocolErrorMessage | null
  view: PlayerRoomView
}

const roundStageModule = lazyModule(() => import('./player-round-stage'))

const LoadedRoundStage: React.FC<PlayerRoundProps> = (props) => {
  const { PlayerRoundStage } = use(roundStageModule.load())

  return <PlayerRoundStage {...props} />
}

/**
 * The game a line-up's next round is on, on its lid, over the count into it:
 * the round about to start may be another game than the one just revealed.
 * A room of one game has nothing to announce.
 */
const CountingInGame: React.FC<{ view: PlayerRoomView }> = ({ view }) => {
  const entryName = useEntryName(view.settings)
  const game = view.settings.game

  if (view.settings.lineUp.length < 2 || game === null || entryName === null) {
    return null
  }

  return (
    <div className='up-next' data-game={game.kind}>
      <p className='game-name'>{entryName}</p>
    </div>
  )
}

export const PlayerRound: React.FC<PlayerRoundProps> = (props) => {
  useEffect(() => {
    void roundStageModule.load()
  }, [])

  return (
    <BoardKindProvider board={props.view.settings.board}>
      <PlayerRoundPhase {...props} />
    </BoardKindProvider>
  )
}

const PlayerRoundPhase: React.FC<PlayerRoundProps> = (props) => {
  const { clock, onTeam, view } = props
  const translate = useTranslate()
  const round = view.round
  const isPickingTeam =
    view.settings.teams.kind === 'chosen' &&
    teamOfSeat({ playerId: view.youId, teams: view.teams }) === null

  useBuzzOutcome(reflexOutcome({ round, youId: view.youId }))

  if (showsTheHostAwayCard(view)) {
    return (
      <section className='player-round notice'>
        <NoticeCard title={translate('buzz.blocked.host_away')} />
      </section>
    )
  }

  // The room fills up while the table decides, so this is where a player's
  // screen waits longest — and the only moment nobody is against a clock, which
  // is why it is where what the evening pays is explained and where the room
  // the player walked into is drawn. Nobody has scored yet, so the board is a
  // column of names: no rank, no score, and the one screen with the space to
  // spend on it.
  //
  // The host being away replaces the pitch rather than the screen. A lobby has
  // nothing to block — who is at the table stays true while the console is
  // gone — but *the host is choosing a game* would be a lie about the one
  // thing the player is waiting on.
  // A seat that arrived once the game was under way still owes the room a
  // team, and the server still takes its pick until the next round places it.
  // A round it was not stamped on has nothing else for it to do.
  if (isPickingTeam && view.phase !== 'lobby' && view.phase !== 'finished') {
    return (
      <section className='player-round lobby' data-picking-team>
        {round?.joinedAfterStart === true && (
          <NoticeCard
            detail={translate('player.midRound.detail')}
            title={translate('player.midRound.title')}
          />
        )}
        <div className='table'>
          <div className='seats'>
            <LobbyTeams onTeam={onTeam} view={view} />
          </div>
        </div>
      </section>
    )
  }

  if (view.phase === 'lobby') {
    return (
      <section
        className='player-round lobby'
        data-host-away={!view.isHostConnected || undefined}
        data-picking-team={isPickingTeam || undefined}
      >
        <div
          className='fold'
          data-open={view.isHostConnected || undefined}
          inert={!view.isHostConnected}
        >
          <div>
            <UpNext view={view} />
          </div>
        </div>
        <div
          className='fold'
          data-open={!view.isHostConnected || undefined}
          inert={view.isHostConnected}
        >
          <div>
            <NoticeCard title={translate('buzz.blocked.host_away')} />
          </div>
        </div>

        <YourTrackStrip view={view} />

        {/* The seats are a grid counted against the box around them, which a
            container query can only read from an ancestor. */}
        <div className='table'>
          <div className='seats'>
            {view.teams.length > 0 ? (
              <LobbyTeams onTeam={onTeam} view={view} />
            ) : (
              <>
                <Scoreboard
                  hasPawns
                  isRoster
                  label={translate('player.table')}
                  players={view.players}
                  youAction={<OwnPawnPress />}
                  youId={view.youId}
                />
                <EmptySockets seated={view.players.length} />
              </>
            )}
          </div>
        </div>

        {/* Under the seats, a scroll away: passed along a row of seats to
            whoever is arriving, while the room's own screen may be far. */}
        {view.settings.teams.kind !== 'aloud' && (
          <RoomInvitation roomCode={view.code} />
        )}
      </section>
    )
  }

  if (view.phase === 'countdown' && round?.startsAt != null) {
    const counting = innerclockContent(round)

    // The target before the start, never over the last reveal: a count read
    // while it is already running starts late.
    if (counting !== null) {
      return (
        <section className='player-round notice'>
          <CountingInGame view={view} />
          <CountPrompt isCompact targetSeconds={counting.targetSeconds} />
          <Countdown clock={clock} target={round.startsAt} />
        </section>
      )
    }

    return (
      <section className='player-round notice'>
        <CountingInGame view={view} />
        <Countdown clock={clock} target={round.startsAt} />
      </section>
    )
  }

  return (
    <Suspense>
      <LoadedRoundStage {...props} />
    </Suspense>
  )
}

/**
 * What this player's screen is about to play, which is the honest answer to a
 * lobby: the room is opened before the table decides, so "the host is choosing"
 * is a state and not a gap. Once they have, the game names itself and says what
 * it pays — the same pitch the shelf shows, on the screen the player is
 * holding. A line-up shows nothing here: each of its games is announced by its
 * own countdown, so what the host planned stays a surprise.
 */
const UpNext: React.FC<{ view: PlayerRoomView }> = ({ view }) => {
  const translate = useTranslate()
  const game = view.settings.game
  const entryName = useEntryName(view.settings)

  if (view.settings.lineUp.length > 1) {
    return null
  }

  if (game === null || entryName === null || !isShelvedGame(game.kind)) {
    return (
      <div className='up-next undecided'>
        <p className='game-name'>{translate('player.choosingGame')}</p>
      </div>
    )
  }

  return (
    <div className='up-next' data-game={game.kind}>
      <p className='game-name'>
        <VisuallyHidden elementType='span'>
          {`${translate('player.upNext')} `}
        </VisuallyHidden>
        {entryName}
      </p>
      <ScoringRule
        className='how-it-scores'
        game={game}
        settings={view.settings}
      />
    </div>
  )
}
