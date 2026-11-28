import { describe, expect, it } from 'vitest'

import type { AtlasCityPlaces } from '@melee/protocol/atlas'
import type { difficulties } from '@melee/protocol/difficulty'

import { greatCircleKm } from '@melee/core/atlas/distance'

import { citiesOf } from './city-bank'
import { namingOf } from './map-naming'

const CITY_MAPS = [
  'frenchCities',
  'portugueseCities'
] as const satisfies readonly AtlasCityPlaces[]

const pointOf = (places: AtlasCityPlaces, name: string) =>
  citiesOf(places).find((city) => city.name === name)?.point

describe('namingOf, a city', () => {
  it('[atlas] deals four cities of the map, each one apart from the others', () => {
    for (const places of CITY_MAPS) {
      for (const city of citiesOf(places)) {
        const naming = namingOf({
          difficulty: 'mixed',
          isChoice: true,
          target: { kind: 'city', name: city.name, places, point: city.point }
        })

        expect(naming?.choices).toHaveLength(4)
        expect(naming?.correctChoiceIndex).not.toBeNull()

        const points = (naming?.choices ?? []).map((choice) =>
          pointOf(places, choice.fr)
        )

        for (const [index, point] of points.entries()) {
          for (const other of points.slice(index + 1)) {
            expect(point).toBeDefined()
            expect(other).toBeDefined()

            if (point !== undefined && other !== undefined) {
              expect(greatCircleKm(point, other)).toBeGreaterThan(40)
            }
          }
        }
      }
    }
  })

  it('[atlas] spreads the four names wider the easier the room', () => {
    const nearestGapKm = (difficulty: (typeof difficulties)[number]) => {
      const gaps = citiesOf('frenchCities').flatMap((city) => {
        const naming = namingOf({
          difficulty,
          isChoice: true,
          target: {
            kind: 'city',
            name: city.name,
            places: 'frenchCities',
            point: city.point
          }
        })

        return (naming?.decoys ?? []).flatMap((decoy) => {
          const point = pointOf('frenchCities', decoy.fr)

          return point === undefined ? [] : [greatCircleKm(city.point, point)]
        })
      })

      return Math.min(...gaps)
    }

    expect(nearestGapKm('easy')).toBeGreaterThan(nearestGapKm('mixed'))
    expect(nearestGapKm('mixed')).toBeGreaterThan(nearestGapKm('hard'))
  })
})
