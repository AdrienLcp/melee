import type React from 'react'
import { useRef } from 'react'
import {
  DropIndicator,
  GridList,
  GridListItem,
  Button as ReactAriaButton,
  useDragAndDrop
} from 'react-aria-components'

import type { TimelineEvent, TimelineEventId } from '@melee/protocol/timeline'

import { useI18n } from '@/presentation/i18n/i18n-provider'

import { Button } from './button'
import { ChevronIcon, ChevronUpIcon, GripIcon } from './icons'
import { TimelineCard } from './timeline-card'
import { useTouchReorder } from './use-touch-reorder'

import './timeline-order-list.sass'

type TimelineOrderListProps = {
  /** Read out as the list's name. */
  'aria-label': string
  /** The round's events in the order this screen holds them, earliest at the top. */
  events: readonly TimelineEvent[]
  /** Called with every id, earliest first, after a drop or an arrow. */
  onReorder: (eventIds: TimelineEventId[]) => void
}

const moved = ({
  at,
  ids,
  order
}: {
  at: number
  ids: readonly TimelineEventId[]
  order: readonly TimelineEventId[]
}): TimelineEventId[] => {
  const rest = order.filter((id) => !ids.includes(id))

  return rest.toSpliced(at, 0, ...ids)
}

/**
 * The events as cards to put in order: dragged by their grip — by a mouse,
 * a finger, or the keyboard through react-aria's drag button — or stepped one
 * place at a time by the two arrows on each card, which is the press a hand
 * that has never dragged anything on a screen finds first.
 */
export const TimelineOrderList: React.FC<TimelineOrderListProps> = ({
  'aria-label': ariaLabel,
  events,
  onReorder
}) => {
  const { locale, translate } = useI18n()
  const order = events.map((event) => event.id)
  const list = useRef<HTMLDivElement>(null)

  useTouchReorder({
    grip: '.grip',
    list,
    onMove: (id, at) => onReorder(moved({ at, ids: [id], order }))
  })

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) =>
      [...keys].map((key) => ({
        'text/plain':
          events.find((event) => event.id === key)?.labels[locale] ?? ''
      })),
    onReorder: ({ keys, target }) => {
      const ids = [...keys].map(String)
      const rest = order.filter((id) => !ids.includes(id))
      const targetAt = rest.indexOf(String(target.key))

      onReorder(
        moved({
          at: target.dropPosition === 'after' ? targetAt + 1 : targetAt,
          ids,
          order
        })
      )
    },
    renderDropIndicator: (target) => (
      <DropIndicator className='drop-line' target={target} />
    )
  })

  const step = (id: TimelineEventId, by: -1 | 1): void => {
    onReorder(moved({ at: order.indexOf(id) + by, ids: [id], order }))
  }

  return (
    <GridList
      aria-label={ariaLabel}
      className='timeline-order-list'
      dragAndDropHooks={dragAndDropHooks}
      items={events}
      ref={list}
    >
      {(event) => {
        const at = order.indexOf(event.id)
        const label = event.labels[locale]

        return (
          <GridListItem className='order-row' textValue={label}>
            <ReactAriaButton
              aria-label={translate('timeline.answer.drag', { event: label })}
              className='grip'
              slot='drag'
            >
              <GripIcon />
            </ReactAriaButton>
            <TimelineCard event={event} year={null} />
            <span className='steps'>
              <Button
                aria-label={translate('timeline.answer.moveUp', {
                  event: label
                })}
                isDisabled={at === 0}
                onPress={() => step(event.id, -1)}
                size='small'
                variant='outlined'
              >
                <ChevronUpIcon />
              </Button>
              <Button
                aria-label={translate('timeline.answer.moveDown', {
                  event: label
                })}
                isDisabled={at === order.length - 1}
                onPress={() => step(event.id, 1)}
                size='small'
                variant='outlined'
              >
                <ChevronIcon />
              </Button>
            </span>
          </GridListItem>
        )
      }}
    </GridList>
  )
}
