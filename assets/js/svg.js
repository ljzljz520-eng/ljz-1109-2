/* ============================================================
   景泰蓝网站 · 内联 SVG 器物生成器
   纯函数返回字符串，无外部图片依赖，可直接 innerHTML
   视口：0 0 240 280；金色铜丝 = var(--color-wire) 风格硬编码
   ============================================================ */
(function () {
  'use strict';

  const WIRE = '#b08d3e';
  const WIRE_HI = '#e3c574';

  /* 器物轮廓（返回 path d 与口沿/底足椭圆），内部用 clipPath 裁剪釉面纹样 */
  const SHAPES = {
    /* 梅瓶：小口丰肩敛足 */
    meiping: {
      body: 'M104 42 h32 l-3 16 c22 12 35 32 35 56 0 40 -22 82 -22 116 v20 h-52 v-20 c0 -34 -22 -76 -22 -116 0 -24 13 -44 35 -56 z',
      rim: { cx: 120, cy: 42, rx: 20, ry: 5 },
      foot: { cx: 120, cy: 250, rx: 30, ry: 6 }
    },
    /* 高足杯：撇口杯身 + 高足 */
    gaozubei: {
      body: 'M62 66 c0 40 26 74 26 100 l64 0 c0 -26 26 -60 26 -100 z M104 166 h32 v40 l-18 12 v18 h36 v-18 l-18 -12 z',
      rim: { cx: 120, cy: 66, rx: 58, ry: 8 },
      foot: { cx: 120, cy: 236, rx: 34, ry: 6 }
    },
    /* 蒜头瓶：蒜头小口、束颈、垂腹 */
    suantouping: {
      body: 'M102 34 c0 -10 36 -10 36 0 0 12 -8 16 -8 24 18 8 30 24 30 52 0 46 -18 92 -18 112 v14 h-44 v-14 c0 -20 -18 -66 -18 -112 0 -28 12 -44 30 -52 0 -8 -8 -12 -8 -24 z',
      rim: { cx: 120, cy: 30, rx: 13, ry: 4 },
      foot: { cx: 120, cy: 250, rx: 26, ry: 6 }
    },
    /* 捧盒：扁圆盒 + 盖面 */
    penghe: {
      body: 'M56 150 a64 40 0 0 1 128 0 z M64 150 h112 v40 a20 14 0 0 1 -20 12 h-72 a20 14 0 0 1 -20 -12 z',
      rim: { cx: 120, cy: 112, rx: 60, ry: 12 },
      foot: { cx: 120, cy: 202, rx: 44, ry: 7 }
    },
    /* 折沿盘：浅腹盘 + 折沿 */
    pan: {
      body: 'M36 138 a84 26 0 0 0 168 0 z M52 138 a68 30 0 0 0 136 0 z',
      rim: { cx: 120, cy: 132, rx: 84, ry: 14 },
      foot: { cx: 120, cy: 168, rx: 52, ry: 8 }
    },
    /* 鼎式炉：立耳鼓腹三柱足 */
    dinglu: {
      body: 'M70 96 h14 v-26 c-8 -2 -12 2 -14 10 z M170 96 h-14 v-26 c8 -2 12 2 14 10 z M60 96 a60 56 0 0 0 120 0 z M84 146 v58 h16 v-58 z M140 146 v58 h16 v-58 z M112 146 v58 h16 v-58 z',
      rim: { cx: 120, cy: 96, rx: 60, ry: 9 },
      foot: { cx: 120, cy: 212, rx: 66, ry: 8 }
    },
    /* 玉壶春瓶：撇口细颈垂腹 */
    yuhuchunping: {
      body: 'M84 46 c0 18 16 22 16 40 0 22 -30 30 -30 78 0 40 22 70 22 90 v14 h56 v-14 c0 -20 22 -50 22 -90 0 -48 -30 -56 -30 -78 0 -18 16 -22 16 -40 z',
      rim: { cx: 120, cy: 46, rx: 26, ry: 6 },
      foot: { cx: 120, cy: 268, rx: 32, ry: 6 }
    },
    /* 双耳瓶：盘口束颈双龙耳 */
    erping: {
      body: 'M88 40 h64 v10 c8 6 8 18 0 24 v20 c10 8 14 20 14 52 0 44 -14 76 -14 100 v14 h-64 v-14 c0 -24 -14 -56 -14 -100 0 -32 4 -44 14 -52 v-20 c-8 -6 -8 -18 0 -24 z M74 96 c-16 6 -16 40 2 48 M166 96 c16 6 16 40 -2 48',
      rim: { cx: 120, cy: 40, rx: 22, ry: 5 },
      foot: { cx: 120, cy: 260, rx: 30, ry: 6 }
    }
  };

  const SHAPE_BY_CASE = {
    'meiping-changzhilian': 'meiping',
    'gaozubei-yunlong': 'gaozubei',
    'suantouping-huaniao': 'suantouping',
    'penghe-babao': 'penghe',
    'pan-baoxiang': 'pan',
    'dinglu-haishui': 'dinglu',
    'yuhuchun-putao': 'yuhuchunping',
    'erping-jinji': 'erping'
  };

  /* ---------- 纹样绘制器（均在 clip 区域内，已含金色掐丝） ---------- */
  const MOTIFS = {
    /* 缠枝莲：连绵卷草 + 正面莲花 */
    lotus(colors) {
      const [blue, red, gold, cream] = colors.map(x => x.hex);
      return `
      <g fill="none" stroke="${WIRE}" stroke-width="1.6" stroke-linecap="round">
        <path d="M30 150 C60 110 90 190 120 150 C150 110 180 190 210 150"/>
        <path d="M30 196 C62 158 90 232 120 196 C150 160 178 232 210 196"/>
        <path d="M52 132 q14 -18 30 -6 M160 132 q-14 -18 -30 -6 M52 214 q14 -18 30 -6 M158 214 q-14 -18 -30 -6"/>
      </g>
      <g stroke="${WIRE_HI}" stroke-width="1.3">
        ${lotusFlower(70, 128, 0.8, [red, gold, cream])}
        ${lotusFlower(120, 150, 1, [red, gold, cream])}
        ${lotusFlower(170, 128, 0.8, [red, gold, cream])}
        ${lotusFlower(95, 200, 0.7, [cream, red, gold])}
        ${lotusFlower(145, 200, 0.7, [cream, red, gold])}
      </g>
      <g fill="none" stroke="${WIRE}" stroke-width="1.2" opacity="0.85">
        <path d="M44 92 q10 6 4 18 M196 92 q-10 6 -4 18"/>
        <circle cx="46" cy="86" r="4" fill="${gold}"/>
        <circle cx="194" cy="86" r="4" fill="${gold}"/>
      </g>`;
    },
    /* 云龙：如意云头 + 龙身 */
    cloud(colors) {
      const [blue2, gold, red, cream] = colors.map(x => x.hex);
      return `
      <g fill="none" stroke="${WIRE}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        ${ruyiCloud(60, 110, 0.9)}
        ${ruyiCloud(175, 120, 0.8)}
        ${ruyiCloud(70, 200, 0.75)}
        ${ruyiCloud(168, 205, 0.7)}
      </g>
      <path d="M40 168 C70 140 96 176 120 160 C144 144 170 178 202 150"
            fill="none" stroke="${WIRE_HI}" stroke-width="4.5" stroke-linecap="round"/>
      <path d="M40 168 C70 140 96 176 120 160 C144 144 170 178 202 150"
            fill="none" stroke="${red}" stroke-width="2" stroke-dasharray="2 7" stroke-linecap="round"/>
      <g stroke="${WIRE}" stroke-width="1.2">
        <path d="M198 146 l16 -8 -4 12 10 2 -14 8 2 12 -10 -8 z" fill="${gold}"/>
        <circle cx="203" cy="148" r="2" fill="${WIRE}"/>
      </g>
      <g fill="${gold}" stroke="${WIRE}" stroke-width="0.8" opacity="0.9">
        <circle cx="64" cy="160" r="2.2"/><circle cx="86" cy="153" r="1.8"/><circle cx="148" cy="172" r="2"/>
      </g>`;
    },
    /* 花鸟：折枝花 + 栖禽 */
    birdflower(colors) {
      const [green, green2, yellow, red] = colors.map(x => x.hex);
      return `
      <g fill="none" stroke="${WIRE}" stroke-width="1.6" stroke-linecap="round">
        <path d="M56 220 C80 190 100 150 96 110"/>
        <path d="M96 110 c-14 -10 -30 -6 -36 4 M96 120 c16 -12 34 -8 42 6 M86 150 c-16 -4 -26 -16 -28 -28 M104 168 c18 -2 30 -12 36 -26"/>
      </g>
      <g stroke="${WIRE}" stroke-width="1.2">
        ${leaf(66, 104, -30, 0.9, green)}
        ${leaf(128, 116, 35, 0.85, green2)}
        ${leaf(62, 128, -55, 0.75, green2)}
        ${leaf(132, 146, 40, 0.7, green)}
        ${flower(52, 92, 0.62, [red, yellow])}
        ${flower(142, 128, 0.55, [yellow, red])}
      </g>
      ${bird(120, 132, 1, [yellow, red, green2])}
      <g stroke="${WIRE}" stroke-width="1" opacity="0.8">
        <path d="M110 132 q-10 -8 -20 -2" fill="none"/>
      </g>`;
    },
    /* 宝相花/八吉祥：放射对称团花 */
    baoxiang(colors) {
      const [dark, turq, gold, cream] = colors.map(x => x.hex);
      let petals = '';
      for (let i = 0; i < 8; i++) {
        const a = i * 45;
        const fill = i % 2 === 0 ? turq : cream;
        petals += `<ellipse cx="120" cy="86" rx="11" ry="26" fill="${fill}" stroke="${WIRE_HI}" stroke-width="1.2" transform="rotate(${a} 120 120)"/>`;
      }
      let petals2 = '';
      for (let i = 0; i < 8; i++) {
        petals2 += `<ellipse cx="120" cy="100" rx="6" ry="14" fill="${gold}" stroke="${WIRE}" stroke-width="0.9" transform="rotate(${i * 45 + 22.5} 120 120)"/>`;
      }
      return `
      <g>${petals}${petals2}</g>
      <circle cx="120" cy="120" r="13" fill="${dark}" stroke="${WIRE_HI}" stroke-width="1.6"/>
      <circle cx="120" cy="120" r="5" fill="${gold}" stroke="${WIRE}" stroke-width="1"/>
      <g fill="none" stroke="${WIRE}" stroke-width="1.4">
        <circle cx="120" cy="120" r="64" stroke-dasharray="3 6"/>
      </g>
      ${eightTreasures(colors.map(x => x.hex))}
      <g stroke="${WIRE}" stroke-width="1.1">
        ${lotusFlower(58, 210, 0.55, [cream, gold, turq])}
        ${lotusFlower(182, 210, 0.55, [cream, gold, turq])}
      </g>`;
    },
    /* 海水江崖：海浪 + 立石 */
    wave(colors) {
      const [deepblue, cream, gold, red] = colors.map(x => x.hex);
      let waves = '';
      for (let i = 0; i < 6; i++) {
        const x = 28 + i * 34;
        waves += `
        <path d="M${x} 206 q10 -22 22 0 q-10 -10 -22 0 z" fill="${cream}" stroke="${WIRE}" stroke-width="1.1"/>
        <path d="M${x - 6} 224 q13 -26 28 0 q-13 -12 -28 0" fill="none" stroke="${WIRE_HI}" stroke-width="1.4"/>
        <circle cx="${x + 11}" cy="200" r="2.4" fill="${gold}"/>`;
      }
      return `
      <g>${waves}</g>
      <path d="M86 178 L120 116 L154 178 Z" fill="${gold}" stroke="${WIRE}" stroke-width="1.5"/>
      <path d="M100 178 L120 138 L140 178 Z" fill="${cream}" stroke="${WIRE}" stroke-width="1.2"/>
      <path d="M110 178 L120 152 L130 178 Z" fill="${deepblue}" stroke="${WIRE_HI}" stroke-width="1"/>
      <g fill="none" stroke="${WIRE}" stroke-width="1.1">
        <path d="M52 96 q12 8 0 18 M60 105 q-10 8 0 16 M188 96 q-12 8 0 18 M180 105 q10 8 0 16"/>
      </g>
      <g fill="${red}" stroke="${WIRE}" stroke-width="0.8">
        <circle cx="60" cy="86" r="3.4"/><circle cx="180" cy="86" r="3.4"/>
      </g>`;
    },
    /* 葡萄：垂藤、掌状叶、果串 */
    grape(colors) {
      const [cream, green, purple, gold] = colors.map(x => x.hex);
      let grapes = '';
      [[84, 150], [110, 142], [136, 150], [97, 172], [123, 172], [110, 194]].forEach((p, i) => {
        grapes += `<circle cx="${p[0]}" cy="${p[1]}" r="${i % 2 ? 9 : 10}" fill="${purple}" stroke="${WIRE}" stroke-width="1.1"/>`;
      });
      return `
      <g fill="none" stroke="${WIRE}" stroke-width="1.7" stroke-linecap="round">
        <path d="M60 96 C86 120 150 118 182 94"/>
        <path d="M104 122 C100 132 106 136 106 142"/>
      </g>
      <g stroke="${WIRE}" stroke-width="1.2">
        ${palmateLeaf(96, 104, -12, 0.95, green)}
        ${palmateLeaf(150, 106, 18, 0.85, '#3f6b40')}
        ${leaf(66, 118, -50, 0.7, green)}
        ${leaf(178, 110, 40, 0.65, green)}
      </g>
      <g>${grapes}</g>
      <g fill="none" stroke="${WIRE_HI}" stroke-width="0.7" opacity="0.8">
        <path d="M80 146 q6 -6 12 0 M106 138 q6 -6 12 0 M132 146 q6 -6 12 0"/>
      </g>
      <circle cx="110" cy="128" r="3" fill="${gold}" stroke="${WIRE}" stroke-width="0.8"/>`;
    }
  };

  function lotusFlower(cx, cy, s, cols) {
    const [petal, inner, hi] = cols;
    const petals = [];
    for (let i = 0; i < 6; i++) {
      petals.push(`<ellipse cx="${cx}" cy="${cy - 11 * s}" rx="5.5*s" ry="11*s" fill="${petal}" stroke-width="1.1" transform="rotate(${i * 60} ${cx} ${cy})"/>`.replace(/5\.5\*s/, 5.5 * s).replace(/11\*s/g, 11 * s));
    }
    return `<g>${petals.join('')}
      <circle cx="${cx}" cy="${cy}" r="${5 * s}" fill="${inner}"/>
      <circle cx="${cx}" cy="${cy}" r="${2.2 * s}" fill="${hi}"/></g>`;
  }

  function ruyiCloud(cx, cy, s) {
    return `
      <path d="M${cx - 34 * s} ${cy} q0 -16 ${16 * s} -14 q-2 -14 ${16 * s} -8 q6 -12 ${20 * s} 0 q14 -6 ${14 * s} 12 q2 12 -14 ${12} h-38 q-14 0 -14 -2 z" transform="translate(0,0)"/>`;
  }

  function leaf(cx, cy, deg, s, fill) {
    return `<path d="M0 0 Q16 -12 30 0 Q16 12 0 0 Z" fill="${fill}"
      transform="translate(${cx} ${cy}) rotate(${deg}) scale(${s})"/>`;
  }

  function palmateLeaf(cx, cy, deg, s, fill) {
    return `<path d="M0 4 L-6 -16 L-14 -8 L-12 -22 L-22 -18 L-14 -30 L-22 -34 L-6 -30 L0 -40 L6 -30 L22 -34 L14 -30 L22 -18 L12 -22 L14 -8 L6 -16 Z"
      fill="${fill}" transform="translate(${cx} ${cy}) rotate(${deg}) scale(${s})"/>`;
  }

  function flower(cx, cy, s, cols) {
    const [petal, core] = cols;
    let out = '';
    for (let i = 0; i < 5; i++) {
      out += `<circle cx="${cx}" cy="${cy - 8 * s}" r="${5.5 * s}" fill="${petal}" transform="rotate(${i * 72} ${cx} ${cy})"/>`;
    }
    return out + `<circle cx="${cx}" cy="${cy}" r="${3.5 * s}" fill="${core}"/>`;
  }

  function bird(cx, cy, s, cols) {
    const [body, wing, beak] = cols;
    return `
    <g transform="translate(${cx} ${cy}) scale(${s})" stroke="${WIRE}" stroke-width="1.2">
      <path d="M-16 4 C-16 -10 -2 -18 10 -10 C22 -2 18 12 4 14 C-8 16 -16 14 -16 4 Z" fill="${body}"/>
      <path d="M-2 -2 C6 -10 16 -6 16 2 C10 6 4 6 -2 4 Z" fill="${wing}"/>
      <path d="M12 -8 L24 -12 L14 -2 Z" fill="${beak}"/>
      <circle cx="9" cy="-8" r="2.2" fill="#1d1a17" stroke="none"/>
      <path d="M-8 14 l-3 10 M4 14 l4 9" fill="none" stroke="${WIRE}"/>
    </g>`;
  }

  function eightTreasures(cols) {
    const [, turq, gold, cream] = cols;
    let out = '';
    for (let i = 0; i < 8; i++) {
      const a = (i * 45 - 90) * Math.PI / 180;
      const x = 120 + Math.cos(a) * 48;
      const y = 120 + Math.sin(a) * 48;
      out += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${i * 45})">
        <circle r="6.5" fill="${i % 2 ? turq : cream}" stroke="${WIRE}" stroke-width="1"/>
        <path d="M-3 0 h6 M0 -3 v6" stroke="${gold}" stroke-width="1.2"/>
      </g>`;
    }
    return out;
  }

  /* ---------- 主生成函数 ---------- */
  function vesselSVG(item) {
    const shapeKey = SHAPE_BY_CASE[item.id] || 'meiping';
    const shape = SHAPES[shapeKey];
    const c = item.colors.map(x => x.hex);
    const motif = (MOTIFS[item.motif] || MOTIFS.lotus)(item.colors);
    /* 纹样内部统一以 colors 对象数组为入参，自行 .map 取 hex */
    return `
<svg viewBox="0 0 240 280" role="img" aria-label="${item.name}掐丝珐琅纹样示意" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-${item.id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${c[0]}" stop-opacity="1"/>
      <stop offset="0.55" stop-color="${c[0]}" stop-opacity="0.88"/>
      <stop offset="1" stop-color="#0d1f3a" stop-opacity="0.95"/>
    </linearGradient>
    <clipPath id="clip-${item.id}">
      <path d="${shape.body}"/>
    </clipPath>
  </defs>

  <!-- 釉面主体（珐琅底色） -->
  <path d="${shape.body}" fill="url(#bg-${item.id})" stroke="${WIRE_DEEP()}" stroke-width="2.4"/>

  <!-- 掐丝纹样（裁剪在胎体轮廓内） -->
  <g clip-path="url(#clip-${item.id})">
    ${motif}
    <!-- 釉面玻璃光 -->
    <path d="${shape.body}" fill="url(#gloss-${item.id})" opacity="0"/>
  </g>

  <!-- 玻璃高光覆盖层 -->
  <defs>
    <linearGradient id="gloss-${item.id}" x1="0" y1="0" x2="1" y2="0.6">
      <stop offset="0.1" stop-color="#fff" stop-opacity="0.28"/>
      <stop offset="0.45" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <path d="${shape.body}" fill="url(#gloss-${item.id})" clip-path="url(#clip-${item.id})"/>

  <!-- 口沿与底足鎏金 -->
  <ellipse cx="${shape.rim.cx}" cy="${shape.rim.cy}" rx="${shape.rim.rx}" ry="${shape.rim.ry}"
           fill="${WIRE}" stroke="#6d531d" stroke-width="1"/>
  <ellipse cx="${shape.rim.cx}" cy="${shape.rim.cy - 1}" rx="${shape.rim.rx - 4}" ry="${Math.max(2, shape.rim.ry - 2)}"
           fill="${c[0]}" stroke="${WIRE_HI}" stroke-width="0.8"/>
  <ellipse cx="${shape.foot.cx}" cy="${shape.foot.cy}" rx="${shape.foot.rx}" ry="${shape.foot.ry}"
           fill="${WIRE}" stroke="#6d531d" stroke-width="1"/>
  <ellipse cx="${shape.foot.cx}" cy="${shape.foot.cy - 1.5}" rx="${shape.foot.rx - 6}" ry="${Math.max(2, shape.foot.ry - 3)}"
           fill="#8a6a28"/>
</svg>`;
  }

  function WIRE_DEEP() { return '#7d5f24'; }

  /* 工序小图标（线性，描边色随容器 currentColor） */
  const STEP_ICONS = {
    wire: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M10 46 C24 20 40 52 54 22"/><circle cx="10" cy="46" r="3.4" fill="currentColor"/><circle cx="54" cy="22" r="3.4" fill="currentColor"/>
      <path d="M26 34 l6 -8 M38 38 l5 -7"/></svg>`,
    fill: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M40 8 L56 8 L30 52 L14 52 Z"/><path d="M34 20 L46 20"/>
      <path d="M10 58 h44" /><circle cx="18" cy="20" r="4"/></svg>`,
    fire: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M32 8 C40 20 46 26 46 38 a14 14 0 0 1 -28 0 c0 -7 4 -11 8 -15 c1 5 4 7 6 7 C30 24 30 15 32 8 Z"/>
      <path d="M32 44 a6 6 0 0 0 6 -6 c0 -4 -3 -6 -6 -9 c-1 3 -6 5 -6 9 a6 6 0 0 0 6 6 Z" fill="currentColor" stroke="none"/></svg>`,
    polish: `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="32" cy="46" rx="20" ry="8"/><path d="M14 42 L26 22 L44 18 L50 30 Z"/>
      <path d="M30 26 l8 4 M26 34 l10 4"/><path d="M12 54 q4 4 8 0 M30 56 q4 4 8 0 M46 54 q4 4 8 0"/></svg>`
  };

  /* 首页头图装饰器：缠枝莲环 + 宝瓶（使用第一件数据视觉） */
  function heroVesselSVG() {
    const item = {
      id: 'hero-vessel',
      motif: 'lotus',
      colors: [
        { hex: '#1c3d6e' }, { hex: '#a8332b' }, { hex: '#d9b867' }, { hex: '#e7d9b8' }
      ]
    };
    /* 复用 meiping 轮廓 */
    const shape = SHAPES.meiping;
    return `
<svg viewBox="0 0 240 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="景泰蓝梅瓶掐丝珐琅示意图">
  <defs>
    <linearGradient id="hero-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2e5a96"/><stop offset="1" stop-color="#122a4d"/>
    </linearGradient>
    <linearGradient id="hero-gloss" x1="0" y1="0" x2="1" y2="0.6">
      <stop offset="0.12" stop-color="#fff" stop-opacity="0.3"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="hero-clip"><path d="${shape.body}"/></clipPath>
  </defs>
  <path d="${shape.body}" fill="url(#hero-bg)" stroke="#6d531d" stroke-width="2.4"/>
  <g clip-path="url(#hero-clip)">${MOTIFS.lotus(item.colors)}</g>
  <path d="${shape.body}" fill="url(#hero-gloss)" clip-path="url(#hero-clip)"/>
  <ellipse cx="120" cy="42" rx="20" ry="5" fill="#d9b867" stroke="#6d531d"/>
  <ellipse cx="120" cy="41" rx="16" ry="3" fill="#1c3d6e"/>
  <ellipse cx="120" cy="250" rx="30" ry="6" fill="#d9b867" stroke="#6d531d"/>
  <ellipse cx="120" cy="248.5" rx="24" ry="3" fill="#8a6a28"/>
</svg>`;
  }

  window.CT_SVG = { vesselSVG, heroVesselSVG, STEP_ICONS };
})();
