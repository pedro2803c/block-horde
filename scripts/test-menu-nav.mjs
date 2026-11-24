import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--no-sandbox'] });
for (const [n, o] of [['desktop',{viewport:{width:1366,height:768}}],['mobile',{viewport:{width:844,height:390},hasTouch:true,isMobile:true}]]) {
  const c = await b.newContext({ locale:'pt-BR', ...o }); await c.addInitScript(()=>localStorage.setItem('blockhorde_tutorial_v1','{"status":"done","step":12,"done":[],"seen":[]}'));
  const p = await c.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(process.env.U||'http://127.0.0.1:4173/'); await p.waitForFunction(()=>window.__bh?.state==='menu'&&document.querySelector('.menu-v2'),null,{timeout:60000});
  const labels = await p.$$eval('.menu-v2 .menu-nav button', bs=>bs.filter(x=>x.offsetParent).map(x=>x.textContent.trim()));
  const res = {};
  for (const l of labels) {
    await p.evaluate(()=>window.__bh.ui.showScreen('menu'));
    const btn = p.locator('.menu-v2 .menu-nav button',{hasText:l}).first(); await btn.scrollIntoViewIfNeeded(); if (n==='mobile') { const top = await btn.evaluate((el)=>{ const r=el.getBoundingClientRect(); const t=document.elementFromPoint(r.left+r.width/2, r.top+r.height/2); return el.contains(t); }); if (!top) { res[l]='COBERTO'; continue; } await btn.evaluate((el)=>el.click()); } else await btn.click();
    await p.waitForTimeout(250); res[l] = await p.evaluate(()=>window.__bh.ui.screen);
  }
  console.log(n, JSON.stringify(res), errs.length);
}
await b.close();
