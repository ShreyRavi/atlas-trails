# Atlas Trails

Add the cities of a trip, hit play, and watch it fly across a 3D globe as a
cinematic arc. Share a live link anyone can open in their browser — no login,
no install.

## How it works

- **No backend.** Your trips live in `localStorage`. Sharing serializes the
  trip into the URL hash (`#t=<compressed>`), so a link contains the whole trip
  and works forever with zero infrastructure.
- **The globe** is [`react-globe.gl`](https://github.com/vasturiano/react-globe.gl)
  (three.js). Cities come from a bundled, population-sorted GeoNames list
  (`public/cities.json`, top 10k) — fully offline, no API keys.
- **Sharing**: open a `#t=` link and the trip auto-plays in a read-only viewer.
  Tampered or malformed links fall back to the empty builder. The visitor's own
  saved trip is never overwritten while viewing someone else's.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build -> dist/
npm run preview  # serve the production build
```

WebGL is required for the globe; browsers without it get a graceful fallback
screen.

## Deploy

Static site, deployed to Vercel (framework auto-detected as Vite, output
`dist/`). Pushes to a branch get preview deploys; merging to `main` promotes to
production. See `vercel.json` for asset caching.
