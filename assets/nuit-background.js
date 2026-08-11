/* TechDZ — Nuit étoilée (fond animé)
   Étoiles scintillantes, lune croissante et nébuleuses : une ambiance calme.
   Léger (canvas 2D), pause onglet masqué, respecte prefers-reduced-motion */
(function () {
  'use strict';

  const canvas = document.createElement('canvas');
  canvas.className = 'nuit-bg';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  let stars = [];
  let raf = null;
  let running = false;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const t0 = performance.now();

  function spawnStar() {
    const big = Math.random() < 0.06;
    return {
      x: Math.random(),
      y: Math.random(),
      r: (big ? 1.6 : 0.5) + Math.random() * 1.2,
      p: Math.random() * Math.PI * 2,
      s: 0.5 + Math.random() * 1.6,
      big: big
    };
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.round(Math.min(160, Math.max(60, (W * H) / 6000))) }, spawnStar);
  }

  function draw() {
    const t = (performance.now() - t0) / 1000;

    // Fond de nuit
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#070B1E');
    bg.addColorStop(0.6, '#0B1030');
    bg.addColorStop(1, '#160F38');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Nébuleuses (halos très doux)
    const maxR = Math.min(W, H);
    const n1 = ctx.createRadialGradient(W * 0.2, H * 0.3, 0, W * 0.2, H * 0.3, maxR * 0.5);
    n1.addColorStop(0, 'rgba(99,102,241,0.10)');
    n1.addColorStop(1, 'rgba(99,102,241,0)');
    ctx.fillStyle = n1;
    ctx.fillRect(0, 0, W, H);
    const n2 = ctx.createRadialGradient(W * 0.85, H * 0.7, 0, W * 0.85, H * 0.7, maxR * 0.45);
    n2.addColorStop(0, 'rgba(168,85,247,0.08)');
    n2.addColorStop(1, 'rgba(168,85,247,0)');
    ctx.fillStyle = n2;
    ctx.fillRect(0, 0, W, H);

    // Étoiles scintillantes
    for (let i = 0; i < stars.length; i++) {
      const st = stars[i];
      const a = 0.25 + 0.65 * Math.abs(Math.sin(t * st.s + st.p));
      if (st.big) {
        ctx.fillStyle = 'rgba(147,197,253,' + (a * 0.15).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(st.x * W, st.y * H, st.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(226,232,240,' + a.toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(st.x * W, st.y * H, st.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lune croissante (haut à droite)
    const mx = W * 0.8;
    const my = H * 0.18;
    const mr = maxR * 0.07;
    const mg = ctx.createRadialGradient(mx, my, mr * 0.4, mx, my, mr * 2.4);
    mg.addColorStop(0, 'rgba(226,232,240,0.18)');
    mg.addColorStop(1, 'rgba(226,232,240,0)');
    ctx.fillStyle = mg;
    ctx.fillRect(mx - mr * 2.4, my - mr * 2.4, mr * 4.8, mr * 4.8);
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0B1030';
    ctx.beginPath();
    ctx.arc(mx + mr * 0.55, my - mr * 0.2, mr * 0.92, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(148,163,184,0.35)';
    ctx.beginPath();
    ctx.arc(mx - mr * 0.35, my + mr * 0.3, mr * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop() {
    if (!running) return;
    draw();
    raf = requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    if (reduced) {
      draw();
      running = false;
    } else {
      loop();
    }
  }

  function stop() {
    running = false;
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (!reduced) start();
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      if (!document.hidden && !reduced) draw();
    }, 150);
  });

  resize();
  if (!document.hidden || reduced) start();

  window.__nuitBg = {
    get isRunning() { return running; },
    stop: stop,
    start: start
  };
})();
