import type React from 'react'

import type { ClientMessage } from '@melee/protocol/client-message'
import type {
  HostRoomView,
  PlayStyle,
  RoomSettings
} from '@melee/protocol/room'
import type { TrackSource } from '@melee/protocol/track'

import type { HostPreferences } from '@melee/core/room/host-preferences'

import { FinishedActions } from './finished-actions'
import type { InnerclockTarget } from './innerclock-target-field'
import { LobbyActions } from './lobby-actions'
import { RevealActions } from './reveal-actions'
import { RoundActions } from './round-actions'
import { SlateCorrectionActions, SlateWritingActions } from './slate-stages'
import type { SlateWall } from './use-slate-wall'

/** The line a challenge round opens on, held on the console until the press that sends it. */
export type ChallengeLine = {
  onChange: (text: string) => void
  text: string
}

export type HostActionsProps = {
  /** `null` unless the next round is a challenge. */
  challengeLine: ChallengeLine | null
  /** `null` unless the next round is an inner clock. */
  innerclockTarget: InnerclockTarget | null
  /** What the picker is showing, which `onOpenRound` commits — so it is what the next round will be built from. */
  draftSource: TrackSource | null
  /** The socket is open. Every control here sends a frame, so none of them work without it. */
  isLive: boolean
  /** Sets how the rounds from here are played: everyone at once, by team, one per team or in duels. */
  onPlayStyle: (playStyle: PlayStyle) => void
  /** Commits the picker's draft and blesses the audio element — every control that opens a round calls it first. */
  onOpenRound: () => void
  /** Seats this console under the name and starts the first round once the seat is granted — the empty lobby's launch. */
  onPlayRightAway: (nickname: string) => void
  /** The console's one way of changing a setting, which also remembers it. */
  onSettingsChange: (settings: RoomSettings) => void
  /** What this host last left each game set to, so a game drawn or picked opens as they like it. */
  preferences: HostPreferences | null
  /**
   * How the host wishes the rounds played, kept on this screen and sent with
   * every press that opens a round — granted only where a round can be one team's.
   */
  playStyle: PlayStyle
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

      // The one round that ends without being ended: a heat closes when
      // everyone expected in it has acted, and the press window closes it when
      // somebody never does. There is no answer to give and no field to
      // reopen, so there is nothing here to press — which is also what leaves
      // the screen the room is staring at with nothing on it that moves.
      // A challenge is placed, or given to nobody, from the stage, beside the
      // teams it is placing.
      return props.view.round?.content.kind === 'reflex' ||
        props.view.round?.content.kind === 'innerclock' ||
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
