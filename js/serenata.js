'use strict';
/* =====================================================================
   v27 · La serenata en el callejón
   Después del beso, al volver a los soportales, Ángel oye una puerta en
   el callejón de atrás del pub: es ella, la chica del beso. «¿Estoy muy
   borracho… o esta chica me recuerda a Maje?»
   Minijuego: cuatro estrofas. En cada una eliges el verso (bonito, regular
   o desastre) y lo cantas cuando la aguja de la afinación está en verde.
   Cuanto más borracho, más baila la aguja. Ella reacciona a cada verso:
   se ríe, se derrite o se muere de vergüenza.
   ===================================================================== */
LOGROS.serenata = { i: '🎸', t: 'Serenata en el callejón' };
EXTRA_ASSETS.push('chars/angel_guitarra', 'chars/angel_guitarra2', 'chars/chica_suena', 'chars/chica_timida', 'chars/chica_risa');
// [bonito, regular, desastre]
const SERENATA_VERSOS = [
  ['Bajo el farol de esta calle, te vi… y se me paró el reloj', 'Hola, soy Ángel, el del beso. El de las gafas, ¿te acuerdas?', 'Tienes los ojos más bonitos… que el Peugeot de Marcos'],
  ['Tu pelo es como el orballo: me empapa sin darme cuenta', 'Eres guapa, eres guapa, eres… muy guapa, de verdad', 'Te quiero más que Ramis al gin-tonic. Bueno, casi igual'],
  ['Si me miras otra vez, me olvido de cómo me llamo', 'Me recuerdas a alguien… pero eso no se dice en una canción', '¿Crees en las meigas? Porque una me dijo que ibas a salir'],
  ['Que esta noche no se acabe… y si se acaba, que sea contigo', 'Y ya está, que se me ha acabado la letra', '¡Nunca más… hasta el sábado! ¡OI! ¡OI! ¡OI!'],
];
const SERENATA_REACCION = {
  2: ['Ay, barbas… para.', '¿Eso lo has escrito tú?', 'Sigue, sigue…'],
  1: ['Bueno… se te entiende.', 'Jajaja. Vale, vale.', 'Esa rima es regulera, ¿eh?'],
  0: ['¿¡En serio!?', 'Que me oyen los vecinos…', 'Barbas, por favor.'],
};

MG.serenata = function () {
  const m = { drunk: 0, name: 'serenata' };
  const drawImgH = MG.drawImgH;
  const T_LINEA = 8, MX = 800, MY = 300, MW = 520;
  const borra = S ? S.drunk.angel : 0;
  let clock = 0, linea = 0, lt = 0, aguja = 0.5, vel = 0.55 + borra * 0.09, dir = 1, fin = false, puntos = [], cantado = null, cantT = 0, reac = null, pose = 'chica', strumT = -9;
  const top = MG.bar('');
  const updTop = () => (top.innerHTML = `🎸 Estrofa ${Math.min(linea + 1, 4)} de 4 · elige el verso cuando la aguja esté en verde`);
  let btns = [];
  function ponerVersos() {
    btns.forEach((b) => b.remove());
    const v = SERENATA_VERSOS[linea].map((t, q) => ({ t, q })).sort(() => Math.random() - 0.5);
    btns = v.map((o, i) => { const b = MG.btn('♪ ' + o.t, MX, 690 + i * 92, 'grn', () => cantar(o)); b.style.maxWidth = '1100px'; b.style.whiteSpace = 'nowrap'; return b; });
    lt = 0; updTop();
  }
  function cantar(o) {
    if (fin || cantado) return;
    const off = Math.abs(aguja - 0.5), af = off < 0.1 ? 1 : off < 0.2 ? 0.5 : 0;
    const q = o ? 2 - o.q : -1;   // 2 bonito · 1 regular · 0 desastre · -1 no canta
    const nota = Math.max(0, q) + af;
    puntos.push(nota);
    cantado = { t: o ? o.t : 'La la la… la la… (se le ha olvidado la letra)', af }; cantT = 0; strumT = clock;
    btns.forEach((b) => b.classList.add('hidden'));
    sfx(af >= 1 ? 'ok' : af > 0 ? 'tic' : 'error');
    const r = q >= 2 && af > 0 ? 2 : q <= 0 || af === 0 ? 0 : 1;
    pose = r === 2 ? (linea >= 2 ? 'chica_suena' : 'chica_risa') : r === 1 ? 'chica_risa' : 'chica_timida';
    reac = { t: (af === 0 && q > 0 ? '¡Qué desafinado! ' : '') + pick(SERENATA_REACCION[r]), hasta: clock + 3 };
    if (r === 2) emit('heart', 1150, 520, 8, { sx: 60, sy: 40 });
  }
  m.key = (k, d) => { if (!d || cantado) return; const i = '123'.indexOf(k); if (i >= 0 && btns[i]) btns[i].onpointerdown({ stopPropagation() {}, preventDefault() {} }); };
  m.update = (dt) => {
    clock += dt;
    // la aguja de afinación: va y viene; borracho, más rápida y a trompicones
    aguja += dir * vel * dt * (1 + Math.sin(clock * 7) * 0.25 * Math.min(1, borra / 3));
    if (aguja > 1) { aguja = 1; dir = -1; } if (aguja < 0) { aguja = 0; dir = 1; }
    if (fin) return;
    if (!cantado) { lt += dt; if (lt > T_LINEA) cantar(null); }
    else {
      cantT += dt;
      if (Math.random() < dt * 6) emit('note', 470 + rnd(-30, 30), 520, 1, { color: cantado.af ? '#ffd98a' : '#9a9a9a' });
      if (cantT > 3.4) {
        cantado = null; linea++;
        if (linea >= 4) {
          fin = true;
          const nota = puntos.reduce((a, b) => a + b, 0) / puntos.length;
          pose = nota >= 2.2 ? 'chica_suena' : nota >= 1.3 ? 'chica_risa' : 'chica_timida';
          setTimeout(() => m.end({ nota }), 1600);
        } else ponerVersos();
      }
    }
  };
  m.draw = (c, t) => {
    MG.bg(c, 'callejon', 0.25);
    // Ángel con la guitarra (cambia de postura al rasguear)
    const ap = clock - strumT < 3.4 && Math.floor(clock * 3) % 2 ? 'chars/angel_guitarra2' : 'chars/angel_guitarra';
    c.save(); c.globalAlpha = 0.4; c.fillStyle = '#000'; c.beginPath(); c.ellipse(470, 996, 90, 14, 0, 0, 7); c.fill(); c.restore();
    drawImgH(c, G.img[ap] ? ap : 'chars/angel', 470, 1000, 560, { rot: Math.sin(t * 2) * 0.012 * (1 + borra * 0.3) });
    // ella, en la puerta del fondo
    const sp = 'chars/' + (G.img['chars/' + pose] ? pose : 'chica');
    c.save(); c.globalAlpha = 0.4; c.fillStyle = '#000'; c.beginPath(); c.ellipse(1150, 916, 70, 12, 0, 0, 7); c.fill(); c.restore();
    drawImgH(c, sp, 1150, 920, 470 * (POSE_H[sp] || 1));
    drawParticles(c);
    // la aguja de afinación
    if (!fin) {
      c.save();
      c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(MX - MW / 2 - 10, MY - 22, MW + 20, 44);
      c.fillStyle = 'rgba(255,90,90,.35)'; c.fillRect(MX - MW / 2, MY - 14, MW, 28);
      c.fillStyle = 'rgba(255,210,58,.45)'; c.fillRect(MX - MW * 0.2, MY - 14, MW * 0.4, 28);
      c.fillStyle = 'rgba(120,255,150,.7)'; c.fillRect(MX - MW * 0.1, MY - 14, MW * 0.2, 28);
      const ax = MX - MW / 2 + aguja * MW; c.fillStyle = '#fff'; c.fillRect(ax - 4, MY - 26, 8, 52);
      c.font = "800 22px 'Nunito'"; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText('🎵 afinación', MX, MY - 36);
      if (!cantado) { c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(MX - MW / 2, MY + 30, MW, 8); c.fillStyle = '#ffd98a'; c.fillRect(MX - MW / 2, MY + 30, MW * clamp(1 - lt / T_LINEA, 0, 1), 8); }
      c.restore();
    }
    // lo que canta Ángel
    if (cantado) {
      c.save(); c.font = "italic 700 34px 'Cinzel', serif"; c.textAlign = 'center'; c.lineWidth = 8; c.strokeStyle = 'rgba(0,0,0,.85)'; c.fillStyle = cantado.af ? '#ffe9a8' : '#c8c8c8';
      const tx = '♪ ' + cantado.t + ' ♪'; c.strokeText(tx, W / 2, 200); c.fillText(tx, W / 2, 200); c.restore();
    }
    // lo que dice ella
    if (reac && clock < reac.hasta) {
      c.save(); c.font = "800 30px 'Nunito'"; c.textAlign = 'center'; c.lineWidth = 7; c.strokeStyle = '#000'; c.fillStyle = '#ffb3d9';
      c.strokeText(reac.t, 1150, 440); c.fillText(reac.t, 1150, 440); c.restore();
    }
  };
  ponerVersos();
  return MG.begin(m);
};

/* ---------- la escena: al volver a los soportales después del beso ---------- */
async function serenataAngel() {
  await narr('Al pasar por el callejón de detrás del pub, se abre una puerta. Es ella. La chica del beso.');
  await say('angel', '¿Estoy muy borracho… o esta chica me recuerda a Maje?', 'sorpresa');
  await say('marc', 'Las dos cosas, barbas. Saca la guitarra.');
  await say('ramis', '¿De dónde has sacado una guitarra?', 'sorpresa');
  await say('angel', 'Un caballero siempre lleva una guitarra. Y omeprazol.');
  music('beso'); try { AUDIO.duck(true); } catch (e) {}
  const r = await MG.serenata();
  try { AUDIO.duck(false); } catch (e) {}
  const nota = r && r.nota !== undefined ? r.nota : 2.5;
  flag('serenata', 1);
  if (nota >= 2.2) {
    await say('chica', 'Nadie me había cantado nunca en un callejón. Ni sobrio ni borracho.', 'suena');
    await say('angel', 'Por un momento pensé que eras… otra persona.');
    await say('chica', 'Esta noche soy la del callejón, barbas. Con eso vale.', 'risa');
    logro('serenata');
  } else if (nota >= 1.3) {
    await say('chica', 'Desafinas un poco… pero tienes algo, barbas.', 'risa');
    await say('angel', 'Tengo barba. Y una guitarra que no sé de dónde ha salido.');
  } else {
    await say('chica', 'Ay, barbas… mejor canta en la ducha. Buenas noches.', 'timida');
    await say('marcos', 'Eso ha sido… valiente. Muy valiente.', 'risa');
  }
  await narr('La puerta del callejón se cierra despacio. Ángel guarda la guitarra. Nadie sabe dónde.');
  if (G.scene && G.scene.music) music(G.scene.music);
}
if (typeof goScene === 'function') {
  const _gs = goScene;
  goScene = async function (id) {
    const r = await _gs.apply(this, arguments);
    const vc = typeof VC !== 'undefined' && VC.on;
    // se ofrece como mucho dos veces (si decís que no, a la segunda ya no insiste)
    if (id === 'calle' && !vc && S && S.flags.beso && !S.flags.serenata && (S.flags.serenataNo || 0) < 2) {
      const v = await choose([{ t: '«Vamos, que se hace tarde»', v: 0 }, { t: '🎸 Ángel: «Esperad… ¿habéis oído esa puerta?»', v: 1 }]);
      if (v) await serenataAngel(); else S.flags.serenataNo = (S.flags.serenataNo || 0) + 1;
    }
    return r;
  };
}
