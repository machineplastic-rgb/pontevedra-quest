'use strict';
/* =====================================================================
   Fondos dibujados por código para los sitios que aún no tienen
   ilustración (control de la Guardia Civil, camino de las ánimas,
   balneario y piscina). Si existe img/bg/<nombre>.webp se usa la imagen.
   ===================================================================== */
const PROC = (() => {
  const cache = {};
  let noisePat = null;
  function noise(c) {
    if (!noisePat) {
      const n = document.createElement('canvas'); n.width = n.height = 256; const x = n.getContext('2d');
      const d = x.createImageData(256, 256);
      for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 18; }
      x.putImageData(d, 0, 0); noisePat = c.createPattern(n, 'repeat');
    }
    return noisePat;
  }
  function grain(c) { c.save(); c.globalCompositeOperation = 'overlay'; c.fillStyle = noise(c); c.fillRect(0, 0, W, H); c.restore(); }
  function lin(c, x0, y0, x1, y1, stops) { const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, col]) => g.addColorStop(o, col)); return g; }
  function ink(c, w) { c.lineWidth = w || 4; c.strokeStyle = 'rgba(12,10,20,0.85)'; c.lineJoin = 'round'; c.stroke(); }
  function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
  function hills(c, y, amp, col, seed, step) {
    const r = rng(seed); c.beginPath(); c.moveTo(0, H); c.lineTo(0, y);
    let yy = y; for (let x = 0; x <= W + step; x += step) { yy = y + (r() - 0.5) * amp + Math.sin(x / 260 + seed) * amp * 0.6; c.lineTo(x, yy); }
    c.lineTo(W, H); c.closePath(); c.fillStyle = col; c.fill(); ink(c, 3);
  }
  function stars(c, n, y1, seed) { const r = rng(seed); for (let i = 0; i < n; i++) { c.fillStyle = `rgba(255,250,230,${0.3 + r() * 0.7})`; const s = r() < 0.1 ? 3 : 2; c.fillRect(r() * W, r() * y1, s, s); } }
  function moon(c, x, y, r) {
    const g = c.createRadialGradient(x, y, r * 0.6, x, y, r * 4); g.addColorStop(0, 'rgba(255,245,200,0.35)'); g.addColorStop(1, 'rgba(255,245,200,0)');
    c.fillStyle = g; c.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = '#fff3c4'; c.fill(); ink(c, 3);
    c.fillStyle = 'rgba(200,180,120,0.35)'; [[-0.3, -0.2, 0.22], [0.25, 0.15, 0.16], [-0.05, 0.35, 0.12]].forEach(([dx, dy, rr]) => { c.beginPath(); c.arc(x + dx * r, y + dy * r, rr * r, 0, 7); c.fill(); });
  }
  function pine(c, x, y, h, col) {
    c.beginPath(); c.moveTo(x, y - h);
    for (let i = 0; i <= 6; i++) { const yy = y - h + (h * 0.85) * i / 6, w = 8 + i * h * 0.045; c.lineTo(x + w, yy + h * 0.06); c.lineTo(x + w * 0.4, yy + h * 0.06); }
    c.lineTo(x + 5, y); c.lineTo(x - 5, y);
    for (let i = 6; i >= 0; i--) { const yy = y - h + (h * 0.85) * i / 6, w = 8 + i * h * 0.045; c.lineTo(x - w * 0.4, yy + h * 0.06); c.lineTo(x - w, yy + h * 0.06); }
    c.closePath(); c.fillStyle = col; c.fill(); ink(c, 2.5);
  }
  function euca(c, x, y, h, col, r) {
    c.beginPath(); c.moveTo(x - 6, y); c.lineTo(x - 3, y - h * 0.7); c.lineTo(x + 3, y - h * 0.7); c.lineTo(x + 6, y); c.closePath(); c.fillStyle = '#2a2420'; c.fill(); ink(c, 2);
    for (let i = 0; i < 7; i++) { const yy = y - h * 0.55 - r() * h * 0.45, xx = x + (r() - 0.5) * h * 0.32, rr = h * (0.08 + r() * 0.07);
      c.beginPath(); c.ellipse(xx, yy, rr * 1.3, rr, 0, 0, 7); c.fillStyle = col; c.fill(); ink(c, 2); }
  }

  /* ---------- control de la Guardia Civil ---------- */
  function control() {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    c.fillStyle = lin(c, 0, 0, 0, 600, [[0, '#070a22'], [0.6, '#16204a'], [1, '#2d3466']]); c.fillRect(0, 0, W, H);
    stars(c, 160, 420, 11); moon(c, 1330, 130, 46);
    hills(c, 470, 50, '#141a3a', 3, 80); hills(c, 520, 40, '#0f1430', 7, 60);
    const r = rng(5);
    for (let x = -20; x < W; x += 34 + r() * 50) euca(c, x, 575 + r() * 10, 140 + r() * 120, r() > 0.5 ? '#14301f' : '#183824', r);
    // cuneta y hierba
    c.fillStyle = lin(c, 0, 560, 0, H, [[0, '#13261a'], [1, '#0b170f']]); c.fillRect(0, 560, W, H);
    // carretera en perspectiva
    const vx = 800, vy = 565;
    c.beginPath(); c.moveTo(vx - 30, vy); c.lineTo(vx + 30, vy); c.lineTo(W + 500, H); c.lineTo(-500, H); c.closePath();
    c.fillStyle = lin(c, 0, vy, 0, H, [[0, '#2a2c3a'], [1, '#3a3c48']]); c.fill(); ink(c, 3);
    c.strokeStyle = 'rgba(240,240,240,0.85)'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(vx - 26, vy); c.lineTo(-380, H); c.moveTo(vx + 26, vy); c.lineTo(W + 380, H); c.stroke();
    for (let i = 0; i < 12; i++) { const k0 = Math.pow(i / 12, 2), k1 = Math.pow((i + 0.5) / 12, 2); const y0 = vy + (H - vy) * k0, y1 = vy + (H - vy) * k1;
      c.fillStyle = 'rgba(240,240,240,0.8)'; c.beginPath(); c.moveTo(vx - 1 - 6 * k0, y0); c.lineTo(vx + 1 + 6 * k0, y0); c.lineTo(vx + 1 + 6 * k1, y1); c.lineTo(vx - 1 - 6 * k1, y1); c.fill(); }
    // quitamiedos
    c.strokeStyle = '#9aa3b5'; c.lineWidth = 6; c.beginPath(); c.moveTo(vx + 60, vy + 2); c.lineTo(W, 760); c.stroke();
    for (let i = 0; i < 9; i++) { const k = i / 8; const x = vx + 60 + (W - vx - 60) * k, y = vy + 2 + (760 - vy - 2) * k; c.fillStyle = '#6e7688'; c.fillRect(x - 2, y, 4 + k * 6, 10 + k * 40); }
    // señal azul de carretera
    c.fillStyle = '#5b5f6e'; c.fillRect(214, 330, 10, 250); c.fillRect(356, 330, 10, 250);
    c.beginPath(); c.roundRect(170, 250, 240, 120, 10); c.fillStyle = '#1d4fb0'; c.fill(); ink(c, 4);
    c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.roundRect(180, 260, 220, 100, 6); c.stroke();
    c.fillStyle = '#fff'; c.font = "bold 34px 'Nunito', sans-serif"; c.textAlign = 'center'; c.fillText('N-550', 290, 300); c.font = "bold 26px 'Nunito', sans-serif"; c.fillText('Caldas de Reis  9', 290, 342);
    // señal de ALTO de la Guardia Civil
    c.fillStyle = '#5b5f6e'; c.fillRect(1262, 420, 10, 190);
    c.beginPath(); c.arc(1267, 400, 62, 0, 7); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 14; c.strokeStyle = '#c8222a'; c.stroke(); ink(c, 3);
    c.fillStyle = '#111'; c.font = "bold 30px 'Nunito', sans-serif"; c.fillText('ALTO', 1267, 396); c.font = "bold 15px 'Nunito', sans-serif"; c.fillText('GUARDIA CIVIL', 1267, 420);
    // conos
    for (let i = 0; i < 6; i++) { const k = i / 5, x = 1040 - k * 260, y = 690 + k * 220, s = 0.6 + k * 0.8; cone(c, x, y, s); }
    grain(c);
    return cv;
  }
  function cone(c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.beginPath(); c.moveTo(-34, 0); c.lineTo(34, 0); c.lineTo(28, -10); c.lineTo(-28, -10); c.closePath(); c.fillStyle = '#222'; c.fill();
    c.beginPath(); c.moveTo(-24, -10); c.lineTo(24, -10); c.lineTo(6, -84); c.lineTo(-6, -84); c.closePath(); c.fillStyle = '#ff6a1a'; c.fill(); ink(c, 3);
    c.fillStyle = '#f4f4f4'; c.beginPath(); c.moveTo(-17, -36); c.lineTo(17, -36); c.lineTo(13, -52); c.lineTo(-13, -52); c.closePath(); c.fill();
    c.restore();
  }

  /* ---------- camino de las ánimas ---------- */
  function camino() {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    c.fillStyle = lin(c, 0, 0, 0, 560, [[0, '#04050f'], [0.7, '#101833'], [1, '#1d2747']]); c.fillRect(0, 0, W, H);
    stars(c, 90, 300, 21); moon(c, 1180, 110, 38);
    // nubes delante de la luna
    c.fillStyle = 'rgba(30,36,70,0.85)'; [[1120, 130, 160, 34], [1250, 100, 140, 26], [980, 90, 120, 22]].forEach(([x, y, w, h]) => { c.beginPath(); c.ellipse(x, y, w, h, 0, 0, 7); c.fill(); });
    hills(c, 500, 40, '#0e1328', 9, 70);
    const r = rng(17);
    for (let x = -30; x < W; x += 50 + r() * 70) pine(c, x, 540 + r() * 10, 120 + r() * 120, '#0c1a14');
    c.fillStyle = lin(c, 0, 520, 0, H, [[0, '#121a1a'], [1, '#0a0f0d']]); c.fillRect(0, 520, W, H);
    // camino de tierra
    const vx = 760, vy = 540;
    c.beginPath(); c.moveTo(vx - 20, vy); c.lineTo(vx + 20, vy); c.lineTo(1150, H); c.lineTo(330, H); c.closePath();
    c.fillStyle = lin(c, 0, vy, 0, H, [[0, '#2c2a2a'], [1, '#4a4136']]); c.fill(); ink(c, 3);
    // muros de piedra a los lados
    wall(c, vx - 24, vy, 330, H, -1, 31); wall(c, vx + 24, vy, 1150, H, 1, 47);
    // carballo retorcido
    oak(c, 1390, 860, 1.25); oak(c, 150, 820, 1.0);
    grain(c);
    return cv;
  }
  function wall(c, x0, y0, x1, y1, side, seed) {
    const r = rng(seed);
    for (let i = 0; i < 26; i++) {
      const k = Math.pow(i / 26, 1.7), k2 = Math.pow((i + 1) / 26, 1.7);
      const xa = x0 + (x1 - x0) * k, ya = y0 + (y1 - y0) * k, xb = x0 + (x1 - x0) * k2, yb = y0 + (y1 - y0) * k2;
      const hgt = 14 + 160 * k2, rows = 3;
      for (let rr = 0; rr < rows; rr++) {
        const sy = yb - hgt * (rr + 1) / rows, sh = hgt / rows;
        const xs = side < 0 ? Math.min(xa, xb) - 60 * k2 * 4 : Math.min(xa, xb);
        const w = Math.abs(xb - xa) + 60 * k2 * 4;
        c.beginPath(); c.roundRect(xs + (r() - 0.5) * 6, sy, w, sh - 2, 6 + k2 * 10);
        const v = 48 + r() * 30; c.fillStyle = `rgb(${v},${v + 4},${v + 10})`; c.fill(); ink(c, 2 + k2 * 2);
        c.fillStyle = 'rgba(80,110,70,0.35)'; if (r() > 0.6) { c.beginPath(); c.ellipse(xs + w * r(), sy + 3, w * 0.25, 4 + k2 * 5, 0, 0, 7); c.fill(); }
      }
    }
  }
  function oak(c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.beginPath(); c.moveTo(-30, 0); c.bezierCurveTo(-20, -120, -60, -200, -20, -300); c.lineTo(10, -300); c.bezierCurveTo(-20, -200, 30, -120, 34, 0); c.closePath();
    c.fillStyle = '#17120f'; c.fill(); ink(c, 3);
    c.beginPath(); c.moveTo(-20, -260); c.bezierCurveTo(-100, -300, -160, -280, -220, -330); c.lineWidth = 16; c.strokeStyle = '#17120f'; c.stroke();
    c.beginPath(); c.moveTo(0, -280); c.bezierCurveTo(80, -330, 120, -300, 190, -360); c.stroke();
    const r = rng(x | 0);
    for (let i = 0; i < 16; i++) { c.beginPath(); c.ellipse((r() - 0.5) * 420, -330 - r() * 160, 50 + r() * 50, 30 + r() * 30, 0, 0, 7); c.fillStyle = r() > 0.5 ? '#0d1a12' : '#112018'; c.fill(); ink(c, 2); }
    c.restore();
  }

  /* ---------- balneario Acuña al amanecer ---------- */
  function balneario() {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    c.fillStyle = lin(c, 0, 0, 0, 640, [[0, '#2b2f6e'], [0.45, '#8a5a92'], [0.8, '#f09a78'], [1, '#ffd08a']]); c.fillRect(0, 0, W, H);
    const sg = c.createRadialGradient(1250, 520, 10, 1250, 520, 380); sg.addColorStop(0, 'rgba(255,230,160,0.9)'); sg.addColorStop(1, 'rgba(255,200,120,0)'); c.fillStyle = sg; c.fillRect(0, 0, W, H);
    hills(c, 470, 40, '#5b4a78', 4, 90);
    const r = rng(9);
    for (let x = -40; x < W; x += 60 + r() * 60) euca(c, x, 560, 140 + r() * 100, r() > 0.5 ? '#3d4a46' : '#46524c', r);
    // edificio
    const bx0 = 260, bx1 = 1340, top = 250, base = 720;
    c.fillStyle = '#4a3c4a'; c.beginPath(); c.moveTo(bx0 - 20, top + 40); c.lineTo(bx1 + 20, top + 40); c.lineTo(bx1 - 20, top - 10); c.lineTo(bx0 + 20, top - 10); c.closePath(); c.fill(); ink(c, 4);
    c.fillStyle = lin(c, 0, top, 0, base, [[0, '#f6ead6'], [1, '#e2cfb4']]); c.fillRect(bx0, top + 40, bx1 - bx0, base - top - 40); c.strokeRect(bx0, top + 40, bx1 - bx0, base - top - 40);
    c.beginPath(); c.rect(bx0, top + 40, bx1 - bx0, base - top - 40); ink(c, 4);
    // cuerpo central con frontón
    c.fillStyle = '#fbf2e2'; c.beginPath(); c.rect(640, top - 40, 320, base - top + 40); c.fill(); ink(c, 4);
    c.beginPath(); c.moveTo(620, top - 40); c.lineTo(800, top - 130); c.lineTo(980, top - 40); c.closePath(); c.fillStyle = '#f1e4cc'; c.fill(); ink(c, 4);
    c.beginPath(); c.arc(800, top - 70, 22, 0, 7); c.fillStyle = '#d9c49a'; c.fill(); ink(c, 3);
    // rótulo
    c.fillStyle = '#2b3a5e'; c.fillRect(650, top + 8, 300, 50); c.strokeStyle = '#d9b46a'; c.lineWidth = 4; c.strokeRect(654, top + 12, 292, 42);
    c.fillStyle = '#f5d68a'; c.font = "800 23px 'Cinzel', serif"; c.textAlign = 'center'; c.fillText('BALNEARIO ACUÑA', 800, top + 44);
    // ventanas
    for (let fl = 0; fl < 3; fl++) for (let i = 0; i < 12; i++) {
      const x = bx0 + 40 + i * 88; if (x > 600 && x < 980) continue;
      const y = top + 90 + fl * 130; win(c, x, y, 46, 80, r() > 0.45);
    }
    for (let fl = 0; fl < 2; fl++) for (let i = 0; i < 3; i++) win(c, 680 + i * 100, top + 90 + fl * 130, 44, 80, r() > 0.3);
    // columnas y puerta
    for (let i = 0; i < 5; i++) { const x = 655 + i * 72; c.fillStyle = '#fffaf0'; c.fillRect(x, 570, 26, 150); c.beginPath(); c.rect(x, 570, 26, 150); ink(c, 3); }
    c.beginPath(); c.moveTo(760, 720); c.lineTo(760, 620); c.quadraticCurveTo(800, 590, 840, 620); c.lineTo(840, 720); c.closePath(); c.fillStyle = '#ffd98a'; c.fill(); ink(c, 3);
    // explanada y río Umia
    c.fillStyle = lin(c, 0, 720, 0, 880, [[0, '#cdb894'], [1, '#a89474']]); c.fillRect(0, 720, W, 160);
    c.beginPath(); c.rect(0, 720, W, 160); ink(c, 3);
    c.fillStyle = lin(c, 0, 880, 0, H, [[0, '#6a5d8e'], [1, '#2c3566']]); c.fillRect(0, 880, W, H - 880);
    c.strokeStyle = 'rgba(12,10,20,.8)'; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 880); c.lineTo(W, 880); c.stroke();
    // farolas
    [140, 1460].forEach((x) => { c.fillStyle = '#1e1a22'; c.fillRect(x - 5, 520, 10, 210); c.beginPath(); c.roundRect(x - 18, 490, 36, 44, 6); c.fillStyle = '#ffe9a6'; c.fill(); ink(c, 3); });
    grain(c);
    return cv;
  }
  function win(c, x, y, w, h, lit) {
    c.beginPath(); c.roundRect(x, y, w, h, [w / 2, w / 2, 3, 3]); c.fillStyle = lit ? '#ffcf7a' : '#5a6a8a'; c.fill(); ink(c, 3);
    c.strokeStyle = 'rgba(40,30,30,.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x + w / 2, y + 6); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h * 0.55); c.lineTo(x + w, y + h * 0.55); c.stroke();
  }

  /* ---------- piscina termal (final) ---------- */
  function piscina() {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    c.fillStyle = lin(c, 0, 0, 0, 520, [[0, '#3a2c36'], [1, '#8c6a58']]); c.fillRect(0, 0, W, H);
    // arcos de piedra al fondo
    for (let i = 0; i < 5; i++) {
      const x = 40 + i * 310;
      c.fillStyle = '#e9d6b6'; c.fillRect(x, 120, 60, 420); c.beginPath(); c.rect(x, 120, 60, 420); ink(c, 3);
      c.beginPath(); c.moveTo(x + 60, 200); c.quadraticCurveTo(x + 185, 40, x + 310, 200); c.lineTo(x + 310, 120); c.lineTo(x + 60, 120); c.closePath(); c.fillStyle = '#e2cca8'; c.fill(); ink(c, 3);
      const sky = c.createLinearGradient(0, 200, 0, 540); sky.addColorStop(0, '#ffb784'); sky.addColorStop(1, '#ffe0a8'); c.fillStyle = sky;
      c.beginPath(); c.moveTo(x + 60, 540); c.lineTo(x + 60, 210); c.quadraticCurveTo(x + 185, 70, x + 310, 210); c.lineTo(x + 310, 540); c.closePath(); c.fill(); ink(c, 3);
    }
    c.fillStyle = '#e9d6b6'; c.fillRect(0, 40, W, 90); c.beginPath(); c.rect(0, 40, W, 90); ink(c, 4);
    c.fillStyle = '#5a3c2a'; c.font = "800 42px 'Cinzel', serif"; c.textAlign = 'center'; c.fillText('AGUAS QUE CURAN (CASI TODO)', 800, 100);
    // borde de piedra
    c.fillStyle = '#cdb894'; c.fillRect(0, 520, W, 50); c.beginPath(); c.rect(0, 520, W, 50); ink(c, 4);
    // agua
    c.fillStyle = lin(c, 0, 570, 0, H, [[0, '#3fb6b8'], [1, '#147a8e']]); c.fillRect(0, 570, W, H - 570);
    grain(c);
    return cv;
  }

  function get(name) {
    if (G.img['bg/' + name]) return G.img['bg/' + name];
    if (!cache[name]) cache[name] = ({ control, camino, balneario, piscina })[name]();
    return cache[name];
  }
  return { get, cone, lin, ink, grain, moon };
})();
