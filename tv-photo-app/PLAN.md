# Shahin & Sneha — dedicated Android TV photo/video app (WORK IN PROGRESS)

Status: skeleton + browser preview (tv-photo-app/preview/index.html, open via localhost:4173/tv-photo-app/preview/index.html). NO Kotlin source written yet. NO APK built (user said: do not
build an APK until told). A code-only compile check (no APK) was OK'd in my plan but not run.

## Done
- Project skeleton: Gradle (AGP 8.13.0, Kotlin 2.0.21, Gradle wrapper 8.14.3, JDK = Android Studio jbr),
  AndroidManifest (TV launcher, banner, landscape, 6 activities declared), styles, icons, logo.
- Deps declared: appcompat, recyclerview, lifecycle-ktx, coroutines, coil 2.7.0, zxing core 3.5.3, media3 1.8.0.

## Still to write (package dev.workers.shahinsneha.photos, programmatic views, no XML layouts)
Util/Config/Models/Repo/Prefs, Tiles (TileAdapter, tv focus ring), ResumePrompt,
MainActivity (home + RAW menu), GalleryActivity, ViewerActivity, VideosActivity, PlayerActivity, SettingsActivity.
Website side: dl.html (QR download page, no gate) and data/videos.json.

## Decisions (from the user)
- Media comes from the website: data/*.json manifests, photos/<slug>/{thumb,full}/; base https://gallery.shahinsneha.workers.dev/
- Events: registration, reception1, reception2, prewedding. RAW (photos/RAW/<slug>/, data/raw-<slug>.json): NOT on top of home;
  a "RAW photos" tile after the main tiles, no password.
- No bulk download. Each photo's QR -> dl.html?f=<path> (phone page with Download button).
- Home tiles: 4 events, Play everything (shuffled slideshow), Videos, RAW photos, Settings.
- Photo viewer: left/right browse, OK = show/hide QR, Down = play/pause slideshow, Back closes QR/viewer.
  Caption with date (briefly), preload next photo, remember last photo per event.
- Resume prompt EVERY time an event with a saved spot is opened: "Continue (photo X of N)?" Continue / Start over,
  30 s countdown, no input => start from beginning. Same prompt for videos (resume position).
- Slideshow speed default 6 s, adjustable in Settings (3,4,5,6,8,10,15,30); shuffle option in Settings; "clear saved places".
- Videos: NOT YouTube. Direct links from Dropbox (raw=1) and Google Drive (direct download by file id), ExoPlayer.
  Each video has two sources; try Dropbox first, fail over to Drive on error/403/429/HTML; failed source cooldown ~1 hour.
  Links will be supplied LATER by the user -> data/videos.json fields dropbox/drive left empty ("Coming soon" tile).
  Videos & priority order: Highlight film (~7 min, priority 1), Registration full (~1h45, priority 1),
  Groom reception (~20 min, priority 2), Bride reception (~20 min, priority 2). Sort by priority, then listed order.
- Player: true fullscreen (immersive, keep screen on), own controls overlay auto-hiding after ~4 s:
  seek bar + times, play/pause, -10s, +10s, prev, next, speed (1.0,1.1,1.25,1.5,1.75,2.0 — cycles, pitch kept), source switch, QR.
  Keys: OK play/pause, left/right +-10s, up/down show controls, Back hides controls then exits. Media keys supported.
  Buffering spinner; message if both sources fail.
- Background music: user said yes; I proposed MP3s from Dropbox/Drive (data/music.json, own volume in Settings);
  YouTube audio-only is not feasible officially. NOT confirmed by user yet -> ask before building.

## Notes
- tv-photo-app is in .assetsignore (must not be uploaded to Cloudflare) and build outputs are in .gitignore.
- Existing android-tv/ (Capacitor website wrapper) is separate and unchanged.
