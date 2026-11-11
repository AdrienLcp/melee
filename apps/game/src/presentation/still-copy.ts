const TRANSPARENT = 'rgba(0, 0, 0, 0)'

const DEFAULT_EASE_IN = 'cubic-bezier(0.7, 0, 0.84, 0)'

const SCROLL_ATTRIBUTE = 'data-still-scroll'

const FRAME_ATTRIBUTE = 'data-still-frame'

const NOT_A_PROPERTY = new Set([
  'composite',
  'computedOffset',
  'easing',
  'offset'
])

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
 * Writes where each scroller inside `element` stands on the scroller itself,
 * since a clone starts every one of them at the top.
 */
const markScrolled = (element: HTMLElement): HTMLElement[] => {
  const scrolled = [element, ...element.querySelectorAll('*')].filter(
    (each): each is HTMLElement =>
      each instanceof HTMLElement &&
      (each.scrollTop !== 0 || each.scrollLeft !== 0)
  )

  for (const each of scrolled) {
    each.setAttribute(SCROLL_ATTRIBUTE, `${each.scrollTop} ${each.scrollLeft}`)
  }

  return scrolled
}

const scrolledBack = (copy: HTMLElement): void => {
  for (const each of [
    copy,
    ...copy.querySelectorAll(`[${SCROLL_ATTRIBUTE}]`)
  ]) {
    const [top, left] = (each.getAttribute(SCROLL_ATTRIBUTE) ?? '')
      .split(' ')
      .map(Number)

    if (
      each instanceof HTMLElement &&
      top !== undefined &&
      left !== undefined
    ) {
      each.scrollTop = top
      each.scrollLeft = left
      each.removeAttribute(SCROLL_ATTRIBUTE)
    }
  }
}

const cssNameOf = (property: string): string =>
  property.startsWith('--')
    ? property
    : property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)

/**
 * Writes on each element an animation or a transition is moving inside
 * `element` the values it stands at, since a clone draws every one at rest:
 * the countdown's numeral, half faded off, came back whole in the copy. The
 * root is left out, its box being where the copy is laid.
 */
const markMoving = (element: HTMLElement): Element[] => {
  const moving = new Map<Element, Set<string>>()

  for (const animation of element.getAnimations({ subtree: true })) {
    const { effect } = animation

    if (
      effect instanceof KeyframeEffect &&
      effect.target !== null &&
      effect.target !== element &&
      effect.pseudoElement === null
    ) {
      const properties = moving.get(effect.target) ?? new Set<string>()

      for (const keyframe of effect.getKeyframes()) {
        for (const property of Object.keys(keyframe)) {
          if (!NOT_A_PROPERTY.has(property)) {
            properties.add(cssNameOf(property))
          }
        }
      }

      moving.set(effect.target, properties)
    }
  }

  for (const [target, properties] of moving) {
    const style = getComputedStyle(target)

    target.setAttribute(
      FRAME_ATTRIBUTE,
      [...properties]
        .map((property) => `${property}: ${style.getPropertyValue(property)}`)
        .join('; ')
    )
  }

  return [...moving.keys()]
}

const heldWhereTheyStood = (copy: HTMLElement): void => {
  for (const each of copy.querySelectorAll(`[${FRAME_ATTRIBUTE}]`)) {
    if (each instanceof HTMLElement || each instanceof SVGElement) {
      each.style.cssText = `${each.style.cssText} ${each.getAttribute(FRAME_ATTRIBUTE) ?? ''};`
      each.removeAttribute(FRAME_ATTRIBUTE)
    }
  }
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
  const scrolled = markScrolled(element)
  const moving = markMoving(element)
  const clone = stillCopyOf({ className, element })

  for (const each of scrolled) {
    each.removeAttribute(SCROLL_ATTRIBUTE)
  }

  for (const each of moving) {
    each.removeAttribute(FRAME_ATTRIBUTE)
  }

  heldWhereTheyStood(clone)
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
  scrolledBack(copy)
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
