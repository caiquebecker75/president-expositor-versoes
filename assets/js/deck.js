/* =========================================================================
   Expositor Président · 3 versões × 75LAB · motor da apresentação
   HTML, CSS e JS puros, sem dependências.
   Teclas: ← → (ou espaço) navegam · M índice · F tela cheia · Home/End.
   QA: ?static (sem movimento) · ?draft (mostra telas em rascunho) · ?desktop · ?ar=2.2
   ========================================================================= */
(() => {
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const html = document.documentElement;
const stage = $('#stage');
const STATIC = /[?&]static(=|&|$)/.test(location.search);
if (STATIC) html.classList.add('static');
const RM = STATIC || matchMedia('(prefers-reduced-motion: reduce)').matches;
const MQ = matchMedia('(max-width: 820px), (orientation: portrait) and (max-width: 1100px)');
const forceDesk = /[?&]desktop(=|&|$)/.test(location.search);
const mobile = !forceDesk && MQ.matches;
if (mobile) html.classList.add('m');
if (!forceDesk) MQ.addEventListener?.('change', () => location.reload());

// data-draft: tela pronta que só entra quando tiver conteúdo (?draft mostra)
if (/[?&]draft(=|&|$)/.test(location.search)) $$('.slide[data-draft]', stage).forEach(s => s.removeAttribute('data-draft'));
$$('.slide[data-draft]', stage).forEach(s => s.remove());
const slides = $$('.slide', stage);
const pad = n => String(n).padStart(2, '0');
let cur = null, busy = false;

/* ---------------------------------------------------------------------
   Conteúdo gerado: notas (pontos de 1 a 5) e ordem de entrada
   --------------------------------------------------------------------- */
const NOTAS = ['Percepção premium', 'Durabilidade', 'Leveza', 'Troca de comunicação'];
const dots = n => Array.from({ length: 5 }, (_, i) => `<i class="d${i < n ? ' on' : ''}"></i>`).join('');
$$('.notas').forEach(dl => {
  const v = dl.dataset.n.split(',').map(Number);
  dl.innerHTML = NOTAS.map((t, i) => `<dt>${t}</dt><dd aria-label="${t}: ${v[i]} de 5">${dots(v[i])}</dd>`).join('');
});
$$('.tabela [data-d]').forEach(c => { const n = +c.dataset.d; c.innerHTML = dots(n); c.setAttribute('aria-label', `${n} de 5`); });
slides.forEach(s => {
  $$('.rv', s).forEach((el, i) => el.style.setProperty('--i', i));
  $$('.pin', s).forEach((el, i) => el.style.setProperty('--d', i));
  $$('.anat-tags li', s).forEach((el, i) => el.style.setProperty('--d', i));
});

/* ---------------------------------------------------------------------
   Palco: 900 de altura, largura que acompanha a janela (1600 a 2100)
   --------------------------------------------------------------------- */
const qa = parseFloat((location.search.match(/[?&]ar=([\d.]+)/) || [])[1]) || 0;
function fit() {
  if (!mobile) {
    const vw = innerWidth, vh = innerHeight; if (!vw || !vh) return;
    const a = qa || vw / vh;
    let W = 1600, H = 900;
    if (a > 16 / 9) W = Math.min(2100, Math.round(900 * a));
    else H = Math.min(1100, Math.round(1600 / a));
    stage.style.width = W + 'px'; stage.style.height = H + 'px';
    stage.style.setProperty('--scale', Math.min(vw / W, vh / H).toFixed(4));
  }
  layout();
}
function layout() { layoutAnat(); }

/* anatomia: linhas do ponto da peça até a etiqueta */
function layoutAnat() {
  const box = $('#anat'); if (!box || mobile) return;
  const fig = $('.anat-fig', box), svg = $('.anat-lines', box);
  const b = box.getBoundingClientRect(), f = fig.getBoundingClientRect();
  const k = b.width / box.offsetWidth || 1; // escala do palco
  const fx = (f.left - b.left) / k, fy = (f.top - b.top) / k, fw = f.width / k, fh = f.height / k;
  const tags = $$('.anat-tags li', box);
  const right = tags.filter(t => !t.classList.contains('esq'));
  // etiquetas da direita em coluna, na ordem vertical dos pontos
  const colX = fx + fw + 34;
  let lines = '';
  right.forEach(t => {
    const [ax, ay] = t.dataset.a.split(',').map(Number);
    const px = fx + fw * ax / 100, py = fy + fh * ay / 100;
    t.style.left = colX + 'px'; t.style.top = py + 'px';
    lines += `<line x1="${px}" y1="${py}" x2="${colX}" y2="${py}"/><circle cx="${px}" cy="${py}" r="4"/>`;
  });
  tags.filter(t => t.classList.contains('esq')).forEach(t => {
    const [ax, ay] = t.dataset.a.split(',').map(Number);
    const px = fx + fw * ax / 100, py = fy + fh * ay / 100;
    const w = t.offsetWidth;
    const x = Math.max(0, fx - 24 - w);
    t.style.left = x + 'px'; t.style.top = py + 'px';
    lines += `<line x1="${x + w}" y1="${py}" x2="${px}" y2="${py}"/><circle cx="${px}" cy="${py}" r="4"/>`;
  });
  svg.innerHTML = lines;
}

/* ---------------------------------------------------------------------
   Antes × depois na loja
   --------------------------------------------------------------------- */
const LOJA = {
  mdf: { nome: 'MDF', notas: ['A madeira clara conversa com o piso e as gôndolas da Festval.', 'A marca aparece no topo, na lateral e no rodapé.', 'O ralado fica em três fileiras, separado por gramatura.'] },
  aramado: { nome: 'Aramado', notas: ['O preto sai do caminho e deixa as embalagens em primeiro plano.', 'O painel lateral com parmesão e massa chama quem vem pelo corredor.', 'Cestos com faixa de preço para cada produto.'] },
  metalon: { nome: 'Metalon', notas: ['Moldura amadeirada com filete dourado, no padrão da loja.', 'Estrutura firme, que não balança com o movimento do corredor.', 'Ganchos dourados alinhados por gramatura.'] },
};
const cmp = $('#cmp');
let cmpTab = 'mdf';
function setP(p) { cmp.style.setProperty('--p', Math.max(0, Math.min(100, p)) + '%'); }
function setTab(t, animate = true) {
  if (!LOJA[t]) return;
  cmpTab = t;
  $$('.tabs [data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t));
  $('.cmp-depois', cmp).src = `assets/img/loja/${t}.webp`;
  $('#cmpName').textContent = LOJA[t].nome;
  $('#lojaNotas').innerHTML = LOJA[t].notas.map(n => `<li>${n}</li>`).join('');
  if (animate && !RM) sweep();
}
function sweep() { // entra mostrando só o antes e abre até o meio
  cmp.classList.remove('used');
  const t0 = performance.now(), from = 100, to = 50, du = 1100;
  // para assim que a pessoa pega a linha (pointerdown marca .used)
  const tick = now => { if (cmp.classList.contains('used')) return; const k = Math.min(1, (now - t0) / du), e = 1 - Math.pow(1 - k, 3); setP(from + (to - from) * e); if (k < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
if (cmp) {
  let drag = false;
  const at = e => { const r = cmp.getBoundingClientRect(); setP((e.clientX - r.left) / r.width * 100); };
  cmp.addEventListener('pointerdown', e => { e.preventDefault(); drag = true; cmp.setPointerCapture(e.pointerId); cmp.classList.add('used'); at(e); });
  cmp.addEventListener('pointermove', e => { if (drag) at(e); });
  cmp.addEventListener('pointerup', () => { drag = false; });
  cmp.addEventListener('pointercancel', () => { drag = false; });
  $$('.tabs [data-tab]').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
  setTab('mdf', false);
}

/* ---------------------------------------------------------------------
   Realidade aumentada: 3D na tela e QR para o celular
   Visualizador, fundo e modelos vêm da página de AR da 75LAB (mesmo domínio),
   então qualquer ajuste feito lá já aparece aqui. Só carrega ao entrar na tela.
   --------------------------------------------------------------------- */
const AR_BASE = 'https://projetos.75lab.com.br/ar/';
const AR_PAGE = AR_BASE + 'lactalis-president-displays-parmesao/';
const AR = {
  mdf: { id: 'pr01', nome: 'MDF', apelido: 'Madeira Curva' },
  aramado: { id: 'pr04', nome: 'Aramado', apelido: 'Aramado Preto' },
  metalon: { id: 'pr03', nome: 'Metalon', apelido: 'Madeira e Dourado' },
};
const arView = $('#arView');
let arTab = 'mdf', arAberto = false, arPre = false, arLib = null;
const arUrl = (t, sufixo) => `${AR_PAGE}${AR[t].id}${sufixo}?v=1`;
const arAviso = () => { $('#arHint').textContent = '3D indisponível: confira a conexão. O código funciona no celular.'; $('#arProg').classList.add('done'); };
const carregarMV = () => (arLib ||= import(AR_BASE + 'vendor/model-viewer.min.js').catch(arAviso));
function arBarra(p) { $('#arProg i').style.width = Math.round(p * 100) + '%'; $('#arProg').classList.toggle('done', p >= 1); }
function arModelo() {
  arBarra(0);
  arView.setAttribute('poster', arUrl(arTab, '-poster.webp'));
  arView.setAttribute('alt', `Expositor Président versão ${AR[arTab].nome} em 3D`);
  arView.setAttribute('src', arUrl(arTab, '.glb'));
}
function setAr(t) {
  if (!AR[t]) return;
  arTab = t;
  $$('.ar-tabs [data-ar]').forEach(b => b.setAttribute('aria-selected', b.dataset.ar === t));
  $('#arQr').src = `assets/img/ar/qr-${t}.svg`;
  $$('[data-ar-link]').forEach(a => { a.href = `${AR_PAGE}?modelo=${AR[t].id}`; });
  $('#arNome').innerHTML = `<b>${AR[t].nome}</b>${AR[t].apelido}`;
  if (arAberto) arModelo();
}
function arFoco(on) { // gira só com a tela visível; sai de cena sem gastar a placa de vídeo
  if (on) {
    if (!arAberto) { arAberto = true; carregarMV(); arModelo(); }
    if (!RM) arView.setAttribute('auto-rotate', '');
  } else if (!mobile) arView.removeAttribute('auto-rotate');
}
arView.addEventListener('progress', e => arBarra(e.detail.totalProgress));
arView.addEventListener('error', arAviso);
arView.addEventListener('load', () => { // deixa as outras versões prontas para a troca ser imediata
  if (mobile || arPre) return;
  arPre = true;
  Object.keys(AR).forEach(t => fetch(arUrl(t, '.glb'), { mode: 'cors' }).catch(() => {}));
});
$$('.ar-tabs [data-ar]').forEach(b => b.addEventListener('click', () => setAr(b.dataset.ar)));

/* ---------------------------------------------------------------------
   Lightbox
   --------------------------------------------------------------------- */
const lb = $('#lb');
document.addEventListener('click', e => {
  const z = e.target.closest('[data-zoom]');
  if (z) { $('img', lb).src = $('img', z).src; $('img', lb).alt = $('img', z).alt; lb.classList.add('open'); return; }
  if (lb.classList.contains('open') && (e.target === lb || e.target.closest('.lb button'))) lb.classList.remove('open');
});

/* ---------------------------------------------------------------------
   Navegação
   --------------------------------------------------------------------- */
function activate(s) {
  slides.forEach(x => x.classList.toggle('is-active', x === s));
  const i = slides.indexOf(s);
  $('#pgN').textContent = `${pad(i + 1)} / ${pad(slides.length)}`;
  $('.prog i').style.setProperty('--w', ((i + 1) / slides.length * 100) + '%');
  $('#prev').disabled = i === 0; $('#next').disabled = i === slides.length - 1;
  $$('#menuL button').forEach(b => b.classList.toggle('cur', b.dataset.id === s.id));
  if (location.hash.slice(1) !== s.id) history.replaceState(null, '', '#' + s.id);
}
function onEnter(s) {
  if (s.id === 'padrao') requestAnimationFrame(layoutAnat);
  if (s.id === 'loja' && !RM) sweep();
  arFoco(s.id === 'ar');
}
function show(next, dir) {
  if (!next || next === cur || busy) return;
  const prev = cur;
  cur = next;
  next.classList.remove('is-in');
  activate(next);
  if (prev) prev.style.zIndex = 1;
  next.style.zIndex = 2;
  const settle = () => {
    busy = false;
    if (prev) { prev.classList.remove('is-in'); prev.style.zIndex = ''; prev.style.clipPath = ''; prev.classList.remove('is-active'); }
    next.style.zIndex = ''; next.style.clipPath = '';
  };
  requestAnimationFrame(() => { next.classList.add('is-in'); onEnter(next); });
  if (!prev || RM) { slides.forEach(x => x !== next && x.classList.remove('is-active', 'is-in')); return; }
  prev.classList.add('is-active');
  busy = true;
  const from = dir < 0 ? 'inset(0 100% 0 0)' : 'inset(0 0 0 100%)';
  const a = next.animate([{ clipPath: from }, { clipPath: 'inset(0 0 0 0)' }], { duration: 850, easing: 'cubic-bezier(.75,0,.2,1)' });
  prev.animate([{ transform: 'translateX(0)', opacity: 1 }, { transform: `translateX(${dir < 0 ? 60 : -60}px)`, opacity: .4 }], { duration: 850, easing: 'cubic-bezier(.6,0,.3,1)' });
  a.onfinish = settle; setTimeout(() => busy && settle(), 1300);
}
function go(target, dir) {
  if (typeof target === 'string') target = document.getElementById(target);
  if (!target) return;
  if (mobile) { target.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); return; }
  if (dir === undefined) { const d = slides.indexOf(target) - slides.indexOf(cur); dir = Math.sign(d) || 1; }
  show(target, dir);
}
function step(d) { const i = slides.indexOf(cur) + d; if (i >= 0 && i < slides.length) go(slides[i], d); }
$('#next').addEventListener('click', () => step(1));
$('#prev').addEventListener('click', () => step(-1));
document.addEventListener('click', e => {
  const g = e.target.closest('[data-goto]'); if (!g) return;
  e.preventDefault(); closeMenu();
  if (g.dataset.tab) setTab(g.dataset.tab, false);
  if (g.dataset.ar) setAr(g.dataset.ar);
  go(g.dataset.goto);
});
// clique nas bordas da tela (fora de elementos interativos) volta ou avança
stage.addEventListener('click', e => {
  if (mobile || e.target.closest('button,a,[data-goto],[data-zoom],.cmp,.tabs,.anat,.ar-3d,.ar-qr')) return;
  const r = stage.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
  if (x < .12) step(-1); else if (x > .88) step(1);
});

/* índice */
const menu = $('#menu');
slides.forEach((s, i) => {
  const li = document.createElement('li'), b = document.createElement('button');
  b.type = 'button'; b.dataset.goto = s.id; b.dataset.id = s.id;
  b.innerHTML = `<b>${pad(i + 1)}</b><span>${s.dataset.title}</span>`;
  li.append(b); $('#menuL').append(li);
});
function openMenu() { menu.classList.add('open'); setTimeout(() => ($('#menuL button.cur') || $('#menuL button'))?.focus(), 50); }
function closeMenu() { menu.classList.remove('open'); }
menu.addEventListener('click', e => { if (e.target === menu) closeMenu(); });

document.addEventListener('keydown', e => {
  if (lb.classList.contains('open')) { if (e.key === 'Escape') lb.classList.remove('open'); return; }
  if (menu.classList.contains('open')) { if (e.key === 'Escape' || e.key === 'm' || e.key === 'M') { e.preventDefault(); closeMenu(); } return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  switch (e.key) {
    case 'ArrowRight': case 'PageDown': case 'ArrowDown': e.preventDefault(); step(1); break;
    case ' ': if (e.target.matches?.('button,a')) return; e.preventDefault(); step(1); break;
    case 'ArrowLeft': case 'PageUp': case 'ArrowUp': e.preventDefault(); step(-1); break;
    case 'Home': e.preventDefault(); go(slides[0], -1); break;
    case 'End': e.preventDefault(); go(slides[slides.length - 1], 1); break;
    case 'm': case 'M': e.preventDefault(); openMenu(); break;
    case 'f': case 'F': if (!document.fullscreenElement) html.requestFullscreen?.().catch(() => {}); else document.exitFullscreen?.(); break;
  }
});
if (!mobile) {
  let wLast = 0, wAcc = 0;
  addEventListener('wheel', e => {
    if (lb.classList.contains('open') || menu.classList.contains('open')) return;
    const now = performance.now();
    if (now - wLast > 260) wAcc = 0;
    wAcc += Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(wAcc) > 70 && now - wLast > 950) { step(wAcc > 0 ? 1 : -1); wAcc = 0; wLast = now; }
  }, { passive: true });
  let tx = 0, ty = 0, tt = 0;
  stage.addEventListener('touchstart', e => { const p = e.changedTouches[0]; tx = p.clientX; ty = p.clientY; tt = Date.now(); }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (e.target.closest('.cmp,.ar-3d')) return;
    const p = e.changedTouches[0], dx = p.clientX - tx, dy = p.clientY - ty;
    if (Date.now() - tt < 800 && Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.3) step(dx < 0 ? 1 : -1);
  }, { passive: true });
}
addEventListener('resize', fit);

/* ---------------------------------------------------------------------
   Celular: rolagem vertical, cada tela entra ao aparecer
   --------------------------------------------------------------------- */
if (mobile) {
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting && !en.target.classList.contains('is-in')) { en.target.classList.add('is-in'); onEnter(en.target); } }), { threshold: .2 });
  slides.forEach(s => { s.classList.add('is-active'); io.observe(s); });
  fit();
  return;
}

/* ---------------------------------------------------------------------
   Início
   --------------------------------------------------------------------- */
fit();
const start = document.getElementById(location.hash.slice(1));
show(start && slides.includes(start) ? start : slides[0], 1);
(document.fonts?.ready || Promise.resolve()).then(layout);
addEventListener('load', layout);
addEventListener('load', () => setTimeout(carregarMV, 1500)); // visualizador 3D pronto antes de chegar na tela
addEventListener('hashchange', () => { const t = document.getElementById(location.hash.slice(1)); if (t && t !== cur && slides.includes(t)) go(t); });
})();
