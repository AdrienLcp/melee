import type React from 'react'

import { type Difficulty, difficulties } from '@melee/protocol/difficulty'

import { SegmentedControl } from '@/presentation/components/segmented-control'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './difficulty-choice.sass'

const isDifficulty = (value: string): value is Difficulty =>
  difficulties.some((difficulty) => difficulty === value)

type DifficultyChoiceProps = {
  className?: string
  /** Set while the strip is still rising into a panel that was already open. */
  'data-arrived'?: boolean
  isDisabled: boolean
  /** The whole evening's strip rather than one game's, which only changes its name. */
  isEvening?: boolean
  onChange: (difficulty: Difficulty) => void
  /** `custom` lifts no level: the evening's games deal at different ones. */
  value: Difficulty | 'custom'
}

/**
 * The level a game deals its content at, in the words every game shares, with
 * what the chosen one means said under it — the bank decides what easy is, the
 * strip only promises a table with children can play it.
 */
export const DifficultyChoice: React.FC<DifficultyChoiceProps> = ({
  className,
  isEvening = false,
  onChange,
  value,
  ...props
}) => {
  const translate = useTranslate()

  return (
    <SegmentedControl
      {...props}
      className={['difficulty-choice', className].filter(Boolean).join(' ')}
      description={translate(
        value === 'custom'
          ? 'host.difficulty.custom'
          : `host.difficulty.hint.${value}`
      )}
      label={translate(
        isEvening ? 'host.difficulty.evening' : 'host.difficulty.label'
      )}
      onChange={(next) => {
        if (isDifficulty(next)) {
          onChange(next)
        }
      }}
      options={difficulties.map((difficulty) => ({
        label: translate(`host.difficulty.${difficulty}`),
        value: difficulty
      }))}
      value={value === 'custom' ? null : value}
    />
  )
}
