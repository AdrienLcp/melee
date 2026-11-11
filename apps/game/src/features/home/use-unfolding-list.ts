import {
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'

/**
 * Where a list that shows only its head stands: `folding` while the items it
 * is about to hide play their way out, before the list closes over them.
 */
export type Fold = 'folded' | 'folding' | 'unfolded'

/** The keyframe the items a list is folding play out on; the fold lands once each has ended. */
const LEAVING_ANIMATION = 'ticket-leaves'

const millisecondsOf = (value: string): number => {
  const amount = Number.parseFloat(value)

  if (Number.isNaN(amount)) {
    return 0
  }

  return value.trim().endsWith('ms') ? amount : amount * 1000
}

const easeHeight = ({
  from,
  list
}: {
  from: number
  list: HTMLElement
}): void => {
  const style = getComputedStyle(list)
  const duration = millisecondsOf(style.getPropertyValue('--transition-base'))
  const to = list.getBoundingClientRect().height

  if (duration === 0 || Math.abs(to - from) < 1) {
    return
  }

  const isOpening = to > from

  list.animate(
    [
      { height: `${from}px`, overflow: 'clip' },
      { height: `${to}px`, overflow: 'clip' }
    ],
    {
      duration,
      easing: style
        .getPropertyValue(isOpening ? '--ease-out' : '--ease-in')
        .trim()
    }
  )
}

const leavingOf = (list: HTMLElement): readonly Animation[] =>
  list
    .getAnimations({ subtree: true })
    .filter(
      (animation) =>
        animation instanceof CSSAnimation &&
        animation.animationName === LEAVING_ANIMATION
    )

/**
 * A list that shows its head and unfolds the rest in place: the list eases to
 * its new height while the items it reveals arrive one after the other, and
 * folding plays the same the other way — the items leave, last first, then
 * the list closes over them. The list marks the items it hides with
 * `[data-unfolds]` and reads `data-fold`; the focus goes to the first item
 * revealed, and back to the press when the list folds over it. Under reduced
 * motion the tokens are nought and the list simply lands. `hasUnfolded` tells
 * a fold that landed from the folded row the page opened on, whose press
 * arrives with the page rather than with the list closing.
 */
export const useUnfoldingList = ({
  list,
  press
}: {
  /** The list, whose height eases and whose hidden items carry `[data-unfolds]`. */
  list: RefObject<HTMLElement | null>
  /** The press that folds and unfolds it. */
  press: RefObject<HTMLButtonElement | null>
}) => {
  const [fold, setFold] = useState<Fold>('folded')
  const [hasUnfolded, setHasUnfolded] = useState(false)
  const heightBefore = useRef<number | null>(null)

  useLayoutEffect(() => {
    const element = list.current
    const from = heightBefore.current

    if (element === null || from === null) {
      return
    }

    heightBefore.current = null
    easeHeight({ from, list: element })

    if (fold === 'unfolded') {
      element
        .querySelector<HTMLElement>('[data-unfolds] .open:not([disabled])')
        ?.focus()
    } else if (element.contains(document.activeElement)) {
      press.current?.focus()
    }
  }, [fold, list, press])

  useEffect(() => {
    const element = list.current

    if (fold !== 'folding' || element === null) {
      return
    }

    let isFolding = true

    void Promise.allSettled(
      leavingOf(element).map((animation) => animation.finished)
    ).then(() => {
      if (isFolding) {
        heightBefore.current = element.getBoundingClientRect().height
        setFold('folded')
      }
    })

    return () => {
      isFolding = false
    }
  }, [fold, list])

  const toggle = () => {
    switch (fold) {
      case 'folded':
        heightBefore.current =
          list.current?.getBoundingClientRect().height ?? null
        setFold('unfolded')
        setHasUnfolded(true)
        return
      case 'unfolded':
        setFold('folding')
        return
      case 'folding':
        return
      default:
        fold satisfies never
    }
  }

  return { fold, hasUnfolded, toggle }
}
