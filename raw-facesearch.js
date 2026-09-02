/* ============================================================
   Wedding Gallery — "find someone" face search, scoped to RAW
   Same idea as facesearch.js but only ever loads RAW indexes
   (data/raw-<slug>-faces.json) and RAW photo paths. Lives only on
   raw.html, which already sits behind the "ss" gate, so results
   never leak to anyone who hasn't unlocked RAW.
   ============================================================ */

import { zipAndDownload } from "./zip.js";
import { attachZoom } from "./zoomable.js";

const MATCH_THRESHOLD = 0.5;
const MODEL_URL = "models";
const ALL_SLUGS = ["court-wedding", "groom-reception", "bride-reception", "pre-wedding"];

const el = {
  openBtn: document.getElementById("openRawFaceSearchBtn"),
  modal: document.getElementById("rawFaceModal"),
  closeBtn: document.getElementById("closeRawFaceModal"),
  selfieList: document.getElementById("rawSelfieList"),
  selfieInput: document.getElementById("rawSelfieInput"),
  cameraInput: document.getElementById("rawCameraInput"),
  searchBtn: document.getElementById("searchRawFacesBtn"),
  status: document.getElementById("rawFaceStatus"),
};

if (el.openBtn) {
  injectResultsUI();

  const state = {
    modelsLoaded: false,
    faceIndex: null, // [{slug, file, descriptors:[[...]]}] across all RAW categories
    queryDescriptors: [],
    matches: [], // [{slug, file, selected}]
  };

  const rv = {
    view: document.getElementById("rawFaceResultsView"),
    count: document.getElementById("rawFaceResultsCount"),
    grid: document.getElementById("rawFaceResultsGrid"),
    closeBtn: document.getElementById("closeRawFaceResultsView"),
    downloadAllBtn: document.getElementById("openRawDownloadPickerBtn"),
  };

  const lb = {
    el: document.getElementById("rawFaceLightbox"),
    img: document.getElementById("rawFaceLightboxImg"),
    counter: document.getElementById("rawFaceLightboxCounter"),
    closeBtn: document.getElementById("closeRawFaceLightbox"),
    prevBtn: document.getElementById("rawFacePrevBtn"),
    nextBtn: document.getElementById("rawFaceNextBtn"),
    downloadBtn: document.getElementById("rawFaceDownloadBtn"),
    slideshowBtn: document.getElementById("rawFaceSlideshowBtn"),
  };

  const dl = {
    modal: document.getElementById("rawFaceDownloadModal"),
    closeBtn: document.getElementById("closeRawFaceDownloadModal"),
    grid: document.getElementById("rawFaceDownloadGrid"),
    selectAllBtn: document.getElementById("rawFaceDownloadSelectAllBtn"),
    selectNoneBtn: document.getElementById("rawFaceDownloadSelectNoneBtn"),
    status: document.getElementById("rawFaceDownloadStatus"),
    confirmBtn: document.getElementById("confirmRawDownloadMatchesBtn"),
    count: document.getElementById("rawFaceDownloadCount"),
  };

  let currentIndex = 0;
  let zoomCtl = null;
  let slideshowTimer = null;

  el.openBtn.addEventListener("click", () => el.modal.classList.remove("hidden"));
  el.closeBtn.addEventListener("click", () => el.modal.classList.add("hidden"));
  el.selfieInput.addEventListener("change", onSelfiesSelected);
  if (el.cameraInput) el.cameraInput.addEventListener("change", onSelfiesSelected);
  el.searchBtn.addEventListener("click", runSearch);

  async function ensureModels() {
    if (state.modelsLoaded) return;
    el.status.textContent = t("loadingFaceIndex");
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    state.modelsLoaded = true;
  }

  async function ensureFaceIndex() {
    if (state.faceIndex) return state.faceIndex;
    const combined = [];
    await Promise.all(
      ALL_SLUGS.map(async (slug) => {
        try {
          const res = await fetch(`data/raw-${slug}-faces.json`);
          if (!res.ok) throw new Error("no index");
          const entries = await res.json();
          entries.forEach((entry) => combined.push({ slug, file: entry.file, descriptors: entry.descriptors }));
        } catch {
          // that category just doesn't have an index yet — skip it
        }
      })
    );
    state.faceIndex = combined;
    return state.faceIndex;
  }

  async function onSelfiesSelected(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    el.status.textContent = "";

    try {
      await ensureModels();
      for (const file of files) {
        const url = URL.createObjectURL(file);
        const img = document.createElement("img");
        img.className = "selfie-thumb";
        img.src = url;
        el.selfieList.appendChild(img);

        const imgEl = await loadImage(url);
        const detection = await faceapi
          .detectAllFaces(imgEl, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();
        if (detection.length) {
          detection.sort((a, b) => b.detection.box.area - a.detection.box.area);
          state.queryDescriptors.push(Array.from(detection[0].descriptor));
        }
      }
      e.target.value = "";
    } catch (err) {
      console.error(err);
      el.status.textContent = "Something went wrong reading that photo.";
    }
  }

  async function runSearch() {
    if (!state.queryDescriptors.length) return;
    el.status.textContent = t("searchingFaces");

    const index = await ensureFaceIndex();
    if (!index.length) {
      el.status.textContent = t("faceIndexUnavailable");
      return;
    }

    const matched = [];
    index.forEach((entry) => {
      const isMatch = entry.descriptors.some((faceDesc) =>
        state.queryDescriptors.some((queryDesc) => euclideanDistance(faceDesc, queryDesc) < MATCH_THRESHOLD)
      );
      if (isMatch) matched.push({ slug: entry.slug, file: entry.file, selected: true });
    });

    if (!matched.length) {
      el.status.textContent = t("facesNotFound");
      return;
    }

    state.matches = matched;
    el.status.textContent = "";
    el.modal.classList.add("hidden");
    openResultsView();
  }

  /* ---------------- Results gallery ---------------- */

  function openResultsView() {
    rv.count.textContent = t("photoCount", { n: state.matches.length });
    rv.grid.innerHTML = "";
    const frag = document.createDocumentFragment();
    state.matches.forEach((m, i) => {
      const card = document.createElement("div");
      card.className = "photo-card";
      const openBtn = document.createElement("button");
      openBtn.type = "button";
      openBtn.style.cssText = "position:absolute;inset:0;border:none;background:none;padding:0;width:100%;height:100%;";
      const img = document.createElement("img");
      img.src = `photos/RAW/${m.slug}/thumb/${m.file}`;
      img.loading = "lazy";
      img.alt = "";
      openBtn.appendChild(img);
      openBtn.addEventListener("click", () => openLightbox(i));
      card.appendChild(openBtn);
      frag.appendChild(card);
    });
    rv.grid.appendChild(frag);
    rv.view.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  rv.closeBtn.addEventListener("click", () => {
    rv.view.classList.add("hidden");
    document.body.style.overflow = "";
  });
  rv.downloadAllBtn.addEventListener("click", openDownloadPicker);

  /* ---------------- Results lightbox ---------------- */

  function openLightbox(index) {
    currentIndex = index;
    showCurrent();
    lb.el.classList.remove("hidden");
  }

  function closeLightbox() {
    lb.el.classList.add("hidden");
    stopSlideshow();
  }

  function step(dir) {
    currentIndex = (currentIndex + dir + state.matches.length) % state.matches.length;
    showCurrent();
  }

  function showCurrent() {
    const m = state.matches[currentIndex];
    const src = `photos/RAW/${m.slug}/full/${m.file}`;
    lb.img.src = src;
    lb.img.alt = "";
    lb.downloadBtn.href = src;
    lb.downloadBtn.setAttribute("download", m.file);
    lb.counter.textContent = t("photoOf", { current: currentIndex + 1, total: state.matches.length });
    if (zoomCtl) zoomCtl.reset(false);
  }

  function startSlideshow() {
    stopSlideshow();
    slideshowTimer = setInterval(() => step(1), 5000);
    lb.slideshowBtn.classList.add("active");
  }

  function stopSlideshow() {
    if (slideshowTimer) {
      clearInterval(slideshowTimer);
      slideshowTimer = null;
    }
    lb.slideshowBtn.classList.remove("active");
  }

  lb.closeBtn.addEventListener("click", closeLightbox);
  lb.prevBtn.addEventListener("click", () => { stopSlideshow(); step(-1); });
  lb.nextBtn.addEventListener("click", () => { stopSlideshow(); step(1); });
  lb.slideshowBtn.addEventListener("click", () => (slideshowTimer ? stopSlideshow() : startSlideshow()));

  zoomCtl = attachZoom(lb.el, lb.img, {
    onSwipeLeft: () => { stopSlideshow(); step(1); },
    onSwipeRight: () => { stopSlideshow(); step(-1); },
  });

  document.addEventListener("keydown", (e) => {
    if (lb.el.classList.contains("hidden")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") { stopSlideshow(); step(-1); }
    if (e.key === "ArrowRight") { stopSlideshow(); step(1); }
  });

  /* ---------------- Download picker (select/deselect before zip) ---------------- */

  function openDownloadPicker() {
    dl.grid.innerHTML = "";
    const frag = document.createDocumentFragment();
    state.matches.forEach((m) => {
      m.selected = m.selected !== false;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "face-result";
      if (!m.selected) btn.classList.add("deselected");
      const img = document.createElement("img");
      img.src = `photos/RAW/${m.slug}/thumb/${m.file}`;
      img.loading = "lazy";
      img.alt = "";
      const check = document.createElement("span");
      check.className = "face-result__check";
      check.textContent = "✓";
      btn.appendChild(img);
      btn.appendChild(check);
      btn.addEventListener("click", () => {
        m.selected = !m.selected;
        btn.classList.toggle("deselected", !m.selected);
        updateDownloadCount();
      });
      frag.appendChild(btn);
    });
    dl.grid.appendChild(frag);
    updateDownloadCount();
    dl.status.textContent = "";
    dl.modal.classList.remove("hidden");
  }

  function updateDownloadCount() {
    const n = state.matches.filter((m) => m.selected).length;
    dl.count.textContent = n;
    dl.confirmBtn.disabled = n === 0;
  }

  dl.closeBtn.addEventListener("click", () => dl.modal.classList.add("hidden"));
  dl.selectAllBtn.addEventListener("click", () => {
    state.matches.forEach((m) => (m.selected = true));
    [...dl.grid.children].forEach((b) => b.classList.remove("deselected"));
    updateDownloadCount();
  });
  dl.selectNoneBtn.addEventListener("click", () => {
    state.matches.forEach((m) => (m.selected = false));
    [...dl.grid.children].forEach((b) => b.classList.add("deselected"));
    updateDownloadCount();
  });

  dl.confirmBtn.addEventListener("click", async () => {
    const selected = state.matches.filter((m) => m.selected);
    if (!selected.length) return;
    const items = selected.map((m) => ({ name: `${m.slug}/${m.file}`, url: `photos/RAW/${m.slug}/full/${m.file}` }));
    dl.confirmBtn.disabled = true;
    try {
      await zipAndDownload(items, "raw-face-search-matches.zip", (done, total) => {
        dl.status.textContent = t("preparingZip", { done, total });
      });
      dl.status.textContent = t("zipReady");
    } finally {
      updateDownloadCount();
    }
  });
}

/* ---------------- Injected markup ---------------- */

function injectResultsUI() {
  if (document.getElementById("rawFaceResultsView")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="face-results-view hidden" id="rawFaceResultsView">
      <div class="face-results-view__bar">
        <span class="face-results-view__count" id="rawFaceResultsCount"></span>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          <button class="action-btn secondary" id="openRawDownloadPickerBtn" type="button" data-i18n="downloadAll">Download all</button>
          <button class="icon-btn icon-btn--dark" id="closeRawFaceResultsView" type="button" data-i18n-attr="title:close" title="Close">&#10005;</button>
        </div>
      </div>
      <div class="grid" id="rawFaceResultsGrid"></div>
    </div>

    <div class="lightbox hidden" id="rawFaceLightbox">
      <div class="lightbox__counter" id="rawFaceLightboxCounter"></div>
      <div class="lightbox__bar">
        <button class="icon-btn" id="rawFaceSlideshowBtn" type="button" data-i18n-attr="title:slideshow" title="Slideshow">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <a class="icon-btn" id="rawFaceDownloadBtn" download data-i18n-attr="title:download" title="Download this photo">&#8681;</a>
        <button class="icon-btn" id="closeRawFaceLightbox" type="button" data-i18n-attr="title:close" title="Close">&#10005;</button>
      </div>
      <button class="lightbox__nav lightbox__prev" id="rawFacePrevBtn" type="button" data-i18n-attr="title:previous" title="Previous">&#10094;</button>
      <img id="rawFaceLightboxImg" alt="">
      <button class="lightbox__nav lightbox__next" id="rawFaceNextBtn" type="button" data-i18n-attr="title:next" title="Next">&#10095;</button>
    </div>

    <div class="modal hidden" id="rawFaceDownloadModal">
      <div class="modal__card">
        <button class="modal__close" id="closeRawFaceDownloadModal" type="button">&#10005;</button>
        <h2 data-i18n="downloadAll">Download all</h2>
        <div class="face-results" id="rawFaceDownloadGrid"></div>
        <div class="face-results-actions">
          <button class="text-link-btn" id="rawFaceDownloadSelectAllBtn" type="button" data-i18n="selectAll">Select all</button>
          <button class="text-link-btn" id="rawFaceDownloadSelectNoneBtn" type="button" data-i18n="selectNone">Deselect all</button>
        </div>
        <div class="status-line" id="rawFaceDownloadStatus"></div>
        <button class="action-btn" id="confirmRawDownloadMatchesBtn" type="button">
          <span data-i18n="downloadSelectedMatches">Download selected</span> (<span id="rawFaceDownloadCount">0</span>)
        </button>
      </div>
    </div>
  `;
  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
  if (typeof applyTranslations === "function") applyTranslations();
}

function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
