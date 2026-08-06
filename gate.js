/* ============================================================
   Wedding Gallery — simple visitor gate
   Asks a first-time visitor for their name + phone number before
   letting them into the site. No OTP, no password — just a log of
   who stopped by. The answer is remembered in localStorage so the
   same device is never asked again. The submission is also sent to
   a Google Apps Script webhook that appends a row to a Google Sheet
   (see SETUP.md for the one-time setup).
   ============================================================ */

const GATE_KEY = "wedding-visitor-verified";

// Fill this in after deploying the Apps Script web app (see SETUP.md).
// Leave as-is to skip logging — the gate still works, it just won't record anyone.
const GATE_WEBHOOK_URL = "";

function initGate() {
  if (localStorage.getItem(GATE_KEY)) return;

  const overlay = document.createElement("div");
  overlay.className = "gate-overlay";
  overlay.innerHTML = `
    <div class="gate-card">
      <h2>${t("gateTitle")}</h2>
      <p>${t("gateBody")}</p>
      <input type="text" id="gateName" placeholder="${t("gateNamePlaceholder")}" autocomplete="name">
      <input type="tel" id="gatePhone" placeholder="${t("gatePhonePlaceholder")}" autocomplete="tel">
      <p class="gate-error hidden" id="gateError">${t("gateError")}</p>
      <button type="button" class="action-btn" id="gateSubmit">${t("gateSubmit")}</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const nameInput = document.getElementById("gateName");
  const phoneInput = document.getElementById("gatePhone");
  const errorEl = document.getElementById("gateError");

  function submit() {
    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();
    if (!name || !phone) {
      errorEl.classList.remove("hidden");
      return;
    }
    const record = { name, phone, page: location.pathname, at: new Date().toISOString() };
    localStorage.setItem(GATE_KEY, JSON.stringify(record));

    if (GATE_WEBHOOK_URL) {
      fetch(GATE_WEBHOOK_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(record),
      }).catch(() => {});
    }

    document.body.style.overflow = "";
    overlay.remove();
  }

  document.getElementById("gateSubmit").addEventListener("click", submit);
  [nameInput, phoneInput].forEach((input) => {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
  });
}

document.addEventListener("DOMContentLoaded", initGate);
