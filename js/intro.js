'use strict';
/* =====================================================================
   v15 · La intro, al estilo de las aventuras gráficas de los 90
   Todo a 320x200 y ampliado con píxeles gordos (como un PC con VGA):
   1. «Instalación» en pantalla azul: eliges la tarjeta de sonido
      (altavoz del PC, AdLib, Sound Blaster o… gaita gallega).
   2. Presentación del estudio, créditos de guasa sobre Pontevedra de
      noche (la cámara baja del cielo a la ciudad) y el logo cae letra
      a letra. Música chiptune original (una muiñeira) hecha aquí mismo.
   Se salta con un toque o una tecla.
   ===================================================================== */
const INTRO = (() => {
  const LW = 320, LH = 200, FONT = "'Press Start 2P', monospace";
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
  const step4 = (a) => Math.round(Math.max(0, Math.min(1, a)) * 4) / 4;   // fundidos «a saltos», como en VGA

  /* ---------------- texto pixelado de verdad (sin suavizado) ---------------- */
  const cache = new Map();
  function pix(text, size, color, o) {
    o = o || {};
    const key = [text, size, String(color), o.outline, o.shadow].join('|');
    if (cache.has(key)) return cache.get(key);
    // se dibuja 8 veces más grande y se lee un punto por cada píxel: así cada píxel de la letra cae en su sitio
    const K = 8, pad = 3, above = Math.round(size * 1.3), below = Math.round(size * 0.35);
    const g = mk(8, 8).getContext('2d'); g.font = `${size * K}px ${FONT}`;
    const cols = Math.ceil(g.measureText(text).width / K) + 1, rows = above + below;
    const big = mk((cols + 2) * K, (rows + 2) * K), bg2 = big.getContext('2d');
    const by = (above + 1) * K, bxo = K;
    bg2.font = `${size * K}px ${FONT}`; bg2.textBaseline = 'alphabetic'; bg2.fillStyle = '#fff'; bg2.fillText(text, bxo, by);
    const src = bg2.getImageData(0, 0, big.width, big.height).data;
    const c = mk(cols + pad * 2, rows + pad * 2), x = c.getContext('2d');
    const mask = new Uint8Array(c.width * c.height);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const sx = bxo + i * K + K / 2, sy = by - above * K + j * K + K / 2;
      if (src[(sy * big.width + sx) * 4 + 3] > 127) mask[(j + pad) * c.width + i + pad] = 1;
    }
    c.ox = pad; c.oy = pad + above - size; c.cw = cols - 1;   // dónde empieza la letra y lo que ocupa
    const out = x.createImageData(c.width, c.height), b = out.data;
    const put = (i, hex) => { const v = parseInt(hex.slice(1), 16); b[i * 4] = v >> 16; b[i * 4 + 1] = (v >> 8) & 255; b[i * 4 + 2] = v & 255; b[i * 4 + 3] = 255; };
    const W2 = c.width;
    if (o.shadow) for (let i = 0; i < mask.length; i++) { const j = i - W2 * 2 - 2; if (!mask[i] && j >= 0 && mask[j]) put(i, o.shadow); }
    if (o.outline) for (let i = 0; i < mask.length; i++) if (!mask[i] && (mask[i - 1] || mask[i + 1] || mask[i - W2] || mask[i + W2])) put(i, o.outline);
    let top = c.height, bot = 0;
    for (let i = 0; i < mask.length; i++) if (mask[i]) { const y = (i / W2) | 0; if (y < top) top = y; if (y > bot) bot = y; }
    for (let i = 0; i < mask.length; i++) if (mask[i]) {
      const y = (i / W2) | 0;
      put(i, typeof color === 'function' ? color((y - top) / Math.max(1, bot - top)) : color);
    }
    x.putImageData(out, 0, 0);
    cache.set(key, c);
    return c;
  }
  const ORO = (k) => ['#fff6c8', '#ffe68a', '#ffd552', '#f7b733', '#ec9a26', '#d77a1c', '#b85d16'][Math.min(6, Math.floor(k * 7))];
  // dibuja el texto con su esquina de arriba a la izquierda en (x, y)
  function txt(c, img, x, y) { c.drawImage(img, Math.round(x - img.ox), Math.round(y - img.oy)); }
  function centro(c, img, y, alpha) { if (!img) return; c.save(); c.globalAlpha = alpha === undefined ? 1 : step4(alpha); txt(c, img, (LW - img.cw) / 2, y); c.restore(); }

  /* ---------------- la escena: Pontevedra de noche a 256 colores ---------------- */
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function vga(x, w, h) {
    const d = x.getImageData(0, 0, w, h), a = d.data, L = 6, st = 255 / (L - 1);
    for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) {
      const p = (y * w + i) * 4, t = (BAYER[(y & 3) * 4 + (i & 3)] / 16 - 0.5) * st;
      for (let k = 0; k < 3; k++) a[p + k] = Math.max(0, Math.min(255, Math.round((a[p + k] + t) / st) * st));
    }
    x.putImageData(d, 0, 0);
  }
  let escena = null, SKY = 166, CITY = 134;
  function construye() {
    const H2 = SKY + CITY, c = mk(LW, H2), x = c.getContext('2d');
    x.imageSmoothingEnabled = true; try { x.imageSmoothingQuality = 'high'; } catch (e) {}
    const im = G.img['bg/titulo'];
    if (im) x.drawImage(im, 0, 330, 1600, 670, 0, SKY, LW, CITY);
    // color del cielo justo encima de la ciudad
    let top = [16, 26, 74];
    try { const p = x.getImageData(4, SKY + 2, 1, 1).data; top = [p[0], p[1], p[2]]; } catch (e) {}
    const g = x.createLinearGradient(0, 0, 0, SKY + 18);
    g.addColorStop(0, '#03040f'); g.addColorStop(0.55, '#0b1238'); g.addColorStop(1, `rgb(${top[0]},${top[1]},${top[2]})`);
    x.fillStyle = g; x.fillRect(0, 0, LW, SKY);
    x.fillRect(108, SKY - 1, 106, 18);   // lo que asoma del logo del dibujo original, tapado con cielo
    // nubes
    x.fillStyle = 'rgba(40,52,110,0.55)';
    [[30, 52, 70], [150, 38, 90], [230, 96, 80], [60, 120, 60]].forEach(([cx, cy, w]) => { for (let i = 0; i < 5; i++) { x.beginPath(); x.ellipse(cx + i * w / 5, cy + Math.sin(i) * 2, w / 4, 5, 0, 0, 7); x.fill(); } });
    // la luna
    const mg = x.createRadialGradient(258, 44, 6, 258, 44, 46); mg.addColorStop(0, 'rgba(255,240,190,0.55)'); mg.addColorStop(1, 'rgba(255,240,190,0)');
    x.fillStyle = mg; x.fillRect(200, 0, 120, 100);
    x.fillStyle = '#f7ebbd'; x.beginPath(); x.arc(258, 44, 13, 0, 7); x.fill();
    x.fillStyle = '#d9c995'; [[253, 40, 3], [262, 49, 2], [261, 38, 2]].forEach(([a, b, r]) => { x.beginPath(); x.arc(a, b, r, 0, 7); x.fill(); });
    vga(x, LW, H2);
    // estrellas fijas (las que titilan van aparte)
    escena = { c, H2, stars: Array.from({ length: 70 }, (_, i) => ({ x: (i * 97 + 13) % LW, y: (i * 53 + 7) % (SKY - 30), s: (i % 7) / 7 })) };
  }

  /* ---------------- el escudo del estudio ---------------- */
  function escudo(x, cx, cy) {
    x.fillStyle = '#2a1206'; x.beginPath(); x.moveTo(cx - 14, cy - 16); x.lineTo(cx + 14, cy - 16); x.lineTo(cx + 14, cy + 2); x.lineTo(cx, cy + 16); x.lineTo(cx - 14, cy + 2); x.closePath(); x.fill();
    x.fillStyle = '#e8b85a'; x.beginPath(); x.moveTo(cx - 12, cy - 14); x.lineTo(cx + 12, cy - 14); x.lineTo(cx + 12, cy + 1); x.lineTo(cx, cy + 13); x.lineTo(cx - 12, cy + 1); x.closePath(); x.fill();
    // una jarra de cerveza con espuma
    x.fillStyle = '#fff6e0'; x.fillRect(cx - 5, cy - 9, 9, 3);
    x.fillStyle = '#f2a01e'; x.fillRect(cx - 5, cy - 6, 9, 10);
    x.fillStyle = '#7a4a10'; x.fillRect(cx + 4, cy - 5, 3, 1); x.fillRect(cx + 6, cy - 5, 1, 6); x.fillRect(cx + 4, cy, 3, 1);
  }

  /* ---------------- la música: muiñeira chiptune (original) ---------------- */
  let ac = null, mg = null, preset = 3, musEnd = 0;
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function vol() {
    let v = 0.8; try { const a = JSON.parse(localStorage.getItem('pq_ajustes_v1')); if (a && typeof a.music === 'number') v = a.music; } catch (e) {}
    try { if (AUDIO.isMuted()) return 0; } catch (e) {}
    return 1.1 * v;
  }
  function audio() {
    if (ac) return;
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); mg = ac.createGain(); mg.gain.value = vol(); mg.connect(ac.destination); } catch (e) { ac = null; }
  }
  function tono(t, f, d, o) {
    if (!ac) return;
    const os = ac.createOscillator(); os.type = o.type || 'square'; os.frequency.setValueAtTime(f, t);
    if (o.det) os.detune.value = o.det;
    if (o.slide) os.frequency.exponentialRampToValueAtTime(o.slide, t + d);
    if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = 5.6; lg.gain.value = f * o.vib; l.connect(lg); lg.connect(os.frequency); l.start(t); l.stop(t + d + 0.05); }
    let n = os;
    if (o.lp) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = o.lp; n.connect(fl); n = fl; }
    if (o.bp) { const fl = ac.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = o.bp; fl.Q.value = o.q || 2; n.connect(fl); n = fl; }
    const g = ac.createGain(), v = o.vol || 0.1, at = o.a || 0.006;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + at);
    g.gain.setValueAtTime(v, t + Math.max(at, d * (o.sus || 0.65))); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    n.connect(g); g.connect(mg); os.start(t); os.stop(t + d + 0.03);
  }
  let ruidoBuf = null;
  function ruido(t, d, o) {
    if (!ac) return;
    if (!ruidoBuf) { ruidoBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const a = ruidoBuf.getChannelData(0); for (let i = 0; i < a.length; i++) a[i] = Math.random() * 2 - 1; }
    const s = ac.createBufferSource(); s.buffer = ruidoBuf;
    const fl = ac.createBiquadFilter(); fl.type = o.tipo || 'bandpass'; fl.frequency.value = o.f || 2000; fl.Q.value = o.q || 0.8;
    const g = ac.createGain(); g.gain.setValueAtTime(o.vol || 0.1, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(fl); fl.connect(g); g.connect(mg); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.02);
  }
  function bombo(t, v) { tono(t, 120, 0.22, { type: 'sine', slide: 42, vol: v || 0.5, a: 0.002, sus: 0.1 }); }
  // las «tarjetas de sonido»
  const VOZ = {
    1: { lead: { type: 'square', vol: 0.05, sus: 0.9 }, bajo: null, bateria: false, dron: false },
    2: { lead: { type: 'square', vol: 0.07, lp: 1500, vib: 0.006 }, lead2: { type: 'triangle', vol: 0.05, oct: -12 }, bajo: { type: 'triangle', vol: 0.2 }, bateria: 0.5, dron: false },
    3: { lead: { type: 'square', vol: 0.06, lp: 2600, vib: 0.005 }, lead2: { type: 'square', vol: 0.04, lp: 2600, det: 9 }, bajo: { type: 'triangle', vol: 0.22 }, bateria: 1, dron: false },
    4: { lead: { type: 'sawtooth', vol: 0.09, bp: 1500, q: 2.2, vib: 0.008, a: 0.02, sus: 0.85 }, bajo: null, bateria: 1, dron: true },
  };
  // melodía en corcheas (6/8): [nota midi, duración]
  const MEL = [
    [74, 1], [76, 1], [78, 1], [81, 1], [78, 1], [74, 1],
    [76, 1], [78, 1], [79, 1], [78, 1], [76, 1], [74, 1],
    [71, 1], [74, 1], [78, 1], [81, 1], [83, 1], [81, 1],
    [78, 2], [76, 1], [74, 3],
    [81, 1], [83, 1], [81, 1], [78, 1], [81, 1], [78, 1],
    [79, 1], [78, 1], [76, 1], [74, 1], [76, 1], [78, 1],
    [83, 1], [81, 1], [78, 1], [76, 1], [78, 1], [76, 1],
    [74, 3], [74, 2], [0, 1],
  ];
  const ACORDES = [38, 38, 45, 38, 43, 38, 45, 38, 38, 38, 43, 45, 43, 45, 38, 38];   // bajo: D, A, G… por medio compás
  const CORCHEA = 0.19;
  function musica(t0) {
    const v = VOZ[preset];
    // fanfarria
    [[69, 0], [74, 1], [78, 2]].forEach(([m, i]) => tono(t0 + i * 0.13, hz(m), 0.14, v.lead));
    tono(t0 + 0.39, hz(81), 1.0, Object.assign({}, v.lead, { sus: 0.8 }));
    if (v.bajo) { [50, 54, 57].forEach((m) => tono(t0 + 0.39, hz(m), 1.0, { type: 'triangle', vol: 0.07, sus: 0.8 })); }
    if (v.bateria) { for (let i = 0; i < 6; i++) ruido(t0 + i * 0.065, 0.05, { f: 3000, vol: 0.03 + i * 0.012 }); ruido(t0 + 0.39, 0.9, { tipo: 'highpass', f: 5000, vol: 0.12 }); bombo(t0 + 0.39, 0.5); }
    const ini = t0 + 1.8, vueltas = 4, compas = 6 * CORCHEA, largo = 8 * compas;
    for (let k = 0; k < vueltas; k++) {
      const b = ini + k * largo;
      let s = 0;
      for (const [m, d] of MEL) {
        if (m) {
          tono(b + s * CORCHEA, hz(m + (k % 2 && preset !== 1 ? 0 : 0)), d * CORCHEA * 0.95, v.lead);
          if (v.lead2) tono(b + s * CORCHEA, hz(m + (v.lead2.oct || 0)), d * CORCHEA * 0.9, v.lead2);
        }
        s += d;
      }
      for (let h = 0; h < 16; h++) {
        const tb = b + h * 3 * CORCHEA, r = ACORDES[h];
        if (v.bajo) { tono(tb, hz(r), 2 * CORCHEA * 0.9, v.bajo); tono(tb + 2 * CORCHEA, hz(r + 12), CORCHEA * 0.9, v.bajo); }
        if (v.bateria) {
          const bv = v.bateria;
          if (h % 2 === 0) bombo(tb, 0.45 * bv); else ruido(tb, 0.12, { f: 1800, q: 0.7, vol: 0.12 * bv });
          for (let i = 0; i < 3; i++) ruido(tb + i * CORCHEA, 0.03, { tipo: 'highpass', f: 7000, vol: (i ? 0.025 : 0.04) * bv });
          if (preset === 4 && h % 4 === 3) for (let i = 0; i < 3; i++) ruido(tb + CORCHEA + i * 0.06, 0.05, { f: 6000, vol: 0.05 });   // pandeireta
        }
      }
      if (v.dron) [50, 57].forEach((m) => tono(b, hz(m), largo + 0.05, { type: 'sawtooth', vol: 0.025, lp: 900, a: 0.05, sus: 0.97 }));
    }
    musEnd = ini + vueltas * largo;
  }
  function fx(nombre) {
    if (!ac) return; const t = ac.currentTime + 0.01;
    if (nombre === 'letra') tono(t, 1250, 0.09, { type: 'square', slide: 520, vol: 0.05 });
    if (nombre === 'golpe') { ruido(t, 0.45, { tipo: 'lowpass', f: 1400, vol: 0.35 }); tono(t, 95, 0.4, { type: 'sine', slide: 38, vol: 0.5, a: 0.002, sus: 0.1 }); }
    if (nombre === 'estrella') tono(t, 1700, 0.55, { type: 'triangle', slide: 2900, vol: 0.04 });
    if (nombre === 'pip') tono(t, 990, 0.07, { type: 'square', vol: 0.05, sus: 0.9 });
  }
  function apagar() {
    if (!ac) return; const t = ac.currentTime;
    try { mg.gain.cancelScheduledValues(t); mg.gain.setValueAtTime(mg.gain.value, t); mg.gain.linearRampToValueAtTime(0, t + 0.7); } catch (e) {}
    const a = ac; ac = null; setTimeout(() => { try { a.close(); } catch (e) {} }, 900);
  }

  /* ---------------- la secuencia ---------------- */
  const OPC = ['Altavoz del PC (pi-pi-pi)', 'AdLib', 'Sound Blaster', 'Gaita gallega'];
  const CRED = [
    ['Una aventura gráfica de', 'JRAR'],
    ['Programación y música', 'Claude (que no bebe)'],
    ['Con la participación de', 'Don Xesús, por cortesía', 'del Más Allá'],
    ['Ningún Porsche resultó', 'herido durante el rodaje'],
    ['Grabada en 256 colores', 'y un poco de orujo'],
  ];
  async function run() {
    // la letra pixelada tiene que estar cargada antes de pintar nada
    try { await Promise.race([document.fonts.load("8px 'Press Start 2P'"), new Promise((r) => setTimeout(r, 3000))]); } catch (e) {}
    return correr();
  }
  function correr() {
    return new Promise((fin) => {
      if (!escena) construye();
      const scr = mk(LW, LH), x = scr.getContext('2d');
      const lineas = mk(W, H), lx = lineas.getContext('2d'); lx.fillStyle = 'rgba(0,0,0,0.16)'; for (let y = 4; y < H; y += 5) lx.fillRect(0, y, W, 1);
      let fase = 'setup', t0 = 0, sel = 3, acabando = -1, golpeT = -1, estrellaT = -1, letrasOk = 0;
      const startT = () => G.t - t0;
      function empezar(op) {
        if (fase !== 'setup') return;
        if (op) sel = op;
        preset = sel; audio(); try { AUDIO.init(); } catch (e) {}
        fx('pip');
        fase = 'intro'; t0 = G.t + 0.35;
        if (ac) musica(ac.currentTime + 0.35);
      }
      function terminar() {
        if (acabando >= 0) return;
        acabando = G.t; apagar();
        fadeTo(1, 0.6).then(() => { G.mode = null; fin(); });
      }
      const filaDe = (p) => Math.floor(p.y / 5 / 10);   // filas de 10 px en la pantalla de instalación
      const m = {
        drunk: 0,
        down(p) {
          if (fase === 'setup') { const f = filaDe(p); empezar(f >= 8 && f <= 11 ? f - 7 : 0); return; }
          terminar();
        },
        key(k, dn) {
          if (!dn) return;
          if (fase === 'setup') {
            if (['1', '2', '3', '4'].includes(k)) empezar(+k);
            else if (k === 'ArrowUp') { sel = Math.max(1, sel - 1); }
            else if (k === 'ArrowDown') { sel = Math.min(4, sel + 1); }
            else empezar(0);
            return;
          }
          terminar();
        },
        draw(c, t) {
          x.imageSmoothingEnabled = false;
          x.fillStyle = '#000'; x.fillRect(0, 0, LW, LH);
          if (fase === 'setup') pintaSetup(t); else pintaIntro(startT());
          c.save(); c.imageSmoothingEnabled = false; c.drawImage(scr, 0, 0, W, H); c.restore();
          c.drawImage(lineas, 0, 0);
        },
      };
      function pintaSetup(t) {
        x.fillStyle = '#0000a8'; x.fillRect(0, 0, LW, LH);
        x.fillStyle = '#54fcfc'; x.fillRect(6, 6, LW - 12, 2); x.fillRect(6, LH - 8, LW - 12, 2); x.fillRect(6, 6, 2, LH - 12); x.fillRect(LW - 8, 6, 2, LH - 12);
        x.fillStyle = '#a8a8a8'; x.fillRect(20, 12, 280, 12);
        txt(x, pix('PONTEVEDRA QUEST · INSTALACIÓN', 8, '#0000a8'), 40, 14);
        const L = (s, row, col, cx) => txt(x, pix(s, 8, col || '#fcfcfc'), cx || 16, row * 10 + 1);
        L('Gráficos:  VGA, 256 colores', 3);
        L('Memoria:   640 KB (de sobra)', 4);
        L('Teclado:   pegajoso de cerveza', 5);
        L('Elige la tarjeta de sonido:', 7, '#fcfc54');
        OPC.forEach((s, i) => {
          const r = 8 + i, on = sel === i + 1;
          if (on) { x.fillStyle = '#fcfcfc'; x.fillRect(14, r * 10, 292, 10); }
          L((i + 1) + '. ' + s, r, on ? '#0000a8' : '#fcfcfc', 30);
          if (on && Math.floor(t * 3) % 2 === 0) txt(x, pix('>', 8, '#0000a8'), 16, r * 10 + 1);
        });
        L('Toca una opción o pulsa una tecla', 14, '#54fcfc', 24);
        L('(c) 2026 Club de Caballeros Games', 17, '#a8a8a8', 24);
      }
      function pintaIntro(T) {
        if (T < 0) return;
        // 1 · el estudio
        if (T < 4.4) {
          const a = T < 0.6 ? T / 0.6 : T > 3.8 ? (4.4 - T) / 0.6 : 1;
          x.save(); x.globalAlpha = step4(a); escudo(x, 160, 70); x.restore();
          centro(x, pix('CLUB DE CABALLEROS GAMES', 8, ORO, { outline: '#2a1206' }), 100, a);
          centro(x, pix('presenta', 8, '#a8a8fc'), 120, a);
          return;
        }
        if (T < 8.6) {
          const k = T - 4.6, a = k < 0.5 ? k / 0.5 : k > 3.4 ? (4.0 - k) / 0.6 : 1;
          centro(x, pix('en asociación con', 8, '#a8a8a8'), 70, a);
          centro(x, pix('el Bar Estrella', 8, '#fcfcfc'), 90, a);
          centro(x, pix('y la Real Cofradía del Orujo', 8, '#fcfcfc'), 104, a);
          return;
        }
        // 2 · Pontevedra de noche: la cámara baja del cielo a la ciudad
        const S = T - 8.6, aIn = step4(Math.min(1, S / 1.2));
        const tilt = Math.round(ease(Math.min(1, S / 12)) * (escena.H2 - LH));
        x.save(); x.globalAlpha = aIn;
        x.drawImage(escena.c, 0, tilt, LW, LH, 0, 0, LW, LH);
        // estrellas que titilan
        for (const s of escena.stars) {
          const y = s.y - tilt; if (y < 0 || y > LH) continue;
          const on = Math.sin(T * (2 + s.s * 3) + s.x) > 0.3;
          x.fillStyle = on ? '#fcfcfc' : '#5454a8'; x.fillRect(s.x, y, 1, 1);
        }
        // reflejos que bailan en el río
        const rioY = SKY + CITY - 26 - tilt;
        for (let i = 0; i < 26; i++) {
          const yy = rioY + ((i * 7) % 24), xx = (i * 47 + Math.floor(T * 6) * 13) % LW;
          if (yy > 0 && yy < LH && Math.sin(T * 5 + i) > 0) { x.fillStyle = i % 3 ? '#fcd454' : '#fcfc54'; x.fillRect(xx, yy, 2 + (i % 3), 1); }
        }
        // estrella fugaz
        if (S > 17.5 && estrellaT < 0) { estrellaT = T; fx('estrella'); }
        if (estrellaT >= 0 && T - estrellaT < 0.9) {
          const k = (T - estrellaT) / 0.9, sx = 40 + k * 180, sy = 18 + k * 30 - tilt * 0;
          x.fillStyle = '#fcfcfc'; x.fillRect(sx, sy, 2, 1);
          x.fillStyle = '#a8a8fc'; for (let j = 1; j < 8; j++) x.fillRect(sx - j * 3, sy - j * 0.55, 2, 1);
        }
        x.restore();
        // créditos de guasa, abajo
        CRED.forEach((ls, i) => {
          const c0 = 1.0 + i * 3.1, k = S - c0;
          if (k < 0 || k > 2.8) return;
          const a = k < 0.4 ? k / 0.4 : k > 2.4 ? (2.8 - k) / 0.4 : 1;
          ls.forEach((s, j) => {
            const im = pix(s, 8, j === 0 ? '#a8fcfc' : '#fcfcfc', { shadow: '#000000' });
            centro(x, im, LH - 14 - (ls.length - j) * 11, a);
          });
        });
        // 3 · el logo cae letra a letra
        const L0 = 16.4, LET = 'PONTEVEDRA';
        if (S > L0) {
          const base = pix(LET, 16, ORO, { outline: '#2a1206', shadow: '#000000' });
          const cw = base.cw / LET.length, x0 = Math.round((LW - base.cw) / 2);
          for (let i = 0; i < LET.length; i++) {
            const k = (S - L0 - i * 0.09) / 0.42; if (k <= 0) continue;
            if (k > 0 && i + 1 > letrasOk) { letrasOk = i + 1; fx('letra'); }
            const kk = Math.min(1, k), yy = 16 - (1 - kk) * 40 - (kk < 1 ? Math.sin(kk * Math.PI) * 6 : 0);
            x.drawImage(base, base.ox + i * cw - 1, 0, cw + 3, base.height, x0 + i * cw - 1, Math.round(yy - base.oy), cw + 3, base.height);
          }
          const Q0 = L0 + LET.length * 0.09 + 0.55;
          if (S > Q0) {
            if (golpeT < 0) { golpeT = T; fx('golpe'); shake(0.25); flash('#fff6c8', 0.5); }
            const k = Math.min(1, (S - Q0) / 0.18), sc = 1 + (1 - k) * 2;
            const q = pix('QUEST', 24, ORO, { outline: '#2a1206', shadow: '#000000' });
            const w = q.width * sc, h = q.height * sc;
            x.drawImage(q, Math.round(LW / 2 - (q.ox + q.cw / 2) * sc), Math.round(52 - (q.oy + 12) * sc), Math.round(w), Math.round(h));
          }
          if (S > Q0 + 0.6) {
            centro(x, pix('La noche de los Caballeros', 8, '#fcfcfc', { shadow: '#000000' }), 72, (S - Q0 - 0.6) / 0.6);
            centro(x, pix('TM (en trámite)', 8, '#a8a8a8', { shadow: '#000000' }), 84, (S - Q0 - 1.0) / 0.6);
          }
          if (S > Q0 + 2.2 && Math.floor(T * 2) % 2 === 0) centro(x, pix('Pulsa para empezar', 8, '#fcfc54', { shadow: '#000000' }), LH - 16);
          if (S > Q0 + 9) terminar();
        }
      }
      G.mode = m;
      $('title').classList.add('hidden');
      fadeTo(0, 0.4);
    });
  }
  return { run };
})();
