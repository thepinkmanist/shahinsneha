/* ============================================================
   Wedding Gallery — background music
   A single shared track, controllable from a small sticky button
   on every page. State (playing/paused, volume, playback position)
   is kept in localStorage so turning it on anywhere and later
   opening the slideshow picks the same track back up rather than
   restarting it. First-ever play (from either the sticky button or
   the slideshow auto-starting it) fades in over 10 seconds; resuming
   on a new page load jumps straight to the saved volume, since a
   repeated fade on every navigation would be more annoying than nice.
   ============================================================ */

const MUSIC_SRC = "music/slideshow-music.mp3";
const STATE_KEY = "wedding-music-state";
const FADE_MS = 10000;
const DEFAULT_VOLUME = 0.2;

let audio = null;
let fadeTimer = null;

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STATE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveState(patch) {
  const next = { ...loadState(), ...patch };
  localStorage.setItem(STATE_KEY, JSON.stringify(next));
  return next;
}

function ensureAudio() {
  if (audio) return audio;
  audio = new Audio(MUSIC_SRC);
  audio.loop = true;
  audio.preload = "auto";
  return audio;
}

function fadeVolumeTo(target, ms) {
  clearInterval(fadeTimer);
  const steps = 50;
  const stepMs = ms / steps;
  const start = audio.volume;
  let i = 0;
  fadeTimer = setInterval(() => {
    i++;
    audio.volume = Math.max(0, Math.min(1, start + (target - start) * (i / steps)));
    if (i >= steps) clearInterval(fadeTimer);
  }, stepMs);
}

function play({ fade = false } = {}) {
  const s = loadState();
  const vol = s.volume ?? DEFAULT_VOLUME;
  ensureAudio();
  if (Math.abs((audio.currentTime || 0) - (s.position || 0)) > 1.5) {
    audio.currentTime = s.position || 0;
  }
  audio.volume = fade ? 0 : vol;

  // Mobile browsers silently reject play() unless it's called directly
  // inside a fresh tap — that happens for the sticky button itself, but
  // NOT for resuming on a new page load or the slideshow auto-starting
  // it. Only mark state as "playing" once playback actually starts, so
  // a blocked attempt leaves the wiggling button inviting a real tap
  // instead of lying about what's audible.
  audio
    .play()
    .then(() => {
      if (fade) fadeVolumeTo(vol, FADE_MS);
      saveState({ playing: true, volume: vol });
      refreshUI();
    })
    .catch(() => {
      saveState({ playing: false });
      refreshUI();
    });
}

function pause() {
  clearInterval(fadeTimer);
  if (audio) saveState({ playing: false, position: audio.currentTime || 0 });
  else saveState({ playing: false });
  if (audio) audio.pause();
  refreshUI();
}

function toggle() {
  const s = loadState();
  if (s.playing) pause();
  else play({ fade: !s.everPlayed });
  if (!s.everPlayed) saveState({ everPlayed: true });
}

function setVolume(v) {
  ensureAudio();
  clearInterval(fadeTimer);
  audio.volume = v;
  saveState({ volume: v });
}

/* ---------------- Persist position periodically ---------------- */

setInterval(() => {
  if (audio && !audio.paused) saveState({ position: audio.currentTime, playing: true });
}, 3000);

window.addEventListener("pagehide", () => {
  if (audio) saveState({ position: audio.currentTime, playing: !audio.paused });
});

/* ---------------- Sticky global button (injected on every page) ---------------- */

const listeners = [];

function refreshUI() {
  const s = loadState();
  listeners.forEach((fn) => fn(s));
}

function buildStickyButton() {
  // Slideshow has its own minimal mute/volume controls built into the
  // viewer itself, so it opts out of the floating global button.
  if (document.body.hasAttribute("data-no-music-widget")) return;
  if (document.getElementById("musicToggle")) return;

  const wrap = document.createElement("div");
  wrap.className = "music-widget";
  wrap.innerHTML = `
    <input type="range" id="musicVolume" class="music-widget__volume hidden" min="0" max="1" step="0.05" aria-label="Music volume">
    <button type="button" id="musicToggle" class="music-widget__btn" title="Play background music">
      <svg viewBox="0 0 24 24"><path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>
    </button>
  `;
  document.body.appendChild(wrap);

  const btn = document.getElementById("musicToggle");
  const volume = document.getElementById("musicVolume");
  const s0 = loadState();
  volume.value = s0.volume ?? DEFAULT_VOLUME;

  btn.addEventListener("click", toggle);
  volume.addEventListener("input", () => setVolume(parseFloat(volume.value)));

  listeners.push((s) => {
    btn.classList.toggle("music-widget__btn--playing", !!s.playing);
    btn.classList.toggle("music-widget__btn--wiggle", !s.playing);
    volume.classList.toggle("hidden", !s.playing);
    volume.value = s.volume ?? DEFAULT_VOLUME;
    btn.title = s.playing ? "Pause music" : "Play background music";
  });
  refreshUI();
}

/* ---------------- Public API for pages that want their own controls (slideshow) ---------------- */

window.WeddingMusic = {
  play,
  pause,
  toggle,
  setVolume,
  isPlaying: () => !!loadState().playing,
  getVolume: () => loadState().volume ?? DEFAULT_VOLUME,
  onChange: (fn) => {
    listeners.push(fn);
    fn(loadState());
  },
};

document.addEventListener("DOMContentLoaded", () => {
  buildStickyButton();
  const s = loadState();
  if (s.playing) {
    ensureAudio();
    play({ fade: false });
  }
});
