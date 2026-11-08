'use strict';
/* =====================================================================
   CARRETERA (v10): de Pontevedra a Caldas de Reis por la N-550, de noche.
   Carretera pseudo-3D por segmentos (curvas y cuestas), volante y pedales
   en pantalla, velocímetro, lluvia, niebla, farolas, vacas y Ramis dando
   la tabarra desde atrás. Sustituye al MG.carretera de minigames.js.
   Mismo contrato: MG.carretera({ len, km, cow, label }) → { sustos }.
   ===================================================================== */
(() => {
  /* ---------------- sprites ilustrados (img/road) ---------------- */
  const RS = [];
  for (let i = 1; i <= 7; i++) RS.push('arbol' + i);
  for (let i = 1; i <= 8; i++) RS.push('muro' + i);
  for (let i = 1; i <= 4; i++) RS.push('roca' + i);
  for (let i = 1; i <= 3; i++) RS.push('hierba' + i, 'arbusto' + i);
  RS.push('vaca_pasta1', 'vaca_pasta2', 'vaca_frente1', 'vaca_frente2', 'cruceiro', 'cruceiro2', 'farola', 'farola_brazo', 'stop', 'cartel_caldas', 'peugeot');
  RS.forEach((n) => EXTRA_ASSETS.push('road/' + n));

  /* ---------------- medidas del mundo ---------------- */
  const HY = 440, KX = 800;                       // horizonte y escala de proyección
  const SEG = 200, RUMBLE = 3, ROADW = 1000, CAMH = 1000, MT = 285; // MT: unidades por metro
  const CAMD = 1 / Math.tan(50 * Math.PI / 180);  // campo de visión de 100º
  const PZ = CAMD * CAMH * KX / (H - HY);         // del ojo al coche
  const DRAW = 150, DSPR = 125, MAXSPR = 180;     // segmentos que se pintan y tope de cosas
  const VMAX = 160, CRUISE = 58, UPK = 75;        // km/h; UPK: unidades/s por cada km/h

  // alto en metros [min, max], ancla del pie (0..1 del ancho) y anchura que golpea
  const SPEC = {
    arbol: [7.2, 9.8, 0.5, 0.16], muro: [1.25, 1.6, 0.5, 0.92], ruina: [2.2, 2.7, 0.5, 0.85], roca: [0.9, 1.7, 0.5, 0.8],
    hierba: [0.55, 0.85, 0.5, 0], arbusto: [0.9, 1.5, 0.5, 0], vaca_pasta: [1.4, 1.5, 0.5, 0.75], vaca_frente: [1.55, 1.65, 0.5, 0.6],
    cruceiro: [4.1, 4.5, 0.5, 0.45], cruceiro2: [3.7, 4.1, 0.5, 0.3], farola: [4.5, 4.7, 0.5, 0.45], farola_brazo: [4.5, 4.7, 0.84, 0.1],
    stop: [2.3, 2.4, 0.5, 0.35], cartel_caldas: [2.5, 2.6, 0.45, 0.12], cono: [0.72, 0.78, 0.5, 0.85],
  };
  const specOf = (n) => SPEC[n] || (n === 'muro2' || n === 'muro6' || n === 'muro7' ? SPEC.ruina : SPEC[n.replace(/\d+$/, '')]);
  // dónde está la bombilla de cada farola (fracción de la imagen)
  const LAMP = { farola: [0.5, 0.12], farola_brazo: [0.26, 0.145] };
  const ARB = ['arbol1', 'arbol2', 'arbol3', 'arbol4', 'arbol5', 'arbol6', 'arbol7'];
  const MUROS = ['muro1', 'muro3', 'muro4', 'muro5', 'muro8'], RUINAS = ['muro2', 'muro6', 'muro7'];
  const ROCAS = ['roca1', 'roca2', 'roca3', 'roca4'], HIER = ['hierba1', 'hierba2', 'hierba3'], ARBU = ['arbusto1', 'arbusto2', 'arbusto3'];
  const NIGHT = '#5b6a9c';
  const SA0 = Math.PI * 5 / 6, SSW = Math.PI * 4 / 3;   // esfera del velocímetro                         // tinte de luz de luna

  /* ---------------- frases del coche ---------------- */
  const L = {
    lento: [['ramis', 'risa', '¡Más rápido!'], ['ramis', 'risa', '¡Así no llegaremos nunca!'], ['ramis', 'risa', '¡Písale, Marcos!'],
      ['ramis', 'risa', '¡Que nos adelanta el peregrino!'], ['ramis', 'sorpresa', '¡Mi abuela con el andador va más rápido!'], ['ramis', 'risa', '¡Que la piscina abre a las ocho!']],
    lentoR: [['marcos', 'normal', '¡Que conduzco yo, Ramis!'], ['marcos', 'normal', 'Voy a la velocidad del Señor.'], ['marc', 'risa', 'Déjale, que va contando vacas.']],
    curva: [['ramis', 'risa', '¡Acelera, que vienen curvas!'], ['ramis', 'risa', '¡Curvas! ¡Ahora es cuando se acelera!'], ['ramis', 'risa', '¡Las curvas se cogen a fondo, lo dice Carlos Sainz!']],
    curvaR: [['marcos', 'sorpresa', '¡Que en las curvas se frena, Ramis!'], ['marcos', 'normal', 'Tú no conduces ni la Thermomix.']],
    rapido: [['ramis', 'risa', '¡Esto es un Porsche!'], ['ramis', 'risa', '¡Yo al menos podré decir que he vivido!'], ['ramis', 'risa', '¡Esto es mejor que el Dragon Khan!'],
      ['ramis', 'risa', '¡Marcos, eres Fernando Alonso!'], ['angel', 'risa', '¡Qué temazo! ¡Y qué velocidad!'], ['marc', 'sorpresa', 'Voy dibujando y me salen todas las rayas torcidas.']],
    rapidoR: [['marcos', 'risa', 'Es un Peugeot 5008 de siete plazas, Ramis.'], ['marcos', 'sorpresa', '¡Que es el coche de llevar a los niños al cole!'],
      ['marc', 'sorpresa', 'GPS: «Reduzca la velocidad». Hasta el GPS tiene miedo.']],
    susto: [['ramis', 'sorpresa', '¡Uyyy! ¡Casi me trago el chicle!'], ['ramis', 'sorpresa', '¡Mi vida ha pasado ante mis ojos y era aburridísima!'],
      ['ramis', 'risa', '¡Yo al menos podré decir que he vivido!'], ['ramis', 'sorpresa', '¡Esto en Mallorca no pasa!'],
      ['angel', 'sorpresa', 'Lo sabía. Nos hacía falta suerte.'], ['marc', 'sorpresa', 'GPS: «Recalculando»… y yo también.']],
    sustoR: [['marcos', 'sorpresa', '¡Ha salido de la nada!'], ['marcos', 'sorpresa', '¡Nadie ha visto nada!'], ['marcos', 'normal', 'Perdón, perdón… ¡ha sido el GPS!']],
    cono: [['ramis', 'risa', '¡Ese cono era de Fomento!'], ['ramis', 'risa', '¡Cono a la cuneta! ¡Punto para Marcos!'], ['marc', 'risa', 'Ese cono ya no vuelve a su casa.']],
    bache: [['ramis', 'sorpresa', '¡Me he dado con el techo!'], ['marc', 'sorpresa', '¡Ese bache era un agujero negro!']],
    muro: [['ramis', 'sorpresa', '¡Ese muro era del siglo XII, Marcos!'], ['ramis', 'sorpresa', '¡Al arcén no, Marcos!'], ['angel', 'sorpresa', '¡Marcos, que eso es campo!']],
    coche: [['ramis', 'sorpresa', '¡Ese iba más borracho que yo!'], ['ramis', 'sorpresa', '¡LUCES, LUCES! ¡Que no veo nada!'], ['marc', 'sorpresa', '¡Por los pelos! Esto lo dibujo.']],
    choqueCoche: [['ramis', 'sorpresa', '¡Nos ha dado un beso! ¡Como a Ángel!'], ['ramis', 'sorpresa', '¡Retrovisor menos, amigos más!']],
    lluvia: [['angel', 'normal', 'Orballo. Esto en Mallorca no pasa.'], ['marc', 'normal', 'En Galicia, cuando no llueve, orballa.'], ['ramis', 'risa', '¡Marcos, el limpiaparabrisas a tope!']],
    niebla1: [['angel', 'sorpresa', 'Esta niebla no me gusta nada…'], ['ramis', 'sorpresa', '¡Marcos, pon los antiniebla!']],
    niebla2: [['angel', 'sorpresa', 'Después de lo de la Compaña, la niebla me pone malo.'], ['ramis', 'sorpresa', '¡Que nadie mire por la ventanilla!']],
    nieblaR: [['marcos', 'normal', 'Este coche no tiene antiniebla. Tiene fe.']],
    vacas: [['ramis', 'risa', '¡Vacas! ¡Saludad a las vacas!'], ['angel', 'normal', 'Esas vacas nos miran raro.']],
    cruceiro: [['angel', 'sorpresa', 'Ese cruceiro me ha guiñado un ojo.'], ['angel', 'normal', 'Un cruceiro. Santiguaos, por si acaso.']],
    aldea: [['marc', 'normal', 'Una aldea: tres casas, un bar y una vaca.'], ['ramis', 'risa', '¿Ese bar está abierto? ¡Paramos, paramos!']],
    charla: [['ramis', 'risa', '¿Alguien tiene una ensaimada?'], ['angel', 'normal', 'Mirad qué luna, caballeros.'], ['marc', 'normal', 'GPS: «Siga recto». Como siempre.'],
      ['ramis', 'risa', '¡Caballeros, esto es una aventura!'], ['marcos', 'normal', 'Noémia me mata si le hago un arañazo al coche.'], ['angel', 'risa', 'Esta canción me la ponéis en mi entierro.']],
    borracho: [['marcos', 'borracho', 'Veo dos carreteras. Voy por la del medio.'], ['marc', 'sorpresa', 'Marcos, ¿tú has bebido? Vas haciendo eses.'], ['ramis', 'risa', '¡Marcos va haciendo eses! ¡Como yo!']],
  };

  /* ---------------- cachés (se hacen una vez) ---------------- */
  let K = null;
  const V = {}; // variantes de cada sprite: n (noche, 3 tamaños) y l (iluminado, 2 tamaños)
  function mk(w, h) { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return [cv, cv.getContext('2d')]; }
  function shrink(src, k, mul) {
    const [cv, x] = mk(src.width * k, src.height * k);
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(src, 0, 0, cv.width, cv.height);
    if (mul) {
      x.globalCompositeOperation = 'multiply'; x.fillStyle = mul; x.fillRect(0, 0, cv.width, cv.height);
      x.globalCompositeOperation = 'destination-in'; x.drawImage(src, 0, 0, cv.width, cv.height);
    }
    return cv;
  }
  function variants(src, mul) {
    const n0 = shrink(src, 1, mul || NIGHT), n1 = shrink(n0, 0.5), n2 = shrink(n1, 0.5), l1 = shrink(src, 0.5);
    return { w: src.width, h: src.height, n: [n0, n1, n2], l: [src, l1, l1] };
  }
  function glow(r, g, b, sz) {
    const [cv, x] = mk(sz, sz), h = sz / 2, gr = x.createRadialGradient(h, h, 0, h, h, h);
    gr.addColorStop(0, `rgba(${r},${g},${b},1)`); gr.addColorStop(0.16, `rgba(${r},${g},${b},0.6)`);
    gr.addColorStop(0.42, `rgba(${r},${g},${b},0.17)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr; x.fillRect(0, 0, sz, sz); return cv;
  }
  // reflejo alargado en el asfalto mojado
  function streak(r, g, b) {
    const [cv, x] = mk(32, 256);
    x.fillStyle = PROC.lin(x, 0, 0, 0, 256, [[0, `rgba(${r},${g},${b},0.9)`], [0.35, `rgba(${r},${g},${b},0.35)`], [1, `rgba(${r},${g},${b},0)`]]); x.fillRect(0, 0, 32, 256);
    x.globalCompositeOperation = 'destination-in';
    x.fillStyle = PROC.lin(x, 0, 0, 32, 0, [[0, 'rgba(0,0,0,0)'], [0.5, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]); x.fillRect(0, 0, 32, 256);
    return cv;
  }
  function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  function coneImg() {
    const [cv, x] = mk(96, 118);
    x.translate(48, 114); x.scale(1.3, 1.3);
    x.beginPath(); x.moveTo(-34, 0); x.lineTo(34, 0); x.lineTo(28, -10); x.lineTo(-28, -10); x.closePath(); x.fillStyle = '#26262b'; x.fill();
    x.beginPath(); x.moveTo(-24, -10); x.lineTo(24, -10); x.lineTo(6, -82); x.lineTo(-6, -82); x.closePath(); x.fillStyle = '#ff5f17'; x.fill(); PROC.ink(x, 3);
    x.fillStyle = '#f6f6f6';
    x.beginPath(); x.moveTo(-18, -34); x.lineTo(18, -34); x.lineTo(14.5, -48); x.lineTo(-14.5, -48); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(-12, -58); x.lineTo(12, -58); x.lineTo(10, -66); x.lineTo(-10, -66); x.closePath(); x.fill();
    return cv;
  }
  function bacheImg() {
    const [cv, x] = mk(160, 56), r = rng(77);
    x.beginPath();
    for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2, k = 0.82 + r() * 0.18; x.lineTo(80 + Math.cos(a) * 76 * k, 28 + Math.sin(a) * 24 * k); }
    x.closePath(); x.fillStyle = '#0b0c10'; x.fill();
    x.lineWidth = 3; x.strokeStyle = 'rgba(120,130,160,0.35)'; x.stroke();
    x.fillStyle = 'rgba(90,110,160,0.25)'; x.beginPath(); x.ellipse(70, 22, 40, 7, 0, 0, 7); x.fill(); // agua del charco
    return cv;
  }
  function beamImg() {
    // a baja resolución y luego estirado: así los bordes salen suaves
    const [cv, x] = mk(100, 35);
    const lay = (pts, stops) => { x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fillStyle = PROC.lin(x, 0, 35, 0, 0, stops); x.fill(); };
    lay([[36, 31], [64, 31], [96, 3], [4, 3]], [[0, 'rgba(255,238,205,0.22)'], [0.35, 'rgba(255,238,205,0.26)'], [0.7, 'rgba(255,238,205,0.1)'], [1, 'rgba(255,238,205,0)']]);
    lay([[41, 31], [59, 31], [80, 7], [30, 8]], [[0, 'rgba(255,242,215,0.3)'], [0.45, 'rgba(255,242,215,0.42)'], [0.8, 'rgba(255,242,215,0.08)'], [1, 'rgba(255,242,215,0)']]);
    const g = x.createRadialGradient(50, 21, 1, 50, 21, 16); g.addColorStop(0, 'rgba(255,240,210,0.35)'); g.addColorStop(1, 'rgba(255,240,210,0)');
    x.fillStyle = g; x.save(); x.translate(50, 21); x.scale(1, 0.45); x.translate(-50, -21); x.fillRect(30, 0, 40, 45); x.restore();
    return cv;
  }
  function ridge(seed, base, amps) {
    return (px) => { const k = px / 2400 * Math.PI * 2; let y = base; amps.forEach(([a, f, p]) => { y -= a * Math.sin(k * f + p + seed); }); return y; };
  }
  function hillsFar() {
    const [cv, x] = mk(2400, 260), rf = ridge(0.4, 130, [[55, 2, 0.6], [30, 5, 1.7], [14, 11, 0.3], [6, 23, 2]]);
    x.beginPath(); x.moveTo(0, 260); for (let i = 0; i <= 2400; i += 6) x.lineTo(i, rf(i)); x.lineTo(2400, 260); x.closePath();
    x.fillStyle = PROC.lin(x, 0, 40, 0, 260, [[0, '#121a36'], [1, '#0a1026']]); x.fill();
    x.beginPath(); for (let i = 0; i <= 2400; i += 6) (i ? x.lineTo(i, rf(i)) : x.moveTo(i, rf(i)));
    x.lineWidth = 2; x.strokeStyle = 'rgba(150,170,230,0.2)'; x.stroke();
    // luces de aldeas a lo lejos
    const r = rng(9);
    [260, 820, 1330, 1880, 2210].forEach((cx) => {
      const n = 5 + Math.floor(r() * 9);
      for (let i = 0; i < n; i++) {
        const lx = cx + (r() - 0.5) * 110, ly = rf(lx) + 18 + r() * 60, s = 1 + r() * 1.4;
        const g = x.createRadialGradient(lx, ly, 0, lx, ly, 9 * s); g.addColorStop(0, 'rgba(255,200,120,0.55)'); g.addColorStop(1, 'rgba(255,200,120,0)');
        x.fillStyle = g; x.fillRect(lx - 10 * s, ly - 10 * s, 20 * s, 20 * s);
        x.fillStyle = r() < 0.2 ? '#fff4d8' : '#ffc777'; x.fillRect(lx - s / 2, ly - s / 2, s + 0.6, s + 0.6);
      }
    });
    return cv;
  }
  function hillsNear() {
    const [cv, x] = mk(2400, 300), rf = ridge(1.9, 150, [[34, 3, 2], [20, 7, 0.4], [9, 13, 1.1]]), r = rng(21);
    x.fillStyle = '#080c1a';
    x.beginPath(); x.moveTo(0, 300); for (let i = 0; i <= 2400; i += 8) x.lineTo(i, rf(i)); x.lineTo(2400, 300); x.closePath(); x.fill();
    // pinos y eucaliptos recortados contra el cielo
    for (let i = 0; i < 2400; i += 5 + r() * 12) {
      const y = rf(i) + 4, h = 14 + r() * 40;
      x.beginPath();
      if (r() < 0.6) { x.moveTo(i - h * 0.22, y); x.lineTo(i, y - h); x.lineTo(i + h * 0.22, y); }
      else { x.ellipse(i, y - h * 0.55, h * 0.28, h * 0.5, 0, 0, 7); }
      x.fill();
    }
    x.beginPath(); for (let i = 0; i <= 2400; i += 8) (i ? x.lineTo(i, rf(i)) : x.moveTo(i, rf(i)));
    x.lineWidth = 1.5; x.strokeStyle = 'rgba(120,140,200,0.12)'; x.stroke();
    return cv;
  }
  function cloudsImg() {
    const [cv, x] = mk(2400, 230), r = rng(5);
    for (let i = 0; i < 26; i++) {
      const cx = r() * 2400, cy = 50 + r() * 140, rx = 90 + r() * 220, ry = 18 + r() * 30;
      for (const dx of [-2400, 0, 2400]) {
        const g = x.createRadialGradient(cx + dx, cy, 0, cx + dx, cy, rx);
        g.addColorStop(0, 'rgba(34,44,78,0.55)'); g.addColorStop(0.6, 'rgba(30,40,72,0.3)'); g.addColorStop(1, 'rgba(30,40,72,0)');
        x.save(); x.translate(cx + dx, cy); x.scale(1, ry / rx); x.translate(-cx - dx, -cy); x.fillStyle = g; x.fillRect(cx + dx - rx, cy - rx, rx * 2, rx * 2); x.restore();
      }
    }
    // bordes iluminados por la luna
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = PROC.lin(x, 0, 0, 0, 230, [[0, 'rgba(160,175,220,0.35)'], [0.5, 'rgba(160,175,220,0)']]); x.fillRect(0, 0, 2400, 230);
    return cv;
  }
  function speedoFace() {
    const [cv, x] = mk(280, 280), c0 = 140, a0 = SA0, sw = SSW;
    const g = x.createRadialGradient(c0, c0 - 30, 10, c0, c0, 128); g.addColorStop(0, 'rgba(30,40,74,0.78)'); g.addColorStop(1, 'rgba(8,11,26,0.62)');
    x.beginPath(); x.arc(c0, c0, 128, 0, 7); x.fillStyle = g; x.fill();
    x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,0.22)'; x.stroke();
    x.beginPath(); x.arc(c0, c0, 121, Math.PI * 1.1, Math.PI * 1.9); x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 3; x.stroke();
    x.lineCap = 'round';
    x.beginPath(); x.arc(c0, c0, 112, a0, a0 + sw); x.lineWidth = 5; x.strokeStyle = 'rgba(255,255,255,0.1)'; x.stroke();
    x.beginPath(); x.arc(c0, c0, 101, a0 + sw * 140 / 180, a0 + sw); x.lineWidth = 4; x.strokeStyle = 'rgba(255,80,96,0.6)'; x.stroke();
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = "800 17px 'Nunito', sans-serif";
    for (let s = 0; s <= 180; s += 10) {
      const a = a0 + sw * s / 180, ca = Math.cos(a), sa = Math.sin(a), maj = s % 20 === 0;
      x.beginPath(); x.moveTo(c0 + ca * (maj ? 88 : 95), c0 + sa * (maj ? 88 : 95)); x.lineTo(c0 + ca * 102, c0 + sa * 102);
      x.lineWidth = maj ? 3 : 1.5; x.strokeStyle = maj ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.4)'; x.stroke();
      if (maj) { x.fillStyle = s >= 140 ? 'rgba(255,140,150,0.9)' : 'rgba(255,255,255,0.78)'; x.fillText(String(s), c0 + ca * 74, c0 + sa * 74); }
    }
    return cv;
  }
  function wheelImg() {
    const [cv, x] = mk(300, 300), c0 = 150;
    x.lineCap = 'round';
    // aro
    x.beginPath(); x.arc(c0, c0, 124, 0, 7); x.lineWidth = 30; x.strokeStyle = 'rgba(16,22,42,0.55)'; x.stroke();
    x.beginPath(); x.arc(c0, c0, 139, 0, 7); x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,0.35)'; x.stroke();
    x.beginPath(); x.arc(c0, c0, 109, 0, 7); x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,0.2)'; x.stroke();
    // agarres
    x.beginPath(); x.arc(c0, c0, 124, Math.PI * 0.85, Math.PI * 1.15); x.lineWidth = 30; x.strokeStyle = 'rgba(255,255,255,0.13)'; x.stroke();
    x.beginPath(); x.arc(c0, c0, 124, -Math.PI * 0.15, Math.PI * 0.15); x.stroke();
    // marca de arriba (para ver cuánto giras)
    x.beginPath(); x.arc(c0, c0, 124, -Math.PI / 2 - 0.09, -Math.PI / 2 + 0.09); x.lineWidth = 30; x.strokeStyle = 'rgba(90,220,255,0.75)'; x.stroke();
    // radios
    x.fillStyle = 'rgba(255,255,255,0.14)'; x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 1.5;
    [[-112, -14, 74, 28], [38, -14, 74, 28], [-14, 30, 28, 82]].forEach(([a, b, w, h]) => { x.beginPath(); x.roundRect(c0 + a, c0 + b, w, h, 12); x.fill(); x.stroke(); });
    // centro
    x.beginPath(); x.arc(c0, c0, 42, 0, 7); x.fillStyle = 'rgba(14,20,40,0.75)'; x.fill(); x.lineWidth = 2; x.strokeStyle = 'rgba(255,255,255,0.35)'; x.stroke();
    x.font = "800 20px 'Nunito', sans-serif"; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = 'rgba(255,255,255,0.75)'; x.fillText('5008', c0, c0 + 1);
    return cv;
  }
  // colores de la noche, ya mezclados con la bruma en LEV pasos
  const LEV = 24, FOGC = [26, 32, 52];
  const BASE = { g0: '#132019', g1: '#17271d', sh0: '#2a2b31', sh1: '#2f3036', r0: '#21242c', r1: '#24272f', ln: '#b9bdc9', sd: '#1d2027' };
  function mixC(hex, k) {
    const n = parseInt(hex.slice(1), 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgb(${Math.round(r + (FOGC[0] - r) * k)},${Math.round(g + (FOGC[1] - g) * k)},${Math.round(b + (FOGC[2] - b) * k)})`;
  }
  function ensureCache() {
    if (K && K.ok) { for (const n of RS) if (!V[n] && G.img['road/' + n]) V[n] = variants(G.img['road/' + n]); return; }
    K = {};
    for (const n of RS) { const im = G.img['road/' + n]; if (im) V[n] = n === 'peugeot' ? variants(im, '#7f8bb3') : variants(im); }
    // el cruceiro2 trae una manchita arriba a la derecha
    if (V.cruceiro2) { V.cruceiro2.l[0] = shrink(V.cruceiro2.l[0], 1); new Set(V.cruceiro2.n.concat(V.cruceiro2.l)).forEach((cv) => cv.getContext('2d').clearRect(cv.width * 0.72, 0, cv.width, cv.height * 0.07)); }
    V.cono = variants(coneImg(), '#8b8fb4');
    K.gW = glow(255, 196, 120, 128); K.gR = glow(255, 34, 24, 128); K.gA = glow(255, 168, 40, 96); K.gH = glow(226, 236, 255, 128);
    K.gB = glow(60, 120, 255, 128); K.gC = glow(90, 225, 255, 128); K.gG = glow(90, 255, 170, 128);
    K.stW = streak(255, 196, 120); K.stH = streak(220, 232, 255); K.stR = streak(255, 50, 40);
    K.beam = beamImg(); K.bache = bacheImg(); K.far = hillsFar(); K.near = hillsNear(); K.clouds = cloudsImg();
    K.speedo = speedoFace(); K.wheel = wheelImg();
    { const [cv, x] = mk(4, 600); x.fillStyle = PROC.lin(x, 0, 0, 0, 600, [[0, '#03050f'], [0.35, '#081028'], [0.7, '#18213f'], [0.88, '#2a3152'], [1, '#33395a']]); x.fillRect(0, 0, 4, 600); K.sky = cv; }
    { const [cv, x] = mk(4, 500); x.fillStyle = PROC.lin(x, 0, 0, 0, 500, [[0, 'rgba(126,138,170,0)'], [0.3, 'rgba(126,138,170,0.15)'], [0.44, 'rgba(126,138,170,0.95)'], [0.58, 'rgba(126,138,170,0.55)'], [1, 'rgba(126,138,170,0.22)']]); x.fillRect(0, 0, 4, 500); K.fog = cv; }
    { const [cv, x] = mk(4, 500); x.fillStyle = PROC.lin(x, 0, 0, 0, 500, [[0, 'rgba(0,0,8,0.55)'], [0.16, 'rgba(0,0,8,0)'], [0.72, 'rgba(0,0,8,0)'], [1, 'rgba(0,0,8,0.5)']]); x.fillRect(0, 0, 4, 500); K.shade = cv; }
    { const [cv, x] = mk(256, 128); const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(170,182,210,0.9)'); g.addColorStop(0.5, 'rgba(170,182,210,0.35)'); g.addColorStop(1, 'rgba(170,182,210,0)');
      x.save(); x.scale(1, 0.5); x.fillStyle = g; x.fillRect(0, 0, 256, 256); x.restore(); K.blob = cv; }
    { const [cv, x] = mk(256, 64); const g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(0,0,0,0.85)'); g.addColorStop(0.7, 'rgba(0,0,0,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.save(); x.scale(1, 0.25); x.fillStyle = g; x.fillRect(0, 0, 256, 256); x.restore(); K.shadow = cv; }
    { const [cv, x] = mk(320, 320); PROC.moon(x, 160, 160, 36); K.moon = cv; }
    const r = rng(3); K.stars = [];
    for (let i = 0; i < 320; i++) K.stars.push({ x: r() * 3600, y: r() * (HY - 40), b: 0.25 + r() * 0.75, s: r() < 0.12 ? 3 : 2, f: 1 + r() * 3, p: r() * 6 });
    K.pal = {}; for (const k in BASE) { K.pal[k] = []; for (let i = 0; i < LEV; i++) K.pal[k].push(mixC(BASE[k], i / (LEV - 1))); }
    K.ok = true;
  }

  /* ---------------- utilidades de dibujo ---------------- */
  function qpath(c, x1, y1, w1, x2, y2, w2) { c.moveTo(x1 - w1, y1); c.lineTo(x1 + w1, y1); c.lineTo(x2 + w2, y2); c.lineTo(x2 - w2, y2); c.closePath(); }
  function glass(c, x, y, w, h, r, a) {
    c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = `rgba(12,16,34,${a === undefined ? 0.55 : a})`; c.fill();
    c.lineWidth = 1.5; c.strokeStyle = 'rgba(255,255,255,0.2)'; c.stroke();
    c.beginPath(); c.moveTo(x + r, y + 2); c.lineTo(x + w - r, y + 2); c.strokeStyle = 'rgba(255,255,255,0.14)'; c.stroke();
  }
  function wrapLines(c, txt, maxW) {
    const out = []; let line = '';
    for (const w of txt.split(' ')) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; }
    if (line) out.push(line); return out;
  }
  const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a), 0, 1); return k * k * (3 - 2 * k); };
  const bump = (k, a, b, r) => sstep(a - r, a, k) * (1 - sstep(b, b + r, k));
  const backOut = (k) => { const s = 1.70158; k -= 1; return k * k * ((s + 1) * k + s) + 1; };
  const FACES = {};
  function faceCv(src, im) {
    if (FACES[src]) return FACES[src];
    const [cv, x] = mk(112, 112), r = 56, s = (r * 2.25) / Math.max(im.width, im.height);
    x.beginPath(); x.arc(r, r, r, 0, 7); x.fillStyle = '#20263e'; x.fill(); x.clip();
    x.drawImage(im, r - im.width * s / 2, r - im.height * s * 0.46, im.width * s, im.height * s);
    return (FACES[src] = cv);
  }
  const ACC = { ramis: '#ffcf4a', marcos: '#5fd3ff', marc: '#ff8fb5', angel: '#9dff8a' };

  /* =====================================================================
     el minijuego
     ===================================================================== */
  MG.carretera = function (o) {
    o = o || {};
    if (TEST) return MG.begin({ name: 'carretera' });
    ensureCache();
    const lv = S.drunk.marcos;
    const m = { drunk: Math.min(lv, 2), name: 'carretera' };
    const D = Math.max(20, o.len || 38) * 100 * UPK;  // len = segundos a 100 km/h
    const KM = o.km || 12, LABEL = o.label || 'Rumbo a Caldas de Reis';
    const small = document.body.classList.contains('small');

    /* ---------- la carretera ---------- */
    const segs = [];
    const fin = Math.ceil((D + PZ) / SEG);           // segmento de meta
    const lastY = () => (segs.length ? segs[segs.length - 1].p2.y : 0);
    const add = (curve, y) => {
      const i = segs.length;
      segs.push({ i, curve, p1: { y: lastY(), z: i * SEG, X: 0, Y: 0, Wd: 0, s: 0, cz: 0 }, p2: { y, z: (i + 1) * SEG, X: 0, Y: 0, Wd: 0, s: 0, cz: 0 },
        spr: [], haz: [], lampL: 0, lamp: null, fog: 0, rain: 0, fr: -1, n: 0, clip: H, vis: false, bal: false, junc: 0, ns: 0, zone: '', ff: 0, fi: 0 });
    };
    const eIn = (a, b, k) => a + (b - a) * k * k, eIO = (a, b, k) => a + (b - a) * (-Math.cos(k * Math.PI) / 2 + 0.5);
    const road = (en, ho, le, curve, dy) => {
      en = Math.round(en); ho = Math.round(ho); le = Math.round(le);
      const y0 = lastY(), y1 = y0 + dy, tot = en + ho + le;
      for (let n = 0; n < en; n++) add(eIn(0, curve, n / en), eIO(y0, y1, n / tot));
      for (let n = 0; n < ho; n++) add(curve, eIO(y0, y1, (en + n) / tot));
      for (let n = 0; n < le; n++) add(eIO(curve, 0, n / le), eIO(y0, y1, (en + ho + n) / tot));
    };
    const hill = () => (Math.random() < 0.55 ? rnd(-1, 1) * rnd(1000, 3400) : 0);
    road(10, 70, 10, 0, 0);
    while (segs.length < fin * 0.79) {
      const k = segs.length / fin, r = Math.random(), cmax = 3.1 + k * 1.8 + (o.cow ? 0.6 : 0), sd = Math.random() < 0.5 ? -1 : 1;
      if (r < 0.34) road(rnd(18, 35), rnd(25, 70), rnd(18, 35), sd * rnd(1.8, cmax), hill());
      else if (r < 0.52) { road(rnd(15, 25), rnd(20, 40), rnd(15, 25), sd * rnd(2, cmax), hill()); road(rnd(15, 25), rnd(20, 40), rnd(15, 25), -sd * rnd(2, cmax), hill()); }
      else if (r < 0.72) road(rnd(15, 30), rnd(30, 80), rnd(15, 30), sd * rnd(0, 1), rnd(-1, 1) * rnd(1800, 3800));
      else if (r < 0.86) { for (let j = 0; j < 3; j++) road(12, 14, 12, rnd(-1, 1) * 1.2, (j % 2 ? -1 : 1) * rnd(800, 1600)); }
      else road(rnd(10, 20), rnd(30, 60), rnd(10, 20), 0, 0);
    }
    // el final, más tranquilo (la vaca y la llegada se ven de lejos)
    road(30, 30, 30, (Math.random() < 0.5 ? -1 : 1) * 1.5, rnd(-1, 1) * 1200);
    road(25, Math.max(40, fin - segs.length + DRAW + 60), 25, 0, rnd(-1, 1) * 800);
    const NS = segs.length;

    // tiempo, zonas y paisaje
    const Z1 = [[0, 0.07, 'pueblo'], [0.07, 0.19, 'campo'], [0.19, 0.32, 'bosque'], [0.32, 0.43, 'pasto'], [0.43, 0.5, 'aldea'], [0.5, 0.63, 'monte'], [0.63, 0.76, 'bosque'], [0.76, 0.87, 'pasto'], [0.87, 9, 'pueblo']];
    const Z2 = [[0, 0.16, 'bosque'], [0.16, 0.3, 'pasto'], [0.3, 0.39, 'aldea'], [0.39, 0.54, 'monte'], [0.54, 0.7, 'campo'], [0.7, 0.8, 'pasto'], [0.8, 0.93, 'campo'], [0.93, 9, 'pueblo']];
    for (const s of segs) {
      const k = s.i / fin;
      if (o.cow) { s.fog = Math.max(0.9 * bump(k, -0.2, 0.14, 0.05), 0.65 * bump(k, 0.56, 0.66, 0.04)); s.rain = 0.7 * bump(k, 0.34, 0.5, 0.04); }
      else { s.fog = Math.max(0.45 * bump(k, 0.26, 0.31, 0.03), bump(k, 0.66, 0.78, 0.04)); s.rain = Math.max(0.35 * bump(k, 0.13, 0.21, 0.03), bump(k, 0.41, 0.62, 0.04)); }
    }
    function put(i, n, x, f) {
      const s = segs[i]; if (!s || (s.ns && Math.sign(x) === s.ns)) return null;
      const sp = specOf(n), v = V[n]; if (!sp || !v) return null;
      const h = rnd(sp[0], sp[1]) * MT, w = h * v.w / v.h / ROADW;
      const ob = { n, x, h, a: sp[2], f: f === undefined ? Math.random() < 0.5 : f, hw: w * sp[3] / 2, lamp: LAMP[n] || null };
      s.spr.push(ob); return ob;
    }
    const sides = [-1, 1];
    const POP = {
      campo(a, b) {
        for (const sd of sides) {
          for (let i = a + ((Math.random() * 5) | 0); i < b; i += 5 + (Math.random() < 0.08 ? 9 : 0)) if (Math.random() < 0.88) put(i, pick(MUROS), sd * rnd(1.72, 1.92));
          for (let i = a; i < b; i += 3) if (Math.random() < 0.4) put(i, pick(HIER), sd * rnd(1.28, 1.48));
          for (let i = a + 2; i < b; i += 7) if (Math.random() < 0.4) put(i, pick(ARBU), sd * rnd(1.35, 1.6));
          for (let i = a + 4; i < b; i += 9) put(i, pick(ARB), sd * rnd(2.5, 4.4));
          for (let i = a + 11; i < b; i += 23) if (Math.random() < 0.6) put(i, pick(ROCAS), sd * rnd(1.45, 2.6));
          for (let i = a + 30; i < b; i += 70) put(i, pick(RUINAS), sd * rnd(2.3, 3.1));
        }
      },
      pasto(a, b) {
        for (const sd of sides) {
          for (let i = a + ((Math.random() * 5) | 0); i < b; i += 5) put(i, pick(MUROS), sd * rnd(1.68, 1.8));
          for (let i = a + 8; i < b; i += 22 + ((Math.random() * 14) | 0)) { const nn = 1 + ((Math.random() * 3) | 0); for (let j = 0; j < nn; j++) put(i + j * 3, pick(['vaca_pasta1', 'vaca_pasta2']), sd * rnd(2.4, 3.6)); }
          for (let i = a; i < b; i += 3) if (Math.random() < 0.45) put(i, pick(HIER), sd * rnd(1.25, 1.45));
          for (let i = a + 6; i < b; i += 14) put(i, pick(ARB), sd * rnd(4.2, 6));
          for (let i = a + 3; i < b; i += 29) if (Math.random() < 0.5) put(i, pick(ROCAS), sd * rnd(2.1, 3));
        }
      },
      bosque(a, b) {
        for (const sd of sides) {
          for (let i = a + (sd > 0 ? 2 : 0); i < b; i += 4) put(i, pick(ARB), sd * rnd(1.55, 2.15));
          for (let i = a + 1; i < b; i += 7) put(i, pick(ARB), sd * rnd(2.5, 3.5));
          for (let i = a + 3; i < b; i += 12) put(i, pick(ARB), sd * rnd(3.8, 5.2));
          for (let i = a; i < b; i += 5) if (Math.random() < 0.4) put(i, pick(ARBU), sd * rnd(1.3, 1.5));
          for (let i = a + 2; i < b; i += 4) if (Math.random() < 0.3) put(i, pick(HIER), sd * rnd(1.22, 1.4));
          for (let i = a + 17; i < b; i += 37) if (Math.random() < 0.6) put(i, pick(ROCAS), sd * rnd(1.4, 2));
          for (let i = a + 40; i < b; i += 90) put(i, pick(RUINAS), sd * rnd(1.9, 2.4));
        }
      },
      monte(a, b) {
        for (const sd of sides) {
          for (let i = a + ((Math.random() * 6) | 0); i < b; i += 9) put(i, pick(ROCAS), sd * rnd(1.4, 2.6));
          for (let i = a; i < b; i += 3) if (Math.random() < 0.5) put(i, Math.random() < 0.5 ? pick(HIER) : pick(ARBU), sd * rnd(1.25, 2.2));
          for (let i = a + 5; i < b; i += 13) put(i, pick(ARB), sd * rnd(2.6, 4.5));
          for (let i = a + 20; i < b; i += 45) put(i, pick(RUINAS), sd * rnd(1.9, 2.8));
          for (let i = a + 8; i < b; i += 31) if (Math.random() < 0.5) put(i, pick(MUROS), sd * rnd(1.7, 2));
        }
      },
      pueblo(a, b, tipo) {
        const aldea = tipo === 'aldea', step = aldea ? 22 : 17;
        // cruce con su STOP (y cruceiro en las aldeas)
        const j = Math.floor(a + (b - a) * rnd(0.35, 0.55)), js = Math.random() < 0.5 ? -1 : 1;
        for (let i = j - 3; i < j + 17; i++) if (segs[i]) segs[i].ns = js;
        for (let i = j; i < j + 13; i++) if (segs[i]) segs[i].junc = js;
        if (segs[j + 15]) { segs[j + 15].ns = 0; put(j + 15, 'stop', js * 1.3, false); segs[j + 15].ns = js; }
        if (aldea || Math.random() < 0.5) { const q = j + 19; if (segs[q]) { segs[q].ns = 0; put(q, Math.random() < 0.6 ? 'cruceiro' : 'cruceiro2', js * rnd(2.3, 2.7), false); segs[q].ns = js; } }
        for (let i = a + 6; i < b; i += step) { const ob = put(i, 'farola_brazo', 1.27, false); if (ob) segs[i].lamp = ob; }
        if (!aldea) for (let i = a + 6 + Math.floor(step / 2); i < b; i += step) { const ob = put(i, 'farola', -1.27, false); if (ob) segs[i].lamp = ob; }
        for (const sd of sides) {
          for (let i = a + ((Math.random() * 6) | 0); i < b; i += 6) if (Math.random() < 0.7) put(i, pick(MUROS), sd * rnd(1.75, 2));
          for (let i = a; i < b; i += 4) if (Math.random() < 0.4) put(i, Math.random() < 0.5 ? pick(HIER) : pick(ARBU), sd * rnd(1.35, 1.55));
          for (let i = a + 5; i < b; i += 15) put(i, pick(ARB), sd * rnd(2.6, 4));
          for (let i = a + 25; i < b; i += 60) put(i, pick(RUINAS), sd * rnd(2.3, 2.8));
        }
      },
    };
    POP.aldea = (a, b) => POP.pueblo(a, b, 'aldea');
    for (const [k0, k1, tipo] of (o.cow ? Z2 : Z1)) {
      const a = Math.floor(k0 * fin), b = Math.min(NS, Math.floor(k1 * fin));
      for (let i = a; i < b; i++) segs[i].zone = tipo;
      POP[tipo](a, b);
      if (tipo !== 'pueblo' && tipo !== 'aldea') for (let i = a + 6; i < b; i += 12) segs[i].bal = true;
    }
    // carteles a Caldas
    [o.cow ? 0.3 : 0.03, o.cow ? 0.95 : 0.47].forEach((k) => { const i = Math.floor(k * fin) + 4; if (segs[i]) { segs[i].ns = 0; put(i, 'cartel_caldas', 1.38, false); } });
    // luz de las farolas sobre los segmentos vecinos
    for (const s of segs) if (s.lamp) for (let d = -15; d <= 15; d++) { const q = segs[s.i + d]; if (q) q.lampL = Math.max(q.lampL, 1 - Math.abs(d) / 16); }
    // lo de más lejos de la carretera se pinta antes
    for (const s of segs) s.spr.sort((p, q) => Math.abs(q.x) - Math.abs(p.x));

    // peligros en la calzada: conos, baches, alguna vaca y coches de frente
    const cars = [], plannedCars = [];
    {
      let i = 95, lastCar = -999;
      const end = Math.floor(fin * (o.cow ? 0.8 : 0.94));
      while (i < end) {
        const k = i / fin, r = Math.random(), s = segs[i];
        if (r < 0.2) {                                           // obras: conos cerrando un carril
          const sd = Math.random() < 0.5 ? -1 : 1;
          const g = i; for (let j = 0; j < 5; j++) { const q = segs[i + j * 4]; if (q) q.haz.push({ t: 'cono', n: 'cono', x: sd * (0.92 - j * 0.15), h: 0.75 * MT, a: 0.5, f: false, w: 0.07, beacon: j === 0, g }); }
          i += 18;
        } else if (r < 0.4) s.haz.push({ t: 'cono', n: 'cono', x: (Math.random() < 0.5 ? -1 : 1) * rnd(0.25, 0.72), h: 0.75 * MT, a: 0.5, f: false, w: 0.07 });
        else if (r < 0.66) s.haz.push({ t: 'bache', x: rnd(-0.72, 0.72), w: rnd(0.16, 0.27) });
        else if (r < 0.78 && (s.zone === 'pasto' || s.zone === 'campo')) s.haz.push({ t: 'vaca', n: 'vaca_frente2', x: (Math.random() < 0.5 ? -1 : 1) * rnd(0.98, 1.1), h: 1.6 * MT, a: 0.5, f: Math.random() < 0.5, w: 0.12 });
        else if (k < 0.86 && i - lastCar > 260 && plannedCars.length < 5) { plannedCars.push(i + 40); lastCar = i; }
        i += Math.round(rnd(50, 86) - k * 16);
      }
    }

    /* ---------- estado ---------- */
    let T = 0, frame = 0, pos = 0, px = 0.5, v = 0, steer = 0, kSteer = 0, wheelSteer = 0, wheelVis = 0, dV = 0, ts = 1;
    let lastPi = Math.floor(PZ / SEG), sustos = 0, sustoFlash = 0, hitCool = 0, bumpT = 0, brakeTap = 0, frenazoT = 0;
    let fogNow = segs[0].fog, rainNow = segs[0].rain, lampNow = 0, roll = 0, skyOff = 0, farOff = 0, nearOff = 0, cloudOff = 0;
    let inGas = false, inBrake = false, usedWheel = false, usedGas = false, finishing = 0, ended = false, slowT = 0, fastT = 0, quietT = 0;
    let ltT = rnd(3, 6), strike = null, shX = 0, shY = 0, RK = 1, fpsT = 0, fpsN = 0;
    let cow = null, cowSt = o.cow ? 0 : 5, cowT = 0, cowOk = false;
    const cowZ = 0.88 * D + PZ;
    const keys = {}, ptr = {}; let wheel = null;
    const fly = [], pops = [], drops = [], lines = [], puffs = [], parts = [];
    const kinds = {}, groups = {}, once = {}, cool = { lento: 6, rapido: 4, curva: 3, borracho: 14 };
    const ord = [], list = [], recs = []; let cnt = 0;
    const WM = [1, 0, 0, 1, 0, 0];
    for (let i = 0; i < 220; i++) drops.push({ x: rnd(-150, W + 150), y: rnd(-200, H), l: rnd(0.6, 1.4), big: Math.random() < 0.2 });
    for (let i = 0; i < 9; i++) puffs.push({ z: rnd(PZ * 2, DRAW * SEG * 0.85), x: rnd(-4, 4), y: rnd(0.2, 2.2), s: rnd(5, 10) });

    /* ---------- las voces del coche ---------- */
    let cur = null, prevB = null, queue = [], gapT = 1.5, lastLaugh = -9;
    const used = new Set();
    function fresh(set) {
      let opts = set.filter((l) => !used.has(l[2]));
      if (!opts.length) { set.forEach((l) => used.delete(l[2])); opts = set; }
      const l = pick(opts); used.add(l[2]); return l;
    }
    function talk(set, op) {
      op = op || {};
      const l = Array.isArray(set[0]) ? fresh(set) : set;
      const it = { who: l[0], mood: l[1], txt: l[2], prio: op.prio || 0, chain: !!op.chain, t: 0, out: 0, dur: clamp(1.4 + l[2].length * 0.05, 2.1, 3.8), lines: null };
      if (it.prio >= 2 && cur && cur.prio < it.prio) { prevB = cur; cur = null; queue.length = 0; }
      if (queue.length > 2) return;
      queue.push(it); quietT = 0;
    }
    const reply = (set, p) => { if (Math.random() < p) talk(set, { chain: true }); };
    const canTalk = () => !cur && !queue.length && gapT <= 0 && !finishing && cowSt !== 2;
    function voice(it) {
      const who = it.who;
      for (let i = 0; i < 3; i++) setTimeout(() => { try { AUDIO.blip(who); } catch (e) {} }, i * 95);
      if (it.mood === 'risa' && T - lastLaugh > 7 && Math.random() < 0.6) { lastLaugh = T; setTimeout(() => { try { AUDIO.laugh(who); } catch (e) {} }, 380); }
    }
    function updTalk(dt) {
      gapT -= dt; quietT += dt;
      if (prevB) { prevB.out += dt; if (prevB.out > 0.3) prevB = null; }
      if (cur) { cur.t += dt; if (cur.t > cur.dur) { prevB = cur; cur = null; gapT = queue.length && queue[0].chain ? 0.35 : rnd(3.8, 5.6); } }
      if (!cur && queue.length && (gapT <= 0 || queue[0].prio >= 1)) { cur = queue.shift(); voice(cur); }
    }

    /* ---------- sustos ---------- */
    function pop(txt, col) { pops.push({ txt, col: col || '#ff5a6a', t: 0 }); }
    function susto(kind) {
      sustos++; sustoFlash = 1; pop('+1 SUSTO'); kinds[kind] = (kinds[kind] || 0) + 1;
      const set = kind === 'cono' ? (Math.random() < 0.6 ? L.cono : L.susto) : kind === 'bache' ? L.bache : kind === 'muro' ? L.muro : kind === 'coche' ? L.choqueCoche : L.susto;
      talk(set, { prio: 1 }); reply(L.sustoR, 0.3);
    }
    function crash(ob) {
      hitCool = 1.1; v *= 0.32; shake(0.7); sfx('choque');
      px -= Math.sign(px) * 0.32;
      for (let i = 0; i < 10; i++) parts.push({ k: 'dirt', x: W / 2 + rnd(-120, 120), y: rnd(820, 930), vx: rnd(-420, 420), vy: rnd(-520, -180), t: 0, max: rnd(0.5, 0.9), c: pick(['#5b4a32', '#3d5a2a', '#7a6a50']) });
      if (ob && /vaca/.test(ob.n)) sfx('mu');
      susto(ob && /vaca/.test(ob.n) ? 'vaca' : 'muro');
    }
    function hitSeg(s) {
      for (const h of s.haz) {
        if (h.hit || Math.abs(h.x - px) > h.w + 0.24) continue;
        h.hit = true;
        if (h.t === 'cono') {
          fly.push({ z: s.p1.z + SEG, x: h.x, y: 0, vz: v * UPK * 0.85, vx: (h.x >= px ? 1 : -1) * rnd(0.9, 1.6), vy: rnd(3.5, 5.5), r: 0, vr: rnd(-14, 14), t: 0 });
          // en las obras, la fila entera de conos cuenta como un solo susto
          if (h.g && groups[h.g]) { sfx('choque', { vol: 0.4 }); continue; }
          if (h.g) groups[h.g] = 1;
          sfx('choque'); shake(0.4); v *= 0.85;
          susto('cono');
        } else if (h.t === 'bache') {
          bumpT = 0.35; sfx('choque', { vol: 0.5 }); shake(v > 55 ? 0.45 : 0.2);
          if (v > 55) susto('bache');
        } else if (h.t === 'vaca') {
          sfx('mu'); sfx('frenazo'); shake(0.6); v *= 0.6; px -= Math.sign(h.x) * 0.45; susto('vaca');
        }
      }
      if (hitCool <= 0 && Math.abs(px) > 1.12) {
        for (const ob of s.spr) if (ob.hw > 0 && Math.abs(ob.x - px) < ob.hw + 0.22) { crash(ob); break; }
      }
    }

    /* ---------- controles ---------- */
    const WX = 205, WY = 815;
    const BRK = { x: 1232, y: 790, w: 132, h: 150 }, GAS = { x: 1404, y: 742, w: 128, h: 200 };
    const PROMPT = { x: 530, y: 260, w: 540, h: 150 };
    const pid = (e) => (e && e.pointerId !== undefined ? e.pointerId : 'm');
    const inR = (p, r, pad) => p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad;
    function release(id) { if (ptr[id] === 'wheel') wheel = null; delete ptr[id]; }
    m.down = (p, e) => {
      const id = pid(e);
      if (cowSt === 2 && inR(p, PROMPT, 20)) { brakeTap = 0.6; return; }
      if (p.x < 620 && p.y > 470) { ptr[id] = 'wheel'; wheel = { id, x0: p.x, s0: wheelSteer }; usedWheel = true; return; }
      if (p.x > 1130 && p.y > 600) { ptr[id] = p.x < (BRK.x + BRK.w + GAS.x) / 2 ? 'brake' : 'gas'; if (ptr[id] === 'gas') usedGas = true; return; }
    };
    m.move = (p, e) => {
      const id = pid(e), k = ptr[id];
      if (k === 'wheel' && wheel) wheelSteer = clamp(wheel.s0 + (p.x - wheel.x0) / 165, -1, 1);
      else if ((k === 'gas' || k === 'brake') && p.x > 1130 && p.y > 560) ptr[id] = p.x < (BRK.x + BRK.w + GAS.x) / 2 ? 'brake' : 'gas';
    };
    m.up = (p, e) => release(pid(e));
    m.key = (k, d) => {
      const kk = k.length === 1 ? k.toLowerCase() : k;
      if (kk === 'ArrowLeft' || kk === 'a') keys.L = d;
      else if (kk === 'ArrowRight' || kk === 'd') keys.R = d;
      else if (kk === 'ArrowUp' || kk === 'w') { keys.U = d; if (d) usedGas = true; }
      else if (kk === 'ArrowDown' || kk === 's' || kk === ' ') keys.D = d;
      if (d && (keys.L || keys.R)) usedWheel = true;
    };
    const onCancel = (e) => release(e.pointerId);
    const onBlur = () => { for (const k in ptr) delete ptr[k]; wheel = null; for (const k in keys) keys[k] = false; };
    addEventListener('pointercancel', onCancel); addEventListener('pointerup', onCancel); addEventListener('blur', onBlur);

    /* ---------- arranque: canción y frases ---------- */
    music('cancion'); sfx('motor');
    const script = o.cow
      ? [[1.0, () => talk(['marcos', 'normal', 'Venga, que ya queda poco para Caldas.'], { prio: 1 })], [3.3, () => talk(['angel', 'risa', '¡Otra vez la canción! ¡Súbela, Marcos!'], { prio: 1 })],
        [5.2, () => volUp()], [5.6, () => talk(['ramis', 'risa', '¡Y sin Compañas, por favor!'], { chain: true })]]
      : [[0.9, () => talk(['angel', 'risa', '¡Pon la canción más alta, que me flipa!'], { prio: 1 })], [2.8, () => volUp()],
        [3.2, () => talk(['ramis', 'risa', '¡TEMAZO! ¡Caldofran, allá vamos!'], { chain: true })]];
    function volUp() {
      try { AUDIO.setVolumes({ music: 1 }); } catch (e) {}
      pop('🔊 ¡A TOPE!', '#7fe8ff');
      for (let i = 0; i < 6; i++) setTimeout(() => emit('note', W / 2 + rnd(-90, 90), 800, 1), i * 120);
    }
    function finish() {
      if (ended) return; ended = true;
      removeEventListener('pointercancel', onCancel); removeEventListener('pointerup', onCancel); removeEventListener('blur', onBlur);
      try { AUDIO.setVolumes({ music: 0.8 }); } catch (e) {}
      S.stats.sustos += sustos;
      m.end({ sustos });
    }
    const segAt = (z) => segs[clamp(Math.floor(z / SEG), 0, NS - 1)];

    /* =====================================================================
       lógica
       ===================================================================== */
    m.update = (dtR) => {
      if (ended) return;
      T += dtR;
      if (T > 3) { fpsT += dtR; fpsN++; if (fpsT > 2.5) { if (fpsN / fpsT < 46 && RK > 0.6) RK = RK > 0.8 ? 0.75 : 0.6; fpsT = fpsN = 0; } }
      ts += ((cowSt === 2 ? 0.33 : 1) - ts) * Math.min(1, dtR * 8);
      const dt = dtR * ts;
      while (script.length && T >= script[0][0]) script.shift()[1]();
      // entradas
      const kt = (keys.R ? 1 : 0) - (keys.L ? 1 : 0);
      if (kt) kSteer = clamp(kSteer + kt * dtR * 4.5, -1, 1);
      else kSteer = Math.abs(kSteer) < dtR * 7 ? 0 : kSteer - Math.sign(kSteer) * dtR * 7;
      if (!wheel) wheelSteer *= Math.max(0, 1 - dtR * 9);           // el volante vuelve solo
      steer = clamp(wheelSteer + kSteer, -1, 1);
      wheelVis += (steer - wheelVis) * Math.min(1, dtR * 14);
      let gas = !!keys.U, brake = !!keys.D;
      for (const id in ptr) { if (ptr[id] === 'gas') gas = true; else if (ptr[id] === 'brake') brake = true; }
      if (brakeTap > 0) { brakeTap -= dtR; brake = true; }
      inGas = gas && !finishing; inBrake = brake;
      // velocidad
      const off = Math.abs(px);
      if (finishing) v = Math.max(0, v - 75 * dt);
      else if (cowSt === 3) {
        // frenada de emergencia: se para antes de la vaca
        const dist = Math.max(SEG * 0.5, cow.z - (pos + PZ) - SEG * 4), vu = v * UPK, need = vu * vu / (2 * dist) / UPK;
        v = Math.max(0, v - Math.max(110, need * 1.1) * dt);
      } else if (cowSt === 4) v = 0;
      else if (brake) {
        v = Math.max(0, v - 92 * dt);
        if (v > 95 && frenazoT <= 0) { frenazoT = 2.5; sfx('frenazo'); }
      } else if (gas) v += (32 * (1 - Math.pow(v / VMAX, 1.7)) + 2) * dt;
      else if (v < CRUISE) v += 13 * dt;
      else v -= (3 + v * 0.045) * dt;
      if (off > 1.14 && v > 42) v -= (off > 1.45 ? 60 : 32) * dt;
      v = clamp(v, 0, VMAX);
      frenazoT -= dt;
      const sp = v / VMAX;
      // dirección: volante + fuerza de la curva + las copas de Marcos
      const ps = segAt(pos + PZ);
      const dx = dt * 2.3 * (0.3 + 0.7 * sp);
      px += steer * dx;
      px -= dx * sp * ps.curve * 0.32;
      if (lv > 0) {
        dV += rnd(-1, 1) * lv * 1.6 * dt; dV *= Math.pow(0.35, dt);
        px += (dV * 0.35 + Math.sin(T * 1.25) * 0.045 * lv) * dt * Math.min(1, sp * 2.2);
      }
      px = clamp(px, -2.6, 2.6);
      // avanzar
      pos += v * UPK * dt;
      if (pos > (NS - DRAW - 5) * SEG) pos = (NS - DRAW - 5) * SEG;
      const pz = pos + PZ, pi = Math.floor(pz / SEG);
      hitCool -= dt;
      for (let k = lastPi + 1; k <= pi && k < NS; k++) hitSeg(segs[k]);
      lastPi = pi;
      // tiempo que hace
      fogNow += (ps.fog + 0.06 - fogNow) * Math.min(1, dt * 0.9);
      rainNow += (ps.rain - rainNow) * Math.min(1, dt * 0.9);
      lampNow += (ps.lampL - lampNow) * Math.min(1, dt * 5);
      // fondo en las curvas
      const turn = ps.curve * sp * dt;
      skyOff += turn * 9; farOff += turn * 26; nearOff += turn * 60; cloudOff += turn * 14 + dt * 4;
      roll += (clamp(-ps.curve * sp * 0.0065 - steer * sp * 0.012, -0.04, 0.04) - roll) * Math.min(1, dt * 3);
      // baches y campo: la cámara tiembla
      bumpT -= dt;
      const rough = (off > 1.1 ? Math.min(1, sp * 3) * 7 : 0) + (bumpT > 0 ? 10 : 0) + sp * 1.4;
      shX = rnd(-1, 1) * rough * 0.5; shY = rnd(-1, 1) * rough;
      if (off > 1.12 && v > 25 && Math.random() < 0.6) parts.push({ k: 'dirt', x: W / 2 + Math.sign(Math.random() - 0.5) * rnd(80, 140), y: rnd(930, 980), vx: rnd(-300, 300), vy: rnd(-380, -120), t: 0, max: rnd(0.4, 0.7), c: pick(['#4d5a2e', '#5b4a32', '#33461f']) });
      if (rainNow > 0.25 && v > 45 && Math.random() < rainNow * sp * 1.6) parts.push({ k: 'spray', x: W / 2 + (Math.random() < 0.5 ? -1 : 1) * rnd(90, 125), y: 965, vx: rnd(-90, 90), vy: rnd(-60, 10), t: 0, max: rnd(0.5, 0.9), s: rnd(30, 60) });
      // coches de frente
      while (plannedCars.length && pi + DRAW - 10 > plannedCars[0]) {
        const at = plannedCars.shift();
        cars.push({ z: at * SEG, x: -0.5 + rnd(-0.06, 0.06), v: rnd(70, 100), hit: false, passed: false, warned: false, flash: 0 });
      }
      for (let i = cars.length - 1; i >= 0; i--) {
        const cr = cars[i];
        cr.z -= cr.v * UPK * dt; cr.flash -= dt;
        if (cr.hit) cr.x += (-1.35 - cr.x) * Math.min(1, dt * 3);
        const dz = cr.z - pz;
        if (!cr.warned && dz > 0 && dz < 70 * SEG && Math.abs(cr.x - px) < 0.62) { cr.warned = true; cr.flash = 1.4; sfx('claxon', { d: 0.7, pan: -0.3 }); }
        if (!cr.hit && !cr.passed && Math.abs(dz) < SEG * 3 && Math.abs(cr.x - px) < 0.52) {
          cr.hit = true; cr.v *= 0.5; v *= 0.45; px = Math.max(px, cr.x + 0.75); shake(0.9); flash('#ffffff', 0.35); sfx('choque'); sfx('frenazo'); susto('coche');
        }
        if (!cr.passed && dz < -SEG * 2) {
          cr.passed = true; sfx('whoosh');
          if (!cr.hit && Math.abs(cr.x - px) < 0.95) { talk(L.coche, { prio: 1 }); pop('¡POR LOS PELOS!', '#ffd34f'); }
        }
        if (cr.z < pos - SEG * 6) cars.splice(i, 1);
      }
      // conos volando
      for (let i = fly.length - 1; i >= 0; i--) {
        const f = fly[i];
        f.t += dt; f.z += f.vz * dt; f.vz *= Math.pow(0.25, dt); f.x += f.vx * dt; f.y += f.vy * dt; f.vy -= 14 * dt; f.r += f.vr * dt;
        if (f.y < 0) { f.y = 0; f.vy = -f.vy * 0.35; f.vx *= 0.6; f.vr *= 0.6; }
        if (f.t > 3 || f.z < pos) fly.splice(i, 1);
      }
      // la vaca de Ramiro
      if (o.cow) updCow(dt, dtR, pz, sp);
      // frases según lo que pasa
      updTalk(dtR);
      for (const k in cool) cool[k] -= dtR;
      if (!finishing && cowSt !== 2 && cowSt !== 3) {
        slowT = v < 72 ? slowT + dtR : 0;
        fastT = v > 128 ? fastT + dtR : 0;
      }
      if (T > 6 && canTalk()) contextTalk(pi, sp);
      // meta
      const prog = pos / D;
      if (!finishing && prog >= 1 && cowSt === 5) {
        finishing = T; sfx('ok');
        if (!o.cow) { talk(['marc', 'sorpresa', 'Eso de ahí… ¿son luces azules?'], { prio: 2 }); talk(['ramis', 'sorpresa', '¡La Guardia Civil! ¡Todos con cara de sobrios!'], { chain: true }); }
        else talk(['angel', 'risa', '¡Caldas de Reis! ¡Ya huele a agua termal!'], { prio: 2 });
      }
      if (finishing && T - finishing > 3.4) finish();
      // efectos de pantalla
      updFx(dtR, dt, sp);
      sustoFlash = Math.max(0, sustoFlash - dtR * 1.2);
      for (let i = pops.length - 1; i >= 0; i--) { pops[i].t += dtR; if (pops[i].t > 1.4) pops.splice(i, 1); }
      for (let i = parts.length - 1; i >= 0; i--) { const q = parts[i]; q.t += dtR; q.x += q.vx * dtR; q.y += q.vy * dtR; if (q.k === 'dirt') q.vy += 1400 * dtR; else { q.s += 80 * dtR; } if (q.t > q.max) parts.splice(i, 1); }
      if (parts.length > 80) parts.splice(0, parts.length - 80);
      // rayo de vez en cuando cuando llueve fuerte
      if (rainNow > 0.55) { ltT -= dtR; if (ltT <= 0) { ltT = rnd(5, 10); strike = { t: 0, pts: bolt() }; } }
      if (strike) { strike.t += dtR; if (strike.t > 0.7) strike = null; }
    };
    function bolt() {
      const pts = []; let x = rnd(250, 1350), y = -20;
      while (y < HY - 70) { pts.push([x, y]); x += rnd(-38, 38); y += rnd(18, 42); }
      pts.push([x, HY - 60]); return pts;
    }
    function updCow(dt, dtR, pz, sp) {
      if (cowSt === 0 && cowZ - pz < DRAW * SEG * 0.92) {
        const sd = px >= 0 ? 1 : -1;
        cow = { z: cowZ, x: sd * 1.35, tx: sd * 0.42, sd, n: 'vaca_frente1', f: false };
        cowSt = 1; sfx('mu');
      }
      if (!cow) return;
      const dist = cow.z - pz;
      if (cowSt === 1) {
        // se mete en tu carril justo cuando llegas
        cow.x = cow.tx + (cow.sd * 1.35 - cow.tx) * clamp((dist - 18 * SEG) / (95 * SEG), 0, 1);
        const tti = dist / Math.max(1, v * UPK);
        if (tti < 1.5 || dist < 22 * SEG) {
          cowSt = 2; cowT = 0; sfx('mu');
          talk(['ramis', 'sorpresa', '¡UNA VACA! ¡UNA VACA EN LA CARRETERA!'], { prio: 3 });
        }
      } else if (cowSt === 2) {
        cowT += dtR;
        cow.x = cow.tx + (cow.sd * 1.35 - cow.tx) * clamp((dist - 18 * SEG) / (95 * SEG), 0, 1);
        if (inBrake) { cowSt = 3; cowOk = true; sfx('frenazo'); shake(0.3); }
        else if (dist < SEG * 1.5) {
          if (Math.abs(cow.x - px) < 0.55) {
            sfx('mu'); sfx('frenazo'); shake(0.9);
            px = cow.x > 0 ? cow.x - 0.9 : cow.x + 0.9; v *= 0.7; susto('vaca');
            talk(['ramis', 'sorpresa', '¡VOLANTAZO! ¡La vaca nos mira con desprecio!'], { prio: 3 });
          } else { pop('¡POR LOS PELOS!', '#ffd34f'); talk(['ramis', 'risa', '¡Por los pelos! ¡Casi la ordeñamos!'], { prio: 3 }); }
          cowSt = 5;
        }
      } else if (cowSt === 3) {
        if (v <= 0.5) { v = 0; cowSt = 4; cowT = 0; pop('¡FRENAZO!', '#7fe8ff'); talk(['marcos', 'risa', 'Buenas noches, señora vaca.'], { prio: 3 }); talk(['ramis', 'risa', '¡Ramiro, recoge a tu vaca!'], { chain: true }); }
      } else if (cowSt === 4) {
        cowT += dtR;
        if (cowT > 1.8 && cow.n === 'vaca_frente1') { cow.n = 'vaca_pasta2'; cow.f = cow.sd < 0; sfx('mu'); }
        if (cowT > 1.8) cow.x += cow.sd * 0.75 * dtR;
        if (Math.abs(cow.x) > 1.6) cowSt = 5;
      }
      if (cowSt === 5 && cow && cow.z < pos - SEG * 4) cow = null;
    }
    function contextTalk(pi, sp) {
      const s = segs[pi] || segs[NS - 1];
      if (s.fog > 0.5 && !once.niebla) { once.niebla = 1; talk(o.cow ? L.niebla2 : L.niebla1); reply(L.nieblaR, 0.5); return; }
      if (s.rain > 0.5 && !once.lluvia) { once.lluvia = 1; talk(L.lluvia); return; }
      if (slowT > 4.5 && cool.lento <= 0) { cool.lento = 12; slowT = 0; talk(L.lento); reply(L.lentoR, 0.45); return; }
      if (fastT > 2 && cool.rapido <= 0) { cool.rapido = 13; talk(L.rapido); reply(L.rapidoR, 0.35); return; }
      if (cool.curva <= 0) {
        let cm = 0; for (let k = pi + 30; k < pi + 75 && k < NS; k += 5) cm = Math.max(cm, Math.abs(segs[k].curve));
        if (cm >= 3 && Math.abs(s.curve) < 1.5) { cool.curva = 15; talk(L.curva); reply(L.curvaR, 0.45); return; }
      }
      if (!once.aldea && (s.zone === 'aldea' || (s.zone === 'pueblo' && pi > 200))) { once.aldea = 1; talk(L.aldea); return; }
      if (!once.vacas && s.zone === 'pasto') { for (let k = pi; k < pi + 60 && k < NS; k++) if (segs[k].spr.some((q) => q.n.startsWith('vaca_pasta'))) { once.vacas = 1; talk(L.vacas); return; } }
      if (!once.cruceiro) { for (let k = pi + 10; k < pi + 50 && k < NS; k++) if (segs[k].spr.some((q) => q.n.startsWith('cruceiro'))) { once.cruceiro = 1; talk(L.cruceiro); return; } }
      if (lv >= 2 && cool.borracho <= 0) { cool.borracho = 22; talk(L.borracho); return; }
      if (quietT > 12) talk(L.charla);
    }
    function updFx(dtR, dt, sp) {
      // rayas de velocidad (estilo manga), arriba y abajo
      const want = sp > 0.36 ? (sp - 0.36) / 0.64 : 0;
      m.lnAcc = (m.lnAcc || 0) + dtR * want * 230;
      while (m.lnAcc > 1) {
        m.lnAcc--; if (lines.length > 140) continue;
        const top = Math.random() < 0.58, a = top ? rnd(-Math.PI + 0.45, -0.45) : rnd(0.5, Math.PI - 0.5), sy = Math.sin(a);
        const d0 = top ? (HY - 300) / -sy : (700 - HY) / sy;
        const dd = d0 * rnd(0.92, 1.1); lines.push({ a, d: dd, d0: dd, w: rnd(1.2, 3), al: rnd(0.5, 1), top });
      }
      for (let i = lines.length - 1; i >= 0; i--) { const l = lines[i]; l.d += dtR * (500 + 1900 * sp) * (0.45 + l.d / 700); if (l.d > 1500) lines.splice(i, 1); }
      // lluvia: cae y además viene hacia ti
      if (rainNow > 0.03) for (const d of drops) {
        d.vx = (d.x - W / 2) * (0.25 + sp * 1.6) - 40; d.vy = 1250 * d.l + (d.y - HY) * sp * 1.2;
        d.x += d.vx * dtR; d.y += d.vy * dtR;
        if (d.y > H + 40 || d.x < -160 || d.x > W + 160) { d.x = rnd(-150, W + 150); d.y = rnd(-160, HY + 60); }
      }
      // bancos de niebla que pasan rodando
      for (const p of puffs) { p.z -= (v * UPK + 250) * dt; if (p.z < PZ * 0.45) { p.z = DRAW * SEG * rnd(0.6, 0.9); p.x = rnd(-4.5, 4.5); p.y = rnd(0.2, 2.4); p.s = rnd(5, 10); } }
    }

    /* =====================================================================
       dibujo
       ===================================================================== */
    function setW(c) { c.setTransform(WM[0], WM[1], WM[2], WM[3], WM[4], WM[5]); }
    const idW = (c, x, y) => c.setTransform(RK, 0, 0, RK, (x || 0) * RK, (y || 0) * RK);
    // el mundo se pinta en un lienzo propio cuando hay que bajar la resolución
    let wcv = null;
    function worldCtx() {
      const w = Math.ceil(W * RK), h = Math.ceil(H * RK);
      if (!wcv || wcv.width !== w) { wcv = document.createElement('canvas'); wcv.width = w; wcv.height = h; }
      return wcv.getContext('2d');
    }
    function project(p, camX, camY, camZ) {
      const cz = p.z - camZ; p.cz = cz; const s = CAMD / cz; p.s = s;
      p.X = W / 2 + s * (-camX) * KX; p.Y = HY - s * (p.y - camY) * KX; p.Wd = s * ROADW * KX;
    }
    // luz que le llega a una cosa: farolas y faros del Peugeot
    function lightAt(s, X) {
      let Lt = s.lampL * 0.85;
      const dz = s.p1.cz - PZ;
      if (dz > 250) {
        const rel = Math.abs(X - W / 2) / (s.p1.s * KX), ratio = rel / dz;
        const hor = clamp((0.95 - ratio) / 0.5, 0, 1), df = clamp(1.25 - dz / 15000, 0, 1);
        Lt = Math.max(Lt, hor * df * 0.95);
      }
      return Lt;
    }
    // pinta un sprite con su tinte de noche, la luz que le toque, la niebla y el recorte de las cuestas
    function blit(c, n, X, Y, hpx, a, f, clip, alpha, Lt, rot) {
      const v2 = V[n]; if (!v2 || hpx < 2 || alpha < 0.03 || hpx > H * 3) return;
      const wpx = hpx * v2.w / v2.h;
      if (X + wpx < -260 || X - wpx > W + 260) return;
      let ch = hpx; if (clip < Y) { ch = hpx - (Y - clip); if (ch <= 0.5) return; }
      const lvl = hpx < v2.h * 0.3 ? 2 : hpx < v2.h * 0.6 ? 1 : 0;
      if (rot) { c.save(); c.translate(X, Y - hpx / 2); c.rotate(rot); c.translate(-X, -Y + hpx / 2); }
      else if (f) c.setTransform(-WM[0], -WM[1], WM[2], WM[3], 2 * WM[0] * X + WM[4], 2 * WM[1] * X + WM[5]);
      const x0 = X - wpx * a, y0 = Y - hpx;
      let im = v2.n[lvl];
      if (Lt < 0.96) { c.globalAlpha = alpha; c.drawImage(im, 0, 0, im.width, im.height * ch / hpx, x0, y0, wpx, ch); }
      if (Lt > 0.04 && (hpx > 14 || Lt > 0.5)) { im = v2.l[lvl]; c.globalAlpha = alpha * Math.min(1, Lt); c.drawImage(im, 0, 0, im.width, im.height * ch / hpx, x0, y0, wpx, ch); }
      if (rot) c.restore(); else if (f) setW(c);
    }

    m.draw = (c0) => {
      frame++;
      const sp = v / VMAX;
      const c = RK < 1 ? worldCtx() : c0;
      // cámara: balanceo en las curvas y temblores, girando desde abajo
      const ca = Math.cos(roll), sa = Math.sin(roll), pvx = W / 2, pvy = H;
      WM[0] = ca * RK; WM[1] = sa * RK; WM[2] = -sa * RK; WM[3] = ca * RK;
      WM[4] = (pvx + shX * 0.6 - (ca * pvx - sa * pvy)) * RK; WM[5] = (pvy + shY * 0.6 - (sa * pvx + ca * pvy)) * RK;
      setW(c);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      // proyectar los segmentos (de cerca a lejos)
      const base = segAt(pos), bp = (pos % SEG) / SEG;
      const ps = segAt(pos + PZ), pp = ((pos + PZ) % SEG) / SEG;
      const pY = ps.p1.y + (ps.p2.y - ps.p1.y) * pp;
      const camX = px * ROADW, camY = pY + CAMH;
      let maxy = H, xo = 0, dxo = -(base.curve * bp);
      const dens = 1.0 + 5.5 * fogNow + 1.1 * rainNow;
      cnt = 0;
      for (let n = 0; n < DRAW; n++) {
        const s = segs[base.i + n]; if (!s) break;
        project(s.p1, camX - xo, camY, pos);
        project(s.p2, camX - xo - dxo, camY, pos);
        xo += dxo; dxo += s.curve;
        s.n = n; s.fr = frame; s.clip = maxy;
        s.vis = !(s.p1.cz <= CAMD || s.p2.Y >= s.p1.Y || s.p2.Y >= maxy);
        if (s.vis) maxy = s.p2.Y;
        s.ff = 1 - Math.exp(-dens * n / DRAW); s.fi = Math.min(LEV - 1, (s.ff * (LEV - 1) + 0.5) | 0);
        ord[cnt++] = s;
      }
      drawSky(c, maxy);
      drawRoad(c);
      drawRoadLights(c);
      drawThings(c);
      setW(c); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      drawFog(c);
      drawCar(c);
      drawRain(c);
      idW(c);
      drawLines(c, sp);
      drawParts(c);
      if (strike) {
        const k = strike.t < 0.07 ? 1 : strike.t < 0.14 ? 0.2 : strike.t < 0.22 ? 0.85 : Math.max(0, 1 - (strike.t - 0.22) / 0.45) * 0.6;
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.14 * k; c.fillStyle = '#9fb4ff'; c.fillRect(0, 0, W, H);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
      // el mundo a baja resolución se estira sobre el búfer del juego; la interfaz va siempre nítida
      c0.setTransform(1, 0, 0, 1, 0, 0); c0.globalAlpha = 1; c0.globalCompositeOperation = 'source-over';
      if (c !== c0) c0.drawImage(c.canvas, 0, 0, c.canvas.width, c.canvas.height, 0, 0, W, H);
      shade(c0, 1);
      drawParticles(c0);
      drawHud(c0);
      c0.globalAlpha = 1; c0.globalCompositeOperation = 'source-over'; c0.setTransform(1, 0, 0, 1, 0, 0);
    };

    function drawSky(c, topY) {
      const hide = clamp(1 - fogNow * 0.85 - rainNow * 0.6, 0, 1);
      c.drawImage(K.sky, -200, -200, W + 400, HY + 340);
      // estrellas (en 4 tandas de brillo, un fill cada una)
      if (hide > 0.03) {
        c.fillStyle = '#fffbe8';
        for (let b = 0; b < 4; b++) {
          c.beginPath();
          for (const st of K.stars) {
            const a = st.b * (0.6 + 0.4 * Math.sin(T * st.f + st.p)); if (Math.min(3, (a * 4) | 0) !== b) continue;
            const x = ((st.x - skyOff) % 3600 + 3600) % 3600 - 1000; if (x < -200 || x > W + 200) continue;
            c.rect(x, st.y, st.s, st.s);
          }
          c.globalAlpha = hide * (b + 0.6) / 4; c.fill();
        }
      }
      // rayo
      if (strike && strike.t < 0.3 && (strike.t < 0.08 || strike.t > 0.15)) {
        c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round';
        c.beginPath(); strike.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
        c.globalAlpha = 0.35; c.strokeStyle = '#8fa8ff'; c.lineWidth = 12; c.stroke();
        c.globalAlpha = 1; c.strokeStyle = '#f4f7ff'; c.lineWidth = 3; c.stroke();
        c.globalAlpha = 0.45; c.fillStyle = '#7d93e8'; c.fillRect(-200, -200, W + 400, HY + 200);
        c.globalCompositeOperation = 'source-over';
      }
      // nubes y luna
      c.globalAlpha = 0.85 + rainNow * 0.15;
      let x0 = -(((cloudOff % 2400) + 2400) % 2400) - 200; c.drawImage(K.clouds, x0, 20); c.drawImage(K.clouds, x0 + 2400, 20);
      const mx = ((1960 - skyOff) % 3600 + 3600) % 3600 - 1000;
      c.globalAlpha = clamp(1 - fogNow * 0.6 - rainNow * 0.6, 0.1, 1); c.drawImage(K.moon, mx - 160, 150 - 160);
      // montes lejos (con luces de aldeas) y monte cerca
      c.globalAlpha = 1;
      x0 = -(((farOff % 2400) + 2400) % 2400) - 200; c.drawImage(K.far, x0, HY - 200); c.drawImage(K.far, x0 + 2400, HY - 200);
      x0 = -(((nearOff % 2400) + 2400) % 2400) - 200; c.drawImage(K.near, x0, HY - 170); c.drawImage(K.near, x0 + 2400, HY - 170);
      // bruma sobre el cielo y el monte
      const hz = Math.min(0.94, fogNow * 1.05 + rainNow * 0.3);
      if (hz > 0.02) { c.globalAlpha = hz; c.fillStyle = 'rgb(26,32,52)'; c.fillRect(-200, -200, W + 400, HY + 330); }
      c.globalAlpha = 1;
      // suelo de relleno solo donde no llega la carretera (bajadas)
      if (topY > HY + 126) { c.fillStyle = hz > 0.3 ? 'rgb(26,32,52)' : '#080c1a'; c.fillRect(-200, HY + 126, W + 400, topY - HY - 124); }
    }

    // tramos con el mismo nivel de bruma se pintan juntos: un fill por color en vez de uno por segmento
    const ROADPASS = [['g0', 1, 0], ['g1', 0, 0], ['sh0', 1, 1], ['sh1', 0, 1], ['sd', 2, 2], ['r0', 1, 3], ['r1', 0, 3], ['ln', 2, 4]];
    function drawRoad(c) {
      const P = K.pal;
      let n = cnt - 1;
      while (n >= 0) {
        const fi = ord[n].fi; let lo = n;
        while (lo > 0 && ord[lo - 1].fi === fi) lo--;
        for (const [col, alt, kind] of ROADPASS) {
          c.beginPath(); let any = false;
          for (let k = n; k >= lo; k--) {
            const sg = ord[k]; if (!sg.vis) continue;
            const p1 = sg.p1, p2 = sg.p2, y1 = Math.round(p1.Y), y2 = Math.round(p2.Y);
            if (y1 <= y2) continue;
            const a = ((sg.i / RUMBLE) | 0) & 1;
            if (alt < 2 && a !== alt) continue;
            if (kind === 0) { c.rect(-220, y2, W + 440, y1 - y2); any = true; }
            else if (kind === 1) { qpath(c, p1.X, y1, p1.Wd * 1.16, p2.X, y2, p2.Wd * 1.16); any = true; }
            else if (kind === 2) { if (sg.junc) { qpath(c, p1.X + sg.junc * p1.Wd * 2.6, y1, p1.Wd * 1.6, p2.X + sg.junc * p2.Wd * 2.6, y2, p2.Wd * 1.6); any = true; } }
            else if (kind === 3) { qpath(c, p1.X, y1, p1.Wd, p2.X, y2, p2.Wd); any = true; }
            else if (k < 125) {
              const l1 = p1.Wd * 0.022, l2 = p2.Wd * 0.022;
              if (sg.junc !== -1) qpath(c, p1.X - p1.Wd * 0.955, y1, l1, p2.X - p2.Wd * 0.955, y2, l2);
              if (sg.junc !== 1) qpath(c, p1.X + p1.Wd * 0.955, y1, l1, p2.X + p2.Wd * 0.955, y2, l2);
              if (sg.junc) { const jx = sg.junc * 1.22; qpath(c, p1.X + p1.Wd * jx, y1, p1.Wd * 0.05, p2.X + p2.Wd * jx, y2, p2.Wd * 0.05); }
              if (sg.i % 16 < 6) qpath(c, p1.X, y1, p1.Wd * 0.018, p2.X, y2, p2.Wd * 0.018);
              any = true;
            }
          }
          if (any) { c.fillStyle = P[col][fi]; c.fill(); }
        }
        n = lo - 1;
      }
    }

    function drawRoadLights(c) {
      // baches (encima del asfalto)
      c.globalCompositeOperation = 'source-over';
      for (let n = Math.min(cnt, DSPR) - 1; n >= 0; n--) {
        const s = ord[n]; if (!s.vis) continue;
        for (const h of s.haz) if (h.t === 'bache') {
          const w = h.w * 2 * s.p1.Wd; if (w < 2) continue;
          c.globalAlpha = 0.95 - s.ff * 0.8; c.drawImage(K.bache, s.p1.X + h.x * s.p1.Wd - w / 2, s.p1.Y - w * 0.2, w, w * 0.35);
        }
      }
      c.globalCompositeOperation = 'lighter';
      const wet = 0.3 + 0.7 * rainNow;
      // faros del Peugeot sobre el asfalto
      c.globalAlpha = 0.62 * (1 - fogNow * 0.25);
      c.drawImage(K.beam, -wheelVis * 70 - 10, HY - 8, W + 20, H - HY + 8);
      if (fogNow > 0.1) { c.globalAlpha = fogNow * 0.3; c.drawImage(K.beam, -wheelVis * 70 - 120, HY - 150, W + 240, H - HY + 60); }
      // charcos de luz de las farolas
      for (let n = Math.min(cnt, DSPR) - 1; n >= 0; n--) {
        const s = ord[n]; if (!s.lamp || s.p1.cz <= CAMD) continue;
        const sc = s.p1.s, Lm = s.lamp, lx = s.p1.X + sc * Lm.x * 0.55 * ROADW * KX;
        const yN = ord[Math.max(0, n - 7)].p1.Y, yF = (n + 7 < cnt ? ord[n + 7] : s).p1.Y;
        const rx = sc * 1350 * KX, ry = Math.max(4, (yN - yF) / 2), cy = (yN + yF) / 2;
        const fa = 1 - s.ff * 0.85;
        c.globalAlpha = 0.55 * fa; c.drawImage(K.gW, lx - rx, cy - ry, rx * 2, ry * 2);
        // reflejo en el suelo mojado, justo debajo de la bombilla
        const hx = s.p1.X + sc * Lm.x * ROADW * KX + (Lm.f ? -1 : 1) * (LAMP[Lm.n][0] - Lm.a) * Lm.h * sc * KX * V[Lm.n].w / V[Lm.n].h;
        const rw = Math.max(3, rx * 0.16);
        c.globalAlpha = wet * 0.55 * fa; c.drawImage(K.stW, hx - rw, s.p1.Y - ry * 0.3, rw * 2, Math.min(520, rx * 1.3));
      }
      // luz de los coches que vienen de frente
      for (const cr of cars) {
        const s = segAt(cr.z); if (s.fr !== frame || s.p1.cz <= CAMD) continue;
        const n = s.n, near = ord[Math.max(0, n - 12)], sc = s.p1.s;
        const X = s.p1.X + sc * cr.x * ROADW * KX, Xn = near.p1.X + near.p1.s * cr.x * ROADW * KX;
        const rx = near.p1.s * 1100 * KX, fa = 1 - s.ff * 0.7;
        c.globalAlpha = 0.5 * fa; c.drawImage(K.gH, Xn - rx, (near.p1.Y + s.p1.Y) / 2 - rx * 0.2, rx * 2, rx * 0.4);
        const w = 1.85 * MT * sc * KX, rw = Math.max(3, w * 0.12);
        c.globalAlpha = wet * 0.7 * fa;
        for (const sd of sides) c.drawImage(K.stH, X + sd * w * 0.33 - rw, s.p1.Y - w * 0.05, rw * 2, Math.min(600, w * 2.2));
      }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }

    function rec(k, s, kind, ob, pz) {
      const r = recs[list.length] || (recs[list.length] = {});
      r.k = k; r.s = s; r.kind = kind; r.o = ob; r.pz = pz || 0; list.push(r);
    }
    function drawThings(c) {
      list.length = 0;
      const top = Math.min(cnt, DSPR);
      for (let n = 0; n < top && list.length < MAXSPR; n++) {
        const s = ord[n]; if (s.p1.cz < PZ * 0.72) continue;
        const cz = s.p1.cz;
        for (const ob of s.spr) rec(cz + Math.abs(ob.x - px) * 520, s, 'spr', ob);
        for (const h of s.haz) if (h.t !== 'bache' && !h.hit) rec(cz + Math.abs(h.x - px) * 520, s, 'spr', h);
        if (s.bal) rec(cz + 520, s, 'bal', null);
      }
      // cosas que se mueven (en su segmento)
      const dyn = (z, x, kind, ob) => { const s = segAt(z); if (s.fr !== frame || s.n >= top || s.p1.cz <= CAMD) return; rec(z - pos + Math.abs(x - px) * 520, s, kind, ob, (z % SEG) / SEG); };
      for (const cr of cars) dyn(cr.z, cr.x, 'car', cr);
      for (const f of fly) dyn(f.z, f.x, 'fly', f);
      if (cow) dyn(cow.z, cow.x, 'cow', cow);
      list.sort((a, b) => b.k - a.k);
      setW(c);
      for (const r of list) {
        const s = r.s, sc = s.p1.s, alpha = 1 - s.ff * 0.93;
        if (r.kind === 'spr') {
          const ob = r.o, X = s.p1.X + sc * ob.x * ROADW * KX, hpx = ob.h * sc * KX;
          blit(c, ob.n, X, s.p1.Y, hpx, ob.a, ob.f, s.clip, alpha, lightAt(s, X), 0);
          if (ob.lamp) lampGlow(c, ob, X, s.p1.Y, hpx, s.clip, alpha);
          if (ob.beacon && Math.sin(T * 10) > -0.1 && s.p1.Y - hpx < s.clip) {
            c.globalCompositeOperation = 'lighter'; const g = Math.max(10, hpx * 1.3);
            c.globalAlpha = alpha; c.drawImage(K.gA, X - g, s.p1.Y - hpx * 1.1 - g, g * 2, g * 2); c.globalCompositeOperation = 'source-over';
          }
        } else if (r.kind === 'bal') drawBal(c, s, alpha);
        else {
          // interpolar dentro del segmento
          const k = r.pz, s1 = sc + (s.p2.s - sc) * k, Y = s.p1.Y + (s.p2.Y - s.p1.Y) * k, Xc = s.p1.X + (s.p2.X - s.p1.X) * k;
          const ob = r.o, X = Xc + s1 * ob.x * ROADW * KX;
          if (r.kind === 'car') drawOncoming(c, ob, X, Y, s1, alpha, s.clip);
          else if (r.kind === 'fly') blit(c, 'cono', X, Y - ob.y * MT * s1 * KX, 0.75 * MT * s1 * KX, 0.5, false, H * 2, alpha, 0.9, ob.r);
          else if (r.kind === 'cow') {
            const bob = cowSt === 4 && cowT > 1.8 ? Math.abs(Math.sin(T * 9)) * 0.08 * MT * s1 * KX : 0;
            const hc = (ob.n === 'vaca_frente1' ? 1.6 : 1.45) * MT * s1 * KX;
            blit(c, ob.n, X, Y - bob, hc, 0.5, ob.f, s.clip, Math.max(alpha, 0.85), Math.max(0.6, lightAt(s, X)), 0);
            if (cowSt === 2) {
              const r = Math.max(16, hc * 0.22), yy = Y - hc - r * 1.6 - Math.abs(Math.sin(T * 8)) * r * 0.4;
              c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8; c.drawImage(K.gR, X - r * 3, yy - r * 3, r * 6, r * 6); c.globalCompositeOperation = 'source-over';
              c.globalAlpha = 1; c.beginPath(); c.arc(X, yy, r, 0, 7); c.fillStyle = '#ff3346'; c.fill(); c.lineWidth = Math.max(2, r * 0.15); c.strokeStyle = '#fff'; c.stroke();
              c.fillStyle = '#fff'; c.font = `800 ${Math.round(r * 1.5)}px 'Nunito', sans-serif`; c.textAlign = 'center'; c.fillText('!', X, yy + r * 0.52);
            }
          }
        }
      }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    }
    function lampGlow(c, ob, X, Y, hpx, clip, alpha) {
      const v2 = V[ob.n], wpx = hpx * v2.w / v2.h, hl = ob.lamp;
      const hx = X + (ob.f ? -1 : 1) * (hl[0] - ob.a) * wpx, hy = Y - hpx + hl[1] * hpx;
      if (hy > clip) return;
      c.globalCompositeOperation = 'lighter';
      const r1 = hpx * (0.5 + fogNow * 0.45 + rainNow * 0.2), r2 = hpx * 0.12;
      c.globalAlpha = alpha * (0.75 + fogNow * 0.2); c.drawImage(K.gW, hx - r1, hy - r1, r1 * 2, r1 * 2);
      c.globalAlpha = alpha; c.drawImage(K.gW, hx - r2, hy - r2, r2 * 2, r2 * 2);
      // cono de luz que cae (se ve con niebla o lluvia)
      const k = 0.08 + fogNow * 0.18 + rainNow * 0.12;
      c.globalAlpha = alpha * k; c.drawImage(K.stW, hx - hpx * 0.28, hy, hpx * 0.56, hpx * 0.95);
      c.globalCompositeOperation = 'source-over';
    }
    function drawBal(c, s, alpha) {
      const sc = s.p1.s, h = 0.95 * MT * sc * KX; if (h < 2.5 || s.p1.Y > s.clip + 2) return;
      const w = Math.max(1.2, h * 0.13), Y = s.p1.Y;
      for (const sd of sides) {
        const X = s.p1.X + sc * sd * 1.13 * ROADW * KX, Lt = lightAt(s, X);
        c.globalAlpha = alpha; c.fillStyle = '#4b5068'; c.fillRect(X - w / 2, Y - h, w, h);
        if (Lt > 0.05) { c.globalAlpha = alpha * Lt; c.fillStyle = '#e9e9ef'; c.fillRect(X - w / 2, Y - h, w, h); }
        c.globalAlpha = alpha; c.fillStyle = '#121318'; c.fillRect(X - w / 2, Y - h * 0.84, w, h * 0.2);
        c.fillStyle = sd > 0 ? '#ff9a2a' : '#e8eefc'; c.fillRect(X - w * 0.3, Y - h * 0.8, w * 0.6, h * 0.11);
        if (Lt > 0.15) {
          const g = h * 0.75 * Lt; c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * Lt;
          c.drawImage(sd > 0 ? K.gA : K.gH, X - g, Y - h * 0.75 - g, g * 2, g * 2); c.globalCompositeOperation = 'source-over';
        }
      }
    }
    function drawOncoming(c, cr, X, Y, sc, alpha, clip) {
      const w = 1.85 * MT * sc * KX, h = 1.5 * MT * sc * KX; if (w < 2) return;
      if (Y - h * 0.5 > clip) return;
      c.save();
      c.globalAlpha = alpha;
      // carrocería oscura
      c.fillStyle = '#0c0e15';
      c.beginPath(); c.roundRect(X - w / 2, Y - h * 0.6, w, h * 0.5, w * 0.06); c.fill();
      c.beginPath(); c.moveTo(X - w * 0.42, Y - h * 0.58); c.lineTo(X - w * 0.32, Y - h); c.lineTo(X + w * 0.32, Y - h); c.lineTo(X + w * 0.42, Y - h * 0.58); c.closePath(); c.fill();
      c.fillStyle = '#1b2540'; c.beginPath(); c.moveTo(X - w * 0.36, Y - h * 0.62); c.lineTo(X - w * 0.29, Y - h * 0.93); c.lineTo(X + w * 0.29, Y - h * 0.93); c.lineTo(X + w * 0.36, Y - h * 0.62); c.closePath(); c.fill();
      c.fillStyle = '#07080c'; c.fillRect(X - w * 0.46, Y - h * 0.14, w * 0.16, h * 0.14); c.fillRect(X + w * 0.3, Y - h * 0.14, w * 0.16, h * 0.14);
      c.fillStyle = '#20232c'; c.fillRect(X - w * 0.2, Y - h * 0.36, w * 0.4, h * 0.1);
      // faros y deslumbre
      const dz = Math.max(1, cr.z - pos), close = clamp(1 - dz / (DRAW * SEG * 0.7), 0, 1), fl = cr.flash > 0 && Math.sin(T * 30) > 0 ? 1.6 : 1;
      c.globalCompositeOperation = 'lighter';
      for (const sd of sides) {
        const hx = X + sd * w * 0.33, hy = Y - h * 0.4;
        c.globalAlpha = alpha; c.fillStyle = '#fff6dc'; c.beginPath(); c.ellipse(hx, hy, w * 0.075, h * 0.045, 0, 0, 7); c.fill();
        const g = w * (0.55 + close * 0.9) * fl; c.globalAlpha = alpha * 0.9; c.drawImage(K.gH, hx - g, hy - g, g * 2, g * 2);
      }
      // destello anamórfico (muy de peli)
      const fw = w * (2.5 + close * 5) * fl, fh = Math.max(3, w * 0.1);
      c.globalAlpha = alpha * (0.35 + close * 0.4); c.drawImage(K.gC, X - fw, Y - h * 0.4 - fh, fw * 2, fh * 2);
      c.restore();
      c.globalCompositeOperation = 'source-over';
      if (close > 0.75 && !cr.passed) { c.save(); idW(c); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (close - 0.75) * 0.6; c.fillStyle = '#c8d6ff'; c.fillRect(0, 0, W, H); c.restore(); setW(c); }
    }

    function drawFog(c) {
      const k = Math.min(1, 0.16 + fogNow * 0.8 + rainNow * 0.12);
      c.globalAlpha = k; c.drawImage(K.fog, -220, HY - 330, W + 440, 760);
      if (fogNow > 0.12) {
        c.globalAlpha = fogNow * 0.22; c.fillStyle = 'rgb(118,128,156)'; c.fillRect(-220, -220, W + 440, H + 440);
        for (const p of puffs) {
          const sc = CAMD / p.z, X = W / 2 + sc * (p.x - px) * ROADW * KX, Y = HY + sc * (CAMH - p.y * MT) * KX, s = sc * p.s * MT * KX;
          const fade = clamp((p.z - PZ * 1.2) / (PZ * 2), 0, 1) * clamp((DRAW * SEG * 0.9 - p.z) / (DRAW * SEG * 0.3), 0, 1);
          if (fade <= 0.01 || s > 1500 || X + s < -200 || X - s > W + 200) continue;
          c.globalAlpha = fogNow * 0.42 * fade; c.drawImage(K.blob, X - s, Y - s * 0.45, s * 2, s * 0.9);
        }
      }
      c.globalAlpha = 1;
      // luces azules del control al final del primer tramo
      if (!o.cow && pos / D > 0.84) {
        const se = segs[Math.min(NS - 1, fin)];
        let X, Y, sc;
        if (se.fr === frame && se.p1.cz > CAMD) { X = se.p1.X; Y = se.p1.Y; sc = se.p1.s; }
        else { const l = ord[cnt - 1]; X = l.p1.X; Y = l.p1.Y; sc = l.p1.s; }
        const on = Math.floor(T * 6) % 2, g = Math.max(26, sc * 2400 * KX);
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = 0.9; c.drawImage(K.gB, X + (on ? -1 : 1) * g * 0.5 - g, Y - g * 0.7 - g, g * 2, g * 2);
        c.globalAlpha = 0.5; c.drawImage(K.gB, X + (on ? 1 : -1) * g * 0.5 - g * 0.7, Y - g * 0.7 - g * 0.7, g * 1.4, g * 1.4);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      }
    }

    function drawCar(c) {
      const vc = V.peugeot; if (!vc) return;
      const carH = 268, k = carH / vc.h, carW = vc.w * k;
      const off = Math.abs(px) > 1.12;
      const bounce = Math.sin(T * 23) * 1.2 * (v / VMAX) + (off ? rnd(-3, 3) : 0) + (bumpT > 0 ? Math.sin(bumpT * 40) * 6 : 0);
      const cx = W / 2 + wheelVis * 16, cy = 992 + bounce;
      idW(c, shX * 0.3, shY * 0.3);
      c.globalAlpha = 0.6; c.drawImage(K.shadow, cx - carW * 0.62, cy - 36, carW * 1.24, 64);
      // reflejo rojo de los pilotos en el asfalto mojado (más al frenar)
      const wetR = (0.25 + 0.75 * rainNow) * (inBrake || cowSt === 3 || (finishing && v > 1) ? 1 : 0.45);
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * wetR;
      c.drawImage(K.gR, cx - carW * 0.95, cy - 70, carW * 1.9, 120);
      for (const sd of sides) { c.globalAlpha = 0.55 * wetR; c.drawImage(K.stR, cx + sd * carW * 0.36 - 22, cy - 40, 44, 90); }
      c.globalCompositeOperation = 'source-over';
      c.translate(cx, cy); c.rotate(-wheelVis * 0.028 + roll * 0.4);
      c.globalAlpha = 1; c.drawImage(vc.n[0], -carW / 2, -carH, carW, carH);
      c.globalAlpha = clamp(0.28 + lampNow * 0.7, 0, 1); c.drawImage(vc.l[0], -carW / 2, -carH, carW, carH);
      // pilotos traseros (más fuertes al frenar)
      const br = inBrake || cowSt === 3 || (finishing && v > 1) ? 1 : 0;
      c.globalCompositeOperation = 'lighter';
      for (const sd of sides) {
        const lx = sd * 120 * k, ly = -(vc.h - 120) * k;
        const r = 40 + br * 46;
        c.globalAlpha = 0.5 + br * 0.5; c.drawImage(K.gR, lx - r, ly - r, r * 2, r * 2);
        c.globalAlpha = 0.55 + br * 0.45; c.drawImage(K.gR, lx - 30, ly - 9, 60, 18);
      }
      if (br) { const hy = -(vc.h - 44) * k; c.globalAlpha = 0.95; c.drawImage(K.gR, -52, hy - 9, 104, 18); c.globalAlpha = 0.4; c.drawImage(K.gR, -90, hy - 40, 180, 80); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      idW(c);
    }

    function drawRain(c) {
      if (rainNow < 0.03) return;
      idW(c);
      const n = Math.round(drops.length * rainNow), k = 0.022;
      c.lineCap = 'round';
      c.beginPath();
      for (let i = 0; i < n; i++) { const d = drops[i]; if (d.big) continue; c.moveTo(d.x, d.y); c.lineTo(d.x - d.vx * k, d.y - d.vy * k); }
      c.globalAlpha = 0.32; c.strokeStyle = '#b4c6ee'; c.lineWidth = 1.5; c.stroke();
      c.beginPath();
      for (let i = 0; i < n; i++) { const d = drops[i]; if (!d.big) continue; c.moveTo(d.x, d.y); c.lineTo(d.x - d.vx * k * 1.3, d.y - d.vy * k * 1.3); }
      c.globalAlpha = 0.42; c.lineWidth = 2.6; c.stroke();
      c.globalAlpha = 1;
    }
    function shade(c, a) {
      // K.shade mide 500 de alto: arriba 0..80 (16 %) y abajo 360..500 (72 %..100 %)
      c.globalAlpha = a; c.drawImage(K.shade, 0, 0, 4, 80, 0, 0, W, 160); c.drawImage(K.shade, 0, 360, 4, 140, 0, H - 280, W, 280); c.globalAlpha = 1;
    }
    function drawLines(c, sp) {
      if (!lines.length) return;
      const want = clamp((sp - 0.36) / 0.64, 0, 1);
      // a mucha velocidad, los bordes se oscurecen (efecto túnel) y las rayas resaltan
      if (want > 0.03) { shade(c, want * 0.7); idW(c); }
      c.fillStyle = '#eef4ff'; c.globalCompositeOperation = 'lighter';
      for (let b = 0; b < 3; b++) {
        c.beginPath(); let any = false;
        for (const l of lines) {
          const al = Math.min(1, l.al * (0.3 + 0.7 * want) * (l.top ? 1 : 0.75) * clamp((l.d - l.d0) / 120 + 0.25, 0, 1));
          if (Math.min(2, (al * 3) | 0) !== b) continue;
          const ca = Math.cos(l.a), sa = Math.sin(l.a), len = (120 + 760 * sp * sp) * (0.6 + l.d / 900), wd = l.w * (1.5 + sp * 3.2);
          const x1 = W / 2 + ca * l.d, y1 = HY + sa * l.d, x2 = W / 2 + ca * (l.d + len), y2 = HY + sa * (l.d + len);
          c.moveTo(x1, y1); c.lineTo(x2 - sa * wd, y2 + ca * wd); c.lineTo(x2 + sa * wd, y2 - ca * wd); c.closePath(); any = true;
        }
        if (any) { c.globalAlpha = (b + 0.7) / 3; c.fill(); }
      }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    function drawParts(c) {
      for (const q of parts) {
        const k = q.t / q.max;
        if (q.k === 'dirt') { c.globalAlpha = 1 - k; c.fillStyle = q.c; c.fillRect(q.x, q.y, 6, 6); }
        else { c.globalAlpha = (1 - k) * 0.22; c.drawImage(K.blob, q.x - q.s, q.y - q.s * 0.5, q.s * 2, q.s); }
      }
      c.globalAlpha = 1;
    }

    /* ---------------- interfaz ---------------- */
    const HC = {};
    function hudCv(name, w, h, key, fn) {
      let e = HC[name];
      if (!e) { const [cv, x] = mk(w, h); e = HC[name] = { cv, x, key: null }; }
      if (e.key !== key) { e.key = key; e.x.setTransform(1, 0, 0, 1, 0, 0); e.x.globalAlpha = 1; e.x.globalCompositeOperation = 'source-over'; e.x.clearRect(0, 0, w, h); fn(e.x); }
      return e.cv;
    }
    let progG = null;
    function drawHud(c) {
      const prog = clamp(pos / D, 0, 1), rx = 24, ry = 20, rw = 660, rh = 106;
      const kmS = (KM * (1 - prog)).toFixed(1).replace('.', ',') + ' km', fl = Math.round(sustoFlash * 8);
      const rc = hudCv('ruta', rw + 8, rh + 8, kmS + '|' + sustos + '|' + Math.round(prog * 440) + '|' + fl, (x) => { x.translate(4 - rx, 4 - ry); routePanel(x, prog, kmS); });
      c.drawImage(rc, rx - 4, ry - 4);
      // velocímetro
      drawSpeedo(c, 1460, 150);
      // Ramis y compañía
      drawBubble(c);
      // controles
      drawWheel(c);
      drawPedals(c);
      // carteles
      drawBanners(c, prog);
      // +1 susto y demás
      pops.forEach((p, i) => {
        const k = p.t / 1.4, sc = 1 + 0.4 * Math.max(0, 1 - p.t * 6);
        c.save(); c.globalAlpha = Math.min(1, (1 - k) * 2); c.translate(W / 2, 470 - p.t * 60 + (pops.length - 1 - i) * 56); c.scale(sc, sc);
        c.font = "800 46px 'Nunito', sans-serif"; c.textAlign = 'center'; c.lineWidth = 8; c.strokeStyle = 'rgba(0,0,0,0.6)'; c.strokeText(p.txt, 0, 0);
        c.fillStyle = p.col; c.fillText(p.txt, 0, 0); c.restore();
      });
    }
    function routePanel(c, prog, kmS) {
      const rx = 24, ry = 20, rw = 660, rh = 106;
      glass(c, rx, ry, rw, rh, 22, 0.5);
      c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.font = "800 15px 'Nunito', sans-serif"; c.fillStyle = 'rgba(150,190,255,0.9)'; c.fillText(o.cow ? 'ÚLTIMO TRAMO · N-550' : 'RUMBO A CALDOFRAN · N-550', rx + 22, ry + 28);
      c.font = "800 26px 'Nunito', sans-serif"; c.fillStyle = '#ffffff'; c.fillText(LABEL, rx + 22, ry + 58, 400);
      const bx = rx + 22, by = ry + 76, bw = 440;
      if (!progG || progG.c !== c) { progG = c.createLinearGradient(bx, 0, bx + bw, 0); progG.c = c; progG.addColorStop(0, '#45d6ff'); progG.addColorStop(0.6, '#8f7bff'); progG.addColorStop(1, '#ff6fae'); }
      c.beginPath(); c.roundRect(bx, by, bw, 10, 5); c.fillStyle = 'rgba(255,255,255,0.14)'; c.fill();
      c.beginPath(); c.roundRect(bx, by, Math.max(10, bw * prog), 10, 5); c.fillStyle = progG; c.fill();
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8; c.drawImage(K.gC, bx + bw * prog - 22, by + 5 - 22, 44, 44); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      c.beginPath(); c.arc(bx + bw * prog, by + 5, 7, 0, 7); c.fillStyle = '#fff'; c.fill();
      c.textAlign = 'right'; c.font = "800 22px 'Nunito', sans-serif"; c.fillStyle = '#ffffff';
      c.fillText(kmS, bx + bw, ry + 58);
      // sustos
      const sx = rx + 500, sw = 140;
      c.beginPath(); c.roundRect(sx, ry + 12, sw, rh - 24, 16);
      c.fillStyle = sustoFlash > 0 ? `rgba(255,60,80,${0.15 + sustoFlash * 0.45})` : 'rgba(255,255,255,0.06)'; c.fill();
      c.lineWidth = 1.5; c.strokeStyle = sustoFlash > 0 ? 'rgba(255,120,130,0.8)' : 'rgba(255,255,255,0.14)'; c.stroke();
      c.textAlign = 'center'; c.font = "800 14px 'Nunito', sans-serif"; c.fillStyle = 'rgba(255,190,200,0.9)'; c.fillText('SUSTOS', sx + sw / 2, ry + 36);
      const sk = 1 + sustoFlash * 0.35;
      c.save(); c.translate(sx + sw / 2, ry + 78); c.scale(sk, sk); c.font = "800 40px 'Nunito', sans-serif"; c.fillStyle = sustos ? '#ff7a88' : '#ffffff'; c.fillText(String(sustos), 0, 0); c.restore();
    }
    function drawSpeedo(c, x, y) {
      c.drawImage(K.speedo, x - 140, y - 140);
      const vs = v, a0 = SA0, a = a0 + SSW * clamp(vs / 180, 0, 1);
      const col = vs < 90 ? '#4fe3ff' : vs < 130 ? '#ffd34f' : '#ff4f6a';
      c.lineCap = 'round'; c.strokeStyle = col;
      if (vs > 1) {
        c.globalCompositeOperation = 'lighter';
        c.globalAlpha = 0.22; c.lineWidth = 16; c.beginPath(); c.arc(x, y, 112, a0, a); c.stroke();
        c.globalAlpha = 1; c.lineWidth = 5; c.beginPath(); c.arc(x, y, 112, a0, a); c.stroke();
        c.globalCompositeOperation = 'source-over';
      }
      const nx = Math.cos(a), ny = Math.sin(a);
      c.globalAlpha = 0.35; c.strokeStyle = '#ff6a3c'; c.lineWidth = 9; c.beginPath(); c.moveTo(x - nx * 12, y - ny * 12); c.lineTo(x + nx * 96, y + ny * 96); c.stroke();
      c.globalAlpha = 1; c.strokeStyle = '#ff7448'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(x - nx * 12, y - ny * 12); c.lineTo(x + nx * 98, y + ny * 98); c.stroke();
      c.beginPath(); c.arc(x, y, 11, 0, 7); c.fillStyle = '#1a2036'; c.fill(); c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.5)'; c.stroke();
      c.textAlign = 'center'; c.font = "800 46px 'Nunito', sans-serif"; c.fillStyle = '#ffffff'; c.fillText(String(Math.round(vs)), x, y + 84);
      c.font = "800 13px 'Nunito', sans-serif"; c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillText('KM/H', x, y + 104);
    }
    function drawBubble(c) {
      const b = cur || prevB; if (!b) return;
      const appear = clamp(b.t / 0.25, 0, 1), vanish = b === cur ? 1 : clamp(1 - b.out / 0.3, 0, 1);
      const fs = small ? 34 : 29, lh = fs + 6;
      c.font = `800 ${fs}px 'Nunito', sans-serif`;
      if (!b.lines) b.lines = wrapLines(c, b.txt, small ? 560 : 520);
      let tw = 0; for (const l of b.lines) tw = Math.max(tw, c.measureText(l).width);
      const x = 24, y = 146, bw = Math.max(260, tw + 150), bh = 46 + b.lines.length * lh, acc = ACC[b.who] || '#ffffff';
      const sc = 0.7 + 0.3 * backOut(appear);
      if (!b.cv) {
        const [cv, bxx] = mk(bw + 12, bh + 12); bxx.translate(6 - x, 6 - y); bubbleArt(bxx, b, x, y, bw, bh, fs, lh); b.cv = cv;
      }
      c.save(); c.globalAlpha = Math.min(1, appear * 1.6) * vanish;
      c.translate(x + 60, y + bh / 2); c.scale(sc, sc); c.translate(-x - 60, -y - bh / 2);
      c.drawImage(b.cv, x - 6, y - 6);
      c.restore();
    }
    function bubbleArt(c, b, x, y, bw, bh, fs, lh) {
      const acc = ACC[b.who] || '#ffffff';
      glass(c, x, y, bw, bh, 26, 0.62);
      c.beginPath(); c.roundRect(x + 108, y + 14, 4, bh - 28, 2); c.fillStyle = acc; c.fill();
      // cara
      const fx = x + 58, fy = y + bh / 2, fr = 48, src = 'faces/' + b.who + '_' + b.mood, im = G.img[src] || G.img['faces/' + b.who + '_normal'];
      c.beginPath(); c.arc(fx, fy, fr + 4, 0, 7); c.fillStyle = acc; c.fill();
      if (im) c.drawImage(faceCv(src, im), fx - fr, fy - fr, fr * 2, fr * 2);
      c.textAlign = 'left';
      c.font = "800 15px 'Nunito', sans-serif"; c.fillStyle = acc; c.fillText((NAMES[b.who] || b.who).toUpperCase() + (b.who === 'ramis' ? ' · DESDE ATRÁS' : ''), x + 128, y + 32);
      c.font = `800 ${fs}px 'Nunito', sans-serif`; c.fillStyle = '#ffffff';
      b.lines.forEach((l, i) => c.fillText(l, x + 128, y + 34 + (i + 1) * lh));
    }
    function drawWheel(c) {
      const act = !!wheel || keys.L || keys.R;
      c.save();
      if (act) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; c.drawImage(K.gC, WX - 200, WY - 200, 400, 400); c.globalCompositeOperation = 'source-over'; }
      c.globalAlpha = act ? 1 : 0.82;
      c.translate(WX, WY); c.rotate(wheelVis * 2.3); c.drawImage(K.wheel, -150, -150); c.restore();
      if (!usedWheel) {
        const k = 0.5 + 0.5 * Math.sin(T * 4);
        c.globalAlpha = 0.5 + 0.5 * k; c.fillStyle = '#9feaff'; c.font = "800 34px 'Nunito', sans-serif"; c.textAlign = 'center';
        c.fillText('◀', WX - 180 - k * 8, WY + 12); c.fillText('▶', WX + 180 + k * 8, WY + 12); c.globalAlpha = 1;
      }
    }
    function pedal(c, r, on, col, glowI, label, vertical) {
      const pr = on ? 0.95 : 1, cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      c.save(); c.translate(cx, cy + (on ? 5 : 0)); c.scale(pr, pr); c.translate(-cx, -cy);
      if (on) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55; c.drawImage(glowI, cx - r.w * 1.2, cy - r.h * 0.9, r.w * 2.4, r.h * 1.8); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
      c.beginPath(); c.roundRect(r.x, r.y, r.w, r.h, 24);
      c.fillStyle = on ? col.replace('A', '0.42') : 'rgba(14,20,40,0.5)'; c.fill();
      c.lineWidth = 2; c.strokeStyle = on ? col.replace('A', '0.95') : 'rgba(255,255,255,0.3)'; c.stroke();
      // estrías de goma
      c.strokeStyle = on ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.13)'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath();
      if (vertical) for (let i = 0; i < 4; i++) { const xx = r.x + 26 + i * (r.w - 52) / 3; c.moveTo(xx, r.y + 26); c.lineTo(xx, r.y + r.h - 62); }
      else for (let i = 0; i < 3; i++) { const yy = r.y + 26 + i * 22; c.moveTo(r.x + 24, yy); c.lineTo(r.x + r.w - 24, yy); }
      c.stroke();
      c.font = "800 22px 'Nunito', sans-serif"; c.textAlign = 'center'; c.fillStyle = on ? '#ffffff' : 'rgba(255,255,255,0.8)'; c.fillText(label, cx, r.y + r.h - 24);
      c.restore();
    }
    function drawPedals(c) {
      const qte = cowSt === 2;
      if (qte) { const k = 0.5 + 0.5 * Math.sin(T * 18); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4 + 0.5 * k; c.drawImage(K.gR, BRK.x - 90, BRK.y - 80, BRK.w + 180, BRK.h + 160); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
      for (const [r, on, col, gl, lab, vert, nm] of [[BRK, inBrake, 'rgba(255,70,80,A)', K.gR, 'FRENO', false, 'pb'], [GAS, inGas, 'rgba(70,255,170,A)', K.gG, 'GAS', true, 'pg']]) {
        const ox = r.x - r.w * 0.75, oy = r.y - r.h * 0.5;
        const cv = hudCv(nm + (on ? 1 : 0), r.w * 2.5, r.h * 2, 'x', (x) => { x.translate(-ox, -oy); pedal(x, r, on, col, gl, lab, vert); });
        c.drawImage(cv, ox, oy);
      }
    }
    function pill(c, txt, x, y, a, col) {
      c.font = "800 24px 'Nunito', sans-serif"; const w = c.measureText(txt).width + 44;
      c.globalAlpha = a; glass(c, x - w / 2, y - 24, w, 48, 24, 0.6);
      c.fillStyle = col || '#ffffff'; c.textAlign = 'center'; c.fillText(txt, x, y + 8); c.globalAlpha = 1;
    }
    function drawBanners(c, prog) {
      // título del tramo
      if (T < 3.6) {
        const a = Math.min(1, T * 2.5) * Math.min(1, (3.6 - T) * 2);
        c.save(); c.globalAlpha = a; c.textAlign = 'center';
        c.font = "800 62px 'Cinzel', serif"; c.lineWidth = 10; c.strokeStyle = 'rgba(5,8,20,0.75)'; c.strokeText(LABEL, W / 2, 322);
        c.fillStyle = '#ffe6a8'; c.fillText(LABEL, W / 2, 322);
        c.font = "800 26px 'Nunito', sans-serif"; c.fillStyle = '#bfe8ff'; c.fillText(KM + ' km hasta ' + (o.cow ? 'el Balneario Acuña' : 'Caldas de Reis') + ' · que Marcos no se duerma', W / 2, 364);
        c.restore();
      }
      // ayuda de controles
      const hintA = T < 9 && !(usedWheel && usedGas && T > 4) ? Math.min(1, T * 2) * Math.min(1, (9 - T) * 1.5) : 0;
      if (hintA > 0.01) {
        pill(c, '◀ Arrastra el volante ▶', WX, WY - 190, hintA, '#9feaff');
        pill(c, 'Mantén GAS · FRENO', (BRK.x + GAS.x + GAS.w) / 2, GAS.y - 46, hintA, '#a8ffd2');
        pill(c, 'Teclado: ← → girar · ↑ gas · ↓ o espacio freno', W / 2, 414, hintA * 0.9, '#d8e2ff');
      }
      // ¡FRENA!
      if (cowSt === 2) {
        const k = 1 + 0.06 * Math.sin(T * 20), r = PROMPT;
        c.save(); c.translate(r.x + r.w / 2, r.y + r.h / 2); c.scale(k, k); c.translate(-r.x - r.w / 2, -r.y - r.h / 2);
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; c.drawImage(K.gR, r.x - 120, r.y - 120, r.w + 240, r.h + 240); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
        c.beginPath(); c.roundRect(r.x, r.y, r.w, r.h, 40); c.fillStyle = 'rgba(150,10,24,0.72)'; c.fill(); c.lineWidth = 3; c.strokeStyle = 'rgba(255,170,170,0.9)'; c.stroke();
        c.textAlign = 'center'; c.font = "800 92px 'Nunito', sans-serif"; c.fillStyle = '#ffffff'; c.fillText('¡FRENA!', W / 2, r.y + 100);
        c.font = "800 22px 'Nunito', sans-serif"; c.fillStyle = '#ffd0d0'; c.fillText('Pisa el freno · ↓ o espacio', W / 2, r.y + 134);
        c.restore();
      }
      // llegada
      if (finishing) {
        const a = Math.min(1, (T - finishing) * 2.5);
        c.save(); c.globalAlpha = a; c.textAlign = 'center';
        c.font = "800 64px 'Cinzel', serif"; c.lineWidth = 10; c.strokeStyle = 'rgba(5,8,20,0.75)';
        const t1 = o.cow ? '¡CALDAS DE REIS!' : '¡CONTROL A LA VISTA!';
        c.strokeText(t1, W / 2, 330); c.fillStyle = '#ffe6a8'; c.fillText(t1, W / 2, 330);
        c.font = "800 30px 'Nunito', sans-serif"; c.fillStyle = sustos ? '#ffb0b8' : '#a8ffd2';
        c.fillText(sustos ? 'Sustos en este tramo: ' + sustos : 'Ni un susto. Marcos, eres un santo.', W / 2, 382);
        c.restore();
      }
    }

    // para las pruebas desde la consola
    m.dbg = {
      jump(k) { pos = clamp(k, 0, 1.2) * D; lastPi = Math.floor((pos + PZ) / SEG); },
      set(q) { if (q.RK) RK = q.RK; if (q.v !== undefined) v = q.v; if (q.px !== undefined) px = q.px; if (q.T !== undefined) T = q.T; if (q.keys) Object.assign(keys, q.keys); },
      bolt() { strike = { t: 0.03, pts: bolt() }; },
      get: () => ({ pos, D, prog: pos / D, v, px, sustos, T, cowSt, fogNow, rainNow, segs: NS, fin, curve: segAt(pos + PZ).curve, ended, kinds, RK }),
    };
    return MG.begin(m);
  };
})();
