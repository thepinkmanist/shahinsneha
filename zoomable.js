/* ============================================================
   Wedding Gallery — pinch-to-zoom / pan / swipe for the lightbox
   Dedicated gesture handling (rather than relying on the browser's
   whole-page pinch-zoom) so only the photo zooms, the buttons stay
   put, and a plain swipe still moves to the next/previous photo.
   Also supports double-tap / double-click to toggle zoom.
   ============================================================ */

const MAX_SCALE = 4;
const DOUBLE_TAP_ZOOM = 2.4;
const SWIPE_THRESHOLD = 50;

export function attachZoom(containerEl, imgEl, { onSwipeLeft, onSwipeRight } = {}) {
  const pointers = new Map();
  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pinchStartDist = 0;
  let pinchStartScale = 1;
  let panStart = null;
  let swipeStartX = null;
  let swipeStartY = null;
  let lastTap = 0;

  imgEl.style.touchAction = "none";
  imgEl.style.transformOrigin = "center center";

  function apply(animated) {
    imgEl.style.transition = animated ? "transform 0.2s ease" : "none";
    imgEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function reset(animated) {
    scale = 1;
    tx = 0;
    ty = 0;
    apply(animated);
  }

  function clampPan() {
    if (scale <= 1) {
      tx = 0;
      ty = 0;
      return;
    }
    const rect = imgEl.getBoundingClientRect();
    const maxX = Math.max(0, (rect.width * scale - rect.width) / 2 / scale);
    const maxY = Math.max(0, (rect.height * scale - rect.height) / 2 / scale);
    tx = Math.min(maxX, Math.max(-maxX, tx));
    ty = Math.min(maxY, Math.max(-maxY, ty));
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  containerEl.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button, a")) return;
    containerEl.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchStartDist = dist(a, b);
      pinchStartScale = scale;
      panStart = null;
      swipeStartX = null;
    } else if (pointers.size === 1) {
      if (scale > 1.02) {
        panStart = { x: e.clientX, y: e.clientY, tx, ty };
        swipeStartX = null;
      } else {
        swipeStartX = e.clientX;
        swipeStartY = e.clientY;
        panStart = null;
      }
    }
  });

  containerEl.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = dist(a, b);
      scale = Math.min(MAX_SCALE, Math.max(1, pinchStartScale * (d / pinchStartDist)));
      clampPan();
      apply(false);
    } else if (pointers.size === 1 && panStart) {
      tx = panStart.tx + (e.clientX - panStart.x) / scale;
      ty = panStart.ty + (e.clientY - panStart.y) / scale;
      clampPan();
      apply(false);
    }
  });

  function endPointer(e) {
    const wasSingle = pointers.size === 1;
    const start = { x: swipeStartX, y: swipeStartY };
    pointers.delete(e.pointerId);

    if (pointers.size === 0) {
      if (scale < 1.02) reset(true);

      // Double-tap toggles zoom.
      const now = Date.now();
      if (wasSingle && scale <= 1.02 && now - lastTap < 320) {
        lastTap = 0;
        scale = DOUBLE_TAP_ZOOM;
        clampPan();
        apply(true);
        return;
      }
      lastTap = wasSingle && scale <= 1.02 ? now : 0;

      // Plain swipe (only when not zoomed in) moves to next/previous photo.
      if (wasSingle && scale <= 1.02 && start.x !== null) {
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
          if (dx > 0 && onSwipeRight) onSwipeRight();
          else if (dx < 0 && onSwipeLeft) onSwipeLeft();
        }
      }
      panStart = null;
      swipeStartX = null;
      swipeStartY = null;
    }
  }

  containerEl.addEventListener("pointerup", endPointer);
  containerEl.addEventListener("pointercancel", endPointer);

  containerEl.addEventListener("dblclick", (e) => {
    if (e.target.closest("button, a")) return;
    if (scale > 1.02) {
      reset(true);
    } else {
      scale = DOUBLE_TAP_ZOOM;
      clampPan();
      apply(true);
    }
  });

  return { reset };
}
