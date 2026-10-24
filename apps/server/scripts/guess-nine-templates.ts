/**
 * A *Guess nine* theme is a question asked of Wikidata about one subject, and
 * the questions repeat: *films directed by* is the same query for Tarantino as
 * for Kubrick. Each template here holds that query twice — once for every true
 * answer, once for the black-word candidates — so a theme is declared as a
 * template and a subject rather than as SPARQL written by hand.
 *
 * The candidates are the subject's **neighbours**: the same kind of thing,
 * linked to the subject by a property next to the one the theme asks about — a
 * film Tarantino wrote but did not direct, an Oscar nominee that did not win.
 * That is what makes a black word sound right. The build removes every true
 * answer from them; what is left is still read by hand.
 */

/** The labels a template words a theme with. */
export type Wording = { en: string; fr: string }

export type TemplateQuery = {
  /** Another entity the template reads beside the subject, where it needs one. */
  neighbour: string | null
  subject: string
}

type Template = {
  /** A SPARQL group pattern binding `?item` to every candidate black word. */
  candidates: (query: TemplateQuery) => string
  /** The theme as a room reads it, from the subject's own labels. */
  label: (subject: Wording) => Wording
  /** Whether a theme cannot be asked without a `neighbour`. */
  needsNeighbour: boolean
  /** A SPARQL group pattern binding `?item` to every true answer. */
  truths: (query: TemplateQuery) => string
}

const FILM = [
  'VALUES ?filmKind { wd:Q11424 wd:Q24869 wd:Q202866 wd:Q29168811 }',
  '?item wdt:P31 ?filmKind .',
  'FILTER NOT EXISTS { ?item wdt:P31 wd:Q24862 }'
].join('\n')

const ALBUM =
  'VALUES ?albumKind { wd:Q482994 wd:Q208569 } ?item wdt:P31 ?albumKind .'

const SONG =
  'VALUES ?songKind { wd:Q7366 wd:Q134556 } ?item wdt:P31 ?songKind .'

const COUNTRY = [
  'VALUES ?countryKind { wd:Q6256 wd:Q3624078 } ?item wdt:P31 ?countryKind .',
  'FILTER NOT EXISTS { ?item wdt:P576 [] }'
].join('\n')

const BOOK = [
  'VALUES ?bookKind { wd:Q7725634 wd:Q8261 wd:Q47461344 wd:Q25379 wd:Q49084 wd:Q14406742 }',
  '?item wdt:P31 ?bookKind .'
].join('\n')

const PAINTING = '?item wdt:P31 wd:Q3305213 .'

const PERSON = '?item wdt:P31 wd:Q5 .'

/** A neighbour's neighbour, which is what lives just past the subject's border. */
const nextCountryOver = (subject: string): string =>
  [
    `wd:${subject} wdt:P47 ?beside . ?beside wdt:P47 ?item .`,
    `FILTER(?item != wd:${subject})`,
    COUNTRY
  ].join('\n')

const currentMember = ({
  organisation,
  property
}: {
  organisation: string
  property: string
}): string =>
  [
    `?item p:${property} ?membership . ?membership ps:${property} wd:${organisation} .`,
    'FILTER NOT EXISTS { ?membership pq:P582 [] }'
  ].join('\n')

const neighbourOf = ({ neighbour }: TemplateQuery): string => {
  if (neighbour === null) {
    throw new Error('this template reads a neighbour')
  }

  return neighbour
}

export const TEMPLATES = {
  'albums-by-band': {
    candidates: ({ subject }) =>
      [
        `{ wd:${subject} wdt:P527 ?member } UNION { ?member wdt:P463 wd:${subject} }`,
        '?member wdt:P31 wd:Q5 .',
        `?item wdt:P175 ?member . ${ALBUM}`
      ].join('\n'),
    label: ({ en, fr }) => ({
      en: `Albums by ${en}`,
      fr: `Les albums de ${fr}`
    }),
    needsNeighbour: false,
    truths: ({ subject }) => `?item wdt:P175 wd:${subject} . ${ALBUM}`
  },
  'award-winners': {
    candidates: ({ neighbour, subject }) =>
      [
        `{ ?item wdt:P1411 wd:${subject} }`,
        neighbour === null ? '' : `UNION { ?item wdt:P166 wd:${neighbour} }`
      ].join('\n'),
    label: ({ en, fr }) => ({
      en: `Winners of the ${en}`,
      fr: `Les lauréats du ${fr}`
    }),
    needsNeighbour: false,
    truths: ({ subject }) => `?item wdt:P166 wd:${subject} .`
  },
  'award-winning-films': {
    candidates: ({ subject }) => `?item wdt:P1411 wd:${subject} . ${FILM}`,
    label: ({ en, fr }) => ({
      en: `Winners of the ${en}`,
      fr: `Les lauréats du ${fr}`
    }),
    needsNeighbour: false,
    truths: ({ subject }) => `?item wdt:P166 wd:${subject} . ${FILM}`
  },
  'award-winning-people': {
    candidates: ({ neighbour, subject }) =>
      [
        `{ ?item wdt:P1411 wd:${subject} }`,
        neighbour === null ? '' : `UNION { ?item wdt:P166 wd:${neighbour} }`,
        PERSON
      ].join('\n'),
    label: ({ en, fr }) => ({
      en: `Winners of the ${en}`,
      fr: `Les lauréats du ${fr}`
    }),
    needsNeighbour: false,
    truths: ({ subject }) => `?item wdt:P166 wd:${subject} . ${PERSON}`
  },
  'books-by-author': {
    candidates: ({ subject }) =>
      [
        `wd:${subject} wdt:P135 ?movement ; wdt:P27 ?country .`,
        `?author wdt:P135 ?movement ; wdt:P27 ?country . FILTER(?author != wd:${subject})`,
        `?item wdt:P50 ?author . ${BOOK}`
      ].join('\n'),
    label: ({ en, fr }) => ({
      en: `Books by ${en}`,
      fr: `Les livres de ${fr}`
    }),
    needsNeighbour: false,
    truths: ({ subject }) => `?item wdt:P50 wd:${subject} . ${BOOK}`
  },
  'characters-of-work': {
    candidates: ({ neighbour, subject }) =>
      neighbour === null
        ? [
            `wd:${subject} wdt:P170|wdt:P50 ?creator .`,
            `?work wdt:P170|wdt:P50 ?creator . FILTER(?work != wd:${subject})`,
            '?item wdt:P1441 ?work .'
          ].join('\n')
        : `?item wdt:P1441 wd:${neighbour} .`,
    label: ({ en, fr }) => ({
      en: `Characters of ${en}`,
      fr: `Les personnages de ${fr}`
    }),
    needsNeighbour: false,
    truths: ({ subject }) => `?item wdt:P1441 wd:${subject} .`
  },
  'competition-winners': {
    candidates: (query) =>
      `?season wdt:P3450|wdt:P179|wdt:P361 wd:${neighbourOf(query)} ; wdt:P1346 ?item .`,
    label: ({ en, fr }) => ({
      en: `Winners of the ${en}`,
      fr: `Les vainqueurs de ${fr}`
    }),
    needsNeighbour: true,
    truths: ({ subject }) =>
      `?season wdt:P3450|wdt:P179|wdt:P361 wd:${subject} ; wdt:P1346 ?item .`
  },
  'countries-bordering': {
    candidates: ({ subject }) => nextCountryOver(subject),
    label: ({ en, fr }) => ({
      en: `Countries bordering ${en}`,
      fr: `Les pays frontaliers de ${fr}`
    }),
    needsNeighbour: false,
    truths: ({ subject }) =>
      [
        `wd:${subject} p:P47 ?border . ?border ps:P47 ?item .`,
        'FILTER NOT EXISTS { ?border pq:P582 [] }',
        COUNTRY
      ].join('\n')
  },
  'countries-speaking': {
    candidates: ({ subject }) =>
      [
        `{ ?item wdt:P2936 wd:${subject} }`,
        `UNION { ?speaking wdt:P37 wd:${subject} ; wdt:P47 ?item }`,
        COUNTRY
      ].join('\n'),
    label: ({ en, fr }) => ({
      en: `Countries where ${en} is an official language`,
      fr: `Les pays où ${/^(a|e|é|è|i|o|u)/i.test(fr) ? `l’${fr}` : `le ${fr}`} est langue officielle`
    }),
    needsNeighbour: false,
    truths: ({ subject }) => `?item wdt:P37 wd:${subject} . ${COUNTRY}`
  },
  'films-directed-by': {
    candidates: ({ subject }) =>
      `?item wdt:P58|wdt:P162|wdt:P1431|wdt:P161 wd:${subject} . ${FILM}`,
    label: ({ en, fr }) => ({
      en: `Films directed by ${en}`,
      fr: `Les films réalisés par ${fr}`
    }),
    needsNeighbour: false,
    truths: ({ subject }) => `?item wdt:P57 wd:${subject} . ${FILM}`
  },
  'films-of-studio': {
    candidates: ({ neighbour, subject }) =>
      [
        `{ ?answer wdt:P272 wd:${subject} ; wdt:P57 ?director . ?item wdt:P57 ?director . }`,
        neighbour === null
          ? ''
          : `UNION { ?item wdt:P272|wdt:P750 wd:${neighbour} . ?item wdt:P31 wd:Q202866 . }`,
        FILM
      ].join('\n'),
    label: ({ en, fr }) => ({ en: `${en} films`, fr: `Les films ${fr}` }),
    needsNeighbour: false,
    truths: ({ subject }) => `?item wdt:P272 wd:${subject} . ${FILM}`
  },
  'members-of': {
    candidates: ({ subject }) =>
      [
        `{ ?item p:P463 ?former . ?former ps:P463 wd:${subject} ; pq:P582 [] . }`,
        `UNION { ?member wdt:P463 wd:${subject} ; wdt:P47 ?item . }`,
        COUNTRY
      ].join('\n'),
    label: ({ en, fr }) => ({
      en: `Member states of ${en}`,
      fr: `Les États membres de ${fr}`
    }),
    needsNeighbour: false,
    truths: ({ subject }) =>
      `${currentMember({ organisation: subject, property: 'P463' })} ${COUNTRY}`
  },
  'paintings-by': {
    candidates: ({ subject }) =>
      [
        `wd:${subject} wdt:P135 ?movement .`,
        `?painter wdt:P135 ?movement . FILTER(?painter != wd:${subject})`,
        `?item wdt:P170 ?painter . ${PAINTING}`
      ].join('\n'),
    label: ({ en, fr }) => ({
      en: `Paintings by ${en}`,
      fr: `Les tableaux de ${fr}`
    }),
    needsNeighbour: false,
    truths: ({ subject }) => `?item wdt:P170 wd:${subject} . ${PAINTING}`
  },
  'position-holders': {
    candidates: (query) =>
      `?item wdt:P39 wd:${neighbourOf(query)} ; wdt:P31 wd:Q5 .`,
    label: ({ en, fr }) => ({ en, fr }),
    needsNeighbour: true,
    truths: ({ subject }) => `?item wdt:P39 wd:${subject} ; wdt:P31 wd:Q5 .`
  },
  'songs-by': {
    candidates: ({ subject }) =>
      `?item wdt:P86|wdt:P676|wdt:P870 wd:${subject} . ${SONG}`,
    label: ({ en, fr }) => ({
      en: `Songs sung by ${en}`,
      fr: `Les chansons interprétées par ${fr}`
    }),
    needsNeighbour: false,
    truths: ({ subject }) => `?item wdt:P175 wd:${subject} . ${SONG}`
  },
  'subdivisions-of': {
    candidates: (query) =>
      [
        `{ wd:${query.subject} wdt:P150 ?item . FILTER NOT EXISTS { ?item wdt:P31 wd:${neighbourOf(query)} } }`,
        `UNION { ?item wdt:P31 wd:${neighbourOf(query)} ; wdt:P576 [] . }`
      ].join('\n'),
    label: ({ en, fr }) => ({ en, fr }),
    needsNeighbour: true,
    truths: (query) =>
      [
        `wd:${query.subject} wdt:P150 ?item . ?item wdt:P31 wd:${neighbourOf(query)} .`,
        'FILTER NOT EXISTS { ?item wdt:P576 [] }'
      ].join('\n')
  }
} as const satisfies Record<string, Template>

export type TemplateName = keyof typeof TEMPLATES
