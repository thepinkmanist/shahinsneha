/* ============================================================
   Wedding Gallery — RAW photos placeholder
   A separate password checkpoint (its own word, different from the
   main site gate) specifically for the RAW photo section, since it's
   meant to be more restricted than the regular galleries. Unlike the
   main site gate, this one is NOT remembered — it asks again every
   time this page is visited. There's nothing to show yet — this just
   proves the gate works, ready for the real RAW gallery to be dropped
   in later.
   ============================================================ */

const RAW_PASSWORD = "ss";
const RECOVERY_PHONES = ["7356765614", "7559953372"];
const ATTEMPTS_BEFORE_FORGOT = 4;

let failedAttempts = 0;

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
