import { LIGHTS_CELL_COUNT, type LightsCell } from '@melee/protocol/lights'

import { seededUnits } from '../helpers/random'

/** About one step in four lights a trap beside its target. */
export const TRAP_SHARE = 0.25

/** One light of the run: the cell to hit, and the trap lit beside it, `null` on most steps. */
export type LightsStep = {
  target: LightsCell
  trap: LightsCell | null
}

/** Drawn by its rank among the cells left once `excluded` — distinct cells — are set aside. */
const cellSkipping = ({
  excluded,
  unit
}: {
  excluded: readonly LightsCell[]
  unit: number
}): LightsCell => {
  let cell = Math.floor(unit * (LIGHTS_CELL_COUNT - excluded.length))

  for (const skipped of excluded.toSorted((left, right) => left - right)) {
    if (cell >= skipped) {
      cell += 1
    }
  }

  return cell
}

/**
 * The round's run, the same on every screen and on the server for one seed.
 * A target is never the cell just hit, so no light relights under the finger
 * that put it out, and a trap is never the target nor that cell either, so a
 * second tap of the same finger never lands on one.
 *
 * The trap is drawn on every step whether or not the room plays them, so a
 * seed lights the same targets with traps on or off.
 */
export const lightsRunOf = ({
  hasTraps,
  length,
  seed
}: {
  hasTraps: boolean
  length: number
  seed: number
}): LightsStep[] => {
  const nextUnit = seededUnits(seed)
  const run: LightsStep[] = []
  let previous: LightsCell | null = null

  for (let step = 0; step < length; step++) {
    const target = cellSkipping({
      excluded: previous === null ? [] : [previous],
      unit: nextUnit()
    })
    const isTrapped = nextUnit() < TRAP_SHARE
    const trapUnit = nextUnit()
    const trap =
      hasTraps && isTrapped
        ? cellSkipping({
            excluded: previous === null ? [target] : [target, previous],
            unit: trapUnit
          })
        : null

    run.push({ target, trap })
    previous = target
  }

  return run
}
