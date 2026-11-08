'use strict';
/* =====================================================================
   v23-v24 · Sesión de fotos para Intaclub (poses dibujadas por JRAR)
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
  vera: { poses: [[1, 2], [2, 0], [3, 3], [4, 2], [5, 3], [6, 1], [7, 3]], bg: 'callejon', y: 775, h: 330, bomba: 'pose/guiri_2', sitio: 'el callejón',
    cap: 'Sesión en el callejón con @vera_retratos. Luz de farol y botas militares 🖤 #Musa #ZonaVieja',
    dice: { 3: ['¡Esa! ¡Esa es la buena!', 'Ahora sí: guapa y peligrosa.'], 2: ['Bien. Pero puedes más.', 'Pasable.'], 1: ['¿Me pillaste parpadeando?', 'Repite, anda.'], 0: ['¡¿De espaldas?! Borra eso ahora mismo.', '¿Eso es mi nuca?'] },
    com: [['vera', 'Me has sacado guapa y peligrosa. Otra vez 🖤'], ['tino', 'En O Furado la colgamos en la barra 🤘']] },
  sabela: { poses: [[1, 3], [2, 2], [3, 3], [4, 2], [5, 1], [6, 2], [7, 1]], bg: 'alameda', y: 800, h: 345, bomba: 'pose/guiri_4', sitio: 'la Alameda',
    cap: 'La profe más artista de Vigo, en la Alameda 🌳 @sabela_plastica #Arte #NocheDeMeigas',
    dice: { 3: ['¡Para la portada del cole!', '¡Esa sí! ¡Arte contemporáneo!'], 2: ['Mona, mona.', 'Bien, pero sin gracia.'], 1: ['¡Jajaja! Salgo con los ojos cerrados.', 'Esa para el cajón.'], 0: ['¿Eso es arte o un accidente?'] },
    com: [['sabela', '¡Me encanta! La pongo de perfil 💕'], ['noa', 'Pues anda que a mí no me hacéis fotos 😒']] },
  guiri: { poses: [[1, 2], [2, 2], [3, 0], [4, 3], [5, 2], [6, 1]], bg: 'calle', y: 805, h: 340, bomba: 'chars/carla', sitio: 'los soportales',
    cap: 'Gary, from Manchester with love 🍺🇬🇧 Para su madre, que se preocupa #Pontevedra',
    dice: { 3: ['Perfect, mate! For my mum!', 'Lovely! Lovely!'], 2: ['Not bad, mate.', 'Okay-ish.'], 1: ['Mmm… thinking face. No.', 'Again, again!'], 0: ['Oops. Too many pints, mate.', 'Delete it! Mum can\'t see that!'] },
    com: [['guiri', 'Mum says thank you lads! 🇬🇧'], ['carla', 'Me he colado, sí. Contenido de calidad 📲']] },
};
EXTRA_ASSETS.push('chars/recep_piensa', 'chars/gente_baila', 'chars/camarero_serio', 'chars/meiga_reza', 'chars/gc2_mira', 'chars/gc1_ok', 'chars/fantasma_guardia', 'chars/fantasma_ataca', 'chars/chica_timida', 'chars/chica_suena');
EXTRA_ASSETS.push(...['vera', 'sabela', 'guiri'].flatMap((k) => FOTO[k].poses.map(([n]) => 'pose/' + k + '_' + n)));

MG.foto = function (quien) {
  // v24: cámara de móvil de verdad. Modo retrato (fondo desenfocado), zoom con la rueda, + / − o los botones
  // (cuanto más zoom, más se nota), enfoque automático a la cara, grano, y si apuntas donde no debes… pillín.
  const F = FOTO[quien];
  const m = { drunk: 0, name: 'foto' };
  const drawImgH = MG.drawImgH;
  const VW = 470, VH = 610, SHOTS = 3, ZMAX = 3;
  let clock = 0, vx = W / 2, vy = 470, zoom = 1, zoomT = 1, pose = F.poses[0], poseT = 0, tiro = 0, fotos = [], flashT = 0, msg = null, fin = false, pendiente = false;
  let downP = null, pillinT = -9, afT = 0, afOn = false;
  let bomba = { on: false, x: -300, dir: 1, t: 0 };
  const top = MG.bar('');
  const updTop = () => (top.innerHTML = `📸 Foto ${Math.min(tiro + 1, SHOTS)} de ${SHOTS} · encuadra, acerca con el zoom y dispara cuando pose bien`);
  updTop();
  // el fondo desenfocado del modo retrato (se hace una vez)
  const bgIm = G.img['bg/' + F.bg];
  const bok = document.createElement('canvas'); bok.width = 240; bok.height = 150;
  if (bgIm) bok.getContext('2d').drawImage(bgIm, 0, 0, 240, 150);
  // grano del sensor
  const grano = document.createElement('canvas'); grano.width = grano.height = 200;
  { const g = grano.getContext('2d'), d = g.createImageData(200, 200); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); }
  const nuevaPose = () => { let p; do { p = F.poses[(Math.random() * F.poses.length) | 0]; } while (p === pose); pose = p; poseT = 0.8 + Math.random() * 0.7; };
  const modelo = () => ({ x: 800 + Math.sin(clock * 0.55) * 150, y: F.y });
  const visor = () => { const x0 = clamp(vx - VW / 2, 10, W - VW - 10), y0 = clamp(vy - VH / 2, 70, H - VH - 90); return { x0, y0, cx: x0 + VW / 2, cy: y0 + VH / 2 }; };
  const zona = () => { const mo = modelo(), im = G.img['pose/' + quien + '_' + pose[0]], mh = F.h, mw = im ? im.width * mh / im.height : 160; return { mo, mh, mw }; };
  const setZoom = (z) => { zoomT = clamp(Math.round(z * 10) / 10, 1, ZMAX); };
  function disparar() { if (fin || pendiente || tiro >= SHOTS) return; pendiente = true; }
  // controles: arrastrar o mover el ratón apunta; un toque (sin arrastrar) dispara
  m.down = (p) => { downP = { x: p.x, y: p.y }; vx = p.x; vy = p.y; };
  m.move = (p, e) => { if (!e || e.pointerType === 'mouse' || downP) { vx = p.x; vy = p.y; } };
  m.up = (p) => { if (downP && Math.hypot(p.x - downP.x, p.y - downP.y) < 22) disparar(); downP = null; };
  m.key = (k, d) => { if (!d) return; if (k === ' ' || k === 'Enter') disparar(); if (k === '+' || k === '=') setZoom(zoomT + 0.5); if (k === '-') setZoom(zoomT - 0.5); };
  const onWheel = (e) => { setZoom(zoomT - Math.sign(e.deltaY) * 0.25); e.preventDefault(); };
  addEventListener('wheel', onWheel, { passive: false });
  MG.btn('➖', 1300, 878, 'zoomb', () => setZoom(zoomT - 0.5));
  MG.btn('◉', 1425, 862, 'shutb', () => disparar());
  MG.btn('➕', 1550, 878, 'zoomb', () => setZoom(zoomT + 0.5));
  m.update = (dt) => {
    clock += dt; flashT = Math.max(0, flashT - dt); zoom += (zoomT - zoom) * Math.min(1, dt * 8);
    if (fin) return;
    poseT -= dt; if (poseT <= 0) nuevaPose();
    if (!bomba.on && Math.random() < dt * 0.2) { bomba = { on: true, dir: Math.random() < 0.5 ? 1 : -1, t: 0 }; bomba.x = bomba.dir > 0 ? -150 : W + 150; }
    if (bomba.on) { bomba.t += dt; bomba.x += bomba.dir * 460 * dt; if (bomba.x < -300 || bomba.x > W + 300) bomba.on = false; }
    // el enfoque automático: se fija cuando el centro del visor está cerca de la cara
    const v = visor(), z = zona(), fx = z.mo.x, fy = z.mo.y - z.mh * 0.86;
    const cerca = Math.hypot(v.cx - fx, v.cy - fy) < 140 / zoom + 60;
    if (cerca && !afOn) { afOn = true; afT = clock; sfx('tic'); } else if (!cerca) afOn = false;
    // ¿dónde estás apuntando?
    const torso = Math.abs(v.cx - z.mo.x) < z.mw * 0.35 && v.cy > z.mo.y - z.mh * 0.66 && v.cy < z.mo.y - z.mh * 0.22;
    if (torso && zoom > 1.6 && clock - pillinT > 3.5) {
      pillinT = clock;
      msg = { t: quien === 'guiri' ? pick(['Oi! My face is up here, mate!', 'Eyes up, mate! Cheeky!']) : pick(['¡Oye, qué pillín! ¿Dónde estás apuntando? ¡Eso para luego!', '¡Eh! La cara la tengo más arriba, ¿eh?', '¡Marc! ¡Que se lo digo a Manara!']), hasta: clock + 2.4, quien };
    }
    if (msg && clock > msg.hasta) msg = null;
  };
  function escena(c, bokeh) {
    if (bgIm) { if (bokeh) { c.save(); c.imageSmoothingEnabled = true; c.drawImage(bok, 0, 0, W, H); c.restore(); } else c.drawImage(bgIm, 0, 0, W, H); }
    const z = zona();
    c.save(); c.globalAlpha = 0.4; c.fillStyle = '#000'; c.beginPath(); c.ellipse(z.mo.x, z.mo.y - 3, z.mw * 0.42, 12, 0, 0, 7); c.fill(); c.restore();
    drawImgH(c, 'pose/' + quien + '_' + pose[0], z.mo.x, z.mo.y, z.mh);
    if (bomba.on) drawImgH(c, F.bomba, bomba.x, F.y + 40, z.mh * 1.08, { flip: bomba.dir < 0 });
  }
  function hacerFoto(c, v) {
    const cv = document.createElement('canvas'); cv.width = 470; cv.height = 610;
    cv.getContext('2d').drawImage(c.canvas, v.x0, v.y0, VW, VH, 0, 0, 470, 610);
    const z = zona(), toS = (x, y) => [v.cx + (x - v.cx) * zoom, v.cy + (y - v.cy) * zoom];
    const [l, tp] = toS(z.mo.x - z.mw / 2, z.mo.y - z.mh), [r, bt] = toS(z.mo.x + z.mw / 2, z.mo.y);
    const ix = Math.max(0, Math.min(v.x0 + VW, r) - Math.max(v.x0, l)), iy = Math.max(0, Math.min(v.y0 + VH, bt) - Math.max(v.y0, tp));
    const dentro = (ix * iy) / ((r - l) * (bt - tp));
    const cabeza = tp >= v.y0 - 4 && tp <= v.y0 + VH * 0.5;                  // la cabeza dentro del encuadre
    const relleno = (bt - tp) / VH;                                          // cuánto ocupa en la foto
    const torso = Math.abs(v.cx - z.mo.x) < z.mw * 0.35 && v.cy > z.mo.y - z.mh * 0.66 && v.cy < z.mo.y - z.mh * 0.22 && zoom > 1.6;
    let enc = dentro > 0.8 ? 1 : dentro > 0.45 ? 0.6 : 0.15;
    if (!cabeza) enc = Math.min(enc, 0.4);
    const tam = relleno >= 0.5 && relleno <= 1.0 ? 1 : relleno < 0.38 ? 0.65 : 0.85;
    const colado = bomba.on && bomba.x > v.x0 - 60 && bomba.x < v.x0 + VW + 60;
    const nota = torso ? 0.4 : pose[1] * enc * tam * (colado ? 0.75 : 1);
    const likes = Math.round(150 + nota * 520 + Math.random() * 120 + (colado ? 90 : 0) + (torso ? 300 : 0));
    fotos.push({ cv, nota, likes, colado });
    let t;
    if (torso) t = quien === 'guiri' ? 'Delete that one, you cheeky lad!' : '¡Esa foto la borras ahora mismo, pillín!';
    else if (!cabeza) t = quien === 'guiri' ? 'Where is my head, mate?' : '¡Que me cortas la cabeza!';
    else if (enc < 0.6) t = quien === 'guiri' ? 'I\'m not in the picture, mate!' : '¡Que me cortas! Encuádrame bien.';
    else if (relleno < 0.38) t = quien === 'guiri' ? 'Closer, mate! Use the zoom!' : '¡Acércate, que salgo como una hormiga!';
    else if (colado) t = quien === 'guiri' ? 'Carla, out of my picture!' : '¡Gary! ¡Fuera de mi foto!';
    else t = pick(F.dice[pose[1]] || F.dice[2]);
    msg = { t, hasta: clock + 2.1 };
    sfx('foto'); flashT = 0.25; tiro++; updTop();
    if (tiro >= SHOTS) { fin = true; setTimeout(terminar, 2200); }
  }
  function terminar() {
    removeEventListener('wheel', onWheel);
    const best = fotos.slice().sort((a, b) => b.nota - a.nota)[0];
    let img = null; try { img = best.cv.toDataURL('image/jpeg', 0.82); } catch (e) {}
    m.end({ nota: best.nota, likes: best.likes, img, colado: best.colado });
  }
  m.draw = (c, t) => {
    const v = visor();
    // 1 · el mundo, tal cual, y oscuro: lo que queda fuera del móvil
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    escena(c, false);
    c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(0, 0, W, H);
    // 2 · la pantalla del móvil: modo retrato, con zoom
    c.save(); c.beginPath(); c.rect(v.x0, v.y0, VW, VH); c.clip();
    c.fillStyle = '#000'; c.fillRect(v.x0, v.y0, VW, VH);
    c.translate(v.cx, v.cy); c.scale(zoom, zoom); c.translate(-v.cx, -v.cy);
    escena(c, true);
    c.restore();
    if (pendiente) { pendiente = false; hacerFoto(c, v); }
    // 3 · lo que pone la cámara encima: grano (más cuanto más zoom), viñeta y la interfaz
    c.save(); c.beginPath(); c.rect(v.x0, v.y0, VW, VH); c.clip();
    c.globalCompositeOperation = 'overlay'; c.globalAlpha = 0.07 + (zoom - 1) * 0.07;
    const ox = (Math.random() * 200) | 0, oy = (Math.random() * 200) | 0;
    for (let x = v.x0 - ox; x < v.x0 + VW; x += 200) for (let y = v.y0 - oy; y < v.y0 + VH; y += 200) c.drawImage(grano, x, y);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    const vg = c.createRadialGradient(v.cx, v.cy, VH * 0.3, v.cx, v.cy, VH * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.45)'); c.fillStyle = vg; c.fillRect(v.x0, v.y0, VW, VH);
    // cuadrícula de tercios
    c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = 1.5;
    for (let i = 1; i < 3; i++) { c.beginPath(); c.moveTo(v.x0 + VW * i / 3, v.y0); c.lineTo(v.x0 + VW * i / 3, v.y0 + VH); c.stroke(); c.beginPath(); c.moveTo(v.x0, v.y0 + VH * i / 3); c.lineTo(v.x0 + VW, v.y0 + VH * i / 3); c.stroke(); }
    // enfoque automático en la cara
    const z = zona(), fxs = v.cx + (z.mo.x - v.cx) * zoom, fys = v.cy + (z.mo.y - z.mh * 0.86 - v.cy) * zoom;
    if (afOn) {
      const k = Math.min(1, (clock - afT) / 0.25), s = (90 - 30 * k) * Math.max(1, zoom * 0.8), L = 16;
      c.strokeStyle = '#ffd23a'; c.lineWidth = 3;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sy]) => { const x = fxs + sx * s / 2, y = fys + sy * s / 2; c.beginPath(); c.moveTo(x - sx * L, y); c.lineTo(x, y); c.lineTo(x, y - sy * L); c.stroke(); });
      c.font = "800 15px 'Nunito'"; c.fillStyle = '#ffd23a'; c.textAlign = 'center'; c.fillText('ENFOQUE · CARA', fxs, fys - s / 2 - 10);
    }
    // barra de arriba y datos
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(v.x0, v.y0, VW, 44);
    c.font = "800 17px 'Nunito'"; c.fillStyle = '#fff'; c.textBaseline = 'middle';
    c.textAlign = 'left'; c.fillText('⚡ AUTO', v.x0 + 14, v.y0 + 23);
    c.textAlign = 'center'; c.fillStyle = '#ffd23a'; c.fillText('RETRATO', v.cx, v.y0 + 23);
    c.textAlign = 'right'; c.fillStyle = '#fff'; c.fillText('HDR  🔋14%', v.x0 + VW - 14, v.y0 + 23);
    c.font = "800 14px 'Nunito'"; c.fillStyle = 'rgba(255,255,255,.75)'; c.fillText('08 NOV 2026  03:14', v.x0 + VW - 14, v.y0 + VH - 18);
    c.textAlign = 'left'; c.fillText('ISO ' + Math.round(800 * zoom) + '  f/1.8', v.x0 + 14, v.y0 + VH - 18);
    // el zoom
    c.textAlign = 'center'; c.font = "800 20px 'Nunito'";
    c.fillStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.arc(v.cx, v.y0 + VH - 58, 30, 0, 7); c.fill();
    c.fillStyle = zoom > 1.05 ? '#ffd23a' : '#fff'; c.fillText(zoom.toFixed(1) + '×', v.cx, v.y0 + VH - 57);
    c.restore();
    // el marco del móvil
    c.save(); c.strokeStyle = '#15151b'; c.lineWidth = 16; c.beginPath(); c.roundRect ? c.roundRect(v.x0 - 8, v.y0 - 8, VW + 16, VH + 16, 34) : c.rect(v.x0 - 8, v.y0 - 8, VW + 16, VH + 16); c.stroke();
    c.strokeStyle = '#3a3a46'; c.lineWidth = 3; c.beginPath(); c.roundRect ? c.roundRect(v.x0 - 16, v.y0 - 16, VW + 32, VH + 32, 40) : c.rect(v.x0 - 16, v.y0 - 16, VW + 32, VH + 32); c.stroke();
    // modos, debajo
    c.font = "800 18px 'Nunito'"; c.textAlign = 'center'; c.textBaseline = 'middle';
    [['VÍDEO', -110], ['FOTO', -20], ['RETRATO', 85]].forEach(([n, dx]) => { c.fillStyle = n === 'RETRATO' ? '#ffd23a' : 'rgba(255,255,255,.7)'; c.fillText(n, v.cx + dx, v.y0 + VH + 38); });
    c.restore();
    // las fotos hechas, en miniatura abajo a la izquierda
    fotos.forEach((f, i) => { const w = 110, h = 143, x = 30 + i * 128, y = H - h - 40; c.save(); c.translate(x + w / 2, y + h / 2); c.rotate((i - 1) * 0.06); c.fillStyle = '#f4efe2'; c.fillRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 24); c.drawImage(f.cv, -w / 2, -h / 2, w, h); c.restore(); });
    if (msg) { c.save(); c.font = "800 38px 'Nunito'"; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 8; c.strokeStyle = '#000'; c.strokeText(msg.t, W / 2, 112); c.fillStyle = msg.quien ? '#ffb3d9' : '#fff'; c.fillText(msg.t, W / 2, 112); c.restore(); }
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
