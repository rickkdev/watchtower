# Ralph Agent Instructions

## Overview

Ralph is an autonomous AI agent loop that runs AI coding tools repeatedly until all PRD items are complete. Each iteration is a fresh instance with clean context.

## Commands

```bash
# Run Ralph with Claude Code
./ralph run --tool claude

# Run Ralph with Codex
./ralph run --tool codex
```

## Key Files

- `ralph` - The bash loop that spawns fresh AI instances (supports `--tool claude` or `--tool codex`)
- `CLAUDE.md` - Instructions given to each Claude Code instance
- `CODEX.md` - Instructions given to each Codex instance
- `prd.json` - PRD formatting built with React Flow. It's designed for presentations - click through to reveal each step with animations.

## Patterns

- Each iteration spawns a fresh AI instance with clean context
- Memory persists via git history, `progress.txt`, and `prd.json`
- Stories should be small enough to complete in one context window
- Keep Watchtower's Ralph metadata inside `watchtower/` so agents can run against that directory directly
- Watchtower work happens directly on `main`; do not spin up separate Ralph branches
- Use short, natural, all-lowercase commit messages instead of story-template commit subjects
- Treat `Shadowbroker/` as a local reference repo, not part of Watchtower's tracked source
- Always update AGENTS.md with discovered patterns for future iterations
- Root scripts are managed through npm workspaces; run cross-project checks from the repo root with `npm run build`, `npm run lint`, and `npm run test`
- The frontend talks to the backend through the Vite proxy on `/api`; keep backend JSON endpoints rooted there for local development
- The backend baseline status contract lives at `/api/status` and `/health`; extend those endpoints instead of adding one-off shell health checks elsewhere
- Keep `/api/status` feed metadata derived from the live snapshot builders so endpoint, freshness, and version fields stay aligned with `/api/live/fast` and `/api/live/slow`
- The current map shell keeps its temporary layer scaffolding in `frontend/src/App.tsx`; when adding or removing shell layers before the shared data store lands, update both `layerDefinitions` and `layerMarkers` together
