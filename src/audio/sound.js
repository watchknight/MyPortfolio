import { createEngine } from "./engine.js";

const VOICES = ["pluck", "tick", "thump", "swish", "key", "chime", "toggle"];
const store = {
  get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

let engine = null;
let section = "hero";
const state = { on: false, armed: false, volume: 0.6, ambient: true };
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn({ ...state }));

function ensure() {
  if (engine) return engine;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ctx = new AC({ latencyHint: "interactive" });
  const unlock = ctx.createBufferSource();
  unlock.buffer = ctx.createBuffer(1, 1, 22050);
  unlock.connect(ctx.destination);
  unlock.start(0);
  engine = createEngine(ctx);
  engine.setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  engine.setSection(section);
  return engine;
}

async function enable({ quiet = false } = {}) {
  const e = ensure();
  if (!e) return false;
  try { await e.ctx.resume(); } catch { return false; }
  state.on = true;
  state.armed = false;
  store.set("sound", "on");
  e.setMaster(state.volume, e.ctx.currentTime, 0.12);
  if (state.ambient) e.setAmbient(true);
  if (!quiet) e.intro();
  emit();
  return true;
}

function disable() {
  state.on = false;
  state.armed = false;
  store.set("sound", "off");
  if (engine) {
    const e = engine;
    const t = e.ctx.currentTime;
    e.toggle({ on: false });
    e.setMaster(0, t + 0.3, 0.12);
    setTimeout(() => { if (!state.on) e.ctx.suspend(); }, 1000);
  }
  emit();
}

const toggle = () => (state.on || state.armed ? (disable(), false) : enable());

function arm() {
  if (!state.armed) return;
  const cleanup = () => {
    removeEventListener("pointerdown", go, true);
    removeEventListener("keydown", go, true);
  };
  const go = (ev) => {
    if (!state.armed) return cleanup();
    if (ev.target instanceof Element && ev.target.closest("[data-sound-toggle]")) return;
    if (ev.type === "keydown" && ev.key.toLowerCase() === "m") return;
    cleanup();
    enable({ quiet: true });
  };
  addEventListener("pointerdown", go, true);
  addEventListener("keydown", go, true);
}

function watchVisibility() {
  document.addEventListener("visibilitychange", () => {
    if (!engine || !state.on) return;
    const e = engine;
    if (document.hidden) {
      e.setMaster(0, e.ctx.currentTime, 0.05);
      setTimeout(() => { if (document.hidden) e.ctx.suspend(); }, 250);
    } else {
      e.ctx.resume().then(() => e.setMaster(state.volume, e.ctx.currentTime, 0.2));
    }
  });
}

export function initSound() {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  state.armed = store.get("sound", "off") === "on";
  state.volume = Math.min(1, Math.max(0, Number(store.get("sound-volume", "0.6")) || 0.6));
  state.ambient = store.get("sound-ambient", fine && !calm ? "on" : "off") === "on";
  arm();
  watchVisibility();
  emit();
}

export const sound = {
  get state() { return { ...state }; },
  subscribe(fn) { listeners.add(fn); fn({ ...state }); return () => listeners.delete(fn); },
  toggle, enable, disable,
  setVolume(v) {
    state.volume = Math.min(1, Math.max(0, v));
    store.set("sound-volume", String(state.volume));
    if (state.on) engine.setMaster(state.volume);
    emit();
  },
  setAmbient(on) {
    state.ambient = on;
    store.set("sound-ambient", on ? "on" : "off");
    if (state.on) engine.setAmbient(on);
    emit();
  },
  play(name, opts = {}) { if (state.on && engine && VOICES.includes(name)) engine[name](opts); },
  section(name) { section = name; engine?.setSection(name); },
  theme(name) { engine?.setTheme(name); },
  pointer(x) { if (state.on) engine.setPointer({ x }); },
  ink: {
    start(y) { if (state.on) engine.inkStart({ y }); },
    move(y, speed) { if (state.on) engine.inkMove({ y, speed }); },
    end() { engine?.inkEnd(); },
  },
  levels: (n = 4) => (state.on && engine ? engine.levels(n) : null),
};
