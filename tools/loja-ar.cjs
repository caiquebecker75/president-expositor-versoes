// Montagens "depois" da tela Na loja: o display da AR (render do mesmo modelo, com a câmera encaixada na foto)
// sobre a foto real da Festval. A foto fica intacta; só o expositor antigo sai, e onde ele aparece fora do display
// novo o fundo é refeito com pedaços da própria foto (parede, gôndola de massas, Rap10, chão). Nada é desenhado
// por IA. Ao final confere que, fora do expositor antigo e do display novo, nenhum pixel da foto mudou.
// Uso: node tools/render-ar.mjs tools/tomadas.json loja-mdf,loja-aramado,loja-metalon
//      NODE_PATH=<node_modules com sharp> node tools/loja-ar.cjs
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const W = 900, H = 1600;
const R = path.resolve('tools/_qa/render');
const VERSOES = { mdf: 'loja-mdf', aramado: 'loja-aramado', metalon: 'loja-metalon' };

// expositor atual (aramado vermelho, testeira, cartaz lateral e pé), com folga
const ANTIGO = [[190, 60], [532, 116], [536, 326], [708, 322], [719, 560], [708, 760], [695, 800], [693, 950], [671, 1010], [667, 1200], [655, 1400], [646, 1600],
  [233, 1600], [229, 1482], [202, 1468], [185, 1300], [177, 900], [165, 456], [196, 442], [196, 340], [186, 320]];

// refazer o fundo: [região, deslocamento da fonte (dx, dy), sentido da varredura em x]
const REMENDOS = [
  // a parede sobe para a direita (perspectiva): a fonte, 190 px à esquerda, está 25 px mais baixa
  { nome: 'parede', area: [150, 40, 545, 336], dx: -190, dy: 25, sentido: 1 },
  { nome: 'gôndola de massas e chão', area: [140, 330, 250, 1600], dx: -62, dy: -9, sentido: 1 },
  { nome: 'Rap10', area: [590, 270, 730, 1600], dx: 85, dy: -8, sentido: -1 },
];

const mascara = async (pontos, sigma) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}"/><polygon points="${pontos.map(p => p.join(',')).join(' ')}" fill="#fff"/></svg>`;
  let s = sharp(Buffer.from(svg)).flatten({ background: '#000' });
  if (sigma) s = s.blur(sigma);
  return s.extractChannel(0).raw().toBuffer();
};
const dilata = (m, r) => { // máximo num quadrado (2r+1), separável
  const t = Buffer.alloc(m.length), o = Buffer.alloc(m.length);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = 0; for (let k = -r; k <= r; k++) { const xx = x + k; if (xx >= 0 && xx < W && m[y * W + xx] > v) v = m[y * W + xx]; } t[y * W + x] = v; }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let v = 0; for (let k = -r; k <= r; k++) { const yy = y + k; if (yy >= 0 && yy < H && t[yy * W + x] > v) v = t[yy * W + x]; } o[y * W + x] = v; }
  return o;
};
const erode = (m, r) => { const inv = Buffer.from(m.map(v => 255 - v)); return Buffer.from(dilata(inv, r).map(v => 255 - v)); };

(async () => {
  const foto = await sharp(path.resolve('assets/img/src/atual.png')).resize(W, H, { fit: 'cover', position: 'centre' }).removeAlpha().raw().toBuffer();
  const antigo = dilata(await mascara(ANTIGO, 0), 3);

  // renders: cor premultiplicada e alfa em 900 × 1600
  const renders = {};
  for (const [v, id] of Object.entries(VERSOES)) {
    const { data, info } = await sharp(path.join(R, `${id}.png`)).resize(W, H, { kernel: 'lanczos3' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    renders[v] = data;
  }
  // o que os três displays cobrem em comum: ali o fundo nunca aparece
  const comum = Buffer.alloc(W * H, 255);
  for (const d of Object.values(renders)) for (let i = 0; i < W * H; i++) if (d[i * 4 + 3] < 250) comum[i] = 0;
  const comumFirme = erode(comum, 4);

  // região a refazer: expositor antigo fora do que os displays cobrem
  const refazer = Buffer.alloc(W * H);
  for (let i = 0; i < W * H; i++) refazer[i] = antigo[i] > 127 && comumFirme[i] < 128 ? 255 : 0;
  const refazerSuave = await sharp(dilata(refazer, 2), { raw: { width: W, height: H, channels: 1 } }).blur(1.6).extractChannel(0).raw().toBuffer();

  // fundo refeito com pedaços da própria foto, em sequência (cada remendo pode usar o anterior)
  const placa = Buffer.from(foto);
  for (const r of REMENDOS) {
    const [x0, y0, x1, y1] = r.area;
    const xs = []; for (let x = x0; x < x1; x++) xs.push(x); if (r.sentido < 0) xs.reverse();
    for (const x of xs) for (let y = y0; y < Math.min(y1, H); y++) {
      const i = y * W + x; if (!refazer[i]) continue;
      const sx = Math.min(W - 1, Math.max(0, x + r.dx)), sy = Math.min(H - 1, Math.max(0, y + r.dy)), j = sy * W + sx;
      for (let c = 0; c < 3; c++) placa[i * 3 + c] = placa[j * 3 + c];
    }
  }
  // costura suave com a foto original
  for (let i = 0; i < W * H; i++) { const a = refazerSuave[i] / 255; for (let c = 0; c < 3; c++) placa[i * 3 + c] = Math.round(foto[i * 3 + c] * (1 - a) + placa[i * 3 + c] * a); }
  await sharp(placa, { raw: { width: W, height: H, channels: 3 } }).png().toFile('tools/_qa/placa.png');

  // cor do render puxada para a da foto: um pouco mais quente, mais suave e menos brilhante
  const grade = (r, g, b) => {
    const f = v => 255 * Math.pow(v / 255, 1.06);
    return [f(r) * 0.985, f(g) * 0.955, f(b) * 0.9];
  };

  for (const [v, id] of Object.entries(VERSOES)) {
    const d = renders[v];
    // buracos (vãos da tela do aramado): o que se vê por trás é o interior escuro do próprio display
    const fora = new Uint8Array(W * H); const fila = [];
    for (let x = 0; x < W; x++) { fila.push(x, (H - 1) * W + x); } for (let y = 0; y < H; y++) fila.push(y * W, y * W + W - 1);
    while (fila.length) { const i = fila.pop(); if (fora[i] || d[i * 4 + 3] > 100) continue; fora[i] = 1; const x = i % W, y = (i / W) | 0; if (x > 0) fila.push(i - 1); if (x < W - 1) fila.push(i + 1); if (y > 0) fila.push(i - W); if (y < H - 1) fila.push(i + W); }
    const borrado = await sharp(d, { raw: { width: W, height: H, channels: 4 } }).blur(10).raw().toBuffer();

    const out = Buffer.from(placa);
    for (let i = 0; i < W * H; i++) {
      let a = d[i * 4 + 3] / 255;
      let rgb = [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]];
      if (!fora[i] && a < 1) { // vão interno: completa com o interior escuro
        const ba = borrado[i * 4 + 3] / 255 || 1;
        const cor = [0, 1, 2].map(c => borrado[i * 4 + c] / ba), cinza = (cor[0] + cor[1] + cor[2]) / 3;
        const escuro = cor.map(v => (cinza * 0.7 + v * 0.3) * 0.2);
        rgb = rgb.map((v, c) => v * a + escuro[c] * (1 - a)); a = 1;
      }
      if (a <= 0) continue;
      const g = grade(...rgb);
      for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(Math.min(255, g[c]) * a + placa[i * 3 + c] * (1 - a));
    }
    // sombra de contato no chão, junto à base, dos dois lados
    const sombra = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}"/>
      <polygon points="214,1500 240,1490 240,1600 206,1600" fill="#fff"/><polygon points="650,1480 690,1470 700,1600 650,1600" fill="#fff"/></svg>`)).flatten({ background: '#000' }).blur(14).extractChannel(0).raw().toBuffer();
    for (let i = 0; i < W * H; i++) { const a = d[i * 4 + 3] / 255; const s = 1 - 0.38 * (sombra[i] / 255) * (1 - a); if (s < 1) for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.round(out[i * 3 + c] * s); }

    // integra com a foto: leve desfoque e grão só no display
    const desfocado = await sharp(out, { raw: { width: W, height: H, channels: 3 } }).blur(0.55).raw().toBuffer();
    let semente = 7; const rnd = () => (semente = (semente * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < W * H; i++) { const a = d[i * 4 + 3] / 255; if (a <= 0) continue; const n = (rnd() - 0.5) * 7; for (let c = 0; c < 3; c++) out[i * 3 + c] = Math.max(0, Math.min(255, Math.round(out[i * 3 + c] * (1 - a) + (desfocado[i * 3 + c] + n) * a))); }

    // prova: fora do expositor antigo e do display novo (com folga), a foto é a mesma
    let mudou = 0;
    for (let i = 0; i < W * H; i++) {
      if (antigo[i] > 0 || d[i * 4 + 3] > 0) continue;
      const y = (i / W) | 0, x = i % W; let perto = false;
      for (let k = -18; k <= 18 && !perto; k += 3) for (let q = -18; q <= 18 && !perto; q += 3) { const xx = x + k, yy = y + q; if (xx >= 0 && xx < W && yy >= 0 && yy < H && (antigo[yy * W + xx] > 0 || d[(yy * W + xx) * 4 + 3] > 0)) perto = true; }
      if (perto) continue;
      if (out[i * 3] !== foto[i * 3] || out[i * 3 + 1] !== foto[i * 3 + 1] || out[i * 3 + 2] !== foto[i * 3 + 2]) mudou++;
    }
    await sharp(out, { raw: { width: W, height: H, channels: 3 } }).png().toFile(path.join('tools/_qa', `montagem-${v}.png`));
    await sharp(out, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 86 }).toFile(path.resolve('assets/img/loja', `${v}.webp`));
    console.log(v, 'ok · pixels da foto alterados fora do expositor antigo e do display novo:', mudou);
  }
})();
