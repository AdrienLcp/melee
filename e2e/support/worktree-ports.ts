import { resolve } from 'node:path'

/**
 * Every checkout runs its end-to-end servers on ports of its own, so two
 * worktrees can run `pnpm test:e2e` at once: a worktree isolates files, never
 * ports. The slot comes from `MELEE_E2E_PORT_SLOT` when it is set, otherwise
 * from a hash of the checkout's path, so `C:/git/melee` and every
 * `C:/git/wt-*` land apart with no setup.
 *
 * The range sits clear of the dev stack (3100, 5273), under the ephemeral
 * ports every OS hands out (32768 and up) and under the blocks Hyper-V
 * reserves on Windows (`netsh int ipv4 show excludedportrange protocol=tcp`).
 */
const FIRST_PORT = 20_000
const PORTS_PER_SLOT = 3
const SLOT_COUNT = 2_600

const SLOT_VARIABLE = 'MELEE_E2E_PORT_SLOT'

const CHECKOUT_ROOT = resolve(import.meta.dirname, '..', '..')

/** FNV-1a, 32 bits: stable across runs and machines, unlike `Math.random`. */
const hashOf = (text: string): number => {
  let hash = 0x81_1c_9d_c5
  for (const character of text) {
    hash ^= character.codePointAt(0) ?? 0
    hash = Math.imul(hash, 0x01_00_01_93) >>> 0
  }
  return hash
}

/** Windows paths compare without case or slash direction: `C:\git` is `c:/git`. */
const normalizedPath = (path: string): string =>
  path.replaceAll('\\', '/').toLowerCase()

const slotFromEnvironment = (value: string): number => {
  const slot = Number(value)
  if (!Number.isInteger(slot) || slot < 0 || slot >= SLOT_COUNT) {
    throw new Error(
      `${SLOT_VARIABLE} must be an integer from 0 to ${SLOT_COUNT - 1}, got "${value}"`
    )
  }
  return slot
}

const portSlot = (): number => {
  const fromEnvironment = process.env[SLOT_VARIABLE]
  return fromEnvironment === undefined || fromEnvironment === ''
    ? hashOf(normalizedPath(CHECKOUT_ROOT)) % SLOT_COUNT
    : slotFromEnvironment(fromEnvironment)
}

const firstPortOfSlot = FIRST_PORT + portSlot() * PORTS_PER_SLOT

/** The three servers an end-to-end run starts, on this checkout's ports. */
export const E2E_PORTS = {
  app: firstPortOfSlot,
  catalogue: firstPortOfSlot + 2,
  server: firstPortOfSlot + 1
} as const
