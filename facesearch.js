/* ============================================================
   Wedding Gallery — "find someone in the photos" face search
   Runs entirely on-device with face-api.js. A visitor uploads one
   or more selfies (e.g. themselves + a spouse) and gets back every
   matching photo from Registration, Reception 1, and Reception 2
   (the Pre-Wedding Photoshoot is intentionally excluded) as a real,
   browsable gallery — open any match full-screen, star it, share it,
   watch it as a slideshow, or download it individually. A "Download
   all" button opens a pick-and-choose screen before zipping.
   ============================================================ */

import { zipAndDownload } from "./zip.js";
import { attachZoom } from "./zoomable.js";

const MATCH_THRESHOLD = 0.5;
const MODEL_URL = "models";
const ALL_SLUGS = ["registration", "reception1", "reception2"];

const el = {
  openBtn: document.getElementById("openFaceSearchBtn"),
  modal: document.getElementById("faceModal"),
  closeBtn: document.getElementById("closeFaceModal"),
  selfieList: document.getElementById("selfieList"),
  selfieInput: document.getElementById("selfieInput"),
  cameraInput: document.getElementById("cameraInput"),
  searchBtn: document.getElementById("searchFacesBtn"),
  status: document.getElementById("faceStatus"),
};

if (el.openBtn) {
  injectResultsUI();

  const state = {
    modelsLoaded: false,
    faceIndex: null, // [{slug, file, descriptors:[[...]]}] once loaded, across all events
    queryDescriptors: [], // one per uploaded selfie
    matches: [], // [{slug, file, selected}]
  };

  const rv = {
    view: document.getElementById("faceResultsView"),
    count: document.getElementById("faceResultsCount"),
    grid: document.getElementById("faceResultsGrid"),
    closeBtn: document.getElementById("closeFaceResultsView"),
    downloadAllBtn: document.getElementById("openDownloadPickerBtn"),
  };

  const lb = {
    el: document.getElementById("faceLightbox"),
    img: document.getElementById("faceLightboxImg"),
    counter: document.getElementById("faceLightboxCounter"),
    closeBtn: document.getElementById("closeFaceLightbox"),
    prevBtn: document.getElementById("facePrevBtn"),
    nextBtn: document.getElementById("faceNextBtn"),
    starBtn: document.getElementById("faceStarBtn"),
    shareBtn: document.getElementById("faceShareBtn"),
    downloadBtn: document.getElementById("faceDownloadBtn"),
    slideshowBtn: document.getElementById("faceSlideshowBtn"),
  };

  const dl = {
    modal: document.getElementById("faceDownloadModal"),
    closeBtn: document.getElementById("closeFaceDownloadModal"),
    grid: document.getElementById("faceDownloadGrid"),
    actions: document.getElementById("faceDownloadActions"),
    selectAllBtn: document.getElementById("faceDownloadSelectAllBtn"),
    selectNoneBtn: document.getElementById("faceDownloadSelectNoneBtn"),
    status: document.getElementById("faceDownloadStatus"),
    confirmBtn: document.getElementById("confirmDownloadMatchesBtn"),
    count: document.getElementById("faceDownloadCount"),
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
          const res = await fetch(`data/${slug}-faces.json`);
          if (!res.ok) throw new Error("no index");
          const entries = await res.json();
          entries.forEach((entry) => combined.push({ slug, file: entry.file, descriptors: entry.descriptors }));
        } catch {
          // that event just doesn't have an index yet — skip it
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
      img.src = `photos/${m.slug}/thumb/${m.file}`;
      img.loading = "lazy";
      img.alt = "";
      openBtn.appendChild(img);
      openBtn.addEventListener("click", () => openLightbox(i));
      card.appendChild(openBtn);
      card.appendChild(makeStarButton(m.slug, m.file));
      frag.appendChild(card);
    });
    rv.grid.appendChild(frag);
    rv.view.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function makeStarButton(slug, file) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "star-btn";
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2.5l3 6.6 7.2.7-5.4 4.9 1.6 7.1L12 17.8 5.6 21.8l1.6-7.1-5.4-4.9 7.2-.7z"/></svg>';
    const sync = () => btn.classList.toggle("active", isFavorite(slug, file));
    sync();
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorite(slug, file);
      sync();
    });
    return btn;
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
    const src = `photos/${m.slug}/full/${m.file}`;
    lb.img.src = src;
    lb.img.alt = "";
    lb.downloadBtn.href = src;
    lb.downloadBtn.setAttribute("download", m.file);
    lb.counter.textContent = t("photoOf", { current: currentIndex + 1, total: state.matches.length });
    lb.starBtn.classList.toggle("active", isFavorite(m.slug, m.file));
    if (zoomCtl) zoomCtl.reset(false);
  }

  async function sharePhoto() {
    const m = state.matches[currentIndex];
    const src = `photos/${m.slug}/full/${m.file}`;
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const file = new File([blob], m.file, { type: blob.type || "image/jpeg" });
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
  lb.shareBtn.addEventListener("click", sharePhoto);
  lb.starBtn.addEventListener("click", () => {
    const m = state.matches[currentIndex];
    toggleFavorite(m.slug, m.file);
    lb.starBtn.classList.toggle("active", isFavorite(m.slug, m.file));
  });

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
      img.src = `photos/${m.slug}/thumb/${m.file}`;
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
    const items = selected.map((m) => ({ name: `${m.slug}/${m.file}`, url: `photos/${m.slug}/full/${m.file}` }));
    dl.confirmBtn.disabled = true;
    try {
      await zipAndDownload(items, "face-search-matches.zip", (done, total) => {
        dl.status.textContent = t("preparingZip", { done, total });
      });
      dl.status.textContent = t("zipReady");
    } finally {
      updateDownloadCount();
    }
  });
}

/* ---------------- Injected markup (shared across every page that has the search button) ---------------- */

function injectResultsUI() {
  if (document.getElementById("faceResultsView")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="face-results-view hidden" id="faceResultsView">
      <div class="face-results-view__bar">
        <span class="face-results-view__count" id="faceResultsCount"></span>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          <button class="action-btn secondary" id="openDownloadPickerBtn" type="button" data-i18n="downloadAll">Download all</button>
          <button class="icon-btn icon-btn--dark" id="closeFaceResultsView" type="button" data-i18n-attr="title:close" title="Close">&#10005;</button>
        </div>
      </div>
      <div class="grid" id="faceResultsGrid"></div>
    </div>

    <div class="lightbox hidden" id="faceLightbox">
      <div class="lightbox__counter" id="faceLightboxCounter"></div>
      <div class="lightbox__bar">
        <button class="icon-btn" id="faceSlideshowBtn" type="button" data-i18n-attr="title:slideshow" title="Slideshow">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button class="icon-btn star-btn" id="faceStarBtn" type="button" data-i18n-attr="title:star" title="Star this photo">
          <svg viewBox="0 0 24 24"><path d="M12 2.5l3 6.6 7.2.7-5.4 4.9 1.6 7.1L12 17.8 5.6 21.8l1.6-7.1-5.4-4.9 7.2-.7z"/></svg>
        </button>
        <button class="icon-btn" id="faceShareBtn" type="button" data-i18n-attr="title:share" title="Share this photo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="10.6" x2="15.4" y2="6.4"/><line x1="8.6" y1="13.4" x2="15.4" y2="17.6"/></svg>
        </button>
        <a class="icon-btn" id="faceDownloadBtn" download data-i18n-attr="title:download" title="Download this photo">&#8681;</a>
        <button class="icon-btn" id="closeFaceLightbox" type="button" data-i18n-attr="title:close" title="Close">&#10005;</button>
      </div>
      <button class="lightbox__nav lightbox__prev" id="facePrevBtn" type="button" data-i18n-attr="title:previous" title="Previous">&#10094;</button>
      <img id="faceLightboxImg" alt="">
      <button class="lightbox__nav lightbox__next" id="faceNextBtn" type="button" data-i18n-attr="title:next" title="Next">&#10095;</button>
    </div>

    <div class="modal hidden" id="faceDownloadModal">
      <div class="modal__card">
        <button class="modal__close" id="closeFaceDownloadModal" type="button">&#10005;</button>
        <h2 data-i18n="downloadAll">Download all</h2>
        <div class="face-results" id="faceDownloadGrid"></div>
        <div class="face-results-actions" id="faceDownloadActions">
          <button class="text-link-btn" id="faceDownloadSelectAllBtn" type="button" data-i18n="selectAll">Select all</button>
          <button class="text-link-btn" id="faceDownloadSelectNoneBtn" type="button" data-i18n="selectNone">Deselect all</button>
        </div>
        <div class="status-line" id="faceDownloadStatus"></div>
        <button class="action-btn" id="confirmDownloadMatchesBtn" type="button">
          <span data-i18n="downloadSelectedMatches">Download selected</span> (<span id="faceDownloadCount">0</span>)
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
