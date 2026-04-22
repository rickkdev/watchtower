import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildFastLiveSnapshot,
  buildLiveEtag,
  buildSlowLiveSnapshot,
} from './live-data.js'
import { buildStatusSnapshot } from './status.js'

test('buildStatusSnapshot exposes fast and slow feed versions with freshness metadata', () => {
  const now = Date.parse('2026-04-22T12:00:45.000Z')
  const snapshot = buildStatusSnapshot(now - 4_500, now)

  assert.equal(snapshot.status, 'online')
  assert.equal(snapshot.backend.status, 'online')
  assert.equal(snapshot.feeds.length, 4)
  assert.deepEqual(
    snapshot.feeds.map((feed) => feed.endpoint),
    ['/api/live/fast', '/api/live/fast', '/api/live/fast', '/api/live/slow'],
  )
  assert.match(snapshot.feeds[0].version, /^fast-\d+$/)
  assert.equal(snapshot.feeds[0].version, snapshot.feeds[1].version)
  assert.equal(snapshot.feeds[1].version, snapshot.feeds[2].version)
  assert.match(snapshot.feeds[3].version, /^slow-\d+$/)
  assert.match(snapshot.feeds[0].lastUpdatedAt, /^\d{4}-\d{2}-\d{2}T/)
  assert.match(snapshot.generatedAt, /^\d{4}-\d{2}-\d{2}T/)
  assert.ok(snapshot.backend.uptimeSeconds >= 4)
})

test('fast and slow snapshots expose stable versioned payloads', () => {
  const now = Date.parse('2026-04-22T12:00:45.000Z')
  const fastSnapshot = buildFastLiveSnapshot(now)
  const slowSnapshot = buildSlowLiveSnapshot(now)

  assert.equal(fastSnapshot.cadence, 'fast')
  assert.match(fastSnapshot.version, /^fast-\d+$/)
  assert.equal(fastSnapshot.feeds.length, 3)
  assert.deepEqual(Object.keys(fastSnapshot.entities), ['flights', 'ships', 'satellites'])
  assert.equal(buildLiveEtag(fastSnapshot), `"${fastSnapshot.version}"`)

  assert.equal(slowSnapshot.cadence, 'slow')
  assert.match(slowSnapshot.version, /^slow-\d+$/)
  assert.equal(slowSnapshot.feeds.length, 1)
  assert.deepEqual(Object.keys(slowSnapshot.entities), ['incidents'])
  assert.equal(buildLiveEtag(slowSnapshot), `"${slowSnapshot.version}"`)
})
