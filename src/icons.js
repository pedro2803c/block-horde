// Ícones SVG da interface (viewBox 24×24, preenchidos com currentColor) e silhuetas das armas (48×24).
const P = {
  play: 'M8 5v14l11-7z',
  video: 'M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11zM8 9v6l5-3z',
  pause: 'M6 5h4v14H6zM14 5h4v14h-4z',
  stop: 'M6 6h12v12H6z',
  back: 'M20 11H7.8l5.6-5.6L12 4l-8 8 8 8 1.4-1.4L7.8 13H20z',
  close: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  check: 'M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
  users: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
  user: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  trophy: 'M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V19H7v2h10v-2h-4v-3.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z',
  fullscreen: 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z',
  fullscreenExit: 'M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z',
  gamepad: 'M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
  keyboard: 'M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z',
  gear: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
  info: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
  home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
  lock: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
  star: 'M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
  shield: 'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z',
  bolt: 'M7 2v11h3v9l7-12h-4l4-8z',
  skull: 'M12 2C6.9 2 3 5.6 3 10.3c0 2.7 1.3 4.9 3.3 6.3V20c0 .6.4 1 1 1h1.5v-2.2h1.7V21h3v-2.2h1.7V21H16.7c.6 0 1-.4 1-1v-3.4c2-1.4 3.3-3.6 3.3-6.3C21 5.6 17.1 2 12 2zM8.6 14.2a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zm6.8 0a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2zM12 16.8l-1.3-2.2h2.6z',
  target: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm8.94 3A9 9 0 0 0 13 3.06V1h-2v2.06A9 9 0 0 0 3.06 11H1v2h2.06A9 9 0 0 0 11 20.94V23h2v-2.06A9 9 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z',
  refresh: 'M17.65 6.35A7.96 7.96 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
  exit: 'M10.09 15.59 11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5a2 2 0 0 0-2 2v4h2V5h14v14H5v-4H3v4a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z',
  volume: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
  music: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z',
  burst: 'M12 2l2.2 5.4L20 6l-2.6 5.2L22 15l-5.8.8L15 22l-3-4.6L9 22l-1.2-6.2L2 15l4.6-3.8L4 6l5.8 1.4z',
  monitor: 'M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z',
  flag: 'M14.4 6 14 4H5v17h2v-7h5.6l.4 2h7V6z',
  map: 'M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z',
  warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z',
  checkCircle: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  chevron: 'M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z',
  clock: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
  ammo: 'M5 9h3v12H5zM10.5 9h3v12h-3zM16 9h3v12h-3zM6.5 3 8 8H5zM12 3l1.5 5h-3zM17.5 3 19 8h-3z',
  medkit: 'M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4zm6 11h-3v3h-2v-3H8v-2h3v-3h2v3h3v2z',
};
// Ícones dos inimigos montados com traços e círculos (preenchimento normal une as formas)
const f = (n) => +n.toFixed(2);
function line(x1, y1, x2, y2, w = 1.6) {
  const l = Math.hypot(x2 - x1, y2 - y1);
  const nx = (-(y2 - y1) / l) * (w / 2);
  const ny = ((x2 - x1) / l) * (w / 2);
  return `M${f(x1 + nx)} ${f(y1 + ny)}L${f(x2 + nx)} ${f(y2 + ny)}L${f(x2 - nx)} ${f(y2 - ny)}L${f(x1 - nx)} ${f(y1 - ny)}z`;
}
const circle = (cx, cy, r) => `M${f(cx - r)} ${cy}a${r} ${r} 0 1 0 ${f(2 * r)} 0a${r} ${r} 0 1 0 ${f(-2 * r)} 0z`;
const legs = (pts) => pts.map(([a, b, c]) => line(...a, ...b) + line(...b, ...c) + line(24 - a[0], a[1], 24 - b[0], b[1]) + line(24 - b[0], b[1], 24 - c[0], c[1])).join('');
Object.assign(P, {
  crown: 'M3 18 2 7l5.5 4L12 4l4.5 7L22 7l-1 11zM3 19.5h18V22H3z',
  fist: 'M5 10a2 2 0 0 1 4 0V8a2 2 0 0 1 4 0 2 2 0 0 1 4 0v1a2 2 0 0 1 3 1.7V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-7-7z',
  spider: circle(12, 8.5, 2.6) + circle(12, 15, 3.8) +
    legs([[[10, 10], [6, 6], [4, 8.5]], [[10, 12], [5, 11], [2.5, 14]], [[10, 14], [5, 16], [3, 19.5]], [[10.5, 16], [7.5, 19.5], [6.5, 22.5]]]),
  bat: 'M12 7.5c-.9 0-1.4.6-1.6 1.2L9.3 7.4 8.4 10C6.2 8.3 3.6 7.8 1 8.4c2.1 1.5 2.9 3.6 2.8 5.9 1.3-.9 2.8-1.1 4.1-.5.5-1.2 1.8-1.7 3-1.3.5.9 1 1.6 1.1 2.5.1-.9.6-1.6 1.1-2.5 1.2-.4 2.5.1 3 1.3 1.3-.6 2.8-.4 4.1.5-.1-2.3.7-4.4 2.8-5.9-2.6-.6-5.2-.1-7.4 1.6l-.9-2.6-1.1 1.3c-.2-.6-.7-1.2-1.6-1.2z',
  run: circle(14.5, 4, 2.2) + line(13.5, 8, 10.5, 14, 2.6) + line(10.5, 14, 6, 15.5) + line(6, 15.5, 4.5, 20) + line(10.5, 14, 14, 17) + line(14, 17, 13, 21.5) +
    line(12.8, 9, 17, 11) + line(17, 11, 19, 8.5) + line(12.8, 9, 8, 10) + line(8, 10, 6.5, 12.5),
  paw: 'M12 13c-3 0-6 3.2-6 5.6C6 20.3 7.3 21 9 21c1.2 0 2-.6 3-.6s1.8.6 3 .6c1.7 0 3-.7 3-2.4C18 16.2 15 13 12 13z' +
    circle(5.8, 11, 2) + circle(18.2, 11, 2) + circle(9.3, 6.5, 2.1) + circle(14.7, 6.5, 2.1),
  virus: circle(12, 12, 4.6) + [0, 1, 2, 3, 4, 5, 6, 7].map((k) => {
    const a = (k / 8) * Math.PI * 2;
    return line(12 + Math.cos(a) * 4, 12 + Math.sin(a) * 4, 12 + Math.cos(a) * 8.4, 12 + Math.sin(a) * 8.4, 1.4) + circle(f(12 + Math.cos(a) * 9), f(12 + Math.sin(a) * 9), 1.6);
  }).join(''),
  spore: circle(8, 9, 4) + circle(16, 9, 4) + circle(12, 5, 3.4) + circle(12, 12, 3.6) + 'M10 14h4l1.5 6.5H8.5z' + 'M6 21.5h12V23H6z',
  hood: 'M12 2C7 2 4 6.5 4 12v10h16V12c0-5.5-3-10-8-10zm0 6c2.5 0 4 2.2 4 5v2H8v-2c0-2.8 1.5-5 4-5z',
  scythe: 'M10.4 9.1 5.7 22h2.2l4.3-11.1-1.8-1.8zM10.1 9.8C11.6 5.4 15.4 2.1 21 2c-.6 5-4 8.5-9.2 9.5l-1.7-1.7z',
  wasp: circle(12, 7, 2.2) + circle(12, 10.6, 2.9) + 'M9.3 12.3h5.4l1.5 6.2-1.6 1.6h-5.2l-1.6-1.6zM12 20.2l1.1 2.4h-2.2z' +
    'M10.4 8.2C8 4.6 5.1 3.2 2.2 4.2c.8 2 2.6 3.8 5.3 5.3zM13.6 8.2C16 4.6 18.9 3.2 21.8 4.2c-.8 2-2.6 3.8-5.3 5.3z' +
    line(10.6, 5.4, 8.8, 2.6, 1) + line(13.4, 5.4, 15.2, 2.6, 1),
  ghost: 'M12 2C7.6 2 4 5.6 4 10v12l2.7-2.3L9.4 22l2.6-2.3L14.6 22l2.7-2.3L20 22V10c0-4.4-3.6-8-8-8z' +
    circle(9.2, 9.5, 1.5) + circle(14.8, 9.5, 1.5) + 'M10.4 13.8h3.2v1.4h-3.2z',
});

// Itens (suprimentos, proteção e utilitários)
Object.assign(P, {
  drink: 'M7 3h10v18H7zM13.5 6 9 13h3l-1.5 5L15 11h-3z',
  vest: 'M7 2h3v3h4V2h3l4 4v16H3V6zM7 10h10v4H7zM7 16h4v3H7zM13 16h4v3h-4z',
  helmet: 'M3 15c0-6 4-11 9-11s9 5 9 11v4h-4v-3H7v3H3z',
  backpack: 'M9 2h6v3h3a2 2 0 0 1 2 2v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a2 2 0 0 1 2-2h3zM7 12h10v6H7z',
  binoculars: circle(7, 15, 4.6) + circle(17, 15, 4.6) + 'M3.5 6h6.5v8H3.5zM14 6h6.5v8H14zM10 8h4v4h-4z',
  flashlight: 'M2 9h11l3-3h5v12h-5l-3-3H2zM6 8h2v8H6z',
  radio: 'M7 7h10v15H7zM13 1h2v6h-2zM9 9h6v4H9z',
  crate: 'M3 3h18v18H3zM5.5 5.5v13h13v-13zM5.5 8 8 5.5l10.5 10.5L16 18.5z',
  dynamite: 'M5 7h4v15H5zM10 7h4v15h-4zM15 7h4v15h-4zM4 11h16v3H4zM11 2h2v5h-2z',
  knife: 'M3 13h7v4H3zM10 11h2v8h-2zM12 12h7l3 2.5-3 2.5h-7z',
});

// Habilidades
Object.assign(P, {
  dash: circle(17, 6, 2.6) + 'M13 9.5h5l-1.5 5 3 2.5-1.5 5h-2.4l1-3.6-3.6-2.8L11 18H7.5zM1 10h8v2H1zM2.5 13.5h6v2h-6zM4 17h4v2H4z',
  hexShield: 'M12 1.5 21 6.5v11L12 22.5 3 17.5v-11zM12 6l-4 2.3v4.6l4 2.3 4-2.3V8.3zM12 4.2l5.8 3.3M12 4.2 6.2 7.5',
  sgrenade: 'M8 8h8l3 3v7l-3 3H8l-3-3v-7zM10 3h4v4h-4zM14 3h6v2h-6zM9.5 12.5h5v5h-5z' + 'M20 9l3-2-1 3zM1 9l3 1-2-3z',
  turret: 'M10 3h4v3h-4zM7 6h10v6H7zM15 8h8v2h-8zM11 12h2v4h-2zM5 21l5-5h4l5 5h-3l-3-3h-2l-3 3z',
  drone: 'M8 10h8v5H8zM10 15h4v2h-4zM1 7h7v1.6H1zM16 7h7v1.6h-7zM4 8.6h1.6V11H4zM18.4 8.6H20V11h-1.6zM5 11h4v1.5H5zM15 11h4v1.5h-4z',
  bomb: circle(11, 14, 7.5) + 'M15.5 5.5l2-2 3 3-2 2zM19 2l1-1 1.2 1.2-1 1zM21 4.5l1.8-.4.2 1.4-1.8.3z',
  flame: 'M12 1c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 1.6-5 3-6.5 0 2.5 1 4 2.5 4.5C10.5 8 11 4.5 12 1zM12 14c-1.5 1.5-2 2.6-2 4a2 2 0 0 0 4 0c0-1.4-.6-2.6-2-4z',
  dome: 'M2 19h20v2H2zM3 18a9 9 0 0 1 18 0h-2.4a6.6 6.6 0 0 0-13.2 0zM11 4h2v3h-2zM4.2 7.6l1.4-1.4 2 2-1.4 1.4zM16.4 8.2l2-2 1.4 1.4-2 2z',
  multishot: 'M2 11h12v2H2zM14 9l6 3-6 3zM4 5.5h9v2H4zM13 4l5 2.5-5 2.5zM4 16.5h9v2H4zM13 15l5 2.5-5 2.5z',
  regen: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35zM11 8v3H8v2h3v3h2v-3h3v-2h-3V8z',
  tree: 'M11 2h2v5h-2zM5 7h14v2H5zM5 9h2v4H5zM17 9h2v4h-2zM3 13h6v6H3zM15 13h6v6h-6zM10.5 12h3v9h-3z',
  snow: 'M11 1h2v22h-2zM1 11h22v2H1zM4.2 5.6l1.4-1.4 14.2 14.2-1.4 1.4zM4.2 18.4 18.4 4.2l1.4 1.4L5.6 19.8zM8 2l4 3 4-3v2.4l-4 3-4-3zM8 22l4-3 4 3v-2.4l-4-3-4 3z',
  reload: 'M12 3a9 9 0 0 1 8.5 6H23l-4 5-4-5h2.3A6.5 6.5 0 1 0 18 15.5l2 1.6A9 9 0 1 1 12 3z',
});

// Ícones com recortes internos (olhos da caveira, rosto do capuz, olhos do fantasma, bolsos) usam evenodd
const EVENODD = new Set(['skull', 'hood', 'ghost', 'drink', 'vest', 'backpack', 'radio', 'crate', 'hexShield', 'sgrenade', 'regen', 'flame']);

// Silhuetas em bloco das armas (viewBox 48×24)
const W = {
  pistol: 'M6 6h26v6H18v2h-4l-1 7H6l2-9H6z',
  uzi: 'M4 7h32v5h-6v9h-5v-9h-5v3h-4l-1 6H6l1-6H4zM36 8h6v3h-6z',
  grenade: 'M19 8h10l3 3v8l-3 3H19l-3-3v-8zM21 3h6v4h-6zM27 3h8v2h-8zM20 13h8v2h-8z',
  shotgun: 'M1 9h31l3-2h12v4H35l-2 3H15l-3 7H5l3-7H1z',
  barrel: 'M16 2h16v20H16zM15 6h18v2H15zM15 16h18v2H15z',
  rifle: 'M1 8h9V6h4v2h22v3h11v3H35l-2 2h-6v5h-4v-5H15l-4 5H4l4-5H1z',
  barricade: 'M6 5h36v4H6zM6 14h36v4H6zM10 3h4v19h-4zM34 3h4v19h-4z',
  mine: 'M12 14h24v7H12zM21 9h6v5h-6zM23 6h2v3h-2z',
  rocket: 'M1 8h33v8H1zM34 6h7l6 6-6 6h-7zM6 16h4v5H6zM16 16h4v5h-4z',
  sniper: 'M0 9H30V10H48V12H30V13H26V16H23V13H21V19H18L17 13H12L6 16H0zM14 5H28V8H14zM16 8H18V9H16zM24 8H26V9H24z',
  dynamite: 'M14 6h6v16h-6zM21 6h6v16h-6zM28 6h6v16h-6zM12 11h24v3H12zM19 2h10v4H19zM31 0h2v2h-2z',
  knife: 'M4 10h12v4H4zM16 8h2v8h-2zM18 10h20l8 2-8 2H18z',
  axe: 'M2 11H32V14H2zM32 5H38L44 2V22L38 18H32z',
  lmg: 'M1 8h8V6h20v2h8v2h10v3H37v1h-4v3h3v5h-2l-1-5h-3l-1 5h-2v-5h-6v6h-6v-6h-4l-4 6H5l4-6H1zM14 3h10v3H14z',
  flamer: 'M1 9h10V7h16v3h9v4H27v1h-5v7h-8v-7h-2l-3 6H3l3-6H1zM36 10h4l3-2v8l-3-2h-4z',
  glauncher: 'M1 8h10V6h6v2h22v6H22v4h-4v-1h-2l-3 5H5l3-5H1zM17 10h6v6h-6z',
  plasma: 'M1 9h9V7h22v2h6l6 3-6 3h-6v2h-8v4h-4v-4h-5l-4 4H5l4-4H1zM14 10h16v2H14z',
  cryo: 'M1 9h10V6h18v3h7v6h-7v2h-8v4h-4v-4H11l-4 4H3l4-4H1zM37 8h3v8h-3zM41 10h4v4h-4zM14 2h10v4H14z',
  acidgun: 'M1 9h10V7h20v2h7v4h-7v4h-8v4h-4v-4h-5l-4 4H5l4-4H1zM15 1h8v6h-8z',
  egrenade: 'M19 8h10l3 3v8l-3 3H19l-3-3v-8zM21 3h6v4h-6zM27 3h8v2h-8zM23 11l3 0-2 3h3l-4 5 1-4h-3z',
  igrenade: 'M19 8h10l3 3v8l-3 3H19l-3-3v-8zM21 3h6v4h-6zM27 3h8v2h-8zM24 10c2 3 4 4 4 7a4 4 0 0 1-8 0c0-2 1-3 2-4 0 2 1 3 2 3z',
  fgrenade: 'M19 8h10l3 3v8l-3 3H19l-3-3v-8zM21 3h6v4h-6zM27 3h8v2h-8zM23 10h2v10h-2zM19 14h10v2H19z',
  tgrenade: 'M19 8h10l3 3v8l-3 3H19l-3-3v-8zM21 3h6v4h-6zM27 3h8v2h-8zM21 12h3v3h-3zM25 15h3v3h-3zM22 17h2v2h-2z',
  proxmine: 'M10 15h28v6H10zM16 12h16v3H16zM30 4h2v8h-2zM29 2h4v3h-4z',
  spikes: 'M4 18h40v4H4zM7 18l3-12 3 12zM15 18l3-12 3 12zM23 18l3-12 3 12zM31 18l3-12 3 12zM39 18l2-8 2 8z',
  efence: 'M6 3h4v19H6zM38 3h4v19h-4zM10 6h28v2H10zM10 11h28v2H10zM10 16h28v2H10zM22 8l4 0-3 4h3l-5 6 1-5h-3z',
  ltower: 'M14 19h20v4H14zM21 11h6v8h-6zM15 4h18v8H15zM33 6h13v3H33z',
  ftower: 'M14 19h20v4H14zM21 11h6v8h-6zM15 4h16v8H15zM31 6h5v4h-5zM37 5l8 3-8 3z',
  itower: 'M14 19h20v4H14zM21 13h6v6h-6zM24 1l6 6-6 6-6-6zM34 7h10v2H34z',
};

const svg = (vb, d, evenodd) => `<svg viewBox="${vb}" aria-hidden="true" focusable="false"><path${evenodd ? ' fill-rule="evenodd"' : ''} d="${d}"/></svg>`;

// <span class="ic">…</span> pronto para inserir em botões e rótulos
export function icon(name, cls = '') {
  const s = document.createElement('span');
  s.className = 'ic' + (cls ? ' ' + cls : '');
  s.innerHTML = svg('0 0 24 24', P[name], EVENODD.has(name));
  return s;
}
export function weaponIcon(id, cls = '') {
  const s = document.createElement('span');
  s.className = 'wic' + (cls ? ' ' + cls : '');
  s.innerHTML = svg('0 0 48 24', W[id] || W.pistol);
  return s;
}
export const skullSvg = () => svg('0 0 24 24', P.skull, true);
