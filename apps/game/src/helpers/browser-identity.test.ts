import { describe, expect, it } from 'vitest'

import { browserIdentityOf } from './browser-identity'

describe('browser identity', () => {
  it.each([
    [
      'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) 94.0.4606.31/6.0 TV Safari/537.36 Chrome/94.0.4606.31',
      { name: 'chrome', system: 'tizen', version: '94.0' }
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.2903.70',
      { name: 'edge', system: 'windows', version: '131.0' }
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1',
      { name: 'chrome', system: 'ios', version: '126.0' }
    ],
    [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15',
      { name: 'safari', system: 'macos', version: '14.1' }
    ],
    [
      'Mozilla/5.0 (X11; Linux x86_64; rv:78.0) Gecko/20100101 Firefox/78.0',
      { name: 'firefox', system: 'linux', version: '78.0' }
    ],
    [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/140.0.7339.16 Safari/537.36',
      { name: 'chrome', system: 'windows', version: '140.0' }
    ],
    ['curl/8.4.0', { name: 'other', system: 'other', version: '' }]
  ])('[reports] reads %s', (userAgent, identity) => {
    expect(browserIdentityOf(userAgent)).toEqual(identity)
  })
})
