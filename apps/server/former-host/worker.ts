const HOST = 'melee.adrienlcp.com'

/** Sends every request for the product's former address to the same path on its own. */
export default {
  fetch: (request: Request): Response => {
    const url = new URL(request.url)
    url.hostname = HOST

    return Response.redirect(url.toString(), 301)
  }
}
