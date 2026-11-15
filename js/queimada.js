'use strict';
/* =====================================================================
   v27 · La queimada de la meiga Pura (en la Alameda, tras el meigallo)
   Ángel, que «ten o don», recita el conxuro mientras tú remueves:
   - Remover (girar el dedo o el ratón alrededor del pote, o pulsar
     espacio) aviva la llama. Si no remueves, se apaga; si te pasas,
     arde la Alameda.
   - La meiga pide ingredientes: azúcar, café o limón. Toca el bueno a
     tiempo.
   El dibujo del pote es provisional hasta que Marcos haga el suyo:
   si existe img/items/queimada.webp se usa ese.
   ===================================================================== */
LOGROS.queimada = { i: '🔥', t: 'Queimada con la meiga' };
EXTRA_ASSETS.push('chars/angel_recita1', 'chars/angel_recita2', 'chars/meiga_remueve1', 'chars/meiga_remueve2', 'items/queimada', 'items/azucar', 'items/cafe_granos', 'items/limon');
// dónde está la boca del pote en cada dibujo de la meiga (fracción del ancho y del alto)
const QM_BOCA = { meiga_remueve1: [0.556, 0.63], meiga_remueve2: [0.61, 0.615] };
const QUEIMADA_CONXURO = [
  'Pola lúa chea e polo cruceiro de pedra…',
  '…que se vaian as meigas malas e os gardas da N-550.',
  'Lume do Club, queima as penas e as resacas…',
  '…que Marcos chegue sereno a Caldas. Ou que o pareza.',
  'Que Ramis non perda os calzóns. Outra vez.',
  'E que esta noite non remate nunca. ¡Amén… ou o que sexa!',
];

MG.queimada = function () {
  const m = { drunk: 0, name: 'queimada' };
  const drawImgH = MG.drawImgH;
  const PX = 800, PY = 760, LINEA = 5, DUR = QUEIMADA_CONXURO.length * LINEA;
  const ING = { azucar: 'Azúcar', cafe: 'Café', limon: 'Limón' };
  const IMG = { azucar: 'azucar', cafe: 'cafe_granos', limon: 'limon' };
  const BX = 210, BY = (i) => 470 + i * 150;   // los ingredientes, en columna a la izquierda
  const PIDE = { azucar: '¡Azucre!', cafe: '¡Café!', limon: '¡Casca de limón!' };
  let clock = 0, lume = 0.55, bien = 0, total = 0, ang = null, msg = null, fin = false, apagones = 0, incendios = 0;
  let pide = null, pideT = 0, nextPide = 3, aciertos = 0, fallos = 0, remT = 0, remF = 0, vuela = null, boca = { x: PX, y: PY };
  const top = MG.bar('');
  top.innerHTML = '🔥 Remueve la queimada (gira alrededor del pote o pulsa espacio) · mantén la llama en la zona buena · y dale a la meiga lo que pida';
  const dar = (k) => {
    if (fin) return;
    if (pide === k) { aciertos++; sfx('ok'); vuela = { k, t: 0, x0: BX + 40, y0: BY(Object.keys(ING).indexOf(k)) + 40 }; lume = Math.min(1, lume + 0.08); msg = { t: pick(['Iso é, rapaz.', 'Ben feito.', 'Así, así.']), hasta: clock + 1.4, m: 1 }; }
    else { fallos++; sfx('error'); msg = { t: pide ? 'Iso non, rapaz! Pedín ' + PIDE[pide].toLowerCase() : 'Aínda non pedín nada!', hasta: clock + 1.6, m: 1 }; }
    pide = null;
  };
  const btns = Object.keys(ING).map((k, i) => MG.btn(`<img src="img/items/${IMG[k]}.webp" alt="" style="height:64px;vertical-align:middle;margin-right:8px">${ING[k]}`, BX, BY(i), 'grn', () => dar(k)));
  const remover = (q) => { lume = Math.min(1.08, lume + q); remT = 0.25; remF += q; if (Math.random() < 0.5) emit('spark', boca.x + rnd(-40, 40), boca.y - 40, 2, { color: '#7fb8ff', sx: 30, sy: 10 }); };
  m.down = (p) => { ang = Math.atan2(p.y - boca.y, p.x - boca.x); };
  m.move = (p, e) => {
    if (ang === null && !(e && e.pointerType === 'mouse')) return;
    if (Math.hypot(p.x - boca.x, p.y - boca.y) > 360) { ang = null; return; }
    const a = Math.atan2(p.y - boca.y, p.x - boca.x);
    if (ang !== null) { let d = a - ang; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; remover(Math.abs(d) * 0.028); }
    ang = a;
  };
  m.up = () => { ang = null; };
  m.key = (k, d) => {
    if (!d) return;
    if (k === ' ' || k === 'Enter') remover(0.05);
    const i = '123'.indexOf(k); if (i >= 0) dar(Object.keys(ING)[i]);
  };
  m.update = (dt) => {
    clock += dt; remT -= dt; if (vuela) { vuela.t += dt; if (vuela.t > 0.7) { emit('spark', boca.x, boca.y - 20, 16, { color: '#9ad8ff', sx: 40, sy: 20 }); vuela = null; } }
    if (fin) return;
    // la llama se va apagando; borracho, la mano tiembla y cuesta más
    lume -= dt * (0.09 + (S ? S.drunk.angel : 0) * 0.01);
    if (lume <= 0.06) { lume = 0.4; apagones++; sfx('error'); msg = { t: '¡Que se apaga! ¡Remove, rapaz!', hasta: clock + 1.6, m: 1 }; }
    if (lume >= 1) { lume = 0.7; incendios++; sfx('error'); flash('#ff9a3a', 0.5); msg = { t: '¡Que arde a Alameda! ¡Máis amodo!', hasta: clock + 1.6, m: 1 }; }
    total += dt; if (lume > 0.35 && lume < 0.85) bien += dt;
    // los ingredientes
    if (pide) { pideT -= dt; if (pideT <= 0) { fallos++; sfx('error'); msg = { t: 'Tarde, rapaz. Tarde.', hasta: clock + 1.3, m: 1 }; pide = null; } }
    else { nextPide -= dt; if (nextPide <= 0 && clock < DUR - 3) { pide = pick(Object.keys(ING)); pideT = 2.6; nextPide = rnd(2.6, 4.2); sfx('tic'); } }
    // chispas de la llama
    if (Math.random() < dt * 30 * lume) emit('spark', boca.x + rnd(-40, 40), boca.y - 30 - lume * 60, 1, { color: lume > 0.85 ? '#ffb347' : '#6fa8ff', sx: 10, sy: 10 });
    if (clock >= DUR) {
      fin = true; btns.forEach((b) => b.classList.add('hidden'));
      const pct = bien / Math.max(1, total), nota = clamp(pct * 2 + aciertos * 0.25 - fallos * 0.2 - (apagones + incendios) * 0.15, 0, 3);
      msg = { t: nota >= 2 ? '¡Queimada de concurso!' : nota >= 1 ? 'Bebible. Que non é pouco.' : 'Isto sabe a gasolina, rapaz.', hasta: clock + 3, m: 1 };
      setTimeout(() => m.end({ nota, aciertos, fallos, pct }), 2200);
    }
  };
  m.draw = (c, t) => {
    MG.bg(c, 'alameda', 0.55);
    // la meiga remueve su pote (cambia de dibujo cuando tú remueves) y Ángel recita, a ratos con los brazos en alto
    const mk = (Math.floor(remF / 0.35) % 2) ? 'meiga_remueve2' : 'meiga_remueve1', mim = G.img['chars/' + mk], MH = 640;
    if (mim) { const mw = mim.width * MH / mim.height; boca = { x: PX - mw / 2 + QM_BOCA[mk][0] * mw, y: 1000 - MH + QM_BOCA[mk][1] * MH }; }
    // la luz azul de la queimada sobre todo
    const r = 260 + lume * 260 + Math.sin(t * 9) * 12;
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(boca.x, boca.y - 60, 10, boca.x, boca.y - 60, r);
    g.addColorStop(0, `rgba(110,160,255,${0.25 + lume * 0.3})`); g.addColorStop(1, 'rgba(110,160,255,0)'); c.fillStyle = g; c.fillRect(boca.x - r, boca.y - 60 - r, r * 2, r * 2); c.restore();
    drawImgH(c, mim ? 'chars/' + mk : 'chars/meiga_reza', PX, 1000, MH);
    const ak = Math.floor(clock / (LINEA / 2)) % 2 ? 'chars/angel_recita2' : 'chars/angel_recita1';
    drawImgH(c, G.img[ak] ? ak : bodySprite('angel'), 1210, 1000, 560, { rot: Math.sin(t * 2) * 0.01 });
    // el ingrediente que vuela al pote
    if (vuela) { const k = clamp(vuela.t / 0.7, 0, 1); drawImgH(c, 'items/' + IMG[vuela.k], vuela.x0 + (boca.x - vuela.x0) * k, vuela.y0 + (boca.y - vuela.y0) * k - Math.sin(k * Math.PI) * 260, 80, { center: true, rot: k * 5 }); }
    // la llama: azul si va bien, naranja si se pasa
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const fx = boca.x + Math.sin(t * 6 + i * 1.7) * 32, fh = (40 + lume * 150) * (0.7 + 0.3 * Math.sin(t * 11 + i)), fy = boca.y - 6 - fh * 0.5;
      const fg = c.createRadialGradient(fx, fy, 2, fx, fy, fh * 0.7);
      fg.addColorStop(0, lume > 0.85 ? 'rgba(255,190,90,.55)' : 'rgba(140,190,255,.5)'); fg.addColorStop(1, 'rgba(60,90,255,0)');
      c.fillStyle = fg; c.beginPath(); c.ellipse(fx, fy, fh * 0.24, fh * 0.7, 0, 0, 7); c.fill();
    }
    c.restore();
    drawParticles(c);
    // el medidor de la llama
    const bx = 1460, by = 260, bh = 480;
    c.save(); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(bx, by, 44, bh);
    c.fillStyle = 'rgba(120,255,150,.25)'; c.fillRect(bx, by + bh * (1 - 0.85), 44, bh * 0.5);
    const lv = clamp(lume, 0, 1); c.fillStyle = lume > 0.85 ? '#ff9a3a' : lume < 0.35 ? '#5a6aa0' : '#7fb8ff'; c.fillRect(bx + 6, by + bh * (1 - lv), 32, bh * lv);
    c.font = "800 22px 'Nunito'"; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText('🔥', bx + 22, by - 16); c.restore();
    // el conxuro de Ángel, como subtítulo
    const li = Math.min(QUEIMADA_CONXURO.length - 1, Math.floor(clock / LINEA));
    c.save(); c.font = "italic 700 36px 'Cinzel', serif"; c.textAlign = 'center'; c.lineWidth = 8; c.strokeStyle = 'rgba(0,0,0,.85)'; c.fillStyle = '#d9c6ff';
    c.strokeText('Ángel: «' + QUEIMADA_CONXURO[li] + '»', W / 2, 200); c.fillText('Ángel: «' + QUEIMADA_CONXURO[li] + '»', W / 2, 200); c.restore();
    // lo que pide la meiga
    if (pide) {
      c.save(); c.font = "800 44px 'Nunito'"; c.textAlign = 'center'; c.lineWidth = 8; c.strokeStyle = '#000'; c.fillStyle = '#ffd23a';
      c.strokeText('Meiga: ' + PIDE[pide], PX, 320); c.fillText('Meiga: ' + PIDE[pide], PX, 320);
      c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(PX - 150, 345, 300, 12); c.fillStyle = '#ffd23a'; c.fillRect(PX - 150, 345, 300 * clamp(pideT / 2.6, 0, 1), 12); c.restore();
    }
    if (remT > 0) { c.save(); c.font = "800 26px 'Nunito'"; c.textAlign = 'center'; c.fillStyle = '#bfe0ff'; c.fillText('🥄 removendo…', PX, 1030 - 60); c.restore(); }
    else if (!fin) { c.save(); c.font = "800 24px 'Nunito'"; c.textAlign = 'center'; c.fillStyle = 'rgba(255,255,255,.65)'; c.fillText('↻ gira alrededor del pote para remover', PX, 1030 - 60); c.restore(); }
    if (msg && clock < msg.hasta) { c.save(); c.font = "800 38px 'Nunito'"; c.textAlign = 'center'; c.lineWidth = 8; c.strokeStyle = '#000'; c.strokeText(msg.t, W / 2, 112); c.fillStyle = '#ffd9a8'; c.fillText(msg.t, W / 2, 112); c.restore(); }
    // el tiempo
    c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(500, 250, 600, 10); c.fillStyle = '#c9a0ff'; c.fillRect(500, 250, 600 * clamp(1 - clock / DUR, 0, 1), 10);
  };
  return MG.begin(m);
};

/* ---------- se cuelga de la charla con la meiga, una vez hecho el meigallo ---------- */
async function queimadaMeiga() {
  await say('meiga', flag('queimada') ? 'Outra? Ai, estes rapaces… Veña, o barbas recita e ti remove.' : 'Unha queimada? Para espantar os malos espíritos… e as resacas. Ti, barbas, recita. E remove sen parar.', 'risa');
  await say('angel', 'Yo no me sé el conxuro…', 'sorpresa');
  await say('meiga', 'Ti tes o don. As palabras veñen soas.', 'reza');
  music('meiga');
  const r = await MG.queimada();
  const nota = r && r.nota !== undefined ? r.nota : 2.5;
  music('alameda');
  flag('queimada', 1);
  if (nota >= 2) { await say('meiga', 'Esta queimada podería servirse no balneario. Ide con Deus, rapaces.', 'risa'); logro('queimada'); }
  else if (nota >= 1) await say('meiga', 'Non está mal. Para ser a primeira…');
  else await say('meiga', 'Iso queimou ata o cruceiro. Bebede, que xa está feita.');
  ['ramis', 'marc', 'angel'].forEach((p) => drink(p, 1, true)); sfx('brindis');
  await say('ramis', nota >= 2 ? '¡Esto resucita a un muerto! Bueno, a Don Xesús no, que ya está bien así.' : 'Sabe a… a experiencia.', 'risa');
  await tentarMarcos({ prompt: 'La meiga le ofrece una cunca de queimada a Marcos…', si: '«Una cunquiña no hace daño»', no: '«Gracias, señora, pero conduzco»' });
}
if (typeof meigaTalk === 'function') {
  const _m = meigaTalk;
  meigaTalk = async () => {
    const vc = typeof VC !== 'undefined' && VC.on;
    if (vc || !S.flags.meigallo || S.active !== 'angel') return _m();
    const v = await choose([{ t: '💬 Hablar', v: 0 }, { t: '🔥 «¿Nos haría una queimada?»', v: 1 }]);
    return v ? queimadaMeiga() : _m();
  };
}
