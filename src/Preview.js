import * as THREE from 'three';
import { BoxBatch, drawCharacter } from './render.js';
import { Arena } from './Arena.js';
import { ENEMIES } from './data.js';
import { enemyLook, drawEnemy } from './monsters.js';
import { ITEMS, drawItem, GUN_MODELS } from './items.js';
import { SCENERY } from './scenery.js';
import { mulberry32 } from './core/rng.js';
import { MOUNTS, drawMount } from './mounts.js';

// Renderizador pequeno e separado para mostrar os sobreviventes em 3D nos menus.
// Desenha um personagem por vez e copia a imagem para o <canvas> 2D de cada cartão.
export class Preview {
  constructor(w = 220, h = 280) {
    this.w = w;
    this.h = h;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(w, h, false);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    const scene = (this.scene = new THREE.Scene());
    scene.add(new THREE.HemisphereLight(0xffffff, 0x404050, 1.9));
    const key = new THREE.DirectionalLight(0xfff4e8, 2.4);
    key.position.set(2.5, 4, 3.5);
    key.castShadow = true;
    key.shadow.mapSize.set(512, 512);
    Object.assign(key.shadow.camera, { left: -1.5, right: 1.5, top: 2, bottom: -1, near: 0.5, far: 12 });
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x9ac8ff, 1.2);
    rim.position.set(-3, 2, -3);
    scene.add(rim);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(0.8, 32), new THREE.ShadowMaterial({ opacity: 0.35 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    this.B = new BoxBatch(scene, 700, { shadows: true });
    this.G = new BoxBatch(scene, 160, { shadows: false, emissive: true });
    this.camera = new THREE.PerspectiveCamera(30, w / h, 0.1, 20);
    this.camera.position.set(0, 1.5, 3.8);
    this.camera.lookAt(0, 1.0, 0);
  }

  // retrato do rosto (avatar do HUD), desenhado uma vez
  portrait(target, look) {
    const cam = this.camera;
    const old = cam.position.clone();
    cam.aspect = 1;
    cam.updateProjectionMatrix();
    cam.position.set(0.35, 1.45, 1.75);
    cam.lookAt(0, 1.18, 0);
    this.renderer.setSize(this.w, this.w, false);
    this.draw(target, look, 0.25, 0, false, true);
    this.renderer.setSize(this.w, this.h, false);
    cam.aspect = this.w / this.h;
    cam.updateProjectionMatrix();
    cam.position.copy(old);
    cam.lookAt(0, 1.0, 0);
  }

  // miniatura 3D de uma arena (cena real montada a partir do mapa), guardada em cache
  // chave do cache salvo no navegador: muda sozinha quando o mapa ou a luz da arena mudam
  thumbKey(def) {
    let h = 0;
    const s = JSON.stringify(def);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return `blockhorde.thumb.v1.${def.id}.${(h >>> 0).toString(36)}`;
  }
  // true quando a miniatura sai na hora (memória ou cache salvo), sem montar a cena 3D
  hasThumb(def) {
    if (this.thumbs?.[def.id]) return true;
    try {
      return !!localStorage.getItem(this.thumbKey(def));
    } catch {
      return false;
    }
  }
  arenaThumb(def, target) {
    this.thumbs = this.thumbs || {};
    let img = this.thumbs[def.id];
    if (!img) {
      // cache salvo de uma visita anterior: só decodifica a imagem
      let saved = null;
      try {
        saved = localStorage.getItem(this.thumbKey(def));
      } catch {
        /* sem armazenamento */
      }
      if (saved) {
        const pic = new Image();
        pic.onload = () => {
          const c = document.createElement('canvas');
          c.width = pic.width;
          c.height = pic.height;
          c.getContext('2d').drawImage(pic, 0, 0);
          this.thumbs[def.id] = c;
          if (target) {
            target.width = c.width;
            target.height = c.height;
            target.getContext('2d').drawImage(c, 0, 0);
          }
        };
        pic.src = saved;
        return;
      }
    }
    if (!img) {
      const W = 368;
      const H = 200;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(def.light.sky);
      scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x3a3020, def.light.hemi));
      const sun = new THREE.DirectionalLight(def.light.sun, def.light.sunI);
      const arena = new Arena(def);
      sun.position.set(arena.W / 2 - 18, 40, arena.D / 2 - 14);
      sun.target.position.set(arena.W / 2, 0, arena.D / 2);
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      Object.assign(sun.shadow.camera, { left: -34, right: 34, top: 28, bottom: -28, near: 1, far: 120 });
      scene.add(sun, sun.target);
      arena.build(scene, 'medium');
      // objetos destrutíveis/interativos do cenário (desenhados uma vez para a foto)
      let pb = null;
      let pg = null;
      if (arena.props.length || arena.mapBarrels.length) {
        pb = new BoxBatch(scene, 6000, { shadows: true });
        pg = new BoxBatch(scene, 1000, { shadows: false, emissive: true });
        pb.begin();
        pg.begin();
        arena.drawProps(pb, pg, 0, true);
        pb.end();
        pg.end();
      }
      const cam = new THREE.PerspectiveCamera(40, W / H, 0.5, 200);
      cam.position.set(arena.W / 2, 30, arena.D / 2 + 26);
      cam.lookAt(arena.W / 2, 0, arena.D / 2 + 1);
      this.renderer.setSize(W, H, false);
      this.renderer.setClearColor(def.light.sky, 1);
      this.renderer.render(scene, cam);
      img = document.createElement('canvas');
      img.width = W;
      img.height = H;
      img.getContext('2d').drawImage(this.renderer.domElement, 0, 0);
      this.thumbs[def.id] = img;
      try {
        const key = this.thumbKey(def);
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith(`blockhorde.thumb.v1.${def.id}.`) && k !== key) localStorage.removeItem(k); // versão antiga da arena
        }
        localStorage.setItem(key, img.toDataURL('image/jpeg', 0.82));
      } catch {
        /* armazenamento cheio ou bloqueado: fica só na memória */
      }
      arena.dispose(scene);
      for (const b of [pb, pg]) if (b) {
        scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        b.mesh.material.dispose();
        b.mesh.dispose();
      }
      sun.shadow.map?.dispose();
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.setSize(this.w, this.h, false);
    }
    if (!target) return;
    target.width = img.width;
    target.height = img.height;
    target.getContext('2d').drawImage(img, 0, 0);
  }

  // inimigo do bestiário: escala de vitrine para caber no cartão; o ativo anda e ataca
  enemy(target, type, angle, t, active) {
    const { B, G } = this;
    const cam = this.camera;
    cam.position.set(0, 1.5, 3.8);
    cam.lookAt(0, 1.0, 0);
    const z = this._ez || (this._ez = { pos: new THREE.Vector3(), minions: [] });
    const show = { spider: 0.72, bat: 0.78, dog: 0.95, spore: 0.95, boss: 0.92, pharaoh: 0.92, sobek: 0.88, crocling: 0.9, bastet: 0.95, bastetclone: 1.1, sphinx: 0.62, brute: 1.05, summoner: 0.98, portal: 0.5, chariot: 0.5, horus: 0.62, scorpion: 0.85, construct: 0.75, anubis: 0.9, rm_praetor: 1.05, rm_beast: 1.0, rm_spirit: 0.85, rm_standard: 0.55, rm_engineer: 1.05, rm_turret: 0.85, rm_chariot: 0.5, rm_eagle: 0.62, rm_catapult: 0.6, rm_elephant: 0.65, lb_colossa: 0.4, lb_core: 0.42, lb_abominable: 0.4, lb_exogeneral: 0.42 }[type] || 1.1;
    const cycle = t % 1.6;
    Object.assign(z, {
      type, def: ENEMIES[type], look: enemyLook(type), facing: angle, scale: show, alive: true, rise: 0,
      walk: active ? t * 5 : t * 0.4, hurtT: 0, attackT: active && cycle < 0.35 ? 0.35 - cycle : 0,
      state: active && type === 'summoner' && cycle > 0.8 ? 'cast' : active && type === 'dog' && cycle > 1.2 ? 'lunge' : 'move', stateT: 0,
      flyY: 0.95 + Math.sin(t * 3) * 0.06, strafe: 0,
    });
    B.begin();
    G.begin();
    drawEnemy(B, G, z, t);
    B.end();
    G.end();
    this.renderer.render(this.scene, this.camera);
    const ctx = target.getContext('2d');
    ctx.clearRect(0, 0, target.width, target.height);
    ctx.drawImage(this.renderer.domElement, 0, 0, target.width, target.height);
  }

  // montaria do catálogo: mesmo modelo 3D do jogo (drawMount), girando; a ativa anda (rodas/patas)
  mount(target, id, angle, t, active) {
    const { B, G } = this;
    const def = MOUNTS[id];
    const s = 1.05 / Math.max(1.2, def.size);
    const wm = this._wm || (this._wm = {});
    Object.assign(wm, { id, def, alive: true, x: 0, z: 0, facing: angle, hurtT: 0, wheelT: active ? t * 6 : 0, rider: { preview: true } });
    B.begin();
    G.begin();
    drawMount(B, G, wm, t, false);
    B.end();
    G.end();
    const cam = this.camera;
    const d = 4.7 / s;
    cam.position.set(0, d * 0.48, d * 0.88);
    cam.lookAt(0, 0.65, 0);
    this.renderer.render(this.scene, cam);
    cam.position.set(0, 1.5, 3.8);
    cam.lookAt(0, 1.0, 0);
    const ctx = target.getContext('2d');
    ctx.clearRect(0, 0, target.width, target.height);
    const sh = (this.w * target.height) / target.width;
    ctx.drawImage(this.renderer.domElement, 0, Math.max(0, (this.h - sh) / 2), this.w, Math.min(this.h, sh), 0, 0, target.width, target.height);
  }

  // item do catálogo: flutua e gira; o ativo vira de frente e cresce um pouco
  item(target, id, angle, t, active) {
    const { B, G } = this;
    const it = ITEMS[id];
    const scale = (id === 'supply' ? 1.2 : 1.15 / it.size) * (active ? 1.08 : 1);
    B.begin();
    G.begin();
    // armas compridas balançam de lado em vez de girar (de ponta ficariam ilegíveis)
    const ry = it.cat === 'weapon' ? Math.sin(angle * 0.9) * 0.5 : angle;
    drawItem(B, G, id, 0, 1.0 + Math.sin(t * 2.2) * 0.04, 0, ry, scale);
    B.end();
    G.end();
    const cam = this.camera;
    cam.position.set(0, 1.75, 3.6);
    cam.lookAt(0, 1.0, 0);
    this.renderer.render(this.scene, cam);
    cam.position.set(0, 1.5, 3.8);
    cam.lookAt(0, 1.0, 0);
    const ctx = target.getContext('2d');
    ctx.clearRect(0, 0, target.width, target.height);
    // o canvas do item é quadrado: recorta o centro da imagem retrato
    const sh = (this.w * target.height) / target.width;
    ctx.drawImage(this.renderer.domElement, 0, (this.h - sh) / 2, this.w, sh, 0, 0, target.width, target.height);
  }

  // elemento de cenário do catálogo: gira devagar; o ativo anima (semáforo alterna, lâmpada acende)
  scenery(target, id, angle, t, active) {
    const { B, G } = this;
    const sd = SCENERY[id];
    if (!this._sceneryParts) this._sceneryParts = {};
    const parts = this._sceneryParts[id] || (this._sceneryParts[id] = sd.model(mulberry32(sd.n * 101)));
    let lo = Infinity;
    let hi = -Infinity;
    let w = 0;
    for (const q of parts) {
      lo = Math.min(lo, q[1] - q[4] / 2);
      hi = Math.max(hi, q[1] + q[4] / 2);
      w = Math.max(w, Math.abs(q[0]) + q[3] / 2, Math.abs(q[2]) + q[5] / 2);
    }
    const scale = Math.min(1.0 / (hi - lo), 0.58 / w) * (active ? 1.06 : 1);
    const base = 1.0 - ((hi + lo) / 2) * scale;
    const phase = Arena.trafficPhase(t * 1.6);
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    B.begin();
    G.begin();
    for (const q of parts) {
      const x = (q[0] * c + q[2] * s) * scale;
      const z = (-q[0] * s + q[2] * c) * scale;
      const on = q[8] && (!q[9] || q[9] === 'bulb' || q[9] === phase);
      (on ? G : B).box(x, base + q[1] * scale, z, q[3] * scale, q[4] * scale, q[5] * scale, q[8] && !on ? 0x2a2a2a : q[6], (q[7] || 0) + angle);
    }
    B.end();
    G.end();
    const cam = this.camera;
    cam.position.set(0, 1.85, 3.5);
    cam.lookAt(0, 1.0, 0);
    this.renderer.render(this.scene, cam);
    cam.position.set(0, 1.5, 3.8);
    cam.lookAt(0, 1.0, 0);
    const ctx = target.getContext('2d');
    ctx.clearRect(0, 0, target.width, target.height);
    const sh = (this.w * target.height) / target.width;
    ctx.drawImage(this.renderer.domElement, 0, (this.h - sh) / 2, this.w, sh, 0, 0, target.width, target.height);
  }

  // desenha o personagem e copia para o canvas 2D de destino
  // close = true mantém a câmera do retrato (o cartão usa um enquadramento mais fechado)
  draw(target, look, angle, t, active, close = false) {
    const { B, G } = this;
    const cam = this.camera;
    if (!close) {
      cam.position.set(0, 1.3, 3.3);
      cam.lookAt(0, 0.76, 0);
    }
    B.begin();
    G.begin();
    drawCharacter(B, 0, 0, 0, angle, 1, look, {
      walk: active ? t * 7 : 0,
      swing: active ? 0.7 : 0,
      aim: active,
      headTilt: active ? 0 : Math.sin(t * 1.3) * 0.05,
      gun: { len: 0.56, color: 0x2a2a2e, model: GUN_MODELS.shotgun },
      G,
    });
    B.end();
    G.end();
    this.renderer.render(this.scene, this.camera);
    const ctx = target.getContext('2d');
    ctx.clearRect(0, 0, target.width, target.height);
    ctx.drawImage(this.renderer.domElement, 0, 0, target.width, target.height);
  }
}
