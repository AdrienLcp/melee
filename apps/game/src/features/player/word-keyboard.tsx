import type React from 'react'
import { Button, Group, type PressEvent } from 'react-aria-components'

import type { LetterMark } from '@melee/protocol/mystery-word'
import type { QuestionLanguage } from '@melee/protocol/question'

import { EraseIcon } from '@/presentation/components/icons'
import { MarkShape } from '@/presentation/components/letter-cell'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './word-keyboard.sass'

/** The rows a French or an English table already types on, so no letter has to be looked for. */
const KEY_ROWS = {
  en: ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'],
  fr: ['AZERTYUIOP', 'QSDFGHJKLM', 'WXCVBN']
} as const satisfies Record<QuestionLanguage, readonly string[]>

/**
 * A touch focuses the key it lands on despite `preventFocusOnPress`, and a
 * focused key then takes the physical keyboard's Enter for itself: the try
 * would never go. A key reached by Tab keeps its focus.
 */
const releaseFocus = (event: PressEvent): void => {
  if (event.pointerType !== 'keyboard' && event.target instanceof HTMLElement) {
    event.target.blur()
  }
}

type WordKeyboardProps = {
  canErase: boolean
  canSend: boolean
  /** Inks each key by the best mark its letter has shown; a letter never tried is not in it. */
  marks: ReadonlyMap<string, LetterMark>
  /** The round's dictionary, which picks the rows its keys are laid out in. */
  language: QuestionLanguage
  onErase: () => void
  onLetter: (letter: string) => void
  onSend: () => void
}

/**
 * A keyboard drawn on the screen, so the device's own never rises over the
 * grid: a key per letter in the rows the round's language types on, a wide
 * erase and the coral press that tries the row.
 */
export const WordKeyboard: React.FC<WordKeyboardProps> = ({
  canErase,
  canSend,
  language,
  marks,
  onErase,
  onLetter,
  onSend
}) => {
  const translate = useTranslate()
  const [top, middle, bottom] = KEY_ROWS[language]

  const keys = (row: string): React.ReactNode =>
    [...row].map((letter) => {
      const mark = marks.get(letter)

      return (
        <Button
          className='word-key'
          data-mark={mark}
          key={letter}
          onPress={(event) => {
            releaseFocus(event)
            onLetter(letter)
          }}
          preventFocusOnPress
        >
          {(mark === 'placed' || mark === 'present') && (
            <MarkShape mark={mark} />
          )}
          <span className='letter'>{letter}</span>
          {mark !== undefined && (
            <VisuallyHidden elementType='span'>
              {`, ${translate(`mysteryword.mark.${mark}`)}`}
            </VisuallyHidden>
          )}
        </Button>
      )
    })

  return (
    <Group
      aria-label={translate('mysteryword.keyboard.label')}
      className='word-keyboard'
      data-layout={language}
    >
      <div className='row'>{keys(top)}</div>
      <div className='row'>{keys(middle)}</div>
      <div className='row'>
        <Button
          aria-label={translate('mysteryword.keyboard.erase')}
          className='word-key wide erase'
          isDisabled={!canErase}
          onPress={(event) => {
            releaseFocus(event)
            onErase()
          }}
          preventFocusOnPress
        >
          <EraseIcon />
        </Button>
        {keys(bottom)}
        <Button
          className='word-key wide send'
          isDisabled={!canSend}
          onPress={(event) => {
            releaseFocus(event)
            onSend()
          }}
          preventFocusOnPress
        >
          {translate('mysteryword.keyboard.send')}
        </Button>
      </div>
    </Group>
  )
}
