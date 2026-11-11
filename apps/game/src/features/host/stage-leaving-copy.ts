import type { HostRoomView } from '@melee/protocol/room'

import { fadeOffAStillCopy } from '@/presentation/still-copy'

import { seatedChoosingRound } from './seated-choosing-round'

const COPY_CLASS = 'stage-leaving-copy'

const isDrawn = (element: Element): element is HTMLElement =>
  element instanceof HTMLElement && element.getClientRects().length > 0

const takesOrGivesBackTheScreen = ({
  from,
  to
}: {
  from: HostRoomView | null
  to: HostRoomView
}): boolean =>
  from !== null &&
  (seatedChoosingRound(from) === null) !== (seatedChoosingRound(to) === null)

/**
 * Fades off a still copy of what the console draws over what the next
 * snapshot brings: the stage — the round, or the pause card standing in its
 * place — and the presses under it. Where the seated host's tiles take the
 * screen or give it back, the page itself is another tree, which would take a
 * copy laid inside it along on its first frame: the copy is of the whole page
 * then, laid beside it in the shell.
 */
export const fadeOffTheStage = (change: {
  from: HostRoomView | null
  to: HostRoomView
}): void => {
  if (takesOrGivesBackTheScreen(change)) {
    const page = document
      .querySelector('.host-console-page')
      ?.closest('.app-shell > *')

    if (page !== null && page !== undefined && isDrawn(page)) {
      fadeOffAStillCopy({
        className: COPY_CLASS,
        element: page,
        isFramed: true
      })
    }

    return
  }

  for (const piece of document.querySelectorAll(
    '.host-console-page > :is(.stage, footer)'
  )) {
    if (isDrawn(piece)) {
      fadeOffAStillCopy({
        className: COPY_CLASS,
        element: piece,
        isFramed: piece.classList.contains('stage')
      })
    }
  }
}
