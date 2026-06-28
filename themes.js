/* eslint-disable no-unused-vars */
window.GameThemes = (function () {
  "use strict";

  const UNIVERSE_THEMES = [
    {
      id: 0,
      name: "深空宙域",
      subtitle: "蓝紫星云走廊",
      megaBossName: "雷暴母舰",
      miniBossNames: ["哨戒巡洋舰", "裂空突击艇", "幽灵指挥艇"],
      easterEggType: "tie_patrol",
      easterEggChance: 0.025,
      cosmos: {
        hues: [220, 255, 285, 310, 195, 265, 330],
        starTints: ["#9ecfff", "#c4b5fd", "#fcd9b8"],
        bgStops: ["#000008", "#05051a", "#0a0828", "#120a35", "#08051c"],
        glowColor: "40,60,140",
        auroraHues: [200, 270, 320],
      },
      player: {
        hullPrimary: "#1e293b",
        hullSecondary: "#475569",
        accent: "#38bdf8",
        trail: "#38bdf8",
      },
      enemies: {
        scout: { color: "#e74c3c", accent: "#ff6b6b" },
        interceptor: { color: "#f39c12", accent: "#ffd93d" },
        gunship: { color: "#9b59b6", accent: "#d4a5ff" },
        phantom: { color: "#3498db", accent: "#74c0fc" },
        carrier: { color: "#2ecc71", accent: "#6ee7b7" },
        wraith: { color: "#6c1d8a", accent: "#d946ef" },
        meteor: { color: "#8b6914", accent: "#fbbf24" },
      },
      powerups: {
        power: { color: "#ff4757", bgColor: "#4a0a10", borderColor: "#ff6b6b" },
        shield: { color: "#3498db", bgColor: "#0a1a3a", borderColor: "#5dade2" },
        speed: { color: "#2ecc71", bgColor: "#0a2a18", borderColor: "#58d68d" },
        bomb: { color: "#f39c12", bgColor: "#3a2200", borderColor: "#f5b041" },
        laser: { color: "#a855f7", bgColor: "#1a0830", borderColor: "#c084fc" },
        health: { color: "#ff6b9d", bgColor: "#3a1028", borderColor: "#ff85b3" },
      },
      ui: {
        hudAccent: "#00e5ff",
        barFrom: "#38bdf8",
        barTo: "#a78bfa",
        floatingWave: "#00e5ff",
        floatingBoss: "#ffd700",
      },
      miniBosses: ["mini_sentry", "mini_striker", "mini_phantom"],
      megaBoss: "mega_storm",
    },
    {
      id: 1,
      name: "熔岩星系",
      subtitle: "余烬走廊",
      megaBossName: "熔核巨舰",
      miniBossNames: ["余烬巡洋舰", "熔流突击艇", "灰烬守卫舰"],
      easterEggType: "ember_hunter",
      easterEggChance: 0.028,
      cosmos: {
        hues: [5, 15, 25, 35, 10, 20, 40],
        starTints: ["#ffb347", "#ff6b35", "#ffd700"],
        bgStops: ["#0a0200", "#1a0800", "#2a1005", "#1a0500", "#0d0300"],
        glowColor: "180,60,20",
        auroraHues: [15, 30, 45],
      },
      player: {
        hullPrimary: "#3d1515",
        hullSecondary: "#7c2d12",
        accent: "#fb923c",
        trail: "#f97316",
      },
      enemies: {
        scout: { color: "#b91c1c", accent: "#fca5a5" },
        interceptor: { color: "#c2410c", accent: "#fdba74" },
        gunship: { color: "#9a3412", accent: "#f97316" },
        phantom: { color: "#dc2626", accent: "#fecaca" },
        carrier: { color: "#78350f", accent: "#fbbf24" },
        wraith: { color: "#7f1d1d", accent: "#f87171" },
        meteor: { color: "#92400e", accent: "#fcd34d" },
      },
      powerups: {
        power: { color: "#ef4444", bgColor: "#450a0a", borderColor: "#f87171" },
        shield: { color: "#f97316", bgColor: "#431407", borderColor: "#fb923c" },
        speed: { color: "#eab308", bgColor: "#422006", borderColor: "#facc15" },
        bomb: { color: "#dc2626", bgColor: "#3b0a0a", borderColor: "#ef4444" },
        laser: { color: "#f59e0b", bgColor: "#451a03", borderColor: "#fbbf24" },
        health: { color: "#fb7185", bgColor: "#4c0519", borderColor: "#fda4af" },
      },
      ui: {
        hudAccent: "#fb923c",
        barFrom: "#f97316",
        barTo: "#ef4444",
        floatingWave: "#fb923c",
        floatingBoss: "#fcd34d",
      },
      miniBosses: ["mini_ember", "mini_magma", "mini_ash"],
      megaBoss: "mega_lava",
    },
    {
      id: 2,
      name: "翡翠星云",
      subtitle: "生机宙域",
      megaBossName: "生态母舰",
      miniBossNames: ["孢子守卫舰", "藤须突击艇", "苔藓巡洋舰"],
      easterEggType: "spore_scout",
      easterEggChance: 0.028,
      cosmos: {
        hues: [140, 155, 165, 175, 130, 150, 160],
        starTints: ["#6ee7b7", "#34d399", "#a7f3d0"],
        bgStops: ["#000a06", "#021208", "#041a10", "#062015", "#030f0a"],
        glowColor: "20,120,80",
        auroraHues: [150, 165, 140],
      },
      player: {
        hullPrimary: "#14532d",
        hullSecondary: "#166534",
        accent: "#34d399",
        trail: "#6ee7b7",
      },
      enemies: {
        scout: { color: "#15803d", accent: "#86efac" },
        interceptor: { color: "#047857", accent: "#6ee7b7" },
        gunship: { color: "#065f46", accent: "#34d399" },
        phantom: { color: "#0d9488", accent: "#99f6e4" },
        carrier: { color: "#166534", accent: "#4ade80" },
        wraith: { color: "#134e4a", accent: "#2dd4bf" },
        meteor: { color: "#365314", accent: "#a3e635" },
      },
      powerups: {
        power: { color: "#22c55e", bgColor: "#052e16", borderColor: "#4ade80" },
        shield: { color: "#14b8a6", bgColor: "#042f2e", borderColor: "#2dd4bf" },
        speed: { color: "#84cc16", bgColor: "#1a2e05", borderColor: "#a3e635" },
        bomb: { color: "#10b981", bgColor: "#064e3b", borderColor: "#34d399" },
        laser: { color: "#059669", bgColor: "#022c22", borderColor: "#6ee7b7" },
        health: { color: "#4ade80", bgColor: "#052e16", borderColor: "#86efac" },
      },
      ui: {
        hudAccent: "#34d399",
        barFrom: "#22c55e",
        barTo: "#14b8a6",
        floatingWave: "#6ee7b7",
        floatingBoss: "#a3e635",
      },
      miniBosses: ["mini_spore", "mini_vine", "mini_moss"],
      megaBoss: "mega_eco",
    },
    {
      id: 3,
      name: "赛博霓虹",
      subtitle: "矩阵虚空",
      megaBossName: "矩阵主宰",
      miniBossNames: ["霓虹无人机", "故障猎手舰", "像素守卫舰"],
      easterEggType: "holo_drone",
      easterEggChance: 0.03,
      cosmos: {
        hues: [280, 300, 320, 180, 200, 260, 340],
        starTints: ["#e879f9", "#22d3ee", "#f472b6"],
        bgStops: ["#05000a", "#0a0018", "#120020", "#0d0015", "#080010"],
        glowColor: "120,40,180",
        auroraHues: [280, 190, 320],
      },
      player: {
        hullPrimary: "#312e81",
        hullSecondary: "#4c1d95",
        accent: "#e879f9",
        trail: "#22d3ee",
      },
      enemies: {
        scout: { color: "#c026d3", accent: "#f0abfc" },
        interceptor: { color: "#7c3aed", accent: "#c4b5fd" },
        gunship: { color: "#6d28d9", accent: "#a78bfa" },
        phantom: { color: "#0891b2", accent: "#67e8f9" },
        carrier: { color: "#be185d", accent: "#f9a8d4" },
        wraith: { color: "#9333ea", accent: "#d8b4fe" },
        meteor: { color: "#0e7490", accent: "#22d3ee" },
      },
      powerups: {
        power: { color: "#ec4899", bgColor: "#500724", borderColor: "#f472b6" },
        shield: { color: "#06b6d4", bgColor: "#083344", borderColor: "#22d3ee" },
        speed: { color: "#a855f7", bgColor: "#2e1065", borderColor: "#c084fc" },
        bomb: { color: "#d946ef", bgColor: "#4a044e", borderColor: "#e879f9" },
        laser: { color: "#8b5cf6", bgColor: "#1e1b4b", borderColor: "#a78bfa" },
        health: { color: "#f472b6", bgColor: "#831843", borderColor: "#fbcfe8" },
      },
      ui: {
        hudAccent: "#e879f9",
        barFrom: "#c026d3",
        barTo: "#22d3ee",
        floatingWave: "#22d3ee",
        floatingBoss: "#f0abfc",
      },
      miniBosses: ["mini_neon", "mini_glitch", "mini_pixel"],
      megaBoss: "mega_matrix",
    },
  ];

  function getUniverseIndex(stageNum) {
    return Math.floor((stageNum - 1) / 5) % UNIVERSE_THEMES.length;
  }

  function isMegaStage(stageNum) {
    return stageNum % 5 === 0;
  }

  function getTheme(index) {
    return UNIVERSE_THEMES[index % UNIVERSE_THEMES.length];
  }

  function getEndBossType(stageNum) {
    const theme = getTheme(getUniverseIndex(stageNum));
    if (isMegaStage(stageNum)) return theme.megaBoss;
    const miniIdx = (stageNum - 1) % theme.miniBosses.length;
    return theme.miniBosses[miniIdx];
  }

  function getEndBossName(stageNum) {
    const theme = getTheme(getUniverseIndex(stageNum));
    if (isMegaStage(stageNum)) return theme.megaBossName;
    const miniIdx = (stageNum - 1) % theme.miniBossNames.length;
    return theme.miniBossNames[miniIdx];
  }

  return {
    UNIVERSE_THEMES,
    getUniverseIndex,
    isMegaStage,
    getTheme,
    getEndBossType,
    getEndBossName,
  };
})();