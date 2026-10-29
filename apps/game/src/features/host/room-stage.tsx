import { classNames } from '@adrienlcp/react'
import type React from 'react'
import { useState } from 'react'

import type { ClientMessage } from '@melee/protocol/client-message'
import type { PlayerId, RoomCode } from '@melee/protocol/identifiers'
import type {
  HostRoomView,
  RoomSettings,
  RoundView
} from '@melee/protocol/room'
import { POINT } from '@melee/protocol/scoring'

import type { ClipRefusal } from '@melee/core/blindtest/clip-audio'
import { isRoundJudgedByHost } from '@melee/core/room/game-modes'
import type { HostPreferences } from '@melee/core/room/host-preferences'
import { buildScoreboard } from '@melee/core/scoring/scoreboard'
import { playsThisRound as seatPlaysRound } from '@melee/core/team/duel'
import { buildTeamBoard } from '@melee/core/team/team-board'
import type { ClockEstimate } from '@melee/core/time/clock-sync'

import { PetitBacSheet, PetitBacVote } from '@/features/player/petit-bac-sheet'
import {
  holdsTheAnswer,
  innerclockContent,
  matchsticksContent
} from '@/helpers/round-content'
import { CountPrompt } from '@/presentation/components/count-prompt'
import { Countdown } from '@/presentation/components/countdown'
import { MatchsticksPrompt } from '@/presentation/components/matchsticks-prompt'
import { RevealHold } from '@/presentation/components/round-progress'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { gameNameKey } from '@/presentation/i18n/translation'

import { ChallengePlacing } from './challenge-placing'
import { ClipOffer } from './clip-offer'
import { FinalBoard } from './final-board'
import { InnerclockStage } from './innerclock-stage'
import { LobbyStage } from './lobby-stage'
import { PetitBacStage } from './petit-bac-stage'
import { PlayingStage } from './playing-stage'
import { ReflexStage } from './reflex-stage'
import { RevealPanel } from './reveal-panel'
import { ScoreTrack } from './score-track'
import { SlateCorrectionStage, SlateWritingStage } from './slate-stages'
import { type StandingBefore, Standings, standingsRowsOf } from './standings'
import { isSetAsTable, TableLobby } from './table-lobby'
import { TeamVerdicts } from './team-verdicts'
import type { SlateWall } from './use-slate-wall'
import { VerdictPanel } from './verdict-panel'

/** What the console can do to the room from its stage. A wall has none of it. */
export type StageControls = {
  /**
   * The answer is behind a press rather than printed, because this console
   * took over from the wall while its host was away, so the room may be
   * reading it.
   */
  isAnswerFolded: boolean
  isLive: boolean
  /**
   * The roster stands in a column beside the stage and the wall shows the
   * code, so the lobby drops its invitation and its own list of seats.
   */
  isRosterBeside: boolean
  /** Keeps a key typed mid-sheet for the next sheet this host opens. */
  onRememberSlateKey: (itemIndex: number, key: string) => void
  /** Aimed at the console's own seat too, which is why it is not a bare frame. */
  onRemovePlayer: (playerId: PlayerId) => void
  onSettingsChange: (settings: RoomSettings) => void
  /** Reopens the socket with a name on it, which is what takes the lobby's seat. */
  onTakeSeat: (nickname: string) => void
  /** What this host last left each game set to, for the lobby's picker. */
  preferences: HostPreferences | null
  /** The slate's answer key as typed on this tab, never sent before the sheet opens. */
  preparedSlateKeys: readonly (string | null)[]
  send: (message: ClientMessage) => boolean
}

type RoomStageProps = {
  /** Whether a press has blessed an audio element on this screen. */
  canPlay: boolean
  clock: ClockEstimate | null
  /** `null` on the wall, which shows the room and changes nothing about it. */
  controls: StageControls | null
  /**
   * The whole track is drawn around the stage on this screen, so its lobby owes
   * the room no preview of it.
   */
  isBoardAround: boolean
  /**
   * This screen plays the clip. A console stops being the speaker while a wall
   * is there, and then owes the room no offer to unmute itself.
   */
  isSpeaker: boolean
  /** The gesture a screen that cannot play a clip has to be offered. */
  onUnlockAudio: () => void
  /** Why the last press did not arm this screen, and `null` while none has failed. */
  refusal: ClipRefusal | null
  roomCode: RoomCode
  slateWall: SlateWall
  view: HostRoomView | null
}

/**
 * The room as the screen everyone reads draws it, phase by phase. The console
 * and the wall render the same stage — one with its hands on it, one without —
 * so what the room reads is the same whichever of them it is looking at.
 */
export const RoomStage: React.FC<RoomStageProps> = ({
  canPlay,
  clock,
  controls,
  isBoardAround,
  isSpeaker,
  onUnlockAudio,
  refusal,
  roomCode,
  slateWall,
  view
}) => {
  const lastRevealed = useRoundStillBeingTalkedAbout(view)
  const rankedBefore = useStandingBeforeTheReveal(view)

  // Empty, not an invitation guessed from the address bar: a reload mid-round,
  // or a wall whose table sits down in teams, flashed the lobby's invitation
  // before the snapshot swapped in a different stage. Keyed, so the stage the
  // snapshot brings is a new node and runs its own arrival.
  if (view === null) {
    return <div className='stage' key='awaiting-view' />
  }

  const round = view.round

  // The room's answer, never what this console asked for: a seat can go without
  // this screen deciding it — the host takes it off the roster, or the sweeper
  // gives it up — and a screen still drawing its own answer form owns nothing.
  const isSeated =
    controls !== null && view.youId !== null && !isRoundJudgedByHost(round)
  const youId = isSeated ? view.youId : null
  const playsThisRound =
    isSeated &&
    seatPlaysRound({ duel: round?.duel ?? null, seatId: view.youId })

  const clipOffer = (
    <ClipOffer
      canPlay={canPlay}
      isSpeaker={isSpeaker}
      onUnlockAudio={onUnlockAudio}
      refusal={refusal}
      view={view}
    />
  )

  // The count is said before it starts, so the room has read the target by
  // the time the countdown lands rather than reading it while counting.
  const counting = innerclockContent(round)

  if (
    view.phase === 'countdown' &&
    round?.startsAt != null &&
    counting !== null
  ) {
    return (
      <div className='stage counting-in'>
        <Countdown clock={clock} target={round.startsAt} />
        <CountPrompt targetSeconds={counting.targetSeconds} />
        {clipOffer}
      </div>
    )
  }

  if (view.phase === 'countdown' && round?.startsAt != null) {
    // The round that just ran, still up while the next one counts in — but only
    // when the hold opened it: the room was still reading the answer then. A
    // host who pressed *Next round* has said the room is done with it, and a
    // switch to another game has the room asking what comes next instead.
    const recap =
      lastRevealed?.advancesAt != null &&
      round.startsAt >= lastRevealed.advancesAt &&
      lastRevealed.content.kind === round.content.kind
        ? lastRevealed
        : null

    return (
      <div className={recap === null ? 'stage solo' : 'stage counting-in'}>
        {recap === null && <NextGameName settings={view.settings} />}
        <Countdown clock={clock} target={round.startsAt} />
        {recap !== null && <RevealPanel players={view.players} round={recap} />}
        {clipOffer}
      </div>
    )
  }

  // The one playing stage with nothing beside it. The room is staring at this
  // screen waiting for it to change, and standings under the flip would be a
  // second thing to look at on a screen whose whole job is to carry one event.
  if (view.phase === 'playing' && round?.content.kind === 'reflex') {
    return (
      <div className='stage solo'>
        <ReflexStage
          clock={clock}
          onBuzz={(roundId) =>
            controls?.send({ roundId, type: 'player.buzz' }) ?? false
          }
          players={view.players}
          round={round}
          youId={youId}
        />
      </div>
    )
  }

  // Nothing beside it either, and for the opposite reason: the room is not
  // waiting for this screen to change, and it must not.
  if (view.phase === 'playing' && round?.content.kind === 'innerclock') {
    return (
      <div className='stage solo'>
        <InnerclockStage
          onPress={(roundId) =>
            controls?.send({ roundId, type: 'player.buzz' }) ?? false
          }
          round={round}
          youId={youId}
        />
      </div>
    )
  }

  if (view.phase === 'playing' && round?.content.kind === 'slate') {
    return slateWall.isOnWall ? (
      <SlateCorrectionStage controls={controls} view={view} />
    ) : (
      <SlateWritingStage controls={controls} view={view} />
    )
  }

  if (view.phase === 'playing' && round?.content.kind === 'petitbac') {
    const roundId = round.id

    // A seat stamped on the round writes and votes here like any other; one
    // that arrived after it watches the wall's stage until the next.
    if (
      controls !== null &&
      youId !== null &&
      round.content.yourSheet !== null
    ) {
      const reading = { ...view, youId }

      return (
        <div className='stage petit-bac-seat'>
          {round.content.sheetsClosed ? (
            <PetitBacVote
              onDone={(categoryIndex) =>
                controls.send({
                  categoryIndex,
                  roundId,
                  type: 'petitbac.doneVoting'
                })
              }
              onVote={(vote) =>
                controls.send({ ...vote, roundId, type: 'petitbac.vote' })
              }
              round={round}
              view={reading}
            />
          ) : (
            <PetitBacSheet
              clock={clock}
              onStop={() => controls.send({ roundId, type: 'petitbac.stop' })}
              onWrite={(categoryIndex, answer) =>
                controls.send({
                  answer,
                  categoryIndex,
                  roundId,
                  type: 'petitbac.write'
                })
              }
              round={round}
              view={reading}
            />
          )}
        </div>
      )
    }

    return <PetitBacStage round={round} view={view} />
  }

  if (view.phase === 'playing' && round != null) {
    return (
      <PlayingStage
        answersAs={
          playsThisRound ? youId : (round.openedWithPlayerIds?.[0] ?? null)
        }
        clipOffer={clipOffer}
        clock={clock}
        onAnswer={
          playsThisRound
            ? (answer) =>
                controls.send({
                  answer,
                  roundId: round.id,
                  type: 'player.answer'
                })
            : null
        }
        onTick={
          playsThisRound
            ? (cell, isTicked) =>
                controls.send({
                  cell,
                  isTicked,
                  roundId: round.id,
                  type: 'blacksquare.tick'
                })
            : null
        }
        round={round}
        view={view}
      >
        {controls !== null && round.content.kind === 'challenge' && (
          <ChallengePlacing
            isLive={controls.isLive}
            key={round.id}
            round={round}
            send={controls.send}
            view={view}
          />
        )}
        {controls !== null &&
          view.settings.teams.kind === 'aloud' &&
          round.content.kind !== 'challenge' && (
            <TeamVerdicts
              isLive={controls.isLive}
              key={round.id}
              round={round}
              send={controls.send}
              view={view}
            />
          )}
      </PlayingStage>
    )
  }

  if (view.phase === 'buzzed' && round?.activeBuzz != null) {
    const buzzerId = round.activeBuzz.playerId
    const buzzerSeat = view.players.findIndex(
      (player) => player.id === buzzerId
    )
    const content = view.currentContent
    const matchsticks = matchsticksContent(round)

    // The console judges, and has to hold the answer to; the wall only says who
    // has the floor and for how long.
    const judging =
      controls !== null && content !== null && holdsTheAnswer(content)
        ? { content, controls }
        : null

    if (controls !== null && judging === null) {
      return <div className='stage solo' />
    }

    return (
      <div className='stage solo'>
        <VerdictPanel
          buzz={round.activeBuzz}
          clock={clock}
          content={judging?.content ?? null}
          isAnswerFolded={judging?.controls.isAnswerFolded ?? false}
          key={round.activeBuzz.atServerTime}
          nickname={view.players[buzzerSeat]?.nickname ?? '—'}
          onJudge={
            judging === null
              ? null
              : (verdict) => {
                  judging.controls.send({
                    playerId: buzzerId,
                    roundId: round.id,
                    type: 'host.judge',
                    verdict
                  })
                }
          }
          seat={Math.max(buzzerSeat, 0)}
          stimulus={
            matchsticks === null ? null : (
              <MatchsticksPrompt puzzle={matchsticks.puzzle} />
            )
          }
        />
      </div>
    )
  }

  if (view.phase === 'revealed' && round != null) {
    const holdMs = view.settings.autoAdvanceMs
    // The pair travels stamped together, so one of them missing means nothing
    // is counting this reveal down and the screen owes the room no bar.
    const hold =
      round.advancesAt === null || holdMs === null
        ? null
        : { advancesAt: round.advancesAt, holdMs }
    const { lineUp, roundCount } = view.settings
    const asksReady =
      lineUp.length > 1 && (roundCount === null || round.index < roundCount)

    // The standings, at the one moment the room asks for them. They are on this
    // screen during `playing` already, where nobody is looking at them — the
    // reveal is when the table wants to know what the round did to the game.
    return (
      // How many rows the standings hold, for the same reason the board carries
      // its own count: beside a board and on half the width, this one buys its
      // height by dividing its box rather than by taking a second column.
      //
      // `holding` is what the height budgets read: a bar spends a row of the
      // screen the three formulas below are dividing, so they have to know
      // whether it is there.
      <>
        <ScoreTrack players={view.players} teams={view.teams} youId={youId} />
        <div
          className={classNames('stage revealed', hold !== null && 'holding')}
          style={{
            '--standings-rows': standingsRowsOf({
              board: view.settings.board,
              players: view.players,
              teams: view.teams
            })
          }}
        >
          <RevealPanel
            onStrike={
              controls === null
                ? undefined
                : (strike) =>
                    controls.send({
                      ...strike,
                      roundId: round.id,
                      type: 'host.strikeRow'
                    })
            }
            players={view.players}
            round={round}
          />
          {/* On the podium the players' column already ranks them. */}
          {controls?.isRosterBeside !== true && (
            <Standings
              board={view.settings.board}
              marksReady={asksReady}
              onAdjust={
                controls === null
                  ? undefined
                  : (team, cases) => {
                      controls.send({
                        points: cases * POINT,
                        target: { kind: 'team', teamId: team.id },
                        type: 'host.adjustScore'
                      })
                    }
              }
              players={view.players}
              rankedBefore={rankedBefore}
              teams={view.teams}
              youId={youId}
            />
          )}
          {hold !== null && <RevealHold clock={clock} {...hold} />}
        </div>
      </>
    )
  }

  if (view.phase === 'finished') {
    return (
      <div className='stage finished'>
        <FinalBoard players={view.players} teams={view.teams} youId={youId} />
      </div>
    )
  }

  // A table of teams sitting down, read across the room: the setup is the
  // panel's, and what the room reads is who sits with whom.
  if (controls === null && isSetAsTable(view.settings)) {
    return <TableLobby roomCode={roomCode} view={view} youId={youId} />
  }

  return (
    <LobbyStage
      controls={controls}
      isBoardAround={isBoardAround}
      roomCode={roomCode}
      view={view}
      youId={youId}
    />
  )
}

/**
 * The game about to open, named only on an evening of several, and by the
 * game alone: which of its entries it is belongs to the host's running order,
 * and an ordinal on the wall reads as the round count.
 */
const NextGameName: React.FC<{ settings: RoomSettings }> = ({ settings }) => {
  const translate = useTranslate()

  if (settings.lineUp.length < 2 || settings.game === null) {
    return null
  }

  return (
    <h2 className='next-game'>{translate(gameNameKey(settings.game.kind))}</h2>
  )
}

/**
 * The round the room is still talking about, which the view stops carrying the
 * moment the next one opens: `openRound` replaces `room.round`, so by the time
 * a countdown is on screen the reveal it interrupted is gone from the snapshot.
 *
 * Held here rather than added to the wire, because it is the screen's own
 * memory of what it drew — the server has nothing to say about a round it has
 * finished with, and a second round on the room view would have to be kept
 * honest through a reload, a takeover and a game change for one screen's sake.
 * A screen that reloads mid-countdown simply gets the number alone, which is
 * the screen this replaced.
 */
const useRoundStillBeingTalkedAbout = (
  view: HostRoomView | null
): RoundView | null => {
  const [lastRevealed, setLastRevealed] = useState<RoundView | null>(null)

  if (
    view?.phase === 'revealed' &&
    view.round !== null &&
    view.round !== lastRevealed
  ) {
    setLastRevealed(view.round)
  }

  // A game that ended and a room back in its lobby have nothing to recap, and
  // the next game must not open on the last one's answer.
  if (
    lastRevealed !== null &&
    (view === null || view.phase === 'lobby' || view.phase === 'finished')
  ) {
    setLastRevealed(null)
  }

  return lastRevealed
}

/**
 * The order the seats and the teams stood in before the reveal moved them, so
 * the standings can travel to their new places rather than arrive re-ranked. The scores land
 * with the reveal, which leaves the last snapshot before it holding the old
 * ones. The screen's own memory again: one that reloads on a reveal draws the
 * board where it stands.
 */
const useStandingBeforeTheReveal = (
  view: HostRoomView | null
): StandingBefore | null => {
  const [rankedBefore, setRankedBefore] = useState<StandingBefore | null>(null)

  if (view !== null && view.phase !== 'revealed') {
    const ranked: StandingBefore = {
      seats: buildScoreboard(view.players).map(({ player }) => player.id),
      teams: buildTeamBoard(view.teams).map(({ team }) => team.id)
    }

    if (
      rankedBefore === null ||
      !isSameOrder({ left: ranked.seats, right: rankedBefore.seats }) ||
      !isSameOrder({ left: ranked.teams, right: rankedBefore.teams })
    ) {
      setRankedBefore(ranked)
    }
  }

  return rankedBefore
}

const isSameOrder = ({
  left,
  right
}: {
  left: readonly string[]
  right: readonly string[]
}): boolean =>
  left.length === right.length && left.every((id, at) => id === right[at])
