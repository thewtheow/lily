/* ================================================================
   CINEMATIC FLORAL ATMOSPHERE SYSTEM
   4-Layer Depth: Background → Mid → Foreground → Cinematic blur
   Canvas-rendered, GPU-accelerated, scroll-reactive
   ================================================================ */

'use strict';

const FloralAtmosphere = (() => {

  let canvas, ctx;
  let W = window.innerWidth;
  let H = window.innerHeight;
  let scrollVel = 0;
  let tick = 0;

  /* ================================================================
     PETAL RENDERERS
     ================================================================ */
  function renderSakura(c, x, y, sz, rot, alpha, color) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.globalAlpha = alpha;
    c.beginPath();
    c.moveTo(0, -sz);
    c.bezierCurveTo(sz * 0.8, -sz * 0.8, sz * 0.9, sz * 0.3, 0, sz * 0.6);
    c.bezierCurveTo(-sz * 0.9, sz * 0.3, -sz * 0.8, -sz * 0.8, 0, -sz);
    c.fillStyle = color;
    c.fill();
    c.globalAlpha = alpha * 0.25;
    c.strokeStyle = 'rgba(255,255,255,0.6)';
    c.lineWidth = sz * 0.07;
    c.beginPath();
    c.moveTo(0, -sz * 0.75);
    c.lineTo(0, sz * 0.5);
    c.stroke();
    c.restore();
  }

  function renderRose(c, x, y, sz, rot, alpha, color) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.globalAlpha = alpha;
    c.beginPath();
    c.ellipse(0, 0, sz * 0.5, sz, 0, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
    c.globalAlpha = alpha * 0.2;
    c.beginPath();
    c.ellipse(-sz * 0.1, -sz * 0.3, sz * 0.13, sz * 0.32, -0.3, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.fill();
    c.restore();
  }

  function renderSoft(c, x, y, sz, rot, alpha, color) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.globalAlpha = alpha;
    c.beginPath();
    c.ellipse(0, 0, sz * 0.38, sz * 0.85, 0, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
    c.restore();
  }

  // Micro petal — replaces old circular dust dots for a fully organic feel
  function renderMicroPetal(c, x, y, sz, rot, alpha, color) {
    c.save();
    c.translate(x, y);
    c.rotate(rot);
    c.globalAlpha = alpha;
    // Tiny sakura-style teardrop
    c.beginPath();
    c.moveTo(0, -sz);
    c.bezierCurveTo(sz * 0.7, -sz * 0.7, sz * 0.75, sz * 0.2, 0, sz * 0.5);
    c.bezierCurveTo(-sz * 0.75, sz * 0.2, -sz * 0.7, -sz * 0.7, 0, -sz);
    c.fillStyle = color + `,${alpha})`;
    c.fill();
    c.restore();
  }

  /* ================================================================
     COLOR PALETTES
     ================================================================ */
  const PAL = {
    bg:     ['rgba(170,70,110', 'rgba(130,50,90',  'rgba(190,80,125', 'rgba(150,60,100'],
    mid:    ['rgba(215,95,145', 'rgba(235,120,165','rgba(250,140,175','rgba(195,80,125'],
    fg:     ['rgba(255,150,185','rgba(255,120,165','rgba(235,95,140', 'rgba(255,170,205'],
    cinema: ['rgba(255,130,175','rgba(195,70,125', 'rgba(255,95,145'],
    dust:   ['rgba(255,195,215','rgba(247,195,110','rgba(255,175,200','rgba(255,215,235','rgba(195,145,200'],
  };
  const rc = p => p[Math.floor(Math.random() * p.length)];

  /* ================================================================
     LAYER 1 — tiny blurred background petals
     ================================================================ */
  const L1 = [];
  function spawnL1(scatter) {
    return {
      x: Math.random() * W,
      y: scatter ? Math.random() * H * 1.5 : -20,
      sz: Math.random() * 4 + 2,
      rot: Math.random() * Math.PI * 2,
      rspd: (Math.random() - 0.5) * 0.007,
      vx: (Math.random() - 0.5) * 0.28,
      vy: Math.random() * 0.22 + 0.07,
      alpha: Math.random() * 0.38 + 0.10,
      phase: Math.random() * Math.PI * 2,
      pspd: Math.random() * 0.005 + 0.002,
      par: 0.06 + Math.random() * 0.09,
      type: Math.random() > 0.5 ? 0 : 2, // sakura or soft
      col: rc(PAL.bg),
    };
  }
  const FA_TIER = window.PerfManager ? window.PerfManager.tier : 'high';
  const FA_L1_N   = FA_TIER === 'low' ? 25 : FA_TIER === 'mid' ? 45 : 70;
  const FA_L2_N   = FA_TIER === 'low' ? 14 : FA_TIER === 'mid' ? 28 : 45;
  const FA_L3_N   = 0; // disabled — was the big oval blobs
  const FA_DUST_N = FA_TIER === 'low' ? 16 : FA_TIER === 'mid' ? 30 : 50;
  const FA_USE_L4   = false; // disabled — was the giant sliding petals
  const FA_USE_BLUR = FA_TIER === 'high';
  for (let i = 0; i < FA_L1_N; i++) L1.push(spawnL1(true));

  /* ================================================================
     LAYER 2 — medium falling petals (size capped small)
     ================================================================ */
  const L2 = [];
  function spawnL2(scatter) {
    return {
      x:     Math.random() * W,
      y:     scatter ? Math.random() * H * 1.5 : -30,
      sz:    Math.random() * 5 + 3,           // 3–8px — was 5–13 (too big!)
      rot:   Math.random() * Math.PI * 2,
      rspd:  (Math.random() - 0.5) * 0.014,
      vx:    (Math.random() - 0.5) * 0.40,
      vy:    Math.random() * 0.32 + 0.10,
      alpha: Math.random() * 0.38 + 0.14,
      phase: Math.random() * Math.PI * 2,
      pspd:  Math.random() * 0.007 + 0.003,
      sway:  Math.random() * 0.9 + 0.3,
      par:   0.14 + Math.random() * 0.14,
      type:  Math.floor(Math.random() * 3),
      col:   rc(PAL.mid),
    };
  }
  for (let i = 0; i < FA_L2_N; i++) L2.push(spawnL2(true));

  /* L3 & L4 — disabled, were causing large oval blobs */
  const L3 = [], L4 = [];
  let l4Timer = 0;
  function spawnL3() { return null; }
  function spawnL4() { return null; }

  /* ================================================================
     MICRO PETAL PARTICLES (replaces circular dust dots)
     ================================================================ */
  const DUST = [];
  function spawnDust(scatter) {
    return {
      x:        Math.random() * W,
      y:        scatter ? Math.random() * H : -10,
      sz:       Math.random() * 2.8 + 1.2,   // slightly larger for petal visibility
      vy:       Math.random() * 0.16 + 0.04,
      vx:       (Math.random() - 0.5) * 0.12,
      rot:      Math.random() * Math.PI * 2,
      rspd:     (Math.random() - 0.5) * 0.022, // gentle rotation
      alpha:    0,
      alphaMax: Math.random() * 0.38 + 0.08,   // softer max opacity
      phase:    Math.random() * Math.PI * 2,
      pspd:     Math.random() * 0.016 + 0.004,
      par:      0.07 + Math.random() * 0.1,
      col:      rc(PAL.dust),
    };
  }
  for (let i = 0; i < FA_DUST_N; i++) DUST.push(spawnDust(true));

  /* ORBS / bokeh halos — removed entirely, full petal-only background */
  function buildOrbs() { /* no-op — orbs disabled */ }

  /* ================================================================
     DRAW TYPE HELPER
     ================================================================ */
  function renderPetal(c, p) {
    const a = p.alpha * (0.75 + 0.25 * Math.sin(p.phase));
    if      (p.type === 0) renderSakura(c, p.x, p.y, p.sz, p.rot, a, p.col + ')');
    else if (p.type === 1) renderRose(c, p.x, p.y, p.sz, p.rot, a, p.col + ')');
    else                   renderSoft(c, p.x, p.y, p.sz, p.rot, a, p.col + ')');
  }

  /* ================================================================
     MAIN RENDER
     ================================================================ */
  function render() {
    if (document.hidden) return; // pause when tab not visible
    requestAnimationFrame(render);
    tick++;
    ctx.clearRect(0, 0, W, H);

    /* No orbs / blobs — pure petal rain only */

    /* Layer 1 — blurred tiny petals */
    ctx.save();
    if (FA_USE_BLUR) ctx.filter = 'blur(2px)';
    for (let i = 0; i < L1.length; i++) {
      const p = L1[i];
      p.phase += p.pspd; p.rot += p.rspd;
      p.x += p.vx + Math.sin(p.phase) * 0.35;
      p.y += p.vy - scrollVel * p.par * 0.015;
      if (p.y > H + 25 || p.x < -25 || p.x > W + 25) { L1[i] = spawnL1(false); continue; }
      renderPetal(ctx, p);
    }
    ctx.filter = 'none';
    ctx.restore();

    /* Micro Petals (was: circular dust) */
    for (let i = 0; i < DUST.length; i++) {
      const p = DUST[i];
      p.phase += p.pspd;
      p.rot   += p.rspd;
      p.x += p.vx + Math.sin(p.phase * 0.6) * 0.18;
      p.y += p.vy - scrollVel * p.par * 0.01;
      if (p.alpha < p.alphaMax) p.alpha = Math.min(p.alphaMax, p.alpha + 0.007);
      if (p.y > H + 15) { DUST[i] = spawnDust(false); continue; }
      const a = p.alpha * (0.6 + 0.4 * Math.sin(p.phase));
      renderMicroPetal(ctx, p.x, p.y, p.sz, p.rot, a, p.col);
    }

    /* Layer 2 */
    for (let i = 0; i < L2.length; i++) {
      const p = L2[i];
      p.phase += p.pspd; p.rot += p.rspd;
      p.x += p.vx + Math.sin(p.phase) * p.sway;
      p.y += p.vy - scrollVel * p.par * 0.015;
      if (p.y > H + 40 || p.x < -40 || p.x > W + 40) { L2[i] = spawnL2(false); continue; }
      renderPetal(ctx, p);
    }

    /* Depth haze */
    const fog = ctx.createLinearGradient(0, H * 0.72, 0, H);
    fog.addColorStop(0, 'rgba(25,4,16,0)');
    fog.addColorStop(1, 'rgba(25,4,16,0.1)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, H * 0.72, W, H * 0.28);

    /* Decay scroll velocity */
    scrollVel *= 0.88;
  }

  /* ================================================================
     SCROLL
     ================================================================ */
  let lastSY = 0;
  function onScroll() {
    const sy = window.scrollY;
    scrollVel += (sy - lastSY) * 0.35;
    lastSY = sy;
  }

  /* ================================================================
     RESIZE
     ================================================================ */
  function onResize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W;
    canvas.height = H;
    buildOrbs();
  }

  /* ================================================================
     INIT
     ================================================================ */
  function init() {
    canvas = document.createElement('canvas');
    canvas.id = 'floral-canvas';
    canvas.style.cssText = [
      'position:fixed', 'top:0', 'left:0',
      'width:100%', 'height:100%',
      'pointer-events:none',
      'z-index:2',
      'transform:translate3d(0,0,0)',
      'backface-visibility:hidden',
    ].join(';');
    canvas.width  = W;
    canvas.height = H;
    ctx = canvas.getContext('2d');

    // Always insert into body so the fixed canvas covers ALL sections while scrolling
    document.body.insertBefore(canvas, document.body.firstChild);

    buildOrbs();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
    render();
  }

  return { init };
})();

window.initFloralAtmosphere = () => FloralAtmosphere.init();
