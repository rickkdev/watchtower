import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'
import test from 'node:test'
import { createRequestHandler } from './server.js'

const startTestServer = async () => {
  const server = createServer(createRequestHandler(Date.now() - 10_000))
  server.listen(0)
  await once(server, 'listening')

  const address = server.address()

  if (!address || typeof address === 'string') {
    throw new Error('failed_to_bind_test_server')
  }

  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  }
}

test('GET /api/live/fast returns JSON and an etag', async () => {
  const { server, baseUrl } = await startTestServer()

  try {
    const response = await fetch(`${baseUrl}/api/live/fast`)
    const payload = (await response.json()) as {
      cadence: string
      version: string
      feeds: Array<{ id: string }>
    }

    assert.equal(response.status, 200)
    assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8')
    assert.ok(response.headers.get('etag'))
    assert.equal(payload.cadence, 'fast')
    assert.deepEqual(payload.feeds.map((feed) => feed.id), ['flights', 'ships', 'satellites'])
  } finally {
    server.close()
    await once(server, 'close')
  }
})

test('GET /api/live/slow honors If-None-Match', async () => {
  const { server, baseUrl } = await startTestServer()

  try {
    const initialResponse = await fetch(`${baseUrl}/api/live/slow`)
    const etag = initialResponse.headers.get('etag')

    assert.equal(initialResponse.status, 200)
    assert.ok(etag)

    const cachedResponse = await fetch(`${baseUrl}/api/live/slow`, {
      headers: {
        'if-none-match': etag,
      },
    })

    assert.equal(cachedResponse.status, 304)
    assert.equal(await cachedResponse.text(), '')
    assert.equal(cachedResponse.headers.get('etag'), etag)
  } finally {
    server.close()
    await once(server, 'close')
  }
})
