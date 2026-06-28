(function () {
  "use strict";

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const audio = window.GameAudio;
  const sprites = window.GameSprites;

  const scoreEl = document.getElementById("score");
  const livesEl = document.getElementById("lives");
  const levelEl = document.getElementById("level");

  const stageClearOverlay = document.getElementById("stageClearOverlay");
  const clearedStageEl = document.getElementById("clearedStage");
  const clearedStageNameEl = document.getElementById("clearedStageName");
  const stageClearScoreEl = document.getElementById("stageClearScore");
  const stageClearTotalEl = document.getElementById("stageClearTotal");
  const nextStageNameEl = document.getElementById("nextStageName");
  const nextStageBtn = document.getElementById("nextStageBtn");
  const reachedStageEl = document.getElementById("reachedStage");
  const buffEl = document.getElementById("buff");
  const statSpeed = document.getElementById("statSpeed");
  const statWeapon = document.getElementById("statWeapon");
  const statDamage = document.getElementById("statDamage");
  const statFireRate = document.getElementById("statFireRate");
  const statShield = document.getElementById("statShield");
  const buffListEl = document.getElementById("buffList");
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

  const keys = {};
  let mouseTarget = null;
  let mouseMarker = null;
  let gameState = "menu";
  let stateBeforeManual = "menu";
  let totalScore = 0;
  let stageScore = 0;
  let stageKills = 0;
  let lives = 3;
  let stage = 1;
  let frame = 0;
  let invincibleUntil = 0;
  let stageBossSpawned = false;
  let stageAllySpawned = false;
  let stageRebelSpawned = false;
  let pickupToast = null;
  let lastHealthFrame = -99999;

  const MAX_LIVES = 5;
  const HEALTH_COOLDOWN = 3600;
  const HEALTH_CRITICAL_CHANCE = 0.05;
  const HEALTH_BOSS_CHANCE = 0.35;

  const player = {
    x: W / 2, y: H - 80,
    width: 28, height: 32,
    hitboxWidth: 18, hitboxHeight: 22,
    baseSpeed: 8.5, speed: 8.5, shootCooldown: 0,
    prevX: W / 2, prevY: H - 80,
  };

  let playerTrail = [];
  const TRAIL_MAX = 14;

  const buffs = { power: 0, shield: 0, speed: 0, laser: 0 };

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
    gunship: { width: 44, height: 38, hp: 3, speed: 0.5, score: 450, color: "#9b59b6", accent: "#d4a5ff", pattern: "gunship", shootInterval: 100 },
    phantom: { width: 30, height: 34, hp: 2, speed: 0.9, score: 300, color: "#3498db", accent: "#74c0fc", pattern: "phantom", zigzag: true },
    carrier: { width: 52, height: 42, hp: 4, speed: 0.4, score: 600, color: "#2ecc71", accent: "#6ee7b7", pattern: "carrier" },
    wraith: { width: 32, height: 34, hp: 2, speed: 1.0, score: 350, color: "#6c1d8a", accent: "#d946ef", pattern: "wraith", zigzag: true },
    meteor: { width: 46, height: 40, hp: 5, speed: 0.32, score: 550, color: "#8b6914", accent: "#fbbf24", pattern: "meteor" },
    tie_patrol: {
      width: 28, height: 28, hp: 1, speed: 1.1, score: 777,
      color: "#141414", accent: "#9aa0a6", pattern: "tie_patrol",
      shootInterval: 120, bulletSpeed: 2.4, noRotate: true, patrolDrift: true,
      easterEgg: true, codename: "帝国巡逻机",
    },
    dark_interceptor: {
      width: 34, height: 30, hp: 4, speed: 0.58, score: 1980,
      color: "#0a0a0a", accent: "#d62828", pattern: "dark_interceptor",
      shootInterval: 80, bulletSpeed: 2.6, noRotate: true, patrolDrift: true,
      easterEgg: true, codename: "黑暗先锋舰",
    },
  };

  const BOSS_TYPES = {
    assault: { width: 72, height: 64, hp: 28, speed: 0.32, score: 3000, color: "#c0392b", accent: "#ff6b6b", pattern: "boss_assault", shootInterval: 60, bulletSpeed: 3.0, name: "重装突击者" },
    commander: { width: 68, height: 58, hp: 20, speed: 0.42, score: 2500, color: "#8e44ad", accent: "#d4a5ff", pattern: "boss_commander", shootInterval: 0, spawnInterval: 165, name: "幻影指挥舰" },
    storm: { width: 80, height: 70, hp: 38, speed: 0.28, score: 5000, color: "#2980b9", accent: "#74c0fc", pattern: "boss_storm", shootInterval: 52, bulletSpeed: 2.8, name: "雷暴母舰" },
  };

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
      label: "炸弹", fullName: "全屏炸弹", shortDesc: "清屏",
      desc: "立即消灭屏幕上所有普通敌机",
      color: "#f39c12", bgColor: "#3a2200", borderColor: "#f5b041",
      icon: "bomb", duration: 0, weight: 1,
    },
    health: {
      label: "回血", fullName: "生命补给", shortDesc: "生命+1",
      desc: "恢复 1 点生命（稀有掉落，满血或冷却中无法获得）",
      color: "#ff6b9d", bgColor: "#3a1028", borderColor: "#ff85b3",
      icon: "health", duration: 0, weight: 0,
    },
    laser: {
      label: "激光", fullName: "穿透激光", shortDesc: "穿透高伤",
      desc: "发射穿透激光，伤害 ×3（8 秒）",
      color: "#a855f7", bgColor: "#1a0830", borderColor: "#c084fc",
      icon: "laser", duration: 480, weight: 2,
    },
  };

  const BOSS_DROP_CHANCE = 0.65;

  const ALL_OVERLAYS = [overlay, stageClearOverlay, gameOverOverlay, manualOverlay].filter(Boolean);

  function hideAllOverlays() {
    ALL_OVERLAYS.forEach((el) => {
      el.classList.add("hidden");
      el.classList.remove("is-exiting");
    });
  }

  function showOverlay(el) {
    hideAllOverlays();
    if (el) el.classList.remove("hidden");
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
      name: "前哨渗透", goalKills: 10, spawnRate: 84,
      enemyPool: [{ type: "scout", weight: 1 }],
      dropChance: 0.1,
      powerupPool: ["power", "shield", "speed"],
      powerupWeights: { power: 3, shield: 3, speed: 2 },
      easterEgg: {}, allyMission: false, rebelFlyby: false, boss: null,
      tip: "击破 10 架侦察机，潜入敌前沿",
    },
    {
      name: "乱流峡谷", goalKills: 14, spawnRate: 76,
      enemyPool: [{ type: "scout", weight: 0.55 }, { type: "interceptor", weight: 0.45 }],
      dropChance: 0.09,
      powerupPool: ["power", "shield", "speed", "bomb"],
      powerupWeights: { power: 3, shield: 2, speed: 2, bomb: 1 },
      easterEgg: {}, allyMission: false, rebelFlyby: false, boss: null,
      tip: "拦截机加入战场，注意走位",
    },
    {
      name: "幻影走廊", goalKills: 16, spawnRate: 72,
      enemyPool: [{ type: "scout", weight: 0.35 }, { type: "phantom", weight: 0.65 }],
      dropChance: 0.085,
      powerupPool: ["power", "shield", "speed", "laser"],
      powerupWeights: { power: 2, shield: 2, speed: 2, laser: 2 },
      easterEgg: { tie_patrol: 0.02 }, allyMission: true, rebelFlyby: false, boss: null,
      tip: "幻影机蛇形移动 · 偶现帝国巡逻彩蛋",
    },
    {
      name: "炮艇封锁线", goalKills: 18, spawnRate: 68,
      enemyPool: [{ type: "interceptor", weight: 0.3 }, { type: "gunship", weight: 0.7 }],
      dropChance: 0.08,
      powerupPool: ["power", "shield", "speed", "laser", "bomb"],
      powerupWeights: { power: 3, shield: 3, speed: 1, laser: 2, bomb: 1 },
      easterEgg: { tie_patrol: 0.025 }, allyMission: false, rebelFlyby: false, boss: null,
      tip: "炮艇会开火，优先击毁",
    },
    {
      name: "突击者要塞", goalKills: 15, spawnRate: 70,
      enemyPool: [{ type: "scout", weight: 0.4 }, { type: "gunship", weight: 0.6 }],
      dropChance: 0.09,
      powerupPool: ["power", "shield", "speed", "laser"],
      powerupWeights: { power: 3, shield: 3, speed: 2, laser: 2 },
      easterEgg: {}, allyMission: false, rebelFlyby: false, boss: "assault",
      tip: "清剿敌机后，重装突击者 Boss 登场",
    },
    {
      name: "幽灵宙域", goalKills: 20, spawnRate: 64,
      enemyPool: [{ type: "phantom", weight: 0.45 }, { type: "wraith", weight: 0.55 }],
      dropChance: 0.075,
      powerupPool: ["power", "shield", "speed", "laser"],
      powerupWeights: { power: 2, shield: 2, speed: 2, laser: 3 },
      easterEgg: { tie_patrol: 0.03 }, allyMission: true, rebelFlyby: true, boss: null,
      tip: "幽灵舰出没 · 可能遭遇同盟侦察彩蛋",
    },
    {
      name: "母舰外围", goalKills: 22, spawnRate: 60,
      enemyPool: [{ type: "gunship", weight: 0.35 }, { type: "carrier", weight: 0.65 }],
      dropChance: 0.07,
      powerupPool: ["power", "shield", "speed", "laser", "bomb"],
      powerupWeights: { power: 3, shield: 2, speed: 2, laser: 2, bomb: 2 },
      easterEgg: {}, allyMission: false, rebelFlyby: false, boss: "commander",
      tip: "幻影指挥舰率援军而来",
    },
    {
      name: "陨石风暴带", goalKills: 24, spawnRate: 56,
      enemyPool: [{ type: "meteor", weight: 0.5 }, { type: "wraith", weight: 0.5 }],
      dropChance: 0.065,
      powerupPool: ["power", "shield", "speed", "laser", "bomb"],
      powerupWeights: { power: 2, shield: 3, speed: 2, laser: 2, bomb: 2 },
      easterEgg: { dark_interceptor: 0.012 }, allyMission: true, rebelFlyby: false, boss: null,
      tip: "重型陨石舰 · 稀有黑暗先锋彩蛋",
    },
    {
      name: "雷暴核心", goalKills: 18, spawnRate: 58,
      enemyPool: [{ type: "carrier", weight: 0.4 }, { type: "gunship", weight: 0.6 }],
      dropChance: 0.08,
      powerupPool: ["power", "shield", "speed", "laser", "bomb"],
      powerupWeights: { power: 3, shield: 3, speed: 2, laser: 2, bomb: 2 },
      easterEgg: { tie_patrol: 0.02, dark_interceptor: 0.008 }, allyMission: false, rebelFlyby: true, boss: "storm",
      tip: "终极试炼：雷暴母舰镇守此关",
    },
  ];

  function getStageDef(n) {
    if (n <= STAGE_DEFINITIONS.length) return STAGE_DEFINITIONS[n - 1];
    const tier = n - STAGE_DEFINITIONS.length;
    const bosses = ["assault", "commander", "storm"];
    const pool = [
      { type: "scout", weight: 0.15 },
      { type: "interceptor", weight: 0.15 },
      { type: "phantom", weight: 0.15 },
      { type: "gunship", weight: 0.2 },
      { type: "wraith", weight: 0.15 },
      { type: "carrier", weight: 0.1 },
      { type: "meteor", weight: 0.1 },
    ];
    return {
      name: `深空战区 ${n}`,
      goalKills: 20 + tier * 4,
      spawnRate: Math.max(42, 58 - tier * 2),
      enemyPool: pool,
      dropChance: Math.max(0.05, 0.07 - tier * 0.002),
      powerupPool: ["power", "shield", "speed", "laser", "bomb"],
      powerupWeights: { power: 3, shield: 2, speed: 2, laser: 2, bomb: 2 },
      easterEgg: {
        tie_patrol: 0.015 + tier * 0.002,
        dark_interceptor: tier >= 2 ? 0.006 : 0,
      },
      allyMission: tier % 2 === 0,
      rebelFlyby: tier % 3 === 1,
      boss: tier % 4 === 0 ? bosses[Math.floor(tier / 4) % bosses.length] : null,
      tip: "无尽深空，难度持续攀升",
    };
  }

  function getStageDropChance() {
    return getStageDef(stage).dropChance;
  }

  function initBackground() {
    cosmos = sprites.initCosmos(W, H);
  }

  function resetBuffs() {
    buffs.power = buffs.shield = buffs.speed = buffs.laser = 0;
    syncPlayerSpeed();
  }

  function syncPlayerSpeed() {
    player.speed = buffs.speed > 0 ? player.baseSpeed * 1.75 : player.baseSpeed;
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
    if (hasPower) return 10;
    return 14;
  }

  function getWeaponModeText() {
    const hasLaser = buffs.laser > 0;
    const hasPower = buffs.power > 0;
    if (hasLaser && hasPower) return "激光 + 三连散射";
    if (hasLaser) return "穿透激光";
    if (hasPower) return "三连散射";
    return "标准单发";
  }

  function getBurstDamage() {
    const hasLaser = buffs.laser > 0;
    const hasPower = buffs.power > 0;
    let total = 0;
    if (hasLaser) total += 3;
    if (hasPower) total += 1 + 1 + 1 + 2;
    if (!hasLaser && !hasPower) total = 1;
    return total;
  }

  function getFireRateText() {
    const cd = getShootCooldown();
    const perSec = (60 / cd).toFixed(1);
    return `${perSec}/s`;
  }

  function clearBattlefield() {
    bullets = []; enemyBullets = []; enemies = [];
    powerUps = []; particles = []; floatingTexts = [];
    allies = []; flybys = [];
    mouseTarget = null; mouseMarker = null;
    pickupToast = null;
  }

  function resetPlayerPosition() {
    player.x = W / 2; player.y = H - 80;
    player.prevX = player.x; player.prevY = player.y;
    player.shootCooldown = 0;
    playerTrail = [];
  }

  function resetCampaign() {
    totalScore = 0; stageScore = 0; stageKills = 0;
    lives = 3; stage = 1; frame = 0;
    invincibleUntil = 0;
    stageBossSpawned = false;
    stageAllySpawned = false;
    stageRebelSpawned = false;
    lastHealthFrame = -99999;
    resetBuffs();
    clearBattlefield();
    resetPlayerPosition();
    initBackground();
    updateHUD();
  }

  function startStage(n) {
    stage = n;
    stageScore = 0;
    stageKills = 0;
    frame = 0;
    stageBossSpawned = false;
    stageAllySpawned = false;
    stageRebelSpawned = false;
    invincibleUntil = frame + 90;
    clearBattlefield();
    resetBuffs();
    resetPlayerPosition();
    initBackground();

    const def = getStageDef(stage);
    showFloatingText(W / 2, H / 2 - 20, `第 ${stage} 关`, "#00e5ff", 95);
    showFloatingText(W / 2, H / 2 + 8, def.name, "#ffd700", 100);
    showFloatingText(W / 2, H / 2 + 36, def.tip, "#8ecdb0", 90);
    updateHUD();
  }

  function updateHUD() {
    const def = getStageDef(stage);
    scoreEl.textContent = totalScore;
    livesEl.textContent = lives;
    if (livesEl) {
      livesEl.style.color = lives <= 1 ? "#ff6b6b" : lives <= 2 ? "#ffd93d" : "#00e5ff";
    }
    if (levelEl) levelEl.textContent = stage;

    const active = [];
    if (buffs.power > 0) active.push(`🔥火力${Math.ceil(buffs.power / 60)}s`);
    if (buffs.shield > 0) active.push(`🛡护盾${Math.ceil(buffs.shield / 60)}s`);
    if (buffs.speed > 0) active.push(`⚡加速${Math.ceil(buffs.speed / 60)}s`);
    if (buffs.laser > 0) active.push(`💜激光${Math.ceil(buffs.laser / 60)}s`);
    if (buffEl) buffEl.textContent = active.length ? active.join(" ") : "—";

    if (statSpeed) {
      const speedBonus = buffs.speed > 0 ? " (+75%)" : "";
      statSpeed.textContent = `${player.speed.toFixed(1)}${speedBonus}`;
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
        statShield.textContent = `激活 (${Math.ceil(buffs.shield / 60)}s)`;
        statShield.style.color = "#5dade2";
      } else {
        statShield.textContent = "无";
        statShield.style.color = "#5a7a9a";
      }
    }

    if (buffListEl) {
      const buffDefs = [
        { key: "power", name: "三连火力", color: "#ff4757", max: POWERUP_TYPES.power.duration },
        { key: "shield", name: "能量护盾", color: "#3498db", max: POWERUP_TYPES.shield.duration },
        { key: "speed", name: "推进加速", color: "#2ecc71", max: POWERUP_TYPES.speed.duration },
        { key: "laser", name: "穿透激光", color: "#a855f7", max: POWERUP_TYPES.laser.duration },
      ];
      const activeBuffs = buffDefs.filter((b) => buffs[b.key] > 0);
      if (activeBuffs.length === 0) {
        buffListEl.innerHTML = '<p class="buff-empty">暂无</p>';
      } else {
        buffListEl.innerHTML = activeBuffs.map((b) => {
          const remain = buffs[b.key];
          const pct = Math.min(100, (remain / b.max) * 100);
          const secs = Math.ceil(remain / 60);
          return `<div class="buff-card" style="--buff-color:${b.color}">
            <div class="buff-card-name">${b.name}</div>
            <div class="buff-card-bar"><div class="buff-card-bar-fill" style="width:${pct}%"></div></div>
            <div class="buff-card-time">剩余 ${secs} 秒</div>
          </div>`;
        }).join("");
      }
    }
  }

  function canOfferHealth() {
    return lives < MAX_LIVES && frame - lastHealthFrame >= HEALTH_COOLDOWN;
  }

  function trySpawnHealthDrop(x, y) {
    if (!canOfferHealth()) return false;
    spawnPowerUp(x, y, "health");
    return true;
  }

  function pickRandomPowerUpType() {
    const def = getStageDef(stage);
    const pool = def.powerupPool || ["power", "shield", "speed"];
    const weights = def.powerupWeights || {};
    const total = pool.reduce((s, t) => s + (weights[t] || POWERUP_TYPES[t]?.weight || 1), 0);
    let roll = Math.random() * total;
    for (const type of pool) {
      roll -= weights[type] || POWERUP_TYPES[type]?.weight || 1;
      if (roll <= 0) return type;
    }
    return pool[0];
  }

  function spawnPowerUp(x, y, forcedType) {
    const type = forcedType || pickRandomPowerUpType();
    const cfg = POWERUP_TYPES[type];
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
    if (egg.dark_interceptor && r < egg.dark_interceptor) return "dark_interceptor";
    if (egg.tie_patrol && r < (egg.tie_patrol + (egg.dark_interceptor || 0))) return "tie_patrol";

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
    const cfg = ENEMY_TYPES[type] || BOSS_TYPES[type];
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
      codename: cfg.codename || null,
      score: cfg.score, color: cfg.color, accent: cfg.accent,
      pattern: cfg.pattern, angle: 0,
      shootTimer: cfg.shootInterval || 0,
      spawnTimer: cfg.spawnInterval || 0,
      zigzag: cfg.zigzag || false,
      zigzagPhase: Math.random() * Math.PI * 2,
      isBoss: !!BOSS_TYPES[type],
      bossName: cfg.name || null,
      bulletSpeed: cfg.bulletSpeed || 3,
      ...overrides,
    };
  }

  function spawnEnemy() {
    if (enemies.some((e) => e.isBoss)) return;
    enemies.push(createEnemy(pickEnemyType()));
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
      codename: "同盟侦察机",
      hint: "击落追击机，掩护撤离",
    };
    flybys.push(flyby);
    spawnRebelPursuers(flyby);
    showFloatingText(W / 2, 72, "同盟侦察机遭追击！开火掩护其突围", "#74c0fc", 100);
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
    showFloatingText(flyby.x, flyby.y - 20, "掩护成功！原力与你同在", "#74c0fc", 110);
    showEasterEggToast("同盟侦察机安全撤离 — 追击机已清除。");
    clearRebelPursuers();
  }

  function failRebelMission(flyby) {
    showFloatingText(flyby.x - 20, flyby.y, "掩护不足，侦察机强行撤离", "#7a9ab8", 85);
    clearRebelPursuers();
  }

  function spawnStageBoss(bossType) {
    const boss = createEnemy(bossType, W / 2, -BOSS_TYPES[bossType].height);
    boss.entering = true;
    enemies.push(boss);
    audio.playBoss();
    showFloatingText(W / 2, 80, `⚠ ${BOSS_TYPES[bossType].name} 来袭!`, "#ffd700", 120);
    updateHUD();
  }

  function countsTowardStageGoal(enemy) {
    return !enemy.rebelPursuer && !enemy.easterEgg && !enemy.isBoss;
  }

  function checkStageComplete() {
    if (gameState !== "playing") return;
    const def = getStageDef(stage);
    if (stageKills < def.goalKills) return;
    if (def.boss) {
      if (!stageBossSpawned) {
        stageBossSpawned = true;
        spawnStageBoss(def.boss);
        return;
      }
      if (enemies.some((e) => e.isBoss)) return;
    }
    completeStage();
  }

  function completeStage() {
    if (gameState !== "playing") return;
    gameState = "stageClear";
    audio.stopBgm();
    enemyBullets = [];
    clearRebelPursuers();

    const def = getStageDef(stage);
    if (clearedStageEl) clearedStageEl.textContent = stage;
    if (clearedStageNameEl) clearedStageNameEl.textContent = def.name;
    if (stageClearScoreEl) stageClearScoreEl.textContent = stageScore;
    if (stageClearTotalEl) stageClearTotalEl.textContent = totalScore;
    const nextDef = getStageDef(stage + 1);
    if (nextStageNameEl) nextStageNameEl.textContent = nextDef.name;
    showOverlay(stageClearOverlay);

    if (stage % 3 === 0 && lives < MAX_LIVES) {
      lives++;
      showEasterEggToast(`连续突破 ${stage} 关！奖励生命 +1`);
    }
    updateHUD();
  }

  function proceedToNextStage() {
    hideAllOverlays();
    startStage(stage + 1);
    gameState = "playing";
    audio.startBgm();
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
        name: "补给运输机",
        hint: "靠近护航 2 秒",
        color: "#27ae60", accent: "#82e0aa",
      });
      showFloatingText(W / 2, 100, "友军运输机请求护航!", "#82e0aa", 100);
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
        name: "受损僚机",
        hint: "击落 8 架敌机救援",
        color: "#5dade2", accent: "#aed6f1",
      });
      showFloatingText(W / 2, 100, "友军僚机正在求救!", "#5dade2", 100);
    } else {
      allies.push({
        kind: "medical",
        x: -40, y: H * 0.55,
        width: 50, height: 38,
        hp: 20, maxHp: 20,
        speed: 1.4,
        escortTime: 0,
        escortGoal: 120,
        name: "医疗救援舰",
        hint: "护航医疗舰获生命补给",
        color: "#ffffff", accent: "#ff6b9d",
      });
      showFloatingText(W / 2, 100, "医疗救援舰抵达! 护航可获得生命补给", "#ff6b9d", 110);
    }
  }

  function completeAllyMission(ally) {
    audio.playAllySuccess();
    addScore(300);

    if (ally.kind === "medical") {
      if (trySpawnHealthDrop(ally.x, ally.y + 20)) {
        showFloatingText(ally.x, ally.y, "医疗补给投放!", "#ff6b9d", 90);
      } else if (canOfferHealth() === false && lives >= MAX_LIVES) {
        showFloatingText(ally.x, ally.y, "生命已满，改投护盾", "#3498db", 80);
        spawnPowerUp(ally.x, ally.y + 20, "shield");
      } else {
        showFloatingText(ally.x, ally.y, "补给冷却中，改投护盾", "#3498db", 80);
        spawnPowerUp(ally.x, ally.y + 20, "shield");
      }
      return;
    }

    showFloatingText(ally.x, ally.y, "任务完成! 道具投放", "#ffd700", 90);
    if (canOfferHealth() && Math.random() < 0.18) {
      trySpawnHealthDrop(ally.x, ally.y + 20);
      if (Math.random() < 0.35) spawnPowerUp(ally.x + 30, ally.y + 30);
    } else {
      spawnPowerUp(ally.x, ally.y + 20);
      if (Math.random() < 0.35) spawnPowerUp(ally.x + 30, ally.y + 30);
    }
  }

  function failAllyMission(ally) {
    audio.playAllyFail();
    showFloatingText(ally.x, ally.y, "友军任务失败", "#e74c3c", 70);
  }

  function showPickupToast(cfg) {
    pickupToast = { text: `获得【${cfg.fullName}】— ${cfg.desc}`, color: cfg.color, life: 150, maxLife: 150 };
  }

  function applyPowerUp(type) {
    const cfg = POWERUP_TYPES[type];
    audio.playPickup();
    showPickupToast(cfg);
    showFloatingText(player.x, player.y - 50, cfg.fullName, cfg.color, 70);

    switch (type) {
      case "power": buffs.power = Math.max(buffs.power, cfg.duration); break;
      case "shield": buffs.shield = Math.max(buffs.shield, cfg.duration); break;
      case "speed": buffs.speed = Math.max(buffs.speed, cfg.duration); syncPlayerSpeed(); break;
      case "bomb":
        enemies.filter((e) => !e.isBoss).forEach((e) => {
          spawnParticles(e.x, e.y, e.color, 8);
          if (e.rebelPursuer) {
            registerRebelPursuerKill();
          } else if (countsTowardStageGoal(e)) {
            stageKills++;
            totalScore += e.score;
            stageScore += e.score;
          } else {
            totalScore += e.score;
            stageScore += e.score;
          }
        });
        enemies = enemies.filter((e) => e.isBoss);
        enemyBullets = [];
        spawnParticles(W / 2, H / 2, "#f39c12", 40);
        audio.playExplode();
        updateHUD();
        checkStageComplete();
        break;
      case "health":
        if (lives < MAX_LIVES) {
          lives++;
          lastHealthFrame = frame;
          spawnParticles(player.x, player.y, "#ff6b9d", 15);
        } else {
          showFloatingText(player.x, player.y - 40, "生命已满", "#7a9ab8", 50);
        }
        break;
      case "laser": buffs.laser = Math.max(buffs.laser, cfg.duration); break;
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
        damage: 3, piercing: true, color: "#c084fc",
      });
    }

    if (hasPower) {
      const base = { y: py, width: 4, height: 14, speed: 11, damage: 1, piercing: false, color: "#00e5ff" };
      bullets.push({ ...base, x: player.x });
      [-18, 18].forEach((offset) => {
        bullets.push({
          ...base, x: player.x + offset, width: 3, height: 12, speed: 10,
          angle: offset > 0 ? 0.08 : -0.08,
        });
      });
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

  function enemyShoot(enemy, speed, spread = 0) {
    const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x) + spread;
    enemyBullets.push({ x: enemy.x, y: enemy.y + enemy.height / 2, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, width: 8, height: 8, damage: 1, color: enemy.accent });
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
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
    if (buffs.power > 0) buffs.power--;
    if (buffs.shield > 0) buffs.shield--;
    if (buffs.speed > 0) buffs.speed--;
    if (buffs.laser > 0) buffs.laser--;
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

  function setMouseTarget(x, y) {
    const margin = 20;
    mouseTarget = {
      x: Math.max(margin, Math.min(W - margin, x)),
      y: Math.max(margin, Math.min(H - margin, y)),
    };
    mouseMarker = { x: mouseTarget.x, y: mouseTarget.y, life: 40, maxLife: 40 };
  }

  function updatePlayer() {
    let dx = 0, dy = 0;
    if (keys["ArrowLeft"] || keys["a"] || keys["A"]) dx -= 1;
    if (keys["ArrowRight"] || keys["d"] || keys["D"]) dx += 1;
    if (keys["ArrowUp"] || keys["w"] || keys["W"]) dy -= 1;
    if (keys["ArrowDown"] || keys["s"] || keys["S"]) dy -= 1;

    const usingKeyboard = dx !== 0 || dy !== 0;

    if (usingKeyboard) {
      mouseTarget = null;
      if (dx !== 0 && dy !== 0) { const n = 1 / Math.SQRT2; dx *= n; dy *= n; }
      player.x += dx * player.speed;
      player.y += dy * player.speed;
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
      .slice(0, TRAIL_MAX);

    if (mouseMarker) { mouseMarker.life--; if (mouseMarker.life <= 0) mouseMarker = null; }
    if (player.shootCooldown > 0) player.shootCooldown--;
    if (keys[" "] || keys["Space"] || frame % 15 === 0) shoot();
  }

  function updateBullets() {
    bullets = bullets.filter((b) => { b.y -= b.speed; if (b.angle) b.x += Math.sin(b.angle) * b.speed * 0.3; return b.y > -30; });
    enemyBullets = enemyBullets.filter((b) => { b.x += b.vx; b.y += b.vy; return b.x > -20 && b.x < W + 20 && b.y > -20 && b.y < H + 20; });
  }

  function tryStageEvents() {
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
    const hasBoss = enemies.some((e) => e.isBoss);
    const goalMet = stageKills >= def.goalKills;
    if (!hasBoss && !(goalMet && def.boss) && frame % def.spawnRate === 0) spawnEnemy();
    tryStageEvents();

    enemies.forEach((e) => {
      if (e.entering) { e.y += 1.2; if (e.y >= 100) e.entering = false; return; }
      const cfg = BOSS_TYPES[e.type] || ENEMY_TYPES[e.type];
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
        e.x += (dx / d) * e.speed * 0.35;
        e.y += Math.min(e.speed * 0.85, (dy / d) * e.speed * 0.85);
        e.x = Math.max(e.width / 2, Math.min(W - e.width / 2, e.x));
      } else {
        e.y += e.speed * 0.88;
        e.x += (dx / d) * e.speed * 0.18;
      }

      if (cfg.shootInterval) {
        e.shootTimer = (e.shootTimer || 0) + 1;
        if (e.shootTimer >= cfg.shootInterval) {
          e.shootTimer = 0;
          if (e.type === "storm") [-0.3, -0.15, 0, 0.15, 0.3].forEach((s) => enemyShoot(e, e.bulletSpeed, s));
          else enemyShoot(e, e.bulletSpeed || 3);
        }
      }
      if (e.type === "commander" && cfg.spawnInterval) {
        e.spawnTimer = (e.spawnTimer || 0) + 1;
        if (e.spawnTimer >= cfg.spawnInterval && enemies.length < 12) {
          e.spawnTimer = 0;
          enemies.push(createEnemy("scout", e.x + (Math.random() - 0.5) * 60, e.y + 20));
        }
      }
    });
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
    audio.playExplode();

    allies.forEach((ally) => {
      if (ally.kind === "rescue" && ally.killCount < ally.killGoal) ally.killCount++;
    });

    if (enemy.rebelPursuer) registerRebelPursuerKill();

    if (enemy.easterEgg) {
      const msg = enemy.type === "dark_interceptor"
        ? "黑暗先锋舰坠落 — 这不是你父亲的双翼战机…"
        : "帝国巡逻机清除 — 听起来像有人在远处喊「我是你父亲」？";
      showFloatingText(enemy.x, enemy.y - 16, msg, enemy.accent, 100);
      if (enemy.type === "dark_interceptor") spawnPowerUp(enemy.x, enemy.y);
    } else if (enemy.isBoss) {
      showFloatingText(enemy.x, enemy.y, `${enemy.bossName} 击破! +${enemy.score}`, "#ffd700", 90);
      if (canOfferHealth() && Math.random() < HEALTH_BOSS_CHANCE) {
        trySpawnHealthDrop(enemy.x - 20, enemy.y);
      }
      if (Math.random() < BOSS_DROP_CHANCE) spawnPowerUp(enemy.x, enemy.y);
      if (Math.random() < BOSS_DROP_CHANCE * 0.4) spawnPowerUp(enemy.x + 25, enemy.y);
    } else {
      if (lives === 1 && canOfferHealth() && Math.random() < HEALTH_CRITICAL_CHANCE) {
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
    if (buffs.shield > 0) {
      buffs.shield = 0; invincibleUntil = frame + 90;
      spawnParticles(player.x, player.y, "#3498db", 18);
      showFloatingText(player.x, player.y - 30, "护盾破碎!", "#3498db", 50);
      audio.playHit(); updateHUD(); return true;
    }
    lives--;
    spawnParticles(player.x, player.y, "#00e5ff", 20);
    invincibleUntil = frame + 120;
    audio.playDamage();
    if (lives <= 0) {
      updateHUD();
      endGame();
    } else {
      resetPlayerPosition();
      enemyBullets = [];
      showFloatingText(player.x, player.y - 40, `战死复活 · 剩余 ${lives} 条命`, "#ffd93d", 75);
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
    const barW = W - 40;
    const x = 20;
    const y = H - 18;
    const ratio = def.boss && stageBossSpawned
      ? (enemies.some((e) => e.isBoss) ? 0.35 : 1)
      : Math.min(1, stageKills / def.goalKills);

    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(x, y, barW, 6);
    const grad = ctx.createLinearGradient(x, 0, x + barW, 0);
    grad.addColorStop(0, "#38bdf8");
    grad.addColorStop(1, "#a78bfa");
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, barW * ratio, 6);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.strokeRect(x, y, barW, 6);

    ctx.fillStyle = "rgba(200,220,240,0.55)";
    ctx.font = "9px Microsoft YaHei, sans-serif";
    ctx.textAlign = "left";
    const label = def.boss && stageBossSpawned && enemies.some((e) => e.isBoss)
      ? `第 ${stage} 关 · ${def.name} · 击败 Boss`
      : `第 ${stage} 关 · ${def.name}`;
    ctx.fillText(label, x, y - 4);
  }

  function drawBackground() {
    if (cosmos) sprites.drawCosmos(ctx, cosmos, W, H, frame);
  }

  function drawPlayerTrail() {
    sprites.drawPlayerTrail(ctx, playerTrail, player.width, player.height, buffs, frame);
  }

  function drawPlayer() {
    drawPlayerTrail();
    sprites.drawPlayer(ctx, player.x, player.y, player.width, player.height, buffs, frame, invincibleUntil);
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
    ctx.font = "bold 9px Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(ally.name, 0, -hh - 14);
    ctx.fillStyle = "#a8e6cf";
    ctx.font = "8px Microsoft YaHei, sans-serif";
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
    ctx.font = "8px Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(flyby.codename, 0, -flyby.height / 2 - 8);
    ctx.fillStyle = "#a8d8ff";
    ctx.font = "7px Microsoft YaHei, sans-serif";
    ctx.fillText(flyby.hint, 0, -flyby.height / 2 + 2);

    const ratio = flyby.killCount / flyby.killGoal;
    sprites.drawHpBar(ctx, 0, flyby.height / 2 + 6, flyby.width + 8, Math.min(1, ratio), "#74c0fc");
    ctx.fillStyle = "#d0e8ff";
    ctx.font = "7px Microsoft YaHei, sans-serif";
    ctx.fillText(`追击机 ${flyby.killCount}/${flyby.killGoal}`, 0, flyby.height / 2 + 18);
    ctx.restore();
  }

  function drawEnemy(e) {
    sprites.drawEnemy(ctx, e, frame);
    if (e.rebelPursuer) {
      ctx.save();
      ctx.translate(e.x, e.y - e.height / 2 - 10);
      ctx.fillStyle = "#ff6b6b";
      ctx.font = "7px Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("帝国追击", 0, 0);
      ctx.restore();
    } else if (e.codename && !e.isBoss) {
      ctx.save();
      ctx.translate(e.x, e.y - e.height / 2 - 12);
      ctx.fillStyle = e.accent;
      ctx.font = "8px Microsoft YaHei, sans-serif";
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
    ctx.font = "bold 10px Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(p.fullName, 0, 20);

    ctx.fillStyle = p.color;
    ctx.font = "8px Microsoft YaHei, sans-serif";
    ctx.fillText(p.shortDesc, 0, 30);

    ctx.restore();
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
    floatingTexts.forEach((t) => { ctx.globalAlpha = t.life / t.maxLife; ctx.fillStyle = t.color; ctx.font = "bold 16px Microsoft YaHei, sans-serif"; ctx.textAlign = "center"; ctx.fillText(t.text, t.x, t.y); });
    ctx.globalAlpha = 1;
  }

  function drawMouseMarker() {
    if (!mouseMarker) return;
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
    ctx.font = "bold 12px Microsoft YaHei, sans-serif";
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
    ctx.fillStyle = "#fff"; ctx.font = "11px Microsoft YaHei, sans-serif"; ctx.textAlign = "center"; ctx.fillText(boss.bossName, W / 2, y + 9);
  }

  function render() {
    drawBackground();
    allies.forEach(drawAlly);
    flybys.forEach(drawFlyby);
    powerUps.forEach(drawPowerUp);
    enemies.forEach(drawEnemy);
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
    updateHUD();
  }

  function gameLoop() { update(); render(); requestAnimationFrame(gameLoop); }

  const easterEggToastEl = document.getElementById("easterEggToast");
  const gameTitleEl = document.getElementById("gameTitle");
  const subtitleSecretEl = document.getElementById("subtitleSecret");
  const hudSecretEl = document.getElementById("hudSecret");
  const manualEasterEggEl = document.getElementById("manualEasterEgg");

  const CHEAT_PHRASES = {
    maytheforce: "原力与你同在 — 暗影刺客，愿星辰指引你的刀刃。",
    darkside: "我感觉到一股杀气……以及一点光剑电池的味道。",
    omega7: "Ω-7 任务档案：深入敌巢，迅如流星，静如深空。",
  };

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
    for (const [code, message] of Object.entries(CHEAT_PHRASES)) {
      if (key.endsWith(code)) {
        cheatBuffer = "";
        showEasterEggToast(message);
        if (gameState === "playing" && Math.random() < 0.35) spawnRebelFlyby(true);
        return true;
      }
    }
    return false;
  }

  function rollSubtitleSecret() {
    const pool = [
      "这不是你正在寻找的战机……但它确实很快。",
      "愿原力与你同在 — 至少在这一局里。",
      "帝国巡逻报告：目标过小，雷达难以锁定。",
      "有人说过：相信原力，也相信你的操作。",
    ];
    showEasterEggToast(pool[Math.floor(Math.random() * pool.length)]);
  }

  function beginPlaying() {
    hideAllOverlays();
    startStage(stage);
    audio.startBgm();
    gameState = "playing";
    canvas.classList.remove("is-entering");
    if (statsPanel) statsPanel.classList.remove("is-hidden");
  }

  function startGame(fromRestart) {
    if (gameState === "transition") return;
    audio.resume();
    resetCampaign();

    if (fromRestart) {
      beginPlaying();
      return;
    }

    gameState = "transition";
    showOverlay(overlay);
    overlay.classList.add("is-exiting");
    canvas.classList.add("is-entering");
    if (statsPanel) statsPanel.classList.add("is-hidden");

    setTimeout(() => beginPlaying(), 680);
  }

  function endGame() {
    gameState = "gameover";
    audio.stopBgm();
    if (finalScoreEl) finalScoreEl.textContent = totalScore;
    if (reachedStageEl) reachedStageEl.textContent = stage;
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
      else if (gameState === "gameover") showOverlay(gameOverOverlay);
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
    if (e.key === "h" || e.key === "H") {
      if (gameState === "manual") closeManual();
      else openManual();
    }
    if (e.key === "Escape" && gameState === "manual") closeManual();
    if (e.key === "m" || e.key === "M") {
      const muted = audio.toggleMute();
      if (muteBtn) muteBtn.textContent = muted ? "🔇" : "🔊";
    }
  });
  document.addEventListener("keyup", (e) => { keys[e.key] = false; });

  canvas.addEventListener("click", (e) => {
    if (gameState !== "playing") return;
    const pos = canvasCoords(e.clientX, e.clientY);
    setMouseTarget(pos.x, pos.y);
  });

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  startBtn.addEventListener("click", () => startGame(false));
  restartBtn.addEventListener("click", () => startGame(true));
  if (nextStageBtn) nextStageBtn.addEventListener("click", proceedToNextStage);
  if (openManualBtn) openManualBtn.addEventListener("click", openManual);
  if (helpBtn) helpBtn.addEventListener("click", openManual);
  if (closeManualBtn) closeManualBtn.addEventListener("click", closeManual);
  if (manualFromGameOverBtn) manualFromGameOverBtn.addEventListener("click", openManual);
  if (muteBtn) muteBtn.addEventListener("click", () => {
    audio.resume();
    const muted = audio.toggleMute();
    muteBtn.textContent = muted ? "🔇" : "🔊";
  });

  if (gameTitleEl) {
    gameTitleEl.addEventListener("click", () => {
      titleClickCount++;
      clearTimeout(titleClickTimer);
      titleClickTimer = setTimeout(() => { titleClickCount = 0; }, 900);
      if (titleClickCount >= 3) {
        titleClickCount = 0;
        showEasterEggToast("任务代号 Ω-7 已解锁：暗影刺客，直插敌巢。");
      }
    });
  }

  if (subtitleSecretEl) {
    subtitleSecretEl.addEventListener("click", () => {
      if (Math.random() < 0.22) rollSubtitleSecret();
      else showEasterEggToast("深空寂静。再试一次？");
    });
  }

  if (hudSecretEl) {
    hudSecretEl.addEventListener("click", () => {
      if (gameState === "playing") {
        if (Math.random() < 0.4) spawnRebelFlyby(true);
        else showEasterEggToast("雷达捕捉到微弱友军信号…");
      } else {
        showEasterEggToast("战斗中才能呼叫不明信号。");
      }
    });
  }

  if (manualEasterEggEl) {
    manualEasterEggEl.addEventListener("click", () => {
      showEasterEggToast("档案备注：同盟侦察机遭追击时，击落伴随的帝国追击机即可掩护其撤离。友军自带 IFF，子弹会穿透。");
    });
  }

  showOverlay(overlay);
  initBackground();
  render();
  gameLoop();
})();