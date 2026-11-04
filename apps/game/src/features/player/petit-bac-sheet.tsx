import type React from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import type { PlayerId } from '@melee/protocol/identifiers'
import {
  PETIT_BAC_ANSWER_MAX_LENGTH,
  PETIT_BAC_STOP_GRACE_MS,
  type PetitBacCategory
} from '@melee/protocol/petit-bac'
import type { PlayerRoomView, RoundView } from '@melee/protocol/room'

import { isStoppableLine } from '@melee/core/petitbac/letter-match'
import type { ClockEstimate } from '@melee/core/time/clock-sync'

import {
  createLineSender,
  type LineSender
} from '@/features/player/line-sender'
import { PetitBacAuthors } from '@/features/player/petit-bac-authors'
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
import { currentDeadline } from '@/presentation/timing/last-seconds'

import './petit-bac-sheet.sass'

/**
 * The list scrolls inside its card, and a keyboard coming up shrinks that box
 * under the line being typed: the line is brought back into it each time.
 */
const keepFocusedLineInView = (list: HTMLOListElement | null) => {
  if (list === null) {
    return
  }

  const observer = new ResizeObserver(() => {
    const typed = document.activeElement

    if (typed instanceof HTMLElement && list.contains(typed)) {
      typed.scrollIntoView({ block: 'nearest' })
    }
  })

  observer.observe(list)

  return () => observer.disconnect()
}

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
  | 'isPaused'
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
 * margin of each line and the word on it. Every line saves itself while it is
 * typed, so a locked screen comes back to what was written, and the sheet
 * freezes and sends what it holds the moment its clock runs out, so a word
 * still being typed counts. The stop under it is pressable once every line
 * holds a word the server would take a stop on, and turns into the grace
 * counting down once anyone calls it.
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
  const sender = useRef<LineSender | null>(null)
  const writeLine = useEffectEvent(onWrite)
  const deadline = currentDeadline({ clock, view })
  const closesId = deadline?.id ?? null
  const closesInMs = deadline?.remainingMs ?? null
  const [closedId, setClosedId] = useState<string | null>(null)
  const hasClosedOnScreen = closesId !== null && closedId === closesId

  useEffect(() => {
    const lines = createLineSender((line, text) => writeLine(line, text))

    sender.current = lines

    return () => {
      lines.dispose()
      sender.current = null
    }
  }, [])

  // The server takes lines a short grace past this moment, so what the sheet
  // holds when its clock runs out lands rather than vanishing with the sheet.
  useEffect(() => {
    if (closesId === null || closesInMs === null) {
      return
    }

    const timer = setTimeout(() => {
      sender.current?.flush()
      setClosedId(closesId)
    }, closesInMs)

    return () => clearTimeout(timer)
  }, [closesId, closesInMs])

  const answerAt = (index: number): string =>
    (drafts[index] ?? sheet[index] ?? '').trim()

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
        <ol
          aria-label={translate('petitbac.sheet.label')}
          className='lines'
          ref={keepFocusedLineInView}
        >
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
                  isReadOnly={hasClosedOnScreen}
                  label={name}
                  maxLength={PETIT_BAC_ANSWER_MAX_LENGTH}
                  onBlur={() => sender.current?.flush()}
                  onChange={(next) => {
                    setDrafts((previous) => ({ ...previous, [index]: next }))
                    sender.current?.change(index, next.trim())
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
              isDisabled={
                !isStoppable || !view.isHostConnected || hasClosedOnScreen
              }
              onPress={() => {
                sender.current?.flush()
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
 * marked rather than votable, and struck the moment the room — or a judge —
 * refuses it. Under a judge the seat only watches the refusals land.
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

  return (
    <section className='petit-bac-vote'>
      {/* Keyed so each category is laid down as a sheet of its own, rather than its rows rewritten under the last one's head. */}
      <div className='answer-sheet' key={categoryIndex}>
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
            const isOut = isYours
              ? row.refused
              : content.yourRefusals.includes(row.key)

            return (
              <li className='row' data-out={isOut || undefined} key={row.key}>
                <span className='text'>{row.text}</span>
                <PetitBacAuthors
                  authorIds={row.authors}
                  players={view.players}
                />
                <span className='side'>
                  {isYours ? (
                    <span
                      className='yours'
                      data-refused={row.refused || undefined}
                    >
                      <CrossIcon className='refused-mark' />
                      {translate('petitbac.vote.yours')}
                      {row.refused && (
                        <VisuallyHidden elementType='span'>
                          {` ${translate('petitbac.vote.refuse')}`}
                        </VisuallyHidden>
                      )}
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
                      <CrossIcon />
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
