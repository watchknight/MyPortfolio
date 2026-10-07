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
    const tiles = gsap.utils.toArray("[data-tile]");
    const seen = sessionStorage.getItem("hero-seen") === "1";

    gsap.set(tiles, { autoAlpha: 0 });
    if (!seen) gsap.set(heroIn, { autoAlpha: 0, y: 14 });
    html.classList.remove("js-motion");

    if (title && !seen) {
      SplitText.create(title, {
        type: "lines",
        mask: "lines",
        autoSplit: true,
        onSplit(self) {
          gsap.set(title, { autoAlpha: 1 });
          return gsap.timeline({ defaults: { ease: "expo.out" } })
            .from(self.lines, { yPercent: 110, duration: 1, stagger: 0.09 })
            .to(heroIn, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.08 }, "-=0.65")
            .add(() => sessionStorage.setItem("hero-seen", "1"));
        },
      });
    } else if (title) {
      gsap.set(title, { autoAlpha: 1 });
    }

    ScrollTrigger.batch(tiles, {
      start: "top 88%",
      once: true,
      onEnter: (els) =>
        gsap.fromTo(els, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out", stagger: 0.07, overwrite: true, clearProps: "transform" }),
    });

    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  });

  mm.add("(prefers-reduced-motion: reduce)", () => {
    html.classList.remove("js-motion");
  });

  return () => mm.revert();
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
