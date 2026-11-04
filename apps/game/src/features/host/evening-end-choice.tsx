import type React from 'react'

import type { RoomSettings } from '@melee/protocol/room'

import { racesToTheFinish } from '@melee/core/board/track-finish'
import { ROUND_COUNT_STEPS } from '@melee/core/room/room-settings'

import { SegmentedControl } from '@/presentation/components/segmented-control'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

const FINISH = 'finish' as const
const OPEN = 'open' as const

type EveningEnd = typeof FINISH | typeof OPEN | number

/**
 * The strip's counts, with the one the room is on when it is none of them —
 * three games ticked in the lobby make twelve, and a strip with nothing pressed
 * says the evening has no length.
 */
const countsWith = (roundCount: number | null): number[] =>
  roundCount === null || ROUND_COUNT_STEPS.some((step) => step === roundCount)
    ? [...ROUND_COUNT_STEPS]
    : [...ROUND_COUNT_STEPS, roundCount].toSorted((a, b) => a - b)

const endOf = (settings: RoomSettings): EveningEnd =>
  racesToTheFinish(settings) ? FINISH : (settings.roundCount ?? OPEN)

type EveningEndChoiceProps = {
  isDisabled: boolean
  onChange: (settings: RoomSettings) => void
  settings: RoomSettings
}

/**
 * How the evening ends, as one strip of exclusive answers: the first pawn
 * home — offered on a track alone —, after a count of rounds, or when the
 * host stops. A count is the only end it names, so a pawn home before it
 * waits on the last case.
 */
export const EveningEndChoice: React.FC<EveningEndChoiceProps> = ({
  isDisabled,
  onChange,
  settings
}) => {
  const translate = useTranslate()
  const hasTrack = settings.board.kind === 'track'
  const end = endOf(settings)
  const ends: EveningEnd[] = [
    ...(hasTrack ? [FINISH] : []),
    ...countsWith(settings.roundCount),
    OPEN
  ]

  const choose = (next: EveningEnd) => {
    onChange({
      ...settings,
      endsAtFinish: next === FINISH,
      roundCount: typeof next === 'number' ? next : null
    })
  }

  const description =
    end === FINISH
      ? translate('host.eveningEnd.hint.finish')
      : typeof end === 'number' && hasTrack
        ? translate('host.eveningEnd.hint.countOnTrack')
        : undefined

  return (
    <SegmentedControl
      className={hasTrack ? 'round-count races' : 'round-count'}
      description={description}
      isDisabled={isDisabled}
      label={translate('host.eveningEnd.label')}
      onChange={(next) => {
        const chosen = ends.find((option) => String(option) === next)

        if (chosen !== undefined) {
          choose(chosen)
        }
      }}
      options={ends.map((option) => ({
        label:
          option === FINISH
            ? translate('host.eveningEnd.finish')
            : option === OPEN
              ? translate('host.roundCount.open')
              : String(option),
        value: String(option)
      }))}
      value={String(end)}
    />
  )
}
