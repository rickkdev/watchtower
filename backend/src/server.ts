import { createServer } from 'node:http'
import { backendConfig } from './config.js'
import { buildStatusSnapshot } from './status.js'

const startedAt = Date.now()

const sendJson = (
  response: import('node:http').ServerResponse,
  statusCode: number,
  payload: unknown,
) => {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'cache-control': 'no-store',
  })
  response.end(JSON.stringify(payload))
}

const server = createServer((request, response) => {
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

  sendJson(response, 404, { error: 'not_found' })
})

server.listen(backendConfig.backendPort, () => {
  console.log(
    `watchtower backend listening on http://localhost:${backendConfig.backendPort}`,
  )
})
