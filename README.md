# ASUS WOL Dashboard

A production-ready monorepo for remote Wake-on-LAN control and server monitoring with Linear-inspired design.

## Features

- 🚀 **Wake-on-LAN** - Remote wake your ASUS PC via JDXB API
- 📊 **SSH Monitoring** - Real-time SSH connection tracking
- ❌ **SSH Kill** - Kill specific or all SSH connections
- 💤 **System Suspend** - Remote suspend with inhibitor handling
- 🔐 **Authentication** - NextAuth.js with credentials provider
- 📈 **Grafana Integration** - External dashboard linking
- 🎨 **Linear Design** - Dark theme with gradient orbs and animations

## Project Structure

```
asus/
├── apps/
│   ├── web/          # Next.js 16 dashboard → Deploy to Vercel
│   └── agent/        # Node.js daemon → Run on your server
└── packages/
    └── shared/       # Shared TypeScript types
```

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Linux server for agent (with systemd)
- JDXB account and credentials

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd asus
pnpm install
```

### 2. Configure Environment

Create `apps/web/.env.local`:

```bash
# NextAuth.js
AUTH_SECRET=<generate-with: openssl rand -base64 32>
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true

# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<your-secure-password>

# JDXB WOL API
JDXB_UID=<your-jdxb-uid>
JDXB_OWCODE=<your-jdxb-owcode>
JDXB_PEERID=<your-router-peerid>
ASUS_MAC=<your-pc-mac-address>
JDXB_PRODUCT=2581

# Agent connection
AGENT_URL=http://your-server-ip:3001
AGENT_SECRET=<generate-random-secret>

# Grafana (optional)
NEXT_PUBLIC_GRAFANA_DASHBOARD_URL=<your-grafana-url>
```

### 3. Development

```bash
# Terminal 1: Web app
pnpm dev

# Terminal 2: Agent (on Linux server)
cd apps/agent
AGENT_PORT=3001 API_SECRET=<same-as-AGENT_SECRET> pnpm dev
```

Open http://localhost:3000 and login with your admin credentials.

## Deployment

### Deploy Web App to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Set root directory to `apps/web`
4. Add all environment variables from `.env.local`
5. Deploy

### Deploy Agent to Server

See [apps/agent/README.md](apps/agent/README.md) for detailed instructions.

## API Endpoints

### Web App
- `POST /api/wol` - Trigger Wake-on-LAN
- `GET /api/agent/ssh` - Get SSH connections (proxies to agent)
- `POST /api/agent/ssh/kill` - Kill specific SSH connection (proxies to agent)
- `POST /api/agent/ssh/kill-all` - Kill all SSH connections (proxies to agent)
- `POST /api/agent/suspend` - Suspend server (proxies to agent)

### Agent (runs on server)
- `GET /api/ssh` - SSH connection states
- `POST /api/ssh/kill` - Kill specific SSH connection
- `POST /api/ssh/kill-all` - Kill all SSH connections
- `POST /api/suspend` - System suspend
- `GET /health` - Health check

## Documentation

- [Agent Deployment Guide](apps/agent/README.md)
- [Walkthrough](https://github.com/yourusername/asus-wol/blob/main/WALKTHROUGH.md)

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Auth**: NextAuth.js v5
- **Styling**: CSS Modules with Linear design system
- **Monorepo**: pnpm workspaces
- **Agent**: Node.js HTTP server with systemd

## License

MIT
