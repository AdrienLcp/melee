import { z } from 'zod'

/** Written by the game's build, beside the documents it lists. */
export const PRERENDER_MANIFEST = 'prerendered.json'

export const prerenderManifestSchema = z.array(
  z.object({ file: z.string(), url: z.string() })
)

export type PrerenderedDocument = z.infer<
  typeof prerenderManifestSchema
>[number]

/**
 * The prerendered documents, listed for a crawler. It exists because the front
 * door stopped linking to them: a shelf card opens a room now rather than going
 * to that game's page, and a page nothing points at is a page nobody finds.
 * Built from the manifest — a list kept by hand goes stale the day a game
 * reaches the shelf.
 */
export const sitemapXml = ({
  documents,
  origin
}: {
  documents: readonly PrerenderedDocument[]
  origin: string
}): string => {
  const entries = documents
    .map(({ url }) => `  <url><loc>${origin}${url}</loc></url>`)
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`
}

const NOTHING_INDEXED = 'User-agent: *\nDisallow: /'

/**
 * The file keeps its own prose; only the one line that needs an absolute URL
 * is added, because a static file cannot know which origin it was asked for.
 * A deployment that must stay out of every index answers {@link NOTHING_INDEXED}
 * instead, since it serves the same file as the real one.
 */
export const robotsTxt = ({
  isIndexable,
  origin,
  rules
}: {
  isIndexable: boolean
  origin: string
  rules: string
}): string =>
  isIndexable
    ? `${rules.trimEnd()}\n\nSitemap: ${origin}/sitemap.xml\n`
    : `${NOTHING_INDEXED}\n`
