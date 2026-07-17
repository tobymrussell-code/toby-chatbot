# Design on a Dime — Mobile App

Expo (React Native, TypeScript) mobile-first app. Lets a user photograph or upload a
room, confirm the room type, choose a project goal (and investor strategy if
applicable), pick a design style, and get a practical AI-generated renovation report.

## Setup

```bash
cd mobile
npm install
cp .env.example .env
# edit .env: set EXPO_PUBLIC_API_URL to your computer's LAN IP, matching the backend
npx expo start
```

Scan the QR code with Expo Go (or run `npx expo start --android` / `--ios` with an
emulator/simulator). The backend server must be running and reachable at the same
LAN address configured in `.env` — **not `localhost`**, since that resolves to the
phone itself on a physical device.

## Structure

- `src/screens` — the 8 screens of the flow (welcome → photo processing → room
  confirmation → project goal → investor strategy → style direction → report →
  lead capture).
- `src/state/PlanningContext.tsx` — orchestrates the planning-session state machine
  and all API calls for the flow.
- `src/api` — API client (`client.ts`) and the mobile-safe file upload helper
  (`upload.ts`, uses `expo-file-system`'s `File.upload()` — never a Blob built from
  an ArrayBuffer, which can fail on iOS).
- `src/utils/imagePrep.ts` — normalizes photos (EXIF orientation baked in, resized,
  converted to JPEG, compressed) before upload via `expo-image-manipulator`.
- `src/theme` — warm color palette and typography shared across screens.

## Dev logging

`src/utils/log.ts` gates all technical logging (picker results, prepared file info,
upload/report API responses, errors) behind `__DEV__`, so nothing is logged in
production builds.
