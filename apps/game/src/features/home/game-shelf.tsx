import type React from 'react'
import { Link } from 'react-aria-components'

import { type ShelvedGame, shelvedGames } from '@melee/protocol/game'

import { gameHomePathFor } from '@/infrastructure/router/navigation'
import { ArrowIcon, GameIcon } from '@/presentation/components/icons'
import { Spinner } from '@/presentation/components/spinner'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'
import { gameNameKey, gameTaglineKey } from '@/presentation/i18n/translation'

import type { CreateRoom } from './use-create-room'

import './game-shelf.sass'

type GameShelfProps = {
  /** The home page's one room opener, shared with the tray beside it. */
  createRoom: CreateRoom
}

/**
 * The games as boxes stacked on a shelf, each seen by its spine — its colour,
 * its name, one line of what it is — and a press on one opens a table already
 * playing it: whoever is on the home page knows the site, and the game's own
 * page is for the visitor arriving from a search or a group chat.
 *
 * The spine stays a link to that page — for a crawler, a modified click and a
 * copied address — and only a plain press opens the room instead.
 *
 * react-aria's `Link` rather than the design-system one: a spine is a piece of
 * the box with two lines on it, not a control with a label.
 */
export const GameShelf: React.FC<GameShelfProps> = ({ createRoom }) => {
  const { locale } = useI18n()
  const translate = useTranslate()
  const { isOpeningAny, open, openingFor } = createRoom

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
              isDisabled={isOpeningAny}
              onClick={(event) => {
                if (isModifiedClick(event)) {
                  return
                }

                event.preventDefault()
                void open({ games: [game] })
              }}
              style={spineStyle(game)}
            >
              <span className='name'>
                <GameIcon game={game} />
                {translate(gameNameKey(game))}
              </span>
              <span className='tagline'>{translate(gameTaglineKey(game))}</span>
              {openingFor?.includes(game) ? <Spinner /> : <ArrowIcon />}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}

const isModifiedClick = (event: React.MouseEvent): boolean =>
  event.button !== 0 ||
  event.altKey ||
  event.ctrlKey ||
  event.metaKey ||
  event.shiftKey

const spineStyle = (game: ShelvedGame): React.CSSProperties => ({
  '--spine': `var(--spine-${game})`,
  '--spine-ink': `var(--on-spine-${game})`
})
