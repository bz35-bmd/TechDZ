/* TechDZ — Réseau de nœuds connectés (fond animé)
   - Métaphore de la communauté : des membres (nœuds) qui se connectent entre eux
   - Léger (canvas 2D), pause onglet masqué, respecte prefers-reduced-motion
   - Couleurs lues depuis les variables CSS (--primary, --secondary), suit le thème */
(function () {
  'use strict';

  const canvas = document.createElement('canvas');
  canvas.className = 'network-bg';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  let particles = [];
  let raf = null;
  let colors = { primary: '46,107,255', accent: '20,184,166' };
  let running = false;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LINK_DIST = 130;

  function parseRGB(varName, fallback) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    const m = raw.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)/);
    return m ? m[1] + ',' + m[2] + ',' + m[3] : fallback;
  }

  function readColors() {
    colors.primary = parseRGB('--node-primary', '46,107,255');
    colors.accent = parseRGB('--node-accent', '20,184,166');
  }

  function spawn() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 1,
      accent: Math.random() < 0.15
    };
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(70, Math.max(24, (W * H) / 24000)));
    particles = Array.from({ length: n }, spawn);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20) p.x = W + 20; else if (p.x > W + 20) p.x = -20;
      if (p.y < -20) p.y = H + 20; else if (p.y > H + 20) p.y = -20;
    }

    const P = colors.primary;
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK_DIST * LINK_DIST) {
          const alpha = (1 - Math.sqrt(d2) / LINK_DIST) * 0.13;
          ctx.strokeStyle = 'rgba(' + P + ',' + alpha.toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    const A = colors.accent;
    for (const p of particles) {
      const c = p.accent ? A : P;
      if (p.accent) {
        ctx.fillStyle = 'rgba(' + A + ',0.10)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r + 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(' + c + ',0.55)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
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

  const themeObserver = new MutationObserver(() => {
    readColors();
    if (!document.hidden && !reduced) draw();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-bg-theme'] });

  readColors();
  resize();
  if (!document.hidden || reduced) start();

  window.__netBg = {
    get particleCount() { return particles.length; },
    get isRunning() { return running; },
    stop: stop,
    start: start
  };
})();
