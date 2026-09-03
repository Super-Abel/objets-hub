# Integration tests

These tests exercise more than one layer at a time — the HTTP boundary, the DTO
validation, the domain-exception filter and the application use cases wired
together — while still replacing the *driven* infrastructure (MongoDB, S3,
Socket.IO) with the in-memory doubles from
[`src/objects/testing`](../../src/objects/testing).

That keeps them fast and hermetic: no Docker, no network, no `docker compose up`.

## Layout

| File | Scope |
| ---- | ----- |
| `objects.integration-spec.ts` | `POST/GET/DELETE /objects` end to end over a real Nest HTTP server (supertest), asserting status codes, the JSON contract, realtime events and the S3 rollback path. |

## Run

```bash
pnpm test:integration
```

The config lives in [`test/jest-integration.json`](../jest-integration.json); it
matches `test/integration/**/*.integration-spec.ts` only, so `pnpm test` (unit
specs under `src/`) and this suite never overlap.

## Adding a "full stack" test (optional)

To test the Mongoose and S3 adapters for real, add a spec that spins up
[`mongodb-memory-server`](https://github.com/nodkz/mongodb-memory-server) and
points `S3_ENDPOINT` at the MinIO container from `docker-compose.yml`. Gate it
behind an env flag (e.g. `RUN_DB_TESTS=1`) so the default run stays offline.
