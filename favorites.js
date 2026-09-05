/* ============================================================
   Wedding Gallery — favorites ("star") cart
   Persisted in localStorage so a visitor can star photos, close
   the tab, and come back later to finish and download them.
   Shape: { registration: ["file.jpg", ...], reception1: [...], reception2: [...] }
   RAW category slugs share this same store (see raw-gallery.js /
   raw-favorites.js), but the public "My photos" page deliberately
   excludes them (favorites-page.js) since it isn't behind the RAW
   gate — so the main site's nav badge excludes them here too, or
   the number shown wouldn't match what that page actually lists.
   ============================================================ */

const FAVORITES_KEY = "wedding-favorites";
const RAW_SLUGS = new Set(["court-wedding", "groom-reception", "bride-reception", "pre-wedding"]);

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
  return Object.keys(data)
    .filter((slug) => !RAW_SLUGS.has(slug))
    .reduce((sum, slug) => sum + data[slug].length, 0);
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
