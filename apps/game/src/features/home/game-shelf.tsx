import type React from 'react'
import { ToggleButton } from 'react-aria-components'

import { type ShelvedGame, shelvedGames } from '@melee/protocol/game'

import { isJudgedInEveryMode } from '@melee/core/room/game-modes'

import { Button } from '@/presentation/components/button'
import { CheckIcon, GameIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { gameNameKey, gameTaglineKey } from '@/presentation/i18n/translation'

import { type ShelfTicks, UNJUDGED_GAMES } from './use-shelf-ticks'

import './game-shelf.sass'

type GameShelfProps = {
  /** No tick moves while a table opens on them. */
  isDisabled: boolean
  /** The ticks the host's door opens a table on. */
  ticks: ShelfTicks
}

/**
 * The games as boxes stacked on a shelf, each seen by its spine — its colour,
 * its name, one line of what it is — and a press on one ticks it for the host's
 * door: pulled forward with a tick, and once anything is ticked the rest sit
 * back. A game judged however it is answered says so after its tagline.
 *
 * A spine is a toggle and not a link to the game's own page: that page is for
 * the visitor arriving from a search or a group chat, and the sitemap is what
 * hands it to a crawler.
 *
 * react-aria's `ToggleButton` rather than the design-system one: a spine is a
 * piece of the box with two lines on it, not a control with a label.
 */
export const GameShelf: React.FC<GameShelfProps> = ({ isDisabled, ticks }) => {
  const translate = useTranslate()
  const { ticked, tickOnly, toggle } = ticks

  return (
    <section
      aria-describedby='game-shelf-hint'
      aria-labelledby='game-shelf-title'
      className='game-shelf'
      data-any-ticked={ticked.length > 0 || undefined}
    >
      <div className='shelf-heading'>
        <h2 className='shelf-title' id='game-shelf-title'>
          {translate('home.shelf')}
        </h2>
        <p className='shelf-hint' id='game-shelf-hint'>
          {translate('home.shelfHint')}
        </p>
      </div>
      <div className='shelf-presets'>
        <Button
          isDisabled={isDisabled}
          onPress={() => tickOnly(UNJUDGED_GAMES)}
          size='small'
          variant='underlined'
        >
          {translate('home.tickUnjudged')}
        </Button>
        <Button
          isDisabled={isDisabled}
          onPress={() => tickOnly([])}
          size='small'
          variant='underlined'
        >
          {translate('home.untickAll')}
        </Button>
      </div>
      <ul className='stack'>
        {shelvedGames.map((game, index) => (
          <li key={game} style={shelfIndexStyle(index)}>
            <ToggleButton
              className='spine'
              isDisabled={isDisabled}
              isSelected={ticked.includes(game)}
              onChange={(isTicked) => toggle({ game, isTicked })}
              style={spineStyle(game)}
            >
              <span aria-hidden='true' className='tick'>
                <CheckIcon />
              </span>
              <span className='name'>
                <GameIcon game={game} />
                {translate(gameNameKey(game))}
              </span>
              <span className='tagline'>
                {translate(gameTaglineKey(game))}
                {isJudgedInEveryMode(game) && (
                  <>
                    {' · '}
                    {translate('host.judgedMark.host')}
                  </>
                )}
              </span>
            </ToggleButton>
          </li>
        ))}
      </ul>
    </section>
  )
}

const shelfIndexStyle = (index: number): React.CSSProperties => ({
  '--shelf-index': index
})

const spineStyle = (game: ShelvedGame): React.CSSProperties => ({
  '--spine': `var(--spine-${game})`,
  '--spine-ink': `var(--on-spine-${game})`
})
