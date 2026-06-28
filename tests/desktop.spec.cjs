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
    if (statsAfterStart.position === "absolute" || statsAfterStart.position === "fixed") {
      throw new Error(`stats panel should not overlay canvas (got ${statsAfterStart.position})`);
    }
    const layoutCheck = await page.evaluate(() => {
      const canvas = document.getElementById("gameCanvas");
      const panel = document.getElementById("statsPanel");
      const layout = document.querySelector(".game-layout");
      const gameMain = document.querySelector(".game-main");
      const canvasBox = canvas?.getBoundingClientRect();
      const panelBox = panel?.getBoundingClientRect();
      const layoutStyle = layout ? getComputedStyle(layout) : null;
      const gameMainStyle = gameMain ? getComputedStyle(gameMain) : null;
      const panelStyle = panel ? getComputedStyle(panel) : null;
      return {
        layoutDisplay: layoutStyle?.display || "",
        layoutDir: layoutStyle?.flexDirection || "",
        gameMainWidth: gameMainStyle?.width || "",
        panelPosition: panelStyle?.position || "",
        canvasRight: canvasBox?.right ?? 0,
        panelLeft: panelBox?.left ?? 0,
        gap: (panelBox?.left ?? 0) - (canvasBox?.right ?? 0),
        overlap: canvasBox && panelBox ? panelBox.left < canvasBox.right - 2 : true,
      };
    });
    if (layoutCheck.overlap) {
      throw new Error(`stats panel overlaps canvas (panelLeft=${layoutCheck.panelLeft}, canvasRight=${layoutCheck.canvasRight})`);
    }
    if (layoutCheck.gap < 8) {
      throw new Error(`expected gap between canvas and stats panel, got ${layoutCheck.gap}px`);
    }
    if (layoutCheck.layoutDisplay !== "flex" || layoutCheck.layoutDir !== "row") {
      throw new Error(`game-layout should be flex row, got ${layoutCheck.layoutDisplay} ${layoutCheck.layoutDir}`);
    }
    if (!layoutCheck.gameMainWidth.includes("480")) {
      throw new Error(`game-main should be 480px wide, got ${layoutCheck.gameMainWidth}`);
    }
    if (layoutCheck.panelPosition !== "static") {
      throw new Error(`stats panel should be static on desktop, got ${layoutCheck.panelPosition}`);
    }

    const speedCheck = await page.evaluate(() => ({
      statSpeed: document.getElementById("statSpeed")?.textContent?.trim() || "",
      mobileClass: document.body.classList.contains("is-mobile-ui"),
    }));
    if (speedCheck.mobileClass) throw new Error("is-mobile-ui during play on desktop (speed check)");
    if (!speedCheck.statSpeed.startsWith("8.5")) {
      throw new Error(`desktop base speed should be 8.5, got ${speedCheck.statSpeed}`);
    }

    await page.click("#helpBtn");
    await page.waitForTimeout(250);

    const collapsedLayout = await page.evaluate(() => {
      const layout = document.querySelector(".game-layout");
      const panel = document.getElementById("statsPanel");
      const gameMain = document.querySelector(".game-main");
      const layoutBox = layout?.getBoundingClientRect();
      const gameMainBox = gameMain?.getBoundingClientRect();
      return {
        panelHidden: panel?.classList.contains("is-hidden"),
        layoutWidth: layoutBox?.width ?? 0,
        gameMainWidth: gameMainBox?.width ?? 0,
      };
    });
    if (!collapsedLayout.panelHidden) throw new Error("stats panel should hide when manual overlay opens");
    if (collapsedLayout.layoutWidth > 490) {
      throw new Error(`layout should shrink to game-main width when stats hidden, got ${collapsedLayout.layoutWidth}`);
    }
    if (collapsedLayout.gameMainWidth > 490) {
      throw new Error(`game-main should stay ~480px when stats hidden, got ${collapsedLayout.gameMainWidth}`);
    }

    await page.click("#closeManualBtn");
    await page.waitForTimeout(250);

    const restoredLayout = await page.evaluate(() => {
      const panel = document.getElementById("statsPanel");
      const canvas = document.getElementById("gameCanvas");
      const canvasBox = canvas?.getBoundingClientRect();
      const panelBox = panel?.getBoundingClientRect();
      return {
        panelHidden: panel?.classList.contains("is-hidden"),
        overlap: canvasBox && panelBox ? panelBox.left < canvasBox.right - 2 : true,
      };
    });
    if (restoredLayout.panelHidden) throw new Error("stats panel should reappear after closing manual");
    if (restoredLayout.overlap) throw new Error("stats panel should sit beside canvas after closing manual");

    await page.evaluate(() => {
      const panel = document.getElementById("statsPanel");
      const clear = document.getElementById("stageClearOverlay");
      if (panel) panel.classList.add("is-hidden");
      if (clear) clear.classList.remove("hidden");
    });
    await page.click("#nextStageBtn");
    await page.waitForTimeout(400);

    const statsAfterNext = await page.evaluate(() => {
      const canvas = document.getElementById("gameCanvas");
      const panel = document.getElementById("statsPanel");
      const canvasBox = canvas?.getBoundingClientRect();
      const panelBox = panel?.getBoundingClientRect();
      return {
        hidden: panel?.classList.contains("is-hidden"),
        overlap: canvasBox && panelBox ? panelBox.left < canvasBox.right - 2 : true,
        level: document.getElementById("level")?.textContent,
        statSpeed: document.getElementById("statSpeed")?.textContent?.trim() || "",
      };
    });
    if (statsAfterNext.hidden) throw new Error("stats panel should reappear after proceedToNextStage");
    if (statsAfterNext.overlap) throw new Error("stats panel should sit beside canvas after proceedToNextStage");
    if (statsAfterNext.level !== "2") throw new Error(`expected level 2 after next stage, got ${statsAfterNext.level}`);
    if (!statsAfterNext.statSpeed.startsWith("8.5")) {
      throw new Error(`desktop speed should stay 8.5 on stage 2, got ${statsAfterNext.statSpeed}`);
    }

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