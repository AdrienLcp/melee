import { createHash } from 'node:crypto'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  geoArea,
  geoAzimuthalEqualArea,
  geoCentroid,
  geoDistance,
  geoPath
} from 'd3-geo'
import { z } from 'zod'

import {
  type CountryCode,
  countryCodeSchema
} from '@melee/protocol/country-code'

import { countryGeometryOf } from '../src/infrastructure/map/world-atlas'
import { orStop, readJsonFile } from './json-file'

/**
 * Writes the silhouettes rubric's two halves from the atlas's 1:50m outlines:
 * every country drawn alone as an SVG under `apps/game/public/silhouettes/`,
 * and `silhouette-bank.json` beside the flag bank, which says which file is
 * which country and which three neighbours stand beside it as decoys. Run it
 * with `pnpm --filter @melee/server silhouettes:build`.
 *
 * The countries are the flag bank's, so the two rubrics agree on which ones a
 * general-public table knows. A file is named after its own content, never its
 * country, for the flag's reason: the name travels to every player.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const SILHOUETTES_TARGET = join(
  HERE,
  '..',
  '..',
  'game',
  'public',
  'silhouettes'
)
const QUESTIONS_DIRECTORY = join(
  HERE,
  '..',
  'src',
  'infrastructure',
  'questions'
)
const FLAG_BANK_PATH = join(QUESTIONS_DIRECTORY, 'flag-bank.json')
const BANK_PATH = join(QUESTIONS_DIRECTORY, 'silhouette-bank.json')

const EARTH_RADIUS_KM = 6371
const VIEW_BOX = 100
const MARGIN = 4

/**
 * Below this, the largest piece of a country draws as a blot no table names
 * by its shape: Andorra, Malta, Singapore, Bahrain, and every atoll state.
 */
const SMALLEST_LARGEST_PIECE_KM2 = 2000

/**
 * A piece further than this many times the mainland's own reach from its
 * centre is somewhere else — French Guiana, the Canaries, Hawaii — and drawn
 * beside it would shrink the mainland to a dot.
 */
const FARTHEST_REACHES = 1.6

/**
 * A piece at least this large beside the mainland is part of the picture
 * wherever it sits — Papua for Indonesia, the South Island for New Zealand.
 * Alaska, at a fifth of the contiguous states, is not.
 */
const LARGEST_SHARE_KEPT = 0.25

/**
 * Lands the atlas draws and the flag bank names that no table would call a
 * country by their shape: Antarctica, and two austral territories with nobody
 * living on them.
 */
const NOT_ASKED: ReadonlySet<CountryCode> = new Set(['ATA', 'ATF', 'SGS'])

type Polygon = { coordinates: number[][][]; type: 'Polygon' }
type MultiPolygon = { coordinates: number[][][][]; type: 'MultiPolygon' }

const flagBankSchema = z.array(
  z.object({ code: countryCodeSchema, isWellKnown: z.boolean() })
)

const areaKm2 = (piece: Polygon): number =>
  geoArea(piece) * EARTH_RADIUS_KM * EARTH_RADIUS_KM

const distanceKm = (from: [number, number], to: [number, number]): number =>
  geoDistance(from, to) * EARTH_RADIUS_KM

const reachKm = (piece: Polygon): number => {
  const centre = geoCentroid(piece)

  return Math.max(
    ...(piece.coordinates[0] ?? []).map(([longitude = 0, latitude = 0]) =>
      distanceKm(centre, [longitude, latitude])
    )
  )
}

/**
 * The pieces a table would draw for the country: the largest, every piece
 * near it, and every piece large enough to be part of the picture anyway.
 */
const mainlandOf = (geometry: MultiPolygon): Polygon[] => {
  const pieces = geometry.coordinates
    .map((coordinates): Polygon => ({ coordinates, type: 'Polygon' }))
    .toSorted((one, other) => areaKm2(other) - areaKm2(one))
  const [largest] = pieces

  if (largest === undefined) {
    return []
  }

  const centre = geoCentroid(largest)
  const reach = reachKm(largest) * FARTHEST_REACHES
  const largestArea = areaKm2(largest)

  return pieces.filter(
    (piece) =>
      areaKm2(piece) >= largestArea * LARGEST_SHARE_KEPT ||
      distanceKm(centre, geoCentroid(piece)) <= reach
  )
}

/**
 * Below this gap, in view-box units, a vertex draws nothing a screen shows:
 * Canada's coast at 1:50m is 100 kB of points a few hundredths apart.
 */
const SMALLEST_STEP = 0.6

const simplifiedRing = (ring: string): string | null => {
  const points = ring
    .split('L')
    .map((pair) => pair.split(',').map(Number))
    .flatMap(([x, y]) => (x === undefined || y === undefined ? [] : [{ x, y }]))
  const kept: { x: number; y: number }[] = []

  for (const point of points) {
    const last = kept.at(-1)

    if (
      last === undefined ||
      Math.hypot(point.x - last.x, point.y - last.y) >= SMALLEST_STEP
    ) {
      kept.push(point)
    }
  }

  return kept.length < 3
    ? null
    : `M${kept.map(({ x, y }) => `${x},${y}`).join('L')}Z`
}

const simplifiedPath = (path: string): string =>
  path
    .split('M')
    .map((ring) => ring.replace('Z', ''))
    .filter((ring) => ring !== '')
    .flatMap((ring) => simplifiedRing(ring) ?? [])
    .join('')

const silhouetteOf = (pieces: Polygon[]): string => {
  const mainland: MultiPolygon = {
    coordinates: pieces.map((piece) => piece.coordinates),
    type: 'MultiPolygon'
  }
  const [longitude, latitude] = geoCentroid(mainland)
  const projection = geoAzimuthalEqualArea()
    .rotate([-longitude, -latitude])
    .fitExtent(
      [
        [MARGIN, MARGIN],
        [VIEW_BOX - MARGIN, VIEW_BOX - MARGIN]
      ],
      mainland
    )
  const path = geoPath(projection).digits(1)(mainland)

  if (path === null) {
    throw new Error('A mainland drew no path')
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW_BOX} ${VIEW_BOX}"><path fill-rule="evenodd" d="${simplifiedPath(path)}"/></svg>\n`
}

const silhouetteFileName = (svg: string): string =>
  `${createHash('sha256').update(svg).digest('hex').slice(0, 12)}.svg`

const decoysOf = ({
  centres,
  code
}: {
  centres: ReadonlyMap<CountryCode, [number, number]>
  code: CountryCode
}): [CountryCode, CountryCode, CountryCode] => {
  const centre = centres.get(code) ?? [0, 0]
  const [first, second, third] = [...centres.entries()]
    .filter(([other]) => other !== code)
    .map(([other, point]) => ({ code: other, km: distanceKm(centre, point) }))
    .toSorted((one, other) => one.km - other.km)
    .map((other) => other.code)

  if (first === undefined || second === undefined || third === undefined) {
    throw new Error(`${code} found fewer than three decoys`)
  }

  return [first, second, third]
}

const main = async () => {
  const flags = orStop(
    readJsonFile(FLAG_BANK_PATH, flagBankSchema),
    'flag-bank.json'
  )
  const drawn = flags.flatMap((flag) => {
    if (NOT_ASKED.has(flag.code)) {
      return []
    }

    const geometry = countryGeometryOf(flag.code)
    const mainland = geometry === null ? [] : mainlandOf(geometry)
    const [largest] = mainland

    if (
      largest === undefined ||
      areaKm2(largest) < SMALLEST_LARGEST_PIECE_KM2
    ) {
      return []
    }

    return [
      {
        centre: geoCentroid(largest),
        code: flag.code,
        isWellKnown: flag.isWellKnown,
        svg: silhouetteOf(mainland)
      }
    ]
  })
  const centres = new Map(
    drawn.map((country) => [country.code, country.centre])
  )

  await rm(SILHOUETTES_TARGET, { force: true, recursive: true })
  await mkdir(SILHOUETTES_TARGET, { recursive: true })

  const rows = []

  for (const country of drawn) {
    const file = silhouetteFileName(country.svg)

    await writeFile(join(SILHOUETTES_TARGET, file), country.svg, 'utf8')
    rows.push({
      code: country.code,
      decoys: decoysOf({ centres, code: country.code }),
      file,
      isWellKnown: country.isWellKnown
    })
  }

  await writeFile(BANK_PATH, `${JSON.stringify(rows, null, 2)}\n`, 'utf8')
  console.info(
    `${rows.length} silhouettes of ${flags.length} flags, ${rows.filter((row) => row.isWellKnown).length} well known`
  )
}

await main()
