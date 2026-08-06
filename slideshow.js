/* ============================================================
   Wedding Gallery — combined "all photos" slideshow
   Loads every event's manifest, sorted chronologically end-to-end
   (registration, then reception1, then reception2), and starts
   autoplaying immediately at 5 seconds per photo.
   ============================================================ */

import { attachZoom } from "./zoomable.js";

const ALL_SLUGS = ["prewedding", "registration", "reception1", "reception2"];

const el = {
  lightboxImg: document.getElementById("lightboxImg"),
  downloadBtn: document.getElementById("downloadBtn"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  counter: document.getElementById("lightboxCounter"),
  slideshowBtn: document.getElementById("slideshowBtn"),
  lightbox: document.getElementById("lightbox"),
};

let flatList = [];
let currentIndex = 0;
let slideshowTimer = null;
let zoomCtl = null;

init();

async function init() {
  const lists = await Promise.all(
    ALL_SLUGS.map((slug) => fetch(`data/${slug}.json`).then((r) => r.json()))
  );
  ALL_SLUGS.forEach((slug, i) => {
    lists[i].forEach((p) => flatList.push({ slug, file: p.file }));
  });

  if (!flatList.length) return;

  zoomCtl = attachZoom(el.lightbox, el.lightboxImg, {
    onSwipeLeft: () => { stopSlideshow(); step(1); },
    onSwipeRight: () => { stopSlideshow(); step(-1); },
  });

  showCurrent();
  startSlideshow();
  setupMusic();

  el.prevBtn.addEventListener("click", () => { stopSlideshow(); step(-1); });
  el.nextBtn.addEventListener("click", () => { stopSlideshow(); step(1); });
  el.slideshowBtn.addEventListener("click", toggleSlideshow);

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { stopSlideshow(); step(-1); }
    if (e.key === "ArrowRight") { stopSlideshow(); step(1); }
  });
}

function setupMusic() {
  if (!window.WeddingMusic) return;

  const muteBtn = document.getElementById("slideshowMusicMute");
  const icon = document.getElementById("slideshowMusicIcon");
  const volume = document.getElementById("slideshowMusicVolume");
  if (!muteBtn || !volume) return;

  const MUTED_ICON = '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>';
  const PLAYING_ICON = '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>';

  function sync(state) {
    volume.value = state.volume ?? window.WeddingMusic.getVolume();
    icon.innerHTML = state.playing ? PLAYING_ICON : MUTED_ICON;
    muteBtn.title = state.playing ? "Mute music" : "Play music";
  }

  window.WeddingMusic.onChange(sync);

  muteBtn.addEventListener("click", () => {
    if (window.WeddingMusic.isPlaying()) window.WeddingMusic.pause();
    else window.WeddingMusic.play({ fade: false });
  });

  volume.addEventListener("input", () => window.WeddingMusic.setVolume(parseFloat(volume.value)));

  // If nobody had already turned music on elsewhere on the site, the
  // slideshow starts it fresh with the long fade-in described for it.
  if (!window.WeddingMusic.isPlaying()) {
    window.WeddingMusic.play({ fade: true });
  }
}

function step(dir) {
  currentIndex = (currentIndex + dir + flatList.length) % flatList.length;
  showCurrent();
}

function showCurrent() {
  const item = flatList[currentIndex];
  const src = `photos/${item.slug}/full/${item.file}`;
  el.lightboxImg.src = src;
  el.downloadBtn.href = src;
  el.downloadBtn.setAttribute("download", item.file);
  el.counter.textContent = t("photoOf", { current: currentIndex + 1, total: flatList.length });
  if (zoomCtl) zoomCtl.reset(false);
}

function startSlideshow() {
  stopSlideshow();
  slideshowTimer = setInterval(() => step(1), 5000);
  el.slideshowBtn.classList.add("active");
}

function stopSlideshow() {
  if (slideshowTimer) {
    clearInterval(slideshowTimer);
    slideshowTimer = null;
  }
  el.slideshowBtn.classList.remove("active");
}

function toggleSlideshow() {
  if (slideshowTimer) stopSlideshow();
  else startSlideshow();
}
