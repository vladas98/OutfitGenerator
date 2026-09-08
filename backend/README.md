# ClothesApp Backend

Express + MongoDB API for the AI Personal Styling App. Uses OpenRouter (routed to a Claude model) for vision classification and outfit reasoning.

## Setup

```
npm install
cp .env.example .env
```

Fill in `.env`:
- `JWT_SECRET` — signs login sessions. A random string (`openssl rand -hex 32`); changing it logs everyone out.
- `MONGODB_URI` — local (`mongodb://127.0.0.1:27017/clothesapp`) or an Atlas connection string.
- `OPENROUTER_API_KEY` — from https://openrouter.ai/keys
- `OPENROUTER_VISION_MODEL` / `OPENROUTER_TEXT_MODEL` — default to `anthropic/claude-sonnet-5`, swap for any OpenRouter model id.

```
npm run dev
```

Server starts on `PORT` (default 4000). Every route except `/health`, `POST /api/auth/register`, `POST /api/auth/login`, and `POST /api/auth/reset-password` requires a `Authorization: Bearer <token>` header — see the Auth section below.

## API

**Auth** — register, login, and reset-password are public; everything else requires `Authorization: Bearer <token>`, obtained from register or login.
- `POST /api/auth/register` — body `{ "email", "password", "name"? }`. Password must be 6+ characters; 409 if the email's taken. Returns `{ token, user }`.
- `POST /api/auth/login` — body `{ "email", "password" }`. Same "incorrect email or password" message whether the email is unknown or the password is wrong, so the error can't be used to enumerate accounts. Returns `{ token, user }`.
- `POST /api/auth/reset-password` — body `{ "email", "newPassword" }`. Sets a new password directly and returns the same generic message whether or not the account exists (same no-enumeration reasoning as login). **There is no verification step** — no emailed link or code — so anyone who knows an account's email can take it over. That was a deliberate scope call for a class demo with no email infrastructure; it is not safe for real users, and adding a token-and-email flow is the fix before this goes anywhere real.
- `GET /api/auth/me` — the current user, from the token.

**Items / Outfits / Feedback**

- `POST /api/items/batch` — multipart form, field `images` (up to 20 files). Fingerprints each image for duplicates, creates pending Items, returns them immediately, then classifies each one concurrently in the background (so the client can poll for real per-item progress).
- `GET /api/items?category=&colorFamily=` — list the user's closet.
- `GET /api/items/:id` — includes `duplicateOfItemId`, populated, when the item looks like a duplicate.
- `PATCH /api/items/:id` — correct classification fields (category, colorFamily, colorHex, pattern, formality, season); marks item `classified`.
- `POST /api/items/:id/dismiss-duplicate` — user reviewed a suspected duplicate and chose to keep it; clears the flag.
- `DELETE /api/items/:id`
- `POST /api/outfits/generate` — body `{ "occasion": "work", "seedItemIds": [], "excludeItemIds": [] }`. Builds color-theory-filtered candidates locally, then asks Claude to pick the best one and explain why.
  - `seedItemIds` — items the outfit must include ("build an outfit around this"). Seeds bypass the occasion filters, since the user picked them deliberately.
  - `excludeItemIds` — items to leave out. Replacing a piece sends the pieces being kept as seeds and the rejected one as an exclusion.
  - On failure, returns a 422 naming what's actually missing (e.g. "No bottoms in your closet fit work"), via `diagnoseShortage`.
- `GET /api/outfits` — outfit history, populated with items.
- `GET /api/outfits/saved` — outfits the user liked.
- `GET /api/outfits/:id`
- `PATCH /api/outfits/:id` — body `{ "occasion": "date_night" }`. Re-files an outfit under a different occasion when the user thinks it suits one better. Validated against the known occasions; the outfit itself is unchanged.
- `POST /api/outfits/:id/save` / `POST /api/outfits/:id/unsave` — liking an outfit auto-saves it; unsaving removes it from Saved but keeps the outfit and its feedback, so the preference history still informs future suggestions.
- `POST /api/feedback` — body `{ "outfitId", "liked": true|false, "reason"? }`. Feeds future outfit generations via a rolling like/dislike summary.

## Notes

- **Real per-account isolation.** `requireAuth` (`src/middleware/auth.js`) verifies a JWT and sets `req.userId` from it — every controller already scoped its queries by `req.userId`, so this replaced the old scheme (a client-supplied `x-user-id` header, trusted as-is, defaulting to a shared `demo-user`) without touching the controllers themselves. Passwords are hashed with `bcryptjs`; `User.toJSON` strips the hash so it can't leak into a response even by accident. Sessions are 30-day JWTs — long-lived on purpose, since there's nothing more sensitive here than a closet of clothing photos and re-login friction isn't worth it.

- **Model replies use structured outputs.** Both classification and outfit selection send a JSON Schema via `response_format`, so the provider guarantees a parseable reply. Asking for JSON in the prompt alone was not reliable — the model intermittently returned a truncated string or omitted the closing brace (roughly 1 in 5 calls), which failed the whole request. The classification schema also mirrors the Item model's enums, so an invalid category can't reach Mongoose. If a configured model doesn't support structured outputs, `requestJson` falls back to a plain request with a lenient parser that repairs those truncations.

- **Images live in MongoDB**, in their own `itemimages` collection, served by the public `GET /api/images/:id` route — an item's `imageUrl` is just that path. They were previously written to local disk under `uploads/`, which broke in hosting: the host wipes its filesystem on every restart and redeploy, so photos vanished while the `Item` rows survived, leaving a closet of broken thumbnails. Storing the bytes in the database makes them exactly as durable as everything else.
  - Bytes are a separate collection rather than a field on `Item`, because `GET /api/items` loads whole item documents — embedding a few hundred KB of binary in each would turn a closet listing into a multi-megabyte response.
  - The serving route is deliberately unauthenticated: the client renders these with `<Image src>`, which can't attach an `Authorization` header. Same exposure as the static files it replaced — an image is reachable by anyone who knows its (random `ObjectId`) id.
  - Reading with `.lean()` returns BSON `Binary`, not a Node `Buffer`; handing that to `res.send()` silently base64-encodes it, so the image arrives 33% oversized and unrenderable. `getImage` normalises to a real `Buffer`.
  - Deleting an item deletes its image too, or orphaned bytes would accumulate forever.
  - Fine at closet scale. Object storage (S3, Cloudinary) is the right answer if this ever grows beyond a few hundred photos per user.
  - `uploads/` and the `/uploads` static mount remain only for items created before this change; nothing writes there now.
- **Footwear is out of scope.** `shoes` is not a valid category, outfits are built from top+bottom (or a dress) plus an optional outerwear/accessory layer, and the classifier is told to file footwear photos under `other`.
- **Occasion rules** (`src/services/occasionRules.js`) follow the project's styling guidelines. Beyond formality, each occasion declares hard coverage constraints — `disallowedSleeves`, `disallowedNecklines`, `disallowedHemlines`, `disallowedGarmentStyles` — plus color-strategy weighting.
  - Work and School share a base ruleset (no sleeveless, no crop tops, knee-length minimum, jeans + t-shirt allowed) but diverge on ceiling: `business` is excluded from School's pool entirely, not just deprioritized.
  - Date Night allows sleeveless and *boosts* complementary color pairings; Work, School, and Wedding Guest penalize them in favour of neutral + one accent.
  - Wedding Guest hard-blocks white and beige (standing in for ivory/cream/pale blush) — but only for `dress` and `bottom` (`avoidColorFamiliesFor`). A white or beige *top* is exempt: the etiquette concern is not reading as bridal, which is about a white gown or skirt, not a men's dress shirt. An unscoped ban was excluding perfectly normal wedding-guest menswear.
  - Enforcing these needs coverage attributes on each Item (`sleeves`, `neckline`, `hemline`, `garmentStyle`), captured during classification. An **unknown** attribute passes the filter rather than hiding the item, so items classified before these fields existed degrade gracefully — run `node scripts/reclassifyCoverage.js --apply` to backfill them.
- Color theory matching (`src/services/colorMatching.js`), occasion rules, and cross-piece formality consistency (`src/services/styleRules.js`) run entirely locally — Claude only picks among pre-validated candidates and writes the reasoning, per the spec's "grounded in actual color theory" requirement.
- **Outfit variety:** `buildCandidates` keeps every candidate scoring within `SCORE_BAND_TOLERANCE` of the best, shuffles that band, and downranks recently generated outfits at three levels: `repeatPenalty` (whole outfit repeating — capped via `Math.max`, so it only fires on a full match), `recentItemPenalty` (this exact piece reappearing, summed across recent outfits), and `recentCategoryColorPenalty` (this category+color combo reappearing, regardless of which physical item). The third one exists because the first two aren't enough on their own: a closet with two beige tops and one each of white/blue can satisfy both item-level checks by rotating between the two *different* beige tops — no single item repeats often, so neither penalty fires much — while every other generation still comes back beige to the person looking at it. The category-color check is what actually tracks the thing a user perceives as "the same outfit again."
- **Duplicate detection:** `src/services/imageHash.js` computes a 64-bit dHash per upload. Matches within `DUPLICATE_THRESHOLD` Hamming distance (5) are flagged via `duplicateOfItemId` — checked against the existing closet and within the same batch. Nothing is auto-deleted; the user decides, from either the Review screen or the Closet.
  - The threshold was picked from the real distance distribution: true duplicates landed at 0-3, then nothing until 7, where unrelated garments start colliding. Re-check that distribution before raising it.
  - Duplicate flags are set before classification runs, so category is unknown at that moment. Once classified, `clearMismatchedDuplicateFlag` drops any flag linking two different categories.
  - Catches re-uploaded, resized, or recompressed copies. A garment *re-photographed* from a new angle may exceed the threshold and slip through — the deliberate trade-off, since false accusations are worse than misses.
  - `node scripts/backfillImageHashes.js` hashes items uploaded before this feature existed and reports look-alike groups; add `--flag` to mark the copies. It never deletes.
