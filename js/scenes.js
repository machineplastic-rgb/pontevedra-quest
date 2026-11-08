'use strict';
/* =====================================================================
   PONTEVEDRA QUEST — la historia
   Bar Estrella → bodega secreta → ruta de bares → pub oscuro (el beso)
   → ruinas de Santo Domingo (Don Xesús) → cripta → Alameda (la meiga)
   → parking → carretera → control de la Guardia Civil → Santa Compaña
   → la vaca → Balneario Acuña (Caldofran) → piscina → créditos
   ===================================================================== */

const ITEMS = {
  llaves: { name: 'Llaves del Peugeot', img: 'llaves', desc: 'Las llaves del Peugeot 5008 blanco de Marcos. Siete plazas, cero Porsche.' },
  movil: { name: 'Móvil de Marc', img: 'movil', desc: 'Lleno de bocetos de señoritas estilo Manara y de un GPS que se cree muy listo.' },
  cartera: {
    name: () => (flag('carteraLlena') ? 'Cartera de Ramis (¡con dinero!)' : 'Cartera de Ramis'), img: 'cartera',
    desc: () => (flag('carteraLlena') ? 'Llena con el tesoro de Don Xesús: reales de plata y un billete de 50 que nadie sabe de dónde salió.'
      : flag('postresComidos') ? 'Vacía. Ramis ha invitado a medio Pontevedra «bajo el yugo opresor».' : 'La cartera de Ramis. De momento, con dinero para la cena.'),
  },
  sal: { name: 'Sal gorda', img: 'sal', desc: 'Sal gorda de la señora del Estrella. «Contra las meigas y la Santa Compaña, sal.»' },
  cafe: { name: 'Café solo', img: 'cafe', desc: 'Un café bien cargado. Dáselo a alguien y le baja un nivel de borrachera.' },
  postres: { name: 'Táper de postres', img: 'postres', desc: 'Postres caseros de la señora: flan, tarta de Santiago, filloas y una copa de helado. Huelen a abuela.' },
  llave_antigua: { name: 'Llave antigua', img: 'llave_antigua', desc: 'Una llave de hierro enorme con un escudo de caballero grabado. De la bodega secreta.' },
  jarra: { name: 'Jarra de vino', img: 'jarra', desc: 'Vino de la barrica secreta del Estrella. Ramis la ha llenado con pulso de cirujano.' },
  candelabro: { name: 'Candelabro', img: 'candelabro', desc: 'Tres velas encendidas. Sirve para criptas oscuras o cenas románticas.' },
  calzoncillos: { name: 'Calzoncillos de Ramis', img: 'calzoncillos', desc: 'De rayas. Todavía calentitos. Ramis prefiere no hablar del tema.' },
  gafas: { name: 'Gafas de cerca de Ángel', img: 'gafas', desc: 'Las gafas de vista cansada de Ángel. Para leer partituras, letras de canciones y cuentas de bar. La edad, caballeros, la edad.' },
};

const LOGROS = {
  maceta: { i: '💐', t: 'El jardinero: Marcos regó las flores con chupitos' },
  postre: { i: '🍮', t: 'Los postres de la señora' },
  fisgon: { i: '🕵', t: 'Fisgones: pillados en la bodega' },
  minuto: { i: '💋', t: 'Un minuto: lo que tardó Ángel' },
  lupanar: { i: '👻', t: '¡Serrallo, lupanar!' },
  caballero: { i: '⚔', t: 'Caballeros de Santo Domingo' },
  calzon: { i: '🩲', t: 'Sacrificio de caballero' },
  meigallo: { i: '🧙', t: 'Meigallo de boa sorte' },
  vivido: { i: '🍻', t: 'Yo al menos podré decir que he vivido' },
  compana: { i: '🕯', t: 'Círculo de sal' },
  muuu: { i: '🐄', t: 'Muuu' },
  sereno: { i: '⚖', t: 'Sereno como un juez' },
  caldofran: { i: '♨', t: '¡Caldofran!' },
  // v5: la movida
  joven: { i: '🪪', t: 'DNI, por favor: Marcos aparenta diecisiete' },
  pillaria: { i: '😏', t: 'Ramis, yo te pillaría y…' },
  porche: { i: '🏡', t: 'Un Porsche, no un porche' },
  ligon: { i: '✏', t: 'Marc es un ligón' },
  pista: { i: '🪩', t: 'Reyes de la pista' },
  canero: { i: '🎸', t: '¡Ángel, qué papá más cañero!' },
  apostol: { i: '🎲', t: 'Nike Apóstol tiene fans' },
  camino: { i: '🐚', t: '¡Buen Camino!' },
  // v11
  plata: { i: '🤺', t: 'Lengua de plata: duelo sin un fallo' },
};

/* ---------- frases sueltas de cada uno ---------- */
const IDLE_LINES = {
  ramis: ['Habiendo haber podido, no quise poder.', 'Bajo el yugo opresor…', '¡Al menos yo podré decir que he vivido!', 'Nunca más… hasta el sábado.', '¿Eso es un 911? Ah, no, es una farola.', 'Esta noche es nuestra, Lords.'],
  marc: ['Esa luz está fatal.', 'Esto me lo apunto para un dibujo.', 'Para un Manara, esta noche.', 'Letra de escribano… ningún contenido.'],
  marcos: ['Yo conduzco, yo conduzco…', 'Esto en Coruña no pasa.', '¿Alguien tiene agua?', 'Que no, que no aparento menos. Bueno, un poco.', 'Con lo que me gusta a mí la cerveza…', 'Daría mi reino por una ensaimada.', 'Esa chaqueta tiene un patronaje horrible.', 'Esto me lo apunto para la próxima colección.', 'Breogán y Rosalía ya estarán dormidos.', 'Noémia me ha escrito: «¿vas sereno?».', 'Mañana echo una partida a la Play.'],
  angel: ['Lo noto… aquí hay algo.', 'Qué bonita está la noche.', 'Maje… no, no pienso en Maje.', 'La luna dice cosas.', '(Ángel tararea un riff de guitarra)', 'Esta noche tiene ritmo. Lo noto en las cuerdas.'],
};

/* ---------- pequeñas ayudas de guion ---------- */
const P = (id, x, y) => [x, y];
async function laugh(who) { try { AUDIO.laugh(who); } catch (e) {} const a = G.actors[who]; if (a) a.laughUntil = G.t + 1.8; }
async function groupLaugh() { try { AUDIO.laugh('grupo'); } catch (e) {} PROTA.forEach((p, i) => setTimeout(() => hopA(p), i * 90)); }
// Marcos ante la tentación: devuelve true si bebe
async function tentarMarcos(oferta) {
  const v = await choose([
    { t: '🍺 ' + oferta.si, sub: 'Marcos +1 de borrachera', v: 1 },
    { t: '🥤 ' + oferta.no, sub: 'Sereno, como un caballero', v: 0 },
  ], oferta.prompt);
  if (v) {
    if (S.drunk.marcos >= 4) { await say('marc', '¡QUIETO! Que conduces tú. Ese me lo bebo yo.', 'sorpresa'); drink('marc', 1); return false; }
    drink('marcos', 1); await say('marcos', pick(['Uno y ya. Palabra de caballero.', 'Por el Club. Pero es el último.', 'Esto no cuenta, que es medicinal.']));
    return true;
  }
  await say('marcos', pick(['Yo con agua, que conduzco.', 'Ni hablar. Esta noche soy el Señor de los Volantes.', 'Paso. Que luego en Coruña me lo recordáis.']));
  return false;
}
function updObj() {
  const f = S.flags;
  if (!f.postresComidos) return;
  const l = [];
  if (!f.llavesDevueltas) l.push(f.llavesConfiscadas ? 'Recuperar las llaves del Peugeot (Brais quiere cobrar y ver a Marcos sereno)' : 'Ruta de bares por la calle de los soportales');
  if (f.llavesConfiscadas && !f.carteraLlena) l.push(f.fantasmaVisto ? (f.criptaAbierta ? 'Descubrir el tesoro de la cripta' : 'Ganarse a Don Xesús: vino y un retrato') : 'Conseguir dinero (dicen que en Santo Domingo hay un caballero muy rico… y muy muerto)');
  if (f.meigaPide && !f.meigallo) l.push('La meiga quiere algo dulce y una prenda íntima de un caballero valiente');
  if (f.llavesDevueltas) l.push('Al parking: ¡rumbo a Caldofran!' + (f.meigallo ? '' : ' (la meiga de la Alameda podría daros suerte)'));
  // la movida, si queda hueco
  if (l.length < 2 && !S.seen.disco) l.push('Extra: la discoteca Lume, en los soportales');
  else if (l.length < 2 && !S.seen.antro) l.push('Extra: O Furado, el antro punk de la plaza');
  else if (l.length < 2 && S.seen.antro && !f.concierto) l.push('Extra: Tino, el del antro, busca cantante');
  setObj(l.slice(0, 2).join(' · '));
}

/* ---------- pistas: habla con cualquiera de los cuatro ---------- */
function nextStep() {
  const f = S.flags;
  if (!f.chupitos) return 'Pídele una ronda a la señora. La primera, de la casa.';
  if (!f.postrePedido) return 'Pregúntale a la señora qué tiene de postre.';
  if (!f.postresComidos) {
    if (!f.bodegaAbierta) return 'Ángel decía que del aparador sale aire frío. Que lo mire él, que tiene el don.';
    if (S.scene === 'bodega') return 'Rápido: la caja de la mesa, la barrica (cosa de Ramis) y ese candelabro. ¡Que vuelve la señora!';
    return 'La señora está al caer…';
  }
  if (!f.llavesConfiscadas) return 'Ruta de bares: desde la plaza, la calle de los soportales. Hay un bareto con un neón.';
  if (f.llavesConfiscadas && !f.carteraLlena) {
    if (!f.fantasmaVisto) return 'Necesitamos dinero. La señora habló de un caballero en las ruinas de Santo Domingo…';
    if (!f.fantasmaVino) return has('jarra') ? 'Dale la jarra de vino a Don Xesús.' : 'Don Xesús quiere vino. En la bodega del Estrella había una barrica: que Ramis llene una jarra.';
    if (!f.retrato) return 'Don Xesús quiere un retrato digno. Eso es cosa de Marc: que hable él con el fantasma.';
    if (!f.criptaAbierta) return 'La puertecita de la derecha de las ruinas… ¿y la llave antigua de la bodega?';
    if (!f.luzCripta) return 'La inscripción del sarcófago está en sombra. El candelabro de la bodega iría bien.';
    if (!f.gafasPuestas) return has('gafas') ? 'Usa las gafas de cerca de Ángel en la inscripción.' : 'Letra diminuta: hacen falta las gafas de cerca de Ángel. ¿No las llevaba colgadas la chica del pub?';
    if (!f.acertijo) return 'Don Xesús quiere un duelo de insultos. Eso es cosa de Marcos, que se ha leído todos los libros de caballerías.';
    return 'Abre el sarcófago.';
  }
  if (!f.pagado) return 'Con el tesoro ya podemos pagarle la ronda a Brais, el del bareto.';
  if (!f.llavesDevueltas) return S.drunk.marcos >= 3 ? 'Brais quiere ver a Marcos sereno. Antes, café: pídeselo a Brais.' : 'Habla con Brais: que Marcos haga la prueba del dedo.';
  if (!f.beso) return 'Antes de irnos… en el pub del fondo hay una chica que no para de mirar a Ángel.';
  if (!f.meigallo) return f.meigaPide ? 'La meiga quiere algo dulce (¿el táper?) y una prenda íntima de un caballero valiente (Ramis…).' : 'La meiga de la Alameda, la prima de la señora. Que hable Ángel con ella.';
  return 'Todo listo. Al parking, al Peugeot, y a Caldofran.';
}
function HINT(id) {
  const n = nextStep();
  const pre = {
    ramis: ['Habiendo haber podido… ', 'Escuchad, Lords: ', 'Al menos yo lo tengo claro: ', ''],
    marc: ['A ver, caballeros: ', 'Lo tengo claro: ', ''],
    marcos: ['Según mi hoja de personaje: ', 'Siguiente misión: ', ''],
    angel: ['Lo presiento: ', 'Algo me dice que… ', ''],
  }[id] || [''];
  // de vez en cuando proponen algo de la movida (opcional)
  const extra = typeof extraStep === 'function' && Math.random() < 0.4 ? extraStep(id) : null;
  if (extra) return extra;
  if (id === S.active) return pick(['Pienso… ', 'A ver… ']) + n.charAt(0).toLowerCase() + n.slice(1);
  return pick(pre) + n;
}
// dar objetos a los amigos
function GIVE_PROTA(item, id) {
  if (item === 'cafe') {
    return (async () => {
      takeItem('cafe'); drink(id, -1); sfx('trago');
      await say(id, id === 'marcos' ? 'Café solo. Ya veo una sola carretera. Bueno, una y media.' : 'Gracias. Ya no veo doble… veo uno y medio.');
    })();
  }
  if (item === 'gafas' && id === 'angel') return say('angel', 'Mis gafas de cerca. Ahora mismo no tengo nada que leer… guárdalas tú en la bolsa, que yo las pierdo.');
  return null;
}

/* =====================================================================
   ESCENAS
   ===================================================================== */
const SCENES = {};

/* ---------------- BAR ESTRELLA ---------------- */
// con el aparador movido se ve el túnel (dibujo de JRAR, con otro encuadre)
const TUNEL = () => !!(S && S.flags && S.flags.bodegaAbierta);
async function cogerSal() { flag('salCogida', 1); give('sal'); await say(S.active, 'Sal gorda de la buena. Por si acaso.'); }
async function bajarBodega() {
  if (!flag('bodegaAbierta')) return say(S.active, '¿Bajar a dónde? Es un aparador.');
  if (flag('senoraVuelta') && !flag('permisoBodega')) {
    await say('senora', '¿La bodega de mi abuelo? Bajad, bajad… pero no me bebáis nada. ¡Ramis, te estoy mirando!', 'piensa');
    flag('permisoBodega', 1);
  }
  await goScene('bodega', { from: 'left' });
}
SCENES.estrella = {
  title: 'BAR ESTRELLA', sub: 'Zona vieja de Pontevedra · sábado noche', get bg() { return TUNEL() ? 'estrella_tunel' : 'estrella'; }, music: 'estrella', ambient: 'estrella',
  tint: { c: '#ff9a4a', a: 0.08 }, k: 0.62,
  pos: { ramis: [300, 990], marc: [515, 995], marcos: [725, 992], angel: [935, 995] },
  npcs: [{ id: 'senora', x: 1165, y: 990, flip: true, cond: () => !flag('senoraFuera') || flag('senoraVuelta') }],
  props: [
    // v17: el bar ya no tiene la mesa delante; el salero y los postres, en la barra
    { img: 'sal', x: 235, y: 570, h: 62, cond: () => !has('sal') && !flag('salCogida'), hs: { name: 'Salero', verbs: { 'Coger': () => cogerSal() } } },
    { img: 'postres', x: 140, y: 575, h: 112, cond: () => flag('senoraVuelta') && !flag('postresComidos') },
  ],
  fx: [
    { type: 'glow', x: 344, y: 115, r: 250, color: '#ffc26a', a: 0.32, flicker: 0.15 },
    { type: 'glow', x: 1180, y: 160, r: 230, color: '#ffc26a', a: 0.3, flicker: 0.15, seed: 2 },
    { type: 'glow', x: 1470, y: 590, r: 260, color: '#6f8cff', a: 0.08, flicker: 0.3, seed: 5, cond: TUNEL },
    { type: 'glow', x: 520, y: 330, r: 420, color: '#ff9a4a', a: 0.08 },
  ],
  emit: [{ kind: 'dust', rate: 3, x0: 150, x1: 1400, y0: 120, y1: 600, pre: 20 }],
  hs: [
    { name: 'Mesa', get r() { return TUNEL() ? [1510, 690, 90, 310] : [1440, 660, 160, 340]; }, verbs: { 'Mirar': () => say(S.active, 'Restos de una cena épica. En la servilleta, Marc ha dibujado a la señora estilo Manara. Con bastante menos ropa.') } },
    { name: 'Barra', r: [0, 560, 975, 290], verbs: {
      'Mirar': () => say(S.active, flag('senoraFuera') && !flag('senoraVuelta') ? 'La barra del Estrella, sola, para nosotros. Qué responsabilidad.' : 'Una barra de madera con azulejos. Aquí se han cerrado más tratos que en el Concello.'),
      'Usar|Servirse una caña': async () => {
        if (!flag('senoraFuera') || flag('senoraVuelta')) return say(S.active, 'Con la señora delante, ni se me ocurre tocar su grifo.');
        if (S.active === 'ramis') { drink('ramis', 1); await say('ramis', 'Ramis se sirve una caña con pulso de cirujano. «Habiendo haber podido…»', 'risa'); return; }
        if (S.active === 'marcos') return say('marcos', 'Yo conduzco. Y además, Ramis me está mirando el grifo como si fuera suyo.');
        await say(S.active, 'Mejor que lo haga Ramis, que es el experto en grifos.');
      },
    } },
    { name: 'Botellas', r: [60, 110, 1130, 200], verbs: { 'Mirar': () => say(S.active, pick(['Más botellas que en el Galactic.', 'Albariño, Ribeiro, licor café, de hierbas… Esto es un museo.'])) } },
    { name: 'Caja registradora', r: [720, 462, 110, 100], verbs: { 'Mirar': () => say(S.active, S.active === 'marcos' ? 'Intento instalarle el Doom al TPV. No arranca. Qué decepción.' : 'La caja. Marc: «Ni la mires, que nos conocemos».') } },
    { name: 'Cocina', get r() { return TUNEL() ? [840, 330, 190, 320] : [840, 330, 330, 320]; }, verbs: { 'Mirar': () => say(S.active, 'La cocina. De ahí salen la tortilla y el pulpo. Huele a gloria bendita.') } },
    { name: 'Bufanda', get r() { return TUNEL() ? [1180, 270, 125, 260] : [1400, 240, 140, 280]; }, verbs: { 'Mirar': () => say(S.active, 'Una bufanda de fútbol. Ramis dice que es del Pontevedra. Marc dice que no. Llevan diez minutos discutiendo.') } },
    { name: 'Retrato', r: [5, 315, 60, 130], verbs: { 'Mirar': () => say(S.active, 'Un retrato antiguo. El señor tiene cara de haber cerrado este bar en 1950.') } },
    { name: 'Túnel', r: [1335, 300, 265, 535], cond: TUNEL, verbs: {
      'Mirar': () => say(S.active, S.active === 'angel' ? 'De ahí sale el aire frío. Y algo más… La señora dice que llega hasta Santo Domingo.' : pick(['Un agujero en la pared y un túnel de roca. Esto no sale en TripAdvisor.', 'Huele a humedad, a vino viejo y a aventura.'])),
      'Bajar': () => bajarBodega(),
    } },
    { name: 'Aparador', get r() { return TUNEL() ? [1035, 240, 245, 600] : [1255, 150, 265, 690]; }, verbs: {
      'Mirar': async () => {
        if (flag('bodegaAbierta')) return say(S.active, pick(['El aparador, apartado. Ni un plato roto: Ángel tiene manos de músico.', 'El aparador, corrido a un lado. Y al lado, ese agujero que baja a la bodega secreta.']));
        if (!flag('senoraFuera')) return say(S.active, 'Un aparador lleno de platos. La señora no le quita ojo.');
        if (S.active !== 'angel') return say(S.active, 'Es un aparador. Con platos. Ángel dice que de aquí sale aire frío… que lo mire él.');
        sfx('viento'); await say('angel', '…Aquí hay corriente. Y no es del aire acondicionado. Es… energía.', 'sorpresa');
        await say('ramis', '¿Energía? Ángel, que has cenado pulpo.');
        sfx('door'); shake(0.3);
        // fundido al dibujo del túnel
        G.bgFrom = { name: 'estrella', a: 1 }; flag('bodegaAbierta', 1);
        await tween(G.bgFrom, { a: 0 }, 1.6); G.bgFrom = null; sfx('viento');
        await narr('Ángel empuja el aparador. Se desliza con un chirrido… y en la pared aparece un agujero: un túnel de roca que baja a la oscuridad.');
        await say('marcos', 'Caballeros… una mazmorra. Tirad iniciativa.', 'sorpresa');
        setObj('¡Bajar a la bodega antes de que vuelva la señora!');
      },
      'Bajar': () => bajarBodega(),
    } },
  ],
  exits: [{ name: 'Salir a la calle', r: [0, 300, 80, 380], arrow: 'left', to: 'plaza', from: 'right', check: async () => {
    if (!flag('postresComidos')) { await say(S.active, pick(['¿Irnos sin postre? Ni de broma.', 'Aún no hemos acabado aquí. Falta el postre.'])); return false; }
    return true;
  } }],
  npc: {
    senora: {
      name: 'La señora del Estrella',
      'Hablar': () => senoraTalk(),
      'Mirar': () => say(S.active, 'Bajita, pelo rizado, delantal de flores y una sonrisa que te arregla el día. Os mira como a nietos.'),
    },
  },
  give: {
    senora: {
      '*': () => say('senora', 'Guárdalo, meu neno, que yo no necesito nada. Bueno… un poco de cariño.', 'risa'),
      cartera: () => say('senora', 'La cuenta luego, que ahora estáis disfrutando.'),
    },
  },
  async enter() {
    await narr('Bar Estrella, zona vieja de Pontevedra. Sábado por la noche.');
    await narr('Habéis cenado como reyes: tortilla, pimientos de Padrón, pulpo, calamares y una empanada que todavía se resiste.');
    await say('ramis', '¡Señora! Esto no es una cena. Esto es una misa.', 'risa');
    await say('senora', '¡Ay, mis niños! Comed, comed, que estáis en los huesos.', 'risa');
    await say('marc', 'Ángel lleva toda la cena tamborileando en la mesa con el tenedor.');
    await say('angel', 'Es que esta noche tiene ritmo. Lo noto. Pontevedra suena a punk.');
    await say('marcos', 'Ángel, eso es la cafetera.', 'risa');
    await say('marcos', 'Y esta cena está de diez, señora… pero ¿no tendrá una ensaimada?');
    await say('senora', '¿Ensaimada? ¡Esto es Galicia, meu neno! Aquí hay filloas.', 'risa');
    await say('angel', 'Ya… Ojalá estuviera Chus para decir: «¡Esto es Maaaaagniiifico!».');
    await say('ramis', '¡Esta noche es nuestra, Lords!');
    await say('marcos', 'Y yo no bebo, que luego conduzco hasta Caldofran. Palabra de caballero también.');
    await say('marc', 'Eso mismo dijiste en Coruña. Y acabaste cantando «Miña terra galega» abrazado a una farola.', 'risa');
    await narr('Toca a la gente y las cosas para mirar, hablar o usar. Abajo eliges con quién juegas: cada uno de los cuatro tiene su don. ¿Atascado? Habla con tus amigos.');
    setObj('Disfrutar de la cena · Hablar con la señora');
  },
  async reenter() {
    if (S.flags.bodegaVista && !S.flags.senoraVuelta) await senoraVuelve(flag('pillada'));
  },
};

async function senoraTalk() {
  const f = S.flags;
  if (f.senoraFuera && !f.senoraVuelta) return;
  const opts = [];
  if (!f.chupitos) opts.push({ t: '«Otra ronda, por favor»', v: 'ronda' });
  if (!f.postrePedido) opts.push({ t: '«Señora, ¿qué tiene de postre?»', v: 'postre' });
  if (!f.cafeEstrella) opts.push({ t: '«Un café para el conductor»', v: 'cafe' });
  if (f.bodegaAbierta && f.senoraVuelta) opts.push({ t: '«¿Qué es la bodega de detrás del aparador?»', v: 'bodega' });
  opts.push({ t: '«¿Usted lleva mucho aquí?»', v: 'vida' });
  if (f.postresComidos === undefined && f.senoraVuelta) opts.push({ t: '«Los postres estaban de vicio»', v: 'gracias' });
  opts.push({ t: '«Nada, gracias, estamos bien»', v: 'nada' });
  const v = await choose(opts);
  if (v === 'ronda') {
    await say(S.active, 'Señora, ¿nos pone otra ronda?');
    await say('senora', '¡Chupitos de licor café, invita la casa! Y el conductor también, que una gotita no hace daño.', 'risa');
    await say('marcos', '…Ay.', 'sorpresa');
    await narr('MINIJUEGO · Que los demás se lo beban. Y Marcos, al jarrón de flores… cuando la señora no mire.');
    try { AUDIO.duck(true); } catch (e) {}
    music('minijuego');
    const r = await MG.chupitos();
    music('estrella');
    flag('chupitos', 1); S.stats.chupitosTirados = r.tossed;
    if (r.tossed >= 3) logro('maceta');
    if (r.marcos === 0) await say('marc', 'Marcos no ha probado ni una gota. Ese hombre es un monje.', 'risa');
    else if (r.marcos >= 2) await say('marc', 'Marcos, ¿tú no conducías?', 'sorpresa');
    else await say('marcos', 'Solo me han pillado una vez. El jarrón y yo somos uña y carne.');
    await say('senora', '¡Así me gusta, que se os ve contentos!', 'risa');
    setObj('Pedirle el postre a la señora');
  } else if (v === 'postre') {
    if (!f.chupitos) return say('senora', 'Primero la ronda de la casa, ¡que si no, no hay postre!', 'risa');
    await postreFuga();
  } else if (v === 'cafe') {
    flag('cafeEstrella', 1);
    await say('senora', 'Un cafeíto bien cargado para el chófer. Tómalo cuando lo necesites, ¿eh?');
    give('cafe');
  } else if (v === 'bodega') {
    await say('senora', 'La bodega de mi abuelo. Dicen que hay un túnel que llega hasta Santo Domingo. Yo no bajo, que hay arañas.', 'piensa');
  } else if (v === 'vida') {
    await say('senora', 'Media vida detrás de esta barra. He visto de todo: bodas, bautizos, reconciliaciones… y a un fraile bailando la muiñeira.', 'piensa');
    if (S.active === 'angel') { await say('senora', 'Y tú, barbas, tienes cara de músico. ¿A que sí?'); await say('angel', 'Canto en un par de grupos… y toco algo la guitarra.', 'sorpresa'); await say('senora', '¡Lo sabía! Manos de guitarrista y ojos de bolero. ¡Ay, si yo tuviera treinta años menos!', 'risa'); }
  } else if (v === 'nada') {
    await say('senora', 'Si necesitáis algo, me silbáis. ¡Silbar sabéis, ¿no?!', 'risa');
  }
}

async function postreFuga() {
  await say('ramis', 'Señora, ¿y de postre qué tiene?');
  await say('senora', '¿Postre? …¡Ay, que me habéis caído en gracia! ¡Esperad aquí, que vuelvo enseguida!', 'risa');
  flag('postrePedido', 1);
  await walk('senora', -250, 1.0, { run: true });
  sfx('door');
  removeActor('senora'); flag('senoraFuera', 1);
  await narr('La señora sale corriendo del bar. Os deja solos. A los cuatro. En su bar.');
  await say('marc', '¿Se ha ido? ¿Nos ha dejado el bar entero?', 'sorpresa');
  await say('ramis', 'Habiendo haber podido… ¡Somos los dueños del Bar Estrella!', 'risa');
  await say('marcos', 'Esto es confianza o es una prueba. Y yo no pienso tocar el grifo.');
  await say('angel', '…¿Notáis eso? Viene aire frío de detrás del aparador.');
  setObj('La señora ha salido a por postres… ¿Fisgamos un poco?');
}

async function senoraVuelve(pillados) {
  if (S.flags.senoraVuelta) return;
  flag('senoraVuelta', 1);
  if (!pillados) {
    await wait(700); sfx('door');
    actor('senora', { x: -200, y: 990, k: 0.62, flip: true });
    await walk('senora', 1165, 1.6, { run: true });
    G.actors.senora.flip = true;
    await say('senora', '¡Ya estoy aquí, mis niños! ¡Fui corriendo a casa, que lo tenía todo en la nevera!', 'risa');
  } else {
    actor('senora', { x: 1165, y: 990, k: 0.62, flip: true });
    await say('senora', 'Pues eso, fisgones: me fui corriendo a casa, que lo tenía todo en la nevera.', 'risa');
  }
  await narr('Trae una bandeja: flan de huevo, tarta de Santiago, filloas con miel… y una copa de helado con barquillo «para el más flaquiño».');
  await say('ramis', 'Señora… ¿se ha ido a su casa a por postres? ¿Por nosotros?', 'sorpresa');
  await say('senora', 'Es que me habéis caído en gracia. Y el barbas está en los huesos de tanto cantar. ¡Come, hombre!');
  sfx('trago');
  await say('angel', '…Está buenísimo. Señora, creo que la quiero.', 'risa');
  await say('senora', '¡Ay, calla, que me pongo colorada!', 'risa');
  await say('marc', 'Ángel le acaba de decir «te quiero» a una señora a la que conoce hace dos horas. Esto hay que apuntarlo en el acta del Club.');
  groupLaugh(); logro('postre');
  await say('senora', 'Tomad, os pongo un táper para el camino. Y llevad sal gorda, que de noche en Galicia nunca se sabe.');
  give('postres'); if (!has('sal')) { flag('salCogida', 1); give('sal'); }
  await say('senora', 'Si veis en la Alameda a una mujer con pañuelo negro, dadle uno de mis postres. Es mi prima Pura. Es meiga… pero de las buenas.', 'piensa');
  await say('marcos', '¿Meiga? ¿Meiga de verdad?', 'sorpresa');
  await say('senora', 'Haberlas, haylas. Y en las ruinas de Santo Domingo dicen que se aparece un caballero que bebe vino y suelta palabrotas finas.', 'piensa');
  await say('ramis', 'Señora, la cuenta. Invito yo. ¡Bajo el yugo opresor!');
  sfx('moneda');
  await narr('Ramis paga la cena. Su cartera se queda temblando, vacía como un bar a las nueve de la mañana.');
  flag('postresComidos', 1);
  await say('marcos', 'Caballeros: la noche es joven, yo estoy sereno… y vosotros no. ¡A la calle!');
  updObj();
}

/* ---------------- BODEGA SECRETA ---------------- */
let bodegaTimer = null;
SCENES.bodega = {
  title: 'BODEGA SECRETA', sub: 'Bajo el Bar Estrella', bg: 'bodega', music: 'bodega', ambient: 'bodega',
  tint: { c: '#ff9a4a', a: 0.1, d: 0.05 }, k: 0.64,
  oscuro: { a: 0.93 },   // v13: a oscuras, con el móvil o el candelabro
  pos: { ramis: [300, 995], marc: [520, 998], angel: [1160, 995], marcos: [1370, 992] },
  props: [
    { img: 'candelabro', x: 680, y: 557, h: 112, cond: () => !has('candelabro') && !flag('candelabroCogido'), hs: { name: 'Candelabro', verbs: { 'Coger': async () => { flag('candelabroCogido', 1); give('candelabro'); await say(S.active, 'Un candelabro con tres velas encendidas. ¿Quién las ha encendido? Mejor no preguntar.'); } } } },
  ],
  fx: [
    { type: 'glow', x: 790, y: 175, r: 300, color: '#ffbe6a', a: 0.32, flicker: 0.1 },
    { type: 'glow', x: 1385, y: 300, r: 180, color: '#ffb050', a: 0.35, flicker: 0.4, seed: 3 },
    { type: 'glow', x: 752, y: 508, r: 150, color: '#ffb050', a: 0.35, flicker: 0.5, seed: 5 },
    { type: 'candle', x: 680, y: 459, r: 110, color: '#ffb050', a: 0.4, cond: () => !has('candelabro') && !flag('candelabroCogido') },
  ],
  emit: [{ kind: 'dust', rate: 4, x0: 400, x1: 1200, y0: 150, y1: 700, pre: 25 }],
  setup() {
    clearInterval(bodegaTimer);
    if (!flag('senoraVuelta')) {
      G.bodegaLeft = G.bodegaLeft || 90;
      bodegaTimer = setInterval(() => {
        if (S.scene !== 'bodega') { clearInterval(bodegaTimer); return; }
        if (G.dlgOpen || G.mode) return;
        G.bodegaLeft--;
        S.obj = `¡Que vuelve la señora! ${Math.floor(G.bodegaLeft / 60)}:${String(G.bodegaLeft % 60).padStart(2, '0')} · Explora rápido`; updParty();
        if (G.bodegaLeft === 20) sfx('tic');
        if (G.bodegaLeft <= 0) { clearInterval(bodegaTimer); run(pillados); }
      }, 1000);
    }
  },
  hs: [
    { name: 'Cartel', r: [248, 207, 166, 277], verbs: { 'Mirar': () => say(S.active, '«Bodega Secreta Estrella». Muy secreta no es, si tiene cartel.') } },
    { name: 'Botellero', r: [445, 240, 255, 480], verbs: { 'Mirar': () => say(S.active, S.active === 'ramis' ? 'Un Albariño de 1982. Lo acaricio como si fuera un Porsche 911.' : 'Cientos de botellas cubiertas de polvo. Ramis las mira como a un Porsche.') } },
    { name: 'Caja de madera', r: [795, 478, 108, 70], verbs: {
      'Abrir': async () => {
        if (flag('cajaAbierta')) return say(S.active, 'Solo queda serrín. Y una araña con cara de pocos amigos.');
        flag('cajaAbierta', 1); sfx('open');
        await narr('Dentro, entre serrín, hay una llave de hierro enorme con un escudo de caballero grabado.');
        give('llave_antigua');
        await say('marcos', '¡Objeto legendario! +5 a abrir cosas antiguas.', 'risa');
      },
      'Mirar': () => say(S.active, 'Una caja de madera vieja sobre la mesa, junto al farol.'),
    } },
    { name: 'Farol', r: [722, 465, 58, 85], verbs: { 'Mirar': () => say(S.active, 'Un farol encendido. Alguien baja aquí a menudo… o algo.') } },
    { name: 'Grabado', r: [768, 268, 155, 145], verbs: { 'Mirar': () => say(S.active, 'Un grabado de la Pontevedra antigua. Abajo, a lápiz: «Túnel a S. Domingo». Qué cosas.') } },
    { name: 'Cuerda', r: [965, 282, 55, 175], verbs: { 'Mirar': () => say(S.active, S.active === 'marc' ? 'Una cuerda. Me vienen a la cabeza unos dibujos de Manara que mejor no comento.' : 'Una cuerda. Marc pone una cara que mejor no comentamos.') } },
    { name: 'Reja', r: [1055, 232, 270, 450], verbs: {
      'Mirar': () => say(S.active, 'Una reja antigua con candado. Al otro lado, un túnel que se pierde hacia… ¿Santo Domingo?'),
      'Abrir': () => say(S.active, 'Cerrada a cal y canto. Y huele a humedad de 1714.'),
    }, items: { llave_antigua: () => say(S.active, 'La llave no entra. Es de otra cerradura, todavía más antigua.') } },
    { name: 'Barricas', r: [1360, 270, 240, 480], verbs: {
      'Usar|Llenar una jarra': async () => {
        if (has('jarra') || flag('fantasmaVino')) return say(S.active, 'Ya tenemos vino. Y si llenamos más, Ramis no llega a la calle.');
        if (S.active !== 'ramis') return say(S.active, 'Esto es trabajo de Ramis: es el único que sabe abrir un grifo sin inundar Pontevedra.');
        sfx('servir');
        await say('ramis', 'Jarrita… de la barrica secreta… sin derramar una gota. Bajo el yugo opresor, pero con estilo.', 'risa');
        give('jarra');
      },
      'Beber|Probar el vino': async () => {
        if (S.active === 'marcos') return say('marcos', 'Conductor. Ni lo huelo.');
        drink(S.active, 1); await say(S.active, pick(['Madre mía. Esto tiene más años que nosotros.', 'Sabe a gloria y a piedra. Otro sorbito… no, ya está.']));
      },
    } },
    { name: 'Rejilla', r: [1035, 805, 140, 42], verbs: { 'Mirar': () => say(S.active, 'Se oye agua correr ahí abajo. O es Ramis.') } },
  ],
  exits: [{ name: 'Subir al bar', r: [0, 0, 240, 560], arrow: 'up', fn: () => leaveBodega() }],
  async enter() {
    await narr('Una bodega secreta bajo el Bar Estrella. Huele a barrica, a piedra y a siglos.');
    await say('ramis', 'Caballeros… ESTO es una bodega secreta.', 'sorpresa');
    await say('marc', 'Pone «Bodega Secreta Estrella». Muy secreta no es si tiene cartel.');
    await say('angel', 'Aquí abajo hay energía. Mucha. Esa reja da a un túnel antiguo.');
    await say('marcos', 'Los túneles bajo Pontevedra… dicen que llegan hasta Santo Domingo. Esto es una mazmorra de nivel 1.');
    if (!flag('senoraVuelta')) { music('tension'); await narr('¡Rápido! La señora puede volver en cualquier momento.'); }
  },
};
async function leaveBodega() {
  clearInterval(bodegaTimer);
  flag('bodegaVista', 1);
  await goScene('estrella', { from: 'right' });
}
async function pillados() {
  if (S.scene !== 'bodega' || S.flags.senoraVuelta) return;
  sfx('door');
  actor('senora', { x: 120, y: 990, k: 0.64 });
  G.actors.senora.alpha = 0; await tween(G.actors.senora, { alpha: 1 }, 0.4);
  await say('senora', '¡AY, FISGONES! ¡Que os dejo cinco minutos y me bajáis a la bodega de mi abuelo!', 'sorpresa');
  await say('ramis', 'Señora, le juro que estábamos… inventariando.', 'sorpresa');
  await say('senora', '¡Jajaja! Anda, subid, que os he traído postres de casa.', 'risa');
  logro('fisgon'); flag('bodegaVista', 1); flag('pillada', 1);
  await goScene('estrella', { from: 'right' });
}

/* ---------------- LA PLAZA ---------------- */
SCENES.plaza = {
  title: 'LA ZONA VIEJA', sub: 'Pontevedra de noche', bg: 'plaza', music: 'plaza', ambient: 'plaza',
  tint: { c: '#3a4aa0', a: 0.12, d: 0.05 }, k: 0.5,
  pos: { ramis: [500, 978], marc: [710, 985], marcos: [920, 982], angel: [1130, 985] },
  fx: [
    { type: 'stars', n: 60, x0: 0, x1: 1600, y0: 0, y1: 230 },
    { type: 'glow', x: 1470, y: 68, r: 140, color: '#fff2c0', a: 0.35 },
    ...[[282, 225], [372, 240], [505, 378], [600, 410], [1040, 330], [1170, 368], [1245, 368], [1455, 462], [750, 430]].map(([x, y], i) => ({ type: 'glow', x, y, r: 140, color: '#ffcf7a', a: 0.3, flicker: 0.12, seed: i })),
    { type: 'glow', x: 800, y: 560, r: 420, color: '#ffb050', a: 0.07 },
  ],
  emit: [{ kind: 'fog', rate: 0.25, x0: -100, x1: 1400, y0: 700, y1: 990, pre: 6 }],
  hs: [
    { name: 'Cruceiro', r: [770, 450, 60, 150], verbs: { 'Mirar': () => say(S.active, S.active === 'angel' ? 'Un cruceiro. Protegen los cruces de caminos de las almas en pena. Esta noche hay mucha alma suelta.' : 'Una cruz de piedra en mitad de la plaza. Ángel dice que protege de cosas. Ramis dice que es para quedar.') } },
    { name: 'Terrazas', r: [430, 520, 720, 95], verbs: { 'Mirar': () => say(S.active, 'Terrazas recogiendo. Ramis intenta pedir en una que ya ha cerrado. Le dicen que no con mucho cariño gallego.') } },
    { name: 'Luna', r: [1440, 38, 80, 80], verbs: { 'Mirar': () => say(S.active, S.active === 'angel' ? 'Luna llena. Noche de meigas.' : 'Luna llena. Ángel dice que es noche de meigas. Ramis dice que es noche de gin-tonic.') } },
    { name: 'Pizarra', r: [336, 445, 34, 72], verbs: { 'Leer': () => say(S.active, '«Hoy: pulpo, raxo y zorza». Y debajo, en pequeñito: «Ramis, págame lo del jueves». ¿Cómo sabe nadie aquí quién es Ramis?') } },
    { name: 'Contenedores', r: [1380, 545, 92, 58], verbs: { 'Mirar': () => say(S.active, 'Contenedores verdes. Marc dice que ahí acabó su última relación. Ni idea de qué quiere decir.') } },
  ],
  exits: [
    { name: 'Calle de los soportales (ruta de bares)', r: [560, 430, 150, 170], arrow: 'up', to: 'calle', from: 'left' },
    { name: 'O Furado (antro punk)', r: [180, 345, 85, 235], arrow: 'up', to: 'antro', from: 'left' },
    { name: 'Ruinas de Santo Domingo', r: [0, 330, 120, 380], arrow: 'left', to: 'ruinas', from: 'right' },
    { name: 'La Alameda', r: [1480, 330, 120, 380], arrow: 'right', to: 'alameda', from: 'right' },
    { name: 'Parking (el Peugeot)', r: [1330, 880, 270, 120], arrow: 'down', to: 'parking', from: 'left' },
    { name: 'Volver al Bar Estrella', r: [0, 880, 270, 120], arrow: 'down', to: 'estrella', from: 'left' },
  ],
  async enter() {
    await narr('La zona vieja de Pontevedra de noche: granito brillante, farolas y terrazas. Huele a pulpo, a orballo y a fiesta.');
    await say('ramis', '¡Caballeros! ¡Comienza la ruta de bares!', 'risa');
    await say('marcos', 'Yo con agua. Que tengo que llevaros a Caldofran.');
    await say('marc', 'Caldofran… el Balneario Acuña de Caldas de Reis. Le llamamos así y ya ni nos acordamos de por qué.');
    await say('angel', 'Gracias por esto, caballeros. De verdad.', 'risa');
    updObj();
  },
};

/* ---------------- CALLE DE LOS SOPORTALES ---------------- */
SCENES.calle = {
  title: 'RUTA DE BARES', sub: 'Calle de los soportales', bg: 'calle', music: 'calle', ambient: 'calle',
  tint: { c: '#ff9a4a', a: 0.08, d: 0.03 }, k: 0.56,
  pos: { ramis: [440, 985], marc: [645, 990], marcos: [850, 985], angel: [1050, 990] },
  fx: [
    ...[[612, 290], [392, 378], [255, 430], [1302, 365], [1160, 495], [1270, 520], [1240, 540]].map(([x, y], i) => ({ type: 'glow', x, y, r: 150, color: '#ffc26a', a: 0.33, flicker: 0.1, seed: i * 2 })),
    { type: 'shimmer', x: 900, y: 760, w: 600, color: '#ffc26a' },
    { type: 'stars', n: 25, x0: 1060, x1: 1420, y0: 0, y1: 150 },
  ],
  emit: [{ kind: 'rain', rate: 40, x0: 0, x1: 1700, y0: -40, y1: 0 }],
  hs: [
    { name: 'Barricas', r: [80, 630, 170, 330], verbs: { 'Mirar': () => say(S.active, 'Barricas que hacen de mesa. Si te apoyas mucho rato, acabas oliendo a Ribeiro.') } },
    { name: 'Cartel «Ruta de bares»', r: [740, 300, 140, 140], verbs: { 'Leer': () => say(S.active, '«RUTA DE BARES →». El ayuntamiento piensa en todo.') } },
    { name: 'Campanario', r: [1180, 80, 115, 265], verbs: { 'Mirar': () => say(S.active, 'Un campanario. Ángel dice que las campanas suenan solas en noches de luna llena. Ramis dice que eso es el vino.') } },
    { name: 'Balcones', r: [780, 40, 120, 150], verbs: { 'Mirar': () => say(S.active, 'Balcones con geranios. Una vecina en bata os mira con mucha, mucha paciencia.') } },
  ],
  exits: [
    { name: 'Entrar en el bareto', r: [120, 330, 210, 290], arrow: 'up', to: 'bareto', from: 'left' },
    { name: 'Pub oscuro (al fondo)', r: [1160, 520, 115, 165], arrow: 'up', to: 'pub', from: 'left' },
    { name: 'Discoteca Lume', r: [1345, 470, 95, 290], arrow: 'right', to: 'disco', from: 'left', check: () => (typeof porteroCheck === 'function' ? porteroCheck() : true) },
    { name: 'Volver a la plaza', r: [1330, 880, 270, 120], arrow: 'down', to: 'plaza', from: 'left' },
  ],
  async enter() {
    await narr('Los soportales de la zona vieja. Cae un orballo finito, de esos que mojan sin que te enteres.');
    await say('ramis', 'Hasta el cartel nos invita: «Ruta de bares». Sería de mala educación no hacerle caso.', 'risa');
    await say('marc', 'Tres opciones: el bareto, el pub oscuro del fondo… o esa discoteca con portero, la Lume.');
  },
};

/* ---------------- BARETO (Brais) ---------------- */
SCENES.bareto = {
  title: 'EL BARETO', sub: 'Primera parada de la ruta', bg: 'bareto', music: 'bareto', ambient: 'bareto',
  tint: { c: '#ff8a4a', a: 0.08 }, k: 0.6,
  pos: { ramis: [160, 990], marc: [375, 995], marcos: [865, 990], angel: [1075, 995] },
  npcs: [{ id: 'camarero', x: 615, y: 990 }, { id: 'gente', x: 1450, y: 992, flip: true }],
  fx: [
    { type: 'neon', x: 1108, y: 233, w: 210, h: 150, color: '#3f8cff', a: 0.35, period: 6 },
    { type: 'neon', x: 1123, y: 366, w: 120, h: 110, color: '#ff4fd8', a: 0.32, period: 9, seed: 3 },
    { type: 'glow', x: 380, y: 185, r: 230, color: '#ffc26a', a: 0.3, flicker: 0.1 },
    { type: 'glow', x: 842, y: 190, r: 230, color: '#ffc26a', a: 0.3, flicker: 0.1, seed: 4 },
  ],
  emit: [{ kind: 'dust', rate: 2, x0: 200, x1: 1400, y0: 150, y1: 600, pre: 12 }],
  hs: [
    { name: 'Pizarra', r: [0, 175, 118, 250], verbs: { 'Leer': () => say(S.active, '«Vinos, Cervezas, Tapas, Raciones, Café». Lo esencial de la vida en una pizarra.') } },
    { name: 'Cafetera', r: [210, 388, 165, 143], verbs: { 'Mirar': () => say(S.active, 'Una cafetera que ha visto amanecer más veces que el sol. Brais hace cafés que resucitan muertos.') } },
    { name: 'Neón «PUB»', r: [1007, 143, 202, 180], verbs: { 'Mirar': () => say(S.active, S.active === 'marcos' ? 'El neón parpadea. Si fuera una máquina recreativa, le metería una moneda.' : 'Un neón que parpadea. Como Ramis a partir de la tercera.') } },
    { name: 'Puerta del almacén', r: [1288, 239, 240, 520], verbs: { 'Abrir': () => say(S.active, 'Brais: «¡Eh! Ahí dentro solo entra el personal. Y las barricas.»'), 'Mirar': () => say(S.active, 'Una puerta al almacén, con barricas hasta el techo. Ramis suspira.') } },
    { name: 'Barra', r: [0, 537, 1209, 234], verbs: { 'Mirar': () => say(S.active, 'Una barra de madera con azulejos. Pegajosa en su punto justo.') } },
  ],
  exits: [{ name: 'Salir a la calle', r: [0, 880, 220, 120], arrow: 'down', to: 'calle', from: 'right' }],
  npc: {
    camarero: { name: 'Brais, el camarero', 'Hablar': () => braisTalk(), 'Mirar': () => say(S.active, 'Brais: delantal granate, sonrisa de pillo y un llavero en el bolsillo que es nuestro.') },
    gente: { name: 'Parroquiano', 'Hablar': () => parroquianoTalk(), 'Mirar': () => say(S.active, 'Un parroquiano con camisa de cuadros y una caña eterna. Lleva aquí desde que abrieron el bar. O desde antes.') },
  },
  give: {
    camarero: { cartera: () => pagarBrais(), '*': () => say('camarero', 'Eso no es dinero, rapaz.') },
    gente: { '*': () => say('gente', 'Quita, quita, que yo ya tengo de todo. Menos un Porsche.') },
  },
  async enter() {
    await narr('Un bareto con neón y barricas. Huele a cerveza tirada con cariño.');
    await say('camarero', '¡Bienvenidos, rapaces! ¿Qué va a ser?', 'risa');
    await say('ramis', '¡Una ronda de Estrella Galicia para el Club de Caballeros!', 'risa');
    drink('ramis', 1, true); drink('marc', 1, true); drink('angel', 1); sfx('brindis');
    await tentarMarcos({ prompt: 'Brais le pone una caña delante a Marcos…', si: '«Venga, una caña»', no: '«Una sin alcohol, que conduzco»' });
    await say('ramis', 'Mira, mira, parroquiano: ¡llave de Peugeot 5008! Siete plazas. Casi un Porsche.');
    await say('gente', '¿Casi un Porsche? Eso es como decir que una sardina es casi un pulpo.', 'risa');
    await narr('Ramis deja las llaves en la barra para gesticular mejor. Brais las coge al vuelo.');
    sfx('pickup'); takeItem('llaves'); flag('llavesConfiscadas', 1);
    await say('camarero', 'Estas llaves se quedan conmigo. Política de la casa: de aquí nadie sale conduciendo piripi.');
    await say('marcos', '¡Pero si el que conduce soy yo! ¡Y voy sereno!', 'sorpresa');
    await say('camarero', 'Pues me lo demuestras. Y de paso me pagáis la ronda, que vuestro amigo ha invitado a todo el bar.');
    await say('ramis', 'Yo al menos podré decir que he vivido.', 'risa');
    await narr('La cartera de Ramis está más vacía que la nevera de un estudiante. Toca buscar dinero… en algún sitio.');
    updObj();
  },
};
async function braisTalk() {
  const f = S.flags;
  const opts = [];
  if (f.llavesConfiscadas && !f.llavesDevueltas) opts.push({ t: '«Brais, devuélvenos las llaves»', v: 'llaves' });
  opts.push({ t: '«Un café para Marcos»', sub: 'Marcos −1 de borrachera', v: 'cafe' });
  opts.push({ t: '«Otra ronda, Brais»', v: 'ronda' });
  if (f.meigaVista || f.postresComidos) opts.push({ t: '«¿Conoces a la meiga de la Alameda?»', v: 'meiga' });
  opts.push({ t: '«Nada, nada»', v: 'nada' });
  const v = await choose(opts);
  if (v === 'llaves') {
    if (!f.pagado) {
      if (flag('carteraLlena')) return pagarBrais();
      return say('camarero', 'Primero la ronda: veintitrés euros. Y aquí no aceptamos «bajo el yugo opresor» como forma de pago.');
    }
    await say('camarero', 'Pagado. Ahora que el conductor me siga el dedo con la nariz. Si lo haces bien, llaves.');
    if (S.drunk.marcos >= 3) { await say('camarero', 'Uy, no. Tú ahora mismo no sigues ni un tractor. Tómate un café primero.'); return; }
    await narr('MINIJUEGO · Prueba de sobriedad: sigue el dedo de Brais. Cuanto más bebido vaya Marcos, más le bailará la nariz.');
    music('minijuego');
    const ok = await MG.pulso();
    music('bareto');
    if (ok) {
      await say('camarero', 'Sereno como un juez. Toma tus llaves, caballero. Y conduce como si llevaras a tu abuela.', 'risa');
      give('llaves'); flag('llavesDevueltas', 1);
      await say('marcos', '¡Las llaves del Peugeot! Caballeros, el Señor de los Volantes ha vuelto.', 'risa');
      updObj();
    } else {
      await say('camarero', 'Mmm… Te has ido más a la derecha que mi cuñado. Otro intento luego, y si eso, un café.');
    }
  } else if (v === 'cafe') {
    sfx('servir');
    if (S.drunk.marcos === 0) { await say('camarero', 'Toma, aunque tú ya vas más sereno que el párroco.'); await say('marcos', 'Tres cafés llevo. Veo a través de las paredes.'); S.stats.cafes++; return; }
    drink('marcos', -1);
    await say('camarero', 'Café solo, cargado, de los que resucitan muertos.');
    await say('marcos', pick(['Ya veo una sola barra. Bueno, una y media.', 'Ahora mismo podría conducir un tanque. Despacito.']));
  } else if (v === 'ronda') {
    await say('camarero', '¡Marchando! ¿Para quién?');
    const who = await choose([
      { t: 'Para Ramis, Marc y Ángel', sub: 'Marcos mira desde la barrera', v: 'tres' },
      { t: 'Para los cuatro, que es sábado', v: 'cuatro' },
      { t: 'Mejor no, que la noche es larga', v: 'no' },
    ]);
    if (who === 'no') return say('camarero', 'Sabia decisión. Rara, pero sabia.');
    ['ramis', 'marc', 'angel'].forEach((p) => drink(p, 1, true)); sfx('brindis'); groupLaugh();
    if (who === 'cuatro') { if (S.drunk.marcos >= 4) await say('marc', 'A Marcos no, que mañana le tenemos que pagar la grúa.'); else drink('marcos', 1); }
    await say('ramis', '¡Salud, caballeros! ¡Yo al menos podré decir que he vivido!', 'risa');
  } else if (v === 'meiga') {
    await say('camarero', '¿La Pura? Claro. Arregla la suerte a cambio de cosas raras. A mi cuñado le pidió un calcetín usado y pasó un control con tres gin-tonics. Bueno, dos.');
  }
}
async function pagarBrais() {
  if (flag('pagado')) return say('camarero', 'Ya estamos en paz, caballeros.');
  if (!flag('carteraLlena')) return say('camarero', '¿Una cartera vacía? Eso no es pagar, eso es enseñarme tus penas.');
  flag('pagado', 1); sfx('moneda');
  await say('ramis', 'Brais, aquí tienes: veintitrés euros… en reales de plata de 1714 y un billete de cincuenta.');
  await say('camarero', '¿Reales de plata? …Mi primo es anticuario. Trato hecho, caballeros.', 'risa');
  await say('camarero', 'Ahora que el conductor me demuestre que va sereno y os doy las llaves.');
  updObj();
}
async function parroquianoTalk() {
  if (S.active === 'ramis') {
    await say('ramis', '¿A ti te gustan los Porsche? El 911 es poesía. El Cayenne es un error. El 718… el 718 es un amor de verano.');
    await say('gente', 'Hombre, yo tuve un Seat 127 que subía O Castro en tercera. Eso sí que era un coche.', 'risa');
    await say('ramis', '…Al menos tú podrás decir que has vivido. Respeto.');
    return;
  }
  const v = await choose([
    { t: '«¿Qué tal por aquí?»', v: 'q' },
    { t: '«¿Hay controles de camino a Caldas?»', v: 'c' },
    { t: '«Nada, salud»', v: 'n' },
  ]);
  if (v === 'q') await say('gente', 'Aquí, como siempre: los de Pontevedra quejándonos de la lluvia y bebiendo para que pase.');
  if (v === 'c') await say('gente', 'Los sábados la Guardia Civil pone control en la N-550. Si no queréis líos, o agua… o la meiga de la Alameda.');
  if (v === 'n') { sfx('clink'); await say('gente', '¡Saúde, rapaz!', 'risa'); }
}

/* ---------------- PUB OSCURO ---------------- */
SCENES.pub = {
  title: 'PUB OSCURO', sub: 'Al fondo de la ruta', bg: 'pub', music: 'pub', ambient: 'pub',
  tint: { c: '#4a5aff', a: 0.12, d: 0.12 }, k: 0.72,
  pos: { ramis: [195, 995], marc: [430, 1000], marcos: [665, 995], angel: [900, 1000] },
  npcs: [{ id: 'chica', x: 1310, y: 995, flip: true, cond: () => !flag('beso') }],
  fx: [
    { type: 'neon', x: 427, y: 205, w: 150, h: 150, color: '#4aa3ff', a: 0.4, period: 6 },
    { type: 'neon', x: 1475, y: 258, w: 170, h: 90, color: '#3f7dff', a: 0.38, period: 8, seed: 2 },
    { type: 'glow', x: 768, y: 330, r: 120, color: '#ffc26a', a: 0.25 },
    ...[[570, 188], [694, 198], [1512, 155]].map(([x, y], i) => ({ type: 'glow', x, y, r: 190, color: '#ffb860', a: 0.28, flicker: 0.1, seed: i })),
  ],
  hs: [
    { name: 'Neón de Estrella Galicia', r: [358, 136, 137, 137], verbs: { 'Mirar': () => say(S.active, 'El neón de Estrella Galicia. En Galicia esto es como una cruz en una iglesia.') } },
    { name: 'Pizarra de tapas', r: [18, 45, 155, 315], verbs: { 'Leer': () => say(S.active, 'Pimientos de Padrón, croquetas, calamares, pulpo, empanada. Y de beber, gin-tonic. Ramis ya está salivando.') } },
    { name: 'Letrero', r: [732, 268, 72, 120], verbs: { 'Leer': () => say(S.active, '«A vida é máis bonita en buena compañía». Medio en gallego, medio en castellano. Como Marcos después de tres años en Coruña.') } },
    { name: 'Barra', r: [0, 435, 850, 200], verbs: {
      'Mirar': () => say(S.active, 'Una barra larga, luz baja y taburetes altos. Territorio de ligue.'),
      'Pedir|Pedir unos gin-tonics': async () => {
        await say(S.active, '¡Cuatro gin-tonics! Bueno… tres y algo para el conductor.');
        ['ramis', 'marc', 'angel'].forEach((p) => drink(p, 1, true)); sfx('clink');
        await tentarMarcos({ prompt: 'El camarero le guiña un ojo a Marcos: «¿Uno suave?»', si: '«Venga, uno suave»', no: '«Una tónica sola, por favor»' });
      },
    } },
    { name: 'Puerta de salida', r: [1065, 300, 85, 220], verbs: { 'Mirar': () => say(S.active, '«SAÍDA». En gallego, salida. En el idioma de Ramis, «la puerta por la que te echan».') } },
    { name: 'Cuadros', r: [1240, 235, 115, 160], verbs: { 'Mirar': () => say(S.active, 'Fotos antiguas del puente de Pontevedra. Marc dice que la luz está fatal. Lo dice de todas las fotos.') } },
  ],
  exits: [{ name: 'Volver a la calle', r: [0, 880, 220, 120], arrow: 'down', to: 'calle', from: 'right' }],
  npc: {
    chica: { name: 'La chica del pub', 'Hablar': () => chicaTalk(), 'Mirar': () => say(S.active, 'Melena morena, vestido negro cortito y aros dorados. Lleva unas gafas de cerca colgadas del escote… ¡son las gafas de Ángel!') },
  },
  give: { chica: { '*': () => say('chica', 'Qué detalle… pero no, gracias, guapo.') } },
  async enter() {
    await narr('Un pub oscuro. Luz azul, neón de Estrella Galicia y una música que se te mete en el pecho.');
    await say('marc', 'Caballeros, aquí huele a ligue.');
    await say('ramis', 'Huele a gin-tonic.');
    await say('marc', 'Es lo mismo.');
    await say('angel', 'Yo me quedo en la barra. No he venido a ligar.');
    await say('angel', '…¡Eh! ¡Esa chica lleva mis gafas de cerca colgadas del escote! Me las he dejado en la barra leyendo la pizarra de tapas.', 'sorpresa');
    await say('ramis', 'Pues ya tienes excusa para hablarle, Ángel.', 'risa');
    await say('marcos', 'Pregunta mejor cómo vas a recuperarlas sin ponerte rojo.');
  },
};
async function chicaTalk() {
  const id = S.active;
  if (id === 'marc') {
    await say('marc', 'Hola. Soy dibujante. Te dibujaría como Manara: en blanco y negro… y con muy poquita ropa.');
    await say('chica', '¿Perdona? Tú dibuja, guapo, que yo estoy mirando a tu amigo, el barbas.');
    await say('marc', 'Veinte años de técnica tirados a la basura.', 'sorpresa');
    return;
  }
  if (id === 'ramis') {
    await say('ramis', 'Perdona… ¿te gustan los Porsche? Y otra cosa: esas gafas son de mi amigo.');
    await say('chica', 'Me gustan los hombres que no hablan de coches. Y las gafas me las quedo hasta que venga a por ellas el barbas.', 'risa');
    await say('ramis', 'Habiendo haber podido… no quise poder.');
    return;
  }
  if (id === 'marcos') {
    await say('marcos', 'Ho… hola. Bonito vestido: buen corte, buena caída. Soy diseñador de moda. ¿Me devuelves las gafas de mi amigo?');
    await say('chica', '¿Tú eres el que conduce, verdad? Qué mono. Pero yo estoy esperando a que se acerque el barbas.', 'risa');
    return;
  }
  // Ángel
  await say('angel', '(Ángel respira hondo. Él solo venía a por sus gafas.)');
  const v = await choose([
    { t: '«Hola. Me llamo Ángel y… canto en un grupo de rock»', v: 1 },
    { t: '«Perdona, esas gafas son mías»', v: 2 },
    { t: '«¿Te puedo invitar a algo?»', v: 3 },
  ]);
  if (v === 1) await say('chica', 'Me encantan los hombres con barba y voz de concierto.');
  if (v === 2) await say('chica', '¿Ah, sí? Pues ven a por ellas, barbas.', 'risa');
  if (v === 3) await say('chica', 'A algo me vas a invitar, sí…', 'risa');
  await narr('No pasa ni un minuto. Ni uno. La chica agarra a Ángel de la camisa de cuadros y…');
  music('beso'); try { AUDIO.duck(true); } catch (e) {}
  await narr('MINIJUEGO · ¡Toca sin parar para que no se apague la pasión!');
  const r = await MG.beso();
  sfx('beso');
  const mm = Math.floor(r.seg / 60);
  await narr(`…Y se besan. Y se besan. Y se siguen besando. ${mm >= 2 ? mm + ' minutos' : 'Un buen rato'} sin parar. El pub entero aplaude.`);
  await say('chica', 'Ha sido un placer, barbas. Toma tus gafas. Te quedan mejor a ti… bueno, no.', 'risa');
  give('gafas');
  await walk('chica', 1750, 1.6, { flip: false });
  removeActor('chica'); flag('beso', 1);
  await narr('Y así como se besaron… cada uno por su lado. Ella se pierde entre la gente, sin nombre y sin número.');
  await say('angel', '…¿Qué acaba de pasar?', 'sorpresa');
  await say('ramis', '¡ÁNGEL!', 'risa'); await say('marc', '¡ÁNGEL!', 'risa'); await say('marcos', '¡ÁNGEL!', 'risa');
  groupLaugh(); logro('minuto');
  await say('angel', 'Caballeros… yo solo venía a por mis gafas.', 'risa');
  await say('marc', 'Veinte años leyendo a Manara, y Ángel me lo resuelve en un minuto. Me retiro.');
  music('pub'); updObj();
}

/* ---------------- RUINAS DE SANTO DOMINGO ---------------- */
SCENES.ruinas = {
  title: 'RUINAS DE SANTO DOMINGO', sub: 'Luna llena', bg: 'ruinas', music: 'ruinas', ambient: 'ruinas',
  tint: { c: '#4a62c0', a: 0.14, d: 0.08 }, k: 0.58,
  pos: { ramis: [220, 990], marc: [435, 995], marcos: [1130, 990], angel: [1335, 995] },
  npcs: [{ id: 'fantasma', x: 830, y: 930, cond: () => flag('fantasmaVisto') }],
  fx: [
    { type: 'stars', n: 70, x0: 1100, x1: 1600, y0: 0, y1: 230 },
    { type: 'glow', x: 1437, y: 66, r: 150, color: '#fff2c0', a: 0.4 },
    { type: 'glow', x: 300, y: 330, r: 180, color: '#ffc26a', a: 0.28, flicker: 0.2 },
    { type: 'glow', x: 420, y: 330, r: 160, color: '#ffc26a', a: 0.25, flicker: 0.2, seed: 3 },
    { type: 'glow', x: 1530, y: 600, r: 90, color: '#ffc26a', a: 0.35, flicker: 0.3, seed: 6 },
    { type: 'glow', x: 830, y: 700, r: 360, color: '#9fd8ff', a: 0.12, cond: () => flag('fantasmaVisto') },
    // la luz del fondo de la cripta, cuando se abre la puertecita
    { type: 'glow', id: 'puertaLuz', x: 1525, y: 602, r: 260, color: '#ffe2a0', a: 0, aMax: 0.55, flicker: 0.15 },
    { type: 'glow', id: 'puertaLuz', x: 1525, y: 600, r: 60, color: '#fff6d8', a: 0, aMax: 1, flicker: 0.25, seed: 4 },
    { type: 'beam', id: 'puertaLuz', x0: 1525, y0: 650, x1: 1360, y1: 1000, w0: 34, w1: 190, color: 'rgba(255,225,160,0.9)', a: 0, aMax: 0.32 },
  ],
  setup() { this.fx.filter((f) => f.id === 'puertaLuz').forEach((f) => { f.a = flag('criptaAbierta') ? f.aMax : 0; }); },
  emit: [{ kind: 'fog', rate: 0.4, x0: -100, x1: 1500, y0: 720, y1: 1000, pre: 8 }, { kind: 'firefly', rate: 0.6, x0: 0, x1: 1600, y0: 300, y1: 800, pre: 5 }],
  hs: [
    { name: 'Arcos góticos', r: [130, 40, 480, 640], verbs: { 'Mirar': () => say(S.active, 'Arcos del siglo XIV que han aguantado guerras, lluvias y despedidas de soltero. Respeto.') } },
    { name: 'Ventanales', r: [258, 215, 200, 245], verbs: { 'Mirar': () => say(S.active, S.active === 'angel' ? 'Hay luz dentro. Y aquí no hay nadie. Bueno… nadie vivo.' : 'Ventanales con luz. ¿Quién ha dejado la luz encendida en unas ruinas?') } },
    { name: 'Rosetón', r: [1372, 333, 122, 122], verbs: { 'Mirar': () => say(S.active, 'Un rosetón de piedra. Marcos dice que es un mandala de nivel épico.') } },
    { name: 'Luna', r: [1400, 25, 75, 75], verbs: { 'Mirar': () => say(S.active, 'La luna llena sobre Santo Domingo. Qué foto. Marc: «La luz está fatal».') } },
    { name: 'Puertecita', r: [1490, 540, 70, 125], verbs: {
      'Abrir': async () => {
        if (flag('criptaAbierta')) return goScene('cripta', { from: 'left' });
        if (!flag('fantasmaVino') || !flag('retrato')) return say(S.active, 'Cerrada. Y por la cerradura sale olor a vino viejo y a misterio.');
        return say(S.active, 'Cerrada con una cerradura enorme. Hace falta una llave antigua…');
      },
      'Entrar|Bajar a la cripta': async () => { if (flag('criptaAbierta')) return goScene('cripta', { from: 'left' }); return say(S.active, 'Está cerrada.'); },
    }, items: { llave_antigua: () => abrirCripta() } },
  ],
  exits: [{ name: 'Volver a la plaza', r: [620, 900, 360, 100], arrow: 'down', to: 'plaza', from: 'left' }],
  npc: {
    fantasma: { name: 'Don Xesús, el fantasma', 'Hablar': () => fantasmaTalk(), 'Mirar': () => say(S.active, 'Un caballero translúcido con sombrero de pluma, capa y copa de vino. Brilla como una pantalla de móvil a las tres de la mañana.') },
  },
  give: { fantasma: { jarra: () => darVino(), llave_antigua: () => abrirCripta(), '*': () => say('fantasma', '¿Eso? ¡Mangurrián! Un caballero no acepta baratijas.') } },
  async enter() {
    await narr('Las ruinas de Santo Domingo bajo la luna llena. Arcos góticos, niebla y un frío que no es normal.');
    await say('angel', 'Aquí hay alguien. Lo noto.');
    await say('ramis', 'Será el vino.');
    sfx('fantasma'); flash('#bfe8ff', 0.6); shake(0.4);
    actor('fantasma', { x: 830, y: 930, k: 0.58, alpha: 0 }); flag('fantasmaVisto', 1);
    await tween(G.actors.fantasma, { alpha: 1 }, 1.2);
    await say('fantasma', '¡BRIBONES! ¡MANGURRIANES! ¿Quién osa perturbar mi descaaanso eterno a estas horas?');
    await say('marc', '…Es Chus. Es igualito que Chus.', 'sorpresa');
    await say('ramis', '¡Habla como Chus! ¡Chus, eres tú!', 'sorpresa');
    await say('fantasma', 'Soy Don Xesús de Santo Domingo, caballero ilustrado. Muerto en 1714 de mal de amores… y de un orujo en mal estado.');
    await say('marcos', 'Un fantasma de verdad. Esto es mejor que cualquier partida de rol.', 'risa');
    await say('fantasma', '¿Caaaballeros? ¿Vosotros? ¡Ja! Un caballero trae vino y respeta el arte. Traedme vino… y un retrato digno de mi persona.');
    await say('fantasma', 'Y quizá, solo quizá, os enseñe mi cripta. Dicen que guardo un tesoro. Dicen bien.');
    logro('lupanar'); updObj();
  },
};
async function fantasmaTalk() {
  const f = S.flags;
  if (S.active === 'marc' && !f.retrato) {
    const v = await choose([{ t: '✏ «Le hago un retrato, Don Xesús»', v: 1 }, { t: '«Nada, nada»', v: 0 }]);
    if (!v) return;
    sfx('pagina');
    await narr('Marc saca el móvil y dibuja. Capa al viento, pluma al aire… y, al estilo Manara, pecho descubierto y unas medias de liga que nadie le ha pedido.');
    await say('fantasma', '¡Maaarc! Tienes letra de escribano… pero ningún contenido.');
    await say('marc', '…', 'sorpresa');
    await say('fantasma', '…Bueno. Contenido sí que tiene. Mucho. ¡Albricias! ¡Es maaaagnífico!', 'risa');
    flag('retrato', 1); groupLaugh();
    if (f.fantasmaVino) await fantasmaListo();
    return;
  }
  const opts = [];
  if (!f.fantasmaVino) opts.push({ t: '«¿Qué hay que hacer para ver su cripta?»', v: 'q' });
  opts.push({ t: '«Usted habla igual que nuestro profe Chus»', v: 'chus' });
  opts.push({ t: '«Don Xesús, ¿qué le parecen las discotecas de neón?»', v: 'neon' });
  if (S.active === 'angel') opts.push({ t: '«¿Usted sabe cosas del amor, Don Xesús?»', v: 'amor' });
  opts.push({ t: '«Nada, buenas noches»', v: 'n' });
  const v = await choose(opts);
  if (v === 'q') await say('fantasma', 'Vino y un retraaato. ¡Vino y un retraaato! ¿Tan difícil es, bribones del siglo veintiuno?');
  if (v === 'chus') await say('fantasma', '¿Chus? ¿Un profesor ilustrado que grita «lupanar»? ¡Será descendiente mío! Los grandes hombres tenemos muchos descendientes.', 'risa');
  if (v === 'amor') {
    await say('fantasma', 'Tú, el barbas… tienes cara de haber amado a una tal Maje.');
    await say('angel', '¿Cómo sabe usted lo de Maje?', 'sorpresa');
    await say('fantasma', 'Los muertos lo sabemos todo. Y los profesores también. ' + (f.beso ? '¡Y esta noche, además, has besado! ¡Albricias, bribón!' : 'Y esta noche hay alguien esperándote en un pub oscuro. Hazme caso.'), 'risa');
  }
  if (v === 'neon') {
    await say('fantasma', '¿Esos antros de luces moradas y neones, con la música que retumba hasta aquí abajo? ¡Eso es un lupanar, un serrallo… vamos, una casa de putes!', 'sorpresa');
    await say('marc', 'Dicho por un muerto de 1714, tiene su mérito.');
    await say('ramis', '¡Me encanta este hombre!', 'risa');
  }
  if (v === 'n') await say('fantasma', 'Buenas noches, caaaballeros. O lo que seáis, bribones.');
}
async function darVino() {
  if (flag('fantasmaVino')) return say('fantasma', 'Ya bebí, ya bebí. Y no me deis más, que luego me vuelvo transparente del todo.');
  takeItem('jarra'); flag('fantasmaVino', 1); sfx('trago');
  await say('fantasma', '¡La barrica secreta de la Estrella! ¡Trescientos años sin probaaarla! ¡Albricias!', 'risa');
  await narr('Don Xesús bebe directamente de la jarra. El vino le baja por dentro y se ve. Se pone de un rosa transparente precioso.');
  await say('fantasma', 'Brindad conmigo, caballeros. ¡Todos!');
  ['ramis', 'marc', 'angel'].forEach((p) => drink(p, 1, true)); sfx('brindis');
  await tentarMarcos({ prompt: 'Don Xesús le ofrece su copa a Marcos…', si: '«Por usted, Don Xesús»', no: '«Yo brindo con agua, que conduzco»' });
  if (flag('retrato')) await fantasmaListo(); else await say('fantasma', 'Ahora… ¡el retrato! ¿Quién de vosotros sabe dibujar?');
}
async function fantasmaListo() {
  await say('fantasma', 'Vino y arte. Sois caballeros dignos. Mi cripta está tras la puertecita de la derecha.');
  await say('fantasma', 'Pero un tabernero de la Estrella me robó la llave en 1714. ¡Laaadrón! ¡Bribón! ¡Mangurrián!');
  if (has('llave_antigua')) await say('marcos', 'Una llave antigua… con un escudo de caballero. ¡La tenemos! La encontramos en la bodega del Estrella.', 'sorpresa');
  updObj();
}
async function abrirCripta() {
  if (flag('criptaAbierta')) return goScene('cripta', { from: 'left' });
  if (!flag('fantasmaVino') || !flag('retrato')) return say('fantasma', '¡Quieto! Primero vino y un retrato. Luego, mi cripta.');
  sfx('reja'); shake(0.25); flag('criptaAbierta', 1); takeItem('llave_antigua');
  // se va encendiendo una luz al fondo
  if (G.scene && G.scene.fx) G.scene.fx.filter((f) => f.id === 'puertaLuz').forEach((f) => tween(f, { a: f.aMax }, 2.4));
  await narr('La puertecita de hierro se abre con un chirrido que pone los pelos de punta. Al fondo, muy lejos, se enciende una luz.');
  await say('fantasma', '¡MI LLAVE! Trescientos años esperaaando. Pasad, pasad. Bajo yo delante, que conozco el camino.', 'risa');
  await goScene('cripta', { from: 'left' });
}

/* ---------------- CRIPTA ---------------- */
SCENES.cripta = {
  title: 'LA CRIPTA', sub: 'El descanso de Don Xesús', bg: 'cripta', music: 'cripta', ambient: 'cripta',
  tint: { c: '#ff9a4a', a: 0.1, d: 0.06 }, k: 0.56,
  // v13: a oscuras; Don Xesús brilla y, con el candelabro en la inscripción, se ve casi todo
  oscuro: { a: 0.9, luces: () => [{ x: 1010, y: 430, r: 440, a: 0.85 }].concat(flag('luzCripta') ? [{ x: 1030, y: 640, r: 720, a: 0.95 }] : []) },
  pos: { ramis: [250, 995], marc: [450, 1000], marcos: [650, 995], angel: [1490, 995] },
  npcs: [{ id: 'fantasma', x: 1020, y: 720, z: 1 }],
  fx: [
    ...[[256, 425], [310, 470], [366, 500], [543, 650], [572, 615], [612, 655], [662, 770], [700, 790], [1270, 515], [1303, 500], [1340, 488], [1368, 510],
      [1380, 745], [1430, 688], [1278, 855], [1310, 815], [1340, 870]].map(([x, y], i) => ({ type: 'candle', x, y: y - 10, r: 80, color: '#ffb050', a: 0.4, seed: i * 1.7 })),
    { type: 'beam', x0: 590, y0: 330, x1: 820, y1: 640, w0: 30, w1: 120, color: 'rgba(170,190,255,0.5)', a: 0.18 },
    { type: 'glow', x: 1020, y: 660, r: 260, color: '#ffd27a', a: 0.3, cond: () => flag('luzCripta') },
  ],
  emit: [{ kind: 'dust', rate: 3, x0: 560, x1: 860, y0: 330, y1: 640, pre: 20, color: '#dfe6ff' }],
  hs: [
    { name: 'Inscripción', r: [735, 548, 620, 92], verbs: { 'Leer': () => leerInscripcion() }, items: {
      candelabro: async () => { if (flag('luzCripta')) return say(S.active, 'Ya hay luz de sobra.'); flag('luzCripta', 1); takeItem('candelabro'); sfx('vela'); await narr('El candelabro ilumina la piedra. Aparece una inscripción tallada… en letra diminuta.'); },
      gafas: async () => {
        if (!flag('luzCripta')) return say(S.active, 'Con esta oscuridad no se ve ni con gafas. Hace falta luz.');
        flag('gafasPuestas', 1); takeItem('gafas'); sfx('pagina');
        await say('angel', 'Mis gafas de cerca. Ya era hora de que sirvieran para algo más que para leer letras de canciones.');
        await leerInscripcion();
      },
    } },
    { name: 'Sarcófago', r: [680, 640, 690, 230], verbs: {
      'Abrir': () => abrirSarcofago(),
      'Mirar': () => say(S.active, 'Un sarcófago de piedra con relieves de santos y un caballero tumbado encima. Don Xesús dice que se le parece «bastante, pero con menos glamour».'),
    } },
    { name: 'Ventanuco', r: [553, 282, 92, 170], verbs: { 'Mirar': () => say(S.active, 'Entra la luz de la luna por el ventanuco. Polvo flotando en el rayo. Precioso. Marc: «La luz está… bien. Por una vez».') } },
    { name: 'Cruz', r: [1285, 322, 112, 170], verbs: { 'Mirar': () => say(S.active, S.active === 'angel' ? 'Una cruz con velas. Aquí se reza, se cree o se respeta. Yo respeto.' : 'Una cruz de piedra con velas. Ángel ya está con los ojos cerrados.'), 'Rezar': async () => { await say(S.active, 'Por que Marcos llegue sereno a Caldofran. Amén.'); } } },
    { name: 'Candelabro de hierro', r: [195, 410, 215, 520], verbs: { 'Mirar': () => say(S.active, 'Un candelabro de hierro con velas que no se gastan nunca. Don Xesús: «Bajo consumo, del siglo XVIII».') } },
  ],
  exits: [{ name: 'Subir a las ruinas', r: [0, 0, 170, 360], arrow: 'up', to: 'ruinas', from: 'right' }],
  npc: { fantasma: { name: 'Don Xesús, el fantasma', 'Hablar': () => {
    if (flag('sarcofago')) return say('fantasma', 'Id con mi tesoro y mi bendición, caballeros. Y volved algún año, que aquí me aburro.');
    if (flag('acertijo')) return say('fantasma', 'Me has ganado en buena lid, bribón. Abre el sarcófago, anda.');
    if (flag('gafasPuestas')) return dueloXesus();
    return say('fantasma', 'Mi tesoro está en el sarcófago. Pero solo se lo lleva quien me venza. ¡Leed la inscripción, leed!');
  } } },
  give: { fantasma: { '*': () => say('fantasma', 'Guárdalo. Aquí abajo no me hace falta nada.') } },
  async enter() {
    await narr('La cripta de Don Xesús. Velas que nadie enciende, un rayo de luna y un sarcófago con un caballero de piedra.');
    await say('fantasma', 'Mi descanso eterno. Bonito, ¿eh? Lo decoré yo mismo.');
    await say('marcos', 'En el sarcófago hay una inscripción. Pero está en sombra…');
  },
};
async function leerInscripcion() {
  if (!flag('luzCripta')) return say(S.active, 'Está en sombra. Hace falta más luz… ¿algo con velas?');
  if (!flag('gafasPuestas')) return say(S.active, pick(['La letra es diminuta. Ninguno de los cuatro ve de cerca. La edad, caballeros, la edad.', 'Hace falta vista de cerca. Ángel tenía unas gafas… si las recuperamos.']));
  if (flag('acertijo')) return say(S.active, '«…que me venza en duelo». Vencido. Ahora, el sarcófago.');
  await narr('«QUIEN QUIERA MI TESORO, QUE ME VENZA EN DUELO. DE ESPADA… Y DE LENGUA.»');
  await dueloXesus();
}
async function abrirSarcofago() {
  if (flag('sarcofago')) return say(S.active, 'Abierto y saqueado. Con permiso del dueño, eso sí.');
  if (!flag('acertijo')) return say(S.active, flag('gafasPuestas') ? 'No se mueve. Ni empujando los cuatro. Primero hay que ganarle el duelo a Don Xesús.' : 'No se mueve. Ni empujando los cuatro. Habrá que leer la inscripción.');
  sfx('sarcofago'); shake(0.7); flag('sarcofago', 1);
  await narr('La tapa se desliza con un rugido de piedra. Dentro, sobre un cojín de terciopelo: una bolsa de reales de plata… y un billete de cincuenta euros.');
  await say('ramis', '¿Un billete de cincuenta? ¿En 1714?', 'sorpresa');
  await say('fantasma', 'Se lo gané anoche al mus a un turista inglés en chanclas. Mal perdedor, por cierto.', 'risa');
  flag('carteraLlena', 1); sfx('moneda');
  toast('💶', 'La cartera de Ramis', '¡vuelve a tener dinero!');
  await say('fantasma', 'Arrodillaos.');
  await narr('Los cuatro se arrodillan. Don Xesús les toca el hombro, uno a uno, con su copa de vino.');
  await say('fantasma', 'Por el poder que me otorga estar muerto: os nombro CABALLEROS DE SANTO DOMINGO. ¡Ramis, Marc, Marcos, Ángel: no me dejéis en mal lugar!');
  groupLaugh(); logro('caballero');
  await say('ramis', 'Yo al menos podré decir que he vivido. Y que me ha nombrado caballero un muerto.', 'risa');
  updObj();
}

/* ---------------- LA ALAMEDA (la meiga) ---------------- */
SCENES.alameda = {
  title: 'LA ALAMEDA', sub: 'Noche de meigas', bg: 'alameda', music: 'alameda', ambient: 'alameda',
  tint: { c: '#3a4aa0', a: 0.12, d: 0.05 }, k: 0.5,
  pos: { ramis: [850, 985], marc: [1050, 990], marcos: [1250, 985], angel: [1450, 990] },
  npcs: [{ id: 'meiga', x: 560, y: 985 }],
  fx: [
    ...[[176, 170], [252, 150], [333, 170], [1010, 335], [812, 362], [1225, 362], [667, 482], [1393, 450], [1416, 448], [1000, 160], [870, 250], [1150, 250]].map(([x, y], i) => ({ type: 'glow', x, y, r: 150, color: '#ffcf7a', a: 0.3, flicker: 0.1, seed: i })),
    { type: 'glow', x: 560, y: 800, r: 260, color: '#9a7aff', a: 0.12, cond: () => S.active === 'angel' },
  ],
  emit: [{ kind: 'firefly', rate: 1.2, x0: 0, x1: 1600, y0: 300, y1: 850, pre: 10 }, { kind: 'leaf', rate: 0.4, x0: 0, x1: 1600, y0: -20, y1: 0 }],
  hs: [
    { name: 'Glorieta', r: [740, 100, 560, 520], verbs: { 'Mirar': () => say(S.active, 'La glorieta de la música, iluminada. Ramis quiere subirse a cantar. Lo estamos sujetando.') } },
    { name: 'Cruceiro', r: [435, 265, 110, 300], verbs: { 'Mirar': () => say(S.active, S.active === 'angel' ? 'Un cruceiro. La meiga está a su lado, como quien espera el autobús de las almas.' : 'Otro cruceiro. En Galicia hay más cruceiros que bares. Bueno, casi.') } },
    { name: 'Banco', r: [0, 660, 300, 120], verbs: { 'Sentarse': async () => { sfx('tela'); await say(S.active, 'Ahhh. Un banco de granito, frío como el corazón de un notario. Me levanto.'); } } },
    { name: 'Campanario', r: [1175, 30, 160, 290], verbs: { 'Mirar': () => say(S.active, 'Una torre a lo lejos. Dan las campanadas de la una. O de las dos. Ya no lo sé.') } },
  ],
  exits: [{ name: 'Volver a la plaza', r: [0, 820, 150, 180], arrow: 'left', to: 'plaza', from: 'left' }],
  npc: {
    meiga: { name: 'A meiga Pura', 'Hablar': () => meigaTalk(), 'Mirar': () => say(S.active, S.active === 'angel' ? 'Una mujer mayor con pañuelo negro. A su alrededor brilla un aura violeta. Es una meiga. Seguro.' : 'Una abuela muy maja con pañuelo negro, al lado del cruceiro. Ángel dice que brilla. Yo no veo nada.') },
  },
  give: {
    meiga: {
      postres: () => darMeiga('postres'), calzoncillos: () => darMeiga('calzoncillos'),
      '*': () => say('meiga', 'Iso non me serve, rapaz.'),
    },
  },
  async enter() {
    await narr('La Alameda de Pontevedra. Árboles enormes, la glorieta iluminada y un cruceiro de piedra. Huele a tierra mojada y a magia.');
    await say('angel', '¿La veis? Esa señora del pañuelo negro… brilla un poco.', 'sorpresa');
    await say('ramis', 'Yo solo veo a una abuela muy maja.');
    await say('marc', 'Será la prima de la señora del Estrella. La meiga.');
    flag('meigaVista', 1);
  },
};
async function meigaTalk() {
  const f = S.flags;
  if (S.active !== 'angel' && !f.meigaPide) {
    await say('meiga', 'Ti non, rapaz. Que veña o barbas. Ese ten o don.');
    await say(S.active, 'Dice que hable Ángel. Que tiene «el don».');
    return;
  }
  if (S.active === 'ramis' && f.meigaPide && !has('calzoncillos') && !f.meigaCalzon) return ramisCalzon();
  if (f.meigallo) return say('meiga', 'Ide tranquilos. Esta noite a sorte vai convosco. E lembrade: se vedes á Compaña, círculo de sal.');
  if (!f.meigaPide) {
    await say('meiga', 'Ola, meu rei. Ti tes o don, xa o sei. ' + (f.beso ? 'E hoxe xa bicaches, eh? Xa se che nota na cara.' : 'E tes voz de cantante… e aínda pensas nunha tal Maje.'), 'risa');
    await say('angel', '¿Cómo sabe usted eso?', 'sorpresa');
    await say('meiga', 'As meigas sabémolo todo. Que queredes, rapaces?');
    await choose([{ t: '«Nos vendría bien un poco de suerte esta noche»', v: 1 }, { t: '«Que Marcos llegue sereno a Caldas… o que lo parezca»', v: 2 }]);
    await say('meiga', 'Para un meigallo de boa sorte preciso dúas cousas: algo doce feito con amor… e unha prenda íntima dun cabaleiro valente.');
    await say('marcos', 'Traducción: algo dulce hecho con amor… y una prenda íntima de un caballero valiente.', 'sorpresa');
    await say('ramis', '…¿Por qué me miráis todos a mí?', 'sorpresa');
    flag('meigaPide', 1); updObj();
    return;
  }
  const falta = [!f.meigaPostres && 'algo doce feito con amor', !f.meigaCalzon && 'a prenda íntima dun cabaleiro valente'].filter(Boolean);
  await say('meiga', 'Aínda me falta ' + falta.join(' e ') + '.');
}
async function ramisCalzon() {
  await say('ramis', '¿Una prenda íntima… de un caballero valiente? Caballeros… ha llegado mi momento.');
  await walk('ramis', 1000, 0.8);
  G.actors.ramis.alpha = 1; await tween(G.actors.ramis, { alpha: 0 }, 0.4);
  sfx('cremallera'); await wait(700); sfx('tela'); await wait(500);
  await narr('Ramis desaparece detrás de la glorieta. Se oye una cremallera. Un saltito. Un «ay». Otra cremallera.');
  await tween(G.actors.ramis, { alpha: 1 }, 0.4);
  give('calzoncillos');
  await say('ramis', 'De rayas. Todavía calentitos. Yo al menos podré decir que he vivido.', 'risa');
  await say('marc', 'Esto sí que no lo dibujo. Ni Manara se atrevería.', 'risa');
  logro('calzon');
}
async function darMeiga(what) {
  const f = S.flags;
  if (!f.meigaPide) return say('meiga', 'Aínda non sei que queredes, rapaz.');
  if (what === 'postres') {
    if (f.meigaPostres) return say('meiga', 'Xa me deches os postres. Ai, que bos.');
    takeItem('postres'); flag('meigaPostres', 1); sfx('ok');
    await say('meiga', '¡Os postres da miña prima Maruxa! Esta muller cociña con amor e con manteiga. Moita manteiga.', 'risa');
  } else {
    if (f.meigaCalzon) return say('meiga', 'Xa os teño. Non quero máis, grazas.');
    takeItem('calzoncillos'); flag('meigaCalzon', 1); sfx('tela');
    await say('meiga', 'Uns calzóns de raias, aínda quentiños… Isto é valentía de verdade.', 'risa');
    await say('ramis', 'Lo que hago por el Club.');
  }
  if (flag('meigaPostres') && flag('meigaCalzon')) await meigallo();
}
async function meigallo() {
  music('meiga');
  await say('meiga', 'Agora si. Poñédevos arredor, rapaces.');
  await narr('La meiga baila una muiñeira alrededor del cruceiro, con los calzoncillos de Ramis en una mano y una filloa en la otra.');
  // la muiñeira de verdad: va cambiando de paso (dibujos de JRAR) y gira
  const mg = G.actors.meiga, oldSp = mg && mg.sprite, oldFlip = mg && mg.flip, baila = !!G.img['chars/meiga_baila1'];
  for (let i = 0; i < 14; i++) {
    if (mg && baila) { mg.sprite = 'chars/meiga_baila' + ((i % 3) + 1); mg.flip = Math.floor(i / 3) % 2 === 1; }
    if (i % 2 === 0) hopA('meiga');
    if (i % 3 === 0) { emit('spark', 560, 600, 18, { color: '#c9a0ff', sx: 90, sy: 120 }); sfx('magia'); }
    await wait(320);
  }
  if (mg) { mg.sprite = oldSp; mg.flip = oldFlip; }
  flash('#c9a0ff', 0.6);
  await say('meiga', 'Meigallo de boa sorte: esta noite ningún garda vos verá torcidos.');
  await say('meiga', 'E se vedes á Santa Compaña: círculo de sal… e non miredes atrás.');
  flag('meigallo', 1); logro('meigallo');
  await say('meiga', 'E agora, un chisquiño de licor de herbas para pechar o trato.');
  ['ramis', 'marc', 'angel'].forEach((p) => drink(p, 1, true)); sfx('brindis');
  await tentarMarcos({ prompt: 'La meiga le ofrece licor de hierbas a Marcos…', si: '«A una meiga no se le dice que no»', no: '«Gracias, señora, pero conduzco»' });
  music('alameda'); updObj();
}

/* ---------------- PARKING ---------------- */
SCENES.parking = {
  title: 'EL PARKING', sub: 'Ahí espera el Peugeot', bg: 'parking', music: 'parking', ambient: 'parking',
  tint: { c: '#ffd27a', a: 0.05, d: 0.05 }, k: 0.74,
  pos: { ramis: [150, 995], marc: [375, 1000], marcos: [600, 995], angel: [825, 1000] },
  fx: [
    { type: 'tube', x: 1015, y: 155, w: 440, bad: false },
    { type: 'tube', x: 395, y: 318, w: 160, bad: true },
    { type: 'tube', x: 1555, y: 338, w: 110, bad: false },
    { type: 'glow', x: 1240, y: 505, r: 120, color: '#e8f4ff', a: 0.0, id: 'faro' },
  ],
  hs: [
    { name: 'Peugeot 5008', r: [790, 345, 720, 420], verbs: {
      'Mirar': () => say(S.active, S.active === 'ramis' ? 'Blanco, siete plazas, techo panorámico. No es un Porsche… pero esta noche es nuestro Porsche.' : 'El Peugeot 5008 blanco de Marcos. Ramis le habla como si fuera un 911.'),
      'Conducir|¡Rumbo a Caldofran!': () => arrancar(),
    } },
    { name: 'Columna', r: [60, 40, 200, 760], verbs: { 'Mirar': () => say(S.active, 'Una columna con una P enorme. Marcos dice que es la P de «Peugeot». Ramis dice que de «Porsche».') } },
    { name: 'Extintor', r: [668, 428, 50, 95], verbs: { 'Mirar': () => say(S.active, 'Un extintor. Por si a Ramis le da por cantar algo muy caliente.') } },
  ],
  exits: [{ name: 'Volver a la plaza', r: [0, 300, 60, 400], arrow: 'left', to: 'plaza', from: 'right' }],
  async enter() {
    await narr('El parking subterráneo. Fluorescentes que zumban, un tubo que tartamudea… y ahí está: el Peugeot 5008 blanco.');
    await say('ramis', 'Siete plazas, cero Porsche. Pero lo quiero igual.', 'risa');
    updObj();
  },
};
async function arrancar() {
  if (!has('llaves')) return say('marcos', flag('llavesConfiscadas') ? 'Las llaves las tiene Brais, el del bareto. Sin llaves, este Peugeot es una sala de estar.' : '¿Las llaves? …Ah, que las tengo yo.');
  if (S.drunk.marcos >= 3) { await say('marc', 'Marcos, tal como vas no conduces ni un carrito del Gadis. Un café primero.', 'sorpresa'); return; }
  if (!flag('beso')) { const v = await choose([{ t: 'Nos vamos ya a Caldofran', v: 1 }, { t: 'Esperad… la noche aún no ha terminado', v: 0 }], 'Ángel: «¿Ya nos vamos? Siento que esta noche aún me debe algo…»'); if (!v) return; }
  if (!flag('meigallo')) { const v = await choose([{ t: 'Arrancar igualmente', v: 1 }, { t: 'Mejor ir a ver a la meiga antes', v: 0 }], 'Ángel: «Tengo un presentimiento: en la carretera nos va a hacer falta suerte.»'); if (!v) return; }
  await finale();
}

/* ---------------- FINAL: carretera, control, Compaña, vaca, balneario ---------------- */
SCENES.control = {
  title: 'CONTROL', sub: 'N-550 · Caldas de Reis 9 km', draw: (c, t) => {
    c.drawImage(PROC.get('control'), 0, 0, W, H);
    // luces de la Guardia Civil
    const on = Math.floor(t * 3) % 2 === 0;
    c.save(); c.globalCompositeOperation = 'lighter';
    // con el dibujo de JRAR, las luces salen del coche patrulla (y se reflejan en el asfalto mojado)
    (G.img['bg/control'] ? [[1505, 425, on ? 0.55 : 0.12], [1440, 430, on ? 0.12 : 0.45], [1480, 760, on ? 0.3 : 0.08]] : [[-40, 640, on ? 0.55 : 0.15], [120, 560, on ? 0.15 : 0.5]]).forEach(([x, y, a]) => { const g = c.createRadialGradient(x, y, 10, x, y, 700); g.addColorStop(0, `rgba(60,120,255,${a})`); g.addColorStop(1, 'rgba(60,120,255,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H); });
    c.restore();
    // señales de la carretera (dibujos de JRAR) y el Peugeot a tamaño real, no de juguete
    if (!G.img['bg/control']) { MG.drawImgH(c, 'road/cartel_caldas', 95, 800, 360); MG.drawImgH(c, 'road/stop', 1545, 840, 400); }
    MG.drawImgH(c, 'items/peugeot_lado', G.img['bg/control'] ? 470 : 560, 960, 430, { flip: true });
  }, music: 'control', ambient: 'control', noDrunk: true, noHud: true, k: 0.56,
  npcs: [{ id: 'gc1', x: 1160, y: 985, flip: true }, { id: 'gc2', x: 1380, y: 990, flip: true }],
  hs: [], exits: [],
};
SCENES.camino = {
  title: 'CAMIÑO DAS ÁNIMAS', sub: 'Desvío por obras', draw: (c) => c.drawImage(PROC.get('camino'), 0, 0, W, H), music: 'compana', ambient: 'compana', noDrunk: true, noHud: true, k: 0.5,
  emit: [{ kind: 'fog', rate: 0.8, x0: -100, x1: 1500, y0: 600, y1: 1000, pre: 12, color: '#a8b8e8' }],
  // el dibujo de JRAR ya trae su cruceiro
  props: [{ img: 'cruceiro', x: 330, y: 760, h: 420, cond: () => !G.img['bg/camino'] }, { img: 'peugeot_atras', x: 860, y: 985, h: 250 }],
  hs: [], exits: [],
};
SCENES.balneario = {
  title: 'BALNEARIO ACUÑA', sub: 'Caldas de Reis · casi amanece', draw: (c) => c.drawImage(PROC.get('balneario'), 0, 0, W, H), music: 'balneario', ambient: 'balneario', noDrunk: true, noHud: true, k: 0.42,
  pos: { ramis: [400, 862], marc: [565, 866], marcos: [1040, 862], angel: [1205, 866] },
  npcs: [{ id: 'recep', x: 800, y: 870 }],
  props: [{ img: 'peugeot_lado', x: 1430, y: 880, h: 190 }],
  emit: [{ kind: 'leaf', rate: 0.3, x0: 0, x1: 1600, y0: -20, y1: 0 }, { kind: 'fog', rate: 0.15, x0: -100, x1: 1500, y0: 700, y1: 980, pre: 4 }],
  fx: [{ type: 'shimmer', x: 800, y: 900, w: 1400, color: '#ffd08a' },
    ...[[318, 305], [262, 330], [376, 330], [1450, 300], [1393, 325], [1507, 325], [668, 370]].map(([x, y], i) => ({ type: 'glow', x, y, r: 130, color: '#ffcf7a', a: 0.3, flicker: 0.1, seed: i }))],
  hs: [], exits: [],
};
SCENES.piscina = {
  title: '', draw: (c, t) => {
    c.drawImage(PROC.get('piscina'), 0, 0, W, H);
    // agua con reflejos
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 40; i++) { const y = 600 + (i * 37) % 400, x = (i * 173 + t * 30 * (i % 3 + 1)) % 1800 - 100; c.globalAlpha = 0.08 + 0.05 * Math.sin(t * 2 + i); c.fillStyle = '#e8ffff'; c.beginPath(); c.ellipse(x, y, 60 + (i % 5) * 20, 5, 0, 0, 7); c.fill(); }
    c.restore();
    // los cuatro con el agua al cuello
    PROTA.forEach((id, i) => {
      const x = 380 + i * 280, y = 740 + Math.sin(t * 1.6 + i) * 8, im = G.img['faces/' + id + '_risa'];
      if (!im) return; const h = 290, w = im.width * h / im.height;
      c.save(); c.beginPath(); c.rect(x - w, 0, w * 2, y + 30); c.clip(); c.drawImage(im, x - w / 2, y - h + 60, w, h); c.restore();
      c.save(); c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3; for (let r = 0; r < 3; r++) { const k = ((t * 0.6 + r / 3 + i * 0.2) % 1); c.globalAlpha = 1 - k; c.beginPath(); c.ellipse(x, y + 32, 110 + k * 120, 16 + k * 14, 0, 0, 7); c.stroke(); } c.restore();
    });
  }, music: 'balneario', ambient: 'balneario', noDrunk: true, noHud: true,
  emit: [{ kind: 'steam', rate: 7, x0: 0, x1: 1600, y0: 560, y1: 900, pre: 30 }],
  hs: [], exits: [],
};

async function finale() {
  S.flags.enRuta = 1;
  await narr('Los cuatro caballeros se suben al Peugeot. Marcos al volante, Ramis detrás hablando solo, Marc con el GPS y Ángel mirando la luna.');
  sfx('motor'); const faro = G.scene.fx.find((f) => f.id === 'faro'); if (faro) faro.a = 0.5;
  await say('marc', 'GPS: Balneario Acuña, Caldas de Reis. Veinticinco minutos.');
  await say('marcos', 'Cinturones, caballeros. Esta noche conduce el Señor.');
  sfx('pop'); await narr('Al móvil de Marcos le llega un mensaje. Es Noémia: «¿Vas sereno? Los niños preguntan por papá».');
  await say('marcos', 'Sereno, cariño. Dales un beso a Breogán y a Rosalía. Mañana les llevo… algo. Un imán de Caldas.');
  await say('ramis', '¡NOÉMIA, TU MARIDO ES UN SANTO!', 'risa');
  await say('ramis', '¡YO AL MENOS PODRÉ DECIR QUE HE VIVIDO!', 'risa');
  await fadeTo(1, 0.8);
  await card('RUMBO A CALDOFRAN', 'N-550 · Pontevedra → Caldas de Reis', 2200);
  music('cancion'); ambient('carretera');
  G.scene = null; G.actors = {};
  await fadeTo(0, 0.4);
  await MG.carretera({ len: 55, km: 12, label: 'N-550 hacia Caldas de Reis' });
  // control de la Guardia Civil
  await goScene('control');
  sfx('sirena');
  await say('gc2', 'Buenas noches. Control de alcoholemia. Documentación y a soplar, conductor.');
  await say('marcos', '…Buenas noches, agente.', 'sorpresa');
  let pasa = false;
  if (flag('meigallo')) {
    await narr('De repente, una ráfaga de viento con olor a filloas y a calzoncillo de rayas. La radio del coche patrulla chisporrotea.');
    sfx('magia');
    await say('gc1', '«Atención, todas las unidades: vaca suelta en la N-550, kilómetro noventa y dos.»');
    await say('gc2', '¡Otra vez la vaca de Ramiro! …Usted tiene cara de buena persona. Circulen, circulen.');
    pasa = true;
  } else if (S.drunk.marcos <= 1) {
    sfx('tic'); await narr('Marcos sopla. El aparato piensa. Piensa más. Pita.');
    await say('gc2', 'Cero coma cero. ¿Usted bebe agua o qué? Circulen.');
    pasa = true;
  }
  if (pasa) {
    await say('ramis', '¡YO AL MENOS PODRÉ DECIR QUE HE VIVIDO!', 'risa');
    await say('gc2', '¿Qué ha dicho ese?');
    await say('marc', 'Nada, agente. Que es poeta.');
    await say('gc1', 'Ja, ja. Buenas noches, poetas.', 'risa');
  } else {
    sfx('tic'); await narr('Marcos sopla. El aparato pita con cara de pocos amigos.');
    await say('gc2', 'Cero coma treinta y uno. Positivo, caballero. Bajen del vehículo.');
    sfx('fallo'); music('derrota'); S.stats.derrotas++;
    await card('EL CUARTELILLO', 'La noche acaba jugando al mus con el sargento', 3000);
    await say('angel', 'Lo sabía… nos hacía falta suerte. La meiga de la Alameda…');
    await narr('Por suerte es solo una pesadilla de Marcos, que se ha quedado dormido en el parking. Despierta sobresaltado.');
    drink('marcos', -1);
    S.flags.enRuta = 0;
    await goScene('parking');
    updObj();
    return;
  }
  // desvío y Santa Compaña
  await say('marc', 'El GPS dice que hay obras. Nos manda por un camino rural: «Camiño das Ánimas».');
  await say('angel', 'Ese nombre no me gusta nada.');
  await goScene('camino');
  sfx('campana'); await wait(500); sfx('campana');
  await narr('Niebla. Muros de piedra. Una campanilla a lo lejos. Y entre los pinos, una hilera de luces que avanza sin hacer ruido.');
  await say('angel', '¡La Santa Compaña! ¡Que nadie la mire a los ojos! ¡Fuera del coche y la sal, rápido!', 'sorpresa');
  await say('ramis', 'Bajo el yugo opresor… y ahora también bajo el yugo de las ánimas.', 'sorpresa');
  if (!has('sal')) { await say('marc', '¡No tenemos sal! …Espera, en la guantera hay un sobre de sal de un McDonald’s de 2019.'); }
  let ok = false, intentos = 0;
  while (!ok) {
    ok = await MG.circulo(); intentos++;
    if (!ok) { await say('angel', intentos === 1 ? '¡Otra vez, más grande y que se cierre! ¡Los cuatro dentro!' : '¡Venga, que se acercan! ¡Un círculo bien cerrado!', 'sorpresa'); }
  }
  logro('compana');
  await narr('La procesión pasa a vuestro lado, tan cerca que se siente el frío. Una de las ánimas se gira hacia Ramis, le mira… y niega con la cabeza: «Este aún no».');
  await say('ramis', 'Yo al menos podré decir que he vivido… y que voy a vivir un poco más.', 'risa');
  await fadeTo(1, 0.6); G.scene = null; G.actors = {}; music('cancion'); ambient('carretera'); await fadeTo(0, 0.4);
  await MG.carretera({ len: 36, km: 5, cow: true, label: 'Últimos kilómetros' });
  logro('muuu');
  // llegada
  await goScene('balneario');
  await narr('Caldas de Reis, a punto de amanecer. Las farolas todavía encendidas, el Umia humeando… y el Balneario Acuña esperándoos, blanco y elegante, como si no supiera lo que se le viene encima.');
  await say('recep', 'Buenos días… ¿Señores…? ¿Caballeros? Tienen reserva para… una persona.');
  await say('marcos', 'Somos cuatro. Pero ocupamos como uno.');
  await say('recep', 'Pasen, pasen. La piscina termal abre a las ocho. Son las ocho menos un minuto.', 'risa');
  // el peregrino de la plaza llega justo detrás (si le indicasteis bien)
  if (flag('peregrinoOk')) {
    actor('peregrino', { x: 1750, y: 868, k: 0.42, flip: true });
    await walk('peregrino', 1330, 1.4, { flip: true });
    await say('peregrino', '¡Caballeros! ¡Etapa Pontevedra–Caldas de Reis, hecha! Siguiendo las flechas amarillas, como me dijisteis.', 'risa');
    await say('ramis', '¿Has venido andando toda la noche?', 'sorpresa');
    await say('peregrino', 'Y vosotros en coche, y casi llegamos a la vez. Ese Peugeot va más lento que un peregrino con ampollas. ¡Buen Camino!');
    logro('camino');
  }
  logro('caldofran'); if (S.drunk.marcos === 0) logro('sereno');
  await goScene('piscina');
  await narr('Y así, con el agua caliente hasta el cuello, el Club de Caballeros cerró una noche que ninguno va a olvidar.');
  await say('ramis', 'Caballeros… yo al menos podré decir que he vivido.', 'risa');
  await say('angel', 'Y yo, que he besado en un minuto' + (flag('concierto') ? ' y he cantado punk en un antro.' : '. Por unas gafas.'), 'risa');
  await say('marc', 'Esto lo dibujo. Estilo Manara. Sin medias de liga. O con.', 'risa');
  await say('marcos', S.stats.marcosCopas ? 'He bebido poco y he conducido mucho. Brais, Don Xesús, la meiga… Ahora sí: ¡una cerveza bien fría! Y una ensaimada.' : 'Toda la noche sin beber una gota. Ahora sí: ¡una cerveza bien fría! Y una ensaimada, si alguien la encuentra en Galicia.', 'risa');
  await say('ramis', 'Nunca más… ¡hasta el sábado!', 'risa');
  groupLaugh();
  await resultados();
}

function rango() {
  const f = S.flags; let pts = 0;
  // los de la historia valen 1; los de la movida (opcionales) también suman
  ['postre', 'minuto', 'caballero', 'meigallo', 'compana', 'calzon', 'maceta', 'lupanar', 'sereno', 'muuu',
    'joven', 'pillaria', 'porche', 'ligon', 'pista', 'canero', 'apostol', 'camino', 'reinas', 'madrugada'].forEach((l) => { if (S.logros.includes(l)) pts++; });
  pts -= S.stats.derrotas; pts -= Math.floor(S.stats.sustos / 3);
  return pts >= 15 ? 'CABALLERO LEGENDARIO' : pts >= 10 ? 'CABALLERO DE ORO' : pts >= 6 ? 'CABALLERO DE PLATA' : 'CABALLERO DE BARRO';
}
/* ---------------- PUNTUACIÓN Y MARCADOR ---------------- */
const SCORE_KEY = 'pq_marcador_v1';
function loadScores() { try { const l = JSON.parse(localStorage.getItem(SCORE_KEY)); return Array.isArray(l) ? l : []; } catch (e) { return []; } }
function saveScores(l) { try { localStorage.setItem(SCORE_KEY, JSON.stringify(l.slice(0, 10))); } catch (e) {} }
function puntuacion() {
  const st = S.stats, min = Math.max(1, Math.round((Date.now() - S.startT) / 60000)), mf = S.drunk.marcos;
  const seg = st.besoSeg || 0;
  const parts = [
    ['Logros', S.logros.length + ' de ' + Object.keys(LOGROS).length, S.logros.length * 100],
    ['Chupitos al jarrón', String(st.chupitosTirados || 0), (st.chupitosTirados || 0) * 50],
    ['El beso de Ángel', Math.floor(seg / 60) + ' min ' + (seg % 60) + ' s', Math.min(300, Math.round(seg / 2))],
    ['Concierto en O Furado', st.concierto ? Math.round(st.concierto * 100) + ' %' : 'no subió', Math.round((st.concierto || 0) * 300)],
    ['Marcos al volante', LV[mf], [300, 150, 50, 0, 0, 0][mf] || 0],
    ['Sustos en carretera', String(st.sustos || 0), -40 * (st.sustos || 0)],
    ['Noches en el cuartelillo', String(st.derrotas || 0), -250 * (st.derrotas || 0)],
    ['Rapidez', min + ' min', Math.max(0, 500 - min * 10)],
  ];
  return { parts, total: Math.max(0, parts.reduce((t, p) => t + p[2], 0)) };
}
function tablaMarcador(list, hi) {
  if (!list.length) return '<p style="font-size:30px;margin:20px 0">Todavía no hay partidas apuntadas.</p>';
  return '<table class="sct"><tr><th>#</th><th>Caballero</th><th>Puntos</th><th>Rango</th><th>Fecha</th></tr>' +
    list.map((e, i) => `<tr class="${i === hi ? 'hi' : ''}"><td>${i + 1}</td><td>${e.name}</td><td>${e.pts}</td><td>${e.rango}</td><td>${e.fecha}</td></tr>`).join('') + '</table>';
}
function cardBox(html) {
  const c = $('card');
  c.innerHTML = `<div class="cin scbox">${html}</div>`;
  c.classList.remove('hidden');
  return c;
}
async function verMarcador(hi, boton) {
  cardBox(`<h2 style="font-size:54px">MARCADOR DEL CLUB</h2>${tablaMarcador(loadScores(), hi)}<button class="gold big" id="scOk" style="margin-top:22px">${boton || 'Cerrar'}</button>`);
  await new Promise((res) => { $('scOk').onclick = (e) => { e.stopPropagation(); sfx('click'); res(); }; });
  $('card').classList.add('hidden');
}
async function resultados() {
  S.over = true; clearSave();
  const r = rango(), P = puntuacion();
  if (TEST) { (G.log = G.log || []).push('RANGO: ' + r + ' · ' + P.total + ' puntos · logros ' + S.logros.join(',')); return; }
  music('cancion');
  const filas = P.parts.map((p) => `<tr><td>${p[0]}</td><td>${p[1]}</td><td class="${p[2] < 0 ? 'neg' : ''}">${p[2] > 0 ? '+' : ''}${p[2]}</td></tr>`).join('');
  cardBox(`<h2 style="font-size:52px">${r}</h2>
    <div class="scnum"><span id="scN">0</span> puntos</div>
    <table class="sct det">${filas}</table>
    <p style="font-size:40px;margin:6px 0 2px">${S.logros.map((l) => LOGROS[l].i).join(' ')}</p>
    <p style="font-size:26px;margin-bottom:10px">¿Quién ha jugado esta partida?</p>
    <div class="scwho">${PROTA.map((p) => `<button class="gold" data-n="${NAMES[p]}">${NAMES[p]}</button>`).join('')}<button class="gold" data-n="Invitado">Invitado</button></div>`);
  // los puntos suben poco a poco
  let k = 0; const tm = setInterval(() => { k = Math.min(1, k + 0.04); const el = $('scN'); if (el) el.textContent = Math.round(P.total * k); if (k >= 1) clearInterval(tm); else if (Math.random() < 0.3) sfx('tic'); }, 40);
  const name = await new Promise((res) => { document.querySelectorAll('.scwho button').forEach((b) => { b.onclick = (e) => { e.stopPropagation(); sfx('logro'); res(b.dataset.n); }; }); });
  clearInterval(tm);
  const d = new Date(), entry = { name, pts: P.total, rango: r.replace('CABALLERO ', '') + (S.cap && S.cap !== 'cena' ? ' (capítulo)' : ''), fecha: d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear() };
  const list = loadScores(); list.push(entry); list.sort((x, y) => y.pts - x.pts);
  saveScores(list);
  await verMarcador(list.indexOf(entry), 'Ver créditos');
  await creditos();
}

/* ---------------- CRÉDITOS ---------------- */
async function creditos() {
  // créditos de película, con todo el morro
  const lines = [
    ['s', 'Club de Caballeros Films'], ['', 'en asociación con el Bar Estrella y la Diputación del Orujo'], ['s', 'presenta'], ['', ''],
    ['t', 'PONTEVEDRA QUEST'], ['', 'Basado en hechos reales. Más o menos.'], ['', ''],
    ['h', 'Dirigida por'], ['', 'JRAR'], ['', ''],
    ['h', 'Guion'], ['', 'JRAR y la memoria selectiva del Club'], ['', ''],
    ['h', 'Reparto, por orden de borrachera'], ['', 'Ramis · Marc · Ángel'], ['', 'y Marcos (al volante, casi sereno)'], ['', ''],
    ['h', 'Con la participación especial de'], ['', 'Doña Maruxa y su táper infinito'], ['', 'La chica del pub (1 minuto en pantalla)'], ['', 'Don Xesús de Santo Domingo, fantasma ilustrado'],
    ['', 'A meiga Pura'], ['', 'Brais, el camarero que guarda llaves'], ['', 'Las profes de Vigo: Uxía, Noa y Sabela'], ['', 'Rubén, el portero que pide el DNI'], ['', 'DJ Raxo y su tema especial para los Lords'],
    ['', 'Antía, la camarera que no oye nada'], ['', 'Lúa, de Bellas Artes'], ['', 'Gary, de Mánchester, en chanclas'], ['', 'Tino y Vera, de O Furado'], ['', 'Xurxo y Nando, los de la peña'],
    ['', 'Iago, fan número uno de Nike Apóstol'], ['', 'Toño, el peregrino perdido'], ['', 'Carla (@carlaviral), que lo grabó todo'], ['', 'La Guardia Civil de la N-550'], ['', 'La Santa Compaña'], ['', 'La vaca de Ramiro'], ['', ''],
    ['h', 'Dirección de fotografía'], ['', 'Marc («la luz está fatal»)'], ['', ''],
    ['h', 'Coordinación de intimidad'], ['', 'Nadie. No dio tiempo: fue un minuto.'], ['', ''],
    ['h', 'Especialista en escenas de riesgo'], ['', 'Los calzoncillos de rayas de Ramis'], ['', ''],
    ['h', 'Asesor técnico de Porsche'], ['', 'Ramis (no ha tenido ninguno)'], ['', ''],
    ['h', 'Conductor designado'], ['', 'Marcos, el Señor de los Volantes'], ['', ''],
    ['h', 'Catering'], ['', 'Doña Maruxa · Postres caseros desde siempre'], ['', ''],
    ['h', 'Efectos especiales'], ['', 'Las meigas (haberlas, haylas)'], ['', ''],
    ['h', 'Vestuario'], ['', 'Marcos, diseñador de moda'], ['', '(la camisa de cuadros de Ángel no es culpa suya)'], ['', ''],
    ['h', 'Maquillaje y peluquería'], ['', 'El orballo'], ['', ''],
    ['h', 'Departamento legal'], ['', 'Sargento Seoane'], ['', ''],
    ['h', 'Canción de la Lume y de los créditos'], ['', '«Cuatro amigos fueron de viaje…»'], ['', 'machineplastic'], ['', ''],
    ['h', 'Banda sonora original'], ['', 'DJ Raxo · Ángel y los de O Furado'], ['', 'Gaita, bombo y licor café'], ['', ''],
    ['h', 'Idea, historia e ilustraciones'], ['', 'JRAR'], ['', ''],
    ['h', 'Programación, música y sonido'], ['', 'Claude'], ['', ''],
    ['h', 'Rodada íntegramente en'], ['', 'Pontevedra, Caldas de Reis y un poco en Coruña'], ['', ''],
    ['h', 'Dedicada a'], ['', 'Chus, que lo llamaba todo «¡lupanar!»'], ['', 'Maje, que nunca lo supo'], ['', 'Noémia, Breogán y Rosalía, por prestarnos a Marcos un fin de semana'], ['', 'El instituto Josep Maria Llompart, Mallorca'], ['', ''],
    ['', 'Ningún pulpo fue maltratado. Bueno, uno sí, y estaba buenísimo.'], ['', 'Las flores del Estrella se recuperan favorablemente.'],
    ['', 'Ningún Porsche participó en esta producción.'], ['', 'Ningún caballero fue multado. Por los pelos.'], ['', 'Si bebes, no conduzcas. Marcos no bebió… casi.'], ['', ''],
    ['s', 'Nunca más… ¡hasta el sábado!'], ['', ''], ['', '(no os vayáis, que hay escena post-créditos)'],
  ];
  const m = { drunk: 0, y: H + 40, t: 0 };
  const parade = [...PROTA, 'senora', 'noa', 'chica', 'fantasma', 'guiri', 'camarero', 'vera', 'meiga', 'tino', 'gc1', 'gc2', 'peregrino', 'gente', 'carla', 'recep'];
  let endY = 0;
  await new Promise((res) => {
    m.update = (dt) => { m.t += dt; m.y -= dt * 78; if (m.y + endY < 200) { m.done2 = (m.done2 || 0) + dt; if (m.done2 > 3) res(); } };
    m.down = () => { m.y -= 200; };
    m.draw = (c, t) => {
      c.fillStyle = PROC.lin(c, 0, 0, 0, H, [[0, '#05060f'], [1, '#141a3a']]); c.fillRect(0, 0, W, H);
      const im = G.img['bg/titulo']; if (im) { c.globalAlpha = 0.14; c.drawImage(im, 0, 0, W, H); c.globalAlpha = 1; }
      c.save(); c.beginPath(); c.rect(0, 0, W, 730); c.clip();
      c.textAlign = 'center'; let y = m.y;
      for (const [k, txt] of lines) {
        if (k === 't') { c.font = "800 84px 'Cinzel'"; c.fillStyle = '#ffd98a'; y += 90; }
        else if (k === 's') { c.font = "44px 'Patrick Hand'"; c.fillStyle = '#ffe9c0'; y += 60; }
        else if (k === 'h') { c.font = "800 30px 'Cinzel'"; c.fillStyle = '#e8b85a'; y += 56; }
        else { c.font = "600 36px 'Nunito'"; c.fillStyle = '#fff6e0'; y += 50; }
        if (y > -100 && y < H + 100) c.fillText(txt, W / 2, y);
      }
      endY = y - m.y;
      c.restore();
      const fg = c.createLinearGradient(0, 600, 0, 740); fg.addColorStop(0, 'rgba(5,6,15,0)'); fg.addColorStop(1, 'rgba(5,6,15,1)'); c.fillStyle = fg; c.fillRect(0, 600, W, 140);
      c.fillStyle = '#05060f'; c.fillRect(0, 740, W, 260);
      // desfile de personajes
      parade.forEach((id, i) => {
        const x = ((t * 90 + i * 190) % (parade.length * 190)) - 150;
        const isP = PROTA.includes(id); const src = isP ? 'chars/' + id + '_lado' : 'chars/' + id;
        MG.drawImgH(c, src, x, 990 - Math.abs(Math.sin(t * 6 + i)) * 10, isP ? 250 : 235, { flip: false, alpha: id === 'fantasma' ? 0.7 : 1 });
      });
    };
    G.mode = m; $('hud').classList.add('hidden');
  });
  if (typeof postCreditos === 'function') { await fadeTo(1, 0.8); await postCreditos(); }
  G.mode = null;
  await fadeTo(1, 1);
  showTitle();
}
