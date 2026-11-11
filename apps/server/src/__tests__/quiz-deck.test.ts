import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Deck, QuizDeckItem } from '@melee/protocol/deck'
import { DEFAULT_QUIZ_SETTINGS, type GameSettings } from '@melee/protocol/game'
import {
  DEFAULT_MODE_SETTINGS,
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings
} from '@melee/protocol/room'

import { startRoomHarness } from './node-room-harness'
import {
  errorsIn,
  hostQuestion,
  hostView,
  playerView,
  quizRound,
  type RoomHarness,
  waitFor
} from './room-harness'

vi.mock('@/infrastructure/questions/question-bank', async () => {
  const { questionBankStub } = await import('./room-harness')

  return questionBankStub()
})

vi.mock('@/infrastructure/music/deezer-client', async () => {
  const { deezerClientStub } = await import('./room-harness')

  return deezerClientStub()
})

const GRANDMOTHER: QuizDeckItem = {
  accepted: ['Mamie Jo'],
  answer: 'Josephine',
  category: null,
  choiceOnly: false,
  decoys: ['Marguerite', 'Henriette', 'Simone'],
  note: 'She was named after her own grandmother.',
  prompt: 'What was our grandmother called?'
}

const DOG: QuizDeckItem = {
  accepted: [],
  answer: 'Biscotte',
  category: null,
  choiceOnly: false,
  decoys: ['Caramel', 'Noisette', 'Praline'],
  note: null,
  prompt: 'What was the first dog of the house called?'
}

const PICK_ONLY: QuizDeckItem = {
  ...DOG,
  answer: 'Cholet',
  choiceOnly: true,
  decoys: ['Angers', 'Saumur', 'Laval'],
  prompt: 'Which of these towns did the family live in first?'
}

const DECK_SECRETS = [
  GRANDMOTHER.answer,
  ...GRANDMOTHER.accepted,
  GRANDMOTHER.note ?? ''
]

const quizDeck = (...items: QuizDeckItem[]): Deck => ({ game: 'quiz', items })

const quizOn = ({
  game = DEFAULT_QUIZ_SETTINGS,
  mode
}: {
  game?: GameSettings
  mode: RoomSettings['mode']
}): RoomSettings => ({
  ...DEFAULT_ROOM_SETTINGS,
  countdownMs: 20,
  game,
  lineUp: [game],
  lineUpAt: 0,
  mode,
  roundCount: 5
})

const CHOICE_QUIZ = quizOn({ mode: DEFAULT_MODE_SETTINGS.choice })
const TYPED_QUIZ = quizOn({ mode: DEFAULT_MODE_SETTINGS.typed })

const transcriptOf = (peer: { frames: { raw: string }[] }): string =>
  peer.frames.map(({ raw }) => raw).join('')

describe('a quiz deck', () => {
  let harness: RoomHarness

  beforeEach(async () => {
    harness = await startRoomHarness()
  })

  afterEach(async () => {
    await harness.stop()
  })

  const roomWithDeck = async ({
    decks,
    hostNickname,
    settings
  }: {
    decks: (Deck | null)[]
    hostNickname?: string
    settings: RoomSettings
  }) => {
    const { code, host } = await harness.openRoom(settings, hostNickname)
    const zoe = await harness.seat({ code, nickname: 'Zoe' })

    await harness.seat({ code, nickname: 'Max' })
    host.send({ decks, type: 'host.setDecks' })
    await waitFor(
      () =>
        hostView(host)?.deckSummaries.some((deck) => deck !== null) === true,
      'the deck to load'
    )

    return { code, host, zoe }
  }

  const openRound = async ({
    host,
    zoe
  }: {
    host: Awaited<ReturnType<typeof roomWithDeck>>['host']
    zoe: Awaited<ReturnType<typeof roomWithDeck>>['zoe']
  }) => {
    const before = playerView(zoe)?.round?.id ?? null

    host.send({
      type: before === null ? 'host.startRound' : 'host.nextRound'
    })
    await waitFor(
      () =>
        playerView(zoe)?.phase === 'playing' &&
        playerView(zoe)?.round?.id !== before,
      'the question to open'
    )
  }

  const reveal = async ({
    host,
    zoe
  }: {
    host: Awaited<ReturnType<typeof roomWithDeck>>['host']
    zoe: Awaited<ReturnType<typeof roomWithDeck>>['zoe']
  }) => {
    host.send({
      roundId: playerView(zoe)?.round?.id ?? '',
      type: 'host.reveal'
    })
    await waitFor(
      () => quizRound(playerView(zoe))?.revealedQuestion != null,
      'the answer to be published'
    )
  }

  it('[deck] deals its questions in order, then hands over to the bank', async () => {
    const { host, zoe } = await roomWithDeck({
      decks: [quizDeck(GRANDMOTHER, DOG)],
      settings: CHOICE_QUIZ
    })

    await openRound({ host, zoe })
    expect(quizRound(playerView(zoe))?.prompt.prompt).toBe(GRANDMOTHER.prompt)
    expect(quizRound(playerView(zoe))?.prompt.category).toBeNull()
    await reveal({ host, zoe })
    expect(quizRound(playerView(zoe))?.revealedQuestion?.note).toBe(
      GRANDMOTHER.note
    )

    await openRound({ host, zoe })
    expect(quizRound(playerView(zoe))?.prompt.prompt).toBe(DOG.prompt)
    await reveal({ host, zoe })
    expect(hostView(host)?.deckSummaries).toEqual([{ played: 2, size: 2 }])

    await openRound({ host, zoe })
    expect(hostQuestion(host)?.id.startsWith('deck:')).toBe(false)
  })

  it('[deck] tells a player nothing of a dealt question before its reveal', async () => {
    const { host, zoe } = await roomWithDeck({
      decks: [quizDeck(GRANDMOTHER)],
      settings: TYPED_QUIZ
    })

    await openRound({ host, zoe })

    const beforeTheReveal = transcriptOf(zoe)

    for (const secret of DECK_SECRETS) {
      expect(beforeTheReveal).not.toContain(secret)
    }

    expect(beforeTheReveal).toContain(GRANDMOTHER.prompt)
  })

  it('[deck] tells a seated host how much of it is left, and nothing in it', async () => {
    const { host, zoe } = await roomWithDeck({
      decks: [quizDeck(GRANDMOTHER, DOG)],
      hostNickname: 'Ada',
      settings: TYPED_QUIZ
    })

    await openRound({ host, zoe })

    const beforeTheReveal = transcriptOf(host)

    for (const secret of [...DECK_SECRETS, DOG.answer, DOG.prompt]) {
      expect(beforeTheReveal).not.toContain(secret)
    }

    expect(hostView(host)?.deckSummaries).toEqual([{ played: 1, size: 2 }])
  })

  it('[deck] skips a question that needs its options in a room that types', async () => {
    const { host, zoe } = await roomWithDeck({
      decks: [quizDeck(PICK_ONLY, DOG)],
      settings: TYPED_QUIZ
    })

    await openRound({ host, zoe })

    expect(quizRound(playerView(zoe))?.prompt.prompt).toBe(DOG.prompt)
  })

  it('[deck] follows its entry when the line-up is reordered', async () => {
    const geography: GameSettings = {
      ...DEFAULT_QUIZ_SETTINGS,
      categories: ['geography']
    }
    const history: GameSettings = {
      ...DEFAULT_QUIZ_SETTINGS,
      categories: ['history']
    }
    const settings: RoomSettings = {
      ...CHOICE_QUIZ,
      game: geography,
      lineUp: [geography, history],
      lineUpAt: 0
    }
    const { host, zoe } = await roomWithDeck({
      decks: [null, quizDeck(GRANDMOTHER)],
      settings
    })

    host.send({
      settings: {
        ...settings,
        game: history,
        lineUp: [history, geography],
        lineUpAt: 0
      },
      type: 'host.updateSettings'
    })
    await waitFor(
      () => hostView(host)?.deckSummaries[0] !== null,
      'the deck to follow its entry'
    )
    await openRound({ host, zoe })

    expect(quizRound(playerView(zoe))?.prompt.prompt).toBe(GRANDMOTHER.prompt)
  })

  it('[deck] refuses a deck beside an entry of another game, and once a round has opened', async () => {
    const { host, zoe } = await roomWithDeck({
      decks: [quizDeck(GRANDMOTHER)],
      settings: CHOICE_QUIZ
    })

    host.send({ decks: [null, quizDeck(DOG)], type: 'host.setDecks' })
    await waitFor(
      () => errorsIn(host).some(({ code }) => code === 'invalid_message'),
      'the misplaced deck to be refused'
    )

    await openRound({ host, zoe })
    host.send({ decks: [quizDeck(DOG)], type: 'host.setDecks' })
    await waitFor(
      () => errorsIn(host).some(({ code }) => code === 'wrong_phase'),
      'the late deck to be refused'
    )

    expect(hostView(host)?.deckSummaries).toEqual([{ played: 1, size: 1 }])
  })
})
