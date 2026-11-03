import {
  isThemePreference,
  THEME_PREFERENCES,
  type ThemePreference
} from '@adrienlcp/theme-preference'
import { useThemePreference } from '@adrienlcp/theme-preference/react'
import type React from 'react'
import { useState, useSyncExternalStore } from 'react'
import { Form } from 'react-aria-components'

import { NICKNAME_MAX_LENGTH } from '@melee/protocol/identifiers'
import { isLocale, LOCALES } from '@melee/protocol/locale'

import {
  canGoFullscreen,
  isFullscreen,
  onFullscreenChange,
  toggleFullscreen
} from '@/infrastructure/browser'
import { promptInstall, useInstallState } from '@/infrastructure/install-prompt'
import {
  creditsPathFor,
  homePathFor,
  legalPathFor,
  paths,
  useIsCurrentPath,
  useIsOnWall,
  useNavigateToLocale
} from '@/infrastructure/router/navigation'
import { useConnection } from '@/presentation/connection/connection-provider'
import { useI18n, useTranslate } from '@/presentation/i18n/i18n-provider'
import { LANGUAGE_NAMES } from '@/presentation/i18n/language-names'
import {
  type PlainTranslationKey,
  protocolErrorKey
} from '@/presentation/i18n/translation'
import {
  useIsInsideRoom,
  useRoomActions
} from '@/presentation/room-actions/room-actions-provider'
import { themeStore } from '@/presentation/theme/theme-store'

import { Button } from './button'
import { ConnectionStatus } from './connection-status'
import { Disclosure } from './disclosure'
import {
  FullscreenEnterIcon,
  FullscreenExitIcon,
  InstallIcon,
  ScreenIcon,
  ShareIcon
} from './icons'
import { Leaflet } from './leaflet'
import { Link } from './link'
import { MenuPawn } from './menu-pawn'
import { ProjectWithCode } from './project-with-code'
import { RoomInvitation } from './room-invitation'
import { SegmentedControl } from './segmented-control'
import { Slider } from './slider'
import { TextField } from './text-field'
import { TextLink } from './text-link'

/**
 * React Aria takes the lower of this and the room left below the trigger, so a
 * short screen still scrolls inside the card; a tall one stops it at a card's
 * length rather than at the bottom of the screen. The narrow screen's sheet
 * is bounded by the screen instead.
 */
const MENU_MAX_HEIGHT_PX = 520

/**
 * The name this screen is playing under. A device that has played before never
 * passes through the join form, so what that form used to show has to live
 * somewhere on every screen at every phase — and the row carries the name
 * itself, which leaves the panel for the rarer half of the job.
 */
const SeatName: React.FC = () => {
  const { refusedNickname, rename, seatNickname } = useRoomActions()
  const translate = useTranslate()
  const [draft, setDraft] = useState<string | null>(null)

  if (rename === null || seatNickname === null) {
    return null
  }

  // Empty rather than filled with the name the row above already carries. A
  // prefilled field printed it twice in four lines, and editing two characters
  // of your own name is not what changing it means.
  const value = draft ?? ''
  const next = value.trim()
  // The refusal belongs to the name it was given for, so any other draft
  // submits again — a controlled `isInvalid` outliving its reason leaves the
  // field's native validity false and the press a silent no-op.
  const isRefused = next === refusedNickname

  return (
    <Disclosure
      className='seat-name'
      label={translate('menu.nickname.label')}
      summary={seatNickname}
    >
      <Form
        onSubmit={(event) => {
          event.preventDefault()
          rename(next)
        }}
      >
        <TextField
          autoComplete='nickname'
          enterKeyHint='done'
          errorMessage={
            isRefused
              ? translate(protocolErrorKey('nickname_taken'))
              : undefined
          }
          isInvalid={isRefused}
          label={translate('menu.nickname.field')}
          maxLength={NICKNAME_MAX_LENGTH}
          name='nickname'
          onChange={setDraft}
          value={value}
        />
        {/*
          `small`, and beside the field rather than under the width of the
          popover: a 52px block here is the same shape as the exit below it, and
          changing a label is not a peer of leaving the room.
        */}
        <Button
          isDisabled={next.length === 0 || next === seatNickname}
          size='small'
          type='submit'
          variant='outlined'
        >
          {translate('menu.nickname.action')}
        </Button>
      </Form>
    </Disclosure>
  )
}

/**
 * The ways out of a room, in the one piece of chrome that is on every screen at
 * every phase. A stage carries the action the room is waiting on and nothing
 * else, so an exit that must be reachable mid-round lives here instead — behind
 * a leaflet, where it cannot be pressed by a player aiming at the game.
 *
 * Closing asks twice, because it is the only one that cannot be undone: the
 * code stops resolving, so a player cannot reload their way back in.
 */
const RoomExit: React.FC<{ onDone: () => void }> = ({ onDone }) => {
  const { locale } = useI18n()
  const { closeRoom, endGame, leaveSeat } = useRoomActions()
  const [isConfirmingClose, setIsConfirmingClose] = useState(false)
  const connection = useConnection()
  const translate = useTranslate()
  const isOnHome = useIsCurrentPath(homePathFor(locale))
  // Every exit here but the plain navigation sends a frame, and a frame written
  // to a socket that is not open is dropped with nothing to show for it.
  const isLive = connection?.status === 'open'

  // The front door is not somewhere you leave for the front door, and no room
  // path is the home path — so the ladder has no rung here at all rather than a
  // rung that does nothing when it is pressed.
  if (isOnHome) {
    return null
  }

  // Leaving the room is what pressing this *means* on a screen that holds a
  // seat, and saying so is the only way the roster on the console can be true
  // rather than true in ten minutes. A closing socket cannot carry it: a
  // player who locks their screen closes one too, and that seat has to come
  // back.
  if (closeRoom === null) {
    return (
      <div className='exits'>
        <Link
          href={homePathFor(locale)}
          onPress={() => {
            leaveSeat?.()
            onDone()
          }}
          variant='outlined'
        >
          {translate(leaveSeat === null ? 'menu.home' : 'menu.leaveRoom')}
        </Link>
      </div>
    )
  }

  return (
    <div className='exits'>
      {/*
        Widest scope last, and this is the only screen that shows more than
        one of them: a host who took a seat can give it back without giving up
        the room, which is what makes the three separate scopes worth having.
      */}
      {leaveSeat !== null && (
        <Button
          isDisabled={!isLive}
          onPress={() => {
            leaveSeat()
            onDone()
          }}
          variant='outlined'
        >
          {translate('host.seat.leave')}
        </Button>
      )}

      {endGame !== null && (
        <Button
          isDisabled={!isLive}
          onPress={() => {
            endGame()
            onDone()
          }}
          variant='outlined'
        >
          {translate('host.endGame')}
        </Button>
      )}

      {isConfirmingClose ? (
        <>
          <p className='warning'>{translate('host.closeRoom.warning')}</p>
          <Link
            href={homePathFor(locale)}
            onPress={() => {
              closeRoom()
              onDone()
            }}
          >
            {translate('host.closeRoom.confirm')}
          </Link>
        </>
      ) : (
        <Button
          isDisabled={!isLive}
          onPress={() => {
            setIsConfirmingClose(true)
          }}
          variant='outlined'
        >
          {translate('host.closeRoom.label')}
        </Button>
      )}
    </div>
  )
}

/**
 * Offered, never pushed: the front door promises a room with nothing to
 * install, so the app is one row of the menu for whoever wants the browser's
 * bars gone, and nothing at all where the page cannot lead to an install.
 */
const InstallApp: React.FC = () => {
  const install = useInstallState()
  const translate = useTranslate()

  if (install === 'offered') {
    return (
      <Button
        className='install-app'
        onPress={() => {
          void promptInstall()
        }}
        variant='outlined'
      >
        <InstallIcon />
        <span className='name'>{translate('menu.install.action')}</span>
      </Button>
    )
  }

  // Safari keeps the install behind its own Share menu, so the most a page
  // can do there is say where it is.
  if (install === 'manual') {
    return (
      <p className='install-hint'>
        <ShareIcon />
        <span>{translate('menu.install.apple')}</span>
      </p>
    )
  }

  return null
}

/**
 * The browser's bars gone for a screen the room reads from across the table,
 * without anybody having to know the key their browser keeps it behind.
 */
const Fullscreen: React.FC = () => {
  const translate = useTranslate()
  const isActive = useSyncExternalStore(onFullscreenChange, isFullscreen)

  if (!canGoFullscreen()) {
    return null
  }

  return (
    <Button
      className='fullscreen'
      onPress={() => {
        void toggleFullscreen()
      }}
      variant='outlined'
    >
      {isActive ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
      <span className='name'>
        {translate(isActive ? 'menu.fullscreen.exit' : 'menu.fullscreen.enter')}
      </span>
    </Button>
  )
}

const THEME_KEYS: Record<ThemePreference, PlainTranslationKey> = {
  dark: 'preferences.theme.dark',
  light: 'preferences.theme.light',
  system: 'preferences.theme.system'
}

/** What the server says it was deployed from. */
export type DeployedBuild = {
  /** The deployed commit, short; `dev` from a checkout. */
  commit: string
  /** When that commit was made, in epoch milliseconds; `null` from a checkout. */
  committedAt: number | null
}

type AppMenuLeafletProps = {
  /** The build the server reports, once the first open has asked for it. */
  build: DeployedBuild | null
}

/**
 * What the menu opens: the room's presses, the way in, the preferences and the
 * exits. Its own chunk, because every page draws the trigger and almost nobody
 * opens it — bundled, its slider, radio groups, invitation square and
 * react-aria's popover were a sixth of what the front door downloads.
 */
export const AppMenuLeaflet: React.FC<AppMenuLeafletProps> = ({ build }) => {
  const { locale, setLocale, translate } = useI18n()
  const navigateToLocale = useNavigateToLocale()
  const { preference, setPreference } = useThemePreference(themeStore)
  const connection = useConnection()
  const isInsideRoom = useIsInsideRoom()
  const { invitation, pauseRound, revealRound, roomVolume, setRoomVolume } =
    useRoomActions()
  const isOnCredits = useIsCurrentPath(creditsPathFor(locale))
  const isOnLegal = useIsCurrentPath(legalPathFor(locale))
  const isOnWallPairing = useIsCurrentPath(paths.wallPairing)
  const isOnWall = useIsOnWall()

  return (
    <Leaflet
      aria-label={translate('menu.label')}
      className='app-menu-leaflet'
      maxHeight={MENU_MAX_HEIGHT_PX}
      placement='bottom end'
    >
      {({ close }) => (
        <>
          {connection !== null && (
            <ConnectionStatus
              clock={connection.clock}
              status={connection.status}
            />
          )}

          {/* First, because it is the one thing a seated host opens the
                  menu mid-round to press. */}
          {revealRound !== null && (
            <Button
              isDisabled={connection?.status !== 'open'}
              onPress={() => {
                revealRound()
                close()
              }}
              variant='outlined'
            >
              {translate('host.reveal')}
            </Button>
          )}

          {pauseRound !== null && (
            <Button
              isDisabled={connection?.status !== 'open'}
              onPress={() => {
                pauseRound()
                close()
              }}
              variant='outlined'
            >
              {translate('room.pause.press')}
            </Button>
          )}

          {/*
                The room's volume, on the console alone: it reaches whichever
                screen is sounding, so a wall carries no slider of its own. In
                the menu because a buzz sounds under every game, not only the
                one that carries a track.

                With full screen, above the invitation: both are one row the
                room's screen is set with mid-game, and the square would push
                them past the fold of a sheet.
              */}
          {roomVolume !== null && setRoomVolume !== null && (
            <Slider
              formatOptions={{ style: 'percent' }}
              label={translate('preferences.volume')}
              maxValue={1}
              minValue={0}
              onChange={setRoomVolume}
              step={0.05}
              value={roomVolume}
            />
          )}

          <Fullscreen />

          {/*
                The way in once the lobby is over: the lobby's stage is the
                invitation, and past it the room's screen keeps a corner
                reminder and a player's screen nothing at all.
              */}
          {invitation !== null && <RoomInvitation roomCode={invitation} />}

          {!isInsideRoom && !isOnWall && (
            <section className='this-device'>
              <h2>{translate('menu.thisDevice.title')}</h2>
              {!isOnWallPairing && (
                <Link
                  className='become-wall'
                  href={paths.wallPairing}
                  onPress={close}
                  variant='outlined'
                >
                  <ScreenIcon />
                  <span className='name'>
                    {translate('menu.thisDevice.wall.label')}
                  </span>
                </Link>
              )}
              <ProjectWithCode onDone={close} />
            </section>
          )}

          <SegmentedControl
            label={translate('preferences.language')}
            onChange={(next) => {
              if (isLocale(next)) {
                setLocale(next)
                navigateToLocale(next)
              }
            }}
            options={LOCALES.map((value) => ({
              label: LANGUAGE_NAMES[value],
              value
            }))}
            value={locale}
          />

          <SegmentedControl
            label={translate('preferences.theme.label')}
            onChange={(next) => {
              if (isThemePreference(next)) {
                setPreference(next)
              }
            }}
            options={THEME_PREFERENCES.map((value) => ({
              label: translate(THEME_KEYS[value]),
              value
            }))}
            value={preference}
          />

          <InstallApp />

          <SeatName />

          <MenuPawn />

          <RoomExit onDone={close} />

          {/*
                The credit itself is a page. CC BY-SA §3(a)(2) names a link to
                a resource holding the required information as a reasonable
                way to satisfy attribution, and the list it asks for is longer
                than what anybody should meet while opening this to switch
                language mid-game.

                A front-door concern, and offered only there: following it out
                of a room unmounts the page and closes its socket, which the
                server reads as a screen that dropped off — a host would leave
                the round frozen on every player's screen to go and read a
                licence. The route stays, so a shared link and a reload still
                resolve.

                And not on the page it points at, for the reason the exit
                above is absent on the front door: a link to the screen it is
                drawn on is pressed and nothing happens.
              */}
          {!isInsideRoom && !isOnCredits && (
            <p className='credit'>
              <TextLink href={creditsPathFor(locale)} onPress={close}>
                {translate('credits.title')}
              </TextLink>
            </p>
          )}

          {/*
                The law asks for this one on every screen, a room's included,
                so inside a room it opens a tab of its own instead: following
                it there would close the socket the credits above are kept
                out of a room to spare.
              */}
          {!isOnLegal && (
            <p className='credit'>
              {isInsideRoom ? (
                <TextLink href={legalPathFor(locale)} target='_blank'>
                  {translate('legal.title')}
                </TextLink>
              ) : (
                <TextLink href={legalPathFor(locale)} onPress={close}>
                  {translate('legal.title')}
                </TextLink>
              )}
            </p>
          )}

          {build !== null && (
            <p className='build'>
              {build.committedAt === null
                ? translate('menu.build', { build: build.commit })
                : translate('menu.buildDated', {
                    build: build.commit,
                    date: new Intl.DateTimeFormat(locale, {
                      dateStyle: 'medium'
                    }).format(build.committedAt)
                  })}
            </p>
          )}
        </>
      )}
    </Leaflet>
  )
}
