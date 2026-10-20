/**
 * Timeline Scroll Animation
 * Draws the vertical amber line and lights up nodes as the page scrolls.
 * Honors prefers-reduced-motion: reduce by showing full line and lit nodes immediately.
 */
export function initTimeline(timelineEl) {
  if (!timelineEl || typeof window === 'undefined') {
    return () => {};
  }

  const container = timelineEl.classList?.contains('timeline')
    ? timelineEl
    : (timelineEl.querySelector('.timeline') || timelineEl);
  const lineEl = container.querySelector('[data-timeline-line]');
  const items = Array.from(container.querySelectorAll('[data-timeline-item]'));

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function setAllLit() {
    if (lineEl) {
      lineEl.style.transform = 'scaleY(1)';
    }
    items.forEach((item) => item.classList.add('is-lit'));
  }

  if (mediaQuery.matches) {
    setAllLit();
    return () => {};
  }

  let ticking = false;

  function update() {
    ticking = false;
    if (!lineEl || !container) return;

    // Unscaled height of the timeline container minus top/bottom offsets
    const totalHeight = container.clientHeight > 12
      ? container.clientHeight - 12
      : (lineEl.offsetHeight || 1);

    if (totalHeight <= 0) return;

    const containerRect = container.getBoundingClientRect();
    const lineTop = containerRect.top + 6;
    const focalY = window.innerHeight * 0.65;
    const drawnPx = focalY - lineTop;

    const progress = Math.min(1, Math.max(0, drawnPx / totalHeight));
    lineEl.style.transform = `scaleY(${progress})`;

    for (const item of items) {
      const itemRect = item.getBoundingClientRect();
      const dotY = itemRect.top + 12;
      if (dotY <= focalY) {
        item.classList.add('is-lit');
      } else {
        item.classList.remove('is-lit');
      }
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  function onMediaChange(e) {
    if (e.matches) {
      setAllLit();
    } else {
      update();
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', onMediaChange);
  } else if (mediaQuery.addListener) {
    mediaQuery.addListener(onMediaChange);
  }

  // Initial updates
  update();
  requestAnimationFrame(update);
  setTimeout(update, 100);

  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    if (mediaQuery.removeEventListener) {
      mediaQuery.removeEventListener('change', onMediaChange);
    } else if (mediaQuery.removeListener) {
      mediaQuery.removeListener(onMediaChange);
    }
  };
}
