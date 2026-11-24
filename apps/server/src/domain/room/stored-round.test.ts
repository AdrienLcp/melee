import { describe, expect, it } from 'vitest'

import { withClipSpan, withHoldFields } from './stored-round'

describe('a round stored before the ready hold', () => {
  it('[stored] reads as counting the setting’s hold, with nothing waived', () => {
    expect(withHoldFields({ advancesAt: 42_000 })).toEqual({
      advancesAt: 42_000,
      isHoldWaived: false,
      isReadyHold: false,
      settingHoldEndsAt: 42_000
    })
  })

  it('[stored] keeps the fields a current round already carries', () => {
    const current = {
      advancesAt: 5_000,
      isHoldWaived: false,
      isReadyHold: true,
      settingHoldEndsAt: 20_000
    }

    expect(withHoldFields(current)).toEqual(current)
  })
})

describe('a blind test round stored before a flash existed', () => {
  const track = {
    artist: 'Toto',
    coverUrl: null,
    film: null,
    id: '1079668',
    previewUrl: 'https://cdn.example/africa.mp3',
    title: 'Africa'
  }
  const stored = {
    content: {
      choices: [],
      correctChoiceIndex: null,
      kind: 'blindtest' as const,
      playback: { isPaused: false, restarts: 0 },
      track
    }
  }

  it('[stored] plays its whole clip from the top', () => {
    expect(withClipSpan(stored).content).toEqual({
      ...stored.content,
      clip: { startMs: 0, windowMs: null }
    })
  })

  it('[stored] keeps the span a current round carries', () => {
    const current = {
      content: { ...stored.content, clip: { startMs: 10_000, windowMs: 1_000 } }
    }

    expect(withClipSpan(current)).toEqual(current)
  })
})
