'use strict';
/* =====================================================================
   v23 · Sesión de fotos para Intaclub (poses dibujadas por JRAR)
   Marc saca el móvil: Vera posa en el callejón, Sabela en la Alameda y
   Gary en los soportales. El visor sigue al ratón o al dedo y se dispara
   con un toque (o espacio). La pose cambia sola: unas son buenas (guiño,
   lengua, bota en alto…) y otras no (de espaldas, ojos cerrados, Gary
   tambaleándose). Y de vez en cuando alguien se cuela en la foto.
   Tres fotos: la mejor se publica en Intaclub con sus likes.
   ===================================================================== */
LOGROS.foto = { i: '📸', t: 'Fotógrafo de Intaclub' };
const FOTO = {
  // pose → nota (0 mala … 3 de portada)
  vera: { poses: [[1, 2], [2, 0], [3, 3], [4, 2], [5, 3], [6, 1], [7, 3]], bg: 'callejon', h: 560, bomba: 'pose/guiri_2', sitio: 'el callejón',
    cap: 'Sesión en el callejón con @vera_retratos. Luz de farol y botas militares 🖤 #Musa #ZonaVieja',
    dice: { 3: ['¡Esa! ¡Esa es la buena!', 'Ahora sí: guapa y peligrosa.'], 2: ['Bien. Pero puedes más.', 'Pasable.'], 1: ['¿Me pillaste parpadeando?', 'Repite, anda.'], 0: ['¡¿De espaldas?! Borra eso ahora mismo.', '¿Eso es mi nuca?'] },
    com: [['vera', 'Me has sacado guapa y peligrosa. Otra vez 🖤'], ['tino', 'En O Furado la colgamos en la barra 🤘']] },
  sabela: { poses: [[1, 3], [2, 2], [3, 3], [4, 2], [5, 1], [6, 2], [7, 1]], bg: 'alameda', h: 580, bomba: 'pose/guiri_4', sitio: 'la Alameda',
    cap: 'La profe más artista de Vigo, en la Alameda 🌳 @sabela_plastica #Arte #NocheDeMeigas',
    dice: { 3: ['¡Para la portada del cole!', '¡Esa sí! ¡Arte contemporáneo!'], 2: ['Mona, mona.', 'Bien, pero sin gracia.'], 1: ['¡Jajaja! Salgo con los ojos cerrados.', 'Esa para el cajón.'], 0: ['¿Eso es arte o un accidente?'] },
    com: [['sabela', '¡Me encanta! La pongo de perfil 💕'], ['noa', 'Pues anda que a mí no me hacéis fotos 😒']] },
  guiri: { poses: [[1, 2], [2, 2], [3, 0], [4, 3], [5, 2], [6, 1]], bg: 'calle', h: 560, bomba: 'chars/carla', sitio: 'los soportales',
    cap: 'Gary, from Manchester with love 🍺🇬🇧 Para su madre, que se preocupa #Pontevedra',
    dice: { 3: ['Perfect, mate! For my mum!', 'Lovely! Lovely!'], 2: ['Not bad, mate.', 'Okay-ish.'], 1: ['Mmm… thinking face. No.', 'Again, again!'], 0: ['Oops. Too many pints, mate.', 'Delete it! Mum can\'t see that!'] },
    com: [['guiri', 'Mum says thank you lads! 🇬🇧'], ['carla', 'Me he colado, sí. Contenido de calidad 📲']] },
};
EXTRA_ASSETS.push(...['vera', 'sabela', 'guiri'].flatMap((k) => FOTO[k].poses.map(([n]) => 'pose/' + k + '_' + n)));

MG.foto = function (quien) {
  const F = FOTO[quien];
  const m = { drunk: 0, name: 'foto' };
  const drawImgH = MG.drawImgH;
  const VW = 520, VH = 650, SHOTS = 3;
  let clock = 0, vx = W / 2, vy = 470, pose = F.poses[0], poseT = 0, tiro = 0, fotos = [], flashT = 0, msg = null, fin = false, pendiente = false;
  let bomba = { on: false, x: -300, dir: 1, t: 0 };
  const top = MG.bar('');
  const updTop = () => (top.innerHTML = `📸 Foto ${Math.min(tiro + 1, SHOTS)} de ${SHOTS} · encuadra a ${NAMES[quien] ? NAMES[quien].split(',')[0] : quien} y dispara cuando pose bien`);
  updTop();
  const nuevaPose = () => { let p; do { p = F.poses[(Math.random() * F.poses.length) | 0]; } while (p === pose); pose = p; poseT = 0.75 + Math.random() * 0.7; };
  const modelo = () => ({ x: 800 + Math.sin(clock * 0.6) * 140, y: 975 });
  function disparar() {
    if (fin || pendiente || tiro >= SHOTS) return;
    pendiente = true;
  }
  m.down = (p) => { vx = p.x; vy = p.y; disparar(); };
  m.move = (p) => { vx = p.x; vy = p.y; };
  m.key = (k, d) => { if (d && (k === ' ' || k === 'Enter')) disparar(); };
  m.update = (dt) => {
    clock += dt; flashT = Math.max(0, flashT - dt);
    if (fin) return;
    poseT -= dt; if (poseT <= 0) nuevaPose();
    // alguien se cuela de vez en cuando
    if (!bomba.on && Math.random() < dt * 0.22) { bomba = { on: true, dir: Math.random() < 0.5 ? 1 : -1, t: 0 }; bomba.x = bomba.dir > 0 ? -150 : W + 150; }
    if (bomba.on) { bomba.t += dt; bomba.x += bomba.dir * 520 * dt; if (bomba.x < -300 || bomba.x > W + 300) bomba.on = false; }
    if (msg && clock > msg.hasta) msg = null;
  };
  // la foto: lo que hay dentro del visor
  function hacerFoto(c) {
    const x0 = clamp(vx - VW / 2, 0, W - VW), y0 = clamp(vy - VH / 2, 0, H - VH);
    const cv = document.createElement('canvas'); cv.width = 480; cv.height = 600;
    cv.getContext('2d').drawImage(c.canvas, x0, y0, VW, VH, 0, 0, 480, 600);
    // ¿cuánto sale la modelo dentro del visor?
    const mo = modelo(), im = G.img['pose/' + quien + '_' + pose[0]];
    const mh = F.h, mw = im ? im.width * mh / im.height : 200;
    const ix = Math.max(0, Math.min(x0 + VW, mo.x + mw / 2) - Math.max(x0, mo.x - mw / 2)), iy = Math.max(0, Math.min(y0 + VH, mo.y) - Math.max(y0, mo.y - mh));
    const dentro = (ix * iy) / (mw * mh);
    const encuadre = dentro > 0.8 ? 1 : dentro > 0.45 ? 0.6 : 0.15;
    const colado = bomba.on && bomba.x > x0 - 60 && bomba.x < x0 + VW + 60;
    const nota = pose[1] * encuadre * (colado ? 0.75 : 1);
    const likes = Math.round(150 + nota * 520 + Math.random() * 120 + (colado ? 90 : 0));
    fotos.push({ cv, nota, likes, colado });
    const n = encuadre < 0.6 ? 1 : pose[1];
    msg = { t: encuadre < 0.6 ? '¡Que me cortas! Encuádrame bien.' : colado ? (quien === 'guiri' ? 'Carla, out of my picture!' : '¡Gary! ¡Fuera de mi foto!') : pick(F.dice[n] || F.dice[2]), hasta: clock + 1.9 };
    sfx('foto'); flashT = 0.25; tiro++; updTop();
    if (tiro >= SHOTS) { fin = true; setTimeout(terminar, 2200); }
  }
  function terminar() {
    const best = fotos.slice().sort((a, b) => b.nota - a.nota)[0];
    let img = null; try { img = best.cv.toDataURL('image/jpeg', 0.82); } catch (e) {}
    m.end({ nota: best.nota, likes: best.likes, img, colado: best.colado });
  }
  m.draw = (c, t) => {
    const bg = G.img['bg/' + F.bg]; c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    if (bg) c.drawImage(bg, 0, 0, W, H);
    const mo = modelo();
    // sombra y modelo
    c.save(); c.globalAlpha = 0.45; c.fillStyle = '#000'; c.beginPath(); c.ellipse(mo.x, mo.y - 4, 110, 18, 0, 0, 7); c.fill(); c.restore();
    drawImgH(c, 'pose/' + quien + '_' + pose[0], mo.x, mo.y, F.h);
    if (bomba.on) drawImgH(c, F.bomba, bomba.x, 990, F.h * 0.98, { flip: bomba.dir < 0 });
    // la foto se hace con la escena limpia, antes del visor
    if (pendiente) { pendiente = false; hacerFoto(c); }
    // fuera del visor, oscuro (como la pantalla del móvil)
    const x0 = clamp(vx - VW / 2, 0, W - VW), y0 = clamp(vy - VH / 2, 0, H - VH);
    c.save(); c.fillStyle = 'rgba(0,0,0,.55)';
    c.fillRect(0, 0, W, y0); c.fillRect(0, y0 + VH, W, H - y0 - VH); c.fillRect(0, y0, x0, VH); c.fillRect(x0 + VW, y0, W - x0 - VW, VH);
    // marco del visor: esquinas, tercios y el REC
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 6; const L = 46;
    [[x0, y0, 1, 1], [x0 + VW, y0, -1, 1], [x0, y0 + VH, 1, -1], [x0 + VW, y0 + VH, -1, -1]].forEach(([x, y, sx, sy]) => { c.beginPath(); c.moveTo(x + sx * L, y); c.lineTo(x, y); c.lineTo(x, y + sy * L); c.stroke(); });
    c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 2;
    for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(x0 + VW * i / 3, y0); c.lineTo(x0 + VW * i / 3, y0 + VH); c.stroke(); c.beginPath(); c.moveTo(x0, y0 + VH * i / 3); c.lineTo(x0 + VW, y0 + VH * i / 3); c.stroke(); }
    if (Math.floor(t * 2) % 2 === 0) { c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(x0 + 30, y0 + 30, 9, 0, 7); c.fill(); }
    c.font = "800 22px 'Nunito'"; c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('Intaclub', x0 + 48, y0 + 31);
    c.restore();
    // las fotos hechas, en miniatura abajo a la izquierda
    fotos.forEach((f, i) => { const w = 120, h = 150, x = 30 + i * 135, y = H - h - 30; c.save(); c.translate(x + w / 2, y + h / 2); c.rotate((i - 1) * 0.06); c.fillStyle = '#f4efe2'; c.fillRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 24); c.drawImage(f.cv, -w / 2, -h / 2, w, h); c.restore(); });
    if (msg) { c.save(); c.font = "800 40px 'Nunito'"; c.textAlign = 'center'; c.lineWidth = 8; c.strokeStyle = '#000'; c.strokeText(msg.t, W / 2, 150); c.fillStyle = '#fff'; c.fillText(msg.t, W / 2, 150); c.restore(); }
    if (flashT > 0) { c.fillStyle = `rgba(255,255,255,${flashT * 3})`; c.fillRect(0, 0, W, H); }
  };
  return MG.begin(m);
};

/* ---------- las sesiones: con Marc y el móvil ---------- */
async function sesionFotos(quien) {
  const F = FOTO[quien];
  const r = await MG.foto(quien);
  const nota = r && r.nota !== undefined ? r.nota : 2.5, likes = r && r.likes || 900;
  if (r && r.img && typeof GALERIA !== 'undefined' && GALERIA.foto) GALERIA.foto(quien, r.img, likes, F.cap, F.com);
  flag('foto_' + quien, 1);
  await narr(`Marc sube la mejor a Intaclub. En dos minutos: ${likes.toLocaleString('es-ES')} likes.`);
  if (nota >= 2) await say(quien, quien === 'guiri' ? 'My mum is going to love it! Cheers, mate!' : quien === 'vera' ? 'Me la descargo y te mando un audio. Bueno… igual no.' : '¡Me la pongo de perfil! ¡Eres un artista, Marc!', 'risa');
  else await say(quien, quien === 'guiri' ? 'Hmm… next time, mate.' : '¿Esa es la mejor? Marc, deja el móvil y dedícate a los posavasos.');
  await say('marc', pick(['Manara estaría orgulloso. O celoso.', 'Esto en Intaclub revienta.', 'Luz de farol, modelo de lujo. Talento puro.']));
  logro('foto');
}
async function ofrecerFotos(quien, normal) {
  if (S.active !== 'marc' || !has('movil')) return normal();
  const F = FOTO[quien];
  const v = await choose([
    { t: `📸 «¿Una sesión de fotos para Intaclub en ${F.sitio}?»`, v: 1 },
    { t: '💬 Hablar', v: 0 },
  ]);
  if (!v) return normal();
  if (quien === 'vera') { await say('vera', flag('foto_vera') ? '¿Otra? Vale, pero esta vez que se me vean las botas.' : '¿Fotos? En el callejón de atrás hay un farol que me queda de muerte. Vamos.', 'risa'); }
  else if (quien === 'sabela') await say('sabela', flag('foto_sabela') ? '¡Otra, otra! Que la de antes salí con los ojos cerrados.' : '¡Sí! Aquí, con los árboles y las farolas. ¡Sácame artística!', 'risa');
  else await say('guiri', flag('foto_guiri') ? 'Another one, mate! For my auntie!' : 'A picture for my mum in Manchester? Lovely! Here, under the arches!', 'risa');
  await sesionFotos(quien);
}
// se cuelga de las conversaciones de siempre
if (typeof veraTalk === 'function') { const _v = veraTalk; veraTalk = () => ofrecerFotos('vera', _v); }
if (typeof garyTalk === 'function') { const _g = garyTalk; garyTalk = () => ofrecerFotos('guiri', _g); }
if (typeof vigoTalk === 'function') { const _s = vigoTalk; vigoTalk = (id) => (id === 'sabela' && S.scene === 'alameda' ? ofrecerFotos('sabela', () => _s(id)) : _s(id)); }
