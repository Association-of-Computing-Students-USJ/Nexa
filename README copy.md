# Tech Event Management + Live Games (Monorepo)

Full-stack starter structure for:
- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Node.js + Express
- **DB**: PostgreSQL
- **ORM**: Prisma
- **Realtime**: Socket.IO

## Quick start

### 1) Backend

```bash
cd server
npm install
cp .env.example .env
```

Update `server/.env` with your Postgres connection string, then:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

### 2) Frontend

```bash
cd client
npm install
npm run dev
```

## Notes
- **Admin auth** is JWT-based. Use the `/api/auth/login` endpoint to get a token (stubbed demo user creation is included in `server/src/services/authService.js`).
- **Live games** updates are broadcast via Socket.IO events. See `server/src/sockets/match.socket.js` and `client/src/socket/client.ts`.

