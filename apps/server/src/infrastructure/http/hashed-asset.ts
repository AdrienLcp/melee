/** Where the game's build writes every file named after its content hash. */
export const HASHED_ASSET_ROUTE = '/assets/*'

/**
 * The asset server answers any path it does not hold with the SPA's shell,
 * which is right for a room's address and wrong for a chunk: a stylesheet
 * answered with HTML is dropped by the browser without a word, and a tab opened
 * before a deploy lost its style and its icons that way. A hashed file that is
 * gone is a 404, which is what lets the page notice and reload.
 */
export const refuseShellForHashedAsset = (response: Response): Response =>
  response.headers.get('Content-Type')?.startsWith('text/html') === true
    ? new Response('No such asset in this build', { status: 404 })
    : response
