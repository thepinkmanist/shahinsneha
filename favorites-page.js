/* ============================================================
   Wedding Gallery — "My photos" (starred) page logic
   Reads the shared favorites cart (favorites.js) straight out of
   localStorage — no network needed to know what's starred — and
   renders it grouped by event, with a combined lightbox and a
   single zip download across every event.
   ============================================================ */

import { zipAndDownload } from "./zip.js";
import { attachZoom } from "./zoomable.js";

const EVENT_TITLES = {
  prewedding: "preweddingTitle",
  registration: "registrationTitle",
  reception1: "receptionOneTitle",
  reception2: "receptionTwoTitle",
};

const el = {
  count: document.getElementById("photoCount"),
  empty: document.getElementById("emptyState"),
  groups: document.getElementById("favGroups"),
  toolbar: document.getElementById("toolbar"),
  downloadSelectedBtn: document.getElementById("downloadSelectedBtn"),
  clearAllBtn: document.getElementById("clearAllBtn"),
  progressNote: document.getElementById("progressNote"),
  lightbox: document.getElementById("lightbox"),
  lightboxImg: document.getElementById("lightboxImg"),
  closeLightbox: document.getElementById("closeLightbox"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
  shareBtn: document.getElementById("shareBtn"),
  starBtn: document.getElementById("starBtn"),
  counter: document.getElementById("lightboxCounter"),
  slideshowBtn: document.getElementById("slideshowBtn"),
};

let flatList = []; // [{slug, file}] in display order
let currentIndex = 0;
let zoomCtl = null;
let slideshowTimer = null;

render();
wireEvents();

function render() {
  flatList = favoritesList();
  el.count.textContent = t("photoCount", { n: flatList.length });

  el.groups.innerHTML = "";
  const hasAny = flatList.length > 0;
  el.empty.classList.toggle("hidden", hasAny);
  el.toolbar.classList.toggle("hidden", !hasAny);

  const bySlug = {};
  flatList.forEach((item) => {
    (bySlug[item.slug] = bySlug[item.slug] || []).push(item);
  });

  Object.keys(bySlug).forEach((slug) => {
    const section = document.createElement("section");
    section.className = "fav-group";

    const h2 = document.createElement("h2");
    h2.setAttribute("data-i18n", EVENT_TITLES[slug] || slug);
    h2.textContent = t(EVENT_TITLES[slug] || slug);
    section.appendChild(h2);

    const grid = document.createElement("div");
    grid.className = "grid";

    bySlug[slug].forEach((item) => {
      const card = document.createElement("div");
      card.className = "photo-card";

      const openBtn = document.createElement("button");
      openBtn.type = "button";
      openBtn.style.cssText = "position:absolute;inset:0;border:none;background:none;padding:0;width:100%;height:100%;";
      const img = document.createElement("img");
      img.src = `photos/${item.slug}/thumb/${item.file}`;
      img.loading = "lazy";
      img.alt = "";
      openBtn.appendChild(img);
      openBtn.addEventListener("click", () => openLightbox(flatList.indexOf(item)));

      const star = document.createElement("button");
      star.type = "button";
      star.className = "star-btn active";
      star.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2.5l3 6.6 7.2.7-5.4 4.9 1.6 7.1L12 17.8 5.6 21.8l1.6-7.1-5.4-4.9 7.2-.7z"/></svg>';
      star.title = t("unstar");
      star.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorite(item.slug, item.file);
        render();
      });

      card.appendChild(openBtn);
      card.appendChild(star);
      grid.appendChild(card);
    });

    section.appendChild(grid);
    el.groups.appendChild(section);
  });
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
  if (!flatList.length) return;
  currentIndex = (currentIndex + dir + flatList.length) % flatList.length;
  showCurrent();
}

function showCurrent() {
  const item = flatList[currentIndex];
  if (!item) return closeLightbox();
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

async function sharePhoto() {
  const item = flatList[currentIndex];
  if (!item) return;
  const src = `photos/${item.slug}/full/${item.file}`;
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    const file = new File([blob], item.file, { type: blob.type || "image/jpeg" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Shahin & Sneha" });
      return;
    }
  } catch (err) {
    if (err && err.name === "AbortError") return;
  }
  window.open(src, "_blank");
  alert(t("shareFallback"));
}

/* ---------------- Zip / actions ---------------- */

async function downloadStarred() {
  if (!flatList.length) return;
  const items = flatList.map((item) => ({
    name: `${item.slug}/${item.file}`,
    url: `photos/${item.slug}/full/${item.file}`,
  }));
  const btn = el.downloadSelectedBtn;
  const originalLabel = btn.innerHTML;
  btn.disabled = true;
  try {
    const ok = await zipAndDownload(items, "my-starred-photos.zip", (done, total) => {
      el.progressNote.textContent = t("preparingZip", { done, total });
    });
    el.progressNote.textContent = ok ? t("zipReady") : t("zipCancelled");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalLabel;
    setTimeout(() => (el.progressNote.textContent = ""), 6000);
  }
}

function wireEvents() {
  el.closeLightbox.addEventListener("click", closeLightbox);
  el.prevBtn.addEventListener("click", () => step(-1));
  el.nextBtn.addEventListener("click", () => step(1));
  el.shareBtn.addEventListener("click", sharePhoto);
  el.starBtn.addEventListener("click", () => {
    const item = flatList[currentIndex];
    if (!item) return;
    toggleFavorite(item.slug, item.file);
    closeLightbox();
    render();
  });
  el.downloadSelectedBtn.addEventListener("click", downloadStarred);
  el.clearAllBtn.addEventListener("click", () => {
    if (confirm(t("clearSelections") + "?")) {
      clearFavorites();
      render();
    }
  });
  if (el.slideshowBtn) el.slideshowBtn.addEventListener("click", toggleSlideshow);
  el.prevBtn.addEventListener("click", stopSlideshow);
  el.nextBtn.addEventListener("click", stopSlideshow);

  zoomCtl = attachZoom(el.lightbox, el.lightboxImg, {
    onSwipeLeft: () => { stopSlideshow(); step(1); },
    onSwipeRight: () => { stopSlideshow(); step(-1); },
  });

  document.addEventListener("keydown", (e) => {
    if (el.lightbox.classList.contains("hidden")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") { stopSlideshow(); step(-1); }
    if (e.key === "ArrowRight") { stopSlideshow(); step(1); }
  });

  document.addEventListener("favoriteschange", render);
  document.addEventListener("langchange", render);
}
