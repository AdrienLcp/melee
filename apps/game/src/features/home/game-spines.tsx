import {
  Button,
  Disclosure,
  DisclosureGroup,
  DisclosurePanel,
  Heading
} from 'react-aria-components'

import { type ShelvedGame, shelvedGames } from '@melee/protocol/game'

import { GameDoors } from '@/features/shelf/game-doors'
import { GameIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { gameNameKey, gameTaglineKey } from '@/presentation/i18n/translation'

import { PresetBox } from './preset-box'
import { roomPresetIds } from './room-presets'
import type { CreateRoom } from './use-create-room'

import './game-spines.sass'

type GameSpinesProps = {
  /** The front door's one room opener, so the shelf and the lid share a press. */
  createRoom: CreateRoom
}

/**
 * The five games as boxes stacked on a shelf, each seen by its spine: the
 * box's colour, its name, and one line of what it is. A spine **opens the
 * box's lid** in place, with the game's two doors on it — a table for the
 * group, or one where whoever pressed is already playing. They are the doors
 * the game's own page draws, so the shelf never sends anyone through a second
 * page to reach them; that page stays the arrival a shared link or a search
 * result makes, and `sitemap.xml` keeps it reachable.
 *
 * One lid open at a time, which is what a `DisclosureGroup` holds by default.
 * react-aria's primitives rather than the design system's `Disclosure`: that
 * one is a ruled row with a summary, and a spine is a piece of the box with
 * two lines on it.
 */
export const GameSpines: React.FC<GameSpinesProps> = ({ createRoom }) => {
  const translate = useTranslate()

  return (
    <section className='game-spines'>
      <h2>{translate('home.games')}</h2>
      <DisclosureGroup className='stack'>
        {roomPresetIds.map((preset) => (
          <PresetBox createRoom={createRoom} key={preset} preset={preset} />
        ))}
        {shelvedGames.map((game) => (
          <Disclosure
            className='shelf-box'
            id={game}
            key={game}
            style={spineStyle(game)}
          >
            <Heading level={3}>
              <Button className='spine' slot='trigger'>
                <span className='name'>
                  <GameIcon game={game} />
                  {translate(gameNameKey(game))}
                </span>
                <span className='tagline'>
                  {translate(gameTaglineKey(game))}
                </span>
              </Button>
            </Heading>
            <DisclosurePanel className='opened-lid'>
              <GameDoors createRoom={createRoom} game={game} />
            </DisclosurePanel>
          </Disclosure>
        ))}
      </DisclosureGroup>
      <p className='one-room'>{translate('home.oneRoom')}</p>
    </section>
  )
}

const spineStyle = (game: ShelvedGame): React.CSSProperties => ({
  '--spine': `var(--spine-${game})`,
  '--spine-ink': `var(--on-spine-${game})`
})
