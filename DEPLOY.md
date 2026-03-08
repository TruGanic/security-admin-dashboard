# Deploy security-admin-dashboard on a droplet (no nginx)

Use this when deploying to a single droplet (e.g. **129.212.238.68**) with frontend on **5173** and backend on **3100**.

---

## 1. On your droplet: install Node.js

```bash
# Ubuntu/Debian: install Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # should show v20.x
```

---

## 2. Put the app on the droplet

From your **local machine** (if using git):

```bash
# Push your code to GitHub/GitLab, then on the droplet:
git clone <your-repo-url> security-admin-dashboard
cd security-admin-dashboard
```

Or copy the `security-admin-dashboard` folder to the droplet with **scp** or **rsync**.

---

## 3. Install dependencies and build

```bash
cd security-admin-dashboard

# Backend
cd backend && npm install && npm run build && cd ..

# Frontend
cd frontend && npm install && cd ..
```

---

## 4. Configure environment

**Backend** – Create or edit `backend/.env` (replace with your values):

```env
PORT=3100
HOST=0.0.0.0
CORS_ORIGIN=http://129.212.238.68:5173
GITHUB_TOKEN=<your-github-token>
GITHUB_REPO=truganic/did-documents
BASE_PATH=
```

**Frontend** – Create or edit `frontend/.env`:

```env
VITE_SECURITY_SERVICE_URL=http://129.212.238.68:3001
VITE_DASHBOARD_API_URL=http://129.212.238.68:3100
```

---

## 5. Run with PM2

Install PM2 globally (once per droplet):

```bash
npm install -g pm2
```

From the **security-admin-dashboard** folder (repo root):

```bash
cd security-admin-dashboard
pm2 start ecosystem.config.cjs
```

Useful PM2 commands:

```bash
pm2 status                    # list apps
pm2 logs                      # all logs
pm2 logs dashboard-backend    # backend only
pm2 logs dashboard-frontend   # frontend only
pm2 restart all               # restart both
pm2 stop all                  # stop both
pm2 delete all                # remove from pm2

# Persist across reboots
pm2 save
pm2 startup                   # run the command it prints (once)
```

---

## 6. Open firewall ports

On the droplet:

```bash
# UFW (Ubuntu)
sudo ufw allow 5173/tcp
sudo ufw allow 3100/tcp
sudo ufw reload
```

If you use **DigitalOcean Cloud Firewall**, add inbound rules for **5173** and **3100** (TCP).

---

## 7. Access the app

- Frontend: **http://129.212.238.68:5173**
- Backend health: **http://129.212.238.68:3100/health**

---

## Checklist

| Step | What to do |
|------|------------|
| 1 | Install Node.js on droplet |
| 2 | Clone or copy `security-admin-dashboard` to droplet |
| 3 | In `backend/`: `npm install` and `npm run build`. In `frontend/`: `npm install`. |
| 4 | Set `backend/.env` and `frontend/.env` (see section 4). |
| 5 | From repo root: `pm2 start ecosystem.config.cjs` then `pm2 save` and `pm2 startup`. |
| 6 | Open firewall ports 5173 and 3100. |
| 7 | Open http://129.212.238.68:5173 in browser. |

---

## If something doesn’t work

- **Frontend loads but API fails:** Check backend `.env` has `CORS_ORIGIN=http://129.212.238.68:5173` and frontend `.env` has `VITE_DASHBOARD_API_URL=http://129.212.238.68:3100`. Restart both after changing `.env`.
- **Can’t connect to 5173 or 3100:** Ensure UFW or DigitalOcean firewall allows 5173 and 3100.
- **Backend needs GitHub:** `GITHUB_TOKEN` and `GITHUB_REPO` in backend `.env` must be correct.
