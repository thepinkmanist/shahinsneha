/* ============================================================
   Wedding Gallery — "My starred photos" for RAW
   Same idea as favorites-page.js, but scoped to the RAW category
   slugs and RAW photo paths, and only ever reachable from inside
   raw.html — which already sits behind the "ss" gate — so it's
   the one place starred RAW photos can be reviewed and downloaded.
   ============================================================ */

import { zipAndDownload } from "./zip.js";
import { attachZoom } from "./zoomable.js";

const RAW_SLUGS = new Set(["court-wedding", "groom-reception", "bride-reception", "pre-wedding"]);
const CATEGORY_TITLES = {
  "court-wedding": "Court Wedding",
  "groom-reception": "Groom Reception",
  "bride-reception": "Bride Reception",
  "pre-wedding": "Pre-Wedding",
};

const openBtn = document.getElementById("openRawStarredBtn");
if (openBtn) {
  injectUI();

  const el = {
    view: document.getElementById("rawStarredView"),
    count: document.getElementById("rawStarredCount"),
    groups: document.getElementById("rawStarredGroups"),
    empty: document.getElementById("rawStarredEmpty"),
    downloadAllBtn: document.getElementById("downloadStarredRawBtn"),
    progressNote: document.getElementById("rawStarredProgressNote"),
    closeBtn: document.getElementById("closeRawStarredView"),
    lightbox: document.getElementById("rawStarredLightbox"),
    lightboxImg: document.getElementById("rawStarredLightboxImg"),
    closeLightbox: document.getElementById("closeRawStarredLightbox"),
    prevBtn: document.getElementById("rawStarredPrevBtn"),
    nextBtn: document.getElementById("rawStarredNextBtn"),
    downloadBtn: document.getElementById("rawStarredDownloadBtn"),
    starBtn: document.getElementById("rawStarredStarBtn"),
    counter: document.getElementById("rawStarredLightboxCounter"),
  };

  let flatList = [];
  let currentIndex = 0;
  let zoomCtl = null;

  openBtn.addEventListener("click", () => {
    render();
    el.view.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  });

  el.closeBtn.addEventListener("click", () => {
    el.view.classList.add("hidden");
    document.body.style.overflow = "";
  });

  function render() {
    flatList = favoritesList().filter((item) => RAW_SLUGS.has(item.slug));
    el.count.textContent = t("photoCount", { n: flatList.length });
    el.groups.innerHTML = "";
    const hasAny = flatList.length > 0;
    el.empty.classList.toggle("hidden", hasAny);
    el.downloadAllBtn.classList.toggle("hidden", !hasAny);

    const grouped = {};
    flatList.forEach((item) => {
      (grouped[item.slug] = grouped[item.slug] || []).push(item);
    });

    Object.keys(grouped).forEach((slug) => {
      const section = document.createElement("section");
      section.className = "fav-group";

      const h2 = document.createElement("h2");
      h2.textContent = CATEGORY_TITLES[slug] || slug;
      section.appendChild(h2);

      const grid = document.createElement("div");
      grid.className = "grid";

      grouped[slug].forEach((item) => {
        const card = document.createElement("div");
        card.className = "photo-card";

        const btn = document.createElement("button");
        btn.type = "button";
        btn.style.cssText = "position:absolute;inset:0;border:none;background:none;padding:0;width:100%;height:100%;";
        const img = document.createElement("img");
        img.src = `photos/RAW/${item.slug}/thumb/${item.file}`;
        img.loading = "lazy";
        img.alt = "";
        btn.appendChild(img);
        btn.addEventListener("click", () => openLightbox(flatList.indexOf(item)));

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

        card.appendChild(btn);
        card.appendChild(star);
        grid.appendChild(card);
      });

      section.appendChild(grid);
      el.groups.appendChild(section);
    });
  }

  function openLightbox(index) {
    currentIndex = index;
    showCurrent();
    el.lightbox.classList.remove("hidden");
  }

  function closeLightbox() {
    el.lightbox.classList.add("hidden");
  }

  function step(dir) {
    if (!flatList.length) return;
    currentIndex = (currentIndex + dir + flatList.length) % flatList.length;
    showCurrent();
  }

  function showCurrent() {
    const item = flatList[currentIndex];
    if (!item) return closeLightbox();
    const src = `photos/RAW/${item.slug}/full/${item.file}`;
    el.lightboxImg.src = src;
    el.downloadBtn.href = src;
    el.downloadBtn.setAttribute("download", item.file);
    el.counter.textContent = t("photoOf", { current: currentIndex + 1, total: flatList.length });
    el.starBtn.classList.toggle("active", isFavorite(item.slug, item.file));
    if (zoomCtl) zoomCtl.reset(false);
  }

  el.closeLightbox.addEventListener("click", closeLightbox);
  el.prevBtn.addEventListener("click", () => step(-1));
  el.nextBtn.addEventListener("click", () => step(1));
  el.starBtn.addEventListener("click", () => {
    const item = flatList[currentIndex];
    if (!item) return;
    toggleFavorite(item.slug, item.file);
    closeLightbox();
    render();
  });

  zoomCtl = attachZoom(el.lightbox, el.lightboxImg, {
    onSwipeLeft: () => step(1),
    onSwipeRight: () => step(-1),
  });

  document.addEventListener("keydown", (e) => {
    if (el.lightbox.classList.contains("hidden")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  el.downloadAllBtn.addEventListener("click", async () => {
    if (!flatList.length) return;
    const items = flatList.map((item) => ({
      name: `${item.slug}/${item.file}`,
      url: `photos/RAW/${item.slug}/full/${item.file}`,
    }));
    el.downloadAllBtn.disabled = true;
    try {
      const ok = await zipAndDownload(items, "my-starred-raw-photos.zip", (done, total) => {
        el.progressNote.textContent = t("preparingZip", { done, total });
      });
      el.progressNote.textContent = ok ? t("zipReady") : t("zipCancelled");
    } finally {
      el.downloadAllBtn.disabled = false;
      setTimeout(() => (el.progressNote.textContent = ""), 6000);
    }
  });

  document.addEventListener("favoriteschange", () => {
    if (!el.view.classList.contains("hidden")) render();
  });
}

function injectUI() {
  if (document.getElementById("rawStarredView")) return;
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="face-results-view hidden" id="rawStarredView">
      <div class="face-results-view__bar">
        <span class="face-results-view__count" id="rawStarredCount"></span>
        <div style="display:flex;gap:0.5rem;align-items:center;">
          <button class="action-btn secondary hidden" id="downloadStarredRawBtn" type="button" data-i18n="downloadAll">Download all</button>
          <button class="icon-btn icon-btn--dark" id="closeRawStarredView" type="button" data-i18n-attr="title:close" title="Close">&#10005;</button>
        </div>
      </div>
      <p class="favorites-empty hidden" id="rawStarredEmpty">
        <strong data-i18n="favoritesEmptyTitle">No starred photos yet</strong><br><br>
        <span data-i18n="favoritesEmptyBody">Browse the galleries and tap the star on any photo you love. It'll be saved here — even if you close the browser and come back later.</span>
      </p>
      <div id="rawStarredGroups"></div>
      <p class="progress-note" id="rawStarredProgressNote" style="text-align:center;"></p>
    </div>

    <div class="lightbox hidden" id="rawStarredLightbox">
      <div class="lightbox__counter" id="rawStarredLightboxCounter"></div>
      <div class="lightbox__bar">
        <button class="icon-btn star-btn" id="rawStarredStarBtn" type="button" data-i18n-attr="title:star" title="Star this photo">
          <svg viewBox="0 0 24 24"><path d="M12 2.5l3 6.6 7.2.7-5.4 4.9 1.6 7.1L12 17.8 5.6 21.8l1.6-7.1-5.4-4.9 7.2-.7z"/></svg>
        </button>
        <a class="icon-btn" id="rawStarredDownloadBtn" download data-i18n-attr="title:download" title="Download this photo">&#8681;</a>
        <button class="icon-btn" id="closeRawStarredLightbox" type="button" data-i18n-attr="title:close" title="Close">&#10005;</button>
      </div>
      <button class="lightbox__nav lightbox__prev" id="rawStarredPrevBtn" type="button" data-i18n-attr="title:previous" title="Previous">&#10094;</button>
      <img id="rawStarredLightboxImg" alt="">
      <button class="lightbox__nav lightbox__next" id="rawStarredNextBtn" type="button" data-i18n-attr="title:next" title="Next">&#10095;</button>
    </div>
  `;
  while (wrap.firstChild) document.body.appendChild(wrap.firstChild);
  if (typeof applyTranslations === "function") applyTranslations();
}
