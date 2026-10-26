import { classNames } from '@adrienlcp/react'
import type React from 'react'
import { useState } from 'react'
import { Button as ReactAriaButton } from 'react-aria-components'

import type {
  BlackSquareCell,
  BlackSquareLabels
} from '@melee/protocol/black-square'
import type { PlayerClientMessage } from '@melee/protocol/client-message'
import type { SentMove } from '@melee/protocol/matchsticks'
import type {
  ActiveBuzz,
  PlayerRoomView,
  RoomPhase,
  RoundView
} from '@melee/protocol/room'
import type { TeamId } from '@melee/protocol/team'
import type { DatedTimelineEvent } from '@melee/protocol/timeline'

import { cueOf, whatTheRoomNames } from '@melee/core/blindtest/typed-answer'
import { isShelvedGame } from '@melee/core/room/shelved-game'
import {
  type BuzzBlocker,
  findBuzzBlocker
} from '@melee/core/round/buzz-eligibility'
import {
  buildScoreboard,
  hasAnybodyScored,
  standingOf
} from '@melee/core/scoring/scoreboard'
import { playsThisRound } from '@melee/core/team/duel'
import { teamOfSeat, teamStandingOf } from '@melee/core/team/team-board'
import {
  type ClockEstimate,
  millisecondsUntil
} from '@melee/core/time/clock-sync'

import { type PlayerAnswer, TypedAnswer } from '@/features/player/answer-forms'
import { BlackSquareAnswer } from '@/features/player/black-square-answer'
import { ChoosingRound } from '@/features/player/choosing-round'
import { InnerclockPress } from '@/features/player/innerclock-press'
import { MapAnswer } from '@/features/player/map-answer'
import { MatchsticksMove } from '@/features/player/matchsticks-move'
import { PetitBacReveal } from '@/features/player/petit-bac-reveal'
import { PetitBacSheet, PetitBacVote } from '@/features/player/petit-bac-sheet'
import { LobbyTeams, TeamFinish } from '@/features/player/player-teams'
import { ReflexBuzzer } from '@/features/player/reflex-buzzer'
import { RoundBoard } from '@/features/player/round-board'
import { RoundClock } from '@/features/player/round-clock'
import { RoundQuestion } from '@/features/player/round-question'
import {
  SlateOnTheWall,
  SlateSheet,
  SlateWholeSheet
} from '@/features/player/slate-sheet'
import { TimelineAnswer } from '@/features/player/timeline-answer'
import { YourTrackStrip } from '@/features/player/your-track-strip'
import { answerFitting } from '@/helpers/answer-fitting'
import {
  atlasContent,
  blackSquareContent,
  blindtestContent,
  innerclockContent,
  matchsticksContent,
  petitBacContent,
  placesFromBestOf,
  quizContent,
  reflexContent,
  sentOrderOf,
  swappedPairsOf,
  timelineContent
} from '@/helpers/round-content'
import { slateLabelsOf } from '@/helpers/slate-labels'
import { buzzFeedback } from '@/infrastructure/browser'
import { nowMs } from '@/infrastructure/clock'
import { AskedQuestion } from '@/presentation/components/asked-question'
import { BlackSquareReveal } from '@/presentation/components/black-square-reveal'
import { BlackSquareSpoken } from '@/presentation/components/black-square-spoken'
import { CountPrompt } from '@/presentation/components/count-prompt'
import { Countdown } from '@/presentation/components/countdown'
import { CountedBoard } from '@/presentation/components/counted-board'
import { EmptySockets } from '@/presentation/components/empty-sockets'
import { FlagPicture } from '@/presentation/components/flag-picture'
import { FloorClock } from '@/presentation/components/floor-clock'
import { MapPrompt } from '@/presentation/components/map-prompt'
import { MapReveal } from '@/presentation/components/map-reveal'
import { MatchstickRow } from '@/presentation/components/matchstick-row'
import { MatchsticksPrompt } from '@/presentation/components/matchsticks-prompt'
import { Pawn } from '@/presentation/components/pawn'
import { ReactionBoard } from '@/presentation/components/reaction-board'
import { RebusLine } from '@/presentation/components/rebus-line'
import { Scoreboard } from '@/presentation/components/scoreboard'
import { TeamRoster } from '@/presentation/components/team-roster'
import { TimelineStrip } from '@/presentation/components/timeline-strip'
import { ToggleButton } from '@/presentation/components/toggle-button'
import {
  useMoveWords,
  useOrderWords
} from '@/presentation/components/use-distance-words'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import {
  floorOutcome,
  reflexOutcome,
  useBuzzOutcome
} from '@/presentation/haptics/buzz-outcome'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'
import { useLineUpEntryNames } from '@/presentation/i18n/line-up-entry-names'
import {
  buzzBlockerKey,
  gameNameKey,
  scoringKey,
  type Translate
} from '@/presentation/i18n/translation'

import './player-round.sass'

type PetitBacSeatMessage = Extract<
  PlayerClientMessage,
  { type: `petitbac.${string}` }
>

const ROUND_IS_RUNNING = new Set<RoomPhase>(['buzzed', 'countdown', 'playing'])

type PlayerRoundProps = {
  clock: ClockEstimate | null
  /** `false` from the socket means the frame was never written. */
  onAnswer: (answer: PlayerAnswer, roundId: string) => boolean
  /** `false` from the socket means the frame was never written. */
  onBuzz: (roundId: string) => boolean
  /** `false` from the socket means the frame was never written. */
  onChooseTeam: (teamId: TeamId) => boolean
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
  view: PlayerRoomView
}

type RevealedRoundProps = {
  clock: ClockEstimate | null
  /** When the next round's clip starts, while it counts in over this reveal. */
  countingInTo: number | null
  /** Absent while the next round counts in, when there is nothing left to be ready for. */
  onReady?: (isReady: boolean) => boolean
  round: RoundView
  view: PlayerRoomView
}

/**
 * The room's round under this seat's own: the seats ranked, or in a team room
 * the teams — the place a seat is owed there is its team's, as on the final
 * board.
 */
const RevealBoard: React.FC<{ round: RoundView; view: PlayerRoomView }> = ({
  round,
  view
}) => {
  const translate = useTranslate()

  return view.teams.length > 0 ? (
    <TeamRoster
      isRanked
      label={translate('host.standings')}
      players={view.players}
      teams={view.teams}
      youId={view.youId}
    />
  ) : (
    <RoundBoard round={round} view={view} />
  )
}

const RevealedRound: React.FC<RevealedRoundProps> = ({
  clock,
  countingInTo,
  onReady,
  round,
  view
}) => (
  <section className='player-round revealed'>
    {/* Grouped here rather than placed in the stylesheet, because the wide
        screen lays the two halves side by side and a grid item spanning
        rows it never declared silently resolves back to the first one. */}
    <div className='outcome'>
      <Revealed round={round} view={view} />
      <YourRound round={round} view={view} />
      <YourTrackStrip isWholeWithoutWall view={view} />
    </div>
    <RevealBoard round={round} view={view} />
    <div className='hold'>
      {countingInTo !== null && (
        <Countdown
          className='counting-in'
          clock={clock}
          target={countingInTo}
        />
      )}
      <RoundClock
        clock={clock}
        view={
          countingInTo === null
            ? view
            : { ...view, round: { ...round, advancesAt: countingInTo } }
        }
      />
    </div>
    {onReady !== undefined && (
      <BackAtTheTable onReady={onReady} round={round} view={view} />
    )}
  </section>
)

/**
 * Between two rounds of an evening, the press that tells the wall this seat is
 * back at the table, under the game the next round is on. It is a word to the
 * room, never a gate: the host starts when they like. The last round of a
 * counted evening has nothing after it to be ready for.
 */
const BackAtTheTable: React.FC<{
  onReady: (isReady: boolean) => boolean
  round: RoundView
  view: PlayerRoomView
}> = ({ onReady, round, view }) => {
  const translate = useTranslate()
  const { game, lineUp, lineUpAt, roundCount } = view.settings
  const entryNames = useLineUpEntryNames(lineUp)
  const you = view.players.find((player) => player.id === view.youId)

  if (
    lineUp.length < 2 ||
    game === null ||
    you === undefined ||
    (roundCount !== null && round.index >= roundCount)
  ) {
    return null
  }

  return (
    <div className='back-at-the-table'>
      <p className='next-game'>
        {translate('player.lineUp.next', {
          game:
            (lineUpAt === null ? undefined : entryNames[lineUpAt]) ??
            translate(gameNameKey(game.kind))
        })}
      </p>
      <ToggleButton
        isSelected={you.isReady}
        onChange={(isReady) => {
          onReady(isReady)
        }}
        size='large'
      >
        {translate(
          you.isReady ? 'player.lineUp.ready' : 'player.lineUp.getReady'
        )}
      </ToggleButton>
    </div>
  )
}

/**
 * The reveal the next round's countdown is drawn over. The view stops carrying
 * it the moment that round opens, so it is this screen's memory of what it
 * drew — the console keeps the same one, for the same reason.
 */
const useRevealStillBeingRead = (
  view: PlayerRoomView
): PlayerRoomView | null => {
  const [lastRevealed, setLastRevealed] = useState<PlayerRoomView | null>(null)

  if (view.phase === 'revealed' && view !== lastRevealed) {
    setLastRevealed(view)
  }

  if (
    lastRevealed !== null &&
    (view.phase === 'lobby' || view.phase === 'finished')
  ) {
    setLastRevealed(null)
  }

  return lastRevealed
}

export const PlayerRound: React.FC<PlayerRoundProps> = ({
  clock,
  onAnswer,
  onBuzz,
  onChooseTeam,
  onPetitBac,
  onReady,
  onTick,
  onWriteLine,
  view
}) => {
  const { locale, translate } = useI18n()
  const round = view.round
  const isPickingTeam =
    view.settings.teams.kind === 'chosen' &&
    teamOfSeat({ playerId: view.youId, teams: view.teams }) === null

  useBuzzOutcome(reflexOutcome({ round, youId: view.youId }))

  const lastRevealed = useRevealStillBeingRead(view)

  // Ahead of every mode, because the server has frozen the round and none of
  // the three screens below would say why. The buzzer carries its own reason
  // through `findBuzzBlocker`; a grid of choices and a pair of text fields have
  // nowhere to put one, and would sit there looking answerable.
  // A sheet is the exception: a line moves nothing along, so the server keeps
  // taking them while the console is away, and the pen stays in the hand.
  const isWritingASheet =
    view.phase === 'playing' &&
    (round?.content.kind === 'slate' ||
      (round?.content.kind === 'petitbac' && !round.content.sheetsClosed))

  if (
    !view.isHostConnected &&
    !isWritingASheet &&
    ROUND_IS_RUNNING.has(view.phase)
  ) {
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
            <LobbyTeams onChooseTeam={onChooseTeam} view={view} />
          </div>
        </div>
      </section>
    )
  }

  if (view.phase === 'lobby') {
    return (
      <section
        className='player-round lobby'
        data-picking-team={isPickingTeam || undefined}
      >
        {view.isHostConnected ? (
          <UpNext view={view} />
        ) : (
          <NoticeCard title={translate('buzz.blocked.host_away')} />
        )}

        <YourTrackStrip view={view} />

        {/* The seats are a grid counted against the box around them, which a
            container query can only read from an ancestor. */}
        <div className='table'>
          <div className='seats'>
            {view.teams.length > 0 ? (
              <LobbyTeams onChooseTeam={onChooseTeam} view={view} />
            ) : (
              <>
                <Scoreboard
                  hasPawns
                  label={translate('player.table')}
                  players={view.players}
                  youId={view.youId}
                />
                <EmptySockets seated={view.players.length} />
              </>
            )}
          </div>
        </div>
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
          <CountPrompt isCompact targetSeconds={counting.targetSeconds} />
          <Countdown clock={clock} target={round.startsAt} />
        </section>
      )
    }

    // The next round counts in over the answer the room is still reading, and
    // the hold's groove runs on to the first note: one wait, not two.
    if (lastRevealed?.round != null) {
      return (
        <RevealedRound
          clock={clock}
          countingInTo={round.startsAt}
          round={lastRevealed.round}
          view={lastRevealed}
        />
      )
    }

    return (
      <section className='player-round notice'>
        <Countdown clock={clock} target={round.startsAt} />
      </section>
    )
  }

  if (view.phase === 'revealed' && round != null) {
    return (
      <RevealedRound
        clock={clock}
        countingInTo={null}
        onReady={onReady}
        round={round}
        view={view}
      />
    )
  }

  if (view.phase === 'finished') {
    return (
      <section className='player-round finished'>
        {view.teams.length > 0 ? (
          <TeamFinish view={view} />
        ) : (
          <>
            <YourPlacing view={view} />
            <Scoreboard
              hasPawns
              isResult
              players={view.players}
              youId={view.youId}
            />
          </>
        )}
      </section>
    )
  }

  // A duel between two other seats: this one is in the game and owes nothing,
  // so it reads the round over a duellist's shoulder — the room may have no
  // wall to watch it on.
  if (
    view.phase === 'playing' &&
    round != null &&
    round.duel !== null &&
    !playsThisRound({ duel: round.duel, seatId: view.youId })
  ) {
    return <WatchedDuel clock={clock} round={round} view={view} />
  }

  // Below the reveal and the final board on purpose: those are what the round
  // turned out to be, and a player who walked in on it is in the room for them.
  // What it must not be shown is the form, because the server refuses every
  // frame it could send — a field that cannot be submitted is worse than a wait.
  if (round?.joinedAfterStart === true) {
    return (
      <section className='player-round notice'>
        <NoticeCard
          detail={translate('player.midRound.detail')}
          title={translate('player.midRound.title')}
        />
      </section>
    )
  }

  // Nothing to press in any phase: the table plays it, the host calls who
  // won, and the server refuses a buzz.
  if (
    (view.phase === 'playing' || view.phase === 'buzzed') &&
    round?.content.kind === 'challenge'
  ) {
    return (
      <section className='player-round notice'>
        <NoticeCard
          detail={translate('challenge.atTheTable')}
          title={
            round.content.labels?.[locale] ?? translate('challenge.untitled')
          }
        />
      </section>
    )
  }

  if (view.phase === 'playing' && round?.content.kind === 'slate') {
    const labels = slateLabelsOf(view.settings)
    const hasOpenItem = round.content.itemStates.includes('open')

    return (
      <section className='player-round'>
        <SlateOnTheWall isCompact={hasOpenItem} labels={labels} round={round} />
        {hasOpenItem && (
          <SlateSheet
            labels={labels}
            onWrite={(itemIndex, answer) =>
              onWriteLine(itemIndex, answer, round.id)
            }
            round={round}
          />
        )}
        {round.content.currentItemIndex !== null && (
          <SlateWholeSheet labels={labels} round={round} />
        )}
      </section>
    )
  }

  if (view.phase === 'playing' && round?.content.kind === 'petitbac') {
    const roundId = round.id

    return (
      <section className='player-round petit-bac-round'>
        {round.content.sheetsClosed ? (
          <PetitBacVote
            onDone={(categoryIndex) =>
              onPetitBac({
                categoryIndex,
                roundId,
                type: 'petitbac.doneVoting'
              })
            }
            onVote={(vote) =>
              onPetitBac({ ...vote, roundId, type: 'petitbac.vote' })
            }
            round={round}
            view={view}
          />
        ) : (
          <PetitBacSheet
            clock={clock}
            onStop={() => onPetitBac({ roundId, type: 'petitbac.stop' })}
            onWrite={(categoryIndex, answer) =>
              onPetitBac({
                answer,
                categoryIndex,
                roundId,
                type: 'petitbac.write'
              })
            }
            round={round}
            view={view}
          />
        )}
      </section>
    )
  }

  if (view.phase === 'playing' && view.round !== null) {
    const round = view.round

    const answerWithRound = (answer: PlayerAnswer): boolean =>
      onAnswer(answer, round.id)

    if (round.content.kind === 'innerclock') {
      return <InnerclockPress onPress={onBuzz} round={round} />
    }

    if (round.content.kind === 'reflex') {
      return (
        <ReflexBuzzer
          clock={clock}
          onBuzz={onBuzz}
          round={round}
          youId={view.youId}
        />
      )
    }

    const atlas = atlasContent(round)

    if (atlas?.target != null) {
      return (
        <section className='player-round map-round'>
          <div className='round-card'>
            <MapPrompt target={atlas.target} />
            <RoundClock clock={clock} view={view} />
          </div>
          <MapAnswer
            key={round.id}
            onAnswer={answerWithRound}
            round={round}
            seat={view.players.findIndex((player) => player.id === view.youId)}
            youId={view.youId}
          />
        </section>
      )
    }

    if (timelineContent(round) !== null) {
      return (
        <section className='player-round timeline-round'>
          <RoundClock clock={clock} view={view} />
          <TimelineAnswer
            key={round.id}
            onAnswer={answerWithRound}
            round={round}
            youId={view.youId}
          />
        </section>
      )
    }

    const blackSquare = blackSquareContent(round)

    if (blackSquare !== null) {
      return (
        <section className='player-round black-square-round'>
          <BlackSquareThemeCard
            clock={clock}
            theme={blackSquare.theme}
            view={view}
          />
          {blackSquare.spoken === null ? (
            <BlackSquareAnswer
              key={round.id}
              onAnswer={answerWithRound}
              round={round}
              verdict={view.yourVerdict}
            />
          ) : (
            <BlackSquareSpoken
              answerCount={blackSquare.answerCount}
              key={round.id}
              onTick={(cell, isTicked) =>
                onTick({ cell, isTicked, roundId: round.id })
              }
              players={view.players}
              seatId={view.youId}
              spoken={blackSquare.spoken}
              teams={view.teams}
            />
          )}
        </section>
      )
    }

    const matchsticks = matchsticksContent(round)

    if (matchsticks !== null && round.answerMode === 'move') {
      return (
        <section className='player-round matchsticks-round'>
          <MatchsticksMove
            card={(sticks) => (
              <div className='round-card'>
                <MatchsticksPrompt puzzle={matchsticks.puzzle}>
                  {sticks}
                </MatchsticksPrompt>
                <RoundClock clock={clock} view={view} />
              </div>
            )}
            key={round.id}
            onAnswer={answerWithRound}
            round={round}
          />
        </section>
      )
    }

    if (round.answerMode === 'choice') {
      return (
        <ChoosingRound
          onAnswer={answerWithRound}
          round={round}
          youId={view.youId}
        />
      )
    }

    if (round.answerMode === 'typed') {
      return (
        <section className='player-round typed-round'>
          <div className='round-card'>
            <RoundQuestion round={round} />
            <RoundClock clock={clock} view={view} />
          </div>
          <TypedAnswer
            // The player is never sent the track, so the settings are the
            // only place it can read what the round is asking for.
            asksForAFilm={
              view.settings.game?.kind === 'blindtest' &&
              view.settings.game.source.kind === 'film'
            }
            key={round.id}
            onAnswer={answerWithRound}
            round={round}
            verdict={view.yourVerdict}
          />
        </section>
      )
    }
  }

  // A player's screen between two rounds in a typed or choice game used to be
  // shown a dead buzzer, which is a promise the round will not keep.
  if (view.settings.mode.kind !== 'buzzer') {
    return (
      <section className='player-round notice'>
        <NoticeCard title={translate('buzz.blocked.round_not_running')} />
      </section>
    )
  }

  return <Buzzer clock={clock} onBuzz={onBuzz} view={view} />
}

/**
 * What this player's screen is about to play, which is the honest answer to a
 * lobby: the room is opened before the table decides, so "the host is choosing"
 * is a state and not a gap. Once they have, the game names itself and says what
 * it pays — the same pitch the shelf shows, on the screen the player is
 * holding.
 */
const UpNext: React.FC<{ view: PlayerRoomView }> = ({ view }) => {
  const translate = useTranslate()
  const game = view.settings.game

  if (game === null || !isShelvedGame(game.kind)) {
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
        {translate(gameNameKey(game.kind))}
      </p>
      <p className='how-it-scores'>
        {translate(
          scoringKey({
            answerMode: view.settings.mode.kind,
            asksForAFilm:
              game.kind === 'blindtest' && game.source.kind === 'film',
            atlas: game.kind === 'atlas' ? game : null,
            doublesLoneFinds:
              game.kind === 'blacksquare' && game.doublesLoneFinds,
            game: game.kind
          })
        )}
      </p>
    </div>
  )
}

/**
 * The round two other seats are duelling, as they are shown it and with
 * nothing on it to press: the question on its card, the four tiles printed,
 * the cards dealt face up. The server would refuse anything this seat sent.
 */
const WatchedDuel: React.FC<{
  clock: ClockEstimate | null
  round: RoundView
  view: PlayerRoomView
}> = ({ clock, round, view }) => {
  const translate = useTranslate()
  const atlas = atlasContent(round)
  const timeline = timelineContent(round)
  const blackSquare = blackSquareContent(round)

  if (round.answerMode === 'choice') {
    return <ChoosingRound onAnswer={null} round={round} youId={view.youId} />
  }

  if (blackSquare !== null) {
    return (
      <section className='player-round black-square-round'>
        <BlackSquareThemeCard
          clock={clock}
          theme={blackSquare.theme}
          view={view}
        />
      </section>
    )
  }

  if (timeline !== null) {
    return (
      <section className='player-round timeline-round'>
        <RoundClock clock={clock} view={view} />
        <TimelineStrip
          aria-label={translate('timeline.dealt')}
          events={timeline.events}
          layout='dealt'
        />
      </section>
    )
  }

  if (atlas?.target != null) {
    return (
      <section className='player-round map-round'>
        <div className='round-card'>
          <MapPrompt target={atlas.target} />
          <RoundClock clock={clock} view={view} />
        </div>
      </section>
    )
  }

  return (
    <section className='player-round typed-round'>
      <div className='round-card'>
        <RoundQuestion round={round} />
        <RoundClock clock={clock} view={view} />
      </div>
    </section>
  )
}

/** The theme on its paper card, the round's clock along the top. */
const BlackSquareThemeCard: React.FC<{
  clock: ClockEstimate | null
  theme: BlackSquareLabels
  view: PlayerRoomView
}> = ({ clock, theme, view }) => {
  const { locale } = useI18n()

  return (
    <div className='round-card'>
      <h2 className='black-square-theme'>{theme[locale]}</h2>
      <RoundClock clock={clock} view={view} />
    </div>
  )
}

/**
 * A wait printed on a paper card lying face up on the board: the one thing
 * this screen has to say while nothing on it can be pressed.
 */
const NoticeCard: React.FC<{ detail?: string; title: string }> = ({
  detail,
  title
}) => (
  <div className='notice-card'>
    <p className='notice-title'>{title}</p>
    {detail !== undefined && <p className='notice-detail'>{detail}</p>}
  </div>
)

/**
 * What the round did to this player — the moment, above the board that holds
 * the room's version of the same thing. It is what the eye lands on first and
 * the only number here somebody reads without looking for it, so it stays the
 * loudest thing on the screen and says nothing the row below repeats.
 *
 * It renders whether or not they gained, because *nothing* is a result too —
 * a screen that only appears for the ones who scored leaves everybody else to
 * infer from an absence whether the round was even scored. The two halves are
 * sized against that: a gain is the loudest thing on the screen, a miss is a
 * quiet line, and the ink says which without a colour saying *wrong*.
 *
 * Who there is to catch used to be carried here as a line of prose. `RoundBoard`
 * says it by name, by points and for everybody rather than for the one player
 * above, so the line is gone rather than printed twice.
 */
const YourRound: React.FC<{
  round: RoundView
  view: PlayerRoomView
}> = ({ round, view }) => {
  const translate = useTranslate()
  const award = round.awards.find((entry) => entry.playerId === view.youId)
  const points = award?.points ?? 0
  const speedBonus = award?.speedBonus ?? 0
  const payout = points > 0 ? translate('round.scored', { points }) : '0'
  const standing =
    view.teams.length > 0
      ? teamStandingOf({ playerId: view.youId, teams: view.teams })
      : standingOf({ players: view.players, youId: view.youId })

  return (
    <div className={classNames('your-round', points > 0 ? 'scored' : 'missed')}>
      <p className='payout' style={{ '--payout-length': payout.length }}>
        {payout}
      </p>
      <div className='payout-words'>
        {points === 0 && (
          <p className='you-missed'>{translate('round.missed')}</p>
        )}
        {speedBonus > 0 && (
          <p className='speed-bonus'>
            {translate('round.speedBonus', { points: speedBonus })}
          </p>
        )}
        {standing !== null && (
          <p className='standing'>
            {translate('player.standing.ofRoom', {
              count: standing.roomSize,
              rank: standing.rank
            })}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Where this player finished, which the console only ever says for the winner.
 * Ties share a place, the way the board itself ranks them — a room of two on
 * the same score reads "1st" on both players' screens, and `host.final.tied` is
 * already saying so across the room.
 */
const YourPlacing: React.FC<{ view: PlayerRoomView }> = ({ view }) => {
  const translate = useTranslate()

  if (!hasAnybodyScored(view.players)) {
    return null
  }

  const seat = view.players.findIndex((player) => player.id === view.youId)
  const yours = buildScoreboard(view.players).find(
    (entry) => entry.player.id === view.youId
  )

  if (yours === undefined) {
    return null
  }

  return (
    <div className='your-placing'>
      <Pawn seat={Math.max(0, seat)} />
      <p className='your-rank'>
        <VisuallyHidden elementType='span'>
          {`${translate('player.final.placing')} `}
        </VisuallyHidden>
        {translate('player.final.rank', { rank: yours.rank })}
      </p>
      <p className='your-total'>
        <span className='value'>
          {translate('player.score', { points: yours.player.score })}
        </span>{' '}
        {translate('player.points', { points: yours.player.score })}
      </p>
    </div>
  )
}

const Buzzer: React.FC<{
  clock: ClockEstimate | null
  onBuzz: (roundId: string) => boolean
  view: PlayerRoomView
}> = ({ clock, onBuzz, view }) => {
  const translate = useTranslate()
  const [hasFailed, setHasFailed] = useState(false)
  const [claimedRoundId, setClaimedRoundId] = useState<string | null>(null)

  const blocker = findBuzzBlocker(view)
  const roundId = view.round?.id ?? null

  // The round trip is 20–80 ms and a button that waits for the server to agree
  // feels broken, so the press is believed until the next snapshot either
  // confirms it or takes it back.
  const isClaimed = claimedRoundId === roundId && roundId !== null
  const buzz = view.round?.activeBuzz ?? null
  const isWon = buzz?.playerId === view.youId

  useBuzzOutcome(
    floorOutcome({ buzz, hasPressed: isClaimed, youId: view.youId })
  )

  const line = statusLine({ blocker, hasFailed, isWon, translate, view })

  // The floor is the room's and not the buzzing player's, so this is read off
  // the phase: every screen waits the same window out, the ones that never
  // entered the race included.
  const floorBuzz = view.phase === 'buzzed' ? buzz : null
  const matchsticks = matchsticksContent(view.round)

  return (
    <section className='player-round buzzer-area'>
      <AskedQuestion prompt={quizContent(view.round)?.prompt ?? null} />
      {matchsticks !== null && (
        <MatchsticksPrompt puzzle={matchsticks.puzzle} />
      )}
      {/*
        The buzzer and the line that belongs to it, grouped so a screen lying
        down can set them beside the question card instead of under it.
      */}
      <div className='press'>
        {/*
            Two objects in one place and never both at once: while the race is
            open this is a button, and for the length of the floor it is the
            holder's pawn and the clock timing them. Swapping rather than
            disabling is what takes `BUZZ` off a piece nobody can press, and it
            takes a dead button out of the tab order on the way.

            `onPressStart`, not `onPress`: a buzzer has to fire the instant the
            thumb lands, and waiting for the release costs tens of milliseconds
            in a race that is decided by exactly that. react-aria normalises it
            across touch, mouse and keyboard, so the keyboard player is not
            penalised.
          */}
        {floorBuzz === null ? (
          <ReactAriaButton
            className={classNames('buzzer', (isClaimed || isWon) && 'claimed')}
            isDisabled={blocker !== null || roundId === null}
            onPressStart={() => {
              if (roundId === null) {
                return
              }

              setClaimedRoundId(roundId)
              buzzFeedback('press')
              setHasFailed(!onBuzz(roundId))
            }}
          >
            <span className='word'>{translate('buzz.action')}</span>
          </ReactAriaButton>
        ) : (
          <TakenFloor buzz={floorBuzz} clock={clock} players={view.players} />
        )}

        <p
          className={classNames('blocker', line.isFloor && 'floor')}
          role='status'
        >
          {line.text}
        </p>
      </div>
    </section>
  )
}

/**
 * What the round turned out to be, on the player's screen — and `null` for a
 * game whose question the room owns, because a charade has no answer to print.
 * What that game's reveal is instead lands under this: the scoreline, which is
 * what a reveal *is* where the room owns the question.
 *
 * The cover is the product's only real image and this is the one moment in the
 * loop when nobody is racing, so it goes where the eye lands first. It is drawn
 * only when there is one, where the room's screen keeps an empty block: that
 * panel is two columns and needs the column held, and this is a stack where a
 * reserved box for an image that will never arrive is a hole in the screen.
 */
const Revealed: React.FC<{
  round: RoundView
  view: PlayerRoomView
}> = ({ round, view }) => {
  const translate = useTranslate()
  const track = blindtestContent(round)?.revealedTrack ?? null
  const question = quizContent(round)?.revealedQuestion ?? null
  const flag = quizContent(round)?.prompt.flag ?? null
  const rebus = quizContent(round)?.prompt.rebus ?? null
  // The times, which a player reads for the same reason the room does: this is
  // the one game whose reveal is not an answer, so the finishing order is what
  // there is to know — and everyone's own number is on it.
  if (reflexContent(round) !== null) {
    return <ReactionBoard players={view.players} round={round} />
  }

  if (innerclockContent(round) !== null) {
    return <CountedBoard players={view.players} round={round} />
  }

  if (atlasContent(round) !== null) {
    return <MapReveal players={view.players} round={round} />
  }

  const dated = timelineContent(round)?.revealedEvents ?? null

  if (dated !== null) {
    return <TimelineRevealed dated={dated} round={round} youId={view.youId} />
  }

  if (petitBacContent(round) !== null) {
    return <PetitBacReveal round={round} youId={view.youId} />
  }

  const grid = blackSquareContent(round)?.revealed ?? null

  if (grid !== null) {
    return (
      <BlackSquareReveal
        players={view.players}
        revealed={grid}
        youId={view.youId}
      />
    )
  }

  const solved = matchsticksContent(round)

  if (solved !== null && solved.revealedSolution !== null) {
    const yours =
      solved.revealedMoves?.find((sent) => sent.playerId === view.youId) ?? null

    return (
      <div className='answer-card' data-game='matchsticks'>
        <MatchsticksPrompt
          puzzle={solved.puzzle}
          solution={solved.revealedSolution}
        />
        {yours !== null && <MatchsticksYours round={round} yours={yours} />}
      </div>
    )
  }

  // The card the round was played on, turned over: the answer printed on its
  // back, and a track's cover mounted on it beside the words.
  if (track !== null) {
    return (
      <div className='answer-card' data-game='blindtest'>
        {track.coverUrl !== null && (
          <img
            alt=''
            className='cover'
            height={250}
            src={track.coverUrl}
            width={250}
          />
        )}
        <div className='identity'>
          <p
            className='revealed-title'
            style={answerFitting(whatTheRoomNames(track))}
          >
            <VisuallyHidden elementType='span'>
              {`${translate('blindtest.reveal.title')} `}
            </VisuallyHidden>
            {whatTheRoomNames(track)}
          </p>
          <p className='revealed-artist'>{track.artist}</p>
          {cueOf(track) !== null && <p className='note'>{cueOf(track)}</p>}
        </div>
      </div>
    )
  }

  if (question !== null) {
    return (
      <div className='answer-card' data-game='quiz'>
        {flag !== null && <FlagPicture file={flag} isNamedBeside />}
        {rebus !== null && <RebusLine isNamedBeside rebus={rebus} />}
        <div className='identity'>
          <p className='revealed-title' style={answerFitting(question.answer)}>
            <VisuallyHidden elementType='span'>
              {`${translate('quiz.reveal.title')} `}
            </VisuallyHidden>
            {question.answer}
          </p>
          {question.note !== null && <p className='note'>{question.note}</p>}
        </div>
      </div>
    )
  }

  return null
}

/**
 * The move this seat sent, drawn where it left the sticks, under the one the
 * room is shown and beside what it was worth.
 */
const MatchsticksYours: React.FC<{ round: RoundView; yours: SentMove }> = ({
  round,
  yours
}) => {
  const translate = useTranslate()
  const moveWords = useMoveWords()

  return (
    <div className='matchsticks-yours'>
      <p className='yours-title'>
        {translate('matchsticks.reveal.yours')}{' '}
        <span className='yours-words'>
          {moveWords(placesFromBestOf(round, yours.playerId))}
        </span>
      </p>
      <MatchstickRow glyphs={yours.glyphs} isStill move={yours.move} />
    </div>
  )
}

/**
 * The cards turned over: this seat's own order with every year now printed on
 * it, so whatever is out of place reads at a glance, and the pairs it swapped
 * said above. A seat that sent nothing reads the true order instead.
 */
const TimelineRevealed: React.FC<{
  dated: DatedTimelineEvent[]
  round: RoundView
  youId: PlayerRoomView['youId']
}> = ({ dated, round, youId }) => {
  const translate = useTranslate()
  const orderWords = useOrderWords()
  const sent = sentOrderOf(round, youId)
  const swappedPairs = youId === null ? null : swappedPairsOf(round, youId)
  const title = translate(
    sent === null ? 'timeline.reveal.unsent' : 'timeline.reveal.yours'
  )

  return (
    <div className='timeline-revealed'>
      <p className='order-title'>
        {title}
        {swappedPairs !== null && (
          <span className='order-words'>{orderWords(swappedPairs)}</span>
        )}
      </p>
      <TimelineStrip
        aria-label={title}
        events={sent ?? dated}
        layout='ordered'
      />
    </div>
  )
}

/**
 * The floor, where the buzzer stood: the pawn of whoever holds it stood up
 * oversize, the way the console draws it, with the clock on a token beside it.
 * A buzzer whose seat has gone leaves no pawn to stand, and the token alone.
 */
const TakenFloor: React.FC<{
  buzz: ActiveBuzz
  clock: ClockEstimate | null
  players: PlayerRoomView['players']
}> = ({ buzz, clock, players }) => {
  const seat = players.findIndex((player) => player.id === buzz.playerId)

  return (
    <div className='taken-floor'>
      {seat !== -1 && <Pawn seat={seat} />}
      <FloorDial buzz={buzz} clock={clock} />
    </div>
  )
}

/**
 * The token for the length of the floor, when the buzzer has stopped being one:
 * the ring it already had becomes the window, and the number the whole room is
 * waiting on goes inside it. Three objects were stacked here — a dead button, a
 * name and a number — and only two of them were the phase.
 *
 * **The ring drains where there is a window and stands still where there is
 * not**, which is the duality `FloorClock` already reads from either end: a
 * host judging by hand has set no deadline, so there is no fraction to draw
 * and the number counts up inside a ring that is only the object's own edge.
 *
 * Drained by a CSS animation off the server's deadline and re-keyed on each
 * snapshot, because the round's bar settled all of that already — see
 * `RoundProgress`. `nowMs()` in the render body is the bargain `RevealHold`
 * makes for the same reason: the reading is taken once per snapshot and the
 * animation carries it in between.
 */
const FloorDial: React.FC<{
  buzz: ActiveBuzz
  clock: ClockEstimate | null
}> = ({ buzz, clock }) => {
  const windowMs =
    buzz.expiresAt === null ? null : buzz.expiresAt - buzz.atServerTime
  const remainingMs =
    buzz.expiresAt === null
      ? null
      : millisecondsUntil(clock, buzz.expiresAt, nowMs())

  return (
    <div className='floor-dial'>
      {/*
        Both arcs are one circle's geometry rather than a border and an overlay
        that would have to be kept concentric at every diameter — and the
        stroke is in the viewBox's own units, which makes it a constant share
        of the dial the way a row is a multiple of its own type.
      */}
      <svg aria-hidden='true' className='ring' viewBox='0 0 100 100'>
        <circle className='track' cx='50' cy='50' r='47' />
        {remainingMs !== null && windowMs !== null && windowMs > 0 && (
          <circle
            className='left'
            cx='50'
            cy='50'
            key={remainingMs}
            pathLength='1'
            r='47'
            style={{
              '--drain-duration': `${remainingMs}ms`,
              '--drained': (1 - Math.min(1, remainingMs / windowMs)).toFixed(3)
            }}
          />
        )}
      </svg>
      <FloorClock buzz={buzz} clock={clock} />
    </div>
  )
}

/**
 * The one line under the buzzer, and which of two things it is. Most of what it
 * says is a *reason the control is dead* — that is what `--ink-muted` at
 * `caption` is for, and three of these are exactly that. The floor's own line
 * is not: *it is yours* and *who took it* are what the phase **is**, on the
 * screen the player is sure to have and the one they must act on now. The
 * console bills the same fact as an `h2` in `billboard` and says why — the size
 * a host reads while looking up at the room; this screen drew it at 16px in the
 * ink reserved for what you cannot do.
 *
 * Folding the name into this slot is also what stops the room being told twice:
 * `buzz.blocked.someone_else_buzzed` and `buzz.theyBuzzed` are one fact twenty
 * pixels apart at one size, and the named one is strictly the better of them.
 * The anonymous one survives where it is not a duplicate — a buzzer whose seat
 * has gone leaves no nickname to name.
 */
const statusLine = ({
  blocker,
  hasFailed,
  isWon,
  translate,
  view
}: {
  blocker: BuzzBlocker | null
  hasFailed: boolean
  isWon: boolean
  translate: Translate
  view: PlayerRoomView
}): { isFloor: boolean; text: string } => {
  if (hasFailed) {
    return { isFloor: false, text: translate('buzz.sendFailed') }
  }

  if (isWon) {
    return { isFloor: true, text: translate('buzz.won') }
  }

  const nickname = view.players.find(
    (player) => player.id === view.round?.activeBuzz?.playerId
  )?.nickname

  if (view.phase === 'buzzed' && nickname !== undefined) {
    return {
      isFloor: true,
      text: translate('buzz.theyBuzzed', { nickname })
    }
  }

  return {
    isFloor: false,
    text:
      blocker === null
        ? translate('buzz.ready')
        : translate(buzzBlockerKey(blocker))
  }
}
