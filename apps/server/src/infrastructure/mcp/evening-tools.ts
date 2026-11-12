import { z } from 'zod'

import {
  BLACK_SQUARE_DECK_MAX_ALIASES,
  BLACK_SQUARE_DECK_MAX_ANSWERS,
  BLACK_SQUARE_DECK_MAX_THEMES,
  BLACK_SQUARE_DECK_MIN_ANSWERS,
  BLACK_SQUARE_DECK_NAME_MAX_LENGTH,
  LINE_DECK_MAX_ITEMS,
  QUANTITY_DECK_MAX_ITEMS,
  QUIZ_DECK_MAX_ITEMS,
  TIMELINE_DECK_MAX_ITEMS
} from '@melee/protocol/deck'
import {
  QUANTITY_PROMPT_MAX_LENGTH,
  QUANTITY_UNIT_MAX_LENGTH
} from '@melee/protocol/estimate'
import {
  EVENING_LINK_MAX_CHARS,
  type Evening,
  eveningSchema
} from '@melee/protocol/evening'
import { DEFAULT_GAME_SETTINGS, gameKinds } from '@melee/protocol/game'
import { HIGHER_LOWER_NAME_MAX_LENGTH } from '@melee/protocol/higher-lower'
import { localeSchema } from '@melee/protocol/locale'
import { EVENING_PAGE_ROUTE, fillRoute } from '@melee/protocol/routes'

import { MIN_ANSWERS_PER_TIER } from '@melee/core/blacksquare/theme-checks'
import {
  SPOT_ON_RATIO,
  ZERO_PAY_RATIO
} from '@melee/core/estimate/estimate-pay'
import { MIN_PAIR_RATIO } from '@melee/core/higherlower/pair-deal'
import { deckProblems } from '@melee/core/room/evening-decks'
import { eveningFragmentOf } from '@melee/core/room/evening-link'
import { capabilitiesOf } from '@melee/core/room/game-capabilities'
import { dealsHold } from '@melee/core/room/line-up-deals'
import { readyMadeLineUpsFor } from '@melee/core/room/ready-made-line-ups'
import { orderHolds } from '@melee/core/room/running-order'

import { GAME_NOTES, SETTING_NOTES } from '@/infrastructure/mcp/game-notes'
import { unknownKeysOf } from '@/infrastructure/mcp/unknown-keys'

/** A tool as `tools/list` announces it. */
export type McpTool = {
  description: string
  /** A JSON Schema of the arguments, an object at its root. */
  inputSchema: Record<string, unknown>
  name: string
  title: string
}

/** What a call answers; an error is the assistant's to fix, so it is told why. */
export type ToolOutcome = { isError: boolean; text: string }

type CallableTool = McpTool & {
  call: (input: { arguments: unknown; origin: string }) => Promise<ToolOutcome>
}

const HOW_AN_EVENING_WORKS = [
  'An evening is a list of entries, `lineUp`: each one a game’s whole settings — start from that game’s `defaults` and change what should vary — or only its kind, which opens it on its defaults. Two entries may play one game on different settings: a quiz on geography beside a quiz on cinema.',
  '`roundCount` is how many rounds the evening plays, 1 to 50, or null to play until the host ends it.',
  '`runningOrder` plans the rounds: each row is the index of a `lineUp` entry, played in that order. Leave it empty and the room deals a spaced order itself — each game as far from its last round as the line-up allows, never twice in a row — which is usually what you want.',
  '`lineUpDeals`, parallel to `lineUp`, says how each entry is dealt: "row" plays it in the running order, "chance" only among the rounds drawn once the order runs out, "both" either. Only a game that serves its own content may be dealt "chance" or "both". Leave it empty for each entry’s default.',
  'A game the host brings the content of (`servesItsOwnContent: false`) asks the host to prepare or say something every round of it; an evening for a table that just wants to play leans on the others.',
  `\`decks\`, parallel to \`lineUp\`, brings the evening's own content: one deck per entry, or null where an entry plays its game's bank alone. A quiz, a challenge, a most likely, a timeline, a slate, an estimate, a higher or lower or a black square entry takes one. A quiz deck is \`{ "game": "quiz", "items": [...] }\`, ${QUIZ_DECK_MAX_ITEMS} questions at most. Each item holds a \`prompt\`, its \`answer\`, exactly three \`decoys\` — plausible wrong answers, none of them a spelling of the answer or of each other — and optionally \`accepted\` (other spellings of the answer a typed guess may take), a \`note\` told to the room once the answer is out, a \`category\` from the quiz's own list, and \`choiceOnly: true\` for a question that only makes sense beside its four options ("which of these…"), which a room answering by typing skips. The deck is dealt first, in order; once it is spent the entry deals from its bank like any other, so a short deck in a long evening is fine. The link carries every answer: whoever holds it can read them.`,
  `A challenge or most likely deck is lines: \`{ "game": "challenge", "items": ["…"] }\`, ${LINE_DECK_MAX_ITEMS} lines at most, each played as written in one language — up to 140 characters for a challenge (what the table is challenged to do, read off the wall: "stack the most raclette potatoes"), 160 for most likely ("…is most likely to forget their own birthday"). They are dealt first, in order, then the bank takes over. A most likely line keeps the bank's rule: about a person, never a moment — no meal, no evening, no relationship between the people at the table — never naming anyone, and kind enough that a grandmother and a twelve-year-old laugh at it together. Personalising one by naming a guest or pairing two seats breaks it.`,
  `A timeline deck is the table's own dates: \`{ "game": "timeline", "items": [{ "label": "Léa is born", "year": 2015 }, …] }\`, ${TIMELINE_DECK_MAX_ITEMS} events at most and 5 at least, each label up to 120 characters in one language and its year a whole number. A round deals five of them shuffled, and the players put them in order; the years stay on the host's screen until the reveal. Two events may be a year apart, never in the same year — that order would be a coin toss. A deck that does not divide by five fills its last round with dates the table already ordered, so every date plays; once all are dealt the bank takes over.`,
  `A slate deck is the answer key of its entry's sheet, by item index: \`{ "game": "slate", "items": ["Merlot", null, "Syrah"] }\`, each key up to 80 characters, null for an item with none. A slate entry plays one sheet, so a tasting of three flights is three slate entries, each with its own \`labels\` and its own deck. The keys sit on the host's screen as the sheet opens — a memo for marking, shown to the room only when the host reveals one on a closed item. No key may sit past the entry's \`itemCount\`: raise it to fit.`,
  `An estimate deck is numbers the table guesses, one a round: \`{ "game": "estimate", "items": [{ "prompt": "How many kilometres did we drive this summer?", "unit": "km", "value": 4200 }, …] }\`, ${QUANTITY_DECK_MAX_ITEMS} at most, each prompt up to ${QUANTITY_PROMPT_MAX_LENGTH} characters, its unit up to ${QUANTITY_UNIT_MAX_LENGTH} (null for a bare count) and its value positive. A guess is paid by its ratio to the truth — spot on within ×${SPOT_ON_RATIO}, nothing past ×${ZERO_PAY_RATIO} — so ask quantities: counts, lengths, weights, durations, sums of money. Never a year, an age, a percentage or a rank: a guess of 1990 for 1995 is spot on, and an age of 30 still scores against 87, so the round pays everyone. Such a unit is refused, and so is a whole number between 1000 and 2100 with no unit, which reads as a year.`,
  `A higher or lower deck is pairs, one a round: \`{ "game": "higherlower", "items": [{ "prompt": "Who has the longer commute?", "unit": "km", "left": { "name": "Léa", "value": 12 }, "right": { "name": "Hugo", "value": 40 } }, …] }\`, ${QUANTITY_DECK_MAX_ITEMS} at most, each side's name up to ${HIGHER_LOWER_NAME_MAX_LENGTH} characters. The table picks the bigger side, dealt left or right at random. The larger value must be at least ×${MIN_PAIR_RATIO} the smaller: a tie or a near one is a coin toss, and is refused.`,
  `A black square deck is themes of the table's own, one a round: \`{ "game": "blacksquare", "items": [{ "label": "Fruits", "answers": [{ "label": "Apple", "tier": "easy", "aliases": ["Apples"] }, …], "blackWord": { "label": "Rhubarb", "why": "A stalk, only cooked like a fruit", "aliases": [] } }] }\`, ${BLACK_SQUARE_DECK_MAX_THEMES} themes at most, each written in one language. A round hides a few of the theme's answers behind a grid and everyone types what they think is there, so the theme is broad and simple — fruits, what we packed for the campsite, the cousins' first names — and the difficulty comes from the answers: ${BLACK_SQUARE_DECK_MIN_ANSWERS} to ${BLACK_SQUARE_DECK_MAX_ANSWERS} of them, obvious ones and less obvious ones, each tiered by how obvious it is — "easy" what the table says first, "hard" what it finds last and is paid three times as much for, "medium" between — at least ${MIN_ANSWERS_PER_TIER} of each. One answer per thing, never its varieties side by side: "Apple", not "Green apple" beside "Red apple". The black word belongs to the theme in everyone's mind and is a trap — it sounds right and is wrong, and whoever types it loses the round — and its \`why\` says why in one line, read at the reveal. It may not be spelled like an answer, nor a letter away from one. Give aliases for every common spelling a table might type — a plural, an abbreviation, the other language — case, accents and a leading article being folded already, and never one alias for two answers; names run up to ${BLACK_SQUARE_DECK_NAME_MAX_LENGTH} characters, ${BLACK_SQUARE_DECK_MAX_ALIASES} aliases each at most.`,
  '`difficulty` is "easy", "mixed" (every tier in equal shares) or "hard", and picks what a game deals, never what a round pays; a game without the field deals no tiers. Every field ending in `Ms` is milliseconds.',
  'Teams, the scoreboard, the judge, the answer mode and the volume are not part of an evening: the host sets those in the room.',
  'Call prepare_evening with the evening. It answers each problem by its path, or the link to open on the screen that will host.'
]

const exampleEvening = (): Evening | undefined => {
  const grandMix = readyMadeLineUpsFor('en').find(({ id }) => id === 'grandMix')

  if (grandMix === undefined) {
    return undefined
  }

  const { id: _, ...evening } = grandMix

  return { ...evening, decks: [], name: 'Free-for-all' }
}

const describeGames: CallableTool = {
  call: async () => ({
    isError: false,
    text: JSON.stringify({
      example: exampleEvening(),
      games: gameKinds.map((kind) => ({
        about: GAME_NOTES[kind],
        defaults: DEFAULT_GAME_SETTINGS[kind],
        kind,
        servesItsOwnContent: capabilitiesOf(kind).servesItsOwnContent,
        settings: SETTING_NOTES[kind]
      })),
      howAnEveningWorks: HOW_AN_EVENING_WORKS
    })
  }),
  description:
    'Describes every game of Melee — what a round of it is, its default settings, whether it serves its own content — how an evening is put together, and a ready-made evening as an example. Call it before composing an evening.',
  inputSchema: { additionalProperties: false, properties: {}, type: 'object' },
  name: 'describe_games',
  title: 'Describe the games'
}

const prepareEveningInputSchema = z.object({
  evening: eveningSchema,
  locale: localeSchema.describe(
    'The language the evening’s page opens in, and the room after it.'
  )
})

const problemsOf = (evening: Evening): string[] => {
  const lineUp = evening.lineUp.map((entry) =>
    typeof entry === 'string' ? DEFAULT_GAME_SETTINGS[entry] : entry
  )
  const orderProblem = orderHolds({ lineUp, order: evening.runningOrder })
    ? []
    : [
        `runningOrder: every row is the index of a lineUp entry, 0 to ${lineUp.length - 1}.`
      ]
  const dealsProblem = dealsHold({ deals: evening.lineUpDeals, lineUp })
    ? []
    : [
        'lineUpDeals: one deal per entry at most, and only a game that serves its own content may be dealt "chance" or "both".'
      ]

  return [
    ...orderProblem,
    ...dealsProblem,
    ...deckProblems({ decks: evening.decks, lineUp })
  ]
}

const prepareEvening: CallableTool = {
  call: async ({ arguments: input, origin }) => {
    const parsed = prepareEveningInputSchema.safeParse(input)

    if (!parsed.success) {
      return { isError: true, text: z.prettifyError(parsed.error) }
    }

    const { evening, locale } = parsed.data
    const problems = [
      ...unknownKeysOf({ given: input, kept: parsed.data }).map(
        (path) => `${path}: no such field; describe_games lists every one.`
      ),
      ...problemsOf(evening)
    ]

    if (problems.length > 0) {
      return { isError: true, text: problems.join('\n') }
    }

    const fragment = await eveningFragmentOf(evening)

    if (fragment.length > EVENING_LINK_MAX_CHARS) {
      return {
        isError: true,
        text: `The link would run to ${fragment.length} characters, over the ${EVENING_LINK_MAX_CHARS} an assistant can copy back without a slip. Trim the decks first — fewer questions, shorter notes — then the line-up.`
      }
    }

    const page = fillRoute(EVENING_PAGE_ROUTE, { locale })
    const link = `${origin}${page}#${fragment}`

    return {
      isError: false,
      text: `The evening "${evening.name}" is ready: ${link}\nOpen it on the screen that will host: it shows the evening and opens a room on it.`
    }
  },
  description:
    'Checks an evening and turns it into a link that opens it. Answers each problem by its path when the evening does not hold. Nothing is stored: the evening travels in the link.',
  inputSchema: z.toJSONSchema(prepareEveningInputSchema, {
    io: 'input',
    unrepresentable: 'any'
  }),
  name: 'prepare_evening',
  title: 'Prepare an evening'
}

/** The tools `/mcp` offers, in the order an assistant uses them. */
export const EVENING_TOOLS: readonly CallableTool[] = [
  describeGames,
  prepareEvening
]
