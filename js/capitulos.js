'use strict';
/* =====================================================================
   v13 · Capítulos, modo 18+ y salir del juego
   · Los capítulos se desbloquean al llegar a ellos jugando (se guarda en
     el navegador). Si ya terminasteis el juego alguna vez, salen todos.
   · Cada capítulo (menos el 1) empieza con la partida tal y como iría en
     ese punto: CAP_ESTADOS (capitulos_estados.js, sacados de una partida
     de prueba).
   · Terminar un capítulo empezado desde el menú desbloquea el modo 18+:
     frases más picantes y brutas (adulto.js), con aviso de edad.
   ===================================================================== */
const CAPS = [
  { id: 'cena', n: 1, t: 'La cena', sub: 'Bar Estrella y la bodega secreta', bg: 'estrella',
    abre: () => true, fin: (s) => !!s.seen.plaza },
  { id: 'ruta', n: 2, t: 'La ruta de bares', sub: 'La zona vieja, los soportales… y Brais', bg: 'plaza',
    abre: (s) => !!s.seen.plaza, fin: (s) => !!s.flags.llavesConfiscadas },
  { id: 'tesoro', n: 3, t: 'El tesoro de Don Xesús', sub: 'Santo Domingo, la cripta y el duelo', bg: 'cripta',
    abre: (s) => !!s.flags.llavesConfiscadas, fin: (s) => !!s.flags.carteraLlena },
  { id: 'meiga', n: 4, t: 'La meiga de la Alameda', sub: 'Algo dulce y una prenda íntima', bg: 'alameda',
    abre: (s) => !!s.seen.alameda, fin: (s) => !!s.flags.meigallo },
  { id: 'movida', n: 5, t: 'La movida', sub: 'La Lume y O Furado', bg: 'disco',
    abre: (s) => !!(s.seen.disco || s.seen.antro), fin: (s) => !!s.flags.concierto },
  { id: 'caldofran', n: 6, t: 'Rumbo a Caldofran', sub: 'El Peugeot, la carretera y el balneario', bg: 'parking',
    abre: (s) => !!s.flags.llavesDevueltas, fin: (s) => !!(s.over || s.seen.balneario || s.seen.piscina) },
];
const CAP_KEY = 'pq_caps_v1';

const CAPI = (() => {
  let st = { u: { cena: 1 }, adulto: 0, on: 0, edad: 0 };
  try { const v = JSON.parse(localStorage.getItem(CAP_KEY)); if (v && v.u) st = Object.assign(st, v); } catch (e) {}
  const guarda = () => { try { localStorage.setItem(CAP_KEY, JSON.stringify(st)); } catch (e) {} };
  const capDe = (id) => CAPS.find((c) => c.id === id);

  // lo que ya se ha jugado antes de esta versión también cuenta
  function alArrancar() {
    try { if (typeof loadScores === 'function' && loadScores().length) CAPS.forEach((c) => (st.u[c.id] = 1)); } catch (e) {}
    const sv = typeof loadSave === 'function' ? loadSave() : null;
    if (sv) CAPS.forEach((c) => { try { if (c.abre(sv)) st.u[c.id] = 1; } catch (e) {} });
    guarda();
  }
  // cada segundo: capítulos nuevos y capítulo repetido superado
  function vigila() {
    if (TEST || !S || !G.started || !S.flags) return;
    let nuevo = null;
    for (const c of CAPS) { try { if (!st.u[c.id] && c.abre(S)) { st.u[c.id] = 1; nuevo = c; } } catch (e) {} }
    // (el capítulo nuevo ya lo anuncia su escena de «Mientras tanto…»)
    if (nuevo) guarda();
    const c = S.cap && capDe(S.cap);
    if (c && !S.capOk && c.fin(S)) {
      S.capOk = 1;
      if (!st.adulto) {
        st.adulto = 1; guarda();
        setTimeout(() => { if (!G.mode) toast('🔞', 'Modo 18+ desbloqueado', 'actívalo en la portada, en Capítulos'); }, 600);
      } else if (!G.mode) toast('🏁', 'Capítulo superado', c.n + '. ' + c.t);
    }
  }
  setInterval(vigila, 1000);

  /* ---------------- el panel de capítulos ---------------- */
  function panel() {
    let p = $('caps');
    if (!p) { p = document.createElement('div'); p.id = 'caps'; p.className = 'hidden'; $('stage').appendChild(p); }
    const sv = loadSave();
    const tarjetas = CAPS.map((c) => {
      const ok = !!st.u[c.id];
      return `<button class="capc${ok ? '' : ' lock'}" data-id="${c.id}" ${ok ? '' : 'disabled'}>
        <img src="img/bg/${c.bg}.webp" alt="">
        <span class="capn">CAPÍTULO ${c.n}</span>
        <b>${ok ? c.t : '¿?'}</b><small>${ok ? c.sub : '🔒 Sigue jugando para desbloquearlo'}</small></button>`;
    }).join('');
    const adulto = st.adulto
      ? `<button id="capAd" class="gold${st.on ? ' on' : ''}">🔞 Modo 18+: ${st.on ? 'Sí' : 'No'}</button>`
      : `<p class="caphint">🔞 Repite un capítulo hasta el final para desbloquear el modo 18+</p>`;
    p.innerHTML = `<div class="capbox"><h3>Capítulos</h3><div class="capgrid">${tarjetas}</div>
      <div class="capfoot">${adulto}<button id="capBack" class="gold">Volver</button></div>
      <div id="capAsk" class="hidden"></div></div>`;
    p.querySelectorAll('.capc').forEach((b) => (b.onclick = (e) => {
      e.stopPropagation(); const c = capDe(b.dataset.id); if (!c || !st.u[c.id]) return;
      sfx('click');
      if (sv) pregunta(`¿Empezar el capítulo ${c.n}?<br><small>Se sustituye la partida guardada.</small>`, 'Empezar', () => empezar(c));
      else empezar(c);
    }));
    $('capBack').onclick = (e) => { e.stopPropagation(); sfx('close'); cerrar(); };
    if ($('capAd')) $('capAd').onclick = (e) => {
      e.stopPropagation(); sfx('click');
      if (st.on) { st.on = 0; guarda(); panel(); return; }
      if (st.edad) { st.on = 1; guarda(); panel(); return; }
      pregunta('El modo 18+ tiene chistes verdes, tacos y ligoteo subido de tono.<br>¿Tienes 18 años o más?', 'Sí, tengo 18 o más', () => { st.edad = 1; st.on = 1; guarda(); panel(); $('caps').classList.remove('hidden'); }, 'No');
    };
    return p;
  }
  function pregunta(html, si, fn, no) {
    const a = $('capAsk');
    a.innerHTML = `<div class="capq"><p>${html}</p><div><button class="gold" id="capSi">${si}</button><button class="gold" id="capNo">${no || 'Cancelar'}</button></div></div>`;
    a.classList.remove('hidden');
    $('capSi').onclick = (e) => { e.stopPropagation(); sfx('click'); a.classList.add('hidden'); fn(); };
    $('capNo').onclick = (e) => { e.stopPropagation(); sfx('close'); a.classList.add('hidden'); };
  }
  function abrir() { try { AUDIO.init(); } catch (e) {} sfx('open'); $('title').classList.add('hidden'); panel().classList.remove('hidden'); }
  function cerrar() { $('caps').classList.add('hidden'); $('title').classList.remove('hidden'); }

  async function empezar(c) {
    $('caps').classList.add('hidden');
    if (c.id === 'cena') { await startGame(null, 'cena'); return; }
    const base = typeof CAP_ESTADOS !== 'undefined' && CAP_ESTADOS[c.id];
    if (!base) { toast('⚠', 'Capítulo', 'No se ha podido cargar'); $('title').classList.remove('hidden'); return; }
    try { AUDIO.init(); } catch (e) {}
    sfx('click');
    await fadeTo(1, 0.6);
    clearSave();
    S = JSON.parse(JSON.stringify(base));
    S.startT = Date.now(); S.cap = c.id; S.capOk = 0; S.over = false;
    // las escenas de los capítulos anteriores ya «pasaron»; la de este sale ahora
    S.inter = {}; CAPS.forEach((x) => { try { if (x.abre(S)) S.inter[x.id] = 1; } catch (e) {} });
    G.mode = null; G.started = true;
    buildParty();
    $('hud').classList.remove('hidden');
    await interludio(c);
    await goScene(S.scene, { fast: true });
    updObj();
  }

  /* ---------------- «Mientras tanto…»: escenas cortas entre capítulos ----------------
     antes: al entrar por primera vez en esa escena (con la pantalla aún en negro)
     despues: cuando se cumple la condición, al acabar una acción */
  const INTER = {
    ruta: { antes: ['plaza'], bg: 'bareto', music: 'bareto', figs: [['gente', 470, 1.0], ['camarero', 1080, 1.0]], lineas: [
      ['narrador', 'Mientras tanto, en un bareto de los soportales…'],
      ['camarero', 'Sábado, luna llena y Estrella Galicia bien fría. Hoy alguien me deja las llaves del coche en la barra. Lo noto en el codo.'],
      ['gente', 'Tú y tu codo, Brais. La semana pasada dijo que iba a nevar.', 'risa'],
      ['camarero', 'Y nevó. En Lugo, pero nevó.'],
    ] },
    tesoro: { despues: () => !!S.flags.llavesConfiscadas, bg: 'cripta', music: 'cripta', dark: 0.35, figs: [['fantasma', 820, 1.05, { ghost: true }]], lineas: [
      ['narrador', 'Mientras tanto, bajo las ruinas de Santo Domingo…'],
      ['fantasma', 'Trescientos años sin una visita decente. Ni un vino, ni un retrato, ni un duelo como Dios manda…'],
      ['fantasma', '¡Albricias! Huele a vino de barrica… y a caballeros sin blanca. Esta noche, por fin, tengo plan.', 'risa'],
    ] },
    meiga: { antes: ['alameda'], bg: 'estrella', music: 'estrella', figs: [['senora', 800, 1.0]], lineas: [
      ['narrador', 'Mientras tanto, en el Bar Estrella…'],
      ['senora', '¿Pura? Soy yo. Van para la Alameda cuatro rapaces: uno con gafas, uno con barba, uno del Porsche y otro que dibuja.'],
      ['senora', 'Trátamelos bien, que se comieron todos mis postres. Y si te piden algo… pídeles tú primero.', 'risa'],
    ] },
    movida: { antes: ['disco', 'antro'], bg: 'disco', music: 'disco', dark: 0.25, figs: [['dj', 800, 1.0]], lineas: [
      ['narrador', 'Mientras tanto, en la cabina de la discoteca Lume…'],
      ['dj', 'Esta noche tengo algo especial: una canción de cuatro amigos que fueron de viaje…'],
      ['dj', 'Solo la pincho si entran unos Lords de verdad. Y algo me dice que ya vienen.'],
    ] },
    caldofran: { despues: () => !!S.flags.llavesDevueltas, bg: 'balneario', music: 'balneario', figs: [['recep', 800, 1.0]], lineas: [
      ['narrador', 'Mientras tanto, en el Balneario Acuña de Caldas de Reis…'],
      ['recep', 'Reserva a nombre de «Club de Caballeros». Cuatro personas. Llegada prevista: a las once de la noche.'],
      ['recep', 'Son las cinco de la mañana. Bueno… los que vienen de Pontevedra siempre llegan. Tarde, pero llegan.', 'risa'],
    ] },
  };
  function modoViñeta(it) {
    return {
      drunk: 0,
      draw(c, t) {
        const im = G.img['bg/' + it.bg] || (typeof PROC !== 'undefined' && PROC.get && PROC.get(it.bg));
        c.fillStyle = '#05060f'; c.fillRect(0, 0, W, H);
        if (im) { const z = 1.06 + Math.sin(t * 0.2) * 0.02; c.drawImage(im, W / 2 - W * z / 2, H / 2 - H * z / 2, W * z, H * z); }
        c.fillStyle = `rgba(0,0,0,${it.dark || 0.15})`; c.fillRect(0, 0, W, H);
        for (const [id, x, k, o] of it.figs) {
          const s = G.img['chars/' + id]; if (!s) continue;
          const h = 760 * k, w = s.width * h / s.height, y = 1000 + (o && o.ghost ? Math.sin(t * 1.8) * 10 - 40 : 0);
          c.save(); if (o && o.ghost) { c.globalAlpha = 0.85; c.shadowColor = 'rgba(150,215,255,.9)'; c.shadowBlur = 40; }
          c.drawImage(s, x - w / 2, y - h, w, h); c.restore();
        }
        if (vignette) c.drawImage(vignette, 0, 0);
        // el rótulo de cómic
        c.save(); c.font = "800 34px 'Cinzel', serif"; const txt = 'MIENTRAS TANTO…', tw = c.measureText(txt).width;
        c.translate(60, 54); c.rotate(-0.02); c.fillStyle = '#ffe48a'; c.strokeStyle = '#2a1a06'; c.lineWidth = 5;
        c.fillRect(0, 0, tw + 48, 64); c.strokeRect(0, 0, tw + 48, 64);
        c.fillStyle = '#2a1a06'; c.textBaseline = 'middle'; c.fillText(txt, 24, 34); c.restore();
      },
    };
  }
  // la escena entera; empieza y acaba en negro
  async function interludio(c) {
    const it = INTER[c.id]; if (!S) return;
    S.inter = S.inter || {}; S.inter[c.id] = 1;
    if (!it) { await card('CAPÍTULO ' + c.n, c.t, 2200); return; }
    const prev = G.mode, hud = !$('hud').classList.contains('hidden');
    await fadeTo(1, 0.5);
    G.mode = modoViñeta(it); $('hud').classList.add('hidden'); closeMenus();
    music(it.music); ambient(null);
    await fadeTo(0, 0.6);
    for (const [who, txt, mood] of it.lineas) await say(who, txt, mood);
    await fadeTo(1, 0.6);
    G.mode = prev;
    await card('CAPÍTULO ' + c.n, c.t, 2200);
    if (G.scene) { music(G.scene.music || null); ambient(G.scene.ambient || null); }
    if (hud && G.scene && !G.scene.noHud) $('hud').classList.remove('hidden');
  }
  async function antes(sceneId) {
    if (!S) return;
    S.inter = S.inter || {};
    for (const c of CAPS) { const it = INTER[c.id]; if (it && it.antes && it.antes.includes(sceneId) && !S.inter[c.id]) { await interludio(c); return; } }
  }
  async function despues() {
    if (!S || !G.started || G.mode || S.over) return;
    S.inter = S.inter || {};
    for (const c of CAPS) {
      const it = INTER[c.id];
      if (it && it.despues && !S.inter[c.id] && it.despues()) { await interludio(c); await fadeTo(0, 0.6); return; }
    }
  }

  /* ---------------- salir del juego ---------------- */
  function salir() {
    try { save(); } catch (e) {}
    sfx('close');
    try { window.close(); } catch (e) {}
    // si el navegador no deja cerrar la pestaña, despedida
    setTimeout(() => {
      let d = $('bye');
      if (!d) { d = document.createElement('div'); d.id = 'bye'; $('stage').appendChild(d); }
      d.innerHTML = `<div class="byein"><h2>¡Hasta el sábado, caballeros!</h2><p>La partida está guardada. Ya puedes cerrar esta pestaña.</p><button class="gold" id="byeBack">Volver al juego</button></div>`;
      d.classList.remove('hidden');
      try { AUDIO.setMuted(true); } catch (e) {}
      $('byeBack').onclick = (e) => { e.stopPropagation(); d.classList.add('hidden'); try { AUDIO.setMuted(false); AUDIO.init(); } catch (er) {} };
    }, 350);
  }

  return {
    alArrancar, abrir, salir, antes, despues,
    adultoOn: () => !!(st.adulto && st.on && st.edad),
    estado: () => st,
    cambiaAdulto() { if (!st.adulto) return; if (!st.edad) { abrir(); return; } st.on = st.on ? 0 : 1; guarda(); },
  };
})();

/* ---------------- el modo 18+: cambia frases por coincidencia exacta ---------------- */
const ADULTO = (() => {
  const D = typeof ADULTO_DATA !== 'undefined' ? ADULTO_DATA : { frases: {}, idle: {}, insultos: [] };
  return {
    on: () => CAPI.adultoOn(),
    frase: (t) => (CAPI.adultoOn() && D.frases[t]) || t,
    idle: D.idle || {},
    insultos: D.insultos || [],
  };
})();
