import gsap from "gsap";
import { onSection } from "../lib/sections.js";

const SECTION = {
  hero: [1, 0.8, 0.6],
  work: [0.7, 1, 0.7],
  about: [0.6, 0.8, 1],
  guestbook: [0.8, 0.7, 0.8],
  contact: [1, 0.9, 0.5],
};

export function dhakaHour(date = new Date()) {
  return Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Dhaka" }).format(date));
}

export function phaseFor(hour) {
  if (hour >= 21 || hour < 4) return "night";
  if (hour < 8) return "dawn";
  if (hour < 17) return "day";
  return "dusk";
}

export function setLive(on) {
  document.documentElement.classList.toggle("atmo-off", !on);
  try { localStorage.setItem("atmo", on ? "on" : "off"); } catch { /* private mode */ }
}

export function initAtmosphere() {
  const root = document.documentElement;
  const atmo = document.querySelector(".atmo");
  if (!atmo) return () => {};
  const layers = gsap.utils.toArray(".atmo__layer", atmo);
  const pointer = atmo.querySelector(".atmo__pointer");
  const calm = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  const forced = new URLSearchParams(location.search).get("phase");
  const off = [];

  const setPhase = () => { root.dataset.phase = forced || phaseFor(dhakaHour()); };
  setPhase();
  const timer = setInterval(setPhase, 10 * 60 * 1000);
  off.push(() => clearInterval(timer));

  const balance = (name, instant = false) => {
    const to = SECTION[name];
    if (!to) return;
    const isMotionOff = instant || calm.matches || root.classList.contains("atmo-off");
    gsap.to(layers, { opacity: (i) => to[i], duration: isMotionOff ? 0 : 2.2, ease: "power2.inOut", overwrite: true });
  };
  balance("hero", true);
  off.push(onSection((name) => balance(name)));

  if (pointer && fine.matches && !calm.matches) {
    const px = gsap.quickTo(pointer, "x", { duration: 0.9, ease: "power3" });
    const py = gsap.quickTo(pointer, "y", { duration: 0.9, ease: "power3" });
    const move = (e) => {
      if (root.classList.contains("atmo-off") || root.classList.contains("atmo-paused")) return;
      pointer.classList.add("is-on");
      px(e.clientX);
      py(e.clientY);
    };
    addEventListener("pointermove", move, { passive: true });
    off.push(() => removeEventListener("pointermove", move));
  }

  const onVis = () => root.classList.toggle("atmo-paused", document.hidden);
  document.addEventListener("visibilitychange", onVis);
  off.push(() => document.removeEventListener("visibilitychange", onVis));

  return () => off.forEach((fn) => fn());
}
