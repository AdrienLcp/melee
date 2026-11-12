import type { ClockReading } from '@/helpers/clock-reading'

import type { Translate } from './translation'

/** A clock's reading as the locale prints it: `1:20`, `0:05`, `45`. */
export const clockFigure = ({
  reading,
  translate
}: {
  reading: ClockReading
  translate: Translate
}): string =>
  reading.kind === 'minutes'
    ? translate('round.clock.minutes', {
        minutes: reading.minutes,
        seconds: reading.seconds
      })
    : translate('round.clock.seconds', { seconds: reading.seconds })
