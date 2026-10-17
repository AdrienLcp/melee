import type React from 'react'
import {
  Disclosure,
  DisclosurePanel,
  Heading,
  Button as ReactAriaButton
} from 'react-aria-components'

import { Button } from '@/presentation/components/button'
import { GameIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { gameNameKey } from '@/presentation/i18n/translation'

import { ROOM_PRESETS, type RoomPresetId } from './room-presets'
import type { CreateRoom } from './use-create-room'

import './preset-box.sass'

type PresetBoxProps = {
  /** The page's one room opener, so a press here greys out every other door. */
  createRoom: CreateRoom
  preset: RoomPresetId
}

/**
 * A whole evening on the shelf, as a box set among the single boxes: a paper
 * sleeve whose edge shows the spines of the games packed inside. Its lid says
 * what is in it and how it is played, and holds one door — the host opens the
 * evening and the room is set with it.
 */
export const PresetBox: React.FC<PresetBoxProps> = ({ createRoom, preset }) => {
  const translate = useTranslate()
  const { isOpening, isOpeningAny, open, refusal } = createRoom
  const { lineUp, roundCount, teams } = ROOM_PRESETS[preset]

  return (
    <Disclosure className='shelf-box preset-box' id={preset}>
      <Heading level={3}>
        <ReactAriaButton className='spine' slot='trigger'>
          <span aria-hidden='true' className='packed'>
            {lineUp.map((game) => (
              <span key={game} style={{ '--spine': `var(--spine-${game})` }} />
            ))}
          </span>
          <span className='name'>
            {translate(`home.presets.${preset}.name`)}
          </span>
          <span className='tagline'>
            {translate(`home.presets.${preset}.tagline`)}
          </span>
        </ReactAriaButton>
      </Heading>
      <DisclosurePanel className='opened-lid'>
        <ul className='contents'>
          {lineUp.map((game) => (
            <li key={game} style={{ '--spine': `var(--spine-${game})` }}>
              <GameIcon game={game} />
              {translate(gameNameKey(game))}
            </li>
          ))}
        </ul>
        <p className='how'>
          {translate('home.presets.how', {
            rounds: roundCount ?? 0,
            teams: 'count' in teams ? teams.count : 0
          })}
        </p>
        <Button
          isDisabled={isOpeningAny && !isOpening(preset)}
          isPending={isOpening(preset)}
          onPress={() => {
            void open(preset)
          }}
          size='large'
        >
          {translate('home.presets.open')}
        </Button>
        {refusal?.door === preset && (
          <p className='error' role='alert'>
            {translate(refusal.error)}
          </p>
        )}
      </DisclosurePanel>
    </Disclosure>
  )
}
