/**
 * What a generated decoy has to share with its answer for the prompt to stay a
 * question. Mintaka ships no wrong answers, and drawing three from the
 * answer's widest kind put Karl Marx, Lenin and Catherine II under *quel
 * président des États-Unis était le plus grand* — three politicians, none of
 * them the thing asked for, so the room had one candidate.
 *
 * A constraint is a group of facts (`P39:Q11696`), and a decoy meets it by
 * holding **any** of them. A row's constraints are met when every group is.
 *
 * - **Sex, always, for a person.** French writes it into the prompt — *quelle
 *   actrice* — and even where it does not, a lone woman among three men is a
 *   tell.
 * - **What the question names, when the answer holds it.** Mintaka lists the
 *   entities each question is about, so *quelle actrice allemande* carries
 *   Germany, and Diane Kruger's citizenship is Germany: her decoys have to be
 *   German too. Read over country, citizenship, office and team, one group a
 *   property: *qui a joué pour les Cavs avant les Lakers* asks a decoy to
 *   have played for either, because nobody else played for both.
 * - **The office the prompt names, when the answer held one.** *Quel président
 *   américain* names the United States and not the presidency, so the
 *   presidency is found in the words: an office the answer held whose name —
 *   *président* out of *président des États-Unis* — starts a word of the
 *   prompt, so *l'élection présidentielle* names it too.
 */

export type DecoyConstraint = readonly string[]

const NAMED_BY_THE_QUESTION = ['P17', 'P27', 'P39', 'P54']

const SEX = 'P21'

const OFFICE = 'P39'

/** What an office is called before what it is an office of: *président* out of *président des États-Unis*. */
const OFFICE_QUALIFIER = /\s(?:de|du|des|of)\s|\sd['’]/u

const wordsOf = (text: string): string[] =>
  text
    .toLocaleLowerCase('fr')
    .split(/[\s'’,.;:!?«»()"]+/u)
    .filter((word) => word !== '')

const officeTitleOf = (label: string): string[] =>
  wordsOf(label.split(OFFICE_QUALIFIER)[0] ?? label)

const namesTheOffice = ({
  label,
  promptWords
}: {
  label: string
  promptWords: readonly string[]
}): boolean => {
  const title = officeTitleOf(label)

  return (
    title.length > 0 &&
    promptWords.some((_, start) =>
      title.every(
        (word, offset) => promptWords[start + offset]?.startsWith(word) === true
      )
    )
  )
}

const propertyOf = (fact: string): string => fact.split(':')[0] ?? fact

const entityOfFact = (fact: string): string => fact.split(':')[1] ?? fact

export const constraintsOf = ({
  answerFacts,
  officeLabels,
  prompt,
  questionEntities
}: {
  /** The answer's facts, `P27:Q30`. */
  answerFacts: readonly string[]
  /** The French name of each office the answer held, by its entity id. */
  officeLabels: ReadonlyMap<string, string>
  prompt: string
  /** The entities Mintaka says the question is about. */
  questionEntities: readonly string[]
}): DecoyConstraint[] => {
  const named = new Set(questionEntities)
  const promptWords = wordsOf(prompt)

  const sex = answerFacts.filter((fact) => propertyOf(fact) === SEX)
  const namedByTheQuestion = NAMED_BY_THE_QUESTION.map((property) =>
    answerFacts.filter(
      (fact) => propertyOf(fact) === property && named.has(entityOfFact(fact))
    )
  )
  const officesInThePrompt = answerFacts.filter((fact) => {
    const label = officeLabels.get(entityOfFact(fact))

    return (
      propertyOf(fact) === OFFICE &&
      label !== undefined &&
      namesTheOffice({ label, promptWords })
    )
  })

  const groups = [sex, ...namedByTheQuestion, officesInThePrompt].filter(
    (group) => group.length > 0
  )

  return groups.filter(
    (group, index) =>
      groups.findIndex((other) => other.join() === group.join()) === index
  )
}

export const meetsConstraints = ({
  constraints,
  facts
}: {
  constraints: readonly DecoyConstraint[]
  facts: readonly string[]
}): boolean =>
  constraints.every((group) => group.some((fact) => facts.includes(fact)))

/** The same constraints as one string, so rows that share them share a pool. */
export const constraintKeyOf = (
  constraints: readonly DecoyConstraint[]
): string => constraints.map((group) => group.join('|')).join('&')
