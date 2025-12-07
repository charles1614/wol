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
| `/api/suspend` | POST | Suspends the system |
| `/health` | GET | Health check |

## Deployment Guide

### Step 1: Prepare Server

```bash
# Install Node.js 18+ on your server
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be 18+
```

### Step 2: Copy Files to Server

From your local machine:

```bash
# Option A: Using rsync
rsync -avz apps/agent/ user@your-server:/opt/asus-agent/
rsync -avz packages/shared/ user@your-server:/opt/asus-agent/packages/shared/

# Option B: Using git (if server has git)
ssh user@your-server
cd /opt
git clone <your-repo-url> asus-wol
cd asus-wol/apps/agent
```

### Step 3: Install Dependencies

On the server:

```bash
cd /opt/asus-agent
npm install tsx
```

### Step 4: Configure Environment

Edit the systemd service file:

```bash
sudo nano /opt/asus-agent/asus-agent.service
```

Update these lines:

```ini
Environment=API_SECRET=<your-secret-key>  # Must match AGENT_SECRET in web app
```

### Step 5: Install Systemd Service

```bash
# Copy service file
sudo cp /opt/asus-agent/asus-agent.service /etc/systemd/system/

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
# - tsx not found: Run `npm install tsx` in /opt/asus-agent
# - Permission denied: Run service as root or fix file permissions
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
cd /opt/asus-agent
git pull

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
sudo rm -rf /opt/asus-agent
```

## Security Notes

- The agent runs as **root** to access `ss` command and `systemctl suspend`
- API requires Bearer token authentication
- Only expose port 3001 to trusted networks
- Use strong random secret for `API_SECRET`
- Consider using HTTPS reverse proxy (nginx) in production
