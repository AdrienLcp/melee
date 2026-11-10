import type { SavedEvening } from './saved-evening'

/**
 * What a shared evening's fragment opens with, so a payload of a later shape
 * is told apart from this one rather than misread.
 */
const EVENING_LINK_VERSION = '1'

const VERSION_SEPARATOR = '.'

const throughStream = async ({
  bytes,
  stream
}: {
  bytes: Uint8Array<ArrayBuffer>
  stream: CompressionStream | DecompressionStream
}): Promise<Uint8Array<ArrayBuffer>> =>
  new Uint8Array(
    await new Response(
      new Blob([bytes]).stream().pipeThrough(stream)
    ).arrayBuffer()
  )

const base64UrlOf = (bytes: Uint8Array): string =>
  btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')

const bytesOfBase64Url = (text: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(
    atob(text.replaceAll('-', '+').replaceAll('_', '/')),
    (character) => character.charCodeAt(0)
  )

/**
 * The fragment a link carries `evening` in: its JSON, deflated and written in
 * base64url, behind the payload's version.
 */
export const eveningFragmentOf = async (
  evening: SavedEvening
): Promise<string> => {
  const deflated = await throughStream({
    bytes: new TextEncoder().encode(JSON.stringify(evening)),
    stream: new CompressionStream('deflate-raw')
  })

  return `${EVENING_LINK_VERSION}${VERSION_SEPARATOR}${base64UrlOf(deflated)}`
}

/**
 * What a fragment carries, still unread: `null` when it is no evening this
 * build wrote, so a truncated or hand-edited link reads as nothing rather than
 * as half an evening. The caller parses the rest with its own schema.
 */
export const eveningCarriedBy = async (fragment: string): Promise<unknown> => {
  const [version, payload, ...rest] = fragment
    .replace(/^#/, '')
    .split(VERSION_SEPARATOR)

  if (
    version !== EVENING_LINK_VERSION ||
    payload === undefined ||
    rest.length > 0
  ) {
    return null
  }

  try {
    const inflated = await throughStream({
      bytes: bytesOfBase64Url(payload),
      stream: new DecompressionStream('deflate-raw')
    })

    return JSON.parse(new TextDecoder().decode(inflated))
  } catch {
    return null
  }
}
