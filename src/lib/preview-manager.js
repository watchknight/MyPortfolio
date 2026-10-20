// Preview Manager: Enforces that at most ONE preview animation runs at a time.
// Auto-starts the mock that is mostly in view (>= 60%) on desktop pointers.
// Touch devices do not auto-start (user taps "Run preview").
// When tab is hidden, all previews are stopped.

class PreviewManager {
  constructor() {
    this.registry = new Map();
    this.activeEl = null;
    this.manualEl = null;
    this.observer = null;

    if (typeof window !== 'undefined') {
      this.initObserver();
      this.initVisibilityListener();
    }
  }

  initObserver() {
    if (typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const item = this.registry.get(entry.target);
          if (item) {
            item.ratio = entry.intersectionRatio;
            item.isIntersecting = entry.isIntersecting;
          }
        }
        this.evaluate();
      },
      {
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1.0],
      }
    );
  }

  initVisibilityListener() {
    if (typeof document === 'undefined') return;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopAll();
      } else {
        this.evaluate();
      }
    });
  }

  register(el, options = {}) {
    if (!el) return () => {};

    const item = {
      el,
      start: options.start || (() => {}),
      stop: options.stop || (() => {}),
      auto: options.auto !== false,
      ratio: 0,
      isIntersecting: false,
      running: false,
      userPaused: false,
    };

    this.registry.set(el, item);

    if (this.observer) {
      this.observer.observe(el);
    }

    return () => {
      this.unregister(el);
    };
  }

  unregister(el) {
    if (!this.registry.has(el)) return;
    const item = this.registry.get(el);

    if (this.observer) {
      this.observer.unobserve(el);
    }

    if (item.running) {
      item.running = false;
      try {
        item.stop();
      } catch (err) {
        console.error('Error stopping preview:', err);
      }
    }

    if (this.activeEl === el) {
      this.activeEl = null;
    }
    if (this.manualEl === el) {
      this.manualEl = null;
    }

    this.registry.delete(el);

    if (typeof document !== 'undefined' && !document.hidden && this.registry.size > 0) {
      this.evaluate();
    }
  }

  start(el) {
    const item = this.registry.get(el);
    if (!item) return;

    item.userPaused = false;
    this.manualEl = el;

    if (this.activeEl && this.activeEl !== el) {
      const prev = this.registry.get(this.activeEl);
      if (prev && prev.running) {
        prev.running = false;
        try {
          prev.stop();
        } catch (err) {
          console.error('Error stopping preview:', err);
        }
      }
    }

    this.activeEl = el;
    if (!item.running) {
      item.running = true;
      try {
        item.start();
      } catch (err) {
        console.error('Error starting preview:', err);
      }
    }
  }

  stop(el) {
    const item = this.registry.get(el);
    if (!item) return;

    item.userPaused = true;
    if (this.manualEl === el) {
      this.manualEl = null;
    }

    if (item.running) {
      item.running = false;
      try {
        item.stop();
      } catch (err) {
        console.error('Error stopping preview:', err);
      }
    }

    if (this.activeEl === el) {
      this.activeEl = null;
    }
  }

  stopAll() {
    this.registry.forEach((item) => {
      if (item.running) {
        item.running = false;
        try {
          item.stop();
        } catch (err) {
          console.error('Error stopping preview:', err);
        }
      }
    });
    this.activeEl = null;
  }

  isRunning(el) {
    const item = this.registry.get(el);
    return Boolean(item && item.running);
  }

  evaluate() {
    if (typeof document !== 'undefined' && document.hidden) return;

    // Reset userPaused when element is out of view
    this.registry.forEach((item) => {
      if (!item.isIntersecting || item.ratio < 0.35) {
        item.userPaused = false;
      }
    });

    // If user explicitly started a preview and it's still partially in view, keep / resume it
    if (this.manualEl) {
      const manualItem = this.registry.get(this.manualEl);
      if (manualItem && manualItem.isIntersecting && manualItem.ratio >= 0.2) {
        if (!manualItem.running) {
          this.activeEl = this.manualEl;
          manualItem.running = true;
          try {
            manualItem.start();
          } catch (err) {
            console.error('Error starting preview:', err);
          }
        }
        return;
      }
      this.manualEl = null;
    }

    // Find the registered item with highest ratio >= 0.6 that has auto enabled and not userPaused
    let bestCandidate = null;
    let maxRatio = 0.5999;

    this.registry.forEach((item) => {
      if (item.auto && !item.userPaused && item.isIntersecting && item.ratio >= 0.6 && item.ratio > maxRatio) {
        maxRatio = item.ratio;
        bestCandidate = item;
      }
    });

    if (bestCandidate) {
      if (this.activeEl !== bestCandidate.el) {
        if (this.activeEl) {
          const prev = this.registry.get(this.activeEl);
          if (prev && prev.running) {
            prev.running = false;
            try {
              prev.stop();
            } catch (err) {
              console.error('Error stopping preview:', err);
            }
          }
        }
        this.activeEl = bestCandidate.el;
        bestCandidate.running = true;
        try {
          bestCandidate.start();
        } catch (err) {
          console.error('Error starting preview:', err);
        }
      }
    } else {
      // If no preview is >= 60% in view, stop current auto preview when it falls below 0.35
      if (this.activeEl && !this.manualEl) {
        const current = this.registry.get(this.activeEl);
        if (current && (!current.isIntersecting || current.ratio < 0.35)) {
          current.running = false;
          try {
            current.stop();
          } catch (err) {
            console.error('Error stopping preview:', err);
          }
          this.activeEl = null;
        }
      }
    }
  }
}

export const previews = new PreviewManager();
export default previews;
