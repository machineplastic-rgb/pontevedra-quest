'use strict';
/* =====================================================================
   v11 · Duelo de insultos con Don Xesús (en la cripta)
   Don Xesús suelta un insulto y Marcos elige la réplica. Si acierta,
   Don Xesús retrocede; si falla, retrocede Marcos. Gana quien arrincona
   al otro. Si existen los dibujos img/duelo/xesus_<pose> (guardia,
   ataque, retrocede) y img/duelo/marcos_<pose> (guardia, para, tocado)
   se usan; si no, se apaña con los muñecos de siempre.
   v12: dibujos de JRAR. Cada pose guarda dónde estaba en su dibujo
   original (x, y, w, h) y el punto entre los pies (ax, fy), para que
   al cambiar de pose el muñeco no salte.
   ===================================================================== */
const DUELO_POSES = {
  marcos_guardia: { x: 38, y: 179, w: 754, h: 762, ax: 415, fy: 934 },
  marcos_para: { x: 32, y: 161, w: 780, h: 796, ax: 422, fy: 950 },
  marcos_tocado: { x: 42, y: 203, w: 845, h: 749, ax: 464, fy: 945 },
  xesus_guardia: { x: 625, y: 80, w: 911, h: 862, ax: 1185, fy: 935 },
  xesus_ataque: { x: 506, y: 110, w: 1022, h: 835, ax: 1224, fy: 938 },
  xesus_estocada: { x: 579, y: 89, w: 952, h: 855, ax: 1248, fy: 937 },
  // v19: cayéndose de espaldas (hoja de poses de JRAR, a escala 2.3 para igualarlo a los otros)
  xesus_retrocede: { x: 2304.6, y: 246.1, w: 936.1, h: 899.3, ax: 2866.2, fy: 1138.5 },   // ax corrido: cae hacia la derecha
};
EXTRA_ASSETS.push(...Object.keys(DUELO_POSES).map((k) => 'duelo/' + k), 'items/espada');
const INSULTOS = [
  { x: '¡Tienes letra de escribano, pero ningún contenido!', ok: 'Y usted mucho contenido… pero ni cuerpo.', mal: ['¡Pues anda que usted!', 'Escribo en Comic Sans, ¿algún problema?'] },
  { x: '¡Luchas como un mangurrián de feria!', ok: 'Y usted como una sábana tendida en un día de viento.', mal: ['¡Las ferias molan, eh!', '¿Mangurrián es bueno o malo?'] },
  { x: 'Sólo había visto un cobarde como tú una vez.', ok: 'Ya, y supongo que él te enseñó todo lo que sabes.', mal: ['¿Y era guapo?', '¡Pues ya van dos!'] },
  { x: '¡He atravesado a hombres más fieros que tú!', ok: 'Normal: es transparente. Atraviesa hasta las puertas.', mal: ['¡Mamá!', '¿Fieros? Yo vivo en Coruña, oiga.'] },
  { x: '¡Vistes como un bufón del siglo veintiuno!', ok: 'Soy diseñador de moda. Esa capa es de la temporada 1714 y ya no se lleva.', mal: ['Me lo compré en rebajas.', 'Es que la ropa buena está en la lavadora.'] },
  { x: '¡Mi espada ha probado sangre de corsarios ingleses!', ok: 'Y su copa, todo el Ribeiro de Galicia. Por eso le tiembla.', mal: ['¿Y no le dio asco?', 'Yo he probado las ensaimadas de Palma. Tiemble.'] },
  { x: '¡Cuando acabe contigo, rondarás esta cripta para siempre!', ok: 'Como usted, que lleva trescientos años sin salir de casa.', mal: ['Bueno, si hay wifi…', '¿Para siempre siempre?'] },
  { x: '¡Eres más lento que un carro de bueyes subiendo a Santiago!', ok: 'Y usted más pesado que un gorrino en brazos.', mal: ['Es que voy en Peugeot.', 'A Santiago se va andando, que es el Camino.'] },
  { x: '¡Pelear contigo es como pelear con un niño de teta!', ok: 'Aparento diecisiete, pero tengo dos hijos. Eso es nivel cincuenta de aguante.', mal: ['¡Si hasta me piden el DNI!', '¿Teta? ¿Dónde?'] },
  { x: '¡Esgrimes un candelabro, bribón! ¡Un candelabro!', ok: 'Has begut oli!', mal: ['Es lo que había en la bodega.', 'Es un sable láser de bajo consumo.'] },
  { x: '¡Tus amigos apestan a orujo desde aquí!', ok: 'Y usted a naftalina de 1714.', mal: ['Es colonia. De orujo.', '¡Ramis, te dije que no!'] },
  { x: 'Te voy a poner el brazo en cabestrillo.', ok: '¿Por qué, estudias para enfermera?', mal: ['¡El brazo no, que tengo que conducir!', 'Mejor escayola, que se puede firmar.'] },
];
const XS_TOCADO = ['¡Aaargh! ¡Touché!', '¡Bribón… qué lengua tienes!', '¡Me has dado, mangurrián!', '¡Albricias… digo, ¡maldición!', '¡Esa dolió más que el orujo de 1714!', '¡Ay! ¡Eso no se le dice a un muerto!'];
const XS_GANA = ['¡Ja! ¿Eso es una réplica o un estornudo?', '¡Serrallo de excusas!', '¡Flojo, flojo, flojííísimo!', '¡Maaagnífico… para mí!', '¡Ja! Hasta la Santa Compaña contesta mejor.', '¡Toma estocada, bribón!'];
const DUELO_ANIMO = [['ramis', '¡Toma! ¡Eso es una respuesta Porsche!'], ['marc', '¡Eso lo dibujo yo en viñeta!'], ['angel', '¡Le has tocado el aura!'], ['ramis', '¡Al menos tú podrás decir que has vivido!'], ['marc', 'Letra de escribano Y contenido. Toma ya.'], ['angel', 'Eso ha sonado a acorde perfecto.']];
const DUELO_PENA = [['ramis', '¡Ay! ¡Eso ha dolido hasta en Mallorca!'], ['marc', 'Marcos, tío, que es un muerto: con eso no se ofende.'], ['angel', 'Respira, Marcos. Busca tu centro.'], ['ramis', '¡Bajo el yugo opresor! ¡Levántate!'], ['marc', 'Eso no lo publica ni un fanzine.']];

MG.duelo = function () {
  const m = { drunk: 0, name: 'duelo' };
  const drawImgH = MG.drawImgH;
  const FLOOR = 965, TMAX = 16, WIN = 3, HM = 560, HX = 590;
  let clock = 0, pos = 0, vp = 0, fallos = 0, aciertos = 0, last = null;
  let mPose = 'guardia', xPose = 'guardia', mT = 9, xT = 9;
  let xBub = null, mBub = null, cheer = null, big = null, asking = false, tLeft = 0, keyPick = null, timeoutPick = null;
  let sparks = [], flashT = 0, fly = null;
  const waits = [];
  const sleep = (s) => new Promise((r) => waits.push({ at: clock + s, r }));
  const setM = (p) => { mPose = p; mT = 0; }, setX = (p) => { xPose = p; xT = 0; };
  const mix = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const top = MG.bar('');
  const DIB = () => !!G.img['duelo/marcos_guardia'] && !!G.img['duelo/xesus_guardia'];
  const mxOf = () => DIB() ? 530 + vp * 70 : 600 + vp * 95, xxOf = () => DIB() ? 1070 + vp * 70 : 1010 + vp * 95;

  function updTop() {
    let s = '';
    for (let i = -WIN; i <= WIN; i++) s += i === pos ? '<b style="color:#fff">⚔</b>' : (pos > 0 && i > 0 && i < pos) || (pos < 0 && i < 0 && i > pos) ? '<span style="color:#ffd98a">●</span>' : '<span style="opacity:.45">●</span>';
    top.innerHTML = `Marcos <span style="letter-spacing:6px;margin:0 10px">${s}</span> Don Xesús`;
  }
  function clash() {
    sfx('espada'); shake(0.25); flashT = 0.18;
    const cx = DIB() ? mxOf() + 50 : (mxOf() + xxOf()) / 2, cy = DIB() ? FLOOR - 400 : FLOOR - 300;
    for (let i = 0; i < 28; i++) { const a = rnd(0, Math.PI * 2), v = rnd(250, 900); sparks.push({ x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, life: rnd(0.25, 0.6) }); }
  }
  function ask(cur) {
    return new Promise((res) => {
      const list = mix([{ t: cur.ok, k: 'ok' }].concat(cur.mal.map((t) => ({ t, k: 'mal' }))));
      const box = document.createElement('div'); box.className = 'dopts';
      let done = false;
      const fin = (o) => { if (done) return; done = true; asking = false; keyPick = timeoutPick = null; box.remove(); sfx(o.k === 'tiempo' ? 'error' : 'click'); res(o); };
      list.forEach((o, i) => {
        const b = document.createElement('button'); const n = document.createElement('b'); n.textContent = i + 1;
        b.append(n, ' ' + o.t); b.onpointerdown = (e) => { e.stopPropagation(); e.preventDefault(); fin(o); };
        box.appendChild(b);
      });
      $('mg').appendChild(box);
      tLeft = TMAX; asking = true;
      keyPick = (n) => list[n] && fin(list[n]);
      timeoutPick = () => fin({ t: '…', k: 'tiempo' });
    });
  }
  async function run() {
    updTop();
    big = { t: '¡EN GUARDIA!', c: '#ffd98a', t0: clock }; sfx('espada'); await sleep(1.5); big = null;
    let pool = [];
    for (;;) {
      if (!pool.length) pool = mix((typeof ADULTO !== 'undefined' && ADULTO.on() ? INSULTOS.concat(ADULTO.insultos) : INSULTOS).filter((i) => i !== last));
      const cur = pool.pop(); last = cur;
      setX('ataque'); sfx('swish'); xBub = { t: cur.x, t0: clock, face: 'normal' }; mBub = null; cheer = null;
      await sleep(0.55); setX('guardia');
      const o = await ask(cur);
      mBub = { t: o.k === 'tiempo' ? '…' : o.t, t0: clock, face: 'normal' };
      await sleep(o.k === 'tiempo' ? 0.4 : 1.1);
      if (o.k === 'ok') {
        pos++; aciertos++; setM('para'); setX('retrocede'); clash();
        mBub.face = 'risa'; xBub = { t: pick(XS_TOCADO), t0: clock, face: 'normal' };
        const a = pick(DUELO_ANIMO); cheer = { id: a[0], t: a[1], t0: clock + 0.5 };
        try { AUDIO.laugh(a[0]); } catch (e) {}
      } else {
        pos--; fallos++; setX('estocada'); setM('tocado'); clash();
        mBub.face = 'sorpresa'; xBub = { t: o.k === 'tiempo' ? '¡Te has quedado en blanco, mangurrián!' : pick(XS_GANA), t0: clock, face: 'risa' };
        const a = pick(DUELO_PENA); cheer = { id: a[0], t: a[1], t0: clock + 0.5 };
        try { AUDIO.laugh('fantasma'); } catch (e) {}
      }
      updTop();
      await sleep(2.4);
      setM('guardia'); setX('guardia'); mBub = null; cheer = null;
      if (pos >= WIN) return final(true);
      if (pos <= -WIN) return final(false);
      await sleep(0.25);
    }
  }
  async function final(win) {
    if (win) {
      setM('para'); setX('retrocede'); clash(); sfx('swish');
      const xx = xxOf();
      // al caerse suelta la espada, que sale volando y se clava en el suelo
      fly = { src: 'rapier', t: 0, x0: xx - 80, y0: FLOOR - HX * 0.46, x1: DIB() ? 1045 : 1500, y1: FLOOR - 25, spin: 3.2 };
      xBub = { t: '¡Me rindo! ¡Touché, retouché y requetetouché!', t0: clock, face: 'risa' };
      await sleep(0.75); sfx('espada');
      big = { t: '¡TOUCHÉ!', c: '#ffd98a', t0: clock }; try { AUDIO.laugh('grupo'); } catch (e) {}
    } else {
      setM('tocado'); setX('estocada'); clash();
      const mx = mxOf();
      if (!DIB()) fly = { src: 'candelabro', t: 0, x0: mx + 45, y0: FLOOR - 270, x1: 130, y1: FLOOR - 10, spin: -2.6 };
      xBub = { t: '¡Arrinconado, bribón! ¡Ja, ja, jaaa!', t0: clock, face: 'risa' };
      big = { t: '¡ARRINCONADO!', c: '#ff8a7a', t0: clock }; try { AUDIO.laugh('fantasma'); } catch (e) {}
    }
    await sleep(2.8);
    m.end({ win, fallos, aciertos });
  }

  m.key = (k, d) => { if (d && keyPick && ['1', '2', '3'].includes(k)) keyPick(+k - 1); };
  m.down = () => {};
  m.update = (dt) => {
    clock += dt; mT += dt; xT += dt; flashT = Math.max(0, flashT - dt);
    for (let i = waits.length - 1; i >= 0; i--) if (clock >= waits[i].at) waits.splice(i, 1)[0].r();
    vp += (pos - vp) * Math.min(1, dt * 4);
    for (const s of sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 1400 * dt; s.life -= dt; }
    sparks = sparks.filter((s) => s.life > 0);
    if (fly) fly.t += dt;
    if (asking) { tLeft -= dt; if (tLeft <= 0 && timeoutPick) timeoutPick(); }
  };

  // ---------- dibujo ----------
  const env = (tt) => Math.min(1, tt * 7) * (tt < 1.4 ? 1 : Math.max(0, 1 - (tt - 1.4) * 3));
  function rapier(c, hx, hy, ang, len) {
    c.save(); c.translate(hx, hy); c.rotate(Math.PI + ang);
    c.shadowColor = 'rgba(150,215,255,.9)'; c.shadowBlur = 18;
    c.fillStyle = '#d8eeff'; c.beginPath(); c.moveTo(0, -4); c.lineTo(len, -0.8); c.lineTo(len, 0.8); c.lineTo(0, 4); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(4, -1.5); c.lineTo(len * 0.9, -0.4); c.stroke();
    c.fillStyle = '#b9dcff'; c.beginPath(); c.ellipse(-4, 0, 9, 25, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#7fb6e6'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#9cc9f0'; c.fillRect(-42, -5, 36, 10); c.beginPath(); c.arc(-44, 0, 8, 0, Math.PI * 2); c.fill();
    c.restore();
  }
  // pose dibujada: se coloca por el punto entre los pies (gx, gy)
  const SC = 0.7;
  function pose(c, name, gx, gy, o) {
    const im = G.img['duelo/' + name], d = DUELO_POSES[name]; if (!im || !d) return false;
    o = o || {};
    c.save(); if (o.alpha !== undefined) c.globalAlpha = o.alpha;
    if (o.rot) { c.translate(gx, gy); c.rotate(o.rot); c.translate(-gx, -gy); }
    c.drawImage(im, gx + (d.x - d.ax) * SC, gy + (d.y - d.fy) * SC, d.w * SC, d.h * SC);
    c.restore(); return true;
  }
  function drawMarcos(c, x, t) {
    const e = env(mT);
    if (DIB()) {
      const p = G.img['duelo/marcos_' + mPose] ? mPose : 'guardia';
      const dx = p === 'tocado' ? -35 * e : p === 'para' ? 18 * e : 0, bob = Math.sin(t * 2.6) * 3;
      pose(c, 'marcos_' + p, x + dx, FLOOR + bob, { rot: p === 'tocado' ? -0.035 * e : 0 });
      return;
    }
    let dx = 0, rot = 0, cr = 0.75 + Math.sin(t * 2.4) * 0.08;
    if (mPose === 'para') { dx = 45 * e; rot = 0.05 * e; cr = 0.75 + 0.65 * e; }
    if (mPose === 'tocado') { dx = -40 * e; rot = -0.1 * e; cr = 0.75 - 0.6 * e; }
    drawImgH(c, 'chars/marcos_lado', x + dx, FLOOR, HM, { rot });
    if (!(fly && fly.src === 'candelabro')) drawImgH(c, 'items/candelabro', x + dx + 45, FLOOR - HM * 0.47, 150, { rot: cr });
  }
  function drawXesus(c, x, t) {
    const e = env(xT), fl = Math.sin(t * 1.8) * 10;
    if (DIB()) {
      const p = G.img['duelo/xesus_' + xPose] ? xPose : 'guardia';
      const dx = p === 'retrocede' ? 45 * e : p === 'ataque' || p === 'estocada' ? -40 * e : 0;
      pose(c, 'xesus_' + p, x + dx, FLOOR - 14 + fl, { alpha: 0.9 + Math.sin(t * 3.1) * 0.05, rot: p === 'retrocede' ? 0.04 * e : 0 });
      return;
    }
    let dx = 0, rot = 0, ang = 0.2 + Math.sin(t * 2.2) * 0.06, ext = 0;
    if (xPose === 'ataque' || xPose === 'estocada') { dx = -60 * e; rot = -0.05 * e; ang = 0.2 - 0.18 * e; ext = 90 * e; }
    if (xPose === 'retrocede') { dx = 50 * e; rot = 0.09 * e; ang = 0.2 + 0.7 * e; }
    drawImgH(c, 'chars/fantasma', x + dx, FLOOR - 15 + fl, HX, { flip: true, rot, alpha: 0.88, glow: 'rgba(150,215,255,.85)' });
    if (!(fly && fly.src === 'rapier')) rapier(c, x + dx - 80, FLOOR - 15 + fl - HX * 0.46, ang, 300 + ext);
  }
  function drawFly(c) {
    const k = Math.min(1, fly.t / 0.75), x = fly.x0 + (fly.x1 - fly.x0) * k, y = fly.y0 + (fly.y1 - fly.y0) * k - Math.sin(k * Math.PI) * 330;
    const rot = k < 1 ? fly.spin * fly.t * 4 : (fly.src === 'rapier' ? -1.25 : -1.4);
    // v24: la espada del dibujo de JRAR (en la imagen apunta arriba a la derecha: −0,666 rad)
    const esp = G.img['items/espada'];
    if (fly.src === 'rapier' && esp) {
      const L = 300, s = L / 405, w = esp.width * s, h = esp.height * s;
      if (k < 1) { c.save(); c.translate(x, y); c.rotate(rot); c.shadowColor = 'rgba(150,215,255,.9)'; c.shadowBlur = 18; c.drawImage(esp, -w / 2, -h / 2, w, h); c.restore(); }
      else {
        const dir = Math.PI / 2 - 0.25 + Math.sin(fly.t * 30) * 0.05 * Math.max(0, 1.6 - fly.t), tx = x, ty = y + 18;
        c.save(); c.translate(tx - Math.cos(dir) * L * 0.5, ty - Math.sin(dir) * L * 0.5); c.rotate(dir + 0.666);
        c.shadowColor = 'rgba(150,215,255,.9)'; c.shadowBlur = 18; c.drawImage(esp, -w / 2, -h / 2, w, h); c.restore();
      }
    } else if (fly.src === 'rapier') {
      if (k < 1) rapier(c, x, y, rot, 300);
      else { c.save(); c.translate(x, y); c.rotate(Math.sin(fly.t * 30) * 0.06 * Math.max(0, 1.6 - fly.t)); rapier(c, 0, -230, -Math.PI / 2 + 0.25, 260); c.restore(); }
    } else drawImgH(c, 'items/candelabro', x, y, 150, { rot, center: true });
  }
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function lines(c, text, maxW) { const out = []; let l = ''; for (const w of text.split(' ')) { const tt = l ? l + ' ' + w : w; if (c.measureText(tt).width > maxW && l) { out.push(l); l = w; } else l = tt; } out.push(l); return out; }
  // bocadillo: lado 'r' (Don Xesús), 'l' (Marcos) o 'c' (los amigos, abajo)
  function bubble(c, b, side, y, fill, border, face, size) {
    const k = clamp((clock - b.t0) * 6, 0, 1); if (k <= 0) return;
    size = size || 34;
    c.save(); c.globalAlpha = k; c.font = `800 ${size}px 'Nunito'`;
    const maxW = side === 'c' ? 820 : 800, ls = lines(c, b.t, maxW);
    const w = Math.max(...ls.map((l) => c.measureText(l).width)) + 56, lh = size * 1.25, h = ls.length * lh + 34;
    const x = side === 'r' ? 1375 - w : side === 'l' ? 225 : 800 - w / 2 + 60;
    c.translate(0, (1 - k) * 14);
    rr(c, x, y, w, h, 18); c.fillStyle = fill; c.fill(); c.lineWidth = 4; c.strokeStyle = border; c.stroke();
    c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'top';
    ls.forEach((l, i) => c.fillText(l, x + 28, y + 19 + i * lh));
    const fx = side === 'r' ? 1470 : side === 'l' ? 130 : x - 70;
    drawImgH(c, face, fx, y + h / 2 + (side === 'c' ? 60 : 82), side === 'c' ? 120 : 165);
    c.restore();
    return { x, y, w, h };
  }
  m.draw = (c, t) => {
    MG.bg(c, 'cripta', 0.45, 1.05);
    // la luz fría del fantasma y la cálida de las velas
    const xx = xxOf(), mx = mxOf();
    c.save(); c.globalCompositeOperation = 'lighter';
    let g = c.createRadialGradient(xx, FLOOR - 320, 30, xx, FLOOR - 320, 520); g.addColorStop(0, 'rgba(120,190,255,.22)'); g.addColorStop(1, 'rgba(120,190,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    g = c.createRadialGradient(mx, FLOOR - 280, 30, mx, FLOOR - 280, 420); g.addColorStop(0, 'rgba(255,190,110,.16)'); g.addColorStop(1, 'rgba(255,190,110,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.restore();
    // sombras en el suelo
    c.save(); c.fillStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.ellipse(mx, FLOOR - 4, 95, 18, 0, 0, Math.PI * 2); c.fill();
    c.globalAlpha = 0.5; c.beginPath(); c.ellipse(xx, FLOOR - 4, 80, 14, 0, 0, Math.PI * 2); c.fill(); c.restore();
    drawXesus(c, xx, t); drawMarcos(c, mx, t);
    if (fly) drawFly(c);
    // chispas del choque
    c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = '#ffe9a8'; c.lineWidth = 3;
    for (const s of sparks) { c.globalAlpha = Math.min(1, s.life * 3); c.beginPath(); c.moveTo(s.x, s.y); c.lineTo(s.x - s.vx * 0.025, s.y - s.vy * 0.025); c.stroke(); }
    if (flashT > 0) { const cx = DIB() ? mx + 50 : (mx + xx) / 2, cy = DIB() ? FLOOR - 400 : FLOOR - 300; g = c.createRadialGradient(cx, cy, 5, cx, cy, 260); g.addColorStop(0, `rgba(255,250,220,${flashT * 4})`); g.addColorStop(1, 'rgba(255,250,220,0)'); c.globalAlpha = 1; c.fillStyle = g; c.fillRect(0, 0, W, H); }
    c.restore();
    // bocadillos
    const xr = xBub ? bubble(c, xBub, 'r', 92, 'rgba(14,30,52,.93)', '#9fd4ff', 'faces/fantasma_' + xBub.face) : null;
    if (mBub) bubble(c, mBub, 'l', 300, 'rgba(36,24,58,.93)', '#ffd98a', 'faces/marcos_' + mBub.face);
    if (cheer && clock >= cheer.t0) bubble(c, cheer, 'c', 820, 'rgba(20,16,30,.9)', '#c9b6ff', 'faces/' + cheer.id + '_risa', 28);
    // tiempo para contestar
    // la mecha: el tiempo para contestar, bajo el insulto
    if (asking && xr) {
      const k = clamp(tLeft / TMAX, 0, 1), bx = xr.x + 20, by = xr.y + xr.h + 12, bw = xr.w - 40;
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(bx, by, bw, 10);
      c.fillStyle = k > 0.35 ? '#ffd98a' : '#ff7a6a'; c.fillRect(bx, by, bw * k, 10);
      if (k <= 0.35 && Math.sin(clock * 18) > 0) { c.fillStyle = 'rgba(255,120,100,.5)'; c.fillRect(bx, by, bw * k, 10); }
    }
    if (big) { const k = clamp((clock - big.t0) * 4, 0, 1), s = 1.6 - 0.6 * k; c.save(); c.globalAlpha = k; c.translate(W / 2, 290); c.scale(s, s); c.translate(-W / 2, -290); MG.bigText(c, big.t, 320, big.c, 120); c.restore(); }
  };
  const p = MG.begin(m);
  if (!TEST) run();
  return p;
};

/* ---------- la escena: el duelo en la cripta ---------- */
async function dueloXesus() {
  if (S.active !== 'marcos') {
    await say('fantasma', pick(['¿Contigo? ¡Ja! Que salga el de las gafas, el que tiene cara de haberse leído todos los libros de caballerías.', '¡Contigo no me bato, bribón! Quiero al del jersey negro, al que juega a rol.']));
    await say(S.active, 'Esto es cosa de Marcos. Lleva veinte años de partidas de rol.');
    return;
  }
  // v23: en el modo 18+, el pollo de goma vence a Don Xesús
  if (typeof ADULTO !== 'undefined' && ADULTO.on() && has('pollo')) {
    const v = await choose([{ t: '⚔ Batirse con el candelabro', v: 0 }, { t: '🐔 Sacar el pollo de goma', v: 1 }]);
    if (v) {
      sfx('pollo'); shake(0.4);
      await say('marcos', 'En guardia, Don Xesús. Le presento… al pollo.', 'risa');
      await say('fantasma', '¿Un… POLLO? ¿De goma? ¡Por los clavos de Cristo! ¡Eso en 1714 era brujería!', 'sorpresa');
      sfx('pollo');
      await say('fantasma', '¡Me rindo, me rindo! ¡Guarde eso, bribón, que me da repelús!', 'risa');
      await say('ramis', '¡SIRVE PARA AQUÍ! ¡Veinte años con ese pollo y por fin sirve para aquí!', 'risa');
      sfx('magia'); flash('#ffe9a0', 0.5); flag('acertijo', 1); logro('pollo'); groupLaugh(); updObj();
      return;
    }
  }
  if (!flag('dueloVisto')) {
    flag('dueloVisto', 1);
    try { AUDIO.laugh('fantasma'); } catch (e) {}
    await say('fantasma', '¡En guaaardia, bribón! En 1714 nos batíamos con la espada… y con la lengua. Yo insulto, tú contestas.', 'guardia');
    await say('marcos', '¿Y yo con qué me defiendo?', 'sorpresa');
    await say('ramis', 'Coge el candelabro, que con lo que brilla el fantasma ya hay luz de sobra.');
    await say('marcos', 'Nivel veinte de esgrima… en la Play. Tirad iniciativa.', 'risa');
  } else await say('fantasma', '¿Revancha? ¡Albricias! ¡En guaaardia!', 'ataca');
  const r = await MG.duelo();
  const win = r === undefined || r === true || !!(r && r.win);
  if (win) {
    sfx('magia'); flash('#ffe9a0', 0.5); flag('acertijo', 1);
    if (r && r.fallos === 0) logro('plata');
    await say('fantasma', 'Trescientos años sin que nadie me contestara así. ¡Maaagnífico! El sarcófago es vuestro.', 'risa');
    await say('marcos', 'Nike Apóstol nunca falla una tirada.', 'risa');
    groupLaugh(); updObj();
    return;
  }
  await say('fantasma', '¡Ja! Levanta, mangurrián, que aquí abajo me aburro. ¿Otra?', 'risa');
  await say('marc', 'Marcos, que es un muerto: no se ofende con cualquier cosa. Dale donde duele: la moda, los años, el vino.');
  const v = await choose([{ t: '⚔ «¡Revancha, Don Xesús!»', v: 1 }, { t: '«Luego, que me falta el aire»', v: 0 }]);
  if (v) return dueloXesus();
  await say('fantasma', 'Cuando quieras. Tengo toda la eternidad.');
}
