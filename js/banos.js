'use strict';
/* =====================================================================
   v18-v19 · La cola del baño de O Furado
   El que juegas está a reventar y delante hay una cola de gente del
   antro. Para colarse hay que convencer a cada uno con lo que le va: a
   Tino, algo punk; a Xurxo, un brindis; a Nando, un chiste malo…
   La barrita «me meo» no para de subir y cada metedura de pata la sube
   más. Si llegas a la puerta: logro y se te baja un poco la borrachera.
   Si se llena: plan B en el callejón.
   Fondo: el pasillo de los baños dibujado por JRAR (img/bg/banos.webp);
   la cola va en perspectiva, de tu personaje (delante) a la puerta.
   ===================================================================== */
LOGROS.cola = { i: '🚽', t: 'Me colé en el baño de O Furado' };
EXTRA_ASSETS.push('chars/senora_habla', 'chars/senora_piensa', 'chars/senora_sorpresa');   // v19: poses de la señora

// cada uno: varias maneras de pedirle paso. x: lo que te suelta · ok: lo que le convence · mal: dos meteduras de pata · si / no: su respuesta
const COLA = {
  tino: [
    { x: '¿Colarte en MI bar? En O Furado hay dos normas: no hay normas… y en el baño se hace cola.', ok: 'Tino, en la Lume dicen que tu antro es para turistas.', mal: ['¿Y si te pago la cerveza?', 'Es que soy amigo del dueño.'], si: '¿¡QUÉ!? ¿Esos pijos? ¡Pasa, pasa, que voy a hablar con ellos!', no: '¿Amigo del dueño? El dueño soy yo, listo. Al fondo.' },
    { x: 'Cuarenta años de punk. He hecho colas más largas para ver a los Ramones.', ok: '¡Hey, ho, let\'s go!… al baño, Tino.', mal: ['¿Los Ramones son de aquí?', 'A mí me gusta más el reguetón.'], si: '¡Ja! ¡Eso es punk! Pasa, chaval.', no: '¿Reguetón? Fuera de mi vista. Al fondo.' },
  ],
  xurxo: [
    { x: '¡Un brindis! Si no brindas conmigo, no pasas.', ok: '¡Por la peña, por O Furado… y por mi vejiga!', mal: ['Brinda tú, que yo tengo prisa.', 'Yo no brindo con desconocidos.'], si: '¡VIVA! ¡Por la vejiga! Pasa, campeón.', no: '¿Sin brindar? Eso es de mala educación. Atrás.' },
    { x: 'Llevo el vaso en alto desde hace tres horas. ¿Brindo o pido un taxi?', ok: 'Xurxo, te pido yo el taxi y te guardo el sitio para cuando vuelvas.', mal: ['Bájalo ya, que se te duerme el brazo.', '¿Y para qué lo tienes en alto?'], si: '¿Un taxi? ¡Eres un caballero! Pasa, pasa.', no: 'Si lo bajo, se acaba la fiesta. Y tú, al fondo.' },
  ],
  nando: [
    { x: '¡Jajaja! ¿Te meas? ¡Jajaja! ¡Yo también!', ok: 'Nando, ¡no me hagas reír, que es peor!', mal: ['No tiene gracia.', '¿De qué te ríes?'], si: '¡JAJAJA! Vale, vale, pasa antes de que haya una desgracia.', no: '¡Jajaja! ¡De ti! Al fondo. ¡Jajaja!' },
    { x: 'Cuéntame un chiste y te dejo pasar. Pero que sea malo, ¿eh?', ok: '¿Qué hace un pulpo en O Furado? ¡Pogo con ocho brazos!', mal: ['No sé chistes.', 'El chiste es esta cola.'], si: '¡JAJAJA! ¡Malísimo! ¡Pasa, pasa!', no: 'Eso no tiene gracia. Bueno, un poco. Pero al fondo.' },
  ],
  vera: [
    { x: 'Aquí mando yo. Y yo digo que esperas.', ok: 'Vera, mi amigo Marc te quiere dibujar otra vez. Dice que eres su musa.', mal: ['¿Y quién te ha nombrado jefa?', '¿Me lo dices o me lo cuentas?'], si: '¿Su musa? Bueno… pasa, que voy a buscarle.', no: 'Me nombré yo. Al fondo.' },
    { x: '¿Ves estas botas militares? Han pisado a gente más alta que tú.', ok: 'Por eso me cuelo con cuidado, Vera: de puntillas y con respeto.', mal: ['¿Son de rebajas?', 'Yo calzo un cuarenta y seis.'], si: '¡Ja! Me gusta la gente que sabe dónde se mete. Pasa.', no: 'Y yo te piso igual. Al fondo.' },
  ],
  carla: [
    { x: '¡Hola, mis viralitos! Estoy en directo, ¿eh? Si te cuelas sales en mis stories.', ok: 'Carla, en el escenario está pasando algo viral ahora mismo. ¡Corre!', mal: ['¡Hola, mamá, salgo en la tele!', '¿Y cuántos seguidores tienes?'], si: '¿¡Viral!? ¡Me voy! ¡Viralitos, seguidme!', no: 'Más que tú. Al fondo, que te grabo.' },
    { x: 'Shhh, que tengo dos mil personas viéndome hacer cola.', ok: 'Pues que te vean dejar pasar a un caballero. Queda genial en cámara.', mal: ['Esto es un baño, no un plató.', 'Saluda a mi primo de Lugo.'], si: 'Mmm… buen contenido. Pasa, pasa, caballero.', no: 'Todo es un plató, cariño. Al fondo.' },
  ],
  // los de la madrugada (solo si ya es tarde)
  rockera: [
    { x: '¿Tú no venías con el de la guitarra? Si el barbas no toca otra, no pasas.', ok: 'Ángel toca en cinco minutos. Si te das prisa, primera fila.', mal: ['El barbas está meando.', 'Ángel solo toca la flauta.'], si: '¿Ya? ¡Me pido primera fila! Pasa.', no: '¿La flauta? Eso es un insulto. Al fondo.' },
    { x: 'He pisado más escenarios que tu amigo. Y más baños que ninguno.', ok: 'Pues tú sabes lo que es una urgencia de camerino. ¡Déjame!', mal: ['¿Cuántos escenarios?', 'Mi amigo ha tocado en Coruña.'], si: 'Urgencia de camerino… respeto. Pasa.', no: 'Coruña… qué tierno. Al fondo.' },
  ],
  gotica: [
    { x: 'Veo tu pasado… y veo que llegaste el último.', ok: '¿Y mi futuro, Xiana? Porque si no paso, es húmedo.', mal: ['¿Me lees la mano?', 'El pasado es pasado.'], si: '…Vale, eso no lo quiero ver. Pasa.', no: 'Tu pasado dice que esperas. Al fondo.' },
    { x: 'Las sombras me dicen que no te deje pasar.', ok: 'Pues diles a las sombras que la primera ronda la pago yo.', mal: ['Las sombras no hablan.', 'Enciende la luz y verás.'], si: 'Las sombras aceptan. Pasa.', no: 'Las sombras se han ofendido. Al fondo.' },
  ],
  bicolor: [
    { x: 'No sé si estoy en la cola o no. Soy muy indecisa.', ok: 'Lis, mejor paso yo y así no tienes que decidir nada.', mal: ['Estás en la cola.', 'No estás en la cola.'], si: 'Ay, sí, gracias. Qué alivio no elegir.', no: '¿Seguro? Ahora me has liado más. Espera ahí.' },
    { x: '¿Blanco o negro? ¿Entro o no entro? ¿Me meo o no?', ok: 'Tú no, Lis. Yo sí. Problema resuelto.', mal: ['Échalo a suertes.', 'Las dos cosas.'], si: '¡Por fin alguien que decide! Pasa.', no: 'Ya estoy peor. Quédate detrás.' },
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
  const VMAX = 75;
  let clock = 0, vej = 0.3, lleno = false, fallos = 0, ganado = false;
  let xBub = null, mBub = null, big = null, asking = false, keyPick = null, timeoutPick = null;
  const waits = [];
  const sleep = (s) => new Promise((r) => waits.push({ at: clock + s, r }));
  const mix = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const top = MG.bar('');
  // los del antro (los de la madrugada, solo si ya es tarde)
  const pool = ['tino', 'xurxo', 'nando', 'vera', 'carla'].concat(typeof nocheFase === 'function' && nocheFase() >= 1 ? ['rockera', 'gotica', 'bicolor'] : []);
  const delante = mix(pool).slice(0, 5).map((id) => ({ id, k: (Math.random() * 2) | 0 }));
  const yo = { id: S.active, yo: true };
  let detras = [];
  // la cola en perspectiva: f=0 junto a la puerta, f=1 delante del todo
  // en diagonal junto a las cintas: de la puerta (fondo) a la derecha de la pantalla (delante)
  const enCola = (f) => ({ x: 700 + 600 * f, y: 695 + 300 * f, h: 300 + 320 * f });
  const N = 5;
  function colocar(inst) {
    const fila = delante.concat([yo]);
    fila.forEach((p, i) => { const q = p.salida ? enCola(0) : enCola(Math.pow(i / N, 1.35)); p.tx = q.x; p.ty = q.y; p.th = q.h; });
    detras.forEach((p, j) => { p.tx = 470 - j * 150; p.ty = 1070; p.th = 640; });
    if (inst) for (const p of fila.concat(detras)) { p.x = p.tx; p.y = p.ty; p.h = p.th; p.a = 1; }
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
        delante.pop(); detras.unshift(p); colocar(); yo.hop = clock; updTop();
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
      ganado = true;
      // la puerta tiene el muñeco de chicas…
      mBub = { t: '¿El de chicas? A estas horas, todos los baños son mixtos.', t0: clock }; await sleep(2.2); mBub = null;
      yo.salida = true; colocar(); sfx('door'); await sleep(1.2); sfx('cremallera'); await sleep(0.5); sfx('servir');
      big = { t: '¡LIBERADO!', c: '#9dffb0', t0: clock }; try { AUDIO.laugh('grupo'); } catch (e) {}
      await sleep(2.6);
    } else {
      lleno = true; sfx('fallo'); shake(0.6);
      big = { t: 'DEMASIADO TARDE…', c: '#ff8a7a', t0: clock };
      await sleep(2.6);
    }
    m.end({ win: ganado, fallos });
  }

  m.key = (k, d) => { if (d && keyPick && ['1', '2', '3'].includes(k)) keyPick(+k - 1); };
  m.down = () => {};
  m.update = (dt) => {
    clock += dt;
    for (let i = waits.length - 1; i >= 0; i--) if (clock >= waits[i].at) waits.splice(i, 1)[0].r();
    if (!ganado && !lleno && clock > 1.6) { vej += dt * 0.7 / VMAX; if (vej >= 1) { vej = 1; lleno = true; if (timeoutPick) timeoutPick(); } }
    const k = Math.min(1, dt * 4);
    for (const p of delante.concat([yo], detras)) { p.x += (p.tx - p.x) * k; p.y += (p.ty - p.y) * k; p.h += (p.th - p.h) * k; if (p.salida && Math.abs(p.y - p.ty) < 40) p.a = Math.max(0, p.a - dt * 1.4); }
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
  // v19: cada uno, con la luz del sitio donde está: al fondo (junto a la puerta) oscuro y rosado
  // por el neón; delante, más claro; el que te está hablando, un poco más iluminado
  const tmp = document.createElement('canvas'), tx = tmp.getContext('2d');
  function luz(c, src, x, y, h, foco) {
    const im = G.img[src]; if (!im) return;
    const w = Math.round(im.width * h / im.height), hh = Math.round(h);
    if (tmp.width < w || tmp.height < hh) { tmp.width = Math.max(tmp.width, w); tmp.height = Math.max(tmp.height, hh); }
    tx.clearRect(0, 0, tmp.width, tmp.height); tx.globalCompositeOperation = 'source-over'; tx.drawImage(im, 0, 0, w, hh);
    const f = clamp((h - 300) / 320, 0, 1);                 // 0 = junto a la puerta, 1 = delante del todo
    const osc = (0.62 * (1 - f) + 0.08) * (foco ? 0.55 : 1);
    tx.globalCompositeOperation = 'source-atop';
    tx.fillStyle = 'rgba(14,4,22,' + osc.toFixed(3) + ')'; tx.fillRect(0, 0, w, hh);
    // el neón rosa del fondo y la luz morada de los focos, de arriba abajo
    const g = tx.createLinearGradient(0, 0, 0, hh);
    g.addColorStop(0, 'rgba(255,40,120,' + (0.22 * (1 - f) + 0.06).toFixed(3) + ')'); g.addColorStop(1, 'rgba(120,50,255,' + (0.16 + 0.08 * f).toFixed(3) + ')');
    tx.fillStyle = g; tx.fillRect(0, 0, w, hh);
    // reflejo de la lámpara roja (a la izquierda) en el lado que da a ella
    const r = tx.createLinearGradient(0, 0, w, 0); r.addColorStop(0, 'rgba(255,60,60,' + (0.18 * f).toFixed(3) + ')'); r.addColorStop(0.5, 'rgba(255,60,60,0)');
    tx.fillStyle = r; tx.fillRect(0, 0, w, hh);
    tx.globalCompositeOperation = 'source-over';
    c.drawImage(tmp, 0, 0, w, hh, x - w / 2, y - hh, w, hh);
  }
  m.draw = (c, t) => {
    if (G.img['bg/banos']) c.drawImage(G.img['bg/banos'], 0, 0, W, H);
    else { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#12081e'); g.addColorStop(1, '#2a1238'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
    // de lejos a cerca: los de la puerta primero
    const fila = delante.concat([yo], detras).slice().sort((a, b) => a.y - b.y);
    const actual = delante.length ? delante[delante.length - 1] : null;
    for (const p of fila) {
      if (p.a <= 0.01) continue;
      const src = p.yo ? bodySprite(p.id) : crowdSprite(p.id);
      let x = p.x, y = p.y;
      if (p.yo) { if (!ganado) x += Math.sin(clock * (8 + vej * 18)) * vej * 7; if (p.hop && clock - p.hop < 0.45) y -= Math.sin((clock - p.hop) / 0.45 * Math.PI) * 30; }
      // sombra
      c.save(); c.globalAlpha = 0.45 * p.a; c.fillStyle = '#000'; c.beginPath(); c.ellipse(x, y - 3, p.h * 0.17, p.h * 0.03, 0, 0, 7); c.fill(); c.restore();
      c.save(); c.globalAlpha = p.a * (detras.includes(p) ? 0.6 : 1);
      if (p === actual) { c.shadowColor = 'rgba(255,217,138,.85)'; c.shadowBlur = 24; }
      luz(c, src, x, y, p.h, p === actual);
      c.restore();
    }
    // la luz morada y roja del pasillo por encima, para que todos «estén» dentro
    c.save(); c.globalCompositeOperation = 'soft-light'; c.globalAlpha = 0.45;
    const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#a03cff'); g.addColorStop(0.5, '#ff2a6a'); g.addColorStop(1, '#7a3cff'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.restore();
    if (xBub) bocadillo(c, xBub, 'r', 40, 'rgba(36,14,52,.94)', '#ff9ae6', 'faces/' + xBub.who + '_normal', NAMES[xBub.who]);
    if (mBub) bocadillo(c, mBub, 'l', 600, 'rgba(14,26,52,.94)', '#ffd98a', 'faces/' + S.active + '_normal');
    if (big) { const k = clamp((clock - big.t0) * 4, 0, 1), s = 1.6 - 0.6 * k; c.save(); c.globalAlpha = k; c.translate(W / 2, 300); c.scale(s, s); c.translate(-W / 2, -300); MG.bigText(c, big.t, 330, big.c, 110); c.restore(); }
  };
  const p = MG.begin(m);
  if (!TEST) run();
  return p;
};

/* ---------- en O Furado: el pasillo de los baños ---------- */
async function banoFurado() {
  if (!flag('colaVista')) {
    flag('colaVista', 1);
    await narr('Al fondo de O Furado, un pasillo lleno de carteles punk y un neón que parpadea: «WC →». Delante, una cola con cintas, como en el aeropuerto.');
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
    await narr('Plan B: el callejón de detrás de O Furado. Un gato os mira con un desprecio que no se os va a olvidar.');
    await say('ramis', 'Bajo el yugo opresor… y bajo la mirada de un gato.', 'risa');
  }
}

// el cartel del baño y su zona en O Furado
if (typeof SCENES !== 'undefined' && SCENES.antro) {
  SCENES.antro.hs.push({ name: 'Baños', r: [700, 300, 140, 380], verbs: {
    'Entrar|Ir al baño': () => banoFurado(),
    'Mirar': () => say(S.active, 'Un pasillo con carteles punk y un neón: «WC». La cola llega hasta el escenario. Mala señal.'),
  } });
  const antes = SCENES.antro.drawTop;
  SCENES.antro.drawTop = function (c, t) {
    if (antes) antes.call(this, c, t);
    const fl = 0.85 + 0.15 * Math.sin(t * 13) * (Math.sin(t * 0.7) > 0.93 ? 1 : 0.1);
    c.save(); c.globalAlpha = fl; c.font = "800 40px 'Cinzel', serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = '#ff2a6a'; c.shadowBlur = 24; c.fillStyle = '#ffd0dc'; c.fillText('WC ➜', 770, 285); c.restore();
  };
}
