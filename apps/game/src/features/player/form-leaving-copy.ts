import { fadeOffAStillCopy } from '@/presentation/still-copy'

/**
 * Lays a still copy of the answer form around `from` over it and fades the
 * copy off, from the press that sends the answer: the form leaves on the copy
 * while what was sent comes in under it. Called before the commit, so the copy
 * is what was drawn. The round's clock is outside the form, so the copy never
 * freezes it.
 */
export const fadeOffACopyOfTheForm = (from: Element): void => {
  const form = from.closest('.answer-form')

  if (form instanceof HTMLElement) {
    fadeOffAStillCopy({ className: 'form-leaving-copy', element: form })
  }
}
