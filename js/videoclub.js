'use strict';
/* =====================================================================
   v26 · MODO VIDEOCLUB — para los que no saben jugar («los mancos»)
   La partida se juega sola, como una película en cinta VHS:
   · carátula y cinta que entra en el vídeo, y «PLAY ▶»
   · la historia principal, con los diálogos que pasan solos, las
     elecciones que se pulsan solas (con una mano que señala) y los
     minijuegos jugándose solos (o en avance rápido)
   · efecto VHS todo el rato: barrido, color corrido, ruido, temblor y
     franjas de «tracking»; contador SP abajo a la derecha
   · mando: ⏸/▶ (espacio), ⏩ ×3 (→, pulsar o mantener), ⏏ (Esc)
   · chistes para el que mira desde el sofá
   Mientras dura NO se toca nada del jugador: ni la partida guardada, ni
   logros, ni capítulos, ni Instaclub, ni marcador. Todo lo que engancha
   se pone al empezar y se quita al salir (y además mira VC.on).
   ===================================================================== */
const VC = {
  on: false, sess: 0, ending: false, starting: false,
  paused: false, ffUser: false, ffAuto: false, k: 1,   // k: velocidad extra SOLO para pruebas
  tape: 0, want: null, errs: [], drv: null, lite: false,
};

(() => {
  // los relojes de verdad (antes de tocar nada)
  const RT = window.setTimeout, RC = window.clearTimeout, RI = window.setInterval, RCI = window.clearInterval;
  const rt = (fn, ms) => RT.call(window, fn, ms);
  const ST = () => $('stage');
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const STOP = { vcStop: true };

  /* ---------------- los chistes para el del sofá ---------------- */
  const JOKE = {
    sofa: 'Tú, el del sofá: tranquilo, aquí no hay que hacer nada. Ni tocar, ni pensar. Esta noche la juega la cinta.',
    ramis: '¿Y tú qué miras? Ah, que eres de los que no juegan. Tranquilo, que esta noche invito yo. ¡Bajo el yugo opresor!',
    beso: 'Y tú, el del sofá: ni se te ocurra rebobinar para verlo otra vez. …Bueno, vale. Una vez.',
    xesus: '¿Y ese de ahí, el del sofá? ¡Bribón! ¡Mangurrián! …Ah, que solo mira. Pues mire, mire, que el alquiler ya está pagado.',
    duelo: 'Si estuvieras jugando, ahora te tocaría a ti. Pero tranquilo, ya lo hago yo.',
    carretera: 'Aquí venía un buen rato de conducir. Como tú no juegas, lo pasamos en avance rápido. De nada.',
    seoane: 'Y usted, el del sofá: ¿ha bebido? …Ah, que solo está mirando. Circule, circule.',
    pesetas: 'Rebobine la cinta antes de devolverla o le cobramos 100 pesetas.',
    palomitas: '¿Vas a por palomitas? Aquí te esperamos.',
  };
  // frases del juego que en la película sobran: las instrucciones para el jugador y algo de relleno
  // (montaje para que dure unos 15 minutos; si alguna cambia de texto, simplemente se ve)
  const SKIP = [/^Toca a la gente y las cosas/,
    /^Ángel lleva toda la cena tamborileando/, /^Es que esta noche tiene ritmo\. Lo noto/, /^Ángel, eso es la cafetera/, /^Ya… Ojalá estuviera Chus/,
    /^¡Así me gusta, que se os ve contentos/, /^Esto es confianza o es una prueba/, /^Pone «Bodega Secreta Estrella»/, /^Aquí abajo hay energía\. Mucha/,
    /^¡Ay, calla, que me pongo colorada/, /^Y omeprazol, que con lo que vais a beber/, /^¿Meiga\? ¿Meiga de verdad\?/, /^Ramis paga la cena\./,
    /^Yo con agua\. Que tengo que llevaros/, /^Gracias por esto, caballeros/, /^Tres opciones: el bareto/, /^Yo al menos podré decir que he vivido\.$/,
    /^Yo me quedo en la barra\. No he venido a ligar/, /^Pregunta mejor cómo vas a recuperarlas/, /^Y así como se besaron/, /^Veinte años leyendo a Manara, y Ángel/,
    /^¡Habla como Chus! ¡Chus, eres tú!/, /^Un fantasma de verdad\. Esto es mejor/, /^Don Xesús bebe directamente de la jarra/, /^Mi descanso eterno\. Bonito/,
    /^Mis gafas de cerca\. Ya era hora/, /^¿Y yo con qué me defiendo\?/, /^Coge el candelabro, que con lo que brilla/, /^Nike Apóstol nunca falla una tirada/,
    /^Ahora que el conductor me demuestre que va sereno/, /^Será la prima de la señora del Estrella/, /^¿Cómo sabe usted eso\?$/, /^Esto sí que no lo dibujo/,
    /^Lo que hago por el Club\.$/, /^GPS: Balneario Acuña/, /^Ese nombre no me gusta nada/, /^Bajo el yugo opresor… y ahora también/, /^Los cuatro se arrodillan/,
    /^¡Esta noche es nuestra, Lords!$/, /^¿Se ha ido\? ¿Nos ha dejado el bar entero\?/, /^Los túneles bajo Pontevedra/, /^Señora… ¿se ha ido a su casa a por postres/,
    /^Caballeros: la noche es joven, yo estoy sereno/, /^Caldofran… el Balneario Acuña/, /^Los soportales de la zona vieja\. Cae un orballo/, /^¡Bienvenidos, rapaces! ¿Qué va a ser\?/,
    /^Pues ya tienes excusa para hablarle/, /^\(Ángel respira hondo/, /^Y quizá, solo quizá, os enseñe mi cripta/, /^¡MI LLAVE! Trescientos años/, /^En el sarcófago hay una inscripción/,
    /^Arrodillaos\.$/, /^¡Las llaves del Peugeot! Caballeros/, /^¡Os postres da miña prima Maruxa/, /^Agora si\. Poñédevos arredor/, /^Siete plazas, cero Porsche\. Pero lo quiero/,
    /^Cinturones, caballeros\. Esta noche conduce/, /^…Buenas noches, agente\.$/, /^Esto lo dibujo\. Estilo Manara/];
  // tiempo de lectura: 0,9 s + 45 ms por letra (solo letras y números, sin espacios ni signos)
  const letras = (t) => String(t || '').replace(/[^0-9A-Za-zÀ-ÿ]/g, '').length;

  /* =====================================================================
     RELOJ VIRTUAL: mientras dura el Videoclub, setTimeout/setInterval
     van con la cinta (se paran en pausa, van ×3 en avance rápido).
     El sonido del juego (audio.js) sigue con el reloj de verdad.
     ===================================================================== */
  const VT = { now: 0, list: [], seq: 1e9 };
  const fromAudio = () => { try { return /audio\.js/.test(new Error().stack || ''); } catch (e) { return false; } };
  function vSetTimeout(fn, ms, ...a) {
    if (typeof fn !== 'function' || fromAudio()) return RT.call(window, fn, ms, ...a);
    const id = ++VT.seq; VT.list.push({ id, at: VT.now + Math.max(0, +ms || 0), fn, a, every: 0 }); return id;
  }
  function vSetInterval(fn, ms, ...a) {
    if (typeof fn !== 'function' || fromAudio()) return RI.call(window, fn, ms, ...a);
    const every = Math.max(4, +ms || 0), id = ++VT.seq; VT.list.push({ id, at: VT.now + every, fn, a, every }); return id;
  }
  function vClear(id) {
    if (typeof id === 'number' && id > 1e9) { const t = VT.list.find((x) => x.id === id); if (t) t.dead = true; return; }
    RC.call(window, id); RCI.call(window, id);
  }
  function vtAdvance(dms) {
    const target = VT.now + dms; let n = 0;
    for (;;) {
      let best = null;
      for (const t of VT.list) if (!t.dead && t.at <= target && (!best || t.at < best.at || (t.at === best.at && t.id < best.id))) best = t;
      if (!best || ++n > 500) break;
      VT.now = Math.max(VT.now, best.at);
      if (best.every) best.at += best.every; else best.dead = true;
      try { best.fn(...best.a); } catch (e) { console.error(e); }
    }
    VT.list = VT.list.filter((t) => !t.dead);
    VT.now = target;
  }
  const vw = (ms) => new Promise((r) => vSetTimeout(r, ms));   // espera con la cinta

  /* ---------------- enganches (solo mientras dura) ---------------- */
  const hooks = [];
  function hook(obj, key, mkFn) { if (!obj || typeof obj[key] !== 'function') return; const orig = obj[key]; hooks.push({ obj, key, orig }); obj[key] = mkFn(orig); }
  function unhookAll() { while (hooks.length) { const h = hooks.pop(); try { h.obj[h.key] = h.orig; } catch (e) {} } }
  const vivo = (s) => VC.on && VC.sess === s && !VC.ending;
  const act = () => { VC.lastAct = VT.now; };

  /* =====================================================================
     SONIDOS PROPIOS (cinta, mecánica del vídeo, avance rápido)
     ===================================================================== */
  const SND = (() => {
    let ac = null, out = null, nb = null, wh = null;
    function ctx() {
      if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); out = ac.createGain(); out.gain.value = 0.6; out.connect(ac.destination); } catch (e) { ac = null; } }
      if (ac && ac.state === 'suspended') { try { ac.resume().catch(() => {}); } catch (e) {} }
      return ac;
    }
    const off = () => { try { return AUDIO.isMuted(); } catch (e) { return false; } };
    function noise() { if (!nb) { nb = ac.createBuffer(1, ac.sampleRate * 1.5 | 0, ac.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } return nb; }
    function env(g, t, a, at, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(a, t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(at + 0.01, dur)); }
    function nz(t, dur, o) {
      const s = ac.createBufferSource(); s.buffer = noise(); s.loop = true;
      const f = ac.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.f || 1000, t); if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + dur); f.Q.value = o.q || 1;
      const g = ac.createGain(); env(g, t, o.a || 0.2, o.at || 0.005, dur);
      s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + dur + 0.05);
    }
    function tone(t, dur, o) {
      const s = ac.createOscillator(); s.type = o.type || 'sine'; s.frequency.setValueAtTime(o.f, t); if (o.f2) s.frequency.exponentialRampToValueAtTime(o.f2, t + dur);
      const g = ac.createGain(); env(g, t, o.a || 0.2, o.at || 0.005, dur);
      let n = s; if (o.lp) { const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.lp; s.connect(f); n = f; }
      n.connect(g); g.connect(out); s.start(t); s.stop(t + dur + 0.05);
    }
    function play(fn) { if (off()) return; const a = ctx(); if (!a) return; try { fn(a.currentTime + 0.02); } catch (e) {} }
    const clunk = (t, k) => { nz(t, 0.035, { type: 'highpass', f: 2400, a: 0.32 * k }); tone(t, 0.09, { type: 'square', f: 150, f2: 60, a: 0.2 * k, lp: 800 }); nz(t + 0.03, 0.08, { type: 'lowpass', f: 260, a: 0.35 * k }); };
    return {
      init: ctx,
      // botón del mando
      clack: () => play((t) => clunk(t, 0.8)),
      // meter la cinta: plástico que roza, golpe, motor que la traga y clic
      insert: () => play((t) => {
        nz(t, 0.42, { f: 1500, f2: 520, q: 0.8, a: 0.16, at: 0.06 });
        clunk(t + 0.44, 1);
        tone(t + 0.62, 1.35, { type: 'sawtooth', f: 58, f2: 92, a: 0.1, at: 0.18, lp: 360 });
        nz(t + 0.62, 1.35, { f: 260, q: 2.2, a: 0.06, at: 0.18 });
        clunk(t + 2.0, 0.7);
      }),
      // expulsar: clic, motor que la escupe, golpe
      eject: () => play((t) => {
        clunk(t, 0.9);
        tone(t + 0.12, 0.7, { type: 'sawtooth', f: 95, f2: 50, a: 0.1, at: 0.08, lp: 360 });
        nz(t + 0.12, 0.7, { f: 300, q: 2, a: 0.06, at: 0.08 });
        clunk(t + 0.82, 1);
      }),
      staticBurst: (d, a) => play((t) => nz(t, d || 0.3, { type: 'highpass', f: 1600, a: a || 0.1, at: 0.01 })),
      track: () => play((t) => { nz(t, 0.2, { f: 3400, q: 0.7, a: 0.035 }); nz(t + 0.05, 0.08, { type: 'highpass', f: 5000, a: 0.03 }); }),
      // avance rápido / rebobinado: zumbido de cabezales y cinta corriendo
      whirr(on, rew) {
        if (!on) {
          if (wh && ac) { const t = ac.currentTime, w = wh; wh = null; try { w.g.gain.cancelScheduledValues(t); w.g.gain.setTargetAtTime(0.0001, t, 0.05); } catch (e) {} rt(() => { try { w.s.stop(); w.o.stop(); w.l.stop(); } catch (e) {} }, 450); }
          return;
        }
        if (wh || off()) return; const a = ctx(); if (!a) return;
        const t = a.currentTime, s = a.createBufferSource(); s.buffer = noise(); s.loop = true;
        const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = rew ? 1900 : 1250; f.Q.value = 1.3;
        const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = rew ? 340 : 230;
        const l = a.createOscillator(); l.frequency.value = rew ? 13 : 9; const lg = a.createGain(); lg.gain.value = 22; l.connect(lg); lg.connect(o.frequency);
        const of = a.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 900; const og = a.createGain(); og.gain.value = 0.22;
        const g = a.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.12);
        s.connect(f); f.connect(g); o.connect(of); of.connect(og); og.connect(g); g.connect(out);
        s.start(t); o.start(t); l.start(t);
        wh = { s, o, l, g };
      },
    };
  })();

  /* =====================================================================
     CSS (solo afecta con body.vc-on, salvo el botón de la portada)
     ===================================================================== */
  const CSS = `
#tbtns{flex-wrap:nowrap}
#tbtns.vc5{gap:16px}
#tbtns.vc5 .gold.big{font-size:29px;padding:16px 24px}
#tVideo{position:relative}
#vcFx{position:absolute;left:0;top:0;width:1600px;height:1000px;pointer-events:none;z-index:62}
#vcLines{position:absolute;inset:0;pointer-events:none;z-index:61;background:repeating-linear-gradient(to bottom,rgba(0,0,0,.12) 0,rgba(0,0,0,.12) 2px,rgba(0,0,0,0) 2px,rgba(0,0,0,0) 4px)}
#vcGlass{position:absolute;inset:0;z-index:58}
.vc-osd{position:absolute;z-index:63;pointer-events:none;font-family:'Press Start 2P',monospace;color:#f2f2f2;font-size:30px;letter-spacing:2px;white-space:nowrap;
  text-shadow:-2px 0 rgba(255,40,90,.75),2px 0 rgba(40,170,255,.75),3px 3px 0 rgba(0,0,0,.6)}
#vcOsd{left:54px;top:44px}
#vcCnt{right:34px;bottom:10px;font-size:20px}
#vcMsg{left:0;right:0;top:400px;text-align:center;font-size:24px;line-height:1.7;white-space:normal;padding:0 140px}
#vcMsg b{display:block;font-size:44px;margin-bottom:22px;font-weight:400}
#vcRemote{position:absolute;left:26px;bottom:16px;z-index:70;display:flex;gap:10px;align-items:center;padding:9px 14px 9px 18px;border-radius:40px;
  background:linear-gradient(#2c2c34,#141418);border:2px solid #474752;box-shadow:0 8px 24px rgba(0,0,0,.6);opacity:.45;transition:opacity .35s}
#vcRemote:hover,#vcRemote.show{opacity:1}
#vcRemote .lbl{font-family:'Press Start 2P',monospace;font-size:11px;color:#9a9aa8;letter-spacing:1px;margin-right:4px}
#vcRemote button{width:66px;height:52px;border-radius:26px;background:linear-gradient(#41414c,#24242b);border:2px solid #5d5d6a;color:#eee;font-size:24px;line-height:1;
  display:flex;align-items:center;justify-content:center;box-shadow:0 3px 0 #0b0b0e}
#vcRemote button.on{background:linear-gradient(#806015,#4a3408);border-color:#ffd98a;color:#fff1c4}
#vcRemote button:active{transform:translateY(2px);box-shadow:none}
#vcHand{position:absolute;left:0;top:0;width:58px;height:72px;z-index:66;pointer-events:none;filter:drop-shadow(3px 6px 4px rgba(0,0,0,.6));transition:opacity .25s}
#vcHand svg{transform-origin:16px 4px;transition:transform .1s}
#vcHand.press svg{transform:scale(.8)}
#vcHand img{position:absolute;left:34px;top:38px;width:70px;height:70px;object-fit:contain;filter:drop-shadow(0 3px 4px rgba(0,0,0,.7))}
#vcHand.off{opacity:0}
.vc-ring{position:absolute;z-index:65;width:24px;height:24px;margin:-12px 0 0 -12px;border:4px solid #ffd98a;border-radius:50%;pointer-events:none;animation:vcring .45s ease-out forwards}
@keyframes vcring{to{transform:scale(4.2);opacity:0}}
body.vc-on #hud{display:none!important}
body.vc-on #dlg{bottom:96px}
body.vc-on #choices{bottom:366px}
body.vc-on .dopts{bottom:100px}
body.vc-on #dtext,body.vc-on #dname,body.vc-on #choices button,body.vc-on #verbs,body.vc-on #toast,body.vc-on .mgbar,body.vc-on .mgbtn,body.vc-on .dopts button,body.vc-on #card p,body.vc-on #label{
  text-shadow:-1.5px 0 rgba(255,40,90,.5),1.5px 0 rgba(40,160,255,.5)}
body.vc-on #card h2{text-shadow:-2px 0 rgba(255,40,90,.6),2px 0 rgba(40,160,255,.6),0 4px 0 #5a3a10,0 0 40px rgba(0,0,0,.9)}
body.vc-paused #stage *,body.vc-paused #stage *::before,body.vc-paused #stage *::after{animation-play-state:paused!important}
.vc-hi{outline:4px solid #ffe28a!important;box-shadow:0 0 28px rgba(255,226,138,.9)!important;background:#4a3a78!important}
/* la carátula y la cinta */
#vcTape{position:absolute;inset:0;z-index:60;overflow:hidden;background:radial-gradient(ellipse at 50% 38%,#221c3a 0%,#08070f 72%)}
#vcTape .ban{position:absolute;top:40px;left:0;right:0;text-align:center;font-family:'Press Start 2P',monospace;font-size:22px;letter-spacing:3px;color:#ffd98a;
  text-shadow:-2px 0 rgba(255,40,90,.7),2px 0 rgba(40,170,255,.7);animation:vcIn .6s ease both}
#vcTape .slv{position:absolute;left:50%;top:96px;width:470px;height:690px;margin-left:-235px;background:#0c0b14;border:5px solid #17151f;border-radius:6px;
  box-shadow:0 30px 90px rgba(0,0,0,.85),inset 0 0 0 2px rgba(255,217,138,.25);overflow:hidden;animation:vcSleeve 2.3s ease both}
#vcTape .art{position:absolute;left:0;right:0;top:0;height:440px;background-size:cover;background-position:50% 40%}
#vcTape .art::after{content:"";position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,0) 55%,#0c0b14 100%)}
#vcTape .stk{position:absolute;right:-8px;top:26px;transform:rotate(8deg);background:#e8322f;color:#fff;font-family:'Press Start 2P',monospace;font-size:12px;line-height:1.5;
  padding:8px 18px 8px 14px;border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,.6);text-align:center}
#vcTape .tt{position:absolute;left:0;right:0;top:420px;text-align:center;font-family:'Cinzel',serif;font-weight:800;font-size:46px;line-height:1.05;color:#ffd98a;
  text-shadow:0 4px 0 #5a3a10,0 0 30px rgba(0,0,0,.9)}
#vcTape .st{position:absolute;left:0;right:0;top:530px;text-align:center;font-family:'Patrick Hand',cursive;font-size:34px;color:#fff6e0}
#vcTape .ft{position:absolute;left:18px;right:18px;bottom:16px;display:flex;align-items:center;justify-content:space-between;font-family:'Nunito',sans-serif;font-weight:800;font-size:15px;color:#cbbd9a}
#vcTape .ft b{font-family:'Press Start 2P',monospace;font-size:26px;color:#fff;padding:6px 8px;border:3px solid #fff;border-radius:6px;font-style:italic}
#vcTape .ft i{font-style:normal;width:44px;height:44px;border-radius:50%;background:#c8202b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;border:3px solid #fff}
#vcTape .cas{position:absolute;left:50%;top:300px;width:440px;height:262px;margin-left:-220px;border-radius:10px;background:linear-gradient(#2a2a33,#121217);
  border:3px solid #3a3a45;box-shadow:0 20px 50px rgba(0,0,0,.7);opacity:0;animation:vcCass 1.55s ease-in 1.75s both}
#vcTape .cas .lab{position:absolute;left:34px;right:34px;top:18px;height:74px;background:#f4efe2;border-radius:4px;color:#25305a;text-align:center;
  font-family:'Patrick Hand',cursive;font-size:30px;line-height:74px}
#vcTape .cas .lab::before{content:"VHS";position:absolute;left:10px;top:0;font-family:'Press Start 2P',monospace;font-size:11px;color:#c8202b;line-height:24px}
#vcTape .cas .win{position:absolute;left:96px;right:96px;top:118px;height:92px;border-radius:8px;background:#06060a;border:3px solid #444;display:flex;justify-content:space-around;align-items:center}
#vcTape .cas .win i{width:70px;height:70px;border-radius:50%;background:radial-gradient(circle,#ddd 0 10px,#111 11px 22px,#3a2a20 23px);border:3px solid #666;animation:vcReel 1s linear infinite}
#vcTape .vcr{position:absolute;left:50%;bottom:-6px;width:960px;height:190px;margin-left:-480px;border-radius:16px 16px 0 0;background:linear-gradient(#2e2e36,#17171c);
  border:3px solid #41414c;box-shadow:0 -10px 40px rgba(0,0,0,.6);animation:vcVcr .7s ease 1.3s both}
#vcTape .vcr .mouth{position:absolute;left:250px;width:460px;top:26px;height:44px;border-radius:6px;background:#050507;border:3px solid #55555f}
#vcTape .vcr .led{position:absolute;right:46px;top:30px;font-family:'Press Start 2P',monospace;font-size:20px;color:#3dff7a;text-shadow:0 0 10px #3dff7a;animation:vcBlink 1s steps(2) infinite}
#vcTape .vcr .brand{position:absolute;left:40px;top:34px;font-family:'Cinzel',serif;font-weight:800;font-size:22px;color:#9a9aa8;letter-spacing:4px}
#vcTape .vcr .btns{position:absolute;left:250px;top:100px;display:flex;gap:16px}
#vcTape .vcr .btns span{width:62px;height:24px;border-radius:5px;background:#2a2a31;border:2px solid #4a4a55}
#vcTape .blue{position:absolute;inset:0;background:#1a2ad6;display:none;font-family:'Press Start 2P',monospace;color:#fff;text-shadow:3px 3px 0 rgba(0,0,0,.35)}
#vcTape .blue.on{display:block}
#vcTape .blue p{position:absolute;left:70px;top:60px;font-size:40px}
#vcTape .blue em{position:absolute;right:70px;top:60px;font-size:28px;font-style:normal}
#vcTape .blue small{position:absolute;left:0;right:0;bottom:120px;text-align:center;font-size:20px;line-height:1.8;opacity:.9}
@keyframes vcIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
@keyframes vcSleeve{0%{opacity:0;transform:translateY(40px) scale(.9) rotate(-3deg)}16%{opacity:1;transform:none}72%{opacity:1;transform:none}100%{opacity:0;transform:translateX(-640px) rotate(-14deg)}}
@keyframes vcCass{0%{opacity:0;transform:translateY(-30px) scale(.96)}22%{opacity:1;transform:none}48%{opacity:1;transform:none}100%{opacity:1;transform:translateY(390px) scale(.92)}}
@keyframes vcVcr{from{transform:translateY(210px)}to{transform:none}}
@keyframes vcReel{to{transform:rotate(360deg)}}
@keyframes vcBlink{50%{opacity:.3}}
/* el final: pantalla azul del videoclub */
#vcEnd{position:absolute;inset:0;z-index:60;background:#1a2ad6;font-family:'Press Start 2P',monospace;color:#fff;text-align:center;text-shadow:3px 3px 0 rgba(0,0,0,.35)}
#vcEnd h3{position:absolute;left:0;right:0;top:120px;font-size:34px;font-weight:400;letter-spacing:3px;color:#ffe9a8}
#vcEnd .g{position:absolute;left:0;right:0;top:220px;font-size:20px;line-height:1.9;opacity:.92}
#vcEnd .j{position:absolute;left:140px;right:140px;top:430px;font-size:30px;line-height:1.75;padding:34px 20px;border:4px solid #fff;background:rgba(0,0,40,.25)}
#vcEnd .f{position:absolute;left:0;right:0;bottom:120px;font-size:16px;opacity:.75;letter-spacing:2px}
`;

  /* =====================================================================
     EL BOTÓN DE LA PORTADA
     ===================================================================== */
  function boton() {
    if (!$('vcCss')) { const s = document.createElement('style'); s.id = 'vcCss'; s.textContent = CSS; document.head.appendChild(s); }
    const tb = $('tbtns'); if (!tb || $('tVideo')) return;
    const b = document.createElement('button'); b.id = 'tVideo'; b.className = 'gold big'; b.innerHTML = '📼 Videoclub';
    b.title = 'La partida se juega sola, como una película';
    b.onclick = (e) => { e.stopPropagation(); start(); };
    tb.appendChild(b); tb.classList.add('vc5');
  }

  /* =====================================================================
     PIEZAS EN PANTALLA: efecto, letreros, mando, mano y cristal
     ===================================================================== */
  const UI = {};
  function montar() {
    const st = ST();
    const add = (tag, id, html) => { const e = document.createElement(tag); e.id = id; if (html) e.innerHTML = html; st.appendChild(e); UI[id] = e; return e; };
    add('div', 'vcGlass').addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); mostrarMando(); });
    ['pointermove', 'pointerup', 'pointercancel', 'click'].forEach((ev) => UI.vcGlass.addEventListener(ev, (e) => e.stopPropagation()));
    const fx = add('canvas', 'vcFx'); fx.width = W / 2; fx.height = H / 2;
    add('div', 'vcLines');
    add('div', 'vcOsd').className = 'vc-osd';
    add('div', 'vcCnt').className = 'vc-osd';
    add('div', 'vcMsg').className = 'vc-osd';
    add('div', 'vcHand', `<svg viewBox="0 0 48 60" width="58" height="72"><path d="M16 3.5c2.8 0 4.7 2 4.7 4.8v17.4l1.1-.4V21.7c0-2.5 1.8-4.2 4.2-4.2s4.2 1.7 4.2 4.2v3.6l.9-.2c.4-2.2 2-3.5 4.1-3.5 2.3 0 4 1.7 4 4.1v3.3c.5-1.4 1.9-2.4 3.6-2.4 2.2 0 3.8 1.7 3.8 4v11.2c0 8.8-6.6 15.6-15.6 15.6h-4.8c-5.6 0-9.3-2.4-12.6-7.2L5.1 39.3c-1.3-1.9-.9-4.3.9-5.6 1.8-1.3 4.2-1 5.6.7l1 1.2V8.3c0-2.8 1-4.8 3.4-4.8z" fill="#fff" stroke="#1a1208" stroke-width="2.6" stroke-linejoin="round"/><path d="M21 27v8M30 26v8M39 29.5v6" stroke="#1a1208" stroke-width="2" stroke-linecap="round" fill="none"/></svg><img alt="" style="display:none">`);
    UI.vcHand.classList.add('off');
    const r = add('div', 'vcRemote', `<span class="lbl">VHS</span><button id="vcPlay" title="Pausa (espacio)">⏸</button><button id="vcFf" title="Avance rápido (→)">⏩</button><button id="vcEj" title="Expulsar (Esc)">⏏</button>`);
    const stopAll = (e) => { e.stopPropagation(); e.preventDefault(); };
    ['pointermove', 'pointerup', 'pointercancel', 'click'].forEach((ev) => r.addEventListener(ev, (e) => e.stopPropagation()));
    $('vcPlay').onpointerdown = (e) => { stopAll(e); mostrarMando(); setPause(!VC.paused); };
    $('vcFf').onpointerdown = (e) => { stopAll(e); mostrarMando(); ffDown(); };
    $('vcFf').onpointerup = (e) => { e.stopPropagation(); ffUp(); };
    $('vcEj').onpointerdown = (e) => { stopAll(e); expulsar(); };
    r.style.display = 'none'; UI.vcOsd.style.display = UI.vcCnt.style.display = 'none';
    fxPrep();
  }
  function desmontar() {
    ['vcGlass', 'vcFx', 'vcLines', 'vcOsd', 'vcCnt', 'vcMsg', 'vcHand', 'vcRemote', 'vcTape', 'vcEnd'].forEach((id) => { const e = $(id); if (e) e.remove(); delete UI[id]; });
    document.querySelectorAll('.vc-ring').forEach((e) => e.remove());
  }
  let mandoT = 0;
  function mostrarMando() { const r = UI.vcRemote; if (!r) return; r.classList.add('show'); clearTimeout(mandoT); mandoT = rt(() => r.classList.remove('show'), 2600); }
  function osd() {
    if (!UI.vcOsd) return;
    let t = 'PLAY ▶';
    if (VC.rew) t = '◀◀ REBOBINANDO'; else if (VC.paused) t = 'PAUSA ❚❚'; else if (VC.ffUser || VC.ffAuto) t = '▶▶ ×3';
    if (UI.vcOsd.textContent !== t) UI.vcOsd.textContent = t;
    const b = $('vcPlay'); if (b) { b.textContent = VC.paused ? '▶' : '⏸'; b.classList.toggle('on', VC.paused); }
    const f = $('vcFf'); if (f) f.classList.toggle('on', !!(VC.ffUser || VC.ffAuto));
  }
  function contador() {
    if (!UI.vcCnt) return;
    const s = Math.max(0, Math.floor(VC.tape / 1000)), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60;
    const t = `SP ${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
    if (UI.vcCnt.textContent !== t) UI.vcCnt.textContent = t;
  }
  function mensaje(html) { if (!UI.vcMsg) return; UI.vcMsg.innerHTML = html || ''; }

  /* ---------------- el mando ---------------- */
  function setPause(on) {
    if (!VC.on || VC.rew || VC.paused === on) return;
    VC.paused = on; SND.clack(); SND.whirr(false);
    document.body.classList.toggle('vc-paused', on);
    try { if (VC.gctx) { if (on) VC.gctx.suspend(); else VC.gctx.resume(); } } catch (e) {}
    try { if (!VC.gctx) AUDIO.duck(on); } catch (e) {}
    VC.pauseT = performance.now(); VC.palomitas = false; if (!on) mensaje('');
    if (!on && (VC.ffUser || VC.ffAuto === 'salto')) SND.whirr(true);
    osd();
  }
  function setFF(on) {
    if (!VC.on || VC.rew) return;
    if (VC.paused) setPause(false);
    if (VC.ffUser === on) return;
    VC.ffUser = on; SND.clack();
    SND.whirr(on || VC.ffAuto === 'salto');
    osd();
  }
  function ffDown() { if (VC.ffUser) { setFF(false); VC.ffPress = 0; } else { setFF(true); VC.ffPress = performance.now(); } }
  function ffUp() { if (VC.ffPress && performance.now() - VC.ffPress > 450) setFF(false); VC.ffPress = 0; }
  function autoFF(kind) {
    if (VC.ffAuto === kind) return;
    VC.ffAuto = kind;
    SND.whirr(!!(VC.ffUser || kind === 'salto') && !VC.paused);
    osd();
  }
  addEventListener('keydown', (e) => {
    if (!VC.on) return;
    e.stopImmediatePropagation();
    if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'k') { e.preventDefault(); if (!e.repeat) { mostrarMando(); setPause(!VC.paused); } }
    else if (e.key === 'ArrowRight') { e.preventDefault(); if (!e.repeat) { mostrarMando(); ffDown(); } }
    else if (e.key === 'Escape') { e.preventDefault(); expulsar(); }
  }, true);
  addEventListener('keyup', (e) => { if (!VC.on) return; e.stopImmediatePropagation(); if (e.key === 'ArrowRight') ffUp(); }, true);

  /* =====================================================================
     EL EFECTO VHS
     ===================================================================== */
  let RAW, RX, CR, CRX, CB, CBX, FX, PATS = [], perfN = 0, perfT = 0;
  const band = { on: false, next: 0, y: 0, h: 0, v: 0, amp: 0 };
  let rollY = 0, jx = 0, jy = 0, glitch = 0, lastReal = 0;
  function noiseTile(w, h, dens, alpha) {
    const c = mk(w, h), x = c.getContext('2d'), im = x.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) {
      let run = 0, v = 0, a = 0;
      for (let i = 0; i < w; i++) {
        if (run <= 0) { run = 1 + (Math.random() * 6 | 0); if (Math.random() < dens) { v = 120 + (Math.random() * 135 | 0); a = Math.random() * alpha | 0; } else a = 0; }
        run--; const k = (y * w + i) * 4; d[k] = d[k + 1] = d[k + 2] = v; d[k + 3] = a;
      }
    }
    x.putImageData(im, 0, 0); return c;
  }
  function fxPrep() {
    FX = UI.vcFx.getContext('2d');
    if (!PATS.length) for (let i = 0; i < 3; i++) PATS.push(noiseTile(256, 160, 0.16, 90));
    if (!PATS.heavy) PATS.heavy = noiseTile(256, 64, 0.65, 230);
    if (!RAW) { RAW = mk(W, H); RX = RAW.getContext('2d'); CR = mk(W / 2, H / 2); CRX = CR.getContext('2d'); CB = mk(W / 2, H / 2); CBX = CB.getContext('2d'); }
    band.next = performance.now() + 5000 + Math.random() * 6000;
  }
  // el lienzo del juego: color corrido (rojo a un lado, azul al otro) y franjas
  function vhsPass(fresh) {
    if (!RAW) return;
    const t0 = performance.now();
    if (fresh) { RX.globalCompositeOperation = 'copy'; RX.drawImage(cv, 0, 0); RX.globalCompositeOperation = 'source-over'; }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
    if (!fresh) { ctx.globalCompositeOperation = 'copy'; ctx.drawImage(RAW, 0, 0); ctx.globalCompositeOperation = 'source-over'; }
    if (!VC.lite) {
      const dx = (VC.ffUser || VC.ffAuto || VC.rew ? 4.2 : 2.4) + (glitch > 0 ? 4 : 0);
      for (const [cx, col] of [[CRX, '#ff0000'], [CBX, '#0000ff']]) {
        cx.globalCompositeOperation = 'copy'; cx.drawImage(RAW, 0, 0, W / 2, H / 2);
        cx.globalCompositeOperation = 'multiply'; cx.fillStyle = col; cx.fillRect(0, 0, W / 2, H / 2); cx.globalCompositeOperation = 'source-over';
      }
      ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = '#00ff00'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(CR, dx, 0, W, H); ctx.drawImage(CB, -dx, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }
    // la franja de tracking: la imagen se descuadra a tiras
    if (band.on) {
      const n = 5, sh = band.h / n;
      for (let s = 0; s < n; s++) { const sy = band.y + s * sh; if (sy + sh < 0 || sy > H) continue; ctx.drawImage(RAW, 0, sy, W, sh, (Math.random() * 2 - 1) * band.amp, sy, W, sh); }
    }
    // en avance rápido o rebobinando, tiras sueltas que se desplazan
    if (VC.ffUser || VC.ffAuto || VC.rew || glitch > 0) {
      const k = glitch > 0 ? 2 : 4;
      for (let i = 0; i < k; i++) { const sy = Math.random() * H, sh = 4 + Math.random() * 18; ctx.drawImage(RAW, 0, sy, W, sh, (Math.random() * 2 - 1) * 26, sy, W, sh); }
    }
    ctx.restore();
    const dt = performance.now() - t0; perfT += dt; perfN++;
    if (perfN >= 120) { if (!VC.forceFx && perfT / perfN > 14) VC.lite = true; perfT = 0; perfN = 0; }
  }
  // la capa de encima (también tapa los cuadros de texto): ruido, franjas, barras
  function fxOverlay(now, dtReal) {
    if (!FX) return;
    const w = W / 2, h = H / 2, ff = !!(VC.ffUser || VC.ffAuto || VC.rew);
    FX.setTransform(1, 0, 0, 1, 0, 0); FX.clearRect(0, 0, w, h);
    // grano de cinta
    FX.save(); FX.globalAlpha = VC.paused ? 0.75 : 0.5;
    FX.fillStyle = FX.createPattern(PATS[(Math.random() * PATS.length) | 0], 'repeat');
    FX.translate(-Math.random() * 256, -Math.random() * 160); FX.fillRect(0, 0, w + 256, h + 160); FX.restore();
    // la barra suave que baja (hum de la tele)
    rollY = (rollY + dtReal * 0.035) % (h + 120);
    const g = FX.createLinearGradient(0, rollY - 120, 0, rollY);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(255,255,255,.035)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    FX.fillStyle = g; FX.fillRect(0, rollY - 120, w, 120);
    // franja de tracking
    if (!VC.paused && !band.on && now > band.next) {
      band.on = true; band.h = 40 + Math.random() * 80; band.v = (Math.random() < 0.5 ? 1 : -1) * (520 + Math.random() * 400);
      band.y = band.v > 0 ? -band.h : H; band.amp = 6 + Math.random() * 12;
      if (Math.random() < 0.6) SND.track();
    }
    if (band.on) {
      if (!VC.paused) band.y += band.v * dtReal / 1000;
      if (band.y > H + 10 || band.y < -band.h - 10) { band.on = false; band.next = now + 9000 + Math.random() * 13000; }
      else pintaBanda(band.y / 2, band.h / 2, 0.85);
    }
    // avance rápido: dos barras de ruido que corren
    if (ff) {
      const sp = VC.rew ? -1 : 1;
      for (let i = 0; i < 2; i++) { const y = (((now * 0.42 * sp + i * h * 0.55) % (h + 40)) + h + 40) % (h + 40) - 20; pintaBanda(y, 12 + i * 6, 1); }
    }
    // pausa: la barra quieta que tiembla abajo
    if (VC.paused) pintaBanda(372 + Math.random() * 3, 10, 1);
    // alguna raya blanca suelta
    if (Math.random() < (ff ? 0.4 : 0.06)) { FX.fillStyle = 'rgba(255,255,255,' + (0.2 + Math.random() * 0.4) + ')'; FX.fillRect(Math.random() * w, Math.random() * h, 20 + Math.random() * 160, 1); }
  }
  function pintaBanda(y, bh, a) {
    FX.save(); FX.beginPath(); FX.rect(0, y, W / 2, bh); FX.clip();
    FX.fillStyle = 'rgba(200,200,215,' + 0.08 * a + ')'; FX.fillRect(0, y, W / 2, bh);
    FX.globalAlpha = a; FX.fillStyle = FX.createPattern(PATS.heavy, 'repeat');
    FX.translate(-Math.random() * 256, y - Math.random() * 64); FX.fillRect(0, 0, W / 2 + 256, bh + 64);
    FX.restore();
    for (let i = 0; i < 6; i++) { FX.fillStyle = 'rgba(255,255,255,' + (0.15 + Math.random() * 0.5) + ')'; FX.fillRect(Math.random() * W / 2, y + Math.random() * bh, 10 + Math.random() * 120, 1); }
  }
  // temblor suave de la imagen (y fuerte en pausa)
  function temblor() {
    if (VC.paused) { jx = 0; jy = (Math.random() < 0.5 ? -1 : 1) * (1 + Math.random()); }
    else {
      if (Math.random() < 0.1) { jx = (Math.random() * 2 - 1) * 0.9; jy = (Math.random() * 2 - 1) * 0.6; }
      if (Math.random() < 0.004) { glitch = 2; jx = (Math.random() * 2 - 1) * 4; }
      if (VC.ffUser || VC.ffAuto || VC.rew) jy = (Math.random() * 2 - 1) * 1.6;
    }
    glitch = Math.max(0, glitch - 1);
    cv.style.transform = `translate(${jx.toFixed(2)}px,${jy.toFixed(2)}px) scale(1.004)`;
  }

  /* =====================================================================
     EL BUCLE: reloj de la cinta + dibujo del juego + VHS por encima
     ===================================================================== */
  let ORIG_FRAME = null, vfms = 0;
  function vcFrame(ms) {
    if (!VC.on || !ORIG_FRAME) return (ORIG_FRAME || window.frame)(ms);
    const d = Math.min(100, Math.max(0, ms - (lastReal || ms))); lastReal = ms;
    const sp = VC.paused ? 0 : (VC.ffUser || VC.ffAuto ? 3 : 1) * VC.k;
    const dv = d * sp;
    if (sp > 0) {
      if (!VC.rew && VC.playing) { VC.tape += dv; VC.wall += d * VC.k; }   // wall: lo que duraría sin avance rápido (para medir)
      vtAdvance(dv);
      try { ticks(dv / 1000); } catch (e) { console.warn('[Videoclub]', e); }
      if (dv > 50) pasos(dv / 1000 - 0.05);
      vfms += dv;
      ORIG_FRAME(vfms);                       // pinta el juego y pide el siguiente fotograma
      try { vhsPass(true); } catch (e) {}
    } else {
      requestAnimationFrame(frame);
      try { vhsPass(false); } catch (e) {}
      // en pausa el vídeo no deja sonar nada; si algo lo despierta, se vuelve a dormir
      try { if (VC.gctx && VC.gctx.state === 'running' && performance.now() - VC.pauseT > 300) VC.gctx.suspend(); } catch (e) {}
      if (!VC.palomitas && performance.now() - VC.pauseT > 8000) { VC.palomitas = true; mensaje(JOKE.palomitas); }
    }
    try { temblor(); fxOverlay(performance.now(), d); osd(); contador(); } catch (e) {}
  }
  // tiempo de juego extra sin pintar (para el ×3 en ordenadores lentos y para las pruebas)
  function pasos(sec) {
    let n = 0;
    while (sec > 0.0005 && n++ < 16) {
      const s = Math.min(0.05, sec); sec -= s;
      G.t += s; G.dt = s;
      try { updTweens(); updParticles(s); if (G.mode && G.mode.update) G.mode.update(s); } catch (e) { console.warn('[Videoclub]', e); }
      if (G.fade !== G.fadeTo) { const f = G.fadeSpeed * s; G.fade = G.fade < G.fadeTo ? Math.min(G.fadeTo, G.fade + f) : Math.max(G.fadeTo, G.fade - f); }
      if (G.flashA > 0) G.flashA = Math.max(0, G.flashA - s * 2.5);
      if (G.shake > 0) G.shake = Math.max(0, G.shake - s * 2);
    }
  }
  // lo que va con la cinta en cada fotograma
  function ticks(dt) {
    mano.update(dt);
    if (VC.drv) VC.drv(dt);
    // los créditos: las fotos del medio, en avance rápido
    const m = G.mode;
    if (m && m.items && m.T && 'collage' in m) {
      act();
      const [T0, , T2] = m.T, want = m.clock > T0 + (m.per || 10) * 1.05 && m.clock < T2 - 0.6;
      m.hold = want; if (want) m.holdT = -99;
      if (want && VC.ffAuto !== 'cred') autoFF('cred');
      else if (!want && VC.ffAuto === 'cred') autoFF(false);
    } else if (VC.ffAuto === 'cred') autoFF(false);
    // en la cripta, la luz va donde señala la mano
    if (mano.vis && G.scene && G.scene.oscuro && typeof LUZ !== 'undefined') LUZ.mover({ x: mano.x, y: mano.y + 30 });
    // si algo se queda colgado, la película sigue igual (se acaba)
    if (!VC.ending && VC.playing && VT.now - (VC.lastAct || 0) > 150000) { VC.errs.push('atasco'); console.warn('[Videoclub] atasco: fin de la cinta'); outro(); }
  }

  /* =====================================================================
     LA MANO QUE SEÑALA
     ===================================================================== */
  const mano = {
    x: 1700, y: 1100, vis: false, an: null, idle: 0,
    el() { return UI.vcHand; },
    put(x, y) { this.x = x; this.y = y; const e = this.el(); if (e) { e.style.left = (x - 16) + 'px'; e.style.top = (y - 4) + 'px'; } },
    show(on) { this.vis = on; const e = this.el(); if (e) e.classList.toggle('off', !on); },
    go(p, dur) {
      if (this.an) { this.an.res(); this.an = null; }
      if (!this.vis) { this.put(clamp(p.x + 260, 40, W - 40), clamp(p.y + 220, 60, H - 30)); this.show(true); }
      const dist = Math.hypot(p.x - this.x, p.y - this.y);
      return new Promise((res) => { this.an = { fx: this.x, fy: this.y, tx: p.x, ty: p.y, t: 0, d: dur || clamp(dist / 1500, 0.22, 0.75), res }; });
    },
    update(dt) {
      const a = this.an;
      if (a) { a.t += dt; const k = ease(clamp(a.t / a.d, 0, 1)); this.put(a.fx + (a.tx - a.fx) * k, a.fy + (a.ty - a.fy) * k); if (a.t >= a.d) { this.an = null; a.res(); } this.idle = 0; }
      else if (this.vis) { this.idle += dt; if (this.idle > 2.6 && !this.keep) this.show(false); }
    },
    async tap(quiet) {
      const e = this.el(); this.idle = 0; if (!e) return;
      e.classList.add('press');
      const r = document.createElement('div'); r.className = 'vc-ring'; r.style.left = this.x + 'px'; r.style.top = this.y + 'px'; ST().appendChild(r); rt(() => r.remove(), 600);
      if (!quiet) sfx('tap');
      await vw(130); e.classList.remove('press'); await vw(90);
    },
    item(id) {
      const e = this.el(); if (!e) return; const im = e.querySelector('img');
      if (id && typeof ITEMS !== 'undefined' && ITEMS[id]) { im.src = 'img/items/' + ITEMS[id].img + '.webp'; im.style.display = ''; } else im.style.display = 'none';
    },
    async a(el) { if (!el) return; await this.go(elPt(el)); await vw(120); },
  };
  function elPt(el) { const r = el.getBoundingClientRect(); return { x: (r.left + r.width / 2 - G.offX) / G.scale, y: (r.top + r.height / 2 - G.offY) / G.scale }; }
  function etiqueta(txt, p) {
    const l = $('label'); if (!l) return;
    if (!txt) { l.classList.add('hidden'); return; }
    l.textContent = txt; l.style.left = p.x + 'px'; l.style.top = p.y + 'px'; l.classList.remove('hidden');
  }

  /* =====================================================================
     LOS GESTOS DEL JUGADOR FANTASMA
     ===================================================================== */
  const actorPt = (id) => { const a = G.actors[id], bb = a && actorBox(a); return bb ? { x: a.x, y: bb.y + bb.h * 0.32 } : { x: W / 2, y: 500 }; };
  const rectPt = (r) => ({ x: r[0] + r[2] / 2, y: r[1] + Math.min(r[3] / 2, 170) });
  const verbos = (obj) => Object.keys(obj || {}).filter((k) => k !== 'name').map((k) => ({ k, v: k.split('|')[0], label: k.split('|')[1] || k.split('|')[0] }));
  async function menu(p, title, list, elegido) {
    try {
      openVerbs(p, title, list.map((o) => ({ v: o.v, label: o.label, fn: async () => {} })));
      await vw(380);
      const bs = [...$('verbs').querySelectorAll('button')];
      const b = bs.find((x) => x.textContent.includes(elegido.label)) || bs[0];
      if (b) { await mano.a(b); b.classList.add('vc-hi'); await vw(220); await mano.tap(true); sfx('click'); }
    } catch (e) { console.warn('[Videoclub] menú', e); }
    closeMenus();
  }
  // tocar a alguien para jugar con él
  async function como(id) {
    if (!S || S.active === id || !G.actors[id]) { if (S) S.active = id; return; }
    const p = actorPt(id);
    await mano.go(p); etiqueta('Jugar con ' + NAMES[id], p); await vw(320); await mano.tap(); etiqueta(null);
    S.active = id; hopA(id); updParty(); await vw(150);
  }
  // una zona de la escena: tocarla, elegir el verbo y hacerlo
  async function zona(name, verb, want) {
    const h = visHotspots().find((x) => x.name === name) || (G.scene && (G.scene.hs || []).find((x) => x.name === name));
    if (!h) throw new Error('no está la zona «' + name + '»');
    const p = rectPt(h.r), vs = verbos(h.verbs);
    const el = vs.find((o) => o.v === verb) || vs[0];
    await mano.go(p); etiqueta(name, p); await vw(320); await mano.tap(); etiqueta(null);
    const list = vs.slice(); if (S.inv.length) list.push({ v: 'Usar', label: 'Usar objeto…' });
    await menu(p, h.name, list, el);
    VC.want = want || null; act();
    try { await h.verbs[el.k](); } finally { VC.want = null; }
  }
  // un objeto suelto de la escena (el candelabro de la bodega)
  async function coger(img, verb) {
    const pr = G.props.find((x) => x.img === img && x.hs && (!x.cond || x.cond()));
    if (!pr) throw new Error('no está «' + img + '»');
    const p = { x: pr.x, y: pr.y - pr.h * 0.55 }, vs = verbos(pr.hs.verbs), el = vs.find((o) => o.v === (verb || 'Coger')) || vs[0];
    await mano.go(p); etiqueta(pr.hs.name, p); await vw(320); await mano.tap(); etiqueta(null);
    await menu(p, pr.hs.name, vs, el);
    await pr.hs.verbs[el.k]();
  }
  // hablar (o lo que sea) con alguien
  async function hablar(id, fn, want, verb) {
    const def = (G.scene && G.scene.npc && G.scene.npc[id]) || null, p = actorPt(id), name = (def && def.name) || NAMES[id];
    await mano.go(p); etiqueta(name, p); await vw(320); await mano.tap(); etiqueta(null);
    VC.want = want || null; act();
    try { await fn(); } finally { VC.want = null; }
  }
  // usar un objeto de la bolsa con algo
  async function usar(item, p, nombre, fn) {
    mano.item(item); mano.keep = true;
    await mano.go({ x: p.x, y: p.y });
    etiqueta('Usar ' + itemName(item) + ' con ' + nombre, p); await vw(520); await mano.tap(); etiqueta(null);
    mano.item(null); mano.keep = false; act();
    await fn();
  }
  // salir por una flecha
  async function salida(key) {
    const e = visExits().find((x) => x.to === key || x.name === key);
    if (!e) throw new Error('no está la salida «' + key + '»');
    const p = rectPt(e.r);
    await mano.go(p); etiqueta('➜ ' + e.name, p); await vw(320); await mano.tap(); etiqueta(null); mano.show(false);
    act(); await exitTo(e);
  }
  // salto de montaje: ir a otro sitio en avance rápido
  async function salto(id) {
    mano.show(false); autoFF('salto'); SND.staticBurst(0.25, 0.08);
    try { await goScene(id); } finally { autoFF(false); }
  }
  // un personaje mira a cámara (zoom a su cara) y le habla al del sofá
  async function aCamara(id, txt, mood) {
    const a = G.actors[id], bb = a && actorBox(a);
    if (bb) {
      const z = 1.5, cx = clamp(a.x, W / 2 / z, W - W / 2 / z), cy = clamp(bb.y + bb.h * 0.28, H / 2 / z, H - H / 2 / z);
      G.camX = W / 2; G.camY = H / 2; G.camZoom = 1.0001;
      SND.staticBurst(0.12, 0.05);
      await tween(G, { camZoom: z, camX: cx, camY: cy }, 0.8);
    }
    await say(id, txt, mood);
    if (bb) { await tween(G, { camZoom: 1, camX: W / 2, camY: H / 2 }, 0.6); G.camZoom = 1; }
  }

  /* =====================================================================
     DIÁLOGOS Y ELECCIONES SOLOS
     ===================================================================== */
  function elige(list) {
    const sobrio = list.find((o) => /^🥤/.test(o.t || ''));   // Marcos conduce: en la peli no bebe
    if (sobrio) return sobrio;
    if (VC.want) for (const w of VC.want) { const f = list.find((o) => o.v === w || o.t === w); if (f) return f; }
    return list[0];
  }
  function sayHook(orig) {
    return function (who, text, mood, op) {
      if (!VC.on) return orig.apply(this, arguments);
      act();
      if (typeof text === 'string' && SKIP.some((r) => r.test(text))) return Promise.resolve();
      op = Object.assign({}, op || {});
      if (!op.noWait) {
        // tiempo de lectura: 0,9 s + 45 ms por letra, contando desde que empieza a escribirse
        const t0 = VT.now, need = 900 + 45 * letras(text);
        Object.defineProperty(op, 'auto', { configurable: true, enumerable: true, get: () => Math.max(450, t0 + need - VT.now) });
      }
      return orig.call(this, who, text, mood, op);
    };
  }
  function chooseHook(orig) {
    return async function (opts, prompt) {
      if (!VC.on) return orig.apply(this, arguments);
      act();
      const s = VC.sess, list = opts.filter((o) => !o.cond || o.cond()), idx = Math.max(0, list.indexOf(elige(list)));
      const p = orig.call(this, opts, prompt);
      const box = $('choices');
      for (let i = 0; i < 400 && (box.classList.contains('hidden') || !box.children.length); i++) { await vw(50); if (!vivo(s)) return p; }
      const chars = list.reduce((n, o) => n + letras(o.t), 0);
      await vw(clamp(600 + chars * 12, 1000, 2400));
      const b = box.children[idx] || box.children[0];
      if (b && vivo(s) && !box.classList.contains('hidden')) {
        await mano.a(b); b.classList.add('vc-hi'); await vw(320); await mano.tap(true);
        if (vivo(s)) b.click();
      }
      act();
      return p;
    };
  }

  /* =====================================================================
     MINIJUEGOS: se juegan solos (o avance rápido), siempre con tope
     ===================================================================== */
  function pulsa(b) { try { if (b && b.onpointerdown) b.onpointerdown({ stopPropagation() {}, preventDefault() {}, pointerId: 1 }); } catch (e) { console.warn(e); } }
  const visible = (b) => b && b.isConnected && !b.classList.contains('hidden') && b.style.display !== 'none';
  // pone el piloto automático a un minijuego: drv(dt) cada fotograma y un tope de tiempo con resultado bueno
  function piloto(m, s, tope, bueno, drv) {
    let t = 0;
    if (VC.montaje) autoFF(false);   // los minijuegos, siempre a velocidad normal
    VC.drv = (dt) => {
      if (!vivo(s) || G.mode !== m) { if (VC.drv && G.mode !== m) VC.drv = null; return; }
      t += dt; act();
      try { drv && drv(dt, t); } catch (e) { console.warn('[Videoclub] piloto', e); }
      if (t > tope && m.end && !m.done) { VC.errs.push('tope ' + (m.name || '?')); m.end(typeof bueno === 'function' ? bueno() : bueno); }
    };
  }
  const finMG = () => { mano.keep = false; VC.drv = null; if (VC.montaje && VC.on && !VC.ending) autoFF('salto'); };
  function mgHooks() {
    // CHUPITOS: los tres beben; Marcos tira el suyo al jarrón cuando la señora está distraída
    hook(MG, 'chupitos', (orig) => function () {
      if (!VC.on) return orig.apply(this, arguments);
      const s = VC.sess, p = orig.apply(this, arguments), m = G.mode;
      if (!m || !m.draw) return p;
      const st = { look: 1, distT: 0, jv: false, rt: 0, busy: false, ronda: 0, tossed: 0, m0: S.drunk.marcos };
      const od = m.draw;
      m.draw = function (c, t) {
        let txt = ''; const ft = c.fillText;
        c.fillText = function (x, ...r) { if (typeof x === 'string') txt += x + '|'; return ft.call(this, x, ...r); };
        try { od.call(this, c, t); } finally { delete c.fillText; }
        st.look = /TE ESTÁ MIRANDO/.test(txt) ? 1 : /SE VA A GIRAR/.test(txt) ? 2 : /Distraída/.test(txt) ? 0 : st.look;
      };
      mano.keep = true;
      const go = async (b, jarro) => { st.busy = true; try { await mano.a(b); b.classList.add('vc-hi'); await mano.tap(true); if (jarro && st.look !== 1) st.tossed++; pulsa(b); b.classList.remove('vc-hi'); } finally { st.busy = false; } };
      piloto(m, s, 45, () => ({ marcos: 0, tossed: 3 }), (dt) => {
        const bs = [...$('mg').querySelectorAll('.mgbtn')];
        const jb = bs.find((b) => /jarr/.test(b.textContent)), jarron = visible(jb) ? jb : null;
        const beben = bs.filter((b) => /Para dentro/.test(b.textContent) && visible(b));
        st.distT = st.look === 0 ? st.distT + dt : 0;
        if (jarron && !st.jv) {   // ronda nueva (en la peli, dos rondas y listo)
          st.rt = 0; st.ronda++;
          if (st.ronda >= 3 && !m.done) { m.end({ marcos: Math.max(0, S.drunk.marcos - st.m0), tossed: st.tossed }); return; }
        }
        st.jv = !!jarron; st.rt += dt;
        if (st.busy) return;
        if (jarron && st.distT > 0.25 && st.rt > 0.6) { go(jarron, true); return; }
        if (beben.length && st.rt > 0.5) go(beben[0]);
        else if (jarron && !beben.length) { const pt = elPt(jarron); if (!mano.an && Math.hypot(mano.x - pt.x, mano.y - pt.y - 70) > 30) mano.go({ x: pt.x, y: pt.y - 70 }); }   // esperando, con la mano encima
      });
      return p.then((r) => { finMG(); return r; });
    });
    // BESO: toques sin parar
    hook(MG, 'beso', (orig) => function () {
      if (!VC.on) return orig.apply(this, arguments);
      const s = VC.sess, p = orig.apply(this, arguments), m = G.mode;
      if (!m || !m.down) return p;
      let next = 0.6; mano.keep = true; mano.go({ x: 1040, y: 470 });
      piloto(m, s, 22, () => ({ pasion: 1, seg: 75 }), (dt, t) => {
        next -= dt;
        if (next <= 0 && t > 0.5) { next = 0.12 + Math.random() * 0.1; m.down({ x: 800, y: 420 }); mano.tap(true); mano.put(1020 + Math.random() * 40, 450 + Math.random() * 30); }
      });
      return p.then((r) => { finMG(); return r; });
    });
    // PRUEBA DEL DEDO: la nariz va detrás del dedo de Brais (y siempre sale bien)
    hook(MG, 'pulso', (orig) => function () {
      if (!VC.on) return orig.apply(this, arguments);
      const s = VC.sess, p = orig.apply(this, arguments), m = G.mode;
      if (!m || !m.move) return p;
      const oe = m.end; if (oe) m.end = () => oe(true);
      let lx = null, ly = null; mano.keep = true; mano.show(true);
      piloto(m, s, 8.4, true, (dt) => {
        if (m.fx == null) return;
        const vx = lx == null ? 0 : (m.fx - lx) / Math.max(dt, 0.001), vy = ly == null ? 0 : (m.fy - ly) / Math.max(dt, 0.001);
        lx = m.fx; ly = m.fy;
        const q = { x: m.fx + clamp(vx, -900, 900) * 0.12, y: m.fy + clamp(vy, -900, 900) * 0.12 };
        m.move(q); mano.put(q.x + 40, q.y + 40);
      });
      return p.then((r) => { finMG(); return r; });
    });
    // DUELO DE INSULTOS: tras leer el insulto, la réplica buena
    hook(MG, 'duelo', (orig) => async function () {
      if (!VC.on) return orig.apply(this, arguments);
      const s = VC.sess;
      if (!VC.j.duelo) { VC.j.duelo = 1; await aCamara('marcos', JOKE.duelo, 'risa'); }
      const p = orig.apply(this, arguments), m = G.mode;
      if (!m || m.name !== 'duelo') return p;
      const ok = new Set(INSULTOS.map((i) => i.ok).concat(typeof ADULTO !== 'undefined' && ADULTO.insultos ? ADULTO.insultos.map((i) => i.ok) : []));
      const st = { box: null, t: 0, done: false };
      mano.keep = true;
      piloto(m, s, 75, { win: true, fallos: 0, aciertos: 3 }, (dt) => {
        const box = $('mg').querySelector('.dopts');
        if (box !== st.box) { st.box = box; st.t = 0; st.done = false; }
        if (!box || st.done) return;
        st.t += dt;
        if (st.t > 1.7) {
          st.done = true;
          const bs = [...box.querySelectorAll('button')], b = bs.find((x) => ok.has(x.textContent.replace(/^\s*\d+\s*/, '').trim())) || bs[0];
          (async () => { await mano.a(b); b.classList.add('vc-hi'); await vw(450); await mano.tap(true); if (vivo(s) && b.isConnected) pulsa(b); })();
        }
      });
      return p.then((r) => { finMG(); return r; });
    });
    // CÍRCULO DE SAL: un óvalo bien cerrado alrededor de los cuatro
    hook(MG, 'circulo', (orig) => function () {
      if (!VC.on) return orig.apply(this, arguments);
      const s = VC.sess, p = orig.apply(this, arguments), m = G.mode;
      if (!m || !m.down) return p;
      const pt = (k) => { const a = Math.PI / 2 + k * Math.PI * 2; return { x: 800 + Math.cos(a) * 275, y: 700 + Math.sin(a) * 195 }; };
      const st = { fase: 0, k: 0 };
      mano.keep = true;
      piloto(m, s, 22, true, (dt, t) => {
        if (st.fase === 0 && t > 1.2) { st.fase = 1; mano.go(pt(0)).then(() => { if (st.fase === 1) { m.down(pt(0)); st.fase = 2; } }); }
        else if (st.fase === 2) {
          // a pasitos, aunque el fotograma tarde (si no, el rastro de sal queda con pocos puntos)
          const k1 = Math.min(1.03, st.k + dt / 2.3);
          while (st.k < k1) { st.k = Math.min(k1, st.k + 0.012); m.move(pt(st.k)); }
          const q = pt(st.k); mano.put(q.x, q.y);
          if (st.k >= 1.03) { m.up(pt(1.03)); st.fase = 3; }
        }
      });
      return p.then((r) => { finMG(); return r; });
    });
    // CARRETERA: unos segundos al volante y luego avance rápido
    hook(MG, 'carretera', (orig) => async function () {
      if (!VC.on) return orig.apply(this, arguments);
      const s = VC.sess, p = orig.apply(this, arguments), m = G.mode;
      if (!m || !m.end) return p;
      mano.show(false);
      piloto(m, s, 40, { sustos: 0 }, null);
      await vw(4800); if (!vivo(s)) return p;
      m.update = () => {};                    // la imagen se queda quieta…
      if (!VC.j.carretera) { VC.j.carretera = 1; await narr(JOKE.carretera); if (!vivo(s)) return p; }
      autoFF('salto'); SND.staticBurst(0.3, 0.1);
      mensaje('<b>▶▶ AVANCE RÁPIDO</b>' + (G.sceneId === 'camino' ? 'Últimos kilómetros' : 'N-550 · Pontevedra → Caldas de Reis'));
      await vw(2600);
      mensaje(''); autoFF(false);
      if (vivo(s) && !m.done) m.end({ sustos: 0 });
      try { AJUSTES.aplica(); } catch (e) {}
      VC.drv = null;
      return p;
    });
    // por si acaso: el concierto de O Furado (no está en el camino de la peli)
    hook(MG, 'concierto', (orig) => function () {
      if (!VC.on) return orig.apply(this, arguments);
      const s = VC.sess, p = orig.apply(this, arguments), m = G.mode;
      if (m && m.end) piloto(m, s, 8, { pct: 0.9 }, null);
      return p;
    });
  }

  /* =====================================================================
     LOS ENGANCHES AL JUEGO (se ponen al empezar, se quitan al salir)
     ===================================================================== */
  function enganchar() {
    // relojes de la cinta
    window.setTimeout = vSetTimeout; window.clearTimeout = vClear; window.setInterval = vSetInterval; window.clearInterval = vClear;
    // nada se guarda en el navegador mientras dura
    const SP = Storage.prototype;
    hook(SP, 'setItem', (o) => function (k) { if (VC.on && /^pq_/.test(String(k))) return; return o.apply(this, arguments); });
    hook(SP, 'removeItem', (o) => function (k) { if (VC.on && /^pq_/.test(String(k))) return; return o.apply(this, arguments); });
    hook(SP, 'clear', (o) => function () { if (VC.on) return; return o.apply(this, arguments); });
    hook(window, 'save', (o) => function () { if (VC.on) return; return o.apply(this, arguments); });
    hook(window, 'clearSave', (o) => function () { if (VC.on) return; return o.apply(this, arguments); });
    hook(window, 'saveScores', (o) => function () { if (VC.on) return; return o.apply(this, arguments); });
    // logros de mentira: se apuntan en la peli, pero no cuentan
    hook(window, 'logro', (o) => function (id) {
      if (!VC.on) return o.apply(this, arguments);
      if (!S || S.logros.includes(id) || !LOGROS[id]) return;
      S.logros.push(id); sfx('logro');
      setTimeout(() => toast(LOGROS[id].i, 'Logro de la peli · no cuenta', LOGROS[id].t), 400);
    });
    if (typeof GALERIA !== 'undefined') { hook(GALERIA, 'gana', (o) => function () { if (VC.on) return; return o.apply(this, arguments); }); hook(GALERIA, 'foto', (o) => function () { if (VC.on) return; return o.apply(this, arguments); }); }
    // sin «Mientras tanto…» (la peli va al grano)
    if (typeof CAPI !== 'undefined') { hook(CAPI, 'antes', (o) => async function () { if (VC.on) return; return o.apply(this, arguments); }); hook(CAPI, 'despues', (o) => async function () { if (VC.on) return; return o.apply(this, arguments); }); }
    // diálogos y elecciones
    hook(window, 'say', sayHook);
    hook(window, 'choose', chooseHook);
    // cambios de escena: un salto de imagen y, antes de la Compaña, el sargento mira a cámara
    hook(window, 'goScene', (o) => async function (id) {
      if (!VC.on) return o.apply(this, arguments);
      act(); mano.show(false); VC.pasos.push(['→ ' + id, VC.wall | 0]);
      if (id === 'camino' && G.sceneId === 'control' && !VC.j.seoane && G.actors.gc2) { VC.j.seoane = 1; await aCamara('gc2', JOKE.seoane); }
      rt(() => { if (VC.on && !VC.paused) { band.next = 0; SND.staticBurst(0.18, 0.05); } }, 350);
      return o.apply(this, arguments);
    });
    // el final: rango de la peli (sin marcador) y créditos
    hook(window, 'resultados', (o) => async function () {
      if (!VC.on) return o.apply(this, arguments);
      S.over = true; act();
      let r = 'CABALLEROS DE PELÍCULA'; try { r = rango(); } catch (e) {}
      VC.pasos.push(['créditos', VC.wall | 0]);
      await card(r, 'Rango de la película · no cuenta para el marcador', 3400);
      await creditos();
    });
    // la escena post-créditos (el mus de Don Xesús) se queda para el juego: la peli acaba con los créditos
    hook(window, 'postCreditos', (o) => async function () { if (VC.on) return; return o.apply(this, arguments); });
    // cuando el juego quiera volver a la portada: el rótulo del videoclub, rebobinar y fuera
    hook(window, 'showTitle', (o) => function () {
      if (!VC.on) return o.apply(this, arguments);
      outro();
    });
    // el bucle de dibujo
    ORIG_FRAME = window.frame; vfms = (G.last || performance.now() / 1000) * 1000; lastReal = 0;
    window.frame = vcFrame;
    // para poder poner el sonido del juego en pausa: se apunta su AudioContext
    const BAC = window.BaseAudioContext || window.AudioContext;
    if (BAC) ['createGain', 'createBufferSource', 'createOscillator', 'createBiquadFilter'].forEach((k) => hook(BAC.prototype, k, (o) => function () { if (VC.on && !VC.gctx && this !== MYAC) VC.gctx = this; return o.apply(this, arguments); }));
    mgHooks();
  }
  let MYAC = null;   // nuestro AudioContext (el del juego es el otro)
  function desenganchar() {
    unhookAll();
    window.setTimeout = RT; window.clearTimeout = RC; window.setInterval = RI; window.clearInterval = RCI;
    VT.list = [];
    if (ORIG_FRAME) window.frame = ORIG_FRAME;
  }

  /* =====================================================================
     LA CARÁTULA Y LA CINTA QUE ENTRA
     ===================================================================== */
  async function cinta() {
    const d = document.createElement('div'); d.id = 'vcTape'; UI.vcTape = d;
    d.innerHTML = `<div class="ban">Videoclub Pontevedra · Club de Caballeros · VHS</div>
      <div class="slv"><div class="art" style="background-image:url(img/bg/titulo.webp)"></div>
        <div class="stk">VIDEOCLUB<br>PONTEVEDRA<br>ALQUILER 24 H</div>
        <div class="tt">PONTEVEDRA<br>QUEST</div><div class="st">Club de Caballeros</div>
        <div class="ft"><b>VHS</b><span>PAL · Color · Se juega sola · 15 min aprox.</span><i>18</i></div></div>
      <div class="cas"><div class="lab">Club de Caballeros</div><div class="win"><i></i><i></i></div></div>
      <div class="vcr"><div class="brand">VIDEOCLUB</div><div class="mouth"></div><div class="led">00:00</div><div class="btns"><span></span><span></span><span></span><span></span></div></div>
      <div class="blue"><p>▶ PLAY</p><em>VIDEO 1</em><small>PONTEVEDRA QUEST · CLUB DE CABALLEROS<br>No toques nada: se juega sola.</small></div>`;
    ST().appendChild(d);
    await vw(1850); SND.insert();
    await vw(1650);
    const b = d.querySelector('.blue'); b.classList.add('on'); SND.clack();
    await vw(1500);
    SND.staticBurst(0.45, 0.12); band.next = 0; glitch = 3;
    d.style.transition = 'opacity .35s'; d.style.opacity = '0';
    await vw(380); d.remove(); delete UI.vcTape;
  }

  /* =====================================================================
     EL GUION DE LA PELÍCULA (el camino principal, como el RUN de las pruebas)
     ===================================================================== */
  async function guion(s) {
    const paso = async (name, fn) => {
      if (!vivo(s)) throw STOP;
      VC.paso = name; (VC.pasos = VC.pasos || []).push([name, VC.wall | 0]);
      try { await fn(); } catch (e) { if (e === STOP) throw e; VC.errs.push(name + ': ' + (e && e.message || e)); console.warn('[Videoclub] paso', name, e); }
      if (!vivo(s)) throw STOP;
    };
    // un trozo en avance rápido automático (montaje: las partes de trámite)
    const montaje = async (fn) => { VC.montaje = true; autoFF('salto'); try { await fn(); } finally { VC.montaje = false; autoFF(false); } };
    // la cabecera de la película (la viñeta larga de la intro se queda para el juego)
    await paso('cabecera', async () => { await vw(600); await card('CLUB DE CABALLEROS FILMS', 'presenta… una noche en Pontevedra', 3000); });
    /* --- BAR ESTRELLA --- */
    await paso('estrella', () => goScene('estrella', { fast: true }));
    await paso('chiste sofá', () => narr(JOKE.sofa));
    await paso('ronda', async () => { await como('ramis'); await hablar('senora', () => senoraTalk(), ['ronda']); });
    await paso('postre', () => hablar('senora', () => senoraTalk(), ['postre']));
    await paso('aparador', async () => { await como('angel'); await zona('Aparador', 'Mirar'); });
    await paso('bajar', () => zona('Aparador', 'Bajar'));
    /* --- BODEGA --- */
    await paso('caja', () => zona('Caja de madera', 'Abrir'));
    await paso('jarra', () => montaje(async () => { await como('ramis'); await zona('Barricas', 'Usar'); await coger('candelabro'); }));
    await paso('subir', () => salida('Subir al bar'));
    /* --- LA PLAZA Y LA RUTA --- */
    await paso('plaza', () => salida('plaza'));
    await paso('chiste ramis', () => aCamara('ramis', JOKE.ramis, 'risa'));
    await paso('calle', () => salida('calle'));
    await paso('bareto', () => salida('bareto'));
    /* --- PUB: EL BESO --- */
    await paso('pub', () => salto('pub'));
    await paso('chica', async () => { await como('angel'); await hablar('chica', () => chicaTalk(), [1]); });
    await paso('chiste beso', () => aCamara('marc', JOKE.beso, 'risa'));
    /* --- RUINAS Y CRIPTA --- */
    await paso('ruinas', () => salto('ruinas'));
    await paso('chiste xesus', () => aCamara('fantasma', JOKE.xesus, 'risa'));
    await paso('retrato', async () => { await como('marc'); await hablar('fantasma', () => fantasmaTalk(), [1]); });
    await paso('vino', () => montaje(async () => { await como('ramis'); if (has('jarra')) await usar('jarra', actorPt('fantasma'), 'Don Xesús', () => darVino()); }));
    await paso('puerta', async () => {
      const h = visHotspots().find((x) => x.name === 'Puertecita');
      await usar('llave_antigua', h ? rectPt(h.r) : { x: 1525, y: 600 }, 'Puertecita', () => abrirCripta());
      if (G.sceneId !== 'cripta' && flag('criptaAbierta')) await goScene('cripta');
    });
    const insc = () => (G.scene.hs || []).find((x) => x.name === 'Inscripción');
    await paso('luz', async () => { const h = insc(); if (h && has('candelabro')) await usar('candelabro', rectPt(h.r), 'Inscripción', () => h.items.candelabro()); });
    await paso('gafas', async () => { await como('marcos'); const h = insc(); if (h && has('gafas')) await usar('gafas', rectPt(h.r), 'Inscripción', () => h.items.gafas()); });
    await paso('duelo otra vez', async () => { for (let i = 0; i < 2 && !flag('acertijo'); i++) { await como('marcos'); await hablar('fantasma', () => dueloXesus(), [1]); } });
    await paso('sarcófago', () => zona('Sarcófago', 'Abrir'));
    /* --- BARETO: PAGAR Y LAS LLAVES --- */
    // (de trámite: en avance rápido, menos la prueba del dedo)
    await paso('volver al bareto', () => salto('bareto'));
    await paso('pagar y llaves', () => montaje(async () => {
      await como('ramis'); await usar('cartera', actorPt('camarero'), 'Brais', () => pagarBrais());
      for (let i = 0; i < 4 && S.drunk.marcos >= 3; i++) await hablar('camarero', () => braisTalk(), ['cafe']);
      await como('marcos'); for (let i = 0; i < 2 && !flag('llavesDevueltas'); i++) await hablar('camarero', () => braisTalk(), ['llaves']);
    }));
    /* --- LA ALAMEDA: LA MEIGA --- */
    await paso('alameda', () => salto('alameda'));
    await paso('meiga', () => montaje(async () => { await como('angel'); await hablar('meiga', () => meigaTalk(), [1]); }));
    await paso('calzoncillos', async () => { await como('ramis'); await hablar('meiga', () => meigaTalk()); });
    await paso('postres meiga', () => usar('postres', actorPt('meiga'), 'A meiga Pura', () => darMeiga('postres')));
    await paso('calzón meiga', () => { if (has('calzoncillos')) return usar('calzoncillos', actorPt('meiga'), 'A meiga Pura', () => darMeiga('calzoncillos')); });
    /* --- PARKING Y RUMBO A CALDOFRAN (carretera, control, Compaña, balneario, créditos) --- */
    await paso('parking', () => salto('parking'));
    await paso('arrancar', async () => {
      await como('marcos');
      for (let i = 0; i < 3 && S.drunk.marcos >= 3; i++) drink('marcos', -1);   // por si acaso: al volante, sereno
      if (!has('llaves')) { give('llaves'); flag('llavesDevueltas', 1); }
      await zona('Peugeot 5008', 'Conducir', [1]);
    });
  }

  /* =====================================================================
     EMPEZAR
     ===================================================================== */
  async function start() {
    if (VC.on || VC.starting || typeof G === 'undefined' || !$('stage')) return;
    if ($('loading') && !$('loading').classList.contains('hidden')) return;
    VC.starting = true;
    try { AUDIO.init(); } catch (e) {}
    MYAC = SND.init();
    sfx('click');
    VC.prev = { S, bodegaLeft: G.bodegaLeft, kids: new Set([...ST().children]) };
    VC.on = true; VC.sess++; VC.ending = false; VC.paused = false; VC.ffUser = false; VC.ffAuto = false; VC.rew = false; VC.playing = false;
    VC.tape = 0; VC.wall = 0; VC.pasos = []; VC.errs = []; VC.j = {}; VC.want = null; VC.drv = null; VC.gctx = null; VC.lastAct = 0; VT.now = 0; VT.list = [];
    const s = VC.sess;
    document.body.classList.add('vc-on');
    montar();
    enganchar();
    $('title').classList.add('hidden'); closeMenus();
    ['menu', 'card', 'dlg', 'choices'].forEach((id) => $(id) && $(id).classList.add('hidden'));
    try { AUDIO.music(null, { fade: 1.2 }); AUDIO.ambient(null); } catch (e) {}
    VC.starting = false;
    try { await cinta(); } catch (e) { console.warn('[Videoclub] cinta', e); }
    if (!vivo(s)) return;
    // la partida de la película (la del jugador queda aparte)
    S = newState(); G.bodegaLeft = 75; G.started = false; G.busy = 1; G.mode = null; G.scene = null; G.actors = {}; G.particles = [];
    G.fade = 1; G.fadeTo = 1;
    UI.vcRemote.style.display = ''; UI.vcOsd.style.display = ''; UI.vcCnt.style.display = '';
    VC.playing = true; act(); osd(); contador(); mostrarMando();
    guion(s).catch((e) => { if (e !== STOP) { VC.errs.push('guion: ' + (e && e.message || e)); console.warn('[Videoclub]', e); } })
      .finally(() => { if (vivo(s)) outro(); });
  }

  /* =====================================================================
     EL FINAL: rótulo del videoclub, rebobinar y expulsar
     ===================================================================== */
  async function outro() {
    if (!VC.on || VC.ending) return;
    VC.ending = true; const s = VC.sess; VC.pasos.push(['rótulo final', VC.wall | 0]);
    VC.drv = null; VC.ffUser = false; autoFF(false); mano.show(false); mensaje('');
    const negro = { drunk: 0, draw(c) { c.fillStyle = '#000'; c.fillRect(0, 0, W, H); } };
    G.mode = negro; G.fade = G.fadeTo = 0;
    ['dlg', 'choices', 'card', 'mg', 'toast'].forEach((id) => $(id) && $(id).classList.add('hidden'));
    $('mg').innerHTML = ''; G.dlgOpen = false; advanceFn = null;
    const e = document.createElement('div'); e.id = 'vcEnd'; UI.vcEnd = e;
    e.innerHTML = `<h3>VIDEOCLUB PONTEVEDRA</h3><div class="g">Gracias por alquilar<br>«PONTEVEDRA QUEST · CLUB DE CABALLEROS»</div>
      <div class="j">${JOKE.pesetas}</div><div class="f">ABIERTO TODOS LOS DÍAS · TAMBIÉN SÁBADOS</div>`;
    ST().appendChild(e); SND.staticBurst(0.4, 0.1); band.next = 0;
    await vw(6200); if (VC.sess !== s || !VC.on) return;
    // rebobinar: el contador corre hacia atrás hasta 0:00:00
    VC.rew = true; VC.paused = false; SND.whirr(false); SND.clack(); SND.whirr(true, true); osd();
    const from = VC.tape, T = 3200; let t = 0;
    while (t < T && VC.on && VC.sess === s) { await vw(50); t += 50; VC.tape = from * (1 - ease(Math.min(1, t / T))); }
    VC.tape = 0; contador(); SND.whirr(false); SND.eject(); VC.rew = false;
    if (UI.vcOsd) UI.vcOsd.textContent = '⏏';
    await vw(1100);
    if (VC.on && VC.sess === s) salir();
  }
  // el botón ⏏ (o Esc): fuera ya, sin esperar
  function expulsar() {
    if (!VC.on || VC.saliendo) return;
    VC.saliendo = true; SND.whirr(false); SND.eject(); SND.staticBurst(0.35, 0.12);
    if (VC.paused) { try { VC.gctx && VC.gctx.resume(); } catch (e) {} }
    VC.paused = false; band.next = 0; glitch = 3; if (UI.vcOsd) UI.vcOsd.textContent = '⏏ EXPULSAR';
    rt(() => { VC.saliendo = false; salir(); }, 420);
  }
  // dejarlo todo como estaba y volver a la portada
  function salir() {
    if (!VC.on) return;
    VC.on = false; VC.sess++; VC.ending = false; VC.paused = false; VC.ffUser = false; VC.ffAuto = false; VC.rew = false; VC.drv = null; VC.playing = false;
    SND.whirr(false);
    desenganchar();
    try { if (VC.gctx && VC.gctx.state === 'suspended') VC.gctx.resume(); } catch (e) {}
    // el juego, como estaba
    advanceFn = null;
    G.tweens = []; G.busy = 0; G.mode = null; G.scene = null; G.sceneId = null; G.actors = {}; G.props = []; G.particles = [];
    G.camZoom = 1; G.camX = W / 2; G.camY = H / 2; G.bgFrom = null; G.bubble = null; G.blurUntil = 0; G.blurT = null; G.dlgOpen = false;
    G.holding = null; G.reveal = 0; G.shake = 0; G.flashA = 0; G.drunkFx = 0; G.last = 0; G.started = false;
    G.bodegaLeft = VC.prev.bodegaLeft;
    S = VC.prev.S;
    // la pantalla, limpia
    closeMenus();
    ['dlg', 'choices', 'card', 'mg', 'toast', 'bag', 'holding', 'menu', 'label', 'verbs'].forEach((id) => { const x = $(id); if (x) x.classList.add('hidden'); });
    $('choices').innerHTML = ''; $('mg').innerHTML = '';
    [...ST().children].forEach((x) => { if (!VC.prev.kids.has(x)) x.remove(); });
    desmontar();
    document.body.classList.remove('vc-on', 'vc-paused');
    cv.style.transform = '';
    try { AUDIO.duck(false); AUDIO.drunk(0); } catch (e) {}
    try { AJUSTES.aplica(); } catch (e) {}
    if (VC.errs.length) console.info('[Videoclub] avisos:', VC.errs);
    showTitle();
  }

  // el botón, en cuanto esté la portada
  boton();
  Object.assign(VC, { start, expulsar, pausa: setPause, avance: setFF, _salir: salir });
})();
