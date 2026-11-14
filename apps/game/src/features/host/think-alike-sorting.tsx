import type React from 'react'
import { useLayoutEffect, useRef } from 'react'
import {
  Button as AriaButton,
  GridList,
  GridListItem,
  useDragAndDrop
} from 'react-aria-components'

import type { PlayerId } from '@melee/protocol/identifiers'
import type { PublicPlayer, RoundView } from '@melee/protocol/room'
import type { ThinkAlikeGroup } from '@melee/protocol/think-alike'

import { thinkAlikeContent } from '@/helpers/round-content'
import { shownPoints } from '@/helpers/shown-points'
import {
  ActionMenu,
  ActionMenuItem
} from '@/presentation/components/action-menu'
import { Button } from '@/presentation/components/button'
import { GripIcon, MergeIcon } from '@/presentation/components/icons'
import { Pawn } from '@/presentation/components/pawn'
import { useChangedSinceFirstDraw } from '@/presentation/components/use-changed-since-first-draw'
import { useLeavingRows } from '@/presentation/components/use-leaving-rows'
import { useRowsTravel } from '@/presentation/components/use-rows-travel'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './think-alike-sorting.sass'

/** What the console asks of the round's groups; the round's id is the caller's to add. */
export type ThinkAlikeRegroup =
  | { from: string; into: string; type: 'host.mergeGroups' }
  | { key: string; type: 'host.splitGroup' }

type ThinkAlikeSortingProps = {
  /** Sends a merge or a split; the server pays the round again and every screen regroups. */
  onRegroup: (regroup: ThinkAlikeRegroup) => void
  players: readonly PublicPlayer[]
  round: RoundView
}

const ROW_EXIT_ANIMATION = 'row-closes'

const signatureOf = (groups: readonly ThinkAlikeGroup[]): string =>
  groups.map(({ authors, key }) => `${key}:${authors.length}`).join(' ')

const rowOf = ({
  key,
  list
}: {
  key: string
  list: HTMLElement
}): HTMLElement | undefined =>
  [...list.children].find(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && child.dataset.key === key
  )

/** A seat's pawn and name, under an answer or a folded card. */
const Authors: React.FC<{
  authorIds: readonly PlayerId[]
  players: readonly PublicPlayer[]
}> = ({ authorIds, players }) => (
  <ul className='authors'>
    {authorIds.map((id) => {
      const seat = players.findIndex((player) => player.id === id)

      return seat === -1 ? null : (
        <li key={id}>
          <Pawn seat={seat} />
          <span className='name'>{players[seat]?.nickname}</span>
        </li>
      )
    })}
  </ul>
)

/**
 * The answers merged into one, each a card folded under it with its own
 * spelling, its own authors and the press that takes it back out.
 */
const FoldedCards: React.FC<{
  merged: ThinkAlikeGroup['merged']
  onTakeOut: (key: string) => void
  players: readonly PublicPlayer[]
}> = ({ merged, onTakeOut, players }) => {
  const translate = useTranslate()
  const { endExitOf, rows } = useLeavingRows({
    exitAnimation: ROW_EXIT_ANIMATION,
    rows: merged.map((card) => ({ ...card, id: card.key }))
  })

  return (
    <ul className='folded'>
      {rows.map((card) => (
        <li
          className='folded-card'
          data-arriving={card.isArriving || undefined}
          data-leaving={card.isLeaving || undefined}
          key={card.key}
          onAnimationEnd={card.isLeaving ? endExitOf(card.key) : undefined}
        >
          <span className='word'>{card.text}</span>
          <Authors authorIds={card.authors} players={players} />
          <Button
            className='take-out'
            isDisabled={card.isLeaving}
            onPress={() => onTakeOut(card.key)}
            variant='outlined'
          >
            {translate('thinkalike.sort.takeOut', { answer: card.text })}
          </Button>
        </li>
      ))}
    </ul>
  )
}

/**
 * The console's reveal: one row per answer the room wrote, the biggest crowd
 * first, so the host can put _fridge_ in with _refrigerator_ when the table
 * says so — by dragging one row onto another, or from the row's menu, which
 * lists every other answer — and take it back out from the card it folds
 * into. Every press re-pays the round on every screen.
 */
export const ThinkAlikeSorting: React.FC<ThinkAlikeSortingProps> = ({
  onRegroup,
  players,
  round
}) => {
  const translate = useTranslate()
  const list = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const focusOnceRegrouped = useRef<string | null>(null)
  const groups = (thinkAlikeContent(round)?.groups ?? []).toReversed()
  const signature = signatureOf(groups)
  const isRegrouped = useChangedSinceFirstDraw(signature)
  const { endExitOf, rows } = useLeavingRows({
    exitAnimation: ROW_EXIT_ANIMATION,
    rows: groups.map((group) => ({ ...group, id: group.key }))
  })
  const standing = rows.filter((row) => !row.isLeaving)
  const remember = useRowsTravel({
    list,
    order: rows.map((row) => row.key).join(' '),
    pace: 'reorder'
  })
  const payOf = (group: ThinkAlikeGroup): number =>
    round.awards.find((award) => group.authors.includes(award.playerId))
      ?.points ?? 0

  // The press that asked leaves with its row or its card, and focus left on
  // it would fall to the page: it goes to a row already in view, without
  // scrolling the list to it.
  useLayoutEffect(() => {
    const key = focusOnceRegrouped.current
    const element = list.current

    if (signature === '' || key === null || element === null) {
      return
    }

    focusOnceRegrouped.current = null
    rowOf({ key, list: element })?.focus({ preventScroll: true })
  }, [signature])

  const regroup = ({
    asked,
    focusing = null
  }: {
    asked: ThinkAlikeRegroup
    /** The row focus goes to once the round is regrouped, when a press of the leaving piece asked. */
    focusing?: string | null
  }) => {
    remember()
    focusOnceRegrouped.current = focusing
    onRegroup(asked)
  }

  // The row the answer went into, when the list shows it; else the row
  // beside the one leaving, which stands where the press was. A row focused
  // from the keyboard is scrolled to by react-aria, at once.
  const focusedAfterMerging = ({
    from,
    into
  }: {
    from: string
    into: string
  }): string | null => {
    const element = list.current
    const box = scroller.current?.getBoundingClientRect()
    const shown =
      element === null ? undefined : rowOf({ key: into, list: element })

    if (box !== undefined && shown !== undefined) {
      const { bottom, top } = shown.getBoundingClientRect()

      if (top >= box.top && bottom <= box.bottom) {
        return into
      }
    }

    const at = standing.findIndex((row) => row.key === from)

    return (standing[at + 1] ?? standing[at - 1])?.key ?? null
  }

  const merge = ({
    from,
    into,
    isPressedOnTheRow = false
  }: {
    from: string
    into: string
    isPressedOnTheRow?: boolean
  }) => {
    const isStanding = (key: string) => standing.some((row) => row.key === key)

    if (from !== into && isStanding(from) && isStanding(into)) {
      regroup({
        asked: { from, into, type: 'host.mergeGroups' },
        focusing: isPressedOnTheRow ? focusedAfterMerging({ from, into }) : null
      })
    }
  }

  const { dragAndDropHooks } = useDragAndDrop({
    getDropOperation: (target) =>
      target.type === 'item' && target.dropPosition === 'on'
        ? 'move'
        : 'cancel',
    getItems: (keys) => [...keys].map((key) => ({ 'text/plain': String(key) })),
    onItemDrop: async ({ items, target }) => {
      const [item] = items

      if (item?.kind === 'text') {
        merge({
          from: await item.getText('text/plain'),
          into: String(target.key)
        })
      }
    }
  })

  return (
    <section
      className='think-alike-sorting'
      data-regrouped={isRegrouped || undefined}
    >
      {standing.length > 1 && (
        <p className='hint'>{translate('thinkalike.sort.hint')}</p>
      )}
      <div className='scroller' ref={scroller}>
        <GridList
          aria-label={translate('thinkalike.sort.label')}
          className='rows'
          disabledKeys={rows
            .filter((row) => row.isLeaving)
            .map((row) => row.key)}
          dragAndDropHooks={dragAndDropHooks}
          items={rows}
          ref={list}
        >
          {(row) => {
            const points = payOf(row)
            const others = standing.filter((other) => other.key !== row.key)

            return (
              <GridListItem
                className='row'
                data-arriving={row.isArriving || undefined}
                data-changed={row.isChanged || undefined}
                data-crowd={row.authors.length > 1 || undefined}
                data-leaving={row.isLeaving || undefined}
                id={row.key}
                onAnimationEnd={row.isLeaving ? endExitOf(row.key) : undefined}
                style={{ '--from-last': rows.length - 1 - rows.indexOf(row) }}
                textValue={row.text}
              >
                <AriaButton
                  aria-label={translate('thinkalike.sort.drag', {
                    answer: row.text
                  })}
                  className='grip'
                  slot='drag'
                >
                  <GripIcon />
                </AriaButton>
                <span className='count' key={row.authors.length}>
                  {row.authors.length}
                </span>
                <span className='word'>{row.text}</span>
                <span
                  className='pay'
                  data-paid={points > 0 || undefined}
                  key={points}
                >
                  {points > 0
                    ? translate('round.scored', { points: shownPoints(points) })
                    : 0}
                </span>
                <ActionMenu
                  aria-label={translate('thinkalike.sort.mergeWith', {
                    answer: row.text
                  })}
                  isDisabled={others.length === 0 || row.isLeaving}
                  onAction={(into) =>
                    merge({
                      from: row.key,
                      into: String(into),
                      isPressedOnTheRow: true
                    })
                  }
                >
                  {others.map((other) => (
                    <ActionMenuItem
                      icon={<MergeIcon />}
                      id={other.key}
                      key={other.key}
                    >
                      {translate('thinkalike.sort.into', {
                        answer: other.text
                      })}
                    </ActionMenuItem>
                  ))}
                </ActionMenu>
                <Authors
                  authorIds={row.authors.filter(
                    (id) =>
                      !row.merged.some((card) => card.authors.includes(id))
                  )}
                  players={players}
                />
                <FoldedCards
                  merged={row.merged}
                  onTakeOut={(key) =>
                    regroup({
                      asked: { key, type: 'host.splitGroup' },
                      focusing: row.key
                    })
                  }
                  players={players}
                />
              </GridListItem>
            )
          }}
        </GridList>
      </div>
    </section>
  )
}
