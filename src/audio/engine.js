export const CONFIG = {
  master: 0.55,
  ambient: 0.06,
  reverbSend: 0.3,
  padReverb: 0.5,
  padCutoff: { dark: 620, light: 980 },
  padBreathHz: 0.06,
  maxVoices: 12,
};

// D minor pentatonic = F major pentatonic (D F G A C): same notes, two tonal centres.
export const SCALE = [50, 53, 55, 57, 60, 62, 65, 67, 69, 72, 74, 77, 79, 81];
export const CHORDS = {
  dark: { hero: [38, 45, 50, 53], work: [41, 48, 53, 57], about: [43, 50, 55, 57], guestbook: [45, 50, 53, 57], contact: [38, 45, 50, 57] },
  light: { hero: [41, 48, 53, 57], work: [50, 57, 62, 65], about: [43, 50, 55, 62], guestbook: [45, 53, 57, 60], contact: [41, 48, 57, 60] },
};

const hz = (m) => 440 * 2 ** ((m - 69) / 12);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function makeImpulse(ctx, seconds = 2.2, decay = 3) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const pre = Math.floor(ctx.sampleRate * 0.012);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = pre; i < len; i++) {
      const t = i / len;
      lp += (Math.random() * 2 - 1 - lp) * (0.5 - 0.42 * t);
      d[i] = lp * (1 - t) ** decay;
    }
  }
  return buf;
}

export function createEngine(ctx, cfg = CONFIG) {
  let theme = "dark";
  let section = "hero";
  let voices = 0;
  let walk = 7;
  let lastPointer = -1;
  const last = {};
  const now = () => ctx.currentTime;

  const master = ctx.createGain();
  master.gain.value = 0;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -14;
  limiter.knee.value = 18;
  limiter.ratio.value = 8;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.25;
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 64;
  analyser.smoothingTimeConstant = 0.7;
  analyser.minDecibels = -80;
  analyser.maxDecibels = -20;
  master.connect(limiter);
  limiter.connect(analyser);
  analyser.connect(ctx.destination);

  const verb = ctx.createConvolver();
  verb.buffer = makeImpulse(ctx);
  verb.connect(master);
  const bus = ctx.createGain();
  bus.connect(master);
  const send = ctx.createGain();
  send.gain.value = cfg.reverbSend;
  bus.connect(send);
  send.connect(verb);

  const noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const nd = noiseBuf.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  const allow = (name, gap, when) => {
    if (voices >= cfg.maxVoices || when - (last[name] ?? -1) < gap) return false;
    last[name] = when;
    return true;
  };
  const panner = (x = 0.5) => {
    const p = ctx.createStereoPanner();
    p.pan.value = clamp((x - 0.5) * 1.4, -0.7, 0.7);
    return p;
  };
  const env = (param, when, peak, attack, decay) => {
    param.cancelScheduledValues(when);
    param.setValueAtTime(0.0001, when);
    param.linearRampToValueAtTime(peak, when + attack);
    param.exponentialRampToValueAtTime(0.0001, when + attack + decay);
  };
  const own = (src, nodes) => {
    voices++;
    src.onended = () => {
      voices = Math.max(0, voices - 1);
      try { src.disconnect(); } catch {}
      nodes.forEach((n) => {
        try { n.disconnect(); } catch {}
      });
    };
  };

  function noise(when, dur, o = {}) {
    const { freq = 2000, to = null, q = 1, type = "bandpass", gain = 0.1, attack = 0.002, x = 0.5 } = o;
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    s.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.Q.value = q;
    f.frequency.setValueAtTime(freq, when);
    if (to) f.frequency.exponentialRampToValueAtTime(to, when + attack + dur);
    const g = ctx.createGain();
    const p = panner(x);
    env(g.gain, when, gain, attack, dur);
    s.connect(f);
    f.connect(g);
    g.connect(p);
    p.connect(bus);
    s.start(when, Math.random() * 0.5);
    s.stop(when + attack + dur + 0.05);
    own(s, [f, g, p]);
  }

  function pluck({ note = 62, when = now(), x = 0.5, vel = 1, dur = 1.1 } = {}) {
    if (!allow("pluck", 0.04, when)) return;
    const f = hz(note);
    const bright = theme === "light" ? 1.45 : 1;
    const a = ctx.createOscillator();
    const b = ctx.createOscillator();
    const g = ctx.createGain();
    const bg = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    const p = panner(x);
    a.type = "sine";
    a.frequency.value = f;
    b.type = "triangle";
    b.frequency.value = f * 2.003;
    bg.gain.value = 0.22;
    lp.type = "lowpass";
    lp.frequency.value = 2600 * bright;
    lp.Q.value = 0.4;
    a.connect(g);
    b.connect(bg);
    bg.connect(g);
    g.connect(lp);
    lp.connect(p);
    p.connect(bus);
    env(g.gain, when, 0.32 * vel, 0.004, dur);
    a.start(when);
    b.start(when);
    a.stop(when + dur + 0.08);
    b.stop(when + dur + 0.08);
    own(a, [b, g, bg, lp, p]);
    noise(when, 0.025, { freq: 1100 * bright, q: 1.2, gain: 0.05 * vel, attack: 0.001, x });
  }

  function tick({ degree, when = now(), x = 0.5, vel = 1 } = {}) {
    if (!allow("tick", 0.07, when)) return;
    if (degree == null) {
      walk = clamp(walk + [-2, -1, 1, 2][Math.floor(Math.random() * 4)], 5, 11);
      degree = walk;
    }
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const p = panner(x);
    o.type = "sine";
    o.frequency.value = hz(SCALE[clamp(degree, 0, SCALE.length - 1)] + 12);
    env(g.gain, when, 0.075 * vel, 0.002, 0.1);
    o.connect(g);
    g.connect(p);
    p.connect(bus);
    o.start(when);
    o.stop(when + 0.16);
    own(o, [g, p]);
  }

  function thump({ when = now(), x = 0.5, vel = 1 } = {}) {
    if (!allow("thump", 0.08, when)) return;
    const top = hz(theme === "light" ? 53 : 50);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const p = panner(x);
    o.type = "sine";
    o.frequency.setValueAtTime(top, when);
    o.frequency.exponentialRampToValueAtTime(top / 2, when + 0.15);
    env(g.gain, when, 0.45 * vel, 0.004, 0.22);
    o.connect(g);
    g.connect(p);
    p.connect(bus);
    o.start(when);
    o.stop(when + 0.3);
    own(o, [g, p]);
  }

  function swish({ dir = 1, when = now(), x = 0.5, vel = 1 } = {}) {
    if (!allow("swish", 0.3, when)) return;
    const [from, to] = dir > 0 ? [450, 2800] : [2800, 450];
    noise(when, 0.5, { freq: from, to, q: 0.9, gain: 0.08 * vel, attack: 0.12, x });
  }

  function key({ when = now(), x = 0.5, vel = 1 } = {}) {
    if (!allow("key", 0.035, when)) return;
    const r = 0.9 + Math.random() * 0.25;
    noise(when, 0.03, { freq: 2400 * r, q: 3, gain: 0.07 * vel, attack: 0.001, x });
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = 170 * r;
    env(g.gain, when, 0.05 * vel, 0.001, 0.04);
    o.connect(g);
    g.connect(bus);
    o.start(when);
    o.stop(when + 0.07);
    own(o, [g]);
  }

  function chime({ when = now(), x = 0.5, vel = 1 } = {}) {
    pluck({ note: 67, when, x, vel: 0.8 * vel, dur: 0.7 });
    pluck({ note: 74, when: when + 0.09, x, vel, dur: 1.2 });
  }

  function toggle({ on = true, when = now(), x = 0.5 } = {}) {
    const [a, b] = on ? [62, 69] : [69, 62];
    pluck({ note: a, when, x, vel: 0.7, dur: 0.5 });
    pluck({ note: b, when: when + 0.08, x, vel: 0.8, dur: 0.7 });
  }

  function intro({ when = now() } = {}) {
    [62, 69, 74].forEach((n, i) => pluck({ note: n, when: when + i * 0.11, vel: 0.8, dur: i === 2 ? 2 : 0.9 }));
    swish({ dir: 1, when, vel: 0.6 });
  }

  const noteY = (y) => hz(SCALE[clamp(Math.floor((1 - y) * SCALE.length), 0, SCALE.length - 1)]);
  let ink = null;
  function inkStart({ y = 0.5, when = now() } = {}) {
    if (ink) return;
    const o = ctx.createOscillator();
    const lp = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = "triangle";
    o.frequency.value = noteY(y);
    lp.type = "lowpass";
    lp.frequency.value = 1200;
    g.gain.value = 0;
    o.connect(lp);
    lp.connect(g);
    g.connect(bus);
    o.start(when);
    g.gain.setTargetAtTime(0.02, when, 0.05);
    ink = { o, lp, g };
  }
  function inkMove({ y = 0.5, speed = 0.5, when = now() } = {}) {
    if (!ink) return;
    const s = clamp(speed, 0, 1);
    ink.o.frequency.setTargetAtTime(noteY(y), when, 0.06);
    ink.g.gain.setTargetAtTime(0.012 + s * 0.05, when, 0.05);
    ink.lp.frequency.setTargetAtTime(900 + s * 1800, when, 0.08);
  }
  function inkEnd({ when = now() } = {}) {
    if (!ink) return;
    const { o, lp, g } = ink;
    ink = null;
    g.gain.setTargetAtTime(0, when, 0.08);
    o.stop(when + 0.6);
    o.onended = () => [lp, g].forEach((n) => n.disconnect());
  }

  const pad = { started: false, oscs: [], filter: null, gain: null };
  function padStart(when = now()) {
    if (pad.started) return;
    pad.started = true;
    const chord = CHORDS[theme][section] ?? CHORDS[theme].hero;
    pad.filter = ctx.createBiquadFilter();
    pad.filter.type = "lowpass";
    pad.filter.Q.value = 0.6;
    pad.filter.frequency.value = cfg.padCutoff[theme];
    pad.gain = ctx.createGain();
    pad.gain.gain.value = 0;
    const padSend = ctx.createGain();
    padSend.gain.value = cfg.padReverb;
    pad.filter.connect(pad.gain);
    pad.gain.connect(master);
    pad.gain.connect(padSend);
    padSend.connect(verb);
    chord.forEach((m, i) => {
      [-7, 7].forEach((cents, j) => {
        const o = ctx.createOscillator();
        const vg = ctx.createGain();
        const p = ctx.createStereoPanner();
        o.type = i === 0 ? "triangle" : "sawtooth";
        o.frequency.value = hz(m);
        o.detune.value = cents;
        vg.gain.value = i === 0 ? 0.5 : 0.28;
        p.pan.value = ((i + j) % 2 ? 1 : -1) * (0.15 + 0.12 * i);
        o.connect(vg);
        vg.connect(p);
        p.connect(pad.filter);
        o.start(when);
        pad.oscs.push({ o, i });
      });
    });
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = cfg.padBreathHz;
    lfoGain.gain.value = 180;
    lfo.connect(lfoGain);
    lfoGain.connect(pad.filter.frequency);
    lfo.start(when);
    pad.gain.gain.setTargetAtTime(cfg.ambient, when, 1.5);
  }

  function setSection(name, when = now()) {
    if (!CHORDS[theme][name]) return;
    section = name;
    if (!pad.started) return;
    const chord = CHORDS[theme][name];
    pad.oscs.forEach(({ o, i }) => o.frequency.setTargetAtTime(hz(chord[i]), when, 1.1));
  }
  function setTheme(name, when = now()) {
    if (!CHORDS[name] || name === theme) return;
    theme = name;
    if (pad.started) pad.filter.frequency.setTargetAtTime(cfg.padCutoff[name], when, 0.8);
    setSection(section, when);
  }
  function setPointer({ x = 0.5, when = now() } = {}) {
    if (!pad.started || when - lastPointer < 0.05) return;
    lastPointer = when;
    pad.filter.frequency.setTargetAtTime(cfg.padCutoff[theme] * (0.75 + 0.7 * x), when, 0.25);
  }
  function setMaster(v, when = now(), tc = 0.08) {
    master.gain.cancelScheduledValues(when);
    master.gain.setTargetAtTime(cfg.master * clamp(v, 0, 1), when, tc);
  }
  function setAmbient(on, when = now()) {
    if (on) padStart(when);
    if (pad.gain) pad.gain.gain.setTargetAtTime(on ? cfg.ambient : 0, when, on ? 1.5 : 0.4);
  }

  const bins = new Uint8Array(analyser.frequencyBinCount);
  function levels(n = 4) {
    analyser.getByteFrequencyData(bins);
    const step = Math.floor(bins.length / n);
    return Array.from({ length: n }, (_, b) => {
      let s = 0;
      for (let i = 0; i < step; i++) s += bins[b * step + i];
      return s / step / 255;
    });
  }

  return { ctx, setMaster, setAmbient, setTheme, setSection, setPointer, levels, pluck, tick, thump, swish, key, chime, toggle, intro, inkStart, inkMove, inkEnd };
}
