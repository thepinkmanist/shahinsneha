/* ============================================================
   Wedding Gallery — Android TV mode
   The Android TV app loads the site with ?tv=1 (remembered in
   localStorage after that). In TV mode we add a "tv" class that
   turns on big remote-friendly focus rings (tv.css) and hides
   actions that make no sense on a TV: file pickers/camera (face
   search), zip downloads, share, per-photo download.
   ============================================================ */
(function () {
  try {
    var params = new URLSearchParams(location.search);
    if (params.get("tv") === "1") localStorage.setItem("wedding-tv-mode", "1");
    if (params.get("tv") === "0") localStorage.removeItem("wedding-tv-mode");
    if (localStorage.getItem("wedding-tv-mode") !== "1") return;
  } catch (e) { return; }

  document.documentElement.classList.add("tv");
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "tv.css";
  document.head.appendChild(link);

  // Land focus on the first sensible control so the remote works immediately.
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
      if (document.activeElement && document.activeElement !== document.body) return;
      var first = document.querySelector(
        ".event-card, #rawPasswordInput:not(.hidden), #passwordInput, .photo-card button, .slideshow-cta, .action-btn"
      );
      if (first) first.focus({ preventScroll: false });
    }, 400);
  });

  // Remote Back / Escape closes an open lightbox before leaving the page.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape" && e.key !== "BrowserBack") return;
    var lb = document.querySelector(".lightbox:not(.hidden)");
    if (lb) {
      var close = lb.querySelector("#closeLightbox, #closeRawStarredLightbox, #closeFaceLightbox");
      if (close) { close.click(); e.preventDefault(); }
    }
  });
})();
