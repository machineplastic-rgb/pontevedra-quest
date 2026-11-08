'use strict';
/* =====================================================================
   v24 · La escena final en la piscina del balneario
   La foto de JRAR (los cuatro en el agua) en pequeño, como una Polaroid,
   y al lado el diario de la noche: lo que ha pasado en esta partida, línea
   a línea. Fuera el fondo dibujado con código.
   ===================================================================== */
EXTRA_ASSETS.push('fotos/balneario1');
const DIARIO = () => {
  const L = (k) => S.logros.includes(k), F = (k) => !!S.flags[k], out = [];
  out.push('🍮 Cena en el Bar Estrella y los postres de Doña Maruxa');
  if (L('fisgon')) out.push('🕵 Pillados fisgando en la bodega secreta'); else if (F('bodegaVista')) out.push('🍷 Una bodega secreta detrás del aparador');
  if (F('llavesConfiscadas')) out.push('🔑 Brais se quedó con las llaves del Peugeot');
  if (L('minuto') || F('beso')) out.push('💋 Ángel besó en menos de un minuto');
  if (F('acertijo')) out.push(L('pollo') ? '🐔 Don Xesús se rindió ante un pollo de goma' : '🤺 Un duelo de insultos contra un fantasma');
  if (L('caballero')) out.push('⚔ Nombrados Caballeros de Santo Domingo');
  if (L('meigallo')) out.push('🧙 Unos calzoncillos a cambio de buena suerte');
  if (F('concierto')) out.push('🎸 Ángel cantó punk en O Furado');
  if (L('pista')) out.push('🪩 Reyes de la pista en la Lume');
  if (L('cola')) out.push('🚽 Nos colamos en la cola del baño');
  if (L('foto')) out.push('📸 Sesión de fotos para Intaclub');
  if (L('compana')) out.push('🕯 Escapamos de la Santa Compaña');
  if (L('muuu')) out.push('🐄 Una vaca en mitad de la N-550');
  if (L('camino')) out.push('🐚 Toño llegó andando casi a la vez');
  const fin = S.drunk.marcos === 0 ? '⚖ Y Marcos condujo sereno como un juez' : '🚗 Y Marcos condujo… más o menos sereno';
  return out.slice(0, 11).concat([fin]);
};
if (SCENES.piscina) {
  let fondo = null, lineas = [], t0 = 0;
  SCENES.piscina.setup = function () { lineas = DIARIO(); t0 = G.t; fondo = null; };
  SCENES.piscina.draw = function (c, t) {
    const foto = G.img['fotos/balneario1'];
    // de fondo, la misma foto desenfocada y oscura
    if (!fondo && foto) { fondo = document.createElement('canvas'); fondo.width = 480; fondo.height = 300; const x = fondo.getContext('2d'); const k = Math.max(480 / foto.width, 300 / foto.height); x.filter = 'blur(9px)'; x.drawImage(foto, (480 - foto.width * k) / 2 - 20, (300 - foto.height * k) / 2 - 12, foto.width * k + 40, foto.height * k + 24); x.filter = 'none'; }
    c.fillStyle = '#0b0d16'; c.fillRect(0, 0, W, H);
    if (fondo) { c.save(); c.imageSmoothingEnabled = true; c.drawImage(fondo, -40, -30, W + 80, H + 60); c.restore(); }
    c.fillStyle = 'rgba(8,10,20,.62)'; c.fillRect(0, 0, W, H);
    // la Polaroid
    if (foto) {
      const pw = 600, ph = pw * foto.height / foto.width, k = Math.min(1, (t - t0) / 0.8);
      c.save(); c.translate(400, 400 - (1 - k) * 40); c.rotate(-0.045); c.globalAlpha = k;
      c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 30; c.shadowOffsetY = 10;
      c.fillStyle = '#f4efe2'; c.fillRect(-pw / 2 - 22, -ph / 2 - 22, pw + 44, ph + 110);
      c.shadowColor = 'transparent'; c.drawImage(foto, -pw / 2, -ph / 2, pw, ph);
      c.font = "34px 'Patrick Hand', cursive"; c.fillStyle = '#25305a'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText('Caldofran, 8:00 · Aguas que curan (casi todo)', 0, ph / 2 + 44);
      c.restore();
    }
    // el diario de la noche, línea a línea
    const x0 = 760, a0 = Math.min(1, Math.max(0, (t - t0 - 0.5) / 0.6));
    c.save(); c.globalAlpha = a0; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    c.font = "800 40px 'Cinzel', serif"; c.fillStyle = '#ffd98a'; c.shadowColor = 'rgba(0,0,0,.8)'; c.shadowBlur = 12;
    c.fillText('LA NOCHE DE LOS CABALLEROS', x0, 150);
    c.fillStyle = 'rgba(255,217,138,.6)'; c.fillRect(x0, 168, 760, 3);
    c.font = "28px 'Patrick Hand', cursive";
    lineas.forEach((l, i) => {
      const k = Math.min(1, Math.max(0, (t - t0 - 1.1 - i * 0.55) / 0.4)); if (k <= 0) return;
      c.globalAlpha = k; c.fillStyle = i === lineas.length - 1 ? '#9dffb0' : '#fff6e0';
      c.fillText(l, x0 + (1 - k) * 30, 215 + i * 40);
    });
    c.restore();
  };
}
