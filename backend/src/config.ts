const parsePort = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)

  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback
  }

  return parsed
}

export const backendConfig = {
  backendPort: parsePort(process.env.WATCHTOWER_BACKEND_PORT, 8787),
  frontendPort: parsePort(process.env.WATCHTOWER_FRONTEND_PORT, 5173),
  systemName: process.env.WATCHTOWER_SYSTEM_NAME ?? 'watchtower',
  apiBaseUrl:
    process.env.WATCHTOWER_API_BASE_URL ??
    `http://localhost:${parsePort(process.env.WATCHTOWER_BACKEND_PORT, 8787)}`,
}
