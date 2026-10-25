import type {
  HostRoomView,
  HostRoundContent,
  RoundContent,
  RoundView
} from '@melee/protocol/room'
import type { HalvesVerdict, Verdict } from '@melee/protocol/scoring'
import {
  type DatedTimelineEvent,
  TIMELINE_ORDER_SEPARATOR
} from '@melee/protocol/timeline'

/**
 * A round's content is a union, and a screen only ever renders one arm of it.
 * Narrowing at every call site says nothing there — `content.kind === 'quiz'`
 * beside a component already named for the quiz — so it is spelled once here.
 */
export const blindtestContent = (
  round: RoundView | null | undefined
): Extract<RoundContent, { kind: 'blindtest' }> | null =>
  round?.content.kind === 'blindtest' ? round.content : null

export const quizContent = (
  round: RoundView | null | undefined
): Extract<RoundContent, { kind: 'quiz' }> | null =>
  round?.content.kind === 'quiz' ? round.content : null

export const innerclockContent = (
  round: RoundView | null | undefined
): Extract<RoundContent, { kind: 'innerclock' }> | null =>
  round?.content.kind === 'innerclock' ? round.content : null

export const matchsticksContent = (
  round: RoundView | null | undefined
): Extract<RoundContent, { kind: 'matchsticks' }> | null =>
  round?.content.kind === 'matchsticks' ? round.content : null

export const reflexContent = (
  round: RoundView | null | undefined
): Extract<RoundContent, { kind: 'reflex' }> | null =>
  round?.content.kind === 'reflex' ? round.content : null

export const slateContent = (
  round: RoundView | null | undefined
): Extract<RoundContent, { kind: 'slate' }> | null =>
  round?.content.kind === 'slate' ? round.content : null

export const guessNineContent = (
  round: RoundView | null | undefined
): Extract<RoundContent, { kind: 'guessnine' }> | null =>
  round?.content.kind === 'guessnine' ? round.content : null

export const timelineContent = (
  round: RoundView | null | undefined
): Extract<RoundContent, { kind: 'timeline' }> | null =>
  round?.content.kind === 'timeline' ? round.content : null

export const worldmapContent = (
  round: RoundView | null | undefined
): Extract<RoundContent, { kind: 'worldmap' }> | null =>
  round?.content.kind === 'worldmap' ? round.content : null

/** The map a round is played on: France for one of its cities, the world for a country or a capital. */
export const mapRegionOf = (
  content: Extract<RoundContent, { kind: 'worldmap' }>
): 'france' | 'world' => (content.target.kind === 'city' ? 'france' : 'world')

/** The same over the half only the host is sent. */
export const blindtestHostContent = (
  view: HostRoomView | null | undefined
): Extract<HostRoundContent, { kind: 'blindtest' }> | null =>
  view?.currentContent?.kind === 'blindtest' ? view.currentContent : null

export const quizHostContent = (
  view: HostRoomView | null | undefined
): Extract<HostRoundContent, { kind: 'quiz' }> | null =>
  view?.currentContent?.kind === 'quiz' ? view.currentContent : null

export const slateHostContent = (
  view: HostRoomView | null | undefined
): Extract<HostRoundContent, { kind: 'slate' }> | null =>
  view?.currentContent?.kind === 'slate' ? view.currentContent : null

/**
 * Whether the host still holds what this round is judged against. A host who
 * took a seat is sent neither the track nor the question — that screen is a
 * player's then — so the panel that judges a buzz would have nothing to show,
 * which is why the seat is refused in buzzer mode rather than the panel being
 * rendered empty.
 *
 * A game whose question the room owns is always holding it: it never left.
 */
export const holdsTheAnswer = (content: HostRoundContent): boolean => {
  switch (content.kind) {
    case 'blindtest':
      return content.track !== null
    // Neither hands this screen an answer a seat could take away: the bare
    // buzzer's question is the room's, and the reflex race has no answer
    // anywhere, only who was first. The slate's console is never seated, so
    // its sheets never leave it.
    case 'buzzer':
    case 'challenge':
    case 'innerclock':
    case 'petitbac':
    case 'reflex':
    case 'slate':
    case 'worldmap':
      return true
    case 'guessnine':
      return content.grid !== null
    case 'matchsticks':
      return content.solutions !== null
    case 'quiz':
      return content.question !== null
    case 'timeline':
      return content.datedEvents !== null
  }
}

/**
 * And over what the reader has banked, which a typed field reads to know what
 * is still owed — two halves in the blind test, one claim everywhere else.
 */
export const bankedHalves = (
  verdict: Verdict | null | undefined
): HalvesVerdict | null => (verdict?.kind === 'halves' ? verdict : null)

/** How far a seat's marker landed from the country or the city, `null` for a seat that placed none or a round off the map. */
export const distanceOf = (
  round: RoundView,
  playerId: string
): number | null => {
  const verdict = round.awards.find(
    (award) => award.playerId === playerId
  )?.verdict

  return verdict?.kind === 'distance' ? verdict.distanceKm : null
}

/** How many pairs a seat put the wrong way round, `null` for a seat that sent no order or a round off the timeline. */
export const swappedPairsOf = (
  round: RoundView,
  playerId: string
): number | null => {
  const verdict = round.awards.find(
    (award) => award.playerId === playerId
  )?.verdict

  return verdict?.kind === 'order' ? verdict.swappedPairs : null
}

/**
 * How many better results lie above the one a seat's move made — `0` for the
 * answer — and `null` before the reveal, for a move that answers nothing, and
 * for a seat that sent none.
 */
export const placesFromBestOf = (
  round: RoundView,
  playerId: string
): number | null => {
  const verdict = round.awards.find(
    (award) => award.playerId === playerId
  )?.verdict

  return verdict?.kind === 'move' ? verdict.placesFromBest : null
}

/**
 * The order a seat sent, read back from its revealed answer with every year
 * now on it, or `null` before the reveal and for a seat that sent none. Its
 * own screen forgets the order on a reload, and the server's line is the one
 * record of it.
 */
export const sentOrderOf = (
  round: RoundView,
  playerId: string | null
): DatedTimelineEvent[] | null => {
  const dated = timelineContent(round)?.revealedEvents ?? null
  const said = round.revealedAnswers.find(
    (answer) => answer.playerId === playerId
  )?.said

  if (dated === null || said === undefined) {
    return null
  }

  const sent = said
    .split(TIMELINE_ORDER_SEPARATOR)
    .map((id) => dated.find((event) => event.id === id))
    .filter((event) => event !== undefined)

  return sent.length === dated.length ? sent : null
}

/**
 * How far a seat landed from the answer — kilometres on the map, pairs swapped
 * on the timeline, better results above a moved stick's — every seat without
 * one level last: a subtraction of two
 * infinities is `NaN`, which no sort survives.
 */
export const nearnessOf = (round: RoundView, playerId: string): number =>
  distanceOf(round, playerId) ??
  swappedPairsOf(round, playerId) ??
  placesFromBestOf(round, playerId) ??
  Number.MAX_VALUE

/**
 * The answers in the order the reveal reads them: nearest first on the world
 * map, the timeline and a moved stick, where how far is the result, and as the server sent
 * them in every other game.
 */
export const revealedInOrder = (
  round: RoundView
): RoundView['revealedAnswers'] =>
  worldmapContent(round) === null &&
  timelineContent(round) === null &&
  matchsticksContent(round) === null
    ? round.revealedAnswers
    : round.revealedAnswers.toSorted(
        (left, right) =>
          nearnessOf(round, left.playerId) - nearnessOf(round, right.playerId)
      )
