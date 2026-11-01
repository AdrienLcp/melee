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

/** Every shelved game the host judges however it is answered, in shelf order. */
const JUDGED_GAMES: readonly ShelvedGame[] = shelvedGames.filter((game) =>
  isJudgedInEveryMode(game)
)

type GameShelfProps = {
  /** The host's door, set at the shelf's foot. */
  door: React.ReactNode
  /** No tick moves while a table opens on them. */
  isDisabled: boolean
  /** The ticks the host's door opens a table on. */
  ticks: ShelfTicks
}

/**
 * The games as boxes stacked on a shelf, each seen by its spine — its colour,
 * its name, one line of what it is — and a press on one ticks it for the host's
 * door: pulled forward with a tick, and once anything is ticked the rest sit
 * back.
 *
 * The games the host judges however they are answered are shelved last, under
 * a heading of their own: a first visit ticks every other game, and three
 * unticked spines in the run of ticked ones read as boxes somebody forgot.
 * Each group keeps `shelvedGames` order, and nothing moves when a tick does —
 * a spine that jumped would leave the next press landing on another game.
 *
 * A spine is a toggle and not a link to the game's own page: that page is for
 * the visitor arriving from a search or a group chat, and the sitemap is what
 * hands it to a crawler.
 */
export const GameShelf: React.FC<GameShelfProps> = ({
  door,
  isDisabled,
  ticks
}) => {
  const translate = useTranslate()
  const { ticked, tickOnly, toggle } = ticks

  const spineOf = (game: ShelvedGame, shelfIndex: number) => (
    <ShelfSpine
      game={game}
      isDisabled={isDisabled}
      isTicked={ticked.includes(game)}
      key={game}
      onChange={(isTicked) => toggle({ game, isTicked })}
      shelfIndex={shelfIndex}
    />
  )

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
      <ul className='stack'>{UNJUDGED_GAMES.map(spineOf)}</ul>
      <div className='judged-shelf'>
        <h3 className='judged-title' id='game-shelf-judged'>
          {translate('home.judgedGames')}
        </h3>
        <ul aria-labelledby='game-shelf-judged' className='stack'>
          {JUDGED_GAMES.map((game, index) =>
            spineOf(game, UNJUDGED_GAMES.length + index)
          )}
        </ul>
      </div>
      {door}
    </section>
  )
}

type ShelfSpineProps = {
  game: ShelvedGame
  isDisabled: boolean
  isTicked: boolean
  onChange: (isTicked: boolean) => void
  /** Its place on the whole shelf, which staggers its arrival after the ones before it. */
  shelfIndex: number
}

/**
 * One game's spine. react-aria's `ToggleButton` rather than the design-system
 * one: a spine is a piece of the box with two lines on it, not a control with a
 * label.
 */
const ShelfSpine: React.FC<ShelfSpineProps> = ({
  game,
  isDisabled,
  isTicked,
  onChange,
  shelfIndex
}) => {
  const translate = useTranslate()

  return (
    <li style={{ '--shelf-index': shelfIndex }}>
      <ToggleButton
        className='spine'
        isDisabled={isDisabled}
        isSelected={isTicked}
        onChange={onChange}
        style={{
          '--spine': `var(--spine-${game})`,
          '--spine-ink': `var(--on-spine-${game})`
        }}
      >
        <span aria-hidden='true' className='tick'>
          <CheckIcon />
        </span>
        <span className='name'>
          <GameIcon game={game} />
          {translate(gameNameKey(game))}
        </span>
        <span className='tagline'>{translate(gameTaglineKey(game))}</span>
      </ToggleButton>
    </li>
  )
}
