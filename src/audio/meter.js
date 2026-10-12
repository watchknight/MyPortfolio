import gsap from "gsap";
import { sound } from "./sound.js";

export function initMeter(bars) {
  if (typeof window === "undefined" || typeof document === "undefined") return () => {};
  let last = 0;
  let running = false;

  const frame = (time) => {
    if (time - last < 1 / 30) return;
    last = time;
    const lv = sound.levels(bars.length);
    if (!lv) return;
    bars.forEach((b, i) => {
      if (b) b.style.transform = `scaleY(${0.12 + 0.88 * Math.min(1, lv[i])})`;
    });
  };
  const rest = () => bars.forEach((b) => { if (b) b.style.transform = ""; });

  const sync = (s) => {
    const calm = typeof matchMedia !== "undefined" ? matchMedia("(prefers-reduced-motion: reduce)").matches : false;
    const want = s.on && !calm && !document.hidden;
    if (want && !running) { gsap.ticker.add(frame); running = true; }
    if (!want && running) { gsap.ticker.remove(frame); running = false; rest(); }
    if (s.on && calm) {
      bars.forEach((b) => { if (b) b.style.transform = "scaleY(.5)"; });
    } else if (!s.on) {
      rest();
    }
  };
  const onVis = () => sync(sound.state);
  const unsub = sound.subscribe(sync);
  document.addEventListener("visibilitychange", onVis);

  return () => {
    unsub();
    document.removeEventListener("visibilitychange", onVis);
    if (running) gsap.ticker.remove(frame);
    rest();
  };
}
