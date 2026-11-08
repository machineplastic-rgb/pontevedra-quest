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
    if (nuevo) { guarda(); if (!G.mode) toast('📖', 'Capítulo desbloqueado', nuevo.n + '. ' + nuevo.t); }
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
    G.mode = null; G.started = true;
    buildParty();
    $('hud').classList.remove('hidden');
    await goScene(S.scene, { fast: true });
    card('CAPÍTULO ' + c.n, c.t);
    updObj();
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
    alArrancar, abrir, salir,
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
