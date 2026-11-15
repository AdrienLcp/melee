import type { MiddlewareHandler } from 'hono'

import type { ApiErrorResponse } from '@melee/protocol/http'

/** Shorter than this is a key somebody could guess, so the admin routes stay shut. */
export const ADMIN_TOKEN_MIN_LENGTH = 32

const nothingHere: ApiErrorResponse = {
  code: 'not_found',
  message: 'Nothing is served at this address'
}

const digestOf = async (text: string): Promise<Uint8Array> =>
  new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  )

/** Compares digests byte by byte to the end, so the time taken says nothing about how much matched. */
const isSameSecret = async ({
  expected,
  presented
}: {
  expected: string
  presented: string
}): Promise<boolean> => {
  const [left, right] = await Promise.all([
    digestOf(expected),
    digestOf(presented)
  ])
  let difference = 0

  for (const [index, byte] of left.entries()) {
    difference |= byte ^ (right[index] ?? 0)
  }

  return difference === 0
}

/**
 * The admin routes answer only a request carrying `Authorization: Bearer
 * <ADMIN_TOKEN>`. Anything else — no key, a wrong one, or a server with no key
 * set — gets the 404 an unknown path gets, so the routes do not say they exist.
 */
export const requireAdminToken =
  (adminToken: string | null): MiddlewareHandler =>
  async (context, next) => {
    const presented = context.req
      .header('Authorization')
      ?.match(/^Bearer (.+)$/)?.[1]
    const isAdmitted =
      adminToken !== null &&
      adminToken.length >= ADMIN_TOKEN_MIN_LENGTH &&
      presented !== undefined &&
      (await isSameSecret({ expected: adminToken, presented }))

    if (!isAdmitted) {
      return context.json(nothingHere, 404)
    }

    await next()
    context.header('Cache-Control', 'no-store')
    context.header('X-Robots-Tag', 'noindex')
  }
