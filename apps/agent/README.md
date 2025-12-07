# ASUS WOL Agent

HTTP server that exposes SSH monitoring and system suspend APIs for the ASUS WOL Dashboard.

## What It Does

- Monitors SSH connections via `ss -tn state established | grep ":22"`
- Exposes HTTP API for web dashboard to query
- Handles system suspend with inhibitor detection
- Runs as systemd service on your server

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ssh` | GET | Returns active SSH connections |
| `/api/ssh/kill` | POST | Kill specific SSH connection |
| `/api/ssh/kill-all` | POST | Kill all SSH connections |
| `/api/suspend` | POST | Suspends the system |
| `/health` | GET | Health check |

## Deployment Guide

### Step 1: Prepare Server

```bash
# Download and install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash

# In lieu of restarting the shell
\. "$HOME/.nvm/nvm.sh"

# Download and install Node.js
nvm install 24

# Verify the Node.js version
node -v # Should print "v24.11.1"

# Verify npm version
npm -v # Should print "11.6.2"

# Install pnpm globally
npm install -g pnpm

# Verify pnpm installation
pnpm --version
```

### Step 2: Copy Entire Monorepo to Server

The agent needs access to the shared package, so copy the whole monorepo:

```bash
# Option A: Using rsync (from your local machine)
rsync -avz --exclude 'node_modules' --exclude '.next' \
  /Users/charles/Projects/web/asus/ \
  user@your-server:/opt/asus-wol/

# Option B: Using git (on the server)
ssh user@your-server
cd /opt
git clone <your-repo-url> asus-wol
cd asus-wol
```

### Step 3: Install Dependencies

On the server:

```bash
cd /opt/asus-wol
pnpm install
```

This will install all dependencies including the shared package.

### Step 4: Configure Environment

Edit the systemd service file:

```bash
sudo vim /opt/asus-wol/apps/agent/asus-agent.service
```

Update these lines:

```ini
WorkingDirectory=/opt/asus-wol
Environment=API_SECRET=<your-secret-key>  # Must match AGENT_SECRET in web app
ExecStart=/root/.nvm/versions/node/v24.11.1/bin/pnpm --filter @asus/agent start
```

### Step 5: Install Systemd Service

```bash
# Copy service file
sudo cp /opt/asus-wol/apps/agent/asus-agent.service /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable service (start on boot)
sudo systemctl enable asus-agent

# Start service
sudo systemctl start asus-agent
```

### Step 6: Verify It's Running

```bash
# Check status
sudo systemctl status asus-agent

# View logs
journalctl -u asus-agent -f

# Test API (from another machine)
curl -H "Authorization: Bearer your-secret-key" http://your-server-ip:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "hostname": "your-server",
  "timestamp": 1733612345678
}
```

## Firewall Configuration

If using a firewall, allow port 3001:

```bash
# UFW
sudo ufw allow 3001/tcp

# firewalld
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AGENT_PORT` | `3001` | HTTP server port |
| `API_SECRET` | `agent-secret-key` | Auth secret (must match web app) |

## Troubleshooting

### Service won't start

```bash
# Check logs for errors
journalctl -u asus-agent -n 50

# Common issues:
# - Node.js not installed: Install Node.js 18+
# - pnpm not found: Install pnpm globally: npm install -g pnpm
# - Dependencies not installed: Run `pnpm install` in /opt/asus-wol
# - Permission denied: Run service as root or fix file permissions
```

### "workspace:*" error

This means you tried to use `npm` instead of `pnpm`. The agent requires pnpm:

```bash
# Install pnpm
npm install -g pnpm

# Install dependencies
cd /opt/asus-wol
pnpm install
```

### API returns 401 Unauthorized

- Verify `API_SECRET` in systemd service matches `AGENT_SECRET` in web app `.env.local`
- Restart service after changing: `sudo systemctl restart asus-agent`

### SSH connections not showing

- Verify `ss` command works: `ss -tn state established | grep ":22"`
- Check if service is running as root (needed for `ss` command)

## Updating the Agent

```bash
# Pull latest code
cd /opt/asus-wol
git pull

# Install any new dependencies
pnpm install

# Restart service
sudo systemctl restart asus-agent

# Verify
sudo systemctl status asus-agent
```

## Uninstalling

```bash
# Stop and disable service
sudo systemctl stop asus-agent
sudo systemctl disable asus-agent

# Remove service file
sudo rm /etc/systemd/system/asus-agent.service
sudo systemctl daemon-reload

# Remove agent files
sudo rm -rf /opt/asus-wol
```

## Security Notes

- The agent runs as **root** to access `ss` command and `systemctl suspend`
- API requires Bearer token authentication
- Only expose port 3001 to trusted networks
- Use strong random secret for `API_SECRET`
- Consider using HTTPS reverse proxy (nginx) in production
