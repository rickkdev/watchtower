import { useEffect, useState } from 'react'
import './App.css'

type SystemStatus = {
  systemName: string
  status: 'online' | 'degraded'
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

function App() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const loadStatus = async () => {
      try {
        const response = await fetch('/api/status')

        if (!response.ok) {
          throw new Error(`status ${response.status}`)
        }

        const payload = (await response.json()) as SystemStatus

        if (active) {
          setStatus(payload)
          setError(null)
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'unknown_error')
        }
      }
    }

    void loadStatus()

    return () => {
      active = false
    }
  }, [])

  return (
    <main className="app-shell">
      <section className="map-shell" aria-label="Watchtower map shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">minimal geospatial osint dashboard</p>
            <h1>{status?.systemName ?? 'watchtower'}</h1>
          </div>
          <div className="status-pill" data-state={error ? 'degraded' : status?.status ?? 'loading'}>
            {error ? 'backend unavailable' : status ? 'backend online' : 'connecting'}
          </div>
        </header>

        <div className="map-stage">
          <div className="map-grid" aria-hidden="true" />
          <div className="map-ring map-ring-a" aria-hidden="true" />
          <div className="map-ring map-ring-b" aria-hidden="true" />
          <div className="continent continent-a" aria-hidden="true" />
          <div className="continent continent-b" aria-hidden="true" />
          <div className="continent continent-c" aria-hidden="true" />
          <div className="scanline" aria-hidden="true" />
          <aside className="system-status" aria-live="polite">
            <h2>System status</h2>
            <dl>
              <div>
                <dt>Backend port</dt>
                <dd>{status?.backend.port ?? '...'}</dd>
              </div>
              <div>
                <dt>Frontend port</dt>
                <dd>{status?.frontend.expectedPort ?? '...'}</dd>
              </div>
              <div>
                <dt>Uptime</dt>
                <dd>{status ? `${status.backend.uptimeSeconds}s` : '...'}</dd>
              </div>
              <div>
                <dt>Last sync</dt>
                <dd>{status ? new Date(status.generatedAt).toLocaleTimeString() : '...'}</dd>
              </div>
            </dl>
            <ul className="feed-list">
              {(status?.feeds ?? []).map((feed) => (
                <li key={feed.id}>
                  <span>{feed.label}</span>
                  <span>{feed.cadence}</span>
                </li>
              ))}
            </ul>
            {error ? <p className="error-copy">Unable to reach `/api/status`: {error}</p> : null}
          </aside>
        </div>
      </section>
    </main>
  )
}

export default App
