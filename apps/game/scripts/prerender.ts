import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import {
  addFontPreloads,
  appendStructuredData,
  htmlFileForPath,
  inlinePageStylesheets,
  originOfCanonical,
  parseDocument,
  readBuildManifest,
  renderIntoShell,
  serializeDocument,
  setMetaContents,
  writeLanguageVersions
} from '@adrienlcp/prerender'

import type { Locale } from '@melee/protocol/locale'

import type { PrerenderedPage, RenderedPage } from '../src/entry-server'
import type { IndexedPage } from '../src/presentation/head/document-head'

type EntryServer = {
  imageAlts: Record<Locale, string>
  openGraphLocales: Record<Locale, string>
  prerenderedPages: PrerenderedPage[]
  renderPage: (page: PrerenderedPage) => Promise<RenderedPage>
  shareImagePaths: Record<Locale, string>
  headScripts: readonly string[]
  landingSequenceScript: (entry: string) => string
}

const GAME_ROOT = resolve(import.meta.dirname, '..')
const CLIENT_DIR = join(GAME_ROOT, 'dist')
const SERVER_ENTRY = join(GAME_ROOT, 'dist-ssr', 'entry-server.js')

/**
 * What the server reads to learn which URL is answered by which file. A
 * manifest rather than a shared list, because the build is the only thing that
 * knows what it actually wrote: a page that failed to render cannot leave a
 * route behind pointing at a file that is not there.
 */
const MANIFEST_FILE = 'prerendered.json'

/** The module script Vite builds into the shell's head. */
const ENTRY_SCRIPT = 'head > script[type="module"][src]'

const shell = await readFile(join(CLIENT_DIR, 'index.html'), 'utf8')
const origin = originOfCanonical(parseDocument(shell))
const buildManifest = await readBuildManifest(CLIENT_DIR)

const {
  imageAlts,
  openGraphLocales,
  prerenderedPages,
  renderPage,
  headScripts,
  landingSequenceScript,
  shareImagePaths
}: EntryServer = await import(pathToFileURL(SERVER_ENTRY).href)

/**
 * Swaps the entry's module script for the landing sequence that starts it once
 * the page has arrived, and preloads the entry in its place so the wait costs
 * no download.
 */
const startEntryAfterLanding = (document: Document): void => {
  const entryScript = document.querySelector(ENTRY_SCRIPT)
  const entry = entryScript?.getAttribute('src')

  if (entryScript == null || entry == null) {
    throw new Error('The shell has no entry module script to start')
  }

  const preload = document.createElement('link')
  const sequence = document.createElement('script')

  preload.setAttribute('rel', 'modulepreload')
  preload.setAttribute('crossorigin', '')
  preload.setAttribute('href', entry)
  sequence.textContent = landingSequenceScript(entry)
  entryScript.replaceWith(preload, sequence)
}

const appendHeadScripts = (document: Document): void => {
  for (const source of headScripts) {
    const script = document.createElement('script')

    script.textContent = source
    document.head.append(script)
  }
}

/** The same page in every language, this one included: `hreflang` must be reciprocal. */
const siblingsOf = (page: IndexedPage): PrerenderedPage[] =>
  prerenderedPages.filter((candidate) => candidate.page === page)

const structuredDataFor = ({
  description,
  locale,
  url
}: {
  description: string
  locale: Locale
  url: string
}): object => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  description,
  inLanguage: locale,
  name: 'Mêlée',
  url
})

const documentFor = async (page: PrerenderedPage): Promise<string> => {
  const document = parseDocument(shell)
  const { description, html } = await renderPage(page)
  const url = `${origin}${page.path}`
  const { title } = renderIntoShell({ document, html, path: page.path })

  document.documentElement.setAttribute('lang', page.locale)
  setMetaContents({
    document,
    metaContents: {
      'name="description"': description,
      'property="og:description"': description,
      'property="og:image:alt"': imageAlts[page.locale],
      'property="og:image"': `${origin}${shareImagePaths[page.locale]}`,
      'property="og:title"': title,
      'property="og:url"': url
    }
  })
  writeLanguageVersions({
    current: url,
    document,
    versions: siblingsOf(page.page).map((sibling) => ({
      href: `${origin}${sibling.path}`,
      hreflang: sibling.locale,
      openGraphLocale: openGraphLocales[sibling.locale]
    })),
    // The root negotiates and redirects, which is exactly what `x-default` is
    // for: a crawler that finds no reciprocal match has somewhere to be sent.
    xDefault: `${origin}/`
  })

  const { css } = await inlinePageStylesheets({
    clientDir: CLIENT_DIR,
    document,
    manifest: buildManifest,
    modules: [page.module]
  })

  addFontPreloads({ css, document })
  appendHeadScripts(document)
  startEntryAfterLanding(document)
  appendStructuredData({
    data: structuredDataFor({ description, locale: page.locale, url }),
    document
  })

  return serializeDocument(document)
}

const manifest: { file: string; url: string }[] = []

for (const page of prerenderedPages) {
  const file = htmlFileForPath(page.path)
  const destination = join(CLIENT_DIR, file)

  await mkdir(dirname(destination), { recursive: true })
  await writeFile(destination, await documentFor(page), 'utf8')

  manifest.push({ file, url: page.path })
}

await writeFile(
  join(CLIENT_DIR, MANIFEST_FILE),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8'
)

console.info(
  `prerendered ${manifest.length} documents into ${CLIENT_DIR} at ${origin}`
)
