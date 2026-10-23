import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { Flip } from "gsap/Flip";

gsap.registerPlugin(ScrollTrigger, SplitText, Flip);
ScrollTrigger.config({ ignoreMobileResize: true });

export function initMotion() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }
  const html = document.documentElement;
  clearTimeout(window.__motionFailsafe);
  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const title = document.querySelector("[data-hero-title]");
    const heroIn = gsap.utils.toArray("[data-hero-in]");
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
    const seen = sessionStorage.getItem("hero-seen") === "1";

    if (!seen && heroIn.length > 0) gsap.set(heroIn, { autoAlpha: 0, y: 14 });
    html.classList.remove("js-motion");

    const startHero = () => {
      if (title && !seen) {
        if (!isMobile) {
          SplitText.create(title, {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            onSplit(self) {
              gsap.set(title, { autoAlpha: 1 });
              return gsap.timeline({ defaults: { ease: "expo.out" } })
                .from(self.lines, { yPercent: 110, duration: 1, stagger: 0.09 })
                .to(heroIn, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 }, "-=0.65")
                .add(() => {
                  sessionStorage.setItem("hero-seen", "1");
                  window.dispatchEvent(new CustomEvent("hero-intro-complete"));
                });
            },
          });
        } else {
          gsap.set(title, { autoAlpha: 1 });
          gsap.timeline({ defaults: { ease: "expo.out" } })
            .from(title, { y: 10, duration: 0.6 })
            .to(heroIn, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.06 }, "-=0.4")
            .add(() => {
              sessionStorage.setItem("hero-seen", "1");
              window.dispatchEvent(new CustomEvent("hero-intro-complete"));
            });
        }
      } else {
        if (title) gsap.set(title, { autoAlpha: 1 });
        window.dispatchEvent(new CustomEvent("hero-intro-complete"));
      }
    };

    let bootPending = false;
    try {
      bootPending = sessionStorage.getItem("kernel_boot_done") !== "1";
    } catch {
      bootPending = false;
    }

    if (bootPending && !seen) {
      let started = false;
      const onKernelReady = () => {
        if (started) return;
        started = true;
        window.removeEventListener("kernel-ready", onKernelReady);
        clearTimeout(bootTimer);
        startHero();
      };
      const bootTimer = setTimeout(onKernelReady, 1800);
      window.addEventListener("kernel-ready", onKernelReady);
    } else {
      startHero();
    }

    initTileReveals(document);

    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  });

  mm.add("(prefers-reduced-motion: reduce)", () => {
    html.classList.remove("js-motion");
    window.dispatchEvent(new CustomEvent("hero-intro-complete"));
  });

  return () => mm.revert();
}

export function initTileReveals(container = document) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const tiles = gsap.utils.toArray("section:not([aria-label='Introduction']) [data-tile]:not(.tile-revealed)", container);
  if (tiles.length === 0) return;

  gsap.set(tiles, { autoAlpha: 0 });
  ScrollTrigger.batch(tiles, {
    start: "top 88%",
    once: true,
    onEnter: (els) => {
      els.forEach((el) => {
        if (el instanceof Element) el.classList.add("tile-revealed");
      });
      gsap.fromTo(
        els,
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.07, overwrite: true, clearProps: "transform" }
      );
    },
  });
}

export function toggleTheme(next, x, y, apply) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return apply(next);
  }
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduce) return apply(next);
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const t = document.startViewTransition(() => apply(next));
  t.ready.then(() =>
    document.documentElement.animate(
      { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 650, easing: "cubic-bezier(.2,.8,.2,1)", pseudoElement: "::view-transition-new(root)" }
    )
  );
}

export { gsap, ScrollTrigger, SplitText, Flip };
export { initAtmosphere, setLive, dhakaHour, phaseFor } from "./atmosphere.js";
export { initTimeline } from "./timeline.js";
