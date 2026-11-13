import type { PlayerId } from '@melee/protocol/identifiers'
import type { ThinkAlikeGroup } from '@melee/protocol/think-alike'

import { compareText } from '../helpers/collation'
import { answerGroupKey } from '../round/answer-groups'

/**
 * A final `s` or `x` on a word of four letters or more, punctuation after it
 * allowed. Three letters keep theirs — *jus*, *bus*, *lys* — where the fold
 * would make a different word.
 */
const PLURAL_ENDING = /(\p{L}{3,})[sx](?=\P{L}*$)/iu

const withoutPlural = (word: string): string =>
  word.replace(PLURAL_ENDING, '$1')

/**
 * The shared normalisation with a plural fold: *Fraises* and *une fraise* are
 * one crowd. A word that ends in `s` in the singular — *souris* — loses it on
 * every spelling alike, so it splits nobody from their crowd. Nothing closer
 * folds: *frigo* and *réfrigérateur* are the host's merge.
 */
export const crowdKey = (text: string): string =>
  answerGroupKey(text.split(/\s+/u).map(withoutPlural).join(' '))

export type CrowdAnswer = {
  playerId: PlayerId
  text: string
}

/** One group put into another by the console, by their crowd keys. */
export type CrowdMerge = {
  from: string
  into: string
}

/**
 * Where a key ends up once every merge is followed: a group merged into one
 * that was itself merged lands at the end of the chain.
 */
const rootOf = ({
  intoByFrom,
  key
}: {
  intoByFrom: ReadonlyMap<string, string>
  key: string
}): string => {
  const passed = new Set([key])
  let root = key

  for (
    let next = intoByFrom.get(root);
    next !== undefined && !passed.has(next);
    next = intoByFrom.get(root)
  ) {
    passed.add(next)
    root = next
  }

  return root
}

const mostWritten = (texts: readonly string[]): string => {
  const counts = new Map<string, number>()

  for (const text of texts) {
    counts.set(text, (counts.get(text) ?? 0) + 1)
  }

  return (
    [...counts]
      .toSorted(
        ([one, oneCount], [other, otherCount]) =>
          otherCount - oneCount || compareText(one, other)
      )
      .map(([text]) => text)[0] ?? ''
  )
}

/**
 * What the room wrote, one group per crowd once the console's merges are
 * applied, in the order the reveal turns them over: the smallest first, ties
 * by spelling, so the biggest crowd comes last. A blank is in no group. A
 * merged group keeps the spelling of the group it went into.
 */
export const crowdGroups = ({
  answers,
  merges
}: {
  answers: readonly CrowdAnswer[]
  merges: readonly CrowdMerge[]
}): ThinkAlikeGroup[] => {
  const byKey = new Map<string, CrowdAnswer[]>()

  for (const answer of answers) {
    const key = crowdKey(answer.text)

    if (key !== '') {
      byKey.set(key, [...(byKey.get(key) ?? []), answer])
    }
  }

  const intoByFrom = new Map<string, string>()

  for (const { from, into } of merges) {
    const closesALoop = rootOf({ intoByFrom, key: into }) === from

    if (byKey.has(from) && byKey.has(into) && !closesALoop) {
      intoByFrom.set(from, into)
    }
  }

  const groups = new Map<string, ThinkAlikeGroup>()

  for (const [key, members] of byKey) {
    const root = rootOf({ intoByFrom, key })
    const group = groups.get(root) ?? {
      authors: [],
      key: root,
      mergedKeys: [],
      text: mostWritten((byKey.get(root) ?? []).map(({ text }) => text.trim()))
    }

    group.authors.push(...members.map(({ playerId }) => playerId))

    if (key !== root) {
      group.mergedKeys.push(key)
    }

    groups.set(root, group)
  }

  return [...groups.values()]
    .map((group) => ({ ...group, mergedKeys: group.mergedKeys.toSorted() }))
    .toSorted(
      (one, other) =>
        one.authors.length - other.authors.length ||
        compareText(one.text, other.text)
    )
}
