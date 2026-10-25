import { describe, expect, it } from 'vitest'

import { withOwnLinesImported } from './own-lines-import'

const line = (text: string) => ({ isPlayed: false, text })

describe('withOwnLinesImported', () => {
  it('[own-lines] adds the lines not already written, once each, after the kept ones', () => {
    const merged = withOwnLinesImported({
      imported: [line(' sing a song '), line('Dance'), line('dance')],
      lines: [line('Sing a song'), line('Mime a film')],
      max: 60
    })

    expect(merged.map(({ text }) => text)).toEqual([
      'Sing a song',
      'Mime a film',
      'Dance'
    ])
  })

  it('[own-lines] stops at the most a host keeps, keeping the lines already here', () => {
    const merged = withOwnLinesImported({
      imported: [line('Dance'), line('Whistle')],
      lines: [line('Sing a song'), line('Mime a film')],
      max: 3
    })

    expect(merged.map(({ text }) => text)).toEqual([
      'Sing a song',
      'Mime a film',
      'Dance'
    ])
  })
})
