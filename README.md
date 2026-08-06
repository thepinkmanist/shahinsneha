# Shahin & Sneha — Wedding Gallery

A private wedding gallery with three separate event albums, hosted for free
on GitHub Pages. Runs entirely in the browser — no server, no database,
no monthly bill.

## What's in here

```
index.html, registration.html,       → the pages people visit
reception1.html, reception2.html,
favorites.html, slideshow.html
style.css                             → all styling (iOS-glass design)
i18n.js, home.js, gallery.js,         → site logic
favorites.js, favorites-page.js,
zip.js, zoomable.js, facesearch.js,
gate.js, slideshow.js
data/                                  → per-event photo manifests (JSON),
                                          sorted by EXIF capture time
photos/<event>/full/                   → full-resolution originals
photos/<event>/thumb/                  → small generated thumbnails (grid only)
photos/covers/                         → hand-picked cover photos
vendor/                                → bundled libraries (face-api.js, client-zip)
models/                                → face-recognition model weights
scripts/process.mjs                    → the one-time photo-processing script
index-faces.html                       → run once to build face search (see SETUP.md)
```

## Events

- **Registration** — 7 May 2026
- **Reception — Groom's Side** — 9 May 2026
- **Reception — Bride's Side** — 17 May 2026

Each has its own page, own URL, and its own photos, ordered by the date/time
each photo was actually taken (read from EXIF metadata).

## Features

- Separate galleries per event, elderly-friendly grid + full-screen viewer
  with big tap targets, pinch-to-zoom, swipe, and a photo counter.
- Star ("My photos") any photo — saved in the browser so you can come back
  later and finish picking favorites, then download them all as one zip.
- Download any single photo, a whole event, your starred photos, or every
  photo from every event — all as zip files, generated in the browser.
- Share a single photo (or the whole gallery link) via the device's native
  share sheet, with a WhatsApp-friendly fallback.
- "Find someone in the photos" — upload one or more selfies, get every
  matching photo, download them together. Needs a one-time index build,
  see [SETUP.md](SETUP.md).
- Auto slideshow (5s/photo) for any event, your starred photos, or everything
  combined.
- A simple name/phone gate for first-time visitors, optionally logged to a
  Google Sheet — see [SETUP.md](SETUP.md).
- Wedding highlights video (YouTube) and Instagram links on the home page.

## Adding or updating photos

1. Drop the original photos for an event into `photos/<EventName>/` (a flat
   folder of `.jpg`/`.png` files — filenames don't matter, EXIF date does).
2. Run:
   ```
   npm install
   node scripts/process.mjs <slug>
   ```
   where `<slug>` is `registration`, `reception1`, or `reception2` (omit the
   argument to reprocess all three). This reads each photo's capture time,
   generates a thumbnail, and writes `data/<slug>.json`. **Originals are
   never resized or re-encoded** — only a separate small thumbnail is
   generated for the grid.
3. If you added a new event, re-run the face index too (see SETUP.md) so
   search covers the new photos.

## Local preview

```
python -m http.server 4173
```
then open `http://localhost:4173`.

## Privacy

No login, no password — anyone with the link can view it. The URL isn't
indexed by search engines (`noindex` is set on every page). Pick a
non-obvious repo name if you want a bit more obscurity.

## If the repo gets close to GitHub's 1GB guidance

Since photos are kept at full original quality (by request — nothing is
downscaled), a large wedding shoot can add up. If you outgrow the free
GitHub Pages limit, Cloudflare R2 (10GB free, no bandwidth charges) is a
good next step — code stays on GitHub, photos move to R2, and the site's
`photos/` references get repointed to R2 URLs.
