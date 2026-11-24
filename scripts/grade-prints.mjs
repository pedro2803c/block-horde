// Junta PNGs de uma pasta numa grade. Uso: node scripts/grade-prints.mjs pasta filtro saida.png colunas
import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path';
const [, , dir, filt = '', out, cols = '4'] = process.argv;
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png') && f.includes(filt) && !f.startsWith('grade')).sort();
const html = `<body style="margin:0;background:#0E1117;display:grid;grid-template-columns:repeat(${cols},1fr);gap:4px;font:12px sans-serif;color:#EAEDEF">` + files.map((f) => `<div><img style="width:100%;display:block" src="data:image/png;base64,${fs.readFileSync(path.join(dir, f)).toString('base64')}"><div>${f}</div></div>`).join('') + '</body>';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 300 * +cols, height: 400 } });
await p.setContent(html); await p.waitForTimeout(300); await p.screenshot({ path: out, fullPage: true }); await b.close();
