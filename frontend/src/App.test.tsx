import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the shell header and system status', () => {
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
  })
})
