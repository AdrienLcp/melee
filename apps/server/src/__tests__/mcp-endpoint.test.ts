import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { DEFAULT_GAME_SETTINGS, gameKinds } from '@melee/protocol/game'
import { MCP_ROUTE } from '@melee/protocol/routes'

import { eveningCarriedBy } from '@melee/core/room/evening-link'

import { createApp } from '@/infrastructure/node/node-app'

const EVENING = {
  lineUp: [DEFAULT_GAME_SETTINGS.quiz, 'reflex'],
  lineUpDeals: [],
  name: 'Two games',
  roundCount: 8,
  runningOrder: [0, 1]
}

const toolReplySchema = z.object({
  result: z.object({
    content: z.tuple([z.object({ text: z.string() })]),
    isError: z.boolean()
  })
})

const send = async (message: unknown) => {
  const { app } = createApp()

  return app.request(MCP_ROUTE, {
    body: typeof message === 'string' ? message : JSON.stringify(message),
    headers: {
      accept: 'application/json, text/event-stream',
      'content-type': 'application/json'
    },
    method: 'POST'
  })
}

const call = async (name: string, args: unknown) => {
  const response = await send({
    id: 7,
    jsonrpc: '2.0',
    method: 'tools/call',
    params: { arguments: args, name }
  })
  const { result } = toolReplySchema.parse(await response.json())

  return { isError: result.isError, text: result.content[0].text }
}

describe('mcp endpoint', () => {
  it('[mcp] answers initialize on the version the client asked for, offering tools', async () => {
    const response = await send({
      id: 1,
      jsonrpc: '2.0',
      method: 'initialize',
      params: {
        capabilities: {},
        clientInfo: { name: 'test', version: '1' },
        protocolVersion: '2025-06-18'
      }
    })
    const { id, result } = await response.json()

    expect(response.status).toBe(200)
    expect(id).toBe(1)
    expect(result.protocolVersion).toBe('2025-06-18')
    expect(result.capabilities.tools).toBeDefined()
  })

  it('[mcp] answers a version it does not know with its own newest', async () => {
    const response = await send({
      id: 1,
      jsonrpc: '2.0',
      method: 'initialize',
      params: { protocolVersion: '1999-01-01' }
    })

    expect((await response.json()).result.protocolVersion).toBe('2025-11-25')
  })

  it('[mcp] lists both tools, each taking an object', async () => {
    const response = await send({ id: 2, jsonrpc: '2.0', method: 'tools/list' })
    const { tools } = (await response.json()).result

    expect(tools.map(({ name }: { name: string }) => name)).toEqual([
      'describe_games',
      'prepare_evening'
    ])
    expect(
      tools.every(
        ({ inputSchema }: { inputSchema: { type: string } }) =>
          inputSchema.type === 'object'
      )
    ).toBe(true)
  })

  it('[mcp] describes every game', async () => {
    const { isError, text } = await call('describe_games', {})
    const described = JSON.parse(text).games.map(
      ({ kind }: { kind: string }) => kind
    )

    expect(isError).toBe(false)
    expect(described).toEqual([...gameKinds])
  })

  it('[mcp] prepares an evening as a link that carries it', async () => {
    const { isError, text } = await call('prepare_evening', {
      evening: EVENING,
      locale: 'fr'
    })
    const link = new URL(text.match(/https?:\/\/\S+/)?.[0] ?? '')

    expect(isError).toBe(false)
    expect(link.pathname).toBe('/fr/evening')
    expect(await eveningCarriedBy(link.hash)).toEqual(EVENING)
  })

  it('[mcp] answers an order that points past the line-up as a problem to fix', async () => {
    const { isError, text } = await call('prepare_evening', {
      evening: { ...EVENING, runningOrder: [0, 2] },
      locale: 'en'
    })

    expect(isError).toBe(true)
    expect(text).toContain('runningOrder')
  })

  it('[mcp] answers a game dealt to chance that cannot be drawn as a problem to fix', async () => {
    const { isError, text } = await call('prepare_evening', {
      evening: {
        ...EVENING,
        lineUp: ['slate'],
        lineUpDeals: ['chance'],
        runningOrder: []
      },
      locale: 'en'
    })

    expect(isError).toBe(true)
    expect(text).toContain('lineUpDeals')
  })

  it('[mcp] answers an entry of no game by its path', async () => {
    const { isError, text } = await call('prepare_evening', {
      evening: { ...EVENING, lineUp: ['chess'] },
      locale: 'en'
    })

    expect(isError).toBe(true)
    expect(text).toContain('lineUp[0]')
  })

  it('[mcp] accepts a notification with no answer', async () => {
    const response = await send({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    })

    expect(response.status).toBe(202)
    expect(await response.text()).toBe('')
  })

  it('[mcp] refuses a method it does not have', async () => {
    const response = await send({
      id: 3,
      jsonrpc: '2.0',
      method: 'resources/list'
    })

    expect((await response.json()).error.code).toBe(-32601)
  })

  it('[mcp] refuses a body that is not JSON as a parse error', async () => {
    const response = await send('{"jsonrpc":')

    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe(-32700)
  })

  it('[mcp] refuses a GET, having no stream to open', async () => {
    const { app } = createApp()

    expect((await app.request(MCP_ROUTE)).status).toBe(405)
  })
})
