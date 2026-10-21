// Copy the pipeline's generated files (repo-root data/) into public/data/ for Astro to serve.
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const web = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(web, "..", "data");
const dest = join(web, "public", "data");

if (!existsSync(join(src, "puzzles.json"))) {
  console.error(`No puzzles.json in ${src}. Run the pipeline first (see CLAUDE.md).`);
  process.exit(1);
}
rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
for (const f of ["puzzles.json", "vocab.json", "vectors.bin"]) {
  cpSync(join(src, f), join(dest, f));
}
console.log(`Synced data/ -> ${dest}`);
