import { sound } from "./sound.js";
import { onSection } from "../lib/sections.js";

const FINE = "(hover: hover) and (pointer: fine)";
const xOf = (el) => {
  const r = el.getBoundingClientRect();
  const w = typeof window !== "undefined" && window.innerWidth ? window.innerWidth : 1;
  return (r.left + r.width / 2) / w;
};

let hooksInitialized = false;

export function initSoundHooks() {
  if (hooksInitialized) return () => {};
  hooksInitialized = true;

  const fine = matchMedia(FINE);
  let lastEl = null;

  const onOver = (e) => {
    if (e.pointerType === "touch") return;
    const isFine = fine.matches || e.pointerType === "mouse";
    if (!isFine || !(e.target instanceof Element)) return;
    const el = e.target.closest("[data-cursor='inspect'],[data-magnetic]");
    if (!el || el === lastEl) { if (!el) lastEl = null; return; }
    lastEl = el;
    const degree = el.dataset.degree != null ? Number(el.dataset.degree) : undefined;
    sound.play("tick", { x: xOf(el), degree, vel: el.matches("[data-cursor='inspect']") ? 1 : 0.6 });
  };

  const onDown = (e) => {
    if (!(e.target instanceof Element)) return;
    const el = e.target.closest("button,[data-magnetic],a[href]");
    if (el) sound.play("thump", { x: xOf(el), vel: 0.8 });
  };

  let lastMove = 0;
  const onMove = (e) => {
    if (e.pointerType === "touch") return;
    const isFine = fine.matches || e.pointerType === "mouse";
    if (!isFine) return;
    const t = performance.now();
    if (t - lastMove < 60) return;
    lastMove = t;
    const w = typeof window !== "undefined" && window.innerWidth ? window.innerWidth : 1;
    sound.pointer(e.clientX / w);
  };

  const onLeaveDoc = () => {
    lastEl = null;
  };

  document.addEventListener("pointerover", onOver, { passive: true });
  document.addEventListener("pointerdown", onDown, { passive: true });
  document.addEventListener("pointerleave", onLeaveDoc, { passive: true });
  addEventListener("pointermove", onMove, { passive: true });
  return () => {
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerdown", onDown);
    document.removeEventListener("pointerleave", onLeaveDoc);
    removeEventListener("pointermove", onMove);
    hooksInitialized = false;
  };
}

export function initSections() {
  return onSection((name) => sound.section(name));
}
