# ASUS WOL Web App

Next.js 16 dashboard for Wake-on-LAN control and server monitoring.

## Local Development

```bash
# From monorepo root
pnpm dev

# Or from apps/web
cd apps/web
pnpm dev
```

Open http://localhost:3000

## Environment Variables

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
AGENT_SECRET=<same-as-agent-API_SECRET>

# Grafana (optional)
NEXT_PUBLIC_GRAFANA_DASHBOARD_URL=<your-grafana-dashboard-url>
```

## Deployment to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Import in Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. **Important**: Set **Root Directory** to `apps/web`
4. Framework Preset: Next.js (auto-detected)

### 3. Configure Environment Variables

In Vercel project settings → Environment Variables, add all variables from `.env.local`:

```
AUTH_SECRET=<your-secret>
AUTH_URL=https://your-app.vercel.app
AUTH_TRUST_HOST=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<your-password>
JDXB_UID=<your-uid>
JDXB_OWCODE=<your-owcode>
JDXB_PEERID=<your-peerid>
ASUS_MAC=<your-mac>
JDXB_PRODUCT=2581
AGENT_URL=http://your-server-ip:3001
AGENT_SECRET=<your-agent-secret>
NEXT_PUBLIC_GRAFANA_DASHBOARD_URL=<your-grafana-url>
```

### 4. Deploy

Click "Deploy" - Vercel will build and deploy automatically.

### 5. Update Agent

After deployment, update your agent's environment to point to Vercel:

```bash
# On server, edit systemd service
sudo nano /etc/systemd/system/asus-agent.service

# Change API_URL to your Vercel URL (not needed for current setup)
# Agent doesn't push to web, web pulls from agent

# Restart if needed
sudo systemctl restart asus-agent
```

## Docker Deployment (Self-Hosted)

You can also deploy using Docker.

### 1. Build the Image

Run from the root of the monorepo:

```bash
docker build -t asus-web -f apps/web/Dockerfile .
```

### 2. Run the Container

```bash
docker run -d \
  -p 3000:3000 \
  --name asus-web \
  -e AUTH_SECRET=<your-secret> \
  -e AUTH_URL=http://localhost:3000 \
  -e ADMIN_USERNAME=admin \
  -e ADMIN_PASSWORD=<your-password> \
  -e JDXB_UID=<your-uid> \
  -e JDXB_OWCODE=<your-owcode> \
  -e JDXB_PEERID=<your-peerid> \
  -e ASUS_MAC=<your-mac> \
  -e AGENT_URL=http://host.docker.internal:3001 \
  -e AGENT_SECRET=<your-agent-secret> \
  asus-web
```

> Note: If accessing the agent on the host machine, use `http://host.docker.internal:3001` (on Docker Desktop) or the host's LAN IP.

### GitHub Actions

This repository includes a GitHub Actions workflow that automatically builds and pushes the Docker image to GitHub Container Registry (GHCR) on pushes to `main`.

To run the image from GHCR:

```bash
docker run -d -p 3000:3000 ghcr.io/<your-username>/<repo-name>:latest
```


## Getting JDXB Credentials

1. Login to https://yc.iepose.com/jdxb_console
2. Open DevTools (F12) → Application → Local Storage
3. Copy these values:
   - `jdxb-uid` → `JDXB_UID`
   - `jdxb-owcode` → `JDXB_OWCODE`
   - `jdxb-cueDev` → Extract `peerid` → `JDXB_PEERID`
4. Get your PC's MAC address:
   ```bash
   # Linux/Mac
   ip link show | grep ether
   # Remove colons: aa:bb:cc:dd:ee:ff → aabbccddeeff
   ```

## Troubleshooting

### "Invalid username or password"
- Check `ADMIN_USERNAME` and `ADMIN_PASSWORD` in environment variables
- Redeploy after changing env vars

### WOL not working
- Verify JDXB credentials are correct
- Check JDXB console to see if device is online
- Ensure `ASUS_MAC` is correct (no colons)

### Agent shows "offline"
- Verify `AGENT_URL` points to your server's IP and port 3001
- Check `AGENT_SECRET` matches agent's `API_SECRET`
- Ensure server firewall allows port 3001
- Test agent health: `curl http://your-server:3001/health`

### Suspend not working
- Agent must run as root
- Check agent logs: `journalctl -u asus-agent -f`
- Verify SSH connections are closed before suspending
