// Prepara as imagens do deck: versões (estúdio) e fotos da loja normalizadas para o antes × depois.
// Uso: NODE_PATH=<node_modules com sharp> node tools/prep-images.cjs
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const IMG = path.resolve('assets/img');
const W = 900, H = 1600;
(async () => {
  // fotos da loja: mesmo quadro (cover + centro) para o comparador
  const loja = [['atual', 'src/atual.png'], ['mdf', 'loja/loja-mdf.png'], ['aramado', 'loja/loja-aramado.png'], ['metalon', 'loja/loja-metalon.png']];
  for (const [id, src] of loja) {
    await sharp(path.join(IMG, src)).resize(W, H, { fit: 'cover', position: 'centre' }).webp({ quality: 84 }).toFile(path.join(IMG, 'loja', `${id}.webp`));
  }
  // versões em estúdio (com as cotas da arte original)
  const ver = ['v1-mdf', 'v2-aramado', 'v4-metalon'];
  for (const v of ver) {
    await sharp(path.join(IMG, 'src', `${v}.png`)).webp({ quality: 86 }).toFile(path.join(IMG, 'versoes', `${v}.webp`));
    await sharp(path.join(IMG, 'src', `${v}.png`)).resize({ width: 420 }).webp({ quality: 80 }).toFile(path.join(IMG, 'versoes', `${v}_thumb.webp`));
  }
  // conferência de alinhamento: diferença entre a foto atual e cada montagem (só para QA, fora do site)
  fs.mkdirSync('tools/_qa', { recursive: true });
  const a = await sharp(path.join(IMG, 'loja', 'atual.webp')).raw().toBuffer();
  for (const id of ['mdf', 'aramado', 'metalon']) {
    const b = await sharp(path.join(IMG, 'loja', `${id}.webp`)).raw().toBuffer();
    const d = Buffer.alloc(a.length);
    for (let i = 0; i < a.length; i++) d[i] = Math.min(255, Math.abs(a[i] - b[i]) * 2);
    await sharp(d, { raw: { width: W, height: H, channels: 3 } }).resize({ width: 300 }).png().toFile(`tools/_qa/dif-${id}.png`);
  }
  console.log('ok');
})();
