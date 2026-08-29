# ClothesApp Backend

Express + MongoDB API for the AI Personal Styling App. Uses OpenRouter (routed to a Claude model) for vision classification and outfit reasoning.

## Setup

```
npm install
cp .env.example .env
```

Fill in `.env`:
- `MONGODB_URI` — local (`mongodb://127.0.0.1:27017/clothesapp`) or an Atlas connection string.
- `OPENROUTER_API_KEY` — from https://openrouter.ai/keys
- `OPENROUTER_VISION_MODEL` / `OPENROUTER_TEXT_MODEL` — default to `anthropic/claude-3.5-sonnet`, swap for any OpenRouter model id.

```
npm run dev
```

Server starts on `PORT` (default 4000). No auth system — every request is scoped by an `x-user-id` header, defaulting to `demo-user` if omitted.

## API

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

- **Model replies use structured outputs.** Both classification and outfit selection send a JSON Schema via `response_format`, so the provider guarantees a parseable reply. Asking for JSON in the prompt alone was not reliable — the model intermittently returned a truncated string or omitted the closing brace (roughly 1 in 5 calls), which failed the whole request. The classification schema also mirrors the Item model's enums, so an invalid category can't reach Mongoose. If a configured model doesn't support structured outputs, `requestJson` falls back to a plain request with a lenient parser that repairs those truncations.

- Images are stored on local disk under `uploads/` and served at `/uploads/<filename>`. Fine for a class demo; swap for cloud storage before any real deployment.
- **Footwear is out of scope.** `shoes` is not a valid category, outfits are built from top+bottom (or a dress) plus an optional outerwear/accessory layer, and the classifier is told to file footwear photos under `other`.
- **Occasion rules** (`src/services/occasionRules.js`) follow the project's styling guidelines. Beyond formality, each occasion declares hard coverage constraints — `disallowedSleeves`, `disallowedNecklines`, `disallowedHemlines`, `disallowedGarmentStyles` — plus color-strategy weighting.
  - Work and School share a base ruleset (no sleeveless, no crop tops, knee-length minimum, jeans + t-shirt allowed) but diverge on ceiling: `business` is excluded from School's pool entirely, not just deprioritized.
  - Date Night allows sleeveless and *boosts* complementary color pairings; Work, School, and Wedding Guest penalize them in favour of neutral + one accent.
  - Wedding Guest hard-blocks white and beige (standing in for ivory/cream/pale blush).
  - Enforcing these needs coverage attributes on each Item (`sleeves`, `neckline`, `hemline`, `garmentStyle`), captured during classification. An **unknown** attribute passes the filter rather than hiding the item, so items classified before these fields existed degrade gracefully — run `node scripts/reclassifyCoverage.js --apply` to backfill them.
- Color theory matching (`src/services/colorMatching.js`), occasion rules, and cross-piece formality consistency (`src/services/styleRules.js`) run entirely locally — Claude only picks among pre-validated candidates and writes the reasoning, per the spec's "grounded in actual color theory" requirement.
- **Outfit variety:** `buildCandidates` keeps every candidate scoring within `SCORE_BAND_TOLERANCE` of the best, shuffles that band, and downranks recently generated outfits — so asking twice gives different (but still valid) suggestions instead of the same one.
- **Duplicate detection:** `src/services/imageHash.js` computes a 64-bit dHash per upload. Matches within `DUPLICATE_THRESHOLD` Hamming distance (5) are flagged via `duplicateOfItemId` — checked against the existing closet and within the same batch. Nothing is auto-deleted; the user decides, from either the Review screen or the Closet.
  - The threshold was picked from the real distance distribution: true duplicates landed at 0-3, then nothing until 7, where unrelated garments start colliding. Re-check that distribution before raising it.
  - Duplicate flags are set before classification runs, so category is unknown at that moment. Once classified, `clearMismatchedDuplicateFlag` drops any flag linking two different categories.
  - Catches re-uploaded, resized, or recompressed copies. A garment *re-photographed* from a new angle may exceed the threshold and slip through — the deliberate trade-off, since false accusations are worse than misses.
  - `node scripts/backfillImageHashes.js` hashes items uploaded before this feature existed and reports look-alike groups; add `--flag` to mark the copies. It never deletes.
