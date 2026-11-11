const TRANSPARENT = 'rgba(0, 0, 0, 0)'

const DEFAULT_EASE_IN = 'cubic-bezier(0.7, 0, 0.84, 0)'

/** The first painted ground behind `element`, which a copy is laid on so what is drawn under it does not show through. */
export const groundBehind = (element: Element): string => {
  for (
    let current: Element | null = element;
    current !== null;
    current = current.parentElement
  ) {
    const { backgroundColor } = getComputedStyle(current)

    if (backgroundColor !== TRANSPARENT && backgroundColor !== 'transparent') {
      return backgroundColor
    }
  }

  return 'transparent'
}

/** A CSS `<time>` read off a custom property, in milliseconds, and 0 when it is none. */
export const millisecondsOf = (value: string): number => {
  const amount = Number.parseFloat(value)

  if (Number.isNaN(amount)) {
    return 0
  }

  return value.trim().endsWith('ms') ? amount : amount * 1000
}

/** The `--ease-in` an element inherits, on which every still copy leaves. */
export const easeInOf = (style: CSSStyleDeclaration): string =>
  style.getPropertyValue('--ease-in').trim() || DEFAULT_EASE_IN

/**
 * A clone of `element` nobody can reach: no ids, out of the accessibility
 * tree and inert, without the copies of the same class it may still hold.
 */
export const stillCopyOf = ({
  className,
  element
}: {
  className: string
  element: HTMLElement
}): HTMLElement => {
  const copy = element.cloneNode(true)

  if (!(copy instanceof HTMLElement)) {
    return document.createElement('div')
  }

  for (const stale of copy.querySelectorAll(`.${className}`)) {
    stale.remove()
  }

  for (const withId of copy.querySelectorAll('[id]')) {
    withId.removeAttribute('id')
  }

  copy.removeAttribute('id')
  copy.classList.add(className)
  copy.setAttribute('aria-hidden', 'true')
  copy.inert = true

  return copy
}

const framed = ({
  className,
  clone
}: {
  className: string
  clone: HTMLElement
}): HTMLElement => {
  const frame = document.createElement('div')

  frame.classList.add(className)
  frame.setAttribute('aria-hidden', 'true')
  frame.inert = true
  frame.style.display = 'flex'
  frame.style.flexDirection = 'column'
  frame.append(clone)

  return frame
}

/**
 * Places the fixed copy on the box, whatever ancestor a containment made the
 * box it is fixed against.
 */
const laidOver = ({ box, copy }: { box: DOMRect; copy: HTMLElement }): void => {
  copy.style.left = '0px'
  copy.style.top = '0px'

  const origin = copy.getBoundingClientRect()

  copy.style.left = `${box.left - origin.left}px`
  copy.style.top = `${box.top - origin.top}px`
}

/**
 * Lays a still copy of `element` over its own box, out of the flow, and fades
 * it off on `--transition-base`: called before the commit that replaces it,
 * the copy is what was drawn and what comes in is drawn under it. The copy
 * takes no press, so nothing under it waits; and a clone keeps no running
 * animation, so it never holds a clock. Its class says what stops the
 * entrances it holds from playing again — `animation: none` on every
 * descendant.
 */
export const fadeOffAStillCopy = ({
  className,
  element,
  isFramed = false
}: {
  className: string
  element: HTMLElement
  /**
   * The copy stands in a frame of its own rather than beside `element`, for
   * an element whose parent is styled by what it holds
   * (`:has(> .stage.playing)`): a copy beside it would restyle the page
   * around what comes in. Defaults to `false`.
   */
  isFramed?: boolean
}): void => {
  const holder = element.parentElement
  const style = getComputedStyle(element)
  const duration = millisecondsOf(style.getPropertyValue('--transition-base'))

  if (holder === null || duration === 0) {
    return
  }

  const box = element.getBoundingClientRect()
  const clone = stillCopyOf({ className, element })
  const copy = isFramed ? framed({ className, clone }) : clone

  copy.style.background = groundBehind(holder)
  copy.style.animation = 'none'
  copy.style.margin = '0px'
  copy.style.pointerEvents = 'none'
  copy.style.position = 'fixed'
  copy.style.zIndex = '1'
  copy.style.height = `${box.height}px`
  copy.style.width = `${box.width}px`

  holder.append(copy)
  laidOver({ box, copy })
  copy
    .animate([{ opacity: 1 }, { opacity: 0 }], {
      duration,
      easing: easeInOf(style)
    })
    .finished.then(
      () => {
        copy.remove()
      },
      () => {
        copy.remove()
      }
    )
}
