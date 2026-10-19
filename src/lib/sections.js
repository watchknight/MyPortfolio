const subscribers = new Set();
let currentSection = null;
let io = null;

function notify(name) {
  if (!name || name === currentSection) return;
  currentSection = name;
  subscribers.forEach((fn) => {
    try {
      fn(name);
    } catch (err) {
      console.error(err);
    }
  });
}

function checkActiveSection(elements) {
  if (!elements || elements.length === 0) return;
  const midY = (typeof window !== "undefined" && window.innerHeight ? window.innerHeight : 800) / 2;
  // Look for the element spanning the vertical midpoint (checking innermost first)
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    const rect = el.getBoundingClientRect();
    if (rect.top <= midY && rect.bottom >= midY) {
      const name = el.dataset.section;
      if (name) {
        notify(name);
        return;
      }
    }
  }
  // Fallback: first element with bottom > 0
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    const rect = el.getBoundingClientRect();
    if (rect.bottom > 0) {
      const name = el.dataset.section;
      if (name) {
        notify(name);
        return;
      }
    }
  }
}

export function onSection(callback) {
  const key = callback.toString();
  for (const sub of subscribers) {
    if (sub.toString() === key) {
      subscribers.delete(sub);
    }
  }
  subscribers.add(callback);
  if (currentSection) {
    try {
      callback(currentSection);
    } catch (err) {
      console.error(err);
    }
  }
  return () => {
    subscribers.delete(callback);
  };
}

export function refreshSections() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (typeof IntersectionObserver === "undefined") return;

  if (io) {
    io.disconnect();
  } else {
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && en.target instanceof HTMLElement) {
            const name = en.target.dataset.section;
            if (name) notify(name);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
  }

  const elements = Array.from(document.querySelectorAll("[data-section]"));
  elements.forEach((el) => io.observe(el));
  checkActiveSection(elements);
}
