/* ============================================================
   Wedding Gallery — home page logic
   Sets each event card's cover photo from its manifest, and
   swaps the YouTube thumbnail facade for a real embed on click
   (so we don't load YouTube's player until the visitor asks for it).
   ============================================================ */

import { zipAndDownload } from "./zip.js";

const YOUTUBE_ID = "F7Mp6Bj_bJ4";
const ALL_SLUGS = ["registration", "reception1", "reception2"];

const HERO_IMAGE = "photos/covers/home-page-cover.png";

// A fixed hand-picked cover photo, used instead of an auto-picked one.
const COVER_OVERRIDES = {
  registration: "photos/covers/Registration-cover.png",
  reception1: "photos/covers/Reception-1-cover.png",
  reception2: "photos/covers/Reception-2-cover.png",
};

const COVERS = [
  { slug: "registration", elId: "coverRegistration" },
  { slug: "reception1", elId: "coverReception1" },
  { slug: "reception2", elId: "coverReception2" },
];

init();

async function init() {
  setupVideoFacade();
  setupDownloadEverything();
  setupShareGallery();
  const heroImg = document.getElementById("heroImg");
  if (heroImg) heroImg.src = HERO_IMAGE;
  await Promise.all(COVERS.map(loadCover));
}

function setupShareGallery() {
  const btn = document.getElementById("shareGalleryBtn");
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const url = window.location.href;
    const text = t("shareGalleryText");
    if (navigator.share) {
      try {
        await navigator.share({ title: t("siteTitle"), text, url });
        return;
      } catch (err) {
        if (err && err.name === "AbortError") return;
      }
    }
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
    window.open(waUrl, "_blank", "noopener");
  });
}

async function loadCover({ slug, elId }) {
  const img = document.getElementById(elId);
  if (!img) return;
  if (COVER_OVERRIDES[slug]) {
    img.src = COVER_OVERRIDES[slug];
    return;
  }
  try {
    const res = await fetch(`data/${slug}.json`);
    const list = await res.json();
    if (!list.length) return;
    const pick = list[Math.floor(list.length / 3)];
    // Full-res — event cards render larger than the 480px grid thumbnail,
    // especially on high-DPI screens, where the thumbnail looked soft.
    img.src = `photos/${slug}/full/${pick.file}`;
  } catch (err) {
    console.error("Could not load cover for", slug, err);
  }
}

function setupDownloadEverything() {
  const btn = document.getElementById("downloadEverythingBtn");
  const progressNote = document.getElementById("progressNote");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    const originalLabel = btn.innerHTML;
    try {
      const lists = await Promise.all(
        ALL_SLUGS.map((slug) => fetch(`data/${slug}.json`).then((r) => r.json()))
      );
      const items = [];
      ALL_SLUGS.forEach((slug, i) => {
        lists[i].forEach((p) => {
          items.push({ name: `${slug}/${p.file}`, url: `photos/${slug}/full/${p.file}` });
        });
      });
      const ok = await zipAndDownload(items, "shahin-sneha-wedding-photos.zip", (done, total) => {
        progressNote.textContent = t("preparingZip", { done, total });
      });
      progressNote.textContent = ok ? t("zipReady") : t("zipCancelled");
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalLabel;
      setTimeout(() => (progressNote.textContent = ""), 6000);
    }
  });
}

function setupVideoFacade() {
  const thumb = document.getElementById("videoThumb");
  const frame = document.getElementById("videoFrame");
  const playBtn = document.getElementById("playBtn");

  thumb.src = `https://img.youtube.com/vi/${YOUTUBE_ID}/hqdefault.jpg`;

  playBtn.addEventListener("click", () => {
    const iframe = document.createElement("iframe");
    iframe.src = `https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?autoplay=1&rel=0`;
    iframe.title = "Wedding highlights video";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    frame.innerHTML = "";
    frame.appendChild(iframe);
  });
}
