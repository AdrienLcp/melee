import type React from 'react'

import { PETIT_BAC_STOP_GRACE_MS } from '@melee/protocol/petit-bac'
import type {
  HostRoomView,
  PublicPlayer,
  RoundView
} from '@melee/protocol/room'

import {
  LetterPiece,
  petitBacCategoryId
} from '@/features/player/petit-bac-sheet'
import { petitBacContent } from '@/helpers/round-content'
import { CrossIcon } from '@/presentation/components/icons'
import { Pawn } from '@/presentation/components/pawn'
import { RoundProgress } from '@/presentation/components/round-progress'
import { ToggleButton } from '@/presentation/components/toggle-button'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { petitBacCategoryName } from '@/presentation/i18n/petit-bac-category-name'

import { ScoreTrack, type SeatProgress } from './score-track'

import './petit-bac-stage.sass'

/** A judge's word on one row of the category being voted. */
export type RowRefusal = {
  categoryIndex: number
  refuses: boolean
  rowKey: string
}

type PetitBacStageProps = {
  /**
   * The judge's refusal, on the console of a room with one; `null` on the
   * wall, and wherever the seats vote instead.
   */
  onRefuseRow: ((refusal: RowRefusal) => void) | null
  round: RoundView
  view: HostRoomView
}

/**
 * Petit Bac on the screen the room shares, which never holds a word before
 * the vote: the letter over the sheet's empty lines and each seat's count of
 * filled ones, the stop and its grace once a full sheet calls it, then the
 * category the room is voting with every answer on it.
 */
export const PetitBacStage: React.FC<PetitBacStageProps> = ({
  onRefuseRow,
  round,
  view
}) => {
  const content = petitBacContent(round)

  if (content === null) {
    return null
  }

  const votingIndex = content.categoryStates.indexOf('voting')

  return votingIndex === -1 ? (
    <PetitBacWriting round={round} view={view} />
  ) : (
    <PetitBacVoting
      categoryIndex={votingIndex}
      onRefuseRow={onRefuseRow}
      round={round}
      view={view}
    />
  )
}

const seatOf = (players: readonly PublicPlayer[], playerId: string): number =>
  players.findIndex((player) => player.id === playerId)

const PetitBacWriting: React.FC<Omit<PetitBacStageProps, 'onRefuseRow'>> = ({
  round,
  view
}) => {
  const translate = useTranslate()
  const content = petitBacContent(round)

  if (content === null) {
    return null
  }

  const { categories, letter, stopClosesAtElapsedMs, stoppedBy } = content
  const progress =
    view.currentContent?.kind === 'petitbac' ? view.currentContent.progress : []
  const sheetProgressOf = (player: PublicPlayer): SeatProgress => {
    const filled =
      progress.find((seat) => seat.playerId === player.id)?.filled ?? 0

    return {
      figure: translate('petitbac.wall.progress', {
        count: categories.length,
        filled
      }),
      filled: filled / categories.length
    }
  }
  const sheets = view.players.map((player, seat) => ({
    player,
    seat,
    ...sheetProgressOf(player)
  }))
  const stopper = stoppedBy === null ? -1 : seatOf(view.players, stoppedBy)

  return (
    <>
      <ScoreTrack
        players={view.players}
        progressOf={sheetProgressOf}
        youId={null}
      />
      <div
        className='stage petit-bac-stage'
        data-step='writing'
        style={{ '--categories': categories.length }}
      >
        <section className='sheet'>
          <div className='head'>
            <LetterPiece letter={letter} />
            {content.sheetsClosed ? null : stopClosesAtElapsedMs === null ? (
              round.durationMs !== null && (
                <div className='clock'>
                  <RoundProgress
                    durationMs={round.durationMs}
                    elapsedMs={view.roundElapsedMs}
                  />
                </div>
              )
            ) : (
              <div className='clock grace'>
                <RoundProgress
                  durationMs={PETIT_BAC_STOP_GRACE_MS}
                  elapsedMs={
                    PETIT_BAC_STOP_GRACE_MS -
                    (stopClosesAtElapsedMs - view.roundElapsedMs)
                  }
                />
              </div>
            )}
          </div>
          <ol aria-label={translate('petitbac.wall.lines')} className='lines'>
            {categories.map((category) => (
              <li key={petitBacCategoryId(category)}>
                {petitBacCategoryName({ category, translate })}
              </li>
            ))}
          </ol>
        </section>

        {stoppedBy !== null && (
          <p className='stop-banner' role='status'>
            {stopper !== -1 && <Pawn seat={stopper} />}
            <span>
              {translate('petitbac.stop.called', {
                name: view.players[stopper]?.nickname ?? ''
              })}
            </span>
          </p>
        )}

        <ol aria-label={translate('petitbac.wall.sheets')} className='progress'>
          {sheets.map(({ figure, filled, player, seat }) => (
            <li
              data-stopper={player.id === stoppedBy || undefined}
              key={player.id}
              style={{ '--filled': filled }}
            >
              <Pawn seat={seat} />
              <span className='nickname'>{player.nickname}</span>
              <span className='tally'>{figure}</span>
            </li>
          ))}
        </ol>
      </div>
    </>
  )
}

type PetitBacVotingProps = PetitBacStageProps & {
  categoryIndex: number
}

const PetitBacVoting: React.FC<PetitBacVotingProps> = ({
  categoryIndex,
  onRefuseRow,
  round,
  view
}) => {
  const translate = useTranslate()
  const content = petitBacContent(round)
  const category = content?.categories[categoryIndex]

  if (content === null || category === undefined) {
    return null
  }

  const isJudged = view.settings.hasJudge
  const done = content.votesDone

  return (
    <div
      className='stage petit-bac-stage'
      data-step='voting'
      style={{ '--rows': Math.max(content.rows?.length ?? 0, 1) }}
    >
      <header className='head'>
        <LetterPiece letter={content.letter} />
        <h2>{petitBacCategoryName({ category, translate })}</h2>
        <p className='of'>
          {translate('petitbac.vote.of', {
            count: content.categories.length,
            index: categoryIndex + 1
          })}
        </p>
      </header>

      <ol className='rows'>
        {(content.rows ?? []).map((row) => (
          <li
            className='row'
            data-refused={row.refused || undefined}
            key={row.key}
          >
            {row.refused && onRefuseRow === null && (
              <span className='stamp'>{translate('petitbac.vote.refuse')}</span>
            )}
            <span className='text'>{row.text}</span>
            <span className='foot'>
              <span className='authors'>
                {row.authors.map((playerId) => (
                  <Pawn key={playerId} seat={seatOf(view.players, playerId)} />
                ))}
                <VisuallyHidden elementType='span'>
                  {` — ${row.authors
                    .map(
                      (playerId) =>
                        view.players[seatOf(view.players, playerId)]
                          ?.nickname ?? ''
                    )
                    .join(', ')}`}
                </VisuallyHidden>
              </span>
              {isJudged && onRefuseRow !== null && (
                <ToggleButton
                  aria-label={translate('petitbac.vote.refuseRow', {
                    answer: row.text
                  })}
                  className='refuse'
                  isSelected={row.refused}
                  onChange={(refuses) =>
                    onRefuseRow({ categoryIndex, refuses, rowKey: row.key })
                  }
                  size='small'
                >
                  {row.refused && <CrossIcon />}
                  {translate('petitbac.vote.refuse')}
                </ToggleButton>
              )}
              {!isJudged && row.refusals > 0 && (
                <span className='against'>
                  {translate('petitbac.wall.against', {
                    refusals: row.refusals
                  })}
                </span>
              )}
            </span>
          </li>
        ))}
      </ol>

      {isJudged ? (
        <p className='done-line'>{translate('petitbac.vote.judged')}</p>
      ) : (
        <p className='done-line'>
          {done.map((playerId) => (
            <Pawn key={playerId} seat={seatOf(view.players, playerId)} />
          ))}
          <span>
            {done.length === 0
              ? translate('petitbac.vote.moveOn')
              : translate('petitbac.vote.doneCount', { done: done.length })}
          </span>
        </p>
      )}
    </div>
  )
}
