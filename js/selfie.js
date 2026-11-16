'use strict';
/* =====================================================================
   v27 · El selfie de Carla (@carlaviral)
   Carla pone la cámara delantera y cuenta «¡tres, dos, uno!». Los cuatro
   caballeros no se están quietos: Ramis se va a por otra ronda, Marcos se
   esconde (que no le reconozcan en el foro), Marc busca su lado bueno y
   Ángel se queda mirando a la Santa Compaña. Arrástralos (o tócalos) para
   meterlos en el encuadre antes de que salte la foto. Tres selfies: el
   mejor va a Instaclub.
   ===================================================================== */
LOGROS.selfie = { i: '🤳', t: 'Los cuatro en el selfie de Carla' };

MG.selfie = function () {
  const m = { drunk: 0, name: 'selfie' };
  const drawImgH = MG.drawImgH;
  const FR = { x0: 400, y0: 150, w: 800, h: 760 };   // el encuadre de la cámara delantera
  const FL = 1000, HP = 470, SHOTS = 3, CUENTA = 6;
  const ESCAPA = {
    ramis: ['¡Voy a por otra ronda!', 'Esperad, que me pido un gin-tonic.'],
    marcos: ['¡A mí no, que me reconocen en el foro!', 'Yo mejor no salgo…'],
    marc: ['Por la izquierda, que es mi lado bueno.', 'Un segundo, que me peino.'],
    angel: ['¿Eso de ahí es la Santa Compaña?', 'Esperad, que he oído una gaita.'],
  };
  const bgName = (G.scene && G.scene.bg) || 'plaza';
  const P = {}; PROTA.forEach((id, i) => { const x = FR.x0 + 90 + i * 110; P[id] = { x, tx: x, v: 0, huye: 0, grab: false, bocadillo: null, bt: 0 }; });
  let clock = 0, cuenta = CUENTA, tiro = 0, fotos = [], flashT = 0, msg = null, fin = false, pendiente = false, nextHuye = 1.2, drag = null;
  const top = MG.bar('');
  const updTop = () => (top.innerHTML = `🤳 Selfie ${Math.min(tiro + 1, SHOTS)} de ${SHOTS} · arrastra a los caballeros dentro del encuadre antes del «¡uno!»`);
  updTop();
  const dentro = (id) => { const p = P[id]; return p.x > FR.x0 + 40 && p.x < FR.x0 + FR.w - 280; };   // detrás de Carla no se le ve
  const enFoto = () => PROTA.filter(dentro);
  // agarrar al que esté más cerca del dedo
  const quien = (pt) => {
    let best = null, d = 1e9;
    for (const id of PROTA) { const p = P[id], dd = Math.abs(pt.x - p.x); if (dd < 110 && pt.y > FL - HP - 40 && pt.y < FL + 20 && dd < d) { d = dd; best = id; } }
    return best;
  };
  m.down = (pt) => { const id = quien(pt); if (!id) return; drag = { id, dx: P[id].x - pt.x }; P[id].grab = true; P[id].huye = 0; P[id].v = 0; sfx('tic'); };
  m.move = (pt) => { if (!drag) return; const p = P[drag.id]; p.x = clamp(pt.x + drag.dx, 60, W - 60); p.tx = p.x; };
  m.up = () => { if (!drag) return; const p = P[drag.id]; p.grab = false; p.calma = 0.9 + Math.random() * 0.7; drag = null; };
  m.key = (k, d) => {
    if (!d) return;
    // con teclado: 1-4 devuelve a cada uno al centro
    const i = '1234'.indexOf(k); if (i >= 0) { const p = P[PROTA[i]]; p.huye = 0; p.v = 0; p.x = p.tx = FR.x0 + 90 + i * 110; p.calma = 1.6; sfx('tic'); }
  };
  m.update = (dt) => {
    clock += dt; flashT = Math.max(0, flashT - dt);
    if (fin) return;
    // alguien se escapa de vez en cuando (más a menudo en cada selfie)
    nextHuye -= dt;
    if (nextHuye <= 0) {
      nextHuye = Math.max(0.4, 1.1 - tiro * 0.3) + Math.random() * 0.5;
      const libres = PROTA.filter((id) => !P[id].grab && !P[id].huye && !(P[id].calma > 0));
      if (libres.length) {
        const id = pick(libres), p = P[id];
        p.huye = 1; p.v = (p.x < W / 2 ? -1 : 1) * (260 + Math.random() * 160 + (S ? S.drunk[id] : 0) * 30);
        if (id === 'marc') p.v = -Math.abs(p.v);   // siempre por su lado bueno
        p.bocadillo = pick(ESCAPA[id]); p.bt = 1.8;
      }
    }
    for (const id of PROTA) {
      const p = P[id];
      if (p.calma > 0) p.calma -= dt;
      if (p.bt > 0) p.bt -= dt;
      if (p.huye && !p.grab) { p.x += p.v * dt; if (p.x < 70 || p.x > W - 70) { p.x = clamp(p.x, 70, W - 70); p.v = 0; } }
    }
    cuenta -= dt;
    if (cuenta <= 0 && !pendiente) pendiente = true;
  };
  function hacerFoto(c) {
    const cv = document.createElement('canvas'); cv.width = 470; cv.height = 541;
    cv.getContext('2d').drawImage(c.canvas, FR.x0, FR.y0, FR.w, FR.h, 0, 0, 470, 541);
    const n = enFoto().length;
    const likes = Math.round(300 + n * 650 + Math.random() * 200 + (n === 4 ? 900 : 0));
    fotos.push({ cv, n, likes });
    const fuera = PROTA.filter((id) => !dentro(id)).map((id) => NAMES[id]);
    msg = { t: n === 4 ? pick(['¡LOS CUATRO! ¡Esto revienta Instaclub!', '¡Perfecto! ¡Viralitos, mirad qué caballeros!']) : n === 0 ? '¡¿Un selfie mío sola?! Bueno, también vale.' : '¡Falta ' + fuera.join(' y ') + '!', hasta: clock + 2 };
    sfx('foto'); flashT = 0.25; tiro++; cuenta = CUENTA; updTop();
    if (n === 4) emit('heart', W / 2, 500, 10, { sx: 200, sy: 80 });
    if (tiro >= SHOTS) { fin = true; setTimeout(terminar, 2200); }
  }
  function terminar() {
    const orden = fotos.slice().sort((a, b) => b.n - a.n || b.likes - a.likes), best = orden[0];
    let img = null, mas = []; try { img = best.cv.toDataURL('image/jpeg', 0.8); mas = orden.slice(1).map((f) => f.cv.toDataURL('image/jpeg', 0.7)); } catch (e) {}
    m.end({ n: best.n, likes: best.likes, img, mas });
  }
  m.draw = (c, t) => {
    // el mundo, oscuro fuera del encuadre
    MG.bg(c, bgName, 0);
    const pintaGente = () => {
      for (const id of PROTA.slice().sort((a, b) => P[a].x - P[b].x)) {
        const p = P[id], sp = bodySprite(id), k = G.img[sp] && G.img['chars/' + id] ? G.img[sp].height / G.img['chars/' + id].height : 1;
        const wob = p.huye && !p.grab ? Math.sin(clock * 14) * 6 : 0, lift = p.grab ? 18 : 0;
        c.save(); c.globalAlpha = 0.4; c.fillStyle = '#000'; c.beginPath(); c.ellipse(p.x, FL - 4, 70, 12, 0, 0, 7); c.fill(); c.restore();
        drawImgH(c, sp, p.x, FL - lift - Math.abs(wob), HP * k, { flip: p.v < 0, rot: p.grab ? 0.05 : 0 });
      }
    };
    pintaGente();
    // Carla, en primer plano, con el brazo estirado (es su cámara)
    drawImgH(c, 'chars/carla', FR.x0 + FR.w - 140, H + 330, 980);
    if (pendiente) { pendiente = false; hacerFoto(c); }
    // fuera del encuadre, oscuro
    c.save(); c.fillStyle = 'rgba(0,0,0,.62)';
    c.fillRect(0, 0, W, FR.y0); c.fillRect(0, FR.y0 + FR.h, W, H - FR.y0 - FR.h);
    c.fillRect(0, FR.y0, FR.x0, FR.h); c.fillRect(FR.x0 + FR.w, FR.y0, W - FR.x0 - FR.w, FR.h); c.restore();
    // el marco de la cámara
    c.save(); c.strokeStyle = '#fff'; c.lineWidth = 4; c.setLineDash([18, 12]); c.strokeRect(FR.x0, FR.y0, FR.w, FR.h); c.restore();
    c.save(); c.font = "800 20px 'Nunito'"; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(FR.x0, FR.y0, FR.w, 40);
    c.textAlign = 'left'; c.fillStyle = '#ff4d6d'; c.fillText('● LIVE  @carlaviral', FR.x0 + 14, FR.y0 + 20);
    c.textAlign = 'right'; c.fillStyle = '#fff'; c.fillText('👁 120,4 mil', FR.x0 + FR.w - 14, FR.y0 + 20);
    c.restore();
    // la cuenta atrás
    if (!fin) {
      const n = Math.ceil(cuenta);
      c.save(); c.font = "800 34px 'Nunito'"; c.textAlign = 'center'; c.fillStyle = '#fff'; c.lineWidth = 7; c.strokeStyle = '#000';
      const dt = n <= 3 ? ['¡UNO!', '¡DOS!', '¡TRES!'][n - 1] : '¡Juntaos!';
      c.strokeText(dt, W / 2, FR.y0 + 90); c.fillStyle = n <= 1 ? '#ffd23a' : '#fff'; c.fillText(dt, W / 2, FR.y0 + 90);
      c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(FR.x0, FR.y0 + FR.h + 14, FR.w, 14); c.fillStyle = '#ff4d6d'; c.fillRect(FR.x0, FR.y0 + FR.h + 14, FR.w * clamp(cuenta / CUENTA, 0, 1), 14);
      c.restore();
    }
    // bocadillos de los que se escapan
    for (const id of PROTA) {
      const p = P[id]; if (!(p.bt > 0) || !p.bocadillo) continue;
      c.save(); c.font = "800 24px 'Nunito'"; c.textAlign = 'center'; c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,.8)'; c.fillStyle = '#ffe9a8';
      const y = FL - HP - 30; c.strokeText(p.bocadillo, clamp(p.x, 220, W - 220), y); c.fillText(p.bocadillo, clamp(p.x, 220, W - 220), y); c.restore();
    }
    // contador de los que están dentro
    c.save(); c.font = "800 30px 'Nunito'"; c.textAlign = 'left'; c.fillStyle = '#fff'; c.lineWidth = 6; c.strokeStyle = '#000';
    const tx = 'En la foto: ' + enFoto().length + ' / 4'; c.strokeText(tx, 40, 120); c.fillText(tx, 40, 120); c.restore();
    // las fotos hechas
    fotos.forEach((f, i) => { const w = 110, h = 127, x = 30 + i * 128, y = H - h - 40; c.save(); c.translate(x + w / 2, y + h / 2); c.rotate((i - 1) * 0.06); c.fillStyle = '#f4efe2'; c.fillRect(-w / 2 - 6, -h / 2 - 6, w + 12, h + 24); c.drawImage(f.cv, -w / 2, -h / 2, w, h); c.restore(); });
    if (msg && clock < msg.hasta) { c.save(); c.font = "800 38px 'Nunito'"; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 8; c.strokeStyle = '#000'; c.strokeText(msg.t, W / 2, 112); c.fillStyle = '#ffb3d9'; c.fillText(msg.t, W / 2, 112); c.restore(); }
    drawParticles(c);
    if (flashT > 0) { c.fillStyle = `rgba(255,255,255,${flashT * 3})`; c.fillRect(0, 0, W, H); }
  };
  return MG.begin(m);
};

/* ---------- se cuelga de la charla con Carla ---------- */
async function selfieCarla() {
  await say('carla', flag('selfie') ? '¿Otro? ¡Mis viralitos lo piden! A ver si esta vez salís los cuatro.' : '¡Un selfie con el Club para mis viralitos! Juntaos, que a la de tres disparo.', 'risa');
  const r = await MG.selfie();
  const n = r && r.n !== undefined ? r.n : 4, likes = (r && r.likes) || 3500;
  if (r && r.img && typeof GALERIA !== 'undefined' && GALERIA.foto) GALERIA.foto('carla', r.img, likes, 'Con el Club de Caballeros en Pontevedra 🤳✨ Los cuatro, por fin #ClubDeCaballeros #Viralitos', [['carla', '¡Mis viralitos los adoran! 🔥'], ['ramis', 'Salgo guapo. Eso es un filtro.']], r.mas);
  flag('selfie', 1);
  await narr(`Carla lo sube a Instaclub. En un minuto: ${likes.toLocaleString('es-ES')} likes.`);
  if (n === 4) { await say('carla', '¡Los cuatro! Esto es contenido de calidad. ¡Sois virales, caballeros!', 'risa'); logro('selfie'); }
  else await say('carla', n >= 2 ? 'Bueno… faltaba alguien. Mis viralitos preguntan dónde estaba el otro.' : 'Me he hecho un selfie con… el fondo. Muy artístico.');
  if (n < 4) await say('ramis', 'Yo estaba. En espíritu.');
}
if (typeof carlaTalk === 'function') {
  const _c = carlaTalk;
  carlaTalk = async () => {
    const vc = typeof VC !== 'undefined' && VC.on;
    if (vc || !S.flags.carla1 || S.scene === 'antro') return _c();
    const v = await choose([{ t: '💬 Hablar', v: 0 }, { t: '🤳 «¿Un selfie con el Club?»', v: 1 }]);
    return v ? selfieCarla() : _c();
  };
}
