import type React from 'react'
import { ToggleButton as SpineToggle } from 'react-aria-components'

import type { ShelvedGame } from '@melee/protocol/game'

import {
  familyGames,
  gamesOfFamily,
  hostTools,
  type ShelfFamily,
  shelfFamilies
} from '@melee/core/room/shelf-families'

import { Button } from '@/presentation/components/button'
import { CheckIcon, GameIcon } from '@/presentation/components/icons'
import { ToggleButton } from '@/presentation/components/toggle-button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { gameNameKey, gameTaglineKey } from '@/presentation/i18n/translation'

import type { ShelfTicks } from './use-shelf-ticks'

import './game-shelf.sass'

type GameShelfProps = {
  /** The host's door, set at the shelf's foot. */
  door: React.ReactNode
  /** No tick moves while a table opens on them. */
  isDisabled: boolean
  /** The ticks the host's door opens a table on. */
  ticks: ShelfTicks
}

/** Where a family's first spine sits on the whole shelf, which staggers its arrival. */
const firstShelfIndexOf = (family: ShelfFamily): number =>
  shelfFamilies
    .slice(0, shelfFamilies.indexOf(family))
    .reduce((count, before) => count + gamesOfFamily[before].length, 0)

/**
 * The games as boxes stacked on a shelf, each seen by its spine — its colour,
 * its name, one line of what it is — and a press on one ticks it for the host's
 * door: pulled forward with a tick, and once anything is ticked the rest sit
 * back.
 *
 * The spines stand in families, each with a press that ticks the whole row,
 * and the host's tools — the games the host brings the questions to — on a
 * row of their own under them, which neither that press nor _Tick all_
 * reaches. Nothing moves when a tick does: a spine that jumped would leave
 * the next press landing on another game.
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
  const { tick, ticked } = ticks

  return (
    <section
      aria-labelledby='game-shelf-title'
      className='game-shelf'
      data-any-ticked={ticked.length > 0 || undefined}
    >
      <div className='shelf-heading'>
        <h2 className='shelf-title' id='game-shelf-title'>
          {translate('home.shelf')}
        </h2>
      </div>
      <div className='shelf-presets'>
        <Button
          isDisabled={isDisabled}
          onPress={() => tick({ games: familyGames, isTicked: true })}
          size='small'
          variant='underlined'
        >
          {translate('home.tickAll')}
        </Button>
        <Button
          isDisabled={isDisabled}
          onPress={() => ticks.tickOnly([])}
          size='small'
          variant='underlined'
        >
          {translate('home.untickAll')}
        </Button>
      </div>
      <div className='families'>
        {shelfFamilies.map((family) => (
          <ShelfRow
            firstShelfIndex={firstShelfIndexOf(family)}
            games={gamesOfFamily[family]}
            id={`shelf-family-${family}`}
            isDisabled={isDisabled}
            key={family}
            ticks={ticks}
            ticksAsOne
            title={translate(`home.families.${family}`)}
          />
        ))}
      </div>
      <ShelfRow
        firstShelfIndex={familyGames.length}
        games={hostTools}
        id='shelf-host-tools'
        isDisabled={isDisabled}
        ticks={ticks}
        title={translate('home.hostTools')}
      />
      {door}
    </section>
  )
}

type ShelfRowProps = {
  /** Where its first spine sits on the whole shelf. */
  firstShelfIndex: number
  games: readonly ShelvedGame[]
  /** Ties the row's spines to its heading. */
  id: string
  isDisabled: boolean
  ticks: ShelfTicks
  /** Gives the row a press ticking all of it — a family's, never the host's tools'. */
  ticksAsOne?: boolean
  title: string
}

const ShelfRow: React.FC<ShelfRowProps> = ({
  firstShelfIndex,
  games,
  id,
  isDisabled,
  ticks,
  ticksAsOne = false,
  title
}) => {
  const translate = useTranslate()
  const { tick, ticked } = ticks
  const isWhollyTicked = games.every((game) => ticked.includes(game))

  return (
    <div className='shelf-row'>
      <div className='row-heading'>
        <h3 className='row-title' id={id}>
          {title}
        </h3>
        {ticksAsOne && (
          <ToggleButton
            aria-label={translate('home.tickFamily', { family: title })}
            className='row-all'
            isDisabled={isDisabled}
            isSelected={isWhollyTicked}
            onChange={(isTicked) => tick({ games, isTicked })}
            size='small'
          >
            {translate('home.allOfFamily')}
          </ToggleButton>
        )}
      </div>
      <ul aria-labelledby={id} className='stack'>
        {games.map((game, index) => (
          <ShelfSpine
            game={game}
            isDisabled={isDisabled}
            isTicked={ticked.includes(game)}
            key={game}
            onChange={(isTicked) => tick({ games: [game], isTicked })}
            shelfIndex={firstShelfIndex + index}
          />
        ))}
      </ul>
    </div>
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
      <SpineToggle
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
      </SpineToggle>
    </li>
  )
}
