import type React from 'react'

import type { LetterMark } from '@melee/protocol/mystery-word'

import { LetterCell } from './letter-cell'

import './mark-legend.sass'

type MarkLegendProps = {
  /** Each mark the screen draws, beside what it says: its ink and its shape are the swatch. */
  items: readonly { label: string; mark: LetterMark }[]
}

/**
 * The one line that teaches a first-time table the marks: each swatch drawn
 * as a cell is, its shape on its ink, the word beside it.
 */
export const MarkLegend: React.FC<MarkLegendProps> = ({ items }) => (
  <p className='mark-legend'>
    {items.map(({ label, mark }) => (
      <span key={mark}>
        <span aria-hidden className='swatch'>
          <LetterCell index={0} letter='' mark={mark} />
        </span>
        {label}
      </span>
    ))}
  </p>
)
