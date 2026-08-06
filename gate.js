/* ============================================================
   Wedding Gallery — password lock + visitor gate
   First-time visitors on a device see a (playful) password screen,
   then a quick name + phone prompt. Both are remembered in
   localStorage so the same device is never asked again. The name/
   phone submission is also sent to a Google Apps Script webhook that
   appends a row to a Google Sheet (see SETUP.md for the one-time
   setup).
   ============================================================ */

const PASSWORD_KEY = "wedding-password-verified";
const GATE_KEY = "wedding-visitor-verified";
const PASSWORD = "may7";

// Fill this in after deploying the Apps Script web app (see SETUP.md).
// Leave as-is to skip logging — the gate still works, it just won't record anyone.
const GATE_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxz1kANJJdVKgGrxKCVvqNOG60RsO3KHuFQIhtoaZvKZnwQGgd0e7LjWlcaOkoiXTAw8Q/exec";

const WRONG_MESSAGES = [
  "Nope! Try again, secret agent 🕵️",
  "Access denied. The vault door remains firmly shut 🚪",
  "That's not it… and no, we won't give hints 🤐",
  "Wrong! A guard llama has been dispatched 🦙",
  "Incorrect. Please try harder, this is very important 🧐",
];

function normalize(v) {
  return v.trim().toLowerCase().replace(/[\s\-,]/g, "");
}

function initGate() {
  if (!localStorage.getItem(PASSWORD_KEY)) {
    showPasswordLock();
  } else {
    showVisitorGateIfNeeded();
  }
}

function showPasswordLock() {
  const overlay = document.createElement("div");
  overlay.className = "gate-overlay";
  overlay.innerHTML = `
    <div class="gate-card" id="pwCard">
      <div class="gate-emoji" id="pwEmoji">🔐</div>
      <h2>${t("passwordTitle")}</h2>
      <p>${t("passwordBody")}</p>
      <input type="text" id="pwInput" placeholder="${t("passwordPlaceholder")}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false">
      <p class="gate-error hidden" id="pwError"></p>
      <button type="button" class="action-btn" id="pwSubmit">${t("passwordSubmit")}</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const input = document.getElementById("pwInput");
  const card = document.getElementById("pwCard");
  const emoji = document.getElementById("pwEmoji");
  const errorEl = document.getElementById("pwError");
  let wrongCount = 0;

  function submit() {
    if (normalize(input.value) === PASSWORD) {
      localStorage.setItem(PASSWORD_KEY, "1");
      celebrate(overlay, card, emoji);
    } else {
      wrongCount++;
      emoji.textContent = "🙅";
      errorEl.textContent = WRONG_MESSAGES[Math.min(wrongCount - 1, WRONG_MESSAGES.length - 1)];
      errorEl.classList.remove("hidden");
      card.classList.remove("gate-shake");
      void card.offsetWidth; // restart the animation even on repeated wrong guesses
      card.classList.add("gate-shake");
      input.value = "";
      input.focus();
      setTimeout(() => (emoji.textContent = "🔐"), 900);
    }
  }

  document.getElementById("pwSubmit").addEventListener("click", submit);
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
}

function celebrate(overlay, card, emoji) {
  card.classList.add("gate-success");
  emoji.textContent = "🎉";
  card.querySelector("h2").textContent = t("passwordSuccessTitle");
  card.querySelector("p").textContent = t("passwordSuccessBody");
  card.querySelector("#pwInput").classList.add("hidden");
  card.querySelector("#pwError").classList.add("hidden");
  card.querySelector("#pwSubmit").classList.add("hidden");

  const confettiBits = ["🎉", "✨", "💛", "🎊", "🥳"];
  for (let i = 0; i < 16; i++) {
    const bit = document.createElement("span");
    bit.className = "confetti-bit";
    bit.textContent = confettiBits[i % confettiBits.length];
    bit.style.setProperty("--dx", `${(Math.random() - 0.5) * 260}px`);
    bit.style.setProperty("--dy", `${(Math.random() - 0.5) * 260}px`);
    bit.style.setProperty("--rot", `${(Math.random() - 0.5) * 360}deg`);
    bit.style.left = "50%";
    bit.style.top = "45%";
    card.appendChild(bit);
  }

  setTimeout(() => {
    document.body.style.overflow = "";
    overlay.remove();
    showVisitorGateIfNeeded();
  }, 1300);
}

function showVisitorGateIfNeeded() {
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
