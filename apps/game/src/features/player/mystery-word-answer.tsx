import type React from 'react'
import { useEffect, useEffectEvent, useState } from 'react'

import type { ProtocolErrorCode } from '@melee/protocol/error-code'
import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'
import type { ProtocolErrorMessage } from '@melee/protocol/server-message'

import {
  bestMarkByLetter,
  foundOnTryOf,
  isGridDone
} from '@melee/core/mysteryword/grid-reading'
import type { TryRefusal } from '@melee/core/mysteryword/try-check'
import { pointsForWord } from '@melee/core/mysteryword/word-pay'
import { clockedPay } from '@melee/core/scoring/speed-bonus'
import { foldWord } from '@melee/core/words/fold'

import { mysteryWordContent } from '@/helpers/round-content'
import { shownPoints } from '@/helpers/shown-points'
import { LetterGrid } from '@/presentation/components/letter-grid'
import { MarkLegend } from '@/presentation/components/mark-legend'
import { Pawn } from '@/presentation/components/pawn'
import { RefusalNote } from '@/presentation/components/refusal-note'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import type { PlayerAnswer } from './answer-forms'
import { WordKeyboard } from './word-keyboard'

import './mystery-word-answer.sass'

const TRY_REFUSALS = {
  not_in_dictionary: true,
  not_one_word: true,
  wrong_first_letter: true,
  wrong_length: true
} as const satisfies Record<TryRefusal, true>

/** A refusal the seat says in place, under its grid, rather than in the screen's error line. */
export const isTryRefusal = (code: ProtocolErrorCode): code is TryRefusal =>
  Object.hasOwn(TRY_REFUSALS, code)

/** Whatever a typing target already listens to keeps its keys: a field, a button pressed with Enter. */
const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target.closest('input, textarea, select') !== null)

type MysteryWordAnswerProps = {
  /** `false` from the socket means the frame was never written. */
  onAnswer: (answer: PlayerAnswer) => boolean
  /** Prices a found word as the room will: the clock's tenth is paid at the reveal only where the room pays for speed. */
  paysForSpeed: boolean
  /** The table, whose seats still looking stand under a found word. */
  players: readonly PublicPlayer[]
  /** The server's last refusal to this screen, whatever it answered; the seat says it when it answers a try. */
  refusal: ProtocolErrorMessage | null
  round: RoundView
  /** The seat answering: a player's or a seated console's. */
  youId: PlayerId | null
}

type ShownRefusal = { code: TryRefusal; word: string }

/**
 * A seat's grid over a keyboard drawn on the screen. The row being typed
 * starts on the given letter and holds as many as the word; a try the server
 * refuses is said under the grid, keeps its row and costs nothing. Found or
 * spent, the keyboard gives way to a card.
 *
 * Mounted under `key={round.id}`, so a round always opens on an empty row.
 */
export const MysteryWordAnswer: React.FC<MysteryWordAnswerProps> = ({
  onAnswer,
  paysForSpeed,
  players,
  refusal,
  round,
  youId
}) => {
  const { translate } = useI18n()
  const content = mysteryWordContent(round)
  const firstLetter = content?.firstLetter ?? ''
  const tries = content?.yourTries ?? []
  const [typed, setTyped] = useState(firstLetter)
  const [triesSeen, setTriesSeen] = useState(tries.length)
  const [answered, setAnswered] = useState(refusal)
  const [sent, setSent] = useState<string | null>(null)

  // A try banked: the row it was typed on has turned over, and the next one
  // opens on the given letter. Whatever the server last refused is spent.
  if (tries.length !== triesSeen) {
    setTriesSeen(tries.length)
    setTyped(firstLetter)
    setAnswered(refusal)
    setSent(null)
  }

  const shown: ShownRefusal | null =
    refusal !== null && refusal !== answered && isTryRefusal(refusal.code)
      ? { code: refusal.code, word: sent ?? typed }
      : null

  const length = content?.length ?? 0
  const rows = tries.map((spelled) => spelled.marks)
  const foundOnTry = foundOnTryOf(rows)
  const isDone = isGridDone(rows)
  // Sent and not yet answered either way: a second press would send it twice.
  const isWaiting = sent !== null && refusal === answered
  const canSend = !isDone && !isWaiting && typed.length === length

  // Read off the state being updated rather than the render's: two keys
  // struck between two renders both land.
  const type = (letter: string): void => {
    if (!isDone) {
      setTyped((held) => (held.length < length ? held + letter : held))
    }
  }

  const erase = (): void => {
    if (!isDone) {
      setTyped((held) => (held.length > 1 ? held.slice(0, -1) : held))
    }
  }

  const send = (): void => {
    if (canSend && onAnswer({ guess: typed, kind: 'word' })) {
      setAnswered(refusal)
      setSent(typed)
    }
  }

  const onKey = useEffectEvent((event: KeyboardEvent) => {
    if (
      event.defaultPrevented ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      isTypingTarget(event.target)
    ) {
      return
    }

    if (event.key === 'Backspace') {
      event.preventDefault()
      erase()
      return
    }

    if (event.key === 'Enter') {
      if (!(event.target instanceof HTMLButtonElement)) {
        event.preventDefault()
        send()
      }
      return
    }

    const letter = event.key.length === 1 ? foldWord(event.key) : null

    if (letter !== null && letter.length === 1) {
      event.preventDefault()
      type(letter)
    }
  })

  useEffect(() => {
    const listener = (event: KeyboardEvent): void => {
      onKey(event)
    }

    window.addEventListener('keydown', listener)

    return () => {
      window.removeEventListener('keydown', listener)
    }
  }, [])

  if (content === null) {
    return null
  }

  const stillLooking = players
    .map((player, seat) => ({ player, seat }))
    .filter(
      ({ player }) =>
        player.id !== youId &&
        (round.openedWithPlayerIds?.includes(player.id) ?? true) &&
        !isGridDone(
          content.grids.find((grid) => grid.playerId === player.id)?.rows ?? []
        )
    )
  const earned = pointsForWord({ foundOnTry })
  const pay = paysForSpeed
    ? clockedPay({
        earned,
        elapsedMs: null,
        roundDurationMs: round.durationMs ?? 0
      }).points
    : earned

  return (
    <section
      aria-label={translate('mysteryword.grid')}
      className='answer-form mystery-word-answer'
      data-done={isDone || undefined}
    >
      <LetterGrid
        firstLetter={firstLetter}
        label={translate('mysteryword.grid')}
        length={length}
        tries={tries}
        typing={isDone ? null : typed}
      />
      <RefusalNote
        message={
          shown === null
            ? null
            : shown.code === 'not_in_dictionary'
              ? translate('mysteryword.refusal.not_in_dictionary', {
                  word: shown.word
                })
              : translate(`mysteryword.refusal.${shown.code}`)
        }
      />
      <div className='foot'>
        <div className='keys' inert={isDone}>
          <MarkLegend
            items={[
              { label: translate('mysteryword.legend.placed'), mark: 'placed' },
              {
                label: translate('mysteryword.legend.present'),
                mark: 'present'
              },
              { label: translate('mysteryword.legend.absent'), mark: 'absent' }
            ]}
          />
          <WordKeyboard
            canErase={!isDone && typed.length > 1}
            canSend={canSend}
            language={content.language}
            marks={bestMarkByLetter(tries)}
            onErase={erase}
            onLetter={type}
            onSend={send}
          />
        </div>
        {isDone && (
          <section className='result' role='status'>
            {foundOnTry === null ? (
              <>
                <h2>{translate('mysteryword.spent.title')}</h2>
                <p className='detail'>
                  {translate('mysteryword.spent.detail')}
                </p>
              </>
            ) : (
              <>
                <div className='result-head'>
                  <h2>
                    {translate('mysteryword.found.title', {
                      count: foundOnTry
                    })}
                  </h2>
                  <b className='pay'>
                    {translate('round.scored', { points: shownPoints(pay) })}
                  </b>
                </div>
                <div
                  className='fold'
                  data-open={stillLooking.length > 0 || undefined}
                  inert={stillLooking.length === 0}
                >
                  <div className='still-looking'>
                    <p className='detail'>
                      {translate('mysteryword.found.stillLooking')}
                    </p>
                    <span className='pawns'>
                      {stillLooking.map(({ player, seat }) => (
                        <Pawn key={player.id} seat={seat} />
                      ))}
                    </span>
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </section>
  )
}
