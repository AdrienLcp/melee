import { describe, expect, it } from 'vitest'

import { fillLetterSlot, SLOT_LETTERS } from './letter-slot'

const LINE = {
  en: 'Bring back something that starts with {letter}',
  fr: 'Rapportez quelque chose qui commence par {letter}'
}

describe('the letter a line is dealt with', () => {
  it('[challenge] fills one letter in every locale', () => {
    expect(fillLetterSlot({ labels: LINE, unit: 0 })).toEqual({
      en: 'Bring back something that starts with A',
      fr: 'Rapportez quelque chose qui commence par A'
    })
  })

  it('[challenge] reaches the last letter and never past it', () => {
    expect(fillLetterSlot({ labels: LINE, unit: 0.999_999 }).en).toBe(
      `Bring back something that starts with ${SLOT_LETTERS.at(-1)}`
    )
  })

  it('[challenge] leaves a line without a slot as it is', () => {
    const labels = { en: 'Bring back a key', fr: 'Rapportez une clé' }

    expect(fillLetterSlot({ labels, unit: 0.5 })).toEqual(labels)
  })
})
