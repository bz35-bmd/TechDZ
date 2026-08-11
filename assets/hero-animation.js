/* ============================================
   TechDZ — Hero Animation (intégration réelle)
   Variantes : Minimal / Network / Signal,
   sélecteur dans la navbar (pattern theme-picker).
   S'adapte au vrai DOM : cartes inclinées (--rot),
   cyclage "active" natif, stats réelles chargées en
   async (statMembers / statPosts / statJobs).
   Engine: Web Animations API + tweens custom.
   ============================================ */

(function () {
  'use strict';

  window.__heroAnimActive = true;

  const hero = document.querySelector('.hero');
  if (!hero) return;

  const $ = s => document.querySelector(s);
  const $$ = (s, root) => Array.from((root || document).querySelectorAll(s));
  const cssVar = name => (getComputedStyle(document.documentElement).getPropertyValue(name) || '').trim() || '20, 184, 166';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const STORAGE_KEY = 'techdz-hero-anim';

  /* ---------- Registry ---------- */
  const waapiAnims = [];
  const tweens = [];

  function pauseAll() {
    waapiAnims.forEach(a => a.pause());
    tweens.forEach(t => t.pause());
  }
  function resumeAll() {
    waapiAnims.forEach(a => a.play());
    tweens.forEach(t => t.resume());
  }
  function cancelAll() {
    waapiAnims.forEach(a => { try { a.cancel(); } catch (e) {} });
    waapiAnims.length = 0;
    tweens.forEach(t => t.cancel());
    tweens.length = 0;
    const svg = document.getElementById('netOverlay');
    if (svg) while (svg.firstChild) svg.removeChild(svg.firstChild);
    $$('.hero-card').forEach(c => c.classList.remove('lit'));
  }

  /* ---------- Tween ---------- */
  class Tween {
    constructor(cb, dur, delay = 0, ease = t => 1 - Math.pow(1 - t, 3)) {
      this.cb = cb; this.dur = dur; this.delay = delay; this.ease = ease;
      this.elapsed = 0; this.done = false; this.paused = false;
      this.raf = null; this._last = null; this.onDone = null;
    }
    play() {
      if (this.raf !== null) return;
      this.paused = false;
      const step = now => {
        if (this.paused) { this.raf = null; return; }
        if (this._last === null) this._last = now;
        const dt = now - this._last; this._last = now;
        this.elapsed += dt;
        if (this.elapsed >= this.delay) {
          const p = Math.min(1, (this.elapsed - this.delay) / this.dur);
          const v = this.ease(p);
          this.cb(v, p);
          if (p >= 1) {
            this.done = true; this.raf = null;
            if (this.onDone) this.onDone();
            return;
          }
        }
        this.raf = requestAnimationFrame(step);
      };
      this.raf = requestAnimationFrame(step);
    }
    pause() { this.paused = true; this.raf = null; }
    resume() { if (!this.done) this.play(); }
    cancel() { this.paused = true; this.raf = null; }
  }
  const schedule = (delay, fn) => {
    const t = new Tween(() => {}, 1, delay);
    t.onDone = fn;
    t.play();
    tweens.push(t);
  };

  /* ---------- Helpers WAAPI ---------- */
  function anim(el, frames, opt) {
    const a = el.animate(frames, { fill: 'forwards', easing: 'cubic-bezier(0.16, 1, 0.3, 1)', ...opt });
    waapiAnims.push(a);
    return a;
  }
  function fadeUp(el, delay, dur = 600, dist = 26) {
    if (!el) return null;
    return anim(el, [
      { opacity: 0, transform: `translateY(${dist}px)` },
      { opacity: 1, transform: 'translateY(0)' }
    ], { delay, duration: dur });
  }
  function fadeIn(el, delay, dur = 500) {
    if (!el) return null;
    return anim(el, [{ opacity: 0 }, { opacity: 1 }], { delay, duration: dur });
  }
  function slideDown(el, delay, dur = 600) {
    if (!el) return null;
    return anim(el, [
      { opacity: 0, transform: 'translateY(-16px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { delay, duration: dur });
  }

  /* Les cartes réelles sont inclinées (--rot) et cyclées par la classe
     "active" native (transform). On n'anime donc JAMAIS transform sur la
     carte elle-même : seulement opacity + un halo via filter. */
  function activateCard(el, delay = 0) {
    if (!el) return null;
    const accent = cssVar('--node-accent');
    const glow = `drop-shadow(0 0 ${26}px rgba(${accent}, 0.55))`;
    const a = anim(el, [
      { opacity: 0, filter: 'brightness(0.55) drop-shadow(0 0 0px rgba(0,0,0,0))' },
      { opacity: 1, filter: `brightness(1.08) ${glow}` }
    ], { delay, duration: 520 });
    el.classList.add('lit');
    return a;
  }

  /* Count-up : lit la VRAIE valeur dans le texte courant. Les stats réelles
     sont chargées en async par la page : on retente jusqu'à ~3s si "0". */
  function countUp(el, delay, dur = 1000) {
    if (!el) return null;
    const fmt = n => n.toLocaleString('en-US');
    let tried = 0;
    const run = () => {
      const raw = (el.textContent || '').replace(/[^\d]/g, '');
      const target = parseInt(raw, 10) || 0;
      if (target <= 0) {
        tried++;
        if (tried > 30) return null;
        const t = new Tween(() => {}, 1, 100);
        t.onDone = run;
        t.play();
        tweens.push(t);
        return null;
      }
      const tw = new Tween(v => { el.textContent = fmt(Math.round(target * v)); }, dur, delay);
      tw.play();
      tweens.push(tw);
      return tw;
    };
    return run();
  }

  /* ---------- Réseau SVG ---------- */
  function networkBase() {
    const svg = document.getElementById('netOverlay');
    if (!svg) return null;
    const W = svg.clientWidth, H = svg.clientHeight;
    if (!W || !H) return null;
    const cards = $$('.hero-card');
    if (cards.length !== 3) return null;
    const c1 = cards[0];
    const c1r = c1.getBoundingClientRect();
    const heroRect = hero.getBoundingClientRect();
    if (c1r.width === 0 || c1r.bottom <= heroRect.top) return null;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const svgRect = svg.getBoundingClientRect();
    const local = el => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - svgRect.left, y: r.top + r.height / 2 - svgRect.top };
    };
    const targets = {
      card1: local(cards[0]),
      card2: local(cards[1]),
      card3: local(cards[2])
    };
    const hub = {
      x: (targets.card1.x + targets.card2.x + targets.card3.x) / 3,
      y: (targets.card1.y + targets.card2.y + targets.card3.y) / 3
    };
    const pathEl = (p0, p2) => {
      const dx = p2.x - p0.x, dy = p2.y - p0.y;
      const px = -dy, py = dx;
      const norm = Math.hypot(px, py) || 1;
      const off = 26;
      const cx = px / norm * off, cy = py / norm * off;
      const c1b = { x: p0.x + dx * 0.33 + cx, y: p0.y + dy * 0.33 + cy };
      const c2b = { x: p0.x + dx * 0.66 + cx, y: p0.y + dy * 0.66 + cy };
      const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      p.setAttribute('d', `M ${p0.x} ${p0.y} C ${c1b.x} ${c1b.y} ${c2b.x} ${c2b.y} ${p2.x} ${p2.y}`);
      p.setAttribute('class', 'net-path');
      p.setAttribute('stroke-linecap', 'round');
      svg.appendChild(p);
      return p;
    };
    return { svg, hub, targets, pathEl };
  }

  function drawNode(geo) {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${geo.hub.x}, ${geo.hub.y})`);
    const aura = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    aura.setAttribute('r', '26'); aura.setAttribute('class', 'net-aura');
    const node = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    node.setAttribute('r', '4.5'); node.setAttribute('class', 'net-node');
    const rings = [];
    for (let i = 0; i < 2; i++) {
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('r', '5'); ring.setAttribute('class', 'net-ring');
      ring.style.transformBox = 'fill-box';
      ring.style.transformOrigin = 'center';
      g.appendChild(ring);
      rings.push(ring);
    }
    g.appendChild(aura);
    g.appendChild(node);
    geo.svg.appendChild(g);
    return { node, rings, aura };
  }

  function pulseRings(rings, delay, count = 3, dur = 700, gap = 320) {
    rings.forEach((ring, i) => {
      for (let k = 0; k < count; k++) {
        const start = delay + k * gap;
        anim(ring, [
          { transform: 'scale(0.5)', opacity: 0.85 },
          { transform: 'scale(2.4)', opacity: 0 }
        ], { delay: start + i * 90, duration: dur, easing: 'cubic-bezier(0.33, 0, 0.67, 0)' });
      }
    });
  }

  function drawLinkBetween(geo, from, to, delay, dur, solid = false) {
    const path = geo.pathEl(from, to);
    if (solid) path.setAttribute('class', 'net-flow');
    const L = path.getTotalLength();
    path.style.strokeDasharray = `${L}`;
    path.style.strokeDashoffset = `${L}`;
    const a = anim(path, [
      { strokeDashoffset: L },
      { strokeDashoffset: 0 }
    ], { delay, duration: dur, easing: 'cubic-bezier(0.65, 0, 0.35, 1)' });
    return { path, L, a };
  }

  function energizeLink(pathEl, delay, dur) {
    const L = pathEl.getTotalLength();
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('r', '3.4'); dot.setAttribute('class', 'net-head');
    pathEl.ownerSVGElement.appendChild(dot);
    const t = new Tween(v => {
      const p = pathEl.getPointAtLength(L * v);
      dot.setAttribute('cx', p.x);
      dot.setAttribute('cy', p.y);
      dot.setAttribute('opacity', v >= 0.02 ? 1 : 0);
    }, dur, delay);
    t.play();
    tweens.push(t);
    const fade = new Tween(v => dot.setAttribute('opacity', String(1 - v)), 240, delay + dur);
    fade.play();
    tweens.push(fade);
    anim(pathEl, [{ opacity: 0.3 }, { opacity: 1 }],
      { delay: delay + dur - 80, duration: 320, easing: 'ease-out' });
    return { L, t };
  }

  const heroCard = n => document.querySelector(`.hero-card-${n}`);

  /* ---------- Titres (h1 > 2 spans, comme le preview) ---------- */
  const titleEls = () => $$('.hero-title > span').length ? $$('.hero-title > span') : $$('.hero-title');

  /* ---------- Variante A — Minimal Reveal ---------- */
  function timelineA() {
    const navLogo = $('.nav-logo');
    const navLinks = $('#navLinks');
    const navActions = $('.nav-actions');
    if (navLogo) slideDown(navLogo, 60, 500);
    if (navLinks) fadeIn(navLinks, 140, 500);
    if (navActions) fadeIn(navActions, 200, 500);
    fadeUp($('.hero-badge'), 260, 550, 18);
    const titles = titleEls();
    fadeUp(titles[0], 340, 600);
    if (titles[1]) fadeUp(titles[1], 410, 600);
    fadeUp($('.hero-desc'), 480, 600);
    fadeUp($('.hero-cta'), 560, 600);
    fadeUp($('.hero-stats'), 640, 600, 20);
    countUp($('#statMembers'), 720, 900);
    countUp($('#statPosts'), 760, 900);
    countUp($('#statJobs'), 800, 900);
    activateCard(heroCard(1), 620);
    activateCard(heroCard(2), 690);
    activateCard(heroCard(3), 760);
  }

  /* ---------- Variante B — Network Connect (maille) ---------- */
  function timelineB() {
    const geo = networkBase();
    const navLogo = $('.nav-logo');
    const navLinks = $('#navLinks');
    const navActions = $('.nav-actions');
    if (navLogo) slideDown(navLogo, 60, 500);
    if (navLinks) fadeIn(navLinks, 140, 500);
    if (navActions) fadeIn(navActions, 200, 500);

    fadeUp($('.hero-badge'), 200, 500, 14);
    const titles = titleEls();
    fadeUp(titles[0], 320, 600);
    if (titles[1]) fadeUp(titles[1], 390, 600);
    fadeUp($('.hero-desc'), 460, 600);
    fadeUp($('.hero-cta'), 540, 600);
    fadeUp($('.hero-stats'), 620, 600, 20);
    countUp($('#statMembers'), 700, 800);
    countUp($('#statPosts'), 740, 800);
    countUp($('#statJobs'), 780, 800);

    if (!geo) {
      activateCard(heroCard(1), 460);
      activateCard(heroCard(2), 620);
      activateCard(heroCard(3), 780);
      return;
    }

    const ng = drawNode(geo);
    pulseRings(ng.rings, 420, 3, 850, 360);
    anim(ng.aura, [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }],
      { delay: 380, duration: 500 });

    const spokes = [
      { key: 1, d: 460, dur: 400 },
      { key: 2, d: 620, dur: 400 },
      { key: 3, d: 780, dur: 400 }
    ];
    spokes.forEach(l => {
      drawLinkBetween(geo, geo.hub, geo.targets['card' + l.key], l.d, l.dur);
      schedule(l.d + l.dur - 60, () => activateCard(heroCard(l.key)));
    });

    const mesh = [
      { a: 'card1', b: 'card2', d: 1000, dur: 330 },
      { a: 'card2', b: 'card3', d: 1130, dur: 330 },
      { a: 'card1', b: 'card3', d: 1260, dur: 330 }
    ];
    mesh.forEach(l => drawLinkBetween(geo, geo.targets[l.a], geo.targets[l.b], l.d, l.dur));
  }

  /* ---------- Variante C — Signal Flow (flux) ---------- */
  function timelineC() {
    const geo = networkBase();
    const navLogo = $('.nav-logo');
    const navLinks = $('#navLinks');
    const navActions = $('.nav-actions');
    if (navLogo) slideDown(navLogo, 60, 500);
    if (navLinks) fadeIn(navLinks, 140, 500);
    if (navActions) fadeIn(navActions, 200, 500);

    fadeUp($('.hero-badge'), 200, 500, 14);
    const titles = titleEls();
    anim(titles[0], [
      { opacity: 0, filter: 'blur(8px)', transform: 'translateY(14px)' },
      { opacity: 1, filter: 'blur(0)', transform: 'translateY(0)' }
    ], { delay: 300, duration: 550 });
    if (titles[1]) anim(titles[1], [
      { opacity: 0, filter: 'blur(8px)', transform: 'translateY(14px)' },
      { opacity: 1, filter: 'blur(0)', transform: 'translateY(0)' }
    ], { delay: 390, duration: 550 });
    fadeUp($('.hero-desc'), 480, 600);
    fadeUp($('.hero-cta'), 560, 600);
    fadeUp($('.hero-stats'), 700, 600, 20);
    countUp($('#statMembers'), 820, 950);
    countUp($('#statPosts'), 900, 950);
    countUp($('#statJobs'), 980, 950);

    if (!geo) {
      activateCard(heroCard(1), 720);
      activateCard(heroCard(2), 940);
      activateCard(heroCard(3), 1160);
      return;
    }

    const ng = drawNode(geo);
    const hubLinks = [
      geo.pathEl(geo.hub, geo.targets.card1),
      geo.pathEl(geo.hub, geo.targets.card2),
      geo.pathEl(geo.hub, geo.targets.card3)
    ];
    const meshLinks = [
      geo.pathEl(geo.targets.card1, geo.targets.card2),
      geo.pathEl(geo.targets.card2, geo.targets.card3),
      geo.pathEl(geo.targets.card1, geo.targets.card3)
    ];
    [...hubLinks, ...meshLinks].forEach((p, i) => {
      p.setAttribute('class', 'net-flow');
      p.setAttribute('opacity', '0.3');
      fadeIn(p, 260 + i * 50, 300);
    });
    anim(ng.aura, [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1)' }],
      { delay: 300, duration: 500 });
    pulseRings(ng.rings, 500, 4, 800, 360);

    const waves = [
      { key: 1, link: hubLinks[0], d: 720, dur: 500 },
      { key: 2, link: hubLinks[1], d: 940, dur: 500 },
      { key: 3, link: hubLinks[2], d: 1160, dur: 500 }
    ];
    waves.forEach(w => {
      energizeLink(w.link, w.d, w.dur);
      schedule(w.d + w.dur - 60, () => activateCard(heroCard(w.key)));
    });
  }

  /* ---------- États ---------- */
  function ready() {
    document.body.classList.add('hero-anim-ready');
  }
  function showAll() {
    document.body.classList.remove('hero-anim-ready');
  }

  /* ---------- Variantes ---------- */
  const VARIANTS = {
    minimal: { name: 'Minimal', dur: '800ms' },
    network: { name: 'Network', dur: '1500ms' },
    signal: { name: 'Signal', dur: '1700ms' }
  };
  const MIGRATE = { a: 'minimal', b: 'network', c: 'signal' };
  let current = 'network';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || 'network';
    current = MIGRATE[saved] || saved;
    if (!VARIANTS[current]) current = 'network';
  } catch (e) {}

  function playVariant(v) {
    if (!VARIANTS[v]) v = 'network';
    cancelAll();
    current = v;
    try { localStorage.setItem(STORAGE_KEY, v); } catch (e) {}
    $$('[data-hero-anim]').forEach(b => {
      const is = b.dataset.heroAnim === v;
      b.classList.toggle('active', is);
      b.setAttribute('aria-checked', is ? 'true' : 'false');
    });
    if (reduceMotion.matches) { requestAnimationFrame(showAll); return; }
    ready();
    requestAnimationFrame(() => {
      if (v === 'minimal') timelineA();
      else if (v === 'network') timelineB();
      else timelineC();
    });
  }

  /* ---------- Sélecteur navbar (pattern theme-picker) ---------- */
  function initNavPicker() {
    const btn = document.getElementById('heroAnimPickerBtn');
    if (!btn) return;
    const menu = document.getElementById('heroAnimPickerMenu');
    if (!menu) return;
    const close = () => {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    };
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    $$('[data-hero-anim]', menu).forEach(opt =>
      opt.addEventListener('click', () => {
        playVariant(opt.dataset.heroAnim);
        close();
      }));
    document.addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    $$('[data-hero-anim]', menu).forEach(b => {
      const is = b.dataset.heroAnim === current;
      b.classList.toggle('active', is);
      b.setAttribute('aria-checked', is ? 'true' : 'false');
    });
  }

  /* ---------- Démarrage : on masque immédiatement, on joue après le preloader ---------- */
  function boot() {
    initNavPicker();
    if (reduceMotion.matches) { showAll(); return; }
    ready();
    const start = () => setTimeout(() => playVariant(current), 900);
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start);
  }

  let resizeT = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      if (current === 'minimal' || reduceMotion.matches) return;
      if (document.body.classList.contains('hero-anim-ready')) playVariant(current);
    }, 300);
  });

  boot();
})();
