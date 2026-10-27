import { useMediaQuery } from '@adrienlcp/browser/react'
import type React from 'react'
import { useState } from 'react'
import { ToggleButton, ToggleButtonGroup } from 'react-aria-components'

import type { RoomCode } from '@melee/protocol/identifiers'
import type { HostRoomView } from '@melee/protocol/room'

import { launchesWithHostSeated } from '@melee/core/room/play-right-away'
import { isRoundInPlay } from '@melee/core/room/room-phase'

import { inviteUrlFor, wallUrlFor } from '@/infrastructure/router/navigation'
import { useVolume } from '@/presentation/audio/volume-provider'
import { Button } from '@/presentation/components/button'
import { HandOverDoor } from '@/presentation/components/hand-over-door'
import { PlusIcon, ScreenIcon } from '@/presentation/components/icons'
import { Link } from '@/presentation/components/link'
import { Pawn } from '@/presentation/components/pawn'
import { Slider } from '@/presentation/components/slider'
import { WallPairingForm } from '@/presentation/components/wall-pairing-form'
import { useTranslate } from '@/presentation/i18n/i18n-provider'
import { useRoomActions } from '@/presentation/room-actions/room-actions-provider'
import { DESK_SCREEN_QUERY } from '@/presentation/styles/wide-screen'

import { HostSeat } from './host-seat'
import { RoomRecovery } from './room-recovery'

import './room-scene.sass'

type Spot = 'here' | 'seat' | 'wall'

/** Where the others sit round the table top, in percent of its box: the rim, clear of the count in the middle. */
const RIM: readonly (readonly [number, number])[] = [
  [12, 34],
  [30, 10],
  [50, 6],
  [70, 10],
  [88, 34],
  [86, 72],
  [14, 72]
]

const isSpot = (key: React.Key): key is Spot =>
  key === 'here' || key === 'seat' || key === 'wall'

type RoomSceneProps = {
  isLive: boolean
  /** Lets every wall go, so this screen is the room's speaker again. */
  onDismissWall: () => void
  onLeaveSeat: () => void
  onTakeSeat: (nickname: string) => void
  view: HostRoomView
}

/**
 * The room drawn from above, as the one place the console says what each
 * screen is for: the room's own screen, the table with everyone else at it,
 * and the host's side — a seat and this screen. Each shape is the button for
 * what it does, and the pick opens under the drawing.
 *
 * It never suggests a second screen is needed: with no wall, this screen is
 * said to show the game, and the ways to add one are offered, not asked for.
 */
export const RoomScene: React.FC<RoomSceneProps> = ({
  isLive,
  onDismissWall,
  onLeaveSeat,
  onTakeSeat,
  view
}) => {
  const translate = useTranslate()
  const hasWall = view.isWallConnected
  const [pick, setPick] = useState<Spot>('here')
  const seatedAs =
    view.players.find((player) => player.id === view.youId)?.nickname ?? null
  const others = view.players.filter((player) => player.id !== view.youId)

  return (
    <>
      <ToggleButtonGroup
        aria-label={translate('host.roomScene.label')}
        className='room-scene'
        disallowEmptySelection
        onSelectionChange={(keys) => {
          const [key] = keys

          if (key !== undefined && isSpot(key)) {
            setPick(key)
          }
        }}
        selectedKeys={[pick]}
        selectionMode='single'
      >
        <ToggleButton
          aria-controls='room-spot-detail'
          className='spot wall'
          data-absent={!hasWall || undefined}
          id='wall'
        >
          <span className='face'>
            {hasWall ? <ScreenIcon /> : <PlusIcon />}
          </span>
          <span className='name'>{translate('host.roomScene.wall.name')}</span>
          <span className='state'>
            {translate(
              hasWall ? 'host.roomScene.wall.on' : 'host.roomScene.wall.off'
            )}
          </span>
        </ToggleButton>
        <div aria-hidden='true' className='table'>
          <span className='top' />
          {others.slice(0, RIM.length).map((player, index) => (
            <span
              className='other'
              key={player.id}
              style={{
                '--x': `${RIM[index]?.[0]}%`,
                '--y': `${RIM[index]?.[1]}%`
              }}
            >
              <Pawn seat={view.players.indexOf(player)} />
            </span>
          ))}
          <span className='count'>
            {others.length === 0
              ? translate(
                  seatedAs === null
                    ? 'host.roomScene.table.empty'
                    : 'host.roomScene.table.emptyButYou'
                )
              : translate('host.roomScene.table.count', {
                  count: others.length
                })}
          </span>
        </div>
        <div className='host-side'>
          <ToggleButton
            aria-controls='room-spot-detail'
            className='spot seat'
            data-absent={seatedAs === null || undefined}
            id='seat'
          >
            <span className='face'>
              {seatedAs === null ? (
                <PlusIcon />
              ) : (
                <Pawn
                  seat={view.players.findIndex((p) => p.id === view.youId)}
                />
              )}
            </span>
            <span className='name'>
              {translate('host.roomScene.seat.name')}
            </span>
            <span className='state'>
              {seatedAs ?? translate('host.roomScene.seat.free')}
            </span>
          </ToggleButton>
          <ToggleButton
            aria-controls='room-spot-detail'
            className='spot here'
            id='here'
          >
            <span className='face'>
              <span className='mark'>
                {translate('host.roomScene.here.mark')}
              </span>
            </span>
            <span className='name'>
              {translate('host.roomScene.here.name')}
            </span>
            <span className='state'>
              {translate('host.roomScene.here.state')}
            </span>
          </ToggleButton>
        </div>
      </ToggleButtonGroup>
      <section aria-live='polite' className='spot-detail' id='room-spot-detail'>
        {pick === 'wall' && (
          <WallDetail
            hasWall={hasWall}
            isLive={isLive}
            onDismissWall={onDismissWall}
            view={view}
          />
        )}
        {pick === 'seat' && (
          <SeatDetail
            isSeated={seatedAs !== null}
            onLeaveSeat={onLeaveSeat}
            onTakeSeat={onTakeSeat}
            view={view}
          />
        )}
        {pick === 'here' && (
          <HereDetail
            hasWall={hasWall}
            isSeated={seatedAs !== null}
            view={view}
          />
        )}
      </section>
    </>
  )
}

/**
 * Folded behind a press: the square hands the table to whoever
 * scans it, and this tab is often open on the screen the whole room is facing.
 */
const HandOverWay: React.FC<{ roomCode: RoomCode }> = ({ roomCode }) => {
  const { handOver } = useRoomActions()

  return handOver === null ? null : (
    <HandOverDoor onOpen={handOver} roomCode={roomCode} />
  )
}

/**
 * The room's screen opened beside the console on this machine: a new tab, since
 * a plain navigation off the console would close its socket and the server
 * cannot tell that from a closed tab. That tab can be dragged onto the screen
 * wired to the projector — the invitation for a crowd that only has to get in,
 * the wall for the whole game.
 */
const TabWay: React.FC<{ roomCode: RoomCode }> = ({ roomCode }) => {
  const translate = useTranslate()

  return (
    <div className='way'>
      <h4>{translate('host.roomScene.wall.tabTitle')}</h4>
      <Link
        href={wallUrlFor(roomCode)}
        rel='noreferrer'
        target='_blank'
        variant='underlined'
      >
        {translate('wall.menu.openHere')}
      </Link>
      <Link
        href={inviteUrlFor(roomCode)}
        rel='noreferrer'
        target='_blank'
        variant='underlined'
      >
        {translate('invite.project')}
      </Link>
    </div>
  )
}

const WallDetail: React.FC<{
  hasWall: boolean
  isLive: boolean
  onDismissWall: () => void
  view: HostRoomView
}> = ({ hasWall, isLive, onDismissWall, view }) => {
  const translate = useTranslate()
  const isDesk = useMediaQuery(DESK_SCREEN_QUERY)

  if (hasWall) {
    return (
      <>
        <h3>{translate('host.roomScene.wall.titleOn')}</h3>
        <p className='lines'>{translate('host.roomScene.wall.linesOn')}</p>
        <Button
          isDisabled={!isLive}
          onPress={onDismissWall}
          size='small'
          variant='underlined'
        >
          {translate('host.roomScene.wall.dismiss')}
        </Button>
      </>
    )
  }

  return (
    <>
      <h3>{translate('host.roomScene.wall.titleOff')}</h3>
      <p className='lines'>{translate('host.roomScene.wall.linesOff')}</p>
      <div className='way'>
        <h4>{translate('host.roomScene.wall.pairTitle')}</h4>
        <WallPairingForm
          description={translate('host.roomScene.wall.pairLines')}
          roomCode={view.code}
        />
      </div>
      <TabWay roomCode={view.code} />
      {isDesk && <HandOverWay roomCode={view.code} />}
    </>
  )
}

/**
 * The seat waits out a round in play, because taking it reopens the socket
 * beneath a running clip; and at an empty table the launch takes it itself,
 * so the form would be a second way to do the same thing.
 */
const SeatDetail: React.FC<{
  isSeated: boolean
  onLeaveSeat: () => void
  onTakeSeat: (nickname: string) => void
  view: HostRoomView
}> = ({ isSeated, onLeaveSeat, onTakeSeat, view }) => {
  const translate = useTranslate()
  const launchSeats =
    view.phase === 'lobby' &&
    launchesWithHostSeated({
      seated: view.players.length,
      settings: view.settings
    })

  return (
    <>
      <h3>
        {translate(
          isSeated
            ? 'host.roomScene.seat.titleTaken'
            : 'host.roomScene.seat.title'
        )}
      </h3>
      {!isSeated && (
        <p className='lines'>{translate('host.roomScene.seat.lines')}</p>
      )}
      {isRoundInPlay(view.phase) && !isSeated ? (
        <p className='lines'>
          {translate('host.roomScene.seat.betweenRounds')}
        </p>
      ) : launchSeats ? (
        <p className='lines'>{translate('host.roomScene.seat.launchSeats')}</p>
      ) : (
        <HostSeat
          onLeaveSeat={onLeaveSeat}
          onTakeSeat={onTakeSeat}
          view={view}
        />
      )}
    </>
  )
}

const HereDetail: React.FC<{
  hasWall: boolean
  isSeated: boolean
  view: HostRoomView
}> = ({ hasWall, isSeated, view }) => {
  const translate = useTranslate()
  const isDesk = useMediaQuery(DESK_SCREEN_QUERY)
  const { playsSound } = useRoomActions()
  const { setVolume, volume } = useVolume()

  return (
    <>
      <h3>{translate('host.roomScene.here.name')}</h3>
      <p className='lines'>
        <strong>{translate('host.roomScene.here.runs')}</strong>
        {!hasWall && ` ${translate('host.roomScene.here.showsGame')}`}
        {isSeated && ` ${translate('host.roomScene.here.playsToo')}`}
      </p>
      {!hasWall && isDesk && <HandOverWay roomCode={view.code} />}
      {playsSound && (
        <div className='way'>
          <Slider
            formatOptions={{ style: 'percent' }}
            label={translate('host.setup.volume')}
            maxValue={1}
            minValue={0}
            onChange={setVolume}
            step={0.05}
            value={volume}
          />
        </div>
      )}
      <RoomRecovery roomCode={view.code} />
    </>
  )
}
