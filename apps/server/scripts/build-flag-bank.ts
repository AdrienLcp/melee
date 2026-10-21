import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { COUNTRY_CODES, type CountryCode } from '@melee/protocol/country-code'
import type { GeoPoint } from '@melee/protocol/worldmap'

import { greatCircleKm } from '@melee/core/worldmap/distance'

import { countryShapeOf } from '../src/infrastructure/map/world-atlas'

/**
 * Writes the flags round's two halves from `flag-icons`: every flag as an SVG
 * under `apps/game/public/flags/`, and `flag-bank.json` beside the question
 * bank, which says which file is which country and which three flags stand
 * beside it as decoys. Run it with
 * `pnpm --filter @melee/server flags:build` after bumping `flag-icons`.
 *
 * **A file is named after its own content, never its country.** The prompt a
 * player is sent carries the file name, and `fr.svg` is the answer sent in
 * plain text. The root's `id="flag-icons-fr"` goes for the same reason.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const FLAGS_SOURCE = join(
  dirname(require.resolve('flag-icons/package.json')),
  'flags',
  '4x3'
)
const FLAGS_TARGET = join(HERE, '..', '..', 'game', 'public', 'flags')
const BANK_PATH = join(
  HERE,
  '..',
  'src',
  'infrastructure',
  'questions',
  'flag-bank.json'
)

/** `flag-icons` names its files by ISO 3166-1 alpha-2, the map by alpha-3. */
const ALPHA_2_BY_CODE: Record<CountryCode, string> = {
  ABW: 'aw',
  AFG: 'af',
  AGO: 'ao',
  AIA: 'ai',
  ALA: 'ax',
  ALB: 'al',
  AND: 'ad',
  ARE: 'ae',
  ARG: 'ar',
  ARM: 'am',
  ASM: 'as',
  ATA: 'aq',
  ATF: 'tf',
  ATG: 'ag',
  AUS: 'au',
  AUT: 'at',
  AZE: 'az',
  BDI: 'bi',
  BEL: 'be',
  BEN: 'bj',
  BFA: 'bf',
  BGD: 'bd',
  BGR: 'bg',
  BHR: 'bh',
  BHS: 'bs',
  BIH: 'ba',
  BLM: 'bl',
  BLR: 'by',
  BLZ: 'bz',
  BMU: 'bm',
  BOL: 'bo',
  BRA: 'br',
  BRB: 'bb',
  BRN: 'bn',
  BTN: 'bt',
  BWA: 'bw',
  CAF: 'cf',
  CAN: 'ca',
  CHE: 'ch',
  CHL: 'cl',
  CHN: 'cn',
  CIV: 'ci',
  CMR: 'cm',
  COD: 'cd',
  COG: 'cg',
  COK: 'ck',
  COL: 'co',
  COM: 'km',
  CPV: 'cv',
  CRI: 'cr',
  CUB: 'cu',
  CUW: 'cw',
  CYM: 'ky',
  CYP: 'cy',
  CZE: 'cz',
  DEU: 'de',
  DJI: 'dj',
  DMA: 'dm',
  DNK: 'dk',
  DOM: 'do',
  DZA: 'dz',
  ECU: 'ec',
  EGY: 'eg',
  ERI: 'er',
  ESH: 'eh',
  ESP: 'es',
  EST: 'ee',
  ETH: 'et',
  FIN: 'fi',
  FJI: 'fj',
  FLK: 'fk',
  FRA: 'fr',
  FRO: 'fo',
  FSM: 'fm',
  GAB: 'ga',
  GBR: 'gb',
  GEO: 'ge',
  GGY: 'gg',
  GHA: 'gh',
  GIN: 'gn',
  GMB: 'gm',
  GNB: 'gw',
  GNQ: 'gq',
  GRC: 'gr',
  GRD: 'gd',
  GRL: 'gl',
  GTM: 'gt',
  GUM: 'gu',
  GUY: 'gy',
  HKG: 'hk',
  HMD: 'hm',
  HND: 'hn',
  HRV: 'hr',
  HTI: 'ht',
  HUN: 'hu',
  IDN: 'id',
  IMN: 'im',
  IND: 'in',
  IOT: 'io',
  IRL: 'ie',
  IRN: 'ir',
  IRQ: 'iq',
  ISL: 'is',
  ISR: 'il',
  ITA: 'it',
  JAM: 'jm',
  JEY: 'je',
  JOR: 'jo',
  JPN: 'jp',
  KAZ: 'kz',
  KEN: 'ke',
  KGZ: 'kg',
  KHM: 'kh',
  KIR: 'ki',
  KNA: 'kn',
  KOR: 'kr',
  KWT: 'kw',
  LAO: 'la',
  LBN: 'lb',
  LBR: 'lr',
  LBY: 'ly',
  LCA: 'lc',
  LIE: 'li',
  LKA: 'lk',
  LSO: 'ls',
  LTU: 'lt',
  LUX: 'lu',
  LVA: 'lv',
  MAC: 'mo',
  MAF: 'mf',
  MAR: 'ma',
  MCO: 'mc',
  MDA: 'md',
  MDG: 'mg',
  MDV: 'mv',
  MEX: 'mx',
  MHL: 'mh',
  MKD: 'mk',
  MLI: 'ml',
  MLT: 'mt',
  MMR: 'mm',
  MNE: 'me',
  MNG: 'mn',
  MNP: 'mp',
  MOZ: 'mz',
  MRT: 'mr',
  MSR: 'ms',
  MUS: 'mu',
  MWI: 'mw',
  MYS: 'my',
  NAM: 'na',
  NCL: 'nc',
  NER: 'ne',
  NFK: 'nf',
  NGA: 'ng',
  NIC: 'ni',
  NIU: 'nu',
  NLD: 'nl',
  NOR: 'no',
  NPL: 'np',
  NRU: 'nr',
  NZL: 'nz',
  OMN: 'om',
  PAK: 'pk',
  PAN: 'pa',
  PCN: 'pn',
  PER: 'pe',
  PHL: 'ph',
  PLW: 'pw',
  PNG: 'pg',
  POL: 'pl',
  PRI: 'pr',
  PRK: 'kp',
  PRT: 'pt',
  PRY: 'py',
  PSE: 'ps',
  PYF: 'pf',
  QAT: 'qa',
  ROU: 'ro',
  RUS: 'ru',
  RWA: 'rw',
  SAU: 'sa',
  SDN: 'sd',
  SEN: 'sn',
  SGP: 'sg',
  SGS: 'gs',
  SHN: 'sh',
  SLB: 'sb',
  SLE: 'sl',
  SLV: 'sv',
  SMR: 'sm',
  SOM: 'so',
  SPM: 'pm',
  SRB: 'rs',
  SSD: 'ss',
  STP: 'st',
  SUR: 'sr',
  SVK: 'sk',
  SVN: 'si',
  SWE: 'se',
  SWZ: 'sz',
  SXM: 'sx',
  SYC: 'sc',
  SYR: 'sy',
  TCA: 'tc',
  TCD: 'td',
  TGO: 'tg',
  THA: 'th',
  TJK: 'tj',
  TKM: 'tm',
  TLS: 'tl',
  TON: 'to',
  TTO: 'tt',
  TUN: 'tn',
  TUR: 'tr',
  TWN: 'tw',
  TZA: 'tz',
  UGA: 'ug',
  UKR: 'ua',
  URY: 'uy',
  USA: 'us',
  UZB: 'uz',
  VAT: 'va',
  VCT: 'vc',
  VEN: 've',
  VGB: 'vg',
  VIR: 'vi',
  VNM: 'vn',
  VUT: 'vu',
  WLF: 'wf',
  WSM: 'ws',
  XKX: 'xk',
  YEM: 'ye',
  ZAF: 'za',
  ZMB: 'zm',
  ZWE: 'zw'
}

const flagFileName = (svg: string): string =>
  `${createHash('sha256').update(svg).digest('hex').slice(0, 12)}.svg`

/**
 * A flag `flag-icons` draws exactly like another code's, so the room could
 * not tell which one it is looking at: Heard Island flies Australia's, Saint
 * Helena the Union Jack, and four French collectivities the tricolour.
 * Monaco is Indonesia's red over white at another ratio, and every flag here
 * is drawn at 4:3.
 */
const DRAWN_LIKE_ANOTHER: ReadonlySet<CountryCode> = new Set([
  'BLM',
  'HMD',
  'MAF',
  'MCO',
  'SHN',
  'SPM',
  'WLF'
])

/**
 * Flags a table mixes up, which are what makes the round: four random flags
 * leave the answer the only one with a cross on it. A country in several
 * groups takes its decoys from the first one first; the nearest countries
 * fill whatever the groups leave.
 */
const LOOK_ALIKE_GROUPS: readonly (readonly CountryCode[])[] = [
  ['ROU', 'TCD', 'AND', 'MDA'],
  ['IDN', 'POL', 'SGP', 'MLT'],
  ['IRL', 'CIV', 'ITA', 'IND'],
  ['ITA', 'MEX', 'IRL', 'HUN'],
  ['IND', 'NER', 'CIV', 'IRL'],
  ['NLD', 'LUX', 'PRY', 'HRV'],
  ['FRA', 'NLD', 'RUS', 'LUX'],
  ['RUS', 'SVK', 'SVN', 'SRB'],
  ['HRV', 'SVK', 'SVN', 'PRY'],
  ['DNK', 'NOR', 'ISL', 'FRO'],
  ['SWE', 'FIN', 'ALA', 'ISL'],
  ['AUS', 'NZL', 'COK', 'FJI'],
  ['EGY', 'IRQ', 'SYR', 'YEM'],
  ['SDN', 'JOR', 'PSE', 'ARE'],
  ['KWT', 'ARE', 'JOR', 'PSE'],
  ['SEN', 'MLI', 'GIN', 'CMR'],
  ['GHA', 'BOL', 'LTU', 'ETH'],
  ['DEU', 'BEL', 'UGA', 'LTU'],
  ['AUT', 'LVA', 'PER', 'CAN'],
  ['HUN', 'BGR', 'IRN', 'TJK'],
  ['COL', 'ECU', 'VEN', 'ARM'],
  ['HND', 'NIC', 'SLV', 'GTM'],
  ['ARG', 'URY', 'GRC', 'SLV'],
  ['QAT', 'BHR', 'LVA', 'AUT'],
  ['JPN', 'BGD', 'PLW', 'KOR'],
  ['USA', 'LBR', 'MYS', 'PRI'],
  ['CUB', 'PRI', 'CHL', 'CZE'],
  ['TUR', 'TUN', 'AZE', 'MDV'],
  ['PAK', 'DZA', 'MRT', 'TKM'],
  ['KEN', 'SSD', 'MWI', 'ZMB'],
  ['CZE', 'PHL', 'BHS', 'TLS'],
  ['SLE', 'GAB', 'RWA', 'BWA'],
  ['ALB', 'MNE', 'SRB', 'MKD'],
  ['VNM', 'CHN', 'MAR', 'KGZ'],
  ['NGA', 'NFK', 'CIV', 'IRL'],
  ['CHE', 'DNK', 'GEO', 'TON'],
  ['GBR', 'AUS', 'NZL', 'ISL'],
  ['ESP', 'COL', 'BOL', 'AND'],
  ['PRT', 'BRA', 'AGO', 'MOZ'],
  ['UKR', 'SWE', 'KAZ', 'RWA'],
  ['ISR', 'GRC', 'FIN', 'URY'],
  ['LBN', 'AUT', 'PER', 'CYP'],
  ['EST', 'BWA', 'SLE', 'FIN'],
  ['THA', 'CRI', 'NOR', 'PRK'],
  ['CRI', 'THA', 'PRK', 'DOM'],
  ['MMR', 'GHA', 'LTU', 'BOL'],
  ['ZAF', 'VUT', 'GUY', 'JAM'],
  ['TTO', 'GMB', 'KNA', 'NAM'],
  ['MYS', 'LBR', 'USA', 'TGO']
]

/**
 * The flags a table can be expected to have seen — what the well-known switch
 * keeps. Chosen by hand: a flag is known from a football pitch, a beach towel
 * or the evening news, which no traffic count measures.
 */
const WELL_KNOWN: ReadonlySet<CountryCode> = new Set([
  'ALB',
  'ARE',
  'ARG',
  'AUS',
  'AUT',
  'BEL',
  'BGR',
  'BOL',
  'BRA',
  'CAN',
  'CHE',
  'CHL',
  'CHN',
  'CIV',
  'CMR',
  'COL',
  'CUB',
  'CZE',
  'DEU',
  'DNK',
  'DZA',
  'ECU',
  'EGY',
  'ESP',
  'EST',
  'FIN',
  'FRA',
  'GBR',
  'GHA',
  'GRC',
  'HRV',
  'HUN',
  'IDN',
  'IND',
  'IRL',
  'IRN',
  'IRQ',
  'ISL',
  'ISR',
  'ITA',
  'JAM',
  'JPN',
  'KEN',
  'KOR',
  'LBN',
  'LTU',
  'LUX',
  'LVA',
  'MAR',
  'MEX',
  'NGA',
  'NLD',
  'NOR',
  'NZL',
  'PAK',
  'PER',
  'PHL',
  'POL',
  'PRT',
  'QAT',
  'ROU',
  'RUS',
  'SAU',
  'SEN',
  'SRB',
  'SVK',
  'SVN',
  'SWE',
  'THA',
  'TUN',
  'TUR',
  'UKR',
  'URY',
  'USA',
  'VEN',
  'VNM',
  'ZAF'
])

/**
 * `flag-icons` prefixes every internal id with the country's own code —
 * `id="ar-c"`, `url(#ar-c)`, `class="bo-fil1"` — which is the answer again,
 * one request away. A letter must follow, or Zambia's path data `zm-1` would go.
 */
const anonymised = ({ alpha2, svg }: { alpha2: string; svg: string }) =>
  svg
    .replace(/\s+id="flag-icons-[a-z-]+"/, '')
    .replaceAll(new RegExp(`(?<=["#.\\s])${alpha2}-(?=[a-z])`, 'g'), 'f-')

const readFlags = async (): Promise<Map<CountryCode, string>> => {
  const flags = new Map<CountryCode, string>()

  for (const code of COUNTRY_CODES) {
    if (DRAWN_LIKE_ANOTHER.has(code)) {
      continue
    }

    const alpha2 = ALPHA_2_BY_CODE[code]
    const svg = await readFile(join(FLAGS_SOURCE, `${alpha2}.svg`), 'utf8')

    flags.set(code, anonymised({ alpha2, svg }))
  }

  return flags
}

/**
 * Where a country sits, read off its longest outline rather than all of them:
 * France's average with French Guiana in it lands in the Atlantic.
 */
const centreOf = (code: CountryCode): GeoPoint => {
  const outline = countryShapeOf(code)?.rings.reduce((longest, ring) =>
    ring.length > longest.length ? ring : longest
  )

  if (outline === undefined || outline.length === 0) {
    throw new Error(`${code} has no outline on the atlas`)
  }

  const [longitude, latitude] = outline.reduce(
    (total, [x, y]) => [total[0] + x, total[1] + y],
    [0, 0]
  )

  return {
    latitude: latitude / outline.length,
    longitude: longitude / outline.length
  }
}

const decoysOf = ({
  centres,
  code
}: {
  centres: ReadonlyMap<CountryCode, GeoPoint>
  code: CountryCode
}): [CountryCode, CountryCode, CountryCode] => {
  const centre = centres.get(code)
  const lookAlikes = LOOK_ALIKE_GROUPS.filter((group) =>
    group.includes(code)
  ).flat()
  const nearest = [...centres.entries()]
    .map(([other, point]) => ({
      code: other,
      km: centre === undefined ? 0 : greatCircleKm(centre, point)
    }))
    .toSorted((a, b) => a.km - b.km)
    .map((other) => other.code)
  const [first, second, third] = [
    ...new Set([...lookAlikes, ...nearest])
  ].filter((other) => other !== code && centres.has(other))

  if (first === undefined || second === undefined || third === undefined) {
    throw new Error(`${code} found fewer than three decoys`)
  }

  return [first, second, third]
}

const main = async () => {
  const flags = await readFlags()
  const centres = new Map(
    [...flags.keys()].map((code) => [code, centreOf(code)] as const)
  )
  const drawnAlike = [
    ...Map.groupBy(flags.entries(), ([, svg]) => flagFileName(svg)).values()
  ].filter((codes) => codes.length > 1)

  if (drawnAlike.length > 0) {
    throw new Error(
      `Flags drawn alike: ${drawnAlike.map((codes) => codes.map(([code]) => code).join(' = ')).join(', ')}`
    )
  }

  await rm(FLAGS_TARGET, { force: true, recursive: true })
  await mkdir(FLAGS_TARGET, { recursive: true })

  const rows = []

  for (const [code, svg] of flags) {
    const file = flagFileName(svg)

    await writeFile(join(FLAGS_TARGET, file), svg, 'utf8')
    rows.push({
      code,
      decoys: decoysOf({ centres, code }),
      file,
      isWellKnown: WELL_KNOWN.has(code)
    })
  }

  await writeFile(BANK_PATH, `${JSON.stringify(rows, null, 2)}\n`, 'utf8')
  console.info(`${rows.length} flags, ${WELL_KNOWN.size} of them well known`)
}

await main()
