import type React from 'react'
import { Link } from 'react-aria-components'

import { type ShelvedGame, shelvedGames } from '@melee/protocol/game'

import { gameHomePathFor } from '@/infrastructure/router/navigation'
import { ArrowIcon, GameIcon } from '@/presentation/components/icons'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'
import { gameNameKey, gameTaglineKey } from '@/presentation/i18n/translation'

import './game-shelf.sass'

/**
 * The games as boxes stacked on a shelf, each seen by its spine — its colour,
 * its name, one line of what it is — and each a way to its own page, where
 * the rules are and where a table opens already playing it. Choosing what the
 * table plays is the lobby's, beside the code everyone is joining with.
 *
 * react-aria's `Link` rather than the design-system one: a spine is a piece of
 * the box with two lines on it, not a control with a label.
 */
export const GameShelf: React.FC = () => {
  const { locale } = useI18n()
  const translate = useTranslate()

  return (
    <nav aria-labelledby='game-shelf-title' className='game-shelf'>
      <h2 className='shelf-title' id='game-shelf-title'>
        {translate('home.shelf')}
      </h2>
      <ul className='stack'>
        {shelvedGames.map((game) => (
          <li key={game}>
            <Link
              className='spine-link'
              href={gameHomePathFor({ game, locale })}
              style={spineStyle(game)}
            >
              <span className='name'>
                <GameIcon game={game} />
                {translate(gameNameKey(game))}
              </span>
              <span className='tagline'>{translate(gameTaglineKey(game))}</span>
              <ArrowIcon />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

const spineStyle = (game: ShelvedGame): React.CSSProperties => ({
  '--spine': `var(--spine-${game})`,
  '--spine-ink': `var(--on-spine-${game})`
})
