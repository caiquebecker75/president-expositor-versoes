// Prepara a foto real do ponto na Festval (o "antes" do comparador) no quadro 900 × 1600.
// As versões e as montagens saem dos modelos da AR: tools/render-ar.mjs, tools/versoes-ar.mjs e tools/loja-ar.cjs.
// Uso: NODE_PATH=<node_modules com sharp> node tools/prep-images.cjs
const sharp = require('sharp');
const path = require('path');

const IMG = path.resolve('assets/img');
(async () => {
  await sharp(path.join(IMG, 'src', 'atual.png')).resize(900, 1600, { fit: 'cover', position: 'centre' }).webp({ quality: 84 }).toFile(path.join(IMG, 'loja', 'atual.webp'));
  console.log('ok');
})();
