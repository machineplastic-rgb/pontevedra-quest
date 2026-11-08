'use strict';
/* =====================================================================
   v13 · La linterna: la bodega y la cripta, a oscuras
   Una escena con `oscuro: { a, luces() }` se pinta casi negra. Solo se
   ve donde hay luz: velas y faroles de la escena, un poco alrededor de
   los cuatro y la luz que lleváis vosotros, que sigue al ratón o al dedo:
   · el móvil: haz frío y estrecho que sale de la mano de quien juegas
   · el candelabro (si está en la bolsa): luz cálida, ancha y temblona
   Lo que está a oscuras no se puede tocar: con el dedo, el primer toque
   en la oscuridad lleva la luz hasta allí.
   ===================================================================== */
const LUZ = (() => {
  const HW = W / 2, HH = H / 2;           // la oscuridad se pinta a media resolución (bordes suaves y más rápido)
  let dk = null, dx = null;
  let lx = null, ly = null, tx = 0, ty = 0, sceneOf = null, manual = false;

  function cfg() { const sc = G.scene; return sc && sc.oscuro && (!sc.oscuro.cond || sc.oscuro.cond()) ? sc.oscuro : null; }
  function activa() { return !!(cfg() && G.started && !G.mode && S); }
  const vela = () => has('candelabro');
  const radio = () => (vela() ? 280 : 200);

  // de dónde sale el haz del móvil: la mano de quien juegas
  function mano() {
    const a = G.actors[S.active], bb = a && a.visible !== false && actorBox(a);
    if (!bb) return null;
    return { x: bb.x + bb.w * (a.flip ? 0.3 : 0.7), y: bb.y + bb.h * 0.42 };
  }
  function ponerAlInicio() {
    const m = mano();
    tx = m ? m.x + 170 : W / 2; ty = m ? m.y - 40 : H / 2;
    lx = tx; ly = ty; manual = false;
  }
  function mover(p) { tx = p.x; ty = p.y; manual = true; }

  // todas las luces de la escena en este momento
  function fuentes() {
    const sc = G.scene, c = cfg(), t = G.t, out = [];
    for (const f of sc.fx || []) {
      if (f.cond && !f.cond()) continue;
      if (f.type === 'glow') out.push({ x: f.x, y: f.y, r: f.r * 0.95, a: Math.min(0.95, (f.a || 0.35) * 2.2) });
      else if (f.type === 'candle') out.push({ x: f.x, y: f.y, r: f.r * 1.35 * (0.93 + 0.07 * noise1((t + (f.seed || 0)) * 5)), a: 0.85 });
      else if (f.type === 'beam') for (let k = 0.25; k <= 1; k += 0.25) out.push({ x: f.x0 + (f.x1 - f.x0) * k, y: f.y0 + (f.y1 - f.y0) * k, r: (f.w0 + (f.w1 - f.w0) * k) * 1.2, a: 0.55 });
    }
    if (c.luces) for (const l of c.luces()) out.push(l);
    // los cuatro se intuyen
    for (const id of PROTA) {
      const a = G.actors[id], bb = a && a.visible !== false && actorBox(a);
      if (bb) out.push({ x: a.x, y: bb.y + bb.h * 0.45, r: bb.h * 0.42, a: id === S.active ? 0.42 : 0.28 });
    }
    // la vuestra
    if (lx !== null) {
      const fl = vela() ? 0.92 + 0.08 * noise1(t * 7) : 1;
      out.push({ x: lx, y: ly, r: radio() * fl, a: vela() ? 0.97 : 0.98, mia: true });
    }
    return out;
  }
  function nivel(p) {
    let v = 0;
    for (const s of fuentes()) {
      const d = Math.hypot(p.x - s.x, p.y - s.y);
      const k = d < s.r * 0.5 ? 1 : d > s.r ? 0 : 1 - (d - s.r * 0.5) / (s.r * 0.5);
      v = Math.max(v, k * s.a);
    }
    return v;
  }
  function lit(p) { return !activa() || nivel(p) > 0.45; }

  function draw(c) {
    const o = cfg();
    if (!o || !S) return;
    if (sceneOf !== G.sceneId || lx === null) { sceneOf = G.sceneId; ponerAlInicio(); }
    // la luz va detrás del dedo con un poco de inercia
    const k = Math.min(1, G.dt * 12); lx += (tx - lx) * k; ly += (ty - ly) * k;
    if (!dk) { dk = document.createElement('canvas'); dk.width = HW; dk.height = HH; dx = dk.getContext('2d'); }
    dx.globalCompositeOperation = 'source-over';
    dx.clearRect(0, 0, HW, HH);
    dx.fillStyle = `rgba(3,4,10,${o.a || 0.9})`; dx.fillRect(0, 0, HW, HH);
    dx.globalCompositeOperation = 'destination-out';
    for (const s of fuentes()) {
      const g = dx.createRadialGradient(s.x / 2, s.y / 2, 0, s.x / 2, s.y / 2, s.r / 2);
      g.addColorStop(0, `rgba(0,0,0,${s.a})`); g.addColorStop(0.5, `rgba(0,0,0,${s.a * 0.8})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      dx.fillStyle = g; dx.beginPath(); dx.arc(s.x / 2, s.y / 2, s.r / 2, 0, Math.PI * 2); dx.fill();
    }
    // el haz del móvil, de la mano a la mancha de luz
    const m = !vela() && mano();
    if (m && Math.hypot(lx - m.x, ly - m.y) > 60) {
      const ang = Math.atan2(ly - m.y, lx - m.x), n = ang + Math.PI / 2, w0 = 6, w1 = radio() * 0.75;
      const g = dx.createLinearGradient(m.x / 2, m.y / 2, lx / 2, ly / 2);
      g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0.35)');
      dx.fillStyle = g; dx.beginPath();
      dx.moveTo((m.x + Math.cos(n) * w0) / 2, (m.y + Math.sin(n) * w0) / 2);
      dx.lineTo((lx + Math.cos(n) * w1) / 2, (ly + Math.sin(n) * w1) / 2);
      dx.lineTo((lx - Math.cos(n) * w1) / 2, (ly - Math.sin(n) * w1) / 2);
      dx.lineTo((m.x - Math.cos(n) * w0) / 2, (m.y - Math.sin(n) * w0) / 2);
      dx.closePath(); dx.fill();
    }
    c.drawImage(dk, 0, 0, W, H);
    // el color de la luz
    c.save(); c.globalCompositeOperation = 'lighter';
    const r = radio(), g = c.createRadialGradient(lx, ly, 0, lx, ly, r);
    if (vela()) { g.addColorStop(0, 'rgba(255,190,100,0.22)'); g.addColorStop(1, 'rgba(255,150,60,0)'); }
    else { g.addColorStop(0, 'rgba(210,230,255,0.16)'); g.addColorStop(1, 'rgba(160,200,255,0)'); }
    c.fillStyle = g; c.fillRect(lx - r, ly - r, r * 2, r * 2);
    c.restore();
    // con el candelabro en la mano, se ve el candelabro (las llamas, donde apunta)
    if (vela() && manual) {
      const im = G.img['items/candelabro'];
      if (im) { const h = 104, w = im.width * h / im.height; c.save(); c.globalAlpha = 0.92; c.drawImage(im, lx - w / 2, ly - h * 0.12, w, h); c.restore(); }
    }
  }

  // un toque: si cae en la oscuridad, primero va la luz hasta allí
  function toque(p) {
    if (!activa()) return false;
    if (lit(p)) { mover(p); return false; }
    const hit = pickAt(p);
    const libre = hit && (hit.kind === 'exit' || (hit.kind === 'actor' && (isProta(hit.a.id) || hit.a.id === 'fantasma')));
    mover(p);
    if (libre) return false;
    emit('spark', p.x, p.y, 3);
    return true;   // ese toque solo mueve la luz
  }
  return { activa, lit, mover, toque, draw };
})();
