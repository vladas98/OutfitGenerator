# Deploying OutfitGenerator

Three free services, wired together: MongoDB Atlas (database) → Render (backend API) → Vercel (frontend, built for web). Each step below is done in that service's own dashboard — nothing here can be run from a terminal, since it involves creating accounts.

## 1. Database — MongoDB Atlas

1. Sign up at [mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register).
2. Create a free **M0** cluster (any region).
3. **Database Access** → add a database user (username + password — save these).
4. **Network Access** → add IP address `0.0.0.0/0` ("Allow access from anywhere"). Render's free tier doesn't have a static outbound IP, so this is required.
5. **Connect** → **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Insert a database name before the `?`, e.g. `.../outfitgenerator?retryWrites=...`. Fill in your actual username/password. Keep this string — you'll paste it into Render next.

## 2. Backend — Render

The repo includes `render.yaml`, so Render can set most of this up automatically via a **Blueprint**.

1. Sign up at [render.com](https://render.com) (GitHub login is easiest).
2. **New** → **Blueprint** → connect the `OutfitGenerator` GitHub repo → branch `main`.
3. Render reads `render.yaml` and asks for two values it deliberately doesn't store in the repo:
   - `MONGODB_URI` — the connection string from step 1
   - `OPENROUTER_API_KEY` — your key from [openrouter.ai/keys](https://openrouter.ai/keys)
4. Deploy. Once it's live, Render gives you a URL like `https://outfitgenerator-backend.onrender.com`.
5. Verify it: visit `<that-url>/health` in a browser — you should see `{"ok":true}`.

**Free-tier caveat:** the service spins down after ~15 minutes of no traffic. The first request after that takes 30–60 seconds to wake back up — expected, not a bug, if your professor's first click feels slow.

## 3. Frontend — Vercel

The repo includes `frontend/vercel.json` with the build command already set.

1. Sign up at [vercel.com](https://vercel.com) (GitHub login is easiest).
2. **Add New** → **Project** → import the `OutfitGenerator` repo.
3. Set **Root Directory** to `frontend` in the import settings.
4. Add an environment variable:
   - `EXPO_PUBLIC_API_URL` = the Render URL from step 2 (no trailing slash), e.g. `https://outfitgenerator-backend.onrender.com`

   This has to be set **before** you deploy — Expo bakes this value directly into the built JavaScript at build time, not read at runtime. If it's missing, the deployed app would try to reach `localhost` from every visitor's browser and silently fail.
5. Deploy. Vercel gives you a URL like `https://outfitgenerator.vercel.app` — that's the link to share.

## 4. Verify end-to-end

Open the Vercel URL and check:
- Home screen loads
- Add Items → upload a photo → it classifies (this call goes through Render → OpenRouter, so give it a few seconds, more on a cold start)
- Closet shows the item
- Generate an outfit for an occasion

## What to know before your professor opens it

- **Real accounts now.** Your professor signs up with their own email and password and gets their own private closet — separate from yours. Nothing to pre-seed or share.
- **Your OpenRouter key pays for every request** anyone makes through the hosted link — classification and outfit generation both call it. Low-volume classroom use is cheap, but it's not free to leave the link open indefinitely.
- **Uploaded images aren't guaranteed to persist.** They're stored on Render's local disk, which can be wiped when the free-tier service restarts (including the idle spin-down above). If that happens, existing closet *data* (tags, generated outfits, feedback) is unaffected — it's in MongoDB — but a photo thumbnail could go missing until re-uploaded. For extra reliability here, swapping to a service like Cloudinary for image storage is a follow-up worth doing — ask if you want it.
