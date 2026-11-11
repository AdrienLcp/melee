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
  timeline:
    'Deals five dated events that every player puts in order on their own screen; the years are held back until the reveal.'
} as const satisfies Record<GameKind, string>
