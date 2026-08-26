const puppeteer = require("puppeteer-core");
(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    headless: "new",
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  const all = [];
  page.on("console", (m) => all.push(m.type().toUpperCase() + ": " + m.text()));
  page.on("pageerror", (e) => all.push("PAGEERROR: " + e.message));
  await page.goto("http://localhost:3000/satellite.html", { waitUntil: "networkidle2", timeout: 30000 });
  await new Promise((r) => setTimeout(r, 4000));
  const r = await page.evaluate(() => ({
    rows: document.querySelectorAll("#satTableBody tr").length,
    firstRow: document.querySelector("#satTableBody tr") ? document.querySelector("#satTableBody tr").innerText.slice(0, 80) : "",
    count: document.getElementById("satListCount").textContent,
    listHidden: document.getElementById("satListView").hasAttribute("hidden"),
  }));
  console.log("RESULT: " + JSON.stringify(r));
  console.log(all.length ? all.join("\n") : "(no console)");
  await browser.close();
})().catch((e) => { console.error("SCRIPT FAIL:", e.message); process.exit(1); });
