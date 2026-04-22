import { backendConfig } from './config.js'

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
  }>
  generatedAt: string
}

export const buildStatusSnapshot = (startedAt: number): StatusSnapshot => ({
  systemName: backendConfig.systemName,
  status: 'online',
  backend: {
    status: 'online',
    port: backendConfig.backendPort,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
  },
  frontend: {
    expectedPort: backendConfig.frontendPort,
  },
  feeds: [
    {
      id: 'flights',
      label: 'Flights',
      cadence: 'fast',
      state: 'pending',
    },
    {
      id: 'ships',
      label: 'Ships',
      cadence: 'fast',
      state: 'pending',
    },
    {
      id: 'satellites',
      label: 'Satellites',
      cadence: 'fast',
      state: 'pending',
    },
    {
      id: 'incidents',
      label: 'Incidents',
      cadence: 'slow',
      state: 'pending',
    },
  ],
  generatedAt: new Date().toISOString(),
})
