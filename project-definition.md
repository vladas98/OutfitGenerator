# Project Definition: AI Personal Styling App

## Overview
A mobile app that lets users digitize their closet by photographing clothing items, automatically classifies each item using AI, and generates outfit suggestions tailored to a chosen occasion (work, school, wedding guest, date night, beach, etc.).

## Tech Stack
- **Frontend:** React Native / Expo
- **Backend:** Express + MongoDB
- **AI:** Anthropic Claude vision API (classification) + Claude (outfit generation reasoning)

## Core Features

### 1. Closet Upload & Classification
- User photographs multiple clothing items in a session (batch upload flow).
- Images are queued and sent together in a batch job to the Claude vision API (batch of images in one call, or Message Batches API for larger sets).
- Each item's photo is classified into structured data:
  - Category (shirt, pants, dress, shoes, etc.)
  - Color / color family
  - Pattern
  - Formality level
  - Season suitability
- UI shows a "processing your closet..." state, then a review screen where the user can correct any misclassification.

### 2. Digital Closet View
- Grid/list view of all items, filterable by category and color.
- Each item shows its thumbnail and classified tags.
- Editable metadata per item.

### 3. Outfit Generation
- User selects an occasion (work, school, wedding guest, date night, beach, etc.).
- Backend pulls the user's closet metadata (text, not images) plus the occasion and sends it to Claude to assemble a coherent outfit with reasoning.
- Occasion maps to implicit formality/vibe constraints (e.g. beach → casual, no closed shoes; wedding guest → dressy, avoid white/jeans).
- Returned outfit includes top/bottom/shoes/(accessories) plus a short "why this works" explanation.

### 4. Color Theory Matching
- Each item stores a `colorFamily` (not just raw color name), enabling real color-relationship logic.
- A color-matching utility implements complementary, analogous, monochromatic, and neutral-pairing rules.
- Candidate outfit combinations are filtered/validated against these rules **before** being sent to Claude, so suggestions are grounded in actual color theory rather than model judgment alone.

### 5. Preferences & Feedback Loop
- Users can thumbs up/down a generated outfit, optionally with a reason (wrong occasion, don't like combo, wrong weather).
- Feedback history is used to:
  - Downrank previously disliked pairings.
  - Uprank liked colors/categories/combos.
  - Feed a short summary of the user's patterns into future outfit-generation prompts.

## Data Models

**Item**
- category
- colorFamily
- colorHex
- pattern
- formality
- season
- imageUrl
- status (pending / classified / needs_review)

**Outfit**
- userId
- occasion
- itemIds[]
- reasoning
- createdAt

**OutfitFeedback**
- outfitId
- userId
- liked (bool)
- reason (optional)

## Nice-to-Haves (if time allows)
- Weather-aware suggestions (pull local weather, avoid mismatched-season items).
- Outfit history / favorites view.
- Body type / fit preferences (likely out of scope for class project).

## Demo Priorities
Given this is for a vibecoding class presentation, polish should focus on:
1. Smooth upload → processing → review flow with clear loading states.
2. A closet grid that looks good (thumbnails, category tags).
3. The outfit suggestion screen as the "wow" moment — clean layout of pieces + styled reasoning text.
4. Basic error handling: failed upload, API timeout, no items available in a needed category.

## Story for Class Presentation
Three "smart" layers to highlight:
1. AI vision-based clothing classification.
2. Rule-based color theory matching.
3. A feedback loop that improves suggestions over time.
