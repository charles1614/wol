# ASUS WOL Web App

Next.js 16 dashboard for Wake-on-LAN control and server monitoring.

## Local Development

```bash
pnpm dev
```

Open http://localhost:3000

## Environment Variables

Create `.env.local`:

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

## Docker Deployment with Let's Encrypt

nginx runs on the host machine and proxies to the Docker container.

**1. Run the app container**

```bash
docker run -d \
  -p 3000:3000 \
  --env-file .env.local \
  --restart unless-stopped \
  --name asus-web \
  ghcr.io/charleswang1999/wol:latest
```

**2. Generate Let's Encrypt certificate**

```bash
sudo apt update && sudo apt install certbot nginx
sudo certbot certonly --standalone -d yourdomain.com
```

**3. Configure nginx**

Update `server_name` and certificate paths in `/etc/nginx/nginx.conf`:

```nginx
server_name yourdomain.com;
ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```

Copy the config and reload:

```bash
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf
sudo nginx -t && sudo systemctl reload nginx
```

**4. Auto-Renewal**

```bash
echo "0 0,12 * * * root certbot renew --quiet --post-hook 'systemctl reload nginx'" | sudo tee /etc/cron.d/certbot-renew
```

> **Note**: Let's Encrypt requires a valid domain. For IP-only access, use self-signed certificates.
