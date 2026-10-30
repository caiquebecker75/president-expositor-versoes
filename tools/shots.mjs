// Conferência visual: captura cada tela do deck via CDP (Chrome headless).
// Uso: node tools/shots.mjs [larguraxaltura] [?query extra]   ex.: node tools/shots.mjs 1600x900 static
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import http from 'http';

const [size = '1600x900', extra = 'static'] = process.argv.slice(2);
const [W, H] = size.split('x').map(Number);
const mobile = W < 820;
const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, s) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith(path.sep)) f += 'index.html'; if (!fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(s); }).listen(8131);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const port = 9341;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${path.resolve('tools/_qa/chrome')}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) break; } catch { } await sleep(250); }
const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(t.webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map(); const logs = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } if (m.method === 'Runtime.exceptionThrown') logs.push('EXC ' + (m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text)); if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push('ERR ' + m.params.args.map(a => a.value ?? a.description).join(' ')); };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable'); await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile });
const out = path.resolve('tools/_qa/shots'); fs.mkdirSync(out, { recursive: true });
const q = extra ? '?' + extra.split(',').join('&') : '';
await send('Page.navigate', { url: `http://127.0.0.1:8131/index.html${q}` });
await sleep(3500);
const ids = JSON.parse((await send('Runtime.evaluate', { expression: 'JSON.stringify([...document.querySelectorAll(".slide")].map(s=>s.id))', returnByValue: true })).result.result.value);
if (mobile) {
  const h = (await send('Runtime.evaluate', { expression: 'document.documentElement.scrollHeight', returnByValue: true })).result.result.value;
  const sw = (await send('Runtime.evaluate', { expression: 'document.documentElement.scrollWidth', returnByValue: true })).result.result.value;
  console.log('mobile altura', h, 'largura', sw, '(viewport', W + ')');
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70, captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: Math.min(h, 16000), scale: 1 } });
  fs.writeFileSync(path.join(out, `mobile.jpg`), Buffer.from(shot.result.data, 'base64'));
} else {
  for (const s of ids) {
    await send('Runtime.evaluate', { expression: `location.hash='${s}'` });
    await sleep(900);
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 });
    fs.writeFileSync(path.join(out, `${W}-${s}.jpg`), Buffer.from(shot.result.data, 'base64'));
  }
  console.log('telas', ids.join(', '));
}
console.log(logs.join('\n') || 'sem erros');
ws.close(); chrome.kill(); srv.close();
