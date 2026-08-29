# ClothesApp Frontend

Expo / React Native app for the AI Personal Styling App.

## Setup

```
npm install
cp .env.example .env
```

Edit `.env` and set `EXPO_PUBLIC_API_URL` to your computer's LAN IP and the backend port (default 4000), e.g. `http://10.0.0.10:4000`. Find your IP with `ipconfig` (Windows, look under the Wi-Fi adapter's "IPv4 Address"). Your phone must be on the **same Wi-Fi network** as the computer running the backend — `localhost` won't work from a physical device.

Make sure the backend (`../backend`) is running first.

```
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS), or press `a`/`i` for an emulator/simulator, or `w` for web.

## Design system

`src/constants/theme.js` holds the shared tokens — colors, spacing, radii, type scale, card shadow. Screens should pull from there rather than hard-coding values, so the app stays consistent. Shared UI lives in `src/components/` (`Button`, `Chip`, `EmptyState`, `ItemCard`, `DuplicateReviewCard`); icons come from `@expo/vector-icons` (Ionicons).

## Structure

- `App.js` — bottom tab navigation: Closet, Add Items, Outfits (each tab has its own stack).
- `src/api/` — thin wrappers around the backend's `/api/items`, `/api/outfits`, `/api/feedback` endpoints.
- `src/constants/options.js` — category/color/formality/season/occasion lists, mirroring the backend's enums (`backend/src/models/Item.js`, `backend/src/services/occasionRules.js`). Keep these in sync if the backend enums change.
- `src/screens/`
  - `UploadScreen` — take photos or pick from library, batch-upload.
  - `ReviewScreen` — polls until background classification finishes, then shows results for correction.
  - `ClosetScreen` / `ItemDetailScreen` — filterable grid + per-item metadata editing.
  - `OutfitScreen` — pick an occasion, generate an outfit, thumbs up/down feedback.

## Notes

- No auth system — every request is scoped by a fixed `x-user-id: demo-user` header (`src/api/client.js`), matching the backend's default demo user.
- If uploads fail, double check `EXPO_PUBLIC_API_URL` is reachable from the phone's browser directly (e.g. visit `http://<ip>:4000/health`).
