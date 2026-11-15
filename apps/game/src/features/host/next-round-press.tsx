import type React from 'react'
import { useRef, useState } from 'react'

import type { GameKind } from '@melee/protocol/game'

import { Button } from '@/presentation/components/button'
import { GameIcon } from '@/presentation/components/icons'
import { useLastShown } from '@/presentation/components/use-last-shown'
import { useSizeGlideOnSwap } from '@/presentation/components/use-size-glide-on-swap'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './next-round-press.sass'

/** The entry the next round opens, as the press's spine prints it. */
export type NextRoundAnnouncement = {
  game: GameKind
  name: string
}

const isSameAnnouncement = (
  left: NextRoundAnnouncement,
  right: NextRoundAnnouncement
): boolean => left.game === right.game && left.name === right.name

type SpineFace = {
  isOpen: boolean
  /** How many times the spine has opened, which draws it afresh each time. */
  openings: number
  shown: NextRoundAnnouncement | null
  /** The name rolled in over another while the spine was open, rather than arriving with it. */
  rolledIn: boolean
}

type NextRoundPressProps = {
  /** The entry the press opens, `null` when there is nothing to name: one game all evening, or the draw not dealt yet. */
  announced: NextRoundAnnouncement | null
  isDisabled: boolean
  onPress: () => void
  /** The id the spine's name answers to, which this press and the duel press beside it are described by. */
  spineId: string
}

/**
 * The reveal's _next round_, carrying at its start the spine of the game it
 * opens — the game's box colour, its glyph and its name — so the host reads
 * which box comes off the shelf before reading the label. The spine is part of
 * the piece, lifted and pressed with it, and opens nothing of its own.
 *
 * The spine slides out from the cut when a name arrives and back in when it
 * goes, repaints and rolls its name when the next game changes, and the press
 * eases to its new size either way.
 */
export const NextRoundPress: React.FC<NextRoundPressProps> = ({
  announced,
  isDisabled,
  onPress,
  spineId
}) => {
  const translate = useTranslate()
  const press = useRef<HTMLButtonElement>(null)
  const spine = useLastShown(announced, isSameAnnouncement)
  const isOpen = announced !== null

  const [face, setFace] = useState<SpineFace>({
    isOpen,
    openings: 0,
    rolledIn: false,
    shown: spine
  })
  const [leaving, setLeaving] = useState<NextRoundAnnouncement | null>(null)
  const isRenamed =
    face.shown !== spine &&
    (face.shown === null ||
      spine === null ||
      !isSameAnnouncement(face.shown, spine))

  if (face.isOpen !== isOpen || isRenamed) {
    const rolls = face.isOpen && isOpen && isRenamed
    setLeaving(rolls ? face.shown : null)
    setFace({
      isOpen,
      openings: face.openings + (isOpen && !face.isOpen ? 1 : 0),
      rolledIn: rolls,
      shown: spine
    })
  }

  useSizeGlideOnSwap({
    box: press,
    swap: announced === null ? '' : `${announced.game} ${announced.name}`
  })

  return (
    <Button
      aria-describedby={isOpen ? spineId : undefined}
      className='next-round-press'
      isDisabled={isDisabled}
      onPress={onPress}
      ref={press}
      size='large'
    >
      <span
        aria-hidden
        className='spine'
        data-open={isOpen || undefined}
        key={face.openings}
        style={
          spine === null
            ? undefined
            : {
                '--spine': `var(--spine-${spine.game})`,
                '--spine-edge': `var(--spine-edge-${spine.game})`,
                '--spine-ink': `var(--on-spine-${spine.game})`
              }
        }
      >
        {spine !== null && (
          <span
            className='face'
            data-rolled-in={face.rolledIn || undefined}
            id={spineId}
            key={`${spine.game} ${spine.name}`}
          >
            <GameIcon game={spine.game} />
            {spine.name}
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
      {translate('host.nextRound')}
    </Button>
  )
}
