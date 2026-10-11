/* ============================================================
   Wedding Gallery — Android TV mode
   Only active inside the Android TV app, which appends
   "ShahinSneha-TV" to the WebView user agent (a plain ?tv=1 in a
   normal browser does nothing, so it can't be used to skip the
   passwords). In TV mode we:
     - skip the main password, visitor gate and RAW password
     - add a "tv" class → big D-pad focus rings (tv.css), hide
       actions a remote can't do (file pickers, zips, share)
     - make the photo viewer remote-friendly:
         ← / →  previous / next      OK  play/pause slideshow
         ↑      star / unstar        Back  close viewer
   ============================================================ */
(function () {
  if (navigator.userAgent.indexOf("ShahinSneha-TV") === -1) return;

  try {
    localStorage.setItem("wedding-password-verified", "1");
    localStorage.setItem("wedding-visitor-verified", JSON.stringify({ name: "TV", phone: "tv" }));
    localStorage.setItem("wedding-raw-verified-until", String(Date.now() + 365 * 24 * 60 * 60 * 1000));
  } catch (e) {}

  document.documentElement.classList.add("tv");
  var link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "tv.css";
  document.head.appendChild(link);

  function openLightbox() {
    return document.querySelector(".lightbox:not(.hidden)");
  }

  document.addEventListener("keydown", function (e) {
    var lb = openLightbox();
    if (!lb) return;
    var k = e.key;
    if (k === "ArrowLeft" || k === "ArrowRight" || k === "ArrowUp" || k === "ArrowDown") {
      e.preventDefault(); // stop focus wandering in the grid behind the viewer
    }
    if (k === "ArrowUp") {
      var star = lb.querySelector(".star-btn");
      if (star) star.click();
    } else if (k === "Enter" || k === " ") {
      var play = lb.querySelector("[id$='lideshowBtn']");
      if (play) { play.click(); e.preventDefault(); }
    } else if (k === "Escape" || k === "BrowserBack" || k === "GoBack") {
      var close = lb.querySelector("[id^='close']");
      if (close) { close.click(); e.preventDefault(); }
    }
  }, true);

  // Land focus on the first sensible control so the remote works immediately.
  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
      if (document.activeElement && document.activeElement !== document.body) return;
      var first = document.querySelector(".event-card, .photo-card button, .slideshow-cta, .action-btn");
      if (first) first.focus();
    }, 500);
  });

})();
