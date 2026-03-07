# Deploying Security Admin Dashboard to a DigitalOcean Droplet

This guide deploys the TruGanic Security Admin Dashboard (frontend + backend) on an Ubuntu droplet. The backend serves the built frontend and the API; the security service (VC issue/revoke) is assumed to be running elsewhere (e.g. platform-core Security on another host or same droplet).

**Target server**: Ubuntu 22.04 / 24.04 LTS.

---

## 1. Prerequisites on the droplet

SSH into the droplet, then install Node.js 20+ and Git:

```bash
apt update && apt upgrade -y

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

node -v   # v20.x.x
npm -v    # 9.x or higher

apt install -y git
```

---

## 2. Deploy the application

### Option A: Clone from Git (recommended)

```bash
cd /opt
git clone <your-security-admin-dashboard-repo-url> security-admin-dashboard
cd security-admin-dashboard
```

If the repo is private, use a deploy key or personal access token.

### Option B: Copy from your machine (rsync)

From your local machine:

```bash
rsync -avz --exclude node_modules --exclude .git --exclude frontend/dist --exclude backend/dist security-admin-dashboard root@YOUR_DROPLET_IP:/opt/
```

Then on the droplet:

```bash
cd /opt/security-admin-dashboard
```

---

## 3. Environment configuration

Create production `.env` files. **Do not commit real secrets to Git.**

### Backend – `backend/.env`

```env
NODE_ENV=production
PORT=3100
CORS_ORIGIN=https://your-domain.com
GITHUB_TOKEN=<your-github-pat-with-repo-access>
GITHUB_REPO=truganic/did-documents
BASE_PATH=
```

- `CORS_ORIGIN`: The URL users use to open the dashboard (e.g. `https://dashboard.truganic.io`). Use the same origin if you serve frontend and API from the same host.
- `GITHUB_TOKEN`: GitHub Personal Access Token with `repo` (or `public_repo`) for DID publish.
- `GITHUB_REPO`, `BASE_PATH`: Where DID documents are stored (see README).

### Frontend build (for same-origin API)

When building the frontend on the server, the deploy script uses the repo’s frontend `.env` or you can set build-time vars so the UI calls the same host for the API. If the dashboard is served from the same host as the backend (default deploy), leave `VITE_DASHBOARD_API_URL` unset so the frontend uses relative `/api` requests.

Optional `frontend/.env.production` (create on server if needed):

```env
VITE_DASHBOARD_API_URL=
VITE_SECURITY_SERVICE_URL=https://your-security-service-url
```

---

## 4. Install dependencies and build

On the droplet:

```bash
cd /opt/security-admin-dashboard

# Build frontend
cd frontend && npm ci && npm run build && cd ..

# Build backend
cd backend && npm ci && npm run build && cd ..

# Copy frontend build into backend for serving
mkdir -p backend/public
cp -r frontend/dist/* backend/public/
```

---

## 5. Process manager (PM2)

Install PM2 so the app restarts on reboot:

```bash
npm install -g pm2

cd /opt/security-admin-dashboard/backend
pm2 start dist/server.js --name security-admin-dashboard
pm2 save
pm2 startup
# Run the command that pm2 startup prints (e.g. for systemd)
```

Useful commands:

```bash
pm2 status
pm2 logs security-admin-dashboard
pm2 restart security-admin-dashboard
```

---

## 6. Firewall and ports

Expose SSH and the app port (e.g. 3100), or only 80/443 if you put Nginx in front:

```bash
ufw allow 22
ufw allow 3100
ufw enable
ufw status
```

---

## 7. Reverse proxy and SSL (optional)

To serve over HTTPS on port 80/443, install Nginx and proxy to the backend:

```bash
apt install -y nginx certbot python3-certbot-nginx
```

Create a vhost, e.g. `/etc/nginx/sites-available/security-admin-dashboard`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload:

```bash
ln -s /etc/nginx/sites-available/security-admin-dashboard /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d your-domain.com
```

Set `CORS_ORIGIN` in `backend/.env` to `https://your-domain.com`.

---

## 8. Quick checklist

| Step | Command / action |
|------|-------------------|
| 1 | Node 20 + Git on droplet |
| 2 | Clone (or rsync) repo to e.g. `/opt/security-admin-dashboard` |
| 3 | Add `backend/.env` (and optional `frontend/.env.production`) |
| 4 | Build frontend, build backend, copy `frontend/dist` → `backend/public` |
| 5 | From `backend/`: `pm2 start dist/server.js --name security-admin-dashboard` |
| 6 | `pm2 save` and `pm2 startup` |
| 7 | Open port 3100 (and 80/443 if using Nginx) |

---

## 9. Updating after code changes

Manual update:

```bash
cd /opt/security-admin-dashboard
git pull
cd frontend && npm ci && npm run build && cd ..
cd backend && npm ci && npm run build && cd ..
cp -r frontend/dist/* backend/public/
pm2 restart security-admin-dashboard
```

---

## 10. CI/CD: Deploy on release tag

A GitHub Actions workflow deploys to the droplet when you **push a tag** matching `v*` (e.g. `v1.0.0`).

### Setup (once)

1. **GitHub repo** → Settings → Secrets and variables → Actions.
2. Add these **secrets**:
   - **`DEPLOY_HOST`** – Droplet IP or hostname.
   - **`SSH_PRIVATE_KEY`** – Full contents of the private key that can SSH into the droplet.
3. Optional:
   - **`DEPLOY_USER`** – SSH user (default: `root`).
   - **`DEPLOY_PATH`** – Path to the repo on the server (default: `~/security-admin-dashboard`; use `/opt/security-admin-dashboard` if you cloned there).

### How to deploy

From your machine (with latest `main` merged):

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow will:

1. SSH into the droplet.
2. `cd` to the deploy path, `git fetch --tags` and `git checkout <tag>`.
3. Build frontend and backend, copy frontend build to `backend/public`.
4. Run `pm2 restart security-admin-dashboard` (or start if first time) and `pm2 save`.

Check the **Actions** tab in the repo for status and logs.

### Workflow file

- [.github/workflows/deploy-on-release-tag.yml](../.github/workflows/deploy-on-release-tag.yml)

---

## Troubleshooting

- **API 404**: Ensure you built and copied frontend into `backend/public` and restarted the app. Backend serves the UI only when `NODE_ENV=production`.
- **CORS errors**: Set `CORS_ORIGIN` in `backend/.env` to the exact origin users use (e.g. `https://dashboard.truganic.io`).
- **GitHub DID publish fails**: Check `GITHUB_TOKEN` and `GITHUB_REPO`; token must have repo access.
- **Security service (VC issue/revoke) unreachable**: Configure `VITE_SECURITY_SERVICE_URL` in frontend build (e.g. in `frontend/.env.production`) and ensure the security service is reachable from the browser (or from the droplet if you ever call it server-side).
