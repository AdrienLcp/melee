import { describe, expect, it } from 'vitest'

import { browserIdentityOf, inAppBrowserOf } from './browser-identity'

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

describe('in-app browser', () => {
  it.each([
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 357.0.0.25.101 (iPhone15,2; iOS 18_1; fr_FR; fr; scale=3.00; 1179x2556; 657026112)',
      'instagram'
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/466.0.0.41.106;FBBV/600000000;FBDV/iPhone14,5]',
      'messenger'
    ],
    [
      'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.6778.39 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/490.0.0.50.82;]',
      'facebook'
    ],
    [
      'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36 musical_ly_2023709030 BytedanceWebview/d8a21c6',
      'tiktok'
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Snapchat/13.12.0.36 (like Safari/8618.1.15.10.15, panda)',
      'snapchat'
    ],
    [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
      null
    ]
  ])('[bug-reports] reads %s as %s', (userAgent, expected) => {
    expect(inAppBrowserOf(userAgent)).toBe(expected)
  })
})
