'use strict';
/* =====================================================================
   LA MOVIDA (v5)
   La gente de la noche (algunos os siguen de sitio en sitio), la
   discoteca Lume, el antro O Furado, el concierto de Ángel, la intro
   con la viñeta y la escena post-créditos.
   ===================================================================== */

/* ---------------- quién es quién ---------------- */
const CROWD = {
  uxia: { mirar: 'Uxía, profe de Matemáticas en Vigo: melena hasta la cintura, pantalón cargo y cara de «a ver qué hacéis, caballeros».', talk: () => vigoTalk('uxia') },
  noa: { mirar: 'Noa, profe de Educación Física en Vigo: moño rubio, guiño fácil y un peligro que se ve desde la otra punta de la plaza.', talk: () => vigoTalk('noa') },
  sabela: { mirar: 'Sabela, profe de Plástica en Vigo: falda de cuadros, calentadores y una risa que se oye por encima de cualquier música.', talk: () => vigoTalk('sabela') },
  xurxo: { mirar: 'Xurxo, de la peña: lleva el vaso en alto desde hace tres horas. No se sabe si brinda o pide un taxi.', talk: () => penaTalk('xurxo') },
  nando: { mirar: 'Nando, de la peña: se ríe de todo. De todo. Incluso de esto.', talk: () => penaTalk('nando') },
  dj: { mirar: 'DJ Raxo: gafas de sol de noche, camisa abierta y el dedo siempre arriba. Dice que esta noche tiene guardado algo especial.', talk: () => djTalk() },
  vera: { mirar: 'Vera: rubio platino, botas militares y medias de rejilla. Manda en O Furado y lo sabe todo el mundo.', talk: () => veraTalk() },
  iago: { mirar: 'Un chaval con sudadera y cascos. Lleva un rato mirando a Marcos como quien ve a una estrella de rock.', talk: () => iagoTalk() },
  peregrino: { mirar: 'Un peregrino con mochila, gafas y cara de llevar tres días buscando una flecha amarilla.', talk: () => peregrinoTalk() },
  antia: { mirar: 'Antía, la camarera de la Lume. Brazos cruzados, moño y cara de no haber oído una palabra en toda la noche.', talk: () => antiaTalk() },
  guiri: { mirar: 'Gary, de Mánchester. Camisa hawaiana, pantalón corto y chanclas. En Galicia. De noche. Con orballo.', talk: () => garyTalk() },
  lua: { mirar: 'Lúa: melena castaña y una bolsa de tela llena de cuadernos. Estudia Bellas Artes. Marc ya se ha fijado.', talk: () => luaTalk() },
  portero: { mirar: 'Rubén, el portero de la Lume. Brazos cruzados, camiseta negra… y cara de tener menos años que Marcos.', talk: () => porteroTalk() },
  tino: { mirar: 'Tino, el dueño de O Furado. Barba gris, tatuajes, calavera en la camiseta y una cerveza que ya forma parte de su mano.', talk: () => tinoTalk() },
  carla: { mirar: 'Carla (@carlaviral). Lo graba todo. Todo. Ahora mismo te está grabando a ti mirándola.', talk: () => carlaTalk() },
};
function crowdDef(id) {
  const c = CROWD[id]; if (!c) return null;
  const d = { name: NAMES[id], 'Hablar': c.talk, 'Mirar': () => say(S.active, c.mirar) };
  if (id === 'dj') d['Bailar|Salir a la pista'] = () => bailar();
  if (id === 'antia') d['Pedir|Pedir una ronda'] = () => antiaPedir();
  return d;
}
// lo que dicen en voz alta mientras paseáis
function crowdIdle(id) {
  const f = S.flags, sc = S.scene, loud = sc === 'disco' || sc === 'antro';
  const L = {
    uxia: ['Marc es un ligón, se le nota en la chaqueta.', '¿Esos son los caballeros?', loud ? '¡ESTA CANCIÓN ES MÍA!' : '¿Vamos a la Lume o qué?'],
    noa: ['Ramis, yo te pillaría y…', '¡Uuuuh!', '¿Habéis visto al del jersey blanco?'],
    sabela: ['El de las gafas parece muy joven, ¿no?', '¡Jajaja!', loud ? '¿¡QUÉ!?' : 'Hace frío para ir en falda.'],
    xurxo: ['¡CABALLEROS!', '¡Otra ronda!', '¡Oi! ¡Oi! ¡Oi!'],
    nando: ['Jajajaja.', 'Jajaja… ¿de qué nos reímos?', '¡Esa es buena!'],
    dj: ['¡MANOS ARRIBA, PONTEVEDRA!', '¡ESTA VA POR LOS LORDS!', '¡SUBE ESE BOMBO!'],
    vera: ['Esta noche mando yo.', f.concierto ? '¡Qué papá más cañero!' : 'A ver si sube alguien al escenario…', 'Bonitas botas, ¿eh? Lo sé.'],
    iago: ['¿Ese es Nike Apóstol?', 'Esto lo cuento en el foro.', '¡El Señor!'],
    peregrino: ['¿Por dónde se va a Santiago?', 'Buen Camino…', 'Me duelen hasta las pestañas.'],
    antia: ['¿¡QUÉ!?', '¡HABLA MÁS ALTO!', 'Ni una propina en toda la noche.'],
    guiri: ['Paella? Sangría?', 'Lovely weather… not!', 'CHEERS, LADS!'],
    lua: ['Me encanta dibujar a la gente.', 'Esa luz morada es preciosa.', '¿El de la chaqueta marrón es pintor?'],
    portero: ['Hoy no, amigo.', 'DNI en mano, por favor.', 'Ese de las gafas… sospechoso.'],
    tino: ['Aquí ha tocado lo mejor del punk gallego.', '¿Alguien canta? ¿Nadie?', 'La cerveza, fría. Las normas, ninguna.'],
    carla: ['¡Hola, mis viralitos!', 'Esto va directo a TikTok.', '¿Me lo repetís? No estaba grabando.'],
  };
  return L[id] || [];
}

/* ---------------- dónde está cada uno ---------------- */
function addCrowd(sceneId, list) { const sc = SCENES[sceneId]; sc.npcs = (sc.npcs || []).concat(list); }
// la plaza: el peregrino y el friki a la izquierda, las de Vigo a la derecha
addCrowd('plaza', [
  { id: 'peregrino', x: 320, y: 820, k: 0.3, cond: () => !flag('peregrinoOk') },
  { id: 'iago', x: 415, y: 835, k: 0.31 },
  { id: 'uxia', x: 1265, y: 845, k: 0.33, flip: true }, { id: 'noa', x: 1340, y: 850, k: 0.33, flip: true }, { id: 'sabela', x: 1415, y: 842, k: 0.33 },
]);
addCrowd('calle', [
  { id: 'portero', x: 1478, y: 795, k: 0.23, flip: true },
  { id: 'carla', x: 1310, y: 790, k: 0.24, flip: true },
]);
addCrowd('bareto', [{ id: 'guiri', x: 1250, y: 975, k: 0.57, flip: true }]);
addCrowd('alameda', [
  { id: 'uxia', x: 245, y: 860, k: 0.36 }, { id: 'noa', x: 322, y: 866, k: 0.36, flip: true }, { id: 'sabela', x: 400, y: 858, k: 0.36 },
]);

/* ---------------- pistas extra (opcionales) ---------------- */
function extraStep(id) {
  const f = S.flags;
  if (!f.postresComidos) return null;
  if (S.scene === 'plaza' && !f.vigo1) return 'Esas tres chicas de la plaza no paran de mirarnos. Marc, a lo tuyo.';
  if (S.scene === 'plaza' && !f.peregrinoOk) return 'Ese peregrino de la mochila está más perdido que Ramis en un concesionario de Porsche. Habría que ayudarle.';
  if (S.scene === 'plaza' && !f.apostol) return 'El chaval de la sudadera mira a Marcos como si fuera famoso. Que hable Marcos con él.';
  if (!S.seen.disco) return 'En los soportales hay una discoteca, la Lume. Dicen que el portero es duro de pelar.';
  if (!S.seen.antro) return 'En la plaza hay un antro punk, O Furado. Ángel, ¿tú no eras cantante?';
  if (!f.concierto) return id === 'angel' ? 'Tino, el de O Furado, busca cantante… y yo tengo la voz caliente.' : 'Tino, el de O Furado, busca cantante. Que hable Ángel con él.';
  if (!f.pista) return 'En la Lume todavía no hemos pisado la pista. Un caballero baila.';
  if (!f.noaOk) return 'Noa no terminó la frase: «Ramis, yo te pillaría y…». Que vaya Ramis a la Lume a enterarse.';
  if (!f.luaOk) return 'En la Lume hay una chica de Bellas Artes. Marc, saca el lápiz.';
  return null;
}

/* =====================================================================
   LAS DE VIGO: Uxía, Noa y Sabela (plaza → Lume → Alameda)
   ===================================================================== */
async function vigoTalk(id) {
  const f = S.flags, sc = S.scene;
  if (sc === 'disco') return vigoDisco(id);
  if (sc === 'alameda') {
    if (id === 'uxia') return say('uxia', '¿También venís a ver a la meiga? Dice que la suerte de un hombre va en los calzoncillos.', 'risa');
    if (id === 'noa') return say('noa', f.meigaCalzon ? 'Ramis… ¿es verdad lo de los calzoncillos? Eres una leyenda.' : 'La meiga busca un caballero valiente. Yo ya sé quién es… el del jersey blanco.', 'risa');
    return say('sabela', 'Al lado de esa señora hasta el móvil se queda sin cobertura. Y eso que es Vodafone.');
  }
  if (!f.vigo1) return vigoPlaza();
  if (id === 'noa') return say('noa', 'Lo que te tenía que decir, Ramis, te lo digo en la Lume. Aquí hay mucha gente.', 'risa');
  if (id === 'uxia') return say('uxia', 'Marc, ¿vienes a la Lume o te da miedo el portero?');
  return say('sabela', 'A ver si al de las gafas le dejan entrar en la Lume. Jajaja.', 'risa');
}
async function vigoPlaza() {
  await say('noa', '¡Chicas, mirad! Cuatro señores con pinta de despedida de soltero.', 'risa');
  await say('ramis', 'Despedida no, señorita: Club de Caballeros. Es muy distinto.');
  await say('uxia', '¿Y qué hace un club de caballeros un sábado por Pontevedra?');
  await say('marc', 'Cenar, beber… y lo que surja.');
  await say('sabela', 'Nosotras somos profes, de Vigo. Hoy sin alumnos y sin exámenes que corregir.', 'risa');
  await say('angel', '¿Profesoras? …Maje…', 'sorpresa');
  await say('marc', 'Caballeros, esto es como volver al Llompart. Pero mejor.');
  await say('uxia', 'El de la chaqueta marrón es un ligón. Se le nota en el guiño.', 'risa');
  await say('marc', 'Me llamo Marc. Y el guiño viene de serie.');
  await say('uxia', 'Pues Marc es un ligón. Apuntado.', 'risa');
  await say('sabela', '¿Y el de las gafas? ¿Lo habéis traído de excursión? Parece muy joven.');
  await say('marcos', 'Es la genética. Y que conduzco yo, y el alcohol envejece.', 'sorpresa');
  await say('noa', 'Y tú… el del jersey blanco… yo te pillaría y…');
  sfx('motor'); shake(0.2);
  await narr('Justo en ese momento pasa una moto a todo gas y no se oye el final de la frase.');
  await say('ramis', '¿Y qué? ¿¡Y QUÉ!?', 'sorpresa');
  await say('noa', 'Nada, nada… ya te lo diré.', 'risa');
  await say('sabela', 'Nos vamos a la Lume, la disco de los soportales. Si sois caballeros de verdad, nos vemos allí.');
  flag('vigo1', 1); updObj();
}
async function vigoDisco(id) {
  const f = S.flags, a = S.active;
  if (!f.vigo1) {
    flag('vigo1', 1);
    await say('noa', '¡HOLA, CABALLEROS! ¡SOMOS DE VIGO!', 'risa');
    await say('ramis', '¿¡DE BIGOTE!?', 'sorpresa');
    await say('noa', '¡DE VIGO! ¡VI-GO! ¡Y SOMOS PROFES!');
    await say('ramis', '¿¡PROFETAS!? ¡Ay, Chus, si nos vieras!', 'risa');
    await say('uxia', '¡Y EL DE LA CHAQUETA ES UN LIGÓN, SE VE DESDE LA BARRA!', 'risa');
  }
  if (id === 'noa') {
    if (a !== 'ramis') return say('noa', '¿¡QUÉ!? ¡NO TE OIGO! ¡QUE VENGA RAMIS, QUE TENGO UNA COSA PENDIENTE CON ÉL!', 'risa');
    if (f.noaOk) return say('noa', 'Ramis, cuando quieras te enseño Vigo. Tenemos un puerto precioso. Y yo.', 'risa');
    await say('noa', '¡RAMIS! ¡LO QUE TE IBA A DECIR EN LA PLAZA! ¡YO TE PILLARÍA Y…!');
    await narr('DJ Raxo sube el volumen justo en ese momento. BUM. BUM. BUM.');
    await say('ramis', '¿¡Y QUÉ!? ¡¿Y QUÉÉÉ?!', 'sorpresa');
    sfx('error');
    await narr('Y entonces, de golpe, la música se corta. Silencio absoluto. Toda la Lume oye el final de la frase.');
    await say('noa', '…¡Y TE HARÍA COSAS QUE NO SALEN NI EN LOS DIBUJOS DE TU AMIGO!');
    await narr('Trescientas personas mirando a Ramis. Tres segundos eternos. La música vuelve.');
    await say('ramis', 'Habiendo haber podido… no quise poder.', 'sorpresa');
    await say('marc', 'Ramis, eso es lo más bonito que te han dicho en tu vida. Y yo dibujo cosas muy fuertes.', 'risa');
    groupLaugh(); flag('noaOk', 1); logro('pillaria');
    return;
  }
  if (id === 'uxia') {
    if (a === 'ramis' && !f.porche) {
      await say('ramis', '¡YO TENGO UN PORSCHE!');
      await say('uxia', '¿¡UN PORCHE!? ¡QUÉ MONO! ¿CON MACETAS Y BALANCÍN?', 'risa');
      await say('ramis', '¡PORSCHE! ¡EL COCHE! ¡NUEVE ONCE!');
      await say('uxia', '¿¡NUEVE ONCE!? ¿¡TIENES NUEVE PORCHES!? ¿¡ERES ARQUITECTO!?', 'sorpresa');
      await say('marcos', 'No tiene ninguno. Tiene un Peugeot prestado. El mío.');
      await say('uxia', '¡AH! ¡EL DEL PEUGEOT BLANCO! ¡ESE SÍ QUE TIENE PORCHE: SIETE PLAZAS!', 'risa');
      groupLaugh(); flag('porche', 1); logro('porche');
      return;
    }
    if (a === 'marc') return say('uxia', f.luaOk ? '¡MARC! ¡TE HEMOS VISTO CON LA DE BELLAS ARTES! ¡LIGÓN!' : '¡MARC, BAILA, QUE PARA ESO ERES UN LIGÓN!', 'risa');
    return say('uxia', pick(['¿¡QUÉ!? ¡QUE NO TE OIGO!', '¡ESTA CANCIÓN ES MÍA!', '¿¡HAS DICHO PULPO!?']));
  }
  // Sabela
  if (a === 'marcos') {
    await say('sabela', '¿¡TE HAN DEJADO ENTRAR!? ¿¡CON QUÉ!?', 'risa');
    await say('marcos', '¡CON EL CARNET DE CONDUCIR!');
    await say('sabela', '¿¡EL CARNET DE LA BIBLIOTECA!? ¡QUÉ MONO!', 'risa');
    await say('marcos', '…Bajo el yugo opresor.');
    await say('ramis', '¡Eh! ¡Esa frase es mía!', 'sorpresa');
    return;
  }
  if (a === 'angel') return say('sabela', f.concierto ? '¡ÁNGEL! ¡EL PAPÁ CAÑERO! ¡TE HE VISTO EN EL TIKTOK DE CARLA!' : '¿¡TÚ ERES EL QUE CANTA!? ¡DICEN QUE EN O FURADO BUSCAN CANTANTE!', 'risa');
  return say('sabela', pick(['¿¡QUÉ!? ¡JAJAJA!', '¡EL DE LAS GAFAS PARECE MUY JOVEN, EH!', '¡VAMOS A LA PISTA!']), 'risa');
}

/* =====================================================================
   CARLA (@carlaviral): os graba toda la noche
   ===================================================================== */
async function carlaTalk() {
  const f = S.flags;
  if (S.scene === 'antro') {
    if (f.concierto) return say('carla', '¡El vídeo de Ángel ya tiene cien mil visitas! «Papá cañero» es tendencia en toda Galicia.', 'risa');
    return say('carla', 'Dicen que el de la barba canta. Tengo el móvil al cien por cien. Por si acaso.');
  }
  if (!f.carla1) {
    sfx('foto'); flash('#ffffff', 0.4);
    await say('carla', '¡Hola, mis viralitos! Estoy en Pontevedra con… ¿cómo os llamáis?', 'risa');
    await say(S.active, 'El Club de Caballeros.');
    await say('carla', '¡EL CLUB DE CABALLEROS! Decid hola a mis ciento veinte mil seguidores.');
    await say('ramis', '¡Hola, mamá!', 'risa');
    await say('marc', 'Grábame por la izquierda, que es mi lado bueno.');
    await say('marcos', 'A mí no me grabes, que luego me reconocen en el foro.');
    await say('carla', 'Os sigo toda la noche. Esto es contenido del bueno.', 'risa');
    flag('carla1', 1);
    return;
  }
  sfx('foto');
  return say('carla', pick(['Un selfie con el Club. Sonreíd. Ramis, tú no, que da miedo.', 'Mis viralitos quieren saber si el de las gafas es mayor de edad.', 'Me han dicho que en O Furado buscan cantante. Yo voy a estar allí.']));
}

/* =====================================================================
   EL PEREGRINO: Toño, perdido en el Camino Portugués
   ===================================================================== */
async function peregrinoTalk() {
  const f = S.flags;
  if (S.scene === 'ruinas') {
    await say('peregrino', f.fantasmaVisto ? 'Ese señor transparente me ha sellado la credencial. Con vino. ¿Eso vale?' : 'Me he perdido otra vez. Una iglesia sin techo… ¿cuenta como albergue?');
  } else if (!f.peregrinoVisto) {
    flag('peregrinoVisto', 1);
    await say('peregrino', 'Buenas noches, caballeros… ¿por dónde se va a Santiago?');
    if (S.active === 'marcos') {
      await say('peregrino', 'Y tú, chaval, ¿haces el Camino con tus tíos?');
      await say('marcos', '¿¡Mis TÍOS!? ¡Que somos de la misma quinta!', 'sorpresa');
      await say('ramis', 'Bueno, bueno… quinta, quinta…', 'risa');
    }
  }
  const v = await choose([
    { t: '«Sigue las flechas amarillas: la próxima etapa es Caldas de Reis»', v: 'ok' },
    { t: '«Por la Alameda, a la izquierda del cruceiro»', v: 'mal' },
    { t: '«¿Santiago? ¿Eso no está en Chile?»', v: 'chile' },
  ], 'Toño espera una respuesta…');
  if (v === 'mal') return say('peregrino', '¿Del cruceiro? Ya van tres cruceiros esta noche, y en todos me dicen lo mismo…');
  if (v === 'chile') { await say('peregrino', 'Ese es otro Santiago. Andando me queda un poco lejos.'); return say('ramis', 'Al menos yo podré decir que he vivido. Y que he estado en Chile.'); }
  await say('peregrino', '¡Las flechas amarillas! ¡Eso me dijeron en Tui y se me olvidó! Caldas de Reis… ¡Gracias, caballeros! ¡Buen Camino!', 'risa');
  await say('marcos', 'Caldas de Reis… ¿no es donde vamos nosotros?');
  flag('peregrinoOk', 1);
  if (G.actors.peregrino) { await walk('peregrino', 1800, 1.6, { flip: false }); removeActor('peregrino'); }
}

/* =====================================================================
   IAGO: el fan de Nike Apóstol
   ===================================================================== */
async function iagoTalk() {
  if (flag('apostol')) return say('iago', pick(['¿Me firmas la sudadera, Señor?', 'En el foro no se lo van a creer. Te he hecho una foto de espaldas, para que no te reconozcan.']));
  if (S.active !== 'marcos') return say('iago', 'Perdona… ese de las gafas… ¿es Nike Apóstol? ¿El del foro de Warhammer? ¡Que hable él conmigo, porfa!');
  await say('iago', '¿T-tú eres Nike Apóstol? ¿El del foro de Warhammer?', 'sorpresa');
  await say('marcos', '…Puede ser.');
  await say('iago', '¡EL SEÑOR! ¡Tengo impresa tu guía para pintar marines! ¡La de los cuarenta pasos!');
  await say('marcos', 'Caballeros… tengo fans.', 'risa');
  await say('ramis', 'Un fan. Uno. No te vengas arriba.');
  await say('iago', 'Oye, ¿y tú cuántos años tienes? Escribes como un señor muy sabio, pero pareces de mi clase.');
  await say('marcos', 'Es el café. Me conserva.');
  logro('apostol'); flag('apostol', 1);
}

/* =====================================================================
   GARY, el guiri (bareto → Lume)
   ===================================================================== */
async function garyTalk() {
  const f = S.flags;
  if (S.scene === 'disco') {
    if (!f.gary2) {
      flag('gary2', 1);
      await say('guiri', 'WHERE ARE YOU FROM, LADS?', 'risa');
      await say('ramis', '¡DE MALLORCA!');
      await say('guiri', 'MAGALUF?! I LOVE MAGALUF!', 'risa');
      await say('ramis', 'Bajo el yugo opresor…');
      if (f.gaita) {
        await say('guiri', 'And this song… four friends on a trip… IS IT ABOUT YOU, LADS?');
        await say('ramis', '¡ES NUESTRA CANCIÓN! ¡LA DE LOS LORDS!', 'risa');
      }
      return;
    }
    return say('guiri', pick(['THIS IS THE BEST NIGHT OF MY LIFE!', 'Paella tomorrow! Tonight… DANCE!', 'Your friend with the beard… is he famous?']), 'risa');
  }
  // en el bareto
  if (!f.gary1) {
    flag('gary1', 1);
    await say('guiri', 'Excuse me! Paella? Sangría? ¡Olé!', 'risa');
    await say(S.active, 'Gary… esto es Galicia. Aquí pulpo, Albariño y muiñeira.');
    await say('guiri', 'Pulpo! Octopus! Like a paella with legs!', 'risa');
    await say('camarero', 'Lleva tres noches pidiéndome paella. Le pongo pulpo y se lo come igual.');
    await say('guiri', 'And last night I lost fifty euros playing cards in the ruins. With a very old man. Very pale. Very good at cards.');
    await say('marcos', 'Un señor muy pálido en las ruinas… ¿Lo habéis oído?', 'sorpresa');
    return;
  }
  if (f.sarcofago) {
    await say('ramis', 'Gary… creo que tus cincuenta euros los encontramos nosotros. Y ya nos los hemos gastado.');
    return say('guiri', 'No problem, mate! Easy come, easy go. CHEERS!', 'risa');
  }
  return say('guiri', pick(['Is it always raining here? Lovely!', 'Paella tomorrow. Today, octopus!', 'In Manchester we also have rain. But no octopus.']));
}

/* =====================================================================
   RUBÉN, el portero de la Lume
   ===================================================================== */
async function porteroCheck() {
  if (flag('porteroOk')) return true;
  await say('portero', 'Alto ahí, caballeros. Vosotros tres, pasad. Tú, el de las gafas: DNI.');
  await say('marcos', '¿Yo? ¿En serio?', 'sorpresa');
  await say('portero', 'Aquí no entran menores. Y tú tienes cara de examen de la ESO.');
  await say('ramis', 'Es mi sobrino. Viene conmigo.');
  await say('portero', '¿Tu sobrino? Pues entonces el DNI de los dos.');
  await narr('Marcos saca la cartera: el DNI, el carnet de conducir, la tarjeta del Gadis y una foto de carnet de cuando hizo la comunión.');
  await say('portero', '…Anda. Si eres mayor que yo.', 'sorpresa');
  await say('marcos', 'Bastante.');
  await say('portero', 'Perdona, jefe. Es que pareces muy joven. Bueno, tú. Ellos no.');
  await say('ramis', 'Al menos yo podré decir que he vivido. Se nota, ¿eh?');
  groupLaugh(); flag('porteroOk', 1); logro('joven');
  return true;
}
async function porteroTalk() {
  if (!flag('porteroOk')) return say('portero', 'Para entrar en la Lume, por la puerta. Y con DNI. Sobre todo tú, el de las gafas.');
  return say('portero', pick(['Pasad, caballeros. Y tú, chaval… digo, señor, pórtate bien.', 'Si veis a uno en chanclas, es inglés. Es inofensivo.']));
}

/* =====================================================================
   DISCOTECA LUME
   ===================================================================== */
SCENES.disco = {
  title: 'DISCOTECA LUME', sub: 'Soportales · la música a tope', bg: 'disco', ambient: 'disco', loud: true, bpm: 124,
  // si el DJ ya ha puesto la canción del Club, sigue sonando al volver
  get music() { return S && S.flags.gaita ? 'cancion' : 'disco'; },
  // la Lume es oscura: todos en penumbra morada
  tint: { c: '#5a3aff', a: 0.16, d: 0.38 }, k: 0.6,
  fxBack: [{ type: 'draw', fn: (c) => { c.fillStyle = 'rgba(6,0,22,0.32)'; c.fillRect(0, 0, W, H); } }],
  pos: { ramis: [280, 990], marc: [475, 995], marcos: [670, 990], angel: [865, 995] },
  npcs: [
    { id: 'dj', x: 1192, y: 585, k: 0.17, dance: true },
    { id: 'antia', x: 990, y: 680, k: 0.24 },
    { id: 'sabela', x: 1085, y: 735, k: 0.26, dance: true }, { id: 'uxia', x: 1300, y: 715, k: 0.25, dance: true }, { id: 'noa', x: 1385, y: 740, k: 0.27, dance: true, flip: true },
    { id: 'lua', x: 1225, y: 815, k: 0.3, flip: true },
    { id: 'guiri', x: 1505, y: 975, k: 0.44, dance: true, flip: true },
  ],
  fx: [
    { type: 'glow', x: 1117, y: 90, r: 200, color: '#c8a0ff', a: 0.3, flicker: 0.2 },
    { type: 'glow', x: 415, y: 205, r: 160, color: '#ffd28a', a: 0.3 }, { type: 'glow', x: 730, y: 262, r: 140, color: '#ffd28a', a: 0.28, seed: 3 },
    { type: 'neon', x: 1192, y: 430, w: 200, h: 290, color: '#6a4bff', a: 0.3, period: 5 },
    { type: 'draw', fn: (c, t) => discoLights(c, t, ['#8a5aff', '#3f7dff', '#c86bff'], 1117, 90) },
  ],
  hs: [
    { name: 'Pista de baile', r: [1095, 290, 195, 285], verbs: { 'Bailar|Salir a la pista': () => bailar(), 'Mirar': () => say(S.active, 'La pista de la Lume: humo, luces azules y DJ Raxo con el dedo arriba. Desde aquí se notan los graves en los dientes.') } },
    { name: 'Barra', r: [0, 480, 880, 330], verbs: { 'Pedir|Pedir una ronda': () => antiaPedir(), 'Mirar': () => say(S.active, 'Una barra de mármol negro con luz morada. Aquí un gin-tonic cuesta lo mismo que cenar en el Estrella.') } },
    { name: 'Bola de espejos', r: [1040, 15, 155, 150], verbs: { 'Mirar': () => say(S.active, S.active === 'angel' ? 'Cada espejito es un universo. Lo noto.' : 'Una bola de espejos. Ángel dice que cada espejito es un universo. Ramis dice que cada espejito es un Ramis.') } },
    { name: 'Hortensias', r: [55, 310, 155, 180], verbs: { 'Mirar': () => say(S.active, 'Hortensias blancas. En Galicia hasta las discotecas tienen hortensias.') } },
    { name: 'Botellas', r: [240, 150, 500, 320], verbs: { 'Mirar': () => say(S.active, 'Botellas iluminadas en morado. Ramis las mira como quien mira el escaparate de un concesionario de Porsche.') } },
    { name: 'Mesas con velas', r: [1340, 540, 260, 200], verbs: { 'Mirar': () => say(S.active, 'Mesitas con velas. Ambiente íntimo. Imposible oír nada.') } },
  ],
  exits: [{ name: 'Salir a los soportales', r: [0, 880, 220, 120], arrow: 'down', to: 'calle', from: 'right' }],
  async enter() {
    await narr('La discoteca Lume: mármol negro, luz morada y una bola de espejos que ha visto cosas. La música está tan alta que se os mueve el flequillo.');
    await say('ramis', '¡QUÉ SITIO MÁS ELEGANTE!');
    await say('marc', '¿¡QUÉ!?');
    await say('ramis', '¡QUE QUÉ SITIO MÁS ELEGANTE!');
    await say('marc', '¿¡QUE ME HE PUESTO EL JERSEY DEL REVÉS!?', 'sorpresa');
    await say('marcos', 'Caballeros, aquí no nos vamos a entender ni por señas.');
    await say('angel', 'Ciento veinticuatro golpes por minuto. Como el corazón de Ramis cuando ve un Porsche.');
    if (flag('vigo1')) await say('noa', '¡CABALLEROS! ¡HABÉIS VENIDO!', 'risa');
    updObj();
  },
};
// focos de colores que barren la sala
function discoLights(c, t, cols, bx, by) {
  c.save(); c.globalCompositeOperation = 'lighter';
  cols.forEach((col, i) => {
    const ang = Math.PI / 2 + Math.sin(t * (0.5 + i * 0.17) + i * 2) * 0.9, len = 1150;
    const x1 = bx + Math.cos(ang) * len, y1 = by + Math.sin(ang) * len, px = -Math.sin(ang), py = Math.cos(ang);
    const g = c.createLinearGradient(bx, by, x1, y1); g.addColorStop(0, hexA(col, 0.2)); g.addColorStop(1, hexA(col, 0));
    c.fillStyle = g; c.beginPath(); c.moveTo(bx, by); c.lineTo(x1 + px * 150, y1 + py * 150); c.lineTo(x1 - px * 150, y1 - py * 150); c.closePath(); c.fill();
  });
  // motitas de la bola de espejos
  for (let i = 0; i < 40; i++) {
    const a = i * 2.39996 + t * 0.35, r = 140 + (i * 53) % 700, x = bx + Math.cos(a) * r * 1.5, y = by + 40 + Math.abs(Math.sin(a)) * r * 0.9;
    c.globalAlpha = 0.25 + 0.25 * Math.sin(t * 3 + i); c.fillStyle = '#e8dcff'; c.fillRect(x, y, 4, 3);
  }
  c.restore();
}

async function djTalk() {
  if (S.scene !== 'disco') return;
  if (flag('gaita')) return say('dj', pick(['¡MANOS ARRIBA, PONTEVEDRA!', '¿¡QUÉ!? ¡NO TE OIGO, ESTOY PINCHANDO!', '¡SALID A LA PISTA, CABALLEROS!']), 'risa');
  await say(S.active, '¡OYE! ¿¡PUEDES PONER ALGO DE SINIESTRO TOTAL!?');
  await say('dj', '¿¡UN SINIESTRO TOTAL!? ¿¡OS HABÉIS ESTRELLADO CON EL COCHE!?', 'sorpresa');
  await say('marcos', '¡NO, NO! ¡EL COCHE ESTÁ PERFECTO! ' + (flag('llavesConfiscadas') && !flag('llavesDevueltas') ? '¡LAS LLAVES LAS TIENE BRAIS!' : '¡Y LAS LLAVES LAS TENGO YO!'), 'sorpresa');
  await say('dj', '¡PUES PARA CELEBRAR QUE ESTÁIS VIVOS… TENGO ALGO ESPECIAL PARA VOSOTROS, LORDS!', 'risa');
  flag('gaita', 1); music('cancion'); sfx('ovacion');
  await narr('Suena «Cuatro amigos fueron de viaje…». Es la canción del Club. La Lume entera se viene arriba, Gary llora de emoción y las profes de Vigo la bailan con los brazos en alto.');
  await say('ramis', '¡ESTA ES NUESTRA! ¡Al menos yo podré decir que he vivido!', 'risa');
}
async function bailar() {
  if (S.scene !== 'disco') return;
  const dancers = PROTA.filter((p) => G.actors[p]);
  dancers.forEach((p) => { G.actors[p].dance = true; });
  try {
    if (flag('pista')) {
      await narr(pick(['Otra vuelta por la pista. Ramis pide «Paquito el Chocolatero». El DJ hace como que no le oye. O no le oye.', 'Los cuatro vuelven a la pista. Marcos sigue bailando sin mover los pies. Por si acaso.']));
      return;
    }
    await narr('Los cuatro caballeros salen a la pista de la Lume.');
    await narr('Ramis baila como si aparcara un Porsche en batería. Marc hace el robot, pero sexy. Marcos baila sin mover los pies, por si hay control. Y Ángel cierra los ojos y baila con el universo.');
    if (flag('gaita')) await narr('Y con la canción del Club sonando, acaban bailando abrazados con media discoteca alrededor.');
    await say('guiri', 'LADS! LEGENDS!', 'risa');
    await say('noa', '¡ESOS CABALLEROS!', 'risa');
    if (S.drunk.marcos > 0) { drink('marcos', -1); await say('marcos', 'He sudado una copa entera. Ya veo una sola bola de espejos.'); }
    groupLaugh(); flag('pista', 1); logro('pista');
  } finally {
    dancers.forEach((p) => { if (G.actors[p]) G.actors[p].dance = false; });
  }
}
async function antiaTalk() {
  return say('antia', pick(['¿¡QUÉ!? ¡HABLA MÁS ALTO!', '¿¡QUE SI TENGO NOVIO!? ¡NO TE OIGO! ¡Y NO!', 'Si queréis algo, pedidlo a gritos. O por señas. O no pidáis.']));
}
async function antiaPedir() {
  const v = await choose([
    { t: '«¡CUATRO GIN-TONICS! ¡BUENO, TRES Y UNA TÓNICA!»', v: 'gin' },
    { t: '«¡UN AGUA PARA EL CONDUCTOR!»', v: 'agua' },
    { t: '«Nada, nada»', v: 'n' },
  ]);
  if (v === 'n') return say('antia', '¿¡QUÉ!?');
  if (v === 'gin') {
    await say(S.active, '¡CUATRO GIN-TONICS! ¡BUENO, TRES Y UNA TÓNICA!');
    await say('antia', '¿¡CUATRO CHUPITOS DE TEQUILA Y UNA CORONA!?');
    await say(S.active, '¡NO! ¡GIN! ¡TO! ¡NICS!');
    await say('antia', '¡MARCHANDO!');
    await narr('Antía pone cuatro chupitos de tequila. Con sal. Con limón. Con cara de «no me lo hagáis repetir».');
    ['ramis', 'marc', 'angel'].forEach((p) => drink(p, 1, true)); sfx('brindis');
    await tentarMarcos({ prompt: 'El cuarto tequila está delante de Marcos…', si: '«¡Para dentro!»', no: '«¡QUE CONDUZCO!»' });
    return;
  }
  await say('marcos', '¡UN AGUA PARA EL CONDUCTOR!');
  await say('antia', '¿¡UN AGUARDIENTE PARA EL CONDUCTOR!? ¡MARCHANDO!');
  await say('marcos', '¡AGUA! ¡A-GU-A!', 'sorpresa');
  await narr('Antía le pone delante a Marcos un vaso de aguardiente de hierbas. Con una sonrisa malvada.');
  const bebe = await tentarMarcos({ prompt: 'Marcos mira el aguardiente. El aguardiente mira a Marcos…', si: '«Bueno, ya que está…»', no: '«Me lo guardo para desinfectar heridas»' });
  if (!bebe) await say('antia', 'Vaaale, agua. Del grifo, que la embotellada es para los que bailan.');
}
async function luaTalk() {
  const f = S.flags;
  if (f.luaOk) return say('lua', S.active === 'marc' ? 'Me guardo el dibujo para el portfolio. Y tu número… también.' : '¿TU AMIGO MARC SIEMPRE ES ASÍ? ¡ES UN LIGÓN!', 'risa');
  if (S.active !== 'marc') return say('lua', '¿¡QUÉ!? ¡NO TE OIGO! …¿TU AMIGO EL DE LA CHAQUETA ES EL QUE DIBUJA? ¡DILE QUE VENGA!');
  await say('marc', '¡HOLA! ¡SOY DIBUJANTE!');
  await say('lua', '¿¡DIPUTADO!? ¡UF, NO! ¡YO ESTUDIO BELLAS ARTES!', 'sorpresa');
  await say('marc', '¡DI-BU-JAN-TE! ¡COMO MANARA!');
  await say('lua', '¿¡MAÑANA!? ¡MAÑANA TENGO RESACA!');
  sfx('pagina');
  await narr('Marc se rinde con las palabras y saca el móvil. En treinta segundos la dibuja: ojos de película, pelo al viento… y con bastante más ropa que en sus dibujos habituales.');
  await say('lua', '…Vale. Esto es precioso. Eres un ligón, ¿lo sabías?', 'risa');
  await say('marc', 'Algo me habían comentado.');
  emit('heart', G.actors.marc ? G.actors.marc.x : 530, 420, 8);
  await say('uxia', '¡OS LO DIJE! ¡MARC ES UN LIGÓN!', 'risa');
  flag('luaOk', 1); logro('ligon');
}

/* =====================================================================
   O FURADO, el antro punk
   ===================================================================== */
SCENES.antro = {
  title: 'O FURADO', sub: 'Antro punk de la zona vieja', bg: 'antro', music: 'antro', ambient: 'antro', loud: true, bpm: 136,
  tint: { c: '#ff3f7f', a: 0.12, d: 0.08 }, k: 0.6,
  pos: { ramis: [330, 990], marc: [530, 995], marcos: [730, 990], angel: [930, 995] },
  npcs: [
    { id: 'tino', x: 112, y: 862, k: 0.46, flip: true },
    { id: 'carla', x: 1010, y: 702, k: 0.31 },
    { id: 'vera', x: 1180, y: 760, k: 0.37, flip: true },
    { id: 'xurxo', x: 1355, y: 800, k: 0.37, flip: true, dance: true }, { id: 'nando', x: 1470, y: 826, k: 0.39, flip: true, dance: true },
  ],
  fx: [
    { type: 'neon', x: 1285, y: 365, w: 170, h: 170, color: '#ff2d6f', a: 0.35, period: 6 },
    { type: 'neon', x: 1268, y: 545, w: 80, h: 110, color: '#ff2d6f', a: 0.3, period: 9, seed: 2 },
    { type: 'glow', x: 228, y: 240, r: 150, color: '#ff4a4a', a: 0.3 }, { type: 'glow', x: 455, y: 278, r: 130, color: '#ff4a4a', a: 0.28, seed: 2 },
    { type: 'draw', fn: (c, t) => discoLights(c, t, ['#ff2d6f', '#9a4bff', '#ff4a4a'], 1060, 125) },
  ],
  hs: [
    { name: 'Escenario', r: [1040, 470, 410, 200], verbs: {
      'Subir|Subir al escenario': () => (S.active === 'angel' ? tinoTalk() : say(S.active, flag('concierto') ? 'Ya hemos dado el concierto de nuestras vidas. No hay que estirarlo.' : 'Yo ahí no subo ni loco. Eso es cosa de Ángel, que es el músico.')),
      'Mirar': () => say(S.active, 'Un escenario pequeño con mesa de mezclas y un rayo de neón. Según Tino, aquí ha tocado medio punk gallego.'),
    } },
    { name: 'Cartel «Punk Rock»', r: [548, 215, 100, 320], verbs: { 'Leer': () => say(S.active, '«PUNK ROCK», y un tío con cresta. Marc dice que la luz está fatal… y que el dibujo está muy bien.') } },
    { name: 'Una A de anarquía', r: [120, 580, 140, 160], verbs: { 'Mirar': () => say(S.active, 'Una A de anarquía pintada en la barra. Marcos dice que es la A de «Apóstol».') } },
    { name: 'Bola de espejos', r: [970, 30, 180, 185], verbs: { 'Mirar': () => say(S.active, 'Una bola de espejos en un antro punk. Tino dice que es ironía. Vera dice que la robó de una boda.') } },
    { name: 'Corazón de neón', r: [1210, 290, 150, 150], verbs: { 'Mirar': () => say(S.active, S.active === 'angel' ? 'Un corazón roto con un rayo. Esto es una canción. Ya tengo la letra en la cabeza.' : 'Un corazón roto de neón. Ángel lo mira como si fuera una partitura.') } },
    { name: 'Barra', r: [0, 540, 650, 120], verbs: { 'Pedir|Pedir una ronda': () => rondaFurado(), 'Mirar': () => say(S.active, 'Una barra llena de pegatinas, velas y botellas sin etiqueta. Aquí el orujo lo hace el primo de Tino.') } },
  ],
  exits: [{ name: 'Volver a la plaza', r: [0, 880, 220, 120], arrow: 'down', to: 'plaza', from: 'right' }],
  async enter() {
    await narr('O Furado: el antro punk de la zona vieja. Luz roja, un corazón roto de neón, pegatinas hasta en el techo y una bola de espejos que alguien robó de una boda.');
    await say('tino', 'Bienvenidos a O Furado. Aquí la música va alta, la cerveza fría y las normas… no hay.', 'risa');
    await say('ramis', '¿¡CÓMO!?');
    await say('tino', '¡QUE NO HAY NORMAS!');
    await say('ramis', '¿¡QUE NO HAY CERVEZAS!? ¡Caballeros, nos vamos!', 'sorpresa');
    await say('marc', 'Que no hay NORMAS, Ramis. Cervezas, todas.');
    await say('angel', 'Este sitio tiene buena energía. Mirad ese escenario…');
    if (!flag('concierto')) {
      await say('vera', 'Tino, tu cantante sigue en el baño.');
      await say('tino', 'Pues necesito uno. Ya. …Ese de la barba tiene manos de guitarrista.');
    }
    updObj();
  },
};
async function rondaFurado() {
  await say('tino', 'Orujo de la casa. Lo hace mi primo en Lalín. No preguntéis cómo.');
  ['ramis', 'marc', 'angel'].forEach((p) => drink(p, 1, true)); sfx('brindis');
  await tentarMarcos({ prompt: 'Tino le pone un orujo a Marcos…', si: '«Uno, por el punk»', no: '«Agua con gas, que conduzco»' });
}
async function penaTalk(id) {
  const f = S.flags;
  if (!f.pena1) {
    flag('pena1', 1);
    await say('xurxo', f.carla1 ? '¡CABALLEROS! ¡Sois los del vídeo de Carla!' : '¡CABALLEROS! ¡Me encanta vuestra pinta de concejales de fiestas!', 'risa');
    await say('nando', 'Jajajaja. ¡Concejales! Jajaja.', 'risa');
    await say('xurxo', '¡Ronda para el Club! ¡Invita la peña!');
    ['ramis', 'marc', 'angel'].forEach((p) => drink(p, 1, true)); sfx('brindis');
    await tentarMarcos({ prompt: 'Xurxo le planta un vaso rojo a Marcos…', si: '«¡Por la peña!»', no: '«Yo brindo con agua, que conduzco»' });
    await say('ramis', '¡Yo al menos podré decir que he vivido!', 'risa');
    await say('nando', 'Jajajaja. ¡Ha vivido! ¡Dice que ha vivido!', 'risa');
    return;
  }
  if (f.concierto && id === 'xurxo') return say('xurxo', '¡ÁNGEL! ¡Fírmame el vaso! ¡Es para mi madre!', 'risa');
  if (id === 'xurxo') return say('xurxo', pick(['¡CABALLEROS!', '¡Otra ronda y nos vamos! Mentira.', '¿Al final quién conduce? ¿El chaval?']), 'risa');
  return say('nando', pick(['Jajajaja.', 'Jajaja… perdona, ¿qué decías? Jajaja.', '¡El de las gafas parece mi primo pequeño! Jajaja.']), 'risa');
}
async function veraTalk() {
  const a = S.active, f = S.flags;
  if (a === 'ramis') {
    await say('vera', 'Tú eres el del Porsche imaginario, ¿no? En la zona vieja ya se habla de ti.');
    await say('ramis', 'No es imaginario. Es… futuro.');
    return say('vera', 'Me gusta. Un hombre con proyectos.', 'risa');
  }
  if (a === 'marc') {
    if (f.veraDibujo) return say('vera', 'Ese posavasos me lo llevo a casa. Y lo enmarco.');
    await say('vera', 'Me han dicho que dibujas. Dibújame con las botas, que son lo mejor que tengo.');
    sfx('pagina');
    await narr('Marc la dibuja en un posavasos: botas, rejilla y mirada de «ni se te ocurra». Vera lo mira tres segundos sin decir nada.');
    await say('vera', 'Me has sacado guapa y peligrosa. Las de Vigo tenían razón: eres un ligón.', 'risa');
    flag('veraDibujo', 1); logro('ligon');
    return;
  }
  if (a === 'marcos') {
    await say('vera', '¿Y tú? ¿Tienes edad para estar aquí?');
    await say('marcos', 'Tengo edad para conducir un Peugeot de siete plazas.');
    return say('vera', 'Eso no es tener edad. Eso es tener paciencia.', 'risa');
  }
  if (f.concierto) return say('vera', '¡ÁNGEL, QUÉ PAPÁ MÁS CAÑERO! Fírmame la bota.', 'risa');
  return say('vera', 'Tino dice que cantas. Sube al escenario y demuéstralo, barbas.');
}
async function tinoTalk() {
  const f = S.flags;
  if (S.scene !== 'antro') return;
  if (S.active !== 'angel') {
    if (f.concierto) return say('tino', 'Vuestro amigo el de la barba tiene escenario aquí cuando quiera. Vosotros, la barra.');
    return say('tino', 'Aquí se habla con música. El de la barba tiene manos de guitarrista… que venga él.');
  }
  if (f.concierto) {
    const v = await choose([{ t: '🎸 «Tino, ¿otra canción?»', v: 1 }, { t: '«Nada, Tino, gracias»', v: 0 }]);
    if (!v) return say('tino', 'Cuando quieras, chaval.');
    return conciertoAngel(true);
  }
  await say('tino', 'Tú tocas. No me lo niegues: callos en los dedos y cara de haber cargado muchos amplis.');
  await say('angel', 'Canto en un par de grupos… y toco algo la guitarra.', 'sorpresa');
  await say('tino', '¡Lo sabía! Mi cantante se ha ido al baño hace media hora y no vuelve. Sube.');
  await say('ramis', '¡ÁNGEL! ¡ÁNGEL! ¡ÁNGEL!', 'risa');
  await say('angel', 'Vale. Pero la canción la elijo yo: «Nunca más… hasta el sábado».');
  await conciertoAngel(false);
}
async function conciertoAngel(bis) {
  await narr('MINIJUEGO · Toca cada nota cuando llegue a la línea: con el dedo en su carril o con las teclas D, F, J y K (o las flechas).');
  try { AUDIO.duck(true); } catch (e) {}
  const r = await MG.concierto();
  music('antro');
  const pct = r && typeof r === 'object' ? r.pct : (r ? 0.8 : 0.3);
  S.stats.concierto = Math.max(S.stats.concierto || 0, pct);
  if (pct >= 0.5) {
    sfx('ovacion'); groupLaugh();
    await narr(pct >= 0.85 ? 'O Furado se viene abajo. Literalmente: se cae una pegatina del techo. Ovación cerrada.' : 'O Furado aplaude, salta y pide otra. Ángel suda como un caballero en una sauna.');
    await say('vera', '¡ÁNGEL, QUÉ PAPÁ MÁS CAÑERO!', 'risa');
    await say('carla', '¡Lo tengo! ¡Esto va directo a TikTok! «Papá cañero en O Furado».', 'risa');
    if (!bis) {
      await say('xurxo', '¡CABALLEROS! ¡CABALLEROS!', 'risa');
      await say('marc', 'Veinte años diciendo que el artista del Club era yo…');
      await say('tino', 'Invita la casa. Orujo para el cantante y sus amigos. Y para el de las gafas, agua con gas, que me han dicho que conduce.');
      ['ramis', 'marc', 'angel'].forEach((p) => drink(p, 1, true)); sfx('brindis');
    }
    flag('concierto', 1); logro('canero');
  } else {
    sfx('abucheo');
    await say('tino', 'El punk no es tocar bien, es tocar con ganas. Y tú ganas tenías… pocas. Cuando quieras, otra.');
    await say('angel', 'Es que el monitor no se oía. Clásico.', 'sorpresa');
    if (!flag('concierto')) flag('conciertoIntento', 1);
  }
  updObj();
}

/* =====================================================================
   MINIJUEGO · El concierto de Ángel (ritmo, 160 bpm)
   ===================================================================== */
MG.concierto = function () {
  const m = { drunk: 0, name: 'concierto' };
  const BPM = 160, BEAT = 60 / BPM, BAR = BEAT * 4, LX = [640, 790, 940, 1090], TOP = 175, HITY = 800, TRAVEL = 1.45, WIN = 0.14;
  const COL = ['#ff4fd8', '#4fc3ff', '#ffd23a', '#7dff7a'], KEYN = ['D', 'F', 'J', 'K'];
  const KEYS = { d: 0, f: 1, j: 2, k: 3, D: 0, F: 1, J: 2, K: 3, ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3 };
  // la canción: 2 compases de cuenta atrás y 14 de notas (pasos de corchea, carril por nota)
  const PAT = [
    '0.1.2.3.', '3.2.1.0.', '0.0.2.2.', '1.3.1.3.',
    '0.1.2.3.', '0.1.2.32', '3.2.1.0.', '1.1.3.30',
    '0.2.1.3.', '02.13.2.', '3.1.2.0.', '0213.2..',
    '0.1.2.3.', '3...0...',
  ];
  const LYR = ['Pulpo, orujo y orballo…', '…¡esta noche no me callo!', 'Marcos conduce, yo no…', '…¡llévame a Caldofran!', '¡NUNCA MÁS!', '¡…HASTA EL SÁBADO!', '¡OI! ¡OI! ¡OI!'];
  const notes = [];
  PAT.forEach((p, b) => { for (let i = 0; i < 8; i++) { const ch = p[i]; if (ch !== '.') notes.push({ t: (b + 2) * BAR + i * BEAT / 2, lane: +ch, hit: 0, gone: false }); } });
  const END = 16 * BAR + 1.2;
  let st = -99, zero = null, loops = 0, lastMt = -1, perfT0 = 0, t0 = 0, hits = 0, perf = 0, combo = 0, best = 0, misses = 0, fans = 0.4;
  let msg = '', msgT = 0, flashL = [0, 0, 0, 0], pops = [], angelHop = 0, crowdHop = 0;
  const held = {};
  const top = MG.bar('');
  const SHOUT = [
    [8, 'vera', '¡ÁNGEL, QUÉ PAPÁ MÁS CAÑERO!'], [16, 'xurxo', '¡CABALLEROS! ¡CABALLEROS!'], [24, 'carla', '¡Esto va directo a TikTok!'], [32, 'tino', '¡Así se canta en O Furado!'],
  ];
  function songTime() {
    // reloj de la música (si el audio lo da) para que las notas caigan a tiempo
    let mt = null; try { mt = AUDIO.musicTime && AUDIO.musicTime(); } catch (e) {}
    if (mt && mt.name === 'concierto' && mt.len > 0) {
      if (lastMt >= 0 && mt.t < lastMt - mt.len / 2) loops++;
      lastMt = mt.t;
      const u = loops * mt.len + mt.t - (mt.lat || 0); // lo que suena de verdad por el altavoz
      if (zero === null) { const toBar = BAR - (u % BAR); zero = { kind: 'music', at: u + (toBar < 0.6 ? toBar + BAR : toBar) }; }
      if (zero.kind === 'music') return u - zero.at;
    }
    const now = performance.now() / 1000;
    if (zero === null && t0 > 1.5) zero = { kind: 'clock', at: now + 0.4 };
    if (zero && zero.kind === 'clock') return now - zero.at;
    return -99;
  }
  function judge(lane) {
    if (st < -1) return;
    flashL[lane] = 0.18;
    let bestN = null, bd = 9;
    for (const n of notes) if (!n.hit && !n.gone && n.lane === lane) { const d = Math.abs(n.t - st); if (d < bd) { bd = d; bestN = n; } }
    if (bestN && bd <= WIN) {
      bestN.hit = 1; hits++; combo++; best = Math.max(best, combo); fans = Math.min(1, fans + 0.03);
      const p = bd < 0.06; if (p) perf++;
      msg = p ? '¡PERFECTO!' : '¡BIEN!'; msgT = 0.5;
      sfx('acorde', { n: lane }); emit('spark', LX[lane], HITY, 10, { color: COL[lane], sx: 20, sy: 10 });
      angelHop = 1; if (combo % 4 === 0) crowdHop = 1;
      const s = SHOUT.find((x) => x[0] === combo); if (s) { pops.push({ who: s[1], txt: s[2], t: t0 }); sfx('ovacion', { soft: true }); }
    } else { combo = 0; fans = Math.max(0, fans - 0.02); }
  }
  m.down = (p) => { if (p.y < 250) return; let lane = 0, d = 1e9; LX.forEach((x, i) => { if (Math.abs(p.x - x) < d) { d = Math.abs(p.x - x); lane = i; } }); judge(lane); };
  m.key = (k, d) => { const l = KEYS[k]; if (l === undefined) return; if (d && !held[k]) judge(l); held[k] = d; };
  music('concierto');
  m.update = (dt) => {
    t0 += dt; msgT -= dt; angelHop = Math.max(0, angelHop - dt * 4); crowdHop = Math.max(0, crowdHop - dt * 3);
    flashL = flashL.map((v) => Math.max(0, v - dt));
    st = songTime();
    for (const n of notes) if (!n.hit && !n.gone && st > n.t + WIN) { n.gone = true; misses++; combo = 0; fans = Math.max(0, fans - 0.05); if (misses % 3 === 1) sfx('feedback'); }
    const done = notes.filter((n) => n.hit || n.gone).length;
    top.innerHTML = st < 2 * BAR ? '¡Prepárate! Toca cuando la nota llegue a la línea' : `Aciertos: <b style="color:#9dffb0">${hits}</b> / ${notes.length} · Combo <b style="color:#ffd98a">${combo}</b>`;
    if (st > END || (done === notes.length && st > notes[notes.length - 1].t + 1.2)) {
      const pct = notes.length ? (hits + perf * 0.15) / (notes.length * 1.15) : 0;
      m.end({ pct: Math.min(1, pct), hits, total: notes.length, best });
    }
  };
  m.draw = (c, t) => {
    MG.bg(c, 'antro', 0.45, 1.05);
    // focos al ritmo
    const beatK = st > -1 ? 1 - ((st % BEAT) + BEAT) % BEAT / BEAT : 0;
    c.save(); c.globalCompositeOperation = 'lighter';
    [[300, '#ff2d6f'], [800, '#9a4bff'], [1300, '#ff4a4a']].forEach(([x, col], i) => {
      const a = 0.12 + 0.12 * beatK, sw = Math.sin(t * 0.8 + i * 2) * 260;
      const g = c.createLinearGradient(x, 0, x + sw, 1000); g.addColorStop(0, hexA(col, a)); g.addColorStop(1, hexA(col, 0));
      c.fillStyle = g; c.beginPath(); c.moveTo(x - 30, 0); c.lineTo(x + 30, 0); c.lineTo(x + sw + 220, 1000); c.lineTo(x + sw - 220, 1000); c.closePath(); c.fill();
    });
    c.restore();
    // Ángel cantando
    const sp = bodySprite('angel'), sh = 760 * (G.img[sp] ? G.img[sp].height / G.img['chars/angel'].height : 1);
    MG.drawImgH(c, sp, 300, 1010 - Math.sin(angelHop * Math.PI) * 30 - beatK * 6, sh, { rot: Math.sin(t * 5) * 0.03 });
    // carriles
    LX.forEach((x, i) => {
      c.fillStyle = 'rgba(10,6,20,.55)'; c.fillRect(x - 58, TOP, 116, HITY - TOP + 70);
      c.fillStyle = hexA(COL[i], 0.12 + flashL[i] * 2); c.fillRect(x - 58, TOP, 116, HITY - TOP + 70);
      c.strokeStyle = hexA(COL[i], 0.5); c.lineWidth = 3; c.strokeRect(x - 58, TOP, 116, HITY - TOP + 70);
    });
    // línea de golpe
    c.save(); c.strokeStyle = '#fff'; c.lineWidth = 5; c.shadowColor = '#fff'; c.shadowBlur = 12 * beatK; c.beginPath(); c.moveTo(LX[0] - 70, HITY); c.lineTo(LX[3] + 70, HITY); c.stroke(); c.restore();
    LX.forEach((x, i) => {
      c.save(); c.beginPath(); c.arc(x, HITY, 44 + flashL[i] * 60, 0, 7); c.fillStyle = hexA(COL[i], 0.25 + flashL[i] * 3); c.fill(); c.lineWidth = 5; c.strokeStyle = COL[i]; c.stroke();
      c.font = "800 34px 'Nunito'"; c.textAlign = 'center'; c.fillStyle = '#fff'; c.fillText(KEYN[i], x, HITY + 12); c.restore();
    });
    // notas
    for (const n of notes) {
      if (n.hit) continue;
      const k = (n.t - st) / TRAVEL; if (k > 1.05 || k < -0.25) continue;
      const y = HITY - k * (HITY - TOP);
      c.save(); c.globalAlpha = n.gone ? 0.3 : 1; c.shadowColor = COL[n.lane]; c.shadowBlur = 18;
      c.fillStyle = COL[n.lane]; c.beginPath(); c.ellipse(LX[n.lane], y, 46, 24, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(LX[n.lane] - 10, y - 8, 18, 7, 0, 0, 7); c.fill(); c.restore();
    }
    // la letra, como en un karaoke
    if (st > 0) {
      const bi = Math.floor(st / BAR), li = Math.floor((bi - 2) / 2);
      const txt = st < 2 * BAR ? ['¡UNO!', '¡DOS!', '¡TRES!', '¡CUATRO!'][clamp(Math.floor((st % BAR) / BEAT) + (bi === 1 ? 0 : -9), 0, 3)] : (LYR[clamp(li, 0, LYR.length - 1)] || '');
      if (st < 2 * BAR && bi === 0) { /* primer compás: silencio para coger aire */ } else { c.save(); c.font = "800 52px 'Cinzel'"; c.textAlign = 'center'; c.lineWidth = 9; c.strokeStyle = '#1a0f05'; c.strokeText(txt, 865, 138); c.fillStyle = '#ffd98a'; c.fillText(txt, 865, 138); c.restore(); }
    }
    // el público (de medio cuerpo, abajo a la derecha)
    [['vera', 1255], ['xurxo', 1385], ['nando', 1510], ['carla', 1190]].forEach(([id, x], i) => {
      const hop = Math.sin(crowdHop * Math.PI) * 40 + Math.abs(Math.sin(t * 6 + i)) * 8 * fans;
      MG.drawImgH(c, 'chars/' + id, x, 1230 - hop, 520 + (i % 2) * 20, { flip: true });
    });
    // gritos del público
    pops.forEach((p, i) => {
      const k = clamp((t0 - p.t) * 3, 0, 1) * clamp(3.2 - (t0 - p.t), 0, 1); if (k <= 0) return;
      c.save(); c.globalAlpha = k; c.font = "800 30px 'Nunito'"; c.textAlign = 'center';
      const x = 1350, y = 560 - (i % 2) * 70, tw = c.measureText(p.txt).width + 34;
      c.fillStyle = 'rgba(255,250,235,.96)'; c.strokeStyle = '#2a1a08'; c.lineWidth = 4; c.beginPath(); c.roundRect(x - tw / 2, y - 44, tw, 56, 18); c.fill(); c.stroke();
      c.fillStyle = '#2a1a08'; c.fillText(p.txt, x, y - 6); c.restore();
    });
    drawParticles(c);
    if (msgT > 0) MG.bigText(c, msg, HITY - 90, msg === '¡PERFECTO!' ? '#9dffb0' : '#ffd98a', 56);
    // público entregado
    c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(1180, 190, 340, 20); c.fillStyle = '#ff4fd8'; c.fillRect(1180, 190, 340 * fans, 20);
    c.font = "800 22px 'Nunito'"; c.fillStyle = '#fff'; c.textAlign = 'left'; c.fillText('Público', 1180, 182);
  };
  return MG.begin(m);
};

/* =====================================================================
   INTRO: la viñeta (avión, Coruña, Pontevedra, Caldas)
   ===================================================================== */
async function introSeq() {
  const im = G.img['bg/intro'];
  if (!im || TEST) return;
  const R = {
    todo: { x: 0, y: 32, w: 1536, h: 960 }, avion: { x: 10, y: 0, w: 690, h: 431 }, coche: { x: 0, y: 470, w: 800, h: 500 },
    ponte: { x: 740, y: 0, w: 796, h: 497 }, balneario: { x: 830, y: 500, w: 706, h: 441 },
  };
  const cam = Object.assign({}, R.todo);
  let title = '', sub = '', titleT = 0, skip = false;
  const m = {
    drunk: 0,
    draw(c, t) {
      c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
      const z = 1 + Math.sin(t * 0.2) * 0.012;
      const w = cam.w / z, h = cam.h / z, x = cam.x + (cam.w - w) / 2, y = cam.y + (cam.h - h) / 2;
      c.drawImage(im, x, y, w, h, 0, 0, W, H);
      c.drawImage(vignette, 0, 0);
      if (title) {
        const a = clamp((G.t - titleT) * 2, 0, 1);
        c.save(); c.globalAlpha = a; c.textAlign = 'left';
        c.fillStyle = 'rgba(8,6,16,.72)'; c.fillRect(40, 40, Math.max(420, title.length * 46), sub ? 140 : 100);
        c.font = "800 64px 'Cinzel'"; c.fillStyle = '#ffd98a'; c.fillText(title, 64, 114);
        if (sub) { c.font = "34px 'Patrick Hand'"; c.fillStyle = '#fff6e0'; c.fillText(sub, 66, 160); }
        c.restore();
      }
    },
    down() { advance(); },
  };
  G.mode = m; G.started = false;
  $('hud').classList.add('hidden');
  const sk = document.createElement('button'); sk.className = 'mgbtn'; sk.textContent = 'Saltar intro ⏭';
  sk.style.right = '24px'; sk.style.top = '24px';
  sk.onpointerdown = (e) => { e.stopPropagation(); e.preventDefault(); skip = true; sfx('click'); if (advanceFn) advance(); };
  $('mg').innerHTML = ''; $('mg').appendChild(sk); $('mg').classList.remove('hidden');
  music('intro');
  const go = async (k, ttl, sb) => { if (skip) return; title = ttl || ''; sub = sb || ''; titleT = G.t; await tween(cam, R[k], 1.6); };
  const n = async (txt) => { if (!skip) await narr(txt); };
  await fadeTo(0, 0.8);
  await n('En el instituto Josep Maria Llompart de Mallorca, cuatro alumnos de bachillerato artístico fundaron un club muy serio: el Club de Caballeros.');
  await n('Cada uno tiene ya su vida, pero el Club sigue en pie. Y de vez en cuando… se convoca.');
  await go('avion', 'MALLORCA', 'Despegue');
  await n('Ramis, Marc y Ángel cogen un avión rumbo a Galicia. Ramis pregunta a la azafata si el avión es de Porsche.');
  await go('coche', 'CORUÑA', 'El cuarto caballero');
  await n('Marcos, el cuarto caballero, vive en Coruña. Baja a buscarlos en su Peugeot 5008 blanco. Siete plazas. Cero Porsche.');
  await go('ponte', 'PONTEVEDRA', 'Punto de encuentro');
  await n('Punto de encuentro: Pontevedra. Granito, soportales, pulpo y una zona vieja llena de bares. El plan: cenar, ruta de bares… y lo que surja.');
  await go('balneario', 'CALDAS DE REIS', 'Para dormir');
  await n('Para dormir, el Balneario Acuña de Caldas de Reis: elegante, termal y tranquilo. Ellos lo llaman «Caldofran». Nadie recuerda por qué.');
  await go('todo', '', '');
  await n('Una sola regla: Marcos conduce. Y Marcos no bebe.');
  await n('Sábado noche. Bar Estrella. Empieza la leyenda.');
  sk.remove(); $('mg').classList.add('hidden');
  $('dlg').classList.add('hidden'); G.dlgOpen = false;
  await fadeTo(1, 0.6);
  G.mode = null;
}

/* =====================================================================
   ESCENA POST-CRÉDITOS: Don Xesús y Gary, al mus en las ruinas
   ===================================================================== */
async function postCreditos() {
  if (TEST) { (G.log = G.log || []).push('== POST-CRÉDITOS'); return; }
  const m = {
    drunk: 0,
    draw(c, t) {
      MG.bg(c, 'ruinas', 0.35, 1.02);
      MG.drawImgH(c, 'chars/fantasma', 560, 960 + Math.sin(t * 1.6) * 10 - 20, 640, { alpha: 0.78 + Math.sin(t * 2.3) * 0.08, glow: 'rgba(150,220,255,0.9)' });
      MG.drawImgH(c, 'chars/guiri', 1040, 975, 600, { flip: true });
      if (m.pere) MG.drawImgH(c, 'chars/peregrino', 1390, 980, 580, { flip: true });
      // la mesita con las cartas
      c.fillStyle = '#3b2412'; c.fillRect(640, 820, 330, 26); c.fillRect(700, 846, 18, 140); c.fillRect(890, 846, 18, 140);
      for (let i = 0; i < 4; i++) { c.save(); c.translate(700 + i * 60, 812); c.rotate(-0.2 + i * 0.13); c.fillStyle = '#fff6e0'; c.fillRect(-18, -26, 36, 52); c.strokeStyle = '#7a1a1a'; c.lineWidth = 3; c.strokeRect(-18, -26, 36, 52); c.restore(); }
      c.save(); c.font = "800 34px 'Cinzel'"; c.fillStyle = '#ffd98a'; c.textAlign = 'center'; c.fillText('ESCENA POST-CRÉDITOS', W / 2, 60); c.restore();
    },
    down() { advance(); },
  };
  G.mode = m; G.scene = null; G.actors = {}; $('hud').classList.add('hidden');
  music('ruinas'); ambient('ruinas');
  await fadeTo(0, 0.8);
  await narr('Mientras tanto, en las ruinas de Santo Domingo…');
  await say('guiri', 'Double or nothing, Mister Xesús!', 'risa');
  await say('fantasma', '¡Albricias! ¿Otra vez, mangurrián? Esta noche apostamos fuerte, inglés: si gano yo, me quedo tus chanclas.');
  await say('guiri', 'Deal! And if I win?');
  await say('fantasma', 'Si ganas tú… te doy unos calzoncillos de rayas que me ha regalado una meiga. Todavía calentitos.', 'risa');
  await narr('Don Xesús reparte. Gary mira sus cartas. Gary no sabe jugar al mus.');
  if (!flag('peregrinoOk')) {
    m.pere = true;
    await say('peregrino', 'Perdonad… ¿esto es Santiago?');
    await say('fantasma', 'Esto es el siglo dieciocho, rapaz. Siéntate, que nos falta uno para la partida.', 'risa');
  } else {
    await say('guiri', 'By the way… where are the four gentlemen?');
    await say('fantasma', 'En Caldofran, con el agua hasta el cuello. Volverán. Siempre vuelven… el sábado.', 'risa');
  }
  await card('FIN', '…o no', 2600);
  $('dlg').classList.add('hidden'); G.dlgOpen = false;
}
