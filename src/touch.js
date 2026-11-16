// Controles de toque (celular e tablet): dois direcionais virtuais + botões.
// Esquerda: arraste para andar. Direita: segure para atirar (mira automática);
// arraste para mirar você mesmo. Botões: 3 habilidades, ultimate, arma, recarga e faca.
import { ACTIVES, ULTIMATES } from './abilities.js';
import { WEAPONS } from './data.js';
import { icon, weaponIcon } from './icons.js';

const R = 58; // raio do direcional (px)
const DEAD = 0.18;

function el(tag, cls, ...kids) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  for (const k of kids) if (k) e.append(k);
  return e;
}

export class TouchControls {
  constructor(game, root) {
    this.g = game;
    this.inp = game.input;
    this.on = false; // modo toque ativo (vira true no primeiro toque)
    this.ptrs = new Map(); // pointerId → { role, x0, y0 }
    this.root = el('div', 'touch hidden');
    this.root.setAttribute('aria-hidden', 'true');
    this.sMove = this.stick('s-move');
    this.sAim = this.stick('s-aim');
    // botões em arco em volta do direcional de tiro
    this.btns = el('div', 'tbtns');
    this.ab = [0, 1, 2, 3].map((i) => {
      const b = el('button', 'tb ab' + (i === 3 ? ' ult' : ''));
      b.append(el('span', 'ico'), el('i', 'cd'), el('b', 'cdn'));
      this.hold(b, () => this.press(this.g.players[0]?.akeys[i][0]));
      return b;
    });
    this.bWeapon = el('button', 'tb wpn', el('span', 'ico'));
    this.hold(this.bWeapon, () => this.press('KeyE'));
    this.bReload = el('button', 'tb rel', icon('reload'));
    this.hold(this.bReload, () => this.press('KeyG'));
    this.bMelee = el('button', 'tb mel', icon('knife'));
    this.hold(this.bMelee, () => this.inp.down.add('KeyF'), () => this.inp.down.delete('KeyF'));
    this.btns.append(...this.ab, this.bWeapon, this.bReload, this.bMelee);
    this.root.append(this.sMove.base, this.sAim.base, this.btns);
    root.prepend(this.root); // por baixo do HUD: pausa e árvore continuam tocáveis

    this.root.addEventListener('pointerdown', (e) => this.down(e));
    this.root.addEventListener('pointermove', (e) => this.move(e));
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) this.root.addEventListener(t, (e) => this.up(e));
    this.root.addEventListener('contextmenu', (e) => e.preventDefault());

    // liga o modo toque no primeiro toque; um mouse de verdade desliga
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches;
    if (coarse) this.setMode(true);
    window.addEventListener('pointerdown', (e) => e.pointerType === 'touch' && this.setMode(true), { capture: true });
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' && this.on && (Math.abs(e.movementX) + Math.abs(e.movementY) > 3)) this.setMode(false);
    }, { capture: true });
  }

  setMode(on) {
    if (this.on === on) return;
    this.on = on;
    this.inp.touchMode = on;
    if (on) {
      this.inp.mouseIdle = true; // sem mouse: mira automática até o jogador arrastar
      this.inp.mouse.left = false;
    }
    document.body.classList.toggle('touch', on);
    if (!on) this.reset();
  }

  stick(cls) {
    const knob = el('i');
    const base = el('div', 'stick ' + cls, knob);
    return { base, knob, x: 0, y: 0, id: null };
  }

  hold(b, onDown, onUp) {
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      b.classList.add('pressed');
      try {
        b.setPointerCapture(e.pointerId);
      } catch {
        /* ignora */
      }
      onDown();
    });
    const end = () => {
      b.classList.remove('pressed');
      onUp && onUp();
    };
    b.addEventListener('pointerup', end);
    b.addEventListener('pointercancel', end);
  }

  press(code) {
    if (!code) return;
    this.inp.pressed.add(code);
  }

  down(e) {
    if (e.target.closest('.tb')) return;
    e.preventDefault();
    const left = e.clientX < window.innerWidth * 0.45;
    const s = left ? this.sMove : this.sAim;
    if (s.id !== null) return;
    s.id = e.pointerId;
    s.cx = e.clientX;
    s.cy = e.clientY;
    s.x = 0;
    s.y = 0;
    this.ptrs.set(e.pointerId, s);
    try {
      this.root.setPointerCapture(e.pointerId);
    } catch {
      /* ignora */
    }
    s.base.style.left = s.cx + 'px';
    s.base.style.top = s.cy + 'px';
    s.base.classList.add('on');
    s.knob.style.transform = 'translate(-50%, -50%)';
    this.sync();
  }

  move(e) {
    const s = this.ptrs.get(e.pointerId);
    if (!s) return;
    e.preventDefault();
    let dx = (e.clientX - s.cx) / R;
    let dy = (e.clientY - s.cy) / R;
    const m = Math.hypot(dx, dy);
    if (m > 1) {
      // o direcional "segue" o dedo quando ele passa do limite
      s.cx += (dx / m) * (m - 1) * R;
      s.cy += (dy / m) * (m - 1) * R;
      s.base.style.left = s.cx + 'px';
      s.base.style.top = s.cy + 'px';
      dx /= m;
      dy /= m;
    }
    s.x = dx;
    s.y = dy;
    s.knob.style.transform = `translate(calc(-50% + ${dx * R}px), calc(-50% + ${dy * R}px))`;
    this.sync();
  }

  up(e) {
    const s = this.ptrs.get(e.pointerId);
    if (!s) return;
    this.ptrs.delete(e.pointerId);
    s.id = null;
    s.x = 0;
    s.y = 0;
    s.base.classList.remove('on');
    this.sync();
  }

  // passa os direcionais para a entrada do jogo
  sync() {
    const inp = this.inp;
    const mv = this.sMove;
    const mm = Math.hypot(mv.x, mv.y);
    inp.touchMove = mm > DEAD ? { x: mv.x, z: mv.y } : null;
    const am = this.sAim;
    const aiming = am.id !== null;
    const amag = Math.hypot(am.x, am.y);
    inp.touchAim = aiming && amag > 0.3 ? { x: am.x, z: am.y } : null;
    if (aiming) inp.down.add('Space');
    else inp.down.delete('Space');
  }

  reset() {
    for (const s of [this.sMove, this.sAim]) {
      s.id = null;
      s.x = 0;
      s.y = 0;
      s.base.classList.remove('on');
    }
    this.ptrs.clear();
    this.inp.down.delete('KeyF');
    this.sync();
  }

  // todo quadro: mostra/esconde e atualiza recargas e arma
  update() {
    const g = this.g;
    const show = this.on && g.state === 'playing' && g.mode === 'solo';
    if (show !== this.shown) {
      this.shown = show;
      this.root.classList.toggle('hidden', !show);
      if (!show) this.reset();
    }
    if (!show) return;
    const p = g.players[0];
    if (!p) return;
    for (let i = 0; i < 4; i++) {
      const b = this.ab[i];
      const id = p.slots[i];
      const def = i === 3 ? ULTIMATES[id] : ACTIVES[id];
      const locked = i === 3 && !p.ultOn;
      const key = (def ? def.icon : '') + (locked ? 'L' : '');
      if (b.dataset.k !== key) {
        b.dataset.k = key;
        b.querySelector('.ico').replaceChildren(locked ? icon('lock') : icon(def ? def.icon : 'bolt'));
        if (def && def.color) b.style.setProperty('--c', def.color);
      }
      const left = p.cds[i];
      const max = (p.cdMax && p.cdMax[i]) || (def && def.cd) || 1;
      const frac = left > 0 ? Math.min(1, left / max) : 0;
      b.querySelector('.cd').style.setProperty('--f', frac.toFixed(3));
      const txt = left > 0 ? String(Math.ceil(left)) : '';
      const n = b.querySelector('.cdn');
      if (n.textContent !== txt) n.textContent = txt;
      b.classList.toggle('dim', locked || left > 0);
    }
    if (this.bWeapon.dataset.w !== p.weapon) {
      this.bWeapon.dataset.w = p.weapon;
      this.bWeapon.querySelector('.ico').replaceChildren(weaponIcon(p.weapon));
      this.bWeapon.title = WEAPONS[p.weapon]?.name || '';
    }
  }
}
