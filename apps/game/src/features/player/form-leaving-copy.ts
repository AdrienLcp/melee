const COPY_CLASS = 'form-leaving-copy'

const TRANSPARENT = 'rgba(0, 0, 0, 0)'

const groundBehind = (element: Element): string => {
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

const millisecondsOf = (value: string): number => {
  const amount = Number.parseFloat(value)

  if (Number.isNaN(amount)) {
    return 0
  }

  return value.trim().endsWith('ms') ? amount : amount * 1000
}

/**
 * Places the fixed copy on the round's box, whatever ancestor a containment
 * made the box it is fixed against.
 */
const laidOver = ({ box, copy }: { box: DOMRect; copy: HTMLElement }): void => {
  copy.style.left = '0px'
  copy.style.top = '0px'

  const origin = copy.getBoundingClientRect()

  copy.style.left = `${box.left - origin.left}px`
  copy.style.top = `${box.top - origin.top}px`
}

/**
 * Lays a still copy of the answer form around `from` over it and fades the
 * copy off, from the press that sends the answer: the form leaves on the copy
 * while what was sent comes in under it. Called before the commit, so the copy
 * is what was drawn. Nothing under the copy waits on it, so no press is held,
 * and the round's clock is outside the form, so the copy never freezes it.
 */
export const fadeOffACopyOfTheForm = (from: Element): void => {
  const form = from.closest('.answer-form')
  const holder = form?.parentElement

  if (!(form instanceof HTMLElement) || holder == null) {
    return
  }

  const style = getComputedStyle(form)
  const duration = millisecondsOf(style.getPropertyValue('--transition-base'))

  if (duration === 0) {
    return
  }

  const box = form.getBoundingClientRect()
  const copy = form.cloneNode(true)

  if (!(copy instanceof HTMLElement)) {
    return
  }

  for (const withId of copy.querySelectorAll('[id]')) {
    withId.removeAttribute('id')
  }

  copy.removeAttribute('id')
  copy.classList.add(COPY_CLASS)
  copy.setAttribute('aria-hidden', 'true')
  copy.inert = true
  copy.style.background = groundBehind(holder)
  copy.style.animation = 'none'
  copy.style.margin = '0px'
  copy.style.pointerEvents = 'none'
  copy.style.position = 'fixed'
  copy.style.zIndex = '1'
  copy.style.height = `${box.height}px`
  copy.style.width = `${box.width}px`

  const easeIn =
    style.getPropertyValue('--ease-in').trim() ||
    'cubic-bezier(0.7, 0, 0.84, 0)'

  holder.append(copy)
  laidOver({ box, copy })
  copy
    .animate([{ opacity: 1 }, { opacity: 0 }], { duration, easing: easeIn })
    .finished.then(
      () => {
        copy.remove()
      },
      () => {
        copy.remove()
      }
    )
}
