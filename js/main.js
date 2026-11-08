'use strict';
/* Arranque: carga, portada, menú y partida */
const VERSION = 'v24';
const FINAL_SCENES = ['control', 'camino', 'balneario', 'piscina'];

function titleMode() {
  return {
    drunk: 0,
    draw(c, t) {
      const im = G.img['bg/titulo'];
      c.fillStyle = '#05060f'; c.fillRect(0, 0, W, H);
      if (im) { const z = 1.02 + Math.sin(t * 0.15) * 0.01; c.drawImage(im, W / 2 - W * z / 2, H / 2 - H * z / 2, W * z, H * z); }
      // brillo de la luna y del agua
      c.save(); c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(1320, 155, 20, 1320, 155, 260); g.addColorStop(0, `rgba(255,240,190,${0.18 + 0.05 * Math.sin(t)})`); g.addColorStop(1, 'rgba(255,240,190,0)');
      c.fillStyle = g; c.fillRect(1000, 0, 600, 450);
      for (let i = 0; i < 26; i++) { const x = (i * 97 + t * 14) % W, y = 820 + (i * 31) % 170; c.globalAlpha = 0.08 + 0.08 * Math.sin(t * 2 + i); c.fillStyle = '#ffd98a'; c.fillRect(x, y, 40 + (i % 4) * 20, 3); }
      c.restore();
      drawParticles(c);
      if (Math.random() < 0.08) emit('star', rnd(0, W), rnd(0, 330), 1);
    },
  };
}

function showTitle() {
  G.started = false; G.scene = null; G.actors = {}; G.particles = [];
  $('hud').classList.add('hidden'); $('dlg').classList.add('hidden'); $('choices').classList.add('hidden'); $('card').classList.add('hidden');
  $('menu').classList.add('hidden'); $('mg').classList.add('hidden');
  G.mode = titleMode();
  const sv = loadSave();
  $('tCont').classList.toggle('hidden', !sv);
  $('title').classList.remove('hidden');
  music('titulo'); ambient(null);
  fadeTo(0, 1);
}

async function startGame(fromSave, capId) {
  try { AUDIO.init(); } catch (e) {}
  sfx('click');
  $('title').classList.add('hidden');
  await fadeTo(1, 0.6);
  if (fromSave) {
    S = fromSave;
    if (FINAL_SCENES.includes(S.scene) || S.flags.enRuta) { S.scene = 'parking'; S.flags.enRuta = 0; }
  } else {
    clearSave(); S = newState();
    if (capId) { S.cap = capId; S.capOk = 0; }   // v13: empezado desde Capítulos
    G.bodegaLeft = 75;
    // la intro con la viñeta: por qué se ven en Pontevedra
    await introSeq();
  }
  G.mode = null; G.started = true;
  buildParty();
  $('hud').classList.remove('hidden');
  await goScene(S.scene, { fast: true });
  if (fromSave) toast('💾', 'Partida cargada', 'Seguís en ' + (SCENES[S.scene].title || 'Pontevedra').toLowerCase());
  updObj();
}

function bindMenus() {
  $('tNew').onclick = (e) => { e.stopPropagation(); startGame(null); };
  $('tCont').onclick = (e) => { e.stopPropagation(); const s = loadSave(); startGame(s); };
  $('bMapa').onclick = (e) => { e.stopPropagation(); if (G.busy || G.mode) return; MAPA.abrir(); };
  $('tGaleria').onclick = (e) => { e.stopPropagation(); GALERIA.abrir(); };
  $('mGaleria').onclick = (e) => { e.stopPropagation(); $('menu').classList.add('hidden'); GALERIA.abrir(); };
  $('tCap').onclick = (e) => { e.stopPropagation(); CAPI.abrir(); };
  $('tExit').onclick = (e) => { e.stopPropagation(); CAPI.salir(); };
  $('mAjustes').onclick = (e) => { e.stopPropagation(); sfx('open'); AJUSTES.vista($('menu').querySelector('.mbox'), () => { bindMenus(); updSoundBtn(); }); };
  $('tAjustes').onclick = (e) => { e.stopPropagation(); try { AUDIO.init(); } catch (er) {} sfx('open'); $('title').classList.add('hidden'); $('menu').classList.remove('hidden'); AJUSTES.vista($('menu').querySelector('.mbox'), () => { bindMenus(); updSoundBtn(); $('menu').classList.add('hidden'); $('title').classList.remove('hidden'); }); };   // v17: la portada tapaba los clics
  $('mExit').onclick = (e) => { e.stopPropagation(); $('menu').classList.add('hidden'); CAPI.salir(); };
  $('mAdult').onclick = (e) => { e.stopPropagation(); sfx('click'); CAPI.cambiaAdulto(); updSoundBtn(); };
  $('tScore').onclick = async (e) => { e.stopPropagation(); try { AUDIO.init(); } catch (er) {} sfx('click'); $('title').classList.add('hidden'); await verMarcador(-1, 'Cerrar'); $('title').classList.remove('hidden'); };
  $('tver').textContent = 'Versión ' + VERSION.replace('v', '');
  $('mver').textContent = 'Pontevedra Quest · versión ' + VERSION.replace('v', '');
  $('bMenu').onclick = (e) => { e.stopPropagation(); sfx('open'); $('menu').classList.remove('hidden'); updSoundBtn(); };
  $('mClose').onclick = (e) => { e.stopPropagation(); sfx('close'); $('menu').classList.add('hidden'); };
  $('mSound').onclick = (e) => { e.stopPropagation(); let m = false; try { m = !AUDIO.isMuted(); AUDIO.setMuted(m); AUDIO.init(); } catch (er) {} updSoundBtn(); sfx('click'); };
  $('mTitle').onclick = async (e) => { e.stopPropagation(); if (G.busy || G.mode) { toast('⏳', 'Un momento', 'Deja que termine la escena'); return; } $('menu').classList.add('hidden'); save(); await fadeTo(1, 0.5); showTitle(); };
  $('mHelp').onclick = (e) => {
    e.stopPropagation();
    const b = $('menu').querySelector('.mbox');
    const old = b.innerHTML;
    b.innerHTML = `<h3>Cómo se juega</h3>
      <p>• En la cripta no se ve nada: la luz del móvil (o del candelabro) sigue al ratón o al dedo. Lo que está a oscuras no se puede tocar.</p>
      <p>• Toca personas y cosas para <b>mirar, hablar o usar</b>. Las flechas doradas son salidas.</p>
      <p>• Abajo eliges con quién juegas. Cada caballero tiene su don: <b>Ángel</b> siente lo místico, <b>Marcos</b>, diseñador de moda y algo friki, se bate en duelo con la lengua y conduce, <b>Marc</b> dibuja y liga, <b>Ramis</b> controla los grifos… y lo que haga falta.</p>
      <p>• 🎒 La bolsa del Club: elige un objeto, pulsa «Usar» y toca dónde. 🔍 La lupa enseña todo lo que se puede tocar.</p>
      <p>• ¿Atascado? Toca a uno de tus amigos y háblale: siempre tiene una idea.</p>
      <p>• La noche está llena de gente: habla con todos. En la discoteca Lume y en O Furado hay logros extra (y un concierto).</p>
      <p>• 📸 Con Marc y su móvil podéis hacer sesiones de fotos para Intaclub (pregunta a Vera, a Gary… o a alguna profe en la Alameda).</p>
      <p>• 🗺 El mapa (arriba) os lleva a cualquier sitio de la zona vieja en el que ya hayáis estado.</p>
      <p>• La barrita de colores es la borrachera. <b>Marcos conduce</b>: que no pase de «Achispado». El café ayuda.</p>
      <button class="gold" id="mBack">Entendido</button>`;
    $('mBack').onclick = (ev) => { ev.stopPropagation(); b.innerHTML = old; bindMenus(); updSoundBtn(); };
  };
  $('rotOk').onclick = (e) => { e.stopPropagation(); G.rotOk = true; fit(); };
}
function updSoundBtn() {
  let m = false; try { m = AUDIO.isMuted(); } catch (e) {} $('mSound').textContent = 'Sonido: ' + (m ? 'No' : 'Sí');
  // v13: el 18+ solo aparece en el menú cuando está desbloqueado y con la edad confirmada
  const st = CAPI.estado(), b = $('mAdult');
  if (b) { b.classList.toggle('hidden', !(st.adulto && st.edad)); b.textContent = '🔞 Modo 18+: ' + (CAPI.adultoOn() ? 'Sí' : 'No'); }
}

async function boot() {
  fit(); makeVignette(); bindInput(); bindMenus();
  requestAnimationFrame(frame);
  const prog = $('lprog');
  await loadImages(assetList(), (k) => { prog.style.width = Math.round(k * 100) + '%'; });
  await loadOptionalBg(['control', 'camino', 'balneario', 'piscina', 'mapa', 'banos', 'banos_lume', 'callejon']);
  CAPI.alArrancar(); GALERIA.alArrancar();
  try { await Promise.race([document.fonts.ready, wait(2500)]); } catch (e) {}
  $('loading').classList.add('hidden');
  // v15: la intro de aventura de los 90 (se salta con un toque)
  if (!TEST && typeof INTRO !== 'undefined') { try { await INTRO.run(); } catch (e) { console.warn('intro', e); G.mode = null; } }
  showTitle();
}
// el audio necesita un toque para arrancar
addEventListener('pointerdown', () => { try { AUDIO.init(); } catch (e) {} }, { once: false, passive: true });
boot();
