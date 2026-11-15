import type { MiddlewareHandler } from 'hono'

import type { ApiErrorResponse } from '@melee/protocol/http'

/** The shape of a Workers Rate Limiting binding, so a test can stand in for it. */
export type RateLimiter = {
  limit: (options: { key: string }) => Promise<{ success: boolean }>
}

/**
 * A screen in a room is counted by the room, so a table whose every screen
 * hits the same bug spends one allowance; a screen in none by its address,
 * which is the limiter's key and never written anywhere.
 */
export const reportLimitKey = ({
  address,
  roomCode
}: {
  address: string | undefined
  roomCode: string | null
}): string =>
  roomCode === null ? `address:${address ?? 'unknown'}` : `room:${roomCode}`

/**
 * The platform's counter rather than one process's: an isolate holds nothing
 * between two requests. Its window is a minute at most, so each limit is set
 * in `wrangler.jsonc` per minute rather than per ten.
 */
const limitPerAddressWith =
  ({
    limiter,
    refusal
  }: {
    limiter: RateLimiter
    refusal: ApiErrorResponse
  }): MiddlewareHandler =>
  async (context, next) => {
    const { success } = await limiter.limit({
      key: context.req.header('CF-Connecting-IP') ?? 'unknown'
    })

    if (!success) {
      return context.json(refusal, 429)
    }

    await next()
  }

export const limitRoomCreationWith = (
  limiter: RateLimiter
): MiddlewareHandler =>
  limitPerAddressWith({
    limiter,
    refusal: {
      code: 'rate_limited',
      message: 'Too many rooms created from this address'
    }
  })

/** Each check spends a Deezer request, so a held-down press cannot drain the quota. */
export const limitSoundChecksWith = (limiter: RateLimiter): MiddlewareHandler =>
  limitPerAddressWith({
    limiter,
    refusal: {
      code: 'rate_limited',
      message: 'Too many sound checks from this address'
    }
  })
