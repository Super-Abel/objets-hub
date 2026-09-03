# Objets Hub

Manage a collection of **Objects** (`title`, `description`, `imageUrl`, `createdAt`).
Creating or deleting an object on one client is reflected in realtime on every other
client via Socket.IO.

Scope delivered here: **REST API (NestJS) + Web app (Next.js + shadcn/ui)**.
The mobile app is intentionally left out.

## Stack

| Part      | Tech                                              |
| --------- | ------------------------------------------------ |
| API       | NestJS 10, **hexagonal architecture** (ports & adapters) |
| Database  | MongoDB (Mongoose)                               |
| Storage   | Any S3-compatible service — **MinIO** here (non-AWS) |
| Realtime  | Socket.IO (`object:created`, `object:deleted`)  |
| API docs  | OpenAPI / Swagger UI at `/docs`                  |
| Web       | Next.js 14 App Router, Tailwind, shadcn/ui       |

### API conventions (aligned with the reference `files` module)

- **Typed config** — `src/config/storage.config.ts` (`registerAs`) reads and
  validates every `S3_*` env var once; adapters inject `ConfigType<…>`, never
  `process.env`.
- **Image policy** — `domain/image-policy.ts` holds, as pure framework-free
  rules: the MIME allowlist + size gate (`assertAcceptableImage`) and a
  magic-byte check (`assertRealImage`) that rejects a payload whose bytes aren't
  a real image, even with a spoofed `Content-Type`.
- **Typed error codes** — `domain/errors.ts` exposes an `ErrorCode` enum; every
  `DomainError` carries a `code`, mapped to an HTTP status by
  `DomainExceptionFilter` (`404 / 413 / 415 / 400`).
- **Env validation** — `src/config/env.validation.ts` checks every required var
  at boot (class-validator); a missing/blank value fails fast with a clear message.
- **Upload edge** — Multer is configured once in `objects.module.ts`
  (memory storage, size ceiling, MIME allowlist); the controller only declares
  `FileInterceptor('image')`.
- **Storage keys** — `infrastructure/storage/generate-storage-key.ts` builds
  `<uuid>.<ext>` (prefixed by `S3_KEY_PREFIX`, empty by default since the bucket
  is already `objects`); the original filename only contributes its extension.
- **Async queue** — `src/infra/queue/` (BullMQ + Redis) plus the
  `ObjectJobQueue` port. `DELETE /objects/:id` removes the row and broadcasts
  immediately; the S3 image deletion is a retryable job. Feature-flagged by
  `OBJECTS_QUEUE_ENABLED` (**default false** → deletion runs inline, no Redis
  needed), exactly like nexma's `FILE_QUEUE_ENABLED`. To enable: set
  `OBJECTS_QUEUE_ENABLED=true` and point `REDIS_URL` at any Redis (local Docker,
  Upstash, Render Key Value…).
- **Tests** — co-located `*.spec.ts` (`pnpm test`) + HTTP boundary tests
  (`pnpm test:integration`), excluded from `nest build`. CI runs both plus the
  web build on every push (`.github/workflows/ci.yml`).
- **Seed** — `pnpm seed [count]` (API must be running) inserts a few sample
  objects so a fresh checkout has content.

## Prerequisites

- Node 22+ (`.node-version` pins 22 — Node 20 is EOL on CI/Render)
- pnpm 9+ (`corepack enable` or `npm i -g pnpm`)
- Docker (for MongoDB + MinIO) — or your own Mongo/S3 instances

## 1. Infrastructure

```bash
docker compose up -d
```

This starts:
- MongoDB on `localhost:27017`
- MinIO on `localhost:9000` (console `localhost:9001`, `minioadmin` / `minioadmin`)
- a one-shot job that creates the `objects` bucket and makes it publicly readable
  (so `imageUrl` works directly in `<img>`).

## 2. API

```bash
cd api
cp .env.example .env      # already done in this repo
pnpm install
pnpm start:dev            # http://localhost:4000
```

### Endpoints

| Method | Path           | Body                                          | Result |
| ------ | -------------- | --------------------------------------------- | ------ |
| POST   | `/objects`     | multipart: `title`, `description`, `image` (file) | 201 + object |
| GET    | `/objects`     | `?limit` (1–200, default 100), `?skip` (≥0)   | object[] (newest first) |
| GET    | `/objects/:id` | —                                             | object |
| DELETE | `/objects/:id` | —                                             | 204, also deletes the S3 file |
| GET    | `/health`      | —                                             | `{ status, checks: { mongo, storage } }` — 200 or 503 |

`POST` uploads the image to S3 first; if the DB write then fails the upload is
rolled back so no orphan files are left. `DELETE` removes the DB row and the S3
object (S3 failure is logged, not fatal). All routes are rate-limited to
60 req/min/IP (`/health` is exempt).

## 3. Web

```bash
cd web
pnpm install
pnpm dev                  # http://localhost:3000
```

Open two browser tabs (or a tab + the API) and create/delete an object — the list
updates live in both.

## Architecture (API)

```
api/src/objects/
├── domain/                 # framework-free core
│   ├── collection-object.ts        # aggregate + invariants
│   ├── errors.ts                   # DomainError / ObjectNotFoundError
│   └── ports/                      # interfaces the app depends on
│       ├── object-repository.port.ts
│       ├── image-storage.port.ts
│       └── object-event-publisher.port.ts
├── application/            # use cases (one class each)
│   ├── create-object.use-case.ts
│   ├── list-objects.use-case.ts
│   ├── get-object.use-case.ts
│   └── delete-object.use-case.ts
├── infrastructure/         # adapters implementing the ports
│   ├── persistence/  mongoose-object.repository.ts
│   ├── storage/      s3-image-storage.adapter.ts
│   └── events/       objects.gateway.ts  (Socket.IO)
├── interface/http/         # driving adapter: REST controller, DTO, view, error filter
└── objects.module.ts       # the only place ports are bound to adapters
```

Dependency rule: `domain` depends on nothing; `application` depends only on
`domain`; `infrastructure` and `interface` depend inward. Swapping MongoDB, the
S3 provider or the transport means writing a new adapter — no use case changes.

## Environment

See `api/.env.example`. Key vars: `MONGODB_URI`, `S3_ENDPOINT`, `S3_BUCKET`,
`S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_PUBLIC_URL`, `CORS_ORIGIN`.
Web: `web/.env.example` → `NEXT_PUBLIC_API_URL`.

## Deploy (Render)

`render.yaml` at the repo root is a **Blueprint**: Render Dashboard → _New_ →
_Blueprint_ → pick `github.com/Super-Abel/objets-hub`. It provisions, all on the
free plan:

| Resource | What |
| --- | --- |
| `objets-hub-api` | web service, `rootDir: api`, `pnpm start:prod`, health `/health` |
| `objets-hub-web` | web service, `rootDir: web`, `pnpm start` |
| `objets-hub-redis` | Key Value store — wired to the API as `REDIS_URL`, queue enabled |

`CORS_ORIGIN` and `NEXT_PUBLIC_API_URL` are cross-wired between the two services
automatically. Render has **no managed MongoDB or S3**, so after the first deploy
set these secrets on `objets-hub-api` (marked `sync: false` in the blueprint):

- `MONGODB_URI` — a [MongoDB Atlas](https://www.mongodb.com/atlas) free `M0` cluster.
- `S3_ENDPOINT` / `S3_REGION` / `S3_BUCKET` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` /
  `S3_PUBLIC_URL` — any non-AWS S3 bucket (Cloudflare R2, Backblaze B2, Scaleway).
  The bucket must allow public reads so `imageUrl` renders in `<img>`.

Free-tier caveats: services sleep after 15 min idle (first request cold-starts,
the BullMQ worker resumes on wake); the Key Value store is not persisted, so a
pending image-delete job lost on a restart just leaves one orphan S3 object.
