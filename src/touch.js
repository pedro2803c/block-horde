// Controles de toque (celular e tablet): dois direcionais virtuais + botões.
// Esquerda: arraste para andar. Direita: segure para atirar; arraste para mirar você mesmo.
// Com "Tiro automático" (padrão), o sobrevivente já atira sozinho no zumbi mais próximo ao alcance.
// Botões: 3 habilidades, ultimate, arma (toque = próxima; segure = lista), recarga e faca.
import { ACTIVES, ULTIMATES } from './abilities.js';
import { WEAPONS, WEAPON_ORDER } from './data.js';
import { MOUNT_INFO, MOUNT_USE_DIST, mountSkillAt } from './mounts.js';
import { icon, weaponIcon } from './icons.js';

const BASE_R = 58; // raio do direcional (px) no tamanho 100%
const DEAD = 0.18;
const HOLD_MS = 320; // segurar o botão da arma abre a lista

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
    this.ptrs = new Map(); // pointerId → direcional
    this.root = el('div', 'touch hidden');
    this.root.setAttribute('aria-hidden', 'true');
    this.sMove = this.stick('s-move');
    this.sAim = this.stick('s-aim');
    this.btns = el('div', 'tbtns');
    this.ab = [0, 1, 2, 3].map((i) => {
      const b = el('button', 'tb ab' + (i === 3 ? ' ult' : ''));
      b.append(el('span', 'ico'), el('i', 'cd'), el('b', 'cdn'));
      this.hold(b, () => this.press(this.g.players[0]?.akeys[i][0]));
      return b;
    });
    this.bWeapon = el('button', 'tb wpn', el('span', 'ico'), el('small', 'wn'));
    this.weaponHold(this.bWeapon);
    this.bReload = el('button', 'tb rel', icon('reload'));
    this.hold(this.bReload, () => this.press('KeyG'));
    this.bMelee = el('button', 'tb mel', icon('knife'));
    this.hold(this.bMelee, () => this.inp.down.add('KeyF'), () => this.inp.down.delete('KeyF'));
    // montaria: entrar/sair (aparece só quando a arena tem montaria disponível)
    this.bMount = el('button', 'tb mnt hidden', icon('vehicle'), el('small', 'tl', 'Montar'));
    this.hold(this.bMount, () => this.press('VMount'));
    this.picker = el('div', 'wpicker hidden');
    this.btns.append(...this.ab, this.bWeapon, this.bReload, this.bMelee, this.bMount, this.picker);
    this.autoTag = el('div', 'auto-tag', icon('target'), el('span', '', 'Tiro automático'));
    this.root.append(this.sMove.base, this.sAim.base, this.btns, this.autoTag);
    root.prepend(this.root); // por baixo do HUD: pausa e árvore continuam tocáveis
    // no celular o jogo é só na horizontal: em pé, cobre a tela e pausa
    this.rotate = el('div', 'rotate-lock', el('div', 'phone'), el('strong', '', 'Gire o celular'), el('span', '', 'Block Horde é jogado na horizontal'));
    root.append(this.rotate);
    this.portraitMq = window.matchMedia ? window.matchMedia('(orientation: portrait)') : null;

    this.root.addEventListener('pointerdown', (e) => this.down(e));
    this.root.addEventListener('pointermove', (e) => this.move(e));
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) this.root.addEventListener(t, (e) => this.up(e));
    this.root.addEventListener('contextmenu', (e) => e.preventDefault());

    // liga o modo toque no primeiro toque; um mouse de verdade desliga
    const mq = (q) => window.matchMedia && window.matchMedia(q).matches;
    const hasTouch = mq('(pointer: coarse)') || (navigator.maxTouchPoints || 0) > 0 || 'ontouchstart' in window;
    if (hasTouch) this.setMode(true);
    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      this.setMode(true);
      this.lockLandscape();
    }, { capture: true });
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'mouse' && this.on && Math.abs(e.movementX) + Math.abs(e.movementY) > 3) this.setMode(false);
    }, { capture: true });
    // sem zoom de pinça / toque duplo no meio do jogo (iOS ignora o viewport)
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    document.addEventListener('dblclick', (e) => this.on && e.preventDefault());
    this.applySettings();
    let rt = 0;
    const relayout = () => { clearTimeout(rt); rt = setTimeout(() => this.layout(), 120); };
    window.addEventListener('resize', relayout);
    window.addEventListener('orientationchange', relayout);
  }

  // Android (tela cheia) aceita travar a orientação; nos outros, o aviso de girar resolve
  lockLandscape() {
    if (this.lockTried) return;
    this.lockTried = true;
    try {
      const o = screen.orientation;
      if (o && o.lock) o.lock('landscape').catch(() => {});
    } catch {
      /* não suportado */
    }
  }

  get portrait() {
    return !!(this.portraitMq && this.portraitMq.matches);
  }

  get s() {
    return this.g.settings;
  }

  // tamanho dos botões (configurações) e um pouco maior em tablets
  applySettings() {
    const tablet = Math.min(window.innerWidth, window.innerHeight) >= 600 ? 1.15 : 1;
    this.scale = Math.max(0.9, this.s.touchSize ?? 1) * tablet; // abaixo de 0,9 os botões ficam menores que 44 px
    this.R = BASE_R * this.scale;
    this.root.style.setProperty('--ts', this.scale.toFixed(3));
    document.body.classList.toggle('lefty', !!this.s.touchLefty); // canhoto: lados trocados
    this.layout();
  }

  // Gerenciador central do layout da HUD no modo toque: uma escala (--hs) derivada da tela
  // alimenta todas as regiões no CSS; depois confere sobreposições e compacta se faltar espaço.
  layout() {
    const b = document.body;
    const W = window.innerWidth, H = window.innerHeight;
    const hs = Math.max(0.8, Math.min(1.3, Math.min(H / 420, W / 860)));
    b.style.setProperty('--hs', hs.toFixed(3));
    b.classList.remove('hud-narrow');
    if (!this.on) return;
    requestAnimationFrame(() => {
      const r = (s) => document.querySelector(s)?.getBoundingClientRect();
      const top = r('.hud .top'), pp = r('.players .pp'), radar = r('.hud .radar'), pause = r('.hud .pause-btn');
      const hit = (a, c) => a && c && a.width && c.width && a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom;
      if (hit(top, pp) || hit(top, radar) || hit(top, pause)) b.classList.add('hud-narrow');
    });
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

  buzz(ms = 10) {
    if (this.s.touchHaptic === false) return;
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; // o navegador só vibra depois de um toque real
    try {
      navigator.vibrate && navigator.vibrate(ms);
    } catch {
      /* sem vibração */
    }
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
      this.buzz();
      onDown();
    });
    const end = () => {
      b.classList.remove('pressed');
      onUp && onUp();
    };
    b.addEventListener('pointerup', end);
    b.addEventListener('pointercancel', end);
  }

  // botão da arma: toque = próxima arma; segure = lista para escolher (deslize e solte)
  weaponHold(b) {
    let timer = 0;
    let open = false;
    const pick = (x, y) => {
      const it = document.elementFromPoint(x, y)?.closest('.wpicker button');
      for (const k of this.picker.children) k.classList.toggle('sel', k === it);
      return it;
    };
    b.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      b.classList.add('pressed');
      try {
        b.setPointerCapture(e.pointerId);
      } catch {
        /* ignora */
      }
      this.buzz();
      open = false;
      clearTimeout(timer);
      timer = setTimeout(() => {
        open = this.openPicker();
        if (open) this.buzz(18);
      }, HOLD_MS);
    });
    b.addEventListener('pointermove', (e) => open && pick(e.clientX, e.clientY));
    const end = (e, cancel) => {
      clearTimeout(timer);
      b.classList.remove('pressed');
      if (open) {
        const it = !cancel && pick(e.clientX, e.clientY);
        if (it) this.choose(it.dataset.id);
        // soltou fora da lista: ela fica aberta para escolher com um toque
        else if (cancel) this.closePicker();
      } else if (!cancel) this.press('KeyE');
      if (open && this.picker.querySelector('.sel')) this.closePicker();
      open = false;
    };
    b.addEventListener('pointerup', (e) => end(e, false));
    b.addEventListener('pointercancel', (e) => end(e, true));
  }

  openPicker() {
    const g = this.g;
    const p = g.players[0];
    if (!p) return false;
    const list = WEAPON_ORDER.filter((id) => g.unlocked.has(id) && g.usable(p, id));
    if (list.length < 2) return false;
    this.picker.replaceChildren(...list.map((id) => {
      const it = el('button', id === p.weapon ? 'cur' : '', weaponIcon(id));
      it.dataset.id = id;
      it.title = WEAPONS[id].name;
      // toque direto num item também escolhe
      it.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        e.preventDefault();
      });
      it.addEventListener('pointerup', () => {
        this.choose(id);
        this.closePicker();
      });
      return it;
    }));
    this.picker.classList.remove('hidden');
    return true;
  }
  closePicker() {
    this.picker.classList.add('hidden');
  }
  choose(id) {
    const p = this.g.players[0];
    if (p && id) {
      this.g.selectWeapon(p, id);
      this.buzz(14);
    }
  }

  press(code) {
    if (code) this.inp.pressed.add(code);
  }

  down(e) {
    if (e.target.closest('.tb, .wpicker')) return;
    e.preventDefault();
    this.closePicker();
    const left = this.s.touchLefty ? e.clientX > window.innerWidth * 0.55 : e.clientX < window.innerWidth * 0.45;
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
    const R = this.R;
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
    s.knob.style.transform = `translate(calc(-50% + ${dx * BASE_R}px), calc(-50% + ${dy * BASE_R}px))`; // a base já está escalada
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
    inp.touchMove = Math.hypot(mv.x, mv.y) > DEAD ? { x: mv.x, z: mv.y } : null;
    const am = this.sAim;
    const aiming = am.id !== null;
    inp.touchAim = aiming && Math.hypot(am.x, am.y) > 0.3 ? { x: am.x, z: am.y } : null;
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
    this.closePicker();
    this.sync();
  }

  // todo quadro: mostra/esconde e atualiza recargas e arma
  update() {
    const g = this.g;
    const blocked = this.on && this.portrait;
    if (blocked !== this.blocked) {
      this.blocked = blocked;
      document.body.classList.toggle('portrait-lock', blocked);
      if (blocked && g.state === 'playing') g.pause();
    }
    const show = this.on && g.state === 'playing' && (g.mode === 'solo' || g.mode === 'pvp');
    if (show !== this.shown) {
      this.shown = show;
      this.root.classList.toggle('hidden', !show);
      if (!show) this.reset();
      else this.applySettings();
    }
    // munição baixa/zerada também no botão da arma (não depende só da cor: pisca e mostra o número)
    if (show && g.players[0]) {
      const p0 = g.players[0], w0 = WEAPONS[p0.weapon];
      const clip = w0 && w0.mag && w0.mag !== Infinity ? p0.clip[p0.weapon] || 0 : null;
      this.bWeapon.classList.toggle('empty', clip === 0);
      this.bWeapon.classList.toggle('low', clip !== null && clip > 0 && clip <= Math.max(1, Math.ceil(w0.mag * 0.25)));
      this.bReload.classList.toggle('urgent', clip !== null && clip <= Math.max(1, Math.ceil(w0.mag * 0.25)) && !(p0.reloadT > 0));
    }
    if (!show) return;
    const p = g.players[0];
    if (!p) return;
    this.autoTag.classList.toggle('hidden', this.s.touchAuto === false);
    // botão de montar: visível quando há montaria viva na arena (ou o jogador está montado)
    const wm = g.worldMount;
    const showMount = !!(wm && (p.isMounted || wm.alive));
    this.bMount.classList.toggle('hidden', !showMount);
    if (showMount) {
      const near = !p.isMounted && Math.hypot(wm.x - p.pos.x, wm.z - p.pos.z) <= MOUNT_USE_DIST;
      const lbl = p.isMounted ? 'Sair' : 'Montar';
      const tl = this.bMount.querySelector('.tl');
      if (tl.textContent !== lbl) tl.textContent = lbl;
      this.bMount.classList.toggle('dim', !p.isMounted && !near);
      this.bMount.classList.toggle('near', near);
    }
    // montado: os botões de habilidade viram os ataques da montaria (slot 0..3)
    const skills = p.isMounted && wm && wm.rider === p ? MOUNT_INFO[wm.id]?.skills : null;
    for (let i = 0; i < 4; i++) {
      const b = this.ab[i];
      const id = p.slots[i];
      const sk = skills ? mountSkillAt(wm.id, i) : null;
      const def = sk ? null : i === 3 ? ULTIMATES[id] : ACTIVES[id];
      const locked = !sk && i === 3 && !p.ultOn;
      const key = (sk ? 'M' + sk.icon : def ? def.icon : '') + (locked ? 'L' : '');
      if (b.dataset.k !== key) {
        b.dataset.k = key;
        b.querySelector('.ico').replaceChildren(locked ? icon('lock') : icon(sk ? sk.icon : def ? def.icon : 'bolt'));
        if (sk) b.style.setProperty('--c', '#29B6F6');
        else if (def && def.color) b.style.setProperty('--c', def.color);
        let cap = b.querySelector('.tl');
        if (sk) {
          if (!cap) b.append((cap = el('small', 'tl')));
          cap.textContent = sk.name.split(' ')[0];
        } else if (cap) cap.remove();
      }
      const left = sk ? Math.max(0, (p.sharkCd?.[i] || 0) - g.time) : p.cds[i];
      const max = sk ? sk.cd : (p.cdMax && p.cdMax[i]) || (def && def.cd) || 1;
      b.querySelector('.cd').style.setProperty('--f', (left > 0 ? Math.min(1, left / max) : 0).toFixed(3));
      const txt = left > 0 ? String(Math.ceil(left)) : '';
      const n = b.querySelector('.cdn');
      if (n.textContent !== txt) {
        // acabou a recarga: pulso de "pronto"
        if (!txt && n.textContent && !locked) {
          b.classList.remove('ready');
          void b.offsetWidth;
          b.classList.add('ready');
        }
        n.textContent = txt;
      }
      b.classList.toggle('dim', locked || left > 0);
      b.classList.toggle('locked', locked); // bloqueado: menor e claramente secundário
      if (b.ariaLabel !== (locked ? 'Ultimate bloqueado' : null) && locked) b.setAttribute('aria-label', 'Ultimate bloqueado');
    }
    if (this.bWeapon.dataset.w !== p.weapon) {
      this.bWeapon.dataset.w = p.weapon;
      this.bWeapon.querySelector('.ico').replaceChildren(weaponIcon(p.weapon));
    }
    // munição no botão da arma
    const w = WEAPONS[p.weapon];
    const ammo = w.mag === Infinity || p.ammo[p.weapon] === Infinity ? '∞' : w.mag ? String(p.clip[p.weapon] || 0) : p.ammo[p.weapon] === Infinity ? '∞' : String(p.ammo[p.weapon] || 0);
    const wn = this.bWeapon.querySelector('.wn');
    if (wn.textContent !== ammo) wn.textContent = ammo;
    this.bReload.classList.toggle('dim', !w.mag || p.reloadT > 0);
  }
}
