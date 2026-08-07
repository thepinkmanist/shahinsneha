/* ============================================================
   Wedding Gallery — slideshow
   With no ?event= in the URL, plays every photo from every event,
   chronologically. With ?event=<slug>, plays just that one event's
   own photos (linked from that event's gallery page). Either way,
   autoplays immediately at 5 seconds per photo.
   ============================================================ */

import { attachZoom } from "./zoomable.js";

const requestedEvent = new URLSearchParams(location.search).get("event");
const ALL_SLUGS = requestedEvent
  ? [requestedEvent]
  : ["prewedding", "registration", "reception1", "reception2"];

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

  el.prevBtn.addEventListener("click", () => { stopSlideshow(); step(-1); });
  el.nextBtn.addEventListener("click", () => { stopSlideshow(); step(1); });
  el.slideshowBtn.addEventListener("click", toggleSlideshow);

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { stopSlideshow(); step(-1); }
    if (e.key === "ArrowRight") { stopSlideshow(); step(1); }
  });
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
