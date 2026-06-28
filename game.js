(function () {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const LOGICAL_W = 480;
  const LOGICAL_H = 640;
  const W = LOGICAL_W;
  const H = LOGICAL_H;
  const LOGIC_FPS = 60;
  const LOGIC_MS = 1000 / LOGIC_FPS;
  const MAX_CATCHUP_STEPS = 3;
  const audio = window.GameAudio;
  const sprites = window.GameSprites;
  const themes = window.GameThemes;
  const i18n = window.GameI18n;

  const scoreEl = document.getElementById("score");
  const playerHpBarEl = document.getElementById("playerHpBar");
  const playerHpTextEl = document.getElementById("playerHpText");
  const livesDisplayEl = document.getElementById("livesDisplay");
  const livesIconsEl = document.getElementById("livesIcons");
  const statHpEl = document.getElementById("statHp");
  const statLivesEl = document.getElementById("statLives");
  const levelEl = document.getElementById("level");
  const bombChargesEl = document.getElementById("bombCharges");
  const missileChargesEl = document.getElementById("missileCharges");

  const universeJumpOverlay = document.getElementById("universeJumpOverlay");
  const jumpBossNameEl = document.getElementById("jumpBossName");
  const jumpFromUniverseEl = document.getElementById("jumpFromUniverse");
  const jumpToUniverseEl = document.getElementById("jumpToUniverse");
  const jumpSkipBtn = document.getElementById("jumpSkipBtn");
  const universeLabelEl = document.getElementById("universeLabel");
  const stageClearOverlay = document.getElementById("stageClearOverlay");
  const stageClearLineEl = document.getElementById("stageClearLine");
  const stageClearScoreEl = document.getElementById("stageClearScore");
  const stageClearTotalEl = document.getElementById("stageClearTotal");
  const nextStageLineEl = document.getElementById("nextStageLine");
  const nextStageBtn = document.getElementById("nextStageBtn");
  const reachedStageLineEl = document.getElementById("reachedStageLine");
  const universeJumpBossLineEl = document.getElementById("universeJumpBossLine");
  const buffEl = document.getElementById("buff");
  const statSpeed = document.getElementById("statSpeed");
  const statWeapon = document.getElementById("statWeapon");
  const statDamage = document.getElementById("statDamage");
  const statFireRate = document.getElementById("statFireRate");
  const statShield = document.getElementById("statShield");
  const statBombsEl = document.getElementById("statBombs");
  const statMissilesEl = document.getElementById("statMissiles");
  const buffListEl = document.getElementById("buffList");
  const hudBuffBarsEl = document.getElementById("hudBuffBars");
  const overlay = document.getElementById("overlay");
  const gameOverOverlay = document.getElementById("gameOverOverlay");
  const finalScoreEl = document.getElementById("finalScore");
  const startBtn = document.getElementById("startBtn");
  const restartBtn = document.getElementById("restartBtn");
  const muteBtn = document.getElementById("muteBtn");
  const helpBtn = document.getElementById("helpBtn");
  const manualOverlay = document.getElementById("manualOverlay");
  const openManualBtn = document.getElementById("openManualBtn");
  const closeManualBtn = document.getElementById("closeManualBtn");
  const manualFromGameOverBtn = document.getElementById("manualFromGameOverBtn");
  const statsPanel = document.getElementById("statsPanel");
  const touchControlsEl = document.getElementById("touchControls");
  const bombBtn = document.getElementById("bombBtn");
  const missileBtn = document.getElementById("missileBtn");
  const bombBtnCountEl = document.getElementById("bombBtnCount");
  const missileBtnCountEl = document.getElementById("missileBtnCount");
  const statsDrawerToggle = document.getElementById("statsDrawerToggle");
  const statsDrawerClose = document.getElementById("statsDrawerClose");
  const fullscreenBtn = document.getElementById("fullscreenBtn");
  const landscapeHintEl = document.getElementById("landscapeHint");
  const mobileTutorialEl = document.getElementById("mobileTutorial");
  const mobileTutorialDismiss = document.getElementById("mobileTutorialDismiss");

  const MOBILE_TUTORIAL_KEY = "feijidazhan_mobile_tutorial_v1";
  const TOUCH_DRAG_LERP = 0.48;
  const SNAP_DIST = 12;
  const DESKTOP_BASE_SPEED = 8.5;
  const MOBILE_SPEED_SCALE = 0.78;

  const keys = {};
  let mouseTarget = null;
  let mouseMarker = null;
  let isMobileUI = false;
  let particleScale = 1;
  let cosmosDensity = 1;
  let trailMax = 14;
  let touchDrag = { active: false, x: W / 2, y: H - 80, pointerId: null };
  let touchRafId = 0;
  let pendingTouchClient = null;
  let lastLoopTime = 0;
  let logicAccum = 0;
  let mobileTutorialPending = false;
  let gameState = "menu";
  let stateBeforeManual = "menu";
  let totalScore = 0;
  let stageScore = 0;
  let stageKills = 0;
  let playerHp = 4;
  let lives = 3;
  let respawnAnim = null;
  let stage = 1;
  let frame = 0;
  let invincibleUntil = 0;
  let stagePhase = "assault";
  let universeIndex = 0;
  let currentTheme = themes.getTheme(0);
  let playerThemePalette = currentTheme.player;
  let stageBossSpawned = false;
  let stageVictoryDelay = -1;
  let stageAllySpawned = false;
  let stageRebelSpawned = false;
  let universeJumpTimer = null;
  let pickupToast = null;
  let lastHealthFrame = -99999;
  let bombCharges = 0;
  let missileCharges = 0;
  let deployedMines = [];
  let playerMissiles = [];

  const PLAYER_MAX_HP = 4;
  const MAX_LIVES = 5;
  const RESPAWN_ANIM_FRAMES = 72;
  const HEALTH_COOLDOWN = 3600;
  const HEALTH_CRITICAL_CHANCE = 0.05;
  const HEALTH_BOSS_CHANCE = 0.35;
  const ENEMY_BULLET_SPEED_SCALE = 0.55;
  const EASTER_EGG_QUOTE_CHANCE = 0.12;
  const BOSS_ANCHOR_Y = H * 0.30;
  const MAX_DEPLOYED_MINES = 3;
  const MINE_FALL_SPEED = 2.8;
  const MINE_BOSS_DAMAGE = 4;
  const STAGE_VICTORY_PAUSE_FRAMES = 78;
  const ENEMY_BULLET_SOFT_CAP = 36;
  const ENEMY_BULLET_HARD_CAP = 52;
  const BOSS_FAN_REDUCE_AT = 40;

  const player = {
    x: W / 2, y: H - 80,
    width: 28, height: 32,
    hitboxWidth: 18, hitboxHeight: 22,
    baseSpeed: DESKTOP_BASE_SPEED, speed: DESKTOP_BASE_SPEED, shootCooldown: 0,
    prevX: W / 2, prevY: H - 80,
  };

  let playerTrail = [];

  const buffs = { power: 0, shield: 0, speed: 0, laser: 0 };
  const buffStacks = { power: 0, shield: 0, speed: 0, laser: 0 };
  const MAX_BUFF_STACK = 3;
  const CHEAT_CODES = ["maytheforce", "darkside", "omega7"];

  let bullets = [];
  let enemyBullets = [];
  let enemies = [];
  let powerUps = [];
  let particles = [];
  let cosmos = null;
  let floatingTexts = [];
  let allies = [];
  let flybys = [];
  let cheatBuffer = "";
  let titleClickCount = 0;
  let titleClickTimer = null;

  const ENEMY_TYPES = {
    scout: { width: 34, height: 30, hp: 1, speed: 0.8, score: 100, color: "#e74c3c", accent: "#ff6b6b", pattern: "scout" },
    interceptor: { width: 26, height: 36, hp: 1, speed: 1.4, score: 200, color: "#f39c12", accent: "#ffd93d", pattern: "interceptor" },
    gunship: { width: 44, height: 38, hp: 3, speed: 0.5, score: 450, color: "#9b59b6", accent: "#d4a5ff", pattern: "gunship", shootInterval: 100, bulletSpeed: 2.2 },
    phantom: { width: 30, height: 34, hp: 2, speed: 0.9, score: 300, color: "#3498db", accent: "#74c0fc", pattern: "phantom", zigzag: true },
    carrier: { width: 52, height: 42, hp: 4, speed: 0.4, score: 600, color: "#2ecc71", accent: "#6ee7b7", pattern: "carrier" },
    wraith: { width: 32, height: 34, hp: 2, speed: 1.0, score: 350, color: "#6c1d8a", accent: "#d946ef", pattern: "wraith", zigzag: true },
    meteor: { width: 46, height: 40, hp: 5, speed: 0.32, score: 550, color: "#8b6914", accent: "#fbbf24", pattern: "meteor" },
    tie_patrol: {
      width: 28, height: 28, hp: 1, speed: 1.1, score: 777,
      color: "#141414", accent: "#9aa0a6", pattern: "tie_patrol",
      shootInterval: 120, bulletSpeed: 2.0, noRotate: true, patrolDrift: true,
      easterEgg: true, codename: "帝国巡逻机",
    },
    dark_interceptor: {
      width: 34, height: 30, hp: 4, speed: 0.58, score: 1980,
      color: "#0a0a0a", accent: "#d62828", pattern: "dark_interceptor",
      shootInterval: 80, bulletSpeed: 2.1, noRotate: true, patrolDrift: true,
      easterEgg: true, codename: "黑暗先锋舰",
    },
    ember_hunter: {
      width: 30, height: 28, hp: 2, speed: 1.0, score: 888,
      color: "#7c2d12", accent: "#fb923c", pattern: "ember_hunter",
      shootInterval: 90, bulletSpeed: 2.0, noRotate: true, patrolDrift: true,
      easterEgg: true, codename: "余烬猎手",
    },
    spore_scout: {
      width: 32, height: 30, hp: 2, speed: 0.95, score: 888,
      color: "#14532d", accent: "#4ade80", pattern: "spore_scout",
      shootInterval: 0, noRotate: true, patrolDrift: true,
      easterEgg: true, codename: "孢子侦察艇",
    },
    holo_drone: {
      width: 26, height: 26, hp: 1, speed: 1.2, score: 777,
      color: "#312e81", accent: "#22d3ee", pattern: "holo_drone",
      shootInterval: 100, bulletSpeed: 2.1, noRotate: true, patrolDrift: true,
      easterEgg: true, codename: "全息无人机",
    },
  };

  const MINI_BOSS_TYPES = {
    mini_sentry: { width: 54, height: 48, hp: 16, speed: 0.38, score: 1200, color: "#c0392b", accent: "#ff6b6b", pattern: "boss_assault", shootInterval: 70, bulletSpeed: 2.8, name: "哨戒巡洋舰" },
    mini_striker: { width: 52, height: 46, hp: 14, speed: 0.42, score: 1100, color: "#8e44ad", accent: "#d4a5ff", pattern: "boss_commander", shootInterval: 0, spawnInterval: 200, name: "裂空突击艇" },
    mini_phantom: { width: 56, height: 50, hp: 18, speed: 0.35, score: 1400, color: "#2980b9", accent: "#74c0fc", pattern: "boss_storm", shootInterval: 58, bulletSpeed: 2.7, name: "幽灵指挥艇" },
    mini_ember: { width: 54, height: 48, hp: 16, speed: 0.4, score: 1250, color: "#b45309", accent: "#fb923c", pattern: "boss_assault", shootInterval: 68, bulletSpeed: 2.9, name: "余烬巡洋舰" },
    mini_magma: { width: 52, height: 46, hp: 15, speed: 0.43, score: 1150, color: "#9a3412", accent: "#f97316", pattern: "boss_commander", shootInterval: 0, spawnInterval: 195, name: "熔流突击艇" },
    mini_ash: { width: 56, height: 50, hp: 19, speed: 0.34, score: 1450, color: "#dc2626", accent: "#fcd34d", pattern: "boss_storm", shootInterval: 56, bulletSpeed: 2.8, name: "灰烬守卫舰" },
    mini_spore: { width: 54, height: 48, hp: 16, speed: 0.37, score: 1220, color: "#047857", accent: "#34d399", pattern: "boss_assault", shootInterval: 72, bulletSpeed: 2.7, name: "孢子守卫舰" },
    mini_vine: { width: 52, height: 46, hp: 14, speed: 0.41, score: 1120, color: "#065f46", accent: "#6ee7b7", pattern: "boss_commander", shootInterval: 0, spawnInterval: 205, name: "藤须突击艇" },
    mini_moss: { width: 56, height: 50, hp: 18, speed: 0.36, score: 1420, color: "#15803d", accent: "#a3e635", pattern: "boss_storm", shootInterval: 57, bulletSpeed: 2.6, name: "苔藓巡洋舰" },
    mini_neon: { width: 54, height: 48, hp: 15, speed: 0.44, score: 1180, color: "#c026d3", accent: "#e879f9", pattern: "boss_assault", shootInterval: 65, bulletSpeed: 3.0, name: "霓虹无人机" },
    mini_glitch: { width: 52, height: 46, hp: 14, speed: 0.45, score: 1100, color: "#7c3aed", accent: "#22d3ee", pattern: "boss_commander", shootInterval: 0, spawnInterval: 190, name: "故障猎手舰" },
    mini_pixel: { width: 56, height: 50, hp: 17, speed: 0.38, score: 1380, color: "#be185d", accent: "#f472b6", pattern: "boss_storm", shootInterval: 54, bulletSpeed: 2.9, name: "像素守卫舰" },
  };

  const MEGA_BOSS_TYPES = {
    mega_storm: { width: 96, height: 82, hp: 58, speed: 0.26, score: 8000, color: "#2980b9", accent: "#74c0fc", pattern: "boss_storm", shootInterval: 48, bulletSpeed: 2.9, name: "雷暴母舰" },
    mega_lava: { width: 100, height: 86, hp: 62, speed: 0.24, score: 8500, color: "#b45309", accent: "#fb923c", pattern: "boss_lava", shootInterval: 50, bulletSpeed: 3.0, name: "熔核巨舰" },
    mega_eco: { width: 98, height: 84, hp: 60, speed: 0.25, score: 8200, color: "#047857", accent: "#34d399", pattern: "boss_eco", shootInterval: 52, bulletSpeed: 2.8, name: "生态母舰", spawnInterval: 210 },
    mega_matrix: { width: 102, height: 88, hp: 65, speed: 0.28, score: 9000, color: "#7c3aed", accent: "#e879f9", pattern: "boss_matrix", shootInterval: 44, bulletSpeed: 3.1, name: "矩阵主宰" },
  };

  function getBossConfig(type) {
    return MINI_BOSS_TYPES[type] || MEGA_BOSS_TYPES[type];
  }

  const POWERUP_TYPES = {
    power: {
      label: "火力", fullName: "三连火力", shortDesc: "散射+强化",
      desc: "发射三连散射弹，持续 10 秒",
      color: "#ff4757", bgColor: "#4a0a10", borderColor: "#ff6b6b",
      icon: "spread", duration: 600, weight: 3,
    },
    shield: {
      label: "护盾", fullName: "能量护盾", shortDesc: "抵挡伤害",
      desc: "生成护盾，可抵挡一次攻击（8 秒）",
      color: "#3498db", bgColor: "#0a1a3a", borderColor: "#5dade2",
      icon: "shield", duration: 480, weight: 3,
    },
    speed: {
      label: "加速", fullName: "推进加速", shortDesc: "移速+75%",
      desc: "移动速度提升 75%，持续 8 秒",
      color: "#2ecc71", bgColor: "#0a2a18", borderColor: "#58d68d",
      icon: "speed", duration: 480, weight: 2,
    },
    bomb: {
      label: "炸药", fullName: "炸药包", shortDesc: "储备+1",
      desc: "获得 1 枚炸药储备，按 B 在屏幕布设下行地雷（预判 Boss 位置）",
      color: "#f39c12", bgColor: "#3a2200", borderColor: "#f5b041",
      icon: "bomb", duration: 0, weight: 1,
    },
    health: {
      label: "回血", fullName: "耐久补给", shortDesc: "耐久+1",
      desc: "恢复 1 点战机耐久（稀有掉落，满耐久或冷却中无法获得）",
      color: "#ff6b9d", bgColor: "#3a1028", borderColor: "#ff85b3",
      icon: "health", duration: 0, weight: 0,
    },
    life: {
      label: "备机", fullName: "备用战机", shortDesc: "命+1",
      desc: "增加 1 架同款备用战机（命耗尽时自动替换上场，上限 5）",
      color: "#fbbf24", bgColor: "#3a2800", borderColor: "#fcd34d",
      icon: "life", duration: 0, weight: 0,
    },
    laser: {
      label: "激光", fullName: "穿透激光", shortDesc: "穿透高伤",
      desc: "发射穿透激光，伤害 ×3（8 秒）",
      color: "#a855f7", bgColor: "#1a0830", borderColor: "#c084fc",
      icon: "laser", duration: 480, weight: 2,
    },
    missile: {
      label: "导弹", fullName: "追踪导弹", shortDesc: "储备+1",
      desc: "获得 1 次导弹齐射储备，按 V 发射 3 枚追踪导弹（优先锁定 Boss）",
      color: "#ff6b35", bgColor: "#3a1500", borderColor: "#ff8c42",
      icon: "missile", duration: 0, weight: 3,
    },
  };

  const BOSS_DROP_CHANCE = 0.72;
  const BOSS_MISSILE_CHANCE = 0.52;
  const BOSS_BOMB_CHANCE = 0.17;

  const BASE_ENEMY_COLORS = {};
  Object.keys(ENEMY_TYPES).forEach((k) => {
    BASE_ENEMY_COLORS[k] = { color: ENEMY_TYPES[k].color, accent: ENEMY_TYPES[k].accent };
  });
  const BASE_POWERUP_STYLES = {};
  Object.keys(POWERUP_TYPES).forEach((k) => {
    const p = POWERUP_TYPES[k];
    BASE_POWERUP_STYLES[k] = { color: p.color, bgColor: p.bgColor, borderColor: p.borderColor };
  });

  const ALL_OVERLAYS = [overlay, stageClearOverlay, universeJumpOverlay, gameOverOverlay, manualOverlay].filter(Boolean);

  function hideAllOverlays() {
    ALL_OVERLAYS.forEach((el) => {
      el.classList.add("hidden");
      el.classList.remove("is-exiting");
    });
  }

  function getPU(key) {
    return { ...POWERUP_TYPES[key], ...i18n.powerup(key) };
  }

  function gameFont(size, weight) {
    const fam = i18n.getLang() === "en" ? "Segoe UI, sans-serif" : "Microsoft YaHei, sans-serif";
    return `${weight || "bold"} ${size}px ${fam}`;
  }

  function relocalizeEntities() {
    enemies.forEach((e) => {
      if (e.isBoss) e.bossName = i18n.entity(e.type);
      if (e.easterEgg || e.codename) e.codename = i18n.entity(e.type);
    });
    allies.forEach((a) => {
      a.name = i18n.allyName(a.kind);
      a.hint = i18n.allyHint(a.kind);
    });
    flybys.forEach((f) => {
      if (f.kind === "rebel_scout") {
        f.codename = i18n.entity("rebel_scout");
        f.hint = i18n.t("rebel.hint");
      }
    });
    if (pickupToast && pickupToast.powerKey) {
      const cfg = getPU(pickupToast.powerKey);
      pickupToast.text = i18n.floatMsg("pickupToast", { name: cfg.fullName, desc: cfg.desc });
    }
  }

  function refreshI18n() {
    i18n.applyDOM();
    document.title = i18n.t("ui.gameTitle");
    const manualScrollEl = document.getElementById("manualScroll");
    if (manualScrollEl) manualScrollEl.innerHTML = i18n.getManualHtml();
    const langZhBtn = document.getElementById("langZhBtn");
    const langEnBtn = document.getElementById("langEnBtn");
    if (langZhBtn) langZhBtn.classList.toggle("is-active", i18n.getLang() === "zh");
    if (langEnBtn) langEnBtn.classList.toggle("is-active", i18n.getLang() === "en");

    if (hudSecretEl) hudSecretEl.title = i18n.t("ui.hudSecretTitle");
    bindManualEasterEgg();
    if (universeLabelEl) universeLabelEl.textContent = i18n.themeName(universeIndex);
    relocalizeEntities();
    updateHUD();
  }

  function bindManualEasterEgg() {
    const el = document.getElementById("manualEasterEgg");
    if (!el) return;
    el.title = i18n.t("easter.manualNoteTitle");
    el.onclick = () => showEasterEggToast(i18n.t("easter.manualNote"));
  }

  function setupCanvasDpr() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    canvas.width = Math.round(LOGICAL_W * dpr);
    canvas.height = Math.round(LOGICAL_H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return dpr;
  }

  function detectMobileUI() {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.matchMedia("(max-width: 768px)").matches;
    if (fine && !coarse) return false;
    if (!narrow) return false;
    return coarse;
  }

  function applyPerfTier() {
    if (isMobileUI) {
      particleScale = 0.55;
      cosmosDensity = 0.5;
      trailMax = 8;
    } else {
      particleScale = 1;
      cosmosDensity = 1;
      trailMax = 14;
    }
  }

  function updateMobileChrome() {
    if (!isMobileUI) {
      if (touchControlsEl) touchControlsEl.hidden = true;
      if (statsDrawerToggle) statsDrawerToggle.hidden = true;
      if (fullscreenBtn) fullscreenBtn.hidden = true;
      return;
    }
    const inPlay = gameState === "playing";
    if (touchControlsEl) touchControlsEl.hidden = !inPlay;
    if (statsDrawerToggle) statsDrawerToggle.hidden = !inPlay;
    if (fullscreenBtn) fullscreenBtn.hidden = false;
    updateTouchBadges();
  }

  function applyMobileUIMode() {
    document.body.classList.toggle("is-mobile-ui", isMobileUI);
    if (statsDrawerClose) statsDrawerClose.hidden = !isMobileUI;
    if (statsPanel && isMobileUI) {
      statsPanel.classList.add("is-hidden");
      statsPanel.classList.remove("drawer-open");
    }
    syncPlayerSpeed();
    updateMobileChrome();
    updateLandscapeHint();
  }

  function updateLandscapeHint() {
    if (!landscapeHintEl) return;
    const landscape = window.matchMedia("(orientation: landscape) and (max-height: 520px)").matches;
    landscapeHintEl.classList.toggle("hidden", !isMobileUI || !landscape);
  }

  function setStatsDrawerOpen(open) {
    if (!statsPanel || !isMobileUI) return;
    statsPanel.classList.toggle("drawer-open", open);
    statsPanel.classList.toggle("is-hidden", !open);
    if (statsDrawerToggle) statsDrawerToggle.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function setStatsPanelVisible(visible) {
    if (!statsPanel) return;
    if (isMobileUI) {
      if (!visible) setStatsDrawerOpen(false);
      return;
    }
    statsPanel.classList.toggle("is-hidden", !visible);
  }

  function resumePlayingChrome() {
    setStatsPanelVisible(true);
    updateMobileChrome();
  }

  function updateTouchBadges() {
    if (bombBtnCountEl) bombBtnCountEl.textContent = bombCharges > 0 ? String(bombCharges) : "";
    if (missileBtnCountEl) missileBtnCountEl.textContent = missileCharges > 0 ? String(missileCharges) : "";
    if (bombBtn) bombBtn.disabled = bombCharges <= 0 || gameState !== "playing";
    if (missileBtn) missileBtn.disabled = missileCharges <= 0 || gameState !== "playing";
  }

  function showOverlay(el) {
    hideAllOverlays();
    if (el) el.classList.remove("hidden");
    setStatsPanelVisible(false);
    updateMobileChrome();
  }

  if (ctx && !ctx.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function roundRect(x, y, w, h, r) {
      const radius = typeof r === "number" ? r : r?.[0] || 0;
      this.moveTo(x + radius, y);
      this.arcTo(x + w, y, x + w, y + h, radius);
      this.arcTo(x + w, y + h, x, y + h, radius);
      this.arcTo(x, y + h, x, y, radius);
      this.arcTo(x, y, x + w, y, radius);
      this.closePath();
    };
  }

  const STAGE_DEFINITIONS = [
    {
      name: "前哨渗透", goalKills: 10, spawnRate: 68,
      enemyPool: [{ type: "scout", weight: 1 }],
      dropChance: 0.11,
      powerupPool: ["power", "shield", "speed", "bomb", "missile"],
      powerupWeights: { power: 3, shield: 3, speed: 2, bomb: 3, missile: 3 },
      allyMission: false, rebelFlyby: false,
      tip: "击破 10 架侦察机，小怪持续来袭，达标后关底 Boss 登场",
    },
    {
      name: "乱流峡谷", goalKills: 14, spawnRate: 76,
      enemyPool: [{ type: "scout", weight: 0.55 }, { type: "interceptor", weight: 0.45 }],
      dropChance: 0.11,
      powerupPool: ["power", "shield", "speed", "bomb", "missile"],
      powerupWeights: { power: 3, shield: 2, speed: 2, bomb: 4, missile: 4 },
      allyMission: false, rebelFlyby: false,
      tip: "拦截机加入战场，注意走位",
    },
    {
      name: "幻影走廊", goalKills: 16, spawnRate: 72,
      enemyPool: [{ type: "scout", weight: 0.35 }, { type: "phantom", weight: 0.65 }],
      dropChance: 0.10,
      powerupPool: ["power", "shield", "speed", "laser", "bomb", "missile"],
      powerupWeights: { power: 2, shield: 2, speed: 2, laser: 2, bomb: 3, missile: 3 },
      allyMission: true, rebelFlyby: false,
      tip: "幻影机蛇形移动 · 偶现宇宙彩蛋敌机",
    },
    {
      name: "炮艇封锁线", goalKills: 18, spawnRate: 68,
      enemyPool: [{ type: "interceptor", weight: 0.3 }, { type: "gunship", weight: 0.7 }],
      dropChance: 0.10,
      powerupPool: ["power", "shield", "speed", "laser", "bomb", "missile"],
      powerupWeights: { power: 3, shield: 3, speed: 1, laser: 2, bomb: 4, missile: 4 },
      allyMission: false, rebelFlyby: false,
      tip: "炮艇会开火，优先击毁",
    },
    {
      name: "突击者要塞", goalKills: 15, spawnRate: 70,
      enemyPool: [{ type: "scout", weight: 0.4 }, { type: "gunship", weight: 0.6 }],
      dropChance: 0.10,
      powerupPool: ["power", "shield", "speed", "laser", "bomb", "missile"],
      powerupWeights: { power: 3, shield: 3, speed: 2, laser: 2, bomb: 4, missile: 4 },
      allyMission: false, rebelFlyby: false,
      tip: "本关镇守大 Boss，达标后立即决战",
    },
    {
      name: "幽灵宙域", goalKills: 20, spawnRate: 64,
      enemyPool: [{ type: "phantom", weight: 0.45 }, { type: "wraith", weight: 0.55 }],
      dropChance: 0.09,
      powerupPool: ["power", "shield", "speed", "laser", "bomb", "missile"],
      powerupWeights: { power: 2, shield: 2, speed: 2, laser: 3, bomb: 3, missile: 3 },
      allyMission: true, rebelFlyby: true,
      tip: "幽灵舰出没 · 可能遭遇同盟侦察彩蛋",
    },
    {
      name: "母舰外围", goalKills: 22, spawnRate: 60,
      enemyPool: [{ type: "gunship", weight: 0.35 }, { type: "carrier", weight: 0.65 }],
      dropChance: 0.09,
      powerupPool: ["power", "shield", "speed", "laser", "bomb", "missile"],
      powerupWeights: { power: 3, shield: 2, speed: 2, laser: 2, bomb: 4, missile: 4 },
      allyMission: false, rebelFlyby: false,
      tip: "母舰编队压境，达标后关底 Boss 登场",
    },
    {
      name: "陨石风暴带", goalKills: 24, spawnRate: 56,
      enemyPool: [{ type: "meteor", weight: 0.5 }, { type: "wraith", weight: 0.5 }],
      dropChance: 0.085,
      powerupPool: ["power", "shield", "speed", "laser", "bomb", "missile"],
      powerupWeights: { power: 2, shield: 3, speed: 2, laser: 2, bomb: 4, missile: 4 },
      allyMission: true, rebelFlyby: false,
      tip: "重型陨石舰横冲直撞",
    },
    {
      name: "雷暴核心", goalKills: 18, spawnRate: 58,
      enemyPool: [{ type: "carrier", weight: 0.4 }, { type: "gunship", weight: 0.6 }],
      dropChance: 0.10,
      powerupPool: ["power", "shield", "speed", "laser", "bomb", "missile"],
      powerupWeights: { power: 3, shield: 3, speed: 2, laser: 2, bomb: 5, missile: 5 },
      allyMission: false, rebelFlyby: true,
      tip: "雷暴走廊，弹幕密集",
    },
  ];

  function enrichStageDef(base, n) {
    const uni = themes.getUniverseIndex(n);
    const theme = themes.getTheme(uni);
    const endBossType = themes.getEndBossType(n);
    const isMega = themes.isMegaStage(n);
    const name = n <= STAGE_DEFINITIONS.length ? i18n.stageName(n) : i18n.endlessStageName(n);
    const tip = i18n.stageTip(n);
    return {
      ...base,
      universeIndex: uni,
      theme,
      endBossType,
      endBossName: i18n.entity(endBossType),
      isMegaStage: isMega,
      name,
      tip,
      easterEgg: { [theme.easterEggType]: theme.easterEggChance },
    };
  }

  function getStageDef(n) {
    if (n <= STAGE_DEFINITIONS.length) return enrichStageDef(STAGE_DEFINITIONS[n - 1], n);
    const tier = n - STAGE_DEFINITIONS.length;
    const pool = [
      { type: "scout", weight: 0.15 },
      { type: "interceptor", weight: 0.15 },
      { type: "phantom", weight: 0.15 },
      { type: "gunship", weight: 0.2 },
      { type: "wraith", weight: 0.15 },
      { type: "carrier", weight: 0.1 },
      { type: "meteor", weight: 0.1 },
    ];
    return enrichStageDef({
      goalKills: 20 + tier * 4,
      spawnRate: Math.max(42, 58 - tier * 2),
      enemyPool: pool,
      dropChance: Math.max(0.06, 0.075 - tier * 0.002),
      powerupPool: ["power", "shield", "speed", "laser", "bomb", "missile"],
      powerupWeights: { power: 3, shield: 2, speed: 2, laser: 2, bomb: 4, missile: 4 },
      allyMission: tier % 2 === 0,
      rebelFlyby: tier % 3 === 1,
    }, n);
  }

  function getStageDropChance() {
    return getStageDef(stage).dropChance;
  }

  function initBackground() {
    cosmos = sprites.initCosmos(W, H, currentTheme?.cosmos, cosmosDensity);
  }

  function applyThemedEnemyColors() {
    Object.keys(BASE_ENEMY_COLORS).forEach((type) => {
      if (ENEMY_TYPES[type]) Object.assign(ENEMY_TYPES[type], BASE_ENEMY_COLORS[type]);
    });
    const overrides = currentTheme?.enemies || {};
    Object.keys(overrides).forEach((type) => {
      if (ENEMY_TYPES[type]) Object.assign(ENEMY_TYPES[type], overrides[type]);
    });
  }

  function applyThemedPowerupColors() {
    Object.keys(BASE_POWERUP_STYLES).forEach((type) => {
      if (POWERUP_TYPES[type]) Object.assign(POWERUP_TYPES[type], BASE_POWERUP_STYLES[type]);
    });
    const overrides = currentTheme?.powerups || {};
    Object.keys(overrides).forEach((type) => {
      if (POWERUP_TYPES[type]) Object.assign(POWERUP_TYPES[type], overrides[type]);
    });
  }

  function applyUniverseTheme(index) {
    universeIndex = index % themes.UNIVERSE_THEMES.length;
    currentTheme = themes.getTheme(universeIndex);
    playerThemePalette = currentTheme.player;
    document.body.dataset.universe = String(universeIndex);
    if (universeLabelEl) universeLabelEl.textContent = i18n.themeName(universeIndex);
    applyThemedEnemyColors();
    applyThemedPowerupColors();
    initBackground();
    audio.setUniverse(universeIndex);
  }

  function resetBuffs() {
    buffs.power = buffs.shield = buffs.speed = buffs.laser = 0;
    buffStacks.power = buffStacks.shield = buffStacks.speed = buffStacks.laser = 0;
    syncPlayerSpeed();
  }

  function applyTimedBuff(key, duration) {
    const cfg = POWERUP_TYPES[key];
    const wasActive = buffs[key] > 0;
    if (wasActive) {
      buffStacks[key] = Math.min(MAX_BUFF_STACK, buffStacks[key] + 1);
    } else {
      buffStacks[key] = 1;
    }
    buffs[key] = duration;
    if (wasActive && buffStacks[key] > 1) {
      showFloatingText(player.x, player.y - 62, i18n.t("buff.stackBoost", { name: i18n.buffLabel(key), n: buffStacks[key] }), cfg.color, 80);
    }
    if (key === "speed") syncPlayerSpeed();
  }

  function getSpeedMultiplier() {
    if (buffs.speed <= 0) return 1;
    if (buffStacks.speed >= 3) return 2.15;
    if (buffStacks.speed >= 2) return 1.95;
    return 1.75;
  }

  function getSpeedBonusLabel() {
    if (buffs.speed <= 0) return "";
    if (buffStacks.speed >= 3) return i18n.t("ui.speedBonus115");
    if (buffStacks.speed >= 2) return i18n.t("ui.speedBonus95");
    return i18n.t("ui.speedBonus75");
  }

  function getLaserDamage() {
    if (buffs.laser <= 0) return 0;
    if (buffStacks.laser >= 3) return 5;
    if (buffStacks.laser >= 2) return 4;
    return 3;
  }

  function syncPlayerSpeed() {
    if (!isMobileUI) player.baseSpeed = DESKTOP_BASE_SPEED;
    const mobileScale = isMobileUI ? MOBILE_SPEED_SCALE : 1;
    player.speed = player.baseSpeed * mobileScale * getSpeedMultiplier();
  }

  function getPlayerCollider() {
    return {
      x: player.x, y: player.y,
      width: player.hitboxWidth, height: player.hitboxHeight,
    };
  }

  function getShootCooldown() {
    const hasLaser = buffs.laser > 0;
    const hasPower = buffs.power > 0;
    if (hasLaser && hasPower) return 8;
    if (hasLaser) return 8;
    if (hasPower) return buffStacks.power >= 2 ? 8 : 10;
    return 14;
  }

  function getWeaponModeText() {
    const parts = [];
    if (buffs.laser > 0) {
      parts.push(buffStacks.laser > 1 ? i18n.t("ui.weaponLaserStack", { n: buffStacks.laser }) : i18n.t("ui.weaponLaser"));
    }
    if (buffs.power > 0) {
      parts.push(buffStacks.power > 1 ? i18n.t("ui.weaponPowerStack", { n: buffStacks.power }) : i18n.t("ui.weaponPower"));
    }
    return parts.length ? parts.join(i18n.t("ui.weaponCombo")) : i18n.t("ui.weaponStandard");
  }

  function getBurstDamage() {
    let total = 0;
    if (buffs.laser > 0) total += getLaserDamage();
    if (buffs.power > 0) {
      total += 1 + 1 + 1 + 2;
      if (buffStacks.power >= 3) total += 2;
    }
    if (!buffs.laser && !buffs.power) total = 1;
    return total;
  }

  function formatBuffStack(key) {
    return buffStacks[key] > 1 ? ` x${buffStacks[key]}` : "";
  }

  function getFireRateText() {
    const cd = getShootCooldown();
    const perSec = (60 / cd).toFixed(1);
    return `${perSec}/s`;
  }

  function clearBattlefield({ keepPowerUps = false } = {}) {
    bullets = []; enemyBullets = []; enemies = [];
    if (!keepPowerUps) powerUps = [];
    particles = []; floatingTexts = [];
    allies = []; flybys = [];
    deployedMines = [];
    playerMissiles = [];
    mouseTarget = null; mouseMarker = null;
    touchDrag.active = false;
    pickupToast = null;
  }

  function relocateCarriedPowerUps() {
    if (powerUps.length === 0) return;
    const cols = Math.min(powerUps.length, 4);
    const startX = W / 2 - ((cols - 1) * 44) / 2;
    powerUps.forEach((p, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      p.x = startX + col * 44;
      p.y = 52 + row * 30;
      p.wobble = Math.random() * Math.PI * 2;
    });
  }

  function resetPlayerPosition() {
    player.x = W / 2; player.y = H - 80;
    player.prevX = player.x; player.prevY = player.y;
    player.shootCooldown = 0;
    playerTrail = [];
  }

  function resetCampaign() {
    totalScore = 0; stageScore = 0; stageKills = 0;
    playerHp = PLAYER_MAX_HP; lives = 3; stage = 1; frame = 0;
    respawnAnim = null;
    invincibleUntil = 0;
    stagePhase = "assault";
    stageBossSpawned = false;
    stageAllySpawned = false;
    stageRebelSpawned = false;
    stageVictoryDelay = -1;
    lastHealthFrame = -99999;
    bombCharges = 0;
    missileCharges = 0;
    clearTimeout(universeJumpTimer);
    universeJumpTimer = null;
    applyUniverseTheme(0);
    resetBuffs();
    clearBattlefield();
    resetPlayerPosition();
    updateHUD();
  }

  function startStage(n) {
    stage = n;
    stageScore = 0;
    stageKills = 0;
    frame = 0;
    stagePhase = "assault";
    stageBossSpawned = false;
    stageAllySpawned = false;
    stageRebelSpawned = false;
    stageVictoryDelay = -1;
    invincibleUntil = frame + 90;
    playerHp = PLAYER_MAX_HP;
    const uni = themes.getUniverseIndex(n);
    if (uni !== universeIndex) applyUniverseTheme(uni);
    clearBattlefield({ keepPowerUps: true });
    relocateCarriedPowerUps();
    resetPlayerPosition();

    const def = getStageDef(stage);
    const ui = currentTheme.ui;
    showFloatingText(W / 2, H / 2 - 28, i18n.themeName(universeIndex), ui.floatingWave, 95);
    showFloatingText(W / 2, H / 2 - 4, i18n.t("stage.label", { n: stage }), ui.floatingWave, 95);
    showFloatingText(W / 2, H / 2 + 20, def.name, ui.floatingBoss, 100);
    showFloatingText(W / 2, H / 2 + 44, def.tip, "#8ecdb0", 90);
    audio.setBgmMode("normal");
    audio.playStageStart();
    updateHUD();
  }

  function updateHUD() {
    const def = getStageDef(stage);
    scoreEl.textContent = totalScore;
    if (playerHpBarEl) {
      const accent = currentTheme?.ui?.hudAccent || "#00e5ff";
      const warn = playerHp <= 1 ? "#ff6b6b" : playerHp <= 2 ? "#ffd93d" : accent;
      playerHpBarEl.innerHTML = Array.from({ length: PLAYER_MAX_HP }, (_, i) => {
        const filled = i < playerHp;
        const cls = filled ? "hp-pip is-filled" : "hp-pip";
        const style = filled ? ` style="--pip-color:${warn}"` : "";
        return `<span class="${cls}"${style}></span>`;
      }).join("");
    }
    if (playerHpTextEl) {
      playerHpTextEl.textContent = `${playerHp}/${PLAYER_MAX_HP}`;
      playerHpTextEl.style.color = playerHp <= 1 ? "#ff6b6b" : playerHp <= 2 ? "#ffd93d" : "rgba(200,230,255,0.75)";
    }
    if (livesDisplayEl) {
      livesDisplayEl.textContent = String(lives);
      livesDisplayEl.style.color = lives <= 1 ? "#ff6b6b" : lives <= 2 ? "#ffd93d" : (currentTheme?.ui?.hudAccent || "#00e5ff");
    }
    if (livesIconsEl) {
      const accent = currentTheme?.ui?.hudAccent || "#00e5ff";
      livesIconsEl.innerHTML = Array.from({ length: MAX_LIVES }, (_, i) => {
        const active = i < lives;
        return `<span class="life-pip${active ? " is-active" : ""}" style="${active ? `--pip-color:${accent}` : ""}"></span>`;
      }).join("");
    }
    if (statHpEl) {
      statHpEl.textContent = `${playerHp} / ${PLAYER_MAX_HP}`;
      statHpEl.style.color = playerHp <= 1 ? "#ff6b6b" : playerHp <= 2 ? "#ffd93d" : "#e8f4ff";
    }
    if (statLivesEl) {
      statLivesEl.textContent = String(lives);
      statLivesEl.style.color = lives <= 1 ? "#ff6b6b" : lives <= 2 ? "#ffd93d" : "#e8f4ff";
    }
    if (levelEl) levelEl.textContent = stage;
    if (bombChargesEl) {
      bombChargesEl.textContent = bombCharges > 0 ? `💣×${bombCharges}` : "—";
      bombChargesEl.style.color = bombCharges > 0 ? "#f39c12" : "rgba(140,190,230,0.45)";
    }
    if (missileChargesEl) {
      missileChargesEl.textContent = missileCharges > 0 ? `🚀×${missileCharges}` : "—";
      missileChargesEl.style.color = missileCharges > 0 ? "#ff6b35" : "rgba(140,190,230,0.45)";
    }
    if (statBombsEl) {
      statBombsEl.textContent = bombCharges > 0 ? `💣×${bombCharges}` : "—";
      statBombsEl.style.color = bombCharges > 0 ? "#f39c12" : "#5a7a9a";
    }
    if (statMissilesEl) {
      statMissilesEl.textContent = missileCharges > 0 ? `🚀×${missileCharges}` : "—";
      statMissilesEl.style.color = missileCharges > 0 ? "#ff6b35" : "#5a7a9a";
    }
    updateTouchBadges();
    if (universeLabelEl) universeLabelEl.textContent = i18n.themeName(universeIndex);

    const active = [];
    if (buffs.power > 0) active.push(`${i18n.t("buff.hudPower")}${Math.ceil(buffs.power / 60)}${i18n.t("buff.hudSec")}${formatBuffStack("power")}`);
    if (buffs.shield > 0) active.push(`${i18n.t("buff.hudShield")}${Math.ceil(buffs.shield / 60)}${i18n.t("buff.hudSec")}${formatBuffStack("shield")}`);
    if (buffs.speed > 0) active.push(`${i18n.t("buff.hudSpeed")}${Math.ceil(buffs.speed / 60)}${i18n.t("buff.hudSec")}${formatBuffStack("speed")}`);
    if (buffs.laser > 0) active.push(`${i18n.t("buff.hudLaser")}${Math.ceil(buffs.laser / 60)}${i18n.t("buff.hudSec")}${formatBuffStack("laser")}`);
    if (buffEl) buffEl.textContent = active.length ? active.join(" ") : "—";

    if (statSpeed) {
      statSpeed.textContent = `${player.speed.toFixed(1)}${getSpeedBonusLabel()}`;
      statSpeed.style.color = buffs.speed > 0 ? "#58d68d" : "#e8f4ff";
    }
    if (statWeapon) statWeapon.textContent = getWeaponModeText();
    if (statDamage) {
      statDamage.textContent = String(getBurstDamage());
      statDamage.style.color = getBurstDamage() > 1 ? "#ffd700" : "#e8f4ff";
    }
    if (statFireRate) statFireRate.textContent = getFireRateText();
    if (statShield) {
      if (buffs.shield > 0) {
        const layers = buffStacks.shield > 1 ? i18n.t("ui.shieldLayers", { n: buffStacks.shield }) : "";
        statShield.textContent = i18n.t("ui.shieldActive", { time: `${Math.ceil(buffs.shield / 60)}s`, layers });
        statShield.style.color = "#5dade2";
      } else {
        statShield.textContent = i18n.t("ui.shieldNone");
        statShield.style.color = "#5a7a9a";
      }
    }

    const buffDefs = [
      { key: "power", color: "#ff4757", max: POWERUP_TYPES.power.duration },
      { key: "shield", color: "#3498db", max: POWERUP_TYPES.shield.duration },
      { key: "speed", color: "#2ecc71", max: POWERUP_TYPES.speed.duration },
      { key: "laser", color: "#a855f7", max: POWERUP_TYPES.laser.duration },
    ];
    const activeBuffs = buffDefs.filter((b) => buffs[b.key] > 0);

    if (buffListEl) {
      if (activeBuffs.length === 0) {
        buffListEl.innerHTML = `<p class="buff-empty">${i18n.t("ui.buffEmpty")}</p>`;
      } else {
        buffListEl.innerHTML = activeBuffs.map((b) => {
          const remain = buffs[b.key];
          const pct = Math.min(100, (remain / b.max) * 100);
          const secs = Math.ceil(remain / 60);
          const stack = formatBuffStack(b.key);
          return `<div class="buff-card" style="--buff-color:${b.color}">
            <div class="buff-card-name">${i18n.buffLabel(b.key)}${stack}</div>
            <div class="buff-card-bar"><div class="buff-card-bar-fill" style="width:${pct}%"></div></div>
            <div class="buff-card-time">${i18n.t("ui.buffRemain", { n: secs })}</div>
          </div>`;
        }).join("");
      }
    }

    if (hudBuffBarsEl) {
      if (!isMobileUI || activeBuffs.length === 0) {
        hudBuffBarsEl.innerHTML = "";
        hudBuffBarsEl.hidden = true;
      } else {
        hudBuffBarsEl.hidden = false;
        hudBuffBarsEl.innerHTML = activeBuffs.map((b) => {
          const remain = buffs[b.key];
          const pct = Math.min(100, (remain / b.max) * 100);
          const secs = Math.ceil(remain / 60);
          const stack = formatBuffStack(b.key);
          return `<div class="hud-buff-chip" style="--buff-color:${b.color}">
            <span class="hud-buff-label">${i18n.buffLabel(b.key)}${stack}</span>
            <div class="hud-buff-bar"><div class="hud-buff-bar-fill" style="width:${pct}%"></div></div>
            <span class="hud-buff-time">${secs}s</span>
          </div>`;
        }).join("");
      }
    }
  }

  function canOfferHealth() {
    return playerHp < PLAYER_MAX_HP && frame - lastHealthFrame >= HEALTH_COOLDOWN;
  }

  function canOfferLife() {
    return lives < MAX_LIVES;
  }

  function trySpawnHealthDrop(x, y) {
    if (!canOfferHealth()) return false;
    spawnPowerUp(x, y, "health");
    return true;
  }

  function trySpawnLifeDrop(x, y) {
    if (!canOfferLife()) return false;
    spawnPowerUp(x, y, "life");
    return true;
  }

  function getPowerUpWeight(type, weights) {
    const w = weights[type] || POWERUP_TYPES[type]?.weight || 1;
    if (type === "bomb") return Math.max(1, Math.floor(w / 2));
    return w;
  }

  function pickRandomPowerUpType() {
    const def = getStageDef(stage);
    const pool = def.powerupPool || ["power", "shield", "speed"];
    const weights = def.powerupWeights || {};
    const total = pool.reduce((s, t) => s + getPowerUpWeight(t, weights), 0);
    let roll = Math.random() * total;
    for (const type of pool) {
      roll -= getPowerUpWeight(type, weights);
      if (roll <= 0) return type;
    }
    return pool[0];
  }

  function spawnPowerUp(x, y, forcedType) {
    const type = forcedType || pickRandomPowerUpType();
    const cfg = getPU(type);
    powerUps.push({
      type, x, y, width: 36, height: 44,
      speed: 1.2, wobble: Math.random() * Math.PI * 2,
      ...cfg,
    });
  }

  function pickEnemyType() {
    const def = getStageDef(stage);
    const r = Math.random();
    const egg = def.easterEgg || {};
    const eggTypes = Object.keys(egg);
    let eggRoll = 0;
    for (const type of eggTypes) {
      eggRoll += egg[type] || 0;
      if (r < eggRoll) return type;
    }

    const pool = def.enemyPool;
    const total = pool.reduce((s, e) => s + e.weight, 0);
    let roll = Math.random() * total;
    for (const entry of pool) {
      roll -= entry.weight;
      if (roll <= 0) return entry.type;
    }
    return pool[0].type;
  }

  function createEnemy(type, x, y, overrides = {}) {
    const cfg = ENEMY_TYPES[type] || getBossConfig(type);
    if (!cfg) return null;
    const isBoss = !!getBossConfig(type);
    return {
      type,
      x: x ?? (cfg.width / 2 + 10 + Math.random() * (W - cfg.width - 20)),
      y: y ?? -cfg.height,
      width: cfg.width, height: cfg.height,
      hp: cfg.hp, maxHp: cfg.hp,
      speed: cfg.speed + (stage - 1) * 0.04,
      noRotate: cfg.noRotate || false,
      patrolDrift: cfg.patrolDrift || false,
      easterEgg: cfg.easterEgg || false,
      codename: (cfg.easterEgg || cfg.codename) ? i18n.entity(type) : null,
      score: cfg.score, color: cfg.color, accent: cfg.accent,
      pattern: cfg.pattern, angle: 0,
      shootTimer: cfg.shootInterval || 0,
      spawnTimer: cfg.spawnInterval || 0,
      zigzag: cfg.zigzag || false,
      zigzagPhase: Math.random() * Math.PI * 2,
      isBoss,
      bossTier: MEGA_BOSS_TYPES[type] ? "mega" : isBoss ? "mini" : null,
      bossName: isBoss ? i18n.entity(type) : null,
      bulletSpeed: cfg.bulletSpeed || 3,
      ...overrides,
    };
  }

  function isBlockingEnemy(enemy) {
    return !enemy.isBoss && !enemy.easterEgg && !enemy.rebelPursuer;
  }

  function spawnEnemy() {
    if (enemies.some((e) => e.isBoss)) return;
    const enemy = createEnemy(pickEnemyType());
    if (enemy) enemies.push(enemy);
  }

  function spawnRebelPursuers(flyby) {
    for (let i = 0; i < flyby.killGoal; i++) {
      const pursuer = createEnemy(
        "scout",
        flyby.x + 55 + i * 28,
        flyby.y + (i - 1) * 22,
      );
      pursuer.rebelPursuer = true;
      pursuer.speed = 0.7;
      pursuer.score = 0;
      enemies.push(pursuer);
    }
  }

  function clearRebelPursuers() {
    enemies = enemies.filter((e) => !e.rebelPursuer);
  }

  function registerRebelPursuerKill() {
    flybys.forEach((flyby) => {
      if (flyby.killCount < flyby.killGoal) flyby.killCount++;
    });
  }

  function spawnRebelFlyby(forced) {
    if (flybys.length > 0) return;
    if (!forced && (gameState !== "playing" || enemies.some((e) => e.isBoss))) return;
    const flyby = {
      kind: "rebel_scout",
      x: -45,
      y: 90 + Math.random() * (H * 0.45),
      width: 34, height: 30,
      speed: 0.95,
      killCount: 0,
      killGoal: 3,
      pattern: "rebel_scout",
      color: "#b8c0c8", accent: "#e63946",
      codename: i18n.entity("rebel_scout"),
      hint: i18n.t("rebel.hint"),
    };
    flybys.push(flyby);
    spawnRebelPursuers(flyby);
    showFloatingText(W / 2, 72, i18n.t("rebel.pursued"), "#74c0fc", 100);
  }

  function addScore(pts) {
    totalScore += pts;
    stageScore += pts;
    updateHUD();
  }

  function completeRebelMission(flyby) {
    addScore(888);
    audio.playAllySuccess();
    spawnPowerUp(flyby.x, flyby.y, Math.random() < 0.5 ? "shield" : "power");
    showFloatingText(flyby.x, flyby.y - 20, i18n.t("rebel.success"), "#74c0fc", 110);
    showEasterEggToast(i18n.t("rebel.successToast"));
    clearRebelPursuers();
  }

  function failRebelMission(flyby) {
    showFloatingText(flyby.x - 20, flyby.y, i18n.t("rebel.fail"), "#7a9ab8", 85);
    clearRebelPursuers();
  }

  function getBossStageProfile(stageNum, isMega) {
    const s = stageNum;
    const hpMul = 1 + (s - 1) * (isMega ? 0.05 : 0.04);

    if (isMega) {
      return {
        hpMul,
        pattern: null,
        shootIntervalCut: Math.floor(s / 5) * 2,
        spawnIntervalCut: Math.floor(s / 5) * 12,
      };
    }

    if (s <= 2) {
      return {
        hpMul,
        pattern: "boss_assault",
        shootInterval: Math.max(44, 76 - (s - 1) * 2),
        spawnInterval: null,
        minionType: null,
        fanSpreads: null,
        bulletSpeed: 2.6 + s * 0.1,
      };
    }
    if (s <= 4) {
      return {
        hpMul,
        pattern: "boss_assault",
        shootInterval: Math.max(44, 72 - (s - 1) * 2),
        spawnInterval: Math.max(200, 300 - (s - 3) * 15),
        minionType: "scout",
        fanSpreads: null,
        bulletSpeed: 2.7 + s * 0.05,
      };
    }
    if (s <= 7) {
      return {
        hpMul,
        pattern: "boss_assault",
        shootInterval: Math.max(42, 64 - (s - 6) * 2),
        spawnInterval: Math.max(180, 260 - (s - 6) * 10),
        minionType: "scout",
        fanSpreads: null,
        bulletSpeed: 2.8 + s * 0.04,
      };
    }
    if (s <= 10) {
      return {
        hpMul,
        pattern: "boss_storm",
        shootInterval: Math.max(42, 58 - (s - 8) * 2),
        spawnInterval: 220,
        minionType: "scout",
        fanSpreads: [-0.2, 0, 0.2],
        bulletSpeed: 2.85 + s * 0.03,
      };
    }
    return {
      hpMul,
      pattern: "boss_storm",
      shootInterval: Math.max(42, 52 - (s - 11) * 2),
      spawnInterval: Math.max(150, 200 - (s - 11) * 5),
      minionType: "interceptor",
      fanSpreads: null,
      bulletSpeed: 3.0 + s * 0.02,
    };
  }

  function applyBossStageTuning(boss, cfg, stageNum) {
    const isMega = boss.bossTier === "mega";
    const profile = getBossStageProfile(stageNum, isMega);

    boss.hp = Math.round(cfg.hp * profile.hpMul);
    boss.maxHp = boss.hp;

    if (isMega) {
      boss.shootInterval = Math.max(38, (cfg.shootInterval || 48) - profile.shootIntervalCut);
      if (cfg.spawnInterval) {
        boss.spawnInterval = Math.max(160, cfg.spawnInterval - profile.spawnIntervalCut);
      }
      return;
    }

    boss.pattern = profile.pattern;
    boss.shootInterval = profile.shootInterval;
    if (profile.bulletSpeed) boss.bulletSpeed = profile.bulletSpeed;
    if (profile.fanSpreads) boss.fanSpreads = profile.fanSpreads;
    else delete boss.fanSpreads;
    if (profile.spawnInterval) {
      boss.spawnInterval = profile.spawnInterval;
      boss.minionType = profile.minionType || "scout";
    } else {
      boss.spawnInterval = 0;
      delete boss.minionType;
    }
  }

  function spawnEndBoss(bossType) {
    const cfg = getBossConfig(bossType);
    if (!cfg) return;
    const boss = createEnemy(bossType, W / 2, -cfg.height);
    if (!boss) return;
    applyBossStageTuning(boss, cfg, stage);
    boss.entering = true;
    enemies.push(boss);
    audio.playBoss(boss.bossTier === "mega");
    showFloatingText(W / 2, 80, i18n.bossIncoming(i18n.entity(bossType), boss.bossTier), currentTheme.ui.floatingBoss, 120);
    updateHUD();
  }

  function countsTowardStageGoal(enemy) {
    return !enemy.rebelPursuer && !enemy.easterEgg && !enemy.isBoss;
  }

  function isStageEnemy(enemy) {
    return !enemy.rebelPursuer;
  }

  function advanceStageFlow() {
    if (gameState !== "playing") return;
    const def = getStageDef(stage);

    if (stagePhase === "assault") {
      if (stageKills < def.goalKills) return;
      stagePhase = "clearing";
      audio.playWaveRetreat();
      showFloatingText(W / 2, H * 0.36, i18n.floatMsg("waveRetreat"), currentTheme.ui.floatingWave, 95);
      return;
    }

    if (stagePhase === "clearing") {
      if (enemies.some(isBlockingEnemy)) return;
      if (stageBossSpawned) return;
      stageBossSpawned = true;
      stagePhase = "boss";
      spawnEndBoss(def.endBossType);
      return;
    }

    if (stagePhase === "boss") {
      if (enemies.some((e) => e.isBoss) || enemies.some(isStageEnemy)) {
        stageVictoryDelay = -1;
        return;
      }
      if (powerUps.length > 0) {
        stageVictoryDelay = -1;
        return;
      }
      if (stageVictoryDelay < 0) {
        stageVictoryDelay = 0;
        audio.playBattlefieldClear();
        showFloatingText(W / 2, H * 0.36, i18n.floatMsg("battlefieldClear"), "#ffd700", 95);
      }
      stageVictoryDelay++;
      if (stageVictoryDelay < STAGE_VICTORY_PAUSE_FRAMES) return;
      stageVictoryDelay = -1;
      completeStage();
    }
  }

  function checkStageComplete() {
    advanceStageFlow();
  }

  function completeStage() {
    if (gameState !== "playing") return;
    audio.stopBgm();
    enemyBullets = [];
    clearRebelPursuers();

    const def = getStageDef(stage);
    if (stageClearLineEl) stageClearLineEl.textContent = i18n.t("ui.stageClearLine", { n: stage, name: def.name });
    if (stageClearScoreEl) stageClearScoreEl.textContent = stageScore;
    if (stageClearTotalEl) stageClearTotalEl.textContent = totalScore;
    const nextDef = getStageDef(stage + 1);
    if (nextStageLineEl) nextStageLineEl.textContent = i18n.t("ui.nextStage", { name: nextDef.name });

    if (stage % 3 === 0 && lives < MAX_LIVES) {
      lives++;
      showEasterEggToast(i18n.t("easter.stageLifeBonus", { n: stage, lives }));
    }
    updateHUD();

    if (def.isMegaStage) {
      audio.playUniverseJump();
      showUniverseJump(def);
    } else {
      audio.playStageClear();
      gameState = "stageClear";
      showOverlay(stageClearOverlay);
    }
  }

  function finishUniverseJump() {
    if (universeJumpOverlay) {
      universeJumpOverlay.classList.remove("is-animating");
      universeJumpOverlay.classList.add("hidden");
    }
    clearTimeout(universeJumpTimer);
    universeJumpTimer = null;
    const nextUni = themes.getUniverseIndex(stage + 1);
    applyUniverseTheme(nextUni);
    hideAllOverlays();
    audio.setBgmMode("normal");
    startStage(stage + 1);
    gameState = "playing";
    audio.startBgm();
    resumePlayingChrome();
  }

  function showUniverseJump(def) {
    gameState = "universeJump";
    const nextTheme = themes.getTheme((def.universeIndex + 1) % themes.UNIVERSE_THEMES.length);
    if (universeJumpBossLineEl) universeJumpBossLineEl.textContent = i18n.t("ui.universeJumpBoss", { boss: def.endBossName });
    if (jumpFromUniverseEl) jumpFromUniverseEl.textContent = i18n.themeName(def.universeIndex);
    if (jumpToUniverseEl) jumpToUniverseEl.textContent = i18n.themeName((def.universeIndex + 1) % themes.UNIVERSE_THEMES.length);
    showOverlay(universeJumpOverlay);
    if (universeJumpOverlay) universeJumpOverlay.classList.add("is-animating");
    clearTimeout(universeJumpTimer);
    universeJumpTimer = setTimeout(finishUniverseJump, 3200);
  }

  function proceedToNextStage() {
    hideAllOverlays();
    audio.setBgmMode("normal");
    startStage(stage + 1);
    gameState = "playing";
    audio.startBgm();
    resumePlayingChrome();
  }

  function spawnAlly() {
    if (allies.length > 0) return;
    const roll = Math.random();
    if (roll < 0.38) {
      allies.push({
        kind: "escort",
        x: -40, y: 140,
        width: 56, height: 40,
        hp: 25, maxHp: 25,
        speed: 1.8,
        escortTime: 0,
        escortGoal: 120,
        name: i18n.allyName("escort"),
        hint: i18n.allyHint("escort"),
        color: "#27ae60", accent: "#82e0aa",
      });
      showFloatingText(W / 2, 100, i18n.t("ally.escortCall"), "#82e0aa", 100);
    } else if (roll < 0.72) {
      allies.push({
        kind: "rescue",
        x: W / 2 + (Math.random() < 0.5 ? -70 : 70),
        y: H - 200,
        width: 40, height: 36,
        hp: 15, maxHp: 15,
        killCount: 0, killGoal: 8,
        timer: 900,
        spawnProtection: 120,
        name: i18n.allyName("rescue"),
        hint: i18n.allyHint("rescue"),
        color: "#5dade2", accent: "#aed6f1",
      });
      showFloatingText(W / 2, 100, i18n.t("ally.rescueCall"), "#5dade2", 100);
    } else {
      allies.push({
        kind: "medical",
        x: -40, y: H * 0.55,
        width: 50, height: 38,
        hp: 20, maxHp: 20,
        speed: 1.4,
        escortTime: 0,
        escortGoal: 120,
        name: i18n.allyName("medical"),
        hint: i18n.allyHint("medical"),
        color: "#ffffff", accent: "#ff6b9d",
      });
      showFloatingText(W / 2, 100, i18n.t("ally.medicalCall"), "#ff6b9d", 110);
    }
  }

  function completeAllyMission(ally) {
    audio.playAllySuccess();
    addScore(300);

    if (ally.kind === "medical") {
      if (trySpawnHealthDrop(ally.x, ally.y + 20)) {
        showFloatingText(ally.x, ally.y, i18n.t("ally.medicalDrop"), "#ff6b9d", 90);
      } else if (canOfferHealth() === false && playerHp >= PLAYER_MAX_HP) {
        showFloatingText(ally.x, ally.y, i18n.t("ally.hpFullShield"), "#3498db", 80);
        spawnPowerUp(ally.x, ally.y + 20, "shield");
      } else {
        showFloatingText(ally.x, ally.y, i18n.t("ally.cooldownShield"), "#3498db", 80);
        spawnPowerUp(ally.x, ally.y + 20, "shield");
      }
      return;
    }

    showFloatingText(ally.x, ally.y, i18n.t("ally.complete"), "#ffd700", 90);
    if (canOfferLife() && Math.random() < 0.06) {
      trySpawnLifeDrop(ally.x + 10, ally.y + 20);
    } else if (canOfferHealth() && Math.random() < 0.18) {
      trySpawnHealthDrop(ally.x, ally.y + 20);
      if (Math.random() < 0.35) spawnPowerUp(ally.x + 30, ally.y + 30);
    } else {
      spawnPowerUp(ally.x, ally.y + 20);
      if (Math.random() < 0.35) spawnPowerUp(ally.x + 30, ally.y + 30);
    }
  }

  function failAllyMission(ally) {
    audio.playAllyFail();
    showFloatingText(ally.x, ally.y, i18n.t("ally.fail"), "#e74c3c", 70);
  }

  function showPickupToast(cfg, powerKey) {
    pickupToast = {
      text: i18n.floatMsg("pickupToast", { name: cfg.fullName, desc: cfg.desc }),
      color: cfg.color,
      life: 150,
      maxLife: 150,
      powerKey,
    };
  }

  function pickMissileTarget() {
    const boss = enemies.find((e) => e.isBoss);
    if (boss) return boss;
    let nearest = null;
    let nearestDist = Infinity;
    for (const enemy of enemies) {
      if (enemy.rebelPursuer) continue;
      const d = dist(player, enemy);
      if (d < nearestDist) { nearestDist = d; nearest = enemy; }
    }
    return nearest;
  }

  function launchHomingMissiles(count) {
    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 18;
      playerMissiles.push({
        x: player.x + spread,
        y: player.y - 28,
        width: 10,
        height: 18,
        speed: 7.5,
        damage: 3,
        vx: 0,
        vy: -2,
        delay: i * 10,
        target: null,
        color: "#ff6b35",
        trail: [],
      });
    }
  }

  function updateMissiles() {
    const missileKills = new Set();
    playerMissiles = playerMissiles.filter((m) => {
      if (m.delay > 0) { m.delay--; return true; }

      if (!m.target || m.target.hp <= 0 || !enemies.includes(m.target)) {
        m.target = pickMissileTarget();
      }

      if (m.target) {
        const dx = m.target.x - m.x;
        const dy = m.target.y - m.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const desiredVx = (dx / d) * m.speed;
        const desiredVy = (dy / d) * m.speed;
        m.vx += (desiredVx - m.vx) * 0.14;
        m.vy += (desiredVy - m.vy) * 0.14;
        const spd = Math.sqrt(m.vx * m.vx + m.vy * m.vy) || 1;
        const cap = m.speed;
        m.vx = (m.vx / spd) * cap;
        m.vy = (m.vy / spd) * cap;
      } else {
        m.vy -= 0.15;
        m.vx *= 0.96;
      }

      m.x += m.vx;
      m.y += m.vy;
      m.trail.unshift({ x: m.x, y: m.y });
      if (m.trail.length > 6) m.trail.pop();

      for (const enemy of enemies) {
        if (missileKills.has(enemy)) continue;
        if (rectOverlap(m, enemy)) {
          enemy.hp -= m.damage;
          spawnParticles(m.x, m.y, m.color, 10);
          audio.playHit();
          if (enemy.hp <= 0) {
            missileKills.add(enemy);
            killEnemy(enemy);
          }
          return false;
        }
      }
      return m.y > -80 && m.y < H + 80 && m.x > -60 && m.x < W + 60;
    });
    if (missileKills.size > 0) {
      enemies = enemies.filter((e) => !missileKills.has(e));
    }
  }

  function deployMine() {
    if (gameState !== "playing" || respawnAnim) return;
    if (bombCharges <= 0) {
      showFloatingText(player.x, player.y - 40, i18n.floatMsg("noBombs"), "#7a9ab8", 50);
      return;
    }
    if (deployedMines.length >= MAX_DEPLOYED_MINES) {
      showFloatingText(player.x, player.y - 40, i18n.floatMsg("mineCap", { max: MAX_DEPLOYED_MINES }), "#7a9ab8", 50);
      return;
    }
    const boss = enemies.find((e) => e.isBoss);
    const dropX = boss
      ? Math.max(20, Math.min(W - 20, boss.x))
      : Math.max(20, Math.min(W - 20, player.x));
    bombCharges--;
    deployedMines.push({
      x: dropX,
      y: player.y - 24,
      width: 22,
      height: 22,
      speed: MINE_FALL_SPEED,
      life: 540,
      pulse: Math.random() * Math.PI * 2,
    });
    audio.playShoot();
    showFloatingText(player.x, player.y - 48, i18n.floatMsg("mineDeploy", { n: bombCharges }), "#f39c12", 55);
    updateHUD();
  }

  function fireMissileSalvo() {
    if (gameState !== "playing" || respawnAnim) return;
    if (missileCharges <= 0) {
      showFloatingText(player.x, player.y - 40, i18n.floatMsg("noMissiles"), "#7a9ab8", 50);
      return;
    }
    missileCharges--;
    launchHomingMissiles(3);
    showFloatingText(player.x, player.y - 48, i18n.floatMsg("missileSalvo", { n: missileCharges }), "#ff6b35", 55);
    updateHUD();
  }

  function detonateMine(mine, enemy) {
    spawnParticles(mine.x, mine.y, "#f39c12", enemy?.isBoss ? 28 : 18);
    audio.playExplode();
    if (enemy) {
      if (enemy.isBoss) {
        enemy.hp -= MINE_BOSS_DAMAGE;
        showFloatingText(mine.x, mine.y - 12, i18n.floatMsg("mineHit", { dmg: MINE_BOSS_DAMAGE }), "#ffd700", 55);
        if (enemy.hp <= 0) killEnemy(enemy);
      } else {
        enemy.hp = 0;
        killEnemy(enemy);
      }
    } else {
      showFloatingText(mine.x, mine.y, i18n.floatMsg("mineDetonate"), "#f39c12", 40);
    }
  }

  function updateMines() {
    deployedMines = deployedMines.filter((mine) => {
      mine.y += mine.speed;
      mine.life--;
      mine.pulse += 0.14;
      if (mine.life <= 0) return false;

      for (const enemy of enemies) {
        if (rectOverlap(mine, enemy)) {
          detonateMine(mine, enemy);
          return false;
        }
      }
      return mine.y < H + 50;
    });
    enemies = enemies.filter((e) => e.hp > 0);
  }

  function applyPowerUp(type) {
    const cfg = getPU(type);
    audio.playPickup(type);
    showPickupToast(cfg, type);
    showFloatingText(player.x, player.y - 50, cfg.fullName, cfg.color, 70);

    switch (type) {
      case "power": applyTimedBuff("power", POWERUP_TYPES.power.duration); break;
      case "shield": applyTimedBuff("shield", POWERUP_TYPES.shield.duration); break;
      case "speed": applyTimedBuff("speed", POWERUP_TYPES.speed.duration); break;
      case "bomb":
        bombCharges++;
        showFloatingText(player.x, player.y - 48, i18n.floatMsg("bombPickup", { n: bombCharges }), cfg.color, 75);
        break;
      case "health":
        if (playerHp < PLAYER_MAX_HP) {
          playerHp++;
          lastHealthFrame = frame;
          spawnParticles(player.x, player.y, "#ff6b9d", 15);
          showFloatingText(player.x, player.y - 40, i18n.floatMsg("hpGain", { hp: playerHp, max: PLAYER_MAX_HP }), "#ff6b9d", 60);
        } else {
          showFloatingText(player.x, player.y - 40, i18n.floatMsg("hpFull"), "#7a9ab8", 50);
        }
        break;
      case "life":
        if (lives < MAX_LIVES) {
          lives++;
          spawnParticles(player.x, player.y, "#fcd34d", 18);
          showFloatingText(player.x, player.y - 40, i18n.floatMsg("lifeGain", { lives }), "#fbbf24", 70);
        } else {
          showFloatingText(player.x, player.y - 40, i18n.floatMsg("lifeFull"), "#7a9ab8", 50);
        }
        break;
      case "laser": applyTimedBuff("laser", POWERUP_TYPES.laser.duration); break;
      case "missile":
        missileCharges++;
        showFloatingText(player.x, player.y - 48, i18n.floatMsg("missilePickup", { n: missileCharges }), cfg.color, 75);
        break;
    }
    updateHUD();
  }

  function showFloatingText(x, y, text, color, life) {
    floatingTexts.push({ x, y, text, color, life, maxLife: life });
  }

  function shoot() {
    if (player.shootCooldown > 0) return;
    const hasLaser = buffs.laser > 0;
    const hasPower = buffs.power > 0;
    player.shootCooldown = getShootCooldown();
    audio.playShoot();

    const py = player.y - player.height / 2;

    if (hasLaser) {
      bullets.push({
        x: player.x, y: py, width: 6, height: 28, speed: 14,
        damage: getLaserDamage(), piercing: true, color: "#c084fc",
      });
    }

    if (hasPower) {
      const pStack = buffStacks.power;
      const spreadOffsets = pStack >= 2 ? [-26, 26] : [-18, 18];
      const base = { y: py, width: 4, height: 14, speed: 11, damage: 1, piercing: false, color: "#00e5ff" };
      bullets.push({ ...base, x: player.x });
      spreadOffsets.forEach((offset) => {
        bullets.push({
          ...base, x: player.x + offset, width: 3, height: 12, speed: 10,
          angle: offset > 0 ? 0.08 : -0.08,
        });
      });
      if (pStack >= 3) {
        [-34, 34].forEach((offset) => {
          bullets.push({
            ...base, x: player.x + offset, width: 3, height: 10, speed: 9,
            angle: offset > 0 ? 0.14 : -0.14,
          });
        });
      }
      bullets.push({
        ...base, x: player.x, y: py - 4, width: 5, height: 10, speed: 12, damage: 2,
      });
    } else if (!hasLaser) {
      bullets.push({
        x: player.x, y: py, width: 4, height: 14, speed: 11,
        damage: 1, piercing: false, color: "#00e5ff",
      });
    }
  }

  function cullOffscreenEnemyBullets() {
    enemyBullets = enemyBullets.filter((b) =>
      b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20
    );
  }

  function canSpawnEnemyBullet() {
    cullOffscreenEnemyBullets();
    return enemyBullets.length < ENEMY_BULLET_HARD_CAP;
  }

  function enemyShoot(enemy, speed, spread = 0) {
    if (!canSpawnEnemyBullet()) return false;
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x) + spread;
    const spd = speed * ENEMY_BULLET_SPEED_SCALE;
    enemyBullets.push({
      x: enemy.x, y: enemy.y + enemy.height / 2,
      vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
      width: 8, height: 8, damage: 1, color: enemy.accent,
    });
    return true;
  }

  function spawnParticles(x, y, color, count) {
    const n = Math.max(1, Math.round(count * particleScale));
    for (let i = 0; i < n; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 30 + Math.random() * 20, maxLife: 50, color, size: Math.random() * 3 + 1 });
    }
  }

  function rectOverlap(a, b) {
    return Math.abs(a.x - b.x) < (a.width + b.width) / 2 && Math.abs(a.y - b.y) < (a.height + b.height) / 2;
  }

  function dist(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  function updateBuffs() {
    if (buffs.power > 0) { buffs.power--; } else { buffStacks.power = 0; }
    if (buffs.shield > 0) { buffs.shield--; } else { buffStacks.shield = 0; }
    if (buffs.speed > 0) { buffs.speed--; } else { buffStacks.speed = 0; }
    if (buffs.laser > 0) { buffs.laser--; } else { buffStacks.laser = 0; }
    syncPlayerSpeed();
    if (pickupToast) { pickupToast.life--; if (pickupToast.life <= 0) pickupToast = null; }
  }

  function clampPlayerPosition() {
    player.x = Math.max(player.width / 2, Math.min(W - player.width / 2, player.x));
    player.y = Math.max(player.height / 2, Math.min(H - player.height / 2, player.y));
  }

  function canvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * (W / rect.width),
      y: (clientY - rect.top) * (H / rect.height),
    };
  }

  function clampToPlayfield(x, y, margin = 20) {
    return {
      x: Math.max(margin, Math.min(W - margin, x)),
      y: Math.max(margin, Math.min(H - margin, y)),
    };
  }

  function setMouseTarget(x, y) {
    mouseTarget = clampToPlayfield(x, y);
    mouseMarker = { x: mouseTarget.x, y: mouseTarget.y, life: 40, maxLife: 40 };
  }

  function setTouchDragTarget(clientX, clientY) {
    const pos = canvasCoords(clientX, clientY);
    const clamped = clampToPlayfield(pos.x, pos.y);
    touchDrag.x = clamped.x;
    touchDrag.y = clamped.y;
  }

  function scheduleTouchDragUpdate(clientX, clientY) {
    pendingTouchClient = { x: clientX, y: clientY };
    if (touchRafId) return;
    touchRafId = requestAnimationFrame(() => {
      touchRafId = 0;
      if (pendingTouchClient) {
        setTouchDragTarget(pendingTouchClient.x, pendingTouchClient.y);
        pendingTouchClient = null;
      }
    });
  }

  function isNoDragTarget(el) {
    return el && el.closest && el.closest("[data-no-drag]");
  }

  function getRespawnProgress() {
    if (!respawnAnim) return 0;
    return Math.min(1, (frame - respawnAnim.start) / respawnAnim.duration);
  }

  function swapPlane() {
    lives--;
    spawnParticles(player.x, player.y, "#ff6b6b", 28);
    audio.playExplode();
    if (lives <= 0) {
      showFloatingText(player.x, player.y - 40, i18n.floatMsg("crashNoSpare"), "#ff6b6b", 90);
      updateHUD();
      endGame();
      return;
    }
    respawnAnim = {
      start: frame,
      duration: RESPAWN_ANIM_FRAMES,
      fromY: H + 55,
      toY: H - 80,
    };
    playerHp = PLAYER_MAX_HP;
    player.x = W / 2;
    player.y = respawnAnim.fromY;
    player.prevX = player.x;
    player.prevY = player.y;
    playerTrail = [];
    enemyBullets = [];
    invincibleUntil = frame + 180;
    showFloatingText(W / 2, H * 0.42, i18n.floatMsg("spareSwap", { lives }), "#fcd34d", 100);
    updateHUD();
  }

  function updatePlayer() {
    if (respawnAnim) {
      const t = getRespawnProgress();
      const ease = 1 - Math.pow(1 - t, 2.6);
      player.y = respawnAnim.fromY + (respawnAnim.toY - respawnAnim.fromY) * ease;
      player.x = W / 2 + Math.sin(t * Math.PI) * 36 * (1 - t * 0.35);
      clampPlayerPosition();
      player.prevX = player.x;
      player.prevY = player.y;
      if (t >= 1) respawnAnim = null;
      return;
    }

    let dx = 0, dy = 0;
    if (keys["ArrowLeft"] || keys["a"] || keys["A"]) dx -= 1;
    if (keys["ArrowRight"] || keys["d"] || keys["D"]) dx += 1;
    if (keys["ArrowUp"] || keys["w"] || keys["W"]) dy -= 1;
    if (keys["ArrowDown"] || keys["s"] || keys["S"]) dy -= 1;

    const usingKeyboard = dx !== 0 || dy !== 0;

    if (usingKeyboard) {
      mouseTarget = null;
      touchDrag.active = false;
      if (dx !== 0 && dy !== 0) { const n = 1 / Math.SQRT2; dx *= n; dy *= n; }
      player.x += dx * player.speed;
      player.y += dy * player.speed;
    } else if (isMobileUI && touchDrag.active) {
      const tdx = touchDrag.x - player.x;
      const tdy = touchDrag.y - player.y;
      if (Math.hypot(tdx, tdy) <= SNAP_DIST) {
        player.x = touchDrag.x;
        player.y = touchDrag.y;
      } else {
        player.x += tdx * TOUCH_DRAG_LERP;
        player.y += tdy * TOUCH_DRAG_LERP;
      }
    } else if (mouseTarget) {
      const mdx = mouseTarget.x - player.x;
      const mdy = mouseTarget.y - player.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy) || 1;
      if (mdist < 5) {
        player.x = mouseTarget.x;
        player.y = mouseTarget.y;
        mouseTarget = null;
      } else {
        player.x += (mdx / mdist) * player.speed;
        player.y += (mdy / mdist) * player.speed;
      }
    }

    clampPlayerPosition();

    const mvx = player.x - player.prevX;
    const mvy = player.y - player.prevY;
    const moveSpeed = Math.hypot(mvx, mvy);
    if (moveSpeed > 0.4) {
      const intensity = Math.min(1, moveSpeed / (player.speed * 0.85));
      const copies = moveSpeed > 4 ? 2 : 1;
      for (let i = 0; i < copies; i++) {
        playerTrail.unshift({
          x: player.x, y: player.y,
          vx: mvx, vy: mvy,
          life: 0.55 + intensity * 0.45,
          boost: buffs.speed > 0,
        });
      }
    }
    player.prevX = player.x;
    player.prevY = player.y;
    playerTrail = playerTrail
      .map((t) => ({ ...t, life: t.life * (t.boost ? 0.86 : 0.9) }))
      .filter((t) => t.life > 0.04)
      .slice(0, trailMax);

    if (!isMobileUI && mouseMarker) { mouseMarker.life--; if (mouseMarker.life <= 0) mouseMarker = null; }
    if (player.shootCooldown > 0) player.shootCooldown--;
    if (keys[" "] || keys["Space"] || frame % 15 === 0) shoot();
  }

  function updateBullets() {
    bullets = bullets.filter((b) => { b.y -= b.speed; if (b.angle) b.x += Math.sin(b.angle) * b.speed * 0.3; return b.y > -30; });
    enemyBullets = enemyBullets.filter((b) => { b.x += b.vx; b.y += b.vy; return b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20; });
    updateMines();
    updateMissiles();
  }

  function tryStageEvents() {
    if (stagePhase === "boss") return;
    const def = getStageDef(stage);
    if (def.allyMission && !stageAllySpawned && stageKills >= Math.floor(def.goalKills * 0.45) && allies.length === 0) {
      stageAllySpawned = true;
      spawnAlly();
    }
    if (def.rebelFlyby && !stageRebelSpawned && flybys.length === 0 && stageKills >= Math.max(3, Math.floor(def.goalKills * 0.35))) {
      stageRebelSpawned = true;
      spawnRebelFlyby(true);
    }
  }

  function updateEnemies() {
    const def = getStageDef(stage);
    if (stagePhase === "assault" && !enemies.some((e) => e.isBoss) && frame % def.spawnRate === 0) {
      const mobCap = 8 + Math.min(stage, 6);
      const mobCount = enemies.filter(isBlockingEnemy).length;
      if (mobCount < mobCap) spawnEnemy();
    }
    tryStageEvents();

    enemies.forEach((e) => {
      if (e.entering) {
        const enterY = e.isBoss ? BOSS_ANCHOR_Y : 100;
        e.y += 1.2;
        if (e.y >= enterY) { e.entering = false; e.y = enterY; }
        return;
      }
      const cfg = getBossConfig(e.type) || ENEMY_TYPES[e.type];
      const dx = player.x - e.x, dy = player.y - e.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      e.angle = Math.atan2(dy, dx);

      if (e.rebelPursuer && flybys.length > 0) {
        const target = flybys[0];
        const pdx = target.x - e.x;
        const pdy = target.y - e.y;
        const pd = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
        e.x += (pdx / pd) * e.speed * 0.5;
        e.y += (pdy / pd) * e.speed * 0.38;
      } else if (e.patrolDrift) {
        e.y += e.speed;
        e.x += Math.sin(frame * 0.025 + e.zigzagPhase) * 0.45;
        e.x = Math.max(e.width / 2, Math.min(W - e.width / 2, e.x));
      } else if (e.zigzag) {
        e.zigzagPhase += 0.05;
        e.x += Math.sin(e.zigzagPhase) * 1.2;
        e.y += e.speed * 0.45;
      } else if (e.isBoss) {
        if (e.y < BOSS_ANCHOR_Y) {
          e.y += e.speed * 0.55;
        } else {
          const isMega = e.bossTier === "mega";
          const trackFactor = isMega ? 0.42 : 0.58;
          const swayAmp = isMega ? 0.55 : 0.9;
          e.x += (dx / d) * e.speed * trackFactor;
          e.x += Math.sin(frame * 0.025 + e.x * 0.01) * swayAmp;
          e.y += Math.sin(frame * 0.022 + e.x * 0.012) * 0.32;
          e.y = Math.max(BOSS_ANCHOR_Y - 24, Math.min(BOSS_ANCHOR_Y + 24, e.y));
        }
        e.x = Math.max(e.width / 2, Math.min(W - e.width / 2, e.x));
      } else {
        e.y += e.speed * 0.88;
        e.x += (dx / d) * e.speed * 0.18;
      }

      const shootInterval = e.shootInterval ?? cfg.shootInterval;
      if (shootInterval) {
        e.shootTimer = (e.shootTimer || 0) + 1;
        let interval = shootInterval;
        if (!e.isBoss && enemyBullets.length >= ENEMY_BULLET_SOFT_CAP) {
          interval = Math.ceil(interval * 1.6);
        }
        if (e.shootTimer >= interval) {
          e.shootTimer = 0;
          if (!e.isBoss && enemyBullets.length >= ENEMY_BULLET_SOFT_CAP) {
            // 弹幕接近软上限，普通敌机本轮停火
          } else if (e.pattern === "boss_storm" || e.pattern === "boss_lava" || e.pattern === "boss_matrix") {
            const defaultSpreads = enemyBullets.length >= BOSS_FAN_REDUCE_AT
              ? [-0.2, 0, 0.2]
              : [-0.3, -0.15, 0, 0.15, 0.3];
            const spreads = e.fanSpreads || defaultSpreads;
            spreads.forEach((s) => enemyShoot(e, e.bulletSpeed, s));
          } else {
            enemyShoot(e, e.bulletSpeed || 3);
          }
        }
      }
      const spawnInterval = e.spawnInterval !== undefined ? e.spawnInterval : cfg.spawnInterval;
      if (spawnInterval) {
        e.spawnTimer = (e.spawnTimer || 0) + 1;
        if (e.spawnTimer >= spawnInterval && enemies.length < 14) {
          e.spawnTimer = 0;
          const minionType = e.minionType || "scout";
          const minion = createEnemy(minionType, e.x + (Math.random() - 0.5) * 60, e.y + 20);
          if (minion) enemies.push(minion);
        }
      }
    });
    cullOffscreenEnemies();
  }

  function isOffscreenEnemy(e) {
    if (e.isBoss || e.entering || e.rebelPursuer) return false;
    const pad = 40;
    return e.y > H + e.height / 2 + pad
      || e.y < -e.height - pad
      || e.x < -e.width / 2 - pad
      || e.x > W + e.width / 2 + pad;
  }

  function cullOffscreenEnemies() {
    const before = enemies.length;
    enemies = enemies.filter((e) => !isOffscreenEnemy(e));
    if (before !== enemies.length) checkStageComplete();
  }

  function updateFlybys() {
    flybys = flybys.filter((flyby) => {
      flyby.x += flyby.speed;
      if (flyby.killCount >= flyby.killGoal) {
        completeRebelMission(flyby);
        return false;
      }
      if (flyby.x > W + 60) {
        if (flyby.killCount < flyby.killGoal) failRebelMission(flyby);
        return false;
      }
      return true;
    });
  }

  function updateAllies() {
    allies.forEach((ally) => {
      if (ally.spawnProtection > 0) ally.spawnProtection--;
    });

    allies = allies.filter((ally) => {
      if (ally.kind === "escort" || ally.kind === "medical") {
        ally.x += ally.speed;
        if (dist(getPlayerCollider(), ally) < 75) ally.escortTime++;
        if (ally.escortTime >= ally.escortGoal) { completeAllyMission(ally); return false; }
        if (ally.x > W + 60 || ally.hp <= 0) { if (ally.hp <= 0) failAllyMission(ally); return false; }
      } else if (ally.kind === "rescue") {
        ally.timer--;
        if (ally.killCount >= ally.killGoal) { completeAllyMission(ally); return false; }
        if (ally.timer <= 0 || ally.hp <= 0) { failAllyMission(ally); return false; }
      }
      return true;
    });
  }

  function updatePowerUps() {
    powerUps = powerUps.filter((p) => { p.y += p.speed; p.wobble += 0.08; p.x += Math.sin(p.wobble) * 0.5; return p.y < H + 40; });
  }

  function updateParticles() {
    particles = particles.filter((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life--; return p.life > 0; });
    floatingTexts = floatingTexts.filter((t) => { t.y -= 0.6; t.life--; return t.life > 0; });
  }

  function updateBackground() {
    if (cosmos) sprites.updateCosmos(cosmos, W, H, stage, frame);
  }

  function killEnemy(enemy) {
    const pts = enemy.score;
    totalScore += pts;
    stageScore += pts;
    if (countsTowardStageGoal(enemy)) stageKills++;

    spawnParticles(enemy.x, enemy.y, enemy.color, enemy.isBoss ? 35 : 12);
    if (enemy.isBoss) {
      audio.playExplode("large");
      audio.playBossDefeat(enemy.bossTier === "mega");
    } else {
      audio.playExplode(enemy.maxHp > 2 ? "medium" : "small");
    }

    allies.forEach((ally) => {
      if (ally.kind === "rescue" && ally.killCount < ally.killGoal) ally.killCount++;
    });

    if (enemy.rebelPursuer) registerRebelPursuerKill();

    if (enemy.easterEgg) {
      if (Math.random() < EASTER_EGG_QUOTE_CHANCE) {
        const msg = enemy.type === "dark_interceptor"
          ? i18n.floatMsg("eggDarkVanguard")
          : i18n.floatMsg("eggTiePatrol");
        showFloatingText(enemy.x, enemy.y - 16, msg, enemy.accent, 100);
      }
      if (enemy.type === "dark_interceptor") spawnPowerUp(enemy.x, enemy.y);
    } else if (enemy.isBoss) {
      showFloatingText(enemy.x, enemy.y, i18n.bossDefeated(enemy.bossName, enemy.score), "#ffd700", 90);
      if (canOfferHealth() && Math.random() < HEALTH_BOSS_CHANCE) {
        trySpawnHealthDrop(enemy.x - 20, enemy.y);
      }
      if (canOfferLife() && Math.random() < 0.12) {
        trySpawnLifeDrop(enemy.x + 20, enemy.y);
      }
      if (Math.random() < BOSS_DROP_CHANCE) spawnPowerUp(enemy.x, enemy.y);
      if (Math.random() < BOSS_DROP_CHANCE * 0.45) spawnPowerUp(enemy.x + 25, enemy.y);
      if (Math.random() < BOSS_MISSILE_CHANCE) spawnPowerUp(enemy.x - 20, enemy.y + 15, "missile");
      if (Math.random() < BOSS_BOMB_CHANCE) spawnPowerUp(enemy.x + 15, enemy.y + 20, "bomb");
    } else {
      if (playerHp === 1 && canOfferHealth() && Math.random() < HEALTH_CRITICAL_CHANCE) {
        trySpawnHealthDrop(enemy.x, enemy.y);
      } else if (Math.random() < getStageDropChance()) {
        spawnPowerUp(enemy.x, enemy.y);
      }
    }

    updateHUD();
    checkStageComplete();
  }

  function damagePlayer() {
    if (frame < invincibleUntil) return false;
    if (buffs.shield > 0 && buffStacks.shield > 0) {
      buffStacks.shield--;
      invincibleUntil = frame + 90;
      spawnParticles(player.x, player.y, "#3498db", 18);
      if (buffStacks.shield <= 0) {
        buffs.shield = 0;
        showFloatingText(player.x, player.y - 30, i18n.floatMsg("shieldBreak"), "#3498db", 50);
      } else {
        showFloatingText(player.x, player.y - 30, i18n.floatMsg("shieldBlock", { n: buffStacks.shield }), "#3498db", 55);
      }
      audio.playHit(); updateHUD(); return true;
    }
    playerHp--;
    spawnParticles(player.x, player.y, "#ff6b6b", 16);
    invincibleUntil = frame + 120;
    audio.playDamage();
    if (playerHp <= 0) {
      swapPlane();
    } else {
      showFloatingText(player.x, player.y - 40, i18n.floatMsg("damage", { hp: playerHp }), "#ffd93d", 75);
      updateHUD();
    }
    return true;
  }

  function checkCollisions() {
    const hitEnemies = new Set();
    bullets = bullets.filter((bullet) => {
      let consumed = false;
      for (const enemy of enemies) {
        if (hitEnemies.has(enemy)) continue;
        if (rectOverlap(bullet, enemy)) {
          enemy.hp -= bullet.damage;
          audio.playHit();
          if (!bullet.piercing) consumed = true;
          if (enemy.hp <= 0) { hitEnemies.add(enemy); killEnemy(enemy); }
          if (consumed) break;
        }
      }
      for (const ally of allies) {
        if (rectOverlap(bullet, ally)) consumed = true;
      }
      return !consumed;
    });

    enemies = enemies.filter((e) => !hitEnemies.has(e));

    for (const ally of allies) {
      if (ally.spawnProtection > 0) continue;
      for (const enemy of enemies) {
        if (rectOverlap(ally, enemy)) {
          ally.hp -= 2;
          enemies = enemies.filter((e) => e !== enemy);
          spawnParticles(enemy.x, enemy.y, enemy.color, 6);
          audio.playExplode();
        }
      }
    }

    const pc = getPlayerCollider();
    for (const p of powerUps) {
      if (rectOverlap(pc, p)) { applyPowerUp(p.type); p.collected = true; }
    }
    powerUps = powerUps.filter((p) => !p.collected);

    if (respawnAnim) return;

    if (frame >= invincibleUntil) {
      for (const enemy of enemies) {
        if (rectOverlap(pc, enemy)) { enemies = enemies.filter((e) => e !== enemy); damagePlayer(); break; }
      }
      for (const eb of enemyBullets) {
        if (rectOverlap(pc, eb)) { enemyBullets = enemyBullets.filter((b) => b !== eb); damagePlayer(); break; }
      }
    }

  }

  function drawStageBar() {
    if (gameState !== "playing") return;
    const def = getStageDef(stage);
    const ui = currentTheme.ui;
    const barW = W - 40;
    const x = 20;
    const y = H - 18;
    let ratio;
    let label;

    if (stagePhase === "boss") {
      const boss = enemies.find((e) => e.isBoss);
      const remain = enemies.filter(isStageEnemy).length;
      if (boss) {
        ratio = boss.hp / boss.maxHp;
        label = i18n.stageBarLabel("barBoss", { n: stage, boss: def.endBossName });
      } else if (remain > 0) {
        ratio = 1;
        label = i18n.stageBarLabel("barMopup", { n: stage, remain });
      } else if (powerUps.length > 0) {
        ratio = 1;
        label = i18n.stageBarLabel("barLoot", { n: stage, count: powerUps.length });
      } else if (stageVictoryDelay >= 0) {
        ratio = Math.min(1, stageVictoryDelay / STAGE_VICTORY_PAUSE_FRAMES);
        label = i18n.stageBarLabel("barComplete", { n: stage });
      } else {
        ratio = 1;
        label = i18n.stageBarLabel("barCleared", { n: stage });
      }
    } else if (stagePhase === "clearing") {
      const remain = enemies.filter(isBlockingEnemy).length;
      ratio = remain > 0 ? 0.55 + 0.45 * Math.sin(frame * 0.1) : 1;
      label = i18n.stageBarLabel("barClearing", { n: stage, remain });
    } else {
      ratio = Math.min(1, stageKills / def.goalKills);
      label = i18n.stageBarLabel("barAssault", { n: stage, name: def.name });
    }

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x, y, barW, 6);
    const grad = ctx.createLinearGradient(x, 0, x + barW, 0);
    grad.addColorStop(0, ui.barFrom);
    grad.addColorStop(1, ui.barTo);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barW * ratio, 6);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.strokeRect(x, y, barW, 6);

    ctx.fillStyle = "rgba(200,220,240,0.55)";
    ctx.font = gameFont(9, "normal");
    ctx.textAlign = "left";
    ctx.fillText(label, x, y - 4);
  }

  function drawBackground() {
    if (cosmos) sprites.drawCosmos(ctx, cosmos, W, H, frame);
  }

  function drawPlayerTrail() {
    sprites.drawPlayerTrail(ctx, playerTrail, player.width, player.height, buffs, frame, playerThemePalette);
  }

  function drawPlayer() {
    if (!respawnAnim) drawPlayerTrail();
    sprites.drawPlayer(ctx, player.x, player.y, player.width, player.height, buffs, frame, invincibleUntil, playerThemePalette, {
      hp: playerHp,
      maxHp: PLAYER_MAX_HP,
      respawnT: getRespawnProgress(),
    });
  }

  function drawAlly(ally) {
    ctx.save();
    ctx.translate(ally.x, ally.y);
    const hw = ally.width / 2, hh = ally.height / 2;

    if (ally.spawnProtection > 0) {
      ctx.strokeStyle = `rgba(255,255,255,${0.4 + Math.sin(frame * 0.2) * 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(hw, hh) + 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = ally.color;
    if (ally.kind === "escort") {
      ctx.fillRect(-hw, -hh * 0.4, ally.width, hh * 0.8);
      ctx.fillStyle = ally.accent;
      ctx.beginPath(); ctx.moveTo(hw, 0); ctx.lineTo(hw + 14, -8); ctx.lineTo(hw + 14, 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#f1c40f";
      ctx.fillRect(-hw + 6, -hh * 0.2, 10, 8);
      ctx.fillRect(hw - 16, -hh * 0.2, 10, 8);
    } else if (ally.kind === "medical") {
      ctx.fillStyle = "#ecf0f1";
      ctx.fillRect(-hw, -hh * 0.35, ally.width, hh * 0.7);
      ctx.fillStyle = ally.accent;
      ctx.fillRect(-4, -hh * 0.28, 8, hh * 0.56);
      ctx.fillRect(-hw * 0.32, -4, hw * 0.64, 8);
      ctx.strokeStyle = "rgba(255,107,157,0.6)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-hw + 2, -hh * 0.33, ally.width - 4, hh * 0.66);
      ctx.fillStyle = ally.accent;
      ctx.beginPath(); ctx.moveTo(hw, 0); ctx.lineTo(hw + 10, -6); ctx.lineTo(hw + 10, 6); ctx.closePath(); ctx.fill();
    } else {
      ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(-hw, hh); ctx.lineTo(hw, hh); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "#e74c3c"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-8, -4); ctx.lineTo(8, 4); ctx.moveTo(8, -4); ctx.lineTo(-8, 4); ctx.stroke();
    }

    ctx.fillStyle = "#fff";
    ctx.font = gameFont(9);
    ctx.textAlign = "center";
    ctx.fillText(ally.name, 0, -hh - 14);
    ctx.fillStyle = "#a8e6cf";
    ctx.font = gameFont(8, "normal");
    ctx.fillText(ally.hint, 0, -hh - 4);

    const ratio = (ally.kind === "escort" || ally.kind === "medical")
      ? ally.escortTime / ally.escortGoal
      : ally.kind === "rescue" ? ally.killCount / ally.killGoal : ally.hp / ally.maxHp;
    sprites.drawHpBar(ctx, 0, hh + 6, ally.width, Math.min(1, ratio), ally.accent);

    if ((ally.kind === "escort" || ally.kind === "medical") && dist(getPlayerCollider(), ally) < 75) {
      ctx.strokeStyle = "rgba(130,224,170,0.6)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(player.x - ally.x, player.y - ally.y); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawFlyby(flyby) {
    sprites.drawEnemy(ctx, flyby, frame);
    ctx.save();
    ctx.translate(flyby.x, flyby.y);

    ctx.strokeStyle = `rgba(116,192,252,${0.35 + Math.sin(frame * 0.1) * 0.15})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, flyby.width * 0.65, flyby.height * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#74c0fc";
    ctx.font = gameFont(8, "normal");
    ctx.textAlign = "center";
    ctx.fillText(flyby.codename, 0, -flyby.height / 2 - 8);
    ctx.fillStyle = "#a8d8ff";
    ctx.font = gameFont(7, "normal");
    ctx.fillText(flyby.hint, 0, -flyby.height / 2 + 2);

    const ratio = flyby.killCount / flyby.killGoal;
    sprites.drawHpBar(ctx, 0, flyby.height / 2 + 6, flyby.width + 8, Math.min(1, ratio), "#74c0fc");
    ctx.fillStyle = "#d0e8ff";
    ctx.font = gameFont(7, "normal");
    ctx.fillText(i18n.t("rebel.pursuerLabel", { count: flyby.killCount, goal: flyby.killGoal }), 0, flyby.height / 2 + 18);
    ctx.restore();
  }

  function drawEnemy(e) {
    sprites.drawEnemy(ctx, e, frame);
    if (e.rebelPursuer) {
      ctx.save();
      ctx.translate(e.x, e.y - e.height / 2 - 10);
      ctx.fillStyle = "#ff6b6b";
      ctx.font = gameFont(7, "normal");
      ctx.textAlign = "center";
      ctx.fillText(i18n.entity("imperial_pursuer"), 0, 0);
      ctx.restore();
    } else if (e.codename && !e.isBoss) {
      ctx.save();
      ctx.translate(e.x, e.y - e.height / 2 - 12);
      ctx.fillStyle = e.accent;
      ctx.font = gameFont(8, "normal");
      ctx.textAlign = "center";
      ctx.fillText(e.codename, 0, 0);
      ctx.restore();
    }
    if (e.maxHp > 1) {
      const hh = e.height / 2;
      sprites.drawHpBar(
        ctx, e.x, e.y + (e.isBoss ? -hh - 18 : -hh - 10),
        e.isBoss ? e.width + 10 : e.width,
        e.hp / e.maxHp, e.accent
      );
    }
  }

  function drawPowerUpIcon(icon, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.2;
    switch (icon) {
      case "spread":
        [-8, 0, 8].forEach((ox) => { ctx.beginPath(); ctx.moveTo(ox, 6); ctx.lineTo(ox - 3, -4); ctx.lineTo(ox + 3, -4); ctx.closePath(); ctx.fill(); });
        break;
      case "shield":
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
        break;
      case "speed":
        ctx.beginPath(); ctx.moveTo(-10, 2); ctx.lineTo(6, 2); ctx.lineTo(2, 8); ctx.lineTo(12, 0); ctx.lineTo(2, -8); ctx.lineTo(6, -2); ctx.lineTo(-10, -2); ctx.closePath(); ctx.fill();
        break;
      case "bomb":
        ctx.beginPath(); ctx.arc(0, 2, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.fillRect(-1, -12, 2, 5);
        ctx.fillStyle = "#ff0"; ctx.beginPath(); ctx.arc(0, -14, 3, 0, Math.PI * 2); ctx.fill();
        break;
      case "health":
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(0, -10); ctx.bezierCurveTo(-12, -10, -12, 4, 0, 12); ctx.bezierCurveTo(12, 4, 12, -10, 0, -10); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.fillRect(-2, -3, 4, 10); ctx.fillRect(-5, 0, 10, 4);
        break;
      case "laser":
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(5, 0); ctx.lineTo(2, 0); ctx.lineTo(6, 12); ctx.lineTo(-6, 12); ctx.lineTo(-2, 0); ctx.lineTo(-5, 0); ctx.closePath(); ctx.fill();
        break;
      case "life":
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -9);
        ctx.lineTo(-7, 2);
        ctx.lineTo(0, 8);
        ctx.lineTo(7, 2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = gameFont(9);
        ctx.textAlign = "center";
        ctx.fillText("+", 0, 3);
        break;
      case "missile":
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -12);
        ctx.lineTo(5, 8);
        ctx.lineTo(0, 4);
        ctx.lineTo(-5, 8);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = "#ff4500";
        ctx.beginPath();
        ctx.moveTo(-6, 8);
        ctx.lineTo(0, 14);
        ctx.lineTo(6, 8);
        ctx.closePath();
        ctx.fill();
        break;
    }
  }

  function drawPowerUp(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    const pulse = 1 + Math.sin(frame * 0.1) * 0.08;

    ctx.shadowColor = p.borderColor;
    ctx.shadowBlur = 12;
    ctx.fillStyle = p.bgColor;
    ctx.strokeStyle = p.borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-18 * pulse, -22 * pulse, 36 * pulse, 40 * pulse, 6);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    drawPowerUpIcon(p.icon, p.color);

    ctx.fillStyle = "#fff";
    ctx.font = gameFont(10);
    ctx.textAlign = "center";
    ctx.fillText(p.fullName, 0, 20);

    ctx.fillStyle = p.color;
    ctx.font = gameFont(8, "normal");
    ctx.fillText(p.shortDesc, 0, 30);

    ctx.restore();
  }

  function drawMissiles() {
    playerMissiles.forEach((m) => {
      m.trail.forEach((t, i) => {
        const a = (1 - i / m.trail.length) * 0.5;
        ctx.globalAlpha = a;
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 3 - i * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.translate(m.x, m.y);
      const angle = Math.atan2(m.vy, m.vx) + Math.PI / 2;
      ctx.rotate(angle);
      ctx.shadowColor = m.color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.moveTo(0, -9);
      ctx.lineTo(4, 6);
      ctx.lineTo(0, 3);
      ctx.lineTo(-4, 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(-1, -4, 2, 5);
      ctx.restore();
    });
  }

  function drawMines() {
    deployedMines.forEach((mine) => {
      const pulse = 1 + Math.sin(mine.pulse) * 0.12;
      ctx.save();
      ctx.translate(mine.x, mine.y);
      ctx.shadowColor = "#f39c12";
      ctx.shadowBlur = 10;
      ctx.fillStyle = "#3a2200";
      ctx.strokeStyle = "#f5b041";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 10 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f39c12";
      ctx.beginPath();
      ctx.moveTo(0, -14 * pulse);
      ctx.lineTo(3, -8 * pulse);
      ctx.lineTo(-3, -8 * pulse);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#ff0";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, -16 * pulse);
      ctx.quadraticCurveTo(4, -20 * pulse, 0, -22 * pulse);
      ctx.stroke();
      ctx.restore();
    });
  }

  function drawBullets() {
    bullets.forEach((b) => {
      const grad = ctx.createLinearGradient(b.x, b.y - b.height / 2, b.x, b.y + b.height / 2);
      grad.addColorStop(0, "#fff"); grad.addColorStop(1, b.color || "#00e5ff");
      ctx.fillStyle = grad;
      if (b.piercing) { ctx.shadowColor = b.color; ctx.shadowBlur = 8; }
      ctx.fillRect(b.x - b.width / 2, b.y - b.height / 2, b.width, b.height);
      ctx.shadowBlur = 0;
    });
    enemyBullets.forEach((b) => {
      ctx.fillStyle = b.color; ctx.beginPath(); ctx.arc(b.x, b.y, b.width / 2, 0, Math.PI * 2); ctx.fill();
    });
  }

  function drawParticles() {
    particles.forEach((p) => { ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); });
    ctx.globalAlpha = 1;
  }

  function drawFloatingTexts() {
    floatingTexts.forEach((t) => { ctx.globalAlpha = t.life / t.maxLife; ctx.fillStyle = t.color; ctx.font = gameFont(16); ctx.textAlign = "center"; ctx.fillText(t.text, t.x, t.y); });
    ctx.globalAlpha = 1;
  }

  function drawMouseMarker() {
    if (isMobileUI || !mouseMarker) return;
    const a = mouseMarker.life / mouseMarker.maxLife;
    ctx.globalAlpha = a * 0.8;
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(mouseMarker.x, mouseMarker.y, 10 + (1 - a) * 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(mouseMarker.x - 8, mouseMarker.y);
    ctx.lineTo(mouseMarker.x + 8, mouseMarker.y);
    ctx.moveTo(mouseMarker.x, mouseMarker.y - 8);
    ctx.lineTo(mouseMarker.x, mouseMarker.y + 8);
    ctx.stroke();
    if (mouseTarget) {
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = "rgba(0,229,255,0.35)";
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(mouseTarget.x, mouseTarget.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.globalAlpha = 1;
  }

  function drawPickupToast() {
    if (!pickupToast) return;
    const a = pickupToast.life / pickupToast.maxLife;
    const y = H - 36;
    ctx.globalAlpha = Math.min(1, a * 2);
    ctx.fillStyle = "rgba(0,10,30,0.85)";
    ctx.strokeStyle = pickupToast.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(20, y - 14, W - 40, 28, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = pickupToast.color;
    ctx.font = gameFont(12);
    ctx.textAlign = "center";
    ctx.fillText(pickupToast.text, W / 2, y + 4);
    ctx.globalAlpha = 1;
  }

  function drawBossBar() {
    const boss = enemies.find((e) => e.isBoss);
    if (!boss) return;
    const barW = W - 40, x = 20, y = 14, ratio = boss.hp / boss.maxHp;
    ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(x, y, barW, 10);
    const grad = ctx.createLinearGradient(x, 0, x + barW, 0);
    grad.addColorStop(0, boss.color); grad.addColorStop(1, boss.accent);
    ctx.fillStyle = grad; ctx.fillRect(x, y, barW * ratio, 10);
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.strokeRect(x, y, barW, 10);
    ctx.fillStyle = "#fff"; ctx.font = gameFont(11, "normal"); ctx.textAlign = "center"; ctx.fillText(boss.bossName, W / 2, y + 9);
  }

  function render() {
    drawBackground();
    allies.forEach(drawAlly);
    flybys.forEach(drawFlyby);
    powerUps.forEach(drawPowerUp);
    enemies.forEach(drawEnemy);
    drawMines();
    drawMissiles();
    drawBullets();
    drawPlayer();
    drawMouseMarker();
    drawParticles();
    drawFloatingTexts();
    drawBossBar();
    drawStageBar();
    drawPickupToast();
  }

  function update() {
    if (gameState === "transition") {
      frame++;
      updateBackground();
      return;
    }
    if (gameState !== "playing") return;
    frame++;
    updateBuffs();
    updateBackground();
    updatePlayer();
    updateBullets();
    updateEnemies();
    updateAllies();
    updateFlybys();
    updatePowerUps();
    updateParticles();
    checkCollisions();
    advanceStageFlow();
    updateHUD();
  }

  function gameLoop(timestamp) {
    if (!lastLoopTime) lastLoopTime = timestamp;
    let delta = timestamp - lastLoopTime;
    lastLoopTime = timestamp;
    if (delta > 200) delta = LOGIC_MS;
    logicAccum += delta;
    let steps = 0;
    while (logicAccum >= LOGIC_MS && steps < MAX_CATCHUP_STEPS) {
      update();
      logicAccum -= LOGIC_MS;
      steps++;
    }
    render();
    requestAnimationFrame(gameLoop);
  }

  const easterEggToastEl = document.getElementById("easterEggToast");
  const gameTitleEl = document.getElementById("gameTitle");
  const subtitleSecretEl = document.getElementById("subtitleSecret");
  const hudSecretEl = document.getElementById("hudSecret");




  let easterEggToastTimer = null;

  function showEasterEggToast(message) {
    if (!easterEggToastEl) return;
    easterEggToastEl.textContent = message;
    easterEggToastEl.classList.remove("hidden");
    clearTimeout(easterEggToastTimer);
    easterEggToastTimer = setTimeout(() => {
      easterEggToastEl.classList.add("hidden");
    }, 4200);
  }

  function tryCheatCode() {
    const key = cheatBuffer.slice(-12);
    for (const code of CHEAT_CODES) {
      if (key.endsWith(code)) {
        cheatBuffer = "";
        showEasterEggToast(i18n.cheatMessage(code));
        if (gameState === "playing" && Math.random() < 0.35) spawnRebelFlyby(true);
        return true;
      }
    }
    return false;
  }

  function rollSubtitleSecret() {
    const pool = i18n.easterPool();
    showEasterEggToast(pool[Math.floor(Math.random() * pool.length)]);
  }

  function dismissMobileTutorial() {
    if (!mobileTutorialEl) return;
    mobileTutorialEl.classList.add("hidden");
    try { localStorage.setItem(MOBILE_TUTORIAL_KEY, "1"); } catch (_) { /* ignore */ }
    mobileTutorialPending = false;
    if (gameState === "tutorial") {
      gameState = "menu";
      beginPlaying();
    }
  }

  function maybeShowMobileTutorial() {
    if (!isMobileUI || !mobileTutorialEl) return false;
    try {
      if (localStorage.getItem(MOBILE_TUTORIAL_KEY)) return false;
    } catch (_) { /* ignore */ }
    mobileTutorialPending = true;
    mobileTutorialEl.classList.remove("hidden");
    return true;
  }

  function beginPlaying() {
    hideAllOverlays();
    if (mobileTutorialEl) mobileTutorialEl.classList.add("hidden");
    startStage(stage);
    audio.startBgm();
    gameState = "playing";
    canvas.classList.remove("is-entering");
    resumePlayingChrome();
  }

  function startGame(fromRestart) {
    if (gameState === "transition") return;
    audio.resume();
    resetCampaign();

    if (fromRestart) {
      if (maybeShowMobileTutorial()) {
        gameState = "tutorial";
        hideAllOverlays();
        return;
      }
      beginPlaying();
      return;
    }

    if (maybeShowMobileTutorial()) {
      gameState = "tutorial";
      hideAllOverlays();
      overlay.classList.add("hidden");
      return;
    }

    gameState = "transition";
    showOverlay(overlay);
    overlay.classList.add("is-exiting");
    canvas.classList.add("is-entering");
    setTimeout(() => beginPlaying(), 680);
  }

  function toggleFullscreen() {
    const root = document.documentElement;
    if (!document.fullscreenElement && root.requestFullscreen) {
      root.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  function endGame() {
    gameState = "gameover";
    audio.stopBgm();
    audio.playGameOver();
    if (finalScoreEl) finalScoreEl.textContent = totalScore;
    if (reachedStageLineEl) reachedStageLineEl.textContent = i18n.t("ui.reachedStage", { n: stage });
    showOverlay(gameOverOverlay);
  }

  function openManual() {
    if (!manualOverlay || gameState === "manual") return;
    stateBeforeManual = gameState;
    gameState = "manual";
    showOverlay(manualOverlay);
  }

  function closeManual() {
    if (!manualOverlay) return;
    manualOverlay.classList.add("hidden");
    if (gameState === "manual") {
      gameState = stateBeforeManual;
      if (gameState === "menu") showOverlay(overlay);
      else if (gameState === "stageClear") showOverlay(stageClearOverlay);
      else if (gameState === "universeJump") showOverlay(universeJumpOverlay);
      else if (gameState === "gameover") showOverlay(gameOverOverlay);
      else if (gameState === "playing") {
        resumePlayingChrome();
      }
    }
  }

  document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
      cheatBuffer = (cheatBuffer + e.key.toLowerCase()).slice(-24);
      tryCheatCode();
    }
    if (e.key === " " && gameState === "playing") e.preventDefault();
    if ((e.key === "Enter" || e.key === " ") && gameState === "stageClear") {
      e.preventDefault();
      proceedToNextStage();
    }
    if ((e.key === "Enter" || e.key === " ") && gameState === "universeJump") {
      e.preventDefault();
      finishUniverseJump();
    }
    if (e.key === "h" || e.key === "H") {
      if (gameState === "manual") closeManual();
      else openManual();
    }
    if (e.key === "Escape" && gameState === "manual") closeManual();
    if (e.key === "m" || e.key === "M") {
      const muted = audio.toggleMute();
      if (muteBtn) muteBtn.textContent = muted ? i18n.t("ui.muteOn") : i18n.t("ui.muteOff");
    }
    if ((e.key === "b" || e.key === "B") && gameState === "playing") {
      e.preventDefault();
      deployMine();
    }
    if ((e.key === "v" || e.key === "V") && gameState === "playing") {
      e.preventDefault();
      fireMissileSalvo();
    }
  });
  document.addEventListener("keyup", (e) => { keys[e.key] = false; });

  canvas.addEventListener("click", (e) => {
    if (gameState !== "playing" || isMobileUI) return;
    const pos = canvasCoords(e.clientX, e.clientY);
    setMouseTarget(pos.x, pos.y);
  });

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  canvas.addEventListener("touchstart", (e) => {
    if (gameState !== "playing" || !isMobileUI) return;
    if (isNoDragTarget(e.target)) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    audio.resume();
    touchDrag.active = true;
    touchDrag.pointerId = touch.identifier;
    setTouchDragTarget(touch.clientX, touch.clientY);
  }, { passive: true });

  canvas.addEventListener("touchmove", (e) => {
    if (!touchDrag.active || gameState !== "playing" || !isMobileUI) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchDrag.pointerId) {
        scheduleTouchDragUpdate(touch.clientX, touch.clientY);
        e.preventDefault();
        break;
      }
    }
  }, { passive: false });

  function endTouchDrag(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchDrag.pointerId) {
        touchDrag.active = false;
        touchDrag.pointerId = null;
        pendingTouchClient = null;
      }
    }
  }

  canvas.addEventListener("touchend", endTouchDrag, { passive: true });
  canvas.addEventListener("touchcancel", endTouchDrag, { passive: true });

  startBtn.addEventListener("click", () => startGame(false));
  restartBtn.addEventListener("click", () => startGame(true));
  if (nextStageBtn) nextStageBtn.addEventListener("click", proceedToNextStage);
  if (jumpSkipBtn) jumpSkipBtn.addEventListener("click", finishUniverseJump);
  if (openManualBtn) openManualBtn.addEventListener("click", openManual);
  if (helpBtn) helpBtn.addEventListener("click", openManual);
  if (closeManualBtn) closeManualBtn.addEventListener("click", closeManual);
  if (manualFromGameOverBtn) manualFromGameOverBtn.addEventListener("click", openManual);
  if (muteBtn) muteBtn.addEventListener("click", () => {
    audio.resume();
    const muted = audio.toggleMute();
    muteBtn.textContent = muted ? i18n.t("ui.muteOn") : i18n.t("ui.muteOff");
  });

  if (bombBtn) bombBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    audio.resume();
    if (gameState === "playing") deployMine();
  });

  if (missileBtn) missileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    audio.resume();
    if (gameState === "playing") fireMissileSalvo();
  });

  if (statsDrawerToggle) statsDrawerToggle.addEventListener("click", () => {
    const open = !statsPanel?.classList.contains("drawer-open");
    setStatsDrawerOpen(open);
  });

  if (statsDrawerClose) statsDrawerClose.addEventListener("click", () => setStatsDrawerOpen(false));

  if (fullscreenBtn) fullscreenBtn.addEventListener("click", () => {
    audio.resume();
    toggleFullscreen();
  });

  if (mobileTutorialDismiss) mobileTutorialDismiss.addEventListener("click", () => {
    audio.resume();
    dismissMobileTutorial();
  });

  window.addEventListener("resize", () => {
    setupCanvasDpr();
    const next = detectMobileUI();
    if (next !== isMobileUI) {
      isMobileUI = next;
      applyPerfTier();
      applyMobileUIMode();
      initBackground();
    } else {
      syncPlayerSpeed();
      updateLandscapeHint();
    }
  });

  window.addEventListener("orientationchange", updateLandscapeHint);

  if (gameTitleEl) {
    gameTitleEl.addEventListener("click", () => {
      titleClickCount++;
      clearTimeout(titleClickTimer);
      titleClickTimer = setTimeout(() => { titleClickCount = 0; }, 900);
      if (titleClickCount >= 3) {
        titleClickCount = 0;
        showEasterEggToast(i18n.t("easter.titleUnlock"));
      }
    });
  }

  if (subtitleSecretEl) {
    subtitleSecretEl.addEventListener("click", () => {
      if (Math.random() < 0.22) rollSubtitleSecret();
      else showEasterEggToast(i18n.t("easter.subtitleRetry"));
    });
  }

  if (hudSecretEl) {
    hudSecretEl.addEventListener("click", () => {
      if (gameState === "playing") {
        if (Math.random() < 0.4) spawnRebelFlyby(true);
        else showEasterEggToast(i18n.t("easter.hudSignal"));
      } else {
        showEasterEggToast(i18n.t("easter.hudCombatOnly"));
      }
    });
  }

  function setLanguage(lang) {
    i18n.setLang(lang);
    refreshI18n();
  }

  const langZhBtn = document.getElementById("langZhBtn");
  const langEnBtn = document.getElementById("langEnBtn");
  if (langZhBtn) langZhBtn.addEventListener("click", () => setLanguage("zh"));
  if (langEnBtn) langEnBtn.addEventListener("click", () => setLanguage("en"));

  setupCanvasDpr();
  isMobileUI = detectMobileUI();
  applyPerfTier();
  applyMobileUIMode();

  refreshI18n();

  showOverlay(overlay);
  applyUniverseTheme(0);
  render();
  requestAnimationFrame(gameLoop);
})();