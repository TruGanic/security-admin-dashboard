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

## 3. Backend on the droplet

```bash
cd security-admin-dashboard/backend
npm install
npm run build
```

Create `.env` in `backend/` (replace with your values):

```env
PORT=3100
HOST=0.0.0.0
CORS_ORIGIN=http://129.212.238.68:5173
GITHUB_TOKEN=<your-github-token>
GITHUB_REPO=truganic/did-documents
BASE_PATH=
```

Start the backend (and keep it running):

```bash
npm start
```

To run in background (install pm2 first: `npm install -g pm2`):

```bash
pm2 start dist/server.js --name dashboard-backend
pm2 save
pm2 startup
```

---

## 4. Frontend on the droplet

Open a **new terminal** (or use another session):

```bash
cd security-admin-dashboard/frontend
npm install
```

Create or edit `.env` in `frontend/`:

```env
VITE_SECURITY_SERVICE_URL=http://129.212.238.68:3001
VITE_DASHBOARD_API_URL=http://129.212.238.68:3100
```

Start the frontend:

```bash
npm run dev
```

To run in background with pm2:

```bash
pm2 start "npm run dev" --name dashboard-frontend --cwd $(pwd)
pm2 save
```

---

## 5. Open firewall ports

On the droplet:

```bash
# UFW (Ubuntu)
sudo ufw allow 5173/tcp
sudo ufw allow 3100/tcp
sudo ufw reload
```

If you use **DigitalOcean Cloud Firewall**, add inbound rules for **5173** and **3100** (TCP).

---

## 6. Access the app

- Frontend: **http://129.212.238.68:5173**
- Backend health: **http://129.212.238.68:3100/health**

---

## Checklist

| Step | What to do |
|------|------------|
| 1 | Install Node.js on droplet |
| 2 | Clone or copy `security-admin-dashboard` to droplet |
| 3 | Backend: `npm install` → `npm run build` → set `.env` (CORS_ORIGIN, GITHUB_TOKEN, etc.) → `npm start` (or pm2) |
| 4 | Frontend: `npm install` → set `.env` (VITE_DASHBOARD_API_URL with droplet IP) → `npm run dev` (or pm2) |
| 5 | Open ports 5173 and 3100 in firewall |
| 6 | Open http://129.212.238.68:5173 in browser |

---

## If something doesn’t work

- **Frontend loads but API fails:** Check backend `.env` has `CORS_ORIGIN=http://129.212.238.68:5173` and frontend `.env` has `VITE_DASHBOARD_API_URL=http://129.212.238.68:3100`. Restart both after changing `.env`.
- **Can’t connect to 5173 or 3100:** Ensure UFW or DigitalOcean firewall allows 5173 and 3100.
- **Backend needs GitHub:** `GITHUB_TOKEN` and `GITHUB_REPO` in backend `.env` must be correct.
