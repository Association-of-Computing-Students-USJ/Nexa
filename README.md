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

Security rules: [`firestore.rules`](./firestore.rules) — deploy with `firebase deploy --only firestore:rules`.

## Development

```bash
cd client
cp .env.example .env   # fill in Firebase + admin values
npm install
npm run dev
```

Open http://localhost:5173

## Manual deploy to Firebase Hosting

```bash
cd client && npm run build
cd .. && npx firebase-tools deploy --only hosting,firestore:rules --project acsusj-web
```

Ensure `client/.env` (or exported `VITE_*` vars) is set **before** `npm run build` — Vite bakes env into the bundle at build time.

## CI/CD (GitHub Actions)

Workflow: [`.github/workflows/firebase-hosting.yml`](./.github/workflows/firebase-hosting.yml)

On push to `main`, it builds with secrets and deploys hosting + Firestore rules.

### Required GitHub repository secrets

| Secret | Description |
|--------|-------------|
| `FIREBASE_SERVICE_ACCOUNT` | JSON key from Firebase Console → Project settings → Service accounts |
| `VITE_FIREBASE_API_KEY` | Firebase web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | e.g. `acsusj-web.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | e.g. `acsusj-web` |
| `VITE_FIREBASE_STORAGE_BUCKET` | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | |
| `VITE_FIREBASE_APP_ID` | Must match the **Hosting** web app in Firebase Console |
| `VITE_FIREBASE_MEASUREMENT_ID` | Optional |
| `VITE_ADMIN_USERNAME` | Admin portal username |
| `VITE_ADMIN_PASSWORD` | Admin portal password |
| `VITE_ADMIN_FIREBASE_EMAIL` | Firebase Auth email for Firestore access |
| `VITE_ADMIN_FIREBASE_PASS` | Firebase Auth password |

### Firebase Console checklist

1. **Authentication → Sign-in method**: enable **Email/Password** and **Anonymous**
2. **Authentication → Settings → Authorized domains**: add your hosting URL (e.g. `acsusj-web.web.app`)
3. **Firestore → Rules**: publish rules from `firestore.rules` (or deploy via CLI)
4. **Extensions**: Trigger Email extension on `mail` collection (for registration emails)

## Admin

- Login: `/admin/login`
- Dashboard: `/admin/dashboard`
- QR scanner: `/admin/scanner`
