// Alinha cada montagem da loja à foto atual (escala + deslocamento) comparando só o entorno do expositor.
// Uso: NODE_PATH=<node_modules com sharp> node tools/align.cjs
const sharp = require('sharp');
const path = require('path');

const IMG = path.resolve('assets/img');
const W = 900, H = 1600, k = 4; // busca em 1/4 da resolução
const w = W / k, h = H / k;
const gray = async (input, s = 1, dx = 0, dy = 0) => {
  // reamostra a montagem com escala s em torno do centro e deslocamento (dx, dy) em px da resolução final
  const sw = Math.round(W * s), sh = Math.round(H * s);
  const big = await sharp(input).resize(sw, sh).toBuffer();
  const left = Math.round((sw - W) / 2 - dx), top = Math.round((sh - H) / 2 - dy);
  const ext = { left: Math.max(0, left), top: Math.max(0, top) };
  const canvas = await sharp({ create: { width: W, height: H, channels: 3, background: '#000' } })
    .composite([{ input: await sharp(big).extract({ left: ext.left, top: ext.top, width: Math.min(W, sw - ext.left), height: Math.min(H, sh - ext.top) }).toBuffer(), left: Math.max(0, -left), top: Math.max(0, -top) }])
    .png().toBuffer();
  return canvas;
};
const small = async buf => sharp(buf).resize(w, h).greyscale().raw().toBuffer();
// máscara: ignora a faixa central onde fica o expositor
const keep = (x, y) => x < 175 / k || x > 720 / k;

(async () => {
  const ref = await small(await sharp(path.join(IMG, 'src', 'atual.png')).resize(W, H, { fit: 'cover' }).png().toBuffer());
  for (const id of ['mdf', 'aramado', 'acm', 'metalon']) {
    const src = path.join(IMG, 'loja', `loja-${id}.png`);
    const base = await sharp(src).resize(W, H, { fit: 'cover' }).png().toBuffer();
    let best = { e: Infinity };
    const score = async (s, dx, dy) => {
      const g = await small(await gray(base, s, dx, dy));
      let e = 0, n = 0;
      for (let y = 4; y < h - 4; y++) for (let x = 4; x < w - 4; x++) if (keep(x, y)) { e += Math.abs(g[y * w + x] - ref[y * w + x]); n++; }
      return e / n;
    };
    // busca grossa e depois fina
    for (const s of [0.97, 0.985, 1, 1.015, 1.03]) for (let dx = -24; dx <= 24; dx += 8) for (let dy = -24; dy <= 24; dy += 8) {
      const e = await score(s, dx, dy); if (e < best.e) best = { e, s, dx, dy };
    }
    const c = { ...best };
    for (const s of [c.s - 0.006, c.s, c.s + 0.006]) for (let dx = c.dx - 6; dx <= c.dx + 6; dx += 3) for (let dy = c.dy - 6; dy <= c.dy + 6; dy += 3) {
      const e = await score(s, dx, dy); if (e < best.e) best = { e, s, dx, dy };
    }
    const e0 = await score(1, 0, 0);
    const out = await gray(base, best.s, best.dx, best.dy);
    await sharp(out).webp({ quality: 84 }).toFile(path.join(IMG, 'loja', `${id}.webp`));
    console.log(id, `erro ${e0.toFixed(1)} → ${best.e.toFixed(1)}`, `escala ${best.s.toFixed(3)} dx ${best.dx} dy ${best.dy}`);
  }
})();
