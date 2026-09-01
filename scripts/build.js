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
  console.log("build: done.");
})();
