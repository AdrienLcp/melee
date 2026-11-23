/** A number field's text as it is drawn, the caret in it, and the number it reads. */
export type TypedNumber = {
  caret: number
  text: string
  /** `NaN` while the field holds no digit. */
  value: number
}

type Retyping = {
  /** Where the caret sits in `text`, after the edit. */
  caret: number
  /** A BCP-47 tag: its grouping is drawn, its decimal mark read. */
  locale: string
  maximumFractionDigits: number
  maxValue: number
  /** The text the field drew before this edit. */
  previous: string
  /** The field's text as the edit left it, before it is drawn again. */
  text: string
}

const DECIMAL_MARK = '.'

const separatorsOf = (locale: string): { decimal: string; group: string } => {
  const parts = new Intl.NumberFormat(locale).formatToParts(11111.1)

  return {
    decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
    group: parts.find((part) => part.type === 'group')?.value ?? ','
  }
}

/**
 * The digits and the one decimal mark a text holds, spaces of any width and
 * the locale's grouping dropped. A `.` or a `,` the locale does not group with
 * is a decimal mark, because a numeric keyboard types `.` where French writes
 * `,`. Each kept character carries the index it came from.
 */
const significantOf = ({
  locale,
  text
}: {
  locale: string
  text: string
}): { char: string; index: number }[] => {
  const { decimal, group } = separatorsOf(locale)
  const kept: { char: string; index: number }[] = []
  let hasMark = false

  for (const [index, char] of [...text].entries()) {
    if (char >= '0' && char <= '9') {
      kept.push({ char, index })
    } else if (
      !hasMark &&
      (char === decimal || ((char === '.' || char === ',') && char !== group))
    ) {
      hasMark = true
      kept.push({ char: DECIMAL_MARK, index })
    }
  }

  return kept
}

const keptBefore = (
  kept: { char: string; index: number }[],
  caret: number
): number => kept.filter((entry) => entry.index < caret).length

/**
 * The field's text drawn again after an edit, grouped the locale's way while
 * it is typed so the number read is the number sent, with the caret kept
 * after the same digit it followed. Deleting a group separator deletes the
 * digit before it, or the edit would only put the separator back. `null`
 * refuses the edit: a number past `maxValue`.
 */
export const retypedNumber = ({
  caret,
  locale,
  maximumFractionDigits,
  maxValue,
  previous,
  text
}: Retyping): TypedNumber | null => {
  let kept = significantOf({ locale, text })
  let caretAt = keptBefore(kept, caret)
  const before = significantOf({ locale, text: previous })
  const deletedOnlyASeparator =
    text.length < previous.length &&
    kept.map((entry) => entry.char).join('') ===
      before.map((entry) => entry.char).join('')

  if (deletedOnlyASeparator && caretAt > 0) {
    kept = kept.toSpliced(caretAt - 1, 1)
    caretAt -= 1
  }

  const markAt = kept.findIndex((entry) => entry.char === DECIMAL_MARK)
  const integerKept = markAt === -1 ? kept : kept.slice(0, markAt)
  const fractionKept =
    markAt === -1
      ? []
      : kept.slice(markAt + 1, markAt + 1 + maximumFractionDigits)
  const firstNonZero = integerKept.findIndex((entry) => entry.char !== '0')
  const leadingZeros =
    firstNonZero === -1 ? Math.max(0, integerKept.length - 1) : firstNonZero
  const integerDigits = integerKept
    .slice(leadingZeros)
    .map((entry) => entry.char)
    .join('')
  const fractionDigits = fractionKept.map((entry) => entry.char).join('')
  const hasMark = markAt !== -1

  let significantCaret = Math.max(0, caretAt - leadingZeros)
  const significantLength =
    integerDigits.length + (hasMark ? 1 + fractionDigits.length : 0)

  if (integerDigits === '' && hasMark && significantCaret > 0) {
    significantCaret += 1
  }

  const integerShown = integerDigits === '' && hasMark ? '0' : integerDigits
  const value =
    integerShown === ''
      ? Number.NaN
      : Number(`${integerShown}.${fractionDigits || '0'}`)

  if (value > maxValue) {
    return null
  }

  const { decimal } = separatorsOf(locale)
  const grouped =
    integerShown === ''
      ? ''
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
          Number(integerShown)
        )
  const shown = hasMark ? `${grouped}${decimal}${fractionDigits}` : grouped
  const caretTarget = Math.min(
    significantCaret,
    significantLength + (integerDigits === '' && hasMark ? 1 : 0)
  )

  return {
    caret: caretAfter({ count: caretTarget, decimal, text: shown }),
    text: shown,
    value
  }
}

const caretAfter = ({
  count,
  decimal,
  text
}: {
  count: number
  decimal: string
  text: string
}): number => {
  if (count === 0) {
    return 0
  }

  let seen = 0

  for (const [index, char] of [...text].entries()) {
    if ((char >= '0' && char <= '9') || char === decimal) {
      seen += 1
    }

    if (seen === count) {
      return index + 1
    }
  }

  return text.length
}
