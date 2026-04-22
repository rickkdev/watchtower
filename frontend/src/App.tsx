import { useEffect, useRef, useState } from 'react'
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
    endpoint: '/api/live/fast' | '/api/live/slow'
    version: string
    lastUpdatedAt: string
  }>
  generatedAt: string
}

type LayerId = 'flights' | 'ships' | 'satellites' | 'incidents'

type LayerDefinition = {
  id: LayerId
  label: string
  cadence: 'fast' | 'slow'
  hint: string
}

type Marker = {
  id: string
  lon: number
  lat: number
  label: string
}

type ViewportState = {
  x: number
  y: number
  scale: number
}

const MAP_WIDTH = 1000
const MAP_HEIGHT = 500
const INITIAL_VIEWPORT: ViewportState = { x: 0, y: 0, scale: 1 }
const MIN_SCALE = 1
const MAX_SCALE = 4

const layerDefinitions: LayerDefinition[] = [
  { id: 'flights', label: 'Flights', cadence: 'fast', hint: 'ADS-B air traffic' },
  { id: 'ships', label: 'Ships', cadence: 'fast', hint: 'AIS vessel tracks' },
  { id: 'satellites', label: 'Satellites', cadence: 'fast', hint: 'Orbital snapshots' },
  { id: 'incidents', label: 'Incidents', cadence: 'slow', hint: 'Contextual reports' },
]

const layerMarkers: Record<LayerId, Marker[]> = {
  flights: [
    { id: 'flight-1', lon: -73.78, lat: 40.64, label: 'north atlantic' },
    { id: 'flight-2', lon: 2.55, lat: 49.01, label: 'western europe' },
    { id: 'flight-3', lon: 103.99, lat: 1.36, label: 'strait corridor' },
  ],
  ships: [
    { id: 'ship-1', lon: -5.35, lat: 36.14, label: 'gibraltar' },
    { id: 'ship-2', lon: 55.27, lat: 25.2, label: 'gulf transit' },
    { id: 'ship-3', lon: 121.85, lat: 31.23, label: 'east asia lane' },
  ],
  satellites: [
    { id: 'sat-1', lon: -119.42, lat: 34.1, label: 'polar pass' },
    { id: 'sat-2', lon: 37.62, lat: 55.75, label: 'sun sync' },
    { id: 'sat-3', lon: 151.21, lat: -33.87, label: 'leo cluster' },
  ],
  incidents: [
    { id: 'incident-1', lon: 35.21, lat: 31.77, label: 'regional alert' },
    { id: 'incident-2', lon: -99.13, lat: 19.43, label: 'weather disruption' },
    { id: 'incident-3', lon: 116.4, lat: 39.9, label: 'port congestion' },
  ],
}

const continentPaths = [
  'M108 118 L198 92 L286 110 L324 162 L276 204 L210 228 L162 198 L120 150 Z',
  'M288 118 L378 88 L470 120 L520 168 L486 220 L412 236 L340 204 L300 162 Z',
  'M472 238 L546 204 L610 216 L672 264 L648 328 L574 348 L512 310 L484 262 Z',
  'M654 118 L764 96 L850 142 L884 214 L840 276 L760 252 L704 194 Z',
  'M792 314 L852 292 L906 332 L892 382 L824 394 L784 352 Z',
]

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const projectPoint = (lon: number, lat: number) => ({
  x: ((lon + 180) / 360) * MAP_WIDTH,
  y: ((90 - lat) / 180) * MAP_HEIGHT,
})

function App() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [enabledLayers, setEnabledLayers] = useState<Record<LayerId, boolean>>({
    flights: true,
    ships: true,
    satellites: true,
    incidents: true,
  })
  const [viewport, setViewport] = useState<ViewportState>(INITIAL_VIEWPORT)
  const viewportRef = useRef<ViewportState>(INITIAL_VIEWPORT)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)

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

  const updateViewport = (nextViewport: ViewportState) => {
    viewportRef.current = nextViewport
    setViewport(nextViewport)
  }

  const toggleLayer = (layerId: LayerId) => {
    setEnabledLayers((current) => ({
      ...current,
      [layerId]: !current[layerId],
    }))
  }

  const zoomBy = (delta: number) => {
    const nextScale = clamp(viewportRef.current.scale + delta, MIN_SCALE, MAX_SCALE)
    updateViewport({ ...viewportRef.current, scale: nextScale })
  }

  const resetViewport = () => {
    updateViewport(INITIAL_VIEWPORT)
  }

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: viewportRef.current.x,
      originY: viewportRef.current.y,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return
    }

    updateViewport({
      ...viewportRef.current,
      x: dragRef.current.originX + (event.clientX - dragRef.current.startX),
      y: dragRef.current.originY + (event.clientY - dragRef.current.startY),
    })
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault()

    const container = event.currentTarget.getBoundingClientRect()
    const pointerX = event.clientX - container.left
    const pointerY = event.clientY - container.top
    const previous = viewportRef.current
    const factor = event.deltaY > 0 ? 0.9 : 1.1
    const nextScale = clamp(Number((previous.scale * factor).toFixed(3)), MIN_SCALE, MAX_SCALE)

    if (nextScale === previous.scale) {
      return
    }

    const worldX = (pointerX - previous.x) / previous.scale
    const worldY = (pointerY - previous.y) / previous.scale

    updateViewport({
      scale: nextScale,
      x: pointerX - worldX * nextScale,
      y: pointerY - worldY * nextScale,
    })
  }

  const enabledLayerCount = layerDefinitions.filter((layer) => enabledLayers[layer.id]).length

  return (
    <main className="app-shell">
      <section className="map-shell" aria-label="Watchtower map shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">minimal geospatial osint dashboard</p>
            <h1>{status?.systemName ?? 'watchtower'}</h1>
          </div>
          <div className="status-cluster">
            <div className="status-pill" data-state={error ? 'degraded' : status?.status ?? 'loading'}>
              {error ? 'backend unavailable' : status ? 'backend online' : 'connecting'}
            </div>
            <div className="status-pill status-pill-muted">{enabledLayerCount}/4 layers live</div>
          </div>
        </header>

        <div className="map-stage">
          <aside className="layer-panel" aria-label="Layer controls">
            <div className="panel-heading">
              <p className="panel-kicker">Layer stack</p>
              <h2>Signal overlays</h2>
            </div>
            <div className="layer-list">
              {layerDefinitions.map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  className="layer-toggle"
                  data-layer={layer.id}
                  data-active={enabledLayers[layer.id]}
                  aria-pressed={enabledLayers[layer.id]}
                  onClick={() => toggleLayer(layer.id)}
                >
                  <span className="layer-toggle-main">
                    <span className="layer-swatch" aria-hidden="true" />
                    <span>
                      <strong>{layer.label}</strong>
                      <small>{layer.hint}</small>
                    </span>
                  </span>
                  <span className="layer-meta">{enabledLayers[layer.id] ? 'enabled' : 'hidden'}</span>
                </button>
              ))}
            </div>
          </aside>

          <section className="map-surface">
            <div className="map-hud">
              <div className="map-readout">
                <span>drag to pan</span>
                <span>scroll or pinchpad to zoom</span>
              </div>
              <div className="zoom-controls" aria-label="Map zoom controls">
                <button type="button" onClick={() => zoomBy(0.2)} aria-label="Zoom in">
                  +
                </button>
                <button type="button" onClick={() => zoomBy(-0.2)} aria-label="Zoom out">
                  -
                </button>
                <button type="button" onClick={resetViewport} aria-label="Reset map view">
                  reset
                </button>
              </div>
            </div>

            <div
              className="map-viewport"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onWheel={handleWheel}
              role="img"
              aria-label="Interactive world map"
            >
              <div className="map-grid" aria-hidden="true" />
              <div className="map-ring map-ring-a" aria-hidden="true" />
              <div className="map-ring map-ring-b" aria-hidden="true" />
              <div className="scanline" aria-hidden="true" />
              <svg
                className="map-canvas"
                viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
                style={{
                  transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
                }}
              >
                <g aria-hidden="true">
                  {continentPaths.map((path) => (
                    <path key={path} d={path} className="continent-shape" />
                  ))}
                  <path d="M0 250 H1000" className="latitude-line" />
                  <path d="M500 0 V500" className="latitude-line" />
                </g>

                {layerDefinitions.map((layer) =>
                  enabledLayers[layer.id] ? (
                    <g key={layer.id} className="marker-group" data-layer={layer.id}>
                      {layerMarkers[layer.id].map((marker) => {
                        const point = projectPoint(marker.lon, marker.lat)

                        return (
                          <g
                            key={marker.id}
                            className="map-marker"
                            transform={`translate(${point.x} ${point.y})`}
                          >
                            <circle r="10" className="marker-pulse" />
                            <circle r="5" className="marker-core" />
                            <text y="-16">{marker.label}</text>
                          </g>
                        )
                      })}
                    </g>
                  ) : null,
                )}
              </svg>

              <div className="layer-chip-row" aria-label="Enabled layers">
                {layerDefinitions.map((layer) => (
                  <span
                    key={layer.id}
                    className="layer-chip"
                    data-layer={layer.id}
                    data-active={enabledLayers[layer.id]}
                  >
                    {layer.label}
                  </span>
                ))}
              </div>
            </div>
          </section>

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
