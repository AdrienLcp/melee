import type React from 'react'
import { useEffect, useEffectEvent, useState } from 'react'
import { Button as ReactAriaButton } from 'react-aria-components'

import type { PlayerId } from '@melee/protocol/identifiers'
import { LIGHTS_CELL_COUNT, type LightsCell } from '@melee/protocol/lights'
import type { RoundView } from '@melee/protocol/room'

import {
  lightsRunLengthOf,
  MISS_FREEZE_MS,
  TRAP_FREEZE_MS
} from '@melee/core/lights/counted-tap'
import { lightsRunOf } from '@melee/core/lights/lights-run'
import type { ClockEstimate } from '@melee/core/time/clock-sync'

import { lightsContent } from '@/helpers/round-content'
import {
  buzzFeedback,
  keyLabelsOf,
  onPhysicalKeyDown
} from '@/infrastructure/browser'
import { nowMs } from '@/infrastructure/clock'
import { RoundProgress } from '@/presentation/components/round-progress'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import {
  lightsElapsedMsOf,
  useLightsWindow
} from '@/presentation/theme/use-lights-window'

import './lights-board.sass'

/**
 * The board under each hand, by physical place rather than by letter: the
 * left hand's three rows and the number pad, the same block under the same
 * fingers on any layout.
 */
const CELL_KEYS: readonly (readonly string[])[] = [
  ['KeyQ', 'Numpad7'],
  ['KeyW', 'Numpad8'],
  ['KeyE', 'Numpad9'],
  ['KeyA', 'Numpad4'],
  ['KeyS', 'Numpad5'],
  ['KeyD', 'Numpad6'],
  ['KeyZ', 'Numpad1'],
  ['KeyX', 'Numpad2'],
  ['KeyC', 'Numpad3']
]

const LETTER_KEYS = CELL_KEYS.map(([letter]) => letter ?? '')

const CELLS: readonly LightsCell[] = Array.from(
  { length: LIGHTS_CELL_COUNT },
  (_, cell) => cell
)

const cellOfKey = (code: string): LightsCell | null => {
  const cell = CELL_KEYS.findIndex((codes) => codes.includes(code))

  return cell === -1 ? null : cell
}

/** `KeyQ` printed as `Q`, what a layout the browser cannot read falls back on. */
const codeLetterOf = (code: string): string => code.replace('Key', '')

/**
 * How long a seat's own count may run ahead of the server's before the board
 * goes back to the server's: a hit the server did not count — under the
 * floor, a clock read early — would otherwise leave every later tap chasing a
 * step the server is not on.
 */
const RESYNC_MS = 1_500

type Freeze = {
  kind: 'miss' | 'trap'
  /** When it froze, so a second freeze restarts the drain rather than continuing it. */
  serial: number
}

type CellState = 'dark' | 'lit' | 'trap'

type LightsBoardProps = {
  clock: ClockEstimate | null
  /** `false` from the socket means the frame was never written. */
  onTap: (tap: { cell: LightsCell; roundId: string; step: number }) => boolean
  round: RoundView
  youId: PlayerId
}

/**
 * A seat's board: nine sockets in a chipboard tray of one size on every
 * screen, set at its foot where the thumb is, so a big phone does not make
 * the thumb travel further than a small one, under the line saying what to
 * press. The lit cell
 * is a coral token set in its socket on the frame it lights, with no
 * entrance — a reaction game measures that frame. A trap is a paper token
 * crossed and hatched, told apart by shape rather than colour.
 *
 * The board lights and darkens on this device's estimate of the server
 * clock, so every seat plays a window of the same length whatever its Wi-Fi.
 * A hit moves the board on at once and is sent; the server's count catches up
 * on its next tick.
 */
export const LightsBoard: React.FC<LightsBoardProps> = ({
  clock,
  onTap,
  round,
  youId
}) => {
  const translate = useTranslate()
  const content = lightsContent(round)
  const opensAt = content?.opensAt ?? null
  const closesAt = content?.closesAt ?? null
  const windowState = useLightsWindow({ clock, closesAt, opensAt })
  const windowMs =
    opensAt === null || closesAt === null ? 0 : closesAt - opensAt

  const [ahead, setAhead] = useState<{ roundId: string; step: number } | null>(
    null
  )
  const [freeze, setFreeze] = useState<Freeze | null>(null)
  const [keyLabels, setKeyLabels] = useState<ReadonlyMap<string, string>>(
    () => new Map()
  )

  const serverHits =
    content?.seats.find((seat) => seat.playerId === youId)?.hits ?? 0
  const step =
    ahead !== null && ahead.roundId === round.id
      ? Math.max(ahead.step, serverHits)
      : serverHits
  const isAhead = step > serverHits

  const run =
    content === null || opensAt === null || closesAt === null
      ? []
      : lightsRunOf({
          hasTraps: content.hasTraps,
          length: lightsRunLengthOf(windowMs),
          seed: content.seed
        })
  const light = run[step]
  const isLive = windowState.phase === 'open' && freeze === null

  useEffect(() => {
    if (!isAhead) {
      return
    }

    const timer = setTimeout(() => {
      setAhead((current) =>
        current !== null && current.step > serverHits ? null : current
      )
    }, RESYNC_MS)

    return () => clearTimeout(timer)
  }, [isAhead, serverHits])

  useEffect(() => {
    if (freeze === null) {
      return
    }

    const timer = setTimeout(
      () => setFreeze(null),
      freeze.kind === 'trap' ? TRAP_FREEZE_MS : MISS_FREEZE_MS
    )

    return () => clearTimeout(timer)
  }, [freeze])

  useEffect(() => {
    let isCurrent = true

    void keyLabelsOf(LETTER_KEYS).then((labels) => {
      if (isCurrent) {
        setKeyLabels(labels)
      }
    })

    return () => {
      isCurrent = false
    }
  }, [])

  const press = (cell: LightsCell): void => {
    if (!isLive || light === undefined) {
      return
    }

    if (cell === light.target) {
      buzzFeedback('press')
      setAhead({ roundId: round.id, step: step + 1 })
      onTap({ cell, roundId: round.id, step })

      return
    }

    if (content?.hasTraps === true && cell === light.trap) {
      buzzFeedback('lost')
      setFreeze({ kind: 'trap', serial: nowMs() })
      onTap({ cell, roundId: round.id, step })

      return
    }

    setFreeze({ kind: 'miss', serial: nowMs() })
  }

  const onKey = useEffectEvent(
    ({ code, key }: { code: string; key: string }) => {
      const cell = cellOfKey(code)

      if (cell === null) {
        return
      }

      // Learnt from the key itself where the browser could not say what the
      // layout prints there: a French seat sees A on its first press.
      if (code.startsWith('Key') && key.length === 1) {
        setKeyLabels((labels) =>
          labels.get(code) === key ? labels : new Map(labels).set(code, key)
        )
      }

      press(cell)
    }
  )

  useEffect(() => onPhysicalKeyDown((pressed) => onKey(pressed)), [])

  const cellStateOf = (cell: LightsCell): CellState => {
    if (!isLive || light === undefined) {
      return 'dark'
    }

    if (cell === light.target) {
      return 'lit'
    }

    return content?.hasTraps === true && cell === light.trap ? 'trap' : 'dark'
  }

  return (
    <section
      aria-label={translate('lights.board')}
      className='player-round lights-board'
    >
      <header className='lights-head'>
        <b className='lights-hits' key={step}>
          {step}
        </b>
        {windowMs > 0 && (
          <RoundProgress
            durationMs={windowMs}
            elapsedMs={lightsElapsedMsOf({ state: windowState, windowMs })}
          />
        )}
      </header>
      <div className='lights-tray-wrap'>
        <p className='lights-instruction'>{translate('lights.instruction')}</p>
        <div
          className='lights-tray'
          data-frozen={freeze?.kind}
          data-waiting={windowState.phase !== 'open' || undefined}
        >
          {CELLS.map((cell) => {
            const state = cellStateOf(cell)
            const letter = LETTER_KEYS[cell] ?? ''

            return (
              <ReactAriaButton
                aria-label={translate(`lights.cell.${state}`)}
                className='lights-cell'
                data-state={state}
                key={cell}
                onPressStart={() => press(cell)}
              >
                <span className='face' />
                <kbd className='key-cap'>
                  {(
                    keyLabels.get(letter) ?? codeLetterOf(letter)
                  ).toUpperCase()}
                </kbd>
              </ReactAriaButton>
            )
          })}
        </div>
        <p className='lights-foot' role='status'>
          <i
            aria-hidden='true'
            className='drain'
            data-shown={freeze?.kind === 'trap' || undefined}
            key={freeze?.serial}
            style={{ '--freeze-duration': `${TRAP_FREEZE_MS}ms` }}
          />
          <span
            className='stamp'
            data-shown={freeze?.kind === 'trap' || undefined}
          >
            {translate('lights.trapped')}
          </span>
        </p>
      </div>
    </section>
  )
}
