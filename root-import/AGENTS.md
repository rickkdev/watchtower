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
- `prd.json` - PRD formattion built with React Flow. It's designed for presentations - click through to reveal each step with animations.

## Patterns

- Each iteration spawns a fresh AI instance with clean context
- Memory persists via git history, `progress.txt`, and `prd.json`
- Stories should be small enough to complete in one context window
- Keep Watchtower-specific Ralph files under `watchtower/` when setting up that project workspace
- Treat `Shadowbroker/` as a separate local reference checkout rather than tracked Watchtower source
- Always update AGENTS.md with discovered patterns for future iterations
