'use strict';
/* =====================================================================
   Minijuegos: chupitos, beso, prueba de sobriedad, carretera y círculo
   de sal contra la Santa Compaña. Cada uno toma el control de la
   pantalla (G.mode) y devuelve una promesa con el resultado.
   ===================================================================== */
const MG = (() => {
  const layer = () => $('mg');
  function begin(m) {
    if (TEST) { layer().innerHTML = ''; return Promise.resolve(G.mgResult ? G.mgResult(m.name) : true); }
    return new Promise((res) => {
      layer().classList.remove('hidden');
      $('hud').classList.add('hidden'); closeMenus();
      m.end = (r) => { if (m.done) return; m.done = true; G.mode = null; layer().innerHTML = ''; layer().classList.add('hidden'); $('hud').classList.toggle('hidden', !G.started || !!(G.scene && G.scene.noHud)); try { AUDIO.duck(false); } catch (e) {} res(r); };
      G.mode = m;
    });
  }
  function bar(html) { const d = document.createElement('div'); d.className = 'mgbar'; d.innerHTML = html; layer().appendChild(d); return d; }
  function btn(txt, x, y, cls, fn) {
    const b = document.createElement('button'); b.className = 'mgbtn ' + (cls || ''); b.innerHTML = txt;
    b.style.left = x + 'px'; b.style.top = y + 'px'; b.style.transform = 'translate(-50%,0)';
    b.onpointerdown = (e) => { e.stopPropagation(); e.preventDefault(); fn(b); };
    layer().appendChild(b); return b;
  }
  function bg(c, name, dark, zoom) {
    const im = G.img['bg/' + name]; c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    if (im) { const z = zoom || 1; c.drawImage(im, W / 2 - W * z / 2, H / 2 - H * z / 2, W * z, H * z); }
    if (dark) { c.fillStyle = `rgba(0,0,0,${dark})`; c.fillRect(0, 0, W, H); }
  }
  function drawImgH(c, src, x, y, h, o) {
    const im = G.img[src]; if (!im) return 0; o = o || {};
    const w = im.width * h / im.height;
    c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot); if (o.flip) c.scale(-1, 1); if (o.alpha !== undefined) c.globalAlpha = o.alpha;
    if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = 30; }
    c.drawImage(im, -w / 2, o.center ? -h / 2 : -h, w, h); c.restore(); return w;
  }
  function bigText(c, t, y, col, size) {
    c.save(); c.font = `800 ${size || 90}px 'Cinzel', serif`; c.textAlign = 'center'; c.lineWidth = 10; c.strokeStyle = '#1a0f05';
    c.strokeText(t, W / 2, y); c.fillStyle = col || '#ffd98a'; c.fillText(t, W / 2, y); c.restore();
  }

  /* ---------------- CHUPITOS: que Marcos no beba ---------------- */
  function chupitos() {
    const m = { drunk: 0, name: 'chupitos' };
    const X = { ramis: 300, marc: 560, marcos: 820, angel: 1080 };
    let round = 0, rt = 0, look = true, nextTurn = 1.6, warn = 0, state = {}, msg = '', msgT = 0, plant = 1, flyT = -1, caught = 0, tossed = 0;
    const res = { marcos: 0, tossed: 0 };
    const btns = {};
    const ROUNDS = 3, RT = 8;
    function newRound() {
      round++; rt = RT; state = { ramis: 0, marc: 0, marcos: 0, angel: 0 };
      sfx('chupito'); top.innerHTML = `Ronda ${round} de ${ROUNDS} · <b style="color:#ffd98a">Que Marcos no beba</b>`;
      for (const k in btns) btns[k].forEach((b) => b.classList.remove('hidden'));
    }
    function drinkIt(id) {
      if (state[id]) return; state[id] = 1; drink(id, 1); try { AUDIO.laugh(pick(['ramis', 'marc', 'angel'])); } catch (e) {}
      if (id === 'marcos') { res.marcos++; }
      btns[id].forEach((b) => b.classList.add('hidden')); check();
    }
    function toss() {
      if (state.marcos) return;
      if (look) {
        state.marcos = 1; caught++; sfx('error'); msg = '¡¿ME TIRAS MI LICOR CAFÉ?! ¡Para dentro, guapo!'; msgT = 2.2;
        setTimeout(() => { drink('marcos', 1); res.marcos++; }, 500);
      } else { state.marcos = 2; tossed++; res.tossed++; sfx('servir'); flyT = 0; msg = 'Marcos lo tira a la maceta. La planta lo agradece.'; msgT = 1.8; }
      btns.marcos.forEach((b) => b.classList.add('hidden')); check();
    }
    function check() {
      if (Object.values(state).every((v) => v)) { rt = Math.min(rt, 0.9); }
    }
    const top = bar('');
    for (const id of PROTA) {
      if (id === 'marcos') btns[id] = [btn('🥃 Beber', X[id], 790, '', () => drinkIt('marcos')), btn('🌿 ¡A la maceta!', X[id], 872, 'grn', toss)];
      else btns[id] = [btn('🥃 ¡Para dentro!', X[id], 790, '', () => drinkIt(id))];
    }
    newRound();
    m.update = (dt) => {
      rt -= dt; msgT -= dt; if (flyT >= 0) flyT += dt;
      nextTurn -= dt;
      if (nextTurn < 0.45 && nextTurn > 0 && !warn) { warn = 1; sfx('tic'); }
      if (nextTurn <= 0) { look = !look; warn = 0; nextTurn = look ? rnd(1.0, 2.2) : rnd(1.3, 2.6); }
      if (rt <= 0) {
        // lo que quede: Ramis se bebe lo de los demás; a Marcos le obligan
        for (const id of ['ramis', 'marc', 'angel']) if (!state[id]) { drink('ramis', 1, true); state[id] = 1; }
        if (!state.marcos) { state.marcos = 1; drink('marcos', 1); res.marcos++; msg = '«¿Y tú no bebes, guapo?» Marcos se lo bebe.'; msgT = 1.8; }
        if (round >= ROUNDS) { setTimeout(() => m.end(res), 1400); rt = 99; }
        else { setTimeout(newRound, 1200); rt = 99; }
      }
    };
    m.draw = (c, t) => {
      bg(c, 'estrella', 0.35, 1.06);
      // mesa
      c.fillStyle = PROC.lin(c, 0, 640, 0, 1000, [[0, '#7a4a28'], [1, '#3e2412']]); c.fillRect(0, 650, W, 350);
      c.fillStyle = '#9a6234'; c.fillRect(0, 640, W, 18);
      // maceta
      const ps = 1 + tossed * 0.18 + Math.sin(t * 3) * 0.02;
      c.save(); c.translate(130, 650); c.scale(ps, ps);
      c.fillStyle = '#b5562a'; c.beginPath(); c.moveTo(-50, 0); c.lineTo(50, 0); c.lineTo(38, -80); c.lineTo(-38, -80); c.closePath(); c.fill(); PROC.ink(c, 4);
      for (let i = 0; i < 9; i++) { c.save(); c.rotate(-0.9 + i * 0.22 + Math.sin(t * 2 + i) * 0.05); c.beginPath(); c.ellipse(0, -150, 18, 70, 0, 0, 7); c.fillStyle = i % 2 ? '#3f8f3a' : '#2f7a2e'; c.fill(); PROC.ink(c, 3); c.restore(); }
      c.restore();
      if (tossed) { c.font = "28px 'Patrick Hand'"; c.fillStyle = '#c8ffb0'; c.textAlign = 'center'; c.fillText('Planta feliz ×' + tossed, 130, 700); }
      // caras y chupitos
      for (const id of PROTA) {
        const lv = S.drunk[id], mood = state[id] === 1 ? (lv >= 3 ? 'borracho' : 'risa') : (lv >= 3 ? 'borracho' : 'normal');
        drawImgH(c, 'faces/' + id + '_' + mood, X[id], 600 + Math.sin(t * 2 + X[id]) * 4, 270, { rot: Math.sin(t * (1 + lv * 0.2) + X[id]) * 0.02 * lv });
        c.font = "800 30px 'Nunito'"; c.fillStyle = '#fff6e0'; c.textAlign = 'center'; c.fillText(NAMES[id], X[id], 640);
        if (!state[id]) drawImgH(c, 'items/chupitos', X[id], 760, 100);
      }
      if (flyT >= 0 && flyT < 0.7) { const k = flyT / 0.7; drawImgH(c, 'items/chupitos', X.marcos + (130 - X.marcos) * k, 760 - Math.sin(k * Math.PI) * 300, 90, { rot: k * 6 }); }
      // la señora
      const sx = 1370, alert = !look && nextTurn < 0.45;
      drawImgH(c, look ? 'chars/senora' : 'chars/senora_risa', sx, 800, 520, { flip: look });
      c.save(); c.font = "800 36px 'Nunito'"; c.textAlign = 'center';
      if (look) { c.fillStyle = '#ff7b7b'; c.fillText('👁 TE ESTÁ MIRANDO', sx, 250); }
      else { c.fillStyle = alert ? '#ffd23a' : '#9dffb0'; c.fillText(alert ? '⚠ ¡SE VA A GIRAR!' : '♪ Distraída', sx, 250); if (Math.random() < 0.05) emit('note', sx + 40, 330, 1); }
      c.restore();
      // tiempo
      c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(500, 100, 600, 18); c.fillStyle = '#ffd98a'; c.fillRect(500, 100, 600 * clamp(rt / RT, 0, 1), 18);
      if (msgT > 0) { c.save(); c.font = "800 40px 'Nunito'"; c.textAlign = 'center'; c.lineWidth = 8; c.strokeStyle = '#000'; c.strokeText(msg, W / 2, 200); c.fillStyle = '#fff'; c.fillText(msg, W / 2, 200); c.restore(); }
      drawParticles(c);
    };
    return begin(m);
  }

  /* ---------------- BESO: un minuto y ya ---------------- */
  function beso() {
    const m = { drunk: 0, name: 'beso' };
    let t0 = 0, pas = 0.35, taps = 0, pops = [], best = 0, sec = 0;
    const DUR = 14;
    const lines = [
      ['ramis', 'sorpresa', '¿¿PERO QUÉ ESTÁ PASANDO??'], ['marc', 'sorpresa', 'Veinte años estudiando a Manara… y este lo hace en un minuto.'],
      ['marcos', 'risa', '¡Tirada crítica de carisma! ¡Un veinte natural!'], ['ramis', 'risa', '¡Yo al menos podré decir que lo he visto!'],
      ['marc', 'risa', 'Que alguien le cronometre. Esto es récord del Club.'],
    ];
    const top = bar('¡Toca sin parar para mantener la <b style="color:#ff8fb5">pasión</b>!');
    m.down = () => { taps++; pas = Math.min(1, pas + 0.07); emit('heart', 800 + pick([-1, 1]) * rnd(150, 260), 420, 2); sfx('corazon'); };
    m.key = (k, d) => { if (d && (k === ' ' || k === 'Enter')) m.down(); };
    m.update = (dt) => {
      t0 += dt; pas = Math.max(0, pas - dt * 0.16); best = Math.max(best, pas);
      sec += dt * (8 + pas * 30); // el tiempo «de verdad» vuela
      if (pops.length < lines.length && t0 > 1.6 + pops.length * 2.4) { pops.push({ l: lines[pops.length], t: t0 }); sfx('pop'); }
      if (Math.random() < pas * 0.5) emit('heart', 800 + pick([-1, 1]) * rnd(150, 260), 440, 1);
      if (t0 >= DUR) { S.stats.besoSeg = Math.round(sec); m.end({ pasion: best, seg: Math.round(sec) }); }
      const mm = Math.floor(sec / 60), ss = Math.floor(sec % 60);
      top.innerHTML = `Besándose: <b style="color:#ff8fb5">${mm}:${String(ss).padStart(2, '0')}</b> · Pasión ${'♥'.repeat(Math.ceil(pas * 5))}${'♡'.repeat(5 - Math.ceil(pas * 5))}`;
    };
    m.draw = (c, t) => {
      bg(c, 'pub', 0.25, 1.12);
      c.save(); c.globalCompositeOperation = 'lighter'; const gl = c.createRadialGradient(800, 420, 20, 800, 420, 600);
      gl.addColorStop(0, `rgba(255,80,150,${0.15 + pas * 0.25})`); gl.addColorStop(1, 'rgba(255,80,150,0)'); c.fillStyle = gl; c.fillRect(0, 0, W, H); c.restore();
      // el beso de verdad (los dibujos de JRAR): se van turnando las dos poses
      const pose = G.img['escenas/beso1'] && G.img['escenas/beso2'] ? (Math.floor(t * 0.7) % 2 ? 'escenas/beso2' : 'escenas/beso1') : null;
      const sway = Math.sin(t * 2.2) * 0.012, bob = Math.sin(t * 4) * 4;
      if (pose) {
        c.save(); c.globalCompositeOperation = 'lighter'; const g2 = c.createRadialGradient(800, 330, 10, 800, 330, 260); g2.addColorStop(0, `rgba(255,120,170,${0.25 + pas * 0.3})`); g2.addColorStop(1, 'rgba(255,120,170,0)'); c.fillStyle = g2; c.fillRect(500, 60, 600, 560); c.restore();
        drawImgH(c, pose, 800, 1010 + bob, 930, { rot: sway });
      } else {
        drawImgH(c, 'chars/angel_lado', 700, 1000, 820, { rot: 0.05 });
        drawImgH(c, 'chars/chica', 905, 1000, 760, { flip: true, rot: -0.05 });
      }
      // MUAC pequeñito por encima (ya no tapa nada)
      const mk = 1 + Math.sin(t * 9) * 0.06;
      c.save(); c.translate(1020, 150); c.rotate(0.12); c.scale(mk, mk); c.font = "800 58px 'Cinzel'"; c.textAlign = 'center'; c.fillStyle = '#fff'; c.lineWidth = 8; c.strokeStyle = '#7a0f35';
      c.strokeText('MUAC', 0, 0); c.fillText('MUAC', 0, 0); c.restore();
      drawParticles(c);
      // los amigos alucinando
      pops.forEach((p, i) => {
        const k = clamp((t0 - p.t) * 3, 0, 1), x = i % 2 ? 1390 : 210, y = 300 + (i % 3) * 230;
        c.save(); c.globalAlpha = k; drawImgH(c, 'faces/' + p.l[0] + '_' + p.l[1], x, y + 40, 190 * k);
        c.font = "700 26px 'Nunito'"; c.textAlign = 'center'; const tw = Math.min(380, c.measureText(p.l[2]).width + 30);
        c.fillStyle = 'rgba(10,8,20,.85)'; c.fillRect(x - tw / 2, y + 50, tw, 70); c.fillStyle = '#fff'; wrapText(c, p.l[2], x, y + 78, tw - 20, 28); c.restore();
      });
    };
    return begin(m);
  }
  function wrapText(c, t, x, y, maxW, lh) {
    const words = t.split(' '); let line = '', yy = y;
    for (const w of words) { const test = line ? line + ' ' + w : w; if (c.measureText(test).width > maxW && line) { c.fillText(line, x, yy); line = w; yy += lh; } else line = test; }
    c.fillText(line, x, yy);
  }

  /* ---------------- PRUEBA DE SOBRIEDAD: sigue el dedo ---------------- */
  function pulso() {
    const lv = S.drunk.marcos;
    const m = { drunk: lv, name: 'pulso' };
    let t0 = 0, inside = 0, px = 800, py = 520, tx = 800, ty = 520, keys = {}, dx = 0, dy = 0;
    const DUR = 9, NEED = 5.2;
    const top = bar('Sigue el dedo de Brais con la nariz de Marcos · dentro del círculo');
    m.move = (p) => { tx = p.x; ty = p.y; };
    m.down = (p) => { tx = p.x; ty = p.y; };
    m.key = (k, d) => { keys[k] = d; };
    m.update = (dt) => {
      t0 += dt;
      if (keys.ArrowLeft) tx -= 700 * dt; if (keys.ArrowRight) tx += 700 * dt; if (keys.ArrowUp) ty -= 700 * dt; if (keys.ArrowDown) ty += 700 * dt;
      // la borrachera empuja la nariz
      dx += rnd(-1, 1) * (40 + lv * 260) * dt; dy += rnd(-1, 1) * (40 + lv * 260) * dt; dx *= 0.96; dy *= 0.96;
      const wob = lv * 22;
      px += (tx - px) * Math.min(1, dt * (9 - lv)) + dx * dt * 6 + Math.sin(t0 * 2.3) * wob * dt * 3;
      py += (ty - py) * Math.min(1, dt * (9 - lv)) + dy * dt * 6 + Math.cos(t0 * 1.9) * wob * dt * 3;
      const fx = 800 + Math.sin(t0 * 1.1) * 380 + Math.sin(t0 * 2.7) * 90, fy = 520 + Math.sin(t0 * 1.7) * 200;
      m.fx = fx; m.fy = fy;
      if (Math.hypot(px - fx, py - fy) < 85) inside += dt;
      top.innerHTML = `Sigue el dedo · <b style="color:#9dffb0">${Math.min(100, Math.round(inside / NEED * 100))}%</b> · ${Math.max(0, Math.ceil(DUR - t0))} s`;
      if (inside >= NEED) { sfx('ok'); m.end(true); }
      else if (t0 >= DUR) { sfx('fallo'); m.end(false); }
    };
    m.draw = (c, t) => {
      bg(c, 'bareto', 0.5, 1.05);
      drawImgH(c, 'chars/camarero', 1380, 1000, 760);
      const fx = m.fx || 800, fy = m.fy || 520;
      c.save(); c.beginPath(); c.arc(fx, fy, 85, 0, 7); c.fillStyle = 'rgba(255,217,138,.15)'; c.fill(); c.lineWidth = 6; c.strokeStyle = '#ffd98a'; c.setLineDash([16, 10]); c.lineDashOffset = -t * 50; c.stroke(); c.restore();
      c.save(); c.font = '90px serif'; c.textAlign = 'center'; c.fillText('☝', fx, fy + 30); c.restore();
      drawImgH(c, 'faces/marcos_' + (lv >= 3 ? 'borracho' : 'normal'), px, py + 70, 170, { center: false });
      c.save(); c.beginPath(); c.arc(px, py, 12, 0, 7); c.fillStyle = '#ff6b4a'; c.fill(); c.restore();
    };
    return begin(m);
  }

  /* ---------------- CARRETERA ---------------- */
  function carretera(o) {
    o = o || {};
    const lv = S.drunk.marcos;
    const m = { drunk: Math.min(lv, 2), name: 'carretera' };
    const HY = 470, BOT = H, LEN = o.len || 38;
    let t0 = 0, travel = 0, carL = 0, carV = 0, steer = 0, keys = {}, objs = [], sustos = 0, curve = 0, curveT = 0, spawn = 0.6, hit = 0, speed = 7, brake = 0;
    let cow = null, cowDone = !o.cow, qte = null, msg = '', msgT = 0, help = 3.5;
    const top = bar('');
    const left = btn('◀', 120, 820, '', () => { keys.L = 1; }), right = btn('▶', 1480, 820, '', () => { keys.R = 1; });
    [left, right].forEach((b) => { b.style.fontSize = '60px'; b.style.width = '170px'; b.style.height = '130px'; b.onpointerup = b.onpointerleave = () => { keys.L = keys.R = 0; }; });
    m.down = (p) => { if (p.x < W / 2) keys.L = 1; else keys.R = 1; };
    m.up = () => { keys.L = keys.R = 0; };
    m.key = (k, d) => { if (k === 'ArrowLeft' || k === 'a') keys.L = d; if (k === 'ArrowRight' || k === 'd') keys.R = d; if ((k === ' ' || k === 'ArrowDown') && d && qte) qte.hit(); };
    const halfW = (p) => 30 + p * 760;
    const centerX = (p) => 800 + curve * Math.pow(1 - p, 2) * 520;
    function addObj(kind, lane, z) { objs.push({ kind, lane, z: z || 26, side: Math.abs(lane) > 1.1 }); }
    m.update = (dt) => {
      t0 += dt; help -= dt; msgT -= dt;
      const sp = speed * (1 - brake);
      travel += sp * dt;
      curveT -= dt; if (curveT <= 0) { curveT = rnd(3, 6); m.cTarget = rnd(-1, 1) * (o.cow ? 1.1 : 0.9); }
      curve += ((m.cTarget || 0) - curve) * dt * 0.6;
      // dirección: teclas + empuje de la curva + borrachera de Marcos
      steer = (keys.R ? 1 : 0) - (keys.L ? 1 : 0);
      carV += steer * 3.6 * dt;
      carV -= curve * 0.55 * dt * (sp / 7);
      carV += (Math.sin(t0 * 1.3) * 0.25 + rnd(-1, 1) * 0.6) * lv * 0.45 * dt;
      carV *= 0.92; carL = clamp(carL + carV, -1.05, 1.05);
      if (Math.abs(carL) > 1) { carV *= -0.4; if (hit <= 0) { sfx('frenazo'); shake(0.3); msg = '¡Al arcén no, Marcos!'; msgT = 1.2; hit = 0.6; } }
      // aparecen cosas
      spawn -= dt;
      if (spawn <= 0 && t0 < LEN - 4) {
        spawn = rnd(0.9, 1.7) - Math.min(0.4, t0 / 100);
        const r = Math.random();
        if (r < 0.45) addObj('cono', pick([-0.5, 0.5]));
        else if (r < 0.6) addObj('bache', pick([-0.5, 0.5]));
        addObj(Math.random() < 0.5 ? 'arbol' : 'pino', pick([-1.6, -2.2, 1.6, 2.2]));
        if (Math.random() < 0.2) addObj('farola', pick([-1.35, 1.35]));
      }
      if (!cowDone && !cow && t0 > LEN - 9) { cow = { lane: carL > 0 ? 0.45 : -0.45, z: 26 }; objs.push(Object.assign(cow, { kind: 'vaca' })); sfx('mu'); }
      if (cow && !qte && cow.z < 9) {
        qte = { t: 0, ok: false, hit() { if (this.ok) return; this.ok = true; brake = 1; sfx('frenazo'); msg = '¡FRENAZO! La vaca ni se inmuta.'; msgT = 2.5; } };
        const b = btn('🛑 ¡FRENA!', 800, 640, 'red', () => qte && qte.hit()); b.style.fontSize = '56px'; qte.b = b;
      }
      if (qte) { qte.t += dt; if (qte.ok) brake = Math.min(1, brake + dt); }
      hit -= dt;
      for (const ob of objs) {
        ob.z -= sp * dt;
        if (!ob.side && !ob.gone && ob.z < 0.6 && ob.z > -0.2 && Math.abs(ob.lane - carL) < 0.42) {
          ob.gone = true;
          if (ob.kind === 'cono') { sustos++; sfx('choque'); shake(0.5); msg = pick(['¡Pum! Cono a la cuneta.', '¡Ese cono era de Fomento!', 'Ramis: «¡Yo al menos podré decir que he vivido!»']); msgT = 1.5; }
          else if (ob.kind === 'bache') { sfx('choque', { soft: true }); shake(0.3); msg = '¡Bache! Ramis se da con el techo.'; msgT = 1.3; }
          else if (ob.kind === 'vaca') {
            if (qte && qte.ok) { ob.z = 1.2; ob.stop = true; }
            else { sustos++; sfx('mu'); sfx('frenazo'); shake(0.9); carL = clamp(carL + (carL > 0 ? -0.7 : 0.7), -1, 1); msg = '¡VOLANTAZO! La vaca os mira con desprecio.'; msgT = 2.5; }
          }
        }
        if (ob.stop) ob.z = Math.max(ob.z, 1.2);
      }
      objs = objs.filter((ob) => ob.z > -1);
      if (cow && cow.stop && qte && qte.t > 3) { cowDone = true; cow.lane += dt * 0.5; if (cow.lane > 2.5) { cow = null; } brake = Math.max(0, brake - dt * 0.6); if (qte.b) { qte.b.remove(); qte.b = null; } }
      if (cow && !cow.stop && cow.z < -0.5) { cowDone = true; cow = null; if (qte && qte.b) { qte.b.remove(); qte.b = null; } }
      const prog = clamp(t0 / LEN, 0, 1);
      top.innerHTML = `${o.label || 'Rumbo a Caldas de Reis'} · <b style="color:#ffd98a">${Math.max(0, Math.round((1 - prog) * (o.km || 12)))} km</b> · Sustos: ${sustos}`;
      if (t0 >= LEN && (cowDone || !o.cow)) { S.stats.sustos += sustos; m.end({ sustos }); }
    };
    m.draw = (c, t) => {
      // cielo y montes
      c.fillStyle = PROC.lin(c, 0, 0, 0, HY, [[0, '#060920'], [1, '#1f2a55']]); c.fillRect(0, 0, W, HY);
      if (!m.st) { m.st = []; for (let i = 0; i < 140; i++) m.st.push([Math.random() * W, Math.random() * HY * 0.8, Math.random()]); }
      for (const s of m.st) { c.fillStyle = `rgba(255,250,230,${0.3 + 0.5 * Math.sin(t * 2 + s[2] * 9)})`; c.fillRect(s[0], s[1], 2, 2); }
      PROC.moon(c, 1250 - curve * 120, 110, 34);
      c.fillStyle = '#121735'; c.beginPath(); c.moveTo(0, HY); for (let x = 0; x <= W; x += 40) c.lineTo(x, HY - 50 - Math.sin(x / 180 + curve) * 30 - Math.sin(x / 70) * 8); c.lineTo(W, HY); c.fill();
      c.fillStyle = '#0c1a12'; c.fillRect(0, HY, W, H - HY);
      // carretera
      for (let y = HY; y < BOT; y += 4) {
        const p = (y - HY) / (BOT - HY) + 0.001, z = 1 / p, hw = halfW(p), cx = centerX(p) - carL * p * 260;
        const stripe = Math.floor(z * 1.4 + travel * 1.4) % 2 === 0;
        c.fillStyle = stripe ? '#2c2f3a' : '#30333f'; c.fillRect(cx - hw, y, hw * 2, 4);
        c.fillStyle = stripe ? '#d8d8d8' : '#8a1d1d'; c.fillRect(cx - hw - hw * 0.06, y, hw * 0.06, 4); c.fillRect(cx + hw, y, hw * 0.06, 4);
        if (stripe) { c.fillStyle = '#e8e8e8'; c.fillRect(cx - hw * 0.015, y, hw * 0.03, 4); }
        c.fillStyle = stripe ? '#0f2016' : '#0c1a12'; c.fillRect(0, y, cx - hw - hw * 0.06, 4); c.fillRect(cx + hw + hw * 0.06, y, W, 4);
      }
      // objetos de lejos a cerca
      const sorted = objs.slice().sort((a, b) => b.z - a.z);
      for (const ob of sorted) {
        if (ob.z <= 0.05 || ob.gone && ob.kind !== 'vaca') continue;
        const p = 1 / (1 + ob.z), y = HY + p * (BOT - HY), x = centerX(p) - carL * p * 260 + ob.lane * halfW(p), s = p;
        if (ob.kind === 'cono') PROC.cone(c, x, y, s * 2.2);
        else if (ob.kind === 'bache') { c.fillStyle = '#15161c'; c.beginPath(); c.ellipse(x, y, 120 * s, 26 * s, 0, 0, 7); c.fill(); }
        else if (ob.kind === 'arbol' || ob.kind === 'pino') { c.save(); c.translate(x, y); c.scale(s * 2.4, s * 2.4); c.fillStyle = '#1d1712'; c.fillRect(-6, -120, 12, 120);
          c.fillStyle = ob.kind === 'pino' ? '#0e2418' : '#16301f'; c.beginPath(); if (ob.kind === 'pino') { c.moveTo(0, -330); c.lineTo(60, -110); c.lineTo(-60, -110); } else c.ellipse(0, -190, 70, 100, 0, 0, 7); c.fill(); PROC.ink(c, 3); c.restore(); }
        else if (ob.kind === 'farola') { c.save(); c.translate(x, y); c.scale(s * 2.2, s * 2.2); c.fillStyle = '#333'; c.fillRect(-4, -260, 8, 260); c.fillStyle = '#ffe9a6'; c.fillRect(-14, -276, 28, 18); c.restore();
          c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y - 600 * s, 0, x, y - 600 * s, 260 * s); g.addColorStop(0, 'rgba(255,220,150,.35)'); g.addColorStop(1, 'rgba(255,220,150,0)'); c.fillStyle = g; c.fillRect(x - 300 * s, y - 900 * s, 600 * s, 600 * s); c.restore(); }
        else if (ob.kind === 'vaca') drawImgH(c, 'items/vaca', x, y, 560 * s, { flip: ob.lane > 0 });
      }
      // faros
      c.save(); c.globalCompositeOperation = 'lighter';
      const cxh = 800 + carL * 120, sk = carV * 900;
      const g = c.createRadialGradient(cxh, 700, 40, cxh, 640, 520); g.addColorStop(0, 'rgba(255,240,200,.28)'); g.addColorStop(1, 'rgba(255,240,200,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(cxh - 160, 880); c.lineTo(cxh + 160, 880); c.lineTo(cxh + 450 + sk, 520); c.lineTo(cxh - 450 + sk, 520); c.closePath(); c.fill(); c.restore();
      // el Peugeot
      const wob = Math.sin(t * 14) * 2 + (hit > 0 ? rnd(-6, 6) : 0);
      drawImgH(c, 'items/peugeot_atras', 800 + carL * 120, 985 + wob, 300, { rot: carV * 0.6 });
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,30,30,${brake > 0.2 ? 0.6 : 0.2})`;
      [[-95, 0], [95, 0]].forEach(([dx]) => { c.beginPath(); c.arc(800 + carL * 120 + dx, 870 + wob, 26, 0, 7); c.fill(); }); c.restore();
      if (msgT > 0) { c.save(); c.font = "800 44px 'Nunito'"; c.textAlign = 'center'; c.lineWidth = 9; c.strokeStyle = '#000'; c.strokeText(msg, W / 2, 230); c.fillStyle = '#fff'; c.fillText(msg, W / 2, 230); c.restore(); }
      if (help > 0) { c.save(); c.globalAlpha = Math.min(1, help); c.font = "800 38px 'Nunito'"; c.textAlign = 'center'; c.fillStyle = '#ffd98a'; c.lineWidth = 8; c.strokeStyle = '#000';
        const tt = 'Toca a izquierda o derecha (o flechas) para conducir'; c.strokeText(tt, W / 2, 330); c.fillText(tt, W / 2, 330); c.restore(); }
    };
    return begin(m);
  }

  /* ---------------- CÍRCULO DE SAL contra la Santa Compaña ---------------- */
  function circulo() {
    const m = { drunk: 0, name: 'circulo' };
    let t0 = 0, path = [], drawing = false, result = null, tries = 0;
    const DUR = 16, G4 = [[650, 800], [740, 812], [860, 812], [950, 800]];
    const top = bar('¡Rodea a los cuatro con un círculo de sal antes de que llegue la Compaña!');
    m.down = (p) => { if (result) return; drawing = true; path = [p]; sfx('sal'); };
    m.move = (p) => { if (!drawing || result) return; const l = path[path.length - 1]; if (Math.hypot(p.x - l.x, p.y - l.y) > 12) { path.push(p); emit('salt', p.x, p.y, 2); if (path.length % 6 === 0) sfx('sal', { soft: true }); } };
    m.up = () => {
      if (!drawing || result) return; drawing = false;
      if (path.length < 12) return;
      const a = path[0], b = path[path.length - 1];
      const closed = Math.hypot(a.x - b.x, a.y - b.y) < 160;
      const inside = G4.every(([x, y]) => pip(x, y - 120, path));
      if (closed && inside) { result = 'ok'; sfx('magia'); flash('#ffffff', 0.6); setTimeout(() => m.end(true), 2600); }
      else { tries++; sfx('error'); m.msg = closed ? '¡Que no quede nadie fuera del círculo!' : '¡Ciérralo! El círculo tiene que cerrarse.'; m.msgT = 1.8; path = []; }
    };
    m.update = (dt) => {
      t0 += result ? 0 : dt; m.msgT = (m.msgT || 0) - dt;
      if (!result && t0 >= DUR) { result = 'fail'; sfx('fantasma'); setTimeout(() => m.end(false), 1800); }
      top.innerHTML = result === 'ok' ? '<b style="color:#9dffb0">¡La Compaña pasa de largo!</b>' : result === 'fail' ? '<b style="color:#ff8a8a">Os han visto…</b>' : `Dibuja el círculo con el dedo · ${Math.ceil(DUR - t0)} s`;
      if (Math.random() < 0.3) emit('fog', rnd(0, W), rnd(560, 980), 1, { color: '#a8b8e8' });
    };
    m.draw = (c, t) => {
      const im = PROC.get('camino'); c.drawImage(im, 0, 0, W, H);
      c.fillStyle = 'rgba(10,20,50,.25)'; c.fillRect(0, 0, W, H);
      if (!G.img['bg/camino']) drawImgH(c, 'items/cruceiro', 330, 760, 420);
      // la procesión se acerca
      const k = clamp(t0 / DUR, 0, 1) * (result === 'ok' ? 0.85 : 1);
      for (let i = 0; i < 5; i++) {
        const kk = clamp(k * 1.15 - i * 0.07, 0, 1), p = 0.12 + kk * 0.75;
        const x = 770 + (i - 2) * 60 * p * 2.2 + (result === 'ok' ? kk * (i - 2) * 220 : 0), y = 560 + p * 330;
        drawImgH(c, 'items/compana', x, y, 520 * p, { alpha: 0.55 + 0.25 * Math.sin(t * 2 + i), glow: 'rgba(160,200,255,.8)' });
        c.save(); c.globalCompositeOperation = 'lighter'; const gg = c.createRadialGradient(x + 60 * p, y - 260 * p, 0, x + 60 * p, y - 260 * p, 90 * p);
        gg.addColorStop(0, 'rgba(140,200,255,.5)'); gg.addColorStop(1, 'rgba(140,200,255,0)'); c.fillStyle = gg; c.fillRect(x - 200, y - 500 * p, 400, 400 * p); c.restore();
      }
      // los cuatro, acojonados
      PROTA.forEach((id, i) => { const sp = bodySprite(id); drawImgH(c, sp, G4[i][0], G4[i][1], 300 * G.img[sp].height / G.img['chars/' + id].height, { rot: Math.sin(t * 12 + i) * 0.015 }); });
      // rastro de sal
      if (path.length > 1) { c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = result === 'ok' ? '#e8fbff' : 'rgba(255,255,255,.9)'; c.lineWidth = 12;
        if (result === 'ok') { c.shadowColor = '#bfe8ff'; c.shadowBlur = 30; }
        c.beginPath(); c.moveTo(path[0].x, path[0].y); for (const q of path) c.lineTo(q.x, q.y); if (result === 'ok') c.closePath(); c.stroke(); c.restore(); }
      drawParticles(c);
      if (m.msgT > 0) { c.save(); c.font = "800 42px 'Nunito'"; c.textAlign = 'center'; c.lineWidth = 8; c.strokeStyle = '#000'; c.strokeText(m.msg, W / 2, 220); c.fillStyle = '#fff'; c.fillText(m.msg, W / 2, 220); c.restore(); }
    };
    return begin(m);
  }
  function pip(x, y, poly) {
    let ins = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) ins = !ins;
    }
    return ins;
  }

  return { chupitos, beso, pulso, carretera, circulo, bigText, drawImgH, begin, bar, btn, bg, wrapText };
})();
