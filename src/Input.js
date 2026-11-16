import * as THREE from 'three';

// Teclado (vários jogadores no mesmo teclado) + mouse para o modo solo.
export class Input {
  constructor(canvas) {
    this.down = new Set();
    this.pressed = new Set();
    this.mouse = { left: false, right: false, wheel: 0 };
    this.mouseNdc = new THREE.Vector2();
    this.mouseIdle = true; // vira false quando o mouse se mexe sobre o jogo
    this.capture = false; // o jogo liga durante a partida para impedir rolagem da página
    this.touchMode = false; // celular: direcionais virtuais (touch.js)
    this.touchMove = null;
    this.touchAim = null;
    const GAME_KEYS = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'NumpadEnter', 'Numpad0', 'Tab', 'Slash', 'Quote']);
    window.addEventListener('keydown', (e) => {
      if (this.capture && GAME_KEYS.has(e.code)) e.preventDefault();
      if (!this.down.has(e.code)) this.pressed.add(e.code);
      this.down.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.down.delete(e.code));
    window.addEventListener('blur', () => {
      this.down.clear();
      this.mouse.left = false;
      this.mouse.right = false;
    });
    this.mouseClient = { x: 0, y: 0 };
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return; // toque usa os controles virtuais
      this.mouseClient.x = e.clientX;
      this.mouseClient.y = e.clientY;
      this.mouseNdc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      this.mouseIdle = false;
    });
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return;
      if (e.button === 0) this.mouse.left = true;
      if (e.button === 2) this.mouse.right = true;
      this.mouseNdc.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      this.mouseIdle = false;
    });
    window.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'touch') return;
      if (e.button === 0) this.mouse.left = false;
      if (e.button === 2) this.mouse.right = false;
    });
    canvas.addEventListener('wheel', (e) => {
      this.mouse.wheel += Math.sign(e.deltaY);
      e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }
  any(codes) {
    for (const c of codes) if (this.down.has(c)) return true;
    return false;
  }
  hit(code) {
    return this.pressed.has(code);
  }
  anyHit(codes) {
    for (const c of codes) if (this.pressed.has(c)) return true;
    return false;
  }
  endFrame() {
    this.pressed.clear();
    this.mouse.wheel = 0;
  }
}
