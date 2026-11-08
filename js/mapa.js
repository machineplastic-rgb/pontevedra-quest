'use strict';
/* =====================================================================
   v18 · El mapa de Pontevedra (dibujo de JRAR): botón 🗺 arriba a la
   derecha. Salen los sitios por los que ya habéis pasado y se viaja a
   ellos de un toque, sin ir escena por escena.
   Solo funciona en la zona vieja (no en la bodega, la cripta ni de
   camino a Caldas) y no sirve para saltarse nada: el Estrella no deja
   salir sin postre y a la Lume solo se va si ya os dejó pasar el portero.
   ===================================================================== */
const MAPA = (() => {
  // dónde está cada sitio en el dibujo (coordenadas de 1600x1000)
  const SITIOS = [
    { id: 'estrella', n: 'Bar Estrella', i: '🍷', x: 1165, y: 470 },
    { id: 'plaza', n: 'La zona vieja', i: '⛲', x: 930, y: 470 },
    { id: 'calle', n: 'Los soportales', i: '🏛', x: 820, y: 720 },
    { id: 'bareto', n: 'El bareto de Brais', i: '🍺', x: 1000, y: 610 },
    { id: 'pub', n: 'Pub oscuro', i: '🕯', x: 1330, y: 590 },
    { id: 'disco', n: 'Discoteca Lume', i: '🪩', x: 650, y: 590 },
    { id: 'antro', n: 'O Furado', i: '🎸', x: 1200, y: 735 },
    { id: 'ruinas', n: 'Ruinas de Santo Domingo', i: '⛪', x: 545, y: 790 },
    { id: 'alameda', n: 'La Alameda', i: '🌳', x: 250, y: 470 },
    { id: 'parking', n: 'Parking (el Peugeot)', i: '🚗', x: 130, y: 690 },
  ];
  const ZONA = SITIOS.map((s) => s.id);
  function disponible() {
    if (!S || !G.started || G.mode || S.over || !G.scene || G.scene.noHud) return false;
    if (!S.seen.plaza || S.flags.enRuta || !ZONA.includes(S.scene)) return false;
    if (S.scene === 'estrella' && !S.flags.postresComidos) return false;
    return true;
  }
  const abierto = (s) => !!S.seen[s.id] && (s.id !== 'disco' || !!S.flags.porteroOk) && (s.id !== 'estrella' || !!S.flags.postresComidos);
  let root = null;
  function abrir() {
    if (!disponible() || G.busy) return;
    try { AUDIO.init(); } catch (e) {} sfx('pagina');
    if (!root) {
      root = document.createElement('div'); root.id = 'mapa';
      root.addEventListener('pointerdown', (e) => e.stopPropagation());
      $('stage').appendChild(root);
    }
    closeMenus();
    const pins = SITIOS.map((s) => {
      const ok = abierto(s), aqui = S.scene === s.id;
      return `<button class="mp-pin${ok ? '' : ' off'}${aqui ? ' aqui' : ''}" data-id="${s.id}" style="left:${s.x}px;top:${s.y}px" ${ok && !aqui ? '' : 'disabled'}>
        <span class="mp-i">${ok ? s.i : '?'}</span><span class="mp-n">${aqui ? 'Estáis aquí' : ok ? s.n : '¿?'}</span></button>`;
    }).join('');
    root.innerHTML = `<img class="mp-img" src="img/bg/mapa.webp" alt=""><div class="mp-tit">PONTEVEDRA · de noche</div>${pins}
      <p class="mp-pie">Toca un sitio para ir · los que tienen <b>¿?</b> aún no los habéis visitado</p><button class="mp-x" id="mpX">✕</button>`;
    root.classList.remove('hidden');
    root.querySelectorAll('.mp-pin').forEach((b) => (b.onclick = (e) => {
      e.stopPropagation(); if (b.disabled) return;
      const id = b.dataset.id; cerrar(true); sfx('pasos');
      run(() => goScene(id));
    }));
    $('mpX').onclick = (e) => { e.stopPropagation(); cerrar(); };
  }
  function cerrar(callado) { if (root) root.classList.add('hidden'); if (!callado) sfx('close'); }
  // el botón solo se ve cuando se puede usar
  setInterval(() => { const b = $('bMapa'); if (b) b.classList.toggle('hidden', !disponible()); }, 400);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && root && !root.classList.contains('hidden')) cerrar(); });
  return { abrir, cerrar, disponible };
})();
