import type React from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Button, Group, type PressEvent } from 'react-aria-components'

import type { LeanAnswer } from '@melee/protocol/client-message'
import type { ProtocolErrorCode } from '@melee/protocol/error-code'
import { LONGEST_WORD_MIN_LENGTH } from '@melee/protocol/longest-word'
import type { RoundView } from '@melee/protocol/room'
import type { ProtocolErrorMessage } from '@melee/protocol/server-message'

import { shuffled } from '@melee/core/helpers/random'
import type { WordRefusal } from '@melee/core/longestword/word-check'
import { foldWord } from '@melee/core/words/fold'

import { longestWordContent } from '@/helpers/round-content'
import {
  EraseIcon,
  ShuffleIcon,
  TrophyIcon
} from '@/presentation/components/icons'
import { isVowelTile } from '@/presentation/components/letter-tile'
import { RefusalNote } from '@/presentation/components/refusal-note'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import type { PlayerAnswer } from './answer-forms'
import { useLean } from './use-lean'

import './longest-word-answer.sass'

/** What the seat says in place: why a word was turned down, or that its word already matches the draw's longest. */
type SaidRefusal = WordRefusal | 'already_buzzed'

const SAID_REFUSALS = {
  already_buzzed: true,
  letter_not_in_draw: true,
  not_in_dictionary: true,
  not_one_word: true
} as const satisfies Record<SaidRefusal, true>

/** A refusal the seat says under its word, rather than in the screen's error line. */
export const isWordRefusal = (code: ProtocolErrorCode): code is SaidRefusal =>
  Object.hasOwn(SAID_REFUSALS, code)

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target.closest('input, textarea, select') !== null)

/**
 * A touch focuses the tile it lands on despite `preventFocusOnPress`, and a
 * focused tile then takes the physical keyboard's Enter for itself. A tile
 * reached by Tab keeps its focus.
 */
const releaseFocus = (event: PressEvent): void => {
  if (event.pointerType !== 'keyboard' && event.target instanceof HTMLElement) {
    event.target.blur()
  }
}

type LongestWordAnswerProps = {
  /** `false` from the socket means the frame was never written. */
  onAnswer: (answer: PlayerAnswer) => boolean
  /** Saves the word on the row before it is sent, which the round takes if it runs out first; `null` where nothing is saved. */
  onLean: ((answer: LeanAnswer | null) => boolean) | null
  /** The server's last refusal to this screen, whatever it answered; the seat says it when it answers a word. */
  refusal: ProtocolErrorMessage | null
  round: RoundView
}

type ShownRefusal = { code: SaidRefusal; word: string }

/**
 * A seat's nine tiles, pressed to lay them into a row of nine slots: a laid
 * tile sinks into its socket, so no letter is used twice. A physical keyboard
 * lays the first free tile of the letter struck. Every accepted word is
 * listed, longest first, the one paid marked. The word on the row is saved
 * as it changes, and paid if the clock runs out before it is sent.
 *
 * Mounted under `key={round.id}`, so a round always opens on an empty row.
 */
export const LongestWordAnswer: React.FC<LongestWordAnswerProps> = ({
  onAnswer,
  onLean,
  refusal,
  round
}) => {
  const { translate } = useI18n()
  const leaning = useLean(onLean)
  const content = longestWordContent(round)
  const letters = content?.letters ?? []
  const words = content?.yourWords ?? []
  const [order, setOrder] = useState(() =>
    Array.from({ length: letters.length }, (_, at) => at)
  )
  const [laid, setLaid] = useState<readonly number[]>([])
  const [wordsSeen, setWordsSeen] = useState(words.length)
  const [answered, setAnswered] = useState(refusal)
  const [sent, setSent] = useState<string | null>(null)
  const typed = laid.map((at) => letters[at]).join('')
  const draft = laid.length >= LONGEST_WORD_MIN_LENGTH ? typed : null
  const leanedDraft = useRef<string | null>(null)

  // A word banked: the row empties for the next one, and whatever the server
  // last refused is spent.
  if (words.length !== wordsSeen) {
    setWordsSeen(words.length)
    setLaid([])
    setAnswered(refusal)
    setSent(null)
  }

  const shown: ShownRefusal | null =
    refusal !== null && refusal !== answered && isWordRefusal(refusal.code)
      ? { code: refusal.code, word: sent ?? typed }
      : null

  // Sent and not yet answered either way: a second press would send it twice.
  const isWaiting = sent !== null && refusal === answered
  const canSend = !isWaiting && laid.length >= LONGEST_WORD_MIN_LENGTH

  // Read off the state being updated rather than the render's: two keys
  // struck between two renders both land.
  const lay = (at: number): void => {
    setLaid((held) => (held.includes(at) ? held : [...held, at]))
  }

  const layLetter = (letter: string): void => {
    setLaid((held) => {
      const at = letters.findIndex(
        (drawn, index) => drawn === letter && !held.includes(index)
      )

      return at === -1 ? held : [...held, at]
    })
  }

  const erase = (): void => {
    setLaid((held) => held.slice(0, -1))
  }

  const send = (): void => {
    if (canSend && onAnswer({ guess: typed, kind: 'letters' })) {
      leaning.cancel()
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
      layLetter(letter)
    }
  })

  const leanDraft = useEffectEvent((word: string | null) => {
    leaning.lean(word === null ? null : { guess: word, kind: 'letters' })
  })

  useEffect(() => {
    if (draft !== leanedDraft.current) {
      leanedDraft.current = draft
      leanDraft(draft)
    }
  }, [draft])

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

  const ranked = words.toSorted((left, right) => right.length - left.length)

  return (
    <section
      aria-label={translate('longestword.seat')}
      className='answer-form longest-word-answer'
    >
      <div className='words-area'>
        <ol
          aria-label={translate('longestword.words')}
          className='words'
          data-empty={ranked.length === 0 || undefined}
        >
          {ranked.map((word, rank) => (
            <li data-kept={rank === 0 || undefined} key={word}>
              <span className='word'>{word}</span>
              <span className='length'>
                {rank === 0 && <TrophyIcon />}
                {word.length}
                {rank === 0 && (
                  <VisuallyHidden elementType='span'>
                    {translate('longestword.kept')}
                  </VisuallyHidden>
                )}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className='compose'>
        <p className='slots'>
          <VisuallyHidden elementType='span'>
            {typed === ''
              ? translate('longestword.emptyWord')
              : translate('longestword.typing', { word: typed })}
          </VisuallyHidden>
          {Array.from({ length: letters.length }, (_, at) => at).map((slot) => {
            const letter = typed[slot]

            return letter === undefined ? (
              <span
                aria-hidden
                className='slot'
                data-next={slot === typed.length || undefined}
                key={slot}
              />
            ) : (
              <span
                aria-hidden
                className='letter-tile'
                data-vowel={isVowelTile(letter) || undefined}
                key={slot}
              >
                {letter}
              </span>
            )
          })}
        </p>
        <RefusalNote
          message={
            shown === null
              ? null
              : shown.code === 'not_in_dictionary'
                ? translate('longestword.refusal.not_in_dictionary', {
                    word: shown.word
                  })
                : translate(`longestword.refusal.${shown.code}`)
          }
        />
        <Group aria-label={translate('longestword.draw')} className='tiles'>
          {order.map((at) => {
            const letter = letters[at] ?? ''
            const isLaid = laid.includes(at)

            return (
              <Button
                className='letter-tile'
                data-used={isLaid || undefined}
                data-vowel={isVowelTile(letter) || undefined}
                isDisabled={isLaid}
                key={at}
                onPress={(event) => {
                  releaseFocus(event)
                  lay(at)
                }}
                preventFocusOnPress
              >
                {letter}
              </Button>
            )
          })}
        </Group>
        <div className='actions'>
          <Button
            aria-label={translate('longestword.erase')}
            className='action'
            isDisabled={laid.length === 0}
            onPress={(event) => {
              releaseFocus(event)
              erase()
            }}
            preventFocusOnPress
          >
            <EraseIcon />
          </Button>
          <Button
            className='action'
            onPress={(event) => {
              releaseFocus(event)
              setOrder((held) => shuffled(held))
            }}
            preventFocusOnPress
          >
            <ShuffleIcon />
            {translate('longestword.shuffle')}
          </Button>
          <Button
            className='action send'
            isDisabled={!canSend}
            onPress={(event) => {
              releaseFocus(event)
              send()
            }}
            preventFocusOnPress
          >
            {translate('longestword.send')}
          </Button>
        </div>
      </div>
    </section>
  )
}
