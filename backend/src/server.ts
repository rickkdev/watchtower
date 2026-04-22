import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { backendConfig } from './config.js'
import {
  buildFastLiveSnapshot,
  buildLiveEtag,
  buildSlowLiveSnapshot,
} from './live-data.js'
import { buildStatusSnapshot } from './status.js'

const startedAt = Date.now()

const sendJson = (
  response: import('node:http').ServerResponse,
  statusCode: number,
  payload: unknown,
  headers: Record<string, string> = {},
) => {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'no-store',
    ...headers,
  })
  response.end(JSON.stringify(payload))
}

const sendNotModified = (
  response: import('node:http').ServerResponse,
  etag: string,
) => {
  response.writeHead(304, {
    'access-control-allow-origin': '*',
    'cache-control': 'no-store',
    etag,
  })
  response.end()
}

const matchesEtag = (request: import('node:http').IncomingMessage, etag: string) =>
  request.headers['if-none-match'] === etag

export const createRequestHandler = (startedAt: number) => (request: import('node:http').IncomingMessage, response: import('node:http').ServerResponse) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,OPTIONS',
      'access-control-allow-headers': 'content-type',
    })
    response.end()
    return
  }

  if (request.method !== 'GET') {
    sendJson(response, 405, { error: 'method_not_allowed' })
    return
  }

  if (request.url === '/health') {
    sendJson(response, 200, {
      ok: true,
      service: 'backend',
      generatedAt: new Date().toISOString(),
    })
    return
  }

  if (request.url === '/api/status') {
    sendJson(response, 200, buildStatusSnapshot(startedAt))
    return
  }

  if (request.url === '/api/live/fast') {
    const snapshot = buildFastLiveSnapshot()
    const etag = buildLiveEtag(snapshot)

    if (matchesEtag(request, etag)) {
      sendNotModified(response, etag)
      return
    }

    sendJson(response, 200, snapshot, { etag })
    return
  }

  if (request.url === '/api/live/slow') {
    const snapshot = buildSlowLiveSnapshot()
    const etag = buildLiveEtag(snapshot)

    if (matchesEtag(request, etag)) {
      sendNotModified(response, etag)
      return
    }

    sendJson(response, 200, snapshot, { etag })
    return
  }

  sendJson(response, 404, { error: 'not_found' })
}

export const server = createServer(createRequestHandler(startedAt))

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(backendConfig.backendPort, () => {
    console.log(
      `watchtower backend listening on http://localhost:${backendConfig.backendPort}`,
    )
  })
}
