import type { ErrorReport, InAppBrowser } from '@melee/protocol/http'

export type BrowserIdentity = ErrorReport['browser']

/**
 * Ordered: an Edge, an Opera and a Samsung browser all say `Chrome/` too, and
 * every browser on an iPhone says `Safari/`, so the first match wins.
 */
const BROWSER_PATTERNS: readonly [BrowserIdentity['name'], RegExp][] = [
  ['edge', /\bEdg(?:e|A|iOS)?\/([\d.]+)/],
  ['opera', /\b(?:OPR|Opera)\/([\d.]+)/],
  ['samsung-internet', /\bSamsungBrowser\/([\d.]+)/],
  ['firefox', /\b(?:Firefox|FxiOS)\/([\d.]+)/],
  ['chrome', /\b(?:HeadlessChrome|Chrome|CriOS|Chromium)\/([\d.]+)/],
  ['safari', /\bVersion\/([\d.]+).*\bSafari\//]
]

const SYSTEM_PATTERNS: readonly [BrowserIdentity['system'], RegExp][] = [
  ['tizen', /\bTizen\b/],
  ['webos', /\bWeb0S\b|\bwebOS\b/],
  ['android', /\bAndroid\b/],
  ['ios', /\biPhone\b|\biPad\b|\biPod\b/],
  ['chromeos', /\bCrOS\b/],
  ['windows', /\bWindows\b/],
  ['macos', /\bMac OS X\b|\bMacintosh\b/],
  ['linux', /\bLinux\b/]
]

/**
 * The browser's family, major-and-minor version and system, read off the user
 * agent so the agent itself never leaves the device: an error report names a
 * Chrome 94 on a Tizen TV, not the forty words that fingerprint one.
 */
export const browserIdentityOf = (userAgent: string): BrowserIdentity => {
  const browser = BROWSER_PATTERNS.find(([, pattern]) =>
    pattern.test(userAgent)
  )
  const system =
    SYSTEM_PATTERNS.find(([, pattern]) => pattern.test(userAgent))?.[0] ??
    'other'

  if (browser === undefined) {
    return { name: 'other', system, version: '' }
  }

  const [name, pattern] = browser
  const fullVersion = pattern.exec(userAgent)?.[1] ?? ''

  return {
    name,
    system,
    version: fullVersion.split('.').slice(0, 2).join('.')
  }
}

/**
 * Ordered: Messenger's browser says `FBAN` like Facebook's, so it is asked
 * first. These are the browsers a link shared in a chat opens in, and the
 * ones whose keyboard and viewport behave least like the engine they wrap.
 */
const IN_APP_PATTERNS: readonly [InAppBrowser, RegExp][] = [
  ['messenger', /\bMessenger|FB_IAB\/MESSENGER|FBAN\/Messenger/i],
  ['instagram', /\bInstagram\b/],
  ['facebook', /\bFBAN\/|\bFBAV\/|\bFB_IAB\//],
  ['whatsapp', /\bWhatsApp\b/],
  ['tiktok', /\bmusical_ly\b|\bTikTok\b|\bBytedanceWebview\b/],
  ['snapchat', /\bSnapchat\b/]
]

/** The app whose own browser this is, or `null` for a browser of its own. */
export const inAppBrowserOf = (userAgent: string): InAppBrowser | null =>
  IN_APP_PATTERNS.find(([, pattern]) => pattern.test(userAgent))?.[0] ?? null
