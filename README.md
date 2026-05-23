# NEXA 2026

Event registration, QR tickets, and admin attendance — **Firebase only** (no custom API server).

## Architecture

```
React (Vite)  →  Firebase Auth  →  Firestore
              →  Trigger Email extension (mail collection)
```

| Feature | Firebase service |
|---------|------------------|
| Public registration | Firestore `registrations` |
| Confirmation email | Firestore `mail` (Trigger Email extension) |
| QR ticket | Client-generated from doc ID (`NEXA-2026-{id}`) |
| Admin login | Env credentials + Firebase Auth session |
| Dashboard / scanner | Firestore real-time reads & updates |

Security rules live in [`firestore.rules`](./firestore.rules) at the repo root.

## Development

```bash
cd client
cp .env.example .env   # fill in Firebase + admin values
npm install
npm run dev
```

## Production build

```bash
cd client && npm run build
```

Static output is in `client/dist`. Deploy via Vercel (`vercel.json`) or serve with root `server.js` (static file server only — not an API).

## Admin

- Login: `/admin/login` (uses `VITE_ADMIN_USERNAME` / `VITE_ADMIN_PASSWORD`)
- Dashboard: `/admin/dashboard`
- QR scanner: `/admin/scanner`

Firebase Auth (`VITE_ADMIN_FIREBASE_*`) is required for Firestore read/write under security rules.
