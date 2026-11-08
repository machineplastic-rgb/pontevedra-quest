'use strict';
/* =====================================================================
   v18-v21 · La cola del baño (O Furado y la Lume)
   El que juegas está a reventar y delante hay una cola de gente del
   antro. Para colarse hay que convencer a cada uno con lo que le va: a
   Tino, algo punk; a Xurxo, un brindis; a Nando, un chiste malo…
   La barrita «me meo» no para de subir y cada metedura de pata la sube
   más. Si llegas a la puerta: logro y se te baja un poco la borrachera.
   Si se llena: plan B en el callejón.
   Fondos: los pasillos dibujados por JRAR (img/bg/banos.webp en O Furado,
   img/bg/banos_lume.webp en la Lume); la cola va en perspectiva, de tu
   personaje (delante) a la puerta. Con «Salir» se deja la cola sin más.
   ===================================================================== */
LOGROS.cola = { i: '🚽', t: 'Me colé en la cola del baño' };
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
    { x: 'Aquí mando yo. Y yo digo que esperas.', ok: 'Vera, mi amigo Marc te quiere dibujar otra vez. Dice que eres su musa.', mal: ['¿Y quién te ha nombrado la jefa?', '¿Me lo dices o me lo cuentas?'], si: '¿Su musa? Bueeeeno… pasa, que voy a buscarle, igual hasta le hago un favor....', no: 'Me nombré yo con estas dos. Hasta el fondo y de golpe.' },
    { x: '¿Ves estas botas militares? Han pisado a gente más alta que tú y me han pagado por ello.', ok: 'Por eso me cuelo con cuidado, Vera: de puntillas y con respeto.', mal: ['¿Son de rebajas?', 'Yo calzo un cuarenta y cinco.'], si: '¡Ja! Me gusta la gente que sabe dónde la mete. Pasa.', no: 'Y yo te piso igual. Al fondo.' },
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
// la gente de la Lume
Object.assign(COLA, {
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
  rosa: [
    { x: 'Rey, aquí la reina va primero. Protocolo.', ok: 'Majestad, una reina no hace cola: se la hacen a ella. Yo le abro paso.', mal: ['Yo soy el rey de esta cola.', '¿Y si lo echamos a piedra, papel o tijera?'], si: '¡Uy, qué bien hablas! Pasa, súbdito, pasa.', no: '¿Rey tú? Con ese peinado, como mucho bufón. Atrás.' },
    { x: 'Este top vale más que vuestro Peugeot. Y no lo pienso arrugar.', ok: 'Dalia, ese top no se arruga: se admira. Desde lejos. Y desde delante de la cola.', mal: ['Mi Peugeot tiene siete plazas.', 'Pues yo voy en jersey y no me quejo.'], si: '¡Me encanta! Pasa, que te lo has ganado.', no: 'Siete plazas y cero glamour. Al fondo.' },
  ],
  monos: [
    { x: '¡Vale, vale, vale! Si quieres pasar, me tienes que hacer reír.', ok: 'Una monja, un pulpo y Ramis entran en la Lume…', mal: ['Es que no sé chistes.', '¿Conoces el del Peugeot?'], si: '¡Jajaja! No sé cómo acaba, pero pasa.', no: '¿El del Peugeot? Me lo contó tu amigo. Tres veces. Atrás.' },
    { x: 'Aquí se paga peaje, guapo: un baile.', ok: '(Te marcas un Paquito el Chocolatero apretando las piernas.)', mal: ['Yo no bailo, que me meo.', '¿Acepta tarjeta?'], si: '¡Eso es arte! ¡Pasa, artista!', no: 'Sin baile no hay baño. Al fondo.' },
  ],
});
// cada discoteca: su pasillo, su gente, su cola en perspectiva y su luz
const BANOS = {
  furado: {
    bg: 'banos', gente: ['tino', 'xurxo', 'nando', 'vera', 'carla'], tarde: ['rockera', 'gotica', 'bicolor'],
    cola: (f) => ({ x: 700 + 600 * f, y: 695 + 300 * f, h: 300 + 320 * f }),   // junto a las cintas
    luz: ['255,40,120', '120,50,255', '255,60,60'], velo: ['#a03cff', '#ff2a6a', '#7a3cff'],
    puerta: '¿El de chicas? A estas horas, todos los baños son mixtos.',
    entrada: 'Al fondo de O Furado, un pasillo lleno de carteles punk y un neón que parpadea: «WC →». Delante, una cola con cintas, como en el aeropuerto.',
    planB: 'Plan B: el callejón de detrás de O Furado. Un gato os mira con un desprecio que no se os va a olvidar.',
  },
  lume: {
    bg: 'banos_lume', gente: ['guiri', 'noa', 'uxia', 'sabela', 'lua'], tarde: ['rosa', 'monos'],
    cola: (f) => ({ x: 750 + 380 * f, y: 685 + 310 * f, h: 300 + 320 * f }),   // hacia la puerta de caballeros
    luz: ['150,80,255', '60,90,255', '255,190,110'], velo: ['#7a3cff', '#3c5aff', '#a03cff'],
    puerta: '¡El de caballeros! Por fin una puerta hecha para el Club.',
    entrada: 'Al fondo de la Lume, un pasillo de mármol negro con dos palmeras y dos puertas. Delante, una cola de gente bien vestida… y con prisa.',
    planB: 'Plan B: la parte de atrás de los soportales. Un gato os mira con un desprecio que no se os va a olvidar.',
  },
};
const COLA_PROTA = {
  ramis: ['¡Bajo el yugo opresor… de la vejiga!', 'Habiendo haber podido aguantar… no puedo.'],
  marc: ['Me meo más que en un dibujo de Manara.', 'Esto no lo dibujo. Esto lo sufro.'],
  marcos: ['Tres litros de agua, que conduzco. TRES LITROS.', 'Tirada de salvación contra la vejiga… fallada.'],
  angel: ['Mi chakra de abajo está a punto de rebosar.', 'Respira, Ángel. Busca tu centro. Tu centro está lleno.'],
};

MG.banos = function (sitio) {
  const B = BANOS[sitio] || BANOS.furado;
  const m = { drunk: 0, name: 'banos' };
  const drawImgH = MG.drawImgH;
  const VMAX = 75;
  let clock = 0, vej = 0.3, lleno = false, fallos = 0, ganado = false, fuera = false, papelUsado = false;
  let xBub = null, mBub = null, big = null, asking = false, keyPick = null, timeoutPick = null;
  const waits = [];
  const sleep = (s) => new Promise((r) => waits.push({ at: clock + s, r }));
  const mix = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const top = MG.bar('');
  // la gente del sitio (los de la madrugada, solo si ya es tarde)
  const pool = B.gente.concat(typeof nocheFase === 'function' && nocheFase() >= 1 ? B.tarde : []);
  const delante = mix(pool).slice(0, 5).map((id) => ({ id, k: (Math.random() * 2) | 0 }));
  const yo = { id: S.active, yo: true };
  let detras = [];
  // la cola en perspectiva: f=0 junto a la puerta, f=1 delante del todo
  const enCola = B.cola;
  const N = 5;
  function colocar(inst) {
    const fila = delante.concat([yo]);
    fila.forEach((p, i) => { const q = p.salida ? enCola(0) : enCola(Math.pow(i / N, 1.35)); p.tx = q.x; p.ty = q.y; p.th = q.h; });
    detras.forEach((p, j) => { p.tx = 470 - j * 150; p.ty = 1070; p.th = 640; });
    if (inst) for (const p of fila.concat(detras)) { p.x = p.tx; p.y = p.ty; p.h = p.th; p.a = 1; }
  }
  colocar(true);
  // «Salir»: dejas la cola y te vuelves a la pista, sin más
  MG.btn('🚪 Salir de la cola', 150, 22, '', () => {
    if (fuera || ganado || lleno) return;
    fuera = true; sfx('close'); m.end({ win: false, salir: true, fallos });
  });
  function updTop() {
    const k = Math.min(1, vej), col = k < 0.6 ? '#7fd3ff' : k < 0.85 ? '#ffd94a' : '#ff6a5a';
    top.innerHTML = `💧 Me meo <span style="display:inline-block;width:320px;height:18px;margin:0 10px;border:2px solid #fff6e0;border-radius:10px;vertical-align:middle;overflow:hidden"><i style="display:block;height:100%;width:${Math.round(k * 100)}%;background:${col}"></i></span> · faltan ${delante.length}`;
  }
  function ask(v) {
    return new Promise((res) => {
      const list = mix([{ t: v.ok, k: 'ok' }].concat(v.mal.map((t) => ({ t, k: 'mal' }))));
      if (has('papel') && !papelUsado) list.push({ t: '🧻 «¿Un poco de papel higiénico? Es tuyo si me dejas pasar.»', k: 'papel' });
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
      if (o.k === 'ok' || o.k === 'papel') {
        if (o.k === 'papel') papelUsado = true;
        xBub = { t: o.k === 'papel' ? '¿PAPEL? ¡Eres mi héroe! Pasa, pasa, pasa.' : v.si, t0: clock, who: p.id }; sfx('pop');
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
      mBub = { t: B.puerta, t0: clock }; await sleep(2.2); mBub = null;
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

  m.key = (k, d) => { if (d && keyPick && ['1', '2', '3', '4'].includes(k)) keyPick(+k - 1); };
  m.down = () => {};
  m.update = (dt) => {
    clock += dt;
    for (let i = waits.length - 1; i >= 0; i--) if (clock >= waits[i].at) waits.splice(i, 1)[0].r();
    if (fuera) return;
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
    g.addColorStop(0, 'rgba(' + B.luz[0] + ',' + (0.22 * (1 - f) + 0.06).toFixed(3) + ')'); g.addColorStop(1, 'rgba(' + B.luz[1] + ',' + (0.16 + 0.08 * f).toFixed(3) + ')');
    tx.fillStyle = g; tx.fillRect(0, 0, w, hh);
    // reflejo de la lámpara roja (a la izquierda) en el lado que da a ella
    const r = tx.createLinearGradient(0, 0, w, 0); r.addColorStop(0, 'rgba(' + B.luz[2] + ',' + (0.18 * f).toFixed(3) + ')'); r.addColorStop(0.5, 'rgba(' + B.luz[2] + ',0)');
    tx.fillStyle = r; tx.fillRect(0, 0, w, hh);
    tx.globalCompositeOperation = 'source-over';
    c.drawImage(tmp, 0, 0, w, hh, x - w / 2, y - hh, w, hh);
  }
  m.draw = (c, t) => {
    if (G.img['bg/' + B.bg]) c.drawImage(G.img['bg/' + B.bg], 0, 0, W, H);
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
    const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, B.velo[0]); g.addColorStop(0.5, B.velo[1]); g.addColorStop(1, B.velo[2]); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.restore();
    if (xBub) bocadillo(c, xBub, 'r', 40, 'rgba(36,14,52,.94)', '#ff9ae6', 'faces/' + xBub.who + '_normal', NAMES[xBub.who]);
    if (mBub) bocadillo(c, mBub, 'l', 600, 'rgba(14,26,52,.94)', '#ffd98a', 'faces/' + S.active + '_normal');
    if (big) { const k = clamp((clock - big.t0) * 4, 0, 1), s = 1.6 - 0.6 * k; c.save(); c.globalAlpha = k; c.translate(W / 2, 300); c.scale(s, s); c.translate(-W / 2, -300); MG.bigText(c, big.t, 330, big.c, 110); c.restore(); }
  };
  const p = MG.begin(m);
  if (!TEST) run();
  return p;
};

/* ---------- el pasillo de los baños (O Furado o la Lume) ---------- */
async function banoCola(sitio) {
  const B = BANOS[sitio];
  if (!flag('colaVista_' + sitio)) { flag('colaVista_' + sitio, 1); await narr(B.entrada); }
  await say(S.active, pick(COLA_PROTA[S.active] || ['¡Me meo!']), 'sorpresa');
  const r = await MG.banos(sitio);
  if (r && r.salir) { await say(S.active, pick(['Mejor me aguanto. Un caballero sabe esperar.', 'Bah, ya iré luego. O en Caldas.', 'Demasiada cola. Me guardo la dignidad… y lo demás.'])); return; }
  const win = r === undefined || r === true || !!(r && r.win);
  if (win) {
    await narr('Unos minutos después, la puerta se abre y sale un caballero nuevo. Más ligero. Más sabio. Con las manos sin secar.' + (has('papel') ? ' Y gracias al rollo de Brais, sin dramas.' : ' No había papel. Marc ha sacrificado tres bocetos.'));
    if (S.drunk[S.active] > 0) { drink(S.active, -1); await say(S.active, 'Uf. Como nuevo. Hasta se me ha bajado un poco el pedo.', 'risa'); }
    else await say(S.active, 'Uf. Esto sí que es vivir.', 'risa');
    logro('cola');
  } else {
    await narr(B.planB);
    await say('ramis', 'Bajo el yugo opresor… y bajo la mirada de un gato.', 'risa');
  }
}
const banoFurado = () => banoCola('furado');

// la zona del baño y su neón en cada discoteca
function wcNeon(sc, x, y, color, glow) {
  const antes = sc.drawTop;
  sc.drawTop = function (c, t) {
    if (antes) antes.call(this, c, t);
    const fl = 0.85 + 0.15 * Math.sin(t * 13) * (Math.sin(t * 0.7) > 0.93 ? 1 : 0.1);
    c.save(); c.globalAlpha = fl; c.font = "800 40px 'Cinzel', serif"; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = glow; c.shadowBlur = 24; c.fillStyle = color; c.fillText('WC ➜', x, y); c.restore();
  };
}
if (typeof SCENES !== 'undefined' && SCENES.antro) {
  SCENES.antro.hs.push({ name: 'Baños', r: [700, 300, 140, 380], verbs: {
    'Entrar|Ir al baño': () => banoCola('furado'),
    'Mirar': () => say(S.active, 'Un pasillo con carteles punk y un neón: «WC». La cola llega hasta el escenario. Mala señal.'),
  } });
  wcNeon(SCENES.antro, 770, 285, '#ffd0dc', '#ff2a6a');
}
if (typeof SCENES !== 'undefined' && SCENES.disco) {
  SCENES.disco.hs.push({ name: 'Baños', r: [1375, 160, 140, 330], verbs: {
    'Entrar|Ir al baño': () => banoCola('lume'),
    'Mirar': () => say(S.active, 'Un pasillo de mármol negro con dos palmeras y un neón: «WC». Hay cola. Mucha cola.'),
  } });
  wcNeon(SCENES.disco, 1445, 215, '#ffd0f4', '#ff5ad2');
}
