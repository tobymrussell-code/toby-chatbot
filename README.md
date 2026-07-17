# Design on a Dime

Mobile-first renovation advisor app. A user takes or uploads a photo of a room,
confirms the room type, chooses a project goal (sell, improve, buy, invest, or just
explore), picks a design style, and gets back a practical, cautious, AI-generated
renovation report: recommendations, cost ranges, buyer-appeal notes, investor notes
when relevant, and prioritized next steps.

**Core promise:** "See what's possible before you spend a dollar."

## Structure

- `backend/` — Node.js/Express API + SQLite, with Claude-powered room detection and
  report generation. See `backend/README.md`.
- `mobile/` — Expo (React Native, TypeScript) mobile app. See `mobile/README.md`.
- `server.py` / `requirements.txt` — an unrelated, pre-existing standalone chat-widget
  script (Toby Russell's real estate site assistant); not part of the Design on a Dime
  app.

## Quick start

1. **Backend** — `cd backend && npm install && cp .env.example .env` (set
   `ANTHROPIC_API_KEY` and `BASE_URL`), then `npm start`.
2. **Mobile** — `cd mobile && npm install && cp .env.example .env` (set
   `EXPO_PUBLIC_API_URL` to match the backend's LAN address), then `npx expo start`.

Both `.env` files must point at your computer's LAN IP (e.g. `192.168.1.42`), not
`localhost` — a physical phone resolves `localhost` to itself, not your machine.

## MVP path

Photo upload → room confirmation → goal selection → style selection → report, with
save/share and "start another room" at the end. Future work (not in this MVP): admin
dashboard, branded PDF export, CRM integration.

## Required disclaimer

Every report includes:

> This report is for planning purposes only and is based on visible photo details and
> user-provided information. It is not a home inspection, appraisal, contractor bid,
> engineering opinion, or guarantee of increased property value. Always consult
> licensed professionals before making renovation, repair, or investment decisions.
