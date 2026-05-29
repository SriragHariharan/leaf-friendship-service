# Friends Service

## Service Name & Overview

The Friends Service manages friend requests, friendships, and friend ranking based on post interactions. It maintains a local user cache synced from Kafka and exposes an unauthenticated endpoint used by fanout-service to resolve top friend IDs for feed distribution.

**Tech Stack**

- **Language:** TypeScript (ESM)
- **Framework:** Express 5
- **ORM:** Prisma 6 (MySQL)
- **Key libraries:** KafkaJS, jsonwebtoken

## Architecture & Dependencies

### Internal Dependencies

| Dependency | Purpose |
|---|---|
| **MySQL** | Primary data store (`leaf-friends-db`) via Prisma |
| **Kafka** | Publishes friendship events; consumes user and interaction events |

### Event Contracts

See [`../KAFKA_TOPICS.txt`](../KAFKA_TOPICS.txt) for the platform topic list.

| Direction | Topic | Consumer group | Events |
|---|---|---|---|
| **Produces** | `friendship.events` | — | `friend_request.sent` (key: `requestId`) |
| **Consumes** | `interaction.events` | `friends-service-interaction-events` | `post.liked`, `post.unliked`, `post.commented`, `post.uncommented` |
| **Consumes** | `user.events` | `friends-service-user-events` | Syncs user cache |
| **Consumes** | `profile.visited` | `friends-service-profile-visited` | `{ profileOwnerID, visitorUserID }` — **no producer exists in the codebase** |

### External APIs

None.

## Environment Variables

```bash
# --- Server ---
PORT=2003

# --- Database (local MySQL) ---
DATABASE_URL="mysql://root:your-password@localhost:3306/leaf-friends-db"

# --- Database (Aiven MySQL — uncomment for production) ---
# DATABASE_URL="mysql://avnadmin:your-password@your-service.a.aivencloud.com:12345/defaultdb?sslcert=./certs/aiven-ca.pem&sslaccept=strict"

# --- Auth / JWT ---
ACCESS_TOKEN_SECRET=your-access-token-secret

# --- Kafka (local — plaintext Docker) ---
KAFKA_MODE=local
KAFKA_BROKERS=localhost:9092

# --- Kafka (Aiven — uncomment and set KAFKA_MODE=aiven) ---
# KAFKA_MODE=aiven
# KAFKA_BROKERS=your-service.a.aivencloud.com:12345
# KAFKA_SASL_USERNAME=your-aiven-username
# KAFKA_SASL_PASSWORD=your-aiven-password
# KAFKA_SASL_MECHANISM=scram-sha-256
# KAFKA_SSL_CA_PATH=./ca.pem
# KAFKA_SSL_CA=
```

> **Note:** If `PORT` is unset, the service defaults to **4042** in code. Set `PORT=2003` to match the platform port map and api-gateway configuration.

> **Cross-service note:** `ACCESS_TOKEN_SECRET` must match the value configured in user-service.

## Getting Started

### Prerequisites

- **Node.js** 18+
- **MySQL** 8+
- **Kafka** from parent docker-compose
- **user-service** running (publishes `user.events` consumed on startup)

### Local Infrastructure

```bash
# From the parent repo root (d:\main PROJECTS\leaf\)
docker compose up -d kafka
```

Create the MySQL database:

```sql
CREATE DATABASE `leaf-friends-db`;
```

### Install & Run

```bash
cd friends-service
cp .env.example .env
npm install
npx prisma migrate dev
npm run dev
```

Verify: service listens on `http://localhost:2003`

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `tsx watch src/app.ts` | Development with hot reload |
| `start` | `node dist/app.js` | Production start (requires `build`) |
| `build` | `prisma generate && tsc` | Generate Prisma client and compile TypeScript |
| `prisma:generate` | `prisma generate` | Regenerate Prisma client |
| `prisma:migrate` | `prisma migrate dev` | Run database migrations |
| `prisma:studio` | `prisma studio` | Open Prisma Studio GUI |

## API / Event Interface

Gateway prefix: `/api/v1/friend` (path rewritten to `/api/v1/...` upstream)

### Friend Requests — `/api/v1/friend-requests`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/friend-requests/relationship/:otherUserId` | Yes | Get relationship with another user |
| `GET` | `/api/v1/friend-requests/` | Yes | List incoming pending requests |
| `POST` | `/api/v1/friend-requests/:friendId` | Yes | Send friend request |
| `PATCH` | `/api/v1/friend-requests/:friendRequestId` | Yes | Accept/reject friend request |

### Friends — `/api/v1/friends`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/friends/top-friend-ids` | **No** | Top friend IDs for fanout (`?userId=`) |
| `GET` | `/api/v1/friends/` | Yes | Get friends list |
| `DELETE` | `/api/v1/friends/:friendId` | Yes | Unfriend |

> The unauthenticated `top-friend-ids` endpoint is called directly by fanout-service via `FRIEND_IDS_FETCH_URL`.
