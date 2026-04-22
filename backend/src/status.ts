import { backendConfig } from './config.js'
import { buildFastLiveSnapshot, buildSlowLiveSnapshot } from './live-data.js'

export type ServiceStatus = 'online' | 'degraded'

export type StatusSnapshot = {
  systemName: string
  status: ServiceStatus
  backend: {
    status: 'online'
    port: number
    uptimeSeconds: number
  }
  frontend: {
    expectedPort: number
  }
  feeds: Array<{
    id: string
    label: string
    cadence: string
    state: 'pending'
    endpoint: '/api/live/fast' | '/api/live/slow'
    version: string
    lastUpdatedAt: string
  }>
  generatedAt: string
}

export const buildStatusSnapshot = (startedAt: number, now = Date.now()): StatusSnapshot => {
  const fastSnapshot = buildFastLiveSnapshot(now)
  const slowSnapshot = buildSlowLiveSnapshot(now)

  return {
    systemName: backendConfig.systemName,
    status: 'online',
    backend: {
      status: 'online',
      port: backendConfig.backendPort,
      uptimeSeconds: Math.floor((now - startedAt) / 1000),
    },
    frontend: {
      expectedPort: backendConfig.frontendPort,
    },
    feeds: [
      ...fastSnapshot.feeds.map((feed) => ({
        ...feed,
        endpoint: '/api/live/fast' as const,
        version: fastSnapshot.version,
      })),
      ...slowSnapshot.feeds.map((feed) => ({
        ...feed,
        endpoint: '/api/live/slow' as const,
        version: slowSnapshot.version,
      })),
    ],
    generatedAt: new Date(now).toISOString(),
  }
}
