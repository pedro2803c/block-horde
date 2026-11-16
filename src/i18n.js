// Tradução automática da interface (PT → EN).
// O jogo é escrito em português; em qualquer idioma que não seja português,
// um observador troca os textos da tela pela versão em inglês do dicionário.
import { EXACT, PATTERNS } from './i18n-en.js';

// textos curtos que não passam pelo extrator do dicionário
const EXTRA = {
  Alta: 'High',
  Baixa: 'Low',
  'Não foi possível iniciar': 'Could not start',
  'O jogo precisa de um navegador com WebGL (Chrome, Edge ou Firefox atualizados).': 'The game needs a browser with WebGL (an up-to-date Chrome, Edge or Firefox).',
  'Jogar agora': 'Play now',
  'Escolher arena e sobrevivente': 'Choose arena and survivor',
  'DE VOLTA À LUTA!': 'BACK IN THE FIGHT!',
  'Nenhum vídeo disponível agora. Tente mais tarde.': 'No video available right now. Try again later.',
  Pular: 'Skip',
  'botão direito': 'right button',
  '50 pontos de armadura que absorvem o dano antes da vida.': '50 armor points that absorb damage before your health.',
  'Mova-se com W A S D': 'Move with W A S D',
  'Mire com o mouse e clique (ou Espaço) para atirar': 'Aim with the mouse and click (or Space) to shoot',
  'Encoste nos itens para pegar. Teclas 1–9 trocam de arma': 'Touch items to pick them up. Keys 1–9 switch weapons',
  'Z · X · C usam habilidades, R a ultimate. Tab abre a árvore e P pausa': 'Z · X · C use abilities, R the ultimate. Tab opens the tree and P pauses',
};
const EXTRA_PATTERNS = [
  ['^Continuar com metade da vida · (.*?)$', 'Continue with half health · {0}'],
  ['^Dobrar XP de perfil \\(\\+(.*?)\\)$', 'Double profile XP (+{0})'],
  ['^Dica (.*?)$', 'Tip {0}'],
  ['^Ativas · (.*?)$', 'Actives · {0}'],
  ['^([A-Z0-9]{1,3}): (.*?)$', '{0}: {1}'],
];

let lang = 'pt';
const exact = new Map();
const pats = [];
const cache = new Map();
const LETTER = /[A-Za-zÀ-ÿ]/;

export function detectLang(sdkLocale) {
  const loc = String(sdkLocale || (typeof navigator !== 'undefined' && (navigator.language || (navigator.languages || [])[0])) || 'en').toLowerCase();
  return loc.startsWith('pt') ? 'pt' : 'en';
}

export const getLang = () => lang;

function build() {
  if (exact.size) return;
  for (let [k, v] of Object.entries({ ...EXACT, ...EXTRA })) {
    // os nós de texto são comparados sem os espaços das pontas
    k = k.trim();
    v = v.trim();
    exact.set(k, v);
    const up = k.toUpperCase();
    if (!exact.has(up)) exact.set(up, v.toUpperCase());
  }
  for (const [rx, out] of [...EXTRA_PATTERNS, ...PATTERNS]) pats.push([new RegExp(rx), out]);
}

// traduz um texto; partes variáveis (nomes, números) são traduzidas recursivamente
export function tr(s, depth = 0) {
  if (lang === 'pt' || !s || !LETTER.test(s)) return s;
  const hit = cache.get(s);
  if (hit !== undefined) return hit;
  const lead = s.match(/^\s*/)[0];
  const trail = s.slice(lead.length).match(/\s*$/)[0];
  const core = s.slice(lead.length, s.length - trail.length);
  let out = exact.get(core);
  if (out === undefined && depth < 3) {
    for (const [re, tpl] of pats) {
      const m = re.exec(core);
      if (!m) continue;
      out = tpl.replace(/\{(\d+)\}/g, (_, n) => tr(m[+n + 1] ?? '', depth + 1));
      break;
    }
  }
  if (out === undefined) out = core;
  out = lead + out + trail;
  if (cache.size > 3000) cache.clear();
  cache.set(s, out);
  return out;
}

const ATTRS = ['title', 'aria-label', 'placeholder'];
const done = new WeakMap(); // nó de texto → último valor escrito por nós

function fixText(node) {
  const v = node.nodeValue;
  if (done.get(node) === v) return;
  const t = tr(v);
  done.set(node, t);
  if (t !== v) node.nodeValue = t;
}

function fixAttrs(el) {
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v) {
      const t = tr(v);
      if (t !== v) el.setAttribute(a, t);
    }
  }
}

function walk(root) {
  if (root.nodeType === 3) return fixText(root);
  if (root.nodeType !== 1) return;
  const tag = root.tagName;
  if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'CANVAS' || tag === 'svg') return;
  fixAttrs(root);
  const it = document.createTreeWalker(root, 5, {
    acceptNode: (n) => (n.nodeType === 1 && (n.tagName === 'SCRIPT' || n.tagName === 'STYLE' || n.tagName === 'svg') ? 2 : 1),
  });
  let n = it.nextNode();
  while (n) {
    if (n.nodeType === 3) fixText(n);
    else fixAttrs(n);
    n = it.nextNode();
  }
}

export function startI18n(language) {
  lang = language;
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  if (lang === 'pt') return;
  build();
  walk(document.body);
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'characterData') fixText(m.target);
      else if (m.type === 'attributes') fixAttrs(m.target);
      else for (const n of m.addedNodes) walk(n);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}
