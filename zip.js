// ============================================================
// Wedding Gallery — streaming ZIP download helper
// Full-resolution photos are large, so this streams the zip
// straight to disk via the File System Access API when the
// browser supports it (Chrome/Edge), instead of buffering the
// whole archive in memory. Falls back to a plain blob download
// on browsers that don't support it (Safari, Firefox).
// ============================================================
import { downloadZip } from "./vendor/client-zip.js";

// client-zip needs each entry's `input` to already be a resolved File/Response
// — not a pending fetch() promise — so fetch happens one at a time here as
// the generator is pulled, keeping memory low while staying spec-compliant.
async function* toEntries(items, onProgress) {
  let done = 0;
  for (const item of items) {
    const res = await fetch(item.url);
    done++;
    if (onProgress) onProgress(done, items.length);
    yield { name: item.name, input: res };
  }
}

export async function zipAndDownload(items, zipName, onProgress) {
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: zipName,
        types: [{ description: "Zip archive", accept: { "application/zip": [".zip"] } }],
      });
      const writable = await handle.createWritable();
      const response = downloadZip(toEntries(items, onProgress));
      await response.body.pipeTo(writable);
      return true;
    } catch (err) {
      if (err.name === "AbortError") return false; // visitor cancelled the save dialog
      console.warn("Streaming save failed, falling back to in-memory download", err);
    }
  }

  const response = downloadZip(toEntries(items, onProgress));
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 15000);
  return true;
}
