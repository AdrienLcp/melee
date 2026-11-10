import { z } from 'zod'

import { env } from '@/env'
import { EVENING_TOOLS } from '@/infrastructure/mcp/evening-tools'

/** Newest first: a client asking for one of these gets it, any other the first. */
const PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26'] as const

const JSON_RPC_ERROR_CODES = {
  invalidParams: -32602,
  invalidRequest: -32600,
  methodNotFound: -32601,
  parseError: -32700
} as const

const SERVER_INSTRUCTIONS =
  'Melee is a shelf of party games for one room: one screen hosts and shows a QR code, everyone else plays on a screen of their own. These tools compose an evening — which games, on which settings, in which order — and hand back a link that opens it. Call describe_games first, then prepare_evening, and give the person the link to open on the screen that will host.'

const requestSchema = z.object({
  id: z.union([z.string(), z.number()]),
  jsonrpc: z.literal('2.0'),
  method: z.string(),
  params: z.record(z.string(), z.unknown()).optional()
})

/** A notification, or a client's answer to a request this server never sends. */
const unansweredSchema = z.object({ jsonrpc: z.literal('2.0') })

const toolCallSchema = z.object({
  arguments: z.unknown(),
  name: z.string()
})

type RequestId = z.infer<typeof requestSchema>['id'] | null

type JsonRpcReply =
  | { id: RequestId; jsonrpc: '2.0'; result: unknown }
  | {
      error: { code: number; message: string }
      id: RequestId
      jsonrpc: '2.0'
    }

/** What `/mcp` answers a POST with: a reply, or a bare 202 for a notification. */
export type McpAnswer =
  | { reply: JsonRpcReply; status: 200 | 400 }
  | { status: 202 }

const success = ({ id, result }: { id: RequestId; result: unknown }) =>
  ({ reply: { id, jsonrpc: '2.0', result }, status: 200 }) as const

const failure = ({
  code,
  id,
  message
}: {
  code: number
  id: RequestId
  message: string
}): McpAnswer => ({
  reply: { error: { code, message }, id, jsonrpc: '2.0' },
  status: id === null ? 400 : 200
})

const negotiatedVersion = (asked: unknown): string =>
  PROTOCOL_VERSIONS.find((version) => version === asked) ?? PROTOCOL_VERSIONS[0]

const callTool = async ({
  id,
  origin,
  params
}: {
  id: RequestId
  origin: string
  params: unknown
}): Promise<McpAnswer> => {
  const call = toolCallSchema.safeParse(params)
  const tool = EVENING_TOOLS.find(({ name }) => name === call.data?.name)

  if (!call.success || tool === undefined) {
    return failure({
      code: JSON_RPC_ERROR_CODES.invalidParams,
      id,
      message: `Unknown tool; this server offers ${EVENING_TOOLS.map(({ name }) => name).join(' and ')}.`
    })
  }

  const outcome = await tool.call({ arguments: call.data.arguments, origin })

  return success({
    id,
    result: {
      content: [{ text: outcome.text, type: 'text' }],
      isError: outcome.isError
    }
  })
}

const parsedJson = (body: string): { isJson: boolean; value: unknown } => {
  try {
    return { isJson: true, value: JSON.parse(body) }
  } catch {
    return { isJson: false, value: undefined }
  }
}

/**
 * The Model Context Protocol over plain HTTP, stateless: every POST is one
 * JSON-RPC message answered on the spot, with no session and no stream.
 * `origin` is where the links it writes point.
 */
export const answerMcp = async ({
  body,
  origin
}: {
  body: string
  origin: string
}): Promise<McpAnswer> => {
  const json = parsedJson(body)

  if (!json.isJson) {
    return failure({
      code: JSON_RPC_ERROR_CODES.parseError,
      id: null,
      message: 'The body is not JSON.'
    })
  }

  const request = requestSchema.safeParse(json.value)

  if (!request.success) {
    return unansweredSchema.safeParse(json.value).success
      ? { status: 202 }
      : failure({
          code: JSON_RPC_ERROR_CODES.invalidRequest,
          id: null,
          message: 'Not a JSON-RPC 2.0 message.'
        })
  }

  const { id, method, params } = request.data

  switch (method) {
    case 'initialize':
      return success({
        id,
        result: {
          capabilities: { tools: { listChanged: false } },
          instructions: SERVER_INSTRUCTIONS,
          protocolVersion: negotiatedVersion(params?.protocolVersion),
          serverInfo: { name: 'melee', title: 'Melee', version: env.build }
        }
      })
    case 'ping':
      return success({ id, result: {} })
    case 'tools/list':
      return success({
        id,
        result: { tools: EVENING_TOOLS.map(({ call: _, ...tool }) => tool) }
      })
    case 'tools/call':
      return callTool({ id, origin, params })
    default:
      return failure({
        code: JSON_RPC_ERROR_CODES.methodNotFound,
        id,
        message: `No method ${method} here.`
      })
  }
}
