import test from 'node:test'
import assert from 'node:assert/strict'
import { buildStatusSnapshot } from './status.js'

test('buildStatusSnapshot returns baseline feed metadata', () => {
  const snapshot = buildStatusSnapshot(Date.now() - 4_500)

  assert.equal(snapshot.status, 'online')
  assert.equal(snapshot.backend.status, 'online')
  assert.equal(snapshot.feeds.length, 4)
  assert.deepEqual(
    snapshot.feeds.map((feed) => feed.id),
    ['flights', 'ships', 'satellites', 'incidents'],
  )
  assert.match(snapshot.generatedAt, /^\d{4}-\d{2}-\d{2}T/)
  assert.ok(snapshot.backend.uptimeSeconds >= 4)
})
