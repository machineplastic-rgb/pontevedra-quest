'use strict';
/* =====================================================================
   v14 · Ajustes: volumen de música, ambiente y efectos por separado y
   velocidad del texto. Se guardan en el navegador (pq_ajustes_v1).
   ===================================================================== */
const AJUSTES = (() => {
  const KEY = 'pq_ajustes_v1';
  const aj = { music: 0.8, ambient: 0.75, sfx: 0.9, texto: 1 };
  try { Object.assign(aj, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
  const guarda = () => { try { localStorage.setItem(KEY, JSON.stringify(aj)); } catch (e) {} };
  function aplica() {
    try { AUDIO.setVolumes({ music: aj.music, ambient: aj.ambient, sfx: aj.sfx }); } catch (e) {}
    G.textoK = aj.texto;
  }
  aplica();
  // el audio arranca con el primer toque: entonces se vuelven a aplicar los volúmenes
  addEventListener('pointerdown', () => setTimeout(aplica, 80), { once: true, passive: true });

  const VEL = [['Lenta', 1.6], ['Normal', 1], ['Rápida', 0.45]];
  const fila = (k, nombre) => `<label class="ajrow"><span>${nombre}</span><input type="range" min="0" max="100" step="5" value="${Math.round(aj[k] * 100)}" data-k="${k}"><b>${Math.round(aj[k] * 100)}</b></label>`;
  // pinta los ajustes dentro de la caja del menú; al volver, deja la caja como estaba
  function vista(box, alVolver) {
    const old = box.innerHTML;
    box.innerHTML = `<h3>Ajustes</h3>
      ${fila('music', 'Música')}${fila('ambient', 'Ambiente')}${fila('sfx', 'Efectos y voces')}
      <div class="ajrow"><span>Texto</span><div class="ajseg">${VEL.map(([n, v]) => `<button data-v="${v}" class="${aj.texto === v ? 'on' : ''}">${n}</button>`).join('')}</div></div>
      <button class="gold" id="ajBack">Volver</button>`;
    box.querySelectorAll('input[type=range]').forEach((r) => {
      r.oninput = () => { aj[r.dataset.k] = r.value / 100; r.nextElementSibling.textContent = r.value; aplica(); guarda(); };
      r.onchange = () => { if (r.dataset.k === 'sfx') sfx('moneda'); };
      r.onpointerdown = (e) => e.stopPropagation();
    });
    box.querySelectorAll('.ajseg button').forEach((b) => (b.onclick = (e) => {
      e.stopPropagation(); aj.texto = +b.dataset.v; aplica(); guarda(); sfx('click');
      box.querySelectorAll('.ajseg button').forEach((x) => x.classList.toggle('on', x === b));
    }));
    $('ajBack').onclick = (e) => { e.stopPropagation(); sfx('close'); box.innerHTML = old; alVolver(); };
  }
  return { vista, aplica };
})();
