/* ============================================================
   Wedding Gallery — RAW photo category gallery
   One page (?cat=<slug>) for all four RAW categories. Sits behind
   the same password gate as raw.html (raw.js handles that — this
   script only builds the grid/lightbox once the gate is unlocked).
   Browse, star, slideshow, and download (single photo or the whole
   category as a zip). Starring uses the same favorites.js cart as
   the main gallery, keyed by the RAW category slug — which never
   collides with a main-gallery slug — but favorites-page.js filters
   RAW entries out of the public "My photos" page, so starred RAW
   photos only ever surface back inside the gated RAW section
   (raw.html's "My starred photos").
   ============================================================ */

import { zipAndDownload } from "./zip.js";
import { attachZoom } from "./zoomable.js";

const CATEGORIES = {
  "court-wedding": { title: "Court Wedding", date: "7 May 2026" },
  "groom-reception": { title: "Groom Reception", date: "9 May 2026" },
  "bride-reception": { title: "Bride Reception", date: "17 May 2026" },
  "pre-wedding": { title: "Pre-Wedding", date: "1 May 2026" },
};

const cat = new URLSearchParams(location.search).get("cat");
const info = CATEGORIES[cat];

const el = {
  title: document.getElementById("rawGalleryTitle"),
  count: document.getElementById("photoCount"),
  grid: document.getElementById("grid"),
  downloadAllBtn: document.getElementById("downloadAllBtn"),
  progressNote: document.getElementById("progressNote"),
  slideshowOpenBtn: document.getElementById("rawSlideshowBtn"),
  lightbox: document.getElementById("lightbox"),
  lightboxImg: document.getElementById("lightboxImg"),
  closeLightbox: document.getElementById("closeLightbox"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
  counter: document.getElementById("lightboxCounter"),
  slideshowBtn: document.getElementById("slideshowBtn"),
  starBtn: document.getElementById("starBtn"),
};

let photos = [];
let currentIndex = 0;
let slideshowTimer = null;
let zoomCtl = null;

init();

async function init() {
  if (!info) {
    el.title.textContent = "Unknown category";
    return;
  }
  el.title.textContent = info.title;
  document.title = `${info.title} (RAW) — Shahin & Sneha`;

  try {
    const res = await fetch(`data/raw-${cat}.json`);
    photos = await res.json();
  } catch (err) {
    console.error("Could not load RAW manifest", err);
    photos = [];
  }

  el.count.textContent = t("photoCount", { n: photos.length });
  renderGrid();
  wireEvents();
}

function renderGrid() {
  el.grid.innerHTML = "";
  if (!photos.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.setAttribute("data-i18n", "emptyState");
    empty.textContent = t("emptyState");
    el.grid.appendChild(empty);
    return;
  }
  const frag = document.createDocumentFragment();
  photos.forEach((p, i) => {
    const card = document.createElement("div");
    card.className = "photo-card";

    const openBtn = document.createElement("button");
    openBtn.type = "button";
    openBtn.style.cssText = "position:absolute;inset:0;border:none;background:none;padding:0;width:100%;height:100%;";
    const img = document.createElement("img");
    img.src = `photos/RAW/${cat}/thumb/${p.file}`;
    img.loading = "lazy";
    img.alt = "";
    openBtn.appendChild(img);
    openBtn.addEventListener("click", () => openLightbox(i));

    card.appendChild(openBtn);
    card.appendChild(makeStarButton(p.file));
    frag.appendChild(card);
  });
  el.grid.appendChild(frag);
}

function makeStarButton(file) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "star-btn";
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2.5l3 6.6 7.2.7-5.4 4.9 1.6 7.1L12 17.8 5.6 21.8l1.6-7.1-5.4-4.9 7.2-.7z"/></svg>';
  const sync = () => {
    const active = isFavorite(cat, file);
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
    btn.title = t(active ? "unstar" : "star");
  };
  sync();
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleFavorite(cat, file);
    sync();
  });
  document.addEventListener("langchange", sync);
  return btn;
}

function openLightbox(index) {
  currentIndex = index;
  showCurrent();
  el.lightbox.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
function closeLightboxFn() {
  el.lightbox.classList.add("hidden");
  document.body.style.overflow = "";
  stopSlideshow();
}
function step(dir) {
  currentIndex = (currentIndex + dir + photos.length) % photos.length;
  showCurrent();
}
function showCurrent() {
  const p = photos[currentIndex];
  const src = `photos/RAW/${cat}/full/${p.file}`;
  el.lightboxImg.src = src;
  el.downloadBtn.href = src;
  el.downloadBtn.setAttribute("download", p.file);
  el.counter.textContent = t("photoOf", { current: currentIndex + 1, total: photos.length });
  syncStarBtn();
  if (zoomCtl) zoomCtl.reset(false);
}

function syncStarBtn() {
  if (!el.starBtn) return;
  const p = photos[currentIndex];
  const active = isFavorite(cat, p.file);
  el.starBtn.classList.toggle("active", active);
  el.starBtn.setAttribute("aria-pressed", active ? "true" : "false");
  el.starBtn.title = t(active ? "unstar" : "star");
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

async function downloadAll() {
  if (!photos.length) return;
  const items = photos.map((p) => ({ name: p.file, url: `photos/RAW/${cat}/full/${p.file}` }));
  el.downloadAllBtn.disabled = true;
  try {
    await zipAndDownload(items, `${cat}-raw-photos.zip`, (done, total) => {
      el.progressNote.textContent = t("preparingZip", { done, total });
    });
    el.progressNote.textContent = t("zipReady");
  } catch (err) {
    console.error("Zip download failed", err);
  } finally {
    el.downloadAllBtn.disabled = false;
    setTimeout(() => (el.progressNote.textContent = ""), 6000);
  }
}

function wireEvents() {
  el.closeLightbox.addEventListener("click", closeLightboxFn);
  el.prevBtn.addEventListener("click", () => { stopSlideshow(); step(-1); });
  el.nextBtn.addEventListener("click", () => { stopSlideshow(); step(1); });
  el.slideshowBtn.addEventListener("click", () => (slideshowTimer ? stopSlideshow() : startSlideshow()));
  el.downloadAllBtn.addEventListener("click", downloadAll);
  if (el.starBtn) {
    el.starBtn.addEventListener("click", () => {
      const p = photos[currentIndex];
      toggleFavorite(cat, p.file);
      syncStarBtn();
      renderGrid();
    });
  }
  el.slideshowOpenBtn.addEventListener("click", () => {
    openLightbox(0);
    startSlideshow();
  });

  zoomCtl = attachZoom(el.lightbox, el.lightboxImg, {
    onSwipeLeft: () => { stopSlideshow(); step(1); },
    onSwipeRight: () => { stopSlideshow(); step(-1); },
  });

  document.addEventListener("keydown", (e) => {
    if (el.lightbox.classList.contains("hidden")) return;
    if (e.key === "Escape") closeLightboxFn();
    if (e.key === "ArrowLeft") { stopSlideshow(); step(-1); }
    if (e.key === "ArrowRight") { stopSlideshow(); step(1); }
  });
}
