// Gerador pseudoaleatório determinístico (mulberry32) usado na geração de mapas e modelos.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class RNG {
  constructor(seed = 1) {
    this.r = mulberry32(seed);
  }
  next() {
    return this.r();
  }
  range(a, b) {
    return a + (b - a) * this.r();
  }
  int(a, b) {
    return Math.floor(a + (b - a + 1) * this.r());
  }
  pick(arr) {
    return arr[Math.floor(this.r() * arr.length)];
  }
  chance(p) {
    return this.r() < p;
  }
  weighted(table) {
    // table: { key: weight }
    let total = 0;
    for (const k in table) total += table[k];
    let v = this.r() * total;
    for (const k in table) {
      v -= table[k];
      if (v <= 0) return k;
    }
    return Object.keys(table)[0];
  }
}

export const rand = (a, b) => a + (b - a) * Math.random();
export const randInt = (a, b) => Math.floor(a + (b - a + 1) * Math.random());
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, lambda, dt) => a + (b - a) * (1 - Math.exp(-lambda * dt));
export function angleDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}
export function dampAngle(a, b, lambda, dt) {
  return a + angleDiff(a, b) * (1 - Math.exp(-lambda * dt));
}
