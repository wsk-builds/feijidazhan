/* eslint-disable no-unused-vars */
window.GameSprites = (function () {
  "use strict";

  function initCosmos(W, H) {
    const stars = [];
    for (let layer = 0; layer < 4; layer++) {
      const count = [120, 80, 45, 18][layer];
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          size: (0.4 + layer * 0.35) + Math.random() * 0.8,
          speed: (0.2 + layer * 0.35) + Math.random() * 0.4,
          brightness: Math.random(),
          twinkle: Math.random() * Math.PI * 2,
          layer,
          tint: Math.random() < 0.15 ? (Math.random() < 0.5 ? "#a8d8ff" : "#ffd4a8") : "#ffffff",
        });
      }
    }

    const nebulae = [];
    const hues = [240, 270, 300, 200, 320, 260];
    for (let i = 0; i < 8; i++) {
      nebulae.push({
        x: Math.random() * W, y: Math.random() * H,
        radius: 90 + Math.random() * 120,
        speed: 0.08 + Math.random() * 0.12,
        hue: hues[i % hues.length],
        alpha: 0.06 + Math.random() * 0.08,
        rot: Math.random() * Math.PI * 2,
      });
    }

    const galaxies = [];
    for (let i = 0; i < 3; i++) {
      galaxies.push({
        x: Math.random() * W, y: Math.random() * H * 0.6,
        radius: 25 + Math.random() * 20,
        speed: 0.04 + Math.random() * 0.03,
        rot: Math.random() * Math.PI * 2,
        hue: [220, 280, 340][i],
      });
    }

    const planets = [];
    for (let i = 0; i < 2; i++) {
      planets.push({
        x: 80 + Math.random() * (W - 160),
        y: 60 + Math.random() * 180,
        radius: 18 + Math.random() * 28,
        speed: 0.05 + Math.random() * 0.05,
        hue: [200, 30][i],
        ring: i === 0,
      });
    }

    const dust = [];
    for (let i = 0; i < 35; i++) {
      dust.push({
        x: Math.random() * W, y: Math.random() * H,
        size: 1 + Math.random() * 2,
        speed: 0.3 + Math.random() * 0.5,
        alpha: 0.05 + Math.random() * 0.1,
      });
    }

    return { stars, nebulae, galaxies, planets, dust, shootingStars: [] };
  }

  function updateCosmos(cosmos, W, H, level, frame) {
    cosmos.stars.forEach((s) => {
      s.y += s.speed + level * 0.08;
      s.twinkle += 0.04;
      if (s.y > H) { s.y = 0; s.x = Math.random() * W; }
    });
    cosmos.nebulae.forEach((n) => {
      n.y += n.speed;
      n.rot += 0.0008;
      if (n.y > H + n.radius) { n.y = -n.radius; n.x = Math.random() * W; }
    });
    cosmos.galaxies.forEach((g) => {
      g.y += g.speed;
      g.rot += 0.001;
      if (g.y > H + 40) { g.y = -40; g.x = Math.random() * W; }
    });
    cosmos.planets.forEach((p) => {
      p.y += p.speed;
      if (p.y > H + p.radius) { p.y = -p.radius; p.x = 80 + Math.random() * (W - 160); }
    });
    cosmos.dust.forEach((d) => {
      d.y += d.speed;
      if (d.y > H) { d.y = 0; d.x = Math.random() * W; }
    });

    if (frame % 400 === 0 && cosmos.shootingStars.length < 2) {
      cosmos.shootingStars.push({
        x: Math.random() * W, y: 0,
        len: 40 + Math.random() * 60,
        speed: 8 + Math.random() * 4,
        life: 30 + Math.random() * 20,
      });
    }
    cosmos.shootingStars = cosmos.shootingStars.filter((s) => {
      s.x += s.speed * 0.6;
      s.y += s.speed;
      s.life--;
      return s.life > 0;
    });
  }

  function drawCosmos(ctx, cosmos, W, H, frame) {
    const deep = ctx.createLinearGradient(0, 0, 0, H);
    deep.addColorStop(0, "#010108");
    deep.addColorStop(0.35, "#06061a");
    deep.addColorStop(0.7, "#0c0824");
    deep.addColorStop(1, "#140a2e");
    ctx.fillStyle = deep;
    ctx.fillRect(0, 0, W, H);

    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
    vignette.addColorStop(0, "rgba(20,10,50,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    cosmos.planets.forEach((p) => {
      const g = ctx.createRadialGradient(p.x - p.radius * 0.3, p.y - p.radius * 0.3, 0, p.x, p.y, p.radius);
      g.addColorStop(0, `hsla(${p.hue},50%,65%,0.5)`);
      g.addColorStop(0.7, `hsla(${p.hue},40%,35%,0.35)`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      if (p.ring) {
        ctx.strokeStyle = `hsla(${p.hue},40%,70%,0.2)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.radius * 1.6, p.radius * 0.35, -0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    cosmos.galaxies.forEach((g) => {
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(g.rot);
      const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, g.radius);
      grad.addColorStop(0, `hsla(${g.hue},60%,80%,0.25)`);
      grad.addColorStop(0.4, `hsla(${g.hue},50%,50%,0.12)`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(0, 0, g.radius * 1.4, g.radius * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    cosmos.nebulae.forEach((n) => {
      ctx.save();
      ctx.translate(n.x, n.y);
      ctx.rotate(n.rot);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, n.radius);
      g.addColorStop(0, `hsla(${n.hue},80%,60%,${n.alpha * 1.8})`);
      g.addColorStop(0.45, `hsla(${n.hue + 30},70%,45%,${n.alpha})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, n.radius, n.radius * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    cosmos.dust.forEach((d) => {
      ctx.fillStyle = `rgba(180,200,255,${d.alpha})`;
      ctx.fillRect(d.x, d.y, d.size, d.size * 0.5);
    });

    cosmos.stars.forEach((s) => {
      const tw = 0.5 + Math.sin(s.twinkle) * 0.5;
      const alpha = (0.15 + s.brightness * 0.85) * tw * (s.layer === 3 ? 1.2 : s.layer === 2 ? 0.9 : 0.5);
      ctx.fillStyle = s.tint === "#ffffff"
        ? `rgba(255,255,255,${alpha})`
        : s.tint === "#a8d8ff"
          ? `rgba(168,216,255,${alpha})`
          : `rgba(255,212,168,${alpha})`;
      if (s.layer >= 2) {
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = s.layer === 3 ? 4 : 2;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
    });

    cosmos.shootingStars.forEach((s) => {
      const a = s.life / 50;
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.len * 0.6, s.y - s.len);
      grad.addColorStop(0, `rgba(255,255,255,${a})`);
      grad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - s.len * 0.6, s.y - s.len);
      ctx.stroke();
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

  function drawPlayer(ctx, x, y, w, h, buffs, f, invincibleUntil) {
    frame = f;
    if (f < invincibleUntil && Math.floor(f / 6) % 2 === 0) return;

    const hasPower = buffs.power > 0;
    const hasShield = buffs.shield > 0;
    const hasSpeed = buffs.speed > 0;
    const hasLaser = buffs.laser > 0;

    ctx.save();
    ctx.translate(x, y);

    if (hasShield) {
      const pulse = 0.45 + Math.sin(f * 0.12) * 0.2;
      ctx.strokeStyle = `rgba(93,173,226,${pulse})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, w * 0.72, h * 0.78, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    let hullPrimary = "#1e293b";
    let hullSecondary = "#475569";
    let accent = "#38bdf8";
    if (hasLaser && hasPower) { hullPrimary = "#581c87"; hullSecondary = "#a855f7"; accent = "#fb7185"; }
    else if (hasLaser) { hullPrimary = "#4c1d95"; hullSecondary = "#7c3aed"; accent = "#c084fc"; }
    else if (hasPower) { hullPrimary = "#7f1d1d"; hullSecondary = "#b91c1c"; accent = "#fca5a5"; }
    else if (hasSpeed) { hullPrimary = "#134e4a"; hullSecondary = "#0f766e"; accent = "#5eead4"; }

    ctx.shadowColor = accent;
    ctx.shadowBlur = hasLaser ? 8 : hasSpeed ? 6 : 3;

    const body = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    body.addColorStop(0, hullSecondary);
    body.addColorStop(0.5, hullPrimary);
    body.addColorStop(1, "#020617");

    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(0, -h / 2 - (hasLaser ? 4 : 0));
    ctx.lineTo(-w * 0.18, -h * 0.15);
    ctx.lineTo(-w * 0.42, h * 0.08);
    ctx.lineTo(-w * 0.12, h / 2 - 4);
    ctx.lineTo(0, h / 2);
    ctx.lineTo(w * 0.12, h / 2 - 4);
    ctx.lineTo(w * 0.42, h * 0.08);
    ctx.lineTo(w * 0.18, -h * 0.15);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-w * 0.42, h * 0.08);
    ctx.lineTo(-w * 0.55, h * 0.28);
    ctx.moveTo(w * 0.42, h * 0.08);
    ctx.lineTo(w * 0.55, h * 0.28);
    ctx.stroke();
    ctx.globalAlpha = 1;

    const cockpit = ctx.createRadialGradient(0, -h * 0.18, 0, 0, -h * 0.18, 5);
    cockpit.addColorStop(0, "#e2e8f0");
    cockpit.addColorStop(0.7, accent);
    cockpit.addColorStop(1, "#0f172a");
    ctx.fillStyle = cockpit;
    ctx.beginPath();
    ctx.ellipse(0, -h * 0.18, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(-1, -h * 0.05, 2, h * 0.42);
    ctx.globalAlpha = 1;

    if (hasPower) {
      ctx.fillStyle = "#ef4444";
      [-7, 0, 7].forEach((ox) => {
        ctx.beginPath();
        ctx.arc(ox, -h / 2 + 1, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (hasLaser) {
      ctx.fillStyle = "#c084fc";
      ctx.beginPath();
      ctx.moveTo(0, -h / 2 - 10);
      ctx.lineTo(-3, -h / 2 + 1);
      ctx.lineTo(3, -h / 2 + 1);
      ctx.closePath();
      ctx.fill();
    }

    ctx.shadowBlur = 0;
    const hot = hasPower || hasSpeed;
    const trail = hasSpeed ? 1.35 : 1;
    drawEngineFlame(ctx, -5, h / 2 - 5, 0.65 * trail, hot);
    drawEngineFlame(ctx, 5, h / 2 - 5, 0.65 * trail, hot);
    drawEngineFlame(ctx, 0, h / 2 - 3, 0.8 * trail, hot);

    if (hasSpeed) {
      ctx.strokeStyle = "rgba(94,234,212,0.45)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-w * 0.3, h * 0.22);
      ctx.lineTo(-w * 0.55, h * 0.42);
      ctx.moveTo(w * 0.3, h * 0.22);
      ctx.lineTo(w * 0.55, h * 0.42);
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
    rebel_scout: drawEnemyRebelScout,
    boss_assault: drawBossAssault,
    boss_commander: drawBossCommander,
    boss_storm: drawBossStorm,
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
    drawEnemy,
    drawHpBar,
  };
})();