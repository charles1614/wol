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
AUTH_SECRET=<generate-with: openssl rand -base64 32>
AUTH_URL=https://wol.mydomain.com
AUTH_TRUST_HOST=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<your-secure-password>
JDXB_UID=<your-jdxb-uid>
JDXB_OWCODE=<your-jdxb-owcode>
JDXB_PEERID=<your-router-peerid>
ASUS_MAC=<your-pc-mac-address>
JDXB_PRODUCT=2581
AGENT_URL=http://your-server-ip:3001
AGENT_SECRET=<same-as-agent-API_SECRET>
NEXT_PUBLIC_GRAFANA_DASHBOARD_URL=<your-grafana-dashboard-url>
```

## Production Deployment

### 1. Cloudflare DNS

Add A record: `wol` → your-server-ip (DNS only, gray cloud)

### 2. Run app container

```bash
docker run -d \
  -p 127.0.0.1:3000:3000 \
  --env-file .env.local \
  --restart unless-stopped \
  --name asus-web \
  ghcr.io/charles1614/wol:latest
```

### 3. Get Let's Encrypt certificate

```bash
sudo mkdir -p /var/www/certbot
sudo certbot certonly --webroot -w /var/www/certbot -d wol.mydomain.com
```

### 4. Add nginx config

> **Important**: Update `server_name` in `nginx/wol.conf` to match your domain before copying.

```bash
sudo cp nginx/wol.conf /etc/nginx/sites-available/wol
sudo ln -s /etc/nginx/sites-available/wol /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 5. Auto-renewal

```bash
echo "0 0,12 * * * root certbot renew --quiet --post-hook 'systemctl reload nginx'" | sudo tee /etc/cron.d/certbot-renew
```
