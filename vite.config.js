import { existsSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import restart from "vite-plugin-restart";

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log("[vite.config] LOADED FROM", new URL(import.meta.url).pathname);

function getMpaInputs() {
  const srcDir = resolve(__dirname, "src");

  // Always include the menu page at /
  const inputs = {
    index: resolve(srcDir, "index.html"),
  };

  const dirs = readdirSync(srcDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const dir of dirs) {
    const htmlPath = resolve(srcDir, dir, "index.html");
    if (existsSync(htmlPath)) inputs[dir] = htmlPath;
  }

  return inputs;
}

console.log("[vite.config] ROOT", resolve(__dirname, "src"));

export default {
  appType: "mpa",
  root: resolve(__dirname, "src"),
  publicDir: resolve(__dirname, "static"),
  resolve: {
    alias: {
      textures: resolve(__dirname, "static/textures"),
    },
  },
  server: {
    host: true,
    open: "/", // open the menu page
  },
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: getMpaInputs(),
    },
  },
  plugins: [restart({ restart: ["static/**"] })],
};
