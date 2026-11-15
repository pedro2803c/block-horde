// fontes embutidas no projeto (o jogo não depende de internet)
import '@fontsource/bebas-neue/latin-400.css';
import '@fontsource/exo-2/latin-400.css';
import '@fontsource/exo-2/latin-500.css';
import '@fontsource/exo-2/latin-600.css';
import '@fontsource/exo-2/latin-700.css';
import '@fontsource/exo-2/latin-800.css';
import '@fontsource/exo-2/latin-800-italic.css';
import './style.css';
import { Game } from './Game.js';

const canvas = document.getElementById('game-canvas');
const ui = document.getElementById('ui');

try {
  const game = new Game(canvas, ui);
  game.boot().catch((err) => fatal(err));
} catch (err) {
  fatal(err);
}

function fatal(err) {
  console.error(err);
  const box = document.createElement('div');
  box.className = 'overlay';
  box.innerHTML = '<div class="panel"><h2>Não foi possível iniciar</h2><p class="muted"></p><p>O jogo precisa de um navegador com WebGL (Chrome, Edge ou Firefox atualizados).</p></div>';
  box.querySelector('.muted').textContent = String(err && err.message ? err.message : err);
  ui.append(box);
}
