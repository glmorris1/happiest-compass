import { access, cp, mkdir, rm } from "node:fs/promises";

const files = [
  "index.html",
  "styles.css",
  "app.js",
  "manifest.webmanifest",
  "vercel.json",
  ".nojekyll",
];

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await mkdir("dist/assets", { recursive: true });

await Promise.all(files.map((file) => cp(file, `dist/${file}`)));
await copyIfPresent("assets/app-icon-1024.png", "dist/assets/app-icon-1024.png");
await copyIfPresent("assets/apple-touch-icon.png", "dist/assets/apple-touch-icon.png");
await copyIfPresent("assets/share-thumbnail-360.png", "dist/assets/share-thumbnail-360.png");
await copyIfPresent("lanikai-beach", "dist/lanikai-beach");
await cp("minis.config.json", "dist/minis.config.json");

async function copyIfPresent(from, to) {
  try {
    await access(from);
    await cp(from, to, { recursive: true });
  } catch {
    // Optional assets and extra pages are not required for the main web app to run.
  }
}
