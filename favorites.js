/* ============================================================
   Wedding Gallery — favorites ("star") cart
   Persisted in localStorage so a visitor can star photos, close
   the tab, and come back later to finish and download them.
   Shape: { registration: ["file.jpg", ...], reception1: [...], reception2: [...] }
   ============================================================ */

const FAVORITES_KEY = "wedding-favorites";

function readFavorites() {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY)) || {};
  } catch {
    return {};
  }
}

function writeFavorites(data) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(data));
  document.dispatchEvent(new CustomEvent("favoriteschange", { detail: favoritesCount() }));
}

function isFavorite(slug, file) {
  const data = readFavorites();
  return (data[slug] || []).includes(file);
}

function toggleFavorite(slug, file) {
  const data = readFavorites();
  const list = data[slug] || [];
  const idx = list.indexOf(file);
  if (idx === -1) {
    list.push(file);
  } else {
    list.splice(idx, 1);
  }
  data[slug] = list;
  writeFavorites(data);
  return idx === -1; // true if now favorited
}

function favoritesCount() {
  const data = readFavorites();
  return Object.values(data).reduce((sum, list) => sum + list.length, 0);
}

// Returns a flat list of { slug, file } for every starred photo.
function favoritesList() {
  const data = readFavorites();
  const out = [];
  Object.keys(data).forEach((slug) => {
    (data[slug] || []).forEach((file) => out.push({ slug, file }));
  });
  return out;
}

function clearFavorites() {
  localStorage.removeItem(FAVORITES_KEY);
  document.dispatchEvent(new CustomEvent("favoriteschange", { detail: 0 }));
}

function initFavoritesBadge() {
  document.querySelectorAll("[data-favorites-count]").forEach((el) => {
    el.textContent = favoritesCount();
  });
  document.addEventListener("favoriteschange", (e) => {
    document.querySelectorAll("[data-favorites-count]").forEach((el) => {
      el.textContent = e.detail;
    });
  });
}

document.addEventListener("DOMContentLoaded", initFavoritesBadge);
