# Changelog

## 1.1.0 — 2026-08-29

- **Notes and dates per stop**: annotate each stop with a note (140 chars) and
  an arrival/departure date range. Dated trips report their day span alongside
  stops, countries and distance.
- **Trip summary**: a one-paragraph summary (200 chars) under the trip title,
  shown in the read-only viewer.
- Notes, dates and the summary ride along in share links, capped so link length
  stays bounded by stop count. Pre-existing links still open.
- **Search rewrite**: tiered ranking (exact -> alias -> prefix -> word -> substring
  -> fuzzy) replaces prefix-only matching. `NYC`, `Bombay`, `Saigon`, `york`,
  `Barcelna` and `Paris, France` now resolve; results dedupe, so `Paris` no
  longer returns five arrondissements.
- **Worldwide fallback is automatic**: a place missing from the bundled list
  triggers a debounced Nominatim lookup instead of requiring a button press.
- Fix: `react-globe.gl` attaches a three.js object to the stop data it is given,
  which was being serialized into `localStorage` alongside the trip. Stops are
  now sanitized on write and the globe gets copies.
- Fix: pasting a share link into an already-open tab is a same-document hash
  change, so the trip never loaded. Handled via `hashchange`.
- Fix: on screens under 560px the fixed Trips button and the centered command
  bar shared a top offset and overlapped once a trip had stops.
- Perf: memoized `Intl.DisplayNames` country lookups. A country-qualified query
  was resolving a display name per city per keystroke — 8.5 ms down to 0.6 ms.
- Docs: README rebuilt as a showcase (demo GIF, screenshots, architecture and
  search-design notes); added MIT LICENSE. Corrected the deploy section, which
  claimed git pushes deploy — this project is CLI-deployed.

## 1.0.0 — 2026-06-28

- **Multi-trip library**: save named trips, switch between them, delete. Stored
  locally (`atlas.library.v1`), separate from the autosaved working trip.
- **Reorder stops** with up/down controls.
- **Worldwide city fallback**: when a place isn't in the bundled 10k list, an
  on-demand OpenStreetMap Nominatim lookup fills the gap (fails gracefully).
- **Performance**: the globe (three.js) is code-split and lazy-loaded — initial
  JS bundle dropped from ~593KB to ~66KB gzipped, so the UI paints immediately.

## 0.2.0 — 2026-06-28

- **Trip titles**: name a trip; the title persists, rides along in the share
  link, and headlines the read-only viewer. Backward-compatible with v0.1
  saved trips (legacy bare-array localStorage still loads).
- **Trip stats**: stop count, unique countries, and total great-circle
  distance (km) shown in the viewer and after a play-through.
- Polish: absolute OG image URL (reliable social unfurl), "no cities match"
  autocomplete hint, shared-link autoplay now waits for the globe to be ready
  instead of a fixed timer.

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
