import { copyText } from '@adrienlcp/browser'
import type React from 'react'
import { useEffect, useState } from 'react'

import { useTranslate } from '@/presentation/i18n/i18n-provider'
import type { PlainTranslationKey } from '@/presentation/i18n/translation'

import { Button } from './button'
import { CheckIcon, CopyIcon } from './icons'

/** Long enough to be read from where the host is standing, gone before the next glance. */
const CONFIRMATION_MS = 2_000

type CopyState = 'copied' | 'failed' | 'idle'

const OUTCOME_KEYS: Record<Exclude<CopyState, 'idle'>, PlainTranslationKey> = {
  copied: 'invite.copied',
  failed: 'invite.copyFailed'
}

type CopyButtonProps = {
  /** Names what is copied — the code, the link — never a bare *copy*. */
  label: PlainTranslationKey
  /** What lands in the clipboard. */
  value: string
}

/**
 * The label is the whole feedback, which is why it is the button's own text
 * rather than a note beside it: a control that renames itself to "Copied" is
 * announced to a screen reader on the press it just took, and takes no room on
 * the screen when it has nothing to say.
 *
 * The word stays beside the glyph rather than giving way to it. Both a child
 * and a grandparent are expected here, and a bare icon asks them to already
 * know what it means.
 *
 * It names what it copies rather than saying *this*, because the code and the
 * link sit side by side on the invitation and a host sending one has to know
 * which they are holding.
 */
export const CopyButton: React.FC<CopyButtonProps> = ({ label, value }) => {
  const translate = useTranslate()
  const [state, setState] = useState<CopyState>('idle')

  useEffect(() => {
    if (state === 'idle') {
      return
    }

    const timer = window.setTimeout(() => {
      setState('idle')
    }, CONFIRMATION_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [state])

  const copy = async (): Promise<void> => {
    const copied = await copyText(value)

    setState(copied.status === 'success' ? 'copied' : 'failed')
  }

  return (
    <Button
      onPress={() => {
        void copy()
      }}
      size='small'
      variant='outlined'
    >
      {state === 'copied' ? <CheckIcon /> : <CopyIcon />}
      {translate(state === 'idle' ? label : OUTCOME_KEYS[state])}
    </Button>
  )
}
