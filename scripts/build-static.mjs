import { cp, mkdir, rm } from "node:fs/promises";

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
await cp("assets/app-icon-1024.png", "dist/assets/app-icon-1024.png");
await cp("assets/share-thumbnail-360.png", "dist/assets/share-thumbnail-360.png");
await cp("minis.config.json", "dist/minis.config.json");
