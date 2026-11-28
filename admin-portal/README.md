# Roomly Admin Portal

React 18 / Create React App admin console in the main Roomly repository. Admin authentication uses the backend's HttpOnly session cookie; no JWT is saved in browser storage.

## Run locally

```powershell
cd admin-portal
npm install
$env:PORT = '3002'
npm start
```

Open `http://localhost:3002`. The portal uses `REACT_APP_API_URL` when set; otherwise it targets the deployed Roomly API at `https://partner-portal-2qbj.onrender.com/api`.

## Admin account setup

Admin accounts cannot be created through partner registration. Admin login uses an Admin ID, not an email. From the backend directory, run `npm run admin:create`; by default it creates ID `roomlyadmin` and generates a secure one-time password which is printed once. Set `BOOTSTRAP_ADMIN_ID`, `BOOTSTRAP_ADMIN_NAME`, and optionally `BOOTSTRAP_ADMIN_PASSWORD` (12+ characters) to choose the ID/name/password. `BOOTSTRAP_ADMIN_EMAIL` is optional and is only an internal database contact field, never used to sign in.

```powershell
cd backend
npm run admin:create
```

For production, run this only after the backend migration has been deployed. Keep any bootstrap values out of Git and frontend environment variables. If the script generates a password, save it securely because it is shown only once.

## Live admin API

The dashboard reads overview totals, applications, properties, and partners from the Express API. Approving or rejecting a property updates PostgreSQL and records the admin, timestamp, and optional review note. The partner dashboard refreshes on focus and every 30 seconds to show the decision.

The backend's `FRONTEND_URL` must allow each browser origin exactly. For local development, include `http://localhost:3002` alongside the partner portal's local origin. In production, include both deployed frontend origins as comma-separated values.

Bookings currently show an empty state because the backend schema does not yet have booking records or booking APIs.

## Render Static Site settings

- Root directory: `admin-portal`
- Build command: `npm ci && npm run build`
- Publish directory: `build`
- Build environment variable: `REACT_APP_API_URL=https://partner-portal-2qbj.onrender.com/api`

Add the deployed Admin Site origin to the backend's `FRONTEND_URL`, keeping the Partner Site origin in the comma-separated list. Configure a `/*` rewrite to `/index.html` for React Router. Deploy the backend migration and admin API before using admin login.
