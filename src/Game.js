import * as THREE from 'three';
import { AudioSystem, SOUND_NAMES } from './core/Audio.js';
import { BoxBatch, drawCharacter, Particles } from './render.js';
import { Arena, T_LAVA, T_WATER, T_BUSH, T_TOXIC, T_ELEC, T_PLATFORM, BELT_SPEED } from './Arena.js';
import { BARREL_MODEL } from './scenery.js';
import { ACTIVES, ULTIMATES, PASSIVES, BRANCHES, MAX_LEVEL, NODE_REQ, ULT_REQ, levelCost, xpNeed, loadLoadouts, ABILITY_KEYS } from './abilities.js';
import { Input } from './Input.js';
import { UI } from './UI.js';
import { WEAPONS, WEAPON_ORDER, WEAPON_GROUPS, TRAPS, SLOT_CODES, UNLOCKS, ENEMIES, ENEMY_ORDER, SURVIVORS, ARENAS, NAVAL_WEAPONS, NECRO_WEAPONS, profileNeed, matchXp, isEnemyAllowedInArena } from './data.js';
import { enemyLook, drawEnemy } from './monsters.js';
import { ITEMS, GUN_MODELS, GUN_LEN, MELEE, GEAR, drawItem, rollTable } from './items.js';
import { ArsenalMixin, WALK_TRAPS } from './arsenal.js';
// mortos-vivos: Sabre Fantasmagórico causa dano extra
const UNDEAD_TYPES = new Set(['walker', 'runner', 'brute', 'bloater', 'specter', 'reaper', 'mummy', 'skeleton', 'phantom', 'rm_spirit', 'lb_specter', 'nv_pirate', 'nv_ghost', 'nv_harpooner', 'nv_brute', 'nc_vampire', 'nc_nosferatu', 'nc_knight', 'nc_executioner', 'nc_reaper', 'nc_banshee', 'nc_abomination', 'nc_plague', 'nc_tombking', 'lich', 'nc_matriarch', 'nc_colossus']);
import { WorldMixin } from './world.js';
import { EconomyMixin } from './economyGame.js';
import { pvpMethods } from './pvp/pvpGame.js';
import { platform } from './platform.js';
import { TouchControls } from './touch.js';
import { ControllerManager } from './gamepad.js';
import { diffOf } from './difficulty.js';
import { mountDef, mountForArena, mountOrderForArena, drawMount, MOUNT_USE_DIST, mountSkills, mountSkillAt, mountRam, mountWeaponDef, MOUNTS, MOUNT_SKILLS } from './mounts.js';
import { loadMountKeys } from './mountControls.js';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
const angDiff = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));
const ENERGY_T = 10; // bebida energética
const SCOUT_T = 15; // binóculos
const LIGHT_T = 45; // bateria da lanterna
const MAX_ARMOR = 50;
const MEDKIT_HEAL = 0.6;
const EXO_T = 20; // exoesqueleto temporário
const BLOOD = [0x8a0a0a, 0xa31212, 0x6a0606];
const PLAYER_COLORS = [0x3aa0ff, 0xff8a2a];
const SETTINGS_KEY = 'blockhorde_settings_v1';
const RECORDS_KEY = 'blockhorde_records_v1';
const PROFILE_KEY = 'blockhorde_profile_v1';
import { loadTut, saveTut, STEPS as TUT_STEPS, HINTS as TUT_HINTS, platOf as tutPlat, pickText as tutText } from './tutorial.js';
// armas que o tiro automático do celular dispara (granadas e armadilhas só com o dedo)
const AUTO_FIRE = new Set(['gun', 'flame', 'bolt', 'glob', 'rocket']);

// Controles: solo = WASD + mouse; co-op = metade do teclado para cada jogador
// remove do vetor, no lugar, os itens que não passam no teste (sem criar outro vetor a cada quadro)
const compact = (arr, keep) => {
  let n = 0;
  for (let i = 0; i < arr.length; i++) if (keep(arr[i])) arr[n++] = arr[i];
  arr.length = n;
};

const CONTROLS = {
  solo: { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], fire: ['Space'], next: ['KeyE'], prev: ['KeyQ'], melee: ['KeyF'], reload: ['KeyG'], mount: ['KeyV'], mouse: true },
  p1: { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], fire: ['Space'], next: ['KeyE'], prev: ['KeyQ'], melee: ['KeyF'], reload: ['KeyG'], mount: ['KeyV'] },
  p2: { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], fire: ['Enter', 'NumpadEnter', 'Numpad0', 'KeyL'], next: ['ShiftRight', 'Period'], prev: ['Comma'], melee: ['KeyK', 'Slash', 'NumpadDecimal', 'Numpad1'], reload: ['KeyH', 'Numpad3'], mount: ['KeyM', 'Numpad2'] },
};

// avisos dos eventos climáticos de cada arena
const EVENT_INFO = {
  rain: { title: 'TEMPESTADE ÁCIDA!', kind: 'wave', sfx: 'wave', rate: 0.85 },
  hordealarm: { title: 'ALARME DE HORDA! CARROS DISPARANDO', kind: 'bad', sfx: 'siren', rate: 1.2 },
  overload: { title: 'SOBRECARGA DAS MÁQUINAS!', kind: 'bad', sfx: 'siren', rate: 0.7 },
  blackout: { title: 'APAGÃO NA FÁBRICA!', kind: 'wave', sfx: 'siren', rate: 0.8 },
  fog: { title: 'NEBLINA DENSA!', kind: 'wave', sfx: 'wave', rate: 0.7 },
  alarm: { title: 'ATAQUE DE REFORÇOS!', kind: 'bad', sfx: 'siren', rate: 1 },
  breach: { title: 'QUEBRA DE CONTENÇÃO!', kind: 'bad', sfx: 'siren', rate: 1.4 },
  trial: { title: 'PROVA DE SOBREVIVÊNCIA!', kind: 'wave', sfx: 'crowd', rate: 1 },
  curse: { title: 'MALDIÇÃO DO TEMPLO!', kind: 'bad', sfx: 'portal', rate: 0.5 },
};

export class Game {
  constructor(canvas, uiRoot) {
    this.canvas = canvas;
    this.mountKeys = loadMountKeys(); // teclas configuráveis das montarias (menu Controles)
    this.settings = { master: 0.8, music: 0.5, sfx: 0.85, ambient: 0.5, ui: 0.8, quality: 'medium', showFps: false, crossMode: 'auto', crossColor: 'default', crossSize: 1, crossOpacity: 0.95, touchAuto: true, touchSize: 1, touchHaptic: true, aimMode: 1, notifyDur: 1, difficulty: 'normal' };
    try {
      Object.assign(this.settings, JSON.parse(platform.getItem(SETTINGS_KEY) || '{}'));
    } catch {
      /* sem armazenamento */
    }
    this.state = 'boot';
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.5, 200);
    this.applyQuality();
    window.addEventListener('resize', () => this.resize());
    this.resize();
    this.input = new Input(canvas);
    this.audio = new AudioSystem();
    this.audio.listener.yaw = Math.PI; // direita da tela = +x
    this.applyVolumes();
    platform.onMute(() => this.applyVolumes());
    this.ui = new UI(this, uiRoot);
    this.touch = new TouchControls(this, uiRoot);
    this.pad = new ControllerManager(this); // Xbox, PlayStation, Nintendo, 8BitDo, Logitech e genéricos
    this.input.onDevice = () => this.pad.setUsing(false);
    this.raycaster = new THREE.Raycaster();
    this.aimPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -1);
    this.mouseWorld = new THREE.Vector3();
    this.camTarget = new THREE.Vector3(23, 0, 16);
    this.camDist = 20;
    this.shakeAmt = 0;
    this.scopeK = 0; // 0..1: quanto a luneta do sniper está ativa
    this.menuT = 0;
    // o navegador só libera o som depois de um gesto do jogador (clique, toque ou tecla)
    for (const t of ['pointerdown', 'pointerup', 'touchend', 'click', 'mousedown']) window.addEventListener(t, () => this.audio.unlock(), { capture: true });
    window.addEventListener('keydown', (e) => {
      this.audio.unlock();
      this.onKey(e);
    }, { capture: true });
    this.testMode = new URLSearchParams(location.search).has('test'); // depuração automatizada
    this.forceTutorial = new URLSearchParams(location.search).has('tutorial'); // testes do tutorial
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'playing' && !this.testMode) this.pause();
    });
    window.__bh = this;
    if (this.testMode) window.__bhTest = { Arena, ARENAS, ENEMIES, SURVIVORS, MOUNTS, MOUNT_SKILLS, mountSkillAt };
  }

  async boot() {
    platform.loadingStart();
    this.ui.loading(0, 'Preparando...');
    const total = SOUND_NAMES.length + 2;
    let done = 0;
    for (const name of SOUND_NAMES) {
      await this.audio.renderSound(name);
      done++;
      if (done % 4 === 0) {
        this.ui.loading(done / total, `Sintetizando sons (${done}/${SOUND_NAMES.length})`);
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    this.ui.loading((done + 1) / total, 'Montando a arena do menu');
    await new Promise((r) => setTimeout(r, 16));
    this.setupMatch(ARENAS[0], [], true);
    this.ui.loading(1, 'Pronto!');
    await new Promise((r) => setTimeout(r, 200));
    platform.loadingStop();
    this.toMenu();
    this.last = performance.now();
    this.renderer.setAnimationLoop((t) => this.frame(t));
  }

  // ------------------------------------------------------------------ configurações
  // no celular a resolução interna se ajusta ao FPS (adaptRes); os efeitos continuam iguais
  pixelRatio() {
    const q = this.settings.quality;
    const k = this.input?.touchMode && this.adapt ? this.adapt.scale : 1;
    return Math.min(window.devicePixelRatio || 1, q === 'low' ? 0.8 : q === 'high' ? 2 : 1.25) * k;
  }

  applyQuality() {
    const q = this.settings.quality;
    this.renderer.setPixelRatio(this.pixelRatio());
    this.renderer.shadowMap.enabled = q !== 'low';
    if (this.sun) {
      const shadows = q !== 'low';
      this.sun.castShadow = shadows;
      if (this.B) this.B.mesh.castShadow = shadows;
      if (this.arena?.instanced) this.arena.instanced.castShadow = shadows;
      this.scene?.traverse((o) => o.material && (o.material.needsUpdate = true));
    }
    this.resize();
  }
  applyVolumes() {
    const s = this.settings;
    // a plataforma pode pedir silêncio (botão de som da CrazyGames) e os anúncios também
    const on = platform.muted || this.adMute ? 0 : 1;
    this.audio.setVolumes(s.master * on, s.music, s.sfx, s.ambient ?? 0.5, s.ui ?? 0.8);
  }
  saveSettings() {
    try {
      platform.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      /* ignora */
    }
  }
  records() {
    try {
      return JSON.parse(platform.getItem(RECORDS_KEY) || '{}');
    } catch {
      return {};
    }
  }
  // perfil persistente: o nível desbloqueia as arenas
  profile() {
    let pr = null;
    try {
      pr = JSON.parse(platform.getItem(PROFILE_KEY) || 'null');
    } catch {
      pr = null;
    }
    if (!pr || typeof pr.xp !== 'number' || typeof pr.level !== 'number') {
      // primeira vez: credita os recordes já feitos
      let xp = 0;
      for (const r of Object.values(this.records())) xp += matchXp(r.score || 0, r.wave || 0);
      pr = this.addProfileXp({ xp: 0, level: 1 }, xp);
      this.saveProfile(pr);
    }
    return pr;
  }
  addProfileXp(pr, n) {
    pr.xp += n;
    while (pr.xp >= profileNeed(pr.level)) {
      pr.xp -= profileNeed(pr.level);
      pr.level++;
    }
    return pr;
  }
  saveProfile(pr) {
    try {
      platform.setItem(PROFILE_KEY, JSON.stringify(pr));
    } catch {
      /* ignora */
    }
  }
  arenaUnlocked(a) {
    return this.profile().level >= (a.unlock || 1);
  }
  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  // ------------------------------------------------------------------ partida
  setupMatch(arenaDef, survivors, demo = false) {
    this.diff = demo ? diffOf('normal') : diffOf(this.matchDiff || this.settings.difficulty);
    this.disposeMatch();
    const scene = (this.scene = new THREE.Scene());
    const L = arenaDef.light;
    scene.background = new THREE.Color(L.sky);
    scene.fog = new THREE.Fog(L.fog, 40, 90);
    this.hemi = new THREE.HemisphereLight(0xdfe8ff, 0x3a3020, L.hemi);
    scene.add(this.hemi);
    const sun = (this.sun = new THREE.DirectionalLight(L.sun, L.sunI));
    sun.castShadow = this.settings.quality !== 'low';
    sun.shadow.mapSize.set(2048, 2048);
    const arena = (this.arena = new Arena(arenaDef));
    const sc = sun.shadow.camera;
    sc.left = -arena.W * 0.65;
    sc.right = arena.W * 0.65;
    sc.top = arena.D * 0.75;
    sc.bottom = -arena.D * 0.75;
    sc.near = 1;
    sc.far = 120;
    sun.shadow.bias = -0.0008;
    sun.shadow.normalBias = 0.03;
    sun.position.set(arena.W / 2 - 18, 40, arena.D / 2 - 14);
    sun.target.position.set(arena.W / 2, 0, arena.D / 2);
    scene.add(sun, sun.target);
    this.boomLights = [0, 1].map(() => {
      const l = new THREE.PointLight(0xff8a30, 0, 14, 1.6);
      scene.add(l);
      return l;
    });
    this.boomIdx = 0;
    // lanternas (uma por jogador): criadas apagadas para não recompilar os materiais depois
    this.spots = [0, 1].map(() => {
      const l = new THREE.SpotLight(0xfff0c0, 0, 17, 0.48, 0.5, 1.1);
      scene.add(l, l.target);
      return l;
    });
    arena.build(scene, this.settings.quality);
    this.B = new BoxBatch(scene, 16000, { shadows: this.settings.quality !== 'low' });
    this.G = new BoxBatch(scene, 4500, { shadows: false, emissive: true });
    this.parts = new Particles(this.settings.quality === 'low' ? 1200 : 2600);
    this.zombies = [];
    this.corpses = [];
    this.projectiles = [];
    this.clouds = [];
    this.hazards = []; // fogo, poças ácidas, nuvens tóxicas e gelo criados pelo time
    this.placeables = [];
    this.pickups = [];
    this.strikes = [];
    this.scoutT = 0;
    // habilidades: torres, drones, campos (elétrico/sobrevivência), bombardeios e raios
    this.turrets = [];
    this.drones = [];
    this.fields = [];
    this.bombards = [];
    this.bolts = [];
    // barris explosivos desenhados no mapa viram barris normais do jogo
    for (const b of arena.mapBarrels) {
      this.placeables.push({ kind: 'barrel', i: b.i, j: b.j, x: b.x, z: b.z, hp: 14, maxHp: 260, armT: 0, dead: false, owner: null, map: true });
      arena.dyn[arena.idx(b.i, b.j)] = 2;
    }
    this.tracers = [];
    this.flashes = [];
    this.timers = [];
    this.time = 0;
    // ---- ambiente vivo da arena (mecânicas, clima e áudio) ----
    this.gateProps = arena.props.filter((p) => p.def.id === 'mgate');
    this.romanGateProps = arena.props.filter((p) => p.def.id === 'roman_gate');
    for (const gp of this.romanGateProps) {
      gp.closed = false;
      gp.broken = false;
      gp.hp = gp.maxHp = 120;
      arena.setPropBlock(gp, false);
    }
    this.romanGatesClosed = false;
    for (const gp of this.gateProps) {
      gp.closed = false;
      gp.broken = false;
      gp.hp = gp.maxHp = 240;
      gp.holdT = 0;
      arena.setPropBlock(gp, false);
    }
    this.gatesClosed = false;
    this.initWorldObjects();
    this.power = !['military'].includes(arenaDef.theme); // base militar precisa do gerador
    this.genOn = false;
    for (const pr of arena.props) if (pr.def.id === 'generator') pr.on = false;
    this.elecOn = false;
    this.elecForceT = 0;
    this.rain = Array.from({ length: 170 }, () => ({ x: rand(0, arena.W), y: rand(0, 16), z: rand(0, arena.D), vx: 1.4, vy: 13, vz: 0.6 }));
    this.rainOn = arenaDef.theme === 'city' || arenaDef.theme === 'naval';
    this.eventLight = new THREE.PointLight(0xff3020, 0, 30, 1.4);
    this.eventLight.position.set(arena.W / 2, 8, arena.D / 2);
    scene.add(this.eventLight);
    this.baseLight = { sunI: L.sunI, hemi: L.hemi, fogNear: 40, fogFar: 90 };
    this.baseLight.fogC = new THREE.Color(L.fog);
    this.baseLight.bgC = new THREE.Color(L.sky);
    this.eventT = 32;
    this.event = null;
    this.eventLeft = 0;
    this.eventBoost = 0;
    this.lightK = 1;
    this.alarmT = 0;
    this.lightningT = 0;
    this.alarmSpawnT = 0;
    this.audio.setAmbient(arenaDef.ambient || 'city');
    this.audio.setWeatherAmbient('rain', this.rainOn);
    this.audio.setWeatherAmbient('fog', false);
    this._wRain = this.rainOn;
    this._wFog = false;
    this.demo = demo;
    this.wave = 0;
    this.waveState = 'intermission';
    this.waveT = 3;
    this.toSpawn = [];
    this.spawnT = 0;
    this.crateT = 8;
    this.flowT = 0;
    this.mult = 1;
    this.meter = 0;
    this.maxMult = 1;
    this.upg = {};
    this.unlocked = new Set(['pistol']);
    this.stats = { score: 0, kills: 0, shots: 0, time: 0 };
    this.boss = null;
    this.loadouts = loadLoadouts();
    this.players = survivors.map((s, k) => this.makePlayer(s, k, survivors.length > 1));
    this.econReset();
    if (!demo) for (const p of this.players) this.applyPermanent(p); // compras permanentes valem em toda partida
    const center = { x: arena.W / 2, z: arena.D / 2 + 4 };
    const montariaDaArena = mountForArena(arenaDef.id); // uma montaria 3D estacionada por arena
    this.players.forEach((p, k) => {
      // nasce num ponto livre (o centro de algumas arenas tem consoles e muros)
      const s = this.freeSpot(center.x + (k ? 1.2 : -1.2) * (survivors.length > 1), center.z, p.radius + 0.05);
      p.pos.set(s.x, 0, s.z);
      p.mountId = montariaDaArena ? arenaDef.id : null;
    });
    // montaria: a partida começa a pé; ela só é liberada quando o chefe realmente aparece (releaseMount)
    this.worldMount = null;
    this.mountPending = montariaDaArena && !demo ? { id: arenaDef.id, def: montariaDaArena } : null;
    this.mountDef = montariaDaArena || null;
    this.mountReleases = 0;
    this.bossStarted = [];       // chefes iniciados nesta partida (progressão de montaria: 1º/2º/3º confronto)
    this.mountReleasedBoss = {}; // liberação já efetuada por tipo de chefe (evita duplicação)
    this.camTarget.set(center.x, 0, center.z);
    if (demo) {
      const demoPool = ['walker', 'walker', ...ENEMY_ORDER.filter((t) => !ENEMIES[t].boss && isEnemyAllowedInArena(t, arenaDef.id))];
      for (let k = 0; k < 26; k++) {
        this.spawnZombie(pick(demoPool), rand(4, arena.W - 4), rand(4, arena.D - 4));
      }
    }
  }

  disposeMatch() {
    if (!this.scene) return;
    this.arena.dispose(this.scene);
    for (const b of [this.B, this.G]) {
      this.scene.remove(b.mesh);
      b.mesh.geometry.dispose();
      b.mesh.material.dispose();
      b.mesh.dispose();
    }
    this.sun.shadow.map?.dispose();
    this.scene = null;
  }

  makePlayer(look, k, coop) {
    const isPvp = this.mode === 'pvp';
    const lo = this.loadouts[k % this.loadouts.length] || this.loadouts[0];
    const p = {
      id: k,
      look: { ...look, eyes: 0x1a1a1a },
      color: PLAYER_COLORS[k % PLAYER_COLORS.length],
      ctl: CONTROLS[isPvp ? 'solo' : (coop ? (k ? 'p2' : 'p1') : 'solo')],
      pos: new THREE.Vector3(),
      vel: new THREE.Vector3(),
      facing: Math.PI,
      aim: Math.PI,
      hp: 100,
      maxHp: 100,
      alive: true,
      weapon: 'pistol',
      ammo: { pistol: Infinity },
      clip: { pistol: WEAPONS.pistol.mag }, // carregador atual de cada arma
      reloadT: 0,
      reloadMax: 1,
      reloadW: null,
      bloom: 0,
      groupSel: {},
      fireCd: 0,
      recoil: 0,
      hurtT: 0,
      walk: 0,
      firingT: 0,
      deadT: 0,
      kills: 0,
      radius: 0.33,
      // equipamento e efeitos (perdidos ao cair)
      armor: 0,
      maxArmor: MAX_ARMOR,
      helmet: false,
      pack: false,
      boots: false,
      exoT: 0,
      energyT: 0,
      lightT: 0,
      meleeCd: 0,
      meleeT: 0,
      meleeDur: 1,
      meleeKind: 'knife',
      // habilidades: nível/XP/pontos, passivas compradas e 3 ativas + 1 ultimate equipadas
      lv: 1,
      xp: 0,
      pts: 0,
      pas: {},
      ultOn: false,
      slots: [...lo.actives, lo.ult],
      build: lo.build || null,
      cds: [0, 0, 0, 0],
      cdMax: [1, 1, 1, 1],
      akeys: ABILITY_KEYS[isPvp ? 'solo' : (coop ? (k ? 'p2' : 'p1') : 'solo')],
      shieldT: 0,
      cloakT: 0,
      furyT: 0,
      dashT: 0,
      healT: 0,
      // efeitos de terreno e mecânicas de arena
      rootT: 0,
      stunT: 0,
      slowT: 0,
      slowMul: 1,
      shockCd: 0,
      toxicT: 0,
      lavaT: 0,
      fireT: 0,
      onPlat: false,
      // montaria
      mountId: null,        // id da montara ('praca', 'armazem', etc.)
      mountHp: 0,           // vida atual da montara
      mountT: 0,            // timer de ação da montara (entrar/sair/ataque)
      isMounted: false,     // jogador está sentado na montara
    };
    return p;
  }

  startMatch(arenaDef, survivors, mode) {
    this.continued = false; // continuação com anúncio: 1 por partida
    this.xpCredited = 0; // XP de perfil já creditado (se a partida continuar, não conta duas vezes)
    this.firstPrev = undefined;
    this.mode = mode;
    this.matchDiff = this.settings.difficulty || 'normal'; // reiniciar mantém a dificuldade da partida
    this.arenaDef = arenaDef;
    this.survivorPicks = survivors;
    this.bossStarted = [];       // resetar progressão da partida (chefe 1º/2º/3º)
    this.mountReleasedBoss = {};
    this.mountReleases = 0;
    this.setupMatch(arenaDef, survivors);
    this.state = 'playing';
    this.ui.hud(true);
    this.ui.showScreen(null);
    this.audio.setMusic('ambient');
    this.ui.banner('PREPARE-SE!', 'info');
    this.canvas.style.cursor = mode === 'solo' ? 'none' : 'default';
    this.startTutorial();
  }
  // "Jogar agora": partida solo na primeira arena, sem passar pelas escolhas
  quickStart() {
    this.startMatch(ARENAS[0], [SURVIVORS[Math.floor(Math.random() * SURVIVORS.length)]], 'solo');
  }
  restart() {
    this.afterBreak(() => this.startMatch(this.arenaDef, this.survivorPicks, this.mode));
  }
  // depois do fim de partida, a plataforma pode mostrar um anúncio de intervalo
  afterBreak(fn) {
    if (this.state !== 'gameover') return fn();
    if (this.adBusy) return;
    this.adBusy = true;
    platform.midgame(this.adHooks(), () => {
      this.adBusy = false;
      fn();
    });
  }
  adHooks() {
    return {
      start: () => {
        this.adMute = true;
        this.applyVolumes();
      },
      end: () => {
        this.adMute = false;
        this.applyVolumes();
      },
    };
  }
  // ------------------------------------------------------------------ anúncios com recompensa
  canContinue() {
    // não em toda morte: só uma vez por partida, a partir da onda 3
    return platform.adsAvailable && !this.continued && this.wave >= 3;
  }
  adContinue(onFail) {
    if (this.adBusy || !this.canContinue()) return;
    this.adBusy = true;
    platform.rewarded(this.adHooks(), () => {
      this.adBusy = false;
      this.continueMatch();
    }, () => {
      this.adBusy = false;
      onFail && onFail();
    });
  }
  continueMatch() {
    if (this.state !== 'gameover') return;
    this.continued = true; // moedas perdidas na morte não voltam; a próxima morte volta a zerar o saldo
    if (this.econ) this.econ.lossDone = false;
    const anchor = this.players[0];
    for (const p of this.players) {
      if (!p.alive && p !== anchor) {
        const spot = this.freeSpotNear(anchor.pos.x, anchor.pos.z, p.radius);
        p.pos.set(spot.x, 0, spot.z);
      }
      p.alive = true;
      p.deadT = 0;
      p.hp = Math.ceil(p.maxHp / 2);
      p.shieldT = Math.max(p.shieldT || 0, 3); // respiro: 3 s de escudo
    }
    // empurra o perigo para longe: atordoa a horda e afasta quem está colado
    for (const z of this.zombies) {
      z.stunT = Math.max(z.stunT || 0, 2.5);
    }
    this.state = 'playing';
    this.ui.hud(true);
    this.ui.showScreen(null);
    this.audio.setMusic(this.boss ? 'boss' : 'combat');
    this.ui.banner('DE VOLTA À LUTA!', 'good');
    this.canvas.style.cursor = (this.mode === 'solo' || this.mode === 'pvp') ? 'none' : 'default';
  }
  adDoubleXp(onDone, onFail) {
    if (this.adBusy || !platform.adsAvailable || !this.lastXp || this.lastXp.doubled) return;
    this.adBusy = true;
    platform.rewarded(this.adHooks(), () => {
      this.adBusy = false;
      const pf = this.profile();
      const x = this.lastXp;
      this.addProfileXp(pf, x.gained);
      this.xpCredited += x.gained;
      this.saveProfile(pf);
      x.doubled = true;
      x.gained *= 2;
      x.level = pf.level;
      x.cur = pf.xp;
      x.need = profileNeed(pf.level);
      x.unlocked = ARENAS.filter((a) => (a.unlock || 1) > x.before && (a.unlock || 1) <= pf.level).map((a) => a.name);
      onDone && onDone();
    }, () => {
      this.adBusy = false;
      onFail && onFail();
    });
  }
  // ------------------------------------------------------------------ tutorial curto (1ª partida solo)
  // tutorial interativo de 12 etapas (src/tutorial.js): roda na partida solo enquanto não foi concluído/ignorado
  startTutorial() {
    this.tut = null;
    this.tutSave = loadTut();
    if (this.mode !== 'solo' || this.testMode && !this.forceTutorial) return;
    const s = this.tutSave;
    if (s.status !== 'new' && s.status !== 'active') return;
    s.status = 'active';
    saveTut(s);
    this.tut = { step: Math.min(s.step, TUT_STEPS.length - 1), t: 0 };
    this.beginTutStep();
  }
  beginTutStep() {
    const tu = this.tut;
    tu.t = 0;
    TUT_STEPS[tu.step].begin?.(this, tu);
    this.ui.tutorial(tu.step);
  }
  // avança (ação cumprida, Continuar ou Pular etapa)
  nextTutStep() {
    const tu = this.tut;
    if (!tu) return;
    const s = this.tutSave;
    const id = TUT_STEPS[tu.step].id;
    if (!s.done.includes(id)) s.done.push(id);
    tu.step++;
    s.step = tu.step;
    this.audio.play('levelup', { volume: 0.35 });
    if (tu.step >= TUT_STEPS.length) {
      s.status = 'done';
      saveTut(s);
      this.tut = null;
      this.ui.tutorial(-1);
      this.ui.tutorialDone();
      return;
    }
    saveTut(s);
    this.beginTutStep();
  }
  skipTutorial() {
    this.tut = null;
    const s = (this.tutSave ||= loadTut());
    if (s.status !== 'done') s.status = 'skipped';
    saveTut(s);
    this.ui.tutorial(-1);
  }
  // reinicia (manual) ou retoma uma etapa específica na próxima partida solo
  resetTutorial(step = 0) {
    const s = (this.tutSave = loadTut());
    s.status = 'active';
    s.step = step;
    if (step === 0) s.done = [];
    saveTut(s);
  }
  // dica contextual: só na 1ª vez que a mecânica aparece; nunca durante uma etapa do tutorial que já ensine isso
  tutHint(id) {
    if (this.testMode || this.mode === 'demo' || this.demo) return;
    const s = (this.tutSave ||= loadTut());
    if (s.seen.includes(id)) return;
    s.seen.push(id);
    saveTut(s);
    this.ui.notify(tutText(TUT_HINTS[id], tutPlat(this)), 'info', 'info', { pri: 1, dur: 5 });
  }
  updateTutorial(dt) {
    const tu = this.tut;
    if (!tu) return;
    tu.t += dt;
    const st = TUT_STEPS[tu.step];
    if (st.kind === 'action' && st.check(this, tu)) this.nextTutStep();
  }
  toMenu(afterAd = false) {
    if (this.state === 'gameover' && !afterAd) return this.afterBreak(() => this.toMenu(true));
    this.tut = null;
    this.ui.tutorial(-1);
    this.state = 'menu';
    this.ui.hud(false);
    this.ui.showScreen('menu');
    // 1º acesso: boas-vindas com Começar tutorial / Aprender depois / Manual
    if ((!this.testMode || this.forceTutorial) && loadTut().status === 'new') this.ui.showScreen('welcome');
    this.audio.setMusic('menu');
    this.canvas.style.cursor = 'default';
    if (!this.demo) this.setupMatch(ARENAS[Math.floor(Math.random() * ARENAS.length)], [], true);
  }
  // solta tudo ao abrir uma tela: nenhum comando da partida continua valendo por baixo dela
  clearInput() {
    const i = this.input;
    i.down.clear();
    i.pressed.clear();
    i.mouse.left = false;
    i.mouse.right = false;
    i.mouse.wheel = 0;
    i.vdown.clear();
    this.touch.reset();
  }
  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.clearInput();
    this.ui.showScreen('pause');
    this.canvas.style.cursor = 'default';
  }
  openTree(k = 0) {
    if (this.state !== 'playing' && this.state !== 'paused') return;
    this.state = 'paused';
    this.clearInput();
    this.ui.showScreen('tree', { k });
    this.canvas.style.cursor = 'default';
  }
  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.ui.showScreen(null);
    this.canvas.style.cursor = (this.mode === 'solo' || this.mode === 'pvp') ? 'none' : 'default';
  }
  onKey(e) {
    // Tab abre/fecha a árvore de habilidades (pausa o jogo)
    if (e.code === 'Tab' && !e.repeat && (this.state === 'playing' || (this.state === 'paused' && this.ui.screen === 'tree'))) {
      e.preventDefault();
      if (this.state === 'playing') this.openTree();
      else this.resume();
      return;
    }
    // B abre a loja (compras só no intervalo entre ondas)
    if (e.code === 'KeyB' && !e.repeat && this.state === 'playing' && !this.demo) { e.preventDefault(); this.openShop(); return; }
    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (this.state === 'playing') this.pause();
      else if (this.state === 'paused') this.resume();
    }
  }

  // ------------------------------------------------------------------ armas
  wstat(id) {
    const w = { ...WEAPONS[id] };
    w.id = id;
    const u = this.upg;
    if (id === 'pistol' && u.pistolFast) w.rate = 0.15;
    if (id === 'uzi' && u.uziDmg) w.dmg *= 1.4;
    if (id === 'shotgun' && u.shotgunPellets) w.pellets = 11;
    if (id === 'rifle' && u.rifleRail) w.pierce = 8;
    if (u.bigBoom && w.radius) w.radius *= 1.4;
    return w;
  }
  cycleWeapon(p, dir) {
    if (p.isMounted) return; // montado: a arma é a da montaria, não troca com Q/E/roda
    const owned = WEAPON_ORDER.filter((id) => this.unlocked.has(id));
    let i = owned.indexOf(p.weapon);
    for (let k = 0; k < owned.length; k++) {
      i = (i + dir + owned.length) % owned.length;
      const id = owned[i];
      if (this.usable(p, id)) {
        this.selectWeapon(p, id);
        return;
      }
    }
  }
  selectWeapon(p, id) {
    if (p.weapon === id) return;
    if (p.isMounted) return; // a montaria mantém o próprio ataque até desmontar
    p.weapon = id;
    p.reloadT = 0; // trocar de arma cancela a recarga
    if (this.state === 'playing' && !this.tut) this.tutHint('weapon');
    p.bloom = 0;
    const g = WEAPON_GROUPS.findIndex((grp) => grp.includes(id));
    if (g >= 0) p.groupSel[g] = id;
    this.audio.play('reload_out', { volume: 0.4, rate: 1.3 });
    // arma com carregador vazio recarrega sozinha ao ser sacada
    if (WEAPONS[id].mag && !(p.clip[id] > 0)) this.startReload(p);
  }
  // tecla do grupo: saca a última arma usada do grupo; apertar de novo alterna entre as do grupo
  selectGroup(p, g) {
    if (p.isMounted) return;
    const list = WEAPON_GROUPS[g].filter((id) => this.unlocked.has(id) && this.usable(p, id));
    if (!list.length) return;
    const cur = list.indexOf(p.weapon);
    const id = cur >= 0 ? list[(cur + 1) % list.length] : list.includes(p.groupSel[g]) ? p.groupSel[g] : list[0];
    this.selectWeapon(p, id);
  }

  fire(p) {
    const w = this.wstat(p.weapon);
    // plataforma elevada: rifles e sniper ganham alcance e dano
    if (p.onPlat && (w.kind === 'gun' || w.kind === 'rocket' || w.kind === 'bolt')) {
      w.range *= 1.4;
      w.dmg *= 1.2;
    }
    if (w.mag) {
      // carregador: atirar interrompe a recarga cartucho a cartucho; o pente vazio recarrega sozinho
      if (p.reloadT > 0) {
        if (w.shell && p.clip[p.weapon] > 0) p.reloadT = 0;
        else return;
      }
      if (!(p.clip[p.weapon] > 0)) {
        if (!this.startReload(p)) {
          this.audio.play('empty', { volume: 0.5 });
          p.fireCd = 0.25;
          this.cycleWeapon(p, -1);
        }
        return;
      }
    } else if (!(p.ammo[p.weapon] > 0)) {
      this.audio.play('empty', { volume: 0.5 });
      p.fireCd = 0.25;
      this.cycleWeapon(p, -1);
      return;
    }
    let ang = p.aim;
    // assistência de mira para quem joga só no teclado
    if ((!p.ctl.mouse || this.input.mouseIdle) && !(p.ctl.mouse && this.input.touchAim)) {
      const best = this.aimTarget(p);
      if (best) ang = Math.atan2(best.pos.x - p.pos.x, best.pos.z - p.pos.z);
    }
    // mira: as marcações abrem a cada disparo
    p.cxKick = Math.min(1.2, (p.cxKick || 0) + (w.heavy ? 1 : w.pellets > 1 ? 0.8 : w.kind === 'gun' ? 0.3 + (w.bloom ? p.bloom * 4 : 0) : w.kind === 'flame' ? 0.1 : 0.5));
    p.facing = ang;
    p.fireCd = w.rate * (p.energyT > 0 ? 0.7 : 1) * (p.furyT > 0 ? 0.75 : 1);
    p.firingT = 0.6;
    p.recoil = w.kind === 'flame' ? 0.3 : 1;
    if (w.mag) p.clip[p.weapon]--;
    else p.ammo[p.weapon]--;
    this.stats.shots++;
    const dx = Math.sin(ang);
    const dz = Math.cos(ang);
    const mx = p.pos.x + dx * 0.75 - Math.cos(ang) * 0.3;
    const mz = p.pos.z + dz * 0.75 + Math.sin(ang) * 0.3;
    if (w.kind !== 'flame') this.audio.play(w.sound, { volume: 0.55, pos: p.pos, rate: rand(0.95, 1.05) });
    if (w.kind === 'gun') {
      this.flashes.push({ x: mx, z: mz, life: 0.05 });
      // Precisão reduz a dispersão; Multitiro dá chance de um projétil extra; rajadas abrem o recuo (bloom)
      const spread = w.spread * (1 - this.pv(p, 'precision') / 100) + (w.bloom ? p.bloom : 0);
      if (w.bloom) p.bloom = Math.min(w.bloomMax, p.bloom + w.bloom);
      const extra = Math.random() < this.pv(p, 'multishot') / 100 ? 1 : 0;
      for (let k = 0; k < w.pellets + extra; k++) this.hitscan(p, mx, mz, ang + gauss() * spread + (k >= w.pellets ? rand(-0.06, 0.06) : 0), w);
      this.noiseShake(w.heavy ? 0.35 : w.pellets > 1 ? 0.25 : w.kick ? 0.12 : 0.06);
      // metralhadora pesada: o coice empurra o atirador para trás
      if (w.kick && !(p.exoT > 0)) {
        p.vel.x -= dx * w.kick;
        p.vel.z -= dz * w.kick;
      }
    } else if (w.kind === 'flame') {
      this.fireFlame(p, ang, w, mx, mz);
    } else if (w.kind === 'bolt') {
      this.flashes.push({ x: mx, z: mz, life: 0.06 });
      this.projectiles.push({ kind: 'bolt', x: mx, y: 1.0, z: mz, vx: dx * w.speed, vz: dz * w.speed, ang, t: 0, w, owner: p, hit: new Set(), pierced: 0 });
    } else if (w.kind === 'glob') {
      this.projectiles.push({ kind: 'glob', x: mx, y: 1.1, z: mz, vx: dx * 11, vy: 4.2, vz: dz * 11, t: 0, w, owner: p });
    } else if (w.kind === 'lob') {
      this.flashes.push({ x: mx, z: mz, life: 0.07 });
      this.projectiles.push({ kind: 'lobgren', x: mx, y: 1.05, z: mz, vx: dx * w.speed, vy: 5.2, vz: dz * w.speed, t: 0, w, owner: p, bounces: w.bounces });
      this.noiseShake(0.15);
    } else if (w.kind === 'throw') {
      const dyn = w.proj === 'dynamite';
      this.projectiles.push({ kind: w.proj || 'grenade', x: mx, y: 1.1, z: mz, vx: dx * (dyn ? 9.5 : 11), vy: dyn ? 5.5 : 5, vz: dz * (dyn ? 9.5 : 11), t: 0, fuse: w.fuse || 1.4, w, owner: p });
      if (dyn) this.audio.play('fuse', { volume: 0.5, pos: p.pos });
    } else if (w.kind === 'rocket') {
      // com o alvo travado pela mira, o foguete persegue o inimigo
      const homing = p.lockTarget?.alive ? p.lockTarget : null;
      this.projectiles.push({ kind: 'rocket', x: mx, y: 1.0, z: mz, vx: dx * w.speed, vy: 0, vz: dz * w.speed, t: 0, w, owner: p, homing });
      if (homing) this.audio.play('beep', { volume: 0.5, rate: 1.5 });
      this.flashes.push({ x: mx, z: mz, life: 0.08 });
    } else if (w.kind === 'place') {
      if (!this.place(p, w.place, ang)) {
        // sem espaço para colocar: devolve a munição e não conta como disparo
        p.ammo[p.weapon]++;
        this.stats.shots--;
        p.fireCd = 0.2;
      }
    }
    if (w.mag) {
      if (!(p.clip[p.weapon] > 0) && !this.startReload(p) && !this.usable(p, p.weapon)) this.cycleWeapon(p, -1);
    } else if (p.ammo[p.weapon] <= 0) this.cycleWeapon(p, -1);
  }

  // inimigo que a assistência de mira escolhe (teclado): o mais próximo num cone estreito à frente
  // celular: alvo do tiro automático (o mais próximo à vista, dentro do alcance da arma)
  touchTarget(p) {
    const w = WEAPONS[p.weapon];
    const range = Math.min(14, (w.range || 12) * (w.kind === 'flame' ? 1 : 0.9));
    let best = null;
    let bd = range;
    for (const z of this.zombies) {
      if (!z.alive) continue;
      const d = Math.hypot(z.pos.x - p.pos.x, z.pos.z - p.pos.z);
      if (d < bd && this.arena.los(p.pos.x, p.pos.z, z.pos.x, z.pos.z)) {
        bd = d;
        best = z;
      }
    }
    return best;
  }
  aimTarget(p) {
    const mode = this.settings.aimMode || 1; // 0=manual, 1=assistido, 2=automático
    let best = null;
    let bd = mode === 2 ? 25 : 15;
    const cone = mode === 0 ? 0.12 : mode === 1 ? 0.35 : Math.PI;
    for (const z of this.zombies) {
      if (!z.alive) continue;
      const dx = z.pos.x - p.pos.x;
      const dz = z.pos.z - p.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > bd) continue;
      const ang = Math.atan2(dx, dz);
      if (mode !== 2 && Math.abs(angDiff(p.aim, ang)) > cone) continue;
      if (!this.arena.los(p.pos.x, p.pos.z, z.pos.x, z.pos.z)) continue;
      if (d < bd) { bd = d; best = z; }
    }
    return best;
  }

  hitscan(p, mx, mz, ang, w) {
    const dx = Math.sin(ang);
    const dz = Math.cos(ang);
    // o raio sai do corpo (acerta quem está colado); o traçante sai do cano
    const ox = p.pos.x;
    const oz = p.pos.z;
    const wallT = this.arena.rayFree(ox, oz, dx, dz, w.range);
    if (this.mode === 'pvp') this.pvpCheckHit(p, ox, oz, dx, dz, wallT, w.dmg);
    const hits = [];
    for (const z of this.zombies) {
      if (!z.alive) continue;
      const t = rayCircle(ox, oz, dx, dz, z.pos.x, z.pos.z, z.radius + 0.08);
      if (t >= 0 && t < wallT) hits.push({ z, t });
    }
    for (const b of this.placeables) {
      if (b.kind !== 'barrel' || b.dead) continue;
      const t = rayCircle(ox, oz, dx, dz, b.x, b.z, 0.4);
      if (t >= 0 && t < wallT) hits.push({ b, t });
    }
    // caixas de madeira abrem com tiro
    for (const c of this.pickups) {
      if (c.type !== 'supply' || c.taken) continue;
      const t = rayCircle(ox, oz, dx, dz, c.x, c.z, 0.42);
      if (t >= 0 && t < wallT) hits.push({ c, t });
    }
    // objetos do cenário que levam tiro (caixas, postes, placas, barris, cones)
    for (const pr of this.arena.props) {
      if (pr.dead || !(pr.def.shoot || (pr.def.knock && !pr.knocked))) continue;
      const t = rayCircle(ox, oz, dx, dz, pr.x, pr.z, pr.def.shoot || 0.25);
      if (t >= 0 && t < wallT) hits.push({ pr, t });
    }
    hits.sort((a, b) => a.t - b.t);
    let endT = wallT;
    let pierced = 0;
    for (const h of hits) {
      if (h.b) {
        if (!h.b.owner) h.b.owner = p;
        this.damageBarrel(h.b, w.dmg);
        endT = h.t;
        break;
      }
      if (h.pr) {
        if (h.pr.dead) continue;
        if (h.pr.def.knock) {
          this.knockProp(h.pr, dx, dz, 5); // cone cai e o tiro segue
          continue;
        }
        this.damageProp(h.pr, w.dmg, p, dx, dz);
        endT = h.t;
        break;
      }
      if (h.c) {
        if (h.c.taken) continue;
        this.openSupply(h.c, p);
        endT = h.t;
        break;
      }
      let dmg = w.dmg;
      if (w.pellets > 1) dmg *= Math.max(0.4, 1 - h.t / w.range);
      this.damageZombie(h.z, dmg, dx, dz, p, w.knock ?? (w.pellets > 1 ? 2.2 : 0.8));
      this.weaponSpecial(p, h.z, w, dx, dz);
      endT = h.t;
      if (++pierced > (w.pierce || 0)) break;
    }
    if (endT === wallT && wallT < w.range) {
      for (let k = 0; k < 3; k++) this.parts.spawn(ox + dx * endT, 1, oz + dz * endT, rand(-2, 2), rand(1, 3), rand(-2, 2), 0.06, 0xffd27a, 0.25, 10, 2);
      // parede destrutível (bloco de madeira)
      const wallProp = this.arena.propAt(Math.floor(ox + dx * (wallT + 0.2)), Math.floor(oz + dz * (wallT + 0.2)));
      if (wallProp && wallProp.def.coll === 'tall') this.damageProp(wallProp, w.dmg, p, dx, dz);
    }
    if (endT > 0.8) this.tracers.push({ x1: mx, z1: mz, x2: ox + dx * endT, z2: oz + dz * endT, life: w.heavy ? 0.14 : 0.06, w: w.heavy ? 0.08 : 0.035, color: w.heavy ? 0xc8ffd0 : 0xffe08a });
  }

  weaponSpecial(p, z, w, dx = 0, dz = 0) {
    const s = w?.special;
    if (!s || !p || !z?.alive) return;
    p.egyptProc ||= {};
    const n = (p.egyptProc[w.id] = (p.egyptProc[w.id] || 0) + 1);
    if (s.every && n % s.every) return;
    p.egyptCd ||= {};
    if ((p.egyptCd[w.id] || 0) > this.time) return;
    p.egyptCd[w.id] = this.time + (s.cooldown || 8);
    const bossScale = z.def.boss ? 0.35 : 1;
    if (s.bonus) this.damageZombie(z, w.dmg * (s.bonus - 1), dx, dz, p, 0.2, true);
    if (s.stun) z.stunT = Math.max(z.stunT || 0, s.stun * bossScale);
    if (s.acid) this.applyStatus(z, 'acid', s.acid, p);
    if (s.poison) this.applyStatus(z, 'poison', s.poison, p);
    if (s.slow) this.applyStatus(z, 'ice', 24, p);
    if (s.armorBreak) z.armorBreakT = Math.max(z.armorBreakT || 0, 4); // fratura: reduz armadura
    if (s.mark) { z.markT = Math.max(z.markT || 0, s.mark.t || 4); z.markMul = Math.max(z.markMul || 1, s.mark.mul || 1.3); } // marca: mais dano recebido
    if (s.haste) { p.hasteT = Math.max(p.hasteT || 0, 4); p.hasteMul = Math.max(p.hasteMul || 1, s.haste); }
    if (s.area) this.spawnHazard('fire', z.pos.x, z.pos.z, s.area.radius || 2.5, s.area.life || 5, s.area.dps || 12, p);
    if (s.heal) {
      p.hp = Math.min(p.maxHp, p.hp + s.heal);
      this.parts.spawn(p.pos.x, 1.1, p.pos.z, 0, 1.8, 0, 0.12, 0x2ecc71, 0.55, 0, 2);
    }
    const colors = { royal: 0xd4a020, judgment: 0xe53935, swarm: 0x29b6f6, nile: 0x2ecc71, wrath: 0xffc107, venom: 0x8aff4a, shadow: 0xc070ff, curse: 0x8a3ad0, divine: 0x3fe0ff, resurrection: 0xeaeDEF };
    const c = colors[s.id] || 0xffc107;
    for (let i = 0; i < 6; i++) this.parts.spawn(z.pos.x + rand(-0.35, 0.35), 1.15, z.pos.z + rand(-0.35, 0.35), rand(-1, 1), rand(1, 2.5), rand(-1, 1), 0.09, c, 0.45, 5, 2);
    this.audio.play(s.id === 'judgment' ? 'eg_judgment' : s.id === 'nile' ? 'eg_river' : s.id === 'venom' ? 'eg_venom' : 'eg_magic', { volume: 0.28, pos: z.pos, rate: rand(0.9, 1.1) });
    this.ui.toast(p.id, s.name, 'bolt');
  }

  place(p, kind, ang) {
    const A = this.arena;
    const tx = p.pos.x + Math.sin(ang) * 1.2;
    const tz = p.pos.z + Math.cos(ang) * 1.2;
    const i = Math.floor(tx);
    const j = Math.floor(tz);
    if (!A.inb(i, j) || A.block[A.idx(i, j)] || A.dyn[A.idx(i, j)]) return false;
    if (this.placeables.some((b) => !b.dead && b.i === i && b.j === j)) return false;
    // local válido: nada sobre lava ou lago tóxico
    const ter = A.terrain[A.idx(i, j)];
    if (ter === 7 || ter === 14) return false;
    const x = i + 0.5;
    const z = j + 0.5;
    const T = TRAPS[kind] || {};
    if (!WALK_TRAPS.has(kind)) {
      for (const e of [...this.players.filter((q) => q.alive), ...this.zombies.filter((q) => q.alive)])
        if (Math.abs(e.pos.x - x) < 0.5 + e.radius && Math.abs(e.pos.z - z) < 0.5 + e.radius) return false;
      // 1 = bloqueio que a horda ataca (barricada, cerca, torres); 2 = barril
      A.dyn[A.idx(i, j)] = T.block ? 1 : 2;
      this.flowT = 0;
    }
    this.placeables.push({ kind, i, j, x, z, hp: T.hp || 14, maxHp: T.hp || 260, armT: 0.7, dead: false, owner: p, life: T.life, charges: T.charges, ang: p.aim, block: !!T.block });
    if (T.life) this.audio.play('generator', { volume: 0.4, pos: { x, z }, rate: 1.8 });
    return true;
  }

  // corpo a corpo: faca (padrão) ou machado (liberado no x15 ou achado em caixa)
  melee(p) {
    if (p.isMounted) return; // montado, o corpo a corpo é o ataque da montaria
    const m = MELEE[this.upg.axe ? 'axe' : 'knife'];
    const fast = p.energyT > 0 ? 0.7 : 1;
    p.meleeCd = m.rate * fast;
    p.meleeDur = m.anim * fast;
    p.meleeT = p.meleeDur;
    p.meleeKind = m.id;
    p.firingT = Math.max(p.firingT, 0.4);
    let ang = p.aim;
    // sem mouse: vira para o inimigo mais próximo à frente
    if ((!p.ctl.mouse || this.input.mouseIdle) && !(p.ctl.mouse && this.input.touchAim)) {
      let bd = m.range + 1.6;
      for (const z of this.zombies) {
        if (!z.alive) continue;
        const d = Math.hypot(z.pos.x - p.pos.x, z.pos.z - p.pos.z);
        const a = Math.atan2(z.pos.x - p.pos.x, z.pos.z - p.pos.z);
        if (d < bd && Math.abs(angDiff(p.aim, a)) < 1.3) {
          bd = d;
          ang = a;
        }
      }
    }
    p.facing = ang;
    p.aim = ang;
    this.audio.play('swing', { volume: 0.5, pos: p.pos, rate: m.id === 'axe' ? 0.75 : 1.3 });
    this.later(p.meleeDur * 0.42, () => this.meleeHit(p, m, ang));
  }
  meleeHit(p, m, ang) {
    if (!p.alive || this.state !== 'playing') return;
    const list = [];
    for (const z of this.zombies) {
      if (!z.alive) continue;
      const dx = z.pos.x - p.pos.x;
      const dz = z.pos.z - p.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > m.range + z.radius) continue;
      if (Math.abs(angDiff(ang, Math.atan2(dx, dz))) > m.arc / 2 && d > z.radius + 0.35) continue;
      list.push({ z, d });
    }
    list.sort((a, b) => a.d - b.d);
    const n = Math.min(m.max, list.length);
    for (let k = 0; k < n; k++) {
      const { z, d } = list[k];
      this.damageZombie(z, m.dmg * (p.exoT > 0 ? 1.6 : 1), (z.pos.x - p.pos.x) / (d || 1), (z.pos.z - p.pos.z) / (d || 1), p, m.knock * (p.exoT > 0 ? 1.5 : 1));
    }
    // lâmina quebra objetos do cenário à frente
    for (const pr of this.arena.props) {
      if (pr.dead || !pr.def.hp || pr.def.boomOnly) continue;
      const d = Math.hypot(pr.x - p.pos.x, pr.z - p.pos.z);
      if (d < m.range + 0.5 && Math.abs(angDiff(ang, Math.atan2(pr.x - p.pos.x, pr.z - p.pos.z))) < m.arc / 2 + 0.3) this.damageProp(pr, m.dmg, p, (pr.x - p.pos.x) / (d || 1), (pr.z - p.pos.z) / (d || 1));
    }
    // lâmina também abre caixas de madeira
    for (const c of this.pickups) {
      if (c.type !== 'supply' || c.taken) continue;
      const d = Math.hypot(c.x - p.pos.x, c.z - p.pos.z);
      if (d < m.range + 0.4 && Math.abs(angDiff(ang, Math.atan2(c.x - p.pos.x, c.z - p.pos.z))) < m.arc / 2 + 0.3) this.openSupply(c, p);
    }
    const fx = p.pos.x + Math.sin(ang) * m.range * 0.7;
    const fz = p.pos.z + Math.cos(ang) * m.range * 0.7;
    for (let k = 0; k < (m.id === 'axe' ? 8 : 4); k++) this.parts.spawn(fx, 0.9, fz, Math.sin(ang + rand(-0.8, 0.8)) * rand(2, 4), rand(0.5, 2), Math.cos(ang + rand(-0.8, 0.8)) * rand(2, 4), 0.05, 0xf0f4ff, 0.18, 0, 2);
    if (n) {
      this.audio.play('melee_hit', { volume: 0.7, pos: p.pos, rate: m.id === 'axe' ? 0.8 : 1.2 });
      this.noiseShake(m.shake);
    }
  }

  // ------------------------------------------------------------------ dano
  // quiet: dano contínuo (fogo, ácido, laser) sem som de impacto nem jorro de sangue
  // Faraó Renegado: fases por vida, ondas de energia, explosões no chão, múmias e tempestade de areia
  // fases dos chefões por vida restante (66% e 33%): aviso, invulnerabilidade curta e explosão de partículas
  bossPhase(z, dt, labels, colors, speedUp) {
    z.invulT = Math.max(0, (z.invulT || 0) - dt);
    const ph = z.hp > z.maxHp * 0.66 ? 1 : z.hp > z.maxHp * 0.33 ? 2 : 3;
    if (ph > (z.phase || 1)) {
      z.phase = ph;
      z.invulT = 1.2;
      this.ui.banner(labels[ph - 2], 'bad');
      this.audio.play('boss_roar', { volume: 1, priority: true, rate: ph === 3 ? 0.8 : 0.9 });
      this.noiseShake(1.3);
      for (let k = 0; k < 48; k++) {
        const a = (k / 48) * Math.PI * 2;
        this.parts.spawn(z.pos.x, 1.5, z.pos.z, Math.sin(a) * 9, rand(1, 4), Math.cos(a) * 9, rand(0.12, 0.25), pick(colors[ph - 2]), 0.8, 4, 2);
      }
      if (ph === 3) z.speed *= speedUp;
      z.callCd = 0.6;
      z.stormCd = 1.5;
    }
    return z.phase || 1;
  }
  // invoca filhotes ao redor do chefão, em pontos livres
  bossCall(z, types) {
    for (const t of types) {
      if (this.countAlive() >= this.aliveCap()) break;
      for (let tries = 0; tries < 8; tries++) {
        const a = rand(0, 6.28);
        const x = z.pos.x + Math.sin(a) * (z.radius + 1.4);
        const zz = z.pos.z + Math.cos(a) * (z.radius + 1.4);
        if (this.arena.circleBlocked(x, zz, 0.35)) continue;
        this.spawnZombie(t, x, zz);
        break;
      }
    }
    this.audio.play('roar', { pos: z.pos, volume: 0.8, rate: 1.4 });
  }
  pharaohTick(z, td, dt) {
    const phase = this.bossPhase(z, dt, ['FARAÓ: INVOCAÇÃO DAS TROPAS!', 'FARAÓ: PODER TOTAL DA CORRUPÇÃO!'], [[0xffd040, 0xe0c080], [0xc070ff, 0xff2a1a]], 1.3);
    // ondas de energia: anel de projéteis dourados
    z.waveCd = (z.waveCd ?? 4) - dt;
    if (z.waveCd <= 0 && td < 18) {
      z.waveCd = phase === 3 ? 3 : 5;
      const n = phase === 3 ? 16 : 10;
      const off = rand(0, 6.28);
      for (let k = 0; k < n; k++) {
        const a = off + (k / n) * Math.PI * 2;
        this.projectiles.push({ kind: 'acid', x: z.pos.x + Math.sin(a), y: 1.4, z: z.pos.z + Math.cos(a), vx: Math.sin(a) * 9, vy: 4, vz: Math.cos(a) * 9, t: 0, dmg: 14, color: phase === 3 ? 0xc070ff : 0xffd040, splat: '#c8a020' });
      }
      this.audio.play('eg_magic', { pos: z.pos, volume: 1, rate: 0.6 });
    }
    // explosões no chão: marca dourada e explosão 1 s depois (dá para sair)
    z.blastCd = (z.blastCd ?? 6) - dt;
    if (z.blastCd <= 0) {
      z.blastCd = phase === 3 ? 4 : 7;
      for (const p of this.players) {
        if (!p.alive) continue;
        for (let k = 0; k < phase + 1; k++) {
          const x = p.pos.x + rand(-2.5, 2.5);
          const zz = p.pos.z + rand(-2.5, 2.5);
          for (let j = 0; j < 14; j++) {
            const a = (j / 14) * Math.PI * 2;
            this.parts.spawn(x + Math.sin(a) * 1.8, 0.1, zz + Math.cos(a) * 1.8, 0, rand(0.5, 1.2), 0, 0.12, 0xffd040, 1, -0.4, 2);
          }
          this.later(1, () => this.explosion(x, zz, 2, 22, null));
        }
      }
    }
    // fase 2+: invoca múmias
    if (phase >= 2) {
      z.callCd = (z.callCd ?? 3) - dt;
      if (z.callCd <= 0 && this.countAlive() < this.aliveCap()) {
        z.callCd = phase === 3 ? 7 : 10;
        this.bossCall(z, phase === 3 ? ['mummy', 'mummy', 'mummy', 'scarab'] : ['mummy', 'mummy', 'mummy']);
      }
      // tempestade de areia: todos ficam lentos e levam dano aos poucos
      z.stormCd = (z.stormCd ?? 8) - dt;
      if (z.stormCd <= 0) {
        z.stormCd = phase === 3 ? 12 : 16;
        this.sandStormT = 5;
        this.ui.banner('TEMPESTADE DE AREIA!', 'bad');
        this.audio.play('eg_sand', { volume: 0.9, priority: true });
      }
    }
    if (this.sandStormT > 0) {
      this.sandStormT -= dt;
      for (const p of this.players) {
        if (!p.alive) continue;
        p.slowT = Math.max(p.slowT || 0, 0.3);
        p.slowMul = 0.7;
        p.sandAcc = (p.sandAcc || 0) + dt;
        if (p.sandAcc >= 0.5) {
          p.sandAcc = 0;
          this.damagePlayer(p, 1.5, p.pos.x, p.pos.z, 0, true);
        }
        for (let k = 0; k < 6; k++) this.parts.spawn(p.pos.x + rand(-9, 9), rand(0.3, 3), p.pos.z + rand(-7, 7), rand(5, 9), rand(-0.3, 0.3), rand(-1, 1), rand(0.06, 0.14), pick([0xe0c080, 0xc8a060, 0xd4a020]), 0.8, 0, 0);
      }
    }
  }

  // Sobek, o Devorador: investidas mais frequentes, giro com a cauda, filhotes e fúria
  // devolve true enquanto prepara o giro (ele fica parado e não faz outra coisa)
  sobekTick(z, td, dt) {
    const phase = this.bossPhase(z, dt, ['SOBEK: INVESTIDAS E INVOCAÇÕES!', 'SOBEK: FÚRIA DO DEVORADOR!'], [[0x4a7a3a, 0xd4a020], [0xff2a1a, 0x4a7a3a]], 1.35);
    // fúria: ataca mais rápido
    if (phase === 3) z.attackCd -= dt * 0.6;
    // a partir da fase 2 investe com mais frequência
    if (phase >= 2 && z.state === 'move') z.chargeCd = Math.min(z.chargeCd, phase === 3 ? 2.5 : 3.5);
    // giro com a cauda: anuncia (0,7 s parado, anel verde no chão) e acerta tudo ao redor
    z.tailCd = (z.tailCd ?? 5) - dt;
    if (z.state === 'move' && z.tailCd <= 0 && td < 4.5) {
      z.state = 'tail';
      z.stateT = 0.7;
      this.audio.play('roar', { pos: z.pos, volume: 0.9, rate: 0.7 });
    }
    if (z.state === 'tail') {
      for (let k = 0; k < 3; k++) {
        const a = rand(0, 6.28);
        this.parts.spawn(z.pos.x + Math.sin(a) * 4.2, 0.1, z.pos.z + Math.cos(a) * 4.2, 0, rand(0.5, 1), 0, 0.12, 0x6ac040, 0.5, -0.5, 2);
      }
      z.facing += dt * 10 * (z.stateT < 0.25 ? 3 : 0.4);
      if ((z.stateT -= dt) <= 0) {
        z.state = 'move';
        z.tailCd = phase === 3 ? 3.5 : 5.5;
        for (const p of this.players) {
          const d = Math.hypot(p.pos.x - z.pos.x, p.pos.z - z.pos.z);
          if (p.alive && d < 4.2) this.damagePlayer(p, 30, z.pos.x, z.pos.z, 10, true);
        }
        for (let k = 0; k < 32; k++) {
          const a = (k / 32) * Math.PI * 2;
          this.parts.spawn(z.pos.x + Math.sin(a) * 1.5, 0.4, z.pos.z + Math.cos(a) * 1.5, Math.sin(a) * 8, rand(1, 2), Math.cos(a) * 8, rand(0.12, 0.22), pick([0x4a7a3a, 0x6ac040, 0xd4a020]), 0.5, 8, 0);
        }
        this.audio.play('swing', { pos: z.pos, volume: 1, rate: 0.5 });
        this.noiseShake(0.8);
      }
      return true;
    }
    // fase 2+: crocodilos menores
    if (phase >= 2) {
      z.callCd = (z.callCd ?? 3) - dt;
      if (z.callCd <= 0) {
        z.callCd = phase === 3 ? 8 : 11;
        this.bossCall(z, phase === 3 ? ['crocling', 'crocling', 'crocling', 'crocling'] : ['crocling', 'crocling', 'crocling']);
      }
    }
    return false;
  }

  // Bastet Sombria: teletransporte, leque de projéteis mágicos, clones (fase 2) e tempestade de energia (fase 3)
  bastetTick(z, tgt, td, dt) {
    const A = this.arena;
    const phase = this.bossPhase(z, dt, ['BASTET: CLONES E ILUSÕES!', 'BASTET: TEMPESTADE DE ENERGIA SOMBRIA!'], [[0xc070ff, 0x1a1a22], [0xc070ff, 0xffd040]], 1.2);
    const fx = (x, zz) => {
      for (let k = 0; k < 18; k++) this.parts.spawn(x + rand(-0.6, 0.6), rand(0.4, 3), zz + rand(-0.6, 0.6), rand(-2, 2), rand(0, 2), rand(-2, 2), rand(0.08, 0.16), pick([0xc070ff, 0x8a3ad0, 0x1a1a22]), 0.6, -1, 2);
    };
    // teletransporte: some e reaparece a 5–7 m do alvo, num ponto livre
    z.tpCd = (z.tpCd ?? 5) - dt;
    if (z.tpCd <= 0 && z.state === 'move') {
      z.tpCd = phase === 3 ? 3.5 : phase === 2 ? 4.5 : 6;
      for (let tries = 0; tries < 10; tries++) {
        const a = rand(0, 6.28);
        const d = rand(5, 7);
        const x = tgt.pos.x + Math.sin(a) * d;
        const zz = tgt.pos.z + Math.cos(a) * d;
        if (!A.inb(Math.floor(x), Math.floor(zz)) || A.circleBlocked(x, zz, z.radius)) continue;
        fx(z.pos.x, z.pos.z);
        z.pos.x = x;
        z.pos.z = zz;
        z.facing = Math.atan2(tgt.pos.x - x, tgt.pos.z - zz);
        fx(x, zz);
        this.audio.play('swing', { pos: z.pos, volume: 0.8, rate: 0.5 });
        z.boltCd = Math.min(z.boltCd ?? 1, 0.5); // ataca logo depois de aparecer
        break;
      }
    }
    // leque de projéteis mágicos roxos
    z.boltCd = (z.boltCd ?? 2) - dt;
    if (z.boltCd <= 0 && td < 14) {
      z.boltCd = phase === 3 ? 2 : 3;
      const n = phase === 1 ? 3 : 5;
      const base = Math.atan2(tgt.pos.x - z.pos.x, tgt.pos.z - z.pos.z);
      const T = Math.max(0.3, td / 14);
      for (let k = 0; k < n; k++) {
        const a = base + (k - (n - 1) / 2) * 0.22;
        this.projectiles.push({ kind: 'acid', x: z.pos.x + Math.sin(a), y: 1.6, z: z.pos.z + Math.cos(a), vx: Math.sin(a) * (td / T), vy: 7 * T - 0.4 / T, vz: Math.cos(a) * (td / T), t: 0, dmg: 12, color: 0xc070ff, splat: '#7a2ab0' });
      }
      z.attackT = 0.35;
      this.audio.play('eg_magic', { pos: z.pos, volume: 0.9, rate: 0.8 });
    }
    // fase 2+: clones ilusórios
    if (phase >= 2) {
      z.callCd = (z.callCd ?? 3) - dt;
      const clones = this.zombies.filter((q) => q.alive && q.type === 'bastetclone').length;
      if (z.callCd <= 0 && clones < 4) {
        z.callCd = phase === 3 ? 9 : 12;
        this.bossCall(z, phase === 3 ? ['bastetclone', 'bastetclone', 'bastetclone'] : ['bastetclone', 'bastetclone']);
      }
    }
    // fase 3: tempestade de energia sombria — explosões roxas anunciadas ao redor de cada jogador
    if (phase === 3) {
      z.blastCd = (z.blastCd ?? 2) - dt;
      if (z.blastCd <= 0) {
        z.blastCd = 3.5;
        for (const p of this.players) {
          if (!p.alive) continue;
          for (let k = 0; k < 3; k++) {
            const x = p.pos.x + rand(-3, 3);
            const zz = p.pos.z + rand(-3, 3);
            for (let j = 0; j < 14; j++) {
              const a = (j / 14) * Math.PI * 2;
              this.parts.spawn(x + Math.sin(a) * 1.8, 0.1, zz + Math.cos(a) * 1.8, 0, rand(0.5, 1.2), 0, 0.12, 0xc070ff, 1, -0.4, 2);
            }
            this.later(1, () => this.explosion(x, zz, 2, 20, null));
          }
        }
      }
    }
  }

  // A Esfinge Eterna: pedras caindo e construtos (fase 2+), raio de energia anunciado (fase 3)
  // devolve true enquanto carrega o raio (fica parada)
  sphinxTick(z, tgt, td, dt) {
    const phase = this.bossPhase(z, dt, ['ESFINGE: A FÚRIA DO DESERTO!', 'ESFINGE: DESPERTAR COMPLETO!'], [[0xd8b070, 0xd4a020], [0xff2a1a, 0x3fe0ff]], 1.25);
    // fase 2+: desmoronamento — pedras marcadas no chão caem 1,2 s depois
    if (phase >= 2) {
      z.rockCd = (z.rockCd ?? 2) - dt;
      if (z.rockCd <= 0) {
        z.rockCd = phase === 3 ? 3 : 4.5;
        for (const p of this.players) {
          if (!p.alive) continue;
          for (let k = 0; k < phase + 2; k++) {
            const x = p.pos.x + rand(-4, 4);
            const zz = p.pos.z + rand(-4, 4);
            for (let j = 0; j < 12; j++) {
              const a = (j / 12) * Math.PI * 2;
              this.parts.spawn(x + Math.sin(a) * 1.4, 0.1, zz + Math.cos(a) * 1.4, 0, rand(0.4, 1), 0, 0.12, 0xb08a40, 1.1, -0.3, 2);
            }
            this.later(1.2, () => {
              for (let j = 0; j < 14; j++) this.parts.spawn(x + rand(-0.6, 0.6), rand(0.2, 1.5), zz + rand(-0.6, 0.6), rand(-3, 3), rand(2, 5), rand(-3, 3), rand(0.15, 0.3), pick([0x8a7a5a, 0xc8b080, 0x6a5e52]), 1.2, 18, 0);
              for (const q of this.players) if (q.alive && Math.hypot(q.pos.x - x, q.pos.z - zz) < 1.5) this.damagePlayer(q, 18, x, zz, 3, true);
              this.audio.play('eg_rumble', { pos: { x, z: zz }, volume: 0.6, rate: 1.2 });
            });
          }
        }
        this.noiseShake(0.4);
      }
      // construtos de areia
      z.callCd = (z.callCd ?? 4) - dt;
      const cs = this.zombies.filter((q) => q.alive && q.type === 'construct').length;
      if (z.callCd <= 0 && cs < 3) {
        z.callCd = phase === 3 ? 12 : 16;
        this.bossCall(z, phase === 3 ? ['construct', 'construct'] : ['construct']);
      }
    }
    // fase 3: raio de energia em linha reta, anunciado por 1 s
    if (phase === 3) {
      z.beamCd = (z.beamCd ?? 2) - dt;
      if (z.beamCd <= 0 && z.state === 'move' && td < 18) {
        z.state = 'beam';
        z.stateT = 1;
        z.beamDir = Math.atan2(tgt.pos.x - z.pos.x, tgt.pos.z - z.pos.z);
        z.facing = z.beamDir;
        this.audio.play('eg_beam', { pos: z.pos, volume: 1, priority: true });
      }
    }
    if (z.state === 'beam') {
      const sx = Math.sin(z.beamDir);
      const sz = Math.cos(z.beamDir);
      z.facing = z.beamDir;
      if (Math.random() < dt * 30) {
        const d = rand(1.5, 18);
        this.parts.spawn(z.pos.x + sx * d, 0.12, z.pos.z + sz * d, 0, rand(0.3, 0.8), 0, 0.1, 0xff3a1a, 0.4, -0.3, 2);
      }
      if ((z.stateT -= dt) <= 0) {
        z.state = 'move';
        z.beamCd = 5;
        for (let d = 1.5; d < 18; d += 0.6) this.parts.spawn(z.pos.x + sx * d, 1.4, z.pos.z + sz * d, rand(-0.5, 0.5), rand(0, 1), rand(-0.5, 0.5), rand(0.15, 0.25), pick([0x3fe0ff, 0xffffff, 0xffd040]), 0.4, 0, 2);
        for (const p of this.players) {
          if (!p.alive) continue;
          const rx = p.pos.x - z.pos.x;
          const rz = p.pos.z - z.pos.z;
          const along = rx * sx + rz * sz;
          const side = Math.abs(rx * sz - rz * sx);
          if (along > 0 && along < 18 && side < 1.1) this.damagePlayer(p, 32, z.pos.x, z.pos.z, 8, true);
        }
        this.noiseShake(1);
        this.audio.play('hit_armor', { pos: z.pos, volume: 1, rate: 0.4 });
      }
      return true;
    }
    return false;
  }

  // onda de choque no chão: fere quem está no raio (além do alvo do golpe)
  quake(z, q) {
    for (let k = 0; k < 22; k++) {
      const a = (k / 22) * Math.PI * 2;
      this.parts.spawn(z.pos.x + Math.sin(a) * 0.6, 0.15, z.pos.z + Math.cos(a) * 0.6, Math.sin(a) * q.radius * 2.2, rand(0.5, 1.5), Math.cos(a) * q.radius * 2.2, rand(0.1, 0.18), pick([0xe0c080, 0xb08a40]), 0.5, 10, 0);
    }
    this.noiseShake(0.35);
    this.audio.play('stomp', { volume: 0.7, pos: z.pos });
    for (const p of this.players) if (p.alive && Math.hypot(p.pos.x - z.pos.x, p.pos.z - z.pos.z) < q.radius) {
      this.damagePlayer(p, q.dmg, z.pos.x, z.pos.z, 4, true);
      if (q.stun && !(p.exoT > 0)) {
        p.stunT = Math.max(p.stunT || 0, q.stun);
        for (let k = 0; k < 6; k++) this.parts.spawn(p.pos.x + rand(-0.3, 0.3), 1.9, p.pos.z + rand(-0.3, 0.3), rand(-1.5, 1.5), rand(0.5, 1.5), rand(-1.5, 1.5), 0.08, 0xffd040, 0.5, 0, 2);
      }
    }
  }
  damageZombie(z, dmg, dx, dz, src, knock = 0.8, quiet = false) {
    if (!z.alive) return;
    if (z.invulT > 0) {
      // troca de fase do chefão: não leva dano
      if (Math.random() < 0.4) this.parts.spawn(z.pos.x, 1.6 * z.scale, z.pos.z, rand(-2, 2), rand(1, 3), rand(-2, 2), 0.1, 0xffd040, 0.3, 6, 2);
      return;
    }
    // Esqueleto de Faraó: às vezes desvia do golpe com um passo lateral
    if (z.def.dodge && src && !quiet && this.time >= (z.dodgeAt || 0) && Math.random() < z.def.dodge.chance) {
      z.dodgeAt = this.time + z.def.dodge.cd;
      const sd = Math.random() < 0.5 ? 1 : -1;
      this.arena.move(z.pos, -dz * sd * 1.2, dx * sd * 1.2, z.radius);
      for (let k = 0; k < 6; k++) this.parts.spawn(z.pos.x, rand(0.4, 1.4), z.pos.z, rand(-1, 1), rand(0.5, 1.5), rand(-1, 1), 0.06, 0xe8e0c8, 0.3, 0, 2);
      this.audio.play('swing', { pos: z.pos, volume: 0.4, rate: 1.4 });
      return;
    }
    // passivas de quem causou o dano: Dano aumentado, Fúria total e Crítico
    if (src && src.ctl) {
      dmg *= this.dmgMul(src);
      if (Math.random() < this.pv(src, 'crit') / 100 + (src.navalTempest ? 0.08 : 0) + (src.necroTempest ? 0.06 : 0)) {
        dmg *= 2;
        for (let k = 0; k < 5; k++) this.parts.spawn(z.pos.x, 1.4 * z.scale, z.pos.z, rand(-2, 2), rand(2, 4), rand(-2, 2), 0.08, pick([0xffe040, 0xffffff]), 0.4, 6, 2);
      }
      if (!quiet) this.navalHit(z, src, dx, dz, dmg);
      if (src.navalTempest) dmg *= 1.15;
      if (src.necroTempest) { dmg *= 1.12; if (!quiet && Math.random() < 0.25) { src.hp = Math.min(src.maxHp, src.hp + 2); } }
      if (WEAPONS[src.weapon]?.undeadMul && UNDEAD_TYPES.has(z.type)) dmg *= WEAPONS[src.weapon].undeadMul;
    }
    const hy = z.def.fly ? (z.flyY || 1.4) + 0.2 : 0.9 * z.scale;
    // Guardião Anúbis protege aliados próximos (não a si mesmo)
    if (!z.def.aura) {
      const gd = this.zombies.find((q) => q.alive && q.def.aura?.mul && q !== z && Math.hypot(q.pos.x - z.pos.x, q.pos.z - z.pos.z) < q.def.aura.radius);
      if (gd) {
        dmg *= gd.def.aura.mul;
        if (Math.random() < 0.5) this.parts.spawn(z.pos.x, hy, z.pos.z, rand(-1, 1), rand(1, 2), rand(-1, 1), 0.07, pick([0xf0c840, 0x4a8aff]), 0.35, 0, 2);
      }
    }
    // blindagem do Operário Mutante: tiros e lâminas perdem parte do dano
    // EMP desliga a blindagem; ácido corrói metade dela
    if (z.def.plating && src && !(z.empT > 0)) dmg *= z.corrodeT > 0 ? (1 + z.def.plating) / 2 : z.def.plating;
    // escudo do Blindado: tiro que chega pela frente perde quase todo o dano
    if (z.def.shield && !quiet && dx * Math.sin(z.facing) + dz * Math.cos(z.facing) < -0.45) {
      dmg *= z.corrodeT > 0 ? 0.6 : z.def.shield; // ácido derrete o escudo
      knock *= 0.2;
      for (let k = 0; k < 3; k++) this.parts.spawn(z.pos.x - dx * 0.6, 0.9, z.pos.z - dz * 0.6, -dx * rand(1, 3) + rand(-2, 2), rand(1, 3), -dz * rand(1, 3) + rand(-2, 2), 0.06, 0xffd27a, 0.25, 10, 2);
      this.audio.play('hit_armor', { volume: 0.35, pos: z.pos, rate: rand(0.9, 1.2) });
    } else if (!quiet) this.audio.play('hit_flesh', { volume: 0.35, pos: z.pos, rate: rand(0.9, 1.15) });
    z.hp -= dmg;
    z.hurtT = 0.08;
    if (src && src.ctl) src.hitT = 0.14; // marcador de acerto na mira
    const kb = z.def.static ? 0 : z.def.boss ? 0.1 : 1; // Portal das Almas não sai do lugar
    z.kx += dx * knock * kb;
    z.kz += dz * knock * kb;
    const n = quiet ? (Math.random() < 0.3 ? 1 : 0) : Math.min(8, 2 + Math.floor(dmg / 8));
    const blood = z.def.blood || BLOOD;
    const bk = z.def.blood ? 0 : 1;
    for (let k = 0; k < n; k++) this.parts.spawn(z.pos.x, hy, z.pos.z, dx * rand(1, 4) + rand(-1.5, 1.5), rand(1, 4), dz * rand(1, 4) + rand(-1.5, 1.5), rand(0.07, 0.14), pick(blood), 1.2, 16, bk);
    if (z.hp <= 0) this.killZombie(z, dx, dz, src);
  }

  killZombie(z, dx, dz, src) {
    z.alive = false;
    this.dropCoins(z);
    z.deadT = 0;
    z.fallDir = Math.atan2(dx, dz);
    this.corpses.push(z);
    if (this.corpses.length > 45) this.corpses.shift();
    const A = this.arena;
    const blood = z.def.blood || BLOOD;
    const hy = z.def.fly ? z.flyY || 1.4 : 0.8 * z.scale;
    if (z.def.blood) A.splat(z.pos.x + dx * 0.5, z.pos.z + dz * 0.5, 0.45 * z.scale + rand(0, 0.3), '#' + blood[0].toString(16).padStart(6, '0'));
    else A.splat(z.pos.x + dx * 0.5, z.pos.z + dz * 0.5, 0.45 * z.scale + rand(0, 0.3));
    for (let k = 0; k < 14; k++) this.parts.spawn(z.pos.x, hy, z.pos.z, dx * rand(1, 5) + rand(-2.5, 2.5), rand(2, 6), dz * rand(1, 5) + rand(-2.5, 2.5), rand(0.08, 0.18), pick(blood), 1.5, 18, z.def.blood ? 0 : 1);
    for (let k = 0; k < 4; k++) this.parts.spawn(z.pos.x, 1 * z.scale, z.pos.z, rand(-3, 3), rand(3, 6), rand(-3, 3), rand(0.12, 0.2), pick([z.look.skin, z.look.shirt]), rand(1.5, 2.5), 18, 0);
    this.audio.play(z.def.boss ? 'boss_roar' : z.def.sfx?.die || 'zombie_die', { volume: z.def.boss ? 1 : 0.5, pos: z.pos, rate: rand(0.85, 1.15), priority: z.def.boss });
    // elites do Egito podem deixar um item
    if (z.def.loot && !this.demo && Math.random() < z.def.loot * (this.diff?.mul.resources || 1)) this.spawnPickup(this.rollField(), z.pos.x, z.pos.z, { x: z.pos.x, z: z.pos.z });
    if (src && src.ctl) src.killT = 0.25; // marcador vermelho de abate na mira
    // XP: quem matou ganha tudo; o parceiro ganha metade
    if (src && src.ctl) for (const q of this.players) this.gainXp(q, q === src ? z.def.score : Math.round(z.def.score / 2));
    if (!this.demo) {
      this.stats.kills++;
      if (src && src.kills !== undefined) src.kills++;
      this.stats.score += z.def.score * this.mult * (this.event === 'trial' ? 2 : 1);
      if (this.event === 'trial') this.trialKills++;
      this.addMeter(z.def.boss ? 3 : 1);
    }
    // congelado estilhaça em cubos de gelo
    if (z.frozenT > 0) {
      for (let k = 0; k < 16; k++) this.parts.spawn(z.pos.x, rand(0.3, 1.6) * z.scale, z.pos.z, rand(-4, 4), rand(2, 5), rand(-4, 4), rand(0.08, 0.18), pick([0xc8f0ff, 0x8ad8ff, 0xffffff]), 0.9, 18, 2);
      this.audio.play('glass', { volume: 0.5, pos: z.pos });
    }
    if (z.def.explode || z.def.deathBurst) {
      const e = z.def.explode || z.def.deathBurst;
      this.later(0.08, () => this.explosion(z.pos.x, z.pos.z, e.radius, e.dmg, null));
    }
    if (z.def.spore) this.addCloud(z.pos.x, z.pos.z, z.def.spore);
    if (z.def.summon) for (let k = 0; k < 16; k++) this.parts.spawn(z.pos.x, 1, z.pos.z, rand(-3, 3), rand(1, 4), rand(-3, 3), rand(0.1, 0.2), pick([0xc070ff, 0x8a3ad0]), 0.8, 2, 2);
    if (z.def.boss) {
      this.boss = null;
      this.sandStormT = 0;
      this.audio.setMusic('combat');
      this.ui.banner(`${z.def.name.toUpperCase()} DERROTADO!`, 'gold');
      if (z.def.treasure && !this.demo) {
        // Tesouro do Templo: pontos extras e suprimentos a mais
        this.stats.score += z.def.treasure;
        this.later(1.2, () => this.ui.banner(`TESOURO DO TEMPLO +${z.def.treasure}`, 'gold'));
        for (let k = 0; k < 2; k++) this.spawnPickup(this.rollField(), z.pos.x + rand(-2, 2), z.pos.z + rand(-2, 2), { x: z.pos.x, z: z.pos.z });
        for (let k = 0; k < 24; k++) this.parts.spawn(z.pos.x, 1.5, z.pos.z, rand(-4, 4), rand(3, 7), rand(-4, 4), rand(0.08, 0.16), pick([0xffd040, 0xf0c840, 0xffffff]), 1.2, 14, 2);
        this.audio.play('coin', { volume: 0.9, priority: true });
      }
      platform.happytime();
      this.noiseShake(1);
      // o Colosso deixa uma caixa de madeira e um kit médico
      for (const type of ['supply', 'medkit']) {
        for (let n = 0; n < 8; n++) {
          if (this.spawnPickup(type, z.pos.x + rand(-1.5, 1.5), z.pos.z + rand(-1.5, 1.5))) break;
        }
      }
    }
  }

  // special: explosões, ácido, nuvens, pedras, pancada, investida e botes (o capacete reduz)
  damagePlayer(p, dmg, fx, fz, knock = 0, special = false) {
    if (!p.alive || this.debugGod) return;
    // montaria PvP recebe dano primeiro (vida independente; ao destruir, não volta na mesma partida)
    if (this.mode === 'pvp' && p.isMounted && p.pvpMount?.alive) {
      const pm = p.pvpMount;
      pm.hp -= dmg;
      pm.hurtT = 0.16;
      p.mountHp = Math.max(0, pm.hp);
      if (pm.hp <= 0) {
        pm.hp = 0;
        pm.alive = false;
        pm.destroyed = true;
        p.isMounted = false;
        p.weapon = 'pistol';
        for (let k = 0; k < 14; k++) this.parts.spawn(p.pos.x + rand(-0.6, 0.6), rand(0.4, 1.4), p.pos.z + rand(-0.6, 0.6), rand(-4, 4), rand(2, 5), rand(-4, 4), 0.16, pick([0xff7a1a, 0xffc107, 0x2e3440]), 0.6, 12, 1);
        this.audio.play('boom', { volume: 0.75, priority: true });
        this.noiseShake(0.35);
        this.ui.alert(`${pm.spec.name} destruída! Continue o combate a pé.`, 'danger', 'warning');
        return;
      }
      this.audio.play('hit_armor', { volume: 0.55, priority: true });
      this.noiseShake(0.14);
      return;
    }
    // montaria recebe dano primeiro (instância da partida, sem mutar MOUNTS)
    if (p.isMounted && this.worldMount && this.worldMount.rider === p) {
      const wm = this.worldMount;
      wm.hp -= dmg;
      wm.hurtT = 0.14;
      p.mountHp = Math.max(0, wm.hp);
      if (wm.hp <= 0) {
        const overflow = Math.max(0, -wm.hp);
        // montaria destruída: desmonta o jogador e aplica eventual dano excedente
        this.dismount(p, true);
        if (overflow > 0) {
          p.hp -= overflow;
          p.hurtT = 0.15;
          if (dmg > 0) this.pad.rumble(this.players.indexOf(p), Math.min(1, 0.35 + dmg / 30), 140);
          if (dmg > 0) {
            for (let k = 0; k < 5; k++) this.parts.spawn(p.pos.x, 1, p.pos.z, rand(-2, 2), rand(1, 3), rand(-2, 2), 0.1, pick(BLOOD), 1, 16, 1);
            this.audio.play('hurt', { volume: 0.7, priority: true });
          }
          this.noiseShake(0.2);
          this.ui.playerHurt(p.id);
          if (p.hp <= 0) {
            p.hp = 0;
            p.alive = false;
            p.deadT = 0;
            p.armor = 0;
            p.helmet = false;
            p.pack = false;
            p.boots = false;
            p.exoT = 0;
            p.reloadT = 0;
            p.energyT = 0;
            p.meleeT = 0;
            this.arena.splat(p.pos.x, p.pos.z, 0.8);
            this.audio.play('zombie_die', { rate: 1.5, volume: 0.7, priority: true });
            if (this.players.some((q) => q.alive)) this.ui.banner(`${p.look.name} CAIU! Volta na próxima onda.`, 'bad');
            else this.later(1.8, () => this.gameOver());
          }
        }
        return;
      }
      // montaria tomou dano, mas ainda está viva — feedback visual
      this.audio.play('hit_armor', { volume: 0.55, priority: true });
      this.noiseShake(0.15);
      return;
    }
    // dano normal ao jogador (código existente continua a partir daqui)
    if (p.shieldT > 0 || p.dashT > 0) {
      for (let k = 0; k < 4; k++) this.parts.spawn(p.pos.x + rand(-0.5, 0.5), rand(0.6, 1.4), p.pos.z + rand(-0.5, 0.5), rand(-2, 2), rand(0, 2), rand(-2, 2), 0.07, 0x4fd0ff, 0.35, 0, 2);
      return;
    }
    dmg *= this.diff?.mul.enemyDmg || 1; // dificuldade escolhida
    // Blindagem, Fúria total e Campo de sobrevivência reduzem o dano
    dmg *= (1 - this.pv(p, 'armor') / 100) * (p.furyT > 0 ? 0.5 : 1) * (this.inHaven(p) ? 0.4 : 1);
    if (special && p.helmet) dmg *= 0.6;
    // exoesqueleto: -45% de dano e não é empurrado
    if (p.exoT > 0) {
      dmg *= 0.55;
      knock = 0;
    }
    let absorbed = 0;
    if (p.armor > 0) {
      absorbed = Math.min(p.armor, dmg);
      p.armor -= absorbed;
      dmg -= absorbed;
      for (let k = 0; k < 3; k++) this.parts.spawn(p.pos.x, 1, p.pos.z, rand(-2, 2), rand(1, 3), rand(-2, 2), 0.07, 0x9aa4b4, 0.4, 14, 0);
      if (p.armor <= 0) {
        p.armor = 0;
        this.ui.toast(p.id, 'Colete destruído!', 'vest', 'bad');
      }
    }
    p.hp -= dmg;
    p.hurtT = 0.15;
    if (dmg > 0) this.pad.rumble(this.players.indexOf(p), Math.min(1, 0.35 + dmg / 30), 140);
    if (knock) {
      const d = Math.hypot(p.pos.x - fx, p.pos.z - fz) || 1;
      p.vel.x += ((p.pos.x - fx) / d) * knock;
      p.vel.z += ((p.pos.z - fz) / d) * knock;
    }
    if (dmg > 0) {
      for (let k = 0; k < 5; k++) this.parts.spawn(p.pos.x, 1, p.pos.z, rand(-2, 2), rand(1, 3), rand(-2, 2), 0.1, pick(BLOOD), 1, 16, 1);
      this.audio.play('hurt', { volume: 0.7, priority: true });
    } else this.audio.play('hit_armor', { volume: 0.55, priority: true });
    this.noiseShake(0.2);
    this.ui.playerHurt(p.id);
    if (p.hp <= 0) {
      p.hp = 0;
      p.alive = false;
      p.deadT = 0;
      // quem cai perde o equipamento e os efeitos
      p.armor = 0;
      p.helmet = false;
      p.pack = false;
      p.boots = false;
      p.exoT = 0;
      p.reloadT = 0;
      p.energyT = 0;
      p.lightT = 0;
      p.meleeT = 0;
      this.arena.splat(p.pos.x, p.pos.z, 0.8);
      this.audio.play('zombie_die', { rate: 1.5, volume: 0.7, priority: true });
      if (this.players.some((q) => q.alive)) this.ui.banner(`${p.look.name} CAIU! Volta na próxima onda.`, 'bad');
      else this.later(1.8, () => this.gameOver());
    }
  }

  damageBarrel(b, dmg) {
    if (b.dead) return;
    b.hp -= dmg;
    if (b.hp <= 0) {
      b.dead = true;
      this.later(0.1, () => this.explosion(b.x, b.z, 4 * (this.upg.bigBoom ? 1.4 : 1), 170, b.owner));
      this.removePlaceable(b);
    }
  }

  // ------------------------------------------------------------------ cenário destrutível e interativo
  damageProp(pr, dmg, by, dx = 0, dz = 0, boom = false) {
    if (pr.dead || !pr.def.hp) return;
    if (pr.def.boomOnly && !boom) {
      for (let k = 0; k < 2; k++) this.parts.spawn(pr.x - dx * 0.4, 0.5, pr.z - dz * 0.4, rand(-1.5, 1.5), rand(1, 2), rand(-1.5, 1.5), 0.06, 0xc8b48a, 0.4, 14, 0);
      return;
    }
    pr.hp -= dmg;
    pr.hurtT = 0.08;
    // carro abandonado: o primeiro tiro dispara o alarme
    if (pr.def.id === 'acar' && !(pr.alarmT > 0)) this.triggerCarAlarm(pr);
    const col = pr.parts[0][6];
    for (let k = 0; k < 3; k++) this.parts.spawn(pr.x - dx * 0.4, rand(0.3, 1.2), pr.z - dz * 0.4, -dx * rand(1, 3) + rand(-1.5, 1.5), rand(1, 3), -dz * rand(1, 3) + rand(-1.5, 1.5), rand(0.05, 0.1), col, 0.6, 16, 0);
    if (pr.hp <= 0) this.destroyProp(pr, by);
  }
  destroyProp(pr, by) {
    if (pr.dead) return;
    const A = this.arena;
    A.clearProp(pr);
    if (pr.def.coll !== 'none') this.flowT = 0;
    // efeitos próprios de cada cenário
    this.onPropDestroyed(pr, by);
    if (pr.def.id === 'glowshroom') this.addCloud(pr.x, pr.z, { radius: 2.6, dps: 10, life: 5 });
    if (pr.def.id === 'acar') this.later(0.12, () => this.explosion(pr.x, pr.z, 3.6, 150, by));
    // destroços com as cores do próprio modelo
    for (let k = 0; k < 18; k++) {
      const q = pr.parts[Math.floor(Math.random() * pr.parts.length)];
      this.parts.spawn(pr.x + rand(-0.4, 0.4), rand(0.2, Math.min(2.4, q[1] + 0.3)), pr.z + rand(-0.4, 0.4), rand(-4, 4), rand(2, 5), rand(-4, 4), rand(0.08, 0.22), q[6], rand(0.8, 1.5), 18, 0);
    }
    const metal = ['lamp', 'traffic', 'billboard', 'barrel', 'chemtank'].includes(pr.def.id) || pr.def.mat === 'metal';
    this.audio.play(metal ? 'hit_armor' : 'crate', { volume: 0.8, pos: pr, rate: metal ? 0.6 : 0.85 });
    if (pr.def.light) {
      // vidro da lâmpada estoura
      for (let k = 0; k < 10; k++) this.parts.spawn(pr.x + Math.cos(pr.rot) * 0.6, 2.8, pr.z - Math.sin(pr.rot) * 0.6, rand(-2, 2), rand(0, 2), rand(-2, 2), 0.06, 0xffe8a0, 0.6, 14, 2);
      this.audio.play('hit_wall', { volume: 0.8, pos: pr, rate: 1.4 });
    }
    if (pr.def.drop && Math.random() < pr.def.drop * this.diff.mul.resources) this.spawnPickup(this.rollField(), pr.x, pr.z, { x: pr.x, z: pr.z });
    if (!this.demo && by) this.stats.score += 10;
  }
  // cone: cai e desliza na direção do empurrão
  knockProp(pr, dx, dz, speed) {
    if (pr.dead) return;
    if (!pr.knocked) {
      pr.knocked = true;
      pr.kr = Math.atan2(dx, dz);
      this.audio.play('bounce', { volume: 0.5, pos: pr, rate: 0.6 });
    }
    pr.kvx = (pr.kvx || 0) + dx * speed;
    pr.kvz = (pr.kvz || 0) + dz * speed;
  }
  updateScenery(dt) {
    const A = this.arena;
    A.updateProps(dt);
    for (const pr of A.props) {
      if (pr.dead || !pr.def.knock) continue;
      // quem esbarra derruba
      if (!pr.knocked) {
        for (const e of this.players) if (e.alive && Math.hypot(e.pos.x - pr.x, e.pos.z - pr.z) < 0.5) this.knockProp(pr, e.vel.x / 5, e.vel.z / 5, 3);
        if (!pr.knocked) for (const z of this.zombies) if (z.alive && !z.def.fly && Math.hypot(z.pos.x - pr.x, z.pos.z - pr.z) < 0.45 + z.radius * 0.5) {
          const d = Math.hypot(z.pos.x - pr.x, z.pos.z - pr.z) || 1;
          this.knockProp(pr, (pr.x - z.pos.x) / d, (pr.z - z.pos.z) / d, 2.5);
          break;
        }
      }
      if (pr.kvx || pr.kvz) {
        const nx = pr.x + pr.kx + pr.kvx * dt;
        const nz = pr.z + pr.kz + pr.kvz * dt;
        if (!A.circleBlocked(nx, nz, 0.2)) {
          pr.kx += pr.kvx * dt;
          pr.kz += pr.kvz * dt;
        } else {
          pr.kvx *= -0.3;
          pr.kvz *= -0.3;
        }
        const f = Math.exp(-dt * 4);
        pr.kvx *= f;
        pr.kvz *= f;
        if (Math.hypot(pr.kvx, pr.kvz) < 0.05) pr.kvx = pr.kvz = 0;
      }
    }
    // brasas sobre a lava
    if (A.lavaCells.length && Math.random() < dt * 14) {
      const k = A.lavaCells[Math.floor(Math.random() * A.lavaCells.length)];
      this.parts.spawn((k % A.W) + Math.random(), 0.1, Math.floor(k / A.W) + Math.random(), rand(-0.3, 0.3), rand(1, 2.5), rand(-0.3, 0.3), rand(0.06, 0.12), pick([0xff7a1a, 0xffb030, 0xff4010]), rand(0.6, 1.2), -0.5, 2);
    }
    this.updateArenaSystems(dt);
  }

  // ------------------------------------------------------------------ mecânicas próprias de cada arena
  // prensas, vapor, gerador, consoles, sino, carros, cogumelos e árvores retorcidas
  nearPlayer(pr, r = 1.25) {
    let best = null;
    let bd = r;
    for (const p of this.players) {
      if (!p.alive) continue;
      const d = Math.hypot(p.pos.x - pr.x, p.pos.z - pr.z);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  }
  // manter a posição perto do console/gerador até completar
  holdUse(pr, p, dt, need, label, done) {
    pr.holdNeed = need;
    pr.holdT = (pr.holdT || 0) + dt;
    if (!pr.hintT || this.time - pr.hintT > 2.6) {
      pr.hintT = this.time;
      this.ui.toast(p.id, label, 'gear');
    }
    if (Math.random() < dt * 12) this.parts.spawn(pr.x + rand(-0.2, 0.2), 0.9, pr.z + rand(-0.2, 0.2), 0, rand(0.6, 1.6), 0, 0.05, 0xffd860, 0.4, -0.4, 2);
    if (pr.holdT >= need) {
      pr.holdT = 0;
      done(p);
    }
  }
  // --- Arsenal do Naufrágio (Arena 09): efeitos das armas e bônus Tempestade Abissal ---
  navalHit(z, src, dx, dz, dmg) {
    const id = src.weapon;
    if (id === 'nv_harpoon') {
      // fisga: puxa o alvo em direção ao atirador
      const d = Math.hypot(src.pos.x - z.pos.x, src.pos.z - z.pos.z) || 1;
      if (!z.def.boss && d > 1.6) this.arena.move(z.pos, ((src.pos.x - z.pos.x) / d) * 1.4, ((src.pos.z - z.pos.z) / d) * 1.4, z.radius);
    } else if (id === 'nv_anchor') {
      // impacto no solo: dano em área e derrubada
      const r = WEAPONS.nv_anchor.slamRadius;
      for (const q of this.zombies) {
        if (!q.alive || q === z) continue;
        const qd = Math.hypot(q.pos.x - z.pos.x, q.pos.z - z.pos.z);
        if (qd < r) {
          this.damageZombie(q, dmg * 0.55 * (1 - qd / r), q.pos.x - z.pos.x, q.pos.z - z.pos.z, src, 2.2, true);
          if (!q.def.boss) q.stunT = Math.max(q.stunT || 0, 0.6);
        }
      }
      if (!z.def.boss) z.stunT = Math.max(z.stunT || 0, 0.8);
      for (let k = 0; k < 12; k++) this.parts.spawn(z.pos.x, 0.15, z.pos.z, rand(-6, 6), rand(0.5, 2), rand(-6, 6), 0.1, pick([0x4c5864, 0x9aa4a0]), 0.5, 10, 0);
    }
    // Tempestade Abissal: ondas aquáticas nos ataques
    if (src.navalTempest && Math.random() < 0.3) {
      for (const q of this.zombies) {
        if (!q.alive || q === z) continue;
        if (Math.hypot(q.pos.x - z.pos.x, q.pos.z - z.pos.z) < 2.2) this.damageZombie(q, dmg * 0.25, q.pos.x - z.pos.x, q.pos.z - z.pos.z, src, 1.2, true);
      }
      for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; this.parts.spawn(z.pos.x, 0.3, z.pos.z, Math.sin(a) * 5, 1.2, Math.cos(a) * 5, 0.09, pick([0x29b6f6, 0x9adcff]), 0.45, 4, 2); }
    }
  }

  // Tempestade da Necrópole: 3+ armas do Arsenal Profano = +12% dano, +6% crítico e roubo de vida leve
  updateNecroSet(p) {
    const n = NECRO_WEAPONS.filter((id) => this.usable(p, id)).length;
    const on = n >= 3;
    if (on !== !!p.necroTempest) {
      p.necroTempest = on;
      this.ui.toast(p.id, on ? 'TEMPESTADE DA NECRÓPOLE ATIVA: +12% dano, +6% crítico, roubo de vida' : 'Tempestade da Necrópole desativada', 'bolt', on ? undefined : 'bad');
    }
  }

  updateNavalSet(p) {
    const n = NAVAL_WEAPONS.filter((id) => this.usable(p, id)).length;
    const on = n >= 3;
    if (on !== !!p.navalTempest) {
      p.navalTempest = on;
      this.ui.toast(p.id, on ? 'TEMPESTADE ABISSAL ATIVA: +15% dano, +8% crítico' : 'Tempestade Abissal desativada', 'bolt', on ? undefined : 'bad');
    }
  }

  // libera a montaria exclusiva da arena sempre que um chefe nasce, em ponto livre perto do jogador e longe do chefe
  releaseMount(boss) {
    if (!boss || boss._mountReleased) return; // evita disparo duplicado para o mesmo chefe
    boss._mountReleased = true;
    const arenaId = this.arena.def.id;
    const prog = mountOrderForArena(arenaId);
    const bt = boss.type;
    if (this.bossStarted.indexOf(bt) === -1) this.bossStarted.push(bt);
    this.mountReleasedBoss[bt] = true;
    const releaseN = this.mountReleases + 1;
    // transição: destrói a montaria anterior antes de disponibilizar a próxima
    if (this.worldMount && this.worldMount.alive) {
      const wm = this.worldMount;
      if (wm.rider) this.dismount(wm.rider, true);
      wm.alive = false; wm.hp = 0; wm.state = 'substituída';
    }
    this.worldMount = null;
    const pid = prog[Math.min(releaseN - 1, prog.length - 1)]; // montaria correspondente ao confronto
    const pend = mountDef(pid);
    if (!pend) return;
    this.mountReleases = releaseN;
    const A = this.arena;
    const p = this.players.find((q) => q.alive) || this.players[0];
    const R = Math.max(1.35, pend.size * 0.8);
    const ok = (x, z) => x > 2 && z > 2 && x < A.W - 2 && z < A.D - 2 && !A.circleBlocked(x, z, R)
      && !A.props.some((pr) => !pr.dead && Math.hypot(pr.x - x, pr.z - z) < R + 0.6)
      && Math.hypot(boss.pos.x - x, boss.pos.z - z) > 6
      && !this.zombies.some((q) => q.alive && Math.hypot(q.pos.x - x, q.pos.z - z) < R + 0.8);
    let spot = null;
    for (let d = 3; d <= 9 && !spot; d += 1)
      for (let k = 0; k < 16 && !spot; k++) {
        const a = (k / 16) * Math.PI * 2 + Math.atan2(p.pos.x - boss.pos.x, p.pos.z - boss.pos.z);
        const x = p.pos.x + Math.sin(a) * d;
        const z = p.pos.z + Math.cos(a) * d;
        if (ok(x, z)) spot = { x, z };
      }
    if (!spot) spot = this.freeSpot(p.pos.x, p.pos.z, R);
    this.worldMount = { id: pid, def: pend, x: spot.x, z: spot.z, spawnX: spot.x, spawnZ: spot.z, facing: Math.atan2(boss.pos.x - spot.x, boss.pos.z - spot.z), hp: pend.maxHp, maxHp: pend.maxHp, rider: null, alive: true, respawnT: 0, hurtT: 0, wheelT: 0, state: 'disponível' };
    for (const q of this.players) q.mountId = pid;
    for (let k = 0; k < 24; k++) this.parts.spawn(spot.x, 0.3, spot.z, rand(-3, 3), rand(2, 5), rand(-3, 3), 0.12, pick([0xffc107, 0x29b6f6, 0xffffff]), 0.8, 8, 2);
    this.audio.play('pickup', { volume: 0.9, priority: true });
    const msgs = { 1: 'Uma montaria está disponível!', 2: 'Nova montaria liberada!', 3: 'Última montaria disponível! Prepare-se para o confronto final!' };
    const msg = msgs[Math.min(releaseN, 3)] || msgs[3];
    // celular: aviso compacto no topo (sistema de notificações); computador: mantém o toast no painel
    if (this.input.touchMode) this.ui.notify(`${msg} ${pend.name}`, 'gold', 'vehicle', { pri: 2, dur: 3 });
    else for (const q of this.players) this.ui.toast(q.id, msg, 'vehicle');
  }

  // --- montaria 3D ---
  startMount(p, arenaId, force = false) {
    const wm = this.worldMount;
    const m = (wm && wm.def) || mountDef(arenaId);
    if (!m || !wm) return;
    if (p.isMounted) {
      this.dismount(p);
      return;
    }
    if (!wm.alive) {
      this.ui.toast(p.id, `${m.name} foi destruída nesta partida`, 'gear', 'bad');
      return;
    }
    if (wm.rider && wm.rider !== p) {
      this.ui.toast(p.id, `${m.name} já está em uso`, 'gear', 'bad');
      return;
    }
    const dist = Math.hypot(wm.x - p.pos.x, wm.z - p.pos.z);
    if (!force && dist > MOUNT_USE_DIST) {
      this.ui.toast(p.id, `Chegue perto de ${m.name} (${Math.round(dist)}m)`, 'gear');
      return;
    }
    wm.rider = p;
    wm.state = 'utilizada';
    p.pos.set(wm.x, 0, wm.z);
    p.facing = wm.facing;
    p.mountId = wm.id;
    p.mountHp = wm.hp;
    p.isMounted = true;
    p.mountT = 0;
    p.prevWeapon = p.weapon;
    p.weapon = m.weapon;
    p.ammo[m.weapon] = Infinity;
    p.clip[m.weapon] = Infinity;
    p.fireCd = 0;
    this.audio.play('pickup', { volume: 0.65, pos: p.pos });
    this.ui.toast(p.id, 'Montaria ativada: ' + m.name, 'gear');
  }

  dismount(p, destroyed = false) {
    const wm = this.worldMount;
    p.isMounted = false;
    if (wm && wm.rider === p) {
      wm.rider = null;
      if (destroyed) {
        wm.alive = false;
        wm.hp = 0;
wm.state = 'destruída';
        for (let k = 0; k < 18; k++) {
          this.parts.spawn(wm.x, 0.8, wm.z, rand(-4, 4), rand(2, 6), rand(-4, 4), 0.16, pick([0xff8020, 0xffc107, 0x333840]), 0.9, 14, 2);
        }
        this.noiseShake(0.35);
      } else {
        wm.state = 'disponível';
        // estaciona no local onde o jogador desmontou e coloca o jogador ao lado
        const side = this.freeSpot(wm.x + Math.cos(wm.facing) * 1.45, wm.z - Math.sin(wm.facing) * 1.45, p.radius + 0.1);
        p.pos.set(side.x, 0, side.z);
      }
    }
    p.mountHp = 0;
    p.dashDmg = 30; // volta ao padrão do personagem ao desmontar
    p.dashKnock = 6;
    const back = p.prevWeapon && WEAPONS[p.prevWeapon] ? p.prevWeapon : 'pistol';
    p.weapon = back;
    p.prevWeapon = null;
    this.ui.toast(p.id, destroyed ? 'Montaria destruída! Siga a pé' : 'Desmontado', 'gear', destroyed ? 'bad' : undefined);
  }

  updateWorldMount(dt) {
    const wm = this.worldMount;
    if (!wm) return;
    wm.hurtT = Math.max(0, wm.hurtT - dt);
    if (!wm.alive) {
      return; // uma montaria por partida: destruída, não reaparece
    }
    if (wm.rider) {
      const r = wm.rider;
      if (!r.alive || !r.isMounted) {
        wm.rider = null;
        return;
      }
      wm.x = r.pos.x;
      wm.z = r.pos.z;
      wm.facing = r.facing;
      const hs = Math.hypot(r.vel.x, r.vel.z);
      wm.wheelT += hs * dt * 2.6;
      r.mountHp = wm.hp;
      // atropelamento passivo: em velocidade, a montaria fere quem estiver à frente (com recarga por inimigo)
      const ram = mountRam(wm.id);
      if (ram && hs > 4.5) {
        const fx = Math.sin(wm.facing);
        const fz = Math.cos(wm.facing);
        for (const z of this.zombies) {
          if (!z.alive || z.def.fly) continue;
          if ((z.mountRamT || 0) > this.time) continue;
          const dx = z.pos.x - wm.x;
          const dz = z.pos.z - wm.z;
          const d = Math.hypot(dx, dz);
          if (d > 1.45 + z.radius) continue;
          if (d > 0.4 && (dx * fx + dz * fz) / d < 0.25) continue; // só quem está à frente
          z.mountRamT = this.time + 0.6;
          this.damageZombie(z, ram.dmg, fx, fz, r, ram.knock);
        }
      }
    }
  }
  // --- fim montaria ---
  // alarme do carro (restaurado: a declaração tinha sido sobrescrita por engano no commit das montarias)
  triggerCarAlarm(pr) {
    pr.alarmT = 6;
    this.audio.play('siren', { volume: 0.65, pos: pr, rate: 1.2 });
    this.ui.banner('ALARME DO CARRO! A HORDA OUVIU', 'bad');
    const gates = this.arena.gates;
    for (let k = 0; k < 2; k++) {
      const g = pick(gates);
      this.spawnZombie(k ? 'walker' : 'runner', g.x + rand(-0.3, 0.3), g.z + rand(-0.3, 0.3));
    }
  }
  toggleGates() {
    if (!this.power) {
      this.ui.alert('Sem energia: ligue o gerador primeiro.', 'danger', 'warning');
      return;
    }
    // não fecha com alguém em cima do portão
    if (!this.gatesClosed) for (const gp of this.gateProps) {
      if (gp.broken) continue;
      for (const p of this.players) if (p.alive && Math.hypot(p.pos.x - gp.x, p.pos.z - gp.z) < 0.8) {
        this.ui.alert('Saia de cima do portão antes de fechá-lo.', 'danger', 'warning');
        return;
      }
      for (const z of this.zombies) if (z.alive && Math.hypot(z.pos.x - gp.x, z.pos.z - gp.z) < 0.8) {
        this.ui.alert('Um zumbi está no portão: feche quando o caminho estiver livre.', 'danger', 'warning');
        return;
      }
    }
    this.gatesClosed = !this.gatesClosed;
    let n = 0;
    for (const gp of this.gateProps) {
      if (gp.broken) continue;
      gp.closed = this.gatesClosed;
      if (gp.closed) gp.hp = gp.maxHp = 240;
      this.arena.setPropBlock(gp, gp.closed);
      n++;
    }
    this.audio.play('hit_armor', { volume: 0.8, rate: 0.55 });
    this.audio.play('stomp', { volume: 0.35, rate: 1.6 });
    this.ui.banner(this.gatesClosed ? `PORTÕES FECHADOS (${n})` : 'PORTÕES ABERTOS', this.gatesClosed ? 'info' : 'good');
  }
  breakGate(gp) {
    gp.closed = false;
    gp.broken = true;
    gp.hp = 0;
    this.gatesClosed = this.gateProps.some((g) => g.closed && !g.broken);
    this.arena.setPropBlock(gp, false);
    this.audio.play('hit_armor', { volume: 1, rate: 0.4, pos: gp });
    this.audio.play('stomp', { volume: 0.6, rate: 0.8, pos: gp });
    for (let k = 0; k < 14; k++) this.parts.spawn(gp.x + rand(-0.5, 0.5), rand(0.3, 2), gp.z + rand(-0.5, 0.5), rand(-3, 3), rand(1, 4), rand(-3, 3), rand(0.07, 0.14), pick([0xe8b020, 0x3a3e44, 0xd8d0c0]), 0.9, 16, 0);
    this.ui.banner('PORTÃO ARROMBADO!', 'bad');
  }
  toggleRomanGates() {
    this.romanGatesClosed = !this.romanGatesClosed;
    let n = 0;
    for (const gp of this.romanGateProps) {
      if (gp.broken) continue;
      gp.closed = this.romanGatesClosed;
      if (gp.closed) gp.hp = gp.maxHp = 120;
      this.arena.setPropBlock(gp, gp.closed);
      n++;
    }
    this.audio.play('hit_armor', { volume: 0.8, rate: 0.55 });
    this.audio.play('stomp', { volume: 0.35, rate: 1.6 });
    this.ui.banner(this.romanGatesClosed ? `PORTÕES ROMANOS FECHADOS (${n})` : 'PORTÕES ROMANOS ABERTOS', this.romanGatesClosed ? 'info' : 'good');
  }
  updateArenaSystems(dt) {
    const A = this.arena;
    const theme = A.def.theme;
    for (const pr of A.props) {
      if (pr.dead) continue;
      const id = pr.def.id;
      if (pr.alarmT > 0) pr.alarmT = Math.max(0, pr.alarmT - dt);
      if (pr.hurtT > 0) pr.rattle = 1;
      if (id === 'press') {
        // ciclo de 3,5 s: sobe, avisa, desce e esmaga quem estiver embaixo
        pr.t = ((pr.t || 0) + dt * (this.event === 'overload' ? 1.9 : 1)) % 3.5;
        const ph = pr.t;
        let k;
        if (ph < 2) k = 0;
        else if (ph < 2.35) k = (ph - 2) / 0.35;
        else if (ph < 2.75) k = 1;
        else k = 1 - (ph - 2.75) / 0.75;
        pr.ramY = 2 - k * 1.62;
        pr.warn = ph > 1.55 && ph < 2;
        if (k > 0.6 && !pr.smashed) {
          pr.smashed = true;
          this.audio.play('stomp', { volume: 0.6, pos: pr, rate: 1.5 });
          for (let n = 0; n < 10; n++) this.parts.spawn(pr.x + rand(-0.4, 0.4), 0.1, pr.z + rand(-0.4, 0.4), rand(-2, 2), rand(1, 3), rand(-2, 2), rand(0.06, 0.13), 0x8a8e96, 0.5, 8, 0);
          for (const p of this.players) if (p.alive && Math.hypot(p.pos.x - pr.x, p.pos.z - pr.z) < 0.72) {
            this.damagePlayer(p, 34, pr.x, pr.z, 5);
            this.ui.playerHurt(p.id);
          }
          for (const z of this.zombies) if (z.alive && !z.def.fly && Math.hypot(z.pos.x - pr.x, z.pos.z - pr.z) < 0.78) this.damageZombie(z, 110, 0, 0, null, 0);
        }
        if (k < 0.15) pr.smashed = false;
      } else if (id === 'steam') {
        // ciclo de 4 s: chia 0,6 s antes e solta vapor por 1,5 s
        pr.t = ((pr.t || 0) + dt * (this.event === 'overload' ? 1.7 : 1)) % 4;
        const ph = pr.t;
        const vent = ph > 0.9 && ph < 2.4;
        pr.hiss = ph > 0.6 && ph < 0.9;
        if (ph > 0.6 && ph < 0.65) this.audio.play('steam', { volume: 0.45, pos: pr, rate: rand(0.9, 1.1) });
        if (vent) {
          for (let n = 0; n < 3; n++) this.parts.spawn(pr.x + rand(-0.3, 0.3), 0.2, pr.z + rand(-0.3, 0.3), rand(-0.6, 0.6), rand(2, 4), rand(-0.6, 0.6), rand(0.1, 0.22), 0xc8d4dc, 0.9, -1.4, 2);
          pr.burnT = (pr.burnT || 0) + dt;
          if (pr.burnT >= 0.3) {
            pr.burnT = 0;
            for (const p of this.players) if (p.alive && Math.hypot(p.pos.x - pr.x, p.pos.z - pr.z) < 1.35) {
              this.damagePlayer(p, 7, pr.x, pr.z, 3, true);
              const d = Math.hypot(p.pos.x - pr.x, p.pos.z - pr.z) || 1;
              p.vel.x += ((p.pos.x - pr.x) / d) * 3;
              p.vel.z += ((p.pos.z - pr.z) / d) * 3;
            }
            for (const z of this.zombies) if (z.alive && !z.def.fly && Math.hypot(z.pos.x - pr.x, z.pos.z - pr.z) < 1.4) this.damageZombie(z, 9, 0, 0, null, 1.2);
          }
        } else pr.burnT = 0;
      } else if (id === 'generator') {
        const p = this.nearPlayer(pr, 1.3);
        if (p && !this.genOn) this.holdUse(pr, p, dt, 2, 'Ligando o gerador...', (who) => this.startGenerator(pr, who));
        else if (pr.holdT) pr.holdT = Math.max(0, pr.holdT - dt * 2);
        if (this.genOn) pr.on = true;
      } else if (id === 'gconsole') {
        const p = this.nearPlayer(pr, 1.3);
        if (p) this.holdUse(pr, p, dt, 1.5, 'Operando os portões...', () => this.toggleGates());
        else if (pr.holdT) pr.holdT = Math.max(0, pr.holdT - dt * 2);
      } else if (id === 'tconsole') {
        const p = this.nearPlayer(pr, 1.3);
        if (p) this.holdUse(pr, p, dt, 1.5, 'Ativando a torre...', (who) => this.useTowerConsole(pr, who));
        else if (pr.holdT) pr.holdT = Math.max(0, pr.holdT - dt * 2);
      } else if (id === 'econsole') {
        const p = this.nearPlayer(pr, 1.3);
        if (p) this.holdUse(pr, p, dt, 1.5, 'Sobrecarregando o piso...', (who) => this.useElecConsole(pr, who));
        else if (pr.holdT) pr.holdT = Math.max(0, pr.holdT - dt * 2);
      } else if (id === 'bell') {
        const p = this.nearPlayer(pr, 1.4);
        if (p) this.holdUse(pr, p, dt, 1.5, 'Tocando o sino...', (who) => this.ringBell(pr, who));
        else if (pr.holdT) pr.holdT = Math.max(0, pr.holdT - dt * 2);
      } else if (id === 'roman_portal') {
        for (const p of this.players) if (p.alive && Math.hypot(p.pos.x - pr.x, p.pos.z - pr.z) < 0.7) {
          const others = this.arena.props.filter((q) => q.def.id === 'roman_portal' && q !== pr && !q.dead);
          if (others.length) {
            const dst = others[Math.floor(Math.random() * others.length)];
            p.pos.x = dst.x;
            p.pos.z = dst.z;
            this.audio.play('eg_magic', { volume: 0.6, pos: dst, rate: 1.2 });
            for (let k = 0; k < 12; k++) this.parts.spawn(dst.x, 1.2, dst.z, rand(-1, 1), rand(1, 3), rand(-1, 1), 0.09, 0x7a3ab0, 0.5, 8, 2);
          }
        }
      } else if (id === 'roman_elevator') {
        pr.t = (pr.t || 0) + dt;
        for (const p of this.players) if (p.alive && Math.hypot(p.pos.x - pr.x, p.pos.z - pr.z) < 0.7) {
          p.pos.y = (p.pos.y || 0) + Math.sin(pr.t * 1.5) * 0.02;
        }
      } else if (id === 'roman_platform') {
        pr.t = (pr.t || 0) + dt;
        pr.dy = Math.sin(pr.t * 1.2 + pr.seed) * 0.6;
      } else if (id === 'roman_lever') {
        const p = this.nearPlayer(pr, 1.3);
        if (p) this.holdUse(pr, p, dt, 1.0, 'Acionando a alavanca...', () => this.toggleRomanGates());
        else if (pr.holdT) pr.holdT = Math.max(0, pr.holdT - dt * 2);
      } else if (id === 'acar') {
        if (pr.alarmT > 0) pr.alarmT = Math.max(0, pr.alarmT - dt);
      } else if (id === 'firebarrel') {
        for (const p of this.players) if (p.alive && Math.hypot(p.pos.x - pr.x, p.pos.z - pr.z) < 0.72) {
          p.fireT = (p.fireT || 0) + dt;
          if (p.fireT > 0.45) {
            p.fireT = 0;
            this.damagePlayer(p, 5, pr.x, pr.z, 0, true);
          }
        }
      } else if (id === 'glowshroom') {
        for (const p of this.players) if (p.alive && Math.hypot(p.pos.x - pr.x, p.pos.z - pr.z) < 0.45) this.damageProp(pr, 999, p);
      } else if (id === 'twisted') {
        // pode tombar sozinha durante a partida e virar barreira
        if (!pr.fallen) {
          pr.fallCd = (pr.fallCd ?? rand(18, 42)) - dt;
          if (pr.fallCd <= 0) this.fellTree(pr);
        } else if (pr.fallA < Math.PI / 2) {
          pr.fallA = Math.min(Math.PI / 2, pr.fallA + dt * 2.6);
        }
      }
    }
    // árvores caídas: dano no impacto (uma vez), poeira e som
    for (const pr of A.props) if (pr.def.id === 'twisted' && pr.fallHit) {
      pr.fallHit = false;
      const dx = Math.cos(pr.rot) * 1.6;
      const dz = -Math.sin(pr.rot) * 1.6;
      this.audio.play('crate', { volume: 0.9, pos: pr, rate: 0.5 });
      this.noiseShake(0.35);
      for (let n = 0; n < 16; n++) this.parts.spawn(pr.x + dx, 0.2, pr.z + dz, rand(-2.5, 2.5), rand(1, 4), rand(-2.5, 2.5), rand(0.08, 0.2), pick([0x3a2e2a, 0x6a4a2a, 0x2a3a1a]), 0.8, 14, 0);
      for (const p of this.players) if (p.alive && Math.hypot(p.pos.x - (pr.x + dx), p.pos.z - (pr.z + dz)) < 1.7) {
        this.damagePlayer(p, 26, pr.x, pr.z, 4);
        this.ui.playerHurt(p.id);
      }
      for (const z of this.zombies) if (z.alive && !z.def.fly && Math.hypot(z.pos.x - (pr.x + dx), z.pos.z - (pr.z + dz)) < 1.8) this.damageZombie(z, 80, 0, 0, null, 0);
    }
    // objetos interativos da expansão (laboratório, coliseu, templo e comuns)
    let _nearest = null, _bestD = 1.6;
  const _pl = this.players.filter((p) => p.alive)[0];
  if (_pl && A.props) for (const _pr of A.props) {
    if (_pr.dead || _pr.def.beh !== 'interact') continue;
    const _d = Math.hypot(_pr.x - _pl.pos.x, _pr.z - _pl.pos.z);
    if (_d < _bestD) { _bestD = _d; _nearest = _pr; }
  }
  if (_nearest) {
    const _v = new THREE.Vector3(_nearest.x, 1.2, _nearest.z);
    _v.project(this.camera);
    const _x = (_v.x * 0.5 + 0.5) * this.canvas.width;
    const _y = (1 - (_v.y * 0.5 + 0.5)) * this.canvas.height;
    const _key = this.input.touchMode ? 'Tap' : (this.pad && this.pad.usingPad ? 'A' : 'E');
    // HUD overlap avoidance: avoid placing prompt over crosshair area (center screen)
    const _cx = this.canvas.width / 2, _cy = this.canvas.height / 2;
    let _px = _x, _py = _y;
    if (Math.abs(_px - _cx) < 60 && Math.abs(_py - _cy) < 60) _py -= 70;
    this.ui.interactPrompt(true, _nearest.def.name || 'Interagir', _px, _py, 'available', _key);
  } else {
    this.ui.interactPrompt(false);
  }
  this.updateWorldObjects(dt);
  }
  startGenerator(pr, p) {
    this.genOn = true;
    this.power = true;
    pr.on = true;
    this.audio.play('generator', { volume: 0.9, pos: pr });
    this.ui.banner('ENERGIA RESTABELECIDA', 'good');
    if (this.arenaDef.theme === 'city') {
      for (const q of this.arena.props) if (q.def.id === 'lamp' || q.def.id === 'beacon') this.arena.setPropLight(q, true);
    } else if (this.arenaDef.theme === 'military') {
      for (const q of this.arena.props) if (q.def.id === 'lighttower') this.arena.setPropLight(q, true);
    }
    for (let k = 0; k < 14; k++) this.parts.spawn(pr.x + rand(-0.5, 0.5), rand(0.4, 1.2), pr.z + rand(-0.5, 0.5), rand(-2, 2), rand(1, 3), rand(-2, 2), rand(0.06, 0.12), pick([0xffd040, 0xfff0a0]), 0.6, 10, 2);
    void p;
  }
  useTowerConsole(pr, p) {
    if (!this.power) {
      this.ui.alert('Ligue o gerador para alimentar a torre.', 'danger', 'warning');
      return;
    }
    const spot = this.freeSpotNear(pr.x, pr.z - 1.2, 0.4);
    this.turrets.push({ x: spot.x, z: spot.z, t: 0, life: 25, cd: 0.5, ang: p ? p.aim : 0, owner: p, flash: 0 });
    this.audio.play('generator', { volume: 0.6, pos: pr, rate: 1.4 });
    this.ui.banner('TORRE AUTOMÁTICA ATIVA (25 s)', 'good');
    pr.spentT = 1;
    this.later(1, () => (pr.spentT = 0));
  }
  useElecConsole(pr, p) {
    this.elecForceT = 6;
    this.elecOn = true;
    this.audio.play('generator', { volume: 0.45, pos: pr, rate: 2.2 });
    this.audio.play('hit_armor', { volume: 0.5, pos: pr, rate: 2.4 });
    this.ui.banner('PISO ELÉTRICO SOBRECARREGADO', 'info');
    pr.spentT = 1;
    this.later(1, () => (pr.spentT = 0));
    void p;
  }
  ringBell(pr) {
    pr.swingT = 1;
    this.audio.play('bell', { volume: 1, pos: pr });
    this.noiseShake(0.25);
    for (const z of this.zombies) if (z.alive && Math.hypot(z.pos.x - pr.x, z.pos.z - pr.z) < 10) {
      z.stunT = Math.max(z.stunT || 0, 1.8);
      z.state = 'move';
      z.stateT = 0;
    }
    for (let k = 0; k < 26; k++) {
      const a = (k / 26) * Math.PI * 2;
      this.parts.spawn(pr.x + Math.sin(a) * 0.6, 1.9, pr.z + Math.cos(a) * 0.6, Math.sin(a) * 5, rand(1, 3), Math.cos(a) * 5, rand(0.06, 0.12), 0xffd060, 0.6, 2, 2);
    }
    for (const p of this.players) if (p.alive && Math.hypot(p.pos.x - pr.x, p.pos.z - pr.z) < 10) this.ui.toast(p.id, 'O sino atordoou os mortos!', 'warning', 'good');
  }
  fellTree(pr) {
    pr.fallen = true;
    pr.fallA = 0.05;
    pr.fallHit = true;
    this.audio.play('groan4', { volume: 0.7, pos: pr, rate: 0.6 });
    this.ui.alert('Uma árvore retorcida desabou!', 'info', 'warning');
  }

  // ------------------------------------------------------------------ ambiente: piso elétrico, clima e luzes
  updateEnvironment(dt) {
    const A = this.arena;
    const theme = A.def.theme;
    // piso elétrico: a fábrica liga sozinho em ciclos; o console força por 6 s
    if (this.elecForceT > 0) this.elecForceT = Math.max(0, this.elecForceT - dt);
    const was = this.elecOn;
    this.elecOn = this.elecForceT > 0 || (theme === 'factory' && (this.event === 'overload' ? this.time % 4 < 2.2 : this.time % 13 < 3));
    if (this.elecOn && !was && A.elecCells.length) this.audio.play('hit_armor', { volume: 0.25, rate: 2.6 });
    if (this.elecOn && A.elecCells.length && Math.random() < dt * 20) {
      const k = A.elecCells[Math.floor(Math.random() * A.elecCells.length)];
      this.parts.spawn(k % A.W + rand(0.2, 0.8), 0.1, Math.floor(k / A.W) + rand(0.2, 0.8), rand(-1, 1), rand(1, 2.5), rand(-1, 1), 0.05, pick([0x9adcff, 0xffffff, 0x3aa0ff]), 0.3, 2, 2);
    }
    // ciclo de clima (a primeira frente chega ~32 s depois do início)
    if (!this.demo) {
      if (this.event) {
        this.eventLeft -= dt;
        if (this.eventLeft <= 0) this.endEvent();
      } else {
        this.eventT -= dt;
        if (this.eventT <= 0) this.startEvent();
      }
    }
    if (this.alarmT > 0) this.alarmT = Math.max(0, this.alarmT - dt);
    if (!this.demo && this.event) this.updateEventGameplay(dt);
    // luzes e névoa acompanham o evento
    let sunT = this.baseLight.sunI;
    let hemiT = this.baseLight.hemi;
    let fogN = this.baseLight.fogNear;
    let fogF = this.baseLight.fogFar;
    let evI = 0;
    let evC = 0xff3020;
    // cor da névoa e do fundo acompanham o evento (neblina lava, apagão escurece)
    const MIST = { forest: 0x74877c, graveyard: 0x77809c, city: 0x8a949e, factory: 0x6a6a6a, military: 0x8a93a0, lab: 0x8aa8b0, colosseum: 0xc8b898, temple: 0x8a7a5a };
    let fogHex = this.baseLight.fogC.getHex();
    if (this.event === 'blackout') {
      sunT *= 0.24;
      hemiT *= 0.32;
      fogN = 16;
      fogF = 48;
      fogHex = 0x0d0906;
    } else if (this.event === 'rain') {
      sunT *= 0.55;
      hemiT *= 0.72;
      fogN = 24;
      fogF = 64;
      fogHex = 0x2a3234;
      const t = this.baseLight.sunI * 0.9;
      if (this.lightningT > 0) {
        this.lightningT -= dt;
        sunT = t * 5;
      } else if (Math.random() < dt * 0.22) {
        this.lightningT = 0.12;
        this.audio.play('explosion', { volume: 0.12, rate: 2.6, pan: rand(-0.8, 0.8) });
      }
    } else if (this.event === 'fog') {
      sunT *= 0.72;
      hemiT *= 0.86;
      fogN = 8;
      fogF = 30;
      fogHex = MIST[theme] || 0x8a949e;
    } else if (this.event === 'hordealarm') {
      sunT *= 0.8;
      hemiT *= 0.9;
      evI = 26 + Math.sin(this.time * 7) * 20;
      evC = 0xff8a20;
    } else if (this.event === 'overload') {
      // luz piscando: a rede elétrica não aguenta
      const fl = Math.sin(this.time * 23) * Math.sin(this.time * 7.3) > 0.55 ? 0.25 : 1;
      sunT *= 0.6 * fl;
      hemiT *= 0.7 * (fl < 1 ? 0.6 : 1);
      evI = 22 + Math.sin(this.time * 11) * 14;
      evC = 0xffa020;
    } else if (this.event === 'alarm') {
      sunT *= 0.78;
      hemiT *= 0.88;
      evI = 34 + Math.sin(this.time * 9) * 26;
      evC = 0xff3020;
    } else if (this.event === 'breach') {
      // luz de emergência do laboratório
      sunT *= 0.55;
      hemiT *= 0.7;
      evI = 30 + Math.sin(this.time * 8) * 24;
      evC = 0xff2a20;
    } else if (this.event === 'trial') {
      sunT *= 1.15;
      evI = 14 + Math.sin(this.time * 3) * 6;
      evC = 0xffb040;
    } else if (this.event === 'curse') {
      sunT *= 0.35;
      hemiT *= 0.55;
      fogN = 12;
      fogF = 40;
      fogHex = 0x2a1a3a;
      evI = 18 + Math.sin(this.time * 2) * 8;
      evC = 0x40e0c0;
    }
    const k = 1 - Math.exp(-dt * 1.7);
    this.sun.intensity += (sunT - this.sun.intensity) * k;
    this.hemi.intensity += (hemiT - this.hemi.intensity) * k;
    this.scene.fog.near += (fogN - this.scene.fog.near) * k;
    this.scene.fog.far += (fogF - this.scene.fog.far) * k;
    const fogT = this.baseLight.fogC.clone().lerp(new THREE.Color(fogHex), this.event ? 0.85 : 0);
    this.scene.fog.color.lerp(fogT, k);
    this.scene.background.lerp(this.scene.fog.color, k);
    this.eventLight.color.setHex(evC);
    this.eventLight.intensity += (evI - this.eventLight.intensity) * k;
    // chuva: garoa na cidade, tempestade durante o evento
    const storm = this.event === 'rain';
    const nDrops = theme === 'city' ? (storm ? 170 : 55) : storm ? 120 : 0;
    const cx = this.camTarget.x;
    const cz = this.camTarget.z;
    for (let i = 0; i < this.rain.length; i++) {
      const d = this.rain[i];
      d.on = i < nDrops;
      if (!d.on) continue;
      d.y -= d.vy * dt;
      d.x += d.vx * dt;
      d.z += d.vz * dt;
      if (d.y < 0.05 || Math.abs(d.x - cx) > 26 || Math.abs(d.z - cz) > 26) {
        d.x = cx + rand(-22, 22);
        d.z = cz + rand(-22, 22);
        d.y = rand(7, 17);
        d.vx = rand(0.8, 2.2);
        d.vz = rand(-0.4, 1.2);
        d.vy = rand(11, 17);
        if (Math.random() < 0.5) this.parts.spawn(d.x, 0.05, d.z, rand(-1, 1), rand(0.6, 1.6), rand(-1, 1), 0.05, 0x9cc4e8, 0.25, 8, 2);
      }
    }
    // neblina baixa em floresta/necrotério e durante o evento de neblina (visual apenas)
    if ((theme === 'forest' || theme === 'graveyard' || this.event === 'fog') && Math.random() < dt * 12) {
      for (let n = 0; n < 2; n++) this.parts.spawn(cx + rand(-13, 13), rand(0.1, 0.9), cz + rand(-13, 13), rand(-0.4, 0.4), rand(-0.1, 0.25), rand(-0.4, 0.4), rand(0.16, 0.38), 0x9aa8a4, rand(2.4, 4.2), -0.05, 2);
    }
    this.updateAmbientParticles(dt);
    // camadas de áudio do clima seguem o estado (sem reenviar todo quadro)
    const wRain = this.rainOn || storm;
    const wFog = this.event === 'fog';
    if (wRain !== this._wRain) {
      this._wRain = wRain;
      this.audio.setWeatherAmbient('rain', wRain);
    }
    if (wFog !== this._wFog) {
      this._wFog = wFog;
      this.audio.setWeatherAmbient('fog', wFog);
    }
  }
  // direção cardinal de um portão (para anunciar de onde vêm os reforços)
  gateSide(gt) {
    const A = this.arena;
    const dx = gt.x / A.W - 0.5;
    const dz = gt.z / A.D - 0.5;
    if (Math.abs(dx) > Math.abs(dz)) return dx < 0 ? 'OESTE' : 'LESTE';
    return dz < 0 ? 'NORTE' : 'SUL';
  }
  inShelter(x, z) {
    const sh = this.arena.def.shelters;
    if (!sh) return false;
    return sh.some(([x0, z0, x1, z1]) => x >= x0 && x <= x1 + 1 && z >= z0 && z <= z1 + 1);
  }
  // o que cada evento faz no jogo (o visual fica em updateEnvironment)
  updateEventGameplay(dt) {
    const A = this.arena;
    const ev = this.event;
    if (ev === 'alarm') {
      // reforços em esquadrões: cada esquadrão entra por uma entrada diferente
      this.alarmSpawnT -= dt;
      if (this.alarmSpawnT <= 0 && this.countAlive() < this.aliveCap()) {
        this.alarmSpawnT = rand(3.6, 4.8);
        const gs = A.gates.filter((gt) => this.gateSide(gt) !== this.lastSide);
        const gt = pick(gs.length ? gs : A.gates);
        this.lastSide = this.gateSide(gt);
        this.ui.alert(`Reforços chegando pelo ${this.lastSide}!`, 'danger', 'warning');
        const squad = this.wave >= 6 ? ['armored', 'runner', 'walker', 'walker'] : ['runner', 'walker', 'walker'];
        for (const t of squad) this.spawnZombie(t, gt.x + rand(-0.4, 0.4), gt.z + rand(-0.4, 0.4));
      }
    } else if (ev === 'hordealarm') {
      // cada carro disparando chama mortos pelo portão mais próximo dele
      this.alarmSpawnT -= dt;
      if (this.alarmSpawnT <= 0 && this.countAlive() < this.aliveCap()) {
        this.alarmSpawnT = rand(1.6, 2.6);
        const cars = A.props.filter((pr) => !pr.dead && pr.alarmT > 0);
        const src = cars.length ? pick(cars) : null;
        let gt = pick(A.gates);
        if (src) gt = A.gates.reduce((b, q) => (Math.hypot(q.x - src.x, q.z - src.z) < Math.hypot(b.x - src.x, b.z - src.z) ? q : b), A.gates[0]);
        for (let k = 0; k < 2; k++) this.spawnZombie(Math.random() < 0.45 ? 'runner' : 'walker', gt.x + rand(-0.4, 0.4), gt.z + rand(-0.4, 0.4));
      }
      // as sirenes seguem tocando enquanto durar o evento
      for (const pr of A.props) if (pr.evAlarm && !pr.dead && pr.alarmT < 1) pr.alarmT = 2;
    } else if (ev === 'breach' || ev === 'trial' || ev === 'curse') {
      this.updateWorldEvent(ev, dt);
    } else if (ev === 'overload') {
      // faíscas saltando das máquinas
      for (const pr of A.props) {
        if (pr.dead || !['machine', 'press', 'steam', 'econsole'].includes(pr.def.id)) continue;
        if (Math.random() < dt * 3) this.parts.spawn(pr.x + rand(-0.4, 0.4), rand(0.8, 1.8), pr.z + rand(-0.4, 0.4), rand(-3, 3), rand(2, 4), rand(-3, 3), 0.05, pick([0xffd040, 0xffffff, 0xff8a20]), 0.4, 9, 2);
      }
    }
  }
  startEvent() {
    const kind = (this.arenaDef || this.arena.def).weather || 'rain';
    this.event = kind;
    this.eventLeft = rand(16, 22);
    this.eventDur = this.eventLeft;
    this.eventBoost = 1;
    const info = EVENT_INFO[kind] || EVENT_INFO.rain;
    this.ui.banner(info.title, info.kind);
    this.audio.play(info.sfx || 'wave', { volume: 0.8, priority: true, rate: info.rate || 1 });
    if (kind === 'alarm') {
      this.alarmSpawnT = 1.2;
      this.lastSide = null;
    }
    this.startWorldEvent(kind);
    if (kind === 'hordealarm') {
      // dispara até 3 carros de uma vez
      this.alarmSpawnT = 1;
      const cars = this.arena.props.filter((pr) => !pr.dead && pr.def.id === 'acar');
      for (let k = 0; k < 3 && cars.length; k++) {
        const pr = cars.splice(Math.floor(Math.random() * cars.length), 1)[0];
        pr.alarmT = 6;
        pr.evAlarm = true;
        this.audio.play('siren', { volume: 0.5, pos: pr, rate: 1.2 });
      }
    }
    this.audio.setWeatherAmbient('rain', kind === 'rain');
    this.audio.setWeatherAmbient('fog', kind === 'fog');
    this._wRain = kind === 'rain' || this.rainOn;
    this._wFog = kind === 'fog';
  }
  endEvent() {
    if (this.event) this.endWorldEvent(this.event);
    for (const pr of this.arena.props) pr.evAlarm = false;
    this.event = null;
    this.eventLeft = 0;
    this.eventBoost = 0;
    this.eventT = rand(42, 66);
    this.ui.alert('O clima acalmou. Aproveite para se preparar.', 'info', 'checkCircle');
    this.audio.setWeatherAmbient('rain', this.rainOn);
    this.audio.setWeatherAmbient('fog', false);
    this._wRain = this.rainOn;
    this._wFog = false;
  }

  // empurrar o barril comum: andar contra ele por um instante o move uma célula
  tryPush(p, mx, mz, dt) {
    const A = this.arena;
    let di = 0;
    let dj = 0;
    if (Math.abs(mx) > Math.abs(mz) * 1.5) di = Math.sign(mx);
    else if (Math.abs(mz) > Math.abs(mx) * 1.5) dj = Math.sign(mz);
    const pi = Math.floor(p.pos.x);
    const pj = Math.floor(p.pos.z);
    const pr = di || dj ? A.propAt(pi + di, pj + dj) : null;
    const close = pr && Math.abs((pr.x - p.pos.x) * di + (pr.z - p.pos.z) * dj) < 0.5 + p.radius + 0.08;
    if (!pr || !pr.def.push || !close) {
      p.pushT = 0;
      return;
    }
    p.pushT = (p.pushT || 0) + dt;
    if (p.pushT < 0.25) return;
    p.pushT = 0;
    const ni = pr.i + di;
    const nj = pr.j + dj;
    if (!A.inb(ni, nj) || A.blocked(ni, nj) || A.propAt(ni, nj)) return;
    const cx = ni + 0.5;
    const cz = nj + 0.5;
    // a célula de destino é um quadrado: testa círculo x quadrado (o teste por distância deixava cantos livres)
    const hits = (e, r) => {
      const qx = Math.max(ni, Math.min(ni + 1, e.pos.x));
      const qz = Math.max(nj, Math.min(nj + 1, e.pos.z));
      return (e.pos.x - qx) ** 2 + (e.pos.z - qz) ** 2 < (r + 0.02) ** 2;
    };
    if (this.players.some((q) => q.alive && hits(q, q.radius))) return;
    if (this.zombies.some((z) => z.alive && !z.def.fly && hits(z, z.radius))) return;
    A.moveProp(pr, ni, nj);
    this.flowT = 0;
    this.audio.play('crate', { volume: 0.6, pos: pr, rate: 0.55 });
    for (let k = 0; k < 4; k++) this.parts.spawn(pr.x - di * 0.5, 0.1, pr.z - dj * 0.5, rand(-1, 1), rand(0.5, 1.5), rand(-1, 1), 0.12, 0x6a6a60, 0.5, 2, 0);
  }

  // ------------------------------------------------------------------ habilidades: passivas, XP e árvore
  pv(p, id) {
    const n = p.pas[id] || 0;
    return n ? PASSIVES[id].v(n) : 0;
  }
  // multiplicador de dano do jogador (passiva + Fúria total)
  dmgMul(p) {
    return (1 + this.pv(p, 'damage') / 100) * (p.furyT > 0 ? 1.6 : 1);
  }
  gainXp(p, n) {
    if (this.demo) return;
    n = Math.max(1, Math.round(n * this.diff.mul.xp));
    p.xp += n;
    while (p.xp >= xpNeed(p.lv)) {
      p.xp -= xpNeed(p.lv);
      p.lv++;
      p.pts++;
      this.audio.play('levelup', { volume: 0.7, priority: true });
      if (!p.ai) this.tutHint('levelup');
      this.ui.toast(p.id, `Nível ${p.lv}! +1 ponto (${this.ui.treeKey()})`, 'tree');
      for (let k = 0; k < 16; k++) this.parts.spawn(p.pos.x + rand(-0.4, 0.4), rand(0.2, 1.6), p.pos.z + rand(-0.4, 0.4), 0, rand(1.5, 3.5), 0, 0.09, pick([0xffe060, 0xffffff]), 0.8, -1, 2);
    }
  }
  // estado de um nó da árvore: 'max' | 'locked' | 'poor' | 'ok'
  nodeState(p, id) {
    const lvl = p.pas[id] || 0;
    if (lvl >= MAX_LEVEL) return 'max';
    const br = BRANCHES.find((b) => b.nodes.includes(id));
    const i = br.nodes.indexOf(id);
    if (i > 0 && (p.pas[br.nodes[i - 1]] || 0) < NODE_REQ) return 'locked';
    return p.pts >= levelCost(lvl + 1) ? 'ok' : 'poor';
  }
  buyPassive(p, id) {
    if (this.nodeState(p, id) !== 'ok') return false;
    const next = (p.pas[id] || 0) + 1;
    p.pts -= levelCost(next);
    p.pas[id] = next;
    if (id === 'vitality') {
      p.maxHp += 15;
      p.hp = Math.min(p.maxHp, p.hp + 15);
    }
    this.audio.play('levelup', { volume: 0.5, rate: 1.3 });
    return true;
  }
  ultState(p) {
    if (p.ultOn) return 'on';
    if (p.lv < ULT_REQ.level) return 'locked';
    return p.pts >= ULT_REQ.cost ? 'ok' : 'poor';
  }
  buyUlt(p) {
    if (this.ultState(p) !== 'ok') return false;
    p.pts -= ULT_REQ.cost;
    p.ultOn = true;
    this.audio.play('achievement', { volume: 0.7 });
    return true;
  }

  // ponto de mira no chão: mouse no solo; no teclado, o alvo da assistência ou 8 m à frente
  aimPoint(p) {
    const mode = this.settings.aimMode || 1;
    if (mode === 2) {
      const t = this.aimTarget(p);
      if (t) return { x: t.pos.x, z: t.pos.z };
    }
    if (p.ctl.mouse && !this.input.mouseIdle && mode !== 2) return { x: this.mouseWorld.x, z: this.mouseWorld.z };
    const t = this.aimTarget(p);
    if (t) return { x: t.pos.x, z: t.pos.z };
    return { x: p.pos.x + Math.sin(p.aim) * 8, z: p.pos.z + Math.cos(p.aim) * 8 };
  }
  inHaven(p) {
    for (const f of this.fields) if (f.kind === 'haven' && Math.hypot(p.pos.x - f.x, p.pos.z - f.z) < f.r) return true;
    return false;
  }

  // ------------------------------------------------------------------ habilidades: uso
  useAbility(p, i) {
    const id = p.slots[i];
    const ult = i === 3;
    const def = ult ? ULTIMATES[id] : ACTIVES[id];
    if (!def) return;
    if (ult && !p.ultOn) {
      this.audio.play('empty', { volume: 0.5 });
      this.ui.toast(p.id, `Ultimate bloqueada: libere na árvore (${this.ui.treeKey()}, nível ${ULT_REQ.level})`, 'lock', 'bad');
      return;
    }
    if (p.cds[i] > 0 || p.dashT > 0) {
      this.audio.play('empty', { volume: 0.4 });
      return;
    }
    if (this[`cast_${id}`](p, def) === false) return;
    const cd = def.cd * (1 - this.pv(p, 'cooldown') / 100);
    p.cds[i] = cd;
    (p.cdMax || (p.cdMax = []))[i] = cd;
    p.cdMax[i] = cd;
    if (!this.tut) this.tutHint('ability');
  }
  cast_dash(p) {
    let dx = 0;
    let dz = 0;
    const c = p.ctl;
    const inp = this.input;
    if (inp.any(c.up)) dz -= 1;
    if (inp.any(c.down)) dz += 1;
    if (inp.any(c.left)) dx -= 1;
    if (inp.any(c.right)) dx += 1;
    const a = dx || dz ? Math.atan2(dx, dz) : p.aim;
    p.dashT = 0.2;
    p.dashDir = a;
    p.dashHit = new Set();
    p.dashDmg = 30; // padrão do personagem; a montaria define o próprio valor ao investir
    p.dashKnock = 6;
    p.dashRam = p.shieldT > 0; // interação: Investida + Escudo tático = Aríete
    if (p.dashRam) this.ui.toast(p.id, 'Aríete! (Investida + Escudo)', 'hexShield');
    this.audio.play('swing', { volume: 0.8, pos: p.pos, rate: 0.55 });
  }
  cast_shield(p, def) {
    p.shieldT = def.dur;
    this.audio.play('generator', { volume: 0.6, pos: p.pos, rate: 1.6 });
  }
  cast_sgrenade(p) {
    // cai no ponto mirado (2,5 a 11 m): dá para jogar dentro do próprio Campo elétrico
    const t = this.aimPoint(p);
    const dist = Math.max(2.5, Math.min(11, Math.hypot(t.x - p.pos.x, t.z - p.pos.z)));
    const a = Math.atan2(t.x - p.pos.x, t.z - p.pos.z);
    p.aim = a;
    const dx = Math.sin(a);
    const dz = Math.cos(a);
    const sp = dist / 0.75;
    const w = { radius: 4.5 * (this.upg.bigBoom ? 1.4 : 1), dmg: 180 };
    this.projectiles.push({ kind: 'sgrenade', x: p.pos.x + dx * 0.6, y: 1.1, z: p.pos.z + dz * 0.6, vx: dx * sp, vy: 5, vz: dz * sp, t: 0, fuse: 1.1, w, owner: p });
    p.firingT = 0.5;
    p.facing = p.aim;
    this.audio.play('throw', { volume: 0.7, pos: p.pos, rate: 0.8 });
  }
  cast_turret(p, def) {
    let x = p.pos.x + Math.sin(p.aim) * 1.2;
    let z = p.pos.z + Math.cos(p.aim) * 1.2;
    if (this.arena.circleBlocked(x, z, 0.3)) {
      x = p.pos.x;
      z = p.pos.z;
    }
    this.turrets.push({ x, z, t: 0, life: def.dur, cd: 0.5, ang: p.aim, owner: p, flash: 0 });
    this.audio.play('crate', { volume: 0.8, pos: p.pos, rate: 1.3 });
    for (let k = 0; k < 10; k++) this.parts.spawn(x, 0.2, z, rand(-2, 2), rand(1, 3), rand(-2, 2), 0.08, 0xc8ccd4, 0.5, 12, 0);
  }
  cast_kit(p, def) {
    for (const q of this.players)
      if (q.alive && Math.hypot(q.pos.x - p.pos.x, q.pos.z - p.pos.z) < 5) {
        q.healT = def.dur;
        if (q !== p) this.ui.toast(q.id, `${p.look.name} curou você`, 'medkit');
      }
    this.audio.play('heal', { volume: 0.8 });
  }
  cast_drone(p, def) {
    this.drones.push({ owner: p, x: p.pos.x, z: p.pos.z, y: 2.2, t: 0, life: def.dur, cd: 0.6, target: null, flash: 0 });
    this.audio.play('generator', { volume: 0.5, pos: p.pos, rate: 2 });
  }
  cast_cloak(p, def) {
    p.cloakT = def.dur;
    this.flowT = 0;
    this.audio.play('swing', { volume: 0.6, pos: p.pos, rate: 0.4 });
  }
  cast_efield(p, def) {
    this.fields.push({ kind: 'elec', owner: p, follow: p, x: p.pos.x, z: p.pos.z, r: 3.2, t: 0, life: def.dur, tick: 0 });
    this.audio.play('generator', { volume: 0.7, pos: p.pos });
  }
  cast_bombard(p) {
    const t = this.aimPoint(p);
    this.bombards.push({ x: t.x, z: t.z, t: 2, max: 2, owner: p });
    this.ui.alert('Bombardeio a caminho — saia do círculo!', 'danger', 'bomb');
    this.audio.play('beep', { volume: 0.8 });
  }
  cast_fury(p, def) {
    p.furyT = def.dur;
    this.audio.play('roar', { volume: 0.8, pos: p.pos, rate: 1.3, priority: true });
    this.noiseShake(0.4);
  }
  cast_haven(p, def) {
    this.fields.push({ kind: 'haven', owner: p, x: p.pos.x, z: p.pos.z, r: 5, t: 0, life: def.dur, tick: 0 });
    this.audio.play('achievement', { volume: 0.7 });
  }

  // granada especial: dentro de um Campo elétrico vira Explosão elétrica (interação)
  specialBlast(pr) {
    const elec = this.fields.find((f) => f.kind === 'elec' && Math.hypot(f.x - pr.x, f.z - pr.z) < f.r + 1);
    if (!elec) {
      this.explosion(pr.x, pr.z, pr.w.radius, pr.w.dmg, pr.owner);
      for (let k = 0; k < 16; k++) this.parts.spawn(pr.x, 0.8, pr.z, rand(-7, 7), rand(2, 7), rand(-7, 7), rand(0.15, 0.3), pick([0x9adcff, 0xffffff]), 0.5, -1, 2);
      return;
    }
    this.explosion(pr.x, pr.z, pr.w.radius * 1.5, pr.w.dmg * 1.3, pr.owner);
    const list = this.zombies.filter((z) => z.alive && Math.hypot(z.pos.x - pr.x, z.pos.z - pr.z) < 7.5).sort((a, b) => Math.hypot(a.pos.x - pr.x, a.pos.z - pr.z) - Math.hypot(b.pos.x - pr.x, b.pos.z - pr.z)).slice(0, 8);
    let fx = pr.x;
    let fz = pr.z;
    for (const z of list) {
      this.addBolt(fx, 1.2, fz, z.pos.x, 1.0, z.pos.z, 0.35);
      fx = z.pos.x;
      fz = z.pos.z;
      z.stunT = 1.6;
      this.damageZombie(z, 60, 0, 0, pr.owner, 0.5);
    }
    for (let k = 0; k < 30; k++) this.parts.spawn(pr.x, 1, pr.z, rand(-9, 9), rand(2, 8), rand(-9, 9), rand(0.1, 0.25), pick([0x7ab8ff, 0xffffff, 0x3ce0ff]), 0.6, -1, 2);
    if (pr.owner) this.ui.toast(pr.owner.id, 'Explosão elétrica! (Granada + Campo)', 'bolt');
    this.audio.play('generator', { volume: 1, pos: pr, rate: 2.2, priority: true });
  }
  addBolt(x1, y1, z1, x2, y2, z2, life = 0.2) {
    const pts = [];
    const n = 7;
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      const j = k && k < n ? 0.35 : 0;
      pts.push([x1 + (x2 - x1) * t + rand(-j, j), y1 + (y2 - y1) * t + rand(-j, j), z1 + (z2 - z1) * t + rand(-j, j)]);
    }
    this.bolts.push({ pts, life, max: life });
  }

  // ------------------------------------------------------------------ habilidades: atualização
  updateAbilities(dt) {
    // campos (elétrico segue o dono; sobrevivência fica no lugar)
    for (const f of this.fields) {
      f.t += dt;
      if (f.follow) {
        if (!f.follow.alive) f.t = f.life;
        f.x = f.follow.pos.x;
        f.z = f.follow.pos.z;
      }
      if (f.kind === 'elec') {
        f.tick -= dt;
        if (f.tick <= 0) {
          f.tick = 0.25;
          let n = 0;
          for (const z of this.zombies) {
            if (!z.alive) continue;
            const d = Math.hypot(z.pos.x - f.x, z.pos.z - f.z);
            if (d > f.r + z.radius) continue;
            z.shockT = 0.35;
            this.damageZombie(z, 7, (z.pos.x - f.x) / (d || 1), (z.pos.z - f.z) / (d || 1), f.owner, 0.3);
            if (n++ < 3) this.addBolt(f.x, 1.6, f.z, z.pos.x, 1.0, z.pos.z, 0.15);
          }
          if (Math.random() < 0.5) this.audio.play('beep', { volume: 0.12, pos: f, rate: rand(1.6, 2.4) });
        }
      }
    }
    compact(this.fields, (f) => f.t < f.life);
    // torres: miram no inimigo mais próximo à vista
    for (const tu of this.turrets) {
      tu.t += dt;
      tu.cd -= dt;
      tu.flash = Math.max(0, tu.flash - dt);
      let best = null;
      let bd = 9;
      for (const z of this.zombies) {
        if (!z.alive) continue;
        const d = Math.hypot(z.pos.x - tu.x, z.pos.z - tu.z);
        if (d < bd && this.arena.los(tu.x, tu.z, z.pos.x, z.pos.z)) {
          bd = d;
          best = z;
        }
      }
      if (best) {
        const want = Math.atan2(best.pos.x - tu.x, best.pos.z - tu.z);
        tu.ang += angDiff(tu.ang, want) * Math.min(1, dt * 10);
        if (tu.cd <= 0 && Math.abs(angDiff(tu.ang, want)) < 0.3) {
          tu.cd = 0.22;
          tu.flash = 0.05;
          this.damageZombie(best, 11, Math.sin(want), Math.cos(want), tu.owner, 0.5);
          this.tracers.push({ x1: tu.x + Math.sin(tu.ang) * 0.5, z1: tu.z + Math.cos(tu.ang) * 0.5, x2: best.pos.x, z2: best.pos.z, life: 0.05 });
          this.audio.play('shot_smg', { volume: 0.22, pos: tu, rate: 1.2 });
        }
      } else tu.ang += dt * 0.8;
      if (tu.t >= tu.life) {
        tu.dead = true;
        for (let k = 0; k < 12; k++) this.parts.spawn(tu.x, 0.6, tu.z, rand(-3, 3), rand(1, 4), rand(-3, 3), rand(0.08, 0.16), pick([0x8a8e96, 0x3a3e46]), 0.9, 14, 0);
      }
    }
    compact(this.turrets, (t) => !t.dead);
    // drones: orbitam o dono e mergulham no inimigo mais próximo
    for (const d of this.drones) {
      d.t += dt;
      d.cd -= dt;
      d.flash = Math.max(0, d.flash - dt);
      const o = d.owner;
      let tx = o.pos.x + Math.sin(d.t * 1.6) * 1.8;
      let tz = o.pos.z + Math.cos(d.t * 1.6) * 1.8;
      if (!d.target || !d.target.alive || Math.hypot(d.target.pos.x - d.x, d.target.pos.z - d.z) > 12) {
        d.target = null;
        let bd = 10;
        for (const z of this.zombies) {
          if (!z.alive) continue;
          const dd = Math.hypot(z.pos.x - o.pos.x, z.pos.z - o.pos.z);
          if (dd < bd) {
            bd = dd;
            d.target = z;
          }
        }
      }
      if (d.target) {
        const a = Math.atan2(d.x - d.target.pos.x, d.z - d.target.pos.z);
        tx = d.target.pos.x + Math.sin(a) * 2.2;
        tz = d.target.pos.z + Math.cos(a) * 2.2;
        if (d.cd <= 0) {
          d.cd = 0.3;
          d.flash = 0.05;
          const dx = d.target.pos.x - d.x;
          const dz = d.target.pos.z - d.z;
          const l = Math.hypot(dx, dz) || 1;
          this.damageZombie(d.target, 8, dx / l, dz / l, o, 0.3);
          this.tracers.push({ x1: d.x, z1: d.z, x2: d.target.pos.x, z2: d.target.pos.z, life: 0.05, color: 0xff6070 });
          this.audio.play('shot_smg', { volume: 0.15, pos: d, rate: 1.6 });
        }
      }
      const k = Math.min(1, dt * 3.5);
      d.x += (tx - d.x) * k;
      d.z += (tz - d.z) * k;
      d.y = 2.2 + Math.sin(d.t * 5) * 0.08;
      if (d.t >= d.life) {
        d.dead = true;
        for (let n = 0; n < 10; n++) this.parts.spawn(d.x, d.y, d.z, rand(-2, 2), rand(0, 2), rand(-2, 2), 0.08, pick([0x2a2a30, 0xff3040, 0x3a80ff]), 0.8, 14, 0);
      }
    }
    compact(this.drones, (d) => !d.dead);
    // bombardeio: aviso de 2 s e 12 explosões
    for (const b of this.bombards) {
      b.t -= dt;
      if (Math.random() < dt * 10) this.parts.spawn(b.x + rand(-0.3, 0.3), 0.2, b.z + rand(-0.3, 0.3), 0, rand(2, 4), 0, 0.14, 0xff4020, 0.8, -1, 2);
      if (b.t <= 0) {
        b.done = true;
        for (let k = 0; k < 12; k++) {
          const a = rand(0, Math.PI * 2);
          const r = k ? Math.sqrt(Math.random()) * 5 : 0;
          const ex = b.x + Math.sin(a) * r;
          const ez = b.z + Math.cos(a) * r;
          this.later(k * 0.12, () => this.explosion(ex, ez, 3.2, 160, b.owner));
        }
      }
    }
    compact(this.bombards, (b) => !b.done);
    // escudo tático destrói projéteis inimigos que chegam perto
    for (const p of this.players) {
      if (!p.alive || p.shieldT <= 0) continue;
      for (const pr of this.projectiles)
        if ((pr.kind === 'acid' || pr.kind === 'rock' || pr.kind === 'spore') && Math.hypot(pr.x - p.pos.x, pr.z - p.pos.z) < 1.6 && pr.y < 3) {
          pr.dead = true;
          for (let k = 0; k < 6; k++) this.parts.spawn(pr.x, pr.y, pr.z, rand(-2, 2), rand(0, 2), rand(-2, 2), 0.07, 0x4fd0ff, 0.4, 0, 2);
        }
    }
    for (const b of this.bolts) b.life -= dt;
    compact(this.bolts, (b) => b.life > 0);
  }

  // efeitos por jogador a cada quadro (recargas, regeneração, cura, investida)
  updatePlayerAbilities(p, dt) {
    for (let i = 0; i < 4; i++) p.cds[i] = Math.max(0, p.cds[i] - dt);
    p.shieldT = Math.max(0, p.shieldT - dt);
    p.furyT = Math.max(0, p.furyT - dt);
    if (p.cloakT > 0) {
      p.cloakT = Math.max(0, p.cloakT - dt);
      if (p.cloakT === 0) this.flowT = 0;
    }
    if (!p.alive) return;
    let regen = this.pv(p, 'regen');
    if (p.healT > 0) {
      p.healT = Math.max(0, p.healT - dt);
      regen += 9;
      if (Math.random() < dt * 14) this.parts.spawn(p.pos.x + rand(-0.4, 0.4), rand(0.2, 1), p.pos.z + rand(-0.4, 0.4), 0, rand(1, 2.5), 0, 0.08, pick([0x60ff80, 0xc8ffd0]), 0.7, -1, 2);
    }
    if (this.inHaven(p)) regen += 6;
    if (regen) p.hp = Math.min(p.maxHp, p.hp + regen * dt);
    if (p.furyT > 0 && Math.random() < dt * 20) this.parts.spawn(p.pos.x + rand(-0.35, 0.35), rand(0.3, 1.6), p.pos.z + rand(-0.35, 0.35), 0, rand(1, 2), 0, rand(0.08, 0.14), pick([0xff5a1a, 0xffb030, 0xff2a10]), 0.45, -1, 2);
    this.updateNavalSet(p);
    this.updateNecroSet(p);
    // montado: os 4 botões de habilidade viram os ataques da montaria (dano real, recarga própria)
    const mounted = p.isMounted && p.mountId ? p.mountId : null;
    const mountedSkills = mounted ? mountSkills(mounted) : null;
    if (mountedSkills && mountedSkills.length) {
      const mk = this.mountKeys;
      const kb = !(this.players.length > 1 && p.id === 1);
      for (let i = 0; i < 4; i++) {
        const sk = mountSkillAt(mounted, i);
        if (!sk) continue;
        if (this.input.anyHit(kb ? [mk[sk.act], ...p.akeys[i]] : p.akeys[i])) this.mountAbility(p, i);
      }
    } else for (let i = 0; i < 4; i++) if (this.input.anyHit(p.akeys[i])) this.useAbility(p, i);
  }

  // ------------------------------------------------------------------ ataques das montarias
  // Um único executor para todas as montarias: os dados vêm de MOUNT_SKILLS e o dano passa pelo
  // sistema real (damageZombie / hitscan / explosion), com recarga em p.sharkCd (o HUD já lê esse array).
  mountAbility(p, slot) {
    if (!p.isMounted || !this.worldMount || this.worldMount.rider !== p) return;
    const sk = mountSkillAt(p.mountId, slot);
    if (!sk) return;
    p.sharkCd = p.sharkCd || [0, 0, 0, 0];
    const now = this.time;
    if (now < p.sharkCd[slot]) {
      this.ui.toast(p.id, `${sk.name}: ${Math.ceil(p.sharkCd[slot] - now)}s`, sk.icon || 'paw', 'bad');
      return;
    }
    if (p.dashT > 0) return; // durante uma investida a montaria não ativa outro golpe
    p.sharkCd[slot] = now + sk.cd;
    const fx = Math.sin(p.aim);
    const fz = Math.cos(p.aim);
    switch (sk.kind) {
      case 'burst': {
        // rajada: cada tiro é um hitscan de verdade (acerta inimigos, cenário e barris)
        const col = sk.color || 0xffc107;
        for (let k = 0; k < (sk.shots || 6); k++) this.later(k * 0.07, () => {
          if (!p.alive || !p.isMounted) return;
          const a = p.aim + rand(-(sk.spread || 0.04), sk.spread || 0.04);
          const mx = p.pos.x + Math.sin(a) * 0.9;
          const mz = p.pos.z + Math.cos(a) * 0.9;
          this.flashes.push({ x: mx, z: mz, life: 0.05 });
          this.projectiles.push({ kind: 'mproj', x: mx, y: 1.0, z: mz, vx: Math.sin(a) * (sk.speed || 26), vz: Math.cos(a) * (sk.speed || 26), ang: a, t: 0, life: sk.range / (sk.speed || 26), dmg: sk.dmg, color: col, trail: col, owner: p, homing: !!sk.homing, aoe: sk.aoe || 0, pierce: sk.pierce || 0, hit: new Set(), radius: sk.radius || 0.22 });
          this.audio.play(sk.sound || 'shot_lmg', { volume: 0.4, pos: p.pos, rate: rand(0.95, 1.05) });
        });
        break;
      }
      case 'cone':
        this.mountHitCone(p, sk.range, sk.arc, sk.dmg, sk);
        this.mountFx(p, 'cone', sk);
        break;
      case 'area':
      case 'nova':
        this.mountHitArea(p, p.pos.x, p.pos.z, sk.radius, sk.dmg, sk);
        this.mountFx(p, sk.kind, sk);
        break;
      case 'bite':
        this.mountHitArea(p, p.pos.x + fx * (sk.offset || 1.6), p.pos.z + fz * (sk.offset || 1.6), sk.radius || 1.6, sk.dmg, sk);
        this.mountFx(p, 'bite', sk);
        break;
      case 'line': {
        const a = p.aim;
        const mx = p.pos.x + Math.sin(a) * 0.9;
        const mz = p.pos.z + Math.cos(a) * 0.9;
        this.projectiles.push({ kind: 'mproj', x: mx, y: 1.0, z: mz, vx: Math.sin(a) * (sk.speed || 30), vz: Math.cos(a) * (sk.speed || 30), ang: a, t: 0, life: sk.range / (sk.speed || 30), dmg: sk.dmg, color: sk.color || 0xff5020, trail: sk.color || 0xff5020, owner: p, homing: false, aoe: 0, pierce: 99, hit: new Set(), radius: sk.width || 0.35 });
        this.mountFx(p, 'line', sk);
        break;
      }
      case 'sides': {
        const ox = Math.cos(p.aim) * (sk.offset || 1.4);
        const oz = -Math.sin(p.aim) * (sk.offset || 1.4);
        this.mountHitArea(p, p.pos.x + ox, p.pos.z + oz, sk.radius, sk.dmg, sk);
        this.mountHitArea(p, p.pos.x - ox, p.pos.z - oz, sk.radius, sk.dmg, sk);
        this.mountFx(p, 'sides', sk);
        break;
      }
      case 'charge':
        p.dashT = sk.dur || 0.42;
        p.dashDir = p.aim;
        p.dashHit = new Set();
        p.dashDmg = sk.dmg ?? 30;
        p.dashKnock = sk.knock ?? 6;
        p.dashRam = sk.ram || 1;
        this.audio.play(sk.sound || 'roar', { volume: 0.8, pos: p.pos, rate: 0.85 });
        this.noiseShake(0.25);
        break;
      case 'fury':
        p.furyT = sk.dur || 8;
        this.audio.play(sk.sound || 'roar', { volume: 0.9, pos: p.pos, rate: 1.1, priority: true });
        this.noiseShake(0.4);
        break;
    }
    this.ui.toast(p.id, sk.name, sk.icon || 'paw');
  }
  // dano em círculo: usa damageZombie (resistências, crítico, empurrão e morte reais)
  mountHitArea(p, cx, cz, radius, dmg, sk = {}) {
    let n = 0;
    for (const z of this.zombies) {
      if (!z.alive) continue;
      const dx = z.pos.x - cx;
      const dz = z.pos.z - cz;
      const d = Math.hypot(dx, dz);
      if (d > radius + z.radius) continue;
      const nx = d ? dx / d : Math.sin(p.aim);
      const nz = d ? dz / d : Math.cos(p.aim);
      this.damageZombie(z, dmg, nx, nz, p, sk.knock ?? 4);
      if (z.alive && sk.stun && !z.def.boss) z.stunT = Math.max(z.stunT || 0, sk.stun);
      if (z.alive && sk.burn) this.applyStatus(z, 'fire', sk.burn, p);
      n++;
    }
    return n;
  }
  // leque frontal: direção e alcance respeitados; nada atrás da montaria é atingido
  mountHitCone(p, range, arc, dmg, sk = {}) {
    let n = 0;
    for (const z of this.zombies) {
      if (!z.alive) continue;
      const dx = z.pos.x - p.pos.x;
      const dz = z.pos.z - p.pos.z;
      const d = Math.hypot(dx, dz);
      if (d > range + z.radius) continue;
      const a = Math.atan2(dx, dz);
      if (d > 0.85 + z.radius && Math.abs(angDiff(p.aim, a)) > (arc || 1) / 2 + z.radius / Math.max(1, d)) continue;
      this.damageZombie(z, dmg, Math.sin(a), Math.cos(a), p, sk.knock ?? 4);
      if (z.alive && sk.stun && !z.def.boss) z.stunT = Math.max(z.stunT || 0, sk.stun);
      n++;
    }
    return n;
  }
  // estocada: retângulo à frente (alcance x largura), sem atingir quem está atrás
  mountHitLine(p, range, width, dmg, sk = {}) {
    const fx = Math.sin(p.aim);
    const fz = Math.cos(p.aim);
    let n = 0;
    for (const z of this.zombies) {
      if (!z.alive) continue;
      const dx = z.pos.x - p.pos.x;
      const dz = z.pos.z - p.pos.z;
      const along = dx * fx + dz * fz;
      const perp = Math.abs(dx * fz - dz * fx);
      if (along < -0.3 || along > range + z.radius || perp > width / 2 + z.radius) continue;
      this.damageZombie(z, dmg, fx, fz, p, sk.knock ?? 4);
      n++;
    }
    return n;
  }
  // efeito visual/sonoro do golpe (o dano já foi aplicado)
  mountFx(p, kind, sk) {
    const fx = Math.sin(p.aim);
    const fz = Math.cos(p.aim);
    const col = { praca: 0xffd040, armazem: 0xffc107, vale: 0xd8b080, distrito: 0xff8020, coliseu: 0xffe080, lab: 0x40ffb0, templo: 0xffb040, naval: 0x40e0ff }[p.mountId] || 0xffc107;
    this.audio.play(sk.sound || 'melee_hit', { volume: 0.7, pos: p.pos, rate: rand(0.85, 1.05) });
    if (kind === 'area' || kind === 'nova') {
      this.noiseShake(0.35);
      for (let k = 0; k < 26; k++) {
        const a = (k / 26) * Math.PI * 2;
        this.parts.spawn(p.pos.x, 0.35, p.pos.z, Math.sin(a) * 9, rand(1, 3), Math.cos(a) * 9, 0.11, pick([col, 0xffffff]), 0.55, 6, 2);
      }
    } else if (kind === 'sides') {
      for (const s of [1, -1]) {
        const ox = p.pos.x + Math.cos(p.aim) * 1.5 * s;
        const oz = p.pos.z - Math.sin(p.aim) * 1.5 * s;
        for (let k = 0; k < 10; k++) this.parts.spawn(ox, 0.6, oz, rand(-3, 3), rand(0.5, 2), rand(-3, 3), 0.08, pick([col, 0xffffff]), 0.3, 0, 2);
      }
    } else {
      const reach = kind === 'line' ? (sk.range || 6) : (sk.range || 2.6);
      for (let k = 0; k < 12; k++) this.parts.spawn(p.pos.x + fx * reach * rand(0.3, 1), rand(0.4, 1.4), p.pos.z + fz * reach * rand(0.3, 1), rand(-2, 2), rand(0.5, 2), rand(-2, 2), 0.08, pick([col, 0xffffff]), 0.3, 0, 2);
      this.noiseShake(0.18);
    }
  }
  // compatibilidade: o teste da Arena 09 chama sharkAbility
  sharkAbility(p, i) { this.mountAbility(p, i); }
  // investida: movimento forçado, atropela quem estiver no caminho
  updateDash(p, dt) {
    p.dashT = Math.max(0, p.dashT - dt);
    const sp = 27.5;
    const dx = Math.sin(p.dashDir);
    const dz = Math.cos(p.dashDir);
    p.vel.set(dx * sp, 0, dz * sp);
    this.arena.move(p.pos, dx * sp * dt, dz * sp * dt, p.radius);
    p.facing = p.dashDir;
    for (let k = 0; k < 3; k++) this.parts.spawn(p.pos.x + rand(-0.25, 0.25), rand(0.2, 1.5), p.pos.z + rand(-0.25, 0.25), -dx * 2, 0, -dz * 2, rand(0.08, 0.16), pick([0x3ab0ff, 0x9adcff]), 0.35, 0, 2);
    const ram = p.dashRam ? 2 : 1;
    for (const z of this.zombies) {
      if (!z.alive || p.dashHit.has(z) || z.def.fly) continue;
      if (Math.hypot(z.pos.x - p.pos.x, z.pos.z - p.pos.z) < z.radius + 0.7) {
        p.dashHit.add(z);
        this.damageZombie(z, (p.dashDmg ?? 30) * ram, dx, dz, p, (p.dashKnock ?? 6) * ram);
      }
    }
    if (p.dashT === 0) p.vel.multiplyScalar(0.2);
  }

  // ------------------------------------------------------------------ habilidades: desenho
  // efeitos presos ao jogador: escudo hexagonal, aura de fúria
  drawPlayerFx(B, G, p) {
    const t = this.time;
    if (p.shieldT > 0) {
      const ending = p.shieldT < 0.8 && Math.sin(t * 30) > 0;
      if (!ending)
        for (let k = 0; k < 14; k++) {
          const a = (k / 14) * Math.PI * 2 + t * 0.8;
          const tier = k % 2;
          G.box(p.pos.x + Math.sin(a) * 0.82, 0.55 + tier * 0.55, p.pos.z + Math.cos(a) * 0.82, 0.34, 0.34, 0.03, tier ? 0x4fd0ff : 0x2a9ad8, a);
        }
      G.box(p.pos.x, 1.62, p.pos.z, 0.7, 0.03, 0.7, 0x4fd0ff, t);
    }
    if (p.furyT > 0) ring(G, p.pos.x, p.pos.z, 0.75, 0xff5a1a, t * 2);
  }
  // pontos ao longo de um raio (só giro em Y no lote: o raio é feito de cubinhos)
  drawBolt(G, pts, color) {
    for (let k = 0; k < pts.length - 1; k++) {
      const [x1, y1, z1] = pts[k];
      const [x2, y2, z2] = pts[k + 1];
      for (let s = 0; s < 3; s++) {
        const f = s / 3;
        G.box(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f, z1 + (z2 - z1) * f, 0.07, 0.07, 0.07, color);
      }
    }
  }
  drawAbilities(B, G) {
    const t = this.time;
    for (const f of this.fields) {
      const fade = Math.min(1, (f.life - f.t) / 0.5, f.t / 0.2);
      if (f.kind === 'elec') {
        ring(G, f.x, f.z, f.r * fade, 0x7ab8ff, t * 3);
        ring(G, f.x, f.z, f.r * 0.6 * fade, 0x3ce0ff, -t * 4);
        // domo: arcos de faíscas subindo do chão até o topo
        for (let k = 0; k < 3; k++) {
          const a = t * 5 + k * 2.1 + Math.random() * 0.4;
          const pts = [];
          for (let s = 0; s <= 5; s++) {
            const q = s / 5;
            const rr = f.r * Math.cos(q * Math.PI * 0.5) * fade;
            pts.push([f.x + Math.sin(a + q * 0.6) * rr + rand(-0.12, 0.12), 0.1 + Math.sin(q * Math.PI * 0.5) * 2.2, f.z + Math.cos(a + q * 0.6) * rr + rand(-0.12, 0.12)]);
          }
          this.drawBolt(G, pts, k % 2 ? 0x9adcff : 0xffffff);
        }
      } else {
        // campo de sobrevivência: anel, colunas de luz e cruz no centro
        ring(G, f.x, f.z, f.r * fade, 0x4fa8ff, t);
        ring(G, f.x, f.z, (f.r - 0.3) * fade, 0x60ff80, -t * 0.7);
        for (let k = 0; k < 16; k++) {
          const a = (k / 16) * Math.PI * 2 + t * 0.3;
          const h = 1.2 + Math.sin(t * 3 + k) * 0.4;
          G.box(f.x + Math.sin(a) * f.r * fade, h / 2, f.z + Math.cos(a) * f.r * fade, 0.06, h, 0.06, k % 2 ? 0x4fa8ff : 0x9ad0ff);
        }
        G.box(f.x, 0.04, f.z, 1.2, 0.02, 0.3, 0x60ff80);
        G.box(f.x, 0.04, f.z, 0.3, 0.02, 1.2, 0x60ff80);
      }
    }
    for (const tu of this.turrets) {
      const c = Math.sin(tu.ang);
      const s = Math.cos(tu.ang);
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2;
        B.box(tu.x + Math.sin(a) * 0.25, 0.2, tu.z + Math.cos(a) * 0.25, 0.07, 0.4, 0.07, 0x3a3e46, a);
      }
      B.box(tu.x, 0.45, tu.z, 0.3, 0.12, 0.3, 0x4a4e56);
      B.box(tu.x, 0.68, tu.z, 0.42, 0.3, 0.42, 0x6a707a, tu.ang);
      B.box(tu.x + c * 0.36, 0.7, tu.z + s * 0.36, 0.08, 0.08, 0.4, 0x2a2c32, tu.ang);
      G.box(tu.x - c * 0.05, 0.86, tu.z - s * 0.05, 0.12, 0.04, 0.12, tu.life - tu.t < 3 && Math.sin(t * 12) > 0 ? 0xff3030 : 0x30ff60);
      if (tu.flash > 0) G.box(tu.x + c * 0.62, 0.7, tu.z + s * 0.62, 0.18, 0.18, 0.18, 0xffd060);
    }
    for (const d of this.drones) {
      B.box(d.x, d.y, d.z, 0.38, 0.12, 0.38, 0x24262c, d.t);
      B.box(d.x, d.y - 0.1, d.z, 0.12, 0.1, 0.12, 0x3a3e46);
      for (let k = 0; k < 4; k++) {
        const a = (k / 4) * Math.PI * 2 + Math.PI / 4 + d.t;
        const ax = d.x + Math.sin(a) * 0.32;
        const az = d.z + Math.cos(a) * 0.32;
        B.box((d.x + ax) / 2, d.y, (d.z + az) / 2, 0.05, 0.04, 0.3, 0x24262c, a);
        G.box(ax, d.y + 0.08, az, 0.26, 0.01, 0.04, 0xd0d4dc, d.t * 30 + k);
      }
      G.box(d.x + 0.12, d.y - 0.02, d.z, 0.06, 0.05, 0.06, Math.sin(t * 8) > 0 ? 0xff3040 : 0x401010);
      G.box(d.x - 0.12, d.y - 0.02, d.z, 0.06, 0.05, 0.06, Math.sin(t * 8) > 0 ? 0x102040 : 0x3a80ff);
      if (d.flash > 0) G.box(d.x, d.y - 0.15, d.z, 0.14, 0.14, 0.14, 0xffd060);
    }
    for (const b of this.bombards) {
      const f = 1 - b.t / b.max;
      ring(G, b.x, b.z, 5.5, 0xff2020, t * 2);
      ring(G, b.x, b.z, 5.5 * (1 - f * 0.9), 0xff8020, -t * 3);
      if (Math.sin(t * 18) > 0) G.box(b.x, 0.2, b.z, 0.25, 0.4, 0.25, 0xff3020);
    }
    for (const bo of this.bolts) if (bo.life > bo.max * 0.3 || Math.random() > 0.5) this.drawBolt(G, bo.pts, Math.random() > 0.5 ? 0xffffff : 0x9adcff);
  }

  removePlaceable(b) {
    b.dead = true;
    const A = this.arena;
    if (!WALK_TRAPS.has(b.kind)) {
      A.dyn[A.idx(b.i, b.j)] = 0;
      this.flowT = 0;
    }
  }

  explosion(x, z, radius, dmg, owner) {
    const A = this.arena;
    for (const zb of this.zombies) {
      if (!zb.alive) continue;
      const d = Math.hypot(zb.pos.x - x, zb.pos.z - z);
      if (d > radius + zb.radius) continue;
      const f = Math.max(0.3, 1 - d / (radius + 0.5));
      const nx = (zb.pos.x - x) / (d || 1);
      const nz = (zb.pos.z - z) / (d || 1);
      this.damageZombie(zb, dmg * f, nx, nz, owner, 6 * f);
    }
    for (const p of this.players) {
      if (!p.alive) continue;
      const d = Math.hypot(p.pos.x - x, p.pos.z - z);
      if (d < radius) this.damagePlayer(p, dmg * (1 - d / radius) * (owner ? 0.25 : 0.8), x, z, 8 * (1 - d / radius), true);
    }
    for (const b of this.placeables) {
      if (b.dead) continue;
      const d = Math.hypot(b.x - x, b.z - z);
      if (d > radius) continue;
      if (b.kind === 'barrel') this.damageBarrel(b, 99);
      else if (b.kind === 'mine' && b.armT <= 0) {
        this.removePlaceable(b);
        this.later(0.12, () => this.explosion(b.x, b.z, 3.2, 140, b.owner));
      } else if (b.kind === 'barricade') {
        b.hp -= dmg * 0.4;
        if (b.hp <= 0) this.removePlaceable(b);
      } else if (b.kind === 'proxmine' && b.armT <= 0 && b.trig === undefined) {
        b.trig = 0.12; // detona em cadeia
      } else if (TRAPS[b.kind] && b.kind !== 'mine' && b.kind !== 'proxmine') this.damageTrap(b, dmg * 0.4);
    }
    for (const c of this.pickups) if (c.type === 'supply' && !c.taken && Math.hypot(c.x - x, c.z - z) < radius) this.openSupply(c, owner);
    // cenário: cones voam, o resto leva dano (sacos de areia e pallets só se desgastam com explosões)
    for (const pr of this.arena.props) {
      if (pr.dead) continue;
      const d = Math.hypot(pr.x - x, pr.z - z);
      if (d > radius + 0.5) continue;
      const nx = (pr.x - x) / (d || 1);
      const nz = (pr.z - z) / (d || 1);
      if (pr.def.knock) this.knockProp(pr, nx, nz, 9 * Math.max(0.3, 1 - d / radius));
      else this.damageProp(pr, dmg * 0.6 * Math.max(0.3, 1 - d / (radius + 0.5)), owner, nx, nz, true);
    }
    for (let k = 0; k < 26; k++) this.parts.spawn(x + rand(-0.5, 0.5), rand(0.3, 1.2), z + rand(-0.5, 0.5), rand(-6, 6), rand(2, 9), rand(-6, 6), rand(0.2, 0.45), pick([0xffd040, 0xff8a20, 0xff5010]), rand(0.35, 0.8), -2, 2);
    for (let k = 0; k < 12; k++) this.parts.spawn(x + rand(-1, 1), rand(0.5, 1.5), z + rand(-1, 1), rand(-1.5, 1.5), rand(1.5, 3), rand(-1.5, 1.5), rand(0.35, 0.6), pick([0x2a2a2a, 0x3a3634, 0x4a4440]), rand(0.8, 1.4), -1.5, 0);
    for (let k = 0; k < 10; k++) this.parts.spawn(x, 0.4, z, rand(-8, 8), rand(4, 10), rand(-8, 8), rand(0.08, 0.15), 0x2a2420, rand(0.6, 1.2), 22, 0);
    A.scorch(x, z, radius * 0.8);
    const l = this.boomLights[this.boomIdx++ % 2];
    l.position.set(x, 2, z);
    l.intensity = 60;
    this.audio.play('explosion', { volume: 0.9, pos: { x, z }, maxDist: 70, priority: true });
    this.noiseShake(0.9);
  }

  noiseShake(a) {
    this.shakeAmt = Math.min(1.2, this.shakeAmt + a);
  }
  later(t, fn) {
    this.timers.push({ t, fn });
  }

  // ------------------------------------------------------------------ multiplicador e desbloqueios
  addMeter(n) {
    for (let k = 0; k < n; k++) {
      this.meter += 0.34 / (1 + (this.mult - 1) * 0.16);
      if (this.meter >= 1) {
        this.meter = Math.max(0.15, this.meter - 1);
        this.mult++;
        this.ui.multPulse();
        if (this.mult > this.maxMult) {
          this.maxMult = this.mult;
          for (const u of UNLOCKS) if (u.level === this.mult) this.unlock(u);
        }
      }
    }
  }
  unlock(u) {
    if (u.only && !u.only.includes(this.arenaDef?.id)) return;
    if (u.weapon) {
      this.unlocked.add(u.weapon);
      for (const p of this.players) {
        p.ammo[u.weapon] = (p.ammo[u.weapon] || 0) + Math.round(WEAPONS[u.weapon].start * (1 + this.pv(p, 'ammo') / 100));
        this.fillClip(p, u.weapon);
      }
    } else this.upg[u.upgrade] = true;
    this.ui.unlockBanner(u.text);
    this.tutHint('unlock');
    this.audio.play('levelup', { volume: 0.8, priority: true });
  }

  // ------------------------------------------------------------------ ondas
  buildWave(w) {
    const coop = this.players.length > 1;
    const bossWave = w % 5 === 0;
    // onda de chefe: 40% menos comuns para o confronto não virar acúmulo de horda
    const n = Math.round((6 + w * 4) * (coop ? 1.35 : 1) * (this.arena.def.diff?.count || 1) * this.diff.mul.count * (bossWave ? 0.6 : 1));
    const list = [];
    // sorteio por peso entre os tipos já liberados; o zumbi comum fica mais raro com o tempo
    const here = (t) => isEnemyAllowedInArena(t, this.arena.def.id);
    const pool = ENEMY_ORDER.filter((t) => !ENEMIES[t].boss && ENEMIES[t].from <= w && here(t)).map((t) => {
      const d = ENEMIES[t];
      const grow = Math.min(2, 1 + (w - d.from) * 0.12);
      return [t, t === 'walker' ? Math.max(3.5, d.weight - w * 0.45) : d.weight * grow];
    });
    const total = pool.reduce((a, [, wt]) => a + wt, 0);
    for (let k = 0; k < n; k++) {
      let r = Math.random() * total;
      let t = 'walker';
      for (const [id, wt] of pool) {
        r -= wt;
        if (r <= 0) {
          t = id;
          break;
        }
      }
      list.push(t);
      // inimigos que chegam em bando (Múmia Guerreira)
      const gr = ENEMIES[t].group || 1;
      for (let g = 1; g < gr && k + 1 < n; g++, k++) list.push(t);
    }
    // o tipo novo aparece garantido na onda em que é liberado
    for (const t of ENEMY_ORDER) if (ENEMIES[t].from === w && !ENEMIES[t].boss && here(t) && !list.includes(t)) list.splice(Math.floor(list.length * 0.3), 0, t);
    // chefão a cada 5 ondas; arenas com lista alternam (Templo: Faraó, Sobek... / Lab: 4 chefões exclusivos)
    const bs = this.arena.def.boss;
    if (w % 5 === 0) {
      const bossId = Array.isArray(bs) ? bs[(w / 5 - 1) % bs.length] : bs || 'boss';
      if (isEnemyAllowedInArena(bossId, this.arena.def.id)) {
        list.unshift(bossId); // entra após o aviso de ameaça (updateWaves)
      }
    }
    return list;
  }

  // ponto aberto dentro da arena para unidades de cerco fixas (ex.: Catapulta no Coliseu)
  // sem bloquear portões nem corredores estreitos
  siegeSpot(rad = 0.9) {
    const A = this.arena;
    const alive = this.players.filter((p) => p.alive);
    for (let tries = 0; tries < 40; tries++) {
      const x = rand(5, A.W - 5);
      const z = rand(5, A.D - 5);
      if (A.circleBlocked(x, z, rad + 0.55)) continue;
      if (A.gates.some((g) => Math.hypot(g.x - x, g.z - z) < 3.5)) continue;
      if (A.props.some((pr) => !pr.dead && Math.hypot(pr.x - x, pr.z - z) < rad + 1.1)) continue;
      if (alive.length && alive.some((p) => Math.hypot(p.pos.x - x, p.pos.z - z) < 7.5)) continue;
      if (this.zombies.some((q) => q.alive && q.def.static && Math.hypot(q.pos.x - x, q.pos.z - z) < 4)) continue;
      return { x, z };
    }
    return null;
  }

  spawnZombie(type, x, z) {
    const def = ENEMIES[type];
    const arenaId = this.arena?.def?.id;
    if (!def || (arenaId && !isEnemyAllowedInArena(type, arenaId))) return null;
    const w = Math.max(1, this.wave);
    const hpMul = def.boss ? 1 + (w / 5 - 1) * 0.45 : 1 + 0.07 * (w - 1);
    const zb = {
      type,
      def,
      pos: new THREE.Vector3(x, 0, z),
      hp: def.fixedHp ? def.hp : def.hp * hpMul * (this.players.length > 1 && def.boss ? 1.4 : 1) * (this.arena.def.diff?.hp || 1) * (def.boss ? this.diff.mul.bossHp : this.diff.mul.enemyHp),
      maxHp: 0,
      speed: def.speed * Math.min(1.3, 1 + 0.015 * (w - 1)) * rand(0.9, 1.1) * (this.arena.def.diff?.speed || 1) * this.diff.mul.enemySpeed,
      scale: def.scale,
      radius: def.radius ?? 0.32 * def.scale,
      wallR: Math.min(0.32 * def.scale, 0.45),
      facing: rand(0, 6.28),
      alive: true,
      attackCd: rand(0.3, 1),
      attackT: 0,
      hurtT: 0,
      walk: rand(0, 6),
      kx: 0,
      kz: 0,
      spitCd: rand(1, 3),
      chargeCd: 4,
      slamCd: 3,
      throwCd: rand(3, 5),
      lobCd: rand(1.5, 3),
      lungeCd: rand(1, 2),
      summonCd: rand(2, 4),
      sporeCd: rand(1.5, 3),
      blinkCd: rand(2, 4),
      contactCd: rand(0, 0.6),
      auraT: rand(0, 0.3),
      stunT: 0,
      shockT: 0,
      buffT: 0,
      deadT: 0,
      strafe: rand(0, 6.28),
      minions: [],
      flyY: 1.4,
      state: 'move',
      stateT: 0,
      rise: def.boss || def.fly ? 0 : 1,
      look: enemyLook(type),
    };
    zb.maxHp = zb.hp;
    zb.regenLeft = def.regen ? def.regen.max : 0; // Construto: cura total limitada
    this.zombies.push(zb);
    if (def.boss) {
      this.boss = zb;
      if (this.state === 'playing') this.releaseMount(zb); // evento real de aparição do chefe
      if (this.state === 'playing') { this.tutHint('boss'); if (this.worldMount) this.tutHint('mount'); }
      if (def.riseIntro) {
        zb.rise = def.riseIntro; // emerge do chão
        for (let k = 0; k < 40; k++) this.parts.spawn(x + rand(-1.5, 1.5), 0.2, z + rand(-1.5, 1.5), rand(-3, 3), rand(2, 6), rand(-3, 3), rand(0.12, 0.25), pick([0xe0c080, 0xd4a020, 0xb08a40]), 1.2, 12, 0);
        this.noiseShake(1.4);
      }
      if (this.state === 'playing') this.ui.banner(def.intro || `${def.name.toUpperCase()} SURGIU!`, 'bad'); // a partida de fundo do menu não avisa
      this.audio.play('boss_roar', { volume: 1, priority: true });
      if (def.introSfx && this.state === 'playing') this.audio.play(def.introSfx, { volume: 0.9, priority: true });
      this.audio.setMusic('boss');
    }
    return zb;
  }

  // arbusto ou árvore de onde a horda embosca: entre 6 e 14 m do jogador mais próximo
  ambushSpot() {
    const A = this.arena;
    const cands = A.props.filter((pr) => !pr.dead && ['bush', 'giantpine', 'pine', 'twisted', 'deadtree'].includes(pr.def.id));
    for (let tries = 0; tries < 8 && cands.length; tries++) {
      const pr = pick(cands);
      let dmin = 1e9;
      for (const p of this.players) if (p.alive) dmin = Math.min(dmin, Math.hypot(p.pos.x - pr.x, p.pos.z - pr.z));
      if (dmin < 6 || dmin > 14) continue;
      for (const [dx, dz] of [[0.9, 0], [-0.9, 0], [0, 0.9], [0, -0.9]]) if (!A.circleBlocked(pr.x + dx, pr.z + dz, 0.35)) return { x: pr.x + dx, z: pr.z + dz };
    }
    return null;
  }
  aliveCap() {
    const k = this.diff?.mul.aliveCap || 1;
    const hard = Math.round((this.settings.quality === 'low' ? 40 : 60) * k); // teto de desempenho
    // curva progressiva: ~10 vivos na onda 1, ~19 na 5, ~30 na 10, teto a partir da ~onda 20
    const ramp = Math.round((8 + 2.2 * Math.max(1, this.wave)) * k * (this.players.length > 1 ? 1.3 : 1));
    return Math.min(hard, ramp);
  }
  countAlive() {
    let n = 0;
    for (const z of this.zombies) if (z.alive) n++;
    return n;
  }
  freeSpotNear(x, z, r) {
    for (const [dx, dz] of [[0.8, 0], [-0.8, 0], [0, 0.8], [0, -0.8], [0.8, 0.8], [-0.8, 0.8], [0.8, -0.8], [-0.8, -0.8], [1.4, 0], [-1.4, 0], [0, 1.4], [0, -1.4]]) {
      if (!this.arena.circleBlocked(x + dx, z + dz, r)) return { x: x + dx, z: z + dz };
    }
    return this.freeSpot(x, z, r);
  }
  // ponto livre mais próximo, procurando em anéis de até 8 m
  freeSpot(x, z, r) {
    const A = this.arena;
    if (!A.circleBlocked(x, z, r)) return { x, z };
    for (let d = 0.5; d <= 8; d += 0.5)
      for (let k = 0, n = Math.ceil(d * 8); k < n; k++) {
        const a = (k / n) * Math.PI * 2;
        const px = x + Math.sin(a) * d;
        const pz = z + Math.cos(a) * d;
        if (!A.circleBlocked(px, pz, r)) return { x: px, z: pz };
      }
    return { x, z };
  }

  updateWaves(dt) {
    if (this.waveState === 'intermission') {
      this.waveT -= dt;
      if (this.waveT <= 0) {
        this.wave++;
        this.waveState = 'active';
        this.toSpawn = this.buildWave(this.wave);
        this.waveTotal = this.toSpawn.length;
        this.spawnT = 0.5;
        this.ui.banner(`ONDA ${this.wave}`, 'wave');
        this.audio.play('wave', { volume: 0.9, priority: true });
        // preparação para o chefe: sinais de ameaça e 6 s sem novos inimigos antes da entrada
        if (this.toSpawn.length && ENEMIES[this.toSpawn[0]].boss) {
          this.spawnT = 6;
          setTimeout(() => this.state === 'playing' && this.ui.banner('AMEAÇA SE APROXIMANDO!', 'bad'), 1600);
          this.audio.play('siren', { volume: 0.7, priority: true });
          this.noiseShake(0.5);
        }
        if (!this.boss) this.audio.setMusic('combat');
        // quem caiu volta
        const alive = this.players.find((p) => p.alive);
        for (const p of this.players)
          if (!p.alive && alive) {
            p.alive = true;
            p.hp = 50;
            const spot = this.freeSpotNear(alive.pos.x, alive.pos.z, p.radius);
            p.pos.set(spot.x, 0, spot.z);
            this.ui.banner(`${p.look.name} VOLTOU!`, 'good');
          }
      }
      return;
    }
    const cap = this.aliveCap();
    this.spawnT -= dt;
    const alive = this.countAlive();
    if (this.toSpawn.length && this.spawnT <= 0 && alive < cap) {
      // ondas 1–3 mais espaçadas para o jogador aprender e se posicionar
      const calm = this.wave <= 3 ? 1.6 - (this.wave - 1) * 0.2 : 1;
      this.spawnT = (Math.max(0.18, 0.75 - this.wave * 0.035) * rand(0.6, 1.3) * calm) / this.diff.mul.spawnRate;
      // só pontos com caminho até os jogadores (evita horda presa em área fechada); portões ficam na borda, por isso olha a vizinhança
      const reach = (q) => {
        const A2 = this.arena;
        if (!A2.dist) return true;
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
          const i = Math.floor(q.x) + di;
          const j = Math.floor(q.z) + dj;
          if (A2.inb(i, j) && A2.dist[i + j * A2.W] < 1e8) return true;
        }
        return false;
      };
      const gates = this.arena.gates.filter((g) => reach(g) && this.players.every((p) => !p.alive || Math.hypot(p.pos.x - g.x, p.pos.z - g.z) > 7));
      let sx;
      let sz;
      // covas, portais, portões monumentais e túneis (longe dos jogadores) também trazem a horda
      const graves = this.arena.graves.filter((g) => reach(g) && this.players.every((p) => !p.alive || Math.hypot(p.pos.x - g.x, p.pos.z - g.z) > 4));
      if (graves.length && Math.random() < (this.arena.def.spawnShare ?? 0.3)) {
        const gv = pick(graves);
        sx = gv.x + rand(-0.2, 0.2);
        sz = gv.z + rand(-0.2, 0.2);
        if (!this.onSpawnPoint(gv)) {
          for (let k = 0; k < 10; k++) this.parts.spawn(gv.x, 0.2, gv.z, rand(-1.5, 1.5), rand(1, 3), rand(-1.5, 1.5), rand(0.08, 0.16), pick([0x5a4a3a, 0x2a2a24]), 0.7, 8, 0);
          this.audio.play('groan1', { volume: 0.4, pos: { x: gv.x, z: gv.z }, rate: rand(0.7, 0.95) });
        }
      } else {
        const g = pick(gates.length ? gates : this.arena.gates.filter(reach).length ? this.arena.gates.filter(reach) : this.arena.gates);
        sx = g.x + rand(-0.3, 0.3);
        sz = g.z + rand(-0.3, 0.3);
        // floresta: parte da horda brota da vegetação, nem perto nem longe demais dos jogadores
        const bush = this.arena.def.theme === 'forest' && !ENEMIES[this.toSpawn[0]].boss && Math.random() < 0.35 ? this.ambushSpot() : null;
        if (bush) {
          sx = bush.x;
          sz = bush.z;
          for (let k = 0; k < 12; k++) this.parts.spawn(sx, 0.4, sz, rand(-2, 2), rand(1, 3), rand(-2, 2), rand(0.06, 0.12), pick([0x2a5a24, 0x3a7a2a, 0x1a3a18]), 0.6, 9, 0);
          this.audio.play('groan1', { volume: 0.45, pos: bush, rate: rand(0.8, 1) });
        }
      }
      const nextType = this.toSpawn.shift();
      if (ENEMIES[nextType]?.siegeSpot) {
        const sp = this.siegeSpot(ENEMIES[nextType].radius || 0.9);
        if (sp) { sx = sp.x; sz = sp.z; }
      }
      const nz = this.spawnZombie(nextType, sx, sz);
      // entrada do chefe: segura a horda comum enquanto ele emerge
      if (nz && nz.def.boss) this.spawnT = Math.max(this.spawnT, (nz.def.riseIntro || 1) + 2.5);
    }
    if (!this.toSpawn.length && alive === 0) {
      this.waveState = 'intermission';
      this.waveT = 5;
      this.stats.score += this.wave * 100;
      this.ui.banner(`ONDA ${this.wave} CONCLUÍDA  +${this.wave * 100}`, 'good');
      if (this.wallet > 0) this.tutHint('shop');
      this.audio.setMusic('ambient');
      if (this.fieldCount() < Math.max(1, Math.round(4 * this.diff.mul.resources))) this.spawnPickup(this.rollField());
    }
  }

  // ------------------------------------------------------------------ itens no mapa
  fieldCount() {
    let n = 0;
    for (const c of this.pickups) if (!c.taken && !c.loot) n++;
    return n;
  }
  hasOwnedAmmo() {
    for (const id of this.unlocked) if (id !== 'pistol') return true;
    return false;
  }
  // itens que aparecem sozinhos pelo mapa
  rollField() {
    const w = this.wave;
    return rollTable([
      ['ammo', this.hasOwnedAmmo() ? 30 : 10],
      ['medkit', 22],
      ['drink', 10],
      ['supply', 12],
      ['vest', 7],
      ['helmet', 5],
      ['backpack', 4],
      ['binoculars', 5],
      ['flashlight', this.arenaDef?.id === 'cemiterio' ? 12 : 4],
      ['radio', w >= 3 ? 4 : 0],
      ['boots', 4],
    ]);
  }
  // conteúdo das caixas de madeira (armas só dão munição se já foram liberadas)
  rollSupply() {
    const has = (id) => this.unlocked.has(id);
    const axeOut = this.upg.axe || this.pickups.some((c) => c.type === 'axe' && !c.taken);
    return rollTable([
      ['medkit', 20],
      ['ammo', this.hasOwnedAmmo() ? 22 : 6],
      ['drink', 14],
      ['vest', 8],
      ['helmet', 6],
      ['backpack', 5],
      ['binoculars', 6],
      ['flashlight', 6],
      ['radio', 5],
      ['grenade', has('grenade') ? 8 : 0],
      ['dynamite', has('dynamite') ? 8 : 0],
      ['shotgun', has('shotgun') ? 5 : 0],
      ['rifle', has('rifle') ? 5 : 0],
      ['pharaoh', has('pharaoh') ? 5 : 0], ['anubis_shotgun', has('anubis_shotgun') ? 5 : 0],
      ['scarab_smg', has('scarab_smg') ? 5 : 0], ['sobek_launcher', has('sobek_launcher') ? 4 : 0],
      ['sphinx_drill', has('sphinx_drill') ? 3 : 0], ['desert_bow', has('desert_bow') ? 5 : 0],
      ['bastet_staff', has('bastet_staff') ? 4 : 0], ['priest_staff', has('priest_staff') ? 4 : 0],
      ['horus_spear', has('horus_spear') ? 3 : 0], ['mummy_blade', has('mummy_blade') ? 2 : 0],
      ['sniper', has('sniper') ? 6 : 0],
      ['axe', !axeOut && this.wave >= 4 ? 3 : 0],
      ['boots', 5],
      ['exo', this.wave >= 4 ? 4 : 0],
      // munição e cargas do arsenal novo (só do que já foi liberado)
      ...['uzi', 'rocket', 'lmg', 'flamer', 'glauncher', 'plasma', 'cryo', 'acidgun', 'egrenade', 'igrenade', 'fgrenade', 'tgrenade', 'proxmine', 'spikes', 'efence', 'ltower', 'ftower', 'itower'].map((id) => [id, has(id) ? (WEAPONS[id].kind === 'place' && TRAPS[id]?.life ? 2 : 4) : 0]),
    ]);
  }

  spawnPickup(type, x, z, from) {
    const A = this.arena;
    if (!type) return false;
    if (x === undefined) {
      for (let tries = 0; tries < 60; tries++) {
        const i = Math.floor(rand(2, A.W - 2));
        const j = Math.floor(rand(2, A.D - 2));
        if (A.blocked(i, j) || A.dist[A.idx(i, j)] > 1e8) continue;
        const cx = i + 0.5;
        const cz = j + 0.5;
        if (this.players.some((p) => Math.hypot(p.pos.x - cx, p.pos.z - cz) < 5)) continue;
        x = cx;
        z = cz;
        break;
      }
      if (x === undefined) return false;
    }
    if (!A.inb(Math.floor(x), Math.floor(z)) || A.circleBlocked(x, z, 0.3)) return false;
    const c = { type, x, z, t: 0, life: type === 'supply' ? 60 : 45, taken: false, loot: !!from, popT: 0 };
    if (from) {
      // salta de dentro da caixa até o ponto de pouso
      c.sx = from.x;
      c.sz = from.z;
      c.popT = 0.45;
    }
    this.pickups.push(c);
    return c;
  }

  // ponto livre ao redor (para itens que saem da caixa)
  lootSpot(x, z) {
    const A = this.arena;
    for (let tries = 0; tries < 12; tries++) {
      const a = rand(0, Math.PI * 2);
      const r = rand(0.9, 1.5);
      const nx = x + Math.sin(a) * r;
      const nz = z + Math.cos(a) * r;
      if (A.inb(Math.floor(nx), Math.floor(nz)) && !A.circleBlocked(nx, nz, 0.3) && !this.pickups.some((c) => !c.taken && Math.hypot(c.x - nx, c.z - nz) < 0.6)) return { x: nx, z: nz };
    }
    return { x, z };
  }

  openSupply(c, by) {
    if (c.taken) return;
    c.taken = true;
    this.audio.play('crate', { volume: 0.9, pos: c, rate: 0.8 });
    for (let k = 0; k < 18; k++) this.parts.spawn(c.x + rand(-0.3, 0.3), rand(0.2, 0.7), c.z + rand(-0.3, 0.3), rand(-4, 4), rand(2, 6), rand(-4, 4), rand(0.08, 0.2), pick([0xc89a5a, 0x8a6232, 0xa87a42]), rand(0.8, 1.4), 18, 0);
    const n = this.wave >= 8 ? 3 : 2;
    for (let k = 0; k < n; k++) {
      const s = this.lootSpot(c.x, c.z);
      this.spawnPickup(this.rollSupply(), s.x, s.z, c);
    }
    if (!this.demo) this.stats.score += 25;
  }

  // efeito de cada item ao ser coletado; false = não serve agora (fica no chão para o parceiro)
  collect(p, c) {
    const it = ITEMS[c.type];
    const packMul = (p.pack ? 1.5 : 1) * (this.upg.doubleAmmo ? 2 : 1) * (1 + this.pv(p, 'ammo') / 100);
    let msg = it.name;
    let ic = it.icon;
    let sound = 'pickup';
    switch (c.type) {
      case 'ammo': {
        let got = 0;
        for (const id of this.unlocked) {
          if (id === 'pistol' || TRAPS[id]?.life) continue; // torres só vêm em caixas de madeira
          p.ammo[id] = (p.ammo[id] || 0) + Math.round(WEAPONS[id].pack * packMul);
          got++;
        }
        p.hp = Math.min(p.maxHp, p.hp + 10);
        msg = got ? 'Munição! +10 vida' : '+10 vida';
        ic = got ? 'ammo' : 'medkit';
        sound = got ? 'ammo' : 'heal';
        break;
      }
      case 'medkit': {
        if (p.hp >= p.maxHp) return false;
        const heal = Math.round(p.maxHp * MEDKIT_HEAL);
        p.hp = Math.min(p.maxHp, p.hp + heal);
        msg = `Kit médico +${heal} vida`;
        sound = 'heal';
        for (let k = 0; k < 12; k++) this.parts.spawn(p.pos.x + rand(-0.4, 0.4), rand(0.3, 1.2), p.pos.z + rand(-0.4, 0.4), 0, rand(1.5, 3), 0, 0.09, pick([0x60ff80, 0xffffff]), 0.7, -1, 2);
        break;
      }
      case 'drink':
        p.energyT = ENERGY_T;
        msg = `Energia! ${ENERGY_T} s mais rápido`;
        sound = 'levelup';
        break;
      case 'vest':
        if (p.armor >= p.maxArmor) return false;
        p.armor = p.maxArmor;
        msg = `Colete: +${p.maxArmor} armadura`;
        sound = 'hit_armor';
        break;
      case 'helmet':
        if (p.helmet) return false;
        p.helmet = true;
        msg = 'Capacete: -40% dano especial';
        sound = 'hit_armor';
        break;
      case 'backpack':
        if (p.pack) return false;
        p.pack = true;
        msg = 'Mochila: +50% munição';
        break;
      case 'binoculars':
        this.scoutT = SCOUT_T;
        msg = `Inimigos marcados por ${SCOUT_T} s`;
        sound = 'beep';
        break;
      case 'flashlight':
        p.lightT = LIGHT_T;
        msg = `Lanterna: ${LIGHT_T} s de bateria`;
        sound = 'reload_in';
        break;
      case 'radio':
        msg = this.callRadio(p);
        sound = 'beep';
        break;
      case 'boots':
        if (p.boots) return false;
        p.boots = true;
        msg = 'Botas: +15% de velocidade';
        sound = 'levelup';
        break;
      case 'exo':
        p.exoT = EXO_T;
        msg = `Exoesqueleto ativo por ${EXO_T} s`;
        sound = 'generator';
        for (let k = 0; k < 14; k++) this.parts.spawn(p.pos.x + rand(-0.4, 0.4), rand(0.3, 1.4), p.pos.z + rand(-0.4, 0.4), rand(-1, 1), rand(1, 2.5), rand(-1, 1), 0.08, pick([0xffc107, 0xffffff]), 0.6, -1, 2);
        break;
      case 'axe':
        if (this.upg.axe) return false;
        this.upg.axe = true;
        this.ui.unlockBanner('Machado (corpo a corpo)');
        msg = 'Machado! Golpeie com F';
        sound = 'levelup';
        break;
      default:
        // pacotes de munição de uma arma específica
        if (it.weapon) {
          const n = Math.round((c.type === 'grenade' ? 3 : WEAPONS[it.weapon].pack) * packMul);
          p.ammo[it.weapon] = (p.ammo[it.weapon] || 0) + n;
          if (p.weapon === it.weapon && WEAPONS[it.weapon].mag && !(p.clip[it.weapon] > 0)) this.startReload(p);
          msg = `${WEAPONS[it.weapon].name} +${n}`;
          ic = 'ammo';
          sound = 'ammo';
        }
    }
    this.audio.play(sound, { volume: 0.8 });
    this.ui.toast(p.id, msg, ic);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      this.parts.spawn(c.x + Math.sin(a) * 0.3, 0.5, c.z + Math.cos(a) * 0.3, Math.sin(a) * 2, rand(2, 3.5), Math.cos(a) * 2, 0.09, it.ring, 0.45, 4, 2);
    }
    if (!this.demo) this.stats.score += 25;
    return true;
  }

  // rádio: ataque aéreo no maior grupo de inimigos (longe dos jogadores); sem alvo, pede suprimentos
  callRadio(p) {
    let best = null;
    let bs = -1;
    for (const z of this.zombies) {
      if (!z.alive) continue;
      if (Math.hypot(z.pos.x - p.pos.x, z.pos.z - p.pos.z) > 22) continue;
      if (this.players.some((q) => q.alive && Math.hypot(q.pos.x - z.pos.x, q.pos.z - z.pos.z) < 4.5)) continue;
      let n = 0;
      for (const o of this.zombies) if (o.alive && Math.hypot(o.pos.x - z.pos.x, o.pos.z - z.pos.z) < 4) n++;
      if (n > bs) {
        bs = n;
        best = z;
      }
    }
    if (best) {
      this.strikes.push({ x: best.pos.x, z: best.pos.z, t: 2.4, max: 2.4, follow: best, owner: p });
      this.ui.alert('Rádio: ataque aéreo a caminho — saia do círculo vermelho!', 'danger', 'radio');
      return 'Ataque aéreo a caminho!';
    }
    const s = this.freeSpotNear(p.pos.x, p.pos.z, 0.4);
    const spot = this.lootSpot(s.x, s.z);
    this.spawnPickup('supply', spot.x, spot.z);
    for (let k = 0; k < 20; k++) this.parts.spawn(spot.x + rand(-0.3, 0.3), rand(2, 5), spot.z + rand(-0.3, 0.3), 0, -rand(2, 5), 0, rand(0.1, 0.2), pick([0x60ff70, 0xffffff]), 0.6, 4, 2);
    return 'Rádio: suprimentos lançados!';
  }

  updateStrikes(dt) {
    for (const s of this.strikes) {
      s.t -= dt;
      // acompanha o grupo até 0,8 s antes do impacto
      if (s.t > 0.8 && s.follow?.alive) {
        s.x += (s.follow.pos.x - s.x) * Math.min(1, dt * 3);
        s.z += (s.follow.pos.z - s.z) * Math.min(1, dt * 3);
      }
      if (Math.random() < dt * 6) this.parts.spawn(s.x, 0.2, s.z, rand(-0.5, 0.5), rand(2, 4), rand(-0.5, 0.5), 0.12, 0xff4020, 0.8, -1, 2);
      if (s.t <= 0) {
        s.done = true;
        for (let k = 0; k < 5; k++) {
          const ex = s.x + (k ? rand(-2.2, 2.2) : 0);
          const ez = s.z + (k ? rand(-2.2, 2.2) : 0);
          this.later(k * 0.14, () => this.explosion(ex, ez, 3.2, 120, s.owner));
        }
      }
    }
    compact(this.strikes, (s) => !s.done);
  }

  // inimigo dentro do feixe de alguma lanterna?
  litBy(z) {
    for (const p of this.players) {
      if (!p.alive || p.lightT <= 0) continue;
      const dx = z.pos.x - p.pos.x;
      const dz = z.pos.z - p.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 11 && Math.abs(angDiff(p.facing, Math.atan2(dx, dz))) < 0.5) return true;
    }
    return false;
  }

  // (legado) caixas antigas: munição ou kit médico
  spawnCrate(x, z) {
    return this.spawnPickup(Math.random() < 0.35 ? 'medkit' : 'ammo', x, z);
  }

  // ------------------------------------------------------------------ atualização
  // celular: se o FPS cair durante a partida, baixa a resolução interna aos poucos; sobe de novo quando sobra folga
  adaptRes(raw) {
    if (!this.input.touchMode || this.state !== 'playing' || !(raw > 0) || raw > 0.5) return;
    const a = this.adapt || (this.adapt = { t: 0, n: 0, scale: 1 });
    a.t += raw;
    a.n++;
    if (a.t < 3) return;
    const fps = a.n / a.t;
    a.t = 0;
    a.n = 0;
    const prev = a.scale;
    if (fps < 42) a.scale = Math.max(0.6, a.scale - 0.15);
    else if (fps > 57) a.scale = Math.min(1, a.scale + 0.1);
    if (a.scale !== prev) {
      this.renderer.setPixelRatio(this.pixelRatio());
      this.resize();
    }
  }

  frame(now) {
    this.adaptRes((now - this.last) / 1000);
    const dt = Math.min(0.05, (now - this.last) / 1000 || 0.016);
    this.last = now;
    if (!this.scene) return;
    this.input.capture = this.state === 'playing'; // Espaço/setas/Enter não rolam a página nem clicam botões
    platform.setPlaying(this.state === 'playing');
    this.pad.update(dt);
    if (this.state === 'playing') {
      this.update(dt);
      this.updateTutorial(dt);
    }
    else if (this.state === 'menu' || this.state === 'select') this.updateDemo(dt);
    this.updateCamera(dt);
    this.draw(dt);
    this.renderer.render(this.scene, this.camera);
    this.ui.fps(dt);
    this.touch.update();
    this.input.endFrame();
  }

  updateDemo(dt) {
    this.menuT += dt;
    this.time += dt;
    // zumbis vagando para a cena do menu
    const A = this.arena;
    for (const z of this.zombies) {
      if (!z.alive) continue;
      z.stateT -= dt;
      if (z.stateT <= 0) {
        z.stateT = rand(2, 5);
        z.facing = rand(0, Math.PI * 2);
      }
      const sp = z.speed * 0.45;
      if (A.move(z.pos, Math.sin(z.facing) * sp * dt, Math.cos(z.facing) * sp * dt, z.wallR)) z.facing += Math.PI * 0.7;
      z.walk += dt * sp * 3;
    }
    this.camTarget.set(A.W / 2 + Math.sin(this.menuT * 0.07) * 10, 0, A.D / 2 + Math.cos(this.menuT * 0.05) * 5);
    this.camDist = 26;
    this.updateEnvironment(dt);
    this.parts.update(dt, null);
    this.audio.listener.x = this.camTarget.x;
    this.audio.listener.z = this.camTarget.z;
  }

  update(dt) {
    this.time += dt;
    this.stats.time += dt;
    const A = this.arena;
    for (let i = this.timers.length - 1; i >= 0; i--) {
      const t = this.timers[i];
      if ((t.t -= dt) <= 0) {
        this.timers.splice(i, 1);
        t.fn();
      }
    }
    if (this.state !== 'playing') return;
    // ambiente (piso elétrico, clima, luzes) roda antes dos jogadores
    this.updateEnvironment(dt);
    // multiplicador decai
    this.meter -= dt * (0.06 + this.mult * 0.006);
    if (this.meter < 0) {
      if (this.mult > 1) {
        this.mult--;
        this.meter = 0.6;
      } else this.meter = 0;
    }
    // mira do mouse
    if (this.mode === 'solo' || this.mode === 'pvp') {
      this.raycaster.setFromCamera(this.input.mouseNdc, this.camera);
      this.raycaster.ray.intersectPlane(this.aimPlane, this.mouseWorld);
    }
    for (let i = 0; i < this.players.length; i++) {
      if (this.mode === 'pvp' && i !== (this.pvpLocalIdx || 0)) continue;
      this.updatePlayer(this.players[i], dt);
    }
    this.updateWorldMount(dt);
    this.flowT -= dt;
    if (this.flowT <= 0) {
      this.flowT = 0.3;
      const src = this.players.filter((p) => p.alive && !(p.cloakT > 0)).map((p) => p.pos);
      if (src.length) A.computeFlow(src);
    }
    this.updateWaves(dt);
    for (const z of this.zombies) if (z.alive) this.updateZombie(z, dt);
    this.separate();
    for (const z of this.corpses) z.deadT += dt;
    compact(this.zombies, (z) => z.alive || z.deadT < 4);
    compact(this.corpses, (z) => z.deadT < 4);
    this.updateProjectiles(dt);
    this.updateClouds(dt);
    this.updateHazards(dt);
    this.updatePlaceables(dt);
    this.updateScenery(dt);
    this.updateAbilities(dt);
    this.updatePickups(dt);
    this.updateCoins(dt);
    this.pvpTick(dt);
    this.updateStrikes(dt);
    this.scoutT = Math.max(0, this.scoutT - dt);
    this.parts.update(dt, (x, z, s) => Math.random() < 0.5 && A.splat(x, z, s * rand(1.2, 2.2), '#7a0a08', 0.75));
    A.updateTexture(dt);
    for (const l of this.boomLights) l.intensity = Math.max(0, l.intensity - dt * 220);
    this.audio.listener.x = this.camTarget.x;
    this.audio.listener.z = this.camTarget.z;
    this.ui.updateHud(dt);
  }

  updatePlayer(p, dt) {
    const inp = this.input;
    p.hurtT = Math.max(0, p.hurtT - dt);
    p.recoil = Math.max(0, p.recoil - dt * 8);
    p.firingT = Math.max(0, p.firingT - dt);
    p.meleeT = Math.max(0, p.meleeT - dt);
    p.meleeCd -= dt;
    p.cxKick = Math.max(0, (p.cxKick || 0) - dt * 4);
    p.hitT = Math.max(0, (p.hitT || 0) - dt);
    p.killT = Math.max(0, (p.killT || 0) - dt);
    p.bloom = Math.max(0, (p.bloom || 0) - dt * (p.firingT > 0.45 ? 0.05 : 0.3));
    this.updateReload(p, dt);
    this.updatePlayerAbilities(p, dt);
    if (!p.alive) {
      p.deadT += dt;
      return;
    }
    if (p.dashT > 0) {
      this.updateDash(p, dt);
      p.fireCd -= dt;
      return;
    }
    if (p.energyT > 0) {
      p.energyT = Math.max(0, p.energyT - dt);
      if (p.energyT === 0) this.ui.toast(p.id, 'Energia acabou', 'drink', 'bad');
    }
    if (p.lightT > 0) {
      p.lightT = Math.max(0, p.lightT - dt);
      if (p.lightT === 0) this.ui.toast(p.id, 'Lanterna sem bateria', 'flashlight', 'bad');
    }
    if (p.exoT > 0) {
      p.exoT = Math.max(0, p.exoT - dt);
      if (p.exoT === 0) this.ui.toast(p.id, 'Exoesqueleto desligado', 'fist', 'bad');
    }
    const c = p.ctl;
    let mx = 0;
    let mz = 0;
    if (inp.any(c.up)) mz -= 1;
    if (inp.any(c.down)) mz += 1;
    if (inp.any(c.left)) mx -= 1;
    if (inp.any(c.right)) mx += 1;
    // direcional virtual (celular)
    if (c.mouse && inp.touchMove) {
      mx += inp.touchMove.x;
      mz += inp.touchMove.z;
    }
    const len = Math.hypot(mx, mz);
    const ter = this.arena.terrainAt(p.pos.x, p.pos.z);
    // montaria: usa velocidade da montaria em vez de velocidade do jogador
    const pvpMDef = this.mode === 'pvp' && p.isMounted && p.pvpMount?.alive ? p.pvpMount.def : null;
    let speed = pvpMDef ? pvpMDef.speed : (p.isMounted && p.mountId !== null ? mountDef(p.mountId).speed : 4.7 * (p.energyT > 0 ? 1.3 : 1) * (ter === T_WATER ? 0.6 : ter === T_BUSH ? 0.7 : 1) * (1 + this.pv(p, 'agility') / 100) * (p.furyT > 0 ? 1.3 : 1) * (p.boots ? 1.15 : 1));
    // metralhadora pesada atirando: passos curtos
    const cw = WEAPONS[p.weapon];
    if (cw.slowFire && p.firingT > 0.3 && !(p.exoT > 0)) speed *= cw.slowFire;
    // exoesqueleto: imune a raízes, lentidão e atordoamento
    if (p.exoT > 0) {
      p.rootT = 0;
      p.slowT = 0;
      p.stunT = 0;
    }
    // terreno contaminado, piso elétrico e efeitos de chefe
    if (ter === T_TOXIC) speed *= 0.65;
    if (this.elecOn && ter === T_ELEC) speed *= 0.8;
    if (p.rootT > 0) {
      p.rootT -= dt;
      speed *= 0.12;
    }
    if (p.stunT > 0) {
      p.stunT -= dt;
      speed = 0;
    }
    if (p.slowT > 0) {
      p.slowT -= dt;
      speed *= p.slowMul ?? 0.6;
    }
    p.onPlat = ter === T_PLATFORM;
    const tx = len ? (mx / len) * speed : 0;
    const tz = len ? (mz / len) * speed : 0;
    const k = 1 - Math.exp(-dt * 14);
    p.vel.x += (tx - p.vel.x) * k;
    p.vel.z += (tz - p.vel.z) * k;
    this.arena.move(p.pos, p.vel.x * dt, p.vel.z * dt, p.radius);
    const hs = Math.hypot(p.vel.x, p.vel.z);
    if (len) this.tryPush(p, mx, mz, dt);
    else p.pushT = 0;
    // lava queima; água espirra
    if (ter === T_LAVA) {
      p.lavaT = (p.lavaT || 0) + dt;
      if (Math.random() < dt * 12) this.parts.spawn(p.pos.x + rand(-0.3, 0.3), 0.2, p.pos.z + rand(-0.3, 0.3), 0, rand(1, 2), 0, 0.1, pick([0xff7a1a, 0xffd040]), 0.4, -1, 2);
      if (p.lavaT >= 0.35) {
        p.lavaT = 0;
        this.damagePlayer(p, 7, p.pos.x, p.pos.z, 0);
      }
    } else p.lavaT = 0;
    if (ter === T_WATER && hs > 1 && Math.random() < dt * 10) this.parts.spawn(p.pos.x + rand(-0.2, 0.2), 0.1, p.pos.z + rand(-0.2, 0.2), rand(-1, 1), rand(1, 2), rand(-1, 1), 0.07, 0xb8e0ff, 0.4, 12, 0);
    // esteira arrasta jogadores e inimigos
    const belt = this.arena.beltAt(p.pos.x, p.pos.z);
    if (belt && p.rootT <= 0) this.arena.move(p.pos, belt[0] * BELT_SPEED * dt, belt[1] * BELT_SPEED * dt, p.radius);
    // contaminação: corrói a vida devagar
    if (ter === T_TOXIC) {
      p.toxicT = (p.toxicT || 0) + dt;
      if (Math.random() < dt * 6) this.parts.spawn(p.pos.x + rand(-0.3, 0.3), 0.3, p.pos.z + rand(-0.3, 0.3), 0, rand(0.6, 1.4), 0, 0.07, 0x8aff4a, 0.5, -0.5, 2);
      if (p.toxicT >= 0.5) {
        p.toxicT = 0;
        this.damagePlayer(p, 3, p.pos.x, p.pos.z, 0, true);
      }
    } else p.toxicT = 0;
    // veneno das flechas do Arqueiro do Deserto
    if (p.poisonT > 0) {
      p.poisonT -= dt;
      p.poisonAcc = (p.poisonAcc || 0) + dt;
      if (Math.random() < dt * 6) this.parts.spawn(p.pos.x + rand(-0.3, 0.3), 1.2, p.pos.z + rand(-0.3, 0.3), 0, rand(0.5, 1.2), 0, 0.06, 0x8aff3a, 0.5, -0.5, 2);
      if (p.poisonAcc >= 0.5) {
        p.poisonAcc = 0;
        this.damagePlayer(p, (p.poisonDps || 4) * 0.5, p.pos.x, p.pos.z, 0, true);
      }
    }
    // piso elétrico ligado: choque e atordoamento curto
    p.shockCd = Math.max(0, (p.shockCd || 0) - dt);
    if (this.elecOn && ter === T_ELEC && p.shockCd <= 0) {
      p.shockCd = 0.7;
      p.slowT = 0.5;
      p.slowMul = 0.7;
      this.damagePlayer(p, 6, p.pos.x, p.pos.z, 0, true);
      this.audio.play('hit_armor', { volume: 0.5, pos: p.pos, rate: 1.6 });
      for (let k = 0; k < 6; k++) this.parts.spawn(p.pos.x + rand(-0.3, 0.3), rand(0.4, 1.2), p.pos.z + rand(-0.3, 0.3), rand(-2, 2), rand(1, 3), rand(-2, 2), 0.05, 0x9adcff, 0.25, 0, 2);
    }
    p.walk += hs * dt * 2.6;
    // direção da mira
    // celular: sem mira manual, o sobrevivente encara o zumbi mais próximo ao alcance
    const tt = c.mouse && (inp.touchMode || (inp.padActive && this.settings.aimMode !== 0)) && !inp.touchAim ? this.touchTarget(p) : null;
    if (c.mouse && inp.touchAim) p.aim = Math.atan2(inp.touchAim.x, inp.touchAim.z);
    else if (tt) p.aim = Math.atan2(tt.pos.x - p.pos.x, tt.pos.z - p.pos.z);
    else if (c.mouse && !inp.mouseIdle) p.aim = Math.atan2(this.mouseWorld.x - p.pos.x, this.mouseWorld.z - p.pos.z);
    else if (len) p.aim = Math.atan2(mx, mz);
    const target = p.firingT > 0 || c.mouse ? p.aim : len ? Math.atan2(mx, mz) : p.facing;
    p.facing += angDiff(p.facing, target) * Math.min(1, dt * 18);
    // armas
    if (inp.anyHit(c.next)) this.cycleWeapon(p, 1);
    if (inp.anyHit(c.prev)) this.cycleWeapon(p, -1);
    if (c.mouse) {
      if (inp.mouse.wheel) this.cycleWeapon(p, inp.mouse.wheel > 0 ? 1 : -1);
      WEAPON_GROUPS.forEach((grp, g) => {
        if (inp.hit(SLOT_CODES[g])) this.selectGroup(p, g);
      });
    }
    if (c.reload && inp.anyHit(c.reload)) this.startReload(p);
    p.fireCd -= dt;
    const wantMelee = inp.any(c.melee) || (c.mouse && inp.mouse.right);
    if (wantMelee && this.mode === 'pvp' && p.isMounted && p.pvpMount?.alive) {
      this.pvpMountAttack(p, true);
    } else if (wantMelee && p.meleeCd <= 0 && p.meleeT <= 0) this.melee(p);
    const wantFire = inp.any(c.fire) || (c.mouse && inp.mouse.left) || (tt && inp.touchMode && this.settings.touchAuto !== false && AUTO_FIRE.has(WEAPONS[p.weapon].kind));
    if (wantFire && p.fireCd <= 0 && p.meleeT <= 0) {
      if (this.mode === 'pvp' && p.isMounted && p.pvpMount?.alive) this.pvpMountAttack(p, false);
      else this.fire(p);
    }

    // --- montaria: entrar/sair com KeyC (borda de subida para não piscar) ---
    // solo/J1: tecla configurável; J2: teclas fixas; controle e toque: botão virtual
    const isP2 = this.players.length > 1 && p.id === 1;
    const pressingMount = inp.anyHit(isP2 && this.mode !== 'pvp' ? [...c.mount, 'VMount2'] : [this.mountKeys.toggle, 'VMount']);
    if (this.mode === 'pvp' && pressingMount) {
      if (p.isMounted) { p.isMounted = false; p.weapon = 'pistol'; }
      else if (p.pvpMount && !p.pvpMount.destroyed && Math.hypot(p.pos.x - p.pvpMount.x, p.pos.z - p.pvpMount.z) <= MOUNT_USE_DIST) { p.isMounted = true; }
    } else if (pressingMount && !p.isMounted && this.worldMount) {
      this.startMount(p, this.worldMount.id);
    } else if (pressingMount && p.isMounted) {
      this.dismount(p);
    }
    // --- fim montaria ---

    if (p.energyT > 0 && hs > 1 && Math.random() < dt * 25) this.parts.spawn(p.pos.x + rand(-0.2, 0.2), 0.15, p.pos.z + rand(-0.2, 0.2), -p.vel.x * 0.2, rand(0.5, 1.5), -p.vel.z * 0.2, 0.08, pick([0x40c8ff, 0xffffff]), 0.35, 0, 2);
    // passos
    if (hs > 1 && Math.floor(p.walk / Math.PI) !== Math.floor((p.walk - hs * dt * 2.6) / Math.PI)) this.audio.play('step' + (1 + Math.floor(Math.random() * 3)), { volume: 0.18, pos: p.pos });
  }

  updateZombie(z, dt) {
    const A = this.arena;
    const def = z.def;
    z.hurtT = Math.max(0, z.hurtT - dt);
    z.attackCd -= dt;
    z.attackT = Math.max(0, z.attackT - dt);
    if (z.rise > 0) z.rise = Math.max(0, z.rise - dt * 2);
    // alvo: sobrevivente vivo mais próximo
    let tgt = null;
    let td = Infinity;
    for (const p of this.players) {
      if (!p.alive || p.cloakT > 0) continue; // camuflado: invisível para a horda
      const d = Math.hypot(p.pos.x - z.pos.x, p.pos.z - z.pos.z);
      if (d < td) {
        td = d;
        tgt = p;
      }
    }
    let vx = 0;
    let vz = 0;
    let speed = z.speed;
    if (tgt) {
      const dx = tgt.pos.x - z.pos.x;
      const dz = tgt.pos.z - z.pos.z;
      const direct = def.fly || (td < 5 && A.walkable(z.pos.x, z.pos.z, tgt.pos.x, tgt.pos.z, z.wallR * 0.9));
      const out = this._fd || (this._fd = {});
      let blockedBy = null;
      if (direct) {
        vx = dx / td;
        vz = dz / td;
      } else if (A.flowDir(z.pos.x, z.pos.z, out)) {
        vx = out.x;
        vz = out.z;
        if (A.dyn[A.idx(out.i, out.j)] === 1) blockedBy = this.placeables.find((b) => !b.dead && b.block && b.i === out.i && b.j === out.j);
      } else {
        vx = dx / td;
        vz = dz / td;
      }
      // recuperação de navegação: 3 s sem progresso longe do alvo → contorna pelo lado por 0,7 s (sem teletransporte)
      z.navT = (z.navT || 0) + dt;
      if (z.navT > 3) {
        const mv = Math.hypot(z.pos.x - (z.navX ?? z.pos.x), z.pos.z - (z.navZ ?? z.pos.z));
        if (mv < 0.3 && td > (def.reach || 1) + 2 && !def.static && !def.spit && !def.siegeSpot && !(z.stunT > 0) && !(z.rise > 0)) {
          z.unstickT = 0.7;
          z.unstickS = Math.random() < 0.5 ? 1 : -1;
          this.navRecoveries = (this.navRecoveries || 0) + 1;
        }
        z.navT = 0;
        z.navX = z.pos.x;
        z.navZ = z.pos.z;
      }
      if (z.unstickT > 0) {
        z.unstickT -= dt;
        const ox = vx;
        vx = vx * 0.35 - vz * z.unstickS;
        vz = vz * 0.35 + ox * z.unstickS;
        const l = Math.hypot(vx, vz) || 1;
        vx /= l;
        vz /= l;
      }
      // cuspidor mantém distância e cospe
      if (def.spit) {
        z.spitCd -= dt;
        if (td < def.spit.range && A.los(z.pos.x, z.pos.z, tgt.pos.x, tgt.pos.z)) {
          if (def.kite && td < def.kite) {
            vx = -vx; // recua para manter distância
            vz = -vz;
          } else if (td < 6) speed = 0;
          // preparação visível (spit.windup): para, mira e brilha antes de soltar; spit.recover: fica parado depois
          if (z.spitCd <= 0 && def.spit.windup && !(z.aimT > 0)) {
            z.aimT = def.spit.windup;
            z.spitCd = def.spit.cd * rand(0.8, 1.2) + def.spit.windup;
          }
          if (z.aimT > 0) {
            speed = 0;
            z.facing = Math.atan2(dx, dz);
            if (Math.random() < dt * 18) this.parts.spawn(z.pos.x + Math.sin(z.facing) * 0.5, 1.3, z.pos.z + Math.cos(z.facing) * 0.5, 0, rand(0.2, 0.6), 0, 0.06, 0xfff0a0, 0.3, 0, 2);
          }
          if (z.aimT > 0 ? (z.aimT -= dt) <= 0 : z.spitCd <= 0) {
            z.aimT = 0;
            if (!def.spit.windup) z.spitCd = def.spit.cd * rand(0.8, 1.2);
            if (def.spit.recover) z.recoverT = def.spit.recover;
            z.attackT = 0.35;
            const T = def.spit.arrow ? Math.max(0.25, td / 18) : Math.max(0.5, td / 9);
            this.projectiles.push({ kind: 'acid', x: z.pos.x, y: 1.2, z: z.pos.z, vx: dx / T, vy: def.spit.arrow ? 7 * T : 4.5, vz: dz / T, t: 0, dmg: def.spit.dmg * (z.auraDmg || 1), color: def.spit.color, splat: def.spit.splat, poison: def.spit.poison, slow: def.spit.slow, pierce: def.spit.pierce });
            this.audio.play(def.spit.sfx || 'spit', { pos: z.pos, volume: 0.7 });
          }
        }
      }
      if (z.aimT > 0 && !(def.spit && td < def.spit.range)) z.aimT = 0; // alvo saiu do alcance: desiste da mira
      if (z.recoverT > 0) {
        z.recoverT -= dt;
        speed = 0;
      }
      this.enemyAbilities(z, tgt, td, dx, dz, dt);
      // dano por contato espectral (def.contact): corre em paralelo ao golpe normal, com recarga própria
      if (def.contact) {
        z.contactCd -= dt;
        if (z.contactCd <= 0 && td < z.radius + tgt.radius + def.contact.radius) {
          z.contactCd = def.contact.cd;
          this.damagePlayer(tgt, def.contact.dmg * (z.auraDmg || 1), z.pos.x, z.pos.z, 2, true);
          for (let k = 0; k < 5; k++) this.parts.spawn(tgt.pos.x + rand(-0.3, 0.3), rand(0.9, 1.8), tgt.pos.z + rand(-0.3, 0.3), rand(-1, 1), rand(0.5, 2), rand(-1, 1), 0.07, pick([0x70e8ff, 0xc0f4ff]), 0.4, 0, 2);
        }
      }
      if (z.state === 'lunge') {
        vx = Math.sin(z.chargeDir);
        vz = Math.cos(z.chargeDir);
        speed = def.lunge.speed;
      } else if (z.state === 'cast' || z.state === 'slam' || z.state === 'throw' || z.state === 'tail' || z.state === 'beam' || (z.state === 'wind' && def.lunge?.windup)) speed = 0;
      // aranha: zigue-zague; invocador: mantém distância; esporo: finca raiz para atirar
      if (def.strafe && td > 2.2 && z.state === 'move') {
        const k = Math.sin(this.time * 3.2 + z.strafe) * 0.75;
        const nx = vx - vz * k;
        const nz = vz + vx * k;
        const l = Math.hypot(nx, nz) || 1;
        vx = nx / l;
        vz = nz / l;
      }
      // formação/matilha (def.formation): coesão com os do mesmo tag; cálculo a cada 0,3 s, não por quadro
      if (def.formation && z.state === 'move') {
        const F = def.formation;
        if (!((z.formT -= dt) > 0)) {
          z.formT = 0.3;
          let cx = 0, cz = 0, n = 0;
          for (const q of this.zombies) {
            if (q === z || !q.alive) continue;
            const qd = Math.hypot(q.pos.x - z.pos.x, q.pos.z - z.pos.z);
            if (q.def.formation?.tag === F.tag && qd < F.radius) {
              cx += q.pos.x;
              cz += q.pos.z;
              n++;
            }
          }
          z.formN = n;
          z.formX = n ? cx / n : 0;
          z.formZ = n ? cz / n : 0;
        }
        if (z.formN > 0 && td > 2.5) {
          const ox = z.formX - z.pos.x;
          const oz = z.formZ - z.pos.z;
          const od = Math.hypot(ox, oz);
          let nx = vx, nz = vz;
          if (od > (F.flank ? 3 : 1.4)) {
            nx += (ox / od) * 0.35; // não se afasta do bloco
            nz += (oz / od) * 0.35;
          }
          if (F.flank) {
            if (z.flankSide === undefined) z.flankSide = ((this._flankN = (this._flankN || 0) + 1) % 3) - 1; // esquerda, centro, direita
            const k = z.flankSide * Math.min(1.2, td / 5); // cada cão abre por um lado e fecha o cerco
            nx -= vz * k;
            nz += vx * k;
          }
          const l = Math.hypot(nx, nz) || 1;
          vx = nx / l;
          vz = nz / l;
          // quem está à frente do bloco espera os outros (o líder não espera)
          if (!F.lead && Math.hypot(tgt.pos.x - z.formX, tgt.pos.z - z.formZ) - td > 1.5) speed *= 0.75;
        }
      }
      // auras de suporte: acelera e reforça o dano de quem está dentro do raio. Varredura a cada 0,3 s e
      // sempre pelo maior valor, para duas fontes (centurião + estandarte) não multiplicarem entre si.
      if (!((z.auraT -= dt) > 0)) {
        z.auraT = 0.3;
        let haste = 1;
        let buff = 1;
        for (const q of this.zombies) {
          if (!q.alive || q === z || !q.def.aura) continue;
          const qd = Math.hypot(q.pos.x - z.pos.x, q.pos.z - z.pos.z);
          if (qd >= q.def.aura.radius) continue;
          if (q.def.aura.haste) haste = Math.max(haste, q.def.aura.haste);
          if (q.def.aura.dmg) buff = Math.max(buff, q.def.aura.dmg);
        }
        z.auraHaste = haste;
        z.auraDmg = buff;
      }
      if (def.summon && td < 6 && A.los(z.pos.x, z.pos.z, tgt.pos.x, tgt.pos.z)) {
        vx = -dx / td;
        vz = -dz / td;
        speed *= 0.8;
      }
      if (def.spore && td < def.spore.range && A.los(z.pos.x, z.pos.z, tgt.pos.x, tgt.pos.z)) speed = 0;
      speed *= z.auraHaste || 1; // estandarte/centurião: valor já sem empilhamento
      // investida do colosso
      if (def.boss) {
        z.chargeCd -= dt;
        if (z.state === 'move' && z.chargeCd <= 0 && td < 14 && td > 4.5) {
          z.state = 'wind';
          z.stateT = 0.8;
          z.chargeDir = Math.atan2(dx, dz);
          this.audio.play('roar', { pos: z.pos, volume: 1, priority: true });
        }
        if (z.state === 'wind') {
          speed = 0;
          z.facing = z.chargeDir;
          if ((z.stateT -= dt) <= 0) {
            z.state = 'charge';
            z.stateT = 1.1;
          }
        } else if (z.state === 'charge') {
          vx = Math.sin(z.chargeDir);
          vz = Math.cos(z.chargeDir);
          speed = 9;
          for (let k = 0; k < 2; k++) this.parts.spawn(z.pos.x + rand(-0.5, 0.5), 0.1, z.pos.z + rand(-0.5, 0.5), rand(-1, 1), rand(1, 2), rand(-1, 1), 0.25, 0x5a4a3a, 0.6, 4, 0);
          // o Devorador atropela o cenário: paredes e caixas se despedaçam
          if (def.bossKind === 'devourer') for (const pr of A.props) {
            if (pr.dead || !pr.def.hp || pr.def.boomOnly) continue;
            if (Math.hypot(pr.x - z.pos.x, pr.z - z.pos.z) < z.radius + 0.9) this.damageProp(pr, 120, null, Math.sin(z.chargeDir), Math.cos(z.chargeDir), true);
          }
          for (const p of this.players)
            if (p.alive && Math.hypot(p.pos.x - z.pos.x, p.pos.z - z.pos.z) < z.radius + 0.6 && !z.chargeHit) {
              z.chargeHit = true;
              this.damagePlayer(p, def.dmg * 1.2, z.pos.x, z.pos.z, 12, true);
            }
          if ((z.stateT -= dt) <= 0) {
            z.state = 'move';
            z.chargeCd = rand(4.5, 7);
            z.chargeHit = false;
          }
        }
      }
      // ataque corpo a corpo
      const reach = def.reach + tgt.radius;
      if (def.fly) z.flyY += ((z.attackT > 0 ? 0.95 : 1.4 + Math.sin(this.time * 3 + z.strafe) * 0.12) - z.flyY) * Math.min(1, dt * 6);
      if (def.explode && td < 1.3) {
        z.hp = 0;
        this.killZombie(z, 0, 0, null);
        return;
      }
      if (z.state === 'move' && def.dmg > 0 && td < reach && (def.fly || A.los(z.pos.x, z.pos.z, tgt.pos.x, tgt.pos.z))) {
        speed = 0;
        if (z.attackCd <= 0) {
          z.attackCd = def.rate * this.diff.mul.aggression;
          z.attackT = 0.35;
          this.audio.play(def.sfx?.attack || 'zombie_attack', { pos: z.pos, volume: 0.6 });
          const target = tgt;
          this.later(0.18, () => {
            if (z.alive && Math.hypot(target.pos.x - z.pos.x, target.pos.z - z.pos.z) < reach * 1.3) {
              this.damagePlayer(target, def.dmg * (1 + 0.04 * (this.wave - 1)) * (z.auraDmg || 1), z.pos.x, z.pos.z, def.boss ? 6 : 1.5);
              if (def.poison) {
                target.poisonT = def.poison.t; // Serpente Sagrada
                target.poisonDps = def.poison.dps;
              }
            }
            if (z.alive && def.quake) this.quake(z, def.quake); // Construto: onda de choque
          });
        }
      } else if (blockedBy && Math.hypot(blockedBy.x - z.pos.x, blockedBy.z - z.pos.z) < 1.0 + z.radius) {
        speed = 0;
        if (z.attackCd <= 0) {
          z.attackCd = def.rate * this.diff.mul.aggression;
          z.attackT = 0.35;
          this.audio.play('melee_hit', { pos: z.pos, volume: 0.4, rate: 0.7 });
          if (blockedBy.kind === 'barricade') {
            blockedBy.hp -= Math.max(6, def.dmg);
            for (let k = 0; k < 3; k++) this.parts.spawn(blockedBy.x, 0.7, blockedBy.z, rand(-2, 2), rand(1, 3), rand(-2, 2), 0.08, 0x8a6a3a, 0.8, 16, 0);
            if (blockedBy.hp <= 0) this.removePlaceable(blockedBy);
          } else this.damageTrap(blockedBy, Math.max(6, def.dmg)); // cerca e torres também apanham
        }
      }
      if (z.state === 'move' && (vx || vz)) {
        // quem recua ou para para atacar continua olhando para o alvo
        const look = def.summon || def.spore || speed === 0 ? Math.atan2(dx, dz) : Math.atan2(vx, vz);
        z.facing += angDiff(z.facing, look) * Math.min(1, dt * 8);
      }
    }
    if (z.rise > 0) speed = 0;
    // ofuscado pela lanterna
    z.lit = z.state === 'move' && this.litBy(z);
    if (z.lit) speed *= 0.65;
    // atordoado (explosão elétrica) não anda nem ataca; eletrocutado anda mais devagar
    if (z.stunT > 0) {
      z.stunT -= dt;
      speed = 0;
      z.attackCd = Math.max(z.attackCd, 0.1);
      if (Math.random() < dt * 10) this.parts.spawn(z.pos.x + rand(-0.3, 0.3), 1.6 * z.scale, z.pos.z + rand(-0.3, 0.3), 0, 0.5, 0, 0.06, 0x9adcff, 0.25, 0, 2);
    }
    if (z.shockT > 0) {
      z.shockT -= dt;
      speed *= 0.65;
    }
    // efeitos elementais: queima, corrosão, gelo, EMP e espinhos
    const sm = this.updateStatus(z, dt);
    if (sm < 0) return;
    speed *= sm;
    // terreno: água e arbusto atrasam, lava queima, contaminação corrói (voadores passam por cima)
    if (!def.fly) {
      const ter = A.terrainAt(z.pos.x, z.pos.z);
      if (ter === T_WATER) speed *= 0.6;
      else if (ter === T_BUSH) speed *= 0.7;
      else if (ter === T_TOXIC) speed *= 0.75;
      if (ter === T_TOXIC) {
        z.toxicT = (z.toxicT || 0) + dt;
        if (z.toxicT >= 0.7) {
          z.toxicT = 0;
          this.damageZombie(z, 4, 0, 0, null, 0);
          if (!z.alive) return;
        }
      }
      if (ter === T_ELEC && this.elecOn) {
        z.elecT = (z.elecT || 0) + dt;
        if (z.elecT >= 0.8) {
          z.elecT = 0;
          z.stunT = Math.max(z.stunT, 0.3);
          this.damageZombie(z, 6, 0, 0, null, 0);
          if (!z.alive) return;
        }
      }
      if (ter === T_LAVA) {
        z.lavaT = (z.lavaT || 0) + dt;
        if (z.lavaT >= 0.4) {
          z.lavaT = 0;
          this.damageZombie(z, 9, 0, 0, null, 0);
          if (!z.alive) return;
        }
      }
    }
    // grito de guerra do General: horda mais rápida
    if (z.buffT > 0) {
      z.buffT -= dt;
      speed *= 1.25;
    }
    // portão fechado: os zumbis tentam arrombar
    if (speed > 0 && def.dmg > 0) {
      for (const gp of this.gateProps) {
        if (gp.dead || !gp.closed) continue;
        if (Math.hypot(gp.x - z.pos.x, gp.z - z.pos.z) > 1.5 + z.radius) continue;
        speed = 0;
        if (z.attackCd <= 0) {
          z.attackCd = def.rate * this.diff.mul.aggression;
          z.attackT = 0.35;
          gp.hp -= Math.max(8, def.dmg);
          this.audio.play('hit_armor', { volume: 0.5, pos: gp, rate: 0.7 });
          for (let k = 0; k < 3; k++) this.parts.spawn(gp.x + rand(-0.5, 0.5), rand(0.4, 1.4), gp.z + rand(-0.5, 0.5), rand(-2, 2), rand(1, 3), rand(-2, 2), 0.06, 0xd8b050, 0.4, 14, 0);
          if (gp.hp <= 0) this.breakGate(gp);
        }
        break;
      }
    }
    const mvx = vx * speed + z.kx;
    const mvz = vz * speed + z.kz;
    z.kx *= Math.exp(-dt * 8);
    z.kz *= Math.exp(-dt * 8);
    if (def.fly) {
      z.pos.x = Math.max(1, Math.min(A.W - 1, z.pos.x + mvx * dt));
      z.pos.z = Math.max(1, Math.min(A.D - 1, z.pos.z + mvz * dt));
    } else A.move(z.pos, mvx * dt, mvz * dt, z.wallR);
    // esteira também arrasta os inimigos
    if (!def.fly && !(z.stunT > 0)) {
      const belt = A.beltAt(z.pos.x, z.pos.z);
      if (belt) A.move(z.pos, belt[0] * BELT_SPEED * dt, belt[1] * BELT_SPEED * dt, z.wallR);
    }
    z.walk += Math.hypot(mvx, mvz) * dt * 2.4;
    if (Math.random() < dt * 0.06) this.audio.play('groan' + (1 + Math.floor(Math.random() * 4)), { pos: z.pos, volume: 0.45, rate: rand(0.85, 1.15) });
  }

  separate() {
    const list = this.zombies;
    const A = this.arena;
    for (let i = 0; i < list.length; i++) {
      const a = list[i];
      if (!a.alive) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j];
        if (!b.alive) continue;
        const dx = b.pos.x - a.pos.x;
        const dz = b.pos.z - a.pos.z;
        const min = a.radius + b.radius;
        const d2 = dx * dx + dz * dz;
        if (d2 >= min * min) continue;
        if (!a.def.fly !== !b.def.fly) continue; // morcego passa por cima de quem anda
        if (d2 < 1e-6) {
          // nasceram no mesmo ponto: separa numa direção qualquer
          this.nudge(b, rand(-0.05, 0.05), rand(-0.05, 0.05));
          continue;
        }
        const d = Math.sqrt(d2);
        const push = (min - d) * 0.5;
        // estruturas fixas (Portal das Almas) não se movem: o outro sai inteiro
        const wa = a.def.static ? 0 : b.def.static ? 2 : a.def.boss ? 0.15 : b.def.boss ? 1.85 : 1;
        this.nudge(a, (-dx / d) * push * wa, (-dz / d) * push * wa);
        this.nudge(b, (dx / d) * push * (2 - wa), (dz / d) * push * (2 - wa));
      }
      for (const p of this.players) {
        if (!p.alive || a.def.fly) continue;
        const dx = a.pos.x - p.pos.x;
        const dz = a.pos.z - p.pos.z;
        const min = a.radius + p.radius;
        const d2 = dx * dx + dz * dz;
        if (d2 < min * min && d2 > 1e-6) {
          const d = Math.sqrt(d2);
          const f = a.def.static ? 0 : a.def.boss ? 0.15 : 0.6; // portal fixo: só o jogador sai
          A.move(a.pos, (dx / d) * (min - d) * f, (dz / d) * (min - d) * f, a.wallR);
          A.move(p.pos, (-dx / d) * (min - d) * (1 - f), (-dz / d) * (min - d) * (1 - f), p.radius);
        }
      }
    }
    // jogadores não se sobrepõem
    if (this.players.length === 2 && this.players[0].alive && this.players[1].alive) {
      const [a, b] = this.players;
      const dx = b.pos.x - a.pos.x;
      const dz = b.pos.z - a.pos.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.66 && d > 1e-4) {
        const push = (0.66 - d) * 0.5;
        A.move(a.pos, (-dx / d) * push, (-dz / d) * push, a.radius);
        A.move(b.pos, (dx / d) * push, (dz / d) * push, b.radius);
      }
    }
  }

  nudge(z, dx, dz) {
    if (z.def.fly) {
      z.pos.x += dx;
      z.pos.z += dz;
    } else this.arena.move(z.pos, dx, dz, z.wallR);
  }

  // habilidades especiais: bote do cão, invocação, esporos, pancada e pedra do colosso
  enemyAbilities(z, tgt, td, dx, dz, dt) {
    const def = z.def;
    const A = this.arena;
    if (def.bossKind === 'pharaoh') this.pharaohTick(z, td, dt);
    if (def.bossKind === 'sobek' && this.sobekTick(z, td, dt)) return;
    if (def.bossKind === 'bastet') this.bastetTick(z, tgt, td, dt);
    if (def.bossKind === 'sphinx' && this.sphinxTick(z, tgt, td, dt)) return;
    if (z.state === 'wind' && def.lunge?.windup) {
      z.facing = z.chargeDir;
      if (Math.random() < dt * 20) this.parts.spawn(z.pos.x + rand(-0.5, 0.5), 0.2, z.pos.z + rand(-0.5, 0.5), 0, rand(0.5, 1.5), 0, 0.08, 0xffd040, 0.4, -1, 2);
      if ((z.stateT -= dt) <= 0) {
        z.state = 'lunge';
        z.stateT = def.lunge.time || 0.38;
      }
      return;
    }
    if (z.state === 'lunge') {
      if (def.lunge?.smash) {
        const cdx = Math.sin(z.chargeDir);
        const cdz = Math.cos(z.chargeDir);
        for (const pr of A.props) {
          if (pr.dead || !pr.def.hp || pr.def.boomOnly) continue;
          if (Math.hypot(pr.x - z.pos.x, pr.z - z.pos.z) < z.radius + 1.15) this.damageProp(pr, 999, null, cdx, cdz, false);
        }
        for (const b of this.placeables) {
          if (b.dead) continue;
          if (Math.hypot(b.x - z.pos.x, b.z - z.pos.z) < z.radius + 0.95) {
            if (b.kind === 'barrel') {
              this.removePlaceable(b);
              this.explosion(b.x, b.z, 3.6, 140, b.owner);
            } else {
              this.removePlaceable(b);
              for (let k = 0; k < 8; k++) this.parts.spawn(b.x + rand(-0.3, 0.3), rand(0.2, 0.9), b.z + rand(-0.3, 0.3), rand(-3, 3), rand(1, 4), rand(-3, 3), 0.1, 0x8a6a3a, 0.7, 16, 0);
              this.audio.play('crate', { pos: b, volume: 0.7 });
            }
          }
        }
      }
      if (!z.chargeHit && td < z.radius + tgt.radius + 0.35) {
        z.chargeHit = true;
        this.damagePlayer(tgt, def.dmg * 1.4 * (z.auraDmg || 1), z.pos.x, z.pos.z, def.lunge?.stun ? 6 : 4, true);
        if (def.lunge?.stun && !(tgt.exoT > 0)) {
          tgt.stunT = Math.max(tgt.stunT || 0, def.lunge.stun);
          this.noiseShake(0.45);
          for (let k = 0; k < 8; k++) this.parts.spawn(tgt.pos.x + rand(-0.35, 0.35), 1.9, tgt.pos.z + rand(-0.35, 0.35), rand(-1.8, 1.8), rand(0.6, 1.8), rand(-1.8, 1.8), 0.08, 0xffd040, 0.55, 0, 2);
        }
      }
      if ((z.stateT -= dt) <= 0) z.state = 'move';
      return;
    }
    if (def.lob) {
      z.lobCd -= dt;
      if (z.state === 'move' && z.lobCd <= 0 && td <= def.lob.range && td >= (def.lob.minRange || 0)) {
        z.state = 'throw';
        z.stateT = def.lob.windup || 1.2;
        z.throwAt = { x: tgt.pos.x, z: tgt.pos.z };
        z.facing = Math.atan2(dx, dz);
        this.audio.play('crate', { pos: z.pos, volume: 0.5, rate: 0.65 });
      }
      if (z.state === 'throw' && z.throwAt) {
        z.facing += angDiff(z.facing, Math.atan2(z.throwAt.x - z.pos.x, z.throwAt.z - z.pos.z)) * Math.min(1, dt * 6);
        if (Math.random() < dt * 22) this.parts.spawn(z.pos.x + rand(-0.4, 0.4), 2.0, z.pos.z + rand(-0.4, 0.4), rand(-0.8, 0.8), rand(0.8, 2.2), rand(-0.8, 0.8), 0.09, pick([def.lob.color || 0xff6a1a, 0xffd040]), 0.45, 0, 2);
        if ((z.stateT -= dt) <= 0) {
          z.state = 'move';
          z.lobCd = def.lob.cd * rand(0.85, 1.15);
          z.attackT = 0.45;
          const ex = z.throwAt.x - z.pos.x;
          const ez = z.throwAt.z - z.pos.z;
          const T = Math.max(0.75, Math.hypot(ex, ez) / 11);
          this.projectiles.push({ kind: 'rock', x: z.pos.x, y: 2.2, z: z.pos.z, vx: ex / T, vy: 7 * T - 2.2 / T, vz: ez / T, t: 0, T, dmg: def.lob.dmg * (z.auraDmg || 1), r: def.lob.radius || 1.9, color: def.lob.color || 0xff6a1a });
          this.audio.play(def.sfx?.attack || 'throw', { pos: z.pos, volume: 0.85, rate: 0.6 });
        }
        return;
      }
    }
    if (def.lunge) {
      z.lungeCd -= dt;
      const pathOk = def.lunge.smash ? A.los(z.pos.x, z.pos.z, tgt.pos.x, tgt.pos.z) : A.walkable(z.pos.x, z.pos.z, tgt.pos.x, tgt.pos.z, z.wallR);
      if (z.state === 'move' && z.lungeCd <= 0 && td < def.lunge.range && td > 1.4 && pathOk) {
        z.state = def.lunge.windup ? 'wind' : 'lunge'; // Carruagem e Hórus avisam antes de investir
        z.stateT = def.lunge.windup || def.lunge.time || 0.38;
        z.chargeHit = false;
        z.chargeDir = Math.atan2(dx, dz);
        z.facing = z.chargeDir;
        z.lungeCd = def.lunge.cd * (def.lunge.jitter ? rand(1 - def.lunge.jitter, 1 + def.lunge.jitter) : rand(0.8, 1.2)); // besta: intervalo irregular
        this.audio.play('zombie_attack', { pos: z.pos, volume: 0.7, rate: 1.4 });
      }
    }
    if (def.summon) {
      z.summonCd -= dt;
      z.minions = z.minions.filter((m) => m.alive);
      if (z.state === 'move' && z.summonCd <= 0 && (td < 16 || def.static) && z.minions.length < def.summon.max && this.countAlive() < this.aliveCap()) {
        z.state = 'cast';
        z.stateT = def.summon.windup || 0.9; // Portal das Almas avisa por mais tempo
        this.audio.play('roar', { pos: z.pos, volume: 0.6, rate: 1.6 });
      }
      if (z.state === 'cast') {
        z.facing += angDiff(z.facing, Math.atan2(dx, dz)) * Math.min(1, dt * 8);
        const sc = def.summon.color || 0xc070ff;
        if (Math.random() < dt * 30) this.parts.spawn(z.pos.x + rand(-0.8, 0.8), 0.1, z.pos.z + rand(-0.8, 0.8), 0, rand(1.5, 3), 0, rand(0.08, 0.16), pick([sc, def.summon.color ? 0xffe080 : 0x8a3ad0]), 0.7, -1, 2);
        if ((z.stateT -= dt) <= 0) {
          z.state = 'move';
          z.summonCd = def.summon.cd * rand(0.85, 1.2);
          for (let k = 0; k < def.summon.n && this.countAlive() < this.aliveCap(); k++) {
            // procura um ponto livre ao redor (fora do corpo de quem invoca, longe de paredes)
            const rr = Math.max(1.3, z.radius + 0.9);
            let x = 0;
            let zz = 0;
            let free = false;
            for (let tries = 0; tries < 8 && !free; tries++) {
              const a = rand(0, 6.28);
              x = z.pos.x + Math.sin(a) * rr;
              zz = z.pos.z + Math.cos(a) * rr;
              free = !A.circleBlocked(x, zz, 0.35);
            }
            if (!free) continue;
            const allowedSummons = def.summon.types.filter((t) => isEnemyAllowedInArena(t, this.arena?.def?.id));
            if (!allowedSummons.length) continue;
            const m = this.spawnZombie(pick(allowedSummons), x, zz);
            if (!m) continue;
            m.summoned = true; // invocados não pagam moedas
            z.minions.push(m);
            for (let j = 0; j < 10; j++) this.parts.spawn(x, 0.3, zz, rand(-1.5, 1.5), rand(2, 4), rand(-1.5, 1.5), rand(0.1, 0.2), pick([0xc070ff, 0xe0a0ff]), 0.7, 3, 2);
          }
        }
      }
    }
    if (def.regen && z.regenLeft > 0 && z.hp < z.maxHp) {
      const hl = Math.min(def.regen.rate * dt, z.regenLeft, z.maxHp - z.hp);
      z.hp += hl;
      z.regenLeft -= hl;
      if (Math.random() < dt * 4) this.parts.spawn(z.pos.x + rand(-0.6, 0.6), rand(0.5, 2), z.pos.z + rand(-0.6, 0.6), 0, rand(0.5, 1.5), 0, 0.08, pick([0xe0c080, 0xf0c840]), 0.6, -1, 2);
    }
    if (def.blink) {
      // Espectro: some e reaparece mais perto do alvo, num ponto livre
      z.blinkCd -= dt;
      if (z.state === 'move' && z.blinkCd <= 0 && td < def.blink.range && td > 3) {
        const step = Math.min(def.blink.dist, td - 1.6);
        const nx = z.pos.x + (dx / td) * step;
        const nz = z.pos.z + (dz / td) * step;
        z.blinkCd = def.blink.cd * rand(0.8, 1.2);
        if (A.inb(Math.floor(nx), Math.floor(nz)) && (def.blink.through || !A.circleBlocked(nx, nz, 0.3))) {
          for (let k = 0; k < 12; k++) this.parts.spawn(z.pos.x + rand(-0.3, 0.3), rand(0.6, 1.8), z.pos.z + rand(-0.3, 0.3), rand(-1.5, 1.5), rand(0, 1.5), rand(-1.5, 1.5), rand(0.06, 0.12), pick([def.blink.color || 0x70e8ff, 0xc0f4ff]), 0.5, -1, 2);
          z.pos.x = nx;
          z.pos.z = nz;
          for (let k = 0; k < 12; k++) this.parts.spawn(nx + rand(-0.3, 0.3), rand(0.6, 1.8), nz + rand(-0.3, 0.3), rand(-1.5, 1.5), rand(0, 1.5), rand(-1.5, 1.5), rand(0.06, 0.12), pick([def.blink.color || 0x70e8ff, 0xc0f4ff]), 0.5, -1, 2);
          this.audio.play('swing', { pos: z.pos, volume: 0.5, rate: 0.6 });
        }
      }
    }
    if (def.spore) {
      z.sporeCd -= dt;
      if (z.sporeCd <= 0 && td < def.spore.range && A.los(z.pos.x, z.pos.z, tgt.pos.x, tgt.pos.z)) {
        z.sporeCd = def.spore.cd * rand(0.85, 1.2);
        z.attackT = 0.35;
        const T = Math.max(0.6, td / 8);
        const ex = tgt.pos.x + tgt.vel.x * T * 0.5 - z.pos.x;
        const ez = tgt.pos.z + tgt.vel.z * T * 0.5 - z.pos.z;
        this.projectiles.push({ kind: 'spore', x: z.pos.x, y: 1.6, z: z.pos.z, vx: ex / T, vy: 7 * T - 1.6 / T, vz: ez / T, t: 0, T, def: def.spore });
        this.audio.play('spit', { pos: z.pos, volume: 0.6, rate: 0.6 });
      }
    }
    if (def.boss) {
      z.slamCd -= dt;
      z.throwCd -= dt;
      if (z.state === 'move' && z.slamCd <= 0 && td < 3.4) {
        z.state = 'slam';
        z.stateT = 0.75;
        this.audio.play('roar', { pos: z.pos, volume: 0.9, priority: true });
      } else if (z.state === 'move' && z.throwCd <= 0 && td > 5 && td < 15 && A.los(z.pos.x, z.pos.z, tgt.pos.x, tgt.pos.z)) {
        z.state = 'throw';
        z.stateT = 0.6;
        z.throwAt = { x: tgt.pos.x, z: tgt.pos.z };
      }
      if (z.state === 'slam' || z.state === 'throw') z.facing += angDiff(z.facing, Math.atan2(dx, dz)) * Math.min(1, dt * 5);
      if (z.state === 'slam' && (z.stateT -= dt) <= 0) {
        z.state = 'move';
        z.slamCd = rand(4, 6);
        const R = 3.8;
        for (const p of this.players) {
          const d = Math.hypot(p.pos.x - z.pos.x, p.pos.z - z.pos.z);
          if (p.alive && d < R) this.damagePlayer(p, def.dmg * (1 - (d / R) * 0.5), z.pos.x, z.pos.z, 11, true);
        }
        for (let k = 0; k < 36; k++) {
          const a = (k / 36) * 6.28;
          this.parts.spawn(z.pos.x + Math.sin(a) * 1.2, 0.2, z.pos.z + Math.cos(a) * 1.2, Math.sin(a) * 7, rand(1, 3), Math.cos(a) * 7, rand(0.2, 0.35), pick([0x5a4a44, 0x6a5a52, 0xff5a1a]), 0.6, 10, 0);
        }
        A.scorch(z.pos.x, z.pos.z, 2.2);
        this.audio.play('stomp', { volume: 1, pos: z.pos, priority: true });
        this.noiseShake(1.2);
        const kind = def.bossKind;
        // Esfinge: cada pancada solta uma onda de choque larga
        if (kind === 'sphinx') this.quake(z, { radius: 6.5, dmg: 16 });
        // Operário Mutante: onda elétrica (dano extra + lentidão)
        if (kind === 'mechworker') {
          for (const p of this.players) {
            const d = Math.hypot(p.pos.x - z.pos.x, p.pos.z - z.pos.z);
            if (p.alive && d < 5.6) {
              this.damagePlayer(p, 16 * (1 - (d / 5.6) * 0.5), z.pos.x, z.pos.z, 6, true);
              p.slowT = 1.6;
              p.slowMul = 0.55;
            }
          }
          for (let k = 0; k < 28; k++) {
            const a = (k / 28) * 6.28;
            this.parts.spawn(z.pos.x + Math.sin(a) * 1.4, 0.35, z.pos.z + Math.cos(a) * 1.4, Math.sin(a) * 8, rand(1, 2), Math.cos(a) * 8, rand(0.06, 0.12), pick([0x3fe0ff, 0x9adcff, 0xffd060]), 0.5, 2, 2);
          }
          this.audio.play('hit_armor', { volume: 0.8, pos: z.pos, rate: 0.6 });
        }
        // Guardião da Floresta: raízes prendem quem está por perto e solta esporos
        if (kind === 'guardian') {
          for (const p of this.players) {
            const d = Math.hypot(p.pos.x - z.pos.x, p.pos.z - z.pos.z);
            if (p.alive && d < 6.2) {
              this.damagePlayer(p, 12, z.pos.x, z.pos.z, 4, true);
              p.rootT = 1.8;
            }
          }
          this.addCloud(z.pos.x, z.pos.z, { radius: 2.4, dps: 8, life: 5 });
          for (let k = 0; k < 22; k++) {
            const a = (k / 22) * 6.28;
            this.parts.spawn(z.pos.x + Math.sin(a) * 1.2, 0.2, z.pos.z + Math.cos(a) * 1.2, Math.sin(a) * 4, rand(1, 3), Math.cos(a) * 4, rand(0.1, 0.2), pick([0x4a6a24, 0x8a4ad0, 0x5a3a22]), 0.9, 6, 0);
          }
          this.audio.play('groan1', { volume: 0.9, pos: z.pos, rate: 0.5 });
        }
        // General Infectado: grito de guerra + reforços
        if (kind === 'general') {
          for (const q of this.zombies) {
            if (!q.alive || q === z) continue;
            if (Math.hypot(q.pos.x - z.pos.x, q.pos.z - z.pos.z) < 13) {
              q.buffT = 6;
              q.hp = Math.min(q.maxHp, q.hp + q.maxHp * 0.12);
            }
          }
          for (let k = 0; k < 3 && this.countAlive() < this.aliveCap(); k++) {
            const a = rand(0, 6.28);
            const x = z.pos.x + Math.sin(a) * 1.6;
            const zz = z.pos.z + Math.cos(a) * 1.6;
            if (A.circleBlocked(x, zz, 0.35)) continue;
            this.spawnZombie(pick(['walker', 'armored', 'runner']), x, zz);
          }
          for (let k = 0; k < 18; k++) {
            const a = (k / 18) * 6.28;
            this.parts.spawn(z.pos.x + Math.sin(a) * 1.2, 1.2, z.pos.z + Math.cos(a) * 1.2, Math.sin(a) * 3, rand(1, 2), Math.cos(a) * 3, 0.08, pick([0xb01c1c, 0xff5a1a]), 0.7, 0, 2);
          }
          this.audio.play('roar', { volume: 1, pos: z.pos, priority: true, rate: 0.7 });
        }
        // Chefões exclusivos do Laboratório (colossa, abominable, exogeneral)
        if (kind === 'colossa') {
          this.bossCall(z, ['lb_pack', 'lb_pack']);
        }
        if (kind === 'abominable') {
          this.quake(z, { radius: 5.5, dmg: 22, stun: 0.8 });
        }
        if (kind === 'exogeneral') {
          for (const q of this.zombies) {
            if (!q.alive || q === z) continue;
            if (Math.hypot(q.pos.x - z.pos.x, q.pos.z - z.pos.z) < 13) q.buffT = 6;
          }
          this.bossCall(z, ['lb_hunter', 'lb_pack']);
        }
      }
      if (z.state === 'throw' && (z.stateT -= dt) <= 0) {
        z.state = 'move';
        z.throwCd = rand(4, 6.5);
        const ex = z.throwAt.x - z.pos.x;
        const ez = z.throwAt.z - z.pos.z;
        const T = Math.max(0.7, Math.hypot(ex, ez) / 10);
        this.projectiles.push({ kind: 'rock', x: z.pos.x, y: 3.2, z: z.pos.z, vx: ex / T, vy: 7 * T - 3.2 / T, vz: ez / T, t: 0, T, dmg: def.dmg * 0.7 });
        this.audio.play('throw', { pos: z.pos, volume: 1, rate: 0.5 });
      }
    }
  }

  addCloud(x, z, sp) {
    this.clouds.push({ x, z, r: sp.radius, life: sp.life, max: sp.life, dps: sp.dps, tick: 0 });
    this.arena.splat(x, z, sp.radius * 0.8, '#5a2a7a', 0.6);
    for (let k = 0; k < 14; k++) this.parts.spawn(x + rand(-0.5, 0.5), 0.3, z + rand(-0.5, 0.5), rand(-2.5, 2.5), rand(1, 3), rand(-2.5, 2.5), rand(0.15, 0.3), pick([0xb060ff, 0x8a3ad0]), 0.8, 2, 2);
    this.audio.play('splash', { pos: { x, z }, volume: 0.6, rate: 0.6 });
  }

  updateClouds(dt) {
    for (const c of this.clouds) {
      c.life -= dt;
      c.tick -= dt;
      if (c.tick <= 0) {
        c.tick = 0.5;
        for (const p of this.players) if (p.alive && Math.hypot(p.pos.x - c.x, p.pos.z - c.z) < c.r + p.radius * 0.5) this.damagePlayer(p, c.dps * 0.5, c.x, c.z, 0, true);
      }
      if (Math.random() < dt * 8) this.parts.spawn(c.x + rand(-c.r, c.r) * 0.7, 0.2, c.z + rand(-c.r, c.r) * 0.7, rand(-0.3, 0.3), rand(0.6, 1.4), rand(-0.3, 0.3), rand(0.08, 0.16), 0xc080ff, 1, -0.5, 2);
    }
    compact(this.clouds, (c) => c.life > 0);
  }

  updateProjectiles(dt) {
    const A = this.arena;
    for (const pr of this.projectiles) {
      pr.t += dt;
      if (pr.kind === 'bolt' || pr.kind === 'glob' || pr.kind === 'lobgren' || pr.kind === 'dart' || pr.kind === 'mproj') {
        if (this.updateNewProjectile(pr, dt)) pr.dead = true;
        continue;
      }
      if (pr.kind === 'grenade' || pr.kind === 'dynamite' || pr.kind === 'sgrenade' || pr.kind.startsWith('g_')) {
        if (pr.kind === 'sgrenade' && Math.random() < dt * 30) this.parts.spawn(pr.x, pr.y, pr.z, rand(-0.5, 0.5), rand(0, 1), rand(-0.5, 0.5), 0.06, pick([0x9adcff, 0xffffff]), 0.3, 0, 2);
        const dyn = pr.kind === 'dynamite';
        // pavio aceso soltando faíscas
        if (dyn && Math.random() < dt * 40) this.parts.spawn(pr.x, pr.y + 0.25, pr.z, rand(-1, 1), rand(1, 2.5), rand(-1, 1), 0.05, pick([0xffd040, 0xff8a20, 0xffffff]), 0.25, 6, 2);
        pr.vy -= 18 * dt;
        const nx = pr.x + pr.vx * dt;
        const nz = pr.z + pr.vz * dt;
        if (A.tallAt(nx, pr.z) || (A.blocked(Math.floor(nx), Math.floor(pr.z)) && pr.y < 1)) pr.vx *= -0.5;
        else pr.x = nx;
        if (A.tallAt(pr.x, nz) || (A.blocked(Math.floor(pr.x), Math.floor(nz)) && pr.y < 1)) pr.vz *= -0.5;
        else pr.z = nz;
        pr.y += pr.vy * dt;
        if (pr.y < 0.12) {
          pr.y = 0.12;
          if (pr.vy < -2) this.audio.play('bounce', { pos: pr, volume: 0.4 });
          pr.vy *= dyn ? -0.2 : -0.4;
          pr.vx *= dyn ? 0.35 : 0.6;
          pr.vz *= dyn ? 0.35 : 0.6;
        }
        if (pr.t > pr.fuse) {
          pr.dead = true;
          if (pr.kind === 'sgrenade') this.specialBlast(pr);
          else if (pr.kind.startsWith('g_')) this.elementBlast(pr);
          else this.explosion(pr.x, pr.z, pr.w.radius, pr.w.dmg, pr.owner);
        }
      } else if (pr.kind === 'rocket') {
        // teleguiado: vira até 3,5 rad/s na direção do alvo travado
        if (pr.homing?.alive) {
          const want = Math.atan2(pr.homing.pos.x - pr.x, pr.homing.pos.z - pr.z);
          const cur = Math.atan2(pr.vx, pr.vz);
          const a = cur + Math.max(-3.5 * dt, Math.min(3.5 * dt, angDiff(cur, want)));
          const sp = Math.hypot(pr.vx, pr.vz);
          pr.vx = Math.sin(a) * sp;
          pr.vz = Math.cos(a) * sp;
        }
        pr.x += pr.vx * dt;
        pr.z += pr.vz * dt;
        const ra = Math.atan2(pr.vx, pr.vz);
        const bx = pr.x - Math.sin(ra) * 0.42, bz = pr.z - Math.cos(ra) * 0.42;
        this.parts.spawn(bx, pr.y, bz, rand(-0.45, 0.45), rand(0.25, 0.75), rand(-0.45, 0.45), rand(0.18, 0.3), 0x8a8e96, 0.55, -1, 0);
        if (Math.random() < 0.65) this.parts.spawn(bx, pr.y, bz, rand(-0.3, 0.3), rand(-0.1, 0.3), rand(-0.3, 0.3), rand(0.08, 0.14), pick([0xff6a18, 0xffd040]), 0.22, 0, 2);
        let hit = A.tallAt(pr.x, pr.z) || pr.t > 1.6;
        if (!hit) for (const z of this.zombies) if (z.alive && Math.hypot(z.pos.x - pr.x, z.pos.z - pr.z) < z.radius + 0.2) hit = true;
        if (!hit) for (const b of this.placeables) if (!b.dead && !WALK_TRAPS.has(b.kind) && Math.hypot(b.x - pr.x, b.z - pr.z) < 0.55) hit = true;
        if (hit) {
          pr.dead = true;
          this.explosion(pr.x - pr.vx * dt, pr.z - pr.vz * dt, pr.w.radius, pr.w.dmg, pr.owner);
        }
      } else if (pr.kind === 'spore' || pr.kind === 'rock') {
        pr.vy -= 14 * dt;
        pr.x += pr.vx * dt;
        pr.z += pr.vz * dt;
        pr.y += pr.vy * dt;
        if (pr.kind === 'spore' && Math.random() < dt * 20) this.parts.spawn(pr.x, pr.y, pr.z, 0, 0.3, 0, 0.08, 0xc080ff, 0.5, 0, 2);
        if (pr.y <= 0.1 || pr.t > 4) {
          pr.dead = true;
          if (pr.kind === 'spore') this.addCloud(pr.x, pr.z, pr.def);
          else {
            const rr = pr.r || 1.9;
            for (const p of this.players) {
              const d = Math.hypot(p.pos.x - pr.x, p.pos.z - pr.z);
              if (p.alive && d < rr) this.damagePlayer(p, pr.dmg * (1 - d / (rr * 2)), pr.x, pr.z, 7, true);
            }
            for (let k = 0; k < 14; k++) this.parts.spawn(pr.x, 0.3, pr.z, rand(-4, 4), rand(2, 6), rand(-4, 4), rand(0.12, 0.28), pick([0x5a4a44, 0x6a5a52, 0xff5a1a]), 1, 18, 0);
            this.arena.scorch(pr.x, pr.z, 1.4);
            this.audio.play('stomp', { volume: 0.8, pos: pr });
            this.noiseShake(0.5);
          }
        }
      } else if (pr.kind === 'acid') {
        pr.vy -= 14 * dt;
        pr.x += pr.vx * dt;
        pr.z += pr.vz * dt;
        pr.y += pr.vy * dt;
        let hit = false;
        for (const p of this.players)
          if (p.alive && Math.hypot(p.pos.x - pr.x, p.pos.z - pr.z) < 0.5 && pr.y < 1.6) {
            this.damagePlayer(p, pr.dmg, pr.x, pr.z, 1, true);
            if (pr.slow) {
              p.slowT = pr.slow.t; // maldição: lentidão
              p.slowMul = pr.slow.mul;
            }
            if (pr.poison) {
              p.poisonT = pr.poison.t; // flecha envenenada: dano contínuo
              p.poisonDps = pr.poison.dps;
            }
            hit = true;
          }
        // coberturas baixas (muretas, sacos de areia, barreiras, caixas) barram o ácido
        const ck = Math.floor(pr.x) + Math.floor(pr.z) * A.W;
        if (!pr.pierce && A.inb(Math.floor(pr.x), Math.floor(pr.z)) && A.cover[ck] && pr.y < 0.95) hit = true; // flecha perfurante passa
        if (hit || pr.y <= 0.05 || A.tallAt(pr.x, pr.z)) {
          pr.dead = true;
          A.splat(pr.x, pr.z, 0.45, pr.splat || '#6aba2a', 0.7);
          for (let k = 0; k < 6; k++) this.parts.spawn(pr.x, 0.2, pr.z, rand(-2, 2), rand(1, 3), rand(-2, 2), 0.08, pr.color || 0x8aff4a, 0.5, 14, 2);
          this.audio.play('splash', { pos: pr, volume: 0.5 });
        }
      }
    }
    compact(this.projectiles, (p) => !p.dead);
  }

  updatePlaceables(dt) {
    for (const b of this.placeables) {
      if (b.dead) continue;
      b.armT -= dt;
      if (b.kind === 'mine' && b.armT <= 0) {
        for (const z of this.zombies)
          if (z.alive && Math.hypot(z.pos.x - b.x, z.pos.z - b.z) < 0.7 + z.radius) {
            this.removePlaceable(b);
            this.audio.play('beep', { pos: b, volume: 0.8 });
            this.later(0.1, () => this.explosion(b.x, b.z, 3.2 * (this.upg.bigBoom ? 1.4 : 1), 140, b.owner));
            break;
          }
      }
    }
    this.updateTraps(dt);
    compact(this.placeables, (b) => !b.dead);
  }

  updatePickups(dt) {
    this.crateT -= dt;
    if (this.crateT <= 0) {
      this.crateT = rand(9, 14);
      if (this.fieldCount() < Math.max(1, Math.round(4 * this.diff.mul.resources))) this.spawnPickup(this.rollField());
    }
    for (const c of this.pickups) {
      c.t += dt;
      if (c.popT > 0) {
        c.popT = Math.max(0, c.popT - dt);
        continue;
      }
      for (const p of this.players) {
        if (!p.alive || c.taken) continue;
        if (Math.hypot(p.pos.x - c.x, p.pos.z - c.z) < (c.type === 'supply' ? 0.95 : 0.9)) {
          if (c.type === 'supply') this.openSupply(c, p);
          else if (this.collect(p, c)) c.taken = true;
        }
      }
    }
    compact(this.pickups, (c) => !c.taken && c.t < c.life); // itens esquecidos somem
  }

  gameOver() {
    if (this.state !== 'playing') return;
    this.state = 'gameover';
    this.tut = null; // as dicas voltam na próxima partida (só somem de vez com "Pular" ou ao terminar)
    this.ui.tutorial(-1);
    this.audio.setMusic(null);
    this.audio.play('gameover', { volume: 0.9, priority: true });
    const coinsLost = this.loseCoinsOnDeath(); // 100% do saldo temporário, uma única vez
    const pf = this.profile(); // antes de gravar o recorde, para não creditar esta partida duas vezes
    const key = `${this.arenaDef.id}_${this.mode}`;
    const rec = this.records();
    if (this.firstPrev === undefined) this.firstPrev = rec[key] || null;
    const prev = this.firstPrev; // recorde de antes desta partida (mesmo depois de continuar)
    const isRecord = !prev || this.stats.score > prev.score;
    if (isRecord) {
      rec[key] = { score: this.stats.score, wave: this.wave, mult: this.maxMult, date: Date.now(), diff: this.diff.id };
      try {
        platform.setItem(RECORDS_KEY, JSON.stringify(rec));
      } catch {
        /* ignora */
      }
    }
    this.canvas.style.cursor = 'default';
    const before = pf.level;
    const gained = Math.max(0, Math.round(matchXp(this.stats.score, this.wave) * this.diff.mul.xp) - this.xpCredited);
    this.xpCredited += gained;
    this.addProfileXp(pf, gained);
    this.saveProfile(pf);
    const unlocked = ARENAS.filter((a) => (a.unlock || 1) > before && (a.unlock || 1) <= pf.level).map((a) => a.name);
    this.lastXp = { gained, before, level: pf.level, cur: pf.xp, need: profileNeed(pf.level), unlocked, doubled: false };
    this.ui.showScreen('gameover', { isRecord, prev, xp: this.lastXp, cont: this.canContinue(), coins: { lost: coinsLost, earned: this.econ?.earned || 0, spent: this.econ?.spent || 0 } });
  }

  // ------------------------------------------------------------------ câmera e desenho
  updateCamera(dt) {
    if (this.state === 'playing' || this.state === 'paused' || this.state === 'gameover') {
      const alive = this.players.filter((p) => p.alive);
      const localP = this.mode === 'pvp' ? this.players[this.pvpLocalIdx || 0] : null;
      const list = localP ? [localP] : (alive.length ? alive : this.players);
      let cx = 0;
      let cz = 0;
      for (const p of list) {
        cx += p.pos.x;
        cz += p.pos.z;
      }
      cx /= list.length;
      cz /= list.length;
      let spread = 0;
      for (const p of list) spread = Math.max(spread, Math.abs(p.pos.x - cx) * 0.75, Math.abs(p.pos.z - cz) * 1.3);
      // telas estreitas (retrato) precisam de mais distância para ver o mesmo pedaço da arena
      const aspectK = Math.min(1.8, Math.max(1, 1.45 / this.camera.aspect));
      // luneta (sniper no solo ou PvP com mouse): câmera avança na direção da mira e se afasta para ver longe
      const sp = localP || this.players[0];
      const scope = (this.mode === 'solo' || this.mode === 'pvp') && this.state === 'playing' && sp?.alive && sp.weapon === 'sniper' && !this.input.mouseIdle;
      this.scopeK += ((scope ? 1 : 0) - (this.scopeK || 0)) * Math.min(1, dt * 4);
      if (this.scopeK > 0.01) {
        const ox = this.mouseWorld.x - sp.pos.x;
        const oz = this.mouseWorld.z - sp.pos.z;
        const l = Math.hypot(ox, oz) || 1;
        const m = Math.min(7, l * 0.45) * this.scopeK;
        cx += (ox / l) * m;
        cz += (oz / l) * m;
      }
      const want = Math.min(48, Math.max(17, 9 + spread * 2.2) * aspectK) + (this.scopeK || 0) * 5;
      this.camDist += (want - this.camDist) * Math.min(1, dt * 3);
      const k = Math.min(1, dt * 6);
      this.camTarget.x += (cx - this.camTarget.x) * k;
      this.camTarget.z += (cz + 0.5 - this.camTarget.z) * k;
    }
    const pitch = 1.0;
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 3);
    const s = this.shakeAmt * 0.25;
    this.camera.position.set(this.camTarget.x + rand(-s, s), Math.sin(pitch) * this.camDist, this.camTarget.z + Math.cos(pitch) * this.camDist + rand(-s, s));
    this.camera.lookAt(this.camTarget.x, 0, this.camTarget.z);
  }

  draw(dt) {
    const B = this.B;
    const G = this.G;
    B.begin();
    G.begin();
    for (const [k, p] of this.players.entries()) {
      const gl = GUN_LEN[p.weapon];
      // lanterna: feixe saindo do ombro na direção em que o jogador olha
      const spot = this.spots[k];
      if (spot) {
        if (p.alive && p.lightT > 0) {
          const sx = p.pos.x + Math.sin(p.facing) * 0.25 - Math.cos(p.facing) * 0.2;
          const sz = p.pos.z + Math.cos(p.facing) * 0.25 + Math.sin(p.facing) * 0.2;
          spot.position.set(sx, 1.35, sz);
          spot.target.position.set(p.pos.x + Math.sin(p.facing) * 8, 0, p.pos.z + Math.cos(p.facing) * 8);
          spot.intensity = p.lightT < 3 && Math.sin(this.time * 40) > 0.3 ? 15 : 140;
        } else spot.intensity = 0;
      }
      if (!p.alive) {
        drawCharacter(B, p.pos.x, 0.18, p.pos.z, p.facing, 0.95, p.look, { tilt: -Math.PI / 2 * Math.min(1, p.deadT * 3), walk: 0, swing: 0, G });
        continue;
      }
      const hs = Math.hypot(p.vel.x, p.vel.z);
      const gear = [];
      if (p.armor > 0) gear.push(...GEAR.vest);
      if (p.pack) gear.push(...GEAR.backpack);
      if (p.helmet) gear.push(...GEAR.helmet);
      if (p.lightT > 0) gear.push(...GEAR.flashlight);
      if (p.boots) gear.push(...GEAR.boots);
      if (p.exoT > 0 && (p.exoT > 3 || Math.sin(this.time * 14) > 0)) gear.push(...GEAR.exo);
      const m = p.meleeT > 0 ? MELEE[p.meleeKind] : null;
      // camuflado: desenhado como holograma ciano (lote emissivo, sem sombra), piscando
      const cloak = p.cloakT > 0;
      if (!cloak || Math.random() > 0.08) {
        const look = cloak ? p.holoLook || (p.holoLook = holoLook(p.look)) : p.look;
        const mountedDef = p.isMounted
          ? (this.mode === 'pvp' ? (p.pvpMount?.alive ? p.pvpMount.def : null) : (this.worldMount && this.worldMount.rider === p ? this.worldMount.def : null))
          : null;
        const seatY = mountedDef ? mountedDef.seatY : 0;
        const seatZ = mountedDef ? mountedDef.seatZ : 0;
        const px = p.pos.x + Math.sin(p.facing) * seatZ;
        const pz = p.pos.z + Math.cos(p.facing) * seatZ;
        drawCharacter(cloak ? G : B, px, seatY, pz, p.facing, 0.95, look, {
          walk: mountedDef ? 0 : p.walk, swing: mountedDef ? 0 : Math.min(1, hs / 4) * 0.8, aim: p.firingT > 0 || this.mode === 'solo', recoil: p.recoil, hurt: cloak ? 0 : p.hurtT,
          reload: p.reloadT > 0 ? 1 - p.reloadT / p.reloadMax : 0,
          gun: gl ? { len: gl, color: WEAPONS[p.weapon].color, model: GUN_MODELS[p.weapon] } : null, G,
          melee: m ? { model: GUN_MODELS[m.id], k: 1 - p.meleeT / p.meleeDur, a0: m.a0, a1: m.a1 } : null,
          gear: gear.length && !cloak ? gear : null,
        });
      }
      this.drawPlayerFx(B, G, p);
      // recarga: anel que se completa em volta do jogador
      if (p.reloadT > 0) {
        const f = 1 - p.reloadT / p.reloadMax;
        const seg = Math.ceil(f * 12);
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          G.box(p.pos.x + Math.sin(a) * 0.62, 0.05, p.pos.z + Math.cos(a) * 0.62, 0.2, 0.02, 0.06, k < seg ? 0xffc107 : 0x2e3440, a + Math.PI / 2);
        }
      }
      // marcador do jogador no chão
      const c = p.color;
      G.box(p.pos.x, 0.03, p.pos.z - 0.48, 0.9, 0.02, 0.06, c);
      G.box(p.pos.x, 0.03, p.pos.z + 0.48, 0.9, 0.02, 0.06, c);
      G.box(p.pos.x - 0.48, 0.03, p.pos.z, 0.06, 0.02, 0.9, c);
      G.box(p.pos.x + 0.48, 0.03, p.pos.z, 0.06, 0.02, 0.9, c);
      // indicador da direção de tiro
      G.box(p.pos.x + Math.sin(p.aim) * 0.85, 0.04, p.pos.z + Math.cos(p.aim) * 0.85, 0.12, 0.02, 0.12, c);
    }
    if (this.mode === 'pvp') {
      for (const pl of this.players) {
        if (pl.pvpMount && pl.pvpMount.alive) drawMount(B, G, pl.pvpMount, this.time, false);
      }
    }
    if (this.worldMount && this.worldMount.alive) {
      const wm = this.worldMount;
      const near = !wm.rider && this.players.some((pl) => pl.alive && Math.hypot(wm.x - pl.pos.x, wm.z - pl.pos.z) <= MOUNT_USE_DIST);
      drawMount(B, G, wm, this.time, near);
    }
    const scout = this.scoutT > 0;
    for (const z of this.zombies) {
      drawEnemy(B, G, z, this.time);
      if (!z.alive) continue;
      if (z.def.aura?.ring) ring(G, z.pos.x, z.pos.z, z.def.aura.radius, z.def.aura.ring, this.time); // raio da aura visível no chão
      this.drawStatus(G, z);
      // binóculos: marcador vermelho sobre cada inimigo
      if (scout) {
        const top = z.def.fly ? (z.flyY || 1.4) + 0.75 : 2.05 * z.scale;
        const bob = Math.sin(this.time * 6 + z.strafe) * 0.06;
        G.box(z.pos.x, top + bob, z.pos.z, 0.2, 0.2, 0.2, 0xff3030, this.time * 2);
        G.box(z.pos.x, top + bob - 0.2, z.pos.z, 0.08, 0.14, 0.08, 0xff3030);
      }
      // avisos no chão: investida, pancada e alvo da pedra do colosso
      if (z.state === 'wind') G.box(z.pos.x + Math.sin(z.facing) * 2, 0.03, z.pos.z + Math.cos(z.facing) * 2, 0.6, 0.02, 3, 0xff2020, z.facing);
      if (z.state === 'slam') ring(G, z.pos.x, z.pos.z, 3.8 * Math.min(1, (0.75 - z.stateT) / 0.6 + 0.3), 0xff3020, this.time);
      if (z.state === 'throw' && z.throwAt) ring(G, z.throwAt.x, z.throwAt.z, z.def.lob?.radius || 1.9, z.def.lob?.color || 0xff8020, this.time);
    }
    for (const pr of this.projectiles) if (pr.kind === 'rock') ring(G, pr.x + pr.vx * Math.max(0, pr.T - pr.t), pr.z + pr.vz * Math.max(0, pr.T - pr.t), pr.r || 1.9, pr.color || 0xff8020, this.time);
    for (const c of this.clouds) {
      const f = Math.min(1, c.life / 0.6, (c.max - c.life) / 0.3 + 0.3);
      for (let k = 0; k < 9; k++) {
        const a = this.time * 0.7 + k * 0.698;
        const rr = c.r * (0.25 + (k % 3) * 0.28);
        const sz = (0.45 + (k % 2) * 0.2) * f;
        G.box(c.x + Math.sin(a) * rr, 0.25 + (k % 3) * 0.22 + Math.sin(this.time * 2 + k) * 0.08, c.z + Math.cos(a) * rr, sz, sz * 0.7, sz, k % 2 ? 0x8a3ad0 : 0x6a2aa8, a);
      }
      ring(G, c.x, c.z, c.r, 0x9a4ae0, this.time);
    }
    this.drawHazards(G, this.time);
    // rádio: alvo do ataque aéreo (anel que fecha) e sinalizador
    for (const s of this.strikes) {
      const f = 1 - s.t / s.max;
      ring(G, s.x, s.z, 3.2, 0xff2020, this.time * 2);
      ring(G, s.x, s.z, 3.2 * (1 - f * 0.85), 0xff8020, -this.time * 3);
      if (Math.sin(this.time * 18) > 0) G.box(s.x, 0.15, s.z, 0.18, 0.3, 0.18, 0xff3020);
    }
    for (const pr of this.projectiles) {
      if (this.drawNewProjectile(B, G, pr, drawItem)) continue;
      if (pr.kind === 'grenade') drawItem(B, G, 'grenade', pr.x, pr.y, pr.z, pr.t * 8, 0.85);
      else if (pr.kind === 'sgrenade') {
        drawItem(B, G, 'grenade', pr.x, pr.y, pr.z, pr.t * 10, 0.9);
        G.box(pr.x, pr.y, pr.z, 0.3, 0.06, 0.3, 0x9adcff, pr.t * 10);
      }
      else if (pr.kind === 'dynamite') {
        drawItem(B, G, 'dynamite', pr.x, pr.y, pr.z, pr.t * 6, 0.75);
        if (Math.random() < 0.7) G.box(pr.x + Math.sin(pr.t * 6) * 0.06, pr.y + 0.3, pr.z + Math.cos(pr.t * 6) * 0.06, 0.07, 0.07, 0.07, 0xffd040);
      } else if (pr.kind === 'rocket') {
        const a = Math.atan2(pr.vx, pr.vz);
        const sa = Math.sin(a), ca = Math.cos(a);
        const bodyC = pr.w?.color || 0x4a5a4a;
        const fl = 0.14 + Math.sin(this.time * 45 + pr.t * 20) * 0.04;
        // corpo metálico + faixa de alerta amarela
        B.box(pr.x, pr.y, pr.z, 0.18, 0.18, 0.62, bodyC, a);
        B.box(pr.x + sa * 0.16, pr.y, pr.z + ca * 0.16, 0.195, 0.195, 0.09, 0xffc107, a);
        // ogiva vermelha pontuda
        B.box(pr.x + sa * 0.36, pr.y, pr.z + ca * 0.36, 0.15, 0.15, 0.2, 0xe53935, a);
        B.box(pr.x + sa * 0.49, pr.y, pr.z + ca * 0.49, 0.09, 0.09, 0.12, 0xff5252, a);
        // aletas estabilizadoras na cauda
        B.box(pr.x - sa * 0.24, pr.y, pr.z - ca * 0.24, 0.38, 0.05, 0.18, 0x262a32, a);
        B.box(pr.x - sa * 0.24, pr.y, pr.z - ca * 0.24, 0.05, 0.38, 0.18, 0x262a32, a);
        // propulsor aceso (chama laranja + núcleo amarelo)
        G.box(pr.x - sa * 0.42, pr.y, pr.z - ca * 0.42, fl, fl, 0.26, 0xff6a18, a);
        G.box(pr.x - sa * 0.38, pr.y, pr.z - ca * 0.38, fl * 0.6, fl * 0.6, 0.16, 0xfff080, a);
      } else if (pr.kind === 'rock') {
        B.box(pr.x, pr.y, pr.z, 0.7, 0.6, 0.7, 0x5e504a, pr.t * 5);
        G.box(pr.x, pr.y, pr.z, 0.5, 0.64, 0.12, 0xff5a1a, pr.t * 5);
      } else if (pr.kind === 'spore') G.box(pr.x, pr.y, pr.z, 0.3, 0.3, 0.3, 0xb060ff, pr.t * 4);
      else G.box(pr.x, pr.y, pr.z, 0.18, 0.18, 0.18, pr.color || 0x8aff4a, pr.t * 6);
    }
    this.arena.drawProps(B, G, this.time);
    // piso elétrico energizado, chuva e progresso das interações
    if (this.elecOn) {
      const blink = Math.sin(this.time * 16) > -0.3;
      const W = this.arena.W;
      for (const k of this.arena.elecCells) {
        const i = k % W;
        const j = Math.floor(k / W);
        if (!blink) continue;
        G.box(i + 0.5, 0.045, j + 0.5, 0.86, 0.03, 0.86, 0x3aa0ff);
        G.box(i + 0.5, 0.06, j + 0.5, 0.1, 0.04, 0.72, 0xd8f0ff);
      }
    }
    for (const d of this.rain) if (d.on) G.box(d.x, d.y, d.z, 0.04, 0.55, 0.04, 0xa8cce8);
    for (const pr of this.arena.props) {
      if (pr.dead || !(pr.holdT > 0) || !pr.holdNeed) continue;
      const f = Math.min(1, pr.holdT / pr.holdNeed);
      const seg = Math.ceil(f * 8);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 - Math.PI / 2;
        G.box(pr.x + Math.sin(a) * 0.9, 1.15, pr.z + Math.cos(a) * 0.9, k < seg ? 0.15 : 0.09, 0.06, 0.15, k < seg ? 0xffc107 : 0x3a3f4a, a);
      }
    }
    this.drawAbilities(B, G);
    for (const b of this.placeables) {
      if (this.drawTrap(B, G, b, this.time)) continue;
      if (b.kind === 'barrel') {
        for (const q of BARREL_MODEL) B.box(b.x + q[0], q[1], b.z + q[2], q[3], q[4], q[5], q[6]);
      } else if (b.kind === 'barricade') {
        const f = b.hp / b.maxHp;
        const c = f > 0.6 ? 0x9a7444 : f > 0.3 ? 0x7a5a34 : 0x5a4026;
        B.box(b.x, 0.35, b.z, 0.98, 0.7, 0.98, c);
        B.box(b.x, 0.85, b.z, 0.98, 0.3, 0.7, c);
        B.box(b.x, 0.55, b.z, 1.05, 0.12, 0.12, 0x5a3a1a, 0.6);
        B.box(b.x, 0.55, b.z, 1.05, 0.12, 0.12, 0x5a3a1a, -0.6);
      } else {
        B.box(b.x, 0.05, b.z, 0.5, 0.1, 0.5, 0x2a2a2a);
        if (b.armT <= 0 && Math.sin(this.time * 8) > 0) G.box(b.x, 0.12, b.z, 0.12, 0.05, 0.12, 0xff2020);
      }
    }
    this.drawCoins(B, G);
    for (const c of this.pickups) {
      const it = ITEMS[c.type];
      // pisca nos últimos 6 s antes de sumir
      if (c.life - c.t < 6 && Math.sin(c.t * 14) < -0.2) continue;
      let x = c.x;
      let z = c.z;
      let lift = 0;
      if (c.popT > 0) {
        const f = 1 - c.popT / 0.45;
        x = c.sx + (c.x - c.sx) * f;
        z = c.sz + (c.z - c.sz) * f;
        lift = Math.sin(f * Math.PI) * 1.1;
      }
      if (c.type === 'supply') {
        drawItem(B, G, 'supply', x, 0.35, z, 0, 1);
        continue;
      }
      const y = 0.5 + Math.sin(c.t * 3) * 0.08 + lift;
      drawItem(B, G, c.type, x, y, z, c.t * 1.6, it.pick);
      // contorno girando no chão, na cor do item
      const r = 0.42 + Math.sin(c.t * 4) * 0.04;
      for (let k = 0; k < 4; k++) {
        const a = c.t * 0.8 + (k * Math.PI) / 2;
        G.box(x + Math.sin(a) * r, 0.03, z + Math.cos(a) * r, 0.62, 0.02, 0.05, it.ring, a);
      }
    }
    for (const t of this.tracers) {
      const dx = t.x2 - t.x1;
      const dz = t.z2 - t.z1;
      const len = Math.hypot(dx, dz);
      const tw = t.w || 0.035;
      G.box((t.x1 + t.x2) / 2, 1.0, (t.z1 + t.z2) / 2, tw, tw, len, t.color || 0xffe08a, Math.atan2(dx, dz));
      t.life -= dt;
    }
    compact(this.tracers, (t) => t.life > 0);
    for (const f of this.flashes) {
      G.box(f.x, 1.0, f.z, 0.3, 0.3, 0.3, 0xffd060, Math.random() * 3);
      f.life -= dt;
    }
    compact(this.flashes, (f) => f.life > 0);
    this.parts.draw(B, G);
    B.end();
    G.end();
  }
}

// holograma ciano da Camuflagem: cada cor vira um tom de ciano conforme o brilho original
function holoLook(look) {
  const map = (c) => {
    if (typeof c !== 'number') return c;
    const l = (((c >> 16) & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + (c & 255) * 0.11) / 255;
    const r = Math.round(10 + l * 60);
    const g = Math.round(110 + l * 120);
    const b = Math.round(140 + l * 110);
    return (r << 16) | (g << 8) | b;
  };
  const out = { ...look };
  for (const k of ['skin', 'shirt', 'pants', 'sleeve', 'hands', 'boots', 'eyes']) if (out[k] !== undefined) out[k] = map(out[k]);
  if (look.extras) out.extras = look.extras.map((e) => {
    const n = e.slice();
    n[7] = map(e[7]);
    return n;
  });
  return out;
}

// anel de aviso no chão (8 segmentos)
function ring(G, x, z, r, color, t) {
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + t * 0.6;
    G.box(x + Math.sin(a) * r, 0.03, z + Math.cos(a) * r, r * 0.8, 0.02, 0.08, color, a); // segmento tangente
  }
}

// interseção raio-círculo 2D; retorna t >= 0 ou -1
function rayCircle(ox, oz, dx, dz, cx, cz, r) {
  const fx = ox - cx;
  const fz = oz - cz;
  const b = fx * dx + fz * dz;
  const c = fx * fx + fz * fz - r * r;
  const disc = b * b - c;
  if (disc < 0) return -1;
  const s = Math.sqrt(disc);
  const t = -b - s;
  if (t >= 0) return t;
  return -b + s >= 0 ? 0 : -1;
}

// expansão do arsenal: carregador, elementos, áreas no chão, projéteis novos e armadilhas
Object.assign(Game.prototype, ArsenalMixin, WorldMixin, EconomyMixin, pvpMethods);
