'use strict';
/* =====================================================================
   v18 · La cola del baño de la Lume
   El que juegas está a reventar y delante hay una cola de gente de la
   noche. Para colarse hay que convencer a cada uno con lo que le va: a
   Gary, una pinta; a las profes, cosas de profe; a Dalia, un piropo…
   La barrita «me meo» no para de subir y cada metedura de pata la sube
   más. Si llegas a la puerta: logro y se te baja un poco la borrachera.
   Si se llena: plan B en el callejón.
   Si existe img/bg/banos.webp (un pasillo dibujado) se usa de fondo.
   ===================================================================== */
LOGROS.cola = { i: '🚽', t: 'Me colé en el baño de la Lume' };

// cada uno: varias maneras de pedirle paso. x: lo que te suelta · ok: lo que le convence · mal: dos meteduras de pata · si / no: su respuesta
const COLA = {
  guiri: [
    { x: 'Sorry, mate! In Manchester we respect the queue!', ok: 'Gary, ¡te invito a una pinta cuando salga!', mal: ['Aquí las colas son orientativas.', '¡Brexit, Brexit!'], si: 'A pint? You\'re a gentleman, mate! After you!', no: 'Orientativas? Bloody hell, no. Back of the queue.' },
    { x: 'I\'ve been waiting here since… since the paella!', ok: 'Gary, en la barra regalan pulpo. Gratis. Ahora.', mal: ['Es que yo soy de aquí, colega.', '¿Me deja pasar, señor guiri?'], si: 'FREE OCTOPUS?! Go, go, go!', no: 'Señor guiri? Rude! Back you go.' },
  ],
  noa: [
    { x: 'Ni lo sueñes. Soy profe de Educación Física: aquí se espera haciendo sentadillas.', ok: 'Noa, ¿me lo cuentas como calentamiento? Es que voy a hacer un sprint.', mal: ['Yo en gimnasia siempre me escaqueaba.', '¿Y si me pones un positivo?'], si: '¡Ja! Un sprint. Venga, ¡pasa, que te cronometro!', no: '¿Te escaqueabas? Pues ahora, al final de la fila. Y cinco vueltas.' },
    { x: '¡Uuuuh! ¿Dónde vas tan deprisa, caballero?', ok: 'A ganar la carrera de relevos, profe: ¡me pasas el testigo!', mal: ['A ningún sitio, me han empujado.', 'A ver si encuentro al del jersey blanco.'], si: '¡Relevo! ¡Corre, corre, que gana Vigo!', no: 'Pues no empujes tú. Atrás.' },
  ],
  uxia: [
    { x: 'Soy profe de Mates. Hay tres personas delante de ti. ¿Cuántas te vas a colar? Cero.', ok: 'Uxía, es un problema de probabilidad: si no paso, la probabilidad de desastre es del cien por cien.', mal: ['¿Y si redondeamos a uno?', 'Yo en mates sacaba un cinco raspado.'], si: '…Bien planteado. Muy bien planteado. Pasa.', no: 'Un cinco raspado. Se nota. Al final de la cola.' },
    { x: 'Llevo aquí veinte minutos. Estoy más cruzada que un examen de recuperación.', ok: 'Uxía, en la barra hay licor café dos por uno. Te guardo el sitio… detrás de mí.', mal: ['Yo llevo veinte años.', '¿Y qué es un examen de recuperación?'], si: '¿Dos por uno? Vale, vale. Pero me lo apunto.', no: 'Lo que tú necesitas es una recuperación. Atrás.' },
  ],
  sabela: [
    { x: 'Soy profe de Plástica y esta cola es mi obra de arte. No la estropees.', ok: 'Sabela, una cola sin movimiento es una naturaleza muerta. Hazla moderna: déjame pasar.', mal: ['¿Plástica? ¿De reciclar?', 'Yo dibujo fatal, pero meo muy bien.'], si: '¡Jajaja! ¡Arte contemporáneo! Pasa, pasa.', no: '¿Plástica de reciclar? Te reciclo yo. Al fondo.' },
    { x: '¡Jajaja! ¿Tú no eres el que parecía muy joven?', ok: 'El mismo. Y en este baño entré con diecisiete y quiero salir con cuarenta.', mal: ['No, ese es otro.', '¿Me ves joven? ¿De verdad?'], si: '¡Jajaja! Me matas. Pasa, chaval.', no: 'Joven y pesado. Al fondo.' },
  ],
  lua: [
    { x: 'Estoy esperando a una amiga que está dentro. Y no pienso perder el sitio.', ok: 'Lúa, mi amigo Marc te está dibujando en la pista. Te ha sacado guapísima.', mal: ['Tu amiga ha salido por la ventana.', 'Yo también soy tu amigo. Desde delante.'], si: '¿Me está dibujando? ¡Voy a verlo! Todo tuyo.', no: '¿Desde delante? Muy listo. No.' },
    { x: '¿Qué miras? ¿Te gusta mi bolsa de cuadernos o te meas?', ok: 'Las dos cosas, Lúa. Pero lo segundo es más urgente.', mal: ['Ninguna de las dos.', 'Me gustan más los cuadernos que tú.'], si: '¡Ja! Al menos eres sincero. Pasa.', no: 'Pues entonces, ¿qué haces en la cola? Atrás.' },
  ],
  carla: [
    { x: '¡Hola, mis viralitos! Estoy en directo, ¿eh? Si te cuelas sales en mis stories.', ok: 'Carla, en la pista está pasando algo viral ahora mismo. ¡Corre!', mal: ['¡Hola, mamá, salgo en la tele!', '¿Y cuántos seguidores tienes?'], si: '¿¡Viral!? ¡Me voy! ¡Viralitos, seguidme!', no: 'Más que tú. Al fondo, que te grabo.' },
    { x: 'Shhh, que tengo dos mil personas viéndome hacer cola.', ok: 'Pues que te vean dejar pasar a un caballero. Queda genial en cámara.', mal: ['Esto es un baño, no un plató.', 'Saluda a mi primo de Lugo.'], si: 'Mmm… buen contenido. Pasa, pasa, caballero.', no: 'Todo es un plató, cariño. Al fondo.' },
  ],
  rosa: [
    { x: 'Rey, aquí la reina va primero. Protocolo.', ok: 'Majestad, una reina no hace cola: se la hacen a ella. Yo le abro paso.', mal: ['Yo soy el rey de esta cola.', '¿Y si lo echamos a piedra, papel o tijera?'], si: '¡Uy, qué bien hablas! Pasa, súbdito, pasa.', no: '¿Rey tú? Con ese peinado, como mucho bufón. Atrás.' },
    { x: 'Este top vale más que vuestro Peugeot. Y no lo pienso arrugar.', ok: 'Dalia, ese top no se arruga: se admira. Desde lejos. Y desde delante de la cola.', mal: ['Mi Peugeot tiene siete plazas.', 'Pues yo voy en jersey y no me quejo.'], si: '¡Me encanta! Pasa, que te lo has ganado.', no: 'Siete plazas y cero glamour. Al fondo.' },
  ],
  monos: [
    { x: '¡Vale, vale, vale! Si quieres pasar, me tienes que hacer reír.', ok: 'Una monja, un pulpo y Ramis entran en la Lume…', mal: ['Es que no sé chistes.', '¿Conoces el del Peugeot?'], si: '¡Jajaja! No sé cómo acaba, pero pasa.', no: '¿El del Peugeot? Me lo contó tu amigo. Tres veces. Atrás.' },
    { x: 'Aquí se paga peaje, guapo: un baile.', ok: '(Te marcas un Paquito el Chocolatero apretando las piernas.)', mal: ['Yo no bailo, que me meo.', '¿Acepta tarjeta?'], si: '¡Eso es arte! ¡Pasa, artista!', no: 'Sin baile no hay baño. Al fondo.' },
  ],
};
const COLA_PROTA = {
  ramis: ['¡Bajo el yugo opresor… de la vejiga!', 'Habiendo haber podido aguantar… no puedo.'],
  marc: ['Me meo más que en un dibujo de Manara.', 'Esto no lo dibujo. Esto lo sufro.'],
  marcos: ['Tres litros de agua, que conduzco. TRES LITROS.', 'Tirada de salvación contra la vejiga… fallada.'],
  angel: ['Mi chakra de abajo está a punto de rebosar.', 'Respira, Ángel. Busca tu centro. Tu centro está lleno.'],
};

MG.banos = function () {
  const m = { drunk: 0, name: 'banos' };
  const drawImgH = MG.drawImgH;
  const FLOOR = 955, HP = 560, DOOR = 1490, VMAX = 75;
  let clock = 0, vej = 0.3, lleno = false, fallos = 0, ganado = false;
  let xBub = null, mBub = null, big = null, asking = false, keyPick = null, timeoutPick = null, puerta = 0, cola = [];
  const waits = [];
  const sleep = (s) => new Promise((r) => waits.push({ at: clock + s, r }));
  const mix = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const top = MG.bar('');
  // la cola: los de delante (el primero, junto a la puerta), tú y los que ya has adelantado
  const delante = mix(Object.keys(COLA)).slice(0, 5).map((id) => ({ id, k: (Math.random() * 2) | 0, x: 0, a: 1 }));
  const yo = { id: S.active, yo: true, x: 0, a: 1 };
  let detras = [];
  const slot = (i) => 1235 - i * 172;
  function colocar(inst) {
    const fila = delante.concat([yo], detras);
    fila.forEach((p, i) => { p.tx = p.salida ? DOOR : slot(i); if (inst) p.x = p.tx; });
  }
  colocar(true);
  function updTop() {
    const k = Math.min(1, vej), col = k < 0.6 ? '#7fd3ff' : k < 0.85 ? '#ffd94a' : '#ff6a5a';
    top.innerHTML = `💧 Me meo <span style="display:inline-block;width:320px;height:18px;margin:0 10px;border:2px solid #fff6e0;border-radius:10px;vertical-align:middle;overflow:hidden"><i style="display:block;height:100%;width:${Math.round(k * 100)}%;background:${col}"></i></span> · faltan ${delante.length}`;
  }
  function ask(v) {
    return new Promise((res) => {
      const list = mix([{ t: v.ok, k: 'ok' }].concat(v.mal.map((t) => ({ t, k: 'mal' }))));
      const box = document.createElement('div'); box.className = 'dopts';
      let done = false;
      const fin = (o) => { if (done) return; done = true; asking = false; keyPick = timeoutPick = null; box.remove(); sfx(o.k === 'lleno' ? 'error' : 'click'); res(o); };
      list.forEach((o, i) => {
        const b = document.createElement('button'); const n = document.createElement('b'); n.textContent = i + 1;
        b.append(n, ' ' + o.t); b.onpointerdown = (e) => { e.stopPropagation(); e.preventDefault(); fin(o); };
        box.appendChild(b);
      });
      $('mg').appendChild(box);
      asking = true; keyPick = (n) => list[n] && fin(list[n]); timeoutPick = () => fin({ t: '…', k: 'lleno' });
    });
  }
  async function run() {
    updTop();
    big = { t: 'LA COLA DEL BAÑO', c: '#ffd98a', t0: clock }; sfx('pasos'); await sleep(1.6); big = null;
    mBub = { t: pick(COLA_PROTA[S.active] || ['¡Me meo!']), t0: clock }; await sleep(2.2); mBub = null;
    while (delante.length && !lleno) {
      const p = delante[delante.length - 1], v = COLA[p.id][p.k % COLA[p.id].length]; p.k++;
      xBub = { t: v.x, t0: clock, who: p.id };
      await sleep(0.5);
      const o = await ask(v);
      if (o.k === 'lleno') break;
      mBub = { t: o.t, t0: clock }; await sleep(1.1);
      if (o.k === 'ok') {
        xBub = { t: v.si, t0: clock, who: p.id }; sfx('pop');
        delante.pop(); detras.unshift(p); colocar(); hopA2(yo); updTop();
        await sleep(1.7);
      } else {
        fallos++; vej += 0.13; shake(0.25); sfx('abucheo');
        xBub = { t: v.no, t0: clock, who: p.id };
        await sleep(1.9);
      }
      mBub = null; xBub = null;
      if (vej >= 1) lleno = true;
    }
    xBub = null; mBub = null;
    if (!lleno && !delante.length) {
      ganado = true; puerta = 0.001; sfx('door'); await sleep(0.5);
      yo.salida = true; colocar(); await sleep(0.9); sfx('cremallera'); await sleep(0.5); sfx('servir');
      big = { t: '¡LIBERADO!', c: '#9dffb0', t0: clock }; try { AUDIO.laugh('grupo'); } catch (e) {}
      await sleep(2.6);
    } else {
      lleno = true; sfx('fallo'); shake(0.6);
      big = { t: 'DEMASIADO TARDE…', c: '#ff8a7a', t0: clock };
      await sleep(2.6);
    }
    m.end({ win: ganado, fallos });
  }
  function hopA2(p) { p.hop = clock; }

  m.key = (k, d) => { if (d && keyPick && ['1', '2', '3'].includes(k)) keyPick(+k - 1); };
  m.down = () => {};
  m.update = (dt) => {
    clock += dt;
    for (let i = waits.length - 1; i >= 0; i--) if (clock >= waits[i].at) waits.splice(i, 1)[0].r();
    if (!ganado && !lleno && clock > 1.6) { vej += dt * 0.7 / VMAX; if (vej >= 1) { vej = 1; lleno = true; if (timeoutPick) timeoutPick(); } }
    for (const p of delante.concat([yo], detras)) { p.x += (p.tx - p.x) * Math.min(1, dt * 5); if (p.salida) p.a = Math.max(0, p.a - dt * 1.2); }
    if (puerta) puerta = Math.min(1, puerta + dt * 2.5);
    if (Math.floor(clock * 4) !== Math.floor((clock - dt) * 4)) updTop();
  };

  /* ---------- dibujo ---------- */
  function rr(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
  function lineas(c, text, maxW) { const out = []; let l = ''; for (const w of text.split(' ')) { const tt = l ? l + ' ' + w : w; if (c.measureText(tt).width > maxW && l) { out.push(l); l = w; } else l = tt; } out.push(l); return out; }
  function bocadillo(c, b, lado, y, fill, borde, cara, nombre) {
    const k = clamp((clock - b.t0) * 6, 0, 1); if (k <= 0) return;
    c.save(); c.globalAlpha = k; c.font = "800 34px 'Nunito'";
    const ls = lineas(c, b.t, 780), w = Math.max(...ls.map((l) => c.measureText(l).width)) + 56, lh = 42, h = ls.length * lh + 34 + (nombre ? 30 : 0);
    const x = lado === 'r' ? 1400 - w : 230;
    c.translate(0, (1 - k) * 14);
    rr(c, x, y, w, h, 18); c.fillStyle = fill; c.fill(); c.lineWidth = 4; c.strokeStyle = borde; c.stroke();
    let ty = y + 19;
    if (nombre) { c.font = "800 22px 'Cinzel', serif"; c.fillStyle = borde; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(nombre, x + 28, ty); ty += 30; c.font = "800 34px 'Nunito'"; }
    c.fillStyle = '#fff'; c.textAlign = 'left'; c.textBaseline = 'top';
    ls.forEach((l, i) => c.fillText(l, x + 28, ty + i * lh));
    if (G.img[cara]) drawImgH(c, cara, lado === 'r' ? 1490 : 130, y + h / 2 + 80, 160);
    c.restore();
  }
  function pasillo(c, t) {
    if (G.img['bg/banos']) { c.drawImage(G.img['bg/banos'], 0, 0, W, H); return; }
    // el pasillo de los baños, a la luz morada de la Lume
    let g = c.createLinearGradient(0, 0, 0, 760); g.addColorStop(0, '#0d0718'); g.addColorStop(1, '#22123a'); c.fillStyle = g; c.fillRect(0, 0, W, 760);
    // azulejos negros en la parte baja de la pared
    c.fillStyle = '#140c22'; c.fillRect(0, 560, W, 200);
    c.strokeStyle = 'rgba(160,110,255,.12)'; c.lineWidth = 2;
    for (let x = 0; x <= W; x += 64) { c.beginPath(); c.moveTo(x, 560); c.lineTo(x, 760); c.stroke(); }
    for (let y = 560; y <= 760; y += 50) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    // suelo brillante
    g = c.createLinearGradient(0, 760, 0, H); g.addColorStop(0, '#1c1030'); g.addColorStop(1, '#07040d'); c.fillStyle = g; c.fillRect(0, 760, W, H - 760);
    c.strokeStyle = 'rgba(200,140,255,.08)'; for (let i = -10; i <= 20; i++) { c.beginPath(); c.moveTo(800 + i * 40, 760); c.lineTo(800 + i * 170, H); c.stroke(); }
    // el neón de arriba
    c.save(); c.globalCompositeOperation = 'lighter';
    c.fillStyle = 'rgba(255,60,200,.9)'; c.fillRect(0, 128, W, 5);
    g = c.createLinearGradient(0, 70, 0, 200); g.addColorStop(0, 'rgba(255,60,200,0)'); g.addColorStop(0.5, 'rgba(255,60,200,.22)'); g.addColorStop(1, 'rgba(255,60,200,0)'); c.fillStyle = g; c.fillRect(0, 70, W, 130);
    c.restore();
    // la puerta «fuera de servicio» (a la izquierda) y la buena (a la derecha)
    c.fillStyle = '#2a1f3a'; c.fillRect(30, 300, 170, 460); c.strokeStyle = '#4b3a66'; c.lineWidth = 6; c.strokeRect(30, 300, 170, 460);
    c.save(); c.translate(115, 470); c.rotate(-0.06); c.fillStyle = '#f2ead6'; c.fillRect(-70, -40, 140, 80); c.fillStyle = '#c02020'; c.font = "800 19px 'Nunito'"; c.textAlign = 'center'; c.fillText('FUERA DE', 0, -8); c.fillText('SERVICIO', 0, 16); c.restore();
    const ab = ease(puerta);
    c.fillStyle = '#05030a'; c.fillRect(1405, 290, 170, 470);
    c.save(); c.translate(1405, 290); c.scale(1 - ab * 0.82, 1);
    c.fillStyle = '#3a2a52'; c.fillRect(0, 0, 170, 470); c.strokeStyle = '#6a52a0'; c.lineWidth = 6; c.strokeRect(0, 0, 170, 470);
    c.fillStyle = '#d9c38a'; c.beginPath(); c.arc(148, 250, 9, 0, 7); c.fill();
    c.font = '64px serif'; c.textAlign = 'center'; c.fillText('🚻', 85, 160);
    c.restore();
    // el cartel de neón «WC»
    const fl = 0.85 + 0.15 * Math.sin(t * 13) * (Math.sin(t * 0.7) > 0.93 ? 1 : 0.1);
    c.save(); c.globalAlpha = fl; c.font = "800 52px 'Cinzel', serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = '#ff5ad2'; c.shadowBlur = 30; c.fillStyle = '#ffd0f4'; c.fillText('WC', 1490, 263); c.shadowBlur = 0; c.restore();
  }
  m.draw = (c, t) => {
    pasillo(c, t);
    const fila = detras.slice().reverse().concat([yo], delante.slice());
    // de atrás hacia delante: los de la izquierda primero
    fila.sort((a, b) => a.x - b.x).forEach((p) => {
      if (p.a <= 0.01) return;
      const src = p.yo ? bodySprite(p.id) : crowdSprite(p.id);
      const actual = !p.yo && delante.length && p === delante[delante.length - 1];
      let y = FLOOR, dx = 0;
      if (p.yo) { if (!ganado) dx = Math.sin(clock * (8 + vej * 18)) * vej * 7; if (p.hop && clock - p.hop < 0.45) y -= Math.sin((clock - p.hop) / 0.45 * Math.PI) * 40; }
      c.save(); c.globalAlpha = p.a * (detras.includes(p) ? 0.55 : 1);
      if (actual) { c.shadowColor = 'rgba(255,217,138,.8)'; c.shadowBlur = 24; }
      drawImgH(c, src, p.x + dx, y, p.yo ? HP + 20 : HP);
      c.restore();
    });
    // sombras de color de la pista que se cuelan
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(200 + Math.sin(t) * 120, 300, 10, 200, 300, 520); g.addColorStop(0, 'rgba(80,120,255,.12)'); g.addColorStop(1, 'rgba(80,120,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.restore();
    if (xBub) bocadillo(c, xBub, 'r', 60, 'rgba(36,14,52,.94)', '#ff9ae6', 'faces/' + xBub.who + '_normal', NAMES[xBub.who]);
    if (mBub) bocadillo(c, mBub, 'l', 330, 'rgba(14,26,52,.94)', '#ffd98a', 'faces/' + S.active + '_normal');
    if (big) { const k = clamp((clock - big.t0) * 4, 0, 1), s = 1.6 - 0.6 * k; c.save(); c.globalAlpha = k; c.translate(W / 2, 300); c.scale(s, s); c.translate(-W / 2, -300); MG.bigText(c, big.t, 330, big.c, 110); c.restore(); }
  };
  const p = MG.begin(m);
  if (!TEST) run();
  return p;
};

/* ---------- en la Lume: el pasillo de los baños ---------- */
async function banoLume() {
  if (!flag('colaVista')) {
    flag('colaVista', 1);
    await narr('Al fondo de la Lume, un pasillo con luz morada y un neón que parpadea: «WC». Delante, una cola que llega hasta la pista.');
  }
  await say(S.active, pick(COLA_PROTA[S.active] || ['¡Me meo!']), 'sorpresa');
  const r = await MG.banos();
  const win = r === undefined || r === true || !!(r && r.win);
  if (win) {
    await narr('Unos minutos después, la puerta se abre y sale un caballero nuevo. Más ligero. Más sabio. Con las manos sin secar.');
    if (S.drunk[S.active] > 0) { drink(S.active, -1); await say(S.active, 'Uf. Como nuevo. Hasta se me ha bajado un poco el pedo.', 'risa'); }
    else await say(S.active, 'Uf. Esto sí que es vivir.', 'risa');
    logro('cola');
  } else {
    await narr('Plan B: el callejón de detrás de los soportales. Un gato os mira con un desprecio que no se os va a olvidar.');
    await say('ramis', 'Bajo el yugo opresor… y bajo la mirada de un gato.', 'risa');
  }
}

// el cartel del baño y su zona en la discoteca
if (typeof SCENES !== 'undefined' && SCENES.disco) {
  SCENES.disco.hs.push({ name: 'Baños', r: [1375, 160, 140, 330], verbs: {
    'Entrar|Ir al baño': () => banoLume(),
    'Mirar': () => say(S.active, 'Un pasillo con luz morada y un neón: «WC». La cola llega hasta la pista. Mala señal.'),
  } });
  const antes = SCENES.disco.drawTop;
  SCENES.disco.drawTop = function (c, t) {
    if (antes) antes.call(this, c, t);
    const fl = 0.85 + 0.15 * Math.sin(t * 13) * (Math.sin(t * 0.7) > 0.93 ? 1 : 0.1);
    c.save(); c.globalAlpha = fl; c.font = "800 46px 'Cinzel', serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = '#ff5ad2'; c.shadowBlur = 26; c.fillStyle = '#ffd0f4'; c.fillText('WC ➜', 1445, 215); c.restore();
  };
}
