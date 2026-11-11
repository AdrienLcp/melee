import { fadeOffAStillCopy } from '@/presentation/still-copy'

/**
 * Fades off a still copy of every stage the console shows — the round, or the
 * pause card standing in its place — over the one the next snapshot draws.
 */
export const fadeOffTheStage = (): void => {
  for (const stage of document.querySelectorAll(
    '.host-console-page > .stage'
  )) {
    if (stage instanceof HTMLElement && stage.getClientRects().length > 0) {
      fadeOffAStillCopy({
        className: 'stage-leaving-copy',
        element: stage,
        isFramed: true
      })
    }
  }
}
