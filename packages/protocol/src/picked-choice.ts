/**
 * How a picked candidate is recorded in the line a revealed answer says: its
 * place among the round's `choices`, which every screen holds in the same
 * order. Never the candidate's text, which would be one language's, read back
 * on a screen speaking another.
 */
export const pickedChoiceSaid = (choiceIndex: number): string =>
  String(choiceIndex)

/** The place among `choices` a revealed answer's line holds, or `null` when it holds none. */
export const pickedChoiceIndexOf = (said: string): number | null =>
  /^\d+$/.test(said) ? Number(said) : null
