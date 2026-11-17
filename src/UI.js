import { WEAPONS, WEAPON_ORDER, WEAPON_GROUPS, SLOT_KEYS, UNLOCKS, SURVIVORS, ARENAS, TIPS, ENEMIES, ENEMY_ORDER, profileNeed } from './data.js';
import { ITEMS, ITEM_ORDER, ITEM_CATS, MELEE } from './items.js';
import { SCENERY, SCENERY_ORDER, SCENERY_CATS, SCENERY_BEH } from './scenery.js';
import { CROSSHAIRS, CROSSHAIR_ORDER, WEAPON_CROSSHAIR, CROSS_COLORS, crosshairSvg } from './crosshairs.js';
import { ACTIVES, ACTIVE_ORDER, ULTIMATES, ULT_ORDER, PASSIVES, BRANCHES, BUILDS, SYNERGIES, MAX_LEVEL, NODE_REQ, ULT_REQ, levelCost, xpNeed, loadLoadouts, saveLoadouts, ABILITY_LABELS } from './abilities.js';
import { Preview } from './Preview.js';
import { icon, weaponIcon, skullSvg } from './icons.js';
import { platform } from './platform.js';
import { ACTIONS, BROWSER_GUIDE, browserTip, browserName } from './gamepad.js';

// Construtor de DOM enxuto: h('div', { class: 'x', onclick }, filhos...)
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'style') el.style.cssText = v;
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c !== null && c !== undefined && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}
const fmt = (n) => Math.floor(n).toLocaleString('pt-BR');
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const tip = () => TIPS[Math.floor(Math.random() * TIPS.length)];
const EVENT_LABEL = { rain: 'CHUVA', blackout: 'APAGÃO', fog: 'NEBLINA', alarm: 'REFORÇOS', hordealarm: 'ALARME', overload: 'SOBRECARGA', toxicfog: 'NÉVOA TÓXICA' };

// ---- componentes do design system ----
// botão: btn('primary lg', 'play', 'Jogar', onclick)
const btn = (cls, ic, label, onclick, extra = {}) => h('button', { class: cls, onclick, ...extra }, ic ? icon(ic) : null, label);
const iconBtn = (cls, ic, label, onclick) => h('button', { class: 'icon-btn ' + cls, onclick, title: label, 'aria-label': label }, icon(ic));
// escritas no DOM com cache: o HUD roda todo quadro, mas só altera o que mudou
const setT = (el, v) => {
  v = String(v);
  if (el._t !== v) {
    el._t = v;
    el.textContent = v;
  }
};
const setW = (el, pct) => {
  const v = Math.round(Math.max(0, Math.min(100, pct)) * 2) / 2;
  if (el._w !== v) {
    el._w = v;
    el.style.width = v + '%';
  }
};
const setV = (el, prop, v) => {
  const c = el._v || (el._v = {});
  if (c[prop] !== v) {
    c[prop] = v;
    el.style.setProperty(prop, v);
  }
};
const tog = (el, cls, on) => {
  const c = el._c || (el._c = {});
  on = !!on;
  if (c[cls] !== on) {
    c[cls] = on;
    el.classList.toggle(cls, on);
  }
};
const chip = (ic, label, value, cls = '') => h('div', { class: 'chip ' + cls }, icon(ic), h('div', {}, h('small', {}, label), h('b', {}, value)));
function bar(kind) {
  const fill = h('div', { class: 'fill' });
  const val = h('span', { class: 'val' });
  return { el: h('div', { class: 'bar ' + kind }, fill, val), fill, val };
}
function logo() {
  return h('h1', { class: 'logo', 'aria-label': 'Block Horde' },
    h('span', { class: 'l1' }, 'BLOCK'),
    h('span', { class: 'l2' }, 'H', h('span', { class: 'skull', html: skullSvg() }), 'RDE'),
    h('i', { class: 'claw' }));
}
// silhueta da cidade com torre de vigia (fundo do menu)
function skyline() {
  let d = '';
  let x = 0;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  while (x < 1600) {
    const w = 30 + rnd() * 70;
    const hgt = 25 + rnd() * 70;
    d += `M${x} 150V${150 - hgt}h${w}V150z`;
    if (rnd() < 0.3) d += `M${x + w * 0.3} ${150 - hgt}v-${10 + rnd() * 18}h4v${10 + rnd() * 18}z`;
    x += w + rnd() * 6;
  }
  // torre de vigia
  const t = 820;
  d += `M${t - 26} 150l14-80h4l-10 80zM${t + 26} 150l-14-80h-4l10 80zM${t - 30} 70h60v-26h-60zM${t - 38} 44h76l-38-18z`;
  return h('div', { class: 'skyline', html: `<svg viewBox="0 0 1600 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a0c0e"/><stop offset="1" stop-color="#050608"/></linearGradient></defs><path fill="url(#sk)" d="${d}"/></svg>` });
}

export class UI {
  constructor(game, root) {
    this.g = game;
    this.root = root;
    this.screenEl = h('div', { class: 'screen-layer' });
    this.hudEl = h('div', { class: 'hud hidden' });
    this.bannerEl = h('div', { class: 'banner', role: 'status' });
    this.alertsEl = h('div', { class: 'alerts', 'aria-live': 'polite' });
    this.fpsEl = h('div', { class: 'fps hidden' });
    this.loadEl = null;
    // celular: faixa única de avisos no topo (não recebe toques)
    this.noticeEl = h('div', { class: 'notices', 'aria-live': 'polite' });
    // som bloqueado pelo navegador até o primeiro clique/toque: avisa e libera ao tocar
    this.soundEl = h('button', { class: 'sound-hint hidden', onclick: () => this.g.audio.unlock() }, icon('music'), h('span', {}, 'Clique ou toque para ativar o som'));
    root.append(this.soundEl);
    setInterval(() => {
      const ctx = this.g.audio.ctx;
      const muted = !!(window.AudioContext || window.webkitAudioContext) && (!ctx || ctx.state !== 'running'); // sem suporte a som: nada a liberar
      this.soundEl.classList.toggle('hidden', !muted || this.g.state === 'playing' && !this.g.pad?.usingPad);
      if (muted) this.soundEl.querySelector('span').textContent = this.g.input.touchMode ? 'Toque na tela para ativar o som' : this.g.pad?.usingPad ? 'Clique na tela ou aperte uma tecla para ativar o som' : 'Clique ou aperte uma tecla para ativar o som';
    }, 400);
    root.append(this.hudEl, this.bannerEl, this.alertsEl, this.screenEl, this.noticeEl, this.fpsEl);
    this.fpsAcc = 0;
    this.fpsN = 0;
    this.buildHud();
    // sons de interface em qualquer botão
    root.addEventListener('pointerover', (e) => {
      const b = e.target.closest('button:not(:disabled)');
      if (b && b !== this.lastHover) this.g.audio.play('ui_hover', { volume: 0.25 });
      this.lastHover = b;
    });
    root.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (b) this.g.audio.play(b.classList.contains('back') || b.classList.contains('close') ? 'ui_back' : 'ui_click', { volume: 0.5 });
    });
    // ESC fecha a janela aberta nos menus
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape' && this.g.state === 'menu') this.screenEl.querySelector('.win-head .close')?.click();
    });
  }

  // miniaturas das arenas: uma por vez, com folga entre elas para a tela não travar.
  // As já salvas saem na hora; as novas montam a cena 3D só uma vez por arena.
  queueThumb(pv, def, target) {
    const q = (this.thumbQ = this.thumbQ || []);
    q.push([def, target]);
    if (this.thumbBusy) return;
    this.thumbBusy = true;
    const step = () => {
      const job = q.shift();
      if (!job) {
        this.thumbBusy = false;
        return;
      }
      const [d, t] = job;
      if (!t.isConnected) return step(); // a tela foi fechada
      const quick = pv.hasThumb(d);
      pv.arenaThumb(d, t);
      if (quick) step();
      else setTimeout(step, 120);
    };
    requestAnimationFrame(() => setTimeout(step, 0)); // primeiro mostra a tela, depois desenha
  }

  getPreview() {
    if (this.preview === undefined) {
      try {
        this.preview = new Preview();
      } catch {
        this.preview = null; // sem segundo contexto WebGL: cartões ficam sem modelo
      }
    }
    return this.preview;
  }

  // ------------------------------------------------------------ carregamento
  loading(frac, text) {
    if (!this.loadEl) {
      this.loadBar = bar('loader');
      this.loadText = h('span');
      this.loadPct = h('span');
      this.loadEl = h('div', { class: 'loading' },
        logo(),
        h('div', { class: 'load-box' }, h('div', { class: 'load-row' }, this.loadText, this.loadPct), this.loadBar.el),
        h('p', { class: 'tip' }, h('b', {}, 'Dica: '), tip()));
      this.root.append(this.loadEl);
    }
    this.loadBar.fill.style.width = `${Math.round(frac * 100)}%`;
    this.loadPct.textContent = `${Math.round(frac * 100)}%`;
    this.loadText.textContent = text;
    if (frac >= 1) setTimeout(() => {
      this.loadEl?.classList.add('fade');
      setTimeout(() => {
        this.loadEl?.remove();
        this.loadEl = null;
      }, 400);
    }, 150);
  }

  // ------------------------------------------------------------ telas
  showScreen(name, data = {}, focus = true) {
    this.screen = name;
    this.screenData = data;
    document.body.classList.toggle('screen-open', !!name);
    this.screenEl.replaceChildren();
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    if (!name) return;
    this.bannerEl.className = 'banner';
    const el = this['scr_' + name](data);
    this.screenEl.append(el);
    if (focus) (el.querySelector('[data-focus]') || el.querySelector('button.primary'))?.focus({ preventScroll: true });
  }

  // janela padrão: borda vermelha, título com "///" e botão X que volta
  win(cls, title, onClose, ...kids) {
    return h('div', { class: 'overlay ' + cls },
      h('div', { class: 'panel', role: 'dialog', 'aria-label': typeof title === 'string' ? title : undefined },
        h('div', { class: 'win-head' },
          typeof title === 'string' ? h('h2', { class: 'title slashed' }, title) : title,
          onClose ? h('button', { class: 'close', onclick: onClose, title: 'Fechar (ESC)', 'aria-label': 'Fechar' }, icon('close')) : null),
        ...kids));
  }

  scr_menu() {
    return h('div', { class: 'overlay menu' },
      h('div', { class: 'menu-box' },
        h('div', {}, logo(), h('div', { class: 'logo-sub' }, 'Sobreviva à horda')),
        h('div', { class: 'menu-buttons' },
          btn('primary lg', 'play', 'Jogar agora', () => this.g.quickStart()),
          btn('', 'map', 'Escolher arena e sobrevivente', () => this.showScreen('pick', { mode: 'solo' })),
          btn('coop-btn', 'users', 'Co-op · 2 jogadores, 1 teclado', () => this.showScreen('pick', { mode: 'coop' })),
          h('div', { class: 'menu-duo' },
            btn('wide', 'bolt', 'Habilidades e builds', () => this.showScreen('skills')),
            btn('', 'skull', 'Inimigos', () => this.showScreen('enemies')),
            btn('', 'backpack', 'Itens', () => this.showScreen('items')),
            btn('', 'map', 'Cenário', () => this.showScreen('scenery')),
            btn('', 'trophy', 'Recordes', () => this.showScreen('records')),
            btn('', 'gamepad', 'Controles', () => this.showScreen('controls', { back: 'menu' })),
            btn('', 'gear', 'Configurações', () => this.showScreen('settings', { back: 'menu' })),
            btn('wide', 'info', 'Créditos', () => this.showScreen('credits')))),
        h('p', { class: 'tip' }, h('b', {}, 'Dica: '), tip())),
      skyline(),
      h('div', { class: 'version' }, 'v1.1 · tudo gerado por código'));
  }

  // escolha de personagem(ns)
  scr_pick({ mode, picks = [] }) {
    const need = mode === 'coop' ? 2 : 1;
    const who = picks.length;
    const back = () => (who ? this.showScreen('pick', { mode, picks: picks.slice(0, -1) }) : this.showScreen('menu'));
    const items = [];
    const grid = h('div', { class: 'pick-grid' },
      SURVIVORS.map((s, k) => {
        const taken = picks.includes(s);
        const canvas = h('canvas', { class: 'model', width: 220, height: 280, 'aria-hidden': 'true' });
        const item = { look: s, canvas, angle: 0.5 + k * 0.9, active: false };
        items.push(item);
        const pi = picks.indexOf(s);
        return h('button', {
          class: 'pick-card' + (taken ? ' taken' : ''),
          disabled: taken,
          'data-focus': k === 0 && !taken ? '' : undefined,
          'aria-label': `${s.name}, ${s.role}`,
          onpointerenter: () => (item.active = true),
          onpointerleave: () => (item.active = false),
          onfocus: () => (item.active = true),
          onblur: () => (item.active = false),
          onclick: () => {
            const np = [...picks, s];
            if (np.length >= need) this.showScreen('arena', { mode, picks: np });
            else this.showScreen('pick', { mode, picks: np });
          },
        }, taken ? h('span', { class: 'badge' + (pi ? ' p2' : '') }, icon('user'), `J${pi + 1}`) : null, canvas, h('strong', {}, s.name), h('small', {}, s.role));
      }));
    this.runPreviews(items);
    return this.win('pick', mode === 'coop' ? `Jogador ${who + 1}: escolha` : 'Escolha seu sobrevivente', back,
      h('p', { class: 'muted', style: 'margin:0 0 1rem' }, mode === 'coop' ? (who === 0 ? 'Jogador 1 usa WASD + Espaço. Jogador 2 usa as setas + Enter.' : `Jogador 1 escolheu ${picks[0].name}.`) : 'Todos têm os mesmos atributos; muda só a aparência.'),
      grid,
      h('div', { class: 'row' }, btn('back', 'back', 'Voltar', back)));
  }

  // modelos 3D girando nos cartões; o cartão sob o mouse vira de frente, anda e mira
  runPreviews(items, screen = 'pick', draw = (pv, it, t) => pv.draw(it.canvas, it.look, it.angle, t, it.active)) {
    const pv = this.getPreview();
    if (!pv) return;
    this.previewItems = items;
    const t0 = performance.now();
    let last = t0;
    let frame = 0;
    const loop = (now) => {
      if (this.previewItems !== items || this.screen !== screen) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - t0) / 1000;
       frame++;
      for (const it of items) {
        if (it.active) it.angle += Math.atan2(Math.sin(-it.angle), Math.cos(-it.angle)) * Math.min(1, dt * 8);
        else it.angle += dt * 0.7;
        if (it.active || frame % 3 === 0) draw(pv, it, t);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    for (const it of items) draw(pv, it, 0);
  }

  scr_arena({ mode, picks, sel = 0 }) {
    const rec = this.g.records();
    const pv = this.getPreview();
    const back = () => this.showScreen('pick', { mode, picks: picks.slice(0, -1) });
    const pf = this.g.profile();
    const open = ARENAS.map((a) => this.g.arenaUnlocked(a));
    let selected = open[sel] ? sel : Math.max(0, open.indexOf(true));
    const play = (k) => {
      if (open[k]) this.g.startMatch(ARENAS[k], picks, mode);
    };
    const cards = ARENAS.map((a, k) => {
      const r = rec[`${a.id}_${mode}`];
      const thumb = h('canvas', { class: 'thumb', width: 368, height: 200, 'aria-hidden': 'true' });
      if (pv) this.queueThumb(pv, a, thumb);
      const lock = !open[k];
      return h('button', {
        class: 'arena-card' + (k === selected ? ' selected' : '') + (lock ? ' locked' : ''),
        'aria-pressed': k === selected ? 'true' : 'false',
        'aria-disabled': lock ? 'true' : undefined,
        'data-focus': k === selected ? '' : undefined,
        onclick: () => (lock ? this.alert(`${a.name} libera no nível ${a.unlock} do perfil (você está no ${pf.level}).`, 'danger', 'lock') : select(k)),
        ondblclick: () => play(k),
      },
      h('span', { class: 'thumb-wrap' }, thumb, lock ? h('span', { class: 'lock-veil' }, icon('lock'), `Nível ${a.unlock}`) : null),
      h('span', { class: 'check' }, icon('check')),
      h('span', { class: 'a-name' }, icon('map'), a.name),
      a.diff ? h('span', { class: 'a-tags' },
        h('span', { class: `diff d${a.diff.tier}` }, icon('skull'), a.diff.label),
        a.eventName ? h('span', { class: 'ev' }, icon('warning'), a.eventName) : null) : null,
      h('small', {}, a.desc),
      a.tip ? h('small', { class: 'tip' }, a.tip) : null,
      h('span', { class: 'rec' }, icon(lock ? 'lock' : 'trophy'), lock ? `Bloqueada: nível ${a.unlock}` : r ? `Recorde: ${fmt(r.score)} · onda ${r.wave}` : 'Sem recorde ainda'));
    });
    const select = (k) => {
      selected = k;
      cards.forEach((c, i) => {
        c.classList.toggle('selected', i === k);
        c.setAttribute('aria-pressed', i === k ? 'true' : 'false');
      });
    };
    const need = profileNeed(pf.level);
    return this.win('arena', 'Escolha a arena', back,
      h('div', { class: 'profile-line' }, icon('star'), h('b', {}, `Nível ${pf.level}`),
        h('span', { class: 'pbar' }, h('i', { style: `width:${Math.round((pf.xp / need) * 100)}%` })),
        h('small', {}, `${fmt(pf.xp)} / ${fmt(need)} XP · cada partida rende XP de perfil e libera novas arenas`)),
      h('div', { class: 'arena-grid' }, cards),
      h('div', { class: 'row' },
        btn('back', 'back', 'Voltar', back),
        h('span', { class: 'grow' }),
        btn('primary lg', 'play', 'Jogar', () => play(selected))));
  }

  scr_records() {
    const rec = this.g.records();
    const rows = [];
    for (const a of ARENAS)
      for (const m of ['solo', 'coop']) {
        const r = rec[`${a.id}_${m}`];
        rows.push(h('tr', {},
          h('td', {}, a.name),
          h('td', {}, icon(m === 'solo' ? 'user' : 'users'), m === 'solo' ? 'Solo' : 'Co-op'),
          h('td', {}, r ? h('span', {}, icon('trophy'), fmt(r.score)) : '—'),
          h('td', {}, r ? r.wave : '—'),
          h('td', {}, r ? 'x' + r.mult : '—'),
          h('td', {}, r ? new Date(r.date).toLocaleDateString('pt-BR') : '—')));
      }
    const del = btn('danger', 'trash', 'Excluir recordes', (e) => {
      const b = e.currentTarget;
      if (b.dataset.armed) {
        try {
          platform.removeItem('blockhorde_records_v1');
        } catch {
          /* ignora */
        }
        this.showScreen('records');
        this.alert('Recordes excluídos.', 'success');
      } else {
        b.dataset.armed = '1';
        b.lastChild.textContent = 'Clique de novo para confirmar';
      }
    });
    return this.win('records', 'Recordes', () => this.showScreen('menu'),
      h('div', { class: 'table-wrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['Arena', 'Modo', 'Pontos', 'Onda', 'Mult. máx.', 'Data'].map((t) => h('th', {}, t)))), h('tbody', {}, rows))),
      h('div', { class: 'row' }, del, h('span', { class: 'grow' }), btn('primary back', 'check', 'Ok', () => this.showScreen('menu'))));
  }

  scr_controls({ back, tab = 0 }) {
    const sets = [
      { ic: 'user', name: 'Solo', rows: [['W · A · S · D', 'Mover'], ['Mouse', 'Mirar'], ['Clique · Espaço', 'Atirar'], ['F · botão direito', 'Faca / machado'], ['Z · X · C', 'Habilidades ativas'], ['R', 'Ultimate'], ['Tab', 'Árvore de habilidades'], ['G', 'Recarregar'], ['Q · E · roda', 'Trocar arma'], ['1 – 9 · 0 · -', 'Grupo de armas (repita para alternar)'], ['P · ESC', 'Pausar']] },
      { ic: 'users', name: 'Jogador 1', rows: [['W · A · S · D', 'Mover e mirar'], ['Espaço', 'Atirar'], ['F', 'Faca / machado'], ['Z · X · C', 'Habilidades ativas'], ['R', 'Ultimate'], ['Tab', 'Árvore de habilidades'], ['G', 'Recarregar'], ['Q · E', 'Trocar arma'], ['P · ESC', 'Pausar']] },
      { ic: 'gamepad', name: 'Controle', rows: this.padRows(this.g.pad?.active) },
      { ic: 'users', name: 'Jogador 2', rows: [['↑ · ↓ · ← · →', 'Mover e mirar'], ['Enter · Num 0 · L', 'Atirar'], ['K · / · Num 1', 'Faca / machado'], ['U · I · O (Num 4 5 6)', 'Habilidades ativas'], ['J · Num 8', 'Ultimate'], ['H · Num 3', 'Recarregar'], [', · .', 'Trocar arma'], ['Shift direito', 'Próxima arma']] },
    ];
    const s = sets[tab];
    const keys = (k) => k.split(' · ').map((x) => h('kbd', {}, x));
    const tabs = h('div', { class: 'tabs', role: 'tablist' },
      sets.map((t, i) => h('button', { class: 'tab', role: 'tab', 'aria-selected': i === tab ? 'true' : 'false', 'data-focus': i === tab ? '' : undefined, onclick: () => this.showScreen('controls', { back, tab: i }) }, icon(t.ic), t.name)));
    return this.win('controls', 'Controles', () => this.showScreen(back),
      tabs,
      h('div', { class: 'table-wrap' }, h('table', { class: 'keys' }, h('tbody', {}, s.rows.map(([k, v]) => h('tr', {}, h('td', {}, keys(k)), h('td', {}, v)))))),
      h('p', { class: 'muted' }, 'No teclado, a mira segue a direção do movimento e corrige levemente para o zumbi mais próximo à frente. O carregador vazio recarrega sozinho. Objetos interativos (geradores, painéis, totens, alavancas e altares) funcionam ficando ao lado deles. Itens são coletados ao encostar; os que não servem no momento ficam no chão.'),
      tab === 3 ? h('p', { class: 'muted' }, this.g.pad?.pads.length ? `Controle ativo: ${(this.g.pad.active || this.g.pad.pads[0]).info.model}. Os ícones seguem o fabricante do controle. No co-op, o 1º controle é o Jogador 1 e o 2º é o Jogador 2.` : 'Nenhum controle detectado: os ícones mostram o layout Xbox. Conecte o controle e pressione um botão.') : null,
      tab === 3 ? h('p', { class: 'pad-tip' }, icon('info'), BROWSER_GUIDE) : null,
      h('div', { class: 'row end' }, btn('', 'gamepad', 'Configurar e testar controle', () => this.showScreen('gamepad', { back: () => this.showScreen('controls', { back, tab: 3 }) })), btn('primary back', 'check', 'Ok', () => this.showScreen(back))));
  }

  // ------------------------------------------------------------ controle (gamepad)
  padRows(pad) {
    const P = this.g.pad;
    return [
      ['Analógico esquerdo · Direcional', 'Mover'],
      ['Analógico direito', 'Mirar (solto: mira no zumbi mais próximo, conforme o modo de mira)'],
      ...ACTIONS.map((a) => [P.actionGlyph(a.id, pad), a.name]),
      [`${P.actionGlyph('ab0', pad)} · ${P.actionGlyph('melee', pad)}`, 'Menus: trocar de aba'],
    ];
  }
  // HUD: mostra o botão do controle no lugar da tecla quando o controle está em uso
  padLabels() {
    const P = this.g.pad;
    if (!P) return;
    this.hudEl.querySelectorAll('kbd[data-ab]').forEach((kb) => {
      const pad = this.g.players.length > 1 ? P.pads[+kb.dataset.pl] : P.active;
      kb.textContent = P.usingPad && pad ? P.actionGlyph(['ab0', 'ab1', 'ab2', 'ult'][+kb.dataset.ab], pad) : kb.dataset.key;
    });
    if (this.g.tut) this.tutorial(this.g.tut.step); // dicas do tutorial seguem o dispositivo em uso
  }
  // nome do comando da árvore no dispositivo em uso (Tab no teclado)
  treeKey() {
    if (this.g.pad?.usingPad) return this.g.pad.actionGlyph('tree');
    return this.g.input.touchMode ? 'na pausa' : 'Tab'; // celular: a árvore abre pelo botão de pausa
  }
  padChanged() {
    this.padLabels();
    if (this.screen === 'gamepad' || this.screen === 'controls') this.showScreen(this.screen, this.screenData);
  }

  scr_gamepad({ back, sel = 0, tab = 0 }) {
    const P = this.g.pad;
    const goBack = typeof back === 'function' ? back : () => this.showScreen(back || 'menu');
    const re = (o = {}) => this.showScreen('gamepad', { back, sel, tab, ...o });
    const pad = P.pads[Math.min(sel, P.pads.length - 1)];
    if (!pad) {
      return this.win('gamepad', 'Controle', goBack,
        h('div', { class: 'pad-empty' }, icon('gamepad'),
          h('h3', { class: 'section' }, 'Nenhum controle detectado'),
          h('p', {}, 'Conecte o controle por USB ou Bluetooth e pressione qualquer botão. Por segurança, o navegador só mostra o controle ao jogo depois do primeiro botão pressionado.'),
          h('p', { class: 'muted' }, 'Perfis prontos: Xbox One, Xbox Series X|S, DualShock 4, DualSense, Switch Pro Controller, Joy-Con, 8BitDo, Logitech e controles USB/Bluetooth genéricos. O reconhecimento depende do sistema, do driver e do navegador.'),
          h('p', { class: 'pad-tip' }, icon('info'), `Você está no ${browserName()}. ${BROWSER_GUIDE}`)),
        h('div', { class: 'row end' }, btn('primary back', 'check', 'Ok', goBack)));
    }
    const fam = pad.info.family;
    const famName = { xbox: 'Xbox', playstation: 'PlayStation', nintendo: 'Nintendo', generic: 'Genérico' }[fam];
    const devs = P.pads.length > 1 ? h('div', { class: 'tabs' }, P.pads.map((p, i) => h('button', { class: 'tab', role: 'tab', 'aria-selected': p === pad ? 'true' : 'false', onclick: () => re({ sel: i }) }, icon('gamepad'), `${i + 1}. ${p.info.model}`))) : null;
    const tabs = h('div', { class: 'tabs', role: 'tablist' },
      [['bolt', 'Diagnóstico'], ['gear', 'Ajustes'], ['gamepad', 'Botões']].map(([ic, name], i) => h('button', { class: 'tab', role: 'tab', 'aria-selected': i === tab ? 'true' : 'false', 'data-focus': i === tab ? '' : undefined, onclick: () => re({ tab: i }) }, icon(ic), name)));
    const gp = pad.gp;
    const vib = gp.vibrationActuator ? 'Disponível' : gp.hapticActuators?.length ? 'Disponível (háptico)' : 'Não informada pelo navegador';
    const info = h('div', { class: 'pad-info' }, [
      ['Fabricante', pad.info.maker], ['Modelo', pad.info.model], ['Perfil de ícones', famName],
      ['Identificador', gp.id], ['Conexão', pad.info.conn], ['Botões', gp.buttons.length], ['Eixos', gp.axes.length],
      ['Mapeamento', gp.mapping === 'standard' ? 'Padrão (standard)' : 'Fora do padrão: confira e remapeie na aba Botões'], ['Vibração', vib], ['Estado', gp.connected ? 'Conectado' : 'Desconectado'],
    ].map(([k, v]) => h('div', {}, h('span', {}, k), h('b', {}, String(v)))));
    const tip = browserTip(fam);
    let body;
    if (tab === 0) {
      const toneOf = (i) => (fam === 'xbox' ? ['ok', 'bad', 'info', 'act'][i] || '' : fam === 'playstation' ? ['info', 'bad', 'act', 'ok'][i] || '' : '');
      const btns = gp.buttons.map((_, i) => h('span', { class: 'pad-b ' + toneOf(i) }, P.glyph(i, pad)));
      const stick = (n) => {
        const dot = h('i', { class: 'dot' });
        const val = h('small', {}, '0.00, 0.00');
        return { el: h('div', { class: 'pad-stick' }, h('div', { class: 'well' }, h('i', { class: 'dz', style: `--dz:${pad.opts.dead * 100}%` }), dot), h('span', {}, n), val), dot, val };
      };
      const sl = stick('Analógico esquerdo');
      const sr = stick('Analógico direito');
      const trig = (i, n) => {
        const f = h('i', {});
        return { el: h('div', { class: 'pad-trig' }, h('span', {}, `${n} (${P.glyph(i, pad)})`), h('div', { class: 'bar' }, f)), f, i };
      };
      const tl = trig(6, 'Gatilho esquerdo');
      const tr = trig(7, 'Gatilho direito');
      const axes = h('div', { class: 'pad-axes' });
      body = h('div', { class: 'pad-test' },
        h('div', { class: 'pad-sticks' }, sl.el, sr.el, h('div', { class: 'pad-trigs' }, tl.el, tr.el)),
        h('div', { class: 'pad-btns' }, btns), axes,
        h('div', { class: 'row' }, btn('', 'bolt', 'Testar vibração', () => {
          if (!P.vibrate(pad, 1, 450)) this.alert('Este controle ou navegador não oferece vibração.', 'info', 'bolt');
        })));
      const loop = () => {
        if (!body.isConnected) return;
        const now = pad.now || [];
        btns.forEach((b, i) => b.classList.toggle('on', !!now[i]));
        for (const [s, k] of [[sl, 0], [sr, 1]]) {
          const a = pad.opts.swap ? 1 - k : k;
          const x = pad.axes[a * 2] || 0;
          const y = pad.axes[a * 2 + 1] || 0;
          s.dot.style.transform = `translate(${x * 46}px, ${y * 46}px)`;
          s.dot.classList.toggle('on', P.stick(pad, k).m > 0);
          s.val.textContent = `${x.toFixed(2)}, ${y.toFixed(2)}`;
        }
        for (const t of [tl, tr]) {
          t.f.style.width = `${(pad.vals?.[t.i] || 0) * 100}%`;
          t.f.classList.toggle('on', !!now[t.i]);
        }
        axes.textContent = 'Eixos brutos: ' + pad.axes.map((a, i) => `${i}: ${a.toFixed(2)}`).join('  ·  ');
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    } else if (tab === 1) {
      const o = pad.opts;
      const save = () => P.saveProfile(pad);
      const slider = (ic, label, key, min, max, step, fmt) => {
        const pct = () => `${((o[key] - min) / (max - min)) * 100}%`;
        const out = h('output', {}, fmt(o[key]));
        return h('label', { class: 'set' }, icon(ic), h('span', {}, label),
          h('input', { type: 'range', min, max, step, value: o[key], 'aria-label': label, style: `--p:${pct()}`, oninput: (e) => {
            o[key] = +e.target.value;
            e.target.style.setProperty('--p', pct());
            out.textContent = fmt(o[key]);
            save();
          } }), out);
      };
      const sw = (ic, label, key) => h('div', { class: 'set' }, icon(ic), h('span', {}, label),
        h('label', { class: 'switch ctrl' },
          h('input', { type: 'checkbox', checked: !!o[key], role: 'switch', 'aria-label': label, onchange: (e) => {
            o[key] = e.target.checked;
            save();
          } }),
          h('span', { class: 'track' })));
      const pc = (v) => Math.round(v * 100) + '%';
      body = h('div', {},
        h('h3', { class: 'section slashed' }, 'Analógicos'),
        slider('target', 'Zona morta', 'dead', 0.05, 0.4, 0.01, pc),
        slider('bolt', 'Sensibilidade', 'sens', 0.5, 2, 0.05, (v) => v.toFixed(2) + '×'),
        sw('target', 'Inverter eixo vertical da mira', 'invertY'),
        sw('gamepad', 'Trocar analógicos (mover com o direito)', 'swap'),
        h('h3', { class: 'section slashed' }, 'Gatilhos'),
        slider('target', 'Ponto de acionamento', 'trig', 0.1, 0.9, 0.05, pc),
        h('h3', { class: 'section slashed' }, 'Vibração'),
        sw('bolt', 'Vibrar ao levar dano', 'rumble'),
        slider('bolt', 'Intensidade', 'rumbleK', 0, 1, 0.05, pc),
        h('div', { class: 'row' },
          btn('', 'bolt', 'Testar vibração', () => {
            if (!P.vibrate(pad, o.rumbleK, 400)) this.alert('Este controle ou navegador não oferece vibração.', 'info', 'bolt');
          }),
          h('span', { class: 'grow' }),
          btn('danger', 'close', 'Restaurar padrões', () => {
            P.resetProfile(pad);
            this.alert('Padrões restaurados para este controle.', 'success');
            re();
          })),
        h('p', { class: 'muted' }, `Os ajustes ficam salvos no perfil deste controle (${pad.info.model}).`));
    } else {
      const game = new Set(['fire', 'melee', 'ab0', 'ab1', 'ab2', 'ult', 'reload', 'next', 'prev', 'tree', 'pause']);
      const count = {};
      for (const a of ACTIONS) if (game.has(a.id)) count[pad.map[a.id]] = (count[pad.map[a.id]] || 0) + 1;
      body = h('div', {}, h('div', { class: 'table-wrap' }, h('table', { class: 'keys pad-map' }, h('tbody', {}, ACTIONS.map((a) => {
        const b = pad.map[a.id];
        const clash = game.has(a.id) && count[b] > 1;
        const ch = btn('', 'gamepad', 'Alterar', (e) => {
          const el = e.currentTarget;
          el.lastChild.textContent = 'Pressione um botão…';
          el.classList.add('primary');
          P.listen = { pad, action: a.id, done: () => re({ tab: 2 }) };
        });
        return h('tr', {}, h('td', {}, a.name), h('td', {}, h('kbd', {}, P.glyph(b, pad)), clash ? h('span', { class: 'bad-tag' }, 'conflito') : null), h('td', {}, ch));
      })))),
      h('div', { class: 'row' }, h('span', { class: 'grow' }), btn('danger', 'close', 'Restaurar padrões', () => {
        P.resetProfile(pad);
        this.alert('Padrões restaurados para este controle.', 'success');
        re();
      })));
    }
    const close = () => {
      P.listen = null;
      goBack();
    };
    return this.win('gamepad', 'Controle', close, devs, info, tip ? h('p', { class: 'pad-tip bad' }, icon('warning'), tip) : null, tabs, body, h('div', { class: 'row end' }, btn('primary back', 'check', 'Ok', close)));
  }

  // celular: tamanho dos botões, tiro automático e vibração
  touchSettings(slider) {
    const g = this.g;
    const s = g.settings;
    const sw = (ic, label, key) => h('div', { class: 'set' }, icon(ic), h('span', {}, label),
      h('label', { class: 'switch ctrl' },
        h('input', { type: 'checkbox', checked: s[key] !== false, role: 'switch', 'aria-label': label, onchange: (e) => {
          s[key] = e.target.checked;
          g.saveSettings();
        } }),
        h('span', { class: 'track' })));
    return [
      h('h3', { class: 'section slashed' }, 'Celular'),
      slider('gamepad', 'Tamanho dos botões', 'touchSize', 0.8, 1.4, 0.05, () => g.touch.applySettings()),
      sw('target', 'Tiro automático', 'touchAuto'),
      sw('bolt', 'Vibração', 'touchHaptic'),
      h('div', { class: 'set' }, icon('info'), h('span', {}, 'Duração dos avisos'),
        h('span', { class: 'select ctrl' }, icon('clock'),
          h('select', { 'aria-label': 'Duração dos avisos', onchange: (e) => {
            s.notifyDur = +e.target.value;
            g.saveSettings();
          } }, [[0.7, 'Curta'], [1, 'Normal'], [1.5, 'Longa']].map(([v, t]) => h('option', { value: v, selected: (s.notifyDur ?? 1) === v }, t))),
          icon('chevron', 'chev'))),
    ];
  }

  scr_settings({ back, tab = 0 }) {
    const g = this.g;
    const s = g.settings;
    const slider = (ic, label, key, min = 0, max = 1, step = 0.05, after = () => g.applyVolumes()) => {
      const pct = () => `${((s[key] - min) / (max - min)) * 100}%`;
      const out = h('output', {}, Math.round(s[key] * 100) + '%');
      const input = h('input', { type: 'range', min, max, step, value: s[key], 'aria-label': label, style: `--p:${pct()}`, oninput: (e) => {
        s[key] = +e.target.value;
        e.target.style.setProperty('--p', pct());
        out.textContent = Math.round(s[key] * 100) + '%';
        after();
        g.saveSettings();
      } });
      return h('label', { class: 'set' }, icon(ic), h('span', {}, label), input, out);
    };
    const tabs = h('div', { class: 'tabs set-tabs', role: 'tablist' },
      [['gear', 'Geral'], ['target', 'Mira']].map(([ic, name], i) => h('button', { class: 'tab', role: 'tab', 'aria-selected': i === tab ? 'true' : 'false', 'data-focus': i === tab ? '' : undefined, onclick: () => this.showScreen('settings', { back, tab: i }) }, icon(ic), name)));
    if (tab === 1) return this.win('settings', 'Configurações', () => this.showScreen(back), tabs, ...this.crossSettings(slider, back),
      h('div', { class: 'row end' }, btn('primary back', 'check', 'Confirmar', () => this.showScreen(back))));
    const quality = h('span', { class: 'select ctrl' }, icon('monitor'),
      h('select', { 'aria-label': 'Qualidade gráfica', onchange: (e) => {
        s.quality = e.target.value;
        g.applyQuality();
        g.saveSettings();
      } }, [['low', 'Baixa (sem sombras)'], ['medium', 'Média'], ['high', 'Alta']].map(([v, t]) => h('option', { value: v, selected: s.quality === v }, t))),
      icon('chevron', 'chev'));
    const fps = h('label', { class: 'switch ctrl' },
      h('input', { type: 'checkbox', checked: s.showFps, role: 'switch', 'aria-label': 'Mostrar FPS', onchange: (e) => {
        s.showFps = e.target.checked;
        g.saveSettings();
        tog(this.fpsEl, 'hidden', !s.showFps);
      } }),
      h('span', { class: 'track' }));
    return this.win('settings', 'Configurações', () => this.showScreen(back),
      tabs,
      slider('volume', 'Volume geral', 'master'),
      slider('music', 'Música', 'music'),
      slider('burst', 'Efeitos', 'sfx'),
      h('div', { class: 'set' }, icon('monitor'), h('span', {}, 'Qualidade gráfica'), quality),
      h('div', { class: 'set' }, icon('bolt'), h('span', {}, 'Mostrar FPS'), fps),
      ...(g.input.touchMode ? this.touchSettings(slider) : []),
      h('p', { class: 'muted' }, 'A quantidade de partículas e zumbis simultâneos muda na próxima partida.'),
      h('div', { class: 'row end' }, btn('primary back', 'check', 'Confirmar', () => this.showScreen(back))));
  }

  // ------------------------------------------------------------ habilidades
  // árvore (durante a partida, Tab ou pausa): 4 ramos de passivas com 5 níveis e a ultimate
  scr_tree({ k = 0 } = {}) {
    const g = this.g;
    const p = g.players[k] || g.players[0];
    const back = () => g.resume();
    const redraw = () => {
      // mantém a posição da rolagem: comprar um nó lá embaixo não volta para o topo
      const sc = document.querySelector('.overlay.tree .panel')?.scrollTop || 0;
      this.showScreen('tree', { k: p.id }, false);
      const restore = () => {
        const panel = document.querySelector('.overlay.tree .panel');
        if (panel) panel.scrollTop = sc;
      };
      restore();
      requestAnimationFrame(restore);
    };
    // no celular o botão é grande e o dedo toca duas vezes sem querer: ignora o toque que abriu a tela
    this.treeT = performance.now();
    const arm = () => performance.now() - this.treeT > 350;
    const rec = new Set(BUILDS.find((b) => b.id === p.build)?.passives || []);
    const pips = (n) => h('span', { class: 'pips' }, Array.from({ length: MAX_LEVEL }, (_, i) => h('i', { class: i < n ? 'on' : '' })));
    const node = (id, i, br) => {
      const d = PASSIVES[id];
      const lvl = p.pas[id] || 0;
      const st = g.nodeState(p, id);
      const cost = levelCost(lvl + 1);
      return h('div', { class: `node st-${st}` + (rec.has(id) ? ' rec' : ''), style: `--bc:${br.color}` },
        i ? h('i', { class: 'link' + ((p.pas[br.nodes[i - 1]] || 0) >= NODE_REQ ? ' open' : '') }) : null,
        h('div', { class: 'node-head' }, icon(d.icon), h('b', {}, d.name), h('small', {}, String(d.n).padStart(2, '0'))),
        pips(lvl),
        h('div', { class: 'node-fx' }, lvl ? d.fmt(d.v(lvl)) : 'Não comprada'),
        st === 'max' ? h('div', { class: 'node-next' }, 'Nível máximo') : h('div', { class: 'node-next' }, 'Próximo: ', d.fmt(d.v(lvl + 1))),
        st === 'max' ? null : st === 'locked'
          ? h('div', { class: 'node-lock' }, icon('lock'), `Requer ${PASSIVES[br.nodes[i - 1]].name} nível ${NODE_REQ}`)
          : btn('sm' + (st === 'ok' ? ' primary' : ''), 'star', `Comprar · ${cost} pt${cost > 1 ? 's' : ''}`, () => { if (arm() && g.buyPassive(p, id)) redraw(); }, { disabled: st !== 'ok' }));
    };
    const ultId = p.slots[3];
    const ud = ULTIMATES[ultId];
    const us = g.ultState(p);
    return this.win('tree', h('h2', { class: 'title slashed' }, 'Árvore de habilidades'), back,
      g.players.length > 1 ? h('div', { class: 'tabs' }, g.players.map((q) => h('button', { class: 'tab', role: 'tab', 'aria-selected': q === p ? 'true' : 'false', onclick: () => this.showScreen('tree', { k: q.id }) }, icon('user'), `J${q.id + 1} · ${q.look.name}`))) : null,
      h('div', { class: 'tree-top' },
        h('span', { class: 'lvl big' }, `Nível ${p.lv}`),
        h('div', { class: 'xpbar wide' }, h('i', { style: `width:${(p.xp / xpNeed(p.lv)) * 100}%` })),
        h('small', { class: 'muted' }, `${p.xp} / ${xpNeed(p.lv)} XP`),
        h('span', { class: 'pts-big' }, icon('star'), `${p.pts} ponto${p.pts === 1 ? '' : 's'}`)),
      h('p', { class: 'muted tree-help', style: 'margin:0.2rem 0 0.8rem' }, 'Abates dão XP (o parceiro ganha metade). Cada nível dá 1 ponto. Níveis custam 1, 1, 2, 2 e 3 pontos; o próximo nó do ramo abre com o anterior no nível 2.' + (rec.size ? ' Estrela = recomendado para sua build.' : '')),
      h('div', { class: 'tree-grid' }, BRANCHES.map((br) => h('div', { class: 'branch', style: `--bc:${br.color}` },
        h('div', { class: 'branch-head' }, icon(br.icon), h('div', {}, h('b', {}, br.name), h('small', {}, `${br.tag} · ${br.desc}`))),
        br.nodes.map((id, i) => node(id, i, br))))),
      h('div', { class: `ult-row st-${us}`, style: `--bc:${ud.color}` },
        icon(ud.icon), h('div', {}, h('b', {}, `Ultimate: ${ud.name}`), h('small', {}, ud.desc)),
        us === 'on' ? h('span', { class: 'ok-tag' }, icon('check'), `Liberada (${ABILITY_LABELS[g.players.length > 1 ? (p.id ? 'p2' : 'p1') : 'solo'][3]})`)
          : us === 'locked' ? h('span', { class: 'node-lock' }, icon('lock'), `Bloqueada até o nível ${ULT_REQ.level}`)
            : btn('sm' + (us === 'ok' ? ' primary' : ''), 'star', `Liberar · ${ULT_REQ.cost} pts`, () => { if (arm() && g.buyUlt(p)) redraw(); }, { disabled: us !== 'ok' })),
      h('div', { class: 'row' }, h('span', { class: 'muted tree-help' }, 'Habilidades equipadas e builds: menu principal → Habilidades.'), h('span', { class: 'grow' }), btn('primary back lg', 'play', g.input.touchMode ? 'Voltar ao jogo' : `Voltar ao jogo (${this.treeKey()})`, back)));
  }

  // montagem (menu): 3 ativas + 1 ultimate por jogador, builds prontas e interações
  scr_skills({ k = 0 } = {}) {
    const lds = loadLoadouts();
    const ld = lds[k];
    const save = () => {
      saveLoadouts(lds);
      this.showScreen('skills', { k });
    };
    const keys = ABILITY_LABELS[k ? 'p2' : 'solo'];
    const actCard = (id) => {
      const d = ACTIVES[id];
      const slot = ld.actives.indexOf(id);
      return h('button', { class: 'skill' + (slot >= 0 ? ' sel' : ''), style: `--ac:${d.color}`, 'aria-pressed': slot >= 0 ? 'true' : 'false', onclick: () => {
        if (slot >= 0) return; // já equipada: troque escolhendo outra
        ld.actives = [...ld.actives.slice(1), id]; // entra no fim, sai a mais antiga
        ld.build = null;
        save();
      } },
      h('span', { class: 'sk-ic' }, icon(d.icon)), slot >= 0 ? h('kbd', {}, keys[slot]) : null,
      h('b', {}, `${String(d.n).padStart(2, '0')} · ${d.name}`), h('small', {}, d.desc), h('span', { class: 'cdtag' }, icon('clock'), `${d.cd} s`));
    };
    const ultCard = (id) => {
      const d = ULTIMATES[id];
      const sel = ld.ult === id;
      return h('button', { class: 'skill ult' + (sel ? ' sel' : ''), style: `--ac:${d.color}`, 'aria-pressed': sel ? 'true' : 'false', onclick: () => { ld.ult = id; ld.build = null; save(); } },
        h('span', { class: 'sk-ic' }, icon(d.icon)), sel ? h('kbd', {}, keys[3]) : null,
        h('b', {}, `${d.n} · ${d.name}`), h('small', {}, d.desc), h('span', { class: 'cdtag' }, icon('clock'), `${d.cd} s`));
    };
    const buildBtn = (b) => h('button', { class: 'build' + (ld.build === b.id ? ' sel' : ''), onclick: () => { ld.actives = [...b.actives]; ld.ult = b.ult; ld.build = b.id; save(); } },
      h('small', {}, b.kind), h('b', {}, b.name), h('span', {}, b.desc),
      h('span', { class: 'bpas' }, 'Passivas: ', b.passives.map((id) => PASSIVES[id].name).join(', ')));
    return this.win('skills', 'Habilidades', () => this.showScreen('menu'),
      h('div', { class: 'tabs' }, [0, 1].map((i) => h('button', { class: 'tab', role: 'tab', 'aria-selected': i === k ? 'true' : 'false', onclick: () => this.showScreen('skills', { k: i }) }, icon(i ? 'users' : 'user'), i ? 'Jogador 2 (co-op)' : 'Jogador 1 / Solo'))),
      h('p', { class: 'muted', style: 'margin:0 0 0.6rem' }, `Equipe 3 ativas (teclas ${keys.slice(0, 3).join(', ')}) e 1 ultimate (${keys[3]}). Durante a partida, abates dão XP e pontos para a árvore de passivas (Tab). A ultimate é liberada na árvore a partir do nível ${ULT_REQ.level}.`),
      h('h3', { class: 'section slashed' }, 'Builds prontas'),
      h('div', { class: 'builds' }, BUILDS.map(buildBtn)),
      h('h3', { class: 'section slashed' }, `Ativas · ${ld.actives.map((id, i) => `${keys[i]}: ${ACTIVES[id].name}`).join(' · ')}`),
      h('div', { class: 'skill-grid' }, ACTIVE_ORDER.map(actCard)),
      h('h3', { class: 'section slashed' }, 'Ultimate'),
      h('div', { class: 'skill-grid ults' }, ULT_ORDER.map(ultCard)),
      h('h3', { class: 'section slashed' }, 'Passivas (árvore durante a partida)'),
      h('div', { class: 'pas-list' }, BRANCHES.map((br) => h('div', { style: `--bc:${br.color}` }, h('b', {}, icon(br.icon), br.name), br.nodes.map((id) => h('span', {}, `${String(PASSIVES[id].n).padStart(2, '0')} ${PASSIVES[id].name}: ${PASSIVES[id].fmt(PASSIVES[id].v(1))} por nível`))))),
      h('h3', { class: 'section slashed' }, 'Interações'),
      h('ul', { class: 'syn' }, SYNERGIES.map((s) => h('li', {}, icon(ACTIVES[s.a].icon), '+', icon(ACTIVES[s.b].icon), h('b', {}, s.name), ' — ', s.desc))),
      h('div', { class: 'row end' }, btn('primary back', 'check', 'Ok', () => this.showScreen('menu'))));
  }

  // ------------------------------------------------------------ miras
  crossId(weapon) {
    const m = this.g.settings.crossMode;
    return m && m !== 'auto' && CROSSHAIRS[m] ? m : WEAPON_CROSSHAIR[weapon] || 'classic';
  }
  // aplica modelo, cor, tamanho e opacidade num elemento .xh
  styleXh(x, id, base = 64) {
    const s = this.g.settings;
    const c = CROSSHAIRS[id];
    if (x.id !== id) {
      x.id = id;
      x.el.innerHTML = crosshairSvg(id);
      if (x.tag) x.el.append(x.tag);
      x.cls = '';
    }
    setV(x.el, '--xc', s.crossColor && s.crossColor !== 'default' ? s.crossColor : c.color);
    setV(x.el, '--k', `${Math.round(base * (s.crossSize ?? 1) * (c.size || 1))}px`);
    setV(x.el, '--op', String(s.crossOpacity ?? 0.95));
  }
  setXhState(x, st) {
    setV(x.el, '--s', st.s.toFixed(1));
    setV(x.el, '--t', st.t.toFixed(1));
    setV(x.el, '--u', st.u.toFixed(2));
    setV(x.el, '--hx', st.hx.toFixed(1));
    setV(x.el, '--hy', st.hy.toFixed(1));
    const cls = `xh x-${x.id}${st.over ? ' over' : ''}${st.locked ? ' locked' : ''}${st.kill ? ' kill' : st.hit ? ' hit' : ''}${st.stable ? ' stable' : ''}`;
    if (cls !== x.cls) {
      x.cls = cls;
      x.el.className = cls;
    }
  }

  crossSettings(slider, back) {
    const g = this.g;
    const s = g.settings;
    const aimModeOpts = [['Manual', 0], ['Assistido', 1], ['Automático', 2]];
    const aimSel = h('div', { class: 'row' }, ...aimModeOpts.map(([label, val]) =>
      h('button', { class: 'btn' + (s.aimMode === val ? ' primary' : ''), onclick: () => { s.aimMode = val; g.saveSettings(); this.showScreen('settings', { back, tab: 1 }); } }, label)))
    const redraw = () => this.showScreen('settings', { back, tab: 1 });
    const save = () => {
      g.saveSettings();
      redraw();
    };
    const sample = (id) => {
      const x = { el: h('div', { class: 'xh' }), id: null };
      this.styleXh(x, id, 46);
      x.el.style.setProperty('--k', `${Math.round(46 * Math.min(1.25, CROSSHAIRS[id].size || 1))}px`); // cartão: tamanho fixo
      return x.el;
    };
    const aimModeLabel = h('div', { class: 'set' }, icon('target'), h('span', {}, 'Modo de mira'), aimSel);
    const mode = s.crossMode || 'auto';
    const opts = [
      h('button', { class: 'cross-opt' + (mode === 'auto' ? ' sel' : ''), 'aria-pressed': mode === 'auto' ? 'true' : 'false', onclick: () => { s.crossMode = 'auto'; save(); } }, icon('refresh'), 'Automática (por arma)'),
      ...CROSSHAIR_ORDER.map((id) => h('button', { class: 'cross-opt' + (mode === id ? ' sel' : ''), 'aria-pressed': mode === id ? 'true' : 'false', title: CROSSHAIRS[id].desc, onclick: () => { s.crossMode = id; save(); } },
        sample(id), `${String(CROSSHAIRS[id].n).padStart(2, '0')} · ${CROSSHAIRS[id].name}`)),
    ];
    const autoList = h('p', { class: 'cross-auto' }, WEAPON_ORDER.map((w, i) => [i ? ' · ' : '', h('b', {}, WEAPONS[w].name), ': ', CROSSHAIRS[WEAPON_CROSSHAIR[w]].name]));
    const swatches = h('div', { class: 'swatches ctrl' }, CROSS_COLORS.map(([v, name, hex]) =>
      h('button', { class: 'swatch' + (v === 'default' ? ' def' : '') + ((s.crossColor || 'default') === v ? ' sel' : ''), style: hex ? `--sw:${hex}` : undefined, title: name, 'aria-label': `Cor: ${name}`, onclick: () => { s.crossColor = v; save(); } })));
    // prévia: um "zumbi" anda; a mira atira, encontra o alvo, trava e acerta (em ciclo)
    const pv = h('div', { class: 'cross-preview', 'aria-hidden': 'true' });
    const zb = h('div', { class: 'zb' });
    const cap = h('span', { class: 'cap' });
    const px = { el: h('div', { class: 'xh' }), id: null };
    pv.append(zb, px.el, cap);
    const t0 = performance.now();
    const loop = (now) => {
      if (this.screen !== 'settings' || !pv.isConnected) return;
      const t = ((now - t0) / 1000) % 6;
      const cyc = Math.floor((now - t0) / 6000);
      const weapon = mode === 'auto' ? WEAPON_ORDER[cyc % WEAPON_ORDER.length] : null;
      const id = weapon ? this.crossId(weapon) : mode;
      this.styleXh(px, id, 64);
      const W = pv.clientWidth || 400;
      const zx = W * 0.68;
      const zy = 85;
      zb.style.left = `${zx}px`;
      zb.style.top = `${zy}px`;
      // 0–1,5 s parada · 1,5–2,7 atirando · 2,7–4,2 sobre o alvo (trava) · 4,2–6 acertos
      const onTarget = t > 2.7;
      const cx = onTarget ? zx : W * 0.32 + Math.sin(t * 2) * 20;
      const cy = onTarget ? zy : 85 + Math.cos(t * 1.7) * 14;
      px.el.style.left = `${cx}px`;
      px.el.style.top = `${cy}px`;
      const shooting = (t > 1.5 && t < 2.7) || t > 4.2;
      const kick = shooting ? Math.max(0, Math.sin(t * 18)) : 0;
      const hit = t > 4.2 && Math.sin(t * 18) > 0.6;
      this.setXhState(px, { s: 2 + kick * 9, t: onTarget ? 4 : 0, u: shooting ? 0.8 : t < 1.5 ? 0 : 0.3, hx: Math.sin(t * 2) * 2, hy: kick * -2, over: onTarget, locked: t > 3.2, hit, kill: t > 5.6, stable: t < 1.5 });
      cap.textContent = `${weapon ? WEAPONS[weapon].name + ' → ' : ''}${CROSSHAIRS[id].name}: ${t < 1.5 ? 'parada (estável)' : t < 2.7 ? 'atirando (expande)' : t < 3.2 ? 'alvo encontrado' : t < 4.2 ? 'alvo travado' : 'acertos'}`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    const cur = mode === 'auto' ? null : CROSSHAIRS[mode];
    return [
      aimModeLabel,
      h('p', { class: 'muted', style: 'margin:0' }, 'Escolha "Automática" para cada arma usar a mira própria, ou fixe uma mira para todas.'),
      h('div', { class: 'cross-grid' }, opts),
      cur ? h('p', { class: 'cross-auto' }, h('b', {}, cur.name + ': '), cur.desc) : autoList,
      pv,
      h('div', { class: 'set' }, icon('star'), h('span', {}, 'Cor'), swatches),
      slider('target', 'Tamanho', 'crossSize', 0.6, 1.6, 0.05, () => {}),
      slider('monitor', 'Opacidade', 'crossOpacity', 0.2, 1, 0.05, () => {}),
    ];
  }

  // bestiário: todos os inimigos em 3D com o que cada um faz
  scr_enemies() {
    const items = [];
    const card = (type, k) => {
      const d = ENEMIES[type];
      const canvas = h('canvas', { class: 'model', width: 220, height: 280, 'aria-hidden': 'true' });
      const item = { type, canvas, angle: 0.6 + k * 0.5, active: false };
      items.push(item);
      const on = () => (item.active = true);
      const off = () => (item.active = false);
      return h('li', { class: 'beast' + (d.boss ? ' boss-card' : ''), tabindex: '0', onpointerenter: on, onpointerleave: off, onfocus: on, onblur: off },
        canvas,
        h('span', { class: 'beast-name' }, icon(d.icon), d.boss ? `Chefão: ${d.name}` : d.name),
        h('small', {}, d.desc),
        h('span', { class: 'beast-stats' }, `Vida ${d.hp}`, ' · ', d.boss ? 'A cada 5 ondas' : `Desde a onda ${d.from}`));
    };
    const list = h('ul', { class: 'beast-grid' }, ENEMY_ORDER.map(card));
    this.runPreviews(items, 'enemies', (pv, it, t) => pv.enemy(it.canvas, it.type, it.angle, t, it.active));
    return this.win('enemies', 'Inimigos', () => this.showScreen('menu'),
      h('p', { class: 'muted', style: 'margin:0 0 1rem' }, 'Passe o mouse sobre um inimigo para vê-lo em ação.'),
      list,
      h('div', { class: 'row end' }, btn('primary back', 'check', 'Ok', () => this.showScreen('menu'))));
  }

  // catálogo: os 18 itens em 3D, com categoria, raridade e como conseguir
  scr_items({ cat = 'all' } = {}) {
    const items = [];
    const cats = [['all', 'Todos'], ...Object.entries(ITEM_CATS)];
    const ids = ITEM_ORDER.filter((id) => cat === 'all' || ITEMS[id].cat === cat);
    const card = (id, k) => {
      const it = ITEMS[id];
      const canvas = h('canvas', { class: 'model', width: 220, height: 220, 'aria-hidden': 'true' });
      const item = { id, canvas, angle: 0.6 + k * 0.45, active: false };
      items.push(item);
      const on = () => (item.active = true);
      const off = () => (item.active = false);
      const wid = it.cat === 'weapon' ? id : it.weapon;
      return h('li', { class: 'beast item-card r-' + it.rarity.normalize('NFD').replace(/[^a-z]/gi, '').toLowerCase(), tabindex: '0', onpointerenter: on, onpointerleave: off, onfocus: on, onblur: off },
        h('span', { class: 'num' }, String(ITEM_ORDER.indexOf(id) + 1).padStart(2, '0')),
        canvas,
        h('span', { class: 'beast-name' }, wid ? weaponIcon(wid) : icon(it.icon), it.name),
        h('span', { class: 'item-tags' }, h('b', {}, ITEM_CATS[it.cat]), ' · ', it.rarity),
        h('small', {}, it.desc),
        h('span', { class: 'beast-stats' }, it.get));
    };
    const tabs = h('div', { class: 'tabs', role: 'tablist' },
      cats.map(([c, name]) => h('button', { class: 'tab', role: 'tab', 'aria-selected': c === cat ? 'true' : 'false', 'data-focus': c === cat ? '' : undefined, onclick: () => this.showScreen('items', { cat: c }) }, name)));
    this.runPreviews(items, 'items', (pv, it, t) => pv.item(it.canvas, it.id, it.angle, t, it.active));
    return this.win('enemies items', 'Itens', () => this.showScreen('menu'),
      h('p', { class: 'muted', style: 'margin:0 0 0.8rem' }, 'Itens aparecem pelo mapa e dentro das caixas de madeira. Encoste para coletar. Equipamentos são perdidos ao cair.'),
      tabs,
      h('ul', { class: 'beast-grid' }, ids.map(card)),
      h('div', { class: 'row end' }, btn('primary back', 'check', 'Ok', () => this.showScreen('menu'))));
  }

  // biblioteca de cenário: os 35 elementos modulares em 3D, com comportamento e símbolo de mapa
  scr_scenery({ cat = 'all' } = {}) {
    const items = [];
    const cats = [['all', 'Todos'], ...Object.entries(SCENERY_CATS)];
    const ids = SCENERY_ORDER.filter((id) => cat === 'all' || SCENERY[id].cat === cat);
    const card = (id, k) => {
      const sd = SCENERY[id];
      const canvas = h('canvas', { class: 'model', width: 220, height: 220, 'aria-hidden': 'true' });
      const item = { id, canvas, angle: 0.5 + k * 0.4, active: false };
      items.push(item);
      const on = () => (item.active = true);
      const off = () => (item.active = false);
      return h('li', { class: 'beast item-card scen-' + sd.beh, tabindex: '0', onpointerenter: on, onpointerleave: off, onfocus: on, onblur: off },
        h('span', { class: 'num' }, String(sd.n).padStart(2, '0')),
        canvas,
        h('span', { class: 'beast-name' }, sd.name),
        h('span', { class: 'item-tags' }, h('b', {}, SCENERY_CATS[sd.cat]), ' · ', SCENERY_BEH[sd.beh]),
        h('small', {}, sd.desc),
        h('span', { class: 'beast-stats' }, 'Símbolo no mapa: ', h('kbd', {}, sd.ch)));
    };
    const tabs = h('div', { class: 'tabs', role: 'tablist' },
      cats.map(([c, name]) => h('button', { class: 'tab', role: 'tab', 'aria-selected': c === cat ? 'true' : 'false', 'data-focus': c === cat ? '' : undefined, onclick: () => this.showScreen('scenery', { cat: c }) }, name)));
    this.runPreviews(items, 'scenery', (pv, it, t) => pv.scenery(it.canvas, it.id, it.angle, t, it.active));
    return this.win('enemies items', 'Cenário', () => this.showScreen('menu'),
      h('p', { class: 'muted', style: 'margin:0 0 0.8rem' }, `Biblioteca de cenário de todas as arenas (${SCENERY_ORDER.length} elementos). Cada elemento ocupa 1 bloco do mapa e tem um símbolo para montar arenas novas; os blocos modulares vêm em 7 materiais × 8 variações.`),
      tabs,
      h('ul', { class: 'beast-grid' }, ids.map(card)),
      h('div', { class: 'row end' }, btn('primary back', 'check', 'Ok', () => this.showScreen('menu'))));
  }

  scr_credits() {
    return this.win('credits', 'Créditos', () => this.showScreen('menu'),
      h('p', {}, 'BLOCK HORDE — jogo original de sobrevivência em ondas com câmera de cima.'),
      h('p', {}, 'Modelos, cenários, efeitos sonoros e música gerados por código: Three.js para os gráficos e Web Audio API para o som.'),
      h('p', { class: 'muted' }, 'Feito com Three.js e Vite.'),
      h('div', { class: 'row end' }, btn('primary back', 'check', 'Ok', () => this.showScreen('menu'))));
  }

  unlockList() {
    const g = this.g;
    return h('ul', { class: 'unlocks' }, UNLOCKS.map((u) => {
      const got = g.maxMult >= u.level;
      return h('li', { class: got ? 'got' : '' },
        h('b', {}, 'x' + u.level),
        u.weapon ? weaponIcon(u.weapon) : u.wicon ? weaponIcon(u.wicon) : icon('star'),
        h('span', {}, u.text),
        h('span', { class: 'state' }, icon(got ? 'check' : 'lock'), got ? 'Liberado' : 'Bloqueado'));
    }));
  }

  statChips() {
    const g = this.g;
    return h('div', { class: 'chips' },
      chip('trophy', 'Pontos', fmt(g.stats.score)),
      chip('flag', 'Onda', g.wave),
      chip('skull', 'Abates', g.stats.kills, 'red'),
      chip('bolt', 'Mult. máx.', 'x' + g.maxMult));
  }

  // pontos de habilidade disponíveis na partida (soma dos jogadores no co-op)
  skillPoints() {
    let n = 0;
    for (const p of this.g.players) n += p.pts || 0;
    return n;
  }

  scr_pause() {
    const g = this.g;
    const n = this.skillPoints();
    const treeLabel = g.input.touchMode ? 'Árvore de habilidades' : `Árvore de habilidades (${this.treeKey()})`;
    return this.win('pause', 'Pausado', () => g.resume(),
      h('div', { class: 'pause-cols' },
        h('div', {},
          this.statChips(),
          h('div', { class: 'menu-buttons' },
            btn('primary lg', 'play', 'Continuar', () => g.resume()),
            btn('tree-btn' + (n ? ' has-pts' : ''), 'tree', h('span', { class: 'btn-txt' }, treeLabel, n ? h('span', { class: 'pt-badge inline' }, `+${n}`) : null), () => g.openTree()),
            btn('', 'keyboard', 'Controles', () => this.showScreen('controls', { back: 'pause' })),
            btn('', 'gear', 'Configurações', () => this.showScreen('settings', { back: 'pause' })),
            btn('', 'refresh', 'Reiniciar partida', () => g.restart()),
            btn('danger back', 'exit', 'Sair para o menu', () => g.toMenu()))),
        h('div', {}, h('h3', { class: 'section slashed', style: 'margin-top:0' }, 'Desbloqueios'), this.unlockList())));
  }

  scr_gameover({ isRecord, prev, xp, cont }) {
    const g = this.g;
    // anúncios com recompensa (só na CrazyGames, com anúncios ativos): opcionais e com ícone de vídeo
    let ads = null;
    if (platform.adsAvailable) {
      const fail = () => this.alert('Nenhum vídeo disponível agora. Tente mais tarde.', 'info');
      const kids = [];
      if (cont) {
        let left = 10;
        const label = h('span', {}, `Continuar com metade da vida · ${left}`);
        const b = h('button', { class: 'btn ad-btn', onclick: () => g.adContinue(() => (fail(), b.remove())) }, icon('video'), label);
        const tick = setInterval(() => {
          left--;
          if (left <= 0 || this.screen !== 'gameover' || !b.isConnected) {
            clearInterval(tick);
            if (!g.adBusy) b.remove();
          } else label.textContent = `Continuar com metade da vida · ${left}`;
        }, 1000);
        kids.push(b);
      }
      if (xp && !xp.doubled && xp.gained > 0) {
        const b = h('button', { class: 'btn ad-btn', onclick: () => g.adDoubleXp(() => this.showScreen('gameover', { isRecord, prev, xp, cont: false }), () => (fail(), b.remove())) }, icon('video'), h('span', {}, `Dobrar XP de perfil (+${fmt(xp.gained)})`));
        kids.push(b);
      }
      if (kids.length) ads = h('div', { class: 'row ad-row' }, ...kids);
    }
    const xpLine = xp ? h('div', { class: 'profile-line' }, icon('star'),
      h('b', {}, xp.level > xp.before ? `Nível ${xp.before} → ${xp.level}!` : `Nível ${xp.level}`),
      h('span', { class: 'pbar' }, h('i', { style: `width:${Math.round((xp.cur / xp.need) * 100)}%` })),
      h('small', {}, `+${fmt(xp.gained)} XP de perfil · ${fmt(xp.cur)} / ${fmt(xp.need)}`)) : null;
    const unl = xp && xp.unlocked.length ? h('p', { class: 'record' }, icon('lock'), `Arena liberada: ${xp.unlocked.join(', ')}!`) : null;
    return this.win('gameover', h('h2', { class: 'title slashed bad' }, 'A horda venceu'), null,
      isRecord
        ? h('p', { class: 'record' }, icon('trophy'), prev ? `Novo recorde! (antes: ${fmt(prev.score)})` : 'Primeiro recorde nesta arena!')
        : h('p', { class: 'muted' }, `Recorde: ${fmt(prev.score)} na onda ${prev.wave}`),
      xpLine,
      unl,
      this.statChips(),
      h('div', { class: 'chips' },
        chip('clock', 'Tempo', fmtTime(g.stats.time), 'blue'),
        chip('target', 'Disparos', fmt(g.stats.shots), 'blue')),
      g.players.length > 1 ? h('p', { class: 'muted' }, g.players.map((p) => `${p.look.name}: ${p.kills} abates`).join(' · ')) : null,
      ads,
      h('div', { class: 'row' },
        btn('back', 'home', 'Menu principal', () => g.toMenu()),
        h('span', { class: 'grow' }),
        btn('primary lg', 'refresh', 'Jogar de novo', () => g.restart())));
  }

  // ------------------------------------------------------------ HUD
  buildHud() {
    this.hScore = h('b', {}, '0');
    this.hWave = h('b', {}, '1');
    this.hLeft = h('b', {}, '0');
    this.hLeftLabel = h('small', {}, 'Restam');
    this.hMult = h('div', { class: 'mult-num' }, 'x1');
    this.hMeter = bar('xp');
    this.hNextIcon = h('span');
    this.hNextText = h('span');
    this.hBossBar = bar('boss');
    this.hBossName = h('span', {}, ENEMIES.boss.name);
    this.hBoss = h('div', { class: 'boss hidden' }, h('div', { class: 'boss-name' }, icon(ENEMIES.boss.icon), this.hBossName), this.hBossBar.el);
    this.hEventText = h('b', {}, '');
    this.hEvent = h('div', { class: 'chip event hidden', title: 'Evento climático da arena' }, icon('warning'), h('div', {}, h('small', {}, 'Clima'), this.hEventText));
    this.radar = h('canvas', { class: 'radar', width: 232, height: 232, 'aria-label': 'Radar' });
    // uma mira por jogador (no co-op, com etiqueta J1/J2 na cor do jogador)
    this.xhs = [0, 1].map((k) => ({ el: h('div', { class: 'xh hidden' }), id: null, tag: h('span', { class: 'tag', style: `color:${k ? '#ff8a2a' : '#3aa0ff'}` }, `J${k + 1}`), lockT: 0, target: null }));
    this.pEls = [0, 1].map((k) => {
      const el = {};
      el.hp = bar('hp');
      el.armor = bar('armor');
      el.root = h('div', { class: `pp p${k + 1}` },
        (el.avatar = h('canvas', { class: 'avatar', width: 136, height: 136, 'aria-hidden': 'true' })),
        h('div', { class: 'pp-main' },
          h('div', { class: 'pp-top' }, (el.name = h('strong', {})), (el.tag = h('span', { class: 'tag' })), (el.down = h('span', { class: 'down' })),
            (el.lvl = h('span', { class: 'lvl' })), (el.pts = h('button', { class: 'pts hidden', title: 'Árvore de habilidades (Tab)', onclick: () => (this.g.input.touchMode ? this.g.pause() : this.g.openTree(k)) }))),
          (el.xp = h('div', { class: 'xpbar' }, h('i'))),
          h('div', { class: 'bar-line' }, icon('heart', 'heart'), el.hp.el),
          (el.armorLine = h('div', { class: 'bar-line armor-line hidden' }, icon('vest', 'vest'), el.armor.el)),
          (el.buffs = h('div', { class: 'buffs' })),
          h('div', { class: 'pp-weapon' }, (el.wicon = h('span')), (el.wname = h('span', {})), (el.ammo = h('b', {}))),
          (el.reload = h('div', { class: 'reload-line hidden', role: 'status' }, icon('reload'), h('span', {}, 'Recarregando'), h('i', {}, h('b')))),
          (el.slots = h('div', { class: 'slots' })),
          (el.abil = h('div', { class: 'abil' }))),
        (el.toast = h('div', { class: 'toast' })));
      return el;
    });
    this.ptBadge = h('span', { class: 'pt-badge hidden', 'aria-hidden': 'true' });
    this.pauseBtn = iconBtn('sm pause-btn', 'pause', 'Pausar (P)', () => this.g.pause());
    this.pauseBtn.append(this.ptBadge);
    this.hudEl.append(
      h('div', { class: 'top' },
        h('div', { class: 'chip' }, icon('trophy'), h('div', {}, h('small', {}, 'Pontos'), this.hScore)),
        h('div', { class: 'chip' }, icon('flag'), h('div', {}, h('small', {}, 'Onda'), this.hWave)),
        h('div', { class: 'chip red' }, icon('skull'), h('div', {}, this.hLeftLabel, this.hLeft)),
        this.hEvent,
        h('div', { class: 'mult' }, this.hMult, h('div', { class: 'mult-body' }, h('div', { class: 'mult-next' }, this.hNextIcon, this.hNextText), this.hMeter.el))),
      this.pauseBtn,
      this.radar,
      this.hBoss,
      h('div', { class: 'players' }, this.pEls[0].root, this.pEls[1].root),
      this.xhs[0].el,
      this.xhs[1].el);
  }

  hud(on) {
    this.hudEl.classList.toggle('hidden', !on);
    this.alertsEl.replaceChildren();
    if (!on) return;
    const g = this.g;
    const pv = this.getPreview();
    this.pEls.forEach((el, k) => {
      const p = g.players[k];
      el.root.classList.toggle('hidden', !p);
      if (!p) return;
      el.name.textContent = p.look.name;
      el.tag.textContent = g.players.length > 1 ? `J${k + 1}` : p.look.role;
      el.slotKey = '';
      el.weaponKey = '';
      el.buffKey = '';
      el.lowWarned = false;
      if (pv) pv.portrait(el.avatar, p.look);
      // barra de habilidades: 3 ativas + ultimate, com tecla e recarga
      const labels = ABILITY_LABELS[g.players.length > 1 ? (k ? 'p2' : 'p1') : 'solo'];
      el.ab = p.slots.map((id, i) => {
        const def = i === 3 ? ULTIMATES[id] : ACTIVES[id];
        const cd = h('i', { class: 'cd' });
        const txt = h('b', {});
        const node = h('span', { class: 'ab' + (i === 3 ? ' ult' : ''), style: `--ac:${def.color}`, title: `${def.name} (${labels[i]}) — ${def.desc}` }, icon(def.icon), cd, txt, h('kbd', { 'data-ab': i, 'data-pl': k, 'data-key': labels[i] }, labels[i]), i === 3 ? icon('lock', 'lk') : null);
        return { node, cd, txt, last: '' };
      });
      el.abil.replaceChildren(...el.ab.map((a) => a.node));
      requestAnimationFrame(() => this.padLabels());
      el.lvlKey = '';
    });
    this.bannerEl.className = 'banner';
    this.lastNext = null;
  }

  // selo de pontos no botão de pausa: indica que há evolução disponível na árvore
  updatePauseBadge() {
    const n = this.skillPoints();
    if (n === this.lastPts) return;
    this.lastPts = n;
    this.ptBadge.textContent = n > 9 ? '9+' : String(n);
    this.ptBadge.classList.toggle('hidden', n <= 0);
    this.pauseBtn.classList.toggle('has-pts', n > 0);
    this.pauseBtn.title = n > 0 ? `Pausar (P) · ${n} ponto${n > 1 ? 's' : ''} de habilidade` : 'Pausar (P)';
    this.pauseBtn.setAttribute('aria-label', this.pauseBtn.title);
  }

  updateHud(dt) {
    const g = this.g;
    setT(this.hScore, fmt(g.stats.score));
    setT(this.hWave, g.wave || '—');
    if (g.waveState === 'active') {
      let alive = 0;
      for (const z of g.zombies) if (z.alive) alive++;
      setT(this.hLeftLabel, 'Restam');
      setT(this.hLeft, g.toSpawn.length + alive);
    } else {
      setT(this.hLeftLabel, 'Próxima');
      setT(this.hLeft, `${Math.ceil(g.waveT)}s`);
    }
    tog(this.hEvent, 'hidden', !g.event);
    if (g.event) setT(this.hEventText, `${EVENT_LABEL[g.event] || 'CLIMA'} ${Math.ceil(g.eventLeft)}s`);
    setT(this.hMult, 'x' + g.mult);
    const m = Math.max(0, Math.min(1, g.meter));
    setW(this.hMeter.fill, m * 100);
    setT(this.hMeter.val, `${Math.round(m * 100)}%`);
    const next = UNLOCKS.find((u) => u.level > g.maxMult);
    if (next !== this.lastNext) {
      this.lastNext = next;
      this.hNextIcon.replaceChildren(next ? (next.weapon ? weaponIcon(next.weapon) : next.wicon ? weaponIcon(next.wicon) : icon('star')) : icon('check'));
      this.hNextText.textContent = next ? `Próx. x${next.level}: ${next.text}` : 'Arsenal completo!';
    }
    const boss = g.boss && g.boss.alive;
    tog(this.hBoss, 'hidden', !boss);
    if (boss) {
      setT(this.hBossName, g.boss.def.name);
      setW(this.hBossBar.fill, Math.max(0, g.boss.hp / g.boss.maxHp) * 100);
      setT(this.hBossBar.val, `${fmt(Math.max(0, g.boss.hp))} / ${fmt(g.boss.maxHp)}`);
    }
    g.players.forEach((p, k) => this.updatePlayer(p, k));
    this.updatePauseBadge();
    this.radarT = (this.radarT || 0) - dt;
    if (this.radarT <= 0) {
      this.radarT = 0.05;
      this.drawRadar();
    }
    // mira do mouse (solo)
    this.updateCrosshairs(dt);
  }

  // mira de cada jogador: posição na tela, dispersão, alvo sob a mira, travamento e acertos
  updateCrosshairs(dt = 1 / 60) {
    const g = this.g;
    const v = this._xv || (this._xv = g.mouseWorld.clone());
    this.xhs.forEach((x, k) => {
      const p = g.players[k];
      const show = p && p.alive && g.state === 'playing';
      tog(x.el, 'hidden', !show);
      if (!show) {
        x.target = null;
        x.lockT = 0;
        if (p) p.lockTarget = null;
        return;
      }
      const mouse = p.ctl.mouse && !g.input.mouseIdle;
      // ponto de mira no mundo e alvo
      let wx;
      let wz;
      let target = null;
      if (mouse) {
        wx = g.mouseWorld.x;
        wz = g.mouseWorld.z;
        let bd = 1e9;
        for (const z of g.zombies) {
          if (!z.alive) continue;
          const d = Math.hypot(z.pos.x - wx, z.pos.z - wz);
          if (d < z.radius + 0.55 && d < bd) {
            bd = d;
            target = z;
          }
        }
      } else {
        target = g.aimTarget(p);
        wx = target ? target.pos.x : p.pos.x + Math.sin(p.aim) * 6;
        wz = target ? target.pos.z : p.pos.z + Math.cos(p.aim) * 6;
      }
      let sx;
      let sy;
      if (mouse) {
        sx = g.input.mouseClient.x;
        sy = g.input.mouseClient.y;
      } else {
        v.set(wx, target ? (target.def.fly ? target.flyY || 1.4 : 0.9 * target.scale) : 0.9, wz).project(g.camera);
        sx = ((v.x + 1) / 2) * window.innerWidth;
        sy = ((1 - v.y) / 2) * window.innerHeight;
      }
      // travamento: o mesmo alvo sob a mira por 0,45 s
      if (target && target === x.target) x.lockT += dt;
      else x.lockT = 0;
      x.target = target;
      const locked = !!target && x.lockT > 0.45;
      p.lockTarget = locked ? target : null;
      const w = g.wstat(p.weapon);
      const moving = Math.min(1, Math.hypot(p.vel.x, p.vel.z) / 4.7);
      const kick = p.cxKick || 0;
      const base = w.kind === 'gun' ? Math.min(14, w.spread * 70 + (w.pellets > 1 ? 5 : 0)) : 2;
      this.styleXh(x, this.crossId(p.weapon));
      if (g.players.length > 1 && !x.el.contains(x.tag)) x.el.append(x.tag);
      if (g.players.length === 1 && x.el.contains(x.tag)) x.tag.remove();
      this.setXhState(x, {
        s: base + kick * 12 + moving * 3,
        t: target ? 4 + (p.hitT > 0 ? 2 : 0) : 0,
        u: Math.min(1, moving + kick),
        hx: p.vel.x * 0.6,
        hy: p.vel.z * 0.6 - kick * 3,
        over: !!target,
        locked,
        hit: p.hitT > 0,
        kill: p.killT > 0,
        stable: moving < 0.05 && kick < 0.08,
      });
      setV(x.el, 'transform', `translate(${Math.round(sx)}px, ${Math.round(sy)}px)`);
    });
  }

  updatePlayer(p, k) {
    const g = this.g;
    const el = this.pEls[k];
    tog(el.root, 'dead', !p.alive);
    setT(el.down, p.alive ? '' : g.players.length > 1 ? 'Caído · volta na próxima onda' : 'Caído');
    setW(el.hp.fill, (p.hp / p.maxHp) * 100);
    setT(el.hp.val, `${Math.ceil(p.hp)} / ${p.maxHp}`);
    const low = p.alive && p.hp < 30;
    tog(el.hp.el, 'low', low);
    if (low && !el.lowWarned) this.alert(g.players.length > 1 ? `Vida baixa: ${p.look.name}!` : 'Vida baixa!', 'danger', 'warning');
    el.lowWarned = p.hp < 45 ? el.lowWarned || low : false;
    // nível, XP e pontos
    const lk = `${p.lv}|${p.pts}|${g.input.touchMode}`;
    if (lk !== el.lvlKey) {
      el.lvlKey = lk;
      el.lvl.textContent = `Nv ${p.lv}`;
      el.pts.textContent = this.g.input.touchMode ? `+${p.pts} pt${p.pts > 1 ? 's' : ''}` : `+${p.pts} pt${p.pts > 1 ? 's' : ''} · Tab`;
      el.pts.title = this.g.input.touchMode ? 'Pontos de habilidade: abra a pausa para evoluir' : `Árvore de habilidades (${this.treeKey()})`;
      el.pts.classList.toggle('hidden', !p.pts);
    }
    setW(el.xp.firstChild, (p.xp / xpNeed(p.lv)) * 100);
    // habilidades: recarga (varredura), segundos restantes e efeito ativo
    if (el.ab)
      el.ab.forEach((a, i) => {
        const left = p.cds[i];
        setV(a.cd, '--cd', left > 0 ? (left / p.cdMax[i]).toFixed(2) : '0');
        const id = p.slots[i];
        const on = (id === 'shield' && p.shieldT > 0) || (id === 'cloak' && p.cloakT > 0) || (id === 'fury' && p.furyT > 0) || (id === 'kit' && p.healT > 0) || (id === 'dash' && p.dashT > 0);
        const locked = i === 3 && !p.ultOn;
        const key = `${left > 0 ? Math.ceil(left) : ''}|${on}|${locked}`;
        if (key !== a.last) {
          a.last = key;
          a.txt.textContent = left > 0 ? Math.ceil(left) : '';
          a.node.classList.toggle('on', on);
          a.node.classList.toggle('cooling', left > 0);
          a.node.classList.toggle('locked', locked);
          if (!left && a.wasCooling) {
            a.node.classList.remove('ready');
            void a.node.offsetWidth;
            a.node.classList.add('ready');
          }
          a.wasCooling = left > 0;
        }
      });
    // colete
    tog(el.armorLine, 'hidden', !(p.armor > 0));
    if (p.armor > 0) {
      setW(el.armor.fill, (p.armor / p.maxArmor) * 100);
      setT(el.armor.val, `${Math.ceil(p.armor)} / ${p.maxArmor}`);
    }
    // efeitos ativos e equipamento (só redesenha quando muda)
    const buffs = [];
    if (p.energyT > 0) buffs.push(['drink', Math.ceil(p.energyT) + 's', p.energyT < 3]);
    if (p.lightT > 0) buffs.push(['flashlight', Math.ceil(p.lightT) + 's', p.lightT < 5]);
    if (g.scoutT > 0) buffs.push(['binoculars', Math.ceil(g.scoutT) + 's', g.scoutT < 3]);
    if (p.exoT > 0) buffs.push(['exo', Math.ceil(p.exoT) + 's', p.exoT < 4]);
    if (p.helmet) buffs.push(['helmet', '', false]);
    if (p.boots) buffs.push(['boots', '', false]);
    if (p.pack) buffs.push(['backpack', '', false]);
    buffs.push([g.upg.axe ? 'axe' : 'knife', '', false, true]);
    const bkey = buffs.map((b) => b.join(':')).join('|');
    if (bkey !== el.buffKey) {
      el.buffKey = bkey;
      el.buffs.replaceChildren(...buffs.map(([ic, t, ending, w]) =>
        h('span', { class: 'buff' + (ending ? ' ending' : '') + (w ? ' melee' : ''), title: w ? MELEE[ic].name : ITEMS[ic].name }, w ? weaponIcon(ic) : icon(ITEMS[ic].icon || ic), t ? h('b', {}, t) : null)));
    }
    if (el.weaponKey !== p.weapon) {
      el.weaponKey = p.weapon;
      el.wicon.replaceChildren(weaponIcon(p.weapon));
      el.wname.textContent = WEAPONS[p.weapon].name;
    }
    // munição: carregador / reserva; pente quase vazio fica em vermelho
    const cw = WEAPONS[p.weapon];
    const ammo = g.ammoText(p, p.weapon);
    if (el.ammo.lastChild?.textContent !== ammo) el.ammo.replaceChildren(icon('ammo'), ammo);
    tog(el.ammo, 'low', !!cw.mag && (p.clip[p.weapon] || 0) <= Math.ceil(cw.mag * 0.25));
    const reloading = p.reloadT > 0;
    tog(el.reload, 'hidden', !reloading);
    if (reloading) el.reload.lastChild.firstChild.style.width = `${Math.round((1 - p.reloadT / p.reloadMax) * 100)}%`;
    // teclas 1–9, 0 e -: um espaço por grupo; mostra a arma escolhida do grupo e quantas ele tem
    const owned = WEAPON_ORDER.filter((id) => g.unlocked.has(id));
    const key = owned.join() + '|' + p.weapon + '|' + owned.map((id) => (g.usable(p, id) ? 1 : 0)).join('') + '|' + Object.values(p.groupSel).join();
    if (key !== el.slotKey) {
      el.slotKey = key;
      el.slots.replaceChildren(...WEAPON_GROUPS.map((grp, i) => {
        const mine = grp.filter((id) => g.unlocked.has(id));
        const own = mine.length > 0;
        const id = grp.includes(p.weapon) ? p.weapon : mine.includes(p.groupSel[i]) ? p.groupSel[i] : mine[0] || grp[0];
        const usable = mine.some((q) => g.usable(p, q));
        return h('span', {
          class: 'slot' + (own ? ' own' : '') + (grp.includes(p.weapon) ? ' cur' : '') + (own && !usable ? ' empty' : ''),
          title: own ? mine.map((q) => WEAPONS[q].name).join(' · ') : 'Bloqueado',
        }, g.players.length === 1 ? h('span', { class: 'n' }, SLOT_KEYS[i]) : null, own ? weaponIcon(id) : icon('lock'), mine.length > 1 ? h('span', { class: 'cnt' }, String(mine.length)) : null);
      }));
    }
  }

  // radar: zumbis (vermelho), chefão, caixas (amarelo) e jogadores ao redor da câmera
  drawRadar() {
    const g = this.g;
    const c = this.radar;
    const x = c.getContext('2d');
    const S = c.width;
    const R = S / 2;
    const range = g.scoutT > 0 ? 36 : 24; // binóculos ampliam o radar
    const k = R / range;
    const cx = g.camTarget.x;
    const cz = g.camTarget.z - 0.5;
    x.save();
    x.clearRect(0, 0, S, S);
    x.beginPath();
    x.arc(R, R, R, 0, Math.PI * 2);
    x.clip();
    const bg = x.createRadialGradient(R, R, 0, R, R, R);
    bg.addColorStop(0, '#24452a');
    bg.addColorStop(1, '#0d1a10');
    x.fillStyle = bg;
    x.fillRect(0, 0, S, S);
    // paredes e obstáculos da arena
    const A = g.arena;
    x.fillStyle = 'rgba(150, 200, 150, 0.22)';
    const i0 = Math.max(0, Math.floor(cx - range));
    const i1 = Math.min(A.W - 1, Math.ceil(cx + range));
    const j0 = Math.max(0, Math.floor(cz - range));
    const j1 = Math.min(A.D - 1, Math.ceil(cz + range));
    for (let j = j0; j <= j1; j++)
      for (let i = i0; i <= i1; i++) if (A.block[i + j * A.W]) x.fillRect(R + (i - cx) * k, R + (j - cz) * k, k + 0.5, k + 0.5);
    // grade
    x.strokeStyle = 'rgba(120, 220, 130, 0.25)';
    x.lineWidth = 2;
    for (const r of [R * 0.33, R * 0.66]) {
      x.beginPath();
      x.arc(R, R, r, 0, Math.PI * 2);
      x.stroke();
    }
    x.beginPath();
    x.moveTo(R, 0);
    x.lineTo(R, S);
    x.moveTo(0, R);
    x.lineTo(S, R);
    x.stroke();
    // varredura
    const a = (performance.now() / 1000) * 2.2;
    const sw = x.createConicGradient ? x.createConicGradient(a - 0.9, R, R) : null;
    if (sw) {
      sw.addColorStop(0, 'rgba(90, 255, 120, 0)');
      sw.addColorStop(0.14, 'rgba(90, 255, 120, 0.28)');
      sw.addColorStop(0.15, 'rgba(90, 255, 120, 0)');
      x.fillStyle = sw;
      x.fillRect(0, 0, S, S);
    }
    const dot = (wx, wz, r, col) => {
      x.fillStyle = col;
      x.beginPath();
      x.arc(R + (wx - cx) * k, R + (wz - cz) * k, r, 0, Math.PI * 2);
      x.fill();
    };
    // itens: munição amarela, vida vermelha, caixa de madeira marrom, equipamento azul, resto verde
    const RC = { ammo: '#ffc107', medkit: '#ff6a6a', supply: '#c8904a', vest: '#4fd0ff', helmet: '#4fd0ff', backpack: '#4fd0ff' };
    for (const cr of g.pickups) if (!cr.taken) dot(cr.x, cr.z, 5, RC[cr.type] || '#9aff6a');
    for (const s of g.strikes) {
      x.strokeStyle = '#ff3020';
      x.lineWidth = 2;
      x.beginPath();
      x.arc(R + (s.x - cx) * k, R + (s.z - cz) * k, 3.2 * k, 0, Math.PI * 2);
      x.stroke();
    }
    for (const z of g.zombies) if (z.alive) dot(z.pos.x, z.pos.z, z.def.boss ? 9 : 4.5, z.def.boss ? '#ff2d2d' : '#ff5a4e');
    // jogadores como setas
    g.players.forEach((p, n) => {
      if (!p.alive) return;
      x.save();
      x.translate(R + (p.pos.x - cx) * k, R + (p.pos.z - cz) * k);
      x.rotate(-p.facing + Math.PI);
      x.fillStyle = n ? '#ff8a2a' : '#ffffff';
      x.strokeStyle = '#000';
      x.lineWidth = 2;
      x.beginPath();
      x.moveTo(0, -10);
      x.lineTo(7, 8);
      x.lineTo(0, 4);
      x.lineTo(-7, 8);
      x.closePath();
      x.fill();
      x.stroke();
      x.restore();
    });
    x.restore();
  }

  // banner central para ondas; demais avisos viram notificações
  // dicas da primeira partida (step -1 esconde)
  tutorial(step) {
    if (!this.tutEl) {
      this.tutText = h('span', {});
      this.tutCount = h('small', {});
      this.tutEl = h('div', { class: 'tutorial hidden', role: 'status' }, icon('info'), h('div', {}, this.tutCount, this.tutText),
        h('button', { class: 'btn sm', onclick: () => this.g.skipTutorial() }, 'Pular'));
      this.hudEl.append(this.tutEl);
    }
    const P = this.g.pad;
    const gl = (id) => P.actionGlyph(id);
    const steps = P?.usingPad ? [
      'Mova-se com o analógico esquerdo',
      `Mire com o analógico direito (solto, mira no mais próximo) e atire com ${gl('fire')}`,
      `Encoste nos itens para pegar. ${gl('prev')} · ${gl('next')} trocam de arma`,
      `${gl('ab0')} · ${gl('ab1')} · ${gl('ab2')} usam habilidades, ${gl('ult')} a ultimate. ${gl('tree')} abre a árvore e ${gl('pause')} pausa`,
    ] : this.g.input.touchMode ? [
      'Arraste no lado esquerdo da tela para andar',
      'O tiro é automático. Segure e arraste à direita para mirar você mesmo',
      'Toque na arma para trocar; segure para escolher na lista',
      'Os botões redondos usam habilidades; o de cadeado é a ultimate',
    ] : [
      'Mova-se com W A S D',
      'Mire com o mouse e clique (ou Espaço) para atirar',
      'Encoste nos itens para pegar. Teclas 1–9 trocam de arma',
      'Z · X · C usam habilidades, R a ultimate. Tab abre a árvore e P pausa',
    ];
    if (step < 0 || step >= steps.length) return this.tutEl.classList.add('hidden');
    this.tutCount.textContent = `Dica ${step + 1}/${steps.length}`;
    this.tutText.textContent = steps[step];
    this.tutEl.classList.remove('hidden');
  }

  banner(text, kind = 'info') {
    // celular: nada de letreiro gigante no meio da arena; vira aviso breve no topo
    if (this.g.input.touchMode) {
      const map = { good: ['success', 'checkCircle'], bad: ['danger', 'warning'], gold: ['gold', 'trophy'] }[kind] || ['wave', 'flag'];
      return this.notify(text, map[0], map[1], { pri: 2, dur: 2 });
    }
    if (kind === 'good') return this.alert(text, 'success', 'checkCircle');
    if (kind === 'bad') return this.alert(text, 'danger', 'warning');
    if (kind === 'gold') return this.alert(text, 'gold', 'trophy');
    const el = this.bannerEl;
    el.replaceChildren(h('span', { class: 'slashed' }, text));
    el.className = 'banner';
    void el.offsetWidth;
    el.className = `banner show ${kind}`;
    clearTimeout(this.bannerT);
    this.bannerT = setTimeout(() => (el.className = 'banner'), 2400);
  }
  unlockBanner(text) {
    if (this.g.input.touchMode) return this.notify(`Desbloqueado: ${text}`, 'gold', 'star', { pri: 2, dur: 3 });
    this.alert(`Novo item desbloqueado: ${text}`, 'info', 'star');
  }

  // ---------------------------------------------------------- avisos do celular
  // Um aviso por vez, no topo, sem botão e sem receber toques. Repetidos viram "×N",
  // importantes passam na frente e avisos comuns antigos são descartados.
  notify(text, kind = 'info', ic = 'info', o = {}) {
    const pri = o.pri ?? (kind === 'danger' || kind === 'gold' || kind === 'wave' ? 2 : kind === 'success' ? 1 : 0);
    const dur = o.dur ?? (pri >= 2 ? 3 : 2);
    const q = (this.nq = this.nq || []);
    const same = (n) => n && n.text === text && n.kind === kind;
    const cur = this.nCur;
    if (same(cur)) {
      cur.count++;
      cur.badge.textContent = `×${cur.count}`;
      return;
    }
    const dup = q.find(same);
    if (dup) {
      dup.count++;
      return;
    }
    q.push({ text, kind, ic, pri, dur, count: 1, t: performance.now() });
    // no máximo 3 na espera: sai o de menor prioridade (o mais antigo entre iguais)
    while (q.length > 3) {
      let k = 0;
      q.forEach((n, i) => {
        if (n.pri < q[k].pri) k = i;
      });
      q.splice(k, 1);
    }
    if (!cur) this.nextNotice();
    else if (pri >= 2 && cur.pri < 2) this.nextNotice(); // importante interrompe um aviso comum
  }
  nextNotice() {
    clearTimeout(this.nT);
    if (this.nCur) {
      const old = this.nCur.el;
      old.classList.add('out');
      setTimeout(() => old.remove(), 220);
      this.nCur = null;
    }
    const q = this.nq || [];
    const now = performance.now();
    q.sort((a, b) => b.pri - a.pri || a.t - b.t);
    let n = q.shift();
    while (n && n.pri === 0 && now - n.t > 4000) n = q.shift(); // aviso comum velho perde a vez
    if (!n) return;
    n.badge = h('b', { class: 'n-count' }, n.count > 1 ? `×${n.count}` : '');
    n.el = h('div', { class: 'notice ' + n.kind, role: n.kind === 'danger' ? 'alert' : 'status' }, icon(n.ic), h('span', {}, n.text), n.badge);
    this.placeNotices();
    this.noticeEl.append(n.el);
    this.nCur = n;
    this.nT = setTimeout(() => this.nextNotice(), n.dur * 1000 * (this.g.settings.notifyDur ?? 1));
  }
  // logo abaixo do que estiver visível no topo (placar, chefe, dica), nunca no centro.
  // Em telas baixas (celular deitado) não sobra espaço: o aviso fica por cima da linha do
  // placar por alguns segundos, sem empurrar o HUD e longe do personagem.
  placeNotices() {
    let bottom = 8;
    for (const sel of ['.top', '.boss:not(.hidden)', '.tutorial:not(.hidden)']) {
      const el = this.hudEl.querySelector(sel);
      if (!el || !el.offsetParent) continue;
      bottom = Math.max(bottom, el.getBoundingClientRect().bottom);
    }
    const over = bottom + 36 > innerHeight * 0.2;
    this.noticeEl.classList.toggle('over', over);
    this.noticeEl.style.top = over ? '' : `${Math.round(bottom + 6)}px`;
  }
  alert(text, kind = 'info', ic = 'info') {
    if (this.g.input.touchMode) return this.notify(text, kind, ic);
    const close = () => {
      if (!el.isConnected || el.classList.contains('out')) return;
      el.classList.add('out');
      setTimeout(() => el.remove(), 300);
    };
    const el = h('div', { class: 'alert ' + kind, role: kind === 'danger' ? 'alert' : 'status' },
      icon(ic), h('span', { class: 'msg' }, text),
      h('button', { onclick: close, 'aria-label': 'Fechar aviso', title: 'Fechar' }, icon('close')));
    this.alertsEl.append(el);
    while (this.alertsEl.children.length > 4) this.alertsEl.firstChild.remove();
    setTimeout(close, 3600);
  }
  multPulse() {
    this.hMult.classList.remove('pulse');
    void this.hMult.offsetWidth;
    this.hMult.classList.add('pulse');
  }
  playerHurt(id) {
    if (this.g.input.touchMode) this.g.touch?.buzz(25);
    const el = this.pEls[id]?.root;
    if (!el) return;
    // alterna entre duas animações iguais: reinicia sem forçar recálculo de layout
    const b = el.classList.contains('hurt');
    el.classList.toggle('hurt', !b);
    el.classList.toggle('hurt2', b);
  }
  toast(id, text, ic = 'medkit', kind = '') {
    if (this.g.input.touchMode) {
      const up = ic === 'tree'; // subida de nível
      return this.notify(text, kind === 'bad' ? 'danger' : up ? 'gold' : 'success', ic, { pri: up ? 2 : kind === 'bad' ? 1 : 0, dur: up ? 3 : 2 });
    }
    const el = this.pEls[id]?.toast;
    if (!el) return;
    el.replaceChildren(h('span', { class: kind }, icon(ic), text));
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
  }
  fps(dt) {
    if (!this.g.settings.showFps) return;
    tog(this.fpsEl, 'hidden', false);
    this.fpsAcc += dt;
    this.fpsN++;
    if (this.fpsAcc > 0.5) {
      this.fpsEl.textContent = `${Math.round(this.fpsN / this.fpsAcc)} FPS`;
      this.fpsAcc = 0;
      this.fpsN = 0;
    }
  }
}
