'use strict';
/* =====================================================================
   v23 · Objetos nuevos (dibujos de JRAR)
   · Pollo de goma: lo llevan desde el principio. Cuando lo usan en algo,
     siempre la misma pregunta: «¿Sirve para aquí?»… y nunca sirve. Solo
     en el modo 18+ sirve de arma contra Don Xesús y la Santa Compaña.
   · Papel higiénico: Brais lo tiene en la barra del bareto. En la cola del
     baño es un comodín: a quien se lo ofreces, te deja pasar.
   · Omeprazol: se lo da Doña Maruxa con los postres. Tres pastillas que
     bajan la borrachera a Marc, Ángel y Ramis (Marcos ya tiene su café).
   ===================================================================== */
ITEMS.pollo = { name: 'Pollo de goma', img: 'pollo', desc: 'Un pollo de goma. Nadie sabe quién lo trajo ni para qué sirve. Pero viene siempre.' };
ITEMS.papel = { name: 'Papel higiénico', img: 'papel', desc: 'Un rollo de papel del bareto de Brais. A las tres de la mañana vale más que el oro.' };
ITEMS.omeprazol = { name: () => 'Omeprazol (' + (S && S.flags.omep !== undefined ? S.flags.omep : 3) + ')', img: 'omeprazol', desc: 'De Doña Maruxa. «Para el estómago, meu neno.» Dáselo a Marc, Ángel o Ramis y les baja la borrachera.' };
LOGROS.pollo = { i: '🐔', t: '¿Sirve para aquí? ¡Por fin sí!' };
EXTRA_ASSETS.push('items/compana_1', 'items/compana_2', 'items/compana_3', 'items/compana_4', 'items/compana_5', 'items/compana_6', 'items/compana_7');

// el pollo, desde el principio de la partida
{ const _ns = newState; newState = () => { const s = _ns(); s.inv.push('pollo'); return s; }; }

/* ---------- el chiste del pollo ---------- */
const POLLO = {
  async gag() {
    sfx('pollo');
    const a = S.active, otros = PROTA.filter((p) => p !== a), b = pick(otros);
    const v = pick([
      [[a, '¿Sirve para aquí?'], [b, 'No. Nunca sirve para nada. Por eso lo llevamos.']],
      [[b, '¿Y el pollo? ¿Sirve para aquí?'], [a, '…No.']],
      [[a, 'Pruebo con el pollo… ¿Sirve para aquí?'], ['narrador', '*Squeak.*'], [a, 'No sirve para aquí.']],
      [[a, '¿Sirve para aquí el pollo?'], ['angel', 'El pollo sirve para todo… menos para esto.']],
      [['ramis', '¡El pollo! ¡Seguro que sirve para aquí!'], ['marcos', 'Ramis, llevamos veinte años con ese pollo. No ha servido nunca.']],
    ]);
    for (const [w, t] of v) await say(w, t, w === 'narrador' ? undefined : 'risa');
  },
};
// usar el pollo con cualquier cosa → el chiste (antes que cualquier otra respuesta)
{ const _u = useItemOn; useItemOn = (item, target) => (item === 'pollo' ? POLLO.gag(target) : _u(item, target)); }
// también lo dicen solos de vez en cuando
IDLE_LINES.ramis.push('¿Y el pollo? ¿Sirve para aquí?');
IDLE_LINES.marc.push('Algún día el pollo servirá para algo.');
IDLE_LINES.marcos.push('¿Sirve para aquí el pollo? No, ¿verdad?');
IDLE_LINES.angel.push('El pollo tiene un aura rara. Lo noto.');

/* ---------- el omeprazol ---------- */
{ const _gp = GIVE_PROTA; GIVE_PROTA = (item, id) => {
  if (item !== 'omeprazol') return _gp(item, id);
  return (async () => {
    if (id === 'marcos') return say('marcos', 'Yo no bebo, que conduzco. Con el café me apaño. Guárdalo para los otros.');
    if (!S.drunk[id]) return say(id, 'Ahora mismo no me hace falta. Pero no lo pierdas, que la noche es larga.');
    S.flags.omep = (S.flags.omep !== undefined ? S.flags.omep : 3) - 1;
    if (S.flags.omep <= 0) takeItem('omeprazol');
    drink(id, -2); sfx('trago');
    await say(id, pick(['Omeprazol con agua. Mi estómago y yo volvemos a hablarnos.', 'Ya veo una sola farola. Bueno, una y cuarto.', 'Gracias, Maruxa, estés donde estés.']), 'risa');
  })();
}; }

/* ---------- el papel, en la barra del bareto ---------- */
if (SCENES.bareto) {
  SCENES.bareto.props = (SCENES.bareto.props || []).concat([{ img: 'papel', x: 930, y: 548, h: 66, cond: () => !has('papel') && !flag('papelCogido'), hs: { name: 'Rollo de papel', verbs: {
    'Coger': async () => {
      flag('papelCogido', 1); give('papel'); sfx('pickup');
      await say('camarero', 'Llévatelo, rapaz. En los baños de la Lume y de O Furado nunca hay papel. Nunca.');
      await say(S.active, 'Esto, a las tres de la mañana, vale más que el oro.');
    },
    'Mirar': () => say(S.active, 'Un rollo de papel higiénico en la barra. Brais es un hombre previsor.'),
  } } }]);
}
