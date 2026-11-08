'use strict';
/* =====================================================================
   v16 · «Intaclub» (antes Pontegram): la galería de logros y fotos, como el perfil de una
   red social dentro de un móvil. Cada logro es una publicación (con su
   foto de la noche si la tiene), con likes, corazones y comentarios de
   la gente del juego. Los logros se guardan entre partidas.
   ===================================================================== */
const GALERIA = (() => {
  const KEY = 'pq_pgram_v1';
  let st = { got: {}, likes: {} };
  try { const v = JSON.parse(localStorage.getItem(KEY)); if (v && v.got) st = Object.assign(st, v); } catch (e) {}
  const guarda = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
  function gana(id) { if (!st.got[id]) { st.got[id] = Date.now(); guarda(); } }
  function alArrancar() { const sv = typeof loadSave === 'function' ? loadSave() : null; if (sv && sv.logros) sv.logros.forEach(gana); }

  // cada logro: foto(s) de los créditos, texto y comentarios [quién, texto]
  const POST = {
    maceta: { f: ['maceta'], c: [['senora', '¿Y por qué huele mi maceta a orujo? 🌿'], ['marcos', 'Sereno como un juez 😇']] },
    postre: { f: ['postre'], c: [['senora', '¡Comed, rapaces, que estáis en los huesos! 🍮'], ['angel', 'Te quiero, Maruxa ❤️']] },
    fisgon: { f: ['fisgon'], c: [['senora', 'FISGONES 👀'], ['ramis', 'Estábamos inventariando, señora']] },
    minuto: { f: ['beso'], c: [['chica', 'Cincuenta y dos segundos. Lo cronometré ⏱'], ['marc', 'Envidia sana. Bueno… sana.']] },
    lupanar: { f: ['lupanar'], c: [['fantasma', '¡Serrallo! ¡Lupanar! ¡Volved cuando queráis! 👻'], ['dj', 'Ese fantasma baila mejor que vosotros']] },
    caballero: { f: ['caballero'], c: [['fantasma', 'Os nombro caballeros. No me dejéis en mal lugar ⚔'], ['ramis', 'Yo al menos podré decir que he vivido']] },
    plata: { f: ['duelo'], c: [['fantasma', 'Trescientos años sin que nadie me contestara así 🤺'], ['marcos', 'Nivel veinte de esgrima. En la Play.']] },
    calzon: { f: ['calzon'], c: [['meiga', 'Graciñas polo agasallo 🔮'], ['ramis', 'Eran mis gayumbos de la suerte…']] },
    meigallo: { f: ['meigallo'], c: [['meiga', 'A sorte vai convosco ✨'], ['angel', 'Lo noto. Lo noto aquí.']] },
    vivido: { f: ['selfie'], c: [['ramis', 'Habiendo haber podido… 🍻'], ['carla', 'Esto es contenido de calidad 🔥']] },
    compana: { f: ['compana'], c: [['meiga', '¡Círculo de sal, carallo! 🧂'], ['angel', 'Os dije que se notaba algo']] },
    muuu: { f: ['muuu'], c: [['guiri', 'Cow! Big cow! 🐄'], ['marcos', 'Frené a tiempo. De nada.']] },
    sereno: { f: ['control'], c: [['gc2', 'Circulen 🚓'], ['marcos', 'Cero coma cero 😎']] },
    caldofran: { f: ['piscina', 'albornoz', 'hamacas', 'brindis'], c: [['recep', 'Reserva para las once de la noche… y llegasteis a las ocho ♨'], ['senora', '¡Secaos bien el pelo, rapaces!']] },
    joven: { f: ['joven'], c: [['portero', 'DNI, chaval 🪪'], ['marcos', 'Que tengo más de cuarenta, oiga']] },
    pillaria: { f: ['pillaria'], c: [['rosa', 'Ramis, yo te pillaría y… 😏'], ['ramis', 'Habiendo haber podido…']] },
    porche: { f: ['porche'], c: [['ramis', 'Un PORSCHE. Un 911. No un porche.'], ['guiri', 'Nice porch! 🏡']] },
    ligon: { f: ['ligon'], c: [['vera', '¿Y mi retrato para cuándo? ✏'], ['lua', 'Me dibujó guapísima 💜']] },
    pista: { f: ['pista'], c: [['dj', 'Reyes de la pista 🪩'], ['noa', 'Ese Ramis se mueve como un Porsche']] },
    canero: { f: ['canero'], c: [['tino', 'PUNK NOT DEAD 🤘'], ['xurxo', '¡Ángel, qué papá más cañero!']] },
    apostol: { f: ['apostol'], c: [['iago', 'Nike Apóstol, ¿me firmas el dado? 🎲'], ['marcos', 'Nunca falla una tirada']] },
    camino: { f: ['camino'], c: [['peregrino', '¡Ultreia! Llegué casi a la vez que el Peugeot 🐚'], ['marcos', 'Empate técnico']] },
    reinas: { f: [], c: [['rosa', 'Las reinas de la noche 👑'], ['monos', 'Ramis, otra canción, rey']] },
    madrugada: { f: [], c: [['dj', '¿Quién sigue en pie? 🌙'], ['carla', 'Directo de madrugada 📲']] },
  };
  const NICK = { ramis: 'ramis911', marc: 'marc_manara', marcos: 'nike_apostol', angel: 'angel_elbarbas', senora: 'dona_maruxa', fantasma: 'don_xesus_1714',
    meiga: 'meiga_pura', guiri: 'gary_in_galicia', peregrino: 'tono_ultreia', dj: 'dj_raxo', tino: 'tino_ofurado', vera: 'vera_retratos', lua: 'lua.baila',
    noa: 'noa_profe', chica: 'a_do_pub', rosa: 'dalia_reina', monos: 'valeria_reina', iago: 'iago_rol', portero: 'ruben_porta', xurxo: 'xurxo_pena',
    gc2: 'sargento_seoane', recep: 'recepcion_balneario', carla: 'carlaviral' };
  const HIGHLIGHTS = [['Estrella', 'estrella', 'cena'], ['Bodega', 'bodega', 'cena'], ['Cripta', 'cripta', 'tesoro'], ['Lume', 'disco', 'movida'], ['Alameda', 'alameda', 'meiga'], ['Caldofran', 'balneario', 'caldofran']];
  const hash = (s) => { let h = 7; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); };
  const likesDe = (id) => 140 + (hash(id) % 1700) + (st.likes[id] ? 1 : 0);
  const fmt = (n) => n.toLocaleString('es-ES');

  /* ---------- las fotos: se pintan con los dibujos de los créditos, a todo color ---------- */
  const cache = new Map();
  function foto(fid) {
    if (cache.has(fid)) return cache.get(fid);
    const f = typeof CRED !== 'undefined' && CRED.FOTOS.find((x) => x.id === fid); if (!f) return null;
    const c = document.createElement('canvas'); c.width = 760; c.height = 570; const x = c.getContext('2d');
    try {
      if (f.foto) { const im = G.img[f.foto]; if (im) { const k = Math.max(760 / im.width, 570 / im.height), w = im.width * k, h = im.height * k; x.drawImage(im, (760 - w) / 2, (570 - h) / 2, w, h); } }
      else f.draw(x);
    } catch (e) { x.fillStyle = '#222'; x.fillRect(0, 0, 760, 570); }
    // un filtro cálido, de los de la app
    x.save(); x.globalCompositeOperation = 'soft-light'; x.fillStyle = 'rgba(255,170,90,0.35)'; x.fillRect(0, 0, 760, 570); x.restore();
    cache.set(fid, c); return c;
  }
  function tarjetaEmoji(id) {
    const key = 'emoji_' + id; if (cache.has(key)) return cache.get(key);
    const c = document.createElement('canvas'); c.width = 760; c.height = 570; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 760, 570); g.addColorStop(0, '#f9ce34'); g.addColorStop(0.5, '#ee2a7b'); g.addColorStop(1, '#6228d7');
    x.fillStyle = g; x.fillRect(0, 0, 760, 570);
    x.font = '220px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(LOGROS[id].i, 380, 240);
    x.font = "800 40px 'Cinzel', serif"; x.fillStyle = '#fff'; x.shadowColor = 'rgba(0,0,0,.4)'; x.shadowBlur = 10;
    const t = LOGROS[id].t, ws = t.split(' '); let l = '', ls = [];
    for (const w of ws) { const tt = l ? l + ' ' + w : w; if (x.measureText(tt).width > 680 && l) { ls.push(l); l = w; } else l = tt; } ls.push(l);
    ls.slice(0, 2).forEach((s, i) => x.fillText(s, 380, 440 + i * 50));
    cache.set(key, c); return c;
  }
  function imagenes(id) { const p = POST[id]; const fs = p && p.f.length ? p.f.map(foto).filter(Boolean) : []; return fs.length ? fs : [tarjetaEmoji(id)]; }
  function captionDe(id) {
    const p = POST[id], f = p && p.f[0] && typeof CRED !== 'undefined' && CRED.FOTOS.find((x) => x.id === p.f[0]);
    let cap = ''; try { cap = f ? f.cap() : ''; } catch (e) {}
    return (cap || LOGROS[id].t) + ' ' + LOGROS[id].i;
  }
  const horaDe = (id) => { const p = POST[id], f = p && p.f[0] && typeof CRED !== 'undefined' && CRED.FOTOS.find((x) => x.id === p.f[0]); return f ? f.h : '04:20'; };
  const avatar = (who) => `img/faces/${who}_normal.webp`;

  // borroso que funciona en todos los navegadores: se encoge mucho y se vuelve a estirar
  function borroso(x, src, w, h, n) {
    const m = document.createElement('canvas'); m.width = n; m.height = Math.max(1, Math.round(n * h / w));
    const mx = m.getContext('2d'); mx.imageSmoothingEnabled = true; mx.drawImage(src, 0, 0, m.width, m.height);
    x.save(); x.imageSmoothingEnabled = true; x.drawImage(m, 0, 0, w, h); x.fillStyle = 'rgba(10,10,20,0.55)'; x.fillRect(0, 0, w, h); x.restore();
  }
  /* ---------- la pantalla ---------- */
  let root = null, vistaPost = null;
  function ids() { return Object.keys(LOGROS); }
  function abrir() {
    try { AUDIO.init(); } catch (e) {} sfx('open');
    if (!root) {
      root = document.createElement('div'); root.id = 'pgram';
      root.addEventListener('pointerdown', (e) => e.stopPropagation());
      $('stage').appendChild(root);
    }
    pinta(); root.classList.remove('hidden');
  }
  function cerrar() { if (root) root.classList.add('hidden'); sfx('close'); }
  function pinta() {
    const all = ids(), got = all.filter((id) => st.got[id]), u = (typeof CAPI !== 'undefined' && CAPI.estado().u) || {};
    const segu = 1714 + got.length * 137 + Object.keys(st.likes).length;
    root.innerHTML = `<div class="pg-phone">
      <div class="pg-status"><span>03:14</span><span>📶 🔋 14%</span></div>
      <div class="pg-top"><b class="pg-logo">Intaclub</b><span class="pg-icons">♡ &nbsp;✉</span></div>
      <div class="pg-scroll">
        <div class="pg-head">
          <div class="pg-av">${['ramis', 'marc', 'marcos', 'angel'].map((p) => `<img src="img/faces/${p}_risa.webp" alt="">`).join('')}</div>
          <div class="pg-stats"><div><b>${got.length}</b><span>publicaciones</span></div><div><b>${fmt(segu)}</b><span>seguidores</span></div><div><b>4</b><span>seguidos</span></div></div>
        </div>
        <div class="pg-bio"><b>Club de Caballeros 🍺⚔</b><br>Mallorquines por el mundo · Bachillerato artístico<br>Habiendo haber podido, no quisimos poder 🍷<br>📍 Pontevedra ✈ Caldofran · <i>Nunca más… hasta el sábado</i></div>
        <div class="pg-btns"><span class="pg-b on">Siguiendo ✓</span><span class="pg-b">Mensaje</span></div>
        <div class="pg-hl">${HIGHLIGHTS.map(([n, bg, cap]) => `<div class="pg-h${u[cap] ? '' : ' off'}" data-bg="${bg}" data-n="${n}"><span><img src="img/bg/${bg}.webp" alt=""></span><small>${n}</small></div>`).join('')}</div>
        <div class="pg-tabs"><span class="on">▦</span><span>🏆 ${got.length}/${all.length}</span></div>
        <div class="pg-grid">${all.map((id) => `<div class="pg-cell${st.got[id] ? '' : ' lock'}" data-id="${id}">${st.got[id] ? (POST[id] && POST[id].f.length > 1 ? '<i class="pg-multi">❐</i>' : '') : `<em>🔒</em>`}</div>`).join('')}</div>
        <p class="pg-pie">${got.length < all.length ? 'Seguid jugando: cada logro es una publicación nueva.' : '¡Perfil completo! Sois unos influencers.'}</p>
      </div>
      <div id="pgPost" class="hidden"></div><div id="pgStory" class="hidden"></div>
    </div><button class="pg-x" id="pgX">✕</button>`;
    // miniaturas
    root.querySelectorAll('.pg-cell').forEach((cell) => {
      const id = cell.dataset.id, im = st.got[id] ? imagenes(id)[0] : imagenes(id)[0];
      const t = document.createElement('canvas'); t.width = 240; t.height = 240; const x = t.getContext('2d');
      const s = Math.min(im.width, im.height); x.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 240, 240);
      if (!st.got[id]) borroso(x, t, 240, 240, 10);
      cell.prepend(t);
      cell.onclick = (e) => { e.stopPropagation(); sfx('click'); post(id); };
    });
    root.querySelectorAll('.pg-h').forEach((h) => (h.onclick = (e) => { e.stopPropagation(); if (h.classList.contains('off')) { sfx('error'); return; } historia(h.dataset.bg, h.dataset.n); }));
    $('pgX').onclick = (e) => { e.stopPropagation(); cerrar(); };
  }

  function post(id) {
    const box = $('pgPost'), ok = !!st.got[id], ims = imagenes(id), p = POST[id] || { c: [] };
    let idx = 0;
    box.innerHTML = `<div class="pg-ph"><span class="pg-back" id="pgBack">‹</span><b>Publicaciones</b></div>
      <div class="pg-pscroll">
        <div class="pg-pu"><img src="img/faces/ramis_risa.webp" alt=""><div><b>clubdecaballeros</b><small>Pontevedra · ${horaDe(id)}</small></div></div>
        <div class="pg-img" id="pgImg"><canvas width="760" height="570"></canvas>${ok ? '<i class="pg-heart" id="pgHeart">♥</i>' : `<div class="pg-lock"><b>🔒 Publicación privada</b><span>Se desbloquea con el logro<br>«${LOGROS[id].t}»</span></div>`}
          ${ok && ims.length > 1 ? `<div class="pg-dots">${ims.map((_, i) => `<i class="${i ? '' : 'on'}"></i>`).join('')}</div>` : ''}</div>
        ${ok ? `<div class="pg-acts"><span id="pgLike" class="${st.likes[id] ? 'on' : ''}">${st.likes[id] ? '♥' : '♡'}</span><span>💬</span><span>✈</span><span class="pg-save">🔖</span></div>
        <div class="pg-likes" id="pgLikes">Le gusta a <b>${NICK[p.c[0] ? p.c[0][0] : 'carla']}</b> y <b>${fmt(likesDe(id) - 1)} personas más</b></div>
        <div class="pg-cap"><b>clubdecaballeros</b> ${captionDe(id)} <span class="pg-tags">#ClubDeCaballeros #Pontevedra #NuncaMásHastaElSábado</span></div>
        <div class="pg-com">${p.c.map(([w, t]) => `<div><img src="${avatar(w)}" alt=""><p><b>${NICK[w] || w}</b> ${t}</p><i>♡</i></div>`).join('')}</div>
        <small class="pg-when">Toca dos veces la foto para darle like</small>` : ''}
      </div>`;
    box.classList.remove('hidden');
    const cv = box.querySelector('canvas'), x = cv.getContext('2d');
    const dibuja = () => { x.clearRect(0, 0, 760, 570); x.drawImage(ims[idx], 0, 0, 760, 570); if (!ok) borroso(x, cv, 760, 570, 14); };
    dibuja();
    $('pgBack').onclick = (e) => { e.stopPropagation(); sfx('close'); box.classList.add('hidden'); pinta(); };
    if (!ok) return;
    const like = (forzar) => {
      if (st.likes[id] && !forzar) delete st.likes[id]; else st.likes[id] = 1;
      guarda(); sfx(st.likes[id] ? 'logro' : 'click');
      $('pgLike').textContent = st.likes[id] ? '♥' : '♡'; $('pgLike').classList.toggle('on', !!st.likes[id]);
      $('pgLikes').innerHTML = `Le gusta a <b>${NICK[p.c[0] ? p.c[0][0] : 'carla']}</b> y <b>${fmt(likesDe(id) - 1)} personas más</b>`;
    };
    $('pgLike').onclick = (e) => { e.stopPropagation(); like(false); };
    let lastTap = 0;
    $('pgImg').onclick = (e) => {
      e.stopPropagation();
      const now = performance.now(), r = cv.getBoundingClientRect();
      if (now - lastTap < 350) {   // doble toque: corazón grande
        const h = $('pgHeart'); h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop'); like(true); lastTap = 0; return;
      }
      lastTap = now;
      if (ims.length > 1) {          // carrusel: toque a un lado o al otro
        setTimeout(() => { if (lastTap !== now) return; idx = (idx + (e.clientX - r.left > r.width / 2 ? 1 : ims.length - 1)) % ims.length; dibuja(); box.querySelectorAll('.pg-dots i').forEach((d, i) => d.classList.toggle('on', i === idx)); }, 360);
      }
    };
  }

  function historia(bg, nombre) {
    const box = $('pgStory');
    box.innerHTML = `<div class="pg-sbar"><i></i></div><div class="pg-su"><img src="img/faces/marcos_risa.webp" alt=""><b>clubdecaballeros</b><small>${nombre}</small></div>
      <img class="pg-simg" src="img/bg/${bg}.webp" alt=""><div class="pg-stxt">${nombre} 📍</div>`;
    box.classList.remove('hidden'); sfx('open');
    const fin = () => { box.classList.add('hidden'); clearTimeout(tm); };
    const tm = setTimeout(fin, 4200);
    box.onclick = (e) => { e.stopPropagation(); fin(); };
  }

  addEventListener('keydown', (e) => { if (e.key === 'Escape' && root && !root.classList.contains('hidden')) cerrar(); });
  return { gana, alArrancar, abrir, cerrar, estado: () => st };
})();
