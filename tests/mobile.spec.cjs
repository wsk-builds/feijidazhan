const { chromium, devices } = require("playwright");
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const PORT = 18081;
const ROOT = path.join(__dirname, "..");

function waitForServer(port, timeout = 8000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeout) reject(new Error("server timeout"));
        else setTimeout(tick, 200);
      });
    };
    tick();
  });
}

(async () => {
  const server = spawn("python", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], {
    cwd: ROOT,
    shell: true,
    stdio: "ignore",
  });
  try {
    await waitForServer(PORT);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      ...devices["iPhone 13"],
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "networkidle" });

    const boot = await page.evaluate(() => ({
      mobileClass: document.body.classList.contains("is-mobile-ui"),
      manifest: !!document.querySelector('link[rel="manifest"]'),
      touchControls: !!document.getElementById("touchControls"),
      drawerToggle: !!document.getElementById("statsDrawerToggle"),
    }));

    if (!boot.mobileClass) throw new Error("is-mobile-ui not applied at 375px");
    if (!boot.manifest) throw new Error("manifest link missing");
    if (!boot.touchControls || !boot.drawerToggle) throw new Error("mobile chrome missing");

    await page.click("#startBtn");
    await page.waitForTimeout(900);

    const tutorialVisible = await page.evaluate(() =>
      !document.getElementById("mobileTutorial")?.classList.contains("hidden")
    );
    if (tutorialVisible) {
      await page.click("#mobileTutorialDismiss");
      await page.waitForTimeout(600);
    }

    const playing = await page.evaluate(() => {
      const tc = document.getElementById("touchControls");
      return tc && !tc.hidden;
    });
    if (!playing) throw new Error("touch controls not visible during play");

    const canvas = page.locator("#gameCanvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("canvas not laid out");

    await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.7);
    await page.waitForTimeout(400);

    if (errors.length) throw new Error("JS errors: " + errors.join("; "));

    console.log("OK: mobile UI boot, tutorial, touch controls, canvas touch");
    await browser.close();
    process.exit(0);
  } catch (e) {
    console.error("FAIL:", e.message);
    process.exit(1);
  } finally {
    server.kill();
  }
})();