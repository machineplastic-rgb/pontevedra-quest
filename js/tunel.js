'use strict';
/* =====================================================================
   v26 · El túnel secreto del Bar Estrella
   Al final, en el balneario, Toño el peregrino os da una llave que se
   encontró en el Camino y os dice que abre algo bajo el Bar Estrella.
   La llave se guarda para la siguiente partida: con ella se abre la reja
   de la bodega y se baja a un túnel (barricas, cajas, faroles y una
   escalera con luz de luna). En las cajas está la carta de amor de Don
   Xesús a la mesonera del Estrella (1714) y la escalera sube, como atajo,
   hasta su cripta.
   ===================================================================== */
const LLAVE_KEY = 'pq_llave_camino_v1';
const llaveGuardada = () => { try { return localStorage.getItem(LLAVE_KEY) === '1'; } catch (e) { return false; } };
const enVideoclub = () => typeof VC !== 'undefined' && VC && VC.on;
function guardarLlave() { if (enVideoclub()) return; try { localStorage.setItem(LLAVE_KEY, '1'); } catch (e) {} }

ITEMS.llave_camino = { name: 'Llave del Camino', img: 'llave_camino', desc: 'Una llave de hierro antigua, con el ojo en forma de trébol y los dientes en cruz. Toño dice que abre algo bajo el Bar Estrella.' };
ITEMS.carta_1714 = { name: 'Carta de amor (1714)', img: 'carta_1714', desc: 'Una carta lacrada con un corazón. «Para Xoana, mesonera del Estrella». La letra es de caballero ilustrado.' };
LOGROS.tunel = { i: '🗝️', t: 'El túnel secreto' };

// la llave, en la bolsa desde el principio de la partida siguiente
{ const _ns = newState; newState = () => { const s = _ns(); if (llaveGuardada()) s.inv.push('llave_camino'); return s; }; }

/* ---------------- la reja de la bodega ---------------- */
{
  const reja = SCENES.bodega.hs.find((h) => h.name === 'Reja');
  const mirar = reja.verbs.Mirar, abrir = reja.verbs.Abrir;
  reja.verbs = {
    'Mirar': () => (flag('tunelAbierto') ? say(S.active, 'La reja abierta. Al otro lado, el túnel de 1714. Huele a barrica y a secretos.') : mirar()),
    'Abrir': () => (flag('tunelAbierto') ? goScene('tunel', { from: 'left' }) : has('llave_camino') ? abrirTunel() : abrir()),
  };
  reja.items = Object.assign({}, reja.items, { llave_camino: () => abrirTunel() });
  // si se empieza por capítulos, la llave también aparece en la bolsa
  const setup0 = SCENES.bodega.setup;
  SCENES.bodega.setup = function () { if (S && llaveGuardada() && !has('llave_camino') && !flag('tunelAbierto')) S.inv.push('llave_camino'); return setup0.apply(this, arguments); };
}
// v28 · la reja abierta: dibujo nuevo de la bodega, luces que se apagan, susurro fantasmal y niebla en el pasillo
EXTRA_ASSETS.push('bg/bodega_abierta');
const LUCES = { a: 0 };
Object.defineProperty(SCENES.bodega, 'bg', { configurable: true, enumerable: true, get() { return (typeof S !== 'undefined' && S && S.flags && S.flags.tunelAbierto) ? 'bodega_abierta' : 'bodega'; } });
SCENES.bodega.emit.push({ kind: 'fog', rate: 0, x0: 1040, x1: 1340, y0: 470, y1: 700, pre: 0, color: '#9fb4ff' });
{
  const niebla = () => { const e = SCENES.bodega.emit[SCENES.bodega.emit.length - 1]; e.rate = S && S.flags.tunelAbierto ? 2.2 : 0; };
  const setup1 = SCENES.bodega.setup;
  SCENES.bodega.setup = function () { niebla(); return setup1.apply(this, arguments); };
  SCENES.bodega.nieblaOn = niebla;
  const top0 = SCENES.bodega.drawTop;
  SCENES.bodega.drawTop = function (c, t) {
    if (top0) top0.apply(this, arguments);
    const base = S && S.flags.tunelAbierto ? 0.12 : 0, a = Math.max(LUCES.a, base);
    if (a > 0.005) { c.save(); c.fillStyle = 'rgba(2,3,10,' + a + ')'; c.fillRect(0, 0, W, H); c.restore(); }
  };
}
async function abrirTunel() {
  if (flag('tunelAbierto')) return goScene('tunel', { from: 'left' });
  sfx('reja'); shake(0.3); takeItem('llave_camino');
  await narr('La llave del Camino entra a la primera. Clac. La reja se abre con un quejido de trescientos años.');
  // las luces parpadean… y se apagan
  sfx('fantasma');
  for (const a of [0.7, 0.1, 0.85, 0.3, 0.95]) { LUCES.a = a; await wait(140); }
  LUCES.a = 0.97; flag('tunelAbierto', 1); SCENES.bodega.nieblaOn(); shake(0.15);
  await narr('Las luces se apagan de golpe. Un soplo helado sube del túnel y, muy bajito, alguien susurra: «…Xoana…».');
  sfx('fantasma');
  await say('ramis', 'Yo no he sido. Lo juro por mi Porsche imaginario.', 'sorpresa');
  await tween(LUCES, { a: 0 }, 1.8);
  await narr('Las luces vuelven, más tenues. Del pasillo sale una niebla fría que se arrastra por el suelo.');
  await say('marcos', '¡La llave de Toño! ¡Contenido desbloqueado en la segunda partida! Esto lo hacen los juegos buenos.', 'sorpresa');
  await say('ramis', 'Caballeros… después de vosotros. Bueno, después de Ángel, que es el que nota cosas.');
  await goScene('tunel', { from: 'left' });
}

/* ---------------- el túnel ---------------- */
SCENES.tunel = {
  title: 'EL TÚNEL SECRETO', sub: 'Bajo la zona vieja · hacia Santo Domingo', bg: 'tunel', music: 'bodega', ambient: 'bodega',
  tint: { c: '#ff9a4a', a: 0.06, d: 0.04 }, k: 0.56,
  pos: { ramis: [430, 990], marc: [640, 995], marcos: [1170, 990], angel: [1360, 995] },
  fx: [
    { type: 'glow', x: 290, y: 255, r: 230, color: '#ffbe6a', a: 0.35, flicker: 0.35 },
    { type: 'glow', x: 1465, y: 300, r: 210, color: '#ffbe6a', a: 0.33, flicker: 0.35, seed: 4 },
    { type: 'glow', x: 1050, y: 330, r: 260, color: '#9fc4ff', a: 0.16 },
    { type: 'beam', x0: 1000, y0: 250, x1: 1050, y1: 620, w0: 40, w1: 190, color: 'rgba(170,200,255,0.5)', a: 0.14 },
  ],
  emit: [{ kind: 'dust', rate: 3, x0: 300, x1: 1300, y0: 200, y1: 700, pre: 20 }, { kind: 'fog', rate: 2.6, x0: -100, x1: 1600, y0: 640, y1: 980, pre: 14, color: '#a8b8e8' }],
  hs: [
    { name: 'Farol', r: [205, 125, 150, 270], verbs: { 'Mirar': () => say(S.active, 'Un farol encendido. ¿Quién viene a cambiarle el aceite a un túnel secreto? Mejor no preguntar.') } },
    { name: 'Farol', r: [1405, 190, 150, 230], verbs: { 'Mirar': () => say(S.active, S.active === 'angel' ? 'Esta luz no la ha encendido nadie vivo. Lo noto.' : 'Otro farol. Ángel dice que lo ha encendido alguien que no está vivo.') } },
    { name: 'Cuerda', r: [450, 320, 95, 290], verbs: { 'Mirar': () => say(S.active, S.active === 'marc' ? 'Otra cuerda. Pontevedra está llena de cuerdas y mis dibujos de Manara, de malas ideas.' : 'Una cuerda enrollada. Marc la mira con demasiado interés.') } },
    { name: 'Cajas', r: [185, 560, 260, 300], verbs: {
      'Abrir|Registrar las cajas': () => cajasTunel(),
      'Mirar': () => say(S.active, 'Cajas de madera con el sello del Estrella. Una tiene la tapa suelta.'),
    } },
    { name: 'Barricas', r: [0, 455, 190, 440], verbs: {
      'Mirar': () => say(S.active, 'Barricas vacías. Alguien se las bebió hace trescientos años. Por el estilo, Don Xesús.'),
      'Beber|Probar': () => say(S.active, S.active === 'ramis' ? 'Vacía. Como mi cartera. Como mi Porsche imaginario.' : 'Vacía. Ni una gota desde 1714.'),
    } },
    { name: 'Barrica', r: [1430, 540, 170, 450], verbs: { 'Mirar': () => say(S.active, 'Otra barrica. Tiene grabado: «X + X · 1714». Qué romántico. Qué viejo.') } },
    { name: 'Caja pequeña', r: [1350, 640, 90, 160], verbs: { 'Mirar': () => say(S.active, 'Una caja con un letrero: «ESTRELLA · 1714 · NO ABRIR». Está vacía. Alguien no hizo caso.') } },
    { name: 'Rejilla', r: [225, 880, 210, 70], verbs: { 'Mirar': () => say(S.active, 'Se oye el agua correr por debajo. Va hacia el río. O es Ramis, que ha bebido mucho.') } },
  ],
  exits: [
    { name: 'Subir la escalera', r: [880, 250, 340, 200], arrow: 'up', fn: () => subirEscalera() },
    { name: 'Volver a la bodega', r: [0, 0, 190, 440], arrow: 'left', fn: () => goScene('bodega', { from: 'right' }) },
  ],
  async enter() {
    if (!flag('tunelVisto')) { flag('tunelVisto', 1); sfx('fantasma'); }
    await narr('Un túnel de piedra bajo la zona vieja. Barricas, cajas, faroles que alguien sigue encendiendo… y al fondo, una escalera por la que entra la luz de la luna.');
    await say('angel', 'Aquí abajo hay todavía más energía que en la bodega. Y más humedad.');
    await say('ramis', 'Caballeros… un túnel secreto. Esto se lo cuento a los de Mallorca y no se lo creen.', 'sorpresa');
    await say('marcos', 'Mazmorra secreta de nivel dos. Si hay cofres, son míos.', 'risa');
    logro('tunel');
  },
};
EXTRA_ASSETS.push('bg/tunel', 'items/llave_camino', 'items/carta_1714');

async function cajasTunel() {
  if (flag('cartaCogida')) return say(S.active, 'Solo queda serrín y una araña que nos mira mal.');
  flag('cartaCogida', 1); sfx('open');
  await narr('Entre el serrín de la caja hay un sobre amarillento, lacrado con un corazón rojo. Pone: «Para Xoana, mesonera del Estrella. 1714».');
  give('carta_1714');
  await say('marc', 'Una carta de amor de 1714. Con esta letra, esto lo escribió un caballero. O un notario.');
  await say('angel', 'Esto hay que devolvérselo a su dueño. Y creo que sé quién es.');
}

// la escalera: un atajo hasta la cripta de Don Xesús
async function subirEscalera() {
  sfx('pasos');
  if (!flag('fantasmaVisto')) {
    await narr('La escalera sube hasta una losa de piedra con el escudo de un caballero. Al otro lado, alguien canturrea en castellano antiguo. La losa no se mueve.');
    return say('angel', 'Ahí arriba hay alguien. Mejor presentarse por la puerta principal: las ruinas de Santo Domingo.');
  }
  if (!flag('criptaAbierta') && (!flag('fantasmaVino') || !flag('retrato'))) {
    await narr('Empujáis la losa entre los cuatro… y asoma la cara translúcida de Don Xesús.');
    await say('fantasma', '¡BRIBONES! ¿Por el túnel del mesón? ¡A una cripta se entra por la puerta, como los caballeros! Y con vino… y con un retrato.', 'sorpresa');
    sfx('reja'); shake(0.2);
    return narr('La losa se cierra de golpe. Desde arriba se oye: «¡Mangurrianes!».');
  }
  if (!flag('criptaAbierta')) {
    flag('criptaAbierta', 1); if (has('llave_antigua')) takeItem('llave_antigua');
  }
  flag('atajoCripta', 1);
  await narr('La escalera sube y sube… y sale por una losa detrás del sarcófago de Don Xesús. ¡Un atajo de caballeros!');
  await goScene('cripta', { from: 'right' });
}

// desde la cripta se puede volver a bajar
SCENES.cripta.exits.push({ name: 'Bajar al túnel', r: [1440, 860, 160, 140], arrow: 'down', cond: () => flag('tunelAbierto'), fn: () => goScene('tunel', { from: 'right' }) });

/* ---------------- la carta, para Don Xesús ---------------- */
async function cartaXesus() {
  if (flag('cartaLeida')) return say('fantasma', 'Ya la sé de memoria, bribón. Guárdala tú, que yo no tengo bolsillos. Solo capa.');
  flag('cartaLeida', 1);
  await say('fantasma', '¿Esa letra…? ¡Es MI letra! ¡Mi carta para Xoana, la mesonera del Estrella!', 'sorpresa');
  await narr('Don Xesús rompe el lacre con un dedo que no toca nada y lee en silencio. Por un momento brilla más que nunca.');
  await say('fantasma', '«Mi querida Xoana: tu pulpo me tiene preso y tus ojos, más. Esta noche te espero en el túnel, a la hora de las ánimas.»');
  await say('fantasma', 'Nunca se la di. Esa misma noche me tomé el orujo malo. Trescientos años esperando una respuesta…');
  await say('angel', 'Don Xesús… eso es amor del bueno. Del que no caduca.');
  await say('ramis', '¿Mesonera del Estrella? ¡Será la tatarabuela de la tatarabuela de Doña Maruxa!', 'sorpresa');
  await say('fantasma', '¡Con razón ese pulpo me sabía a gloria! ¡Albricias! Guardadla vosotros, caballeros: yo ya la sé de memoria.', 'risa');
  groupLaugh();
}
for (const sc of ['ruinas', 'cripta']) {
  const g = SCENES[sc].give = SCENES[sc].give || {};
  g.fantasma = Object.assign({}, g.fantasma, { carta_1714: () => cartaXesus() });
}

/* ---------------- Toño, en el balneario ---------------- */
async function llaveDeTono() {
  if (llaveGuardada() && !has('llave_camino') && !flag('tunelAbierto')) {
    return say('peregrino', 'Y la llave que os di… ¿la habéis probado ya? ¡Debajo del Estrella, os dije! ¡Buen Camino!', 'risa');
  }
  await say('peregrino', 'Por cierto: esto me lo encontré en una cuneta del Camino, junto a una vieira. Pesa como un pecado.');
  sfx('pickup');
  await narr('Toño os da una llave de hierro antigua, oxidada, con el ojo en forma de trébol.');
  await say('peregrino', 'Un señor muy mayor, muy pálido, me dijo en Pontevedra que abre una reja debajo del Bar Estrella. Yo no vuelvo, que me espera Santiago.');
  await say('marcos', '¿Una reja en el Estrella? ¡La de la bodega! Esto es… contenido para la próxima partida.', 'sorpresa');
  guardarLlave();
  toast('🗝️', 'Llave del Camino', 'En tu próxima partida, abre la reja de la bodega');
}
