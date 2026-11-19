import { describe, expect, it } from 'vitest'

import { isJudgedInEveryMode } from './game-modes'
import { shelfCards } from './shelf-cards'
import { familyGames, hostTools } from './shelf-families'

describe('the home shelf’s rows', () => {
  it('[shelf] puts every card in exactly one row, a family or the host’s tools', () => {
    const shelved = [...familyGames, ...hostTools]

    expect(shelved.toSorted()).toEqual(shelfCards.toSorted())
  })

  it('[shelf] keeps the tools to the games the host judges however they are answered', () => {
    expect(hostTools.toSorted()).toEqual(
      shelfCards.filter((game) => isJudgedInEveryMode(game)).toSorted()
    )
  })
})
