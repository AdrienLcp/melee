import type React from 'react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { Button, Group, type PressEvent } from 'react-aria-components'

import type { LeanAnswer } from '@melee/protocol/client-message'
import type { ProtocolErrorCode } from '@melee/protocol/error-code'
import {
  type Calculation,
  type CalculationOperator,
  calculationOperators,
  MAKE_NUMBER_TILE_COUNT
} from '@melee/protocol/make-number'
import type { RoundView } from '@melee/protocol/room'
import type { ProtocolErrorMessage } from '@melee/protocol/server-message'

import {
  calculationValue,
  OPERATOR_SIGNS
} from '@melee/core/makenumber/calculation-check'
import {
  calculationAt,
  mergedRack,
  nearestMadePlace,
  openedRack,
  type Rack,
  type RackPlace,
  rackLines,
  rackPlaces,
  undoneRack
} from '@melee/core/makenumber/rack'

import { makeNumberContent } from '@/helpers/round-content'
import {
  CrossIcon,
  DivideIcon,
  MinusIcon,
  PlusIcon,
  ReplayIcon,
  TrophyIcon,
  UndoIcon
} from '@/presentation/components/icons'
import { RefusalNote } from '@/presentation/components/refusal-note'
import { VisuallyHidden } from '@/presentation/components/visually-hidden'
import { useI18n } from '@/presentation/i18n/i18n-provider'

import type { PlayerAnswer } from './answer-forms'
import { useLean } from './use-lean'

import '@/presentation/components/number-tile.sass'
import './make-number-answer.sass'

/** What the seat says in place: a calculation the tiles cannot make, or one sent once its count is already good. */
type SaidRefusal = 'already_buzzed' | 'invalid_calculation'

const SAID_REFUSALS = {
  already_buzzed: true,
  invalid_calculation: true
} as const satisfies Record<SaidRefusal, true>

/** A refusal the seat says over its rack, rather than in the screen's error line. */
export const isCalculationRefusal = (
  code: ProtocolErrorCode
): code is SaidRefusal => Object.hasOwn(SAID_REFUSALS, code)

const OPERATOR_GLYPHS = {
  add: PlusIcon,
  divide: DivideIcon,
  multiply: CrossIcon,
  subtract: MinusIcon
} as const satisfies Record<CalculationOperator, React.FC>

/** How many sends the target card lists beside the kept one, the latest first: the rest are farther and already said. */
const OTHER_SENDS_SHOWN = 2

/** How many tiles a rack row holds: six tiles stand three by two. */
const RACK_COLUMNS = 3

/**
 * Each place keeps its button for the round, so a tile leaving it eases into
 * the socket rather than leaving the tree.
 */
const RACK_PLACES = Array.from(
  { length: MAKE_NUMBER_TILE_COUNT },
  (_, place) => place
)

const EMPTY_PLACE: RackPlace = { kind: 'empty' }

/**
 * A touch focuses the tile it lands on despite `preventFocusOnPress`, and a
 * focused tile keeps a ring nobody asked for. A tile reached by Tab keeps it.
 */
const releaseFocus = (event: PressEvent): void => {
  if (event.pointerType !== 'keyboard' && event.target instanceof HTMLElement) {
    event.target.blur()
  }
}

/** The last thing done to the rack, which decides what moves: a merge slides and fuses, an undo sets tiles back. */
type RackMove = 'merged' | 'settled' | 'undone'

type MakeNumberAnswerProps = {
  /** What is left of the round's clock on the last snapshot, `null` while nothing counts down. */
  closesInMs: number | null
  /** `false` from the socket means the frame was never written. */
  onAnswer: (answer: PlayerAnswer) => boolean
  /** Saves the calculation of the made tile nearest the target before it is sent, which the round takes if it runs out first; `null` where nothing is saved. */
  onLean: ((answer: LeanAnswer | null) => boolean) | null
  /** The server's last refusal to this screen, whatever it answered; the seat says it when it answers a calculation. */
  refusal: ProtocolErrorMessage | null
  round: RoundView
}

/**
 * A seat's six tiles and the target. A tile pressed is lifted, an operator
 * chosen, and a second tile pressed takes the result: the first slides onto
 * it and leaves an empty socket, and the result is lifted for the next step.
 * A step the rule refuses is out of reach, its tiles dimmed. The send press sends
 * the lifted made tile's calculation, or the made tile nearest the target,
 * which is also what is saved as it changes and paid if the clock runs out
 * first. The calculations sent are listed by value, the kept one marked.
 *
 * Mounted under `key={round.id}`, so a round always opens on the tiles dealt.
 */
export const MakeNumberAnswer: React.FC<MakeNumberAnswerProps> = ({
  closesInMs,
  onAnswer,
  onLean,
  refusal,
  round
}) => {
  const { translate } = useI18n()
  const leaning = useLean({ closesInMs, onLean })
  const content = makeNumberContent(round)
  const tiles = content?.tiles ?? []
  const target = content?.target ?? 0
  const sends = content?.yourCalculations ?? []
  const [rack, setRack] = useState<Rack>(() => openedRack(tiles))
  const [lifted, setLifted] = useState<number | null>(null)
  const [operator, setOperator] = useState<CalculationOperator | null>(null)
  const [move, setMove] = useState<RackMove>('settled')
  const [sendsSeen, setSendsSeen] = useState(sends.length)
  const [answered, setAnswered] = useState(refusal)
  const [isSending, setIsSending] = useState(false)
  const leaned = useRef<string>('null')

  // A calculation banked: whatever the server last refused is spent.
  if (sends.length !== sendsSeen) {
    setSendsSeen(sends.length)
    setAnswered(refusal)
    setIsSending(false)
  }

  const places = rackPlaces(rack)
  const lines = rackLines(rack)
  const liftedPlace = lifted === null ? undefined : places[lifted]
  const sentPlace =
    liftedPlace?.kind === 'tile' && liftedPlace.isMade
      ? lifted
      : nearestMadePlace({ rack, target })
  const toSend =
    sentPlace === null ? null : calculationAt({ place: sentPlace, rack })
  const toSendTile = sentPlace === null ? undefined : places[sentPlace]
  const toSendValue = toSendTile?.kind === 'tile' ? toSendTile.value : null
  const nearest = nearestMadePlace({ rack, target })
  const leanSteps =
    nearest === null ? null : calculationAt({ place: nearest, rack })

  const sent = sends.flatMap((steps, order) => {
    const value = calculationValue({ steps, tiles })

    return value === null
      ? []
      : [{ distance: Math.abs(value - target), order, value }]
  })
  const kept = sent.reduce<(typeof sent)[number] | null>(
    (best, entry) =>
      best === null || entry.distance < best.distance ? entry : best,
    null
  )
  const others = sent
    .filter((entry) => entry !== kept)
    .toReversed()
    .slice(0, OTHER_SENDS_SHOWN)
  const isGood = kept?.distance === 0

  const shownRefusal =
    refusal !== null &&
    refusal !== answered &&
    isCalculationRefusal(refusal.code)
      ? refusal.code
      : null

  // Sent and not yet answered either way: a second press would send it twice.
  const isWaiting = isSending && refusal === answered
  const canSend = !isWaiting && !isGood && toSend !== null

  const canMerge = (onto: number): boolean =>
    lifted !== null &&
    operator !== null &&
    mergedRack({ from: lifted, onto, operator, rack }) !== null

  const pressTile = (place: number): void => {
    if (lifted === null || lifted === place) {
      setLifted(lifted === place ? null : place)
      setOperator(null)
      setMove('settled')
      return
    }

    if (operator === null) {
      setLifted(place)
      setMove('settled')
      return
    }

    const next = mergedRack({ from: lifted, onto: place, operator, rack })

    if (next !== null) {
      setRack(next)
      setLifted(place)
      setOperator(null)
      setMove('merged')
    }
  }

  const pressOperator = (pressed: CalculationOperator): void => {
    setOperator((held) => (held === pressed ? null : pressed))
  }

  const undo = (): void => {
    if (lifted !== null && rack.merges.length === 0) {
      setLifted(null)
      setOperator(null)
      return
    }

    setRack(undoneRack(rack))
    setLifted(null)
    setOperator(null)
    setMove('undone')
  }

  const startOver = (): void => {
    setRack(openedRack(tiles))
    setLifted(null)
    setOperator(null)
    setMove('undone')
  }

  const send = (): void => {
    if (
      canSend &&
      toSend !== null &&
      onAnswer({ kind: 'calculation', steps: toSend })
    ) {
      leaning.cancel()
      setAnswered(refusal)
      setIsSending(true)
    }
  }

  const leanCalculation = useEffectEvent((steps: Calculation | null) => {
    leaning.lean(steps === null ? null : { kind: 'calculation', steps })
  })

  const leanKey = JSON.stringify(leanSteps)

  useEffect(() => {
    if (leanKey !== leaned.current) {
      leaned.current = leanKey
      leanCalculation(leanSteps)
    }
  }, [leanKey, leanSteps])

  if (content === null) {
    return null
  }

  const lastMerge = rack.merges.at(-1)
  const ghostFrom =
    move === 'merged' && lastMerge !== undefined
      ? rackPlaces(undoneRack(rack))[lastMerge.from]
      : undefined
  const pending =
    liftedPlace?.kind === 'tile' && operator !== null
      ? `${liftedPlace.value} ${OPERATOR_SIGNS[operator]}`
      : null

  return (
    <section
      aria-label={translate('makenumber.seat')}
      className='answer-form make-number-answer'
    >
      <div className='target-card'>
        <p className='target'>
          <VisuallyHidden elementType='span'>
            {translate('makenumber.target')}
          </VisuallyHidden>
          {target}
        </p>
        <ol
          aria-label={translate('makenumber.sends')}
          className='sends'
          data-empty={kept === null || undefined}
        >
          {kept !== null && (
            <li className='kept' data-good={isGood || undefined} key='kept'>
              <TrophyIcon />
              <span className='value'>{kept.value}</span>
              <span className='distance'>
                {isGood
                  ? translate('makenumber.exact')
                  : translate('makenumber.distance', {
                      distance: kept.distance
                    })}
              </span>
              <VisuallyHidden elementType='span'>
                {translate('makenumber.kept')}
              </VisuallyHidden>
            </li>
          )}
          {others.map((entry) => (
            <li className='other' key={entry.order}>
              {entry.value}
              <span className='distance'>
                {translate('makenumber.distance', {
                  distance: entry.distance
                })}
              </span>
            </li>
          ))}
        </ol>
      </div>
      <div className='work'>
        <ol
          aria-label={translate('makenumber.work')}
          className='lines'
          data-empty={(lines.length === 0 && pending === null) || undefined}
        >
          <li className='hint' key='hint'>
            {translate('makenumber.hint')}
          </li>
          {lines
            .map((line, step) => ({ line, step }))
            .map(({ line, step }) => (
              <li
                className='line'
                data-last={
                  (step === lines.length - 1 && move === 'merged') || undefined
                }
                key={step}
              >
                {line.left} {OPERATOR_SIGNS[line.operator]} {line.right} ={' '}
                <span className='result'>{line.result}</span>
              </li>
            ))}
          {pending !== null && (
            <li className='line pending' key='pending'>
              {pending}
            </li>
          )}
        </ol>
        <p className='current' data-empty={toSendValue === null || undefined}>
          <span className='value' key={toSendValue ?? 'none'}>
            {toSendValue ?? ''}
          </span>
          <span className='distance'>
            {toSendValue === null
              ? ''
              : toSendValue === target
                ? translate('makenumber.exact')
                : translate('makenumber.distance', {
                    distance: Math.abs(toSendValue - target)
                  })}
          </span>
        </p>
      </div>
      <RefusalNote
        message={
          shownRefusal === null
            ? null
            : translate(`makenumber.refusal.${shownRefusal}`)
        }
      />
      <div className='keys'>
        <Group aria-label={translate('makenumber.rack')} className='rack'>
          {RACK_PLACES.map((place) => {
            const held = places[place] ?? EMPTY_PLACE
            const isEmpty = held.kind === 'empty'
            const isLifted = lifted === place
            const isOff =
              !isEmpty &&
              !isLifted &&
              lifted !== null &&
              operator !== null &&
              !canMerge(place)
            const isFused = move === 'merged' && lastMerge?.onto === place

            return (
              <Button
                aria-pressed={isEmpty ? undefined : isLifted}
                className='number-tile'
                data-empty={isEmpty || undefined}
                data-lifted={isLifted || undefined}
                data-made={(held.kind === 'tile' && held.isMade) || undefined}
                data-off={isOff || undefined}
                isDisabled={isEmpty || isOff}
                key={place}
                onPress={(event) => {
                  releaseFocus(event)
                  pressTile(place)
                }}
                preventFocusOnPress
              >
                {held.kind === 'tile' && (
                  <span
                    className='face'
                    data-arrival={isFused ? 'fused' : 'set'}
                    key={held.source}
                    style={{ '--digits': String(held.value).length }}
                  >
                    {held.value}
                    {held.isMade && (
                      <VisuallyHidden elementType='span'>
                        {translate('makenumber.made')}
                      </VisuallyHidden>
                    )}
                  </span>
                )}
                <span aria-hidden className='made-mark' />
                {isFused &&
                  ghostFrom?.kind === 'tile' &&
                  lastMerge !== undefined && (
                    <span
                      aria-hidden
                      className='ghost'
                      data-made={ghostFrom.isMade || undefined}
                      key={rack.merges.length}
                      style={{
                        '--digits': String(ghostFrom.value).length,
                        '--from-column':
                          (lastMerge.from % RACK_COLUMNS) -
                          (lastMerge.onto % RACK_COLUMNS),
                        '--from-row':
                          Math.floor(lastMerge.from / RACK_COLUMNS) -
                          Math.floor(lastMerge.onto / RACK_COLUMNS)
                      }}
                    >
                      {ghostFrom.value}
                    </span>
                  )}
              </Button>
            )
          })}
        </Group>
        <Group
          aria-label={translate('makenumber.operators')}
          className='operators'
        >
          {calculationOperators.map((each) => {
            const Glyph = OPERATOR_GLYPHS[each]

            return (
              <Button
                aria-label={translate(`makenumber.operator.${each}`)}
                aria-pressed={operator === each}
                className='operator'
                isDisabled={lifted === null}
                key={each}
                onPress={(event) => {
                  releaseFocus(event)
                  pressOperator(each)
                }}
                preventFocusOnPress
              >
                <Glyph />
              </Button>
            )
          })}
        </Group>
      </div>
      <div className='actions'>
        <Button
          aria-label={translate('makenumber.undo')}
          className='action'
          isDisabled={rack.merges.length === 0 && lifted === null}
          onPress={(event) => {
            releaseFocus(event)
            undo()
          }}
          preventFocusOnPress
        >
          <UndoIcon />
        </Button>
        <Button
          aria-label={translate('makenumber.startOver')}
          className='action'
          isDisabled={rack.merges.length === 0}
          onPress={(event) => {
            releaseFocus(event)
            startOver()
          }}
          preventFocusOnPress
        >
          <ReplayIcon />
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
          {translate('makenumber.send')}
        </Button>
      </div>
    </section>
  )
}
