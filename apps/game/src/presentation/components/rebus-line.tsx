import type React from 'react'

import { rebusWordsOf } from '@/helpers/rebus-words'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { VisuallyHidden } from './visually-hidden'

import './rebus-line.sass'

type RebusLineProps = {
  /** The title written in emojis, words parted by a space. */
  rebus: string
  /**
   * The answer is printed beside it, as on the reveal: the line is then a
   * repeat a screen reader skips.
   */
  isNamedBeside?: boolean
}

/**
 * A rebus printed onto the card it is asked on, one emoji after another in
 * each device's own emoji font. The caller sizes it through `--rebus-size`,
 * and the line shrinks below that to keep its widest word on one line.
 */
export const RebusLine: React.FC<RebusLineProps> = ({
  isNamedBeside = false,
  rebus
}) => {
  const translate = useTranslate()
  const words = rebusWordsOf(rebus)
  const longestWord = Math.max(...words.map(({ emojis }) => emojis.length))

  return (
    <div
      aria-hidden={isNamedBeside || undefined}
      className='rebus-line'
      style={{ '--rebus-longest-word': longestWord }}
    >
      <p className='words'>
        <VisuallyHidden elementType='span'>
          {`${translate('quiz.rebus.alt')} `}
        </VisuallyHidden>
        {words.map(({ emojis, key }) => (
          <span className='word' key={key}>
            {emojis.join('')}
          </span>
        ))}
      </p>
    </div>
  )
}
