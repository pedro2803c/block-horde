// Camada de plataforma: CrazyGames SDK v3 quando o jogo roda lá; no resto, nada muda.
// - fora da CrazyGames (site, arquivo portátil) o SDK nem é carregado
// - com o SDK "disabled", sem anúncios ou com AdBlock o jogo funciona igual
const SDK_URL = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
const KEYS = ['blockhorde_settings_v1', 'blockhorde_records_v1', 'blockhorde_profile_v1', 'blockhorde_loadout_v1', 'blockhorde_tutorial_v1', 'blockhorde_shop_v1'];
const MIDGAME_GAP = 180; // s entre anúncios de intervalo (regra da CrazyGames: no máximo 1 a cada 3 min)

function wanted() {
  if (import.meta.env.MODE === 'crazygames') return true;
  try {
    const q = new URLSearchParams(location.search);
    if (q.has('useLocalSdk') || q.has('crazygames')) return true;
    return /crazygames\./i.test(location.hostname) || /crazygames\./i.test(document.referrer || '');
  } catch {
    return false;
  }
}

function loadScript(src, ms) {
  return new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    const t = setTimeout(() => fail(new Error('timeout')), ms);
    s.onload = () => (clearTimeout(t), ok());
    s.onerror = () => (clearTimeout(t), fail(new Error('load')));
    document.head.append(s);
  });
}

let sdk = null; // só fica preenchido quando o SDK está ativo ("crazygames" ou "local")
let playing = false;
let adBlock = false;
let lastMidgame = -Infinity;
let inAd = false;
const muteFns = [];

export const platform = {
  name: 'web',
  locale: null,
  device: null,
  muted: false,

  async init() {
    if (!wanted()) return;
    try {
      await loadScript(SDK_URL, 6000);
      const S = window.CrazyGames && window.CrazyGames.SDK;
      if (!S) return;
      await S.init();
      if (S.environment !== 'crazygames' && S.environment !== 'local') return;
      sdk = S;
      this.name = 'crazygames';
      try {
        const info = S.user && S.user.systemInfo;
        this.locale = info && info.locale;
        this.device = info && info.device && info.device.type;
      } catch {
        /* sem informações */
      }
      try {
        this.muted = !!(S.game.settings && S.game.settings.muteAudio);
        S.game.addSettingsChangeListener((st) => {
          this.muted = !!(st && st.muteAudio);
          for (const fn of muteFns) fn(this.muted);
        });
      } catch {
        /* versão sem configurações */
      }
      // progresso salvo na conta da CrazyGames: copia o que já estava no navegador
      try {
        for (const k of KEYS) {
          if (S.data.getItem(k) == null) {
            const v = localStorage.getItem(k);
            if (v != null) S.data.setItem(k, v);
          }
        }
      } catch {
        /* sem módulo de dados */
      }
      S.ad.hasAdblock().then((b) => (adBlock = !!b)).catch(() => {});
    } catch (err) {
      console.warn('CrazyGames SDK indisponível:', err && err.message);
      sdk = null;
    }
  },

  get active() {
    return !!sdk;
  },

  // ---------------------------------------------------------------- armazenamento
  getItem(k) {
    try {
      if (sdk) return sdk.data.getItem(k);
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem(k, v) {
    try {
      if (sdk) sdk.data.setItem(k, v);
      else localStorage.setItem(k, v);
    } catch {
      /* sem armazenamento */
    }
  },
  removeItem(k) {
    try {
      if (sdk) sdk.data.removeItem(k);
      else localStorage.removeItem(k);
    } catch {
      /* ignora */
    }
  },

  // ---------------------------------------------------------------- eventos de jogo
  call(fn) {
    if (!sdk) return;
    try {
      fn(sdk);
    } catch {
      /* SDK desativado nesta sessão */
    }
  },
  loadingStart() {
    this.call((S) => S.game.loadingStart());
  },
  loadingStop() {
    this.call((S) => S.game.loadingStop());
  },
  // chamado todo quadro: só avisa a plataforma quando muda
  setPlaying(on) {
    on = on && !inAd;
    if (on === playing) return;
    playing = on;
    this.call((S) => (on ? S.game.gameplayStart() : S.game.gameplayStop()));
  },
  happytime() {
    this.call((S) => S.game.happytime());
  },
  onMute(fn) {
    muteFns.push(fn);
  },

  // ---------------------------------------------------------------- anúncios
  get adsAvailable() {
    return !!sdk && !adBlock;
  },
  get inAd() {
    return inAd;
  },
  // anúncio de intervalo; `done` sempre é chamado (com ou sem anúncio)
  midgame(hooks, done) {
    const now = performance.now() / 1000;
    if (!this.adsAvailable || now - lastMidgame < MIDGAME_GAP) return done();
    lastMidgame = now;
    this.request('midgame', hooks, () => done(), () => done());
  },
  // anúncio com recompensa: `reward` só depois de assistir até o fim
  rewarded(hooks, reward, fail) {
    if (!this.adsAvailable) return fail && fail('adsDisabled');
    this.request('rewarded', hooks, reward, fail);
  },
  request(type, hooks, finished, failed) {
    let started = false;
    const end = () => {
      inAd = false;
      if (started) hooks.end && hooks.end();
    };
    try {
      sdk.ad.requestAd(type, {
        adStarted: () => {
          started = true;
          inAd = true;
          this.setPlaying(false);
          hooks.start && hooks.start();
        },
        adFinished: () => {
          end();
          if (type === 'midgame') lastMidgame = performance.now() / 1000;
          finished && finished();
        },
        adError: (err) => {
          end();
          failed && failed(err && (err.code || err));
        },
      });
    } catch (err) {
      end();
      failed && failed('other');
    }
  },
};
