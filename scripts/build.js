/* SOS · SafeOrbitForSattelites — smart build: skip tsc only when dist is up to date.
   Replaces the old "skip if dist exists" one-liner so `npm run build` actually
   recompiles after server/src changes. Cross-platform (no shell helpers). */
(function () {
  "use strict";

  const fs = require("fs");
  const path = require("path");
  const { execFileSync } = require("child_process");

  const root = path.resolve(__dirname, "..");
  const tsconfig = path.join(root, "server", "tsconfig.json");
  const distEntry = path.join(root, "server", "dist", "index.js");
  const srcDir = path.join(root, "server", "src");
  const tscBin = path.join(root, "node_modules", "typescript", "bin", "tsc");

  function newestMtime(dir, ext) {
    let newest = 0;
    if (!fs.existsSync(dir)) return newest;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const sub = newestMtime(full, ext);
        if (sub > newest) newest = sub;
      } else if (entry.isFile() && entry.name.endsWith(ext)) {
        const m = fs.statSync(full).mtimeMs;
        if (m > newest) newest = m;
      }
    }
    return newest;
  }

  function runTsc() {
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
  }

  // No dist at all → must build.
  if (!fs.existsSync(distEntry)) {
    runTsc();
    console.log("build: done (fresh build).");
    return;
  }

  const distMtime = fs.statSync(distEntry).mtimeMs;
  const srcNewest = newestMtime(srcDir, ".ts");

  // Also consider tsconfig itself as a source of staleness.
  const tsMtime = fs.existsSync(tsconfig) ? fs.statSync(tsconfig).mtimeMs : 0;
  const newestInput = Math.max(srcNewest, tsMtime);

  if (newestInput > distMtime) {
    runTsc();
    console.log("build: done (rebuilt " + (srcNewest > distMtime ? "stale sources" : "tsconfig change") + ").");
  } else {
    console.log("build: server/dist is up to date — skipping tsc.");
  }
})();
