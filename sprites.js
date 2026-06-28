/* eslint-disable no-unused-vars */
window.GameSprites = (function () {
  "use strict";

  function initCosmos(W, H, themeCosmos, densityScale = 1) {
    const density = Math.max(0.35, Math.min(1, densityScale));
    const starTintPool = themeCosmos?.starTints || ["#9ecfff", "#c4b5fd", "#fcd9b8"];
    const stars = [];
    for (let layer = 0; layer < 5; layer++) {
      const count = Math.round([200, 140, 70, 28, 10][layer] * density);
      for (let i = 0; i < count; i++) {
        const bright = Math.random();
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          size: (0.25 + layer * 0.22) + Math.random() * (layer >= 3 ? 1.2 : 0.6),
          speed: (0.12 + layer * 0.28) + Math.random() * 0.35,
          brightness: bright,
          twinkle: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.02 + Math.random() * 0.05,
          layer,
          flare: layer >= 4 && bright > 0.82,
          tint: Math.random() < 0.22
            ? starTintPool[Math.floor(Math.random() * starTintPool.length)]
            : "#ffffff",
        });
      }
    }

    const nebulae = [];
    const hues = themeCosmos?.hues || [220, 255, 285, 310, 195, 265, 330];
    for (let i = 0; i < Math.max(4, Math.round(10 * density)); i++) {
      nebulae.push({
        x: Math.random() * W, y: Math.random() * H,
        radius: 110 + Math.random() * 150,
        speed: 0.05 + Math.random() * 0.08,
        hue: hues[i % hues.length],
        hue2: hues[(i + 2) % hues.length],
        alpha: 0.05 + Math.random() * 0.07,
        rot: Math.random() * Math.PI * 2,
        stretch: 0.45 + Math.random() * 0.35,
      });
    }

    const auroraHues = themeCosmos?.auroraHues || [200, 270, 320];
    const auroras = [];
    for (let i = 0; i < Math.max(1, Math.round(3 * density)); i++) {
      auroras.push({
        x: Math.random() * W,
        y: 40 + Math.random() * H * 0.35,
        width: 120 + Math.random() * 180,
        height: 200 + Math.random() * 260,
        speed: 0.03 + Math.random() * 0.04,
        hue: auroraHues[i % auroraHues.length],
        phase: Math.random() * Math.PI * 2,
        alpha: 0.04 + Math.random() * 0.04,
      });
    }

    const galaxies = [];
    for (let i = 0; i < Math.max(2, Math.round(4 * density)); i++) {
      galaxies.push({
        x: Math.random() * W, y: Math.random() * H * 0.55,
        radius: 30 + Math.random() * 35,
        speed: 0.025 + Math.random() * 0.025,
        rot: Math.random() * Math.PI * 2,
        hue: [215, 275, 330, 250][i],
        tilt: (Math.random() - 0.5) * 0.8,
      });
    }

    const planets = [];
    for (let i = 0; i < 2; i++) {
      planets.push({
        x: 60 + Math.random() * (W - 120),
        y: -40 - Math.random() * 120,
        radius: 28 + Math.random() * 42,
        speed: 0.035 + Math.random() * 0.03,
        hue: [210, 25, 280][i],
        ring: i === 0,
        glow: 0.12 + Math.random() * 0.1,
      });
    }

    const dust = [];
    for (let i = 0; i < Math.max(20, Math.round(55 * density)); i++) {
      dust.push({
        x: Math.random() * W, y: Math.random() * H,
        size: 0.6 + Math.random() * 2.2,
        speed: 0.22 + Math.random() * 0.45,
        alpha: 0.03 + Math.random() * 0.08,
        drift: (Math.random() - 0.5) * 0.15,
      });
    }

    const milkyBand = {
      y: H * (0.15 + Math.random() * 0.25),
      angle: -0.25 + Math.random() * 0.15,
      alpha: 0.07 + Math.random() * 0.04,
    };

    return { stars, nebulae, auroras, galaxies, planets, dust, milkyBand, shootingStars: [], cosmicPulse: 0, themeCosmos: themeCosmos || null };
  }

  function updateCosmos(cosmos, W, H, level, frame) {
    cosmos.cosmicPulse = frame * 0.008;
    cosmos.stars.forEach((s) => {
      s.y += s.speed + level * 0.06;
      s.twinkle += s.twinkleSpeed;
      if (s.y > H + 4) { s.y = -4; s.x = Math.random() * W; }
    });
    cosmos.nebulae.forEach((n) => {
      n.y += n.speed + level * 0.015;
      n.rot += 0.0005;
      if (n.y > H + n.radius) { n.y = -n.radius; n.x = Math.random() * W; }
    });
    if (cosmos.auroras) {
      cosmos.auroras.forEach((a) => {
        a.y += a.speed;
        a.phase += 0.012;
        if (a.y > H + a.height) { a.y = -a.height; a.x = Math.random() * W; }
      });
    }
    cosmos.galaxies.forEach((g) => {
      g.y += g.speed + level * 0.01;
      g.rot += 0.0007;
      if (g.y > H + 50) { g.y = -50; g.x = Math.random() * W; }
    });
    cosmos.planets.forEach((p) => {
      p.y += p.speed;
      if (p.y > H + p.radius + 20) {
        p.y = -p.radius - 40;
        p.x = 60 + Math.random() * (W - 120);
      }
    });
    cosmos.dust.forEach((d) => {
      d.y += d.speed + level * 0.02;
      d.x += d.drift;
      if (d.y > H) { d.y = 0; d.x = Math.random() * W; }
    });

    if (frame % 280 === 0 && cosmos.shootingStars.length < 3) {
      cosmos.shootingStars.push({
        x: Math.random() * W, y: Math.random() * H * 0.35,
        len: 50 + Math.random() * 90,
        speed: 10 + Math.random() * 6,
        life: 24 + Math.random() * 18,
        hue: Math.random() < 0.3 ? 200 : 0,
      });
    }
    cosmos.shootingStars = cosmos.shootingStars.filter((s) => {
      s.x += s.speed * 0.55;
      s.y += s.speed * 0.85;
      s.life--;
      return s.life > 0;
    });
  }

  function starColor(tint, alpha) {
    if (tint === "#9ecfff") return `rgba(158,207,255,${alpha})`;
    if (tint === "#c4b5fd") return `rgba(196,181,253,${alpha})`;
    if (tint === "#fcd9b8") return `rgba(252,217,184,${alpha})`;
    return `rgba(255,255,255,${alpha})`;
  }

  function drawCosmos(ctx, cosmos, W, H, frame) {
    const pulse = cosmos.cosmicPulse || 0;
    const tc = cosmos.themeCosmos;
    const bgStops = tc?.bgStops || ["#000008", "#05051a", "#0a0828", "#120a35", "#08051c"];
    const glowRgb = tc?.glowColor || "40,60,140";

    const deep = ctx.createLinearGradient(0, 0, W, H);
    deep.addColorStop(0, bgStops[0]);
    deep.addColorStop(0.25, bgStops[1]);
    deep.addColorStop(0.55, bgStops[2]);
    deep.addColorStop(0.82, bgStops[3]);
    deep.addColorStop(1, bgStops[4]);
    ctx.fillStyle = deep;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(W * 0.3, H * 0.15, 0, W * 0.5, H * 0.4, H * 0.9);
    glow.addColorStop(0, `rgba(${glowRgb},${0.18 + Math.sin(pulse) * 0.03})`);
    glow.addColorStop(0.45, `rgba(${glowRgb},0.08)`);
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    if (cosmos.milkyBand) {
      const band = cosmos.milkyBand;
      ctx.save();
      ctx.translate(W / 2, band.y);
      ctx.rotate(band.angle);
      const mg = ctx.createLinearGradient(-W, 0, W, 0);
      mg.addColorStop(0, "rgba(0,0,0,0)");
      mg.addColorStop(0.35, `rgba(180,190,255,${band.alpha * 0.5})`);
      mg.addColorStop(0.5, `rgba(220,210,255,${band.alpha})`);
      mg.addColorStop(0.65, `rgba(160,170,240,${band.alpha * 0.6})`);
      mg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = mg;
      ctx.fillRect(-W, -18, W * 2, 36);
      ctx.restore();
    }

    if (cosmos.auroras) {
      cosmos.auroras.forEach((a) => {
        const wave = Math.sin(a.phase) * 0.35 + 0.65;
        const g = ctx.createLinearGradient(a.x, a.y, a.x + a.width * 0.3, a.y + a.height);
        g.addColorStop(0, `hsla(${a.hue},70%,65%,0)`);
        g.addColorStop(0.35, `hsla(${a.hue},80%,70%,${a.alpha * wave})`);
        g.addColorStop(0.7, `hsla(${a.hue + 40},70%,60%,${a.alpha * 0.5 * wave})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(a.x, a.y, a.width, a.height, -0.35, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    cosmos.nebulae.forEach((n) => {
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate(n.rot);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, n.radius);
      g.addColorStop(0, `hsla(${n.hue},85%,72%,${n.alpha * 2.2})`);
      g.addColorStop(0.35, `hsla(${n.hue2 || n.hue + 25},75%,55%,${n.alpha * 1.2})`);
      g.addColorStop(0.7, `hsla(${n.hue},60%,35%,${n.alpha * 0.5})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, n.radius, n.radius * (n.stretch || 0.6), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.ellipse(n.radius * 0.15, 0, n.radius * 0.55, n.radius * 0.3, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    });

    cosmos.galaxies.forEach((g) => {
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.rot);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, g.radius * 1.6);
      grad.addColorStop(0, `hsla(${g.hue},70%,88%,0.32)`);
      grad.addColorStop(0.25, `hsla(${g.hue},65%,65%,0.16)`);
      grad.addColorStop(0.6, `hsla(${g.hue + 20},50%,40%,0.06)`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, g.radius * 1.8, g.radius * 0.55, g.tilt || 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    cosmos.planets.forEach((p) => {
      const glowR = p.radius * 2.2;
      const outer = ctx.createRadialGradient(p.x, p.y, p.radius * 0.5, p.x, p.y, glowR);
      outer.addColorStop(0, `hsla(${p.hue},60%,55%,${p.glow || 0.12})`);
      outer.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = outer;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      const g = ctx.createRadialGradient(p.x - p.radius * 0.35, p.y - p.radius * 0.35, 0, p.x, p.y, p.radius);
      g.addColorStop(0, `hsla(${p.hue},55%,78%,0.65)`);
      g.addColorStop(0.55, `hsla(${p.hue},45%,42%,0.5)`);
      g.addColorStop(1, `hsla(${p.hue},40%,18%,0.15)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      if (p.ring) {
        ctx.strokeStyle = `hsla(${p.hue},50%,78%,0.22)`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radius * 1.75, p.radius * 0.32, -0.45, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    cosmos.dust.forEach((d) => {
      ctx.fillStyle = `rgba(160,185,255,${d.alpha})`;
      ctx.fillRect(d.x, d.y, d.size, d.size * 0.45);
    });

    cosmos.stars.forEach((s) => {
      const tw = 0.55 + Math.sin(s.twinkle) * 0.45;
      const depth = [0.35, 0.5, 0.7, 0.95, 1.15][s.layer] || 0.5;
      const alpha = (0.12 + s.brightness * 0.88) * tw * depth;
      ctx.fillStyle = starColor(s.tint, alpha);
      if (s.layer >= 2) {
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = s.flare ? 8 : s.layer >= 4 ? 5 : 2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        if (s.flare) {
          ctx.strokeStyle = starColor(s.tint, alpha * 0.55);
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(s.x - s.size * 3, s.y);
          ctx.lineTo(s.x + s.size * 3, s.y);
          ctx.moveTo(s.x, s.y - s.size * 3);
          ctx.lineTo(s.x, s.y + s.size * 3);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      } else {
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
    });

    cosmos.shootingStars.forEach((s) => {
      const a = s.life / 42;
      const c0 = s.hue ? `hsla(${s.hue},90%,85%,${a})` : `rgba(255,255,255,${a})`;
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.len * 0.65, s.y - s.len);
      grad.addColorStop(0, c0);
      grad.addColorStop(0.4, `rgba(180,210,255,${a * 0.5})`);
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = s.hue ? 2.5 : 1.8;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.len * 0.65, s.y - s.len);
      ctx.stroke();
    });

    const vignette = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.15, W / 2, H * 0.5, H * 0.95);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.62)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);
  }

  function drawPlayerTrail(ctx, trail, w, h, buffs, f, themePalette) {
    if (!trail.length) return;

    const hasSpeed = buffs.speed > 0;
    const hasLaser = buffs.laser > 0;
    const baseAccent = themePalette?.trail || themePalette?.accent || "#38bdf8";
    let accent = hasLaser ? "#a78bfa" : hasSpeed ? "#5eead4" : baseAccent;

    trail.forEach((t, i) => {
      const fade = t.life * (1 - i / trail.length);
      const alpha = fade * 0.42;
      if (alpha < 0.02) return;

      const lag = (i + 1) * (hasSpeed ? 1.1 : 0.85);
      const tx = t.x - t.vx * lag;
      const ty = t.y - t.vy * lag;
      const scale = 1 - i * 0.045;
      const hw = w * 0.5 * scale;
      const hh = h * 0.5 * scale;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(tx, ty);

      if (i < 3 && fade > 0.25) {
        const streak = ctx.createLinearGradient(0, 0, -t.vx * 3, -t.vy * 3);
        streak.addColorStop(0, `rgba(56,189,248,${alpha * 0.9})`);
        streak.addColorStop(1, "rgba(56,189,248,0)");
        ctx.strokeStyle = streak;
        ctx.lineWidth = (3 - i * 0.6) * (hasSpeed ? 1.3 : 1);
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-t.vx * 2.8, -t.vy * 2.8);
        ctx.stroke();
      }

      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(0, -hh);
      ctx.lineTo(-hw * 0.35, hh * 0.1);
      ctx.lineTo(0, hh * 0.85);
      ctx.lineTo(hw * 0.35, hh * 0.1);
      ctx.closePath();
      ctx.fill();

      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.ellipse(0, -hh * 0.2, hw * 0.18, hh * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  function drawEngineFlame(ctx, ox, oy, scale, hot) {
    const flicker = Math.sin(frame * 0.5) * 3;
    const len = (10 + flicker) * scale;
    const g = ctx.createLinearGradient(ox, oy, ox, oy + len);
    g.addColorStop(0, hot ? "#fff" : "#ffeb3b");
    g.addColorStop(0.3, hot ? "#ff9800" : "#ff9800");
    g.addColorStop(1, "rgba(255,80,0,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ox - 4 * scale, oy);
    ctx.lineTo(ox, oy + len);
    ctx.lineTo(ox + 4 * scale, oy);
    ctx.fill();
  }

  let frame = 0;

  function drawHullDamage(ctx, w, h, damage, accent, f) {
    if (damage < 1) return;
    ctx.save();
    if (damage >= 1) {
      ctx.fillStyle = "rgba(40,18,8,0.55)";
      ctx.beginPath();
      ctx.ellipse(-w * 0.28, -h * 0.02, w * 0.14, h * 0.08, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,120,60,0.45)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-w * 0.34, h * 0.02);
      ctx.lineTo(-w * 0.18, -h * 0.08);
      ctx.stroke();
    }
    if (damage >= 2) {
      ctx.fillStyle = "rgba(25,12,8,0.65)";
      ctx.beginPath();
      ctx.moveTo(w * 0.22, -h * 0.06);
      ctx.lineTo(w * 0.48, h * 0.02);
      ctx.lineTo(w * 0.38, h * 0.1);
      ctx.lineTo(w * 0.12, h * 0.04);
      ctx.closePath();
      ctx.fill();
      const smokeA = 0.22 + Math.sin(f * 0.09) * 0.08;
      ctx.fillStyle = `rgba(120,120,130,${smokeA})`;
      ctx.beginPath();
      ctx.ellipse(w * 0.34, h * 0.14, w * 0.08, h * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-w * 0.1, h * 0.18, w * 0.06, h * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    if (damage >= 3) {
      ctx.strokeStyle = `rgba(255,200,120,${0.35 + (f % 12 < 6 ? 0.25 : 0)})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-2, -h * 0.22);
      ctx.lineTo(1, -h * 0.08);
      ctx.lineTo(-1, h * 0.02);
      ctx.stroke();
      ctx.fillStyle = `rgba(255,180,80,${0.5 + Math.sin(f * 0.4) * 0.3})`;
      ctx.beginPath();
      ctx.arc(w * 0.08, h * 0.12, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawRespawnWarp(ctx, w, h, t, accent) {
    if (t <= 0 || t >= 1) return;
    const alpha = (1 - Math.abs(t - 0.45) * 2.2) * 0.55;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const ring = w * (0.6 + t * 1.8 + i * 0.25);
      ctx.beginPath();
      ctx.ellipse(0, 0, ring, ring * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.35})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, w * 0.35, h * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPlayer(ctx, x, y, w, h, buffs, f, invincibleUntil, themePalette, opts) {
    frame = f;
    const playerOpts = opts || {};
    const hp = playerOpts.hp ?? 4;
    const maxHp = playerOpts.maxHp ?? 4;
    const respawnT = playerOpts.respawnT ?? 0;
    const damage = Math.max(0, maxHp - hp);
    const dmgFade = damage >= 3 ? 0.78 + Math.sin(f * 0.18) * 0.06 : 1 - damage * 0.06;

    if (f < invincibleUntil && Math.floor(f / 6) % 2 === 0 && respawnT <= 0) return;

    const hasPower = buffs.power > 0;
    const hasShield = buffs.shield > 0;
    const hasSpeed = buffs.speed > 0;
    const hasLaser = buffs.laser > 0;

    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = dmgFade;

    let hullPrimary = themePalette?.hullPrimary || "#1e293b";
    let hullSecondary = themePalette?.hullSecondary || "#475569";
    let accent = themePalette?.accent || "#38bdf8";
    if (hasLaser && hasPower) { hullPrimary = "#581c87"; hullSecondary = "#a855f7"; accent = "#fb7185"; }
    else if (hasLaser) { hullPrimary = "#4c1d95"; hullSecondary = "#7c3aed"; accent = "#c084fc"; }
    else if (hasPower) { hullPrimary = "#7f1d1d"; hullSecondary = "#b91c1c"; accent = "#fca5a5"; }
    else if (hasSpeed) { hullPrimary = "#134e4a"; hullSecondary = "#0f766e"; accent = "#5eead4"; }

    if (respawnT > 0) drawRespawnWarp(ctx, w, h, respawnT, accent);

    if (hasShield) {
      const pulse = 0.45 + Math.sin(f * 0.12) * 0.2;
      ctx.strokeStyle = `rgba(93,173,226,${pulse})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.82, h * 0.88, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowColor = accent;
    ctx.shadowBlur = hasLaser ? 10 : hasSpeed ? 7 : 4;

    const wingClip = damage >= 2 ? 0.88 : 1;
    const leftWingTip = -w * 0.58 * wingClip;
    const rightWingTip = w * 0.58 * wingClip;

    const fuselage = ctx.createLinearGradient(-w * 0.2, -h / 2, w * 0.2, h / 2);
    fuselage.addColorStop(0, "#64748b");
    fuselage.addColorStop(0.35, hullSecondary);
    fuselage.addColorStop(0.7, hullPrimary);
    fuselage.addColorStop(1, "#020617");

    ctx.fillStyle = fuselage;
    ctx.beginPath();
    ctx.moveTo(0, -h / 2 - (hasLaser ? 5 : 2));
    ctx.lineTo(-w * 0.1, -h * 0.28);
    ctx.lineTo(-w * 0.08, h * 0.18);
    ctx.lineTo(0, h / 2 + 2);
    ctx.lineTo(w * 0.08, h * 0.18);
    ctx.lineTo(w * 0.1, -h * 0.28);
    ctx.closePath();
    ctx.fill();

    const wingGrad = ctx.createLinearGradient(0, -h * 0.1, 0, h * 0.2);
    wingGrad.addColorStop(0, hullSecondary);
    wingGrad.addColorStop(1, hullPrimary);
    ctx.fillStyle = wingGrad;
    ctx.beginPath();
    ctx.moveTo(-w * 0.1, -h * 0.05);
    ctx.lineTo(leftWingTip, h * 0.12);
    ctx.lineTo(-w * 0.22, h * 0.22);
    ctx.lineTo(-w * 0.08, h * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(w * 0.1, -h * 0.05);
    ctx.lineTo(rightWingTip, h * 0.12);
    ctx.lineTo(w * 0.22, h * 0.22);
    ctx.lineTo(w * 0.08, h * 0.08);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(15,23,42,0.85)";
    ctx.fillRect(-w * 0.14, h * 0.1, w * 0.28, h * 0.14);
    ctx.fillStyle = "#0f172a";
    [-w * 0.18, w * 0.18].forEach((ox) => {
      ctx.beginPath();
      ctx.moveTo(ox, h * 0.08);
      ctx.lineTo(ox + (ox < 0 ? -4 : 4), h * 0.32);
      ctx.lineTo(ox + (ox < 0 ? 2 : -2), h * 0.28);
      ctx.closePath();
      ctx.fill();
    });

    ctx.strokeStyle = accent;
    ctx.globalAlpha = dmgFade * 0.7;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-w * 0.22, h * 0.04);
    ctx.lineTo(-w * 0.42, h * 0.18);
    ctx.moveTo(w * 0.22, h * 0.04);
    ctx.lineTo(w * 0.42, h * 0.18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.2);
    ctx.lineTo(0, h * 0.15);
    ctx.stroke();
    ctx.globalAlpha = dmgFade;

    const canopy = ctx.createLinearGradient(-3, -h * 0.32, 4, -h * 0.1);
    canopy.addColorStop(0, "#f8fafc");
    canopy.addColorStop(0.45, accent);
    canopy.addColorStop(1, "#1e293b");
    ctx.fillStyle = canopy;
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.22, w * 0.11, h * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(-1, -h * 0.26, w * 0.04, -0.8, 0.4);
    ctx.stroke();

    ctx.fillStyle = accent;
    ctx.globalAlpha = dmgFade * (damage >= 1 ? 0.22 : 0.42);
    ctx.fillRect(-w * 0.03, -h * 0.08, w * 0.06, h * 0.38);
    ctx.globalAlpha = dmgFade;

    if (hasPower) {
      ctx.fillStyle = "#ef4444";
      [-w * 0.22, 0, w * 0.22].forEach((ox) => {
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(ox, -h / 2 + 2, 2.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;
    }

    if (hasLaser) {
      ctx.fillStyle = "#c084fc";
      ctx.beginPath();
      ctx.moveTo(0, -h / 2 - 12);
      ctx.lineTo(-3.5, -h / 2 + 2);
      ctx.lineTo(3.5, -h / 2 + 2);
      ctx.closePath();
      ctx.fill();
    }

    drawHullDamage(ctx, w, h, damage, accent, f);

    ctx.shadowBlur = 0;
    const hot = hasPower || hasSpeed;
    const trail = hasSpeed ? 1.35 : 1;
    const engineWeak = damage >= 3 ? 0.55 : damage >= 2 ? 0.8 : 1;
    drawEngineFlame(ctx, -w * 0.16, h / 2 - 2, 0.7 * trail * engineWeak, hot);
    drawEngineFlame(ctx, w * 0.16, h / 2 - 2, 0.7 * trail * engineWeak, hot);
    drawEngineFlame(ctx, 0, h / 2, 0.85 * trail, hot);

    if (hasSpeed) {
      ctx.strokeStyle = "rgba(94,234,212,0.5)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-w * 0.32, h * 0.2);
      ctx.lineTo(-w * 0.58, h * 0.38);
      ctx.moveTo(w * 0.32, h * 0.2);
      ctx.lineTo(w * 0.58, h * 0.38);
      ctx.stroke();
    }

    ctx.restore();
  }

  function hullPlate(ctx, path, fill, stroke) {
    ctx.fillStyle = fill;
    ctx.fill(path);
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 0.8; ctx.stroke(path); }
  }

  function drawEnemyScout(ctx, e, hw, hh) {
    const p = new Path2D();
    p.moveTo(0, hh); p.lineTo(-hw, -hh * 0.2); p.lineTo(-hw * 0.7, -hh);
    p.lineTo(-hw * 0.2, -hh * 0.7); p.lineTo(0, -hh * 0.85);
    p.lineTo(hw * 0.2, -hh * 0.7); p.lineTo(hw * 0.7, -hh); p.lineTo(hw, -hh * 0.2);
    p.closePath();
    hullPlate(ctx, p, e.color, "rgba(0,0,0,0.4)");
    ctx.fillStyle = e.accent;
    ctx.fillRect(-4, -hh * 0.1, 8, hh * 0.55);
    ctx.fillStyle = "#ff6b6b";
    ctx.beginPath(); ctx.arc(-hw * 0.55, hh * 0.3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hw * 0.55, hh * 0.3, 3, 0, Math.PI * 2); ctx.fill();
    const eg = ctx.createRadialGradient(0, -hh * 0.5, 0, 0, -hh * 0.5, 5);
    eg.addColorStop(0, "#ffaaaa"); eg.addColorStop(1, e.accent);
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.arc(0, -hh * 0.5, 4, 0, Math.PI * 2); ctx.fill();
  }

  function drawEnemyInterceptor(ctx, e, hw, hh) {
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.moveTo(0, hh); ctx.lineTo(-hw * 0.25, hh * 0.4);
    ctx.lineTo(-hw * 0.12, -hh); ctx.lineTo(hw * 0.12, -hh);
    ctx.lineTo(hw * 0.25, hh * 0.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = e.accent;
    ctx.beginPath();
    ctx.moveTo(0, -hh * 0.85); ctx.lineTo(-hw * 0.65, hh * 0.1); ctx.lineTo(hw * 0.65, hh * 0.1);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, -hh); ctx.lineTo(0, hh * 0.5); ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(0, -hh * 0.3, 3, 0, Math.PI * 2); ctx.fill();
  }

  function drawEnemyGunship(ctx, e, hw, hh) {
    ctx.fillStyle = "#2d1b3d";
    ctx.fillRect(-hw, -hh * 0.45, hw * 2, hh * 0.9);
    const p = new Path2D();
    p.moveTo(0, hh); p.lineTo(-hw * 0.9, -hh * 0.2); p.lineTo(hw * 0.9, -hh * 0.2); p.closePath();
    hullPlate(ctx, p, e.color, "rgba(0,0,0,0.5)");
    ctx.fillStyle = e.accent;
    ctx.fillRect(-hw * 0.75, -hh * 0.35, hw * 0.35, hh * 0.25);
    ctx.fillRect(hw * 0.4, -hh * 0.35, hw * 0.35, hh * 0.25);
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(-hw + 5, -hh * 0.15, hw * 2 - 10, 8);
    ["#ff4757", "#ff6b6b", "#ff4757"].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath(); ctx.arc((i - 1) * hw * 0.45, hh * 0.45, 4, 0, Math.PI * 2); ctx.fill();
    });
  }

  function drawEnemyPhantom(ctx, e, hw, hh) {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.ellipse(0, 0, hw * 0.75, hh * 0.85, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = e.accent;
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.moveTo(s * hw * 0.5, 0);
      ctx.lineTo(s * hw * 1.35, -hh * 0.45);
      ctx.lineTo(s * hw * 0.85, 0);
      ctx.lineTo(s * hw * 1.35, hh * 0.45);
      ctx.closePath(); ctx.fill();
    });
    ctx.globalAlpha = 0.6 + Math.sin(frame * 0.1) * 0.2;
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(0, -hh * 0.15, 6, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawEnemyCarrier(ctx, e, hw, hh) {
    ctx.fillStyle = e.color;
    ctx.fillRect(-hw, -hh * 0.35, hw * 2, hh * 0.7);
    ctx.fillStyle = e.accent;
    ctx.fillRect(-hw * 0.8, hh * 0.15, hw * 0.45, hh * 0.45);
    ctx.fillRect(hw * 0.35, hh * 0.15, hw * 0.45, hh * 0.45);
    ctx.fillStyle = "#34495e";
    [-0.5, 0, 0.5].forEach((i) => {
      ctx.fillRect(i * hw * 0.55 - 4, -hh * 0.65, 8, hh * 0.35);
      ctx.fillStyle = "#2c3e50";
      ctx.fillRect(i * hw * 0.55 - 2, -hh * 0.55, 4, 4);
      ctx.fillStyle = "#34495e";
    });
    ctx.strokeStyle = "rgba(110,231,183,0.4)"; ctx.lineWidth = 1;
    ctx.strokeRect(-hw + 3, -hh * 0.3, hw * 2 - 6, hh * 0.6);
  }

  function drawEnemyWraith(ctx, e, hw, hh) {
    const shimmer = 0.7 + Math.sin(frame * 0.15 + e.x * 0.01) * 0.3;
    ctx.globalAlpha = shimmer;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.moveTo(0, hh); ctx.lineTo(-hw * 0.8, 0); ctx.lineTo(0, -hh);
    ctx.lineTo(hw * 0.8, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = e.accent; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-hw * 0.4, 0); ctx.lineTo(hw * 0.4, 0); ctx.stroke();
    ctx.fillStyle = "#ff6b6b";
    ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawEnemyMeteor(ctx, e, hw, hh) {
    ctx.fillStyle = "#4a3728";
    ctx.beginPath();
    ctx.ellipse(0, 0, hw, hh * 0.85, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6b5344";
    ctx.beginPath(); ctx.arc(-hw * 0.3, -hh * 0.2, hw * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hw * 0.2, hh * 0.15, hw * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = e.accent;
    ctx.beginPath(); ctx.moveTo(-hw * 0.1, -hh * 0.5); ctx.lineTo(hw * 0.15, -hh * 0.1); ctx.lineTo(0, hh * 0.3); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "rgba(255,200,100,0.3)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 0, hw + 3, hh * 0.85 + 3, 0.3, 0, Math.PI * 2); ctx.stroke();
  }

  function drawBossAssault(ctx, e, hw, hh) {
    const p = new Path2D();
    p.moveTo(0, hh); p.lineTo(-hw, hh * 0.15); p.lineTo(-hw * 0.85, -hh);
    p.lineTo(-hw * 0.2, -hh * 0.65); p.lineTo(0, -hh * 0.75);
    p.lineTo(hw * 0.2, -hh * 0.65); p.lineTo(hw * 0.85, -hh); p.lineTo(hw, hh * 0.15);
    p.closePath();
    hullPlate(ctx, p, e.color, "rgba(0,0,0,0.6)");
    ctx.fillStyle = e.accent;
    ctx.fillRect(-hw * 0.65, -hh * 0.25, hw * 1.3, hh * 0.35);
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(-hw * 0.5, -hh * 0.1, hw, 6);
    [-0.5, 0, 0.5].forEach((i) => {
      ctx.fillStyle = "#ff4757";
      ctx.beginPath(); ctx.arc(i * hw * 0.55, hh * 0.45, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffaaaa";
      ctx.beginPath(); ctx.arc(i * hw * 0.55, hh * 0.45, 2, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 10px Microsoft YaHei,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BOSS", 0, -hh - 8);
  }

  function drawBossCommander(ctx, e, hw, hh) {
    ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.ellipse(0, 0, hw, hh * 0.88, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = e.accent; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 0, hw * 0.62, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, hw * 0.35, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + frame * 0.025;
      const ox = Math.cos(a) * hw * 0.78;
      const oy = Math.sin(a) * hh * 0.65;
      ctx.fillStyle = e.accent;
      ctx.beginPath(); ctx.arc(ox, oy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(ox, oy, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 10px Microsoft YaHei,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BOSS", 0, -hh - 8);
  }

  function drawBossStorm(ctx, e, hw, hh) {
    const p = new Path2D();
    p.moveTo(-hw, hh * 0.35); p.lineTo(-hw * 0.55, -hh); p.lineTo(-hw * 0.1, -hh * 0.55);
    p.lineTo(0, -hh * 0.75); p.lineTo(hw * 0.1, -hh * 0.55); p.lineTo(hw * 0.55, -hh);
    p.lineTo(hw, hh * 0.35); p.lineTo(0, hh); p.closePath();
    hullPlate(ctx, p, e.color, "rgba(0,0,0,0.5)");
    ctx.fillStyle = e.accent;
    ctx.fillRect(-hw * 0.35, -hh * 0.15, hw * 0.7, hh * 0.45);
    const bolt = 0.5 + Math.sin(frame * 0.18) * 0.5;
    ctx.strokeStyle = `rgba(116,192,252,${bolt})`; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-hw * 0.65, -hh * 0.45); ctx.lineTo(-hw * 0.3, -hh * 0.85);
    ctx.lineTo(-hw * 0.1, -hh * 0.45); ctx.lineTo(0, -hh * 0.75);
    ctx.lineTo(hw * 0.1, -hh * 0.45); ctx.lineTo(hw * 0.3, -hh * 0.85);
    ctx.lineTo(hw * 0.65, -hh * 0.45); ctx.stroke();
    ctx.fillStyle = "#ffd700";
    ctx.font = "bold 10px Microsoft YaHei,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BOSS", 0, -hh - 8);
  }

  function drawEnemyTiePatrol(ctx, e, hw, hh) {
    ctx.fillStyle = e.accent;
    ctx.beginPath();
    ctx.ellipse(0, 0, hw * 0.42, hh * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#050505";
    ctx.beginPath();
    ctx.ellipse(0, 0, hw * 0.28, hh * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = e.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-hw, 0);
    ctx.lineTo(hw, 0);
    ctx.stroke();
    ctx.fillStyle = "#111";
    ctx.fillRect(-hw, -2.5, hw * 2, 5);
    ctx.fillStyle = "#ff3333";
    ctx.beginPath();
    ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawEnemyDarkInterceptor(ctx, e, hw, hh) {
    drawEnemyTiePatrol(ctx, e, hw, hh);
    ctx.fillStyle = e.accent;
    ctx.beginPath();
    ctx.moveTo(0, -hh * 0.55);
    ctx.lineTo(-hw * 0.35, -hh * 0.1);
    ctx.lineTo(hw * 0.35, -hh * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(255,80,80,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-hw * 0.7, 0);
    ctx.lineTo(-hw * 1.05, hh * 0.15);
    ctx.moveTo(hw * 0.7, 0);
    ctx.lineTo(hw * 1.05, hh * 0.15);
    ctx.stroke();
  }

  function drawEnemyEmberHunter(ctx, e, hw, hh) {
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.moveTo(0, hh); ctx.lineTo(-hw * 0.7, 0); ctx.lineTo(0, -hh); ctx.lineTo(hw * 0.7, 0);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = e.accent;
    ctx.beginPath(); ctx.arc(0, 0, hw * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff3";
    ctx.beginPath(); ctx.arc(0, -hh * 0.2, 3, 0, Math.PI * 2); ctx.fill();
  }

  function drawEnemySporeScout(ctx, e, hw, hh) {
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.ellipse(0, 0, hw * 0.8, hh * 0.75, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = e.accent;
    [-1, 1].forEach((s) => {
      ctx.beginPath();
      ctx.ellipse(s * hw * 0.55, 0, hw * 0.28, hh * 0.22, s * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawEnemyHoloDrone(ctx, e, hw, hh) {
    const flicker = 0.65 + Math.sin(frame * 0.25 + e.x * 0.02) * 0.35;
    ctx.globalAlpha = flicker;
    ctx.strokeStyle = e.accent;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-hw * 0.7, -hh * 0.7, hw * 1.4, hh * 1.4);
    ctx.fillStyle = e.color;
    ctx.fillRect(-hw * 0.35, -hh * 0.35, hw * 0.7, hh * 0.7);
    ctx.fillStyle = e.accent;
    ctx.beginPath(); ctx.arc(0, 0, hw * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawBossLava(ctx, e, hw, hh) {
    const p = new Path2D();
    p.moveTo(-hw, hh * 0.4); p.lineTo(-hw * 0.5, -hh); p.lineTo(0, -hh * 0.7);
    p.lineTo(hw * 0.5, -hh); p.lineTo(hw, hh * 0.4); p.lineTo(0, hh); p.closePath();
    hullPlate(ctx, p, e.color, "rgba(0,0,0,0.55)");
    ctx.fillStyle = e.accent;
    ctx.fillRect(-hw * 0.4, -hh * 0.1, hw * 0.8, hh * 0.5);
    const glow = 0.4 + Math.sin(frame * 0.14) * 0.4;
    ctx.fillStyle = `rgba(251,146,60,${glow})`;
    [-0.45, 0, 0.45].forEach((i) => {
      ctx.beginPath(); ctx.arc(i * hw * 0.55, hh * 0.5, 6, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = "#fcd34d";
    ctx.font = "bold 11px Microsoft YaHei,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MEGA", 0, -hh - 10);
  }

  function drawBossEco(ctx, e, hw, hh) {
    ctx.fillStyle = e.color;
    ctx.beginPath(); ctx.ellipse(0, 0, hw, hh * 0.9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = e.accent; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + frame * 0.02;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * hw * 0.85, Math.sin(a) * hh * 0.75);
      ctx.stroke();
    }
    ctx.fillStyle = e.accent;
    ctx.beginPath(); ctx.arc(0, 0, hw * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#a3e635";
    ctx.font = "bold 11px Microsoft YaHei,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MEGA", 0, -hh - 10);
  }

  function drawBossMatrix(ctx, e, hw, hh) {
    ctx.fillStyle = e.color;
    ctx.fillRect(-hw, -hh * 0.4, hw * 2, hh * 0.8);
    ctx.strokeStyle = e.accent; ctx.lineWidth = 2;
    const grid = 4;
    for (let i = -grid; i <= grid; i++) {
      ctx.beginPath(); ctx.moveTo(i * hw * 0.22, -hh * 0.55); ctx.lineTo(i * hw * 0.22, hh * 0.55); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-hw * 0.88, i * hh * 0.18); ctx.lineTo(hw * 0.88, i * hh * 0.18); ctx.stroke();
    }
    const scan = (frame * 2) % (hh * 1.1) - hh * 0.55;
    ctx.fillStyle = `rgba(34,211,238,${0.25 + Math.sin(frame * 0.1) * 0.15})`;
    ctx.fillRect(-hw, scan, hw * 2, 4);
    ctx.fillStyle = "#f0abfc";
    ctx.font = "bold 11px Microsoft YaHei,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MEGA", 0, -hh - 10);
  }

  function drawEnemyRebelScout(ctx, e, hw, hh) {
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.moveTo(hw, 0);
    ctx.lineTo(-hw * 0.15, -hh * 0.55);
    ctx.lineTo(-hw * 0.55, -hh * 0.15);
    ctx.lineTo(-hw, 0);
    ctx.lineTo(-hw * 0.55, hh * 0.15);
    ctx.lineTo(-hw * 0.15, hh * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = e.accent;
    [-0.55, 0, 0.55].forEach((i) => {
      ctx.beginPath();
      ctx.arc(i * hw * 0.45, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-hw * 0.2, 0);
    ctx.lineTo(hw * 0.65, 0);
    ctx.stroke();
  }

  const ENEMY_DRAWERS = {
    scout: drawEnemyScout,
    interceptor: drawEnemyInterceptor,
    gunship: drawEnemyGunship,
    phantom: drawEnemyPhantom,
    carrier: drawEnemyCarrier,
    wraith: drawEnemyWraith,
    meteor: drawEnemyMeteor,
    tie_patrol: drawEnemyTiePatrol,
    dark_interceptor: drawEnemyDarkInterceptor,
    ember_hunter: drawEnemyEmberHunter,
    spore_scout: drawEnemySporeScout,
    holo_drone: drawEnemyHoloDrone,
    rebel_scout: drawEnemyRebelScout,
    boss_assault: drawBossAssault,
    boss_commander: drawBossCommander,
    boss_storm: drawBossStorm,
    boss_lava: drawBossLava,
    boss_eco: drawBossEco,
    boss_matrix: drawBossMatrix,
  };

  function drawEnemy(ctx, enemy, f) {
    frame = f;
    ctx.save();
    ctx.translate(enemy.x, enemy.y);
    if (!enemy.isBoss && !enemy.noRotate) ctx.rotate(enemy.angle + Math.PI / 2);
    const hw = enemy.width / 2;
    const hh = enemy.height / 2;
    const drawer = ENEMY_DRAWERS[enemy.pattern];
    if (drawer) drawer(ctx, enemy, hw, hh);
    ctx.restore();
  }

  function drawHpBar(ctx, cx, y, w, ratio, accent) {
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(cx - w / 2, y, w, 5);
    const g = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
    g.addColorStop(0, accent);
    g.addColorStop(1, "#fff");
    ctx.fillStyle = g;
    ctx.fillRect(cx - w / 2, y, w * ratio, 5);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.strokeRect(cx - w / 2, y, w, 5);
  }

  return {
    initCosmos,
    updateCosmos,
    drawCosmos,
    drawPlayer,
    drawPlayerTrail,
    drawEnemy,
    drawHpBar,
  };
})();