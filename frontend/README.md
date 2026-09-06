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

- `App.js` — shows the auth stack (Login/SignUp) or the main tab navigator (Home, Closet, Add Items, Generate, Saved) depending on `AuthContext`'s `isAuthenticated`. Both font loading and the session-restore check gate the splash screen, so there's no flash of the wrong screen on launch.
- `src/context/AuthContext.js` — holds the current user and session; `login`/`register`/`logout` persist the token via `src/utils/tokenStorage.js` and push it into the API client via `setAuthToken`.
- `src/api/` — thin wrappers around the backend's `/api/auth`, `/api/items`, `/api/outfits`, `/api/feedback` endpoints. `client.js`'s request interceptor attaches `Authorization: Bearer <token>` to every call automatically.
- `src/constants/options.js` — category/color/formality/season/occasion lists, mirroring the backend's enums (`backend/src/models/Item.js`, `backend/src/services/occasionRules.js`). Keep these in sync if the backend enums change.
- `src/screens/`
  - `LoginScreen` / `SignUpScreen` — email + password.
  - `HomeScreen` — the landing screen; also where "Log out" lives.
  - `UploadScreen` — take photos or pick from library, batch-upload.
  - `ReviewScreen` — polls until background classification finishes, then shows results for correction.
  - `ClosetScreen` / `ItemDetailScreen` — filterable grid + per-item metadata editing.
  - `OutfitScreen` — pick an occasion, generate an outfit, thumbs up/down feedback.
  - `SavedOutfitsScreen` — outfits the user liked.

## Notes

- **Session storage:** `src/utils/tokenStorage.js` uses `expo-secure-store` on iOS/Android and falls back to `localStorage` on web — `expo-secure-store`'s web implementation is an empty stub (there's no browser equivalent of Keychain/Keystore), so this needed an explicit `Platform.OS` branch rather than relying on the library alone.
- If uploads fail, double check `EXPO_PUBLIC_API_URL` is reachable from the phone's browser directly (e.g. visit `http://<ip>:4000/health`).
- If login fails right after a fresh backend restart with a different `JWT_SECRET`, that's expected — existing sessions are signed with the old secret and no longer verify; log in again.
