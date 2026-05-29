/* ================================================================
   DEVICE TIER SYSTEM — Advanced hardware detection
   Must be loaded FIRST (synchronously) before any engine
   ================================================================ */

'use strict';

window.DeviceTier = (() => {

  function detect() {
    const ua      = navigator.userAgent;
    const mobile  = /Mobi|Android|iPhone|iPad/i.test(ua);
    const cores   = navigator.hardwareConcurrency || 2;
    const mem     = navigator.deviceMemory || 4;
    const touch   = navigator.maxTouchPoints > 1;

    // Check for low-power mode hints
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return 'low';
    if (mobile || cores <= 2 || mem <= 2) return 'low';
    if (touch  || cores <= 4 || mem <= 4) return 'mid';
    return 'high';
  }

  const tier = detect();

  // Expose CSS class for adaptive styling
  document.documentElement.classList.add('tier-' + tier);

  return { tier };
})();
