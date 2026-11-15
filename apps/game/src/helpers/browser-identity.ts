import type { ErrorReport } from '@melee/protocol/http'

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
