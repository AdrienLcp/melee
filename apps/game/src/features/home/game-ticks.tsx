import type React from 'react'
import { Checkbox, CheckboxGroup, Label } from 'react-aria-components'

import { type ShelvedGame, shelvedGames } from '@melee/protocol/game'

import { CheckIcon, GameIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { gameNameKey, gameTaglineKey } from '@/presentation/i18n/translation'

import './game-ticks.sass'

type GameTicksProps = {
  onChange: (ticked: readonly ShelvedGame[]) => void
  /** The games ticked, in any order; the shelf draws them in its own. */
  ticked: readonly ShelvedGame[]
}

/**
 * The games as boxes stacked on a shelf, each seen by its spine — its colour,
 * its name, one line of what it is — and each a tick. What is ticked is what
 * the table plays, and the press under the shelf is the only door: nothing
 * ticked opens a table that chooses in the lobby, one plays that game, several
 * open a line-up.
 *
 * react-aria's primitives rather than a design-system wrapper: a spine is a
 * piece of the box with two lines on it, not a form row with a box beside it.
 */
export const GameTicks: React.FC<GameTicksProps> = ({ onChange, ticked }) => {
  const translate = useTranslate()

  return (
    <CheckboxGroup
      className='game-ticks'
      onChange={(next) => {
        onChange(shelvedGames.filter((game) => next.includes(game)))
      }}
      value={[...ticked]}
    >
      <Label className='shelf-title'>{translate('home.shelf')}</Label>
      <div className='stack'>
        {shelvedGames.map((game) => (
          <Checkbox
            className='spine-tick'
            key={game}
            style={spineStyle(game)}
            value={game}
          >
            <span aria-hidden='true' className='well'>
              <CheckIcon />
            </span>
            <span className='name'>
              <GameIcon game={game} />
              {translate(gameNameKey(game))}
            </span>
            <span className='tagline'>{translate(gameTaglineKey(game))}</span>
          </Checkbox>
        ))}
      </div>
    </CheckboxGroup>
  )
}

const spineStyle = (game: ShelvedGame): React.CSSProperties => ({
  '--spine': `var(--spine-${game})`,
  '--spine-ink': `var(--on-spine-${game})`,
  '--spine-mark': `var(--spine-mark-${game})`
})
