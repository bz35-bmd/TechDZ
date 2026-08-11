/* TechDZ — Dunes du Sahara (fond animé)
   Dunes ondulantes au coucher du soleil, reflet de l'identité algérienne.
   Léger (canvas 2D), pause onglet masqué, respecte prefers-reduced-motion */
(function () {
  'use strict';

  const canvas = document.createElement('canvas');
  canvas.className = 'dunes-bg';
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
    return {
      x: Math.random(),
      y: Math.random() * 0.45,
      r: Math.random() * 1.2 + 0.4,
      p: Math.random() * Math.PI * 2,
      s: 0.4 + Math.random() * 1.2
    };
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.round(Math.min(90, Math.max(30, W / 14))) }, spawnStar);
  }

  function duneY(x, base, amp, w, phase) {
    return base + amp * Math.sin(x / w + phase);
  }

  function draw() {
    const t = (performance.now() - t0) / 1000;

    // Ciel : coucher de soleil
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0F1235');
    sky.addColorStop(0.45, '#2D1B69');
    sky.addColorStop(0.72, '#B45309');
    sky.addColorStop(1, '#92400E');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Soleil avec halo
    const sx = W * 0.72;
    const sy = H * 0.52;
    const maxR = Math.min(W, H);
    const glow = ctx.createRadialGradient(sx, sy, 4, sx, sy, maxR * 0.18);
    glow.addColorStop(0, 'rgba(251,191,36,0.5)');
    glow.addColorStop(1, 'rgba(251,191,36,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(sx - maxR * 0.18, sy - maxR * 0.18, maxR * 0.36, maxR * 0.36);
    ctx.fillStyle = '#FDE68A';
    ctx.beginPath();
    ctx.arc(sx, sy, maxR * 0.045, 0, Math.PI * 2);
    ctx.fill();

    // Étoiles du soir (haut du ciel)
    for (let i = 0; i < stars.length; i++) {
      const st = stars[i];
      const a = 0.25 + 0.55 * Math.abs(Math.sin(t * st.s + st.p));
      ctx.globalAlpha = a;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(st.x * W, st.y * H, st.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Dunes (3 couches qui ondulent lentement)
    const layers = [
      { base: 0.62, amp: 0.035, w: 240, speed: 0.03, phase: 0,   top: 'rgba(212,168,87,0.55)',  bottom: 'rgba(146,80,20,0.55)' },
      { base: 0.74, amp: 0.045, w: 190, speed: 0.05, phase: 2.1, top: 'rgba(180,120,60,0.65)',  bottom: 'rgba(110,66,20,0.65)' },
      { base: 0.88, amp: 0.05,  w: 150, speed: 0.07, phase: 4.2, top: 'rgba(150,95,50,0.78)',   bottom: 'rgba(80,50,20,0.78)' }
    ];
    for (const L of layers) {
      const grad = ctx.createLinearGradient(0, L.base * H - L.amp * H - 30, 0, H);
      grad.addColorStop(0, L.top);
      grad.addColorStop(1, L.bottom);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(0, duneY(0, L.base * H, L.amp * H, L.w, L.speed * t + L.phase));
      for (let x = 8; x <= W; x += 8) {
        ctx.lineTo(x, duneY(x, L.base * H, L.amp * H, L.w, L.speed * t + L.phase));
      }
      ctx.lineTo(W, H);
      ctx.closePath();
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

  resize();
  if (!document.hidden || reduced) start();

  window.__dunesBg = {
    get isRunning() { return running; },
    stop: stop,
    start: start
  };
})();
