// Monta as imagens das versões (telas 03 a 06, abas e comparativo) a partir dos renders dos modelos da AR:
// fundo de estúdio, o display renderizado e as cotas 140 / 40 / 30 cm desenhadas sobre os cantos reais da caixa.
// Uso: node tools/render-ar.mjs tools/tomadas.json && NODE_PATH=<node_modules com sharp> node tools/versoes-ar.mjs
import { spawn } from 'child_process';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(path.join(process.env.NODE_PATH || 'node_modules', 'x.js'));
const sharp = require('sharp');
const W = 1005, H = 1565;
const VERSOES = [['v1-mdf', 'estudio-mdf'], ['v2-aramado', 'estudio-aramado'], ['v4-metalon', 'estudio-metalon']];
const R = path.resolve('tools/_qa/render');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// geometria das cotas na tela: linha paralela à aresta, afastada para fora, com chamadas e setas
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], add = (a, b) => [a[0] + b[0], a[1] + b[1]], mulv = (a, k) => [a[0] * k, a[1] * k];
const unit = a => { const l = Math.hypot(a[0], a[1]); return [a[0] / l, a[1] / l]; };
function cota(p, q, fora, dist, rotulo, lado) {
  const n = unit(fora), a = add(p, mulv(n, dist)), b = add(q, mulv(n, dist));
  const d = unit(sub(b, a)), s = 13, w = 6;
  const seta = (o, dir) => { const t = add(o, mulv(dir, s)), pp = [-dir[1], dir[0]]; return `M${o[0]},${o[1]} L${t[0] + pp[0] * w},${t[1] + pp[1] * w} M${o[0]},${o[1]} L${t[0] - pp[0] * w},${t[1] - pp[1] * w}`; };
  const m = mulv(add(a, b), 0.5), tp = add(m, mulv(n, lado));
  return `<path d="M${add(p, mulv(n, 8)).join(',')} L${add(p, mulv(n, dist + 10)).join(',')} M${add(q, mulv(n, 8)).join(',')} L${add(q, mulv(n, dist + 10)).join(',')}" class="ext"/>
    <path d="M${a.join(',')} L${b.join(',')} ${seta(a, d)} ${seta(b, mulv(d, -1))}" class="lin"/>
    <text x="${tp[0]}" y="${tp[1]}">${rotulo}</text>`;
}

const port = 9348;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${path.resolve('tools/_qa/chrome-versoes')}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) break; } catch { } await sleep(250); }
const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile: false });

for (const [saida, tomada] of VERSOES) {
  const info = JSON.parse(fs.readFileSync(path.join(R, `${tomada}.json`), 'utf8'));
  const k = W / info.w;
  const img = await sharp(path.join(R, `${tomada}.png`)).resize(W, H, { kernel: 'lanczos3' }).png().toBuffer();
  const c = info.cantos.map(p => mulv(p, k));
  // índice = (x>0)·4 + (y>0)·2 + (z>0): 0 trás-esq-base, 1 frente-esq-base, 2 trás-esq-topo, 5 frente-dir-base
  const altura = cota(c[0], c[2], [-1, 0.02], 46, '140 cm', 0);
  const prof = cota(c[0], c[1], [-0.62, 0.78], 44, '30 cm', 0);
  const larg = cota(c[1], c[5], [0.12, 1], 46, '40 cm', 0);
  const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@600;700&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
  body{background:radial-gradient(ellipse 78% 62% at 50% 46%,#4d2c17 0%,#341c0e 48%,#1c0f07 100%)}
  .chao{position:absolute;left:0;right:0;bottom:0;height:34%;background:linear-gradient(180deg,rgba(0,0,0,0) 0%,rgba(0,0,0,.28) 100%)}
  img{position:absolute;left:0;top:0;width:${W}px;height:${H}px}
  svg{position:absolute;inset:0}
  .lin{stroke:#fff;stroke-width:2.4;fill:none;stroke-linecap:round;stroke-linejoin:round}
  .ext{stroke:rgba(255,255,255,.55);stroke-width:1.4;fill:none}
  text{font:700 34px Figtree,Arial,sans-serif;fill:#fff;paint-order:stroke;stroke:rgba(20,10,4,.75);stroke-width:7px;stroke-linejoin:round;dominant-baseline:middle}
</style></head><body><div class="chao"></div>
<svg viewBox="0 0 ${W} ${H}" style="filter:blur(16px)"><polygon points="${[c[0], c[1], c[5], c[4]].map(p => add(p, [0, 6]).join(',')).join(' ')}" fill="rgba(0,0,0,.62)"/></svg>
<img src="data:image/png;base64,${img.toString('base64')}">
<svg viewBox="0 0 ${W} ${H}" id="cotas">${altura}${prof}${larg}</svg>
<script>
  // rótulos: ao lado da linha, sem encostar no display
  const [h, p, l] = document.querySelectorAll('#cotas text');
  const ajusta = (el, dx, dy, ancora) => { el.setAttribute('x', +el.getAttribute('x') + dx); el.setAttribute('y', +el.getAttribute('y') + dy); el.setAttribute('text-anchor', ancora); };
  ajusta(h, -18, 0, 'end'); ajusta(p, -14, 26, 'end'); ajusta(l, 0, 34, 'middle');
</script></body></html>`;
  const f = path.join(R, `${saida}.html`);
  fs.writeFileSync(f, html);
  await send('Page.navigate', { url: 'file:///' + f.replace(/\\/g, '/') });
  await sleep(1800);
  await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const png = Buffer.from(shot.result.data, 'base64');
  fs.writeFileSync(path.join(R, `${saida}-final.png`), png);
  await sharp(png).webp({ quality: 88 }).toFile(path.resolve('assets/img/versoes', `${saida}.webp`));
  await sharp(png).resize({ width: 420, kernel: 'lanczos3' }).webp({ quality: 82 }).toFile(path.resolve('assets/img/versoes', `${saida}_thumb.webp`));
  console.log(saida, 'ok');
}
ws.close(); chrome.kill();
