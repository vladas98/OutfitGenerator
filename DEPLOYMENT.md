# Deploying OutfitGenerator

Two free services, wired together: MongoDB Atlas (database) → Render (both the backend API and the frontend, served as a static web build). Each step below is done in that service's own dashboard — nothing here can be run from a terminal, since it involves creating accounts.

`render.yaml` defines **both** services, so one Blueprint sets up the whole thing. (`frontend/vercel.json` is also present if you'd rather host the frontend on Vercel — see the alternative at the end — but the Blueprint path below is the maintained one.)

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

## 2. Both services — Render Blueprint

`render.yaml` defines the backend web service *and* the frontend static site, so one Blueprint creates both.

1. Sign up at [render.com](https://render.com) (GitHub login is easiest).
2. **Connect GitHub properly** — profile icon → **Account Settings** → **Connected Accounts** → **Connect GitHub**, and grant access to the `OutfitGenerator` repo. Skipping this is the single most common thing to get wrong: Render will fall back to cloning the repo anonymously (the build log says *"It looks like we don't have access to your repo, but we'll try to clone it anyway"*), which works for the first deploy but installs **no webhook** — so later pushes never auto-deploy and you're stuck deploying by hand.
3. **New** → **Blueprint** → select the `OutfitGenerator` repo → branch `main`.
4. Render reads `render.yaml` and asks for the two values it deliberately doesn't store in the repo:
   - `MONGODB_URI` — the connection string from step 1
   - `OPENROUTER_API_KEY` — your key from [openrouter.ai/keys](https://openrouter.ai/keys)
5. Approve, and it creates both services:
   - `outfitgenerator-backend` — the Express API
   - `outfitgenerator-frontend` — the Expo web build (`npx expo export -p web`), published from `dist/`, with `EXPO_PUBLIC_API_URL` already pointed at the backend in `render.yaml`

   That env var is baked into the JavaScript at **build** time, not read at runtime — so if you ever change the backend's URL, update `render.yaml` and rebuild the frontend, or it will keep calling the old address.
6. Verify the backend: visit `<backend-url>/health` — you should see `{"ok":true}`. The backend has no page at `/`; a 404 there is normal, not a broken deploy.
7. The **frontend** URL is the one you share.

**Free-tier caveats:**
- The *backend* spins down after ~15 minutes of no traffic; the first request after that takes 30–60 seconds to wake up. Static sites don't sleep, so the page loads instantly and only the first data call feels slow.
- Uploaded images live on the backend's local disk, which is wiped on every redeploy/restart — see the last section.

### Redeploying after a push

If auto-deploy isn't working (step 2), pushing to `main` will not deploy anything. Deploy each service by hand: open the **service** (not the Blueprint) → **Manual Deploy** → **Deploy latest commit**. The Blueprint's **Manual Sync** button is a different thing — it only re-reads `render.yaml` for service *definition* changes, and does nothing when only app code changed.

## 3. Verify end-to-end

Open the frontend URL and check:
- Home screen loads
- Add Items → upload a photo → it classifies (this call goes through Render → OpenRouter, so give it a few seconds, more on a cold start)
- Closet shows the item
- Generate an outfit for an occasion

## What to know before your professor opens it

- **Real accounts now.** Your professor signs up with their own email and password and gets their own private closet — separate from yours. Nothing to pre-seed or share.
- **Your OpenRouter key pays for every request** anyone makes through the hosted link — classification and outfit generation both call it. Low-volume classroom use is cheap, but it's not free to leave the link open indefinitely.
- **Uploaded images aren't guaranteed to persist.** They're stored on Render's local disk, which is wiped whenever the backend redeploys or restarts (including the idle spin-down above). If that happens, closet *data* — tags, generated outfits, feedback — is unaffected, since it's in MongoDB; only the image files go missing, leaving broken thumbnails until they're re-uploaded. Practically: **avoid redeploying the backend right before a demo.** Moving image storage to something like Cloudinary is the real fix, and the one follow-up worth doing before this is used for anything beyond a class demo.
- **Password reset has no verification step.** `POST /api/auth/reset-password` sets a new password from just an email address — anyone who knows an account's email can take it over. Deliberate scope call for a demo with no email infrastructure; see `backend/README.md`.

## Alternative: frontend on Vercel

`frontend/vercel.json` is still in the repo if you'd rather host the web build there: **Add New** → **Project** → import the repo → set **Root Directory** to `frontend` → add `EXPO_PUBLIC_API_URL` (the backend's Render URL, no trailing slash) **before** the first deploy, since it's baked in at build time. If you do this, the `outfitgenerator-frontend` service in `render.yaml` is redundant.
