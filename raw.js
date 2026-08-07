/* ============================================================
   Wedding Gallery — RAW photos placeholder
   A separate password checkpoint (same word as the main site gate)
   specifically for the RAW photo section, since it's meant to be
   more restricted than the regular galleries. There's nothing to
   show yet — this just proves the gate works, ready for the real
   RAW gallery to be dropped in later.
   ============================================================ */

const RAW_PASSWORD = "may7";
const RAW_KEY = "wedding-raw-verified";

function normalize(v) {
  return v.trim().toLowerCase().replace(/[\s\-,]/g, "");
}

function showContent() {
  document.getElementById("rawGate").classList.add("hidden");
  document.getElementById("rawContent").classList.remove("hidden");
}

function submit() {
  const input = document.getElementById("rawPasswordInput");
  const error = document.getElementById("rawPasswordError");
  if (normalize(input.value) === RAW_PASSWORD) {
    localStorage.setItem(RAW_KEY, "1");
    showContent();
  } else {
    error.classList.remove("hidden");
    input.value = "";
    input.focus();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem(RAW_KEY)) {
    showContent();
    return;
  }
  document.getElementById("rawPasswordSubmit").addEventListener("click", submit);
  document.getElementById("rawPasswordInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
});
