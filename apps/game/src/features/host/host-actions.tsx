import type React from 'react'

import type { ClientMessage } from '@melee/protocol/client-message'
import type { HostRoomView, RoomSettings } from '@melee/protocol/room'
import type { TrackSource } from '@melee/protocol/track'

import type { HostPreferences } from '@melee/core/room/host-preferences'

import { Button } from '@/presentation/components/button'
import { useTranslate } from '@/presentation/i18n/i18n-provider'

import type { ChallengeLine } from './challenge-line'
import { FinishedActions } from './finished-actions'
import type { InnerclockTarget } from './innerclock-target-field'
import { LobbyActions } from './lobby-actions'
import { PetitBacActions } from './petit-bac-actions'
import { RevealActions } from './reveal-actions'
import { RoundActions } from './round-actions'
import { SlateCorrectionActions, SlateWritingActions } from './slate-stages'
import type { SlateWall } from './use-slate-wall'

export type HostActionsProps = {
  /** `null` unless the next round is a challenge. */
  challengeLine: ChallengeLine | null
  /** `null` unless the next round is an inner clock. */
  innerclockTarget: InnerclockTarget | null
  /** What the picker is showing, which `onOpenRound` commits — so it is what the next round will be built from. */
  draftSource: TrackSource | null
  /** The socket is open. Every control here sends a frame, so none of them work without it. */
  isLive: boolean
  /** Commits the picker's draft and blesses the audio element — every control that opens a round calls it first. */
  onOpenRound: () => void
  /** Seats this console under the name and starts the first round once the seat is granted — the empty lobby's launch. */
  onPlayRightAway: (nickname: string) => void
  /** The console's one way of changing a setting, which also remembers it. */
  onSettingsChange: (settings: RoomSettings) => void
  /** What this host last left each game set to, so a game drawn or picked opens as they like it. */
  preferences: HostPreferences | null
  send: (message: ClientMessage) => boolean
  /** The answer key this host prepared, sent with the press that opens a slate; absent on any other game. */
  slateKeys: (string | null)[] | undefined
  /** Whether the slate's console is showing the wall or the sheets. */
  slateWall: SlateWall
  view: HostRoomView
}

/**
 * What the host can press, which is a different set in every phase.
 *
 * Every one of these sends a frame, and a frame written to a socket that is not
 * open is dropped with nothing to show for it. Disabled while the connection is
 * away is the honest state: the press would be a no-op, and a control that
 * answers nothing reads as a broken game rather than a broken link.
 */
export const HostActions: React.FC<HostActionsProps> = (props) => {
  // The stage hides the round while it is paused, so nothing that acts on the
  // round is offered either — the server would refuse it. Pausing is the
  // menu's, see `pauseRound`.
  return props.view.isPaused ? (
    <ResumeButton {...props} />
  ) : (
    <PhaseActions {...props} />
  )
}

/** Mid-round, the phases a pause can hold. */
export const MID_ROUND_PHASES: ReadonlySet<HostRoomView['phase']> = new Set([
  'countdown',
  'playing',
  'buzzed'
])

/** The one press of a paused room, so it is the filled piece. */
const ResumeButton: React.FC<HostActionsProps> = ({ isLive, send, view }) => {
  const translate = useTranslate()

  return (
    <Button
      isDisabled={!isLive}
      onPress={() => {
        if (view.round !== null) {
          send({ isPaused: false, roundId: view.round.id, type: 'host.pause' })
        }
      }}
      variant='filled'
    >
      {translate('room.pause.resume')}
    </Button>
  )
}

const PhaseActions: React.FC<HostActionsProps> = (props) => {
  switch (props.view.phase) {
    case 'lobby':
      return <LobbyActions {...props} />
    case 'countdown':
    case 'playing':
      // The slate writes and marks in one phase, and `host.reveal` is refused
      // while an item is still open — its answers have not been on the wall.
      if (props.view.round?.content.kind === 'slate') {
        return props.slateWall.isOnWall ? (
          <SlateCorrectionActions {...props} wall={props.slateWall} />
        ) : (
          <SlateWritingActions {...props} wall={props.slateWall} />
        )
      }

      // The sheets close on the clock or a stop and the vote moves on by
      // category, so a reveal is the last category's to make.
      if (props.view.round?.content.kind === 'petitbac') {
        return <PetitBacActions {...props} />
      }

      // The one round that ends without being ended: a heat closes when
      // everyone expected in it has acted, and the press window closes it when
      // somebody never does — within seconds, so there is nothing to press.
      // The inner clock waits up to a quarter past its target, minutes on a
      // long count, so the host can stop it; the press is a still word on the
      // console and tells the room nothing about the time.
      // A challenge is placed, or given to nobody, from the stage, beside the
      // teams it is placing.
      // Nothing is on the stage yet during the countdown, so nothing to give away.
      return props.view.phase === 'countdown' ||
        props.view.round?.content.kind === 'reflex' ||
        props.view.round?.content.kind === 'challenge' ? null : (
        <RoundActions {...props} />
      )
    // The floor is held, and the only thing left to decide is the verdict —
    // which the stage owns, beside the answer it is judged against.
    case 'buzzed':
      return null
    case 'revealed':
      return <RevealActions {...props} />
    case 'finished':
      return <FinishedActions {...props} />
  }
}
