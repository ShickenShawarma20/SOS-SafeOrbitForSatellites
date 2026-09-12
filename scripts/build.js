/* SOS · SafeOrbitForSattelites — build: always recompile server/src -> server/dist.
   Cross-platform (no shell helpers). */
(function () {
  "use strict";

  const fs = require("fs");
  const path = require("path");
  const { execFileSync } = require("child_process");

  const root = path.resolve(__dirname, "..");
  const tsconfig = path.join(root, "server", "tsconfig.json");
  const tscBin = path.join(root, "node_modules", "typescript", "bin", "tsc");

  if (!fs.existsSync(tscBin)) {
    console.error("build: typescript not installed — run `npm install` first.");
    process.exit(1);
  }

  console.log("build: compiling server/src -> server/dist (tsc)…");
  try {
    execFileSync(process.execPath, [tscBin, "-p", tsconfig], { stdio: "inherit", cwd: root });
  } catch (e) {
    console.error("build: tsc failed.");
    process.exit(typeof e.status === "number" ? e.status : 1);
  }
  console.log("build: tsc done.");

  /* ── esbuild bundle ──
   * Bundle server/dist/index.js (and all its node_modules dependencies) into a
   * single self-contained file at server/dist/bundle.js.
   * This prevents Vercel's @vercel/node builder from attempting to transpile
   * ESM-only packages like satellite.js v7, which use `export * as` syntax
   * that its internal Babel pipeline does not support. */
  const esbuildBin = path.join(root, "node_modules", ".bin", "esbuild");
  const esbuildPkg = path.join(root, "node_modules", "esbuild");

  if (fs.existsSync(esbuildPkg)) {
    console.log("build: bundling server/dist/index.js -> server/dist/bundle.js (esbuild)…");
    try {
      execFileSync(
        process.execPath,
        [
          path.join(esbuildPkg, "bin", "esbuild"),
          "server/dist/index.js",
          "--bundle",
          "--platform=node",
          "--target=node18",
          "--format=cjs",
          "--outfile=server/dist/bundle.js",
          "--external:puppeteer-core",
        ],
        { stdio: "inherit", cwd: root }
      );
      console.log("build: esbuild bundle done.");
    } catch (e) {
      console.error("build: esbuild bundle failed, falling back to unbundled output.");
    }
  } else {
    console.log("build: esbuild not found, skipping bundle step.");
  }
})();
