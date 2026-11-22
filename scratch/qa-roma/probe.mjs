import { chromium } from 'playwright';
import { spawn } from 'child_process';
const ROOT=process.argv[2];
const pr=spawn(process.execPath,[ROOT+'/node_modules/vite/bin/vite.js','--port','6411','--strictPort'],{cwd:ROOT});
await new Promise(r=>setTimeout(r,8000));
const b=await chromium.launch({headless:true});const c=await b.newContext({locale:'pt-BR',viewport:{width:1366,height:768}});await c.addInitScript(()=>localStorage.setItem('blockhorde_tutorial_v1','1'));const p=await c.newPage();
await p.goto('http://localhost:6411/?test');await p.waitForFunction(()=>window.__bh&&document.body.innerText.includes('Jogar agora'),null,{timeout:60000});
console.log(JSON.stringify(await p.evaluate(async()=>{const g=__bh;const col=__bhTest.ARENAS.find(a=>a.id==='coliseu');g.startMatch(col,[__bhTest.SURVIVORS[0]],'solo');
await new Promise(r=>setTimeout(r,1500));g.toSpawn=[];g.zombies.length=0;const pl=g.players[0];
g.spawnZombie('rm_legion',pl.pos.x+6,pl.pos.z);const z=g.zombies.at(-1);z.rise=0;const t0=g.time,x0=z.pos.x;const o=[];
for(let i=0;i<8;i++){await new Promise(r=>setTimeout(r,500));o.push([+(g.time-t0).toFixed(2),g.state,z.state,+Math.hypot(z.pos.x-pl.pos.x,z.pos.z-pl.pos.z).toFixed(2),z.stunT,z.target?.id??null,+pl.hp.toFixed(0)]);}
return {plPos:[pl.pos.x,pl.pos.z],o};})));
await b.close();pr.kill();
