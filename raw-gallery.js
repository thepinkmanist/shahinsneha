/* ============================================================
   Wedding Gallery — RAW photo category gallery
   One page (?cat=<slug>) for all four RAW categories. Sits behind
   the same password gate as raw.html (raw.js handles that — this
   script only builds the grid/lightbox once the gate is unlocked).
   No star/share/face-search here, just browse, slideshow, and
   download (single photo or the whole category as a zip).
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
    const img = document.createElement("img");
    img.src = `photos/RAW/${cat}/thumb/${p.file}`;
    img.loading = "lazy";
    img.alt = "";
    card.appendChild(img);
    card.addEventListener("click", () => openLightbox(i));
    frag.appendChild(card);
  });
  el.grid.appendChild(frag);
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
