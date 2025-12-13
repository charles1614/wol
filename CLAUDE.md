# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ASUS WOL Dashboard is a monorepo for remote Wake-on-LAN control and server monitoring with a Linear-inspired design. It consists of a Next.js web dashboard and a Node.js agent that runs on the server.

## Repository Structure

```
asus/
├── apps/
│   ├── web/          # Next.js 16 dashboard (deploy to Vercel/Docker)
│   └── agent/        # Node.js daemon (run on Linux server)
├── packages/
│   └── shared/       # Shared TypeScript types
└── .github/
    └── workflows/
        └── docker-build.yml
```

## Development Commands

### Root Level Commands
```bash
# Install all dependencies
pnpm install

# Development (starts web app only)
pnpm dev

# Build web app
pnpm build

# Start web app in production
pnpm start

# Start agent development server
pnpm agent:dev

# Start agent in production
pnpm agent

# Lint all packages
pnpm lint
```

### Web App Specific (apps/web)
```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

### Agent Specific (apps/agent)
```bash
# Development with watch mode
pnpm dev

# Build TypeScript
pnpm build

# Start production server
pnpm start
```

## Environment Configuration

### Web App (.env.local)
Required variables:
- `AUTH_SECRET` - NextAuth.js secret
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` - Admin credentials
- `JDXB_UID`, `JDXB_OWCODE`, `JDXB_PEERID` - JDXB API credentials
- `ASUS_MAC` - Target PC MAC address
- `AGENT_URL` - Agent server URL (http://server-ip:3001)
- `AGENT_SECRET` - Secret for agent authentication

### Agent
- `AGENT_PORT` - HTTP server port (default: 3001)
- `API_SECRET` - Authentication secret (must match web app's AGENT_SECRET)

## Architecture

### Web App (Next.js 16)
- Uses App Router with React 19
- Authentication via NextAuth.js v5 with credentials provider
- API routes proxy requests to the agent
- Middleware protects dashboard routes
- Standalone output mode enabled for Docker deployment

### Agent (Node.js)
- HTTP API server using native Node.js modules
- Monitors SSH connections via `ss` command
- Handles system suspend with inhibitor detection
- Requires root privileges for system operations
- Designed to run as systemd service

### Shared Package
- Contains TypeScript types shared between web app and agent
- Workspace package referenced via `@asus/shared`

## Deployment

### Web App Options
1. **Vercel**: Deploy `apps/web` directory with environment variables
2. **Docker**: Use included Dockerfile and docker-compose.yml
3. **GitHub Actions**: Automatic Docker builds to GHCR

### Agent Deployment
1. Copy entire monorepo to server at `/opt/asus-wol`
2. Install Node.js 18+, pnpm, and dependencies
3. Configure systemd service (see apps/agent/README.md)
4. Run as root for system access

## Key API Endpoints

### Web App APIs
- `POST /api/wol` - Trigger Wake-on-LAN via JDXB API
- Agent proxy endpoints under `/api/agent/*`

### Agent APIs
- `GET /api/ssh` - List active SSH connections
- `POST /api/ssh/kill` - Kill specific SSH connection
- `POST /api/ssh/kill-all` - Kill all SSH connections
- `POST /api/suspend` - Suspend the system
- `GET /health` - Health check

## Testing and Quality

- TypeScript for type safety across all packages
- ESLint configuration for code standards
- No specific test framework configured yet

## Important Notes

- The monorepo structure requires copying entire repo to deploy agent (not just apps/agent)
- Agent requires root privileges for SSH monitoring and system suspend
- Web app uses Next.js standalone output for optimized Docker images
- Authentication secrets must match between web app and agent for secure communication