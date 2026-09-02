/* ============================================================
   Wedding Gallery — RAW photos gate
   A separate password checkpoint (its own word, different from the
   main site gate) shared by raw.html and every raw-gallery.html
   category page, since RAW is meant to be more restricted than the
   regular galleries. Once entered correctly, it's cached for 6 hours
   (not tied to the tab or browser session) — after that it asks again.
   ============================================================ */

const RAW_PASSWORD = "ss";
const RECOVERY_PHONES = ["7356765614", "7559953372"];
const ATTEMPTS_BEFORE_FORGOT = 4;
const RAW_CACHE_KEY = "wedding-raw-verified-until";
const RAW_CACHE_MS = 6 * 60 * 60 * 1000; // 6 hours

let failedAttempts = 0;

function isRawVerified() {
  const until = Number(localStorage.getItem(RAW_CACHE_KEY) || 0);
  return Date.now() < until;
}

function markRawVerified() {
  localStorage.setItem(RAW_CACHE_KEY, String(Date.now() + RAW_CACHE_MS));
}

function normalize(v) {
  return v.trim().toLowerCase().replace(/[\s\-,]/g, "");
}

function normalizePhone(v) {
  return v.replace(/\D/g, "");
}

function showContent() {
  document.getElementById("rawGate").classList.add("hidden");
  document.getElementById("rawContent").classList.remove("hidden");
}

function submit() {
  const input = document.getElementById("rawPasswordInput");
  const error = document.getElementById("rawPasswordError");
  if (normalize(input.value) === RAW_PASSWORD) {
    markRawVerified();
    showContent();
    return;
  }

  error.classList.remove("hidden");
  input.value = "";
  input.focus();

  failedAttempts++;
  if (failedAttempts >= ATTEMPTS_BEFORE_FORGOT) {
    document.getElementById("forgotPasswordBtn").classList.remove("hidden");
  }
}

function checkPhone() {
  const input = document.getElementById("forgotPhoneInput");
  const error = document.getElementById("forgotPhoneError");
  const reveal = document.getElementById("forgotPhoneReveal");

  if (RECOVERY_PHONES.includes(normalizePhone(input.value))) {
    error.classList.add("hidden");
    reveal.textContent = t("forgotPhoneReveal", { password: RAW_PASSWORD });
    reveal.classList.remove("hidden");
  } else {
    reveal.classList.add("hidden");
    error.classList.remove("hidden");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (isRawVerified()) {
    showContent();
    return;
  }

  document.getElementById("rawPasswordSubmit").addEventListener("click", submit);
  document.getElementById("rawPasswordInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });

  document.getElementById("forgotPasswordBtn").addEventListener("click", () => {
    document.getElementById("forgotPasswordBtn").classList.add("hidden");
    document.getElementById("forgotPasswordPanel").classList.remove("hidden");
  });

  document.getElementById("forgotPhoneSubmit").addEventListener("click", checkPhone);
  document.getElementById("forgotPhoneInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkPhone();
  });
});
