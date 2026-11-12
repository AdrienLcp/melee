/** Where the game's build writes every file named after its content hash. */
export const HASHED_ASSET_ROUTE = '/assets/*'

/**
 * A hashed file never changes under its name, so a browser keeps it rather
 * than asking again on every page load: the asset server's own
 * `max-age=0, must-revalidate` cost each lazy screen a round trip per chunk,
 * and the menu's first open waited on twenty of them.
 */
export const HASHED_ASSET_CACHE_CONTROL = 'public, max-age=31536000, immutable'

const NOT_MODIFIED = 304

const isTheAssetItself = (response: Response): boolean =>
  response.ok || response.status === NOT_MODIFIED

/**
 * The asset server answers any path it does not hold with the SPA's shell,
 * which is right for a room's address and wrong for a chunk: a stylesheet
 * answered with HTML is dropped by the browser without a word, and a tab opened
 * before a deploy lost its style and its icons that way. A hashed file that is
 * gone is a 404, which is what lets the page notice and reload — and a 404 is
 * never cached for a year.
 */
export const servedHashedAsset = (response: Response): Response => {
  if (response.headers.get('Content-Type')?.startsWith('text/html') === true) {
    return new Response('No such asset in this build', { status: 404 })
  }

  if (!isTheAssetItself(response)) {
    return response
  }

  const cached = new Response(response.body, response)
  cached.headers.set('Cache-Control', HASHED_ASSET_CACHE_CONTROL)

  return cached
}
