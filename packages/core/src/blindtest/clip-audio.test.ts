import { describe, expect, it } from 'vitest'

import {
  CLIP_STALL_MS,
  clipRecoveryFor,
  clipRefusalFor,
  clipSpanFor,
  FLASH_START_MS,
  hasPlayedClipWindow,
  isClipStalled,
  isClipUnheard,
  isClipWindowOpen,
  seekTargetMs
} from './clip-audio'

describe('seekTargetMs', () => {
  it('[clip] leaves a clip that is where the room is', () => {
    expect(
      seekTargetMs({ elapsedMs: 12_000, playedMs: 11_800, startMs: 0 })
    ).toBeNull()
  })

  /**
   * A buzz pauses the clip and the round's clock together, so the two are still
   * on the same second when it resumes. Seeking there would be a jump nobody
   * asked for.
   */
  it('[clip] leaves a clip a buzz paused', () => {
    expect(
      seekTargetMs({ elapsedMs: 8_400, playedMs: 8_400, startMs: 0 })
    ).toBeNull()
  })

  it('[clip] catches up a screen that arrived mid-round', () => {
    expect(seekTargetMs({ elapsedMs: 20_000, playedMs: 0, startMs: 0 })).toBe(
      20_000
    )
  })

  /**
   * Only ever forward: a clip ahead of the round is a rounding error or a
   * decoder that ran on, and yanking it back is audible where letting it run is
   * not.
   */
  /**
   * A flash opens ten seconds into the preview, so a speaker reloading inside
   * its window is behind by those ten seconds as well as by the round.
   */
  it('[clip] catches up to where a late-starting clip is', () => {
    expect(
      seekTargetMs({ elapsedMs: 300, playedMs: 0, startMs: FLASH_START_MS })
    ).toBe(FLASH_START_MS + 300)
    expect(
      seekTargetMs({
        elapsedMs: 300,
        playedMs: FLASH_START_MS + 300,
        startMs: FLASH_START_MS
      })
    ).toBeNull()
  })

  it('[clip] never drags a clip backwards', () => {
    expect(
      seekTargetMs({ elapsedMs: 9_000, playedMs: 12_000, startMs: 0 })
    ).toBeNull()
  })
})

describe('clipSpanFor', () => {
  it('[clip] plays a whole round from the top of the preview', () => {
    expect(clipSpanFor(null)).toEqual({ startMs: 0, windowMs: null })
  })

  it('[clip] opens a flash past the slow intros', () => {
    expect(clipSpanFor(1_000)).toEqual({
      startMs: FLASH_START_MS,
      windowMs: 1_000
    })
  })
})

describe('isClipWindowOpen', () => {
  const FLASH = clipSpanFor(1_000)

  it('[clip] sounds a whole round to its end', () => {
    expect(
      isClipWindowOpen({ elapsedMs: 29_000, span: clipSpanFor(null) })
    ).toBe(true)
  })

  it('[clip] sounds a flash inside its window', () => {
    expect(isClipWindowOpen({ elapsedMs: 0, span: FLASH })).toBe(true)
    expect(isClipWindowOpen({ elapsedMs: 999, span: FLASH })).toBe(true)
  })

  /** A reload, a resumed pause or a wrong buzz after the second hears nothing more. */
  it('[clip] keeps a flash silent once its window has passed', () => {
    expect(isClipWindowOpen({ elapsedMs: 1_000, span: FLASH })).toBe(false)
    expect(isClipWindowOpen({ elapsedMs: 12_000, span: FLASH })).toBe(false)
  })
})

describe('hasPlayedClipWindow', () => {
  const FLASH = clipSpanFor(500)

  it('[clip] never stops a whole round', () => {
    expect(
      hasPlayedClipWindow({ playedMs: 30_000, span: clipSpanFor(null) })
    ).toBe(false)
  })

  /** Read off the preview, so a clip that started late still sounds the whole window. */
  it('[clip] stops a flash once its window has played', () => {
    expect(
      hasPlayedClipWindow({ playedMs: FLASH_START_MS + 499, span: FLASH })
    ).toBe(false)
    expect(
      hasPlayedClipWindow({ playedMs: FLASH_START_MS + 500, span: FLASH })
    ).toBe(true)
  })
})

describe('isClipUnheard', () => {
  const RUNNING = { canPlay: false, hasClip: true, phase: 'playing' } as const

  it('[clip] says so when a screen with no element is on a running clip', () => {
    expect(isClipUnheard(RUNNING)).toBe(true)
    expect(isClipUnheard({ ...RUNNING, phase: 'countdown' })).toBe(true)
  })

  it('[clip] says nothing once a press has blessed an element', () => {
    expect(isClipUnheard({ ...RUNNING, canPlay: true })).toBe(false)
  })

  /**
   * Three of the four games serve no audio, and the blind test's own reveal is
   * past the clip. Offering to start music there would be a screen apologising
   * for silence that is the design.
   */
  it('[clip] says nothing where there is no clip to hear', () => {
    expect(isClipUnheard({ ...RUNNING, hasClip: false })).toBe(false)

    for (const phase of ['lobby', 'buzzed', 'revealed', 'finished'] as const) {
      expect(isClipUnheard({ ...RUNNING, phase })).toBe(false)
    }
  })
})

describe('clipRefusalFor', () => {
  /**
   * The one that must stay silent. A round is driven by the server, so a clip
   * cut short by the next `load()` has cost the room nothing — and a screen
   * apologising for it would be a screen apologising for working.
   */
  it('[clip] does not call an abort a refusal', () => {
    expect(clipRefusalFor('AbortError')).toBeNull()
  })

  it('[clip] tells a policy refusal from a source it cannot play', () => {
    expect(clipRefusalFor('NotAllowedError')).toBe('blocked')
    expect(clipRefusalFor('NotSupportedError')).toBe('unsupported')
  })

  /**
   * A rejection nobody anticipated is still a screen that will not sound, and
   * the console has to say so — throwing it away is the whole fault this
   * classification exists to end.
   */
  it('[clip] owns up to a rejection it cannot name', () => {
    expect(clipRefusalFor('QuotaExceededError')).toBe('broken')
    expect(clipRefusalFor(null)).toBe('broken')
  })
})

describe('isClipStalled', () => {
  it('[clip] gives a clip that has just been told to play time to buffer', () => {
    expect(
      isClipStalled({
        hasEnded: false,
        nowMs: CLIP_STALL_MS - 1,
        stillSinceMs: 0
      })
    ).toBe(false)
  })

  it('[clip] calls a clip silent once it has sat on one second too long', () => {
    expect(
      isClipStalled({ hasEnded: false, nowMs: CLIP_STALL_MS, stillSinceMs: 0 })
    ).toBe(true)
  })

  it('[clip] never calls a clip that ran to its end silent', () => {
    expect(
      isClipStalled({ hasEnded: true, nowMs: 60_000, stillSinceMs: 0 })
    ).toBe(false)
  })
})

describe('clipRecoveryFor', () => {
  it('[clip] loads a clip that would not sound once more before saying so', () => {
    expect(clipRecoveryFor({ clip: 'r1 a.mp3', retriedClip: null })).toBe(
      'reload'
    )
    expect(clipRecoveryFor({ clip: 'r1 a.mp3', retriedClip: 'r1 a.mp3' })).toBe(
      'report'
    )
  })

  it('[clip] retries the next round and a replaced clip afresh', () => {
    expect(clipRecoveryFor({ clip: 'r2 a.mp3', retriedClip: 'r1 a.mp3' })).toBe(
      'reload'
    )
    expect(clipRecoveryFor({ clip: 'r1 b.mp3', retriedClip: 'r1 a.mp3' })).toBe(
      'reload'
    )
  })
})
