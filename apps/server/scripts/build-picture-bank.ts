// cspell:words apos Araras margem extmetadata iiextmetadatafilter iiprop iiurlwidth imageinfo pageimage pageimages piprop thumburl Toubkal
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'
import { z } from 'zod'

import { compareText } from '@melee/core/helpers/collation'

import { orStop, parseJson, readJsonFile } from './json-file'
import { cached, chunked } from './question-source'
import { wait } from './wait'
import {
  bindingValue,
  SPARQL_URL,
  sparqlBindingsSchema,
  USER_AGENT,
  withRetries
} from './wikimedia-client'

/**
 * Writes the photographs an estimate question shows beside the thing it asks
 * about: one WebP per picture under `apps/game/public/pictures/`, named after
 * its content, `picture-bank.json` beside the quantity bank saying which file
 * is which row and how it is shaped, and `picture-credits.json` beside the
 * credits page, one line per Commons file. Run it with
 * `pnpm --filter @melee/server pictures:build`.
 *
 * A mountain, a building or a river takes its Wikidata image (`P18`); a price
 * takes the Commons file its row names by hand (`image` in `price-bank.json`),
 * because no query finds _a PS5 with its disc drive_. Only rows a table can be
 * expected to know are pictured — the hard tier waits for the budget.
 */
const HERE = dirname(fileURLToPath(import.meta.url))
const CACHE_DIRECTORY = join(HERE, '.cache', 'pictures')
const PICTURES_TARGET = join(HERE, '..', '..', 'game', 'public', 'pictures')
const QUESTIONS_DIRECTORY = join(
  HERE,
  '..',
  'src',
  'infrastructure',
  'questions'
)
const QUANTITY_BANK_PATH = join(QUESTIONS_DIRECTORY, 'quantity-bank.json')
const PRICE_BANK_PATH = join(QUESTIONS_DIRECTORY, 'price-bank.json')
const PICTURE_BANK_PATH = join(QUESTIONS_DIRECTORY, 'picture-bank.json')
const CREDITS_PATH = join(
  HERE,
  '..',
  '..',
  'game',
  'src',
  'features',
  'credits',
  'picture-credits.json'
)

const COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php'
const COMMONS_FILE_PAGE_URL = 'https://commons.wikimedia.org/wiki/'
const PUBLIC_DOMAIN_MARK_URL =
  'https://creativecommons.org/publicdomain/mark/1.0/'

const PHOTOGRAPHED_FAMILIES: ReadonlySet<string> = new Set([
  'elevation.mountain',
  'height.building',
  'length.river'
])

/**
 * Wikimedia serves a thumbnail at a few standard widths only, and refuses the
 * rest from a script; this one is the smallest above twice the shipped size.
 */
const DOWNLOADED_WIDTH = 1280
const LONG_SIDE = 640
const WEBP_QUALITY = 75

/**
 * Past these, a picture at 640px on its long side is a strip — a mountain
 * range's panorama, a river seen from a satellite — that a card shows as a
 * line. A tower stands taller than a panorama lies wide, and is still a
 * tower at a third of its height. The row's next image is tried, and none at
 * all beats a strip.
 */
const WIDEST_RATIO = 2.3
const TALLEST_RATIO = 1 / 3.2

/**
 * Public domain, CC0, CC BY and CC BY-SA, in any version or port: the
 * licences that let an app resize a file and ship it. A non-commercial or
 * no-derivatives file, a GFDL-only one and fair use are refused.
 */
const FREE_LICENCE = /^(?:pd|cc0|cc-by(?:-sa)?-\d(?:\.\d)?(?:-[a-z]{2,})*)$/

/**
 * Files a row's query offered that were looked at and refused: a terrain
 * render standing in for Toubkal, and macaws on the Madeira's bank.
 */
const REFUSED_BY_EYE: ReadonlySet<string> = new Set([
  'File:Araras na margem do rio Madeira.jpg',
  'File:Toubkal 7.90965W 31.05231N.jpg'
])

/**
 * A row read from Wikidata takes a photograph, never a drawing: the PNGs its
 * images and lead images offer are maps, and a river's map draws its length.
 * A price names its file by hand, and a console on a white ground is a PNG.
 */
const PHOTOGRAPH_MIME = 'image/jpeg'

const DOWNLOAD_INTERVAL_MS = 400
const DOWNLOAD_RETRIES = 4
const RETRY_BACKOFF_MS = 5_000

const quantityBankSchema = z.array(
  z.object({
    entity: z.string(),
    family: z.string(),
    wellKnownIn: z.array(z.string())
  })
)

const priceBankSchema = z.array(
  z.object({
    entity: z.string(),
    image: z.string().startsWith('File:').optional()
  })
)

const metadataValue = z.object({ value: z.string() }).optional()

const imageInfoSchema = z.object({
  query: z
    .object({
      normalized: z.array(z.object({ from: z.string(), to: z.string() })),
      pages: z.array(
        z.object({
          imageinfo: z
            .array(
              z.object({
                extmetadata: z.object({
                  Artist: metadataValue,
                  Credit: metadataValue,
                  License: metadataValue,
                  LicenseShortName: metadataValue,
                  LicenseUrl: metadataValue
                }),
                height: z.number(),
                mime: z.string(),
                thumburl: z.string(),
                user: z.string(),
                width: z.number()
              })
            )
            .optional(),
          missing: z.boolean().optional(),
          title: z.string()
        })
      ),
      redirects: z.array(z.object({ from: z.string(), to: z.string() }))
    })
    .partial({ normalized: true, redirects: true })
})

type CommonsFile = {
  author: string
  height: number
  licence: string
  licenceUrl: string
  mime: string
  thumbUrl: string
  title: string
  width: number
}

const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  gt: '>',
  lt: '<',
  nbsp: ' ',
  quot: '"'
}

/** Commons' `Artist` and `Credit` are HTML — a link to a user page, a creator template. */
const plainTextOf = (html: string): string =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number(code))
    )
    .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16))
    )
    .replace(/&([a-z]+);/gi, (entity, name: string) =>
      name in HTML_ENTITIES ? (HTML_ENTITIES[name] ?? entity) : entity
    )
    .replace(/\s+/g, ' ')
    .trim()

/**
 * Commons writes this sentence where a file page names nobody, around the
 * uploader it falls back to: the name is the credit, the sentence is not.
 */
const ASSUMED_AUTHOR =
  /^No machine-readable author provided\. (.+) assumed \(based on copyright claims\)\.$/

const authorOf = (text: string): string => text.replace(ASSUMED_AUTHOR, '$1')

/**
 * An `Artist` field this long is a whole licence notice pasted in by hand,
 * not a name a credits line can hold; the row's next image is tried.
 */
const LONGEST_AUTHOR = 160

const titleOfFilePath = (uri: string): string =>
  `File:${decodeURIComponent(uri.split('/').at(-1) ?? uri).replaceAll('_', ' ')}`

const entityIdOf = (uri: string): string => uri.split('/').at(-1) ?? uri

const shortHash = (text: string | Uint8Array): string =>
  createHash('sha256').update(text).digest('hex').slice(0, 12)

const wikidataImagesOf = async (
  entities: readonly string[]
): Promise<Map<string, string[]>> => {
  const query = `SELECT ?item ?image WHERE {
    VALUES ?item { ${entities.map((entity) => `wd:${entity}`).join(' ')} }
    ?item wdt:P18 ?image.
  }`
  const schema = sparqlBindingsSchema({
    image: bindingValue,
    item: bindingValue
  })
  const text = await cached(`picture-p18-${shortHash(query)}.json`, async () =>
    JSON.stringify(
      await withRetries(schema, async () =>
        fetch(SPARQL_URL, {
          body: new URLSearchParams({ query }),
          headers: {
            accept: 'application/sparql-results+json',
            'user-agent': USER_AGENT
          },
          method: 'POST'
        })
      )
    )
  )
  const images = new Map<string, string[]>()

  for (const { image, item } of orStop(parseJson(text, schema), 'P18').results
    .bindings) {
    const entity = entityIdOf(item.value)

    images.set(
      entity,
      [...(images.get(entity) ?? []), titleOfFilePath(image.value)].toSorted()
    )
  }

  return images
}

const WIKIS = [
  { host: 'fr.wikipedia.org', site: 'https://fr.wikipedia.org/' },
  { host: 'en.wikipedia.org', site: 'https://en.wikipedia.org/' }
] as const

const pageImagesSchema = z.object({
  query: z.object({
    normalized: z
      .array(z.object({ from: z.string(), to: z.string() }))
      .optional(),
    pages: z.array(
      z.object({ pageimage: z.string().optional(), title: z.string() })
    )
  })
})

/**
 * The French then the English article's lead image, for a row whose `P18`
 * was refused: Mont Blanc's is a panorama three times as wide as it is tall,
 * and its articles open on the mountain itself.
 */
const leadImagesOf = async (
  entities: readonly string[]
): Promise<Map<string, string[]>> => {
  const images = new Map<string, string[]>()

  if (entities.length === 0) {
    return images
  }

  const query = `SELECT ?item ?article ?site WHERE {
    VALUES ?item { ${entities.map((entity) => `wd:${entity}`).join(' ')} }
    VALUES ?site { ${WIKIS.map(({ site }) => `<${site}>`).join(' ')} }
    ?link schema:about ?item; schema:isPartOf ?site; schema:name ?article.
  }`
  const schema = sparqlBindingsSchema({
    article: bindingValue,
    item: bindingValue,
    site: bindingValue
  })
  const text = await cached(
    `picture-articles-${shortHash(query)}.json`,
    async () =>
      JSON.stringify(
        await withRetries(schema, async () =>
          fetch(SPARQL_URL, {
            body: new URLSearchParams({ query }),
            headers: {
              accept: 'application/sparql-results+json',
              'user-agent': USER_AGENT
            },
            method: 'POST'
          })
        )
      )
  )
  const articles = orStop(parseJson(text, schema), 'articles').results.bindings

  for (const { host, site } of WIKIS) {
    const entityOf = new Map(
      articles
        .filter((binding) => binding.site.value === site)
        .map(({ article, item }) => [article.value, entityIdOf(item.value)])
    )

    for (const batch of chunked({ items: [...entityOf.keys()], size: 50 })) {
      const parameters = new URLSearchParams({
        action: 'query',
        format: 'json',
        formatversion: '2',
        piprop: 'name',
        prop: 'pageimages',
        titles: batch.join('|')
      })
      const answer = await cached(
        `picture-lead-${shortHash(`${host}${parameters}`)}.json`,
        async () =>
          JSON.stringify(
            await withRetries(pageImagesSchema, async () =>
              fetch(`https://${host}/w/api.php`, {
                body: parameters,
                headers: { 'user-agent': USER_AGENT },
                method: 'POST'
              })
            )
          )
      )
      const { query: pages } = orStop(parseJson(answer, pageImagesSchema), host)
      const asked = new Map(
        (pages.normalized ?? []).map(({ from, to }) => [to, from])
      )

      for (const page of pages.pages) {
        const entity = entityOf.get(asked.get(page.title) ?? page.title)

        if (entity !== undefined && page.pageimage !== undefined) {
          images.set(entity, [
            ...(images.get(entity) ?? []),
            `File:${page.pageimage.replaceAll('_', ' ')}`
          ])
        }
      }
    }
  }

  return images
}

const commonsFileOf = ({
  info,
  title
}: {
  info: NonNullable<
    z.infer<typeof imageInfoSchema>['query']['pages'][number]['imageinfo']
  >[number]
  title: string
}): CommonsFile | string => {
  const { extmetadata } = info
  const licenceCode = (extmetadata.License?.value ?? '').toLowerCase()

  if (!FREE_LICENCE.test(licenceCode)) {
    return `licence ${licenceCode || extmetadata.LicenseShortName?.value || 'none'}`
  }

  const author = authorOf(
    plainTextOf(extmetadata.Artist?.value ?? '') ||
      plainTextOf(extmetadata.Credit?.value ?? '') ||
      info.user
  )

  if (author.length > LONGEST_AUTHOR) {
    return `an author of ${author.length} characters`
  }

  const ratio = info.width / info.height

  if (ratio > WIDEST_RATIO || ratio < TALLEST_RATIO) {
    return `shaped ${info.width}×${info.height}`
  }

  return {
    author,
    height: info.height,
    licence: extmetadata.LicenseShortName?.value ?? licenceCode,
    licenceUrl: extmetadata.LicenseUrl?.value ?? PUBLIC_DOMAIN_MARK_URL,
    mime: info.mime,
    thumbUrl: info.thumburl,
    title,
    width: info.width
  }
}

/**
 * Every title's licence, author, shape and thumbnail, or why it was refused.
 * A title is looked up under the name Commons settles it on — a redirect, a
 * normalised underscore — and answered under the one it was asked by.
 */
const commonsFilesOf = async (
  titles: readonly string[]
): Promise<Map<string, CommonsFile | string>> => {
  const files = new Map<string, CommonsFile | string>()

  for (const batch of chunked({ items: [...new Set(titles)], size: 50 })) {
    const parameters = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      iiextmetadatafilter: 'Artist|Credit|License|LicenseShortName|LicenseUrl',
      iiprop: 'extmetadata|mime|size|url|user',
      iiurlwidth: String(DOWNLOADED_WIDTH),
      prop: 'imageinfo',
      redirects: '1',
      titles: batch.join('|')
    })
    const text = await cached(
      `picture-info-${shortHash(parameters.toString())}.json`,
      async () =>
        JSON.stringify(
          await withRetries(imageInfoSchema, async () =>
            fetch(COMMONS_API_URL, {
              body: parameters,
              headers: { 'user-agent': USER_AGENT },
              method: 'POST'
            })
          )
        )
    )
    const { query } = orStop(parseJson(text, imageInfoSchema), 'imageinfo')
    const settled = new Map(
      [...(query.normalized ?? []), ...(query.redirects ?? [])].map(
        ({ from, to }) => [from, to]
      )
    )
    const pages = new Map(query.pages.map((page) => [page.title, page]))

    for (const title of batch) {
      const normalised = settled.get(title) ?? title
      const page = pages.get(settled.get(normalised) ?? normalised)
      const info = page?.imageinfo?.[0]

      files.set(
        title,
        info === undefined
          ? 'missing on Commons'
          : commonsFileOf({ info, title: page?.title ?? title })
      )
    }
  }

  return files
}

const downloaded = async (file: CommonsFile): Promise<Buffer> => {
  await mkdir(CACHE_DIRECTORY, { recursive: true })

  const path = join(CACHE_DIRECTORY, shortHash(file.thumbUrl))

  try {
    return await readFile(path)
  } catch {
    for (let attempt = 1; ; attempt++) {
      await wait(DOWNLOAD_INTERVAL_MS)

      const response = await fetch(file.thumbUrl, {
        headers: { 'user-agent': USER_AGENT }
      })

      if (response.ok) {
        const bytes = Buffer.from(await response.arrayBuffer())

        await writeFile(path, bytes)

        return bytes
      }

      if (attempt > DOWNLOAD_RETRIES) {
        throw new Error(`${file.title} answered ${response.status}`)
      }

      await wait(RETRY_BACKOFF_MS * attempt)
    }
  }
}

const webpOf = async (
  source: Buffer
): Promise<{ bytes: Buffer; height: number; width: number }> => {
  const { data, info } = await sharp(source)
    .rotate()
    .resize({
      fit: 'inside',
      height: LONG_SIDE,
      width: LONG_SIDE,
      withoutEnlargement: true
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true })

  return { bytes: data, height: info.height, width: info.width }
}

const main = async () => {
  const quantities = orStop(
    readJsonFile(QUANTITY_BANK_PATH, quantityBankSchema),
    'quantity-bank.json'
  )
  const prices = orStop(
    readJsonFile(PRICE_BANK_PATH, priceBankSchema),
    'price-bank.json'
  )
  const photographed = [
    ...new Set(
      quantities
        .filter(
          (row) =>
            PHOTOGRAPHED_FAMILIES.has(row.family) && row.wellKnownIn.length > 0
        )
        .map((row) => row.entity)
    )
  ]
  const wikidataImages = await wikidataImagesOf(photographed)
  const candidatesOf = new Map<string, string[]>([
    ...photographed.map((entity): [string, string[]] => [
      entity,
      wikidataImages.get(entity) ?? []
    ]),
    ...prices.flatMap((row): [string, string[]][] =>
      row.image === undefined ? [] : [[row.entity, [row.image]]]
    )
  ])
  const files = await commonsFilesOf([...candidatesOf.values()].flat())
  const queried = new Set(photographed)
  const verdictOf = ({
    entity,
    title
  }: {
    entity: string
    title: string
  }): CommonsFile | string => {
    const file = files.get(title) ?? 'never asked'

    if (REFUSED_BY_EYE.has(title)) {
      return 'refused by eye'
    }

    if (
      typeof file === 'object' &&
      queried.has(entity) &&
      file.mime !== PHOTOGRAPH_MIME
    ) {
      return `a ${file.mime}`
    }

    return file
  }
  const pictureOf = (entity: string): CommonsFile | undefined =>
    (candidatesOf.get(entity) ?? [])
      .map((title) => verdictOf({ entity, title }))
      .find((verdict): verdict is CommonsFile => typeof verdict !== 'string')
  const withoutPicture = photographed.filter(
    (entity) => pictureOf(entity) === undefined
  )
  const leadImages = await leadImagesOf(withoutPicture)

  for (const entity of withoutPicture) {
    candidatesOf.set(entity, [
      ...new Set([
        ...(candidatesOf.get(entity) ?? []),
        ...(leadImages.get(entity) ?? [])
      ])
    ])
  }

  for (const [title, file] of await commonsFilesOf(
    [...leadImages.values()].flat().filter((title) => !files.has(title))
  )) {
    files.set(title, file)
  }

  await rm(PICTURES_TARGET, { force: true, recursive: true })
  await mkdir(PICTURES_TARGET, { recursive: true })

  const rows: {
    entity: string
    file: string
    height: number
    width: number
  }[] = []
  const credits = new Map<
    string,
    {
      author: string
      licence: string
      licenceUrl: string
      page: string
      title: string
    }
  >()
  const refusals: string[] = []
  let shippedBytes = 0

  for (const [entity, titles] of [...candidatesOf.entries()].toSorted(
    ([one], [other]) => compareText(one, other)
  )) {
    const chosen = pictureOf(entity)

    if (chosen === undefined) {
      refusals.push(
        `${entity}: ${titles.length === 0 ? 'no image' : titles.map((title) => `${title} (${verdictOf({ entity, title })})`).join(', ')}`
      )
      continue
    }

    const picture = await webpOf(await downloaded(chosen))
    const file = `${shortHash(picture.bytes)}.webp`

    if (!credits.has(file)) {
      await writeFile(join(PICTURES_TARGET, file), picture.bytes)
      shippedBytes += picture.bytes.length
    }

    rows.push({ entity, file, height: picture.height, width: picture.width })
    credits.set(file, {
      author: chosen.author,
      licence: chosen.licence,
      licenceUrl: chosen.licenceUrl,
      page: `${COMMONS_FILE_PAGE_URL}${encodeURIComponent(chosen.title.replaceAll(' ', '_')).replaceAll('%3A', ':')}`,
      title: chosen.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, '')
    })
  }

  const creditLines = [...credits.values()]
    .filter(
      (credit, index, all) =>
        all.findIndex((other) => other.page === credit.page) === index
    )
    .toSorted((one, other) => compareText(one.title, other.title))

  await writeFile(
    PICTURE_BANK_PATH,
    `${JSON.stringify(rows, null, 2)}\n`,
    'utf8'
  )
  await writeFile(
    CREDITS_PATH,
    `${JSON.stringify(creditLines, null, 2)}\n`,
    'utf8'
  )

  for (const refusal of refusals) {
    console.info(`no picture for ${refusal}`)
  }

  console.info(
    `${rows.length} rows pictured of ${candidatesOf.size}, ${credits.size} files, ${(shippedBytes / 1024 / 1024).toFixed(1)} MiB`
  )
}

await main()
