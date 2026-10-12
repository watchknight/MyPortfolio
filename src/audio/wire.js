import { sound } from "./sound.js";

export function wireGuestbook(canvas) {
  if (!canvas) return () => {};
  let lx = 0, ly = 0, lt = 0;
  const y01 = (e) => {
    const r = canvas.getBoundingClientRect();
    return r.height > 0 ? Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) : 0.5;
  };
  const onDown = (e) => {
    lx = e.clientX; ly = e.clientY; lt = performance.now();
    sound.ink.start(y01(e));
  };
  const onMove = (e) => {
    const isDown = (e.buttons & 1) || e.pointerType === "touch";
    if (!isDown) return;
    const t = performance.now();
    const speed = Math.min(1, Math.hypot(e.clientX - lx, e.clientY - ly) / Math.max(1, t - lt) / 1.5);
    lx = e.clientX; ly = e.clientY; lt = t;
    sound.ink.move(y01(e), speed);
  };
  const onEnd = () => sound.ink.end();

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  ["pointerup", "pointerleave", "pointercancel"].forEach((n) => canvas.addEventListener(n, onEnd));
  return () => {
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointermove", onMove);
    ["pointerup", "pointerleave", "pointercancel"].forEach((n) => canvas.removeEventListener(n, onEnd));
  };
}

export function wireTerminal(input) {
  if (!input) return () => {};
  const onKey = (e) => {
    if (e.key === "Enter") sound.play("pluck", { note: 74, vel: 0.7, x: 0.6 });
    else if (e.key.length === 1 || e.key === "Backspace") sound.play("key", { x: 0.6 });
  };
  input.addEventListener("keydown", onKey);
  return () => input.removeEventListener("keydown", onKey);
}

export function wireTheme(next) {
  sound.theme(next);
  sound.play("swish", { dir: next === "light" ? 1 : -1 });
  sound.play("pluck", { note: next === "light" ? 69 : 62, vel: 0.8 });
}
