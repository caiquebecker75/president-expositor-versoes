// Renderiza os modelos da página de AR (mesmo visualizador, mesma luz, mesmos arquivos) para as imagens do deck.
// Cada tomada sai em PNG com fundo transparente + JSON com a posição na imagem dos 8 cantos da caixa do display,
// para desenhar as cotas e encaixar o display na foto da loja.
// Uso: node tools/render-ar.mjs tools/tomadas.json   (Chrome instalado; os GLBs são baixados da página de AR)
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

const ROOT = process.cwd();
const AR = 'https://projetos.75lab.com.br/ar/';
const PAGINA = AR + 'lactalis-president-displays-parmesao/';
const GLB = path.resolve('tools/_qa/glb');
const OUT = path.resolve('tools/_qa/render');
const tomadas = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const so = process.argv[3]?.split(',');
fs.mkdirSync(GLB, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

for (const m of new Set(tomadas.map(t => t.modelo))) {
  const f = path.join(GLB, `${m}.glb`);
  if (!fs.existsSync(f)) fs.writeFileSync(f, Buffer.from(await (await fetch(`${PAGINA}${m}.glb?v=1`)).arrayBuffer()));
}

const PAGE = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}model-viewer{display:block;background:transparent;--poster-color:transparent}.h{width:2px;height:2px;padding:0;border:0;background:none}</style>
<script type="module" src="${AR}vendor/model-viewer.min.js"></script><div id="box"></div>`;
const srv = http.createServer((q, s) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/__render.html') { s.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); return s.end(PAGE); }
  if (q.method === 'POST' && u === '/__save') {
    const nome = new URL(q.url, 'http://x').searchParams.get('n');
    const partes = []; q.on('data', d => partes.push(d)); q.on('end', () => { fs.writeFileSync(path.join(OUT, nome), Buffer.concat(partes)); s.end('ok'); });
    return;
  }
  if (u.startsWith('/glb/')) { s.writeHead(200, { 'Content-Type': 'model/gltf-binary', 'Access-Control-Allow-Origin': '*' }); return fs.createReadStream(path.join(GLB, path.basename(u))).pipe(s); }
  s.writeHead(404); s.end();
}).listen(8136);

const sleep = ms => new Promise(r => setTimeout(r, ms));
const port = 9347;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${path.resolve('tools/_qa/chrome-render')}`, '--hide-scrollbars', '--enable-unsafe-swiftshader', '--use-angle=swiftshader', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) break; } catch { } await sleep(250); }
const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(); const logs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text)); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600)); return r.result.result.value; };
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 2400, height: 3200, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://127.0.0.1:8136/__render.html' });
await sleep(1500);
await ev(`customElements.whenDefined('model-viewer')`);
// sem isso o visualizador baixa a resolução quando o quadro demora (Chrome sem GPU) e a imagem sai cortada
await ev(`customElements.get('model-viewer').minimumRenderScale = 1`);

for (const tm of tomadas) {
  if (so && !so.includes(tm.id)) continue;
  const r = await ev(`(async () => {
    const tm = ${JSON.stringify(tm)};
    const box = document.getElementById('box'); box.innerHTML = '';
    const mv = document.createElement('model-viewer');
    const at = { 'environment-image': '${AR}assets/hdr/supermercado.hdr', 'tone-mapping': 'none', exposure: '1', 'shadow-intensity': String(tm.sombra ?? 1.1), 'shadow-softness': '0.9', 'interaction-prompt': 'none', loading: 'eager', 'camera-orbit': tm.orbita, 'field-of-view': tm.fov, 'min-field-of-view': '1deg', 'max-field-of-view': '90deg', 'min-camera-orbit': 'auto 0deg 0m', 'max-camera-orbit': 'auto 180deg 100m' };
    if (tm.alvo) at['camera-target'] = tm.alvo;
    for (const [k, v] of Object.entries(at)) mv.setAttribute(k, v);
    mv.style.width = tm.w + 'px'; mv.style.height = tm.h + 'px';
    mv.src = '/glb/' + tm.modelo + '.glb';
    box.append(mv);
    await new Promise((ok, erro) => { mv.addEventListener('load', ok, { once: true }); mv.addEventListener('error', erro, { once: true }); });
    // cantos da caixa do display como hotspots: o próprio visualizador diz onde cada um cai na imagem
    const c = mv.getBoundingBoxCenter(), d = mv.getDimensions();
    const cantos = [];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) cantos.push([c.x + sx * d.x / 2, c.y + sy * d.y / 2, c.z + sz * d.z / 2]);
    (tm.pontos || []).forEach(p => cantos.push(p));
    cantos.forEach((p, i) => { const h = document.createElement('button'); h.className = 'h'; h.slot = 'hotspot-' + i; h.dataset.position = p.map(v => v + 'm').join(' '); mv.append(h); });
    mv.jumpCameraToGoal();
    for (let i = 0; i < 40; i++) await new Promise(r => requestAnimationFrame(r));
    await new Promise(r => setTimeout(r, 1200));
    const R = mv.getBoundingClientRect();
    const pts = [...mv.querySelectorAll('.h')].map(h => { const b = h.getBoundingClientRect(); return [b.left + b.width / 2 - R.left, b.top + b.height / 2 - R.top]; });
    const blob = await mv.toBlob({ mimeType: 'image/png', idealAspect: false });
    await fetch('/__save?n=' + tm.id + '.png', { method: 'POST', body: blob });
    const info = { id: tm.id, modelo: tm.modelo, w: tm.w, h: tm.h, orbita: mv.getCameraOrbit().toString(), alvo: mv.getCameraTarget().toString(), fov: mv.getFieldOfView(), dims: [d.x, d.y, d.z], centro: [c.x, c.y, c.z], cantos: pts.slice(0, 8), pontos: pts.slice(8) };
    await fetch('/__save?n=' + tm.id + '.json', { method: 'POST', body: JSON.stringify(info, null, 1) });
    return info;
  })()`);
  console.log(tm.id, `dims ${r.dims.map(v => v.toFixed(3)).join(' × ')} m`, `fov ${r.fov.toFixed(2)}`, r.orbita);
}
console.log(logs.join('\n') || 'sem erros');
ws.close(); chrome.kill(); srv.close();
