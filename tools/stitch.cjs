// Junta as duas metades capturadas pelo zoom (topo + base) numa imagem só.
// Uso: NODE_PATH=<node_modules com sharp> node tools/stitch.cjs topo.png base.png saida.png [sobreposição px]
const sharp = require('sharp');
const [, , top, bot, out, ovArg] = process.argv;
(async () => {
  const ov = +(ovArg || 2);
  const a = await sharp(top).metadata(), b = await sharp(bot).metadata();
  const w = Math.min(a.width, b.width), h = a.height + b.height - ov;
  const botBuf = await sharp(bot).extract({ left: 0, top: ov, width: w, height: b.height - ov }).toBuffer();
  await sharp({ create: { width: w, height: h, channels: 3, background: '#000' } })
    .composite([{ input: await sharp(top).extract({ left: 0, top: 0, width: w, height: a.height }).toBuffer(), left: 0, top: 0 }, { input: botBuf, left: 0, top: a.height }])
    .png().toFile(out);
  console.log(out, `${w}×${h}`);
})();
