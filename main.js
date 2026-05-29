/* =============================================
   MAIN.JS — Main site interactivity
   ============================================= */

window.initMainSite = function () {
  spawnFallingPetals();
  spawnFloatingOrbs();
  initScrollReveal();
  initCursorTrail();
  initSmoothScroll();
};

/* ===========================
   FALLING PETALS
   =========================== */
const PETAL_SET = ['🌸','🌺','🌷','🌼','🌸','🌹','🪷'];

function spawnFallingPetals() {
  const container = document.getElementById('falling-petals');
  if (!container) return;

  function createPetal() {
    const p = document.createElement('div');
    p.className = 'falling-petal';
    p.textContent = PETAL_SET[Math.floor(Math.random() * PETAL_SET.length)];

    const left     = Math.random() * 105 - 2;
    const duration = Math.random() * 12 + 10;
    const delay    = Math.random() * 8;
    const size     = Math.random() * 0.8 + 0.6;

    p.style.cssText = `
      left: ${left}%;
      font-size: ${size}rem;
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      opacity: 0;
    `;

    // stagger opacity start with delay
    setTimeout(() => { p.style.opacity = '0.7'; }, delay * 1000);

    container.appendChild(p);

    setTimeout(() => {
      p.remove();
      createPetal(); // loop
    }, (duration + delay + 1) * 1000);
  }

  // Spawn initial batch
  for (let i = 0; i < 14; i++) {
    createPetal();
  }
}

/* ===========================
   FLOATING ORBS
   =========================== */
function spawnFloatingOrbs() {
  const container = document.getElementById('floating-orbs');
  if (!container) return;

  const orbDefs = [
    { size: 500, top: '5%',  left: '-10%', dur: 12, del: 0   },
    { size: 350, top: '35%', right: '-8%', dur: 16, del: 2   },
    { size: 280, top: '65%', left: '20%',  dur: 10, del: 4   },
    { size: 420, top: '80%', right: '10%', dur: 14, del: 1   },
    { size: 200, top: '20%', left: '60%',  dur: 11, del: 5   },
  ];

  orbDefs.forEach(def => {
    const orb = document.createElement('div');
    orb.className = 'orb';
    orb.style.cssText = `
      width: ${def.size}px;
      height: ${def.size}px;
      top: ${def.top};
      ${def.left  ? `left: ${def.left};`  : ''}
      ${def.right ? `right: ${def.right};` : ''}
      animation-duration: ${def.dur}s;
      animation-delay: ${def.del}s;
    `;
    container.appendChild(orb);
  });
}

/* ===========================
   SCROLL REVEAL
   =========================== */
function initScrollReveal() {
  const cards = document.querySelectorAll('.reveal-card');
  if (!cards.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  cards.forEach(card => observer.observe(card));

  // Also reveal section titles
  const titles = document.querySelectorAll('.section-title, .msg-title, .finale-title');
  const titleObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.animation = 'fade-up 0.9s ease forwards';
        entry.target.style.opacity   = '0';
        // force reflow
        entry.target.getBoundingClientRect();
        entry.target.style.opacity = '';
      }
    });
  }, { threshold: 0.2 });

  titles.forEach(t => titleObserver.observe(t));
}

/* ===========================
   CURSOR TRAIL
   =========================== */
const TRAIL_PETALS = ['🌸','✨','🌺','💖','🌷','⋆'];
let lastTrail = 0;

function initCursorTrail() {
  // Only on non-touch
  if (window.matchMedia('(hover: none)').matches) return;

  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastTrail < 120) return;
    lastTrail = now;

    const el = document.createElement('div');
    el.className = 'cursor-petal';
    el.textContent = TRAIL_PETALS[Math.floor(Math.random() * TRAIL_PETALS.length)];
    el.style.cssText = `
      left: ${e.clientX - 10}px;
      top:  ${e.clientY - 10}px;
      font-size: ${Math.random() * 10 + 12}px;
      animation-duration: ${Math.random() * 0.4 + 0.6}s;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  });
}

/* ===========================
   SMOOTH SCROLL
   =========================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ===========================
   GARDEN FLOWER INTERACTION
   =========================== */
document.addEventListener('DOMContentLoaded', () => {
  // Garden flowers — create sparkle on hover
  document.querySelectorAll('.garden-flower').forEach(flower => {
    flower.addEventListener('mouseenter', () => {
      const bloom = flower.querySelector('.gf-bloom');
      if (!bloom) return;

      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const s = document.createElement('span');
          s.style.cssText = `
            position: absolute;
            pointer-events: none;
            font-size: ${Math.random() * 12 + 8}px;
            top: ${Math.random() * 60 - 30 + 30}px;
            left: ${Math.random() * 60 - 30 + 15}px;
            animation: cursor-fade 0.7s ease forwards;
            z-index: 20;
          `;
          s.textContent = ['✨','⋆','✦','✧'][Math.floor(Math.random() * 4)];
          flower.appendChild(s);
          setTimeout(() => s.remove(), 700);
        }, i * 80);
      }
    });
  });

  // Gallery cards — parallax tilt
  document.querySelectorAll('.gallery-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx   = (e.clientX - rect.left) / rect.width  - 0.5;
      const cy   = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `perspective(600px) rotateY(${cx * 10}deg) rotateX(${-cy * 10}deg) scale(1.04)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.5s ease, box-shadow 0.4s ease';
    });
  });

  // Reason cards — subtle tilt
  document.querySelectorAll('.reason-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx   = (e.clientX - rect.left) / rect.width  - 0.5;
      const cy   = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${cx * 8}deg) rotateX(${-cy * 8}deg) translateY(-10px) scale(1.02)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
});
