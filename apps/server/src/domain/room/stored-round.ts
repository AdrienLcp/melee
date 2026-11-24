import { clipSpanFor } from '@melee/core/blindtest/clip-audio'

import type { Round } from './room'

type HoldFields = Pick<
  Round,
  'isHoldWaived' | 'isReadyHold' | 'settingHoldEndsAt'
>

/**
 * A round as the Durable Object stored it, which may predate the ready hold: a
 * room outlives a deploy, and a round missing these fields put `undefined` on
 * a view the schema refuses, so every screen of that room lost its snapshot.
 * The hold it was counting is the setting's, the only one that existed.
 */
export const withHoldFields = <T extends Pick<Round, 'advancesAt'>>(
  round: T & Partial<HoldFields>
): T & HoldFields => ({
  ...round,
  isHoldWaived: round.isHoldWaived ?? false,
  isReadyHold: round.isReadyHold ?? false,
  settingHoldEndsAt: round.settingHoldEndsAt ?? round.advancesAt
})

type BlindtestContent = Extract<Round['content'], { kind: 'blindtest' }>

/** A round's content as storage may hand it back: a blind test's without its span. */
type StoredContent = Round['content'] | Omit<BlindtestContent, 'clip'>

/**
 * A blind test round stored before a flash existed, which played its whole
 * clip from the top: without its span the view put `undefined` where the
 * schema wants one, and the room lost its snapshot on every screen.
 */
export const withClipSpan = <T extends { content: StoredContent }>(
  round: T
): Omit<T, 'content'> & Pick<Round, 'content'> => {
  const { content } = round

  if (content.kind !== 'blindtest') {
    return { ...round, content }
  }

  return {
    ...round,
    content: {
      ...content,
      clip: 'clip' in content ? content.clip : clipSpanFor(null)
    }
  }
}
