// Miras (crosshairs) do Block Horde: 8 modelos em SVG com partes animadas por variáveis CSS.
// A mira acompanha o ponto de mira do jogador (mouse no solo; ponto projetado no teclado/co-op).
//
// Variáveis definidas pela UI a cada quadro (em px do viewBox de 64×64):
//   --s  dispersão (abre as marcações ao atirar/andar)   --t  aproximação no alvo (0 a 5)
//   --u  instabilidade 0..1 (mira dourada)               --hx/--hy deslocamento do ponto holográfico
// Classes no elemento: .over (inimigo sob a mira) · .locked (alvo travado) · .hit · .kill · .stable

const f = (n) => +n.toFixed(2);
const P = (r, a) => [f(r * Math.sin((a * Math.PI) / 180)), f(-r * Math.cos((a * Math.PI) / 180))];
// arco de a0 a a1 graus (0° = para cima, sentido horário)
const arc = (r, a0, a1) => {
  const [x0, y0] = P(r, a0);
  const [x1, y1] = P(r, a1);
  return `<path d="M${x0} ${y0}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}"/>`;
};
const DIRS = [['n', 0], ['e', 90], ['s', 180], ['w', 270]];
// marcação por direção: linha radial de r0 a r1
const ticks = (r0, r1, extra = '') => DIRS.map(([d, a]) => {
  const [x0, y0] = P(r0, a);
  const [x1, y1] = P(r1, a);
  return `<g class="m-${d}"><line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"${extra}/></g>`;
}).join('');
// triângulo apontando para o centro, com a ponta em r0 e a base em r1
const arrows = (r0, r1, w) => DIRS.map(([d, a]) => {
  const tip = P(r0, a);
  const b1 = P(r1, a - w);
  const b2 = P(r1, a + w);
  return `<g class="m-${d}"><polygon points="${tip} ${b1} ${b2}" fill="currentColor" stroke="none"/></g>`;
}).join('');
const dot = (r = 1.8, fill = 'currentColor') => `<circle class="m-dot" r="${r}" fill="${fill}" stroke="none"/>`;

export const CROSSHAIRS = {
  classic: {
    n: 1, name: 'Clássica', color: '#ffffff', desc: 'Círculo aberto, 4 linhas e ponto. As linhas abrem ao atirar.',
    svg: `<g class="m-ring">${[45, 135, 225, 315].map((c) => arc(12, c - 26, c + 26)).join('')}</g>${ticks(6, 16)}${dot()}`,
  },
  tactical: {
    n: 2, name: 'Tática', color: '#39ff6a', desc: 'Dois círculos e marcadores externos. Brilha mais sobre um inimigo.',
    svg: `<g class="m-ring"><circle r="9"/><circle r="15" stroke-width="1.5" opacity="0.7"/></g>${ticks(19, 25)}${dot(1.6)}`,
  },
  bracket: {
    n: 3, name: 'Aquisição', color: '#ff3b30', desc: 'Quatro cantos e cruz. Os cantos fecham ao achar e ao acertar o alvo.',
    svg: `<g class="m-nw"><path d="M-14 -6V-14H-6"/></g><g class="m-ne"><path d="M6 -14H14V-6"/></g><g class="m-se"><path d="M14 6V14H6"/></g><g class="m-sw"><path d="M-6 14H-14V6"/></g><path d="M-4 0H4M0 -4V4" stroke-width="2"/>`,
  },
  gold: {
    n: 4, name: 'Precisão', color: '#ffc93a', desc: 'Círculo com arcos internos que se alinham quando você está parado e estável.',
    svg: `<circle class="m-ring" r="14" stroke-width="2"/>${ticks(17, 23)}<g class="m-arcs">${[0, 90, 180, 270].map((c) => arc(8, c - 24, c + 24)).join('')}</g>${dot(1.5)}`,
  },
  scope: {
    n: 5, name: 'Luneta', color: '#3cff7a', size: 2.6, desc: 'Lente com retículo e marcas de distância. Afasta a câmera na direção da mira.',
    svg: `<circle r="27" fill="currentColor" fill-opacity="0.13" stroke="#141414" stroke-width="5"/><circle r="30.2" stroke="#6a6e76" stroke-width="1.4"/>
<path d="M-27 0H-3M3 0H27M0 -27V-3M0 3V27" stroke="#0a0a0a" stroke-width="0.8"/><path d="M-27 0H-17M17 0H27M0 -27V-17M0 17V27" stroke="#0a0a0a" stroke-width="2.4"/>
${[-12, -7, 7, 12].map((v) => `<circle cx="${v}" r="0.9" fill="#0a0a0a" stroke="none"/><circle cy="${v}" r="0.9" fill="#0a0a0a" stroke="none"/>`).join('')}
<circle class="m-spread" r="4" stroke-width="0.6"/>${dot(0.9)}`,
  },
  lockon: {
    n: 6, name: 'Travamento', color: '#ff3048', desc: 'Anéis segmentados que giram ao achar um alvo e travam. Foguete travado persegue o inimigo.',
    svg: `<g class="m-spin"><circle r="17" stroke-dasharray="7 4" stroke-width="1.8"/></g><g class="m-spin-r"><circle r="9.5" stroke-dasharray="3 3" stroke-width="1.6"/></g>${arrows(20, 26, 7)}<circle class="m-confirm" r="23" stroke-width="1.2"/>${dot(1.7)}`,
  },
  directional: {
    n: 7, name: 'Direcional', color: '#ffffff', desc: 'Círculo aberto com setas que se afastam conforme a dispersão (escopetas).',
    svg: `<g class="m-ring">${[45, 135, 225, 315].map((c) => arc(13, c - 30, c + 30)).join('')}</g>${arrows(17, 24, 8)}${dot(2.1, '#ff2a2a')}`,
  },
  holo: {
    n: 8, name: 'Holográfica', color: '#39ff6a', size: 1.25, desc: 'Visor com ponto vermelho que acompanha o movimento da arma.',
    svg: `<rect x="-20" y="-15" width="40" height="30" rx="4" fill="currentColor" fill-opacity="0.1" stroke="#26282e" stroke-width="4"/>
<rect x="-17" y="-12" width="34" height="24" rx="2" stroke="#6a6e76" stroke-width="1.1"/><rect x="-8" y="15" width="16" height="5" fill="#26282e" stroke="none"/><rect x="20" y="-4" width="3" height="8" fill="#4a4e56" stroke="none"/>
<g class="m-holo"><circle r="4.2" fill="#ff3030" stroke="none" opacity="0.25"/><circle r="1.9" fill="#ff4040" stroke="none"/></g>`,
  },
};
export const CROSSHAIR_ORDER = Object.keys(CROSSHAIRS).sort((a, b) => CROSSHAIRS[a].n - CROSSHAIRS[b].n);

// mira padrão de cada arma (modo "Automática")
export const WEAPON_CROSSHAIR = {
  pistol: 'classic', uzi: 'bracket', grenade: 'gold', shotgun: 'directional', barrel: 'tactical', rifle: 'holo',
  sniper: 'scope', barricade: 'tactical', mine: 'tactical', dynamite: 'gold', rocket: 'lockon',
  lmg: 'bracket', flamer: 'directional', glauncher: 'gold', plasma: 'gold', cryo: 'tactical', acidgun: 'directional',
  egrenade: 'gold', igrenade: 'gold', fgrenade: 'gold', tgrenade: 'gold',
  proxmine: 'tactical', spikes: 'tactical', efence: 'tactical', ltower: 'tactical', ftower: 'tactical', itower: 'tactical',
};

export const CROSS_COLORS = [
  ['default', 'Padrão da mira', null], ['#ffffff', 'Branco', '#ffffff'], ['#39ff6a', 'Verde', '#39ff6a'], ['#ff3b30', 'Vermelho', '#ff3b30'],
  ['#ffc93a', 'Amarelo', '#ffc93a'], ['#3ce0ff', 'Ciano', '#3ce0ff'], ['#ff4fd8', 'Magenta', '#ff4fd8'], ['#ff8a2a', 'Laranja', '#ff8a2a'],
];

// marcador de acerto (comum a todas): 4 traços diagonais
const HIT = `<g class="m-hit">${[45, 135, 225, 315].map((a) => {
  const [x0, y0] = P(5, a);
  const [x1, y1] = P(10, a);
  return `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}"/>`;
}).join('')}</g>`;

export function crosshairSvg(id) {
  const c = CROSSHAIRS[id] || CROSSHAIRS.classic;
  return `<svg viewBox="-32 -32 64 64" overflow="visible" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${c.svg}${HIT}</svg>`;
}
