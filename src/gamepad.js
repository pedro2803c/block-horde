import { platform } from './platform.js';
import { ABILITY_KEYS } from './abilities.js';

// ControllerManager: detecta controles (Gamepad API), traduz botões em ações
// universais e alimenta a MESMA entrada do teclado/touch. Não existe gameplay
// separado por controle: o controle só gera as mesmas teclas virtuais e
// direcionais que o teclado e o celular já usam.

const STORE_KEY = 'blockhorde.gamepad.v1';

// layout "standard" do W3C: índice → posição física
// 0 baixo · 1 direita · 2 esquerda · 3 cima · 4 LB · 5 RB · 6 LT · 7 RT
// 8 select · 9 start · 10 L3 · 11 R3 · 12-15 direcional · 16 central
export const FAMILIES = {
  xbox: { name: 'Xbox', glyphs: ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'View', 'Menu', 'LS', 'RS', '↑', '↓', '←', '→', 'Guia'] },
  playstation: { name: 'PlayStation', glyphs: ['✕', '○', '□', '△', 'L1', 'R1', 'L2', 'R2', 'Share', 'Options', 'L3', 'R3', '↑', '↓', '←', '→', 'PS'] },
  nintendo: { name: 'Nintendo', glyphs: ['B', 'A', 'Y', 'X', 'L', 'R', 'ZL', 'ZR', '−', '+', 'LS', 'RS', '↑', '↓', '←', '→', 'Home'] },
  generic: { name: 'Genérico', glyphs: ['B1', 'B2', 'B3', 'B4', 'L1', 'R1', 'L2', 'R2', 'Sel', 'Start', 'L3', 'R3', '↑', '↓', '←', '→', 'Home'] },
};
// cor dos botões frontais (identidade do fabricante, só dentro da paleta oficial)
export const FACE_TONE = {
  xbox: ['ok', 'bad', 'info', 'act'],
  playstation: ['info', 'bad', 'act', 'ok'],
  nintendo: ['', '', '', ''],
  generic: ['', '', '', ''],
};

const VENDORS = {
  '045e': 'Microsoft', '054c': 'Sony', '057e': 'Nintendo', '2dc8': '8BitDo', '046d': 'Logitech',
  '0f0d': 'Hori', '0e6f': 'PDP', '20d6': 'PowerA', '28de': 'Valve', '0079': 'DragonRise', '0810': 'Genérico USB', '2563': 'ShanWan', '24c6': 'PowerA',
};
const PRODUCTS = {
  '045e:028e': 'Xbox 360', '045e:028f': 'Xbox 360 sem fio', '045e:02d1': 'Xbox One', '045e:02dd': 'Xbox One', '045e:02e3': 'Xbox One Elite',
  '045e:02ea': 'Xbox One S', '045e:02fd': 'Xbox One S (Bluetooth)', '045e:0b00': 'Xbox Elite Série 2', '045e:0b05': 'Xbox Elite Série 2 (Bluetooth)',
  '045e:0b12': 'Xbox Series X|S', '045e:0b13': 'Xbox Series X|S (Bluetooth)', '045e:0b20': 'Xbox Series X|S (Bluetooth)',
  '054c:05c4': 'DualShock 4', '054c:09cc': 'DualShock 4 (2ª geração)', '054c:0ba0': 'DualShock 4 (adaptador sem fio)',
  '054c:0ce6': 'DualSense', '054c:0df2': 'DualSense Edge',
  '057e:2009': 'Switch Pro Controller', '057e:2006': 'Joy-Con (E)', '057e:2007': 'Joy-Con (D)', '057e:200e': 'Joy-Con (par)',
  '046d:c216': 'F310 (DirectInput)', '046d:c21d': 'F310', '046d:c21f': 'F710', '046d:c219': 'F710 (DirectInput)',
};

// ações universais; "pad" = botão padrão no layout standard
export const ACTIONS = [
  { id: 'fire', name: 'Atirar', pad: 7 },
  { id: 'melee', name: 'Faca / machado', pad: 5 },
  { id: 'ab0', name: 'Habilidade 1', pad: 4 },
  { id: 'ab1', name: 'Habilidade 2', pad: 6 },
  { id: 'ab2', name: 'Habilidade 3', pad: 0 },
  { id: 'ult', name: 'Ultimate', pad: 3 },
  { id: 'reload', name: 'Recarregar', pad: 2 },
  { id: 'next', name: 'Próxima arma', pad: 15 },
  { id: 'prev', name: 'Arma anterior', pad: 14 },
  { id: 'tree', name: 'Árvore de habilidades', pad: 8 },
  { id: 'pause', name: 'Pausar / menu', pad: 9 },
  { id: 'confirm', name: 'Menu: confirmar', pad: 0 },
  { id: 'back', name: 'Menu: voltar', pad: 1 },
];
const DEFAULT_OPTS = { dead: 0.18, sens: 1, trig: 0.35, invertY: false, swap: false, rumble: true, rumbleK: 0.8 };
const CODES = {
  solo: { fire: 'Space', melee: 'KeyF', reload: 'KeyG', next: 'KeyE', prev: 'KeyQ' },
  p1: { fire: 'Space', melee: 'KeyF', reload: 'KeyG', next: 'KeyE', prev: 'KeyQ', up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' },
  p2: { fire: 'KeyL', melee: 'KeyK', reload: 'KeyH', next: 'Period', prev: 'Comma', up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' },
};

const hex4 = (s) => (s || '').toLowerCase().padStart(4, '0').slice(-4);

// identifica fabricante, modelo e família pelo texto do navegador
export function identify(gp) {
  const id = gp.id || '';
  let vendor = '';
  let product = '';
  let m = id.match(/Vendor:\s*([0-9a-f]{1,4})\s*Product:\s*([0-9a-f]{1,4})/i) || id.match(/^([0-9a-f]{1,4})-([0-9a-f]{1,4})-/i);
  if (m) {
    vendor = hex4(m[1]);
    product = hex4(m[2]);
  }
  const low = id.toLowerCase();
  let family = 'generic';
  if (vendor === '045e' || /xbox|xinput/.test(low)) family = 'xbox';
  else if (vendor === '054c' || /dualshock|dualsense|wireless controller|playstation/.test(low)) family = 'playstation';
  else if (vendor === '057e' || /pro controller|joy-con|nintendo|switch/.test(low)) family = 'nintendo';
  else if (vendor === '046d' || /logitech/.test(low)) family = 'xbox';
  else if (vendor === '2dc8' || /8bitdo/.test(low)) family = /pro|switch/.test(low) ? 'nintendo' : 'xbox';
  let maker = VENDORS[vendor] || (/xbox|xinput/.test(low) ? 'Microsoft (XInput)' : /8bitdo/.test(low) ? '8BitDo' : /logitech/.test(low) ? 'Logitech' : 'Não identificado');
  let model = PRODUCTS[`${vendor}:${product}`] || id.replace(/\(.*?\)/g, '').replace(/^[0-9a-f]{1,4}-[0-9a-f]{1,4}-/i, '').trim() || 'Controle';
  // XInput no Windows esconde o modelo: o navegador mostra todos como "Xbox 360"
  if (/xinput/.test(low) && !vendor) model = 'Controle XInput (Xbox ou compatível)';
  // o navegador não informa USB × Bluetooth; só afirmamos quando o próprio modelo indica
  const conn = /bluetooth/.test(low) || /\(bluetooth\)/i.test(model) ? 'Bluetooth' : 'Não informado pelo navegador';
  return { family, maker, model, vendor, product, conn, key: vendor ? `${vendor}:${product}` : id };
}

// navegador recomendado por tipo de controle (o que cada navegador entrega de verdade)
export function browserName() {
  const u = navigator.userAgent;
  if (/Firefox\//.test(u)) return 'Firefox';
  if (/Edg\//.test(u)) return 'Edge';
  if (/OPR\//.test(u)) return 'Opera';
  if (/Chrome\//.test(u)) return 'Chrome';
  if (/Safari\//.test(u)) return 'Safari';
  return 'outro';
}
export function browserTip(family) {
  const b = browserName();
  if (b === 'Firefox' && family === 'nintendo') return 'Controles Nintendo (Joy-Con e Pro Controller) não funcionam direito no Firefox. Use o Chrome ou o Edge.';
  if (b === 'Firefox') return 'No Firefox o controle funciona, mas sem vibração. Para vibrar, use o Chrome ou o Edge.';
  if (b === 'Safari') return 'No Safari, alguns controles não são reconhecidos e não há vibração. Recomendado: Chrome ou Edge.';
  return '';
}
export const BROWSER_GUIDE = 'Navegador recomendado: Xbox, PlayStation e Nintendo (Joy-Con e Pro Controller) funcionam melhor no Chrome ou no Edge. No Firefox, controles Nintendo falham e não há vibração.';

export class ControllerManager {
  constructor(game) {
    this.g = game;
    this.pads = []; // { index, gp, info, prev:[], now:[], axes:[], opts, map }
    this.active = null; // último controle usado
    this.usingPad = false;
    this.listen = null; // remapeamento: aguarda próximo botão
    this.nav = { t: 0, dir: '' };
    this.store = this.load();
    this.prevFire = false;
    window.addEventListener('gamepadconnected', (e) => this.connect(e.gamepad));
    window.addEventListener('gamepaddisconnected', (e) => this.disconnect(e.gamepad));
  }

  load() {
    try {
      return JSON.parse(platform.getItem(STORE_KEY) || '{}') || {};
    } catch {
      return {};
    }
  }
  save() {
    try {
      platform.setItem(STORE_KEY, JSON.stringify(this.store));
    } catch {
      /* ignora */
    }
  }
  // perfil individual por dispositivo (fabricante:modelo), com padrão por família
  profile(info) {
    const p = this.store[info.key] || {};
    const map = {};
    for (const a of ACTIONS) map[a.id] = p.map?.[a.id] ?? a.pad;
    return { opts: { ...DEFAULT_OPTS, ...(p.opts || {}) }, map };
  }
  saveProfile(pad) {
    this.store[pad.info.key] = { opts: pad.opts, map: pad.map };
    this.save();
  }
  resetProfile(pad) {
    delete this.store[pad.info.key];
    this.save();
    Object.assign(pad, this.profile(pad.info));
  }

  connect(gp) {
    if (!gp || this.pads.some((p) => p.index === gp.index)) return;
    const info = identify(gp);
    const pad = { index: gp.index, gp, info, prev: [], now: [], axes: [], ...this.profile(info) };
    this.pads.push(pad);
    this.pads.sort((a, b) => a.index - b.index);
    this.g.ui?.alert?.(`Controle conectado: ${info.model} (${FAMILIES[info.family].name})`, 'success', 'gamepad');
    this.g.ui?.padChanged?.();
    const tip = browserTip(info.family);
    if (tip) setTimeout(() => this.g.ui?.alert?.(tip, 'danger', 'warning'), 600);
  }
  disconnect(gp) {
    const i = this.pads.findIndex((p) => p.index === gp.index);
    if (i < 0) return;
    const [pad] = this.pads.splice(i, 1);
    if (this.active === pad) this.active = this.pads[0] || null;
    if (!this.pads.length) this.setUsing(false);
    this.g.ui?.alert?.(`Controle desconectado: ${pad.info.model}`, 'info', 'gamepad');
    // partida em andamento: pausa para o jogador reconectar
    if (this.g.state === 'playing') this.g.pause();
    this.g.ui?.padChanged?.();
  }

  setUsing(on) {
    if (on === this.usingPad) return;
    this.usingPad = on;
    this.g.input.padActive = on;
    document.body.classList.toggle('pad-on', on);
    this.g.ui?.padLabels?.();
  }

  glyph(btn, pad = this.active) {
    const fam = FAMILIES[pad?.info.family || 'xbox'];
    return fam.glyphs[btn] ?? `B${btn}`;
  }
  actionGlyph(id, pad = this.active) {
    return this.glyph((pad || { map: Object.fromEntries(ACTIONS.map((a) => [a.id, a.pad])) }).map[id], pad);
  }

  // lê todos os controles (chamado uma vez por quadro)
  poll() {
    const list = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const gp of list) if (gp && gp.connected && !this.pads.some((p) => p.index === gp.index)) this.connect(gp);
    for (const pad of this.pads) {
      const gp = list[pad.index];
      if (!gp) continue;
      pad.gp = gp;
      pad.prev = pad.now;
      pad.now = gp.buttons.map((b, i) => (i === 6 || i === 7 ? b.value >= pad.opts.trig || (b.pressed && b.value === 0) : b.pressed));
      pad.vals = gp.buttons.map((b) => b.value);
      pad.axes = gp.axes.slice();
      // controles fora do padrão (DirectInput): direcional digital vem no eixo "hat"
      if (gp.mapping !== 'standard' && gp.axes.length >= 10 && gp.buttons.length < 16) {
        const hat = gp.axes[9];
        // -1 = cima, avança de 1/7 em sentido horário; > 1 = solto
        const pos = hat <= 1.01 ? Math.round((hat + 1) * 3.5) : -1;
        pad.now[12] = [0, 1, 7].includes(pos);
        pad.now[15] = [1, 2, 3].includes(pos);
        pad.now[13] = [3, 4, 5].includes(pos);
        pad.now[14] = [5, 6, 7].includes(pos);
      }
      const any = pad.now.some((v, i) => v && !pad.prev[i]) || this.stick(pad, 0).m > 0 || this.stick(pad, 1).m > 0;
      if (any) {
        this.active = pad;
        this.setUsing(true);
      }
      // remapeamento: o próximo botão pressionado vira a nova ligação
      if (this.listen && this.listen.pad === pad) {
        const b = pad.now.findIndex((v, i) => v && !pad.prev[i]);
        if (b >= 0) {
          const { action, done } = this.listen;
          this.listen = null;
          pad.map[action] = b;
          this.saveProfile(pad);
          done?.(b);
          pad.prev = pad.now.slice(); // não dispara a ação na mesma pressão
        }
      }
    }
  }

  // analógico com zona morta radial, sensibilidade e inversão
  stick(pad, which) {
    const o = pad.opts;
    const s = o.swap ? 1 - which : which;
    let x = pad.axes[s * 2] || 0;
    let y = pad.axes[s * 2 + 1] || 0;
    if (o.invertY && which === 1) y = -y;
    const raw = Math.hypot(x, y);
    if (raw < o.dead) return { x: 0, y: 0, m: 0, raw };
    const m = Math.min(1, ((raw - o.dead) / (1 - o.dead)) * o.sens);
    return { x: (x / raw) * m, y: (y / raw) * m, m, raw };
  }
  held(pad, id) {
    return !!pad.now[pad.map[id]];
  }
  tapped(pad, id) {
    const b = pad.map[id];
    return !!pad.now[b] && !pad.prev[b];
  }

  // um quadro: traduz controles em entradas do jogo
  update(dt) {
    this.poll();
    const g = this.g;
    const inp = g.input;
    inp.vdown.clear();
    if (this.listen || !this.pads.length) {
      if (this.ownMove) inp.touchMove = inp.touchAim = null;
      this.ownMove = false;
      return;
    }
    const ui = g.ui;
    const inMenu = !!ui.screen || g.state !== 'playing';
    if (inMenu) {
      if (this.ownMove) inp.touchMove = inp.touchAim = null;
      this.ownMove = false;
      const pad = this.active;
      if (pad && this.usingPad) this.menuNav(pad, dt);
      return;
    }
    const coop = g.players.length > 1;
    const pads = coop ? this.pads.slice(0, 2) : [this.active || this.pads[0]];
    pads.forEach((pad, k) => {
      if (!pad) return;
      if (this.tapped(pad, 'pause')) return g.onKey({ code: 'Escape', repeat: false, preventDefault() {} });
      if (this.tapped(pad, 'tree')) return g.onKey({ code: 'Tab', repeat: false, preventDefault() {} });
      // tutorial: o botão "voltar" pula as dicas (mesmo efeito do botão Pular)
      if (g.tut && !Object.entries(pad.map).some(([id, b]) => id !== 'back' && id !== 'confirm' && b === pad.map.back) && this.tapped(pad, 'back')) g.skipTutorial();
      const who = coop ? (k ? 'p2' : 'p1') : 'solo';
      const codes = CODES[who];
      const akeys = ABILITY_KEYS[who];
      const press = (code) => {
        inp.vdown.add(code);
        if (!this.lastV?.has(code)) inp.pressed.add(code);
      };
      for (const id of ['fire', 'melee', 'reload', 'next', 'prev']) if (this.held(pad, id)) press(codes[id]);
      ['ab0', 'ab1', 'ab2', 'ult'].forEach((id, i) => {
        if (this.held(pad, id)) press(akeys[i][0]);
      });
      const mv = this.stick(pad, 0);
      let mx = mv.x;
      let my = mv.y;
      // direcional digital também move quando não está ligado a outra ação
      const bound = new Set(Object.values(pad.map));
      if (!bound.has(12) && pad.now[12]) my = -1;
      if (!bound.has(13) && pad.now[13]) my = 1;
      if (!bound.has(14) && pad.now[14]) mx = -1;
      if (!bound.has(15) && pad.now[15]) mx = 1;
      if (who === 'solo') {
        inp.touchMove = mx || my ? { x: mx, z: my } : null;
        const am = this.stick(pad, 1);
        inp.touchAim = am.m > 0.25 ? { x: am.x, z: am.y } : null;
        if (mx || my || am.m) inp.mouseIdle = true;
        this.ownMove = true;
      } else {
        if (my < -0.35) press(codes.up);
        if (my > 0.35) press(codes.down);
        if (mx < -0.35) press(codes.left);
        if (mx > 0.35) press(codes.right);
      }
    });
    this.lastV = new Set(inp.vdown);
  }

  // menus: direcional/analógico move o foco, confirmar clica, voltar fecha
  menuNav(pad, dt) {
    const g = this.g;
    if (this.tapped(pad, 'pause') && g.state === 'paused') return g.onKey({ code: 'Escape', repeat: false, preventDefault() {} });
    if (this.tapped(pad, 'tree') && g.state === 'paused' && g.ui.screen === 'tree') return g.onKey({ code: 'Tab', repeat: false, preventDefault() {} });
    const s = this.stick(pad, 0);
    let dir = '';
    if (pad.now[12] || s.y < -0.6) dir = 'up';
    else if (pad.now[13] || s.y > 0.6) dir = 'down';
    else if (pad.now[14] || s.x < -0.6) dir = 'left';
    else if (pad.now[15] || s.x > 0.6) dir = 'right';
    const n = this.nav;
    if (!dir) {
      n.dir = '';
      n.t = 0;
    } else if (dir !== n.dir) {
      n.dir = dir;
      n.t = 0.38;
      this.move(dir);
    } else if ((n.t -= dt) <= 0) {
      n.t = 0.11;
      this.move(dir);
    }
    if (this.tapped(pad, 'confirm')) this.activate();
    else if (this.tapped(pad, 'back')) this.back();
    // ombros trocam de aba
    if (this.tapped(pad, 'melee') || this.tapped(pad, 'ab0')) this.tab(this.tapped(pad, 'melee') ? 1 : -1);
  }

  focusables() {
    const root = this.g.ui.screenEl;
    return [...root.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]')].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
    });
  }
  focus(el) {
    document.querySelectorAll('.pad-focus').forEach((e) => e.classList.remove('pad-focus'));
    if (!el) return;
    el.classList.add('pad-focus');
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    this.g.audio.play('ui_hover', { volume: 0.25 });
  }
  move(dir) {
    const list = this.focusables();
    if (!list.length) return;
    const cur = document.activeElement;
    if (!list.includes(cur)) return this.focus(list.find((e) => e.hasAttribute('data-focus')) || list.find((e) => e.classList.contains('primary')) || list[0]);
    // controle deslizante: esquerda/direita ajusta o valor
    if (cur.type === 'range' && (dir === 'left' || dir === 'right')) {
      const st = +cur.step || 0.05;
      cur.value = Math.min(+cur.max, Math.max(+cur.min, +cur.value + (dir === 'right' ? st : -st)));
      cur.dispatchEvent(new Event('input', { bubbles: true }));
      cur.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    const a = cur.getBoundingClientRect();
    const ax = a.left + a.width / 2;
    const ay = a.top + a.height / 2;
    let best = null;
    let bs = Infinity;
    for (const el of list) {
      if (el === cur) continue;
      const r = el.getBoundingClientRect();
      const dx = r.left + r.width / 2 - ax;
      const dy = r.top + r.height / 2 - ay;
      const main = dir === 'up' ? -dy : dir === 'down' ? dy : dir === 'left' ? -dx : dx;
      const side = dir === 'up' || dir === 'down' ? Math.abs(dx) : Math.abs(dy);
      if (main <= 4) continue;
      const score = main + side * 2.2;
      if (score < bs) {
        bs = score;
        best = el;
      }
    }
    if (best) this.focus(best);
  }
  activate() {
    const el = document.activeElement;
    if (!el || !this.g.ui.screenEl.contains(el)) return this.move('down');
    if (el.tagName === 'SELECT') {
      el.selectedIndex = (el.selectedIndex + 1) % el.options.length;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return;
    }
    el.click();
  }
  back() {
    const g = this.g;
    if (g.state === 'paused' && g.ui.screen === 'pause') return g.onKey({ code: 'Escape', repeat: false, preventDefault() {} });
    const root = g.ui.screenEl;
    (root.querySelector('.win-head .close') || root.querySelector('button.back'))?.click();
  }
  tab(d) {
    const tabs = [...this.g.ui.screenEl.querySelectorAll('[role="tab"]')];
    if (!tabs.length) return;
    const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    tabs[(i + d + tabs.length) % tabs.length]?.click();
  }

  // vibração (quando o navegador e o controle permitem)
  rumble(slot, strength = 0.5, ms = 120) {
    const pad = this.g.players.length > 1 ? this.pads[slot] : this.active;
    if (!pad || !pad.opts.rumble || !this.usingPad) return false;
    return this.vibrate(pad, strength * pad.opts.rumbleK, ms);
  }
  vibrate(pad, strength = 0.8, ms = 300) {
    const act = pad.gp?.vibrationActuator;
    if (act?.playEffect) {
      act.playEffect(act.type || 'dual-rumble', { duration: ms, strongMagnitude: Math.min(1, strength), weakMagnitude: Math.min(1, strength * 0.7) }).catch(() => {});
      return true;
    }
    if (pad.gp?.hapticActuators?.[0]?.pulse) {
      pad.gp.hapticActuators[0].pulse(Math.min(1, strength), ms);
      return true;
    }
    return false;
  }
}
