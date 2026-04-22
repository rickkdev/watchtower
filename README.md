# watchtower

Watchtower is a minimal self-hosted geospatial OSINT dashboard scaffold. This first slice sets up a Vite React frontend, a lightweight Node HTTP backend, and a visible system status surface for future feed and map work.

## Project layout

- `frontend/`: Vite + React TypeScript app that renders the full-screen map shell.
- `backend/`: small TypeScript HTTP API that serves health and baseline status metadata.
- `.env.example`: documented local configuration for both services.

## Local development

1. Install dependencies:

```bash
npm install
```

2. Copy the example environment file if you want custom ports or host settings:

```bash
cp .env.example .env
```

3. Start both services together:

```bash
npm run dev
```

4. Or start them independently:

```bash
npm run dev --workspace backend
npm run dev --workspace frontend
```

The frontend defaults to `http://localhost:5173` and the backend defaults to `http://localhost:8787`.

## Environment variables

- `WATCHTOWER_FRONTEND_PORT`: Vite dev server port. Optional.
- `WATCHTOWER_BACKEND_PORT`: backend listen port. Optional.
- `WATCHTOWER_API_BASE_URL`: backend origin used by the frontend proxy and production fetches. Optional.
- `WATCHTOWER_SYSTEM_NAME`: label shown in the status header. Optional.

## Quality checks

```bash
npm run build
npm run lint
npm run test
```
