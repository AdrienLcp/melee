import type React from 'react'

import { Button } from '@/presentation/components/button'
import { ChevronLeftIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import './evening-page.sass'

type EveningPageProps = {
  /** The page itself; none while the entry it opens is still on its way from the room. */
  children?: React.ReactNode
  /** Back to the list of rounds, whose place on the game tab the page took. */
  onBack: () => void
}

/**
 * A page of the game tab in place of its list — one round, or the shelf a
 * round is added from — with the way back to the list on top, focused as it
 * opens so a keyboard lands where the list was left.
 */
export const EveningPage: React.FC<EveningPageProps> = ({
  children,
  onBack
}) => {
  const translate = useTranslate()

  return (
    <section className='evening-page'>
      <Button
        autoFocus
        className='back'
        onPress={onBack}
        size='small'
        variant='underlined'
      >
        <ChevronLeftIcon />
        {translate('host.evening.rounds')}
      </Button>
      {children}
    </section>
  )
}
