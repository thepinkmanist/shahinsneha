# Brand assets — Shahin & Sneha Wedding Gallery

Direction chosen: **paired initials, ringed** — two facing Fraunces `S` glyphs (the two of them) held in a single hairline gold ring. Engraved-stationery feel, no camera/app iconography.

## Files

| File | Use |
|---|---|
| `logo-lockup.svg` | Header lockup: mark + "Shahin & Sneha" + MAY 2026 kicker. Render 150–250px wide. |
| `logo-mark.svg` | Ring monogram alone, transparent. Collapsed header, loaders, print. |
| `logo-mark-ivory.svg` | Same mark, ivory letters — for use on dark/forest grounds. |
| `favicon.svg` | Forest tile + gold ring + ivory monogram. Modern browsers. |
| `favicon.ico` | 16/32/48 bundle for legacy + Windows pinning. |
| `favicon-16.png`, `favicon-32.png` | Ring dropped, monogram enlarged — legibility at tab size. |
| `favicon-48.png`, `apple-touch-icon-180.png`, `icon-512.png` | Ring version. 180 = iOS home screen, 512 = PWA manifest. |
| `logo-mark-256.png`, `logo-mark-1024.png`, `logo-lockup-1200.png` | Transparent raster fallbacks (share cards, email, print). |

**Note on the SVGs:** the letterforms are live `<text>` in Fraunces (already loaded on the site) with a Georgia/serif fallback. Where Fraunces cannot be guaranteed — email, third-party embeds, OS icon slots — use the PNGs, which are already rasterised in Fraunces.

## Colors (unchanged from the site)

| Role | Hex |
|---|---|
| Ivory ground | `#fbf3e4` |
| Ink | `#2b2620` |
| Muted | `#6b6459` |
| Gold | `#b0813a` |
| Gold deep | `#8f6a2f` |
| Forest | `#3e5641` |
| Forest deep | `#2b3d2e` |

Mark palette: gold ring (`#b0813a`) + forest letters (`#3e5641`) on ivory. Inverted on dark: ivory letters, gold ring, forest tile.

## Type

- Mark letterforms: **Fraunces**, regular (400). Never bold the monogram.
- Wordmark: **Fraunces** 400, no extra tracking.
- Kicker (`MAY 2026`): **Inter** 500, ~0.28em tracking, uppercase, gold, tabular numerals.

## Construction (64-unit grid, so it scales exactly)

- Ring: circle at 32,32, r 29.5, stroke gold, stroke-width 1.4.
- Letters: Fraunces `S` at 36px, forest; first centred at x 21 baseline y 45; second is the same glyph mirrored — `translate(43,45) scale(-1,1)`.
- Favicon tile: 64×64, corner radius 14, forest fill; inner ring r 26 / stroke 1.6; letters at 31px, ivory, baselines y 43 (x 22 and mirrored at 42).
- **16 and 32px only:** drop the inner ring and set the letters back to 36px — the ring closes up at that size.

## Clear space & minimum sizes

- Clear space around mark or lockup: half the mark's height on all sides.
- Lockup minimum width 140px; below that use the mark alone.
- Mark minimum 20px; below that use the ringless favicon artwork.

## Site integration

```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/svg+xml" href="/brand/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/brand/favicon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/brand/favicon-16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/brand/apple-touch-icon-180.png">
<meta name="theme-color" content="#3e5641">
```

Header markup — mark beside the existing serif name, kicker optional:

```html
<a class="brand" href="/">
  <img src="/brand/logo-mark.svg" alt="" width="44" height="44">
  <span class="brand-text">
    <span class="brand-name">Shahin &amp; Sneha</span>
    <span class="brand-kicker">May 2026</span>
  </span>
</a>
```

```css
.brand { display: flex; align-items: center; gap: 14px; text-decoration: none; }
.brand-text { display: flex; flex-direction: column; gap: 3px; }
.brand-name { font-family: Fraunces, Georgia, serif; font-size: 23px; line-height: 1.05;
              color: #2b2620; white-space: nowrap; }
.brand-kicker { font-family: Inter, system-ui, sans-serif; font-size: 8.5px; letter-spacing: 0.28em;
                text-transform: uppercase; color: #b0813a; font-variant-numeric: tabular-nums; }
@media (max-width: 480px) { .brand-text { display: none; } }  /* mark alone */
```

Also add `icon-512.png` (+ `apple-touch-icon-180.png`) to the web manifest with `"background_color": "#fbf3e4"`, `"theme_color": "#3e5641"`.

## Don't

- Don't fill the ring or the tile with gold — gold is stroke and small marks only.
- Don't bold, italicise, or re-space the paired `S` glyphs; use the supplied geometry.
- Don't place the forest-letter mark on dark grounds — use `logo-mark-ivory.svg`.
- Don't add a camera, heart, or photo-stack glyph to the mark.
- Don't introduce colors outside the table above.
