// Retoque da montagem do MDF: a coluna de madeira pousava em cima da base preta da gôndola vizinha.
// A faixa de chão e a base vêm da montagem do Aramado, já alinhada à mesma foto, com a cor ajustada e a base
// um pouco afastada, para o pé ficar no piso com folga. A madeira, o painel vermelho e os pacotes de Rap10
// continuam intactos. Coordenadas na imagem 900×1600.
const sharp = require('sharp');

const W = 900, H = 1600;

// o que muda: chão e base preta ao redor do canto do expositor
const ZONA = [[566, 1640], [566, 1530], [660, 1490], [700, 1440], [790, 1420], [772, 1490], [752, 1530], [732, 1565], [710, 1640]];
// o que fica: coluna de madeira, painel vermelho e pacotes
const EXPOSITOR = [[300, 1400], [672, 1400], [671.8, 1440], [670.6, 1531.6], [659.2, 1534.8], [657.6, 1529.2], [540, 1556.2], [300, 1611]];
const PACOTES = [[671, 1400], [724, 1400], [722, 1444], [712, 1460], [703, 1465.5], [681, 1489], [671.4, 1499]];
// sombra de contato do expositor no chão
const SOMBRA = [[556, 1552.5], [657.6, 1529], [659.2, 1534.8], [670.6, 1531.6], [674, 1530], [674, 1536], [661, 1541]];

// base preta na montagem do Aramado: centro e meia largura, medidos na imagem
const centroBase = y => 701 - 0.829 * (y - 1520);
const MEIA_BASE = 15;
// afastamento: nasce onde a base sai de trás dos pacotes e chega a 12 px na altura do pé
const afasta = y => Math.max(0, 12 * (y - 1430) / 102);
const TRANSICAO = 45; // px em que o afastamento some, dos dois lados da base
const ULTIMA_LINHA = 1594; // abaixo dela a montagem do Aramado só repete a borda; as diagonais seguem pela inclinação da base
const INCLINACAO = 0.829;

const suave = t => { const u = Math.min(1, Math.max(0, t)); return u * u * (3 - 2 * u); };

const mascara = async (poligonos, sigma) => {
  const formas = poligonos.map(p => `<polygon points="${p.map(q => q.join(',')).join(' ')}" fill="#fff"/>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="#000"/>${formas}</svg>`;
  let img = sharp(Buffer.from(svg)).flatten({ background: '#000' });
  if (sigma) img = img.blur(sigma);
  return img.extractChannel(0).raw().toBuffer();
};

const rgb = input => sharp(input).removeAlpha().raw().toBuffer();

module.exports = async function retocarMdf(mdf, aramado) {
  const a = await rgb(mdf), b = await rgb(aramado);
  const zona = await mascara([ZONA], 5);
  const fica = await mascara([EXPOSITOR, PACOTES], 0.6);
  const sombra = await mascara([SOMBRA], 2.6);

  // acerta a cor do chão do Aramado pelo trecho de piso que as duas montagens têm em comum
  const soma = [[0, 0, 0], [0, 0, 0]];
  for (let y = 1450; y < 1585; y++) for (let x = 770; x < 880; x++) {
    const i = (y * W + x) * 3;
    for (let c = 0; c < 3; c++) { soma[0][c] += a[i + c]; soma[1][c] += b[i + c]; }
  }
  const ganho = [0, 1, 2].map(c => soma[0][c] / soma[1][c]);

  for (let y = 1400; y < H; y++) for (let x = 500; x < 820; x++) {
    const p = y * W + x, i = p * 3;
    const livre = 1 - fica[p] / 255;
    const al = (zona[p] / 255) * livre;
    const sb = 1 - 0.34 * (sombra[p] / 255) * livre;

    // onde buscar no Aramado: a base anda inteira, o chão vizinho acompanha aos poucos
    const d = afasta(y);
    const dist = Math.abs(x - d - centroBase(y));
    const ys = Math.min(y, ULTIMA_LINHA);
    const xs = x - d * (1 - suave((dist - MEIA_BASE - 2) / TRANSICAO)) + INCLINACAO * (y - ys);
    const x0 = Math.floor(xs), f = xs - x0, i0 = (ys * W + x0) * 3;

    for (let c = 0; c < 3; c++) {
      const fonte = b[i0 + c] * (1 - f) + b[i0 + 3 + c] * f;
      const v = a[i + c] * (1 - al) + Math.min(255, fonte * ganho[c]) * al;
      a[i + c] = Math.round(v * sb);
    }
  }
  return sharp(a, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer();
};
