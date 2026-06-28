const { chromium } = require("playwright");
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const PORT = 18082;
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
      viewport: { width: 1280, height: 800 },
      hasTouch: false,
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));

    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: "networkidle" });

    const boot = await page.evaluate(() => ({
      mobileClass: document.body.classList.contains("is-mobile-ui"),
      touchHidden: document.getElementById("touchControls")?.hidden,
      drawerHidden: document.getElementById("statsDrawerToggle")?.hidden,
      fullscreenHidden: document.getElementById("fullscreenBtn")?.hidden,
    }));

    if (boot.mobileClass) throw new Error("is-mobile-ui should not apply at 1280px desktop");
    if (!boot.touchHidden) throw new Error("touch controls should be hidden on desktop");
    if (!boot.drawerHidden) throw new Error("stats drawer toggle should be hidden on desktop");
    if (!boot.fullscreenHidden) throw new Error("fullscreen btn should be hidden on desktop");

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
      const style = tc ? getComputedStyle(tc) : null;
      return {
        hidden: tc?.hidden,
        display: style?.display,
        mobileClass: document.body.classList.contains("is-mobile-ui"),
      };
    });

    if (playing.mobileClass) throw new Error("is-mobile-ui during play on desktop");
    if (!playing.hidden) throw new Error("touch controls visible during play on desktop");
    if (playing.display !== "none") throw new Error(`touch controls display should be none, got ${playing.display}`);

    const statsAfterStart = await page.evaluate(() => {
      const panel = document.getElementById("statsPanel");
      const canvas = document.getElementById("gameCanvas");
      const panelStyle = panel ? getComputedStyle(panel) : null;
      const canvasBox = canvas?.getBoundingClientRect();
      const panelBox = panel?.getBoundingClientRect();
      return {
        hidden: panel?.classList.contains("is-hidden"),
        display: panelStyle?.display,
        position: panelStyle?.position,
        canvasCenterX: canvasBox ? canvasBox.left + canvasBox.width / 2 : 0,
        panelLeft: panelBox?.left ?? 0,
        viewportCenterX: window.innerWidth / 2,
      };
    });
    if (statsAfterStart.hidden) throw new Error("stats panel should be visible during play");
    if (statsAfterStart.display === "none") throw new Error("stats panel display should not be none during play");
    if (statsAfterStart.position !== "absolute") {
      throw new Error(`stats panel should be absolute on desktop, got ${statsAfterStart.position}`);
    }
    if (Math.abs(statsAfterStart.canvasCenterX - statsAfterStart.viewportCenterX) > 8) {
      throw new Error("canvas should be horizontally centered in viewport");
    }
    if (statsAfterStart.panelLeft < statsAfterStart.canvasCenterX) {
      throw new Error("stats panel should sit to the right of canvas center");
    }

    await page.evaluate(() => {
      const panel = document.getElementById("statsPanel");
      if (panel) panel.classList.add("is-hidden");
      const clear = document.getElementById("stageClearOverlay");
      if (clear) clear.classList.remove("hidden");
    });
    await page.click("#nextStageBtn");
    await page.waitForTimeout(400);

    const statsAfterNext = await page.evaluate(() => ({
      hidden: document.getElementById("statsPanel")?.classList.contains("is-hidden"),
      level: document.getElementById("level")?.textContent,
    }));
    if (statsAfterNext.hidden) throw new Error("stats panel should reappear after proceedToNextStage");
    if (statsAfterNext.level !== "2") throw new Error(`expected level 2 after next stage, got ${statsAfterNext.level}`);

    if (errors.length) throw new Error("JS errors: " + errors.join("; "));

    console.log("OK: desktop stats panel layout and post-stage visibility");
    await browser.close();
    process.exit(0);
  } catch (e) {
    console.error("FAIL:", e.message);
    process.exit(1);
  } finally {
    server.kill();
  }
})();