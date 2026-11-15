import * as THREE from 'three';

const _m = new THREE.Matrix4();
const _l = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _e = new THREE.Euler();
const _c = new THREE.Color();

// Lote de caixas: todos os personagens, partículas, projéteis e objetos dinâmicos
// são desenhados como cubos de um único InstancedMesh (uma chamada de desenho).
export class BoxBatch {
  constructor(scene, max = 9000, { shadows = true, emissive = false } = {}) {
    const mat = emissive ? new THREE.MeshBasicMaterial({ toneMapped: false }) : new THREE.MeshLambertMaterial();
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat, max);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.setColorAt(0, _c.set(0xffffff));
    this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    this.mesh.castShadow = shadows;
    this.mesh.receiveShadow = false;
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.max = max;
    this.n = 0;
    scene.add(this.mesh);
  }
  begin() {
    this.n = 0;
  }
  // caixa simples alinhada (com rotação Y opcional)
  box(x, y, z, sx, sy, sz, color, ry = 0) {
    if (this.n >= this.max) return;
    _e.set(0, ry, 0);
    _q.setFromEuler(_e);
    _m.compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz));
    this.mesh.setMatrixAt(this.n, _m);
    this.mesh.setColorAt(this.n, _c.setHex(color));
    this.n++;
  }
  // caixa a partir de uma matriz-base (personagem) + transformação local
  part(base, px, py, pz, rx, rz, cx, cy, cz, sx, sy, sz, color) {
    if (this.n >= this.max) return;
    // pivô local -> rotação -> deslocamento do centro da peça -> escala
    _e.set(rx, 0, rz);
    _q.setFromEuler(_e);
    _l.compose(_p.set(px, py, pz), _q, _s.set(1, 1, 1));
    _m.multiplyMatrices(base, _l);
    _l.makeTranslation(cx, cy, cz);
    _m.multiply(_l);
    _l.makeScale(sx, sy, sz);
    _m.multiply(_l);
    this.mesh.setMatrixAt(this.n, _m);
    this.mesh.setColorAt(this.n, _c.setHex(color));
    this.n++;
  }
  // caixa com matriz pronta (já com posição, rotação e escala)
  mat(m, color) {
    if (this.n >= this.max) return;
    this.mesh.setMatrixAt(this.n, m);
    this.mesh.setColorAt(this.n, _c.setHex(color));
    this.n++;
  }
  end() {
    this.mesh.count = this.n;
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.instanceColor.needsUpdate = true;
  }
}

const _base = new THREE.Matrix4();
export function baseMatrix(x, y, z, ry, scale, tiltX = 0) {
  _e.set(tiltX, ry, 0, 'YXZ');
  _q.setFromEuler(_e);
  return _base.compose(_p.set(x, y, z), _q, _s.set(scale, scale, scale));
}

// Ossos do personagem: matriz = base · translação(pivô) · rotação(rx, rz)
const _one = new THREE.Vector3(1, 1, 1);
const _bl = new THREE.Matrix4();
const BONES = { root: null, head: new THREE.Matrix4(), torso: new THREE.Matrix4(), armL: new THREE.Matrix4(), armR: new THREE.Matrix4(), legL: new THREE.Matrix4(), legR: new THREE.Matrix4() };
function bone(out, base, px, py, pz, rx, rz) {
  _e.set(rx, 0, rz);
  _q.setFromEuler(_e);
  _bl.compose(_p.set(px, py, pz), _q, _one);
  return out.multiplyMatrices(base, _bl);
}

// Personagem "cabeça de caixa". Frente = +z; o lado direito do personagem é -x. Medidas em metros (escala 1).
// Espaço local de cada osso (pivô na articulação):
//   head  x ±0.27, y 0..0.54, z ±0.27     torso x ±0.27, y 0..0.52, z ±0.16
//   armL/armR (ombro) y 0..-0.46, x ±0.085, z ±0.095    legL/legR (quadril) y 0..-0.46
// look.extras: [osso, cx, cy, cz, sx, sy, sz, cor, rx?, rz?, brilho?] — peças presas a um osso.
// pose: { walk, swing, tilt, lean, headTilt, hurt, attack, aim, recoil, gun:{len,color}, G (lote emissivo) }
export function drawCharacter(B, x, y, z, ry, scale, look, pose) {
  const base = baseMatrix(x, y, z, ry, scale, pose.tilt || 0);
  const s = Math.sin(pose.walk || 0) * (pose.swing || 0);
  const flash = pose.hurt > 0;
  const col = (c) => (flash ? 0xffffff : c);
  const bob = Math.abs(s) * 0.03;
  const lean = pose.lean || 0;
  BONES.root = base;
  const legL = bone(BONES.legL, base, 0.13, 0.46, 0, s * 0.9, 0);
  const legR = bone(BONES.legR, base, -0.13, 0.46, 0, -s * 0.9, 0);
  const torso = bone(BONES.torso, base, 0, 0.46 + bob, 0, lean, 0);
  const head = bone(BONES.head, base, 0, 0.98 + bob, 0, lean * 0.5, pose.headTilt || 0);
  const shY = 0.9 + bob;
  let armR;
  let armL;
  const arms = look.arms || (look.zombie ? 'reach' : 'gun');
  const atk = pose.attack || 0;
  const raise = pose.raise || 0;
  if (arms === 'reach') {
    const a = -1.45 + Math.sin((pose.walk || 0) * 0.5) * 0.12 + atk * -0.6;
    armL = bone(BONES.armL, base, 0.34, shY, 0, a, 0);
    armR = bone(BONES.armR, base, -0.34, shY, 0, a + 0.1, 0);
  } else if (arms === 'run') {
    armL = bone(BONES.armL, base, 0.34, shY, 0, -0.35 - s * 1.3 - atk * 1.1, 0.12);
    armR = bone(BONES.armR, base, -0.34, shY, 0, -0.35 + s * 1.3 - atk * 1.1, -0.12);
  } else if (arms === 'brawl') {
    // braços pesados abertos; ataque = soco alternado; raise = ergue os dois (pancada no chão)
    const up = raise > 0 ? -2.9 * raise : 0;
    armL = bone(BONES.armL, base, 0.36, shY, 0, up || -0.25 - s * 0.35 - atk * 1.3, 0.28 * (1 - raise));
    armR = bone(BONES.armR, base, -0.36, shY, 0, up || -0.25 + s * 0.35 - atk * 0.6, -0.28 * (1 - raise));
  } else if (arms === 'shield') {
    armL = bone(BONES.armL, base, 0.34, shY, 0, -1.3, -0.35);
    armR = bone(BONES.armR, base, -0.34, shY, 0, -0.3 + s * 0.4 - atk * 1.3, -0.1);
  } else if (arms === 'staff') {
    armR = bone(BONES.armR, base, -0.34, shY, 0, -1.15 - raise * 0.9, -0.22);
    armL = bone(BONES.armL, base, 0.34, shY, 0, -0.2 + s * 0.3 - atk * 1.2 - raise * 1.4, 0.12 + raise * 0.3);
  } else if (pose.melee) {
    // golpe: prepara (ergue o braço), desce e volta
    const m = pose.melee;
    const k = m.k;
    const lerp = (a, b, t) => a + (b - a) * t;
    const a = k < 0.3 ? lerp(-1.3, m.a0, k / 0.3) : k < 0.55 ? lerp(m.a0, m.a1, (k - 0.3) / 0.25) : lerp(m.a1, -1.3, (k - 0.55) / 0.45);
    armR = bone(BONES.armR, base, -0.34, shY, 0, a, -0.15);
    armL = bone(BONES.armL, base, 0.34, shY, 0, -0.5, 0.25);
  } else {
    const aimR = pose.aim ? -1.5 + (pose.recoil || 0) * 0.35 : -0.25 - s * 0.6;
    const twoHands = pose.aim && !look.oneHanded;
    armR = bone(BONES.armR, base, -0.34, shY, 0, aimR, 0);
    armL = bone(BONES.armL, base, 0.34, shY, 0, twoHands ? -1.35 : -0.15 + s * 0.6, twoHands ? -0.45 : 0.06);
  }
  // corpo base
  const sleeve = look.sleeve ?? (look.zombie ? look.skin : look.shirt);
  B.part(legL, 0, 0, 0, 0, 0, 0, -0.23, 0, 0.21, 0.46, 0.24, col(look.pants));
  B.part(legR, 0, 0, 0, 0, 0, 0, -0.23, 0, 0.21, 0.46, 0.24, col(look.pants));
  if (look.boots !== undefined) {
    B.part(legL, 0, 0, 0, 0, 0, 0, -0.4, 0.025, 0.23, 0.13, 0.29, col(look.boots));
    B.part(legR, 0, 0, 0, 0, 0, 0, -0.4, 0.025, 0.23, 0.13, 0.29, col(look.boots));
  }
  B.part(torso, 0, 0, 0, 0, 0, 0, 0.26, 0, 0.54, 0.52, 0.32, col(look.shirt));
  if (look.stain) B.part(torso, 0, 0, 0, 0, 0, 0.1, 0.3, 0.165, 0.2, 0.22, 0.01, col(0x7a0e0a));
  B.part(head, 0, 0, 0, 0, 0, 0, 0.27, 0, 0.54, 0.54, 0.54, col(look.skin));
  if (!look.noFace) {
    B.part(head, 0, 0, 0, 0, 0, 0.13, 0.32, 0.275, 0.09, look.zombie ? 0.05 : 0.09, 0.02, look.eyes);
    B.part(head, 0, 0, 0, 0, 0, -0.13, 0.32, 0.275, 0.09, look.zombie ? 0.05 : 0.09, 0.02, look.eyes);
    if (look.zombie) B.part(head, 0, 0, 0, 0, 0, 0, 0.13, 0.275, 0.24, 0.06, 0.02, 0x3a0e0e);
  }
  B.part(armL, 0, 0, 0, 0, 0, 0, -0.22, 0, 0.17, 0.46, 0.19, col(sleeve));
  B.part(armR, 0, 0, 0, 0, 0, 0, -0.22, 0, 0.17, 0.46, 0.19, col(sleeve));
  if (look.hands !== undefined) {
    B.part(armL, 0, 0, 0, 0, 0, 0, -0.45, 0, 0.18, 0.12, 0.2, col(look.hands));
    B.part(armR, 0, 0, 0, 0, 0, 0, -0.45, 0, 0.18, 0.12, 0.2, col(look.hands));
  }
  // acessórios do modelo
  const G = pose.G;
  if (look.extras)
    for (const e of look.extras) {
      const m = BONES[e[0]];
      const glow = e[10] && G;
      (glow ? G : B).part(m, e[1], e[2], e[3], e[8] || 0, e[9] || 0, 0, 0, 0, e[4], e[5], e[6], glow ? e[7] : col(e[7]));
    }
  // equipamento coletado (capacete, colete, mochila, lanterna) — mesmo formato de extras
  if (pose.gear)
    for (const e of pose.gear) {
      const glow = e[10] && G;
      (glow ? G : B).part(BONES[e[0]], e[1], e[2], e[3], e[8] || 0, e[9] || 0, 0, 0, 0, e[4], e[5], e[6], glow ? e[7] : col(e[7]));
    }
  // lâmina do golpe ou arma na mão direita
  const held = arms === 'gun' ? (pose.melee ? pose.melee.model : pose.gun?.model) : null;
  if (held) {
    // peça: [f, u, s, lf, lu, ls, cor, brilho] — f para a frente da empunhadura (−y do braço), u para cima (+z)
    for (const p of held) (p[7] && G ? G : B).part(armR, 0, 0, 0, 0, 0, p[2], -0.42 - p[0], 0.02 + p[1], p[5], p[3], p[4], p[7] ? p[6] : col(p[6]));
    if (look.gunGlow && G && !pose.melee && pose.gun) G.part(armR, 0, 0, 0, 0, 0, -0.052, -0.42 - pose.gun.len * 0.5, 0.06, 0.012, pose.gun.len * 0.8, 0.04, look.gunGlow);
  } else if (pose.gun && arms === 'gun' && !pose.melee) {
    const g = pose.gun;
    B.part(armR, 0, 0, 0, 0, 0, 0, -0.4 - g.len * 0.5, 0.04, 0.1, g.len, 0.13, g.color);
    if (look.gunGlow && G) G.part(armR, 0, 0, 0, 0, 0, -0.052, -0.42 - g.len * 0.5, 0.06, 0.012, g.len * 0.8, 0.04, look.gunGlow);
  }
}

// Partículas em cubo (sangue, faíscas, fogo, fumaça) com gravidade e quique.
export class Particles {
  constructor(max = 2500) {
    this.max = max;
    const F = Float32Array;
    this.px = new F(max); this.py = new F(max); this.pz = new F(max);
    this.vx = new F(max); this.vy = new F(max); this.vz = new F(max);
    this.size = new F(max); this.life = new F(max); this.maxLife = new F(max); this.grav = new F(max);
    this.color = new Uint32Array(max);
    this.kind = new Uint8Array(max);
    this.n = 0;
  }
  spawn(x, y, z, vx, vy, vz, size, color, life, grav = 18, kind = 0) {
    let i = this.n;
    if (i >= this.max) i = Math.floor(Math.random() * this.max);
    else this.n++;
    this.px[i] = x; this.py[i] = y; this.pz[i] = z;
    this.vx[i] = vx; this.vy[i] = vy; this.vz[i] = vz;
    this.size[i] = size; this.life[i] = life; this.maxLife[i] = life; this.grav[i] = grav;
    this.color[i] = color; this.kind[i] = kind;
  }
  update(dt, onLand) {
    for (let i = 0; i < this.n; i++) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        const j = --this.n;
        this.px[i] = this.px[j]; this.py[i] = this.py[j]; this.pz[i] = this.pz[j];
        this.vx[i] = this.vx[j]; this.vy[i] = this.vy[j]; this.vz[i] = this.vz[j];
        this.size[i] = this.size[j]; this.life[i] = this.life[j]; this.maxLife[i] = this.maxLife[j]; this.grav[i] = this.grav[j];
        this.color[i] = this.color[j]; this.kind[i] = this.kind[j];
        i--;
        continue;
      }
      this.vy[i] -= this.grav[i] * dt;
      this.px[i] += this.vx[i] * dt;
      this.py[i] += this.vy[i] * dt;
      this.pz[i] += this.vz[i] * dt;
      if (this.py[i] < this.size[i] * 0.5 && this.vy[i] < 0) {
        this.py[i] = this.size[i] * 0.5;
        if (this.kind[i] === 1 && onLand) {
          onLand(this.px[i], this.pz[i], this.size[i]);
          this.life[i] = Math.min(this.life[i], 0.05);
        }
        this.vy[i] *= -0.25;
        this.vx[i] *= 0.6;
        this.vz[i] *= 0.6;
      }
    }
  }
  draw(B, G) {
    for (let i = 0; i < this.n; i++) {
      const k = this.kind[i];
      let s = this.size[i];
      if (k === 2) s *= this.life[i] / this.maxLife[i]; // fogo/fumaça encolhe
      (k === 2 ? G : B).box(this.px[i], this.py[i], this.pz[i], s, s, s, this.color[i]);
    }
  }
}
