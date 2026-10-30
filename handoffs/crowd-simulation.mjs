// cspell:disable -- seat names and Petit Bac words are French on purpose
import { mkdirSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire('C:/git/melee/package.json')
const { chromium } = require('@playwright/test')

const ORIGIN = 'http://localhost:5273'
const OUT = process.env.OUT
const WITH_WALL = process.env.WALL !== '0'
const SEATS = Number(process.env.SEATS ?? 32)
const GAMES = process.argv.slice(2)

const LONG = [
  'Anne-Charlotte Dupré',
  'Maximilien Laurent',
  'Jean-Baptiste Morel',
  'Ségolène Beauregard',
  'Wolfgang Amadeus',
  'Clémentine Fournier',
  'Grégoire de la Tour',
  'Marie-Antoinette X',
  'Bartholomew Smith',
  'Théodore Vandermeer',
  'Alexandrine Rossi',
  'Pierre-Emmanuel B.',
  'Hyacinthe Bouquet',
  'Constantin Nikolaïev'
]
const SHORT = [
  'Bob',
  'Æsa',
  'Kévin',
  'Éloïse',
  'Lou',
  'Cunégonde',
  'Zoé',
  'Ludivine',
  'Rémi',
  'Inès',
  'Hugo',
  'Yasmine',
  'Nathan',
  'Chloé',
  'Mathis',
  'Léa',
  'Sacha',
  'Emma'
]
const NAMES = [...LONG, ...SHORT]
const SEAT_NAME = 'Évariste Galois-K.'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const go = async (page, url) => {
  for (let i = 0; ; i++) {
    try {
      return await page.goto(url, {
        timeout: 45000,
        waitUntil: 'domcontentloaded'
      })
    } catch (error) {
      if (i >= 2) throw error
      await wait(5000)
    }
  }
}

const openWall = async (page) => {
  for (let i = 0; i < 6; i++) {
    const response = page
      .waitForResponse(
        (r) =>
          r.url().endsWith('/api/walls') && r.request().method() === 'POST',
        { timeout: 20000 }
      )
      .catch(() => null)
    await go(page, `${ORIGIN}/wall`)
    const answer = await response
    const body = answer && answer.status() === 201 ? await answer.json() : null
    if (body?.pairingCode) return body.pairingCode
    await wait(30000)
  }
  throw new Error('wall never got a pairing code')
}

const captureSockets = () => {
  const Native = window.WebSocket
  window.__socks = []
  window.WebSocket = class extends Native {
    constructor(...args) {
      super(...args)
      window.__socks.push(this)
      this.__log = []
      this.addEventListener('message', (event) => {
        try {
          this.__log.push(JSON.parse(event.data))
        } catch {}
      })
    }
  }
}

const measure = (page) =>
  page.evaluate(() => {
    const doc = document.scrollingElement
    const describe = (el) =>
      `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`
    const clipped = new Map()
    const outside = new Set()
    for (const el of document.querySelectorAll('body *')) {
      const style = getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden') continue
      const rect = el.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) continue
      if (
        el.scrollWidth > el.clientWidth + 1 &&
        el.clientWidth > 2 &&
        ['hidden', 'clip'].includes(style.overflowX)
      ) {
        const key = describe(el)
        clipped.set(key, (clipped.get(key) ?? 0) + 1)
      }
      if (rect.right > innerWidth + 1 && style.position !== 'fixed')
        outside.add(describe(el))
    }
    const scrollers = [...document.querySelectorAll('body *')]
      .filter(
        (el) =>
          ['auto', 'scroll'].includes(getComputedStyle(el).overflowY) &&
          el.scrollHeight > el.clientHeight + 1
      )
      .map((el) => `${describe(el)} ${el.scrollHeight}/${el.clientHeight}`)
    return {
      clipped: [...clipped].map(([key, n]) => `${key}×${n}`).slice(0, 10),
      outside: [...outside].slice(0, 6),
      pageX: doc.scrollWidth - innerWidth,
      pageY: doc.scrollHeight - innerHeight,
      scrollers: scrollers.slice(0, 6)
    }
  })

const run = async (game) => {
  const dir = `${OUT}/${WITH_WALL ? 'wall' : 'nowall'}/${game}`
  mkdirSync(dir, { recursive: true })
  const browser = await chromium.launch({ args: ['--mute-audio'] })
  const report = { game, shots: {}, timings: {} }
  const ctx = async (viewport) => {
    const context = await browser.newContext({ locale: 'fr-FR', viewport })
    await context.addInitScript(() => localStorage.setItem('melee:volume', '0'))
    return context
  }
  try {
    const driver = await (await ctx({ height: 600, width: 800 })).newPage()
    await go(driver, `${ORIGIN}/legal`)
    let created
    for (let i = 0; i < 8; i++) {
      created = await driver.evaluate(async (g) => {
        const res = await fetch('/api/rooms', {
          body: JSON.stringify({ games: [g], locale: 'fr' }),
          headers: { 'content-type': 'application/json' },
          method: 'POST'
        })
        return res.json()
      }, game)
      if (created.code) break
      await wait(30000)
    }
    const { code, hostToken } = created
    if (!code) throw new Error(`create failed ${JSON.stringify(created)}`)
    report.code = code

    const hostCtx = await ctx({ height: 900, width: 1440 })
    await hostCtx.addInitScript(captureSockets)
    await hostCtx.addInitScript(
      ({ code, hostToken }) =>
        localStorage.setItem(
          'melee:host-tokens',
          JSON.stringify([
            {
              at: Math.round(performance.timeOrigin + performance.now()),
              hostToken,
              roomCode: code
            }
          ])
        ),
      { code, hostToken }
    )
    const host = await hostCtx.newPage()
    await go(host, `${ORIGIN}/host/${code}`)

    let wall = null
    if (WITH_WALL) {
      wall = await (await ctx({ height: 1080, width: 1920 })).newPage()
      const pairingCode = await openWall(wall)
      report.wallPair = await driver.evaluate(
        async ({ pairingCode, code, hostToken }) =>
          (
            await fetch(`/api/walls/${pairingCode}/pair`, {
              body: JSON.stringify({ hostToken, roomCode: code }),
              headers: { 'content-type': 'application/json' },
              method: 'POST'
            })
          ).status,
        { code, hostToken, pairingCode }
      )
    }

    const phoneCtx = await ctx({ height: 844, width: 390 })
    await phoneCtx.addInitScript(
      (name) => localStorage.setItem('melee:nickname', name),
      SEAT_NAME
    )
    const phone = await phoneCtx.newPage()
    await go(phone, `${ORIGIN}/play/${code}`)

    await driver.evaluate(
      async ({ code, names }) => {
        window.__bots = names.map((nickname, index) => {
          const socket = new WebSocket(`ws://${location.host}/ws/rooms/${code}`)
          socket.__log = []
          socket.addEventListener('message', (event) =>
            socket.__log.push(JSON.parse(event.data))
          )
          socket.addEventListener('open', () =>
            socket.send(
              JSON.stringify({
                nickname,
                protocolVersion: 63,
                role: 'player',
                sessionId: `bot-${code}-${index}`,
                type: 'hello'
              })
            )
          )
          return socket
        })
        await new Promise((resolve) => setTimeout(resolve, 2500))
      },
      { code, names: NAMES.slice(0, SEATS - 1) }
    )

    const hostView = () =>
      host.evaluate(() => {
        const sock = window.__socks.findLast(
          (s) => s.url.includes('/ws/rooms/') && s.readyState === 1
        )
        return sock?.__log
          .filter((f) => f.type === 'room.updated' || f.type === 'welcome')
          .at(-1)?.view
      })
    const sendHost = (frame) =>
      host.evaluate((frame) => {
        window.__socks
          .findLast((s) => s.url.includes('/ws/rooms/') && s.readyState === 1)
          .send(JSON.stringify(frame))
      }, frame)
    let view = await hostView()
    const until = async (predicate, ms = 15000) => {
      const end = performance.now() + ms
      while (performance.now() < end) {
        view = await hostView()
        if (view && predicate(view)) return true
        await wait(200)
      }
      return false
    }
    await until((v) => (v.players?.length ?? 0) >= SEATS, 20000)
    report.players = view?.players?.length

    const shoot = async (phase) => {
      const pages = [
        ['host', host],
        ['phone', phone],
        ...(wall ? [['wall', wall]] : [])
      ]
      for (const [name, page] of pages) {
        await page.screenshot({ path: `${dir}/${phase}-${name}.png` })
        report.shots[`${phase}-${name}`] = await measure(page)
      }
      await phone.setViewportSize({ height: 640, width: 360 })
      await wait(400)
      await phone.screenshot({ path: `${dir}/${phase}-phone360.png` })
      report.shots[`${phase}-phone360`] = await measure(phone)
      await phone.setViewportSize({ height: 844, width: 390 })
      await host.setViewportSize({ height: 844, width: 390 })
      await wait(400)
      await host.screenshot({ path: `${dir}/${phase}-hostphone.png` })
      report.shots[`${phase}-hostphone`] = await measure(host)
      await host.setViewportSize({ height: 900, width: 1440 })
      if (wall) {
        await wall.setViewportSize({ height: 720, width: 1280 })
        await wait(400)
        await wall.screenshot({ path: `${dir}/${phase}-wall720.png` })
        report.shots[`${phase}-wall720`] = await measure(wall)
        await wall.setViewportSize({ height: 1080, width: 1920 })
      }
    }

    await wait(1000)
    await shoot('lobby')

    await sendHost({ type: 'host.startRound' })
    report.reachedPlaying = await until(
      (v) => v.phase === 'playing' || v.phase === 'buzzed'
    )
    await wait(1500)
    const botView = await driver.evaluate(
      () =>
        window.__bots[0].__log.filter((f) => f.type === 'room.updated').at(-1)
          ?.view
    )
    writeFileSync(`${dir}/bot-view.json`, JSON.stringify(botView, null, 1))

    const started = performance.now()
    await driver.evaluate((game) => {
      const players = (
        window.__bots[0].__log.filter((f) => f.type === 'room.updated').at(-1)
          ?.view?.players ?? []
      ).map((p) => p.id)
      window.__bots.forEach((socket, index) => {
        const round = socket.__log
          .filter((f) => f.type === 'room.updated')
          .at(-1)?.view?.round
        if (!round) return
        const content = round.content ?? {}
        const pick = (n) => Math.floor(Math.random() * n)
        const send = (frame) =>
          socket.send(JSON.stringify({ roundId: round.id, ...frame }))
        const choices = round.choices ?? content.choices
        let answer
        if (game === 'atlas')
          answer = {
            kind: 'point',
            point: { latitude: 30 + pick(30), longitude: -10 + pick(40) }
          }
        else if (game === 'timeline')
          answer = {
            eventIds: (content.events ?? [])
              .map((e) => e.id)
              .sort(() => Math.random() - 0.5),
            kind: 'order'
          }
        else if (game === 'swatch')
          answer = {
            colour: `#${pick(0xffffff).toString(16).padStart(6, '0')}`,
            kind: 'colour'
          }
        else if (game === 'mostlikely')
          answer = { kind: 'seat', playerId: players[pick(players.length)] }
        else if (game === 'estimate')
          answer = { guess: 1 + pick(5000), kind: 'number' }
        else if (game === 'higherlower')
          answer = {
            kind: 'pairs',
            picks: [Math.random() < 0.5 ? 'left' : 'right']
          }
        else if (game === 'petitbac') {
          const letter = content.letter ?? 'B'
          for (
            let categoryIndex = 0;
            categoryIndex < (content.categories?.length ?? 6);
            categoryIndex++
          ) {
            const word = `${letter}${['anane', 'ateau', 'ordeaux', 'ouleau', 'aleine', 'rique'][(index + categoryIndex) % 6]}${index % 3 ? '' : 'x'}`
            send({ answer: word, categoryIndex, type: 'petitbac.write' })
          }
          return
        } else if (Array.isArray(choices) && choices.length)
          answer = { choiceIndex: pick(choices.length), kind: 'choice' }
        else if (
          [
            'buzzer',
            'blindtest',
            'reflex',
            'innerclock',
            'challenge',
            'matchsticks',
            'blacksquare'
          ].includes(game)
        ) {
          if (index < 3) send({ type: 'player.buzz' })
          return
        } else answer = { guess: `réponse ${index}`, kind: 'typed' }
        send({ answer, type: 'player.answer' })
      })
    }, game)
    await until((v) => v.phase !== 'playing', 4000)
    report.timings.answersToNextPhaseMs = performance.now() - started
    await wait(1500)
    report.botErrors = await driver.evaluate(() => [
      ...new Set(
        window.__bots.flatMap((s) =>
          s.__log.filter((f) => f.type === 'error').map((f) => f.code)
        )
      )
    ])
    view = await hostView()
    report.midPhase = view?.phase
    await shoot('round')

    for (const id of (view?.players ?? []).map((p) => p.id)) {
      await sendHost({
        points: (1 + Math.floor(Math.random() * 90)) * 1000,
        target: { kind: 'seat', playerId: id },
        type: 'host.adjustScore'
      })
    }
    if (view?.phase !== 'revealed' && view?.round?.id)
      await sendHost({ roundId: view.round.id, type: 'host.reveal' })
    await until((v) => v.phase === 'revealed' || v.phase === 'finished', 8000)
    await wait(1500)
    report.revealPhase = view?.phase
    await shoot('reveal')

    await sendHost({ type: 'host.endGame' })
    await until((v) => v.phase === 'finished', 6000)
    await wait(1500)
    report.endPhase = view?.phase
    await shoot('final')
    report.frameBytes = await driver.evaluate(() => {
      const sizes = window.__bots[0].__log.map((f) => JSON.stringify(f).length)
      return { frames: sizes.length, max: Math.max(...sizes) }
    })
  } catch (error) {
    report.error = String(error).slice(0, 300)
  } finally {
    await browser.close()
  }
  return report
}

for (const game of GAMES) {
  const report = await run(game)
  writeFileSync(
    `${OUT}/report-${WITH_WALL ? 'wall' : 'nowall'}-${game}.json`,
    JSON.stringify(report, null, 1)
  )
  process.stdout.write(`== ${game} ${WITH_WALL ? 'wall' : 'nowall'} code=${report.code} players=${report.players} playing=${report.reachedPlaying} mid=${report.midPhase} reveal=${report.revealPhase} end=${report.endPhase} answers→${report.timings.answersToNextPhaseMs}ms frames=${JSON.stringify(report.frameBytes)}
`)
  if (report.error)
    process.stdout.write(`  ERROR ${report.error}
`)
  if (report.botErrors?.length)
    process.stdout.write(`  botErrors ${report.botErrors.join(',')}
`)
  await wait(15000)
}
