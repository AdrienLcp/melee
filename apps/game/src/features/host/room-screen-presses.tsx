import type React from 'react'
import { DialogTrigger } from 'react-aria-components'

import type { ProtocolErrorCode } from '@melee/protocol/error-code'
import type { PlayerId } from '@melee/protocol/identifiers'

import { RoomExit } from '@/presentation/components/app-menu'
import { Button } from '@/presentation/components/button'
import { Drawer } from '@/presentation/components/drawer'
import { ControlsIcon, CrossIcon } from '@/presentation/components/icons'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { protocolErrorKey } from '@/presentation/i18n/translation'

import { ActionSlotProvider } from './action-slot'
import { AutoAdvanceChoice } from './auto-advance-choice'
import { HostActions, type HostActionsProps } from './host-actions'
import { SetupFields, type SetupFieldsProps } from './setup-fields'

import './room-screen-presses.sass'

type RoomScreenPressesProps = {
  /** What the console's footer would have been handed, split here in two. */
  actions: HostActionsProps
  /** The last refusal, said above the press the room is waiting on. */
  error: { code: ProtocolErrorCode } | null
  onRemovePlayer: (playerId: PlayerId) => void
  setup: SetupFieldsProps
}

/**
 * The host's hand on the room's own screen: the one press the room is waiting
 * on, bottom right, and everything else in a drawer opened bottom left — where
 * a host standing at a screen hung on the wall reaches both, and the room reads
 * the stage between them with nothing on it but the game.
 *
 * Nothing that prints an answer is drawn until somebody opens the drawer, which
 * is why the slate's key is on its round's page rather than on the lobby's stage.
 */
export const RoomScreenPresses: React.FC<RoomScreenPressesProps> = ({
  actions,
  error,
  onRemovePlayer,
  setup
}) => {
  const translate = useTranslate()
  const { isLive, onSettingsChange, view } = actions
  const removable = view.players.filter((player) => player.id !== view.youId)
  const game = view.settings.game

  return (
    <div className='room-screen-presses'>
      <DialogTrigger>
        <Button className='drawer-trigger' variant='outlined'>
          <ControlsIcon />
          {translate('host.drawer.open')}
        </Button>
        <Drawer aria-label={translate('host.drawer.open')}>
          {({ close }) => (
            <>
              <ActionSlotProvider value='secondary'>
                <div className='drawer-presses'>
                  <HostActions {...actions} />
                </div>
              </ActionSlotProvider>

              {view.phase === 'revealed' && game?.kind !== 'slate' && (
                <AutoAdvanceChoice
                  isLive={isLive}
                  onSettingsChange={onSettingsChange}
                  settings={view.settings}
                />
              )}

              {removable.length > 0 && (
                <section className='remove-players'>
                  <h2>{translate('host.drawer.removePlayer')}</h2>
                  <ul>
                    {removable.map((player) => (
                      <li key={player.id}>
                        <Button
                          aria-label={translate('host.players.removeNamed', {
                            nickname: player.nickname
                          })}
                          isDisabled={!isLive}
                          onPress={() => {
                            onRemovePlayer(player.id)
                          }}
                          size='small'
                          variant='outlined'
                        >
                          {player.nickname}
                          <CrossIcon />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {view.phase !== 'finished' && <SetupFields {...setup} />}

              <div className='room-exits'>
                <RoomExit onDone={close} />
              </div>
            </>
          )}
        </Drawer>
      </DialogTrigger>

      <div className='primary-press'>
        {error !== null && (
          <p className='error' role='alert'>
            {translate(protocolErrorKey(error.code))}
          </p>
        )}
        <ActionSlotProvider value='primary'>
          <HostActions {...actions} />
        </ActionSlotProvider>
      </div>
    </div>
  )
}
