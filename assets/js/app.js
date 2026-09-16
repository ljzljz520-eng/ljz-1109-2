/* ============================================================
   景泰蓝网站 · 交互核心
   1. 性能模式（自动探测 / ?perf=low / 手动切换，记忆到 localStorage）
   2. 移动端导航
   3. 滚动显现（IntersectionObserver，低性能直接显现）
   4. 懒加载（IntersectionObserver，低性能同步渲染）
   5. 首页：工序节点 + 材料带 + 头图画作
   6. 列表页：筛选（URL 参数 + sessionStorage 快照，与详情页共享）
   7. 详情页：还原筛选快照，纹样 / 釉色 / 年代面板
   ============================================================ */
(function () {
  'use strict';
  const { PROCESS, MATERIALS, CASES, FILTERS } = window.CT_DATA;
  const SVG = window.CT_SVG;
  const PERF_KEY = 'ct_perf_mode';
  const SNAP_KEY = 'ct_filter_snapshot';

  /* ---------- 1. 性能模式 ---------- */
  const Perf = {
    isLow() { return document.documentElement.dataset.perf === 'low'; },
    detect() {
      const url = new URLSearchParams(location.search).get('perf');
      if (url === 'low' || url === 'high') return url;
      const saved = localStorage.getItem(PERF_KEY);
      if (saved === 'low' || saved === 'high') return saved;
      /* 自动降级：硬件并发低 / 内存小 / 数据保护模式 */
      const nav = navigator;
      const weak = (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2) ||
                   (nav.deviceMemory && nav.deviceMemory <= 2) ||
                   nav.connection && nav.connection.saveData;
      return weak ? 'low' : 'high';
    },
    apply(mode) {
      document.documentElement.dataset.perf = mode;
      const btn = document.querySelector('.perf-toggle');
      if (btn) {
        btn.querySelector('.perf-label').textContent = mode === 'low' ? '低性能模式' : '标准模式';
        btn.setAttribute('aria-pressed', mode === 'low' ? 'true' : 'false');
        btn.title = mode === 'low' ? '当前：低性能（动画/懒加载已降级），点击切回标准模式' : '当前：标准模式，点击切换到低性能模式';
      }
    },
    toggle() {
      const next = this.isLow() ? 'high' : 'low';
      localStorage.setItem(PERF_KEY, next);
      this.apply(next);
      toast(next === 'low' ? '已切换到低性能模式：关闭动效与懒加载' : '已恢复标准模式：动效与懒加载生效');
    },
    init() {
      this.apply(this.detect());
      const onToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggle();
      };
      /* 直接绑定到按钮（含内部文字/圆点点击），stopPropagation 防止重复触发 */
      document.querySelectorAll('.perf-toggle').forEach(btn => btn.addEventListener('click', onToggle));
    }
  };

  /* ---------- 2. 轻提示 ---------- */
  let toastTimer;
  function toast(msg) {
    let el = document.querySelector('.toast');
    if (!el) {
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    requestAnimationFrame(() => el.classList.add('is-show'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('is-show'), 2600);
  }

  /* ---------- 3. 移动端导航 ---------- */
  function initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.main-nav');
    if (!toggle || !nav) return;
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- 4. 滚动显现（渐进增强） ---------- */
  let revealIO = null;
  /* 在启动时决定能力：仅在标准模式且支持 IO 时给 <html> 加 .js-anim，
     CSS 才会把 .reveal 初始隐藏；否则元素保持默认可见，杜绝“空白内容” */
  function setupRevealCapability() {
    if (!Perf.isLow() && 'IntersectionObserver' in window) {
      document.documentElement.classList.add('js-anim');
      revealIO = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = el.dataset.delay ? parseInt(el.dataset.delay, 10) : 0;
            setTimeout(() => el.classList.add('is-inview'), delay);
            revealIO.unobserve(el);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
      return true;
    }
    return false;
  }

  function initReveal() {
    const items = document.querySelectorAll('.reveal:not(.is-inview)');
    if (!revealIO) {
      /* 无动画能力：直接可见（此时 CSS 也不会隐藏它们） */
      items.forEach(el => el.classList.add('is-inview'));
      return;
    }
    items.forEach(el => revealIO.observe(el));
  }

  /* ---------- 5. 懒加载器物图 ---------- */
  function lazyArt(root = document) {
    const slots = root.querySelectorAll('[data-lazy-art]:not([data-rendered])');
    slots.forEach(slot => {
      const item = CASES.find(c => c.id === slot.dataset.lazyArt);
      if (!item) return;
      const render = () => {
        slot.innerHTML = SVG.vesselSVG(item);
        slot.setAttribute('data-rendered', '');
        const art = slot.querySelector('svg');
        if (art) {
          art.classList.add('lazy-art');
          requestAnimationFrame(() => requestAnimationFrame(() => art.classList.add('is-loaded')));
        }
        const skel = slot.parentElement.querySelector('.art-skeleton');
        if (skel) skel.remove();
      };
      if (Perf.isLow() || !('IntersectionObserver' in window)) {
        render(); /* 低性能：直接渲染，不做观察与骨架屏 */
      } else {
        const io = new IntersectionObserver((entries, obs) => {
          entries.forEach(en => {
            if (en.isIntersecting) { render(); obs.disconnect(); }
          });
        }, { rootMargin: '160px 0px' });
        io.observe(slot);
      }
    });
  }

  /* ---------- 6. 首页 ---------- */
  function renderHome() {
    const hero = document.querySelector('[data-hero-art]');
    if (hero) hero.innerHTML = SVG.heroVesselSVG();

    const track = document.querySelector('[data-process-track]');
    if (track) {
      track.innerHTML = PROCESS.map((step, i) => `
        <article class="process-step reveal" data-step="${step.no}" data-reveal="zoom" data-delay="${i * 90}">
          <div class="step-icon">${SVG.STEP_ICONS[step.icon]}</div>
          <h3>${step.title}</h3>
          <span class="step-sub">${step.sub}</span>
          <p class="desc">${step.desc}</p>
          <dl class="step-meta">
            <div class="meta-row">
              <span class="meta-ic" aria-hidden="true">◆</span>
              <dt>材料</dt><dd>${step.meta.material}</dd>
            </div>
            <div class="meta-row">
              <span class="meta-ic" aria-hidden="true">▲</span>
              <dt>温度</dt><dd class="${/℃/.test(step.meta.temperature) ? 'temp-hot' : ''}">${step.meta.temperature}</dd>
            </div>
            <div class="meta-row">
              <span class="meta-ic" aria-hidden="true">◷</span>
              <dt>时长</dt><dd>${step.meta.duration}</dd>
            </div>
          </dl>
        </article>`).join('');
    }

    const materials = document.querySelector('[data-materials]');
    if (materials) {
      materials.innerHTML = MATERIALS.map((m, i) => `
        <div class="material-card reveal" data-reveal="${i % 2 ? 'right' : 'left'}" data-delay="${i * 80}">
          <h3>${m.name}</h3>
          <p>${m.desc}</p>
        </div>`).join('');
    }

    const featured = document.querySelector('[data-featured-grid]');
    if (featured) {
      featured.innerHTML = CASES.slice(0, 3).map((item, i) => caseCardHTML(item, i)).join('');
    }
  }

  function caseCardHTML(item, i = 0) {
    return `
    <a class="case-card reveal" data-reveal="zoom" data-delay="${(i % 3) * 90}"
       href="detail.html?id=${encodeURIComponent(item.id)}"
       data-case-id="${item.id}" aria-label="查看${item.name}详情">
      <div class="art">
        <div class="art-skeleton" aria-hidden="true"></div>
        <div class="art-slot" data-lazy-art="${item.id}"></div>
      </div>
      <div class="card-body">
        <div class="tag-row">
          <span class="tag tag--era">${item.era}</span>
          <span class="tag tag--shape">${item.shape}</span>
          <span class="tag">${item.glazeLabel}</span>
        </div>
        <h3>${item.name}</h3>
        <p class="card-desc">${item.summary}</p>
        <span class="card-more">鉴赏详情 <span class="arrow" aria-hidden="true">→</span></span>
      </div>
    </a>`;
  }

  /* ---------- 7. 列表页：筛选与快照 ---------- */
  const defaultFilters = { eraKey: 'all', glazeKey: 'all', typeKey: 'all' };

  function readURLFilters() {
    const p = new URLSearchParams(location.search);
    const out = { ...defaultFilters };
    Object.keys(defaultFilters).forEach(k => {
      const v = p.get(k);
      if (v) out[k] = v;
    });
    return out;
  }

  function renderCasesPage() {
    const bar = document.querySelector('[data-filter-bar]');
    const grid = document.querySelector('[data-case-grid]');
    if (!bar || !grid) return;

    /* 优先 URL 参数，其次 sessionStorage 快照（从详情页返回时），最后默认 */
    const hasQuery = location.search.includes('eraKey=') || location.search.includes('glazeKey=') || location.search.includes('typeKey=');
    let state;
    if (hasQuery) {
      state = readURLFilters();
    } else {
      try {
        const snap = JSON.parse(sessionStorage.getItem(SNAP_KEY) || 'null');
        state = snap && snap.filters ? snap.filters : { ...defaultFilters };
      } catch (e) { state = { ...defaultFilters }; }
    }

    /* 筛选条 */
    bar.innerHTML = FILTERS.map(group => `
      <div class="filter-group" role="group" aria-label="按${group.label}筛选">
        <span class="group-label">${group.label}</span>
        ${group.options.map(opt => `
          <button type="button" class="chip" data-filter-key="${group.key}"
                  data-filter-value="${opt.value}"
                  aria-pressed="${state[group.key] === opt.value ? 'true' : 'false'}">${opt.text}</button>`).join('')}
      </div>`).join('');

    function apply(nextState, fromUser) {
      state = nextState;
      /* 更新按钮态 */
      bar.querySelectorAll('.chip').forEach(chip => {
        chip.setAttribute('aria-pressed',
          String(state[chip.dataset.filterKey] === chip.dataset.filterValue));
      });
      /* 过滤渲染 */
      const list = CASES.filter(item =>
        (state.eraKey === 'all' || item.eraKey === state.eraKey) &&
        (state.glazeKey === 'all' || item.glazeKey === state.glazeKey) &&
        (state.typeKey === 'all' || item.typeKey === state.typeKey)
      );
      grid.innerHTML = list.length
        ? list.map((item, i) => caseCardHTML(item, i)).join('')
        : '';
      const noResult = document.querySelector('.no-result');
      noResult.classList.toggle('is-visible', list.length === 0);

      /* URL 可分享 + 快照供详情页共享；保留 fromDetail/fromId 等瞬态标记 */
      const params = new URLSearchParams();
      Object.entries(state).forEach(([k, v]) => { if (v !== 'all') params.set(k, v); });
      const qs = params.toString();
      history.replaceState(null, '', qs ? `cases.html?${qs}` : 'cases.html');
      let prevSnap = null;
      try { prevSnap = JSON.parse(sessionStorage.getItem(SNAP_KEY) || 'null'); } catch (e) {}
      const nextSnap = {
        filters: state,
        resultCount: list.length,
        savedAt: Date.now()
      };
      /* 保留“来自详情页”的瞬态标记，待本页恢复提示后再清除 */
      if (prevSnap && prevSnap.fromDetail) {
        nextSnap.fromDetail = prevSnap.fromDetail;
        if (prevSnap.fromId) nextSnap.fromId = prevSnap.fromId;
      }
      sessionStorage.setItem(SNAP_KEY, JSON.stringify(nextSnap));

      lazyArt(grid);
      initReveal();
      if (fromUser) toast(list.length ? `已筛选出 ${list.length} 件器物，筛选状态已保存` : '没有符合条件的器物，请调整筛选');
    }

    bar.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      apply({ ...state, [chip.dataset.filterKey]: chip.dataset.filterValue }, true);
    });

    /* 初次渲染：apply 保留 fromDetail 标记，随后仅提示一次并清除（不再重渲染） */
    apply(state, false);
    try {
      const restored = JSON.parse(sessionStorage.getItem(SNAP_KEY) || 'null');
      if (restored && restored.fromDetail) {
        toast(`已恢复上次筛选（${restored.resultCount} 件结果）`);
        /* 清除瞬态标记，filters/resultCount 保持不变 */
        const clean = {
          filters: restored.filters,
          resultCount: restored.resultCount,
          savedAt: restored.savedAt
        };
        sessionStorage.setItem(SNAP_KEY, JSON.stringify(clean));
      }
    } catch (e) {}
  }

  /* 点击案例卡：保存来源快照（标记将前往详情页） */
  function bindSnapshotNav() {
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.case-card');
      if (!card) return;
      try {
        const snap = JSON.parse(sessionStorage.getItem(SNAP_KEY) || 'null');
        if (snap) {
          snap.fromDetail = true;
          snap.fromId = card.dataset.caseId;
          sessionStorage.setItem(SNAP_KEY, JSON.stringify(snap));
        }
      } catch (err) {}
    });
  }

  /* ---------- 8. 详情页 ---------- */
  function renderDetailPage() {
    const root = document.querySelector('[data-detail-root]');
    if (!root) return;
    const id = new URLSearchParams(location.search).get('id');
    const item = CASES.find(c => c.id === id) || CASES[0];
    const idx = CASES.findIndex(c => c.id === item.id);
    const prev = CASES[(idx - 1 + CASES.length) % CASES.length];
    const next = CASES[(idx + 1) % CASES.length];

    let snap = null;
    try { snap = JSON.parse(sessionStorage.getItem(SNAP_KEY) || 'null'); } catch (e) {}
    const backQS = snap && snap.filters
      ? '?' + Object.entries(snap.filters)
          .filter(([, v]) => v !== 'all')
          .map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')
      : '';
    const backHref = 'cases.html' + (backQS ? backQS : '');

    root.innerHTML = `
      <nav class="breadcrumb container" aria-label="面包屑">
        <a href="index.html">首页</a><span class="sep" aria-hidden="true">/</span>
        <a href="${backHref}">器物案例</a><span class="sep" aria-hidden="true">/</span>
        <span>${item.name}</span>
      </nav>
      <div class="container detail-layout">
        <figure class="detail-art reveal" data-reveal="left">
          ${SVG.vesselSVG(item)}
        </figure>
        <article class="detail-body reveal" data-reveal="right">
          <header class="detail-title">
            <span class="eyebrow">${item.era}</span>
            <h1>${item.name}</h1>
            <p class="detail-summary">${item.summary}</p>
          </header>

          <dl class="fact-table">
            <div class="fact"><dt>器型</dt><dd>${item.shape}</dd></div>
            <div class="fact"><dt>年代定位</dt><dd>${item.era}</dd></div>
            <div class="fact"><dt>主体釉色</dt><dd>${item.glazeLabel}</dd></div>
            <div class="fact"><dt>主体纹样</dt><dd>${item.pattern.name}</dd></div>
          </dl>

          <div class="snapshot-note ${snap && snap.fromDetail ? 'is-visible' : ''}">
            <span aria-hidden="true">❖</span>
            <span>本页与列表页共享筛选快照：返回后将还原 <b>${describeFilters(snap)}</b> 的筛选状态。</span>
          </div>

          <div class="detail-panels">
            <details class="detail-panel" open>
              <summary>纹样 · ${item.pattern.name}</summary>
              <div class="panel-body">
                <p>${item.pattern.desc}</p>
                <p><b>纹样寓意：</b>${item.pattern.meaning}</p>
              </div>
            </details>
            <details class="detail-panel" open>
              <summary>釉色 · ${item.glaze.name}</summary>
              <div class="panel-body">
                <p>${item.glaze.desc}</p>
                <div class="swatch-row" role="list" aria-label="本器釉色">
                  ${item.colors.map(sw => `
                    <span class="swatch" role="listitem">
                      <i style="background:${sw.hex}" aria-hidden="true"></i>
                      <span>${sw.name}</span>
                    </span>`).join('')}
                </div>
              </div>
            </details>
            <details class="detail-panel" open>
              <summary>年代 · ${item.era}</summary>
              <div class="panel-body">
                <p>${item.eraNote}</p>
              </div>
            </details>
          </div>

          <nav class="detail-nav" aria-label="案例翻页">
            <a class="btn btn--ghost" href="detail.html?id=${prev.id}">← ${prev.shape}</a>
            <a class="btn btn--primary" href="${backHref}">返回案例列表</a>
            <a class="btn btn--ghost" href="detail.html?id=${next.id}">${next.shape} →</a>
          </nav>
        </article>
      </div>`;

    /* 消费一次 fromDetail 标记（详情→列表时再提示恢复） */
    if (snap && snap.fromDetail) {
      snap.fromDetail = true; /* 保留：返回列表时用于提示；列表页读取后清除 */
      sessionStorage.setItem(SNAP_KEY, JSON.stringify(snap));
    }
  }

  function describeFilters(snap) {
    if (!snap || !snap.filters) return '全部器物';
    const labels = [];
    FILTERS.forEach(g => {
      const v = snap.filters[g.key];
      if (v && v !== 'all') {
        const opt = g.options.find(o => o.value === v);
        if (opt) labels.push(opt.text);
      }
    });
    return labels.length ? labels.join(' · ') : '全部器物';
  }

  /* ---------- 9. 设计规范页 TOC 高亮 ---------- */
  function initSpecTOC() {
    const links = document.querySelectorAll('.spec-toc a[href^="#"]');
    if (!links.length || Perf.isLow() || !('IntersectionObserver' in window)) return;
    const map = new Map();
    links.forEach(a => map.set(a.getAttribute('href').slice(1), a));
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          links.forEach(a => a.classList.remove('is-active'));
          const link = map.get(en.target.id);
          if (link) link.classList.add('is-active');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    map.forEach((_, id) => {
      const sec = document.getElementById(id);
      if (sec) io.observe(sec);
    });
  }

  /* ---------- 启动（幂等，防止事件重复派发导致二次渲染） ---------- */
  let __booted = false;
  function boot() {
    if (__booted) return;
    __booted = true;
    Perf.init();
    setupRevealCapability();
    initNav();
    renderHome();
    renderCasesPage();
    renderDetailPage();
    bindSnapshotNav();
    lazyArt();
    initReveal();
    initSpecTOC();
    /* 安全网：首屏内已存在的 .reveal 若因任何原因未进入观察，强制显现，避免空白 */
    setTimeout(() => {
      if (!revealIO) return;
      document.querySelectorAll('.reveal:not(.is-inview)').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-inview');
      });
    }, 600);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
