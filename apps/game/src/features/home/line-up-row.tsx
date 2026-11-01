import type React from 'react'

import { Button } from '@/presentation/components/button'
import {
  ChevronLeftIcon,
  ChevronRightIcon
} from '@/presentation/components/icons'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import { useRowScroll } from './use-row-scroll'

import './line-up-row.sass'

type LineUpRowProps = {
  /** The row's lids, each an `<li>`. */
  children: React.ReactNode
  /** How many line-ups the row holds, printed beside its title. */
  count: number
  /** What a press on one of its lids does. */
  hint: string
  /** Prefixes the ids its heading, hint and list are referred to by. */
  id: string
  title: string
}

/**
 * Line-ups on one row the width of the page, scrolled sideways and snapped to
 * a lid's edge, so a whole shelf of them costs the page one lid's height.
 *
 * The arrows are a mouse's way along, shown on a fine pointer while the row
 * overflows and dead at each end. They stay out of the tab order: a keyboard
 * walks the lids themselves, and the browser scrolls each into view.
 */
export const LineUpRow: React.FC<LineUpRowProps> = ({
  children,
  count,
  hint,
  id,
  title
}) => {
  const translate = useTranslate()
  const { isAtEnd, isAtStart, page, scrollerRef } = useRowScroll()

  return (
    <section
      aria-describedby={`${id}-hint`}
      aria-labelledby={`${id}-title`}
      className='line-up-row'
    >
      <div className='row-head'>
        <div className='shelf-heading'>
          <h2 className='shelf-title' id={`${id}-title`}>
            {title}
            <span aria-hidden='true' className='count'>
              {count}
            </span>
            <VisuallyHidden>
              {translate('home.lineUpCount', { count })}
            </VisuallyHidden>
          </h2>
          <p className='shelf-hint' id={`${id}-hint`}>
            {hint}
          </p>
        </div>
        {!(isAtStart && isAtEnd) && (
          <div className='row-arrows'>
            <Button
              aria-controls={`${id}-list`}
              aria-label={translate('home.previousLineUps')}
              className='row-arrow'
              excludeFromTabOrder
              isDisabled={isAtStart}
              onPress={() => page(-1)}
              variant='outlined'
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              aria-controls={`${id}-list`}
              aria-label={translate('home.nextLineUps')}
              className='row-arrow'
              excludeFromTabOrder
              isDisabled={isAtEnd}
              onPress={() => page(1)}
              variant='outlined'
            >
              <ChevronRightIcon />
            </Button>
          </div>
        )}
      </div>
      <ul
        aria-labelledby={`${id}-title`}
        className='scroller'
        id={`${id}-list`}
        ref={scrollerRef}
      >
        {children}
      </ul>
    </section>
  )
}
