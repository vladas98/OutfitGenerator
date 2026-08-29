# OutfitGenerator

An AI personal styling app. Photograph your closet, and it classifies each item, then generates outfit suggestions for a chosen occasion — grounded in real color theory and styling rules, not just model judgment.

## How it works

1. **Digitize your closet** — photograph clothing items in a batch. Each photo is classified via Claude vision (category, color, pattern, formality, fabric, coverage details) with a review screen to correct any mistakes.
2. **Generate an outfit** — pick an occasion (work, school, date night, wedding guest, beach). Candidate outfits are built and scored locally against color theory and occasion-specific styling rules *before* Claude ever sees them — it only picks the best pre-validated candidate and explains why.
3. **Refine it** — don't like a piece? Replace just that one item and keep the rest. Want to build around something specific? Pick a closet item first and generate around it.
4. **Learn your taste** — liked outfits are saved automatically; thumbs up/down feeds a rolling preference summary into future suggestions.

## Features

- **AI vision classification** — category, color family, pattern, formality, season, plus coverage attributes (sleeves, neckline, hemline, fabric, garment style) that the styling rules depend on.
- **Color theory matching** — monochromatic / analogous / complementary / neutral-pairing rules, hue-count limits, and pattern-clash penalties, all computed in code (`backend/src/services/colorMatching.js`).
- **Occasion styling rules** — each occasion (work, school, date night, wedding guest, beach) has its own hard constraints (e.g. no sleeveless at work, no white at a wedding) and preferences (e.g. date night favors satin and sleeveless), defined in `backend/src/services/occasionRules.js`.
- **Duplicate detection** — perceptual image hashing flags re-uploaded or near-identical photos for the user to resolve, without auto-deleting anything.
- **Editable outfits** — swap out one piece without regenerating the whole look; seed an outfit around a specific closet item.
- **Saved outfits & feedback loop** — liked outfits are kept in one place; like/dislike history informs future generations.

## Tech stack

- **Frontend:** React Native / Expo
- **Backend:** Express + MongoDB
- **AI:** Claude (vision classification + outfit reasoning) via OpenRouter

## Project structure

```
backend/     Express API — see backend/README.md for setup and full endpoint list
frontend/    Expo app — see frontend/README.md for setup and running on a device
```

## Quick start

```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in MONGODB_URI and OPENROUTER_API_KEY
npm run dev

# Frontend (in a separate terminal)
cd frontend
npm install
cp .env.example .env   # set EXPO_PUBLIC_API_URL to your machine's LAN IP
npx expo start
```

Full setup details, the API reference, and design notes live in [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md).
