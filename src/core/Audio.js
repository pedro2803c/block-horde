// Sistema de áudio 100% procedural (Web Audio API).
// Todos os efeitos sonoros são sintetizados em OfflineAudioContext durante o carregamento
// e a música é gerada em tempo real por um sequenciador.
const SR = 44100;

function makeNoise(ctx, dur) {
  const len = Math.max(1, Math.ceil(ctx.sampleRate * dur));
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function noiseSrc(ctx, dur, t = 0) {
  const s = ctx.createBufferSource();
  s.buffer = makeNoise(ctx, dur + 0.05);
  s.start(t);
  return s;
}
function envGain(ctx, t0, attack, peak, decay, floor = 0.0001) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(Math.max(floor, 0.0001), t0 + attack + decay);
  return g;
}
function filt(ctx, type, f, q = 1) {
  const b = ctx.createBiquadFilter();
  b.type = type;
  b.frequency.value = f;
  b.Q.value = q;
  return b;
}
function distortion(ctx, amount = 20) {
  const ws = ctx.createWaveShaper();
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
  }
  ws.curve = curve;
  return ws;
}
function tone(ctx, out, type, f0, f1, t0, attack, peak, decay) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + attack + decay);
  const g = envGain(ctx, t0, attack, peak, decay);
  o.connect(g).connect(out);
  o.start(t0);
  o.stop(t0 + attack + decay + 0.05);
}
function noiseHit(ctx, out, type, f0, f1, q, t0, attack, peak, decay) {
  const n = noiseSrc(ctx, attack + decay, t0);
  const f = filt(ctx, type, f0, q);
  f.frequency.setValueAtTime(f0, t0);
  if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + attack + decay);
  const g = envGain(ctx, t0, attack, peak, decay);
  n.connect(f).connect(g).connect(out);
}

function gun(ctx, out, p) {
  const dist = distortion(ctx, p.dist ?? 8);
  const master = ctx.createGain();
  master.gain.value = p.vol ?? 0.9;
  dist.connect(master).connect(out);
  noiseHit(ctx, dist, 'lowpass', p.nf, p.ne, 0.7, 0, 0.002, 1, p.dec);
  noiseHit(ctx, dist, 'highpass', 4500, 4500, 0.7, 0, 0.001, 0.6, 0.035);
  tone(ctx, dist, 'sine', p.th, 38, 0, 0.002, 0.9, p.thd);
  if (p.echo) {
    const d = ctx.createDelay(1);
    d.delayTime.value = p.echo;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const lp = filt(ctx, 'lowpass', 900);
    master.connect(d);
    d.connect(lp).connect(fb).connect(d);
    lp.connect(out);
  }
}
function groan(ctx, out, p) {
  const dur = p.dur;
  const o = ctx.createOscillator();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(p.f, 0);
  o.frequency.linearRampToValueAtTime(p.f * (p.bend ?? 0.75), dur);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = p.vib ?? 6;
  const lg = ctx.createGain();
  lg.gain.value = p.f * 0.07;
  lfo.connect(lg).connect(o.frequency);
  const b1 = filt(ctx, 'bandpass', p.formant, 4);
  const b2 = filt(ctx, 'bandpass', p.formant * 2.3, 6);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, 0);
  g.gain.linearRampToValueAtTime(p.vol ?? 0.7, dur * 0.2);
  g.gain.linearRampToValueAtTime((p.vol ?? 0.7) * 0.7, dur * 0.7);
  g.gain.exponentialRampToValueAtTime(0.0001, dur);
  o.connect(b1).connect(g);
  o.connect(b2).connect(g);
  const n = noiseSrc(ctx, dur);
  const nf = filt(ctx, 'bandpass', p.formant * 1.5, 1.2);
  const ng = ctx.createGain();
  ng.gain.value = 0.25;
  n.connect(nf).connect(ng).connect(g);
  const dist = distortion(ctx, p.grit ?? 4);
  g.connect(dist).connect(out);
  o.start(0);
  lfo.start(0);
  o.stop(dur);
  lfo.stop(dur);
}
function click(ctx, out, t, f, v = 0.5, d = 0.03) {
  noiseHit(ctx, out, 'bandpass', f, f, 5, t, 0.001, v, d);
}

const DEFS = {
  shot_pistol: [0.5, (c, o) => gun(c, o, { nf: 3400, ne: 500, dec: 0.2, th: 150, thd: 0.12, vol: 0.85 })],
  shot_shotgun: [0.9, (c, o) => gun(c, o, { nf: 2200, ne: 160, dec: 0.5, th: 95, thd: 0.32, vol: 1, dist: 14 })],
  shot_rifle: [0.6, (c, o) => gun(c, o, { nf: 4200, ne: 700, dec: 0.24, th: 165, thd: 0.12, vol: 0.85 })],
  shot_smg: [0.35, (c, o) => gun(c, o, { nf: 4800, ne: 1200, dec: 0.13, th: 190, thd: 0.07, vol: 0.7 })],
  shot_sniper: [1.8, (c, o) => gun(c, o, { nf: 2800, ne: 260, dec: 0.65, th: 85, thd: 0.4, vol: 1, echo: 0.28, dist: 16 })],
  reload_out: [0.3, (c, o) => { click(c, o, 0, 1800, 0.6); click(c, o, 0.09, 2600, 0.4); }],
  reload_in: [0.45, (c, o) => { click(c, o, 0, 2200, 0.7); click(c, o, 0.16, 3600, 0.6, 0.05); tone(c, o, 'square', 2400, 2000, 0.16, 0.001, 0.08, 0.05); }],
  pump: [0.4, (c, o) => { click(c, o, 0, 1400, 0.7, 0.06); click(c, o, 0.18, 1900, 0.7, 0.06); }],
  empty: [0.12, (c, o) => click(c, o, 0, 4200, 0.45, 0.02)],
  step1: [0.12, (c, o) => noiseHit(c, o, 'lowpass', 420, 200, 1, 0, 0.004, 0.35, 0.07)],
  step2: [0.12, (c, o) => noiseHit(c, o, 'lowpass', 520, 220, 1, 0, 0.004, 0.32, 0.07)],
  step3: [0.12, (c, o) => noiseHit(c, o, 'lowpass', 360, 180, 1, 0, 0.004, 0.36, 0.08)],
  groan1: [1.3, (c, o) => groan(c, o, { f: 92, dur: 1.25, formant: 520 })],
  groan2: [1.6, (c, o) => groan(c, o, { f: 78, dur: 1.55, formant: 430, vib: 4 })],
  groan3: [1.1, (c, o) => groan(c, o, { f: 115, dur: 1.05, formant: 650, vib: 8 })],
  groan4: [1.8, (c, o) => groan(c, o, { f: 70, dur: 1.75, formant: 380, bend: 0.6, grit: 8 })],
  scream: [0.8, (c, o) => groan(c, o, { f: 390, dur: 0.75, formant: 1300, vib: 11, bend: 0.7, vol: 0.55, grit: 6 })],
  roar: [1.9, (c, o) => groan(c, o, { f: 52, dur: 1.85, formant: 300, vib: 3, bend: 0.7, vol: 0.9, grit: 22 })],
  boss_roar: [2.8, (c, o) => groan(c, o, { f: 38, dur: 2.7, formant: 240, vib: 2.5, bend: 0.55, vol: 1, grit: 30 })],
  zombie_attack: [0.45, (c, o) => { groan(c, o, { f: 150, dur: 0.4, formant: 800, vib: 14, vol: 0.5 }); noiseHit(c, o, 'bandpass', 700, 2200, 1.5, 0.05, 0.03, 0.4, 0.2); }],
  zombie_die: [1.1, (c, o) => groan(c, o, { f: 110, dur: 1.05, formant: 480, bend: 0.4, vol: 0.6 })],
  hit_flesh: [0.15, (c, o) => { noiseHit(c, o, 'lowpass', 900, 300, 1, 0, 0.002, 0.8, 0.09); tone(c, o, 'sine', 110, 50, 0, 0.002, 0.6, 0.09); }],
  hit_head: [0.2, (c, o) => { noiseHit(c, o, 'lowpass', 1400, 300, 1, 0, 0.002, 0.9, 0.12); noiseHit(c, o, 'highpass', 3500, 3500, 1, 0, 0.001, 0.5, 0.04); tone(c, o, 'sine', 90, 40, 0, 0.002, 0.7, 0.12); }],
  hit_wall: [0.12, (c, o) => { noiseHit(c, o, 'highpass', 2600, 2600, 1, 0, 0.001, 0.4, 0.04); tone(c, o, 'triangle', 1900, 900, 0, 0.001, 0.12, 0.05); }],
  hit_armor: [0.2, (c, o) => { tone(c, o, 'square', 1500, 1100, 0, 0.001, 0.25, 0.12); tone(c, o, 'triangle', 2700, 2200, 0, 0.001, 0.2, 0.15); }],
  explosion: [2.2, (c, o) => {
    const d = distortion(c, 30);
    const g = c.createGain();
    g.gain.value = 1;
    d.connect(g).connect(o);
    noiseHit(c, d, 'lowpass', 3200, 70, 0.8, 0, 0.005, 1, 1.8);
    tone(c, d, 'sine', 75, 24, 0, 0.005, 1, 0.9);
  }],
  pickup: [0.4, (c, o) => { tone(c, o, 'sine', 660, 660, 0, 0.005, 0.35, 0.1); tone(c, o, 'sine', 990, 990, 0.06, 0.005, 0.35, 0.1); tone(c, o, 'sine', 1320, 1320, 0.12, 0.005, 0.35, 0.18); }],
  coin: [0.3, (c, o) => { tone(c, o, 'square', 1320, 1320, 0, 0.002, 0.12, 0.06); tone(c, o, 'square', 1760, 1760, 0.06, 0.002, 0.12, 0.16); }],
  ammo: [0.25, (c, o) => { click(c, o, 0, 1600, 0.5, 0.04); click(c, o, 0.07, 2200, 0.4, 0.04); }],
  ui_hover: [0.06, (c, o) => tone(c, o, 'sine', 1100, 1300, 0, 0.003, 0.12, 0.04)],
  ui_click: [0.15, (c, o) => { tone(c, o, 'square', 520, 260, 0, 0.002, 0.18, 0.08); click(c, o, 0, 2500, 0.3, 0.02); }],
  ui_back: [0.15, (c, o) => tone(c, o, 'square', 340, 200, 0, 0.002, 0.16, 0.1)],
  hurt: [0.3, (c, o) => { noiseHit(c, o, 'lowpass', 600, 200, 1, 0, 0.003, 0.7, 0.16); tone(c, o, 'sine', 130, 55, 0, 0.003, 0.7, 0.2); }],
  heartbeat: [0.6, (c, o) => { tone(c, o, 'sine', 62, 40, 0, 0.01, 0.9, 0.14); tone(c, o, 'sine', 58, 38, 0.2, 0.01, 0.7, 0.16); }],
  swing: [0.3, (c, o) => noiseHit(c, o, 'bandpass', 500, 2600, 1.4, 0, 0.05, 0.5, 0.2)],
  melee_hit: [0.25, (c, o) => { noiseHit(c, o, 'lowpass', 500, 200, 1, 0, 0.002, 0.9, 0.15); tone(c, o, 'sine', 80, 40, 0, 0.002, 0.8, 0.15); noiseHit(c, o, 'highpass', 2000, 2000, 1, 0, 0.001, 0.3, 0.05); }],
  beep: [0.1, (c, o) => tone(c, o, 'square', 1050, 1050, 0, 0.002, 0.25, 0.06)],
  fuse: [1.0, (c, o) => { noiseHit(c, o, 'highpass', 2500, 5000, 1, 0, 0.8, 0.35, 0.15); }],
  levelup: [0.9, (c, o) => { [523, 659, 784, 1046].forEach((f, i) => tone(c, o, 'triangle', f, f, i * 0.09, 0.005, 0.3, i === 3 ? 0.5 : 0.12)); }],
  achievement: [1.0, (c, o) => { tone(c, o, 'sine', 784, 784, 0, 0.005, 0.3, 0.3); tone(c, o, 'sine', 1175, 1175, 0.12, 0.005, 0.3, 0.6); tone(c, o, 'triangle', 1568, 1568, 0.24, 0.005, 0.15, 0.6); }],
  bounce: [0.1, (c, o) => { tone(c, o, 'triangle', 2400, 1800, 0, 0.001, 0.25, 0.05); }],
  spit: [0.4, (c, o) => noiseHit(c, o, 'bandpass', 600, 1400, 3, 0, 0.02, 0.6, 0.3)],
  splash: [0.4, (c, o) => noiseHit(c, o, 'lowpass', 1600, 300, 1, 0, 0.004, 0.6, 0.3)],
  throw: [0.3, (c, o) => noiseHit(c, o, 'bandpass', 300, 1200, 1.2, 0, 0.05, 0.4, 0.2)],
  stomp: [1.0, (c, o) => { tone(c, o, 'sine', 55, 25, 0, 0.004, 1, 0.7); noiseHit(c, o, 'lowpass', 300, 60, 1, 0, 0.004, 0.8, 0.6); }],
  crate: [0.4, (c, o) => { noiseHit(c, o, 'bandpass', 500, 300, 2, 0, 0.003, 0.7, 0.14); tone(c, o, 'triangle', 190, 120, 0, 0.003, 0.4, 0.12); click(c, o, 0.15, 1200, 0.4, 0.05); }],
  heal: [0.6, (c, o) => { tone(c, o, 'sine', 420, 840, 0, 0.05, 0.25, 0.45); tone(c, o, 'sine', 630, 1260, 0.05, 0.05, 0.15, 0.4); }],
  wave: [1.8, (c, o) => { tone(c, o, 'sawtooth', 110, 104, 0, 0.3, 0.25, 1.3); tone(c, o, 'sawtooth', 164, 156, 0, 0.3, 0.18, 1.3); }],
  generator: [1.2, (c, o) => { tone(c, o, 'sawtooth', 40, 120, 0, 0.6, 0.3, 0.5); noiseHit(c, o, 'lowpass', 300, 900, 1, 0, 0.6, 0.2, 0.5); }],
  victory: [2.2, (c, o) => { [392, 523, 659, 784, 1046].forEach((f, i) => tone(c, o, 'triangle', f, f, i * 0.14, 0.01, 0.3, i === 4 ? 1.2 : 0.25)); }],
  gameover: [2.4, (c, o) => { [440, 415, 392, 330].forEach((f, i) => tone(c, o, 'sawtooth', f / 2, f / 2.05, i * 0.35, 0.02, 0.18, i === 3 ? 1.5 : 0.35)); }],
  // arena: vapor das válvulas, alarme da base e sino da capela
  steam: [1.3, (c, o) => { noiseHit(c, o, 'highpass', 2200, 5200, 1, 0, 0.18, 0.55, 1.0); noiseHit(c, o, 'bandpass', 900, 2600, 2, 0.05, 0.05, 0.3, 0.6); }],
  siren: [2.6, (c, o) => { tone(c, o, 'sawtooth', 620, 900, 0, 0.12, 0.9, 0.55); tone(c, o, 'sawtooth', 460, 700, 0.9, 0.12, 0.8, 0.5); tone(c, o, 'square', 310, 450, 1.8, 0.12, 0.6, 0.35); }],
  bell: [2.8, (c, o) => { [[880, 0], [1320, 0.02], [1760, 0.05], [2640, 0.09]].forEach(([f, d]) => tone(c, o, 'sine', f, f, d, 0.004, 0.5, 1.6)); }],
};

export const SOUND_NAMES = Object.keys(DEFS);

// assinatura sonora de cada arena: corte do filtro, volume, zumbido e metal
const AMBIENT = {
  city: { cut: 300, vol: 0.055, hum: 55, humVol: 0.014, metal: 0.004 },
  factory: { cut: 190, vol: 0.07, hum: 50, humVol: 0.028, metal: 0.016 },
  forest: { cut: 760, vol: 0.06, hum: 42, humVol: 0.008, metal: 0 },
  military: { cut: 420, vol: 0.05, hum: 60, humVol: 0.02, metal: 0.01 },
  graveyard: { cut: 220, vol: 0.045, hum: 38, humVol: 0.006, metal: 0.002 },
};

export class AudioSystem {
  constructor() {
    this.buffers = {};
    this.ctx = null;
    this.vol = { master: 0.8, music: 0.5, sfx: 0.85 };
    this.listener = { x: 0, y: 0, z: 0, yaw: 0 };
    this.voices = 0;
    this.musicMode = null;
    this.musicTimer = null;
    this.ambientTheme = null;
    this.ambientNodes = null;
    this.pendingAmbient = null;
  }

  async renderSound(name) {
    const [dur, build] = DEFS[name];
    const Off = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!Off) return;
    const ctx = new Off(1, Math.ceil(SR * dur), SR);
    build(ctx, ctx.destination);
    this.buffers[name] = await ctx.startRendering();
  }

  // Deve ser chamado após um gesto do usuário (política de autoplay).
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.sfx = this.ctx.createGain();
      this.musicBus = this.ctx.createGain();
      this.sfx.connect(this.master);
      this.musicBus.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.ambientBus = this.ctx.createGain();
      this.ambientBus.gain.value = 0.34;
      this.ambientBus.connect(this.master);
      this.applyVolumes();
      if (this.pendingAmbient) this.setAmbient(this.pendingAmbient);
      if (this.pendingMusic) this.setMusic(this.pendingMusic);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setVolumes(master, music, sfx) {
    this.vol = { master, music, sfx };
    this.applyVolumes();
  }
  applyVolumes() {
    if (!this.ctx) return;
    this.master.gain.value = this.vol.master;
    this.sfx.gain.value = this.vol.sfx;
    this.musicBus.gain.value = this.vol.music * 0.55;
    if (this.ambientBus) this.ambientBus.gain.value = 0.34 * Math.max(0.35, this.vol.music);
  }

  // ---------------- Ambiente procedural por arena ----------------
  // Um ruído filtrado + zumbido grave dão a "assinatura" de cada mapa;
  // camadas de chuva e vento entram nos eventos de clima.
  setAmbient(theme) {
    this.ambientTheme = theme;
    if (!this.ctx) {
      this.pendingAmbient = theme;
      return;
    }
    if (!this.ambientNodes) this._makeAmbient();
    const A = this.ambientNodes;
    const cfg = AMBIENT[theme] || AMBIENT.city;
    const t = this.ctx.currentTime;
    A.filter.frequency.cancelScheduledValues(t);
    A.filter.frequency.linearRampToValueAtTime(cfg.cut, t + 1.2);
    A.gain.gain.cancelScheduledValues(t);
    A.gain.gain.linearRampToValueAtTime(cfg.vol, t + 1.2);
    A.hum.frequency.cancelScheduledValues(t);
    A.hum.frequency.linearRampToValueAtTime(cfg.hum, t + 1.2);
    A.humGain.gain.cancelScheduledValues(t);
    A.humGain.gain.linearRampToValueAtTime(cfg.humVol, t + 1.2);
    A.metalGain.gain.cancelScheduledValues(t);
    A.metalGain.gain.linearRampToValueAtTime(cfg.metal, t + 1.2);
    A.theme = theme;
  }
  setWeatherAmbient(kind, on) {
    if (!this.ctx) return;
    if (!this.ambientNodes) this._makeAmbient();
    const A = this.ambientNodes;
    const t = this.ctx.currentTime;
    const g = kind === 'rain' ? A.rainGain : A.windGain;
    g.gain.cancelScheduledValues(t);
    g.gain.linearRampToValueAtTime(on ? (kind === 'rain' ? 0.1 : 0.07) : 0, t + (on ? 1.5 : 2.5));
  }
  _makeAmbient() {
    const ctx = this.ctx;
    const dur = 4;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      // ruído "marrom": mais grave e menos sibilante que o branco
      last = (last + (Math.random() * 2 - 1) * 0.08) * 0.985;
      d[i] = last;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 320;
    const gain = ctx.createGain();
    gain.gain.value = 0.05;
    src.connect(filter).connect(gain).connect(this.ambientBus);
    // zumbido elétrico/grave
    const hum = ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = 60;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.012;
    hum.connect(humGain).connect(this.ambientBus);
    // metal: banda estreita que dá o timbre de fábrica/base
    const metal = ctx.createBufferSource();
    metal.buffer = buf;
    metal.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 780;
    bp.Q.value = 5;
    const metalGain = ctx.createGain();
    metalGain.gain.value = 0;
    metal.connect(bp).connect(metalGain).connect(this.ambientBus);
    // camadas de clima (começam mudas)
    const mkLayer = (type, f, q) => {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.loop = true;
      s.playbackRate.value = 1.6;
      const fl = ctx.createBiquadFilter();
      fl.type = type;
      fl.frequency.value = f;
      fl.Q.value = q;
      const g = ctx.createGain();
      g.gain.value = 0;
      s.connect(fl).connect(g).connect(this.ambientBus);
      s.start();
      return g;
    };
    const rainGain = mkLayer('highpass', 1500, 0.7);
    const windGain = mkLayer('lowpass', 520, 0.6);
    // vento com oscilação lenta
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.11;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 0.02;
    lfo.connect(lfoDepth).connect(windGain.gain);
    src.start();
    hum.start();
    metal.start();
    lfo.start();
    this.ambientNodes = { src, filter, gain, hum, humGain, metal, metalGain, rainGain, windGain, theme: null };
  }

  play(name, opts = {}) {
    if (!this.ctx || !this.buffers[name]) return;
    if (this.voices > 40 && !opts.priority) return;
    const ctx = this.ctx;
    let vol = opts.volume ?? 1;
    let pan = opts.pan ?? 0;
    if (opts.pos) {
      const L = this.listener;
      const dx = opts.pos.x - L.x;
      const dz = opts.pos.z - L.z;
      const d = Math.hypot(dx, dz);
      const maxD = opts.maxDist ?? 45;
      if (d > maxD) return;
      const att = 1 - d / maxD;
      vol *= att * att;
      if (vol < 0.01) return;
      if (d > 0.5) {
        const rx = -Math.cos(L.yaw);
        const rz = Math.sin(L.yaw);
        pan = Math.max(-1, Math.min(1, (dx * rx + dz * rz) / d)) * 0.85;
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = this.buffers[name];
    src.playbackRate.value = opts.rate ?? 1;
    const g = ctx.createGain();
    g.gain.value = vol;
    let node = src.connect(g);
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = pan;
      node = node.connect(p);
    }
    node.connect(this.sfx);
    this.voices++;
    src.onended = () => {
      this.voices--;
    };
    src.start();
  }

  // ---------------- Música procedural ----------------
  setMusic(mode) {
    if (!this.ctx) {
      this.pendingMusic = mode;
      return;
    }
    if (mode === this.musicMode) return;
    this.musicMode = mode;
    this.step = 0;
    this.nextT = this.ctx.currentTime + 0.1;
    if (this.musicTimer) clearInterval(this.musicTimer);
    if (!mode) return;
    this.musicTimer = setInterval(() => this._schedule(), 40);
  }

  _schedule() {
    if (!this.ctx || !this.musicMode) return;
    const mode = this.musicMode;
    const bpm = mode === 'boss' ? 150 : mode === 'combat' ? 128 : 66;
    const stepDur = 60 / bpm / 4;
    while (this.nextT < this.ctx.currentTime + 0.25) {
      if (mode === 'boss' || mode === 'combat') this._stepCombat(this.step, this.nextT, stepDur, mode === 'boss');
      else this._stepAmbient(this.step, this.nextT, stepDur, mode === 'menu');
      this.nextT += stepDur;
      this.step++;
    }
  }

  _note(type, f, t, attack, peak, decay, dest, filterF) {
    const c = this.ctx;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    let n = o.connect(g);
    if (filterF) {
      const f2 = c.createBiquadFilter();
      f2.type = 'lowpass';
      f2.frequency.value = filterF;
      n = g.connect(f2);
    }
    n.connect(dest || this.musicBus);
    o.start(t);
    o.stop(t + attack + decay + 0.1);
  }
  _noise(t, decay, peak, type, f) {
    const c = this.ctx;
    if (!this._nbuf) this._nbuf = makeNoise(c, 1);
    const s = c.createBufferSource();
    s.buffer = this._nbuf;
    const fl = c.createBiquadFilter();
    fl.type = type;
    fl.frequency.value = f;
    const g = c.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
    s.connect(fl).connect(g).connect(this.musicBus);
    s.start(t);
    s.stop(t + decay + 0.05);
  }
  _echo() {
    if (this._echoIn) return this._echoIn;
    const c = this.ctx;
    const inp = c.createGain();
    const d = c.createDelay(2);
    d.delayTime.value = 0.48;
    const fb = c.createGain();
    fb.gain.value = 0.45;
    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1800;
    inp.connect(this.musicBus);
    inp.connect(d);
    d.connect(lp).connect(fb).connect(d);
    lp.connect(this.musicBus);
    this._echoIn = inp;
    return inp;
  }

  _stepAmbient(step, t, sd, menu) {
    const roots = [55, 43.65, 49, 41.2]; // A1, F1, G1, E1
    const bar = Math.floor(step / 32) % roots.length;
    if (step % 32 === 0) {
      const r = roots[bar];
      const len = sd * 32;
      this._note('sawtooth', r, t, len * 0.35, 0.16, len * 0.75, null, 260);
      this._note('sawtooth', r * 1.005, t, len * 0.35, 0.14, len * 0.75, null, 220);
      this._note('triangle', r * 2, t, len * 0.4, 0.1, len * 0.7, null, 600);
      this._note('sine', r * 3, t, len * 0.5, 0.04, len * 0.6);
    }
    const scale = [220, 261.6, 293.7, 329.6, 392, 440, 523.3, 587.3];
    if (step % 4 === 0 && Math.random() < (menu ? 0.3 : 0.2)) {
      const f = scale[Math.floor(Math.random() * scale.length)] * (Math.random() < 0.3 ? 2 : 1);
      this._note('triangle', f, t, 0.01, 0.07, 2.2, this._echo());
    }
    if (step % 64 === 48 && Math.random() < 0.5) {
      this._note('sawtooth', 466.2, t, 1.2, 0.03, 1.4, null, 1200); // tensão dissonante
    }
    if (menu && step % 16 === 0) {
      this._note('sine', 50, t, 0.01, 0.25, 0.25);
      this._note('sine', 46, t + sd * 2, 0.01, 0.18, 0.25);
    }
  }

  _stepCombat(step, t, sd, boss) {
    const prog = [55, 43.65, 49, 41.2];
    const root = prog[Math.floor(step / 16) % 4];
    const s = step % 16;
    if (s % 4 === 0) {
      // bumbo
      const c = this.ctx;
      const o = c.createOscillator();
      o.frequency.setValueAtTime(140, t);
      o.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      const g = c.createGain();
      g.gain.setValueAtTime(boss ? 0.7 : 0.5, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      o.connect(g).connect(this.musicBus);
      o.start(t);
      o.stop(t + 0.3);
    }
    if (s === 4 || s === 12) this._noise(t, 0.16, boss ? 0.35 : 0.25, 'bandpass', 1800);
    if (s % 2 === 1) this._noise(t, 0.04, 0.08, 'highpass', 7000);
    const pat = [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1];
    if (pat[s]) this._note('sawtooth', root * 2, t, 0.005, boss ? 0.16 : 0.12, sd * 0.9, null, boss ? 900 : 650);
    if (s === 0) {
      this._note('sawtooth', root * 4, t, 0.05, 0.05, sd * 14, null, 1500);
      this._note('sawtooth', root * 4 * 1.498, t, 0.05, 0.04, sd * 14, null, 1500);
    }
    if (boss && s === 8 && Math.random() < 0.6) this._note('square', root * 8, t, 0.01, 0.04, sd * 3, this._echo());
  }
}
