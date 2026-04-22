import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the shell header, system status, and layer toggles', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        systemName: 'watchtower',
        status: 'online',
        backend: {
          status: 'online',
          port: 8787,
          uptimeSeconds: 12,
        },
        frontend: {
          expectedPort: 5173,
        },
        feeds: [],
        generatedAt: '2026-04-22T12:00:00.000Z',
      }),
    }) as typeof fetch

    render(<App />)

    expect(screen.getByRole('heading', { name: 'watchtower' })).toBeInTheDocument()
    expect(screen.getByText('System status')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Interactive world map' })).toBeInTheDocument()

    const flightsToggle = screen.getByRole('button', { name: /flights/i })
    expect(flightsToggle).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(flightsToggle)

    expect(flightsToggle).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByText('3/4 layers live')).toBeInTheDocument()
  })
})
