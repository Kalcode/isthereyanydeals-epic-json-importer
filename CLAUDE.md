# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an **IsThereAnyDeal (ITAD) Epic Games Importer** - a web app that helps users import their Epic Games library into IsThereAnyDeal collections via the ITAD API.

**Tech Stack:**
- **Astro** - Static site framework
- **Solid-JS** - Reactive UI components
- **Cloudflare Workers** - Deployment target (via Wrangler)
- **Bun** - Package manager and runtime

## Commands

```bash
bun dev              # Start dev server at localhost:4321 (opens browser)
bun build            # Build to ./dist
bun preview          # Build + run Wrangler dev server (Cloudflare simulation)
bun deploy           # Build + deploy to Cloudflare Workers
```

## Code Quality

- **Formatting/Linting**: Biome runs automatically on pre-commit via Lefthook
- **Commits**: Use conventional commits (enforced by commitlint)
  - Examples: `feat: add game list parser`, `fix: handle API rate limits`

## Workflow

1. **User runs the dev server** (`bun dev`) - don't start it from Claude
2. **Visual review**: Use chrome-devtools MCP to take snapshots for feedback
3. **Iterate**: Fix issues based on snapshot feedback
4. **Branch & commit**: Create feature branch, commit with conventional message, push for review

## Pull Requests

**Gitea API**: This repo uses self-hosted Forgejo (Gitea). Create PRs via API using `GITEA_TOKEN` from `.env`:

```bash
# Using the helper script
./scripts/create-pr.sh "PR Title" "PR Body" [base] [head]

# Direct API call
curl -X POST "https://code.clausens.cloud/api/v1/repos/kalcode/isthereyanydeals-epic-json-importer/pulls" \
  -H "Authorization: token $GITEA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "...", "body": "...", "head": "feature-branch", "base": "main"}'
```

## Architecture

### Core Flow
1. User pastes JSON list of Epic Games (from Epic library export)
2. App parses the game list
3. App uses ITAD API to search/match games
4. User reviews matches and selects collection
5. App imports games to user's ITAD collection

### Key Files
```
/src
├── components/     # Solid-JS UI components
├── layouts/        # Astro layouts
├── pages/          # Astro pages (routes)
└── global.css      # Global styles
```

### ITAD API
- API Documentation: https://itad.docs.apiary.io/
- Will need OAuth for user collections
- Rate limits apply

## Important Notes

- **Never start the dev server yourself** - user will run `bun dev`
- **Always use snapshots** for visual feedback via chrome-devtools MCP
- **Commit frequently** - small, focused commits with conventional messages
- **API keys**: Never commit API keys or tokens - use environment variables
