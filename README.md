# TruGanic Security Admin Dashboard

Admin UI for zero-trust bootstrap: generate keys, publish DIDs to GitHub, issue and revoke VCs.

**Deploying to a droplet:** see [docs/DEPLOYMENT_DROPLET.md](docs/DEPLOYMENT_DROPLET.md). A GitHub Actions workflow deploys on push of a `v*` tag (e.g. `v1.0.0`).

## Structure

- **frontend/** – Vite + React (dark theme). Key Gen, Publish DID, Issue VC, Revoke VC.
- **backend/** – Express server for publishing DID documents to GitHub (holds `GITHUB_TOKEN`).

## Prerequisites

- Node.js 18+
- Security service running (e.g. `http://localhost:3001`)
- GitHub Personal Access Token with `repo` (or `public_repo`) for DID publish

## Setup

### Backend

```bash
cd security-admin-dashboard/backend
npm install
cp .env.example .env
# Edit .env: set GITHUB_TOKEN, optionally GITHUB_REPO and BASE_PATH
npm run dev
```

Runs on `http://localhost:3100` by default.

### Frontend

```bash
cd security-admin-dashboard/frontend
npm install
cp .env.example .env
# Optional: set VITE_SECURITY_SERVICE_URL, VITE_DASHBOARD_API_URL
npm run dev
```

Runs on `http://localhost:5173` by default.

## Flow

1. **Key & DID:** Generate key pair, copy or download `.env` snippet (CLIENT_DID, CLIENT_PRIVATE_KEY). Paste into client app (e.g. client-farmer) `.env`. Then click "Publish DID to GitHub" to push the DID document (backend must have `GITHUB_TOKEN` and `GITHUB_REPO` set).
2. **Issue VC:** Enter DID, plugin ID, select permissions, submit. Security service issues the VC and stores it.
3. **Revoke VC:** Enter VC ID (from issue response or Security), optional reason, submit.

## Env (backend)

| Variable        | Description |
|----------------|-------------|
| PORT           | Server port (default 3100) |
| CORS_ORIGIN    | Frontend origin (default http://localhost:5173) |
| GITHUB_TOKEN   | GitHub PAT with repo access |
| GITHUB_REPO    | e.g. `truganic/did-documents` or `owner/repo` |
| BASE_PATH      | Path prefix in repo (default empty). Use `did-documents` if repo root has a did-documents folder. |

## Env (frontend)

| Variable                   | Description |
|---------------------------|-------------|
| VITE_SECURITY_SERVICE_URL | Security service (default http://localhost:3001) |
| VITE_DASHBOARD_API_URL    | Dashboard backend (default http://localhost:3100) |
