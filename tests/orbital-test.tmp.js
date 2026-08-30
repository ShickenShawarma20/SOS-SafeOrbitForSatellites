const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: "new",
    args: ["--no-sandbox", "--use-gl=angle", "--enable-webgl", "--ignore-gpu-blocklist"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE: " + m.text()); });
  await page.goto("http://localhost:3000/index.html", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 3500));
  const result = await page.evaluate(() => {
    const v = window.sosOrbitalViewer;
    if (!v) return { ok: false, reason: "no viewer" };
    return {
      ok: true,
      useThree: v.useThree,
      hasRenderer: !!v.renderer,
      earthMapped: !!(v.earth && v.earth.material.map),
      canvasSize: [v.canvas.width, v.canvas.height],
    };
  });
  await page.evaluate(() => document.getElementById("orbitalCanvas").scrollIntoView({ block: "center" }));
  await new Promise((r) => setTimeout(r, 1500));
  await page.screenshot({ path: "C:\\Users\\Lenovo\\AppData\\Local\\Temp\\opencode\\orbital-check.png", clip: await page.evaluate(() => { const r = document.getElementById("orbitalCanvas").getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }) });
  console.log(JSON.stringify(result));
  console.log(errors.length ? errors.join("\n") : "no page errors");
  await browser.close();
})().catch((e) => { console.error("SCRIPT FAIL:", e.message); process.exit(1); });
