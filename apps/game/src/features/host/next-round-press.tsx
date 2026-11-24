import type React from 'react'
import { useRef, useState } from 'react'

import type { GameKind } from '@melee/protocol/game'

import { Button } from '@/presentation/components/button'
import { GameIcon } from '@/presentation/components/icons'
import { useLastShown } from '@/presentation/components/use-last-shown'
import { useSizeGlideOnSwap } from '@/presentation/components/use-size-glide-on-swap'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './next-round-press.sass'

/** The entry the next round opens, as the press prints it under its label. */
export type NextRoundAnnouncement = {
  game: GameKind
  name: string
}

const isSameAnnouncement = (
  left: NextRoundAnnouncement,
  right: NextRoundAnnouncement
): boolean => left.game === right.game && left.name === right.name

type AnnouncedFace = {
  isOpen: boolean
  shown: NextRoundAnnouncement | null
  /** The name rolled in over another while the line was open, rather than arriving with it. */
  rolledIn: boolean
}

type NextRoundPressProps = {
  /** The entry the press opens, `null` when there is nothing to name: one game all evening, or the draw not dealt yet. */
  announced: NextRoundAnnouncement | null
  /** The id the announced entry answers to, which this press and the duel press beside it are described by. */
  announcementId: string
  isDisabled: boolean
  onPress: () => void
}

/**
 * The reveal's _next round_: one coral piece, its label on top and, on a
 * smaller line under it in the press's own ink, the glyph and name of the
 * entry it opens — so the host reads which game comes next on the press they
 * are about to hit, and the press opens nothing of its own.
 *
 * The line unfolds when a name arrives and folds away when it goes, keeping
 * the last name while it closes; a change of entry rolls the name up and the
 * next one in from below, and the press eases to its new width.
 */
export const NextRoundPress: React.FC<NextRoundPressProps> = ({
  announced,
  announcementId,
  isDisabled,
  onPress
}) => {
  const translate = useTranslate()
  const press = useRef<HTMLButtonElement>(null)
  const shown = useLastShown(announced, isSameAnnouncement)
  const isOpen = announced !== null

  const [face, setFace] = useState<AnnouncedFace>({
    isOpen,
    rolledIn: false,
    shown
  })
  const [leaving, setLeaving] = useState<NextRoundAnnouncement | null>(null)
  const isRenamed =
    face.shown !== shown &&
    (face.shown === null ||
      shown === null ||
      !isSameAnnouncement(face.shown, shown))

  if (face.isOpen !== isOpen || isRenamed) {
    const rolls = face.isOpen && isOpen && isRenamed
    setLeaving(rolls ? face.shown : null)
    setFace({ isOpen, rolledIn: rolls, shown })
  }

  useSizeGlideOnSwap({
    box: press,
    swap: announced === null ? '' : `${announced.game} ${announced.name}`
  })

  return (
    <Button
      aria-describedby={isOpen ? announcementId : undefined}
      className='next-round-press'
      isDisabled={isDisabled}
      onPress={onPress}
      ref={press}
      size='large'
    >
      <span className='control-label'>{translate('host.nextRound')}</span>
      <span aria-hidden className='announced' data-open={isOpen || undefined}>
        <span className='faces'>
          {shown !== null && (
            <span
              className='face'
              data-rolled-in={face.rolledIn || undefined}
              id={announcementId}
              key={`${shown.game} ${shown.name}`}
            >
              <GameIcon game={shown.game} />
              {shown.name}
            </span>
          )}
          {leaving !== null && (
            <span
              className='face'
              data-leaving
              onAnimationEnd={(event) => {
                if (event.target === event.currentTarget) {
                  setLeaving(null)
                }
              }}
            >
              <GameIcon game={leaving.game} />
              {leaving.name}
            </span>
          )}
        </span>
      </span>
    </Button>
  )
}
