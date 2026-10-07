import gsap from "gsap";

const FINE = "(hover: hover) and (pointer: fine)";
const REDUCE = "(prefers-reduced-motion: reduce)";

export function initCursor() {
  if (typeof window === "undefined" || !window.matchMedia) return () => {};

  const fine = matchMedia(FINE);
  const reduce = matchMedia(REDUCE);
  let stop = null;

  const sync = () => {
    const on = fine.matches && !reduce.matches;
    if (on && !stop) stop = mount();
    if (!on && stop) {
      stop();
      stop = null;
    }
  };

  fine.addEventListener("change", sync);
  reduce.addEventListener("change", sync);
  sync();

  return () => {
    fine.removeEventListener("change", sync);
    reduce.removeEventListener("change", sync);
    stop?.();
    stop = null;
  };
}

function mount() {
  const html = document.documentElement;

  // Clean up any existing cursor nodes from previous mounts (e.g. StrictMode)
  document.querySelectorAll(".cursor-ring, .cursor-dot").forEach((node) => node.remove());

  const ring = document.createElement("div");
  const dot = document.createElement("div");
  const label = document.createElement("span");
  ring.className = "cursor-ring";
  ring.setAttribute("aria-hidden", "true");
  dot.className = "cursor-dot";
  dot.setAttribute("aria-hidden", "true");
  label.className = "cursor-label";
  label.setAttribute("aria-hidden", "true");
  ring.append(label);
  document.body.append(ring, dot);
  html.classList.add("has-cursor");

  const SIZE = 36;
  gsap.set([ring, dot], { xPercent: -50, yPercent: -50 });
  gsap.set(ring, { borderRadius: `${SIZE / 2}px` });
  const dx = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power3" });
  const dy = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power3" });
  const rx = gsap.quickTo(ring, "x", { duration: 0.5, ease: "power3" });
  const ry = gsap.quickTo(ring, "y", { duration: 0.5, ease: "power3" });
  const clamp = gsap.utils.clamp(-14, 14);

  let current = null;
  let snap = null;
  let magnet = null;
  let shown = false;
  let lastX = 0;
  let lastY = 0;

  function show(x, y) {
    shown = true;
    gsap.set([ring, dot], { x, y });
    ring.classList.add("is-on");
    dot.classList.add("is-on");
  }

  function onMove(e) {
    if (e.pointerType === "touch" || e.pointerType === "pen") return;
    lastX = e.clientX;
    lastY = e.clientY;
    if (!shown) show(e.clientX, e.clientY);
    dx(e.clientX);
    dy(e.clientY);

    // Clean up if currently tracked element was detached from DOM
    if (snap && !snap.el.isConnected) {
      leave();
    } else if (current && !current.isConnected) {
      leave();
    }

    if (snap) {
      const { left, top, width, height } = snap.rect;
      const cx = left + width / 2;
      const cy = top + height / 2;
      rx(cx + (e.clientX - cx) * 0.05);
      ry(cy + (e.clientY - cy) * 0.05);
    } else {
      rx(e.clientX);
      ry(e.clientY);
    }
  }

  function makeMagnet(el) {
    const s = parseFloat(el.dataset.magnetic) || 0.3;
    const curX = Number(gsap.getProperty(el, "x")) || 0;
    const curY = Number(gsap.getProperty(el, "y")) || 0;
    const rect = el.getBoundingClientRect();
    const origLeft = rect.left - curX;
    const origTop = rect.top - curY;
    const xTo = gsap.quickTo(el, "x", { duration: 0.7, ease: "elastic.out(1, 0.4)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.7, ease: "elastic.out(1, 0.4)" });
    const move = (e) => {
      if (e.pointerType === "touch" || e.pointerType === "pen") return;
      xTo(clamp((e.clientX - origLeft - rect.width / 2) * s));
      yTo(clamp((e.clientY - origTop - rect.height / 2) * s));
    };
    el.addEventListener("pointermove", move, { passive: true });
    return {
      release() {
        el.removeEventListener("pointermove", move);
        xTo(0);
        yTo(0);
      },
    };
  }

  function enter(el) {
    current = el;
    let mode = el.dataset.cursor;
    if (!mode && el.matches("input, textarea, select, [contenteditable], canvas, iframe")) {
      mode = "hide";
    }
    if (el.hasAttribute("data-magnetic")) magnet = makeMagnet(el);
    if (mode === "inspect") {
      const rect = el.getBoundingClientRect();
      const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 12;
      snap = { el, rect };
      label.textContent = el.dataset.cursorLabel || "";
      ring.classList.add("is-inspect");
      gsap.to(ring, {
        width: rect.width + 12,
        height: rect.height + 12,
        borderRadius: `${radius + 6}px`,
        duration: 0.5,
        ease: "expo.out",
        overwrite: "auto",
      });
      gsap.to(dot, { scale: 0, duration: 0.2, overwrite: "auto" });
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      rx(cx + (lastX - cx) * 0.05);
      ry(cy + (lastY - cy) * 0.05);
    } else if (mode === "hide") {
      ring.classList.add("is-hidden");
      dot.classList.add("is-hidden");
    } else {
      ring.classList.add("is-hover");
      gsap.to(ring, { scale: 1.6, duration: 0.35, ease: "expo.out", overwrite: "auto" });
    }
  }

  function leave() {
    if (!current) return;
    current = null;
    snap = null;
    magnet?.release();
    magnet = null;
    ring.classList.remove("is-inspect", "is-hover", "is-hidden");
    dot.classList.remove("is-hidden");
    label.textContent = "";
    gsap.to(ring, {
      width: SIZE,
      height: SIZE,
      borderRadius: `${SIZE / 2}px`,
      scale: 1,
      duration: 0.45,
      ease: "expo.out",
      overwrite: "auto",
    });
    gsap.to(dot, { scale: 1, duration: 0.2, overwrite: "auto" });
  }

  function findInteractiveTarget(node) {
    if (!(node instanceof Element)) return null;
    return node.closest(
      "[data-cursor],[data-magnetic],a,button,input,textarea,select,[contenteditable],canvas,iframe"
    );
  }

  function onOver(e) {
    if (e.pointerType === "touch" || e.pointerType === "pen") return;
    const el = findInteractiveTarget(e.target);
    if (el === current) return;
    leave();
    if (el) enter(el);
  }

  function away() {
    leave();
    shown = false;
    ring.classList.remove("is-on");
    dot.classList.remove("is-on");
  }

  const down = (e) => {
    if (e.pointerType === "touch" || e.pointerType === "pen") return;
    gsap.to(ring, { scale: snap ? 0.98 : 0.8, duration: 0.15, overwrite: "auto" });
  };

  const up = (e) => {
    if (e && (e.pointerType === "touch" || e.pointerType === "pen")) return;
    gsap.to(ring, {
      scale: current && !snap && current.dataset.cursor !== "hide" ? 1.6 : 1,
      duration: 0.3,
      ease: "expo.out",
      overwrite: "auto",
    });
  };

  const onScroll = () => {
    if (snap) {
      if (!snap.el.isConnected) {
        leave();
        return;
      }
      snap.rect = snap.el.getBoundingClientRect();
      const { left, top, right, bottom, width, height } = snap.rect;

      // Pointer left element during scroll
      if (lastX < left || lastX > right || lastY < top || lastY > bottom) {
        leave();
        const elUnder = document.elementFromPoint(lastX, lastY);
        const match = findInteractiveTarget(elUnder);
        if (match) enter(match);
        return;
      }

      const cx = left + width / 2;
      const cy = top + height / 2;
      const targetX = cx + (lastX - cx) * 0.05;
      const targetY = cy + (lastY - cy) * 0.05;
      gsap.set(ring, { x: targetX, y: targetY });
      rx(targetX);
      ry(targetY);
    } else if (current) {
      if (!current.isConnected) {
        leave();
        return;
      }
      const rect = current.getBoundingClientRect();
      if (lastX < rect.left || lastX > rect.right || lastY < rect.top || lastY > rect.bottom) {
        leave();
        const elUnder = document.elementFromPoint(lastX, lastY);
        const match = findInteractiveTarget(elUnder);
        if (match) enter(match);
      }
    }
  };

  const onResize = () => {
    if (snap && snap.el.isConnected) {
      snap.rect = snap.el.getBoundingClientRect();
    }
  };

  addEventListener("pointermove", onMove, { passive: true });
  addEventListener("pointerdown", down);
  addEventListener("pointerup", up);
  addEventListener("pointercancel", up);
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onResize, { passive: true });
  document.addEventListener("pointerover", onOver, { passive: true });
  html.addEventListener("pointerleave", away);
  window.addEventListener("blur", away);

  return () => {
    removeEventListener("pointermove", onMove);
    removeEventListener("pointerdown", down);
    removeEventListener("pointerup", up);
    removeEventListener("pointercancel", up);
    removeEventListener("scroll", onScroll);
    removeEventListener("resize", onResize);
    document.removeEventListener("pointerover", onOver);
    html.removeEventListener("pointerleave", away);
    window.removeEventListener("blur", away);
    leave();
    ring.remove();
    dot.remove();
    html.classList.remove("has-cursor");
  };
}
