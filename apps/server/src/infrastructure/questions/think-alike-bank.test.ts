import { describe, expect, it } from 'vitest'

import {
  bankedThinkAlikePrompts,
  drawThinkAlikePrompt,
  playedThinkAlikePromptId
} from './think-alike-bank'

describe('the think-alike bank', () => {
  it('[thinkalike] parses every prompt, each id once, in both languages', () => {
    const prompts = bankedThinkAlikePrompts()
    const ids = prompts.map(({ id }) => id)

    expect(prompts.length).toBeGreaterThanOrEqual(150)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('[thinkalike] words every prompt as a line, never a question to answer aloud', () => {
    expect(
      bankedThinkAlikePrompts()
        .filter(({ labels }) =>
          Object.values(labels).some((label) => /[?.!]$/u.test(label))
        )
        .map(({ id }) => id)
    ).toEqual([])
  })

  it('[thinkalike] deals a prompt the room has not heard, in its language, and any once every one has been', () => {
    const prompts = bankedThinkAlikePrompts()
    const [kept, ...rest] = prompts

    if (kept === undefined) {
      throw new Error('the bank is empty')
    }

    const allButOne = new Set(
      rest.map(({ id }) => playedThinkAlikePromptId(id))
    )

    expect(
      drawThinkAlikePrompt({ language: 'en', playedIds: allButOne })
    ).toEqual({
      id: kept.id,
      prompt: kept.labels.en
    })

    const all = new Set(prompts.map(({ id }) => playedThinkAlikePromptId(id)))

    expect(
      drawThinkAlikePrompt({ language: 'fr', playedIds: all })
    ).not.toBeNull()
  })
})
