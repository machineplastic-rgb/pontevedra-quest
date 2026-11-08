'use strict';
/* =====================================================================
   CRÉDITOS FINALES (v10) · «Las fotos de la noche»
   Como al final de Resacón en Las Vegas: aparece una Polaroid y las
   fotos de la juerga van cayendo sobre la mesa, en sepia, mientras
   suben los créditos y suena la canción del Club.
   Toca para pasar de foto · mantén pulsado para acelerar · Esc, al final.
   ===================================================================== */
EXTRA_ASSETS.push('chars/angel_guitarra', 'escenas/beso1', 'escenas/beso2', 'chars/meiga_baila1', 'chars/meiga_baila2', 'chars/meiga_baila3',
  'road/vaca_frente2', 'road/peugeot', 'bg/balneario', 'items/movil', 'items/cartera', 'items/gafas', 'items/calzoncillos', 'items/llaves',
  'items/postres', 'items/compana', 'items/cruceiro', 'items/peugeot_lado',
  // v13: las fotos de verdad de la mañana en Caldofran (dibujadas por JRAR)
  'fotos/balneario1', 'fotos/balneario2', 'fotos/balneario3', 'fotos/balneario4');

const CRED = (() => {
  // la foto (760x570) y la Polaroid entera con su marco
  const PW = 760, PH = 570, BD = 28, BB = 132, CW = PW + BD * 2, CH = PH + BD + BB, PH0 = PH, CH0 = CH;
  const HX = 492, HY = 500, HS = 0.9;   // dónde se queda la foto grande
  const CX = 1275, COLW = 530;          // columna de los créditos
  const MAX_FOTOS = 19, MIN_FOTOS = 12;

  const mk = (w, h) => { const v = document.createElement('canvas'); v.width = Math.max(1, w | 0); v.height = Math.max(1, h | 0); return v; };
  const lerp = (a, b, k) => a + (b - a) * k;
  const sstep = (a, b, v) => { const k = clamp((v - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
  const eOut = (k) => 1 - Math.pow(1 - k, 3);
  const eIO = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const eBack = (k) => 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2);
  function rng(seed) { let s = (seed | 0) || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) | 0; return (s >>> 8) / 16777216; }; }
  const L = (k) => !!(S && S.logros && S.logros.includes(k));
  const F = (k) => !!(S && S.flags && S.flags[k]);
  const ST = () => (S && S.stats) || {};

  /* ---------------- ayudas para componer las fotos ---------------- */
  // fondo recortado a 4:3. z: zoom (1 = todo el alto); cx, cy: centro (0..1)
  function fondo(c, src, z, cx, cy, dark) {
    const im = typeof src === 'string' ? G.img[src] : src;
    c.fillStyle = '#1a120b'; c.fillRect(0, 0, PW, PH);
    if (im) {
      const iw = im.width, ih = im.height;
      let sh = ih / (z || 1), sw = sh * PW / PH;
      if (sw > iw) { sw = iw; sh = sw * PH / PW; }
      const sx = clamp(cx * iw - sw / 2, 0, iw - sw), sy = clamp(cy * ih - sh / 2, 0, ih - sh);
      c.drawImage(im, sx, sy, sw, sh, 0, 0, PW, PH);
    }
    if (dark) { c.fillStyle = `rgba(0,0,0,${dark})`; c.fillRect(0, 0, PW, PH); }
  }
  // personaje o cosa anclado abajo al centro; h = alto en píxeles de la foto
  function fig(c, src, x, y, h, o) {
    const im = G.img[src]; if (!im) return 0; o = o || {};
    const w = im.width * h / im.height;
    c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot); if (o.flip) c.scale(-1, 1);
    if (o.alpha !== undefined) c.globalAlpha = o.alpha;
    if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = o.blur || 26; }
    c.drawImage(im, -w / 2, o.center ? -h / 2 : -h, w, h); c.restore(); return w;
  }
  const cara = (c, id, mood, x, y, h, o) => fig(c, 'faces/' + id + '_' + mood, x, y, h, o);
  // la gente de madrugada ya va piripi
  const gente = (id) => (G.img['chars/' + id + '_piripi'] ? 'chars/' + id + '_piripi' : 'chars/' + id);
  // flash directo: el centro quemado y los bordes a oscuras
  function flashLuz(c, x, y, r, k) {
    k = k === undefined ? 1 : k;
    let g = c.createRadialGradient(x, y, r * 0.1, x, y, r);
    g.addColorStop(0, `rgba(255,250,235,${0.2 * k})`); g.addColorStop(1, 'rgba(255,250,235,0)');
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, 0, PW, PH); c.restore();
    g = c.createRadialGradient(x, y, r * 0.45, x, y, r * 1.45);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${0.6 * k})`);
    c.fillStyle = g; c.fillRect(0, 0, PW, PH);
  }
  function corazon(c, x, y, s, col, line) {
    c.save(); c.translate(x, y); c.scale(s / 20, s / 20); c.beginPath();
    c.moveTo(0, 6); c.bezierCurveTo(-26, -12, -10, -30, 0, -14); c.bezierCurveTo(10, -30, 26, -12, 0, 6); c.closePath();
    if (line) { c.lineWidth = 3.2 * 20 / s; c.strokeStyle = col; c.stroke(); } else { c.fillStyle = col; c.fill(); }
    c.restore();
  }
  function estrella(c, x, y, s, col) {
    c.save(); c.translate(x, y); c.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? s * 0.45 : s; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    c.closePath(); c.lineWidth = 2.6; c.strokeStyle = col; c.stroke(); c.restore();
  }
  function chispas(c, n, x, y, rx, ry, col, seed) {
    const R = rng(seed);
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const px = x + (R() - 0.5) * 2 * rx, py = y + (R() - 0.5) * 2 * ry, s = 3 + R() * 9;
      c.globalAlpha = 0.5 + R() * 0.5; c.beginPath();
      c.moveTo(px, py - s); c.lineTo(px + s * 0.22, py - s * 0.22); c.lineTo(px + s, py); c.lineTo(px + s * 0.22, py + s * 0.22);
      c.lineTo(px, py + s); c.lineTo(px - s * 0.22, py + s * 0.22); c.lineTo(px - s, py); c.lineTo(px - s * 0.22, py - s * 0.22); c.fill();
    }
    c.restore();
  }
  // haces de luz de discoteca
  function haces(c, list) {
    c.save(); c.globalCompositeOperation = 'lighter';
    list.forEach(([x, y, col, ang]) => {
      const a = ang || 0, tx = x + Math.sin(a) * 700, ty = y + Math.cos(a) * 700;
      const g = c.createLinearGradient(x, y, tx, ty); g.addColorStop(0, hexA(col, 0.45)); g.addColorStop(1, hexA(col, 0));
      c.fillStyle = g; c.beginPath(); c.moveTo(x - 6, y); c.lineTo(tx - 170, ty); c.lineTo(tx + 170, ty); c.lineTo(x + 6, y); c.closePath(); c.fill();
    });
    c.restore();
  }
  function brillo(c, x, y, r, col, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, hexA(col, a)); g.addColorStop(1, hexA(col, 0));
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
  }
  function niebla(c, n, y0, y1, seed, a) {
    const R = rng(seed);
    for (let i = 0; i < n; i++) {
      const x = R() * PW, y = y0 + R() * (y1 - y0), r = 90 + R() * 160, g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(225,232,255,${a})`); g.addColorStop(1, 'rgba(225,232,255,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  function maceta(c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s); c.lineJoin = 'round';
    // hojas un poco caídas: la planta va piripi
    for (let i = 0; i < 11; i++) {
      c.save(); c.translate(0, -78); c.rotate(-1.25 + i * 0.25 + (i % 3) * 0.04); c.beginPath(); c.ellipse(0, -62, 15, 64, 0.12, 0, 7);
      c.fillStyle = i % 2 ? '#3f8f3a' : '#2f7a2e'; c.fill(); c.lineWidth = 3; c.strokeStyle = 'rgba(12,10,20,.8)'; c.stroke(); c.restore();
    }
    c.beginPath(); c.moveTo(-52, -78); c.lineTo(52, -78); c.lineTo(40, 30); c.lineTo(-40, 30); c.closePath();
    c.fillStyle = '#b5562a'; c.fill(); c.lineWidth = 3; c.strokeStyle = 'rgba(12,10,20,.85)'; c.stroke();
    c.fillStyle = '#c86a36'; c.fillRect(-60, -92, 120, 20); c.strokeRect(-60, -92, 120, 20);
    c.restore();
  }
  function vasito(c, x, y, s, rot) {
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    c.beginPath(); c.moveTo(-14, -20); c.lineTo(14, -20); c.lineTo(11, 20); c.lineTo(-11, 20); c.closePath();
    c.fillStyle = 'rgba(200,210,225,.8)'; c.fill(); c.strokeStyle = 'rgba(20,20,30,.9)'; c.lineWidth = 3; c.stroke();
    c.fillStyle = 'rgba(176,104,30,1)'; c.fillRect(-11, 2, 22, 17);
    c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(-9, -16, 3, 30);
    c.restore();
  }
  // un vasito de chupito (la mitad izquierda del dibujo de los chupitos)
  function chupito(c, x, y, h, rot) {
    const im = G.img['items/chupitos']; if (!im) return vasito(c, x, y, h / 40, rot);
    const sw = im.width * 0.5, w = sw * h / im.height;
    c.save(); c.translate(x, y); c.rotate(rot); c.drawImage(im, 0, 0, sw, im.height, -w / 2, -h / 2, w, h); c.restore();
  }
  // chorrito de orujo en arco
  function chorro(c, x0, y0, x1, y1, alto) {
    c.save(); c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - alto, x1, y1);
    c.strokeStyle = 'rgba(60,30,10,.75)'; c.lineWidth = 13; c.stroke();
    c.strokeStyle = 'rgba(176,104,30,1)'; c.lineWidth = 8; c.stroke();
    c.fillStyle = 'rgba(176,104,30,1)'; c.strokeStyle = 'rgba(60,30,10,.75)'; c.lineWidth = 2;
    for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(x1 - 30 + i * 11, y1 + 14 + (i % 3) * 9, 3 + (i % 2) * 2, 0, 7); c.fill(); c.stroke(); }
    c.restore();
  }
  function dni(c, x, y, rot) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = '#dfe9f2'; c.fillRect(-46, -30, 92, 60); c.strokeStyle = 'rgba(20,20,40,.8)'; c.lineWidth = 2.5; c.strokeRect(-46, -30, 92, 60);
    c.fillStyle = '#c94a3a'; c.fillRect(-46, -30, 92, 11);
    c.fillStyle = '#9aa8b8'; c.fillRect(-38, -14, 26, 34);
    c.fillStyle = '#6b7a8c'; for (let i = 0; i < 4; i++) c.fillRect(-6, -12 + i * 9, 44 - i * 6, 4);
    c.restore();
  }
  // círculo de sal en el suelo
  function sal(c, x, y, rx, ry) {
    c.save(); brillo(c, x, y, rx * 1.1, '#e8f0ff', 0.18); c.fillStyle = '#ffffff';
    for (let i = 0; i < 140; i++) { const a = i / 140 * Math.PI * 2, j = Math.sin(i * 12.9898) * 4; c.globalAlpha = 0.65 + 0.35 * Math.sin(i * 3.7); c.fillRect(x + Math.cos(a) * (rx + j), y + Math.sin(a) * (ry + j * 0.3), 3.2, 3.2); }
    c.restore();
  }
  // el dedo de Marc delante del objetivo: muy cerca del flash, borroso y quemado
  function dedo(c) {
    c.save(); c.translate(-20, -10); c.rotate(0.75); c.scale(1, 0.48);
    const g = c.createRadialGradient(0, 0, 30, 0, 0, 300);
    g.addColorStop(0, 'rgba(255,214,180,1)'); g.addColorStop(0.5, 'rgba(240,170,130,0.95)'); g.addColorStop(0.78, 'rgba(150,80,55,0.6)'); g.addColorStop(1, 'rgba(120,60,40,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 300, 0, 7); c.fill();
    c.restore();
  }

  /* ---------------- las fotos posibles ----------------
     tipo: 'siempre' (salen en todas las partidas), 'logro' (según lo que hicisteis), 'relleno' (por si faltan)
     h: la hora del sello · kb: hacia dónde se acerca la cámara (0..1) */
  const FOTOS = [
    { id: 'antes', h: '21:47', tipo: 'siempre', kb: [0.5, 0.2],
      cap: () => 'El «antes». Todavía con dignidad.',
      draw(c) {
        fondo(c, 'bg/estrella', 1.3, 0.45, 0.42, 0.2);
        fig(c, 'chars/marc', 135, 720, 610); fig(c, 'chars/angel', 625, 716, 610);
        fig(c, 'chars/marcos', 295, 706, 600); fig(c, 'chars/ramis_alegre', 468, 718, 620);
        flashLuz(c, 380, 260, 520);
      } },
    { id: 'maceta', h: '22:16', tipo: 'logro', pri: 9, ok: () => L('maceta'), kb: [0.25, 0.45], tilt: -0.03,
      cap: () => { const n = ST().chupitosTirados || 0; return n >= 3 ? `Marcos riega las flores: ${n} chupitos. Las flores, mamadas.` : 'Marcos riega las flores con orujo. Las flores, mamadas.'; },
      draw(c) {
        // el jarrón de flores es el del dibujo del bar (x 239 en la foto)
        fondo(c, 'bg/estrella', 1.4, 0.25, 0.5, 0.2);
        fig(c, 'chars/ramis_piripi', 625, 712, 600);
        fig(c, 'chars/marcos_alegre', 365, 712, 610, { flip: true });
        chorro(c, 300, 360, 245, 300, 50); chupito(c, 322, 378, 96, -2.0);
        flashLuz(c, 330, 280, 520);
      } },
    { id: 'postre', h: '22:58', tipo: 'logro', pri: 10, ok: () => L('postre'), kb: [0.45, 0.3], doodle: 'heart',
      cap: () => 'Ángel le dice «te quiero» a Doña Maruxa. Por un postre.',
      draw(c) {
        fondo(c, 'bg/estrella', 1.35, 0.62, 0.45, 0.2);
        fig(c, 'chars/angel_alegre', 540, 716, 630, { flip: true });
        fig(c, 'chars/senora_risa', 240, 655, 520);
        fig(c, 'items/postres', 345, 400, 175, { rot: 0.08 });
        corazon(c, 430, 150, 24, '#ff6b8a'); corazon(c, 472, 108, 15, '#ff6b8a');
        cara(c, 'ramis', 'risa', 738, 590, 230, { rot: -0.18 });
        flashLuz(c, 380, 280, 520);
      } },
    { id: 'fisgon', h: '23:24', tipo: 'logro', pri: 14, ok: () => L('fisgon'), kb: [0.3, 0.3],
      cap: () => 'Pillados en la bodega. «Estábamos inventariando.»',
      draw(c) {
        fondo(c, 'bg/bodega', 1.2, 0.45, 0.45, 0.22);
        fig(c, 'chars/senora', 140, 615, 470);
        PROTA.forEach((id, i) => cara(c, id, 'sorpresa', 300 + i * 128, 605 + (i % 2) * 10, 240, { rot: (i - 1.5) * 0.06 }));
        flashLuz(c, 430, 330, 520, 1.1);
      } },
    { id: 'abbey', h: '23:33', tipo: 'relleno', pri: 19, ok: () => true, kb: [0.5, 0.55],
      cap: () => 'Abbey Road, versión Pontevedra. Solo Marcos mira si vienen coches.',
      draw(c) {
        fondo(c, 'bg/plaza', 1.25, 0.5, 0.56, 0.18);
        // el paso de cebra
        c.fillStyle = 'rgba(235,232,220,0.85)';
        [[452, 10], [478, 14], [510, 18], [550, 24]].forEach(([y, h], i) => { c.beginPath(); c.moveTo(-10, y); c.lineTo(PW + 10, y - 6); c.lineTo(PW + 10, y - 6 + h); c.lineTo(-10, y + h); c.closePath(); c.fill(); });
        [['angel', 145, 0.04], ['marcos', 300, -0.03], ['ramis', 455, 0.05], ['marc', 610, -0.04]].forEach(([id, x, r]) => fig(c, 'chars/' + id + '_lado', x, 548, 400, { rot: r, flip: id === 'marcos' }));   // Marcos mira atrás, por si vienen coches
        flashLuz(c, 380, 330, 560, 0.8);
      } },
    { id: 'selfie', h: '23:41', tipo: 'relleno', pri: 21, ok: () => true, kb: [0.5, 0.65], tilt: 0.06,
      cap: () => 'Ruta de bares. Primera parada de… perdimos la cuenta.',
      draw(c) {
        fondo(c, 'bg/calle', 1.15, 0.6, 0.4, 0.15);
        cara(c, 'angel', 'risa', 650, 575, 300, { rot: 0.1 });
        cara(c, 'marcos', 'risa', 475, 610, 320, { rot: 0.03 });
        cara(c, 'marc', 'risa', 292, 600, 310, { rot: -0.06 });
        cara(c, 'ramis', 'risa', 115, 625, 350, { rot: -0.12 });
        flashLuz(c, 380, 380, 560, 1.2);
      } },
    { id: 'llaves', h: '23:58', tipo: 'relleno', pri: 20, ok: () => true, kb: [0.45, 0.35],
      cap: () => 'Brais se queda las llaves. «Política de la casa.»',
      draw(c) {
        fondo(c, 'bg/bareto', 1.3, 0.42, 0.45, 0.18);
        fig(c, 'chars/camarero_risa', 300, 675, 565);
        fig(c, 'items/llaves', 405, 280, 95, { rot: -0.35 });
        fig(c, 'chars/marcos', 612, 716, 610, { flip: true });
        flashLuz(c, 380, 300, 520);
      } },
    { id: 'beso', h: '00:37', tipo: 'logro', pri: 1, ok: () => L('minuto') || F('beso'), kb: [0.5, 0.15], doodle: 'heart',
      cap: () => 'Un minuto. Ni nombre ni número. Ángel y la chica del pub.',
      draw(c) {
        fondo(c, 'bg/pub', 1.3, 0.55, 0.42, 0.3);
        brillo(c, 640, 90, 260, '#ff3f9a', 0.35); brillo(c, 90, 140, 220, '#3f7bff', 0.3);
        fig(c, 'escenas/beso1', 385, 668, 660);
        cara(c, 'ramis', 'risa', 85, 595, 235, { rot: 0.16 });
        cara(c, 'marc', 'risa', 690, 590, 225, { rot: -0.14, flip: true });
        corazon(c, 300, 92, 18, '#ff6b8a'); corazon(c, 470, 70, 13, '#ff6b8a');
        flashLuz(c, 385, 250, 520, 1.1);
      } },
    { id: 'lupanar', h: '01:12', tipo: 'logro', pri: 11, ok: () => L('lupanar') || F('fantasmaVisto'), kb: [0.5, 0.25],
      cap: () => 'Don Xesús, fantasma desde 1714: «¡Serrallo, lupanar!»',
      draw(c) {
        fondo(c, 'bg/ruinas', 1.2, 0.45, 0.42, 0.28);
        fig(c, 'chars/marc', 100, 716, 610); fig(c, 'chars/ramis_piripi', 662, 716, 610, { flip: true });
        fig(c, 'chars/fantasma_risa', 385, 600, 500, { alpha: 0.82, glow: 'rgba(150,220,255,0.95)', blur: 34 });
        flashLuz(c, 385, 300, 520, 0.9);
      } },
    { id: 'caballero', h: '01:49', tipo: 'logro', pri: 2, ok: () => L('caballero') || F('carteraLlena'), kb: [0.62, 0.3], doodle: 'star',
      cap: () => 'Caballeros de Santo Domingo. Por el poder de estar muerto.',
      draw(c) {
        fondo(c, 'bg/cripta', 1.25, 0.55, 0.45, 0.2);
        fig(c, 'chars/fantasma', 605, 612, 540, { flip: true, alpha: 0.82, glow: 'rgba(150,220,255,0.95)', blur: 34 });
        // arrodillados: se les ve de cintura para arriba
        fig(c, 'chars/ramis', 75, 935, 650); fig(c, 'chars/marc', 200, 928, 640); fig(c, 'chars/marcos', 325, 940, 640); fig(c, 'chars/angel', 452, 932, 650);
        chispas(c, 14, 470, 250, 70, 50, '#cfefff', 7);
        flashLuz(c, 380, 300, 520);
      } },
    { id: 'duelo', h: '01:41', tipo: 'logro', pri: 5.5, ok: () => F('acertijo'), kb: [0.5, 0.3], doodle: 'star',
      cap: () => '¡Touché! Marcos contra Don Xesús, a candelabro y lengua.',
      draw(c) {
        fondo(c, 'bg/cripta', 1.2, 0.5, 0.45, 0.3);
        if (G.img['duelo/marcos_para']) fig(c, 'duelo/marcos_para', 215, 640, 560); else { fig(c, 'chars/marcos_lado', 215, 640, 540); fig(c, 'items/candelabro', 262, 390, 120, { rot: 1.2 }); }
        if (G.img['duelo/xesus_retrocede']) fig(c, 'duelo/xesus_retrocede', 530, 615, 560, { alpha: 0.85, glow: 'rgba(150,220,255,0.95)', blur: 34 });
        else fig(c, 'chars/fantasma_risa', 530, 615, 540, { flip: true, rot: 0.08, alpha: 0.82, glow: 'rgba(150,220,255,0.95)', blur: 34 });
        chispas(c, 16, 380, 330, 60, 50, '#fff2b0', 11);
        flashLuz(c, 380, 330, 520);
      } },
    { id: 'calzon', h: '02:21', tipo: 'logro', pri: 3, ok: () => L('calzon'), kb: [0.45, 0.2],
      cap: () => 'Los calzoncillos de Ramis, en manos de una meiga. Calentitos.',
      draw(c) {
        fondo(c, 'bg/alameda', 1.3, 0.5, 0.45, 0.22);
        fig(c, 'chars/ramis_alegre', 572, 716, 630, { flip: true });
        fig(c, 'chars/meiga_baila1', 245, 660, 560);
        fig(c, 'items/calzoncillos', 352, 228, 120, { rot: 0.32 });   // como un trofeo
        flashLuz(c, 380, 300, 520);
      } },
    { id: 'meigallo', h: '02:27', tipo: 'logro', pri: 4, ok: () => L('meigallo'), kb: [0.5, 0.35], tilt: 0.025,
      cap: () => (L('calzon') ? 'Muiñeira de la buena suerte. Ramis, sin calzoncillos.' : 'Muiñeira de la buena suerte. Haberlas, haylas.'),
      draw(c) {
        fondo(c, 'bg/alameda', 1.15, 0.45, 0.48, 0.34);
        fig(c, 'items/cruceiro', 380, 470, 330, { alpha: 0.9 });
        fig(c, 'chars/meiga_baila1', 175, 615, 450, { alpha: 0.5 });
        fig(c, 'chars/meiga_baila2', 590, 615, 450, { alpha: 0.5 });
        fig(c, 'chars/meiga_baila3', 380, 625, 480);
        chispas(c, 30, 380, 300, 320, 200, '#e2c8ff', 3);
        flashLuz(c, 380, 330, 540, 0.9);
      } },
    { id: 'joven', h: '03:04', tipo: 'logro', pri: 8, ok: () => L('joven'), kb: [0.55, 0.3],
      cap: () => 'Rubén le pide el DNI a Marcos. Es mayor que él. Bastante.',
      draw(c) {
        fondo(c, 'bg/calle', 1.3, 0.72, 0.42, 0.25);
        fig(c, 'chars/portero', 575, 655, 530, { flip: true });
        fig(c, 'chars/marcos_alegre', 285, 716, 620);
        dni(c, 452, 335, -0.18);
        flashLuz(c, 400, 300, 520);
      } },
    { id: 'pillaria', h: '03:18', tipo: 'logro', pri: 7, ok: () => L('pillaria'), kb: [0.4, 0.25],
      cap: () => '«Ramis, yo te pillaría y…» Lo oyó toda la Lume.',
      draw(c) {
        fondo(c, 'bg/disco', 1.25, 0.6, 0.45, 0.12);
        haces(c, [[120, -20, '#b45cff', 0.25], [640, -20, '#3fc8ff', -0.3]]);
        fig(c, 'chars/ramis_piripi', 545, 716, 625, { flip: true });
        fig(c, gente('noa'), 252, 655, 530);
        flashLuz(c, 400, 300, 520);
      } },
    { id: 'porche', h: '03:26', tipo: 'logro', pri: 13, ok: () => L('porche'), kb: [0.4, 0.3],
      cap: () => 'Ramis tiene un Porsche. Uxía entiende «porche». Con balancín.',
      draw(c) {
        fondo(c, 'bg/disco', 1.3, 0.3, 0.45, 0.12);
        haces(c, [[700, -20, '#ff4fa8', -0.35]]);
        fig(c, 'chars/ramis_alegre', 525, 716, 630, { flip: true });
        fig(c, gente('uxia'), 238, 660, 530);
        flashLuz(c, 400, 300, 520);
      } },
    { id: 'ligon', h: '03:41', tipo: 'logro', pri: 12, ok: () => L('ligon'), kb: [0.5, 0.3], doodle: 'heart',
      cap: () => (F('luaOk') ? 'Marc dibuja a Lúa. Vestida, para variar.' : 'Marc dibuja a Vera en un posavasos. Guapa y peligrosa.'),
      draw(c) {
        const lua = F('luaOk');
        fondo(c, lua ? 'bg/disco' : 'bg/antro', 1.3, 0.8, 0.45, 0.15);
        fig(c, 'chars/marc_alegre', 250, 716, 625);
        fig(c, gente(lua ? 'lua' : 'vera'), 545, 655, 530, { flip: true });
        corazon(c, 400, 120, 22, '#ff6b8a'); corazon(c, 440, 84, 14, '#ff6b8a');
        flashLuz(c, 400, 300, 520);
      } },
    { id: 'apostol', h: '03:52', tipo: 'logro', pri: 15, ok: () => L('apostol'), kb: [0.5, 0.3],
      cap: () => 'Nike Apóstol tiene fans. Bueno, un fan.',
      draw(c) {
        fondo(c, 'bg/disco', 1.3, 0.5, 0.45, 0.12);
        haces(c, [[380, -30, '#3fc8ff', 0]]);
        fig(c, gente('iago'), 248, 655, 515);
        fig(c, 'chars/marcos_alegre', 525, 716, 625, { flip: true });
        flashLuz(c, 400, 300, 520);
      } },
    { id: 'pista', h: '04:09', tipo: 'logro', pri: 5, ok: () => L('pista'), kb: [0.5, 0.4], tilt: -0.05,
      cap: () => (F('gaita') ? 'Suena «Cuatro amigos fueron de viaje…». La Lume, abrazada.' : 'Reyes de la pista. Marcos baila sin mover los pies.'),
      draw(c) {
        fondo(c, 'bg/disco', 1.1, 0.62, 0.42, 0.15);
        haces(c, [[100, -20, '#b45cff', 0.35], [400, -30, '#ff4fa8', 0], [700, -20, '#3fc8ff', -0.35]]);
        fig(c, gente('noa'), 60, 565, 360, { alpha: 0.85 }); fig(c, gente('guiri'), 705, 565, 360, { alpha: 0.85 });
        const B = [['ramis_mamado', 122], ['marc_mamado', 290], ['marcos', 455], ['angel_mamado', 628]];
        B.forEach(([s, x]) => fig(c, 'chars/' + s, x + 24, 690, 520, { alpha: 0.32, rot: 0.06 }));   // movido, como las fotos buenas
        B.forEach(([s, x], i) => fig(c, 'chars/' + s, x, 690, 520, { rot: (i % 2 ? -1 : 1) * 0.03 }));
        flashLuz(c, 380, 300, 560);
      } },
    { id: 'canero', h: '04:44', tipo: 'logro', pri: 6, ok: () => L('canero') || F('concierto'), kb: [0.5, 0.25],
      cap: () => '¡Ángel, qué papá más cañero! Dos millones en TikTok.',
      draw(c) {
        fondo(c, 'bg/antro', 1.3, 0.75, 0.45, 0.25);
        haces(c, [[390, -40, '#ffd9a0', 0], [120, -20, '#ff3f6a', 0.4], [660, -20, '#b45cff', -0.4]]);
        fig(c, 'chars/angel_guitarra', 395, 655, 600);
        fig(c, gente('vera'), 75, 700, 470); fig(c, gente('carla'), 705, 700, 470, { flip: true });
        flashLuz(c, 395, 280, 520);
      } },
    { id: 'cuartel', h: '05:20', tipo: 'logro', pri: 17, ok: () => !!ST().derrotas, kb: [0.5, 0.4],
      cap: () => 'Esta foto no existe: mus en el cuartelillo con el sargento.',
      draw(c) {
        c.fillStyle = PROC.lin(c, 0, 0, 0, PH, [[0, '#5b6a4c'], [1, '#2c3424']]); c.fillRect(0, 0, PW, PH);
        c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(60, 60, 170, 120); brillo(c, 380, 30, 380, '#fff2c0', 0.3);
        fig(c, 'chars/gc2', 575, 700, 560, { flip: true });
        cara(c, 'marcos', 'borracho', 175, 560, 250); cara(c, 'ramis', 'borracho', 345, 575, 245, { rot: 0.1 });
        c.fillStyle = '#4a2d16'; c.fillRect(0, 500, PW, 70);
        for (let i = 0; i < 4; i++) { c.save(); c.translate(260 + i * 60, 520); c.rotate(-0.2 + i * 0.13); c.fillStyle = '#fff6e0'; c.fillRect(-18, -26, 36, 52); c.strokeStyle = '#7a1a1a'; c.lineWidth = 3; c.strokeRect(-18, -26, 36, 52); c.restore(); }
        flashLuz(c, 380, 320, 520, 1.1);
      } },
    { id: 'parking', h: '05:52', tipo: 'relleno', pri: 22, ok: () => true, kb: [0.5, 0.4],
      cap: () => 'Marcos, conductor designado. El resto, designado a cantar.',
      draw(c) {
        fondo(c, 'bg/parking', 1.15, 0.55, 0.5, 0.1);
        fig(c, 'chars/ramis_mamado', 645, 716, 590, { flip: true });
        fig(c, 'chars/marcos_alegre', 195, 716, 610);
        fig(c, 'items/llaves', 112, 330, 80, { rot: 0.4 });
        flashLuz(c, 380, 300, 540, 0.9);
      } },
    { id: 'control', h: '06:23', tipo: 'siempre', kb: [0.35, 0.4],
      cap: () => (F('meigallo') ? '«Vaca suelta en el kilómetro 92.» Circulen, poetas.' : '«Cero coma cero. ¿Usted bebe agua o qué?»'),
      draw(c) {
        fondo(c, PROC.get('control'), 1.15, 0.5, 0.52, 0.05);
        brillo(c, 30, 300, 420, '#3c78ff', 0.55); brillo(c, 700, 230, 300, '#ff3030', 0.25);
        cara(c, 'ramis', 'risa', 300, 345, 175, { rot: -0.15 });
        fig(c, 'items/peugeot_lado', 300, 545, 225, { flip: true });
        fig(c, 'chars/gc2', 612, 655, 525, { flip: true });
        flashLuz(c, 420, 320, 540);
      } },
    { id: 'compana', h: '06:51', tipo: 'siempre', kb: [0.62, 0.35], tilt: 0.03,
      cap: () => 'La Santa Compaña mira a Ramis: «Este aún no».',
      draw(c) {
        fondo(c, PROC.get('camino'), 1.15, 0.5, 0.5, 0.15);
        [[705, 345, 120, 0.3], [655, 375, 170, 0.45], [585, 420, 235, 0.62], [480, 478, 310, 0.82]].forEach(([x, y, h, a]) => fig(c, 'items/compana', x, y, h, { alpha: a, glow: 'rgba(170,200,255,0.9)', blur: 24 }));
        sal(c, 190, 532, 160, 40);
        PROTA.forEach((id, i) => fig(c, 'chars/' + id, 112 + i * 55, 540 - (i % 2) * 8, 300));
        niebla(c, 7, 380, 570, 5, 0.18);
        flashLuz(c, 300, 380, 540, 0.9);
      } },
    { id: 'muuu', h: '07:24', tipo: 'siempre', kb: [0.5, 0.42], dedo: true,
      cap: () => 'La vaca de Ramiro. Ella no se apartó. Nosotros sí.',
      draw(c) {
        fondo(c, PROC.get('camino'), 1.45, 0.5, 0.55, 0.55);
        // la carretera y los faros
        c.fillStyle = 'rgba(30,30,34,.9)'; c.beginPath(); c.moveTo(250, 330); c.lineTo(510, 330); c.lineTo(860, PH); c.lineTo(-100, PH); c.closePath(); c.fill();
        c.fillStyle = 'rgba(240,235,200,.7)'; for (let i = 0; i < 5; i++) { const k = i / 5, y = 340 + k * k * 260; c.fillRect(378 - 3 - k * 6, y, 6 + k * 12, 12 + k * 30); }
        brillo(c, 380, 420, 520, '#fff4d0', 0.35);
        fig(c, 'road/vaca_frente2', 395, 510, 380);
        brillo(c, 120, 600, 300, '#fff8e0', 0.5); brillo(c, 640, 600, 300, '#fff8e0', 0.5);
      } },
    { id: 'camino', h: '07:56', tipo: 'logro', pri: 16, ok: () => L('camino'), kb: [0.62, 0.3],
      cap: () => 'Toño llega andando a Caldas. Casi a la vez que el Peugeot.',
      draw(c) {
        fondo(c, PROC.get('balneario'), 1.2, 0.5, 0.45, 0.1);
        fig(c, 'chars/ramis_mamado', 125, 716, 600); fig(c, 'chars/marcos', 300, 716, 610);
        fig(c, gente('peregrino'), 565, 665, 520, { flip: true });
        flashLuz(c, 400, 300, 540, 0.8);
      } },
    // v13: la mañana en Caldofran, con los dibujos de JRAR: en color y apaisadas
    { id: 'piscina', h: '08:00', tipo: 'siempre', kb: [0.5, 0.45], ph: 452, keep: 0.82, foto: 'fotos/balneario1',
      cap: () => 'Caldofran, 8:00. Aguas que curan (casi todo).' },
    { id: 'albornoz', h: '09:20', tipo: 'siempre', kb: [0.5, 0.35], ph: 452, keep: 0.82, foto: 'fotos/balneario2',
      cap: () => 'Caballeros de Santo Domingo, en albornoz. Marcos aprueba el patronaje.' },
    { id: 'hamacas', h: '10:45', tipo: 'siempre', kb: [0.4, 0.6], ph: 452, keep: 0.82, foto: 'fotos/balneario3',
      cap: () => 'La siesta del guerrero. Nadie ha dicho «nunca más»… todavía.' },
    { id: 'brindis', h: '11:58', tipo: 'siempre', kb: [0.5, 0.5], ph: 452, keep: 0.82, doodle: 'heart', foto: 'fotos/balneario4',
      cap: () => '¡Por el Club! Nunca más… hasta el sábado.' },
  ];
  const horaN = (h) => { let a = +h.slice(0, 2); const b = +h.slice(3, 5); if (a < 12) a += 24; return a * 60 + b; };
  function elegir() {
    const okF = (f) => { try { return !!f.ok(); } catch (e) { return false; } };
    const sel = FOTOS.filter((f) => f.tipo === 'siempre');
    FOTOS.filter((f) => f.tipo === 'logro' && okF(f)).sort((a, b) => a.pri - b.pri).forEach((f) => { if (sel.length < MAX_FOTOS) sel.push(f); });
    FOTOS.filter((f) => f.tipo === 'relleno' && okF(f)).sort((a, b) => a.pri - b.pri).forEach((f) => { if (sel.length < MIN_FOTOS) sel.push(f); });
    return sel.sort((a, b) => horaN(a.h) - horaN(b.h));
  }

  /* ---------------- revelado: sepia, grano, viñeta, luz quemada ---------------- */
  // la sepia va a mano con getImageData (ctx.filter no funciona en Safari)
  const TONO = (() => {
    const st = [[0, 24, 15, 8], [0.3, 92, 60, 35], [0.6, 180, 140, 92], [0.84, 234, 210, 166], [1, 252, 244, 222]];
    const r = new Uint8ClampedArray(256), g = new Uint8ClampedArray(256), b = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) {
      const v = i / 255; let k = 0; while (k < st.length - 2 && v > st[k + 1][0]) k++;
      const a = st[k], z = st[k + 1], t = (v - a[0]) / (z[0] - a[0]);
      r[i] = lerp(a[1], z[1], t); g[i] = lerp(a[2], z[2], t); b[i] = lerp(a[3], z[3], t);
    }
    return { r, g, b };
  })();
  function revelar(cv, f, seed) {
    const c = cv.getContext('2d'), w = cv.width, h = cv.height;
    let id;
    try { id = c.getImageData(0, 0, w, h); } catch (e) { return; }
    const d = id.data, keep = f.keep !== undefined ? f.keep : 0.14, vig = 1.05, gr = 20;
    // curva: algo de contraste, negros lavados y un pelín sobreexpuesta
    const cur = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) { let v = i / 255; v = (v - 0.5) * 1.12 + 0.5; v = v * 1.07; v = 0.07 + 0.93 * clamp(v, 0, 1); cur[i] = v * 255; }
    let s = (seed * 7919) | 1;
    for (let y = 0; y < h; y++) {
      const dy = (y / h - 0.5) * 0.86;
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4, dx = x / w - 0.5, r2 = dx * dx + dy * dy;
        const v = 1 - vig * Math.max(0, r2 - 0.07);
        s = (Math.imul(s, 1664525) + 1013904223) | 0;
        const n = ((s >>> 24) / 255 - 0.5) * gr;
        let l = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) * v + n;
        l = cur[l < 0 ? 0 : l > 255 ? 255 : l | 0];
        d[i] = TONO.r[l] * (1 - keep) + d[i] * v * keep;
        d[i + 1] = TONO.g[l] * (1 - keep) + d[i + 1] * v * keep;
        d[i + 2] = TONO.b[l] * (1 - keep) + d[i + 2] * v * keep;
      }
    }
    c.putImageData(id, 0, 0);
  }
  // brillo suave (sobreexposición), luz que se cuela, polvo y rayas
  function efectos(cv, seed) {
    const c = cv.getContext('2d'), R = rng(seed), PW = cv.width, PH = cv.height;
    const sm = mk(PW / 8, PH / 8); sm.getContext('2d').drawImage(cv, 0, 0, sm.width, sm.height);
    c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = 0.3; c.drawImage(sm, 0, 0, PW, PH); c.restore();
    // fuga de luz en un borde
    const corners = [[0, 0], [PW, 0], [0, PH], [PW, PH], [PW, PH * 0.5], [0, PH * 0.4]], cn = corners[(R() * corners.length) | 0];
    let g = c.createRadialGradient(cn[0], cn[1], 0, cn[0], cn[1], PW * (0.35 + R() * 0.3));
    g.addColorStop(0, 'rgba(255,128,50,0.6)'); g.addColorStop(0.45, 'rgba(255,90,40,0.2)'); g.addColorStop(1, 'rgba(255,80,40,0)');
    c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = g; c.fillRect(0, 0, PW, PH);
    if (R() < 0.5) { const lx = R() < 0.5 ? 0 : PW; g = c.createLinearGradient(lx, 0, lx === 0 ? 70 : PW - 70, 0); g.addColorStop(0, 'rgba(255,180,90,0.45)'); g.addColorStop(1, 'rgba(255,180,90,0)'); c.fillStyle = g; c.fillRect(0, 0, PW, PH); }
    c.restore();
    // polvo, pelos y una raya
    for (let i = 0; i < 46; i++) { c.fillStyle = R() < 0.6 ? `rgba(255,248,230,${0.25 + R() * 0.45})` : `rgba(30,18,8,${0.25 + R() * 0.4})`; c.beginPath(); c.arc(R() * PW, R() * PH, 0.6 + R() * 1.6, 0, 7); c.fill(); }
    c.lineWidth = 1; c.strokeStyle = 'rgba(30,18,8,0.35)';
    for (let i = 0; i < 2; i++) { const x = R() * PW, y = R() * PH; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + R() * 60 - 30, y + R() * 60 - 30, x + R() * 90 - 45, y + R() * 90 - 45); c.stroke(); }
    const sx = 60 + R() * (PW - 120); c.fillStyle = 'rgba(255,245,225,0.13)'; c.fillRect(sx, 0, 1.4, PH);
  }
  // fecha a lo cámara de los 90: dígitos naranjas de siete segmentos
  const SEG = { 0: 'abcdef', 1: 'bc', 2: 'abdeg', 3: 'abcdg', 4: 'bcfg', 5: 'acdfg', 6: 'acdefg', 7: 'abc', 8: 'abcdefg', 9: 'abcdfg' };
  function sello(c, txt, x1, y1, s) {
    const dw = s * 0.52, t = Math.max(2, s * 0.14), gap = s * 0.22;
    let tot = 0; for (const ch of txt) tot += ch === ' ' ? dw * 0.7 : ch === ':' || ch === "'" ? t * 2.4 : dw + gap;
    c.save(); c.translate(x1 - tot, y1 - s); c.transform(1, 0, -0.1, 1, 0, 0);
    for (let pass = 0; pass < 2; pass++) {
      c.fillStyle = pass ? '#ffc278' : 'rgba(255,112,32,0.95)'; c.shadowColor = 'rgba(255,96,20,0.95)'; c.shadowBlur = pass ? 2 : 9; c.globalAlpha = 0.92;
      let x = 0; const h2 = s / 2;
      for (const ch of txt) {
        if (ch === ' ') { x += dw * 0.7; continue; }
        if (ch === ':') { c.fillRect(x, s * 0.26, t, t); c.fillRect(x, s * 0.64, t, t); x += t * 2.4; continue; }
        if (ch === "'") { c.fillRect(x, 0, t * 0.9, s * 0.32); x += t * 2.4; continue; }
        const sg = SEG[ch] || '';
        if (sg.includes('a')) c.fillRect(x + t * 0.6, 0, dw - t * 1.2, t);
        if (sg.includes('g')) c.fillRect(x + t * 0.6, h2 - t / 2, dw - t * 1.2, t);
        if (sg.includes('d')) c.fillRect(x + t * 0.6, s - t, dw - t * 1.2, t);
        if (sg.includes('f')) c.fillRect(x, t * 0.6, t, h2 - t * 0.9);
        if (sg.includes('b')) c.fillRect(x + dw - t, t * 0.6, t, h2 - t * 0.9);
        if (sg.includes('e')) c.fillRect(x, h2 + t * 0.3, t, h2 - t * 0.9);
        if (sg.includes('c')) c.fillRect(x + dw - t, h2 + t * 0.3, t, h2 - t * 0.9);
        x += dw + gap;
      }
    }
    c.restore();
  }
  // la fecha de la partida (después de medianoche, el día siguiente)
  function fechaSello(hm) {
    const st = new Date((S && S.startT) || Date.now()), base = new Date(st.getFullYear(), st.getMonth(), st.getDate());
    if (st.getHours() < 12) base.setDate(base.getDate() - 1);
    if (+hm.slice(0, 2) < 12) base.setDate(base.getDate() + 1);
    const p2 = (n) => (n < 10 ? '0' : '') + n;
    return p2(base.getDate()) + ' ' + p2(base.getMonth() + 1) + " '" + String(base.getFullYear()).slice(2) + '  ' + hm;
  }

  /* ---------------- la Polaroid ---------------- */
  let PAPEL = null;
  function papel() {
    if (PAPEL) return PAPEL;
    const v = mk(CW, CH), c = v.getContext('2d');
    c.fillStyle = '#f2ebdc'; c.fillRect(0, 0, CW, CH);
    const n = mk(128, 128), x = n.getContext('2d'), d = x.createImageData(128, 128), R = rng(3);
    for (let i = 0; i < d.data.length; i += 4) { const k = R() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = k; d.data[i + 3] = 16; }
    x.putImageData(d, 0, 0); c.fillStyle = c.createPattern(n, 'repeat'); c.fillRect(0, 0, CW, CH);
    const g = c.createLinearGradient(0, 0, CW, CH); g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(120,90,50,0.12)');
    c.fillStyle = g; c.fillRect(0, 0, CW, CH);
    c.strokeStyle = 'rgba(90,70,40,0.25)'; c.lineWidth = 2; c.strokeRect(1, 1, CW - 2, CH - 2);
    PAPEL = v; return v;
  }
  function wrap(c, txt, maxW) {
    const words = String(txt).split(' '), out = []; let line = '';
    for (const w of words) { const t = line ? line + ' ' + w : w; if (line && c.measureText(t).width > maxW) { out.push(line); line = w; } else line = t; }
    if (line) out.push(line);
    return out;
  }
  function tarjeta(it) {
    const f = it.f, seed = it.i * 977 + 131, R = rng(seed + 5);
    // 1) la escena
    const PHf = f.ph || PH, CHf = PHf + BD + BB;
    const ph = mk(PW, PHf), c = ph.getContext('2d', { willReadFrequently: true });
    c.save();
    if (f.foto) {
      const im = G.img[f.foto];
      if (im) { const k = Math.max(PW / im.width, PHf / im.height), w = im.width * k, h = im.height * k; c.drawImage(im, (PW - w) / 2, (PHf - h) / 2, w, h); }
      else { c.fillStyle = '#1a120b'; c.fillRect(0, 0, PW, PHf); }
    }
    if (f.tilt) { const z = 1 + Math.abs(f.tilt) * 1.7; c.translate(PW / 2, PH / 2); c.rotate(f.tilt); c.scale(z, z); c.translate(-PW / 2, -PH / 2); }
    if (!f.foto) try { f.draw(c); } catch (e) { console.warn('foto', f.id, e); }
    c.restore();
    if (f.dedo) dedo(c);
    // 2) el revelado
    revelar(ph, f, seed);
    efectos(ph, seed);
    // el sello va aparte (encima), para que el zoom lento no lo recorte
    const sc = mk(300, 50); sello(sc.getContext('2d'), fechaSello(f.h), 292, 42, 22); it.sello = sc;
    // 3) la Polaroid: papel, foto y pie escrito a boli
    const cv = mk(CW, CHf), k = cv.getContext('2d');
    k.drawImage(papel(), 0, 0, CW, CHf);
    k.fillStyle = `rgba(200,160,90,${0.04 + R() * 0.1})`; k.fillRect(0, 0, CW, CHf);   // cada una amarillea a su manera
    k.drawImage(ph, BD, BD);
    k.strokeStyle = 'rgba(0,0,0,0.35)'; k.lineWidth = 1.5; k.strokeRect(BD + 0.5, BD + 0.5, PW - 1, PHf - 1);
    if (R() < 0.3) { k.strokeStyle = 'rgba(120,75,30,0.1)'; k.lineWidth = 6; k.beginPath(); k.arc(CW - 34, CHf - 24, 40, 0, 7); k.stroke(); }  // cerco de café
    k.save(); k.translate(CW / 2, BD + PHf + BB / 2 + 2); k.rotate(-0.014 + R() * 0.02);
    k.fillStyle = '#25305a'; k.textAlign = 'center'; k.textBaseline = 'middle'; k.globalAlpha = 0.9;
    // a una línea si cabe encogiendo un poco; si no, a dos
    const cap = f.cap(); let fs = 42, lines = [];
    for (; fs >= 28; fs -= 2) { k.font = fs + "px 'Patrick Hand', cursive"; lines = wrap(k, cap, CW - 90); if (lines.length === 1 || (fs <= 38 && lines.length === 2)) break; }
    fs = Math.max(fs, 28); const lh = fs * 1.05, y0 = -(lines.length - 1) * lh / 2;
    let wMax = 0; lines.forEach((l, i) => { k.fillText(l, 0, y0 + i * lh); wMax = Math.max(wMax, k.measureText(l).width); });
    const dx = Math.min(CW / 2 - 26, wMax / 2 + 30), dy = y0 + (lines.length - 1) * lh;
    if (f.doodle === 'heart') corazon(k, dx, dy + 6, 15, '#c0304a', true);
    if (f.doodle === 'star') estrella(k, dx, dy, 13, '#25305a');
    k.restore();
    // copia pequeña para el montón y el mural
    const sm = mk(CW / 2, CHf / 2), sx = sm.getContext('2d');
    sx.imageSmoothingEnabled = true; try { sx.imageSmoothingQuality = 'high'; } catch (e) {}
    sx.drawImage(cv, 0, 0, sm.width, sm.height);
    it.big = cv; it.small = sm; it.ch = CHf; it.ph = PHf;
  }

  /* ---------------- la mesa ---------------- */
  function mesa() {
    const v = mk(W + 24, H + 24), c = v.getContext('2d'), R = rng(77), w = v.width, h = v.height;
    c.fillStyle = '#1b130d'; c.fillRect(0, 0, w, h);
    const pl = 134;
    for (let y = -30, i = 0; y < h; y += pl, i++) {
      const b = 0.82 + R() * 0.32;
      c.fillStyle = `rgb(${(48 * b) | 0},${(32 * b) | 0},${(21 * b) | 0})`; c.fillRect(0, y, w, pl);
      for (let k = 0; k < 34; k++) {
        const yy = y + R() * pl, amp = 1 + R() * 4, fr = 80 + R() * 260, p = R() * 6;
        c.strokeStyle = R() < 0.55 ? `rgba(0,0,0,${0.1 + R() * 0.2})` : `rgba(130,88,55,${0.05 + R() * 0.12})`;
        c.lineWidth = 0.8 + R() * 2.2; c.beginPath();
        for (let x = 0; x <= w; x += 30) c.lineTo(x, yy + Math.sin(x / fr + p) * amp + Math.sin(x / 37 + k) * 0.6);
        c.stroke();
      }
      if (R() < 0.6) { const kx = R() * w, ky = y + 20 + R() * (pl - 40); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 2; for (let r = 4; r < 22; r += 5) { c.beginPath(); c.ellipse(kx, ky, r * 2.2, r * 0.7, 0, 0, 7); c.stroke(); } }
      c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, y + pl - 3, w, 3); c.fillStyle = 'rgba(255,220,180,0.05)'; c.fillRect(0, y + pl, w, 1);
      c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect((i % 2 ? 380 : 1180) + R() * 200, y, 3, pl);
    }
    // cosas de la resaca encima de la mesa
    const cosas = [['items/cartera', 105, 165, 118, 0.3], ['items/movil', 905, 175, 150, -0.4], ['items/llaves', 95, 930, 96, 0.5], ['items/gafas', 760, 948, 58, -0.12]];
    if (L('calzon')) cosas.push(['items/calzoncillos', 892, 846, 108, 0.32]);
    cosas.forEach(([src, x, y, hh, rot]) => {
      const im = G.img[src]; if (!im) return;
      const ww = im.width * hh / im.height, t = mk(ww + 4, hh + 4), tx = t.getContext('2d');
      tx.drawImage(im, 2, 2, ww, hh); tx.globalCompositeOperation = 'source-atop'; tx.fillStyle = 'rgba(25,14,6,0.35)'; tx.fillRect(0, 0, t.width, t.height);
      c.save(); c.translate(x + 12, y + 12); c.rotate(rot); c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 16; c.shadowOffsetX = 6; c.shadowOffsetY = 10;
      c.drawImage(t, -t.width / 2, -t.height / 2); c.restore();
    });
    // la luz de la lámpara sobre las fotos
    let g = c.createRadialGradient(HX + 12, HY - 10, 30, HX + 12, HY - 10, 860);
    g.addColorStop(0, 'rgba(255,196,120,0.30)'); g.addColorStop(0.45, 'rgba(255,165,90,0.11)'); g.addColorStop(1, 'rgba(255,150,80,0)');
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, 0, w, h); c.restore();
    // los créditos, a la sombra
    g = c.createLinearGradient(860, 0, 1180, 0); g.addColorStop(0, 'rgba(6,4,2,0)'); g.addColorStop(1, 'rgba(6,4,2,0.66)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    g = c.createRadialGradient(w / 2 - 150, h / 2, h * 0.4, w / 2, h / 2, h * 1.05); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.6)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    return v;
  }
  // sombra suave para las fotos (pintada una vez a 1/4 y estirada)
  let SOMBRA = null;
  function sombra() {
    if (SOMBRA) return SOMBRA;
    const sw = CW / 4, sh = CH / 4, pad = 16, v = mk(sw + pad * 2, sh + pad * 2), c = v.getContext('2d');
    c.shadowColor = 'rgba(0,0,0,1)'; c.shadowBlur = 9; c.shadowOffsetX = 3000; c.fillStyle = '#000'; c.fillRect(pad - 3000, pad, sw, sh);
    SOMBRA = v; return v;
  }

  /* ---------------- los créditos ---------------- */
  function lineas(nFotos) {
    const st = ST(), dr = (S && S.drunk) || {};
    const lv = (p) => LV[clamp(dr[p] || 0, 0, 5)].toLowerCase();
    const pl = (n, a, b) => n + ' ' + (n === 1 ? a : b);
    const reparto = ['ramis', 'marc', 'angel'].sort((a, b) => (dr[b] || 0) - (dr[a] || 0)).map((p) => ['', NAMES[p] + ' (' + lv(p) + ')']);
    reparto.push(['', 'y Marcos (al volante, ' + (dr.marcos ? lv('marcos') : 'sereno como un juez') + ')']);
    const cifras = [
      ['h', 'La noche en cifras'],
      ['', pl(st.chupitosTirados || 0, 'chupito al jarrón', 'chupitos al jarrón')],
      st.besoSeg ? ['', st.besoSeg + ' segundos de beso (oficialmente, «un minuto»)'] : null,
      ['', pl(st.sustos || 0, 'susto en la N-550', 'sustos en la N-550')],
      ['', pl(st.derrotas || 0, 'noche en el cuartelillo', 'noches en el cuartelillo')],
      ['', S.logros.length + ' logros de ' + Object.keys(LOGROS).length],
      ['', nFotos + ' fotos que nadie va a subir a Instagram'],
      ['sp'],
    ].filter(Boolean);
    return [
      ['s', 'Club de Caballeros Films'], ['', 'en asociación con el Bar Estrella y la Diputación del Orujo'], ['s', 'presenta'], ['sp'],
      ['t', 'PONTEVEDRA QUEST'], ['', 'Basado en hechos reales. Más o menos.'], ['sp'],
      ['h', 'Dirigida por'], ['', 'JRAR'], ['sp'],
      ['h', 'Guion'], ['', 'JRAR y la memoria selectiva del Club'], ['sp'],
      ['h', 'Reparto, por orden de borrachera'], ...reparto, ['sp'],
      ['h', 'Con la participación especial de'], ['', 'Doña Maruxa y su táper infinito'], ['', 'La chica del pub (1 minuto en pantalla)'], ['', 'Don Xesús de Santo Domingo, fantasma ilustrado'],
      ['', 'A meiga Pura'], ['', 'Brais, el camarero que guarda llaves'], ['', 'Las profes de Vigo: Uxía, Noa y Sabela'], ['', 'Rubén, el portero que pide el DNI'], ['', 'DJ Raxo y su tema especial para los Lords'],
      ['', 'Antía, la camarera que no oye nada'], ['', 'Lúa, de Bellas Artes'], ['', 'Gary, de Mánchester, en chanclas'], ['', 'Tino y Vera, de O Furado'], ['', 'Xurxo y Nando, los de la peña'],
      ['', 'Iago, fan número uno de Nike Apóstol'], ['', 'Toño, el peregrino perdido'], ['', 'Carla (@carlaviral), que lo grabó todo'], ['', 'La Guardia Civil de la N-550'], ['', 'La Santa Compaña'], ['', 'La vaca de Ramiro'], ['sp'],
      ['h', 'Dirección de fotografía'], ['', 'Marc («la luz está fatal»)'], ['sp'],
      ['h', 'Fotografía fija'], ['', 'Una Polaroid que nadie recuerda haber comprado'], ['p', '(el dedo de la foto de la vaca también es de Marc)'], ['sp'],
      ['h', 'Coordinación de intimidad'], ['', 'Nadie. No dio tiempo: fue un minuto.'], ['sp'],
      ['h', 'Especialista en escenas de riesgo'], ['', 'Los calzoncillos de rayas de Ramis'], ['sp'],
      ['h', 'Coreografía'], ['', 'A meiga Pura (muiñeira) y Marcos (sin mover los pies)'], ['sp'],
      ['h', 'Asesor técnico de Porsche'], ['', 'Ramis (no ha tenido ninguno)'], ['sp'],
      ['h', 'Conductor designado'], ['', 'Marcos, el Señor de los Volantes'], ['sp'],
      ['h', 'Vehículo'], ['', 'Peugeot 5008 blanco. Siete plazas, cero Porsche.'], ['sp'],
      ['h', 'Catering'], ['', 'Doña Maruxa · Postres caseros desde siempre'], ['sp'],
      ['h', 'Efectos especiales'], ['', 'Las meigas (haberlas, haylas)'], ['sp'],
      ['h', 'Vestuario'], ['', 'Marcos, diseñador de moda'], ['p', '(la camisa de cuadros de Ángel no es culpa suya)'], ['sp'],
      ['h', 'Maquillaje y peluquería'], ['', 'El orballo'], ['sp'],
      ['h', 'Seguridad'], ['', 'Rubén, que le pidió el DNI al único que no hacía falta'], ['sp'],
      ['h', 'Ganadería'], ['', 'La vaca de Ramiro, que no se apartó'], ['sp'],
      ['h', 'Asesoría espiritual'], ['', 'La Santa Compaña («este aún no»)'], ['sp'],
      ['h', 'Departamento legal'], ['', 'Sargento Seoane'], ['sp'],
      ['h', 'Canción de la Lume y de los créditos'], ['', '«Cuatro amigos fueron de viaje…»'], ['', 'machineplastic'], ['sp'],
      ['h', 'Banda sonora original'], ['', 'DJ Raxo · Ángel y los de O Furado'], ['', 'Gaita, bombo y licor café'], ['sp'],
      ['h', 'Idea, historia e ilustraciones'], ['', 'JRAR'], ['sp'],
      ['h', 'Programación, música y sonido'], ['', 'Claude'], ['sp'],
      ['h', 'Rodada íntegramente en'], ['', 'Pontevedra, Caldas de Reis y un poco en Coruña'], ['sp'],
      ...cifras,
      ['h', 'Dedicada a'], ['', 'Chus, que lo llamaba todo «¡lupanar!»'], ['', 'Maje, que nunca lo supo'], ['', 'Noémia, Breogán y Rosalía, por prestarnos a Marcos un fin de semana'], ['', 'El instituto Josep Maria Llompart, Mallorca'], ['sp'], ['sp'],
      ['p', 'Ningún pulpo fue maltratado. Bueno, uno sí, y estaba buenísimo.'], ['p', 'Las flores del Estrella se recuperan favorablemente.'],
      ['p', 'Ningún Porsche participó en esta producción.'], ['p', 'Ningún caballero fue multado. Por los pelos.'],
      ['p', 'Las fotos son reales. Las excusas, también.'],
      ['p', st.marcosCopas ? 'Si bebes, no conduzcas. Marcos no bebió… casi.' : 'Si bebes, no conduzcas. Marcos no bebió. Ni una.'],
    ];
  }
  const ESTILO = {
    t: { font: "800 62px 'Cinzel', serif", lh: 78, gap: 20, col: '#ffd98a' },
    s: { font: "44px 'Patrick Hand', cursive", lh: 54, gap: 0, col: '#fbe9c6' },
    h: { font: "800 21px 'Cinzel', serif", lh: 34, gap: 8, col: '#d9a65a' },
    n: { font: "600 29px 'Nunito', sans-serif", lh: 39, gap: 0, col: '#f4e7cf' },
    p: { font: "600 22px 'Nunito', sans-serif", lh: 31, gap: 0, col: '#c9b48e' },
  };
  function maquetar(list) {
    const c = mk(4, 4).getContext('2d'), rows = [];
    let y = 0;
    for (const [k0, txt] of list) {
      if (k0 === 'sp' || (!k0 && !txt)) { y += 30; continue; }
      const k = k0 || 'n', st = ESTILO[k];
      y += st.gap; c.font = st.font;
      if (k === 't') {
        let fz = 62; for (; fz > 30; fz -= 2) { c.font = '800 ' + fz + "px 'Cinzel', serif"; if (c.measureText(txt).width <= COLW + 40) break; }
        y += fz * 1.25; rows.push({ y, k, txt, st, font: c.font, fz }); y += 26; continue;
      }
      const ls = k === 'h' ? [txt.toUpperCase()] : wrap(c, txt, COLW);
      for (const l of ls) { y += st.lh; rows.push({ y, k, txt: l, st }); }
    }
    return { rows, h: y };
  }
  function pintaCreditos(c, R, off, alpha) {
    c.save(); c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    for (const r of R.rows) {
      const y = r.y - off; if (y < 60 || y > H + 60) continue;
      const a = alpha * sstep(85, 230, y) * (1 - sstep(H - 220, H - 75, y));
      if (a < 0.01) continue;
      c.globalAlpha = a; c.font = r.font || r.st.font;
      if (r.k === 't') {
        const g = c.createLinearGradient(0, y - r.fz * 0.8, 0, y + 4); g.addColorStop(0, '#fff3cc'); g.addColorStop(0.55, '#f2c26a'); g.addColorStop(1, '#b9822f');
        c.fillStyle = g; c.fillText(r.txt, CX, y);
        c.fillStyle = '#d9a65a'; c.fillRect(CX - 190, y + 20, 160, 2); c.fillRect(CX + 30, y + 20, 160, 2);
        c.save(); c.translate(CX, y + 21); c.rotate(Math.PI / 4); c.fillRect(-6, -6, 12, 12); c.restore();
        continue;
      }
      if (r.k === 'h') { try { c.letterSpacing = '4px'; } catch (e) {} }
      c.fillStyle = r.st.col; c.fillText(r.txt, CX, y);
      if (r.k === 'h') { try { c.letterSpacing = '0px'; } catch (e) {} }
    }
    c.restore();
  }
  function texto(c, txt, x, y, font, col, a, o) {
    if (a <= 0.005) return;
    o = o || {};
    c.save(); c.globalAlpha = a; c.font = font; c.fillStyle = col; c.textAlign = o.align || 'center'; c.textBaseline = 'alphabetic';
    if (o.ls) { try { c.letterSpacing = o.ls; } catch (e) {} }
    if (o.shadow) { c.shadowColor = 'rgba(0,0,0,0.75)'; c.shadowBlur = o.shadow; c.shadowOffsetY = 3; }
    c.fillText(txt, x, y); c.restore();
  }

  /* ---------------- maquetas de mural ---------------- */
  function rejilla(n, x0, y0, w, h, fill) {
    let best = null;
    for (let cols = 1; cols <= n; cols++) {
      const rows = Math.ceil(n / cols), s = Math.min(w / cols / CW, h / rows / CH);
      if (!best || s > best.s + 1e-6) best = { cols, rows, s };
    }
    const { cols, rows, s } = best, cw = w / cols, chh = h / rows, out = [];
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / cols), inRow = r === rows - 1 ? n - r * cols : cols, ox = (cols - inRow) * cw / 2;
      out.push({ x: x0 + ox + cw * ((i % cols) + 0.5) + rnd(-8, 8), y: y0 + chh * (r + 0.5) + rnd(-6, 6), r: rnd(-0.07, 0.07), s: s * fill });
    }
    return out;
  }
  // por dónde entran las fotos (dx, dy, giro) y dónde se apilan después
  const ENTRADAS = [[-760, 420, -0.6], [-260, -900, 0.4], [-820, -340, -0.35], [260, 1000, 0.5], [-700, 860, 0.3], [120, -950, -0.45]];
  const MONTON = [[175, 240], [745, 255], [170, 770], [745, 790], [460, 175], [480, 860], [110, 500], [770, 520]];

  /* ---------------- la secuencia ---------------- */
  async function run() {
    if (TEST) {
      (G.log = G.log || []).push('== CRÉDITOS · fotos: ' + elegir().map((f) => f.id).join(', '));
      if (typeof postCreditos === 'function') await postCreditos();
      G.mode = null; showTitle(); return;
    }
    ['hud', 'dlg', 'choices', 'card', 'mg'].forEach((id) => { const e = $(id); if (e) e.classList.add('hidden'); });
    G.dlgOpen = false;
    try { await Promise.race([Promise.all([document.fonts.load("42px 'Patrick Hand'"), document.fonts.load("800 30px 'Cinzel'"), document.fonts.load("600 30px 'Nunito'")]), wait(1500)]); } catch (e) {}
    await fadeTo(1, 0.6);
    G.scene = null; G.actors = {}; G.particles = [];

    const fotos = elegir(), N = fotos.length;
    // tiempos: la canción manda (~3:30); cada foto, entre 8 y 13 s
    let song = 210;
    try { const mt = AUDIO.musicTime(); if (mt && mt.name === 'cancion' && mt.src === 'rec' && mt.len > 60) song = mt.len + 1.5; } catch (e) {}
    const TI = 8.6, per = clamp((song - 40) / N, 8, 13), TE = 10.5, TC = clamp(song - 2 - per * N - TE, 18, 40);
    const T0 = TI, T1 = T0 + per * N, T2 = T1 + TC, T3 = T2 + TE;
    const CRE = maquetar(lineas(N));
    const off0 = -H * 0.62, off1 = CRE.h - H * 0.42;
    const MESA = mesa(); sombra(); papel();
    const items = fotos.map((f, i) => ({ f, i, state: 'wait', x: HX, y: H + 600, r: 0, s: HS, z: 1, fx: 0.5, fy: 0.5, dev: 0, dk: 0, lift: 0, age: 0, tape: Math.random() < 0.55 ? rnd(-0.12, 0.12) : null }));
    const motas = Array.from({ length: 34 }, () => ({ x: rnd(80, 920), y: rnd(80, 920), v: rnd(4, 12), p: rnd(0, 6), r: rnd(0.8, 2.2) }));
    let pileN = 0;

    // la canción de la pantalla de puntos se apaga: vuelve a empezar con la primera foto
    try { AUDIO.music(null, { fade: 2.5 }); } catch (e) {}
    ambient(null);

    const m = {
      drunk: 0, clock: 0, rc: 0, spd: 1, cur: -1, order: [], hold: false, holdT: 0, keyHold: false, keyT: 0,
      collage: false, wall: false, eAge: 0, stamped: false, done: false, res: null, items, N, per, T: [T0, T1, T2, T3],
      t0real: 0, skipped: false, waitT: 0, nb: 0, ov: null,
      update(dt) {
        const fast = (m.hold && G.t - m.holdT > 0.28) || (m.keyHold && G.t - m.keyT > 0.35);
        m.spd += ((fast ? 5 : 1) - m.spd) * Math.min(1, dt * 8);
        const d = dt * m.spd;
        const ch = m.cur >= 0 ? items[m.cur] : null;
        if (!ch && !m.collage) {
          // intro: va con el reloj de verdad, porque mientras se revelan las fotos el juego va a saltos
          // (el texto es HTML y se anima solo). Las fotos no empiezan hasta tenerlas reveladas.
          const real = (performance.now() - m.t0real) / 1000;
          if (real > 1.3 || m.skipped) revela();
          m.clock = Math.max(m.clock, m.skipped ? T0 : real);
          const listo = m.nb >= N || (m.nb >= Math.min(2, N) && (m.skipped || m.waitT > 2.5));
          if (m.clock >= T0 && m.clock < T1 && !listo) { m.clock = T0 - 1e-4; m.waitT += dt; }
          m.rc = m.clock;
        } else {
          m.clock += d;
          m.rc += (m.clock - m.rc) * Math.min(1, dt * 4);
          // si quedó alguna sin revelar, una por fotograma (y no mientras entra otra)
          if (m.collage || ch.age > 1.3) revela();
        }
        if (m.clock >= T0 && m.clock < T1 && !m.collage) {
          const want = Math.min(N - 1, Math.floor((m.clock - T0) / per));
          while (m.cur < want) siguiente();
        }
        if (m.clock >= T1 && !m.collage) collage();
        if (m.clock >= T2 && !m.wall) mural();
        items.forEach((it) => anima(it, d));
        if (m.wall) {
          m.eAge += d;
          if (!m.stamped && m.eAge > 2.2) { m.stamped = true; flash('#fff6e0', 0.35); sfx('foto'); }
        }
        motas.forEach((p) => { p.y -= p.v * dt; p.x += Math.sin(G.t * 0.4 + p.p) * 6 * dt; if (p.y < 60) { p.y = 940; p.x = rnd(80, 920); } });
        if (m.clock >= T3 && !m.done) { m.done = true; m.res(); }
      },
      draw(c, t) {
        // la mesa y las fotos se mecen un pelín, como cámara en mano (quieta en la intro)
        const live = sstep(T0, T0 + 2, m.clock);
        const ox = Math.sin(t * 0.17) * 6 * live - 12, oy = Math.cos(t * 0.13) * 4 * live - 12;
        c.drawImage(MESA, ox, oy);
        c.save(); c.translate(ox + 12, oy + 12);
        m.order.forEach((it) => pinta(c, it, t));
        c.restore();
        // motas de polvo en la luz
        c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = '#ffdcae';
        if (live > 0.01) motas.forEach((p) => { const k = live * (1 - Math.min(1, Math.hypot(p.x - HX, p.y - HY) / 520)); if (k <= 0) return; c.globalAlpha = k * (0.25 + 0.2 * Math.sin(t * 2 + p.p)); c.beginPath(); c.arc(p.x, p.y, p.r, 0, 7); c.fill(); });
        c.restore();
        // en la intro, la mesa en penumbra
        if (m.clock < T0 + 0.7) { c.fillStyle = `rgba(6,4,2,${0.45 * (1 - sstep(T0 - 0.05, T0 + 0.6, m.clock))})`; c.fillRect(0, 0, W, H); }
        // el final: el mural de fotos con el «hasta el sábado»
        if (m.wall) finalCard(c, t);
        // créditos
        const ca = sstep(T0 - 0.3, T0 + 1.5, m.clock) * (1 - sstep(T2, T2 + 1, m.clock));
        if (ca > 0.01) pintaCreditos(c, CRE, lerp(off0, off1, clamp((m.rc - T0) / (T2 - 2.5 - T0), 0, 1)), ca);
        // la barrita de «stories» y la ayuda
        const ha = sstep(T0, T0 + 1, m.clock) * (1 - sstep(T1 + 1, T1 + 3, m.clock));
        if (ha > 0.01) hud(c, ha);
      },
      down() { m.hold = true; m.holdT = G.t; },
      up() { if (m.hold && G.t - m.holdT < 0.28) saltar(); m.hold = false; },
      key(k, isDown) {
        if (k === 'Escape') { if (isDown && m.clock < T2) m.clock = Math.max(m.clock, T2); return; }
        if (k !== ' ' && k !== 'Enter' && k !== 'ArrowRight') return;
        if (isDown && !m.keyHold) { m.keyHold = true; m.keyT = G.t; saltar(); } else if (!isDown) m.keyHold = false;
      },
    };
    function revela() {
      const it = items.find((x) => !x.small);
      if (it) { tarjeta(it); m.nb++; }
    }
    // la canción del Club, desde el principio (una sola vez)
    function cancion() {
      if (m.song) return; m.song = true;
      try { AUDIO.music('cancion', { fade: 0.4 }); } catch (er) {}
    }
    function quitaIntro() {
      const ov = m.ov; if (!ov) return; m.ov = null;
      ov.style.opacity = '0'; setTimeout(() => ov.remove(), 700);
    }
    function saltar() {
      const k = m.clock;
      if (k < T0) { m.skipped = true; m.clock = T0; quitaIntro(); }
      else if (k < T1) m.clock = Math.min(T1, T0 + (Math.floor((k - T0) / per) + 1) * per);
      else if (k < T2) m.clock = T2;
      else if (m.eAge > 3) m.clock = T3;
    }
    function siguiente() {
      if (m.cur >= 0) {
        const sp = MONTON[pileN++ % MONTON.length];
        transicion(items[m.cur], 'pile', { x: sp[0] + rnd(-25, 25), y: sp[1] + rnd(-25, 25), r: rnd(-0.3, 0.3), s: rnd(0.4, 0.46) }, 0, 0.9);
      }
      m.cur++;
      const it = items[m.cur]; if (!it.small) { tarjeta(it); m.nb++; }
      const e = ENTRADAS[m.cur % ENTRADAS.length];
      it.state = 'hero'; it.age = 0; it.dev = 0; it.dk = 0; it.landed = false; it.tr = null;
      it.from = { x: HX + e[0], y: HY + e[1], r: e[2], s: HS * 1.3 };
      it.to = { x: HX + rnd(-18, 18), y: HY + rnd(-10, 10), r: (m.cur % 2 ? 1 : -1) * rnd(0.015, 0.05), s: HS };
      Object.assign(it, { x: it.from.x, y: it.from.y, r: it.from.r, s: it.from.s });
      m.order = m.order.filter((o) => o !== it); m.order.push(it);
      flash('#fffaf0', 0.55); sfx('foto');
      if (m.cur === 0) { quitaIntro(); cancion(); }
    }
    function transicion(it, state, to, delay, dur) {
      it.state = state; it.tr = { from: { x: it.x, y: it.y, r: it.r, s: it.s }, to, t: 0, delay, dur, z0: it.z || 1 };
    }
    function collage() {
      m.collage = true; quitaIntro(); cancion();
      const g = rejilla(N, 50, 92, 890, 860, 1.05);
      items.forEach((it, i) => {
        if (!it.small) { tarjeta(it); m.nb++; }
        if (it.state === 'wait') { Object.assign(it, { x: HX + rnd(-200, 200), y: H + 450, r: rnd(-0.5, 0.5), s: 0.35, dev: 1 }); m.order.push(it); }
        transicion(it, 'grid', g[i], i * 0.08, 1.1);
      });
      m.order = items.slice();
      sfx('whoosh');
    }
    function mural() {
      m.wall = true; m.eAge = 0;
      if (!m.collage) collage();
      const g = rejilla(N, -70, -50, W + 140, H + 100, 1.14);
      items.forEach((it, i) => transicion(it, 'wall', g[i], i * 0.035, 1.5));
    }
    function anima(it, d) {
      if (it.state === 'hero') {
        it.age += d;
        const k = clamp(it.age / 0.85, 0, 1), e = eOut(k);
        it.x = lerp(it.from.x, it.to.x, e) + Math.sin(it.age * 0.35) * 3;
        it.y = lerp(it.from.y, it.to.y, e) + Math.cos(it.age * 0.3) * 2;
        it.r = lerp(it.from.r, it.to.r, eBack(k)); it.s = lerp(it.from.s, it.to.s, e);
        it.lift = Math.max(0, it.s / HS - 1) * 3;
        if (k >= 1 && !it.landed) { it.landed = true; sfx('pagina', { vol: 0.35 }); }
        it.dev = clamp((it.age - 0.2) / 2.6, 0, 1);
        const kb = eIO(clamp(it.age / (per + 1), 0, 1));
        it.z = 1 + 0.09 * kb; it.fx = lerp(0.5, it.f.kb[0], kb); it.fy = lerp(0.5, it.f.kb[1], kb);
      } else if (it.tr) {
        const tr = it.tr; tr.t += d;
        const k = clamp((tr.t - tr.delay) / tr.dur, 0, 1), e = eIO(k), up = Math.sin(Math.PI * e);
        it.x = lerp(tr.from.x, tr.to.x, e); it.y = lerp(tr.from.y, tr.to.y, e);
        it.r = lerp(tr.from.r, tr.to.r, e); it.s = lerp(tr.from.s, tr.to.s, e) * (1 + 0.07 * up);
        it.lift = 0.6 * up; it.z = lerp(tr.z0, 1, e);
        it.dev = Math.min(1, it.dev + d / 1.2);
        if (k >= 1) { it.tr = null; it.lift = 0; it.z = 1; if (it.small) it.big = null; }   // fuera la copia grande: ahorra memoria
      }
      const dk = it.state === 'pile' ? 0.32 : it.state === 'grid' ? 0.08 : 0;
      it.dk += (dk - it.dk) * Math.min(1, d * 3);
    }
    function pinta(c, it, t) {
      const big = it.big, src = big && (it.s > 0.5 || it.z > 1.001) ? big : it.small || big;
      if (!src) return;
      const CH = it.ch || CH0, PH = it.ph || PH0;
      c.save(); c.translate(it.x, it.y); c.rotate(it.r); c.scale(it.s, it.s);
      // sombra (más grande y lejos cuando la foto va por el aire)
      const L2 = it.lift || 0, o = 12 + L2 * 70, sp = 1 + L2 * 0.06;
      c.globalAlpha = clamp(0.62 - L2 * 0.18, 0.3, 0.7);
      c.drawImage(SOMBRA, -CW / 2 * sp - 64 + o * 0.5, -CH / 2 * sp - 64 + o, CW * sp + 128, CH * sp + 128);
      c.globalAlpha = 1;
      c.drawImage(src, -CW / 2, -CH / 2, CW, CH);
      // zoom lento a lo Ken Burns dentro de la foto
      if (big && it.z > 1.002) {
        const sw = PW / it.z, sh = PH / it.z;
        c.drawImage(big, BD + (PW - sw) * it.fx, BD + (PH - sh) * it.fy, sw, sh, BD - CW / 2, BD - CH / 2, PW, PH);
      }
      // la fecha naranja, siempre en su esquina
      if (it.sello) c.drawImage(it.sello, BD + PW - 316 - CW / 2, BD + PH - 64 - CH / 2);
      // la Polaroid se va revelando
      if (it.dev < 1) { c.fillStyle = `rgba(46,50,44,${1 - eIO(it.dev)})`; c.fillRect(BD - CW / 2, BD - CH / 2, PW, PH); }
      // brillo del papel fotográfico
      if (it.state === 'hero') {
        const k = ((t * 0.05 + it.i * 0.37) % 1) * 2 - 0.5, gx = BD - CW / 2 + k * PW;
        const g = c.createLinearGradient(gx - 160, BD - CH / 2, gx + 160, BD - CH / 2 + PH); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,250,235,0.07)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        c.fillStyle = g; c.fillRect(BD - CW / 2, BD - CH / 2, PW, PH);
      }
      if (it.dk > 0.01) { c.fillStyle = `rgba(10,6,2,${it.dk})`; c.fillRect(-CW / 2, -CH / 2, CW, CH); }
      // celo
      if (it.tape !== null) {
        c.rotate(it.tape); c.globalAlpha = 1 - it.dk;
        c.fillStyle = 'rgba(236,226,196,0.55)'; c.beginPath();
        const tw = 92, th = 26, ty = -CH / 2 + 2;
        c.moveTo(-tw, ty - th); for (let j = 0; j <= 6; j++) c.lineTo(-tw + (j % 2) * 5, ty - th + j * th / 3);
        c.lineTo(tw, ty + th); for (let j = 0; j <= 6; j++) c.lineTo(tw - (j % 2) * 5, ty + th - j * th / 3);
        c.closePath(); c.fill(); c.globalAlpha = 1;
      }
      c.restore();
    }
    function hud(c, a) {
      const x0 = 64, x1 = 930, gap = 6, sw = (x1 - x0 - gap * (N - 1)) / N, cur = Math.max(0, m.cur);
      const g = c.createLinearGradient(0, 0, 0, 130); g.addColorStop(0, 'rgba(8,5,2,0.85)'); g.addColorStop(1, 'rgba(8,5,2,0)');
      c.save(); c.globalAlpha = a; c.fillStyle = g; c.fillRect(0, 0, W, 130); c.restore();
      texto(c, 'LAS FOTOS DE LA NOCHE', x0, 44, "800 16px 'Cinzel', serif", '#f3e3c3', a * 0.7, { align: 'left', ls: '4px' });
      texto(c, (cur + 1 < 10 ? '0' : '') + (cur + 1) + ' / ' + (N < 10 ? '0' : '') + N, x1, 44, "800 17px 'Nunito', sans-serif", '#f3e3c3', a * 0.7, { align: 'right' });
      c.save(); c.globalAlpha = a;
      for (let i = 0; i < N; i++) {
        const p = m.collage || i < m.cur ? 1 : i === m.cur ? clamp((m.clock - T0 - i * per) / per, 0, 1) : 0, x = x0 + i * (sw + gap);
        c.fillStyle = 'rgba(255,240,215,0.16)'; c.fillRect(x, 58, sw, 4);
        if (p > 0) { c.fillStyle = 'rgba(255,240,215,0.9)'; c.fillRect(x, 58, sw * p, 4); }
      }
      c.restore();
      const ay = (1 - sstep(T0 + 9, T0 + 11, m.clock)) * a;
      texto(c, 'Toca para pasar de foto · Mantén pulsado para acelerar', x0, 968, "600 19px 'Nunito', sans-serif", '#f3e3c3', ay * 0.5, { align: 'left' });
    }
    // la intro en HTML: las animaciones CSS siguen fluidas aunque el lienzo esté ocupado revelando
    function introDom() {
      const ov = document.createElement('div');
      ov.style.cssText = 'position:absolute;left:0;top:0;width:1600px;height:1000px;pointer-events:none;z-index:6;transition:opacity .6s ease';
      const L = [
        ['DOMINGO · 13:47 · CALDAS DE REIS', 352, "800 22px 'Cinzel',serif", '#d9a65a', 0.4, 4.6, 'letter-spacing:6px'],
        ['Debajo del asiento del Peugeot aparece una Polaroid.', 420, "52px 'Patrick Hand',cursive", '#f6e9cf', 1.1, 4.6],
        ['Nadie recuerda haberla comprado.', 492, "52px 'Patrick Hand',cursive", 'rgba(246,233,207,.82)', 2.4, 4.6],
        ['Lo que pasa en Pontevedra, se queda en Pontevedra.', 410, "800 40px 'Cinzel',serif", '#f6e9cf', 5.2, 0],
        ['…menos las fotos.', 488, "76px 'Patrick Hand',cursive", '#ffd98a', 6.4, 0],
      ];
      ov.innerHTML = '<style>@keyframes crIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}@keyframes crOut{from{opacity:1}to{opacity:0;transform:translateY(-8px)}}</style>' +
        L.map(([t, y, font, col, a, b, extra]) => `<p style="position:absolute;left:0;right:0;top:${y}px;margin:0;text-align:center;font:${font};color:${col};` +
          `text-shadow:0 3px 14px rgba(0,0,0,.85);opacity:0;will-change:opacity,transform;animation:crIn .8s ease-out ${a}s forwards${b ? `,crOut .6s ease-in ${b}s forwards` : ''};${extra || ''}">${t}</p>`).join('');
      $('stage').appendChild(ov);
      return ov;
    }
    // los rótulos del final, pintados una vez (con sombra) y luego solo se mueven
    function rotulos() {
      const n = mk(700, 150), x = n.getContext('2d');
      x.font = "96px 'Patrick Hand', cursive"; x.textAlign = 'center'; x.shadowColor = 'rgba(0,0,0,0.75)'; x.shadowBlur = 16; x.shadowOffsetY = 3; x.fillStyle = '#f6e9cf'; x.fillText('Nunca más…', 350, 110);
      const sb = mk(1300, 180), y = sb.getContext('2d');
      y.font = "800 112px 'Cinzel', serif"; y.textAlign = 'center';
      const g = y.createLinearGradient(0, 35, 0, 140); g.addColorStop(0, '#fff3cc'); g.addColorStop(0.55, '#f2c26a'); g.addColorStop(1, '#b9822f');
      y.shadowColor = 'rgba(0,0,0,0.8)'; y.shadowBlur = 18; y.shadowOffsetY = 5; y.fillStyle = g; y.fillText('¡HASTA EL SÁBADO!', 650, 130);
      return { nunca: n, sabado: sb };
    }
    function finalCard(c, t) {
      const e = m.eAge;
      c.save(); c.fillStyle = `rgba(10,6,3,${0.66 * sstep(0.2, 1.6, e)})`; c.fillRect(0, 0, W, H); c.restore();
      if (!m.rotulos) m.rotulos = rotulos();
      const R2 = m.rotulos, a1 = sstep(0.9, 1.7, e);
      if (a1 > 0) { c.save(); c.globalAlpha = a1; c.drawImage(R2.nunca, W / 2 - R2.nunca.width / 2, 420 + (1 - a1) * 16 - 110); c.restore(); }
      if (e > 2.2) {
        const k = clamp((e - 2.2) / 0.35, 0, 1), s = lerp(1.6, 1, eOut(k)), im = R2.sabado;
        c.save(); c.translate(W / 2, 575); c.scale(s, s); c.rotate(-0.025); c.globalAlpha = k;
        c.drawImage(im, -im.width / 2, -130); c.restore();
      }
      // los cuatro, partiéndose de risa
      PROTA.forEach((id, i) => {
        const k = clamp((e - 3.2 - i * 0.18) / 0.4, 0, 1); if (k <= 0) return;
        const im = G.img['faces/' + id + '_risa']; if (!im) return;
        const h = 150 * eBack(k), w = im.width * h / im.height, x = W / 2 + (i - 1.5) * 170, y = 860 - Math.abs(Math.sin(t * 5 + i)) * 10;
        c.save(); c.globalAlpha = Math.min(1, k * 1.5); c.drawImage(im, x - w / 2, y - h, w, h); c.restore();
      });
      texto(c, '(no os vayáis, que hay escena post-créditos)', W / 2, 950, "600 26px 'Nunito', sans-serif", '#f3e3c3', sstep(4.6, 5.4, e) * 0.75, { shadow: 8 });
    }

    // si se suelta el dedo fuera del juego, que no se quede acelerado
    const suelta = () => { m.hold = false; m.keyHold = false; };
    addEventListener('pointerup', suelta); addEventListener('pointercancel', suelta); addEventListener('blur', suelta);
    try {
      await new Promise((res) => { m.res = res; m.t0real = performance.now(); m.ov = introDom(); G.mode = m; fadeTo(0, 1.2); });
    } finally {
      removeEventListener('pointerup', suelta); removeEventListener('pointercancel', suelta); removeEventListener('blur', suelta);
      if (m.ov) m.ov.remove();
    }
    if (typeof postCreditos === 'function') { await fadeTo(1, 0.8); await postCreditos(); }
    G.mode = null;
    await fadeTo(1, 1);
    showTitle();
  }

  return { run, elegir, FOTOS, tarjeta };
})();

// sustituye a los créditos de scenes.js (resultados() llama a creditos() al final)
window.creditos = function () { return CRED.run(); };
