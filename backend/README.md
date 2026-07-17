# Design on a Dime — Backend API

Node.js/Express API backing the Design on a Dime renovation advisor app. Uses SQLite
(via `better-sqlite3`) for storage, local disk for photo uploads, and the Anthropic API
(Claude, with vision) for room-type detection and renovation report generation.

## Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set ANTHROPIC_API_KEY and BASE_URL (your computer's LAN IP)
npm start
```

The server listens on `0.0.0.0:PORT` (default 3000) so a phone on the same Wi-Fi can
reach it. **Do not use `localhost` in `BASE_URL`** — on a physical phone, localhost
points at the phone itself, not your computer. Find your LAN IP with
`ipconfig getifaddr en0` (Mac) or `ipconfig` (Windows), e.g. `http://192.168.1.42:3000`.

## API

All routes are under `/api/v1`:

- `POST /anonymous-sessions`
- `POST /planning-sessions`
- `GET /planning-sessions/:id`
- `PATCH /planning-sessions/:id/setup`
- `POST /photo-intake/upload-authorizations`
- `PUT /photo-intake/assets/:assetId/upload` (raw binary body)
- `POST /photo-intake/assets/:assetId/complete`
- `POST /photo-intake/assets/:assetId/download-authorizations`
- `POST /photo-intake/room-confirmations`
- `POST /reports`
- `GET /reports/:id`
- `POST /leads`

Uploaded photos are served statically from `/uploads/<file>`.

## Data

SQLite database lives at `backend/data/design-on-a-dime.sqlite3` (gitignored, created
automatically). Uploaded photos live in `backend/uploads/` (gitignored).

## Dev logging

When `NODE_ENV` is not `production`, the server logs each request path plus the
upload-authorization, upload-completion, and report-generation responses, and any
error messages from the Anthropic API. Set `NODE_ENV=production` to silence these.
