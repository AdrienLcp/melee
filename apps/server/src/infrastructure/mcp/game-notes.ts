import type { GameKind } from '@melee/protocol/game'

/**
 * Each game in a sentence or two, for an assistant composing an evening: what
 * the table does in a round of it. English whatever the evening's language,
 * because the reader is the assistant, never the room.
 */
export const GAME_NOTES = {
  atlas:
    'Names a place that every player pins on a map, paid by the kilometre to its border — or shows a place for the table to name.',
  blacksquare:
    'Hides three to nine answers of a broad theme behind a grid, beside one black word that costs whoever lands on it the round; the less obvious answers pay more.',
  blindtest:
    'A clip plays on the room’s speaker and the players name the title and the artist — or the film, on a film-score source. Each entry picks its source: charts, a decade, a genre, a playlist.',
  buzzer:
    'A bare race for the floor with no content of its own: the host brings the question — a charade, a quiz on paper — and judges the answer.',
  challenge:
    'Played at the table, off every screen: the wall shows a line — dealt, or the host’s own — and the host places the first three.',
  estimate:
    'Asks for a number — a population, a height, a length — that every screen estimates, each paid by how close it lands.',
  higherlower:
    'Deals a pair of those numbers a round — two rivers, two cities — and pays every player who picks the larger one.',
  innerclock:
    'Everyone counts a number of seconds in their head, on screens where nothing moves, and presses once; paid by the gap to the target.',
  longestword:
    'Draws nine letters on every screen; every player types the longest word they can make from them, each letter used once, and is paid by its length against the longest the draw held.',
  makenumber:
    'Deals six number tiles and a target from 101 to 999 on every screen; every player builds a calculation from the tiles, each used once, and is paid by how near it lands — an exact hit pays the whole round.',
  matchsticks:
    'Draws an equation or a number in matches that one moved match fixes, moved on every screen and judged by the server.',
  mostlikely:
    'Puts up a line about one of the people at the table that everyone votes on with a seat; the ballots that went with the room are paid. Flat with fewer than three players.',
  mysteryword:
    'Hides a word of five to eight letters, its first letter shown; every player has six tries on their own screen, each coloured letter by letter, and a word found in fewer tries pays more.',
  petitbac:
    'Deals a letter and a sheet of categories everyone fills on their own screen, then the room votes on what counts; a word nobody else wrote pays double.',
  quiz: 'Questions from banks bundled in French and English, by subject and difficulty, plus rubrics: flags, emoji rebuses, capitals and country outlines.',
  reflex:
    'A race against a screen about to change colour; a press before it changes is a false start and costs the round.',
  slate:
    'A private answer sheet on every screen that the host marks on the wall, one item at a time; the host prepares the items.',
  swatch:
    'Shows a colour for a few seconds and has every screen rebuild it, paid by how far off it lands.',
  thinkalike:
    'Puts up a prompt — a red fruit, something you find in a fridge — that every player answers with one word on their own screen; each is paid by how many of the others wrote the same, and the host may merge two answers the table calls one.',
  timeline:
    'Deals five dated events that every player puts in order on their own screen; the years are held back until the reveal.'
} as const satisfies Record<GameKind, string>

/**
 * What a game's settings mean where their names and defaults do not say it,
 * `null` where they do. The protocol's schemas carry no field docs into the
 * JSON Schema, so these are the assistant's only source.
 */
export const SETTING_NOTES = {
  atlas:
    '`places` lists the sets a round may be drawn from — "countries", "frenchCities", "worldCapitals" — one drawn per round. `direction` is "place" (the room names a place, every player pins it) or "name" (the map shows a place, the players name it).',
  blacksquare:
    '`answerCount` is how many of the theme’s answers a round hides, 3 to 9. `doublesLoneFinds` pays double a cell one player alone found, in a typed round only — a spoken round has one team guessing.',
  blindtest:
    '`source` is what the clips are drawn from. `{ "kind": "search", "query": "…" }` takes any free query of up to 120 characters — an artist, a film, "french rap 2000s" — and `{ "kind": "playlist", "playlistId": "…" }` a Deezer playlist id: those two make a blind test about anything. A list of tracks is not offered — it would need ids an assistant cannot know.',
  buzzer:
    '`locksOutOnMiss` sits a player out for the rest of the round after a wrong answer: one go each keeps a loud room honest, an open field suits "name five…".',
  challenge: null,
  estimate: null,
  higherlower: null,
  innerclock:
    'Nothing to set: the target is drawn between 20 and 60 seconds each round.',
  longestword: null,
  makenumber: null,
  matchsticks:
    '`goals` lists what a round may ask, one drawn per round: "equation" fixes a false equation by moving one match, "biggest" makes the biggest number one move allows, "smallest" the smallest.',
  mostlikely: null,
  mysteryword: null,
  petitbac:
    '`categories` is null to draw `categoryCount` categories every round, or a fixed list of 3 to 10 played every round, each `{ "kind": "own", "label": "…" }` (40 characters at most) or `{ "kind": "bank", "key": "…" }` (one of the bank’s keys, in the defaults). `categoryCount` is ignored for a fixed list, and `difficulty` applies to drawn categories only. `excludedLetters` are never dealt; `stopsWhenFull` lets a player whose every line is filled close everyone’s sheet.',
  quiz: null,
  reflex: null,
  slate:
    '`labels` names the sheet’s items, by index — public on every screen, 12 characters at most, unique, null for a plain number. `itemCount` is how many items a sheet opens with, not a cap: the host adds more during the round.',
  swatch:
    '`showMs` is how long the colour stays up; `roundDurationMs` is the time to rebuild it once it has hidden, the showing not counted.',
  thinkalike:
    '`language` is the wording every prompt is dealt in, whatever each screen speaks: the table matches words, so it writes in one language.',
  timeline: null
} as const satisfies Record<GameKind, string | null>
