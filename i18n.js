(function () {
  "use strict";

  const STORAGE_KEY = "feijidazhan_lang";
  let currentLang = "zh";
  const listeners = [];

  function detectLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "zh" || saved === "en") return saved;
    } catch (_) { /* ignore */ }
    const nav = (navigator.language || navigator.userLanguage || "zh").toLowerCase();
    return nav.startsWith("en") ? "en" : "zh";
  }

  function getLang() {
    return currentLang;
  }

  function setLang(lang) {
    if (lang !== "zh" && lang !== "en") return;
    currentLang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (_) { /* ignore */ }
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    listeners.forEach((fn) => {
      try { fn(lang); } catch (_) { /* ignore */ }
    });
  }

  function onChange(fn) {
    if (typeof fn === "function") listeners.push(fn);
  }

  function lookup(obj, key) {
    const parts = key.split(".");
    let cur = obj;
    for (const p of parts) {
      if (cur == null || typeof cur !== "object") return undefined;
      cur = cur[p];
    }
    return cur;
  }

  function interpolate(str, vars) {
    if (!vars || typeof str !== "string") return str;
    return str.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? String(vars[k]) : `{${k}}`));
  }

  function t(key, vars) {
    const pack = TRANSLATIONS[currentLang] || TRANSLATIONS.zh;
    const val = lookup(pack, key);
    if (val == null) {
      const fallback = lookup(TRANSLATIONS.zh, key);
      if (fallback == null) return key;
      if (typeof fallback === "string") return interpolate(fallback, vars);
      return fallback;
    }
    if (typeof val === "string") return interpolate(val, vars);
    return val;
  }

  const STAGE_NAMES_ZH = [
    "前哨渗透", "乱流峡谷", "幻影走廊", "炮艇封锁线", "突击者要塞",
    "幽灵宙域", "母舰外围", "陨石风暴带", "雷暴核心",
  ];

  const STAGE_NAMES_EN = [
    "Outpost Infiltration", "Turbulent Canyon", "Phantom Corridor", "Gunship Blockade", "Assault Fortress",
    "Wraith Sector", "Carrier Perimeter", "Meteor Storm Belt", "Storm Core",
  ];

  const STAGE_TIPS_ZH = [
    "击破 10 架侦察机，小怪持续来袭，达标后关底 Boss 登场",
    "拦截机加入战场，注意走位",
    "幻影机蛇形移动 · 偶现宇宙彩蛋敌机",
    "炮艇会开火，优先击毁",
    "本关镇守大 Boss，达标后立即决战",
    "幽灵舰出没 · 可能遭遇同盟侦察彩蛋",
    "母舰编队压境，达标后关底 Boss 登场",
    "重型陨石舰横冲直撞",
    "雷暴走廊，弹幕密集",
  ];

  const STAGE_TIPS_EN = [
    "Destroy 10 scouts — waves keep coming until the stage boss appears",
    "Interceptors join the fight — watch your positioning",
    "Phantoms weave in S-curves · themed easter-egg craft may appear",
    "Gunships shoot back — take them down first",
    "A mega boss guards this stage — fight begins once quota is met",
    "Wraiths haunt the sector · Rebel scout flyby possible",
    "Carrier formations press in — stage boss after quota",
    "Heavy meteor ships charge through the lane",
    "Storm corridor — dense bullet patterns ahead",
  ];

  const THEME_NAMES_ZH = ["深空宙域", "熔岩星系", "生态星云", "矩阵裂隙"];
  const THEME_NAMES_EN = ["Deep Space Sector", "Lava Galaxy", "Eco Nebula", "Matrix Rift"];

  function stageName(n) {
    if (n >= 1 && n <= 9) {
      return currentLang === "en" ? STAGE_NAMES_EN[n - 1] : STAGE_NAMES_ZH[n - 1];
    }
    return endlessStageName(n);
  }

  function stageTip(n) {
    if (n >= 1 && n <= 9) {
      return currentLang === "en" ? STAGE_TIPS_EN[n - 1] : STAGE_TIPS_ZH[n - 1];
    }
    return t("stage.endlessTip");
  }

  function endlessStageName(n) {
    const theme = themeName(Math.floor((n - 1) / 5) % 4);
    if (currentLang === "en") return `${theme} · Zone ${n}`;
    return `${theme} · 战区 ${n}`;
  }

  function themeName(index) {
    const i = ((index % 4) + 4) % 4;
    return currentLang === "en" ? THEME_NAMES_EN[i] : THEME_NAMES_ZH[i];
  }

  function entity(id) {
    return t(`entity.${id}`) || id;
  }

  function powerup(key) {
    const data = t(`powerup.${key}`);
    if (data && typeof data === "object") return data;
    return {
      label: key,
      fullName: key,
      shortDesc: "",
      desc: "",
    };
  }

  function getSubtitleParts() {
    return {
      before: t("ui.subtitleBefore"),
      secret: t("ui.subtitleSecret"),
      after: t("ui.subtitleAfter"),
    };
  }

  function applyDOM(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (key) el.textContent = t(key);
    });
    scope.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const key = el.getAttribute("data-i18n-html");
      if (key) el.innerHTML = t(key);
    });
    scope.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const spec = el.getAttribute("data-i18n-attr");
      if (!spec) return;
      spec.split(";").forEach((pair) => {
        const [attr, key] = pair.split(":").map((s) => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
  }

  function getManualHtml() {
    const L = currentLang;
    if (L === "en") return MANUAL_HTML_EN;
    return MANUAL_HTML_ZH;
  }

  /* ── Manual HTML (zh) ─────────────────────────────────────────── */
  const MANUAL_HTML_ZH = `
          <section class="manual-section">
            <h2>关卡战役</h2>
            <p>游戏采用<strong>关卡制</strong>，共 9 个精心设计的关卡，之后进入无尽深空模式。每关敌机种类、道具池、彩蛋与 Boss 各不相同，难度逐步攀升。</p>
            <ul>
              <li>每关目标：击毁指定数量敌机（进度条显示在画布底部）</li>
              <li>达标后出现 <strong>Boss</strong>（悬停屏幕中部）；击败 Boss 后须<strong>清剿场上全部残敌</strong>（含彩蛋机）方可过关；飞出屏幕的敌机视为已清除</li>
              <li>你始终驾驶<strong>同一型号战机</strong>：每架有 <strong>4 点耐久</strong>（被击中 -1，护盾可挡一次）</li>
              <li><strong>1 命 = 1 架飞机</strong>；耐久归零后若有备用机，会播放换机过场并替换同款新机上阵</li>
              <li>初始 <strong>3 命</strong>，每 3 关奖励 +1 命（上限 5）；可拾取「备用战机」道具</li>
              <li>进入下一关时当前飞机耐久回满；命与累计得分在关卡间保留</li>
              <li>跨关继承：炸药/导弹储备、未过期的增益（护盾/加速/火力/激光），以及关末未拾取的掉落物会带入下一关</li>
              <li>重复拾取<strong>同类型时限道具</strong>（如两个三连火力）会叠层强化，最高 x3</li>
            </ul>
          </section>

          <section class="manual-section manual-section-mobile">
            <h2>手机操作</h2>
            <ul>
              <li><strong>单指拖动</strong>画布：战机平滑跟随指尖移动（松手即停）</li>
              <li>右下角 <strong>💣</strong>：布设下行地雷（需炸药储备，最多 3 枚在场）</li>
              <li>右下角 <strong>🚀</strong>：发射追踪导弹齐射（每次消耗 1 次储备，齐射 3 枚）</li>
              <li>左下 <strong>⚙</strong>：展开/收起战机状态与增益面板</li>
              <li>顶部 <strong>?</strong> / <strong>🔊</strong>：说明与静音；支持竖屏全屏与添加到主屏幕</li>
            </ul>
            <p class="manual-note">建议竖屏游玩；拖动时请勿从屏幕边缘外滑入，以免触发系统手势。首次进入会显示简短引导。</p>
          </section>

          <section class="manual-section">
            <h2>基本操作（桌面）</h2>
            <ul>
              <li><kbd>↑↓←→</kbd> 或 <kbd>WASD</kbd>：移动战机</li>
              <li><strong>鼠标点击</strong>画布：战机自动飞往目标位置（与键盘可切换）</li>
              <li><kbd>空格</kbd>：手动射击（游戏也会自动射击）</li>
              <li><kbd>B</kbd>：布设下行地雷（需先有炸药储备，最多同时 3 枚，自动瞄准 Boss 横向位置）</li>
              <li><kbd>V</kbd>：发射追踪导弹齐射（需先有导弹储备，每次消耗 1 次储备发射 3 枚）</li>
              <li><kbd>M</kbd>：开关音效 · <kbd>H</kbd>：打开本说明</li>
            </ul>
            <p>你驾驶的是代号 <strong>Ω-7 暗影刺客</strong>：机体小巧、碰撞体积极小、移速极快，适合深入敌后斩首行动。右侧「战机状态」面板实时显示移速、火力、伤害、射速与当前增益。</p>
            <p class="manual-note">敌机整体笨重缓慢，与你形成鲜明反差——利用速度优势穿插、切割、撤离。</p>
          </section>

          <section class="manual-section">
            <h2>道具一览</h2>
            <p class="manual-note">不同种类道具可并存（例：激光 + 火力）。<strong>同类型时限道具</strong>在生效期间再次拾取会叠层强化（最高 x3），并刷新持续时间。</p>
            <table class="manual-table">
              <thead>
                <tr><th>道具</th><th>效果</th><th>持续时间</th><th>获取方式</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td style="color:#ff4757">三连火力</td>
                  <td>散射 + 强化弹；叠层 x2 加宽散射/射速，x3 再加侧翼弹</td>
                  <td>10 秒</td>
                  <td>击落敌机随机 · 友军任务 · 击败 Boss</td>
                </tr>
                <tr>
                  <td style="color:#3498db">能量护盾</td>
                  <td>抵挡伤害；x2 挡 2 次，x3 挡 3 次</td>
                  <td>8 秒</td>
                  <td>击落敌机随机 · 友军任务 · 击败 Boss</td>
                </tr>
                <tr>
                  <td style="color:#2ecc71">推进加速</td>
                  <td>移速 +75%；x2 +95%，x3 +115%</td>
                  <td>8 秒</td>
                  <td>击落敌机随机 · 友军任务 · 击败 Boss</td>
                </tr>
                <tr>
                  <td style="color:#f39c12">炸药包</td>
                  <td>炸药储备 +1；按 <kbd>B</kbd> 在屏幕布设下行地雷（对 Boss 造成 4 点伤害）</td>
                  <td>储备制</td>
                  <td>击落敌机随机 · 友军任务 · 击败 Boss</td>
                </tr>
                <tr>
                  <td style="color:#ff6b35">追踪导弹</td>
                  <td>导弹储备 +1；按 <kbd>V</kbd> 齐射 3 枚，优先锁定 Boss</td>
                  <td>储备制</td>
                  <td>击落敌机随机 · 击败 Boss（42% 额外掉落）</td>
                </tr>
                <tr>
                  <td style="color:#a855f7">穿透激光</td>
                  <td>穿透高伤；x2 伤害 4，x3 伤害 5</td>
                  <td>8 秒</td>
                  <td>击落敌机随机 · 友军任务 · 击败 Boss</td>
                </tr>
                <tr>
                  <td style="color:#ff6b9d">耐久补给</td>
                  <td>当前飞机耐久 +1</td>
                  <td>即时</td>
                  <td><strong>稀有</strong>，见下方专门说明</td>
                </tr>
                <tr>
                  <td style="color:#fbbf24">备用战机</td>
                  <td>命 +1（上限 5）</td>
                  <td>即时</td>
                  <td>每 3 关奖励 · 击败 Boss · 友军任务</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="manual-section">
            <h2>耐久补给（稀有）</h2>
            <ul>
              <li><strong>不会</strong>从普通 6% 随机掉落池中出现</li>
              <li>🩷 <strong>医疗救援舰</strong>护航成功：主要来源，直接投放</li>
              <li>🏆 击败小 Boss：35% 概率额外掉落</li>
              <li>⚠ 耐久仅剩 1 时：击毁敌机 5% 概率急救包</li>
              <li>✅ 其他友军任务完成：18% 概率奖励耐久补给</li>
              <li>拾取后 <strong>60 秒冷却</strong>；耐久已满时无法获得（医疗舰改投护盾）</li>
            </ul>
          </section>

          <section class="manual-section">
            <h2>友军任务</h2>
            <p>每积累约 2500–4000 分出现一次（Boss 战期间暂停）。完成任务是道具的主要来源。</p>
            <table class="manual-table">
              <thead>
                <tr><th>友军</th><th>任务要求</th><th>奖励</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>🟢 补给运输机</td>
                  <td>靠近护航累计 2 秒，保护不被敌机撞毁</td>
                  <td>1–2 个随机道具 + 300 分</td>
                </tr>
                <tr>
                  <td>🔵 受损僚机</td>
                  <td>15 秒内击落 8 架敌机（僚机位于屏幕中下方）</td>
                  <td>1–2 个随机道具 + 300 分</td>
                </tr>
                <tr>
                  <td>🩷 医疗救援舰</td>
                  <td>靠近护航累计 2 秒，保护不被撞毁</td>
                  <td>耐久补给（或护盾补偿）+ 300 分</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="manual-section">
            <h2>特殊遭遇（彩蛋）</h2>
            <p class="manual-note manual-easter-egg" id="manualEasterEgg" title="点击展开备注">档案中有几则未标注坐标的遭遇记录……（点此查看备注）</p>
            <table class="manual-table">
              <thead>
                <tr><th>遭遇</th><th>特征</th><th>应对</th><th>奖励</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td style="color:#9aa0a6">帝国巡逻机</td>
                  <td>双翼球形巡逻艇，缓慢漂移</td>
                  <td>击落即可</td>
                  <td>777 分</td>
                </tr>
                <tr>
                  <td style="color:#d62828">黑暗先锋舰</td>
                  <td>强化型双翼战机，火力更猛</td>
                  <td>高分段偶发，需集中火力</td>
                  <td>1980 分 + 道具</td>
                </tr>
                <tr>
                  <td style="color:#74c0fc">同盟侦察机</td>
                  <td>四翼穿越战区，遭帝国追击</td>
                  <td><strong>击落 3 架追击机</strong>，在其离场前完成</td>
                  <td>888 分 + 道具</td>
                </tr>
              </tbody>
            </table>
            <p class="manual-note">菜单标题、特定文字、战斗中微弱信号（✦）以及键盘密语，也可能触发额外惊喜。</p>
          </section>

          <section class="manual-section">
            <h2>敌机图鉴</h2>
            <table class="manual-table">
              <thead>
                <tr><th>敌机</th><th>血量</th><th>特点</th><th>分值</th></tr>
              </thead>
              <tbody>
                <tr><td>侦察机</td><td>1</td><td>基础型，红色战斗机</td><td>100</td></tr>
                <tr><td>拦截机</td><td>1</td><td>高速针形舰（等级 2+）</td><td>200</td></tr>
                <tr><td>幻影机</td><td>2</td><td>S 形蛇形移动（等级 2+）</td><td>300</td></tr>
                <tr><td>幽灵舰</td><td>2</td><td>隐身闪烁，蛇形移动（等级 4+）</td><td>350</td></tr>
                <tr><td>炮艇</td><td>3</td><td>重型，会向玩家射击（等级 3+）</td><td>450</td></tr>
                <tr><td>陨石舰</td><td>5</td><td>岩石装甲，移动慢（等级 5+）</td><td>550</td></tr>
                <tr><td>航母</td><td>4</td><td>大型母舰（等级 4+）</td><td>600</td></tr>
              </tbody>
            </table>
          </section>

          <section class="manual-section">
            <h2>小 Boss 图鉴</h2>
            <p>每 <strong>3000 分</strong>出现一只，之后间隔递增。击败奖励丰厚并高概率掉落道具。</p>
            <table class="manual-table boss-table">
              <thead>
                <tr><th>Boss</th><th>血量</th><th>特殊能力</th><th>击破得分</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td style="color:#ff6b6b">重装突击者</td>
                  <td><strong>28</strong></td>
                  <td>密集定向弹幕，三管齐射</td>
                  <td>3000</td>
                </tr>
                <tr>
                  <td style="color:#d4a5ff">幻影指挥舰</td>
                  <td><strong>20</strong></td>
                  <td>定期召唤侦察机增援</td>
                  <td>2500</td>
                </tr>
                <tr>
                  <td style="color:#74c0fc">雷暴母舰</td>
                  <td><strong>38</strong></td>
                  <td>五向扇形弹幕 + 闪电特效</td>
                  <td>5000</td>
                </tr>
              </tbody>
            </table>
            <p class="manual-note">Boss 按顺序循环出现：重装突击者 → 幻影指挥舰 → 雷暴母舰 → …</p>
          </section>

          <section class="manual-section">
            <h2>其他规则</h2>
            <ul>
              <li>每架飞机 <strong>4</strong> 点耐久；每关开始时回满，命在关卡间保留</li>
              <li>每 2000 分提升 1 级，敌机更强、出现种类更多</li>
              <li>Boss 战期间暂停普通敌机刷新的洪流，专注击败 Boss</li>
              <li>拾取同类道具时，持续时间取<strong>较长</strong>的剩余时间（不会缩短已有 Buff）</li>
            </ul>
            <p class="manual-memorial">Ω-7 暗影计划 · 致敬星海经典 · 2026</p>
          </section>`;

  /* ── Manual HTML (en) ─────────────────────────────────────────── */
  const MANUAL_HTML_EN = `
          <section class="manual-section">
            <h2>Campaign</h2>
            <p>The game uses a <strong>stage-based campaign</strong>: 9 handcrafted stages, then endless deep-space mode. Each stage features different enemies, power-up pools, easter eggs, and bosses with rising difficulty.</p>
            <ul>
              <li>Per-stage goal: destroy a set number of enemies (progress bar at the bottom of the canvas)</li>
              <li>Once quota is met, a <strong>Boss</strong> hovers mid-screen; after defeating it you must <strong>clear all remaining enemies</strong> (including easter-egg craft); off-screen enemies count as cleared</li>
              <li>You always fly the <strong>same fighter model</strong>: <strong>4 HP</strong> per plane (–1 per hit; shields block one hit)</li>
              <li><strong>1 life = 1 plane</strong>; when HP hits zero, a spare fighter swaps in with a brief cutscene if available</li>
              <li>Start with <strong>3 lives</strong>; +1 life every 3 stages (max 5); spare fighters can also be picked up</li>
              <li>HP refills entering the next stage; lives and total score carry over</li>
              <li>Between stages: bomb/missile stock, active buffs (shield/speed/power/laser), and uncollected drops persist</li>
              <li>Re-picking the <strong>same timed buff</strong> (e.g. two Triple Fire) stacks up to x3</li>
            </ul>
          </section>

          <section class="manual-section manual-section-mobile">
            <h2>Mobile Controls</h2>
            <ul>
              <li><strong>Single-finger drag</strong> on canvas: fighter smoothly follows your finger (stops when released)</li>
              <li>Bottom-right <strong>💣</strong>: deploy descending mines (needs bomb stock, max 3 on field)</li>
              <li>Bottom-right <strong>🚀</strong>: homing missile salvo (1 stock per salvo, fires 3 missiles)</li>
              <li>Bottom-left <strong>⚙</strong>: open/close fighter status &amp; buff panel</li>
              <li>Top <strong>?</strong> / <strong>🔊</strong>: manual &amp; mute; portrait fullscreen &amp; add-to-home-screen supported</li>
            </ul>
            <p class="manual-note">Play in portrait; avoid dragging in from screen edges to prevent system gestures. A short tutorial appears on first launch.</p>
          </section>

          <section class="manual-section">
            <h2>Desktop Controls</h2>
            <ul>
              <li><kbd>↑↓←→</kbd> or <kbd>WASD</kbd>: move fighter</li>
              <li><strong>Mouse click</strong> canvas: auto-fly to target (switchable with keyboard)</li>
              <li><kbd>Space</kbd>: manual fire (auto-fire is always on)</li>
              <li><kbd>B</kbd>: deploy descending mine (needs bomb stock, max 3, auto-aims boss X position)</li>
              <li><kbd>V</kbd>: homing missile salvo (needs missile stock, 3 missiles per use)</li>
              <li><kbd>M</kbd>: toggle sound · <kbd>H</kbd>: open this manual</li>
            </ul>
            <p>You pilot codename <strong>Ω-7 Shadow Assassin</strong>: tiny hull, minimal hitbox, extreme speed — built for deep-strike decapitation runs. The right-side status panel shows speed, firepower, damage, fire rate, and active buffs.</p>
            <p class="manual-note">Enemy craft are slow and heavy — use your speed to weave, cut through, and extract.</p>
          </section>

          <section class="manual-section">
            <h2>Power-ups</h2>
            <p class="manual-note">Different power-up types stack (e.g. laser + firepower). <strong>Same timed buff</strong> picked again while active stacks (max x3) and refreshes duration.</p>
            <table class="manual-table">
              <thead>
                <tr><th>Item</th><th>Effect</th><th>Duration</th><th>Source</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td style="color:#ff4757">Triple Fire</td>
                  <td>Spread + powered shots; x2 widens spread/rate, x3 adds wing shots</td>
                  <td>10 s</td>
                  <td>Enemy drops · Ally missions · Boss kills</td>
                </tr>
                <tr>
                  <td style="color:#3498db">Energy Shield</td>
                  <td>Blocks damage; x2 blocks 2 hits, x3 blocks 3</td>
                  <td>8 s</td>
                  <td>Enemy drops · Ally missions · Boss kills</td>
                </tr>
                <tr>
                  <td style="color:#2ecc71">Boost</td>
                  <td>Speed +75%; x2 +95%, x3 +115%</td>
                  <td>8 s</td>
                  <td>Enemy drops · Ally missions · Boss kills</td>
                </tr>
                <tr>
                  <td style="color:#f39c12">Bomb Pack</td>
                  <td>Bomb stock +1; press <kbd>B</kbd> to drop mines (4 damage to bosses)</td>
                  <td>Stock</td>
                  <td>Enemy drops · Ally missions · Boss kills</td>
                </tr>
                <tr>
                  <td style="color:#ff6b35">Homing Missiles</td>
                  <td>Missile stock +1; press <kbd>V</kbd> for 3 homers, bosses prioritized</td>
                  <td>Stock</td>
                  <td>Enemy drops · Boss kills (42% bonus drop)</td>
                </tr>
                <tr>
                  <td style="color:#a855f7">Piercing Laser</td>
                  <td>Piercing high damage; x2 dmg 4, x3 dmg 5</td>
                  <td>8 s</td>
                  <td>Enemy drops · Ally missions · Boss kills</td>
                </tr>
                <tr>
                  <td style="color:#ff6b9d">Hull Repair</td>
                  <td>Current plane HP +1</td>
                  <td>Instant</td>
                  <td><strong>Rare</strong> — see section below</td>
                </tr>
                <tr>
                  <td style="color:#fbbf24">Spare Fighter</td>
                  <td>+1 life (max 5)</td>
                  <td>Instant</td>
                  <td>Every 3 stages · Boss kills · Ally missions</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="manual-section">
            <h2>Hull Repair (Rare)</h2>
            <ul>
              <li><strong>Not</strong> in the normal 6% random drop pool</li>
              <li>🩷 <strong>Medical Rescue Ship</strong> escort success: primary source, direct drop</li>
              <li>🏆 Mini-boss kill: 35% bonus drop chance</li>
              <li>⚠ At 1 HP remaining: 5% emergency pack from enemy kills</li>
              <li>✅ Other ally missions complete: 18% repair reward chance</li>
              <li><strong>60 s cooldown</strong> after pickup; cannot receive at full HP (medical ship drops shield instead)</li>
            </ul>
          </section>

          <section class="manual-section">
            <h2>Ally Missions</h2>
            <p>Spawn roughly every 2500–4000 points (paused during boss fights). Completing them is the main power-up source.</p>
            <table class="manual-table">
              <thead>
                <tr><th>Ally</th><th>Objective</th><th>Reward</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>🟢 Supply Transport</td>
                  <td>Stay close and escort for 2 seconds; protect from collisions</td>
                  <td>1–2 random power-ups + 300 pts</td>
                </tr>
                <tr>
                  <td>🔵 Damaged Wingman</td>
                  <td>Destroy 8 enemies in 15 seconds (wingman mid-lower screen)</td>
                  <td>1–2 random power-ups + 300 pts</td>
                </tr>
                <tr>
                  <td>🩷 Medical Rescue Ship</td>
                  <td>Stay close and escort for 2 seconds; protect from collisions</td>
                  <td>Hull repair (or shield fallback) + 300 pts</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="manual-section">
            <h2>Special Encounters (Easter Eggs)</h2>
            <p class="manual-note manual-easter-egg" id="manualEasterEgg" title="Click for note">Several undocumented encounters in the archives… (click for note)</p>
            <table class="manual-table">
              <thead>
                <tr><th>Encounter</th><th>Traits</th><th>Response</th><th>Reward</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td style="color:#9aa0a6">Imperial Patrol Craft</td>
                  <td>Twin-sphere patrol pod, slow drift</td>
                  <td>Shoot it down</td>
                  <td>777 pts</td>
                </tr>
                <tr>
                  <td style="color:#d62828">Dark Vanguard</td>
                  <td>Upgraded twin-wing fighter, heavier fire</td>
                  <td>High-score sectors only — focus fire</td>
                  <td>1980 pts + power-up</td>
                </tr>
                <tr>
                  <td style="color:#74c0fc">Rebel Scout</td>
                  <td>Quad-wing transit, pursued by Imperial craft</td>
                  <td><strong>Destroy 3 pursuers</strong> before it exits</td>
                  <td>888 pts + power-up</td>
                </tr>
              </tbody>
            </table>
            <p class="manual-note">Menu title, certain words, the faint in-battle signal (✦), and keyboard codes may trigger extra surprises.</p>
          </section>

          <section class="manual-section">
            <h2>Enemy Codex</h2>
            <table class="manual-table">
              <thead>
                <tr><th>Enemy</th><th>HP</th><th>Traits</th><th>Score</th></tr>
              </thead>
              <tbody>
                <tr><td>Scout</td><td>1</td><td>Basic red fighter</td><td>100</td></tr>
                <tr><td>Interceptor</td><td>1</td><td>Fast needle-ship (stage 2+)</td><td>200</td></tr>
                <tr><td>Phantom</td><td>2</td><td>S-curve weave (stage 2+)</td><td>300</td></tr>
                <tr><td>Wraith</td><td>2</td><td>Blinking stealth, weave (stage 4+)</td><td>350</td></tr>
                <tr><td>Gunship</td><td>3</td><td>Heavy, shoots at player (stage 3+)</td><td>450</td></tr>
                <tr><td>Meteor Ship</td><td>5</td><td>Rock armor, slow (stage 5+)</td><td>550</td></tr>
                <tr><td>Carrier</td><td>4</td><td>Large mothership (stage 4+)</td><td>600</td></tr>
              </tbody>
            </table>
          </section>

          <section class="manual-section">
            <h2>Mini Boss Codex</h2>
            <p>One spawns every <strong>3000 points</strong>, interval increasing thereafter. Rich rewards and high drop rates.</p>
            <table class="manual-table boss-table">
              <thead>
                <tr><th>Boss</th><th>HP</th><th>Special</th><th>Score</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td style="color:#ff6b6b">Heavy Assaultor</td>
                  <td><strong>28</strong></td>
                  <td>Dense aimed barrage, triple volleys</td>
                  <td>3000</td>
                </tr>
                <tr>
                  <td style="color:#d4a5ff">Phantom Command Ship</td>
                  <td><strong>20</strong></td>
                  <td>Periodically summons scout reinforcements</td>
                  <td>2500</td>
                </tr>
                <tr>
                  <td style="color:#74c0fc">Storm Carrier</td>
                  <td><strong>38</strong></td>
                  <td>Five-way fan barrage + lightning FX</td>
                  <td>5000</td>
                </tr>
              </tbody>
            </table>
            <p class="manual-note">Bosses cycle: Heavy Assaultor → Phantom Command Ship → Storm Carrier → …</p>
          </section>

          <section class="manual-section">
            <h2>Other Rules</h2>
            <ul>
              <li>Each plane has <strong>4</strong> HP; refills each stage start, lives persist between stages</li>
              <li>Every 2000 points raises rank — tougher enemies, more types</li>
              <li>Normal enemy waves pause during boss fights — focus the boss</li>
              <li>Re-picking the same buff keeps the <strong>longer</strong> remaining time (never shortens active buffs)</li>
            </ul>
            <p class="manual-memorial">Ω-7 Shadow Project · Homage to the stars · 2026</p>
          </section>`;

  /* ── Translation packs ─────────────────────────────────────────── */
  const TRANSLATIONS = {
    zh: {
      ui: {
        gameTitle: "飞机大战",
        subtitleBefore: "暗影刺客 · 直插",
        subtitleSecret: "敌方",
        subtitleAfter: "要塞",
        startHintDesktop: "关卡制战役 · 3 命换机 · 每机 4 点耐久 · WASD / 点击移动 · B 地雷 · V 导弹",
        startHintMobile: "关卡制战役 · 3 命换机 · 每机 4 点耐久 · 单指拖动移动 · 侧键地雷/导弹",
        startGame: "开始游戏",
        openManual: "查看游戏说明",
        universeJump: "宇宙跃迁",
        universeJumpBoss: "突破 {boss}",
        universeJumpHint: "进入新宇宙，战机与敌势将全面换肤…",
        jumpSkip: "立即进入",
        stageClear: "关卡完成",
        stageClearLine: "第 {n} 关 · {name}",
        stageScore: "本关得分",
        stageTotal: "累计得分",
        nextStage: "下一关：{name}",
        nextStageBtn: "进入下一关",
        gameOver: "战役结束",
        reachedStage: "抵达第 {n} 关",
        finalScore: "累计得分",
        restart: "重新闯关",
        manualTitle: "游戏说明",
        manualSubtitle: "完整指南",
        closeManual: "关闭",
        hudScore: "得分",
        hudLives: "战机",
        hudHp: "耐久",
        hudStage: "关卡",
        hudUniverse: "宇宙",
        hudBombs: "炸药",
        hudMissiles: "导弹",
        helpTitle: "游戏说明 (H)",
        helpAria: "游戏说明",
        muteTitle: "静音 (M)",
        muteAria: "静音",
        muteOn: "🔇",
        muteOff: "🔊",
        hudSecretTitle: "微弱信号",
        bombAria: "布设地雷",
        missileAria: "发射导弹",
        statsToggleAria: "战机状态",
        statsCloseAria: "收起状态",
        fullscreenTitle: "全屏",
        fullscreenAria: "全屏",
        statsTitle: "战机状态",
        statSpeed: "移速",
        statFireRate: "射速",
        statWeapon: "火力",
        statDamage: "伤害",
        statLives: "战机",
        statHp: "耐久",
        statShield: "护盾",
        statBombs: "炸药",
        statMissiles: "导弹",
        buffListTitle: "增益",
        buffEmpty: "暂无",
        buffRemain: "剩余 {n} 秒",
        shieldActive: "激活 ({time}{layers})",
        shieldLayers: " · {n} 层",
        shieldNone: "无",
        weaponStandard: "标准单发",
        weaponLaser: "穿透激光",
        weaponLaserStack: "穿透激光 x{n}",
        weaponPower: "三连散射",
        weaponPowerStack: "三连散射 x{n}",
        weaponCombo: " + ",
        speedBonus75: " (+75%)",
        speedBonus95: " (+95%)",
        speedBonus115: " (+115%)",
        fireRateSuffix: "/s",
        livesAria: "剩余战机",
        hpAria: "战机耐久",
        landscapeHint: "请旋转设备至<strong>竖屏</strong>以获得最佳体验",
        mobileTutorialTitle: "手机操作指南",
        mobileTutorial1: "单指在画面上<strong>拖动</strong>，战机跟随指尖",
        mobileTutorial2: "点 <strong>💣</strong> 布地雷 · <strong>🚀</strong> 发导弹",
        mobileTutorial3: "点 <strong>⚙</strong> 查看战机状态与增益",
        mobileTutorialDismiss: "知道了，开始战斗",
        langToggle: "EN",
        langToggleTitle: "切换为英文",
      },
      stage: {
        label: "第 {n} 关",
        endlessTip: "无尽深空，难度持续攀升",
        barAssault: "第 {n} 关 · {name} · 清剿敌潮",
        barClearing: "第 {n} 关 · 清剿残敌… · 剩余 {remain}",
        barBoss: "第 {n} 关 · 击败 {boss}",
        barMopup: "第 {n} 关 · 清剿残敌 · 剩余 {remain}",
        barLoot: "第 {n} 关 · 拾取 Boss 战利品 · 剩余 {count}",
        barComplete: "第 {n} 关 · 关卡完成",
        barCleared: "第 {n} 关 · 战场已肃清",
      },
      buff: {
        power: "三连火力",
        shield: "能量护盾",
        speed: "推进加速",
        laser: "穿透激光",
        stackBoost: "{name} x{n} 强化!",
        hudPower: "🔥火力",
        hudShield: "🛡护盾",
        hudSpeed: "⚡加速",
        hudLaser: "💜激光",
        hudSec: "s",
      },
      entity: {
        scout: "侦察机",
        interceptor: "拦截机",
        gunship: "炮艇",
        phantom: "幻影机",
        carrier: "航母",
        wraith: "幽灵舰",
        meteor: "陨石舰",
        tie_patrol: "帝国巡逻机",
        dark_interceptor: "黑暗先锋舰",
        ember_hunter: "余烬猎手",
        spore_scout: "孢子侦察艇",
        holo_drone: "全息无人机",
        rebel_scout: "同盟侦察机",
        mini_sentry: "哨戒巡洋舰",
        mini_striker: "裂空突击艇",
        mini_phantom: "幽灵指挥艇",
        mini_ember: "余烬巡洋舰",
        mini_magma: "熔流突击艇",
        mini_ash: "灰烬守卫舰",
        mini_spore: "孢子守卫舰",
        mini_vine: "藤须突击艇",
        mini_moss: "苔藓巡洋舰",
        mini_neon: "霓虹无人机",
        mini_glitch: "故障猎手舰",
        mini_pixel: "像素守卫舰",
        mega_storm: "雷暴母舰",
        mega_lava: "熔核巨舰",
        mega_eco: "生态母舰",
        mega_matrix: "矩阵主宰",
        legacy_assault: "重装突击者",
        legacy_command: "幻影指挥舰",
        legacy_storm: "雷暴母舰",
        imperial_pursuer: "帝国追击",
      },
      powerup: {
        power: {
          label: "火力",
          fullName: "三连火力",
          shortDesc: "散射+强化",
          desc: "发射三连散射弹，持续 10 秒",
        },
        shield: {
          label: "护盾",
          fullName: "能量护盾",
          shortDesc: "抵挡伤害",
          desc: "生成护盾，可抵挡一次攻击（8 秒）",
        },
        speed: {
          label: "加速",
          fullName: "推进加速",
          shortDesc: "移速+75%",
          desc: "移动速度提升 75%，持续 8 秒",
        },
        bomb: {
          label: "炸药",
          fullName: "炸药包",
          shortDesc: "储备+1",
          desc: "获得 1 枚炸药储备，按 B 在屏幕布设下行地雷（预判 Boss 位置）",
        },
        health: {
          label: "回血",
          fullName: "耐久补给",
          shortDesc: "耐久+1",
          desc: "恢复 1 点战机耐久（稀有掉落，满耐久或冷却中无法获得）",
        },
        life: {
          label: "备机",
          fullName: "备用战机",
          shortDesc: "命+1",
          desc: "增加 1 架同款备用战机（命耗尽时自动替换上场，上限 5）",
        },
        laser: {
          label: "激光",
          fullName: "穿透激光",
          shortDesc: "穿透高伤",
          desc: "发射穿透激光，伤害 ×3（8 秒）",
        },
        missile: {
          label: "导弹",
          fullName: "追踪导弹",
          shortDesc: "储备+1",
          desc: "获得 1 次导弹齐射储备，按 V 发射 3 枚追踪导弹（优先锁定 Boss）",
        },
      },
      ally: {
        escort: "补给运输机",
        escortHint: "靠近护航 2 秒",
        rescue: "受损僚机",
        rescueHint: "击落 8 架敌机救援",
        medical: "医疗救援舰",
        medicalHint: "护航医疗舰获耐久补给",
        escortCall: "友军运输机请求护航!",
        rescueCall: "友军僚机正在求救!",
        medicalCall: "医疗救援舰抵达! 护航可获得耐久补给",
        complete: "任务完成! 道具投放",
        fail: "友军任务失败",
        medicalDrop: "医疗补给投放!",
        hpFullShield: "耐久已满，改投护盾",
        cooldownShield: "补给冷却中，改投护盾",
      },
      rebel: {
        pursued: "同盟侦察机遭追击！开火掩护其突围",
        hint: "击落追击机，掩护撤离",
        pursuerLabel: "追击机 {count}/{goal}",
        success: "掩护成功！原力与你同在",
        successToast: "同盟侦察机安全撤离 — 追击机已清除。",
        fail: "掩护不足，侦察机强行撤离",
      },
      boss: {
        miniLabel: "关底 Boss",
        megaLabel: "大 Boss",
        incoming: "⚠ {name} {tier}来袭!",
        defeated: "{name} 击破! +{score}",
      },
      float: {
        waveRetreat: "敌潮已退 — 清剿残敌",
        battlefieldClear: "战场肃清 — 战利品已收入囊中",
        noBombs: "无炸药储备",
        mineCap: "地雷已达上限 ({max})",
        mineDeploy: "地雷布设 · 储备 {n}",
        noMissiles: "无导弹储备",
        missileSalvo: "导弹齐射 · 储备 {n}",
        mineHit: "地雷命中! -{dmg}",
        mineDetonate: "地雷引爆",
        bombPickup: "炸药储备 +1（共 {n}）· 按 B 布设地雷",
        missilePickup: "导弹储备 +1（共 {n}）· 按 V 齐射",
        hpGain: "耐久 +1 ({hp}/{max})",
        hpFull: "耐久已满",
        lifeGain: "备用战机 +1（当前 {lives} 命）",
        lifeFull: "战机编队已满",
        shieldBreak: "护盾破碎!",
        shieldBlock: "护盾抵挡! 剩余 {n} 层",
        damage: "机体受损 · 剩余 {hp} 点耐久",
        crashNoSpare: "战机坠毁 · 无备用机",
        spareSwap: "备用战机接入 · 剩余 {lives} 命",
        pickupToast: "获得【{name}】— {desc}",
        eggTiePatrol: "帝国巡逻机清除 — 听起来像有人在远处喊「我是你父亲」？",
        eggDarkVanguard: "黑暗先锋舰坠落 — 这不是你父亲的双翼战机…",
      },
      easter: {
        titleUnlock: "任务代号 Ω-7 已解锁：暗影刺客，直插敌巢。",
        subtitleRetry: "深空寂静。再试一次？",
        hudSignal: "雷达捕捉到微弱友军信号…",
        hudCombatOnly: "战斗中才能呼叫不明信号。",
        manualNote: "档案备注：同盟侦察机遭追击时，击落伴随的帝国追击机即可掩护其撤离。友军自带 IFF，子弹会穿透。",
        manualNoteTitle: "点击展开备注",
        manualTeaser: "档案中有几则未标注坐标的遭遇记录……（点此查看备注）",
        stageLifeBonus: "连续突破 {n} 关！备用战机 +1（当前 {lives} 命）",
        pool1: "这不是你正在寻找的战机……但它确实很快。",
        pool2: "愿原力与你同在 — 至少在这一局里。",
        pool3: "帝国巡逻报告：目标过小，雷达难以锁定。",
        pool4: "有人说过：相信原力，也相信你的操作。",
      },
      cheat: {
        maytheforce: "原力与你同在 — 暗影刺客，愿星辰指引你的刀刃。",
        darkside: "我感觉到一股杀气……以及一点光剑电池的味道。",
        omega7: "Ω-7 任务档案：深入敌巢，迅如流星，静如深空。",
      },
    },

    en: {
      ui: {
        gameTitle: "Sky Strike",
        subtitleBefore: "Shadow Assassin · Strike the ",
        subtitleSecret: "Enemy",
        subtitleAfter: " Fortress",
        startHintDesktop: "Stage campaign · 3 lives · 4 HP per plane · WASD / click move · B mines · V missiles",
        startHintMobile: "Stage campaign · 3 lives · 4 HP per plane · drag to move · side buttons for mines/missiles",
        startGame: "Start Game",
        openManual: "View Manual",
        universeJump: "Universe Jump",
        universeJumpBoss: "Breakthrough: {boss}",
        universeJumpHint: "Entering a new universe — fighters and enemies reskin entirely…",
        jumpSkip: "Enter Now",
        stageClear: "Stage Clear",
        stageClearLine: "Stage {n} · {name}",
        stageScore: "Stage Score",
        stageTotal: "Total Score",
        nextStage: "Next: {name}",
        nextStageBtn: "Next Stage",
        gameOver: "Campaign Over",
        reachedStage: "Reached Stage {n}",
        finalScore: "Total Score",
        restart: "Retry Campaign",
        manualTitle: "Manual",
        manualSubtitle: "Complete Guide",
        closeManual: "Close",
        hudScore: "Score",
        hudLives: "Lives",
        hudHp: "Hull",
        hudStage: "Stage",
        hudUniverse: "Universe",
        hudBombs: "Bombs",
        hudMissiles: "Missiles",
        helpTitle: "Manual (H)",
        helpAria: "Manual",
        muteTitle: "Mute (M)",
        muteAria: "Mute",
        muteOn: "🔇",
        muteOff: "🔊",
        hudSecretTitle: "Faint signal",
        bombAria: "Deploy mine",
        missileAria: "Fire missiles",
        statsToggleAria: "Fighter status",
        statsCloseAria: "Close status",
        fullscreenTitle: "Fullscreen",
        fullscreenAria: "Fullscreen",
        statsTitle: "Fighter Status",
        statSpeed: "Speed",
        statFireRate: "Fire Rate",
        statWeapon: "Weapon",
        statDamage: "Damage",
        statLives: "Lives",
        statHp: "Hull",
        statShield: "Shield",
        statBombs: "Bombs",
        statMissiles: "Missiles",
        buffListTitle: "Buffs",
        buffEmpty: "None",
        buffRemain: "{n}s left",
        shieldActive: "Active ({time}{layers})",
        shieldLayers: " · {n} layers",
        shieldNone: "None",
        weaponStandard: "Standard single",
        weaponLaser: "Piercing laser",
        weaponLaserStack: "Piercing laser x{n}",
        weaponPower: "Triple spread",
        weaponPowerStack: "Triple spread x{n}",
        weaponCombo: " + ",
        speedBonus75: " (+75%)",
        speedBonus95: " (+95%)",
        speedBonus115: " (+115%)",
        fireRateSuffix: "/s",
        livesAria: "Remaining lives",
        hpAria: "Fighter hull",
        landscapeHint: "Rotate to <strong>portrait</strong> for the best experience",
        mobileTutorialTitle: "Mobile Controls",
        mobileTutorial1: "<strong>Drag</strong> with one finger — fighter follows",
        mobileTutorial2: "Tap <strong>💣</strong> for mines · <strong>🚀</strong> for missiles",
        mobileTutorial3: "Tap <strong>⚙</strong> for status &amp; buffs",
        mobileTutorialDismiss: "Got it — engage",
        langToggle: "中",
        langToggleTitle: "Switch to Chinese",
      },
      stage: {
        label: "Stage {n}",
        endlessTip: "Endless deep space — difficulty keeps climbing",
        barAssault: "Stage {n} · {name} · Clear the wave",
        barClearing: "Stage {n} · Mop up stragglers… · {remain} left",
        barBoss: "Stage {n} · Defeat {boss}",
        barMopup: "Stage {n} · Mop up stragglers · {remain} left",
        barLoot: "Stage {n} · Collect boss loot · {count} left",
        barComplete: "Stage {n} · Stage complete",
        barCleared: "Stage {n} · Battlefield clear",
      },
      buff: {
        power: "Triple Fire",
        shield: "Energy Shield",
        speed: "Boost",
        laser: "Piercing Laser",
        stackBoost: "{name} x{n} boosted!",
        hudPower: "🔥Fire",
        hudShield: "🛡Shield",
        hudSpeed: "⚡Boost",
        hudLaser: "💜Laser",
        hudSec: "s",
      },
      entity: {
        scout: "Scout",
        interceptor: "Interceptor",
        gunship: "Gunship",
        phantom: "Phantom",
        carrier: "Carrier",
        wraith: "Wraith",
        meteor: "Meteor Ship",
        tie_patrol: "Imperial Patrol Craft",
        dark_interceptor: "Dark Vanguard",
        ember_hunter: "Ember Hunter",
        spore_scout: "Spore Scout Pod",
        holo_drone: "Holo Drone",
        rebel_scout: "Rebel Scout",
        mini_sentry: "Sentry Cruiser",
        mini_striker: "Rift Striker",
        mini_phantom: "Phantom Command Boat",
        mini_ember: "Ember Cruiser",
        mini_magma: "Magma Striker",
        mini_ash: "Ash Guard Ship",
        mini_spore: "Spore Guard Ship",
        mini_vine: "Vine Striker",
        mini_moss: "Moss Cruiser",
        mini_neon: "Neon Drone",
        mini_glitch: "Glitch Hunter",
        mini_pixel: "Pixel Guard Ship",
        mega_storm: "Storm Carrier",
        mega_lava: "Magma Dreadnought",
        mega_eco: "Eco Mothership",
        mega_matrix: "Matrix Overlord",
        legacy_assault: "Heavy Assaultor",
        legacy_command: "Phantom Command Ship",
        legacy_storm: "Storm Carrier",
        imperial_pursuer: "Imperial Pursuer",
      },
      powerup: {
        power: {
          label: "Fire",
          fullName: "Triple Fire",
          shortDesc: "Spread+power",
          desc: "Triple spread shots for 10 seconds",
        },
        shield: {
          label: "Shield",
          fullName: "Energy Shield",
          shortDesc: "Block damage",
          desc: "Shield blocks one hit (8 seconds)",
        },
        speed: {
          label: "Boost",
          fullName: "Boost",
          shortDesc: "Speed +75%",
          desc: "Move 75% faster for 8 seconds",
        },
        bomb: {
          label: "Bomb",
          fullName: "Bomb Pack",
          shortDesc: "Stock +1",
          desc: "Gain 1 bomb stock; press B to drop descending mines (predicts boss X)",
        },
        health: {
          label: "Repair",
          fullName: "Hull Repair",
          shortDesc: "HP +1",
          desc: "Restore 1 HP (rare; blocked at full HP or on cooldown)",
        },
        life: {
          label: "Spare",
          fullName: "Spare Fighter",
          shortDesc: "Life +1",
          desc: "Add 1 identical spare fighter (auto swap-in, max 5 lives)",
        },
        laser: {
          label: "Laser",
          fullName: "Piercing Laser",
          shortDesc: "Pierce dmg",
          desc: "Piercing laser, ×3 damage (8 seconds)",
        },
        missile: {
          label: "Missile",
          fullName: "Homing Missiles",
          shortDesc: "Stock +1",
          desc: "Gain 1 salvo stock; press V to fire 3 homing missiles (boss priority)",
        },
      },
      ally: {
        escort: "Supply Transport",
        escortHint: "Escort close 2s",
        rescue: "Damaged Wingman",
        rescueHint: "Destroy 8 enemies to rescue",
        medical: "Medical Rescue Ship",
        medicalHint: "Escort for hull repair",
        escortCall: "Allied transport requests escort!",
        rescueCall: "Wingman calling for help!",
        medicalCall: "Medical ship inbound! Escort for hull repair",
        complete: "Mission complete! Supplies dropped",
        fail: "Ally mission failed",
        medicalDrop: "Medical drop deployed!",
        hpFullShield: "Hull full — shield dropped instead",
        cooldownShield: "Repair on cooldown — shield dropped",
      },
      rebel: {
        pursued: "Rebel scout under fire! Cover their breakout!",
        hint: "Destroy pursuers — cover extraction",
        pursuerLabel: "Pursuers {count}/{goal}",
        success: "Cover success! May the Force be with you",
        successToast: "Rebel scout extracted — pursuers eliminated.",
        fail: "Insufficient cover — scout forced withdrawal",
      },
      boss: {
        miniLabel: "Stage Boss",
        megaLabel: "Mega Boss",
        incoming: "⚠ {name} {tier} incoming!",
        defeated: "{name} destroyed! +{score}",
      },
      float: {
        waveRetreat: "Wave broken — mop up stragglers",
        battlefieldClear: "Battlefield clear — loot secured",
        noBombs: "No bomb stock",
        mineCap: "Mine cap reached ({max})",
        mineDeploy: "Mine deployed · stock {n}",
        noMissiles: "No missile stock",
        missileSalvo: "Missile salvo · stock {n}",
        mineHit: "Mine hit! -{dmg}",
        mineDetonate: "Mine detonated",
        bombPickup: "Bomb stock +1 ({n} total) · press B to deploy",
        missilePickup: "Missile stock +1 ({n} total) · press V to salvo",
        hpGain: "HP +1 ({hp}/{max})",
        hpFull: "Hull full",
        lifeGain: "Spare fighter +1 ({lives} lives)",
        lifeFull: "Squad at max lives",
        shieldBreak: "Shield shattered!",
        shieldBlock: "Shield blocked! {n} layers left",
        damage: "Hull damage · {hp} HP remaining",
        crashNoSpare: "Fighter down · no spares",
        spareSwap: "Spare fighter inbound · {lives} lives left",
        pickupToast: "Acquired [{name}] — {desc}",
        eggTiePatrol: "Patrol craft down — was that someone yelling 'I am your father' in the distance?",
        eggDarkVanguard: "Dark Vanguard falling — that's no ordinary twin-wing…",
      },
      easter: {
        titleUnlock: "Mission Ω-7 unlocked: Shadow Assassin, deep-strike protocol.",
        subtitleRetry: "Deep space is quiet. Try again?",
        hudSignal: "Radar ping — faint friendly signal…",
        hudCombatOnly: "Unknown signals only respond in combat.",
        manualNote: "Archive note: when a Rebel scout is pursued, destroy the Imperial pursuers to cover extraction. Allies have IFF — your shots pass through.",
        manualNoteTitle: "Click for note",
        manualTeaser: "Several undocumented encounters in the archives… (click for note)",
        stageLifeBonus: "Stage {n} breakthrough! Spare fighter +1 ({lives} lives)",
        pool1: "This isn't the fighter you're looking for… but it is fast.",
        pool2: "May the Force be with you — at least this run.",
        pool3: "Imperial patrol report: target too small for reliable lock.",
        pool4: "Someone once said: trust the Force, and your reflexes.",
      },
      cheat: {
        maytheforce: "May the Force be with you — Shadow Assassin, may the stars guide your blade.",
        darkside: "I sense aggression… and a faint whiff of lightsaber batteries.",
        omega7: "Ω-7 mission file: deep behind enemy lines, swift as a meteor, silent as the void.",
      },
    },
  };

  /* ── Helper accessors for game integration ─────────────────────── */
  function cheatMessage(code) {
    return t(`cheat.${code}`) || "";
  }

  function easterPool() {
    return [t("easter.pool1"), t("easter.pool2"), t("easter.pool3"), t("easter.pool4")];
  }

  function stageBarLabel(key, vars) {
    return t(`stage.${key}`, vars);
  }

  function buffLabel(key) {
    return t(`buff.${key}`);
  }

  function allyName(kind) {
    return t(`ally.${kind}`);
  }

  function allyHint(kind) {
    return t(`ally.${kind}Hint`);
  }

  function floatMsg(key, vars) {
    return t(`float.${key}`, vars);
  }

  function bossIncoming(name, tier) {
    const tierKey = tier === "mega" ? "megaLabel" : "miniLabel";
    return t("boss.incoming", { name, tier: t(`boss.${tierKey}`) });
  }

  function bossDefeated(name, score) {
    return t("boss.defeated", { name, score });
  }

  /* ── Init ─────────────────────────────────────────────────────── */
  currentLang = detectLang();
  document.documentElement.lang = currentLang === "zh" ? "zh-CN" : "en";

  window.GameI18n = {
    getLang,
    setLang,
    onChange,
    t,
    entity,
    powerup,
    stageName,
    stageTip,
    endlessStageName,
    themeName,
    getManualHtml,
    applyDOM,
    getSubtitleParts,
    cheatMessage,
    easterPool,
    stageBarLabel,
    buffLabel,
    allyName,
    allyHint,
    floatMsg,
    bossIncoming,
    bossDefeated,
    STAGE_COUNT: 9,
    THEME_COUNT: 4,
  };
})();