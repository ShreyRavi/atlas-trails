# Changelog

## 0.1.0 — 2026-06-28

First release. Backendless travel-timelapse app.

- 3D globe (`react-globe.gl`) with a dark/night earth texture and atmosphere.
- City autocomplete from a bundled, population-sorted top-10k GeoNames list;
  diacritic-insensitive search; offline, no API keys.
- Build a trip by adding cities; arcs draw live and the camera flies to each stop.
- Play/Replay: sequential arc-draw animation with camera choreography; handles
  0/1/N stops and consecutive duplicate cities.
- Trips persist in `localStorage` (defensive load, never throws); Reset clears.
- Shareable links: trip is lz-string-compressed into the URL hash (`#t=`), no
  backend. Opening a link auto-plays a read-only viewer; tampered/empty links
  fall back to the builder; a visitor's own saved trip is never overwritten.
- Graceful WebGL-unavailable fallback screen.
- Open Graph / Twitter card for link unfurls.
- Deployed as a static site on Vercel.
