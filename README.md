<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="80" alt="Nest Logo" />
</p>

<h1 align="center">Zomra — Backend API</h1>

<p align="center">
  A smart social platform that connects people nearby with shared interests for real-life meetups.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-v11-E0234E?logo=nestjs" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript" />
  <img src="https://img.shields.io/badge/PostgreSQL-Prisma-2D3748?logo=prisma" />
  <img src="https://img.shields.io/badge/Auth-JWT%20%2B%20Google%20OAuth-orange" />
  <img src="https://img.shields.io/badge/Pattern-CQRS-blueviolet" />
  <img src="https://img.shields.io/badge/WebSockets-Socket.io-black?logo=socket.io" />
</p>

---

## What is Zomra?

Zomra transforms virtual interactions into meaningful real-life meetups. Users post activity invitations — coffee, sports, hiking, parties — and the platform matches them with nearby people who share the same interests.

Key principles:
- **Not a dating app** — focused on activities and shared interests
- **Not a business network** — focused on real-time, real-world meetups
- **Trust-first** — reputation scores, reviews, and a reporting system keep the community safe

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | NestJS v11 |
| Language | TypeScript 5.7 |
| Database | PostgreSQL |
| ORM | Prisma 6 |
| Auth | JWT (access + refresh) + Google OAuth 2.0 |
| Architecture | CQRS (CommandBus / QueryBus) |
| Real-time | Socket.io via `@nestjs/websockets` |
| Validation | class-validator + class-transformer |
| Testing | Jest + Supertest |

---

## Project Setup

### Prerequisites

- Node.js ≥ 20
- PostgreSQL running locally or via Docker
- A Google OAuth app (Client ID + Secret) for social login

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file at the project root:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/zomra"

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_REFRESH_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# App
PORT=3000
FRONTEND_URL=http://localhost:3001
```

### 3. Run database migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Start the server

```bash
# Development (watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`.

---

## API Modules

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/auth` | Google OAuth, JWT login, token refresh, logout |
| Users | `/users` | Profile management, complete profile |
| Interests | `/interests` | Global interest list (admin managed) |
| User Interests | `/user-interests` | Add/remove interests from user profile |
| Events | `/events` | Create, list, search, join, leave events |
| Reviews | `/reviews` | Rate and review other participants |
| Messaging | `/messaging` | Private conversations and group event chat |
| Notifications | `/notifications` | In-app notification feed |
| Reports | `/reports` | Report users or events for misconduct |
| Admin | `/admin` | Staff management, user/event moderation |

### Authentication Flow

```
1. GET  /auth/google                  → redirect to Google consent screen
2. GET  /auth/google/callback         → receive tokens (access + refresh in cookies)
3. POST /auth/refresh                 → rotate tokens using refresh cookie
4. POST /auth/logout                  → clear refresh token
```

All protected endpoints require the `Authorization: Bearer <access_token>` header,
or the `access_token` cookie set after login.

### Events — Key Endpoints

```
POST   /events                              → create event (auth required)
GET    /events                              → list events (public, supports ?city=&category=&status=&page=&limit=)
GET    /events/nearby                       → nearby events (?lat=&lng=&radiusKm=)
GET    /events/:id                          → event detail (public)
PATCH  /events/:id                          → update event (host only)
DELETE /events/:id                          → delete event (host only)

POST   /events/:id/join                     → request to join (auth required)
POST   /events/:id/leave                    → leave event (auth required)
GET    /events/:id/participants             → list participants (auth required)
PATCH  /events/:id/participants/:userId     → accept or reject a participant (host only, body: { action: "accept" | "reject" })
```

### WebSocket — Real-time Messaging

Connect to `ws://localhost:3000/messaging` with a valid JWT:

```js
// Client must send token on handshake
const socket = io('http://localhost:3000/messaging', {
  auth: { token: '<access_token>' }
})

socket.emit('joinConversation', { conversationId: '...' })
socket.emit('joinEventRoom',    { eventId: '...' })

socket.on('newMessage',      (msg) => { ... })
socket.on('newGroupMessage', (msg) => { ... })
socket.on('messageDeleted',  ({ messageId }) => { ... })
```

Connections without a valid token are immediately disconnected.

---

## Database Schema

12 tables covering all core features:

```
users                 → profiles, reputation, location, role
events                → activity invitations with geolocation
event_participants    → join requests with status (pending / accepted / rejected / left)
interests             → global interest catalog
user_interests        → many-to-many: users ↔ interests
conversations         → private 1-on-1 chats (optionally linked to an event)
messages              → messages inside a conversation
group_event_messages  → group chat inside an event room
media                 → photos and reels uploaded to events
reviews               → post-event ratings between accepted participants
notifications         → in-app notification feed
reports               → user/event misconduct reports
```

Run `npx prisma studio` to browse data visually.

---

## Architecture

The project follows **CQRS** — every use case is either a Command (write) or a Query (read).

```
src/
├── auth/                    # JWT strategies, guards, decorators
├── users/
│   ├── api/                 # Controller
│   ├── application/
│   │   ├── commands/        # CompleteUserCommand + Handler
│   │   └── queries/         # FindUserByIdQuery + Handler
│   ├── domain/              # User entity + UserRepository interface
│   └── infrastructure/      # Prisma implementation of UserRepository
├── events/                  # Same structure — 7 commands, 4 queries
├── messaging/               # HTTP controllers + Socket.io gateway
├── reviews/
├── notifications/
├── reports/
├── interests/
├── userinterests/
├── admin/
└── prisma/                  # PrismaService + PrismaModule
```

All modules use repository abstraction — infrastructure is injected via token (`@Inject(ID_USER_REPOSITORY)`), keeping domain logic free of Prisma.

---

## Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

---

## Code Quality

```bash
# Lint
npm run lint

# Format
npm run format

# Type check (no emit)
npx tsc --noEmit
```

The project enforces no `console.log` in production code and no `any` types in new code.

---

## Roles & Permissions

| Role | Permissions |
|------|-------------|
| `user` | Create events, join events, send messages, leave reviews, report |
| `admin` | Everything above + manage users, suspend events, manage interests, delete reviews |
| `observer` | Read-only access to admin panel |

---

## Environment Notes

- Access tokens expire in **15 minutes**. The frontend should use the refresh endpoint to rotate silently.
- Refresh tokens are stored hashed (SHA-256) in the database — plain tokens are never persisted.
- CORS is restricted to `FRONTEND_URL`. Set this in `.env` for production.
- The WebSocket namespace is `/messaging`. Clients must pass the JWT in `handshake.auth.token`.

---

## License

MIT