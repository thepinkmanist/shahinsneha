/* ============================================================
   Wedding Gallery — event gallery page logic
   Loads data/<event>.json (already sorted by EXIF capture time),
   renders a thumbnail grid with a star toggle on every photo,
   and an elderly-friendly full-screen lightbox with a counter,
   swipe/keyboard navigation, native pinch-zoom, share, download,
   and zip-download of the whole event or just the starred photos.
   ============================================================ */

import { zipAndDownload } from "./zip.js";
import { attachZoom } from "./zoomable.js";

const COVER_OVERRIDES = {
  reception1: "photos/covers/reception1-cover.jpg",
};

const state = {
  slug: document.body.dataset.event,
  photos: [],
};

const el = {
  grid: document.getElementById("grid"),
  count: document.getElementById("photoCount"),
  lightbox: document.getElementById("lightbox"),
  lightboxImg: document.getElementById("lightboxImg"),
  closeLightbox: document.getElementById("closeLightbox"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
  shareBtn: document.getElementById("shareBtn"),
  starBtn: document.getElementById("starBtn"),
  counter: document.getElementById("lightboxCounter"),
  downloadAllBtn: document.getElementById("downloadAllBtn"),
  progressNote: document.getElementById("progressNote"),
  slideshowBtn: document.getElementById("slideshowBtn"),
};

let currentIndex = 0;
let zoomCtl = null;
let slideshowTimer = null;

init();

async function init() {
  try {
    const res = await fetch(`data/${state.slug}.json`);
    state.photos = await res.json();
  } catch (err) {
    console.error("Could not load photos", err);
    state.photos = [];
  }
  renderGrid();
  wireEvents();
  setHeaderImage();
}

function setHeaderImage() {
  const img = document.getElementById("headerImg");
  if (!img) return;
  if (COVER_OVERRIDES[state.slug]) {
    img.src = COVER_OVERRIDES[state.slug];
    return;
  }
  if (state.photos.length) {
    const pick = state.photos[Math.floor(state.photos.length / 3)];
    // Full-res, not the 480px grid thumbnail — this banner renders much
    // wider than the thumbnail, so the small version would look blurry.
    img.src = `photos/${state.slug}/full/${pick.file}`;
  }
}

function renderGrid() {
  el.grid.innerHTML = "";

  if (el.count) {
    el.count.textContent = t("photoCount", { n: state.photos.length });
  }

  if (state.photos.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.setAttribute("data-i18n", "emptyState");
    empty.textContent = t("emptyState");
    el.grid.appendChild(empty);
    return;
  }

  const frag = document.createDocumentFragment();
  state.photos.forEach((photo, i) => {
    const card = document.createElement("div");
    card.className = "photo-card";

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.className = "photo-card__open";
    openBtn.style.cssText = "position:absolute;inset:0;border:none;background:none;padding:0;width:100%;height:100%;";
    openBtn.setAttribute("aria-label", t("photoOf", { current: i + 1, total: state.photos.length }));
    const img = document.createElement("img");
    img.src = `photos/${state.slug}/thumb/${photo.thumb}`;
    img.loading = "lazy";
    img.alt = "";
    openBtn.appendChild(img);
    openBtn.addEventListener("click", () => openLightbox(i));

    const star = makeStarButton(photo.file, () => {});
    card.appendChild(openBtn);
    card.appendChild(star);
    frag.appendChild(card);
  });
  el.grid.appendChild(frag);
}

function makeStarButton(file, onToggle) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "star-btn";
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2.5l3 6.6 7.2.7-5.4 4.9 1.6 7.1L12 17.8 5.6 21.8l1.6-7.1-5.4-4.9 7.2-.7z"/></svg>';
  const sync = () => {
    const active = isFavorite(state.slug, file);
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
    btn.title = t(active ? "unstar" : "star");
  };
  sync();
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorite(state.slug, file);
    sync();
    onToggle();
  });
  document.addEventListener("langchange", sync);
  btn._sync = sync;
  return btn;
}

/* ---------------- Lightbox ---------------- */

function openLightbox(index) {
  currentIndex = index;
  showCurrent();
  el.lightbox.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  el.lightbox.classList.add("hidden");
  document.body.style.overflow = "";
  stopSlideshow();
}

function step(dir) {
  currentIndex = (currentIndex + dir + state.photos.length) % state.photos.length;
  showCurrent();
}

function showCurrent() {
  const photo = state.photos[currentIndex];
  const src = `photos/${state.slug}/full/${photo.file}`;
  el.lightboxImg.src = src;
  el.lightboxImg.alt = "";
  el.downloadBtn.href = src;
  el.downloadBtn.setAttribute("download", photo.file);
  if (el.counter) {
    el.counter.textContent = t("photoOf", { current: currentIndex + 1, total: state.photos.length });
  }
  syncStarBtn();
  if (zoomCtl) zoomCtl.reset(false);
}

/* ---------------- Slideshow ---------------- */

function startSlideshow() {
  stopSlideshow();
  slideshowTimer = setInterval(() => step(1), 5000);
  if (el.slideshowBtn) el.slideshowBtn.classList.add("active");
}

function stopSlideshow() {
  if (slideshowTimer) {
    clearInterval(slideshowTimer);
    slideshowTimer = null;
  }
  if (el.slideshowBtn) el.slideshowBtn.classList.remove("active");
}

function toggleSlideshow() {
  if (slideshowTimer) stopSlideshow();
  else startSlideshow();
}

function syncStarBtn() {
  if (!el.starBtn) return;
  const photo = state.photos[currentIndex];
  const active = isFavorite(state.slug, photo.file);
  el.starBtn.classList.toggle("active", active);
  el.starBtn.setAttribute("aria-pressed", active ? "true" : "false");
  el.starBtn.title = t(active ? "unstar" : "star");
}

async function sharePhoto() {
  const photo = state.photos[currentIndex];
  const src = `photos/${state.slug}/full/${photo.file}`;
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    const file = new File([blob], photo.file, { type: blob.type || "image/jpeg" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Shahin & Sneha" });
      return;
    }
  } catch (err) {
    if (err && err.name === "AbortError") return;
    console.warn("Share failed, falling back", err);
  }
  window.open(src, "_blank");
  alert(t("shareFallback"));
}

/* ---------------- Zip downloads ---------------- */

async function downloadAllForEvent() {
  const items = state.photos.map((p) => ({
    name: p.file,
    url: `photos/${state.slug}/full/${p.file}`,
  }));
  await runZip(items, `${state.slug}-photos.zip`, el.downloadAllBtn);
}

async function runZip(items, zipName, triggerBtn) {
  if (!items.length) return;
  const originalLabel = triggerBtn ? triggerBtn.innerHTML : "";
  if (triggerBtn) triggerBtn.disabled = true;
  if (el.progressNote) el.progressNote.textContent = t("preparingZip", { done: 0, total: items.length });

  try {
    const ok = await zipAndDownload(items, zipName, (done, total) => {
      if (el.progressNote) el.progressNote.textContent = t("preparingZip", { done, total });
    });
    if (el.progressNote) el.progressNote.textContent = ok ? t("zipReady") : t("zipCancelled");
  } catch (err) {
    console.error("Zip download failed", err);
    if (el.progressNote) el.progressNote.textContent = "";
  } finally {
    if (triggerBtn) {
      triggerBtn.disabled = false;
      triggerBtn.innerHTML = originalLabel;
    }
    setTimeout(() => {
      if (el.progressNote) el.progressNote.textContent = "";
    }, 6000);
  }
}

/* ---------------- Events ---------------- */

function wireEvents() {
  el.closeLightbox.addEventListener("click", closeLightbox);
  el.prevBtn.addEventListener("click", () => step(-1));
  el.nextBtn.addEventListener("click", () => step(1));
  if (el.shareBtn) el.shareBtn.addEventListener("click", sharePhoto);
  if (el.starBtn) {
    el.starBtn.addEventListener("click", () => {
      const photo = state.photos[currentIndex];
      toggleFavorite(state.slug, photo.file);
      syncStarBtn();
      // Keep the matching grid card's star icon in sync.
      renderGrid();
    });
  }
  if (el.downloadAllBtn) el.downloadAllBtn.addEventListener("click", downloadAllForEvent);
  if (el.slideshowBtn) el.slideshowBtn.addEventListener("click", toggleSlideshow);

  document.addEventListener("keydown", (e) => {
    if (el.lightbox.classList.contains("hidden")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") { stopSlideshow(); step(-1); }
    if (e.key === "ArrowRight") { stopSlideshow(); step(1); }
  });

  // Pinch-zoom / pan / swipe on the photo itself.
  zoomCtl = attachZoom(el.lightbox, el.lightboxImg, {
    onSwipeLeft: () => { stopSlideshow(); step(1); },
    onSwipeRight: () => { stopSlideshow(); step(-1); },
  });

  el.prevBtn.addEventListener("click", stopSlideshow);
  el.nextBtn.addEventListener("click", stopSlideshow);

  document.addEventListener("langchange", () => {
    if (el.count) el.count.textContent = t("photoCount", { n: state.photos.length });
    if (!el.lightbox.classList.contains("hidden")) {
      el.counter.textContent = t("photoOf", { current: currentIndex + 1, total: state.photos.length });
      syncStarBtn();
    }
  });
}
