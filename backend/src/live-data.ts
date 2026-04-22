export type Cadence = 'fast' | 'slow'
export type FeedId = 'flights' | 'ships' | 'satellites' | 'incidents'

export type FeedFreshness = {
  id: FeedId
  label: string
  cadence: Cadence
  state: 'pending'
  lastUpdatedAt: string
  staleAfterSeconds: number
}

export type FastLiveSnapshot = {
  cadence: 'fast'
  version: string
  generatedAt: string
  feeds: FeedFreshness[]
  entities: {
    flights: []
    ships: []
    satellites: []
  }
}

export type SlowLiveSnapshot = {
  cadence: 'slow'
  version: string
  generatedAt: string
  feeds: FeedFreshness[]
  entities: {
    incidents: []
  }
}

const FAST_BUCKET_MS = 15_000
const SLOW_BUCKET_MS = 5 * 60_000

const feedDefinitions: Record<FeedId, Omit<FeedFreshness, 'lastUpdatedAt'>> = {
  flights: {
    id: 'flights',
    label: 'Flights',
    cadence: 'fast',
    state: 'pending',
    staleAfterSeconds: 30,
  },
  ships: {
    id: 'ships',
    label: 'Ships',
    cadence: 'fast',
    state: 'pending',
    staleAfterSeconds: 60,
  },
  satellites: {
    id: 'satellites',
    label: 'Satellites',
    cadence: 'fast',
    state: 'pending',
    staleAfterSeconds: 120,
  },
  incidents: {
    id: 'incidents',
    label: 'Incidents',
    cadence: 'slow',
    state: 'pending',
    staleAfterSeconds: 900,
  },
}

const isoForBucket = (timestamp: number, bucketSizeMs: number) =>
  new Date(Math.floor(timestamp / bucketSizeMs) * bucketSizeMs).toISOString()

const versionForBucket = (cadence: Cadence, timestamp: number, bucketSizeMs: number) =>
  `${cadence}-${Math.floor(timestamp / bucketSizeMs)}`

const buildFeedFreshness = (feedIds: FeedId[], timestamp: number, bucketSizeMs: number) => {
  const lastUpdatedAt = isoForBucket(timestamp, bucketSizeMs)

  return feedIds.map((feedId) => ({
    ...feedDefinitions[feedId],
    lastUpdatedAt,
  }))
}

export const buildFastLiveSnapshot = (now = Date.now()): FastLiveSnapshot => ({
  cadence: 'fast',
  version: versionForBucket('fast', now, FAST_BUCKET_MS),
  generatedAt: new Date(now).toISOString(),
  feeds: buildFeedFreshness(['flights', 'ships', 'satellites'], now, FAST_BUCKET_MS),
  entities: {
    flights: [],
    ships: [],
    satellites: [],
  },
})

export const buildSlowLiveSnapshot = (now = Date.now()): SlowLiveSnapshot => ({
  cadence: 'slow',
  version: versionForBucket('slow', now, SLOW_BUCKET_MS),
  generatedAt: new Date(now).toISOString(),
  feeds: buildFeedFreshness(['incidents'], now, SLOW_BUCKET_MS),
  entities: {
    incidents: [],
  },
})

export const buildLiveEtag = (snapshot: { version: string }) => `"${snapshot.version}"`
