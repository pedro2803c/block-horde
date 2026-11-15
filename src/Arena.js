import * as THREE from 'three';
import { mulberry32 } from './core/rng.js';
import { SCENERY_BY_CHAR, TERRAIN_CODE, TERRAIN_PAINT, BARREL_MODEL, placeParts, BELT_DIR } from './scenery.js';

const TERRAIN_NAMES = Object.fromEntries(Object.entries(TERRAIN_CODE).map(([k, v]) => [v, k]));
export const T_LAVA = TERRAIN_CODE.lava;
export const T_WATER = TERRAIN_CODE.water;
export const T_BUSH = 9; // arbusto: andável, mas atrasa
export const T_TOXIC = TERRAIN_CODE.toxic;
export const T_ELEC = TERRAIN_CODE.elec;
export const T_PLATFORM = TERRAIN_CODE.platform;
// esteiras: código do piso -> direção do empuxo [dx, dz]
export const BELT_SPEED = 2.2;

const PX = 32; // pixels por metro na textura do chão
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();
const _up = new THREE.Vector3(0, 1, 0);

const WALL = { grass: [0x8a5a44, 0x7a4e3a], concrete: [0x5a6068, 0x4e545c], graveyard: [0x6a6a70, 0x5a5a62], industrial: [0x5a6068, 0x4e545c], wild: [0x6a6c70, 0x5e6064] };
const CONTAINERS = [0xa83a2a, 0x2a5a8a, 0x3a7a3a, 0xc08a2a];

// Arena em grade de 1 m: colisão, linha de tiro, campo de fluxo (Dijkstra) e chão com sangue persistente.
export class Arena {
  constructor(def) {
    this.def = def;
    const rows = def.map;
    this.D = rows.length;
    this.W = rows[0].length;
    const N = this.W * this.D;
    this.block = new Uint8Array(N); // bloqueia movimento (estático)
    this.tall = new Uint8Array(N); // bloqueia tiros
    this.dyn = new Uint8Array(N); // 1 barricada, 2 barril (dinâmico)
    this.dist = new Int32Array(N);
    this.statics = []; // caixas do cenário: [x,y,z,sx,sy,sz,color,ry]
    this.glows = []; // peças que brilham (lava, lâmpadas fixas)
    this.terrain = new Uint8Array(N); // piso especial (TERRAIN_CODE) e arbustos
    this.cover = new Uint8Array(N); // cobertura baixa: barra ácido e ferrões
    this.props = []; // objetos destrutíveis/interativos desenhados a cada quadro
    this.propGrid = new Int32Array(N).fill(-1);
    this.mapBarrels = []; // barris explosivos do mapa (viram barris do jogo)
    this.graves = []; // covas: pontos de surgimento extras
    this.lavaCells = [];
    this.elecCells = [];
    this.platformCells = [];
    this.toxicCells = [];
    this.beltCells = new Map(); // célula -> [dx, dz]
    this.gates = [];
    const rng = mulberry32(def.id.length * 977 + 13);
    const wallC = WALL[def.floor];
    const mark = (i, j, tall = true) => {
      if (i < 0 || j < 0 || i >= this.W || j >= this.D) return;
      this.block[i + j * this.W] = 1;
      if (tall) this.tall[i + j * this.W] = 1;
    };
    for (let j = 0; j < this.D; j++)
      for (let i = 0; i < this.W; i++) {
        const ch = rows[j][i];
        const x = i + 0.5;
        const z = j + 0.5;
        switch (ch) {
          case '#': {
            mark(i, j);
            const h = def.floor === 'graveyard' ? 1.6 : 2.4;
            this.statics.push([x, h / 2, z, 1, h, 1, (i + j) % 2 ? wallC[0] : wallC[1]]);
            if (def.floor === 'graveyard') this.statics.push([x, h + 0.08, z, 1.08, 0.16, 1.08, 0x4a4a52]);
            break;
          }
          case 'C': {
            mark(i, j);
            // contêineres agrupados por blocos de 3 colunas para variar a cor
            const col = CONTAINERS[(Math.floor(i / 3) + Math.floor(j / 2)) % CONTAINERS.length];
            this.statics.push([x, 1.3, z, 1, 2.6, 1, col]);
            if (i % 2 === 0) this.statics.push([x, 1.3, z, 1.02, 2.3, 0.2, 0x000000 | (col & 0xdedede) >> 1]);
            break;
          }
          case 'c':
            mark(i, j, false);
            this.statics.push([x, 0.45, z, 0.92, 0.9, 0.92, 0x9a7444]);
            this.statics.push([x, 0.45, z, 0.95, 0.12, 0.95, 0x6a4a2a]);
            break;
          case 'T':
            mark(i, j);
            this.statics.push([x, 0.7, z, 0.4, 1.4, 0.4, 0x5a3a22]);
            this.statics.push([x, 1.9, z, 2.2, 1.2, 2.2, def.floor === 'graveyard' ? 0x2a3a2a : 0x3a7a32]);
            this.statics.push([x, 2.7, z, 1.4, 0.7, 1.4, def.floor === 'graveyard' ? 0x24321f : 0x4a8a3a]);
            break;
          case 't': {
            mark(i, j, false);
            const ry = (rng() - 0.5) * 0.3;
            this.statics.push([x, 0.5, z, 0.7, 1.0, 0.25, 0x8a8a90, ry]);
            this.statics.push([x, 1.02, z, 0.5, 0.08, 0.2, 0x9a9aa0, ry]);
            break;
          }
          case 'b':
            mark(i, j, false);
            mark(i + 1, j, false);
            this.statics.push([x + 0.5, 0.4, z, 1.8, 0.12, 0.5, 0x8a5a2a]);
            this.statics.push([x + 0.5, 0.65, z - 0.22, 1.8, 0.4, 0.08, 0x8a5a2a]);
            this.statics.push([x - 0.25, 0.2, z, 0.1, 0.4, 0.45, 0x2a2a2a]);
            this.statics.push([x + 1.25, 0.2, z, 0.1, 0.4, 0.45, 0x2a2a2a]);
            break;
          case 'F':
            mark(i, j, false);
            this.statics.push([x, 0.35, z, 1, 0.7, 1, 0xa8a49a]);
            break;
          case 'v': {
            mark(i, j, false);
            mark(i + 1, j, false);
            const col = [0x8a2a24, 0x2a4a7a, 0xc8c8c0, 0x3a3a3a][Math.floor(rng() * 4)];
            this.statics.push([x + 0.5, 0.45, z, 1.95, 0.6, 0.95, col]);
            this.statics.push([x + 0.4, 0.95, z, 1.1, 0.45, 0.85, 0x1e2a36]);
            this.statics.push([x + 0.4, 1.2, z, 1.1, 0.06, 0.9, col]);
            for (const [dx, dz] of [[-0.35, -0.48], [-0.35, 0.48], [1.35, -0.48], [1.35, 0.48]]) this.statics.push([x + dx, 0.2, z + dz, 0.38, 0.38, 0.08, 0x111111]);
            break;
          }
          case 'G':
            this.gates.push({ x, z, i, j });
            break;
          default: {
            const sd = SCENERY_BY_CHAR[ch];
            if (sd) this.addScenery(sd, i, j, rng);
          }
        }
      }
    this.paintFloor();
  }

  // elemento da biblioteca de cenário (scenery.js) numa célula
  addScenery(sd, i, j, rng) {
    const k = i + j * this.W;
    const x = i + 0.5;
    const z = j + 0.5;
    if (sd.coll === 'floor') {
      const code = TERRAIN_CODE[sd.id];
      this.terrain[k] = code;
      if (sd.id === 'lava') {
        this.lavaCells.push(k);
        for (let n = 0; n < 2; n++) this.glows.push([x + (rng() - 0.5) * 0.6, 0.012, z + (rng() - 0.5) * 0.6, 0.5 + rng() * 0.3, 0.01, 0.05, n ? 0xffb030 : 0xff6a1a, rng() * 3]);
      }
      if (code === T_TOXIC) this.toxicCells.push(k);
      if (code === T_ELEC) this.elecCells.push(k);
      if (code === T_PLATFORM) this.platformCells.push(k);
      if (BELT_DIR[code]) this.beltCells.set(k, BELT_DIR[code]);
      return;
    }
    if (sd.id === 'xbarrel') {
      this.mapBarrels.push({ i, j, x, z });
      return;
    }
    if (sd.id === 'bush') this.terrain[k] = T_BUSH;
    if (sd.spawn) this.graves.push({ x, z, i, j });
    // células ocupadas (objetos grandes ocupam w×d a partir da âncora)
    const [sw, sdp] = sd.span || [1, 1];
    const cells = [];
    for (let b = 0; b < sdp; b++) for (let a = 0; a < sw; a++) if (this.inb(i + a, j + b)) cells.push((i + a) + (j + b) * this.W);
    const cx = i + sw / 2;
    const cz = j + sdp / 2;
    // gira 90° quando a fileira segue na vertical; fachadas viram para o lado livre
    let rot = 0;
    const map = this.def.map;
    if (sd.orient) {
      const same = (a, b) => map[b]?.[a] === sd.ch;
      if ((same(i, j - 1) || same(i, j + 1)) && !same(i - 1, j) && !same(i + 1, j)) rot = Math.PI / 2;
    } else if (sd.faceOpen) {
      const open = (a, b) => { const c = map[b]?.[a]; return c !== undefined && !'#BKMWYJ$ã%[CT0-2'.includes(c); };
      rot = open(i, j + 1) ? 0 : open(i, j - 1) ? Math.PI : open(i + 1, j) ? Math.PI / 2 : open(i - 1, j) ? -Math.PI / 2 : 0;
    } else if (!sd.span && (sd.coll === 'none' || sd.id === 'deadtree' || sd.id === 'bigrock' || sd.id === 'forklift')) rot = Math.floor(rng() * 4) * (Math.PI / 2);
    const edge = i === 0 || j === 0 || i === this.W - 1 || j === this.D - 1;
    const parts = (edge && sd.edgeModel ? sd.edgeModel : sd.model)(rng);
    if (sd.coll === 'tall' || sd.coll === 'low')
      for (const c of cells) {
        this.block[c] = 1;
        if (sd.coll === 'tall') this.tall[c] = 1;
        if (sd.coll === 'low') this.cover[c] = 1;
      }
    if (sd.hp || sd.knock || sd.light || sd.push || sd.beh === 'interact') {
      // objeto dinâmico: guardado com as peças locais para ser desenhado/destruído/animado
      const n = this.props.length;
      for (const c of cells) this.propGrid[c] = n;
      this.props.push({ def: sd, i, j, x: cx, z: cz, rot, parts, cells, hp: sd.hp || 1, maxHp: sd.hp || 1, dead: false, hurtT: 0, ox: 0, oz: 0, seed: rng() * 9, knocked: false, kx: 0, kz: 0, kr: 0, on: !sd.light?.off, t: 0 });
      return;
    }
    for (const p of placeParts(parts, cx, cz, rot)) (p[8] ? this.glows : this.statics).push(p);
  }

  propAt(i, j) {
    if (!this.inb(i, j)) return null;
    const n = this.propGrid[i + j * this.W];
    const p = n >= 0 ? this.props[n] : null;
    return p && !p.dead ? p : null;
  }
  terrainAt(x, z) {
    const i = Math.floor(x);
    const j = Math.floor(z);
    return this.inb(i, j) ? this.terrain[i + j * this.W] : 0;
  }
  // move um objeto empurrável para outra célula
  moveProp(p, ni, nj) {
    const W = this.W;
    const k0 = p.i + p.j * W;
    const k1 = ni + nj * W;
    const n = this.propGrid[k0];
    this.propGrid[k0] = -1;
    this.block[k0] = 0;
    this.cover[k0] = 0;
    this.propGrid[k1] = n;
    this.block[k1] = 1;
    this.cover[k1] = 1;
    p.ox = p.x - (ni + 0.5);
    p.oz = p.z - (nj + 0.5);
    p.i = ni;
    p.j = nj;
    p.x = ni + 0.5;
    p.z = nj + 0.5;
    p.cells = [k1];
  }
  // libera a célula de um objeto destruído
  clearProp(p) {
    p.dead = true;
    for (const k of p.cells || [p.i + p.j * this.W]) {
      this.propGrid[k] = -1;
      if (p.def.coll !== 'none') {
        this.block[k] = 0;
        this.tall[k] = 0;
        this.cover[k] = 0;
      }
    }
    if (p.light) p.light.intensity = 0;
  }
  // portão ou porta: bloqueia/libera as células do objeto (usado pelo console de portões)
  setPropBlock(p, on) {
    for (const k of p.cells || []) {
      this.block[k] = on ? 1 : 0;
      this.tall[k] = on ? 1 : 0;
    }
  }
  // direção da esteira na posição (null se não houver)
  beltAt(x, z) {
    const i = Math.floor(x);
    const j = Math.floor(z);
    if (!this.inb(i, j)) return null;
    return this.beltCells.get(i + j * this.W) || null;
  }
  onPlatform(x, z) {
    const i = Math.floor(x);
    const j = Math.floor(z);
    return this.inb(i, j) && this.terrain[i + j * this.W] === T_PLATFORM;
  }

  // fase do semáforo: verde 4 s, amarelo 1,2 s, vermelho 4 s
  static trafficPhase(t) {
    const c = t % 9.2;
    return c < 4 ? 'g' : c < 5.2 ? 'y' : 'r';
  }
  drawProps(B, G, t, withBarrels = false) {
    for (const p of this.props) {
      if (p.dead) continue;
      const flash = p.hurtT > 0;
      const x = p.x + p.ox;
      const z = p.z + p.oz;
      if (p.knocked) {
        // cone caído: deitado na direção do empurrão
        const c = Math.cos(p.kr);
        const s = Math.sin(p.kr);
        for (const q of p.parts) {
          const along = q[1] - 0.28;
          B.box(x + p.kx + along * s, 0.14, z + p.kz + along * c, q[3], q[5], q[4], flash ? 0xffffff : q[6], p.kr);
        }
        continue;
      }
      const c = Math.cos(p.rot);
      const s = Math.sin(p.rot);
      const phase = p.def.id === 'traffic' ? Arena.trafficPhase(t + p.seed) : null;
      const half = p.def.id === 'sandbags' && p.hp < p.maxHp * 0.5;
      const blink = Math.sin(t * 14 + p.seed) > 0;
      for (const q of p.parts) {
        if (half && q[9] === 'top') continue;
        const tag = q[9];
        let qy = q[1];
        let qx = q[0];
        // animações por marca: pilão da prensa, sino balançando
        if (tag === 'ram') qy = p.ramY ?? q[1];
        if (tag === 'bell') qx += Math.sin(t * 9) * (p.swingT || 0) * 0.3;
        // árvore retorcida tombando: gira as peças em torno da base
        if (p.fallA) {
          const fa = Math.cos(p.fallA);
          const fb = Math.sin(p.fallA);
          const ox = qx;
          qx = ox * fa - qy * fb;
          qy = ox * fb + qy * fa;
        }
        const wx = x + qx * c + q[2] * s;
        const wz = z - qx * s + q[2] * c;
        if (q[8]) {
          // brilho ligado/desligado conforme o estado do objeto
          let on = !phase || tag === phase;
          if (tag === 'bulb' || tag === 'gen' || tag === 'screen') on = p.on !== false;
          if (tag === 'hl' || tag === 'tl') on = p.alarmT > 0 ? blink : false;
          if (tag === 'warn') on = !!p.warn && blink;
          if (tag === 'cap') on = !(p.spentT > 0);
          if (tag === 'gl') on = !!p.closed;
          if (tag === 'beacon') on = p.on !== false && Math.sin(t * 6 + p.seed) > -0.2;
          let col = q[6];
          let sy = q[4];
          if (tag === 'fire' || tag === 'flame') {
            sy *= 0.75 + Math.random() * 0.5;
            col = Math.random() < 0.3 ? 0xffd060 : q[6];
          }
          (on ? G : B).box(wx, qy, wz, q[3], sy, q[5], on ? col : 0x2a2a2a, (q[7] || 0) + p.rot);
        } else B.box(wx, qy, wz, q[3], q[4], q[5], flash ? 0xffffff : q[6], (q[7] || 0) + p.rot);
      }
      // giroflex: facho girando
      if (p.def.id === 'beacon' && p.on !== false) {
        const a = t * 5 + p.seed;
        G.box(x + Math.sin(a) * 0.45, 0.5, z + Math.cos(a) * 0.45, 0.06, 0.08, 0.7, 0xff6020, a);
      }
    }
    if (withBarrels) for (const b of this.mapBarrels) for (const q of BARREL_MODEL) B.box(b.x + q[0], q[1], b.z + q[2], q[3], q[4], q[5], q[6]);
  }
  updateProps(dt) {
    for (const p of this.props) {
      if (p.dead) continue;
      p.hurtT = Math.max(0, p.hurtT - dt);
      const k = Math.exp(-dt * 12);
      p.ox *= k;
      p.oz *= k;
      if (Math.abs(p.ox) < 0.002) p.ox = 0;
      if (Math.abs(p.oz) < 0.002) p.oz = 0;
    }
  }

  idx(i, j) {
    return i + j * this.W;
  }
  inb(i, j) {
    return i >= 0 && j >= 0 && i < this.W && j < this.D;
  }
  blocked(i, j) {
    if (!this.inb(i, j)) return true;
    const k = i + j * this.W;
    return this.block[k] === 1 || this.dyn[k] !== 0;
  }
  tallAt(x, z) {
    const i = Math.floor(x);
    const j = Math.floor(z);
    if (!this.inb(i, j)) return true;
    return this.tall[i + j * this.W] === 1;
  }

  // ------------------------------------------------------------ colisão círculo x grade
  circleBlocked(x, z, r, ignoreDyn = false) {
    const i0 = Math.floor(x - r);
    const i1 = Math.floor(x + r);
    const j0 = Math.floor(z - r);
    const j1 = Math.floor(z + r);
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) {
        if (!this.inb(i, j)) return true;
        const k = i + j * this.W;
        if (!this.block[k] && (ignoreDyn || !this.dyn[k])) continue;
        const cx = x < i ? i : x > i + 1 ? i + 1 : x;
        const cz = z < j ? j : z > j + 1 ? j + 1 : z;
        if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return true;
      }
    return false;
  }
  depenetrate(pos, r) {
    for (let it = 0; it < 3; it++) {
      let moved = false;
      const i0 = Math.floor(pos.x - r);
      const i1 = Math.floor(pos.x + r);
      const j0 = Math.floor(pos.z - r);
      const j1 = Math.floor(pos.z + r);
      for (let j = j0; j <= j1; j++)
        for (let i = i0; i <= i1; i++) {
          if (!this.inb(i, j)) continue;
          const k = i + j * this.W;
          if (!this.block[k] && !this.dyn[k]) continue;
          const cx = pos.x < i ? i : pos.x > i + 1 ? i + 1 : pos.x;
          const cz = pos.z < j ? j : pos.z > j + 1 ? j + 1 : pos.z;
          const dx = pos.x - cx;
          const dz = pos.z - cz;
          const d2 = dx * dx + dz * dz;
          if (d2 >= r * r || d2 < 1e-10) continue;
          const d = Math.sqrt(d2);
          pos.x += (dx / d) * (r - d + 0.002);
          pos.z += (dz / d) * (r - d + 0.002);
          moved = true;
        }
      if (!moved) break;
    }
  }
  // move resolvendo eixo a eixo; retorna true se bateu
  move(pos, dx, dz, r) {
    pos.x = Math.min(this.W - r - 0.01, Math.max(r + 0.01, pos.x));
    pos.z = Math.min(this.D - r - 0.01, Math.max(r + 0.01, pos.z));
    if (this.circleBlocked(pos.x, pos.z, r)) this.depenetrate(pos, r);
    let hit = false;
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / 0.2));
    const sx = dx / steps;
    const sz = dz / steps;
    for (let k = 0; k < steps; k++) {
      if (sx && !this.circleBlocked(pos.x + sx, pos.z, r)) pos.x += sx;
      else if (sx) hit = true;
      if (sz && !this.circleBlocked(pos.x, pos.z + sz, r)) pos.z += sz;
      else if (sz) hit = true;
    }
    return hit;
  }

  // distância livre ao longo de um raio até um bloco alto (tiros)
  rayFree(ox, oz, dx, dz, maxT) {
    const step = 0.12;
    for (let t = 0; t < maxT; t += step) if (this.tallAt(ox + dx * t, oz + dz * t)) return Math.max(0, t - step);
    return maxT;
  }
  los(ax, az, bx, bz) {
    const d = Math.hypot(bx - ax, bz - az);
    if (d < 0.01) return true;
    return this.rayFree(ax, az, (bx - ax) / d, (bz - az) / d, d) >= d - 0.05;
  }

  // caminho reto andável (considera obstáculos baixos e barricadas, que não bloqueiam tiros)
  walkable(ax, az, bx, bz, r) {
    const d = Math.hypot(bx - ax, bz - az);
    const n = Math.ceil(d / 0.3);
    for (let k = 1; k < n; k++) {
      const t = k / n;
      if (this.circleBlocked(ax + (bx - ax) * t, az + (bz - az) * t, r)) return false;
    }
    return true;
  }

  // ------------------------------------------------------------ campo de fluxo (Dijkstra, várias origens)
  computeFlow(sources) {
    const W = this.W;
    const D = this.D;
    const dist = this.dist;
    dist.fill(0x3fffffff);
    const heap = this.heap || (this.heap = []);
    heap.length = 0;
    const push = (k, d) => {
      heap.push(d * 4096 + k);
      let i = heap.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if (heap[p] <= heap[i]) break;
        [heap[p], heap[i]] = [heap[i], heap[p]];
        i = p;
      }
    };
    const pop = () => {
      const top = heap[0];
      const last = heap.pop();
      if (heap.length) {
        heap[0] = last;
        let i = 0;
        for (;;) {
          const l = i * 2 + 1;
          const r = l + 1;
          let m = i;
          if (l < heap.length && heap[l] < heap[m]) m = l;
          if (r < heap.length && heap[r] < heap[m]) m = r;
          if (m === i) break;
          [heap[m], heap[i]] = [heap[i], heap[m]];
          i = m;
        }
      }
      return top;
    };
    for (const s of sources) {
      const i = Math.floor(s.x);
      const j = Math.floor(s.z);
      if (!this.inb(i, j)) continue;
      dist[i + j * W] = 0;
      push(i + j * W, 0);
    }
    const NB = [[1, 0, 10], [-1, 0, 10], [0, 1, 10], [0, -1, 10], [1, 1, 14], [1, -1, 14], [-1, 1, 14], [-1, -1, 14]];
    while (heap.length) {
      const v = pop();
      const k = v % 4096;
      const d = (v - k) / 4096;
      if (d > dist[k]) continue;
      const i = k % W;
      const j = (k - i) / W;
      for (const [di, dj, c] of NB) {
        const ni = i + di;
        const nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= W || nj >= D) continue;
        const nk = ni + nj * W;
        if (this.block[nk] || this.dyn[nk] === 2) continue;
        if (di && dj && (this.block[i + di + j * W] || this.block[i + (j + dj) * W] || this.dyn[i + di + j * W] || this.dyn[i + (j + dj) * W])) continue;
        // barricada: caro, mas atravessável (zumbis a quebram); lava: evitada; água/arbusto: um pouco mais caros
        const tr = this.terrain[nk];
        const nd = d + c + (this.dyn[nk] === 1 ? 90 : 0) + (tr === T_LAVA ? 150 : tr === T_WATER ? 6 : tr === T_BUSH ? 3 : 0);
        if (nd < dist[nk]) {
          dist[nk] = nd;
          push(nk, nd);
        }
      }
    }
  }
  // direção para o vizinho de menor custo; out = {x, z, i, j}
  flowDir(x, z, out) {
    const W = this.W;
    const i = Math.floor(x);
    const j = Math.floor(z);
    if (!this.inb(i, j)) return false;
    let best = this.dist[i + j * W];
    let bi = -1;
    let bj = -1;
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const ni = i + di;
        const nj = j + dj;
        if (!this.inb(ni, nj)) continue;
        const d = this.dist[ni + nj * W];
        if (d < best) {
          if (di && dj && (this.blocked(i + di, j) || this.blocked(i, j + dj))) continue;
          best = d;
          bi = ni;
          bj = nj;
        }
      }
    if (bi < 0) return false;
    const tx = bi + 0.5 - x;
    const tz = bj + 0.5 - z;
    const l = Math.hypot(tx, tz) || 1;
    out.x = tx / l;
    out.z = tz / l;
    out.i = bi;
    out.j = bj;
    return true;
  }

  // ------------------------------------------------------------ chão pintado + sangue
  paintFloor() {
    const W = this.W * PX;
    const H = this.D * PX;
    const cv = document.createElement('canvas');
    cv.width = W;
    cv.height = H;
    const g = cv.getContext('2d');
    const rng = mulberry32(this.W * 31 + this.def.id.charCodeAt(0));
    const type = this.def.floor;
    if (type === 'grass' || type === 'graveyard' || type === 'wild') {
      const base = type !== 'graveyard' ? ['#3d6132', '#456a37', '#35552c', '#4b7040'] : ['#2e3e2a', '#334530', '#283825', '#3a4a33'];
      for (let j = 0; j < this.D * 4; j++)
        for (let i = 0; i < this.W * 4; i++) {
          g.fillStyle = base[Math.floor(rng() * base.length)];
          g.fillRect(i * PX / 4, j * PX / 4, PX / 4 + 1, PX / 4 + 1);
        }
      // manchas de terra
      for (let k = 0; k < 40; k++) {
        g.fillStyle = type !== 'graveyard' ? 'rgba(110,84,52,0.35)' : 'rgba(70,56,40,0.4)';
        const x = rng() * W;
        const y = rng() * H;
        for (let n = 0; n < 8; n++) g.fillRect(x + (rng() - 0.5) * 60, y + (rng() - 0.5) * 40, 8 + rng() * 24, 8 + rng() * 16);
      }
      if (type === 'grass') {
        // caminhos de pedra em cruz até a fonte
        g.fillStyle = '#9a9488';
        const cx = Math.floor(this.W / 2);
        const cz = Math.floor(this.D / 2);
        g.fillRect((cx - 2) * PX, 1 * PX, 4 * PX, (this.D - 2) * PX);
        g.fillRect(1 * PX, (cz - 2) * PX, (this.W - 2) * PX, 4 * PX);
        g.strokeStyle = 'rgba(0,0,0,0.18)';
        for (let y = PX; y < H - PX; y += PX / 2) for (let x = (cx - 2) * PX; x < (cx + 2) * PX; x += PX / 2) g.strokeRect(x, y, PX / 2, PX / 2);
        for (let x = PX; x < W - PX; x += PX / 2) for (let y = (cz - 2) * PX; y < (cz + 2) * PX; y += PX / 2) g.strokeRect(x, y, PX / 2, PX / 2);
      }
    } else {
      for (let j = 0; j < this.D; j++)
        for (let i = 0; i < this.W; i++) {
          const v = 88 + Math.floor(rng() * 14);
          if (type === 'industrial') g.fillStyle = `rgb(${v + 8},${v + 2},${v - 8})`; // cinza quente, não azul
          else g.fillStyle = `rgb(${v},${v + 2},${v + 4})`;
          g.fillRect(i * PX, j * PX, PX, PX);
          g.strokeStyle = 'rgba(0,0,0,0.25)';
          g.strokeRect(i * PX + 0.5, j * PX + 0.5, PX - 1, PX - 1);
        }
      for (let k = 0; k < 25; k++) {
        g.fillStyle = 'rgba(20,20,20,0.25)';
        g.beginPath();
        g.ellipse(rng() * W, rng() * H, 20 + rng() * 40, 12 + rng() * 25, rng() * 3, 0, Math.PI * 2);
        g.fill();
      }
      // faixas amarelas de segurança
      g.fillStyle = '#c8a020';
      for (let x = 2 * PX; x < W - 2 * PX; x += PX) g.fillRect(x, Math.floor(this.D / 2) * PX - 4, PX / 2, 8);
    }
    // blocos de terreno da biblioteca de cenário
    for (let j = 0; j < this.D; j++)
      for (let i = 0; i < this.W; i++) {
        const name = TERRAIN_NAMES[this.terrain[i + j * this.W]];
        if (name) TERRAIN_PAINT[name](g, i * PX, j * PX, PX, rng);
      }
    // chão do portão
    for (const gt of this.gates) {
      g.fillStyle = 'rgba(30,20,15,0.6)';
      g.fillRect(gt.i * PX, gt.j * PX, PX, PX);
    }
    // água da fonte
    for (let j = 0; j < this.D; j++)
      for (let i = 0; i < this.W; i++)
        if (this.def.map[j][i] === '.' && this.enclosedByF(i, j)) {
          g.fillStyle = '#2a6aa8';
          g.fillRect(i * PX, j * PX, PX, PX);
        }
    this.canvas = cv;
    this.ctx = g;
    this.tex = new THREE.CanvasTexture(cv);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 4;
    this.dirty = false;
    this.uploadT = 0;
  }
  enclosedByF(i, j) {
    const row = this.def.map[j];
    return row.lastIndexOf('F', i) >= 0 && row.indexOf('F', i) >= 0 && this.def.map[j - 1]?.[i] !== undefined && /F/.test(row.slice(0, i)) && /F/.test(row.slice(i)) && this.colHasF(i, j, -1) && this.colHasF(i, j, 1);
  }
  colHasF(i, j, dir) {
    for (let y = j + dir; y >= 0 && y < this.D; y += dir) {
      const c = this.def.map[y][i];
      if (c === 'F') return true;
      if (c !== '.') return false;
    }
    return false;
  }

  splat(x, z, size, color = '#7a0a08', alpha = 0.85) {
    const g = this.ctx;
    const cx = x * PX;
    const cy = z * PX;
    const r = size * PX;
    g.globalAlpha = alpha;
    g.fillStyle = color;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();
    for (let k = 0; k < 4; k++) {
      const a = Math.random() * Math.PI * 2;
      const d = r * (0.8 + Math.random() * 0.9);
      g.beginPath();
      g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, r * (0.15 + Math.random() * 0.35), 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    this.dirty = true;
  }
  scorch(x, z, r) {
    const g = this.ctx;
    const grd = g.createRadialGradient(x * PX, z * PX, 0, x * PX, z * PX, r * PX);
    grd.addColorStop(0, 'rgba(15,10,8,0.85)');
    grd.addColorStop(1, 'rgba(15,10,8,0)');
    g.fillStyle = grd;
    g.beginPath();
    g.arc(x * PX, z * PX, r * PX, 0, Math.PI * 2);
    g.fill();
    this.dirty = true;
  }
  updateTexture(dt) {
    this.uploadT -= dt;
    if (this.dirty && this.uploadT <= 0) {
      this.tex.needsUpdate = true;
      this.dirty = false;
      this.uploadT = 0.12;
    }
  }

  // ------------------------------------------------------------ malhas
  build(scene, quality) {
    this.objects = [];
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(this.W, this.D), new THREE.MeshLambertMaterial({ map: this.tex }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(this.W / 2, 0, this.D / 2);
    floor.receiveShadow = true;
    scene.add(floor);
    this.objects.push(floor);
    // borda escura além do mapa
    const outer = new THREE.Mesh(new THREE.PlaneGeometry(this.W + 80, this.D + 80), new THREE.MeshLambertMaterial({ color: 0x14100e }));
    outer.rotation.x = -Math.PI / 2;
    outer.position.set(this.W / 2, -0.02, this.D / 2);
    scene.add(outer);
    this.objects.push(outer);
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), this.statics.length);
    this.statics.forEach((b, k) => {
      _q.setFromAxisAngle(_up, b[7] || 0);
      _m.compose(_p.set(b[0], b[1], b[2]), _q, _s.set(b[3], b[4], b[5]));
      im.setMatrixAt(k, _m);
      im.setColorAt(k, _c.setHex(b[6]));
    });
    im.castShadow = quality !== 'low';
    im.receiveShadow = true;
    scene.add(im);
    this.objects.push(im);
    this.instanced = im;
    // peças que brilham (fissuras de lava, lâmpadas fixas)
    if (this.glows.length) {
      const gm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ toneMapped: false }), this.glows.length);
      this.glows.forEach((b, k) => {
        _q.setFromAxisAngle(_up, b[7] || 0);
        _m.compose(_p.set(b[0], b[1], b[2]), _q, _s.set(b[3], b[4], b[5]));
        gm.setMatrixAt(k, _m);
        gm.setColorAt(k, _c.setHex(b[6]));
      });
      scene.add(gm);
      this.objects.push(gm);
    }
    // lâmina d'água translúcida sobre o piso azul
    const water = [];
    for (let k = 0; k < this.terrain.length; k++) if (this.terrain[k] === T_WATER) water.push(k);
    if (water.length) {
      const wm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: 0x6ab0ff, transparent: true, opacity: 0.35, depthWrite: false }), water.length);
      water.forEach((k, n) => {
        _m.compose(_p.set((k % this.W) + 0.5, 0.05, Math.floor(k / this.W) + 0.5), _q.identity(), _s.set(1, 0.04, 1));
        wm.setMatrixAt(n, _m);
      });
      wm.receiveShadow = true;
      scene.add(wm);
      this.objects.push(wm);
    }
    // postes: luz de verdade (até 6 por arena, criadas já no início para não recompilar materiais)
    this.lights = [];
    const maxLights = this.def.maxLights ?? 8;
    for (const p of this.props) {
      if (!p.def.light || this.lights.length >= maxLights) continue;
      // poste antigo (light: true) ou configuração { at, i, dist, color, off }
      const cfg = p.def.light === true ? { at: [0.6, 2.6, 0], i: this.def.lampI ?? 14, dist: 9, color: 0xffd890, off: this.def.lampsOff } : p.def.light;
      const [ax, ay, az] = cfg.at;
      const l = new THREE.PointLight(cfg.color, 0, cfg.dist, 1.4);
      l.position.set(p.x + ax * Math.cos(p.rot) + az * Math.sin(p.rot), ay, p.z - ax * Math.sin(p.rot) + az * Math.cos(p.rot));
      p.lightI = cfg.i * (p.def.light === true ? 1 : this.def.lightMul ?? 1);
      p.on = !cfg.off;
      l.intensity = p.on ? p.lightI : 0;
      scene.add(l);
      this.lights.push(l);
      p.light = l;
    }
  }
  // liga/desliga a luz de um objeto (postes, holofotes)
  setPropLight(p, on) {
    p.on = on;
    if (p.light) p.light.intensity = on ? p.lightI : 0;
  }
  dispose(scene) {
    for (const o of this.objects || []) {
      scene.remove(o);
      o.geometry.dispose();
      o.material.map?.dispose();
      o.material.dispose();
      if (o.isInstancedMesh) o.dispose();
    }
    for (const l of this.lights || []) scene.remove(l);
    this.lights = [];
    this.instanced = null;
  }
}
