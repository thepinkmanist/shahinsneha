// Same idea as process.mjs but for the RAW photo categories: generates a
// thumbnail per photo (for fast browsing) and a JSON manifest sorted by
// EXIF capture time, while leaving the full-resolution files untouched.
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import exifrPkg from "exifr";
const { parse: exifParse } = exifrPkg;

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_ROOT = path.join(ROOT, "photos", "RAW");
const DATA_ROOT = path.join(ROOT, "data");

const CATEGORIES = [
  { dir: "Court Wedding", slug: "court-wedding", fallbackDate: "2026-05-07" },
  { dir: "Groom Reception", slug: "groom-reception", fallbackDate: "2026-05-09" },
  { dir: "Bride Reception", slug: "bride-reception", fallbackDate: "2026-05-17" },
  { dir: "Pre-Wedding", slug: "pre-wedding", fallbackDate: "2026-05-01" },
];

const THUMB_WIDTH = 420;
const THUMB_QUALITY = 68;

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

async function processCategory(cat) {
  const rawSrcDir = path.join(SRC_ROOT, cat.dir);
  const fullDir = path.join(SRC_ROOT, cat.slug, "full");
  const thumbDir = path.join(SRC_ROOT, cat.slug, "thumb");

  // Windows/macOS filesystems are case-insensitive, so "Pre-Wedding" (the
  // source) and "pre-wedding" (the slug's output dir) can be the SAME
  // folder — a subfolder created "inside" the slug dir actually lands
  // inside the source dir, and later deleting the source wipes the output
  // too. Stage the source under a name that cannot collide with any slug
  // before creating the output dirs, exactly like process.mjs does.
  const srcDir = path.join(ROOT, "_staging", "raw-" + cat.slug);
  await fs.mkdir(path.dirname(srcDir), { recursive: true });
  await fs.rm(srcDir, { recursive: true, force: true });
  await fs.rename(rawSrcDir, srcDir);

  await fs.mkdir(fullDir, { recursive: true });
  await fs.mkdir(thumbDir, { recursive: true });

  const entries = (await fs.readdir(srcDir)).filter((f) => /\.jpe?g$/i.test(f));
  console.log(`\n[${cat.slug}] ${entries.length} photos`);

  const manifest = [];
  let done = 0;

  for (const file of entries) {
    const srcPath = path.join(srcDir, file);
    const fullPath = path.join(fullDir, file);
    const thumbPath = path.join(thumbDir, file);

    const takenAt = await getTakenAt(srcPath, cat.fallbackDate);

    await fs.copyFile(srcPath, fullPath);

    await sharp(srcPath, { failOn: "none" })
      .rotate()
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: THUMB_QUALITY, progressive: true, mozjpeg: true })
      .toFile(thumbPath);

    manifest.push({ file, takenAt });
    done++;
    if (done % 100 === 0 || done === entries.length) {
      process.stdout.write(`  ${done}/${entries.length}\r`);
    }
  }

  manifest.sort((a, b) => new Date(a.takenAt) - new Date(b.takenAt));
  await fs.writeFile(
    path.join(DATA_ROOT, `raw-${cat.slug}.json`),
    JSON.stringify(manifest, null, 2)
  );

  // Belt-and-suspenders, same as process.mjs: only delete the original
  // flat folder if it's provably a different real path from what we
  // just wrote to (guards against case-insensitive filesystem collisions).
  const [realSrc, realFull, realThumb] = await Promise.all([
    fs.realpath(srcDir),
    fs.realpath(fullDir),
    fs.realpath(thumbDir),
  ]);
  if (realSrc === realFull || realSrc === realThumb) {
    throw new Error(`Refusing to delete ${srcDir}: resolves to the same path as its output dir`);
  }
  await fs.rm(srcDir, { recursive: true, force: true });

  console.log(`[${cat.slug}] done — ${manifest.length} photos`);
  return manifest.length;
}

const only = process.argv.slice(2);
const toRun = only.length ? CATEGORIES.filter((c) => only.includes(c.slug)) : CATEGORIES;

const results = {};
for (const cat of toRun) {
  results[cat.slug] = await processCategory(cat);
}
console.log("\nAll done:", results);
