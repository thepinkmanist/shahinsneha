// One-off build script: reads original event photos, extracts EXIF "date
// taken", generates a small thumbnail per photo for fast grid browsing,
// and writes per-event JSON manifests sorted chronologically. The full-size
// originals are left completely untouched (only moved into their event
// folder) so the lightbox always shows true original quality.
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import exifrPkg from "exifr";
const { parse: exifParse } = exifrPkg;

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_ROOT = path.join(ROOT, "photos");
const DATA_ROOT = path.join(ROOT, "data");

const EVENTS = [
  { dir: "prewedding", slug: "prewedding", fallbackDate: "2026-04-20" },
  { dir: "Registration", slug: "registration", fallbackDate: "2026-05-07" },
  { dir: "Reception 1", slug: "reception1", fallbackDate: "2026-05-09" },
  { dir: "Reception 2", slug: "reception2", fallbackDate: "2026-05-17" },
];

const THUMB_WIDTH = 480;
const THUMB_QUALITY = 72;

async function getTakenAt(filePath, fallbackDate) {
  try {
    const buf = await fs.readFile(filePath);
    const meta = await exifParse(buf, { pick: ["DateTimeOriginal", "CreateDate", "ModifyDate"] });
    const d = meta?.DateTimeOriginal || meta?.CreateDate || meta?.ModifyDate;
    if (d instanceof Date && !isNaN(d)) return d.toISOString();
  } catch {
    // fall through to fallback
  }
  return new Date(fallbackDate + "T00:00:00").toISOString();
}

async function processEvent(event) {
  const rawSrcDir = path.join(SRC_ROOT, event.dir);
  const thumbDir = path.join(SRC_ROOT, event.slug, "thumb");
  const fullDir = path.join(SRC_ROOT, event.slug, "full");

  // Windows/macOS filesystems are case-insensitive, so an output dir like
  // photos/registration can silently be the SAME folder as a source dir
  // like photos/Registration. Stage the source under a name that cannot
  // collide with any slug before creating the output dirs, so the final
  // cleanup rm() can never eat the files we just wrote.
  const srcDir = path.join(ROOT, "_staging", event.slug);
  await fs.mkdir(path.dirname(srcDir), { recursive: true });
  await fs.rm(srcDir, { recursive: true, force: true });
  await fs.rename(rawSrcDir, srcDir);

  await fs.mkdir(thumbDir, { recursive: true });
  await fs.mkdir(fullDir, { recursive: true });

  const entries = (await fs.readdir(srcDir)).filter((f) => /\.(jpe?g|png)$/i.test(f));
  console.log(`\n[${event.slug}] ${entries.length} photos`);

  const manifest = [];
  let done = 0;

  for (const file of entries) {
    const srcPath = path.join(srcDir, file);
    const thumbPath = path.join(thumbDir, file.replace(/\.png$/i, ".jpg"));
    const fullPath = path.join(fullDir, file);

    const takenAt = await getTakenAt(srcPath, event.fallbackDate);

    // Full-size photo: moved as-is, byte-for-byte untouched — no re-encode, no resize.
    await fs.copyFile(srcPath, fullPath);

    // Thumbnail: a separate small derived file, just for fast grid browsing.
    await sharp(srcPath, { failOn: "none" })
      .rotate()
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: THUMB_QUALITY, progressive: true, mozjpeg: true })
      .toFile(thumbPath);

    manifest.push({ file, thumb: path.basename(thumbPath), takenAt });
    done++;
    if (done % 50 === 0 || done === entries.length) {
      process.stdout.write(`  ${done}/${entries.length}\r`);
    }
  }

  manifest.sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt));

  await fs.writeFile(
    path.join(DATA_ROOT, `${event.slug}.json`),
    JSON.stringify(manifest, null, 2)
  );

  // Belt-and-suspenders: only delete the staged source if it is provably a
  // different real path from the output dirs we just wrote to.
  const [realSrc, realFull, realThumb] = await Promise.all([
    fs.realpath(srcDir),
    fs.realpath(fullDir),
    fs.realpath(thumbDir),
  ]);
  if (realSrc === realFull || realSrc === realThumb) {
    throw new Error(`Refusing to delete ${srcDir}: resolves to the same path as its output dir`);
  }
  await fs.rm(srcDir, { recursive: true, force: true });

  console.log(`[${event.slug}] done — ${manifest.length} photos, sorted by capture time`);
  return manifest.length;
}

const only = process.argv.slice(2); // optional list of slugs to (re)process
const eventsToRun = only.length ? EVENTS.filter((e) => only.includes(e.slug)) : EVENTS;

const results = {};
for (const event of eventsToRun) {
  results[event.slug] = await processEvent(event);
}

console.log("\nAll done:", results);
