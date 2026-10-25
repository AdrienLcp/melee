import type React from 'react'
import { useEffect, useEffectEvent, useState } from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import {
  PETIT_BAC_ANSWER_MAX_LENGTH,
  PETIT_BAC_STOP_GRACE_MS,
  type PetitBacCategory
} from '@melee/protocol/petit-bac'
import type { PlayerRoomView, RoundView } from '@melee/protocol/room'

import { isStoppableLine } from '@melee/core/petitbac/letter-match'
import type { ClockEstimate } from '@melee/core/time/clock-sync'

import { RoundClock } from '@/features/player/round-clock'
import { petitBacContent } from '@/helpers/round-content'
import { Button } from '@/presentation/components/button'
import { CheckIcon, CrossIcon } from '@/presentation/components/icons'
import { Pawn } from '@/presentation/components/pawn'
import { RoundProgress } from '@/presentation/components/round-progress'
import { TextField } from '@/presentation/components/text-field'
import { ToggleButton } from '@/presentation/components/toggle-button'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { petitBacCategoryName } from '@/presentation/i18n/petit-bac-category-name'

import './petit-bac-sheet.sass'

const SAVE_DELAY_MS = 600

const focusLineAfter = (target: EventTarget) => {
  if (!(target instanceof HTMLInputElement)) {
    return
  }

  const lines = [...(target.closest('ol')?.querySelectorAll('input') ?? [])]

  lines[lines.indexOf(target) + 1]?.focus()
}

/** What a category's line is keyed by, the same on the sheet and on its reveal. */
export const petitBacCategoryId = (category: PetitBacCategory): string =>
  category.kind === 'own' ? `own:${category.label}` : category.key

type LetterPieceProps = {
  letter: string
}

/** The round's letter as a piece of the box, named for a screen reader. */
export const LetterPiece: React.FC<LetterPieceProps> = ({ letter }) => {
  const translate = useTranslate()

  return (
    <p className='letter-piece'>
      <span aria-hidden>{letter}</span>
      <VisuallyHidden elementType='span'>
        {translate('petitbac.letter', { letter })}
      </VisuallyHidden>
    </p>
  )
}

/** What a sheet reads of the room: a seat's view, or a seated console's. */
export type SheetReading = Pick<
  PlayerRoomView,
  | 'isHostConnected'
  | 'phase'
  | 'players'
  | 'round'
  | 'roundElapsedMs'
  | 'settings'
> & { youId: PlayerId }

type PetitBacSheetProps = {
  clock: ClockEstimate | null
  /** `false` from the socket means the frame was never written. */
  onStop: () => boolean
  /** `false` from the socket means the frame was never written. */
  onWrite: (categoryIndex: number, answer: string) => boolean
  round: RoundView
  view: SheetReading
}

/**
 * The whole sheet on one card: the letter at its head, a category in the
 * margin of each line and the word on it. Every line saves itself, as the
 * slate's do, so a locked screen comes back to what was written; the stop
 * under it is pressable once every line holds a word the server would take
 * a stop on, and turns into the grace counting down once anyone calls it.
 */
export const PetitBacSheet: React.FC<PetitBacSheetProps> = ({
  clock,
  onStop,
  onWrite,
  round,
  view
}) => {
  const translate = useTranslate()
  const content = petitBacContent(round)
  const sheet = content?.yourSheet ?? []
  const [drafts, setDrafts] = useState<Readonly<Record<number, string>>>({})

  const answerAt = (index: number): string =>
    (drafts[index] ?? sheet[index] ?? '').trim()

  const save = (index: number) => {
    const draft = drafts[index]

    if (draft !== undefined && draft.trim() !== (sheet[index] ?? '')) {
      onWrite(index, draft.trim())
    }
  }

  const saveAll = () => {
    for (const index of Object.keys(drafts)) {
      save(Number(index))
    }
  }

  const saveDrafts = useEffectEvent(saveAll)

  useEffect(() => {
    if (Object.keys(drafts).length === 0) {
      return
    }

    const timer = setTimeout(saveDrafts, SAVE_DELAY_MS)

    return () => clearTimeout(timer)
  }, [drafts])

  if (content === null || content.yourSheet === null) {
    return null
  }

  const { categories, letter } = content
  const answers = categories.map((_, index) => answerAt(index))
  const filled = answers.filter((answer) => answer !== '').length
  const isFull = filled === categories.length
  const isStoppable =
    isFull && answers.every((answer) => isStoppableLine({ answer, letter }))
  const isBarred = content.barredStopperIds.includes(view.youId)
  const stopper = view.players.findIndex(
    (player) => player.id === content.stoppedBy
  )

  return (
    <section className='petit-bac-sheet'>
      <div className='answer-sheet'>
        <div className='head'>
          <LetterPiece letter={letter} />
          <div
            className={
              content.stopClosesAtElapsedMs === null ? 'clock' : 'clock grace'
            }
          >
            {content.stopClosesAtElapsedMs === null ? (
              <RoundClock clock={clock} view={view} />
            ) : (
              <RoundProgress
                durationMs={PETIT_BAC_STOP_GRACE_MS}
                elapsedMs={
                  PETIT_BAC_STOP_GRACE_MS -
                  (content.stopClosesAtElapsedMs - view.roundElapsedMs)
                }
              />
            )}
          </div>
        </div>
        <ol aria-label={translate('petitbac.sheet.label')} className='lines'>
          {categories.map((category, index) => {
            const name = petitBacCategoryName({ category, translate })

            return (
              <li
                className={answers[index] === '' ? 'line' : 'line filled'}
                key={petitBacCategoryId(category)}
              >
                <TextField
                  aria-label={translate('petitbac.sheet.field', {
                    category: name,
                    letter
                  })}
                  autoComplete='off'
                  enterKeyHint={
                    index === categories.length - 1 ? 'done' : 'next'
                  }
                  label={name}
                  maxLength={PETIT_BAC_ANSWER_MAX_LENGTH}
                  onBlur={() => save(index)}
                  onChange={(next) => {
                    setDrafts((previous) => ({ ...previous, [index]: next }))
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      focusLineAfter(event.target)
                    }
                  }}
                  placeholder={`${letter}…`}
                  value={drafts[index] ?? sheet[index] ?? ''}
                />
              </li>
            )
          })}
        </ol>
      </div>

      {content.stoppedBy !== null ? (
        <p className='stop-banner' role='status'>
          {stopper !== -1 && <Pawn seat={stopper} />}
          <span>
            {content.stoppedBy === view.youId
              ? translate('petitbac.stop.calledByYou')
              : translate('petitbac.stop.called', {
                  name: view.players[stopper]?.nickname ?? ''
                })}
          </span>
        </p>
      ) : isBarred ? (
        <p className='stop-note'>{translate('petitbac.stop.barred')}</p>
      ) : (
        content.stopsWhenFull && (
          <div className='stop'>
            <Button
              isDisabled={!isStoppable || !view.isHostConnected}
              onPress={() => {
                saveAll()
                onStop()
              }}
              size='large'
              variant={isStoppable ? 'filled' : 'outlined'}
            >
              {isFull
                ? translate('petitbac.stop.press')
                : translate('petitbac.stop.filling', {
                    count: categories.length,
                    filled
                  })}
            </Button>
            {isFull && !isStoppable && (
              <p className='stop-note'>
                {translate('petitbac.stop.offLetter', { letter })}
              </p>
            )}
          </div>
        )
      )}
    </section>
  )
}

type PetitBacVoteProps = {
  /** `false` from the socket means the frame was never written. */
  onDone: (categoryIndex: number) => boolean
  /** `false` from the socket means the frame was never written. */
  onVote: (vote: {
    categoryIndex: number
    refuses: boolean
    rowKey: string
  }) => boolean
  round: RoundView
  view: SheetReading
}

/**
 * The category the room is reading, one row per answer with its authors'
 * pawns. Every row counts until this seat says otherwise; its own row is
 * marked rather than votable. Under a judge the seat only watches the
 * refusals land.
 */
export const PetitBacVote: React.FC<PetitBacVoteProps> = ({
  onDone,
  onVote,
  round,
  view
}) => {
  const translate = useTranslate()
  const content = petitBacContent(round)

  if (content === null) {
    return null
  }

  const categoryIndex = content.categoryStates.indexOf('voting')
  const category = content.categories[categoryIndex]

  if (category === undefined) {
    return null
  }

  const hasVoted = content.votesDone.includes(view.youId)
  const seatOf = (playerId: string): number =>
    view.players.findIndex((player) => player.id === playerId)

  return (
    <section className='petit-bac-vote'>
      <div className='answer-sheet'>
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
          {(content.rows ?? []).map((row) => {
            const isYours = row.authors.includes(view.youId)
            const isOut = content.yourRefusals.includes(row.key)

            return (
              <li className={isOut ? 'row out' : 'row'} key={row.key}>
                <span className='text'>{row.text}</span>
                <span className='authors'>
                  {row.authors.map((playerId) => (
                    <Pawn key={playerId} seat={seatOf(playerId)} />
                  ))}
                </span>
                <span className='side'>
                  {isYours ? (
                    <span className='yours'>
                      {translate('petitbac.vote.yours')}
                    </span>
                  ) : (
                    <ToggleButton
                      aria-label={translate('petitbac.vote.refuseRow', {
                        answer: row.text
                      })}
                      className='refuse'
                      isSelected={isOut}
                      onChange={(refuses) =>
                        onVote({ categoryIndex, refuses, rowKey: row.key })
                      }
                      size='small'
                    >
                      {isOut && <CrossIcon />}
                      {translate('petitbac.vote.refuse')}
                    </ToggleButton>
                  )}
                </span>
              </li>
            )
          })}
        </ol>
      </div>

      <div className='vote-foot'>
        <Button
          isDisabled={hasVoted}
          onPress={() => onDone(categoryIndex)}
          variant={hasVoted ? 'outlined' : 'filled'}
        >
          <CheckIcon />
          {translate('petitbac.vote.done')}
        </Button>
        <p className='vote-note'>
          {content.votesDone.length === 0
            ? translate('petitbac.vote.moveOn')
            : translate('petitbac.vote.doneCount', {
                done: content.votesDone.length
              })}
        </p>
      </div>
    </section>
  )
}
