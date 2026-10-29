import type {
  HostRoomView,
  HostRoundContent,
  WallRoomView,
  WallRoundContent
} from '@melee/protocol/room'

/**
 * The wall's view in the shape the room's stage draws: the host's, with every
 * secret in the state the host's own view already has for "not held" — a
 * `null` track, a `null` question, no key noted. The stage then needs no second
 * reading of the round, and has nothing on the wall to leak because the wall
 * was never sent it.
 */
export const asRoomScreenView = ({
  isSpeaker: _isSpeaker,
  ...view
}: WallRoomView): HostRoomView => ({
  ...view,
  challengeHand: [],
  currentContent:
    view.currentContent === null ? null : withheld(view.currentContent),
  lineUpPlayed: [],
  remainingPoolSize: 0,
  wallCount: 1,
  youId: null
})

const withheld = (content: WallRoundContent): HostRoundContent => {
  switch (content.kind) {
    case 'blindtest': {
      return { ...content, track: null }
    }

    case 'matchsticks': {
      return { ...content, solutions: null }
    }

    case 'quiz': {
      return { ...content, question: null }
    }

    case 'slate': {
      return { ...content, keys: content.filledCounts.map(() => null) }
    }

    case 'blacksquare': {
      return { ...content, grid: null }
    }

    case 'timeline': {
      return { ...content, datedEvents: null }
    }

    case 'petitbac': {
      return { ...content, canCancelStop: false }
    }

    case 'atlas': {
      return { ...content, answer: null }
    }

    case 'estimate': {
      return { ...content, value: null }
    }

    default: {
      return content
    }
  }
}
