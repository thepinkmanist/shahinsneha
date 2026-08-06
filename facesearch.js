/* ============================================================
   Wedding Gallery — "find someone in the photos" face search
   Runs entirely on-device with face-api.js. Visitor can upload
   several selfies (e.g. themselves + a spouse) and the search
   returns every photo containing a face that matches ANY of them,
   downloadable together as one zip.
   ============================================================ */

import { zipAndDownload } from "./zip.js";

const MATCH_THRESHOLD = 0.5;
const MODEL_URL = "models";

const slug = document.body.dataset.event;

const el = {
  openBtn: document.getElementById("openFaceSearchBtn"),
  modal: document.getElementById("faceModal"),
  closeBtn: document.getElementById("closeFaceModal"),
  selfieList: document.getElementById("selfieList"),
  selfieInput: document.getElementById("selfieInput"),
  searchBtn: document.getElementById("searchFacesBtn"),
  status: document.getElementById("faceStatus"),
  downloadMatchesBtn: document.getElementById("downloadMatchesBtn"),
};

if (el.openBtn) {
  const state = {
    modelsLoaded: false,
    faceIndex: null, // [{file, descriptors:[[...]]}] once loaded
    queryDescriptors: [], // one per uploaded selfie
    matches: [], // list of file names
  };

  el.openBtn.addEventListener("click", () => el.modal.classList.remove("hidden"));
  el.closeBtn.addEventListener("click", () => el.modal.classList.add("hidden"));
  el.selfieInput.addEventListener("change", onSelfiesSelected);
  el.searchBtn.addEventListener("click", runSearch);
  el.downloadMatchesBtn.addEventListener("click", downloadMatches);

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
    try {
      const res = await fetch(`data/${slug}-faces.json`);
      if (!res.ok) throw new Error("no index");
      state.faceIndex = await res.json();
    } catch {
      state.faceIndex = [];
    }
    return state.faceIndex;
  }

  async function onSelfiesSelected(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    el.status.textContent = "";
    el.downloadMatchesBtn.classList.add("hidden");

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
      el.selfieInput.value = "";
    } catch (err) {
      console.error(err);
      el.status.textContent = "Something went wrong reading that photo.";
    }
  }

  async function runSearch() {
    if (!state.queryDescriptors.length) return;
    el.status.textContent = t("searchingFaces");
    el.downloadMatchesBtn.classList.add("hidden");

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
      if (isMatch) matched.push(entry.file);
    });

    state.matches = matched;

    if (!matched.length) {
      el.status.textContent = t("facesNotFound");
      return;
    }
    el.status.textContent = t("facesFound", { n: matched.length });
    el.downloadMatchesBtn.classList.remove("hidden");
  }

  async function downloadMatches() {
    const items = state.matches.map((file) => ({
      name: file,
      url: `photos/${slug}/full/${file}`,
    }));
    el.downloadMatchesBtn.disabled = true;
    try {
      await zipAndDownload(items, `${slug}-matches.zip`, (done, total) => {
        el.status.textContent = t("preparingZip", { done, total });
      });
      el.status.textContent = t("zipReady");
    } finally {
      el.downloadMatchesBtn.disabled = false;
    }
  }
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
