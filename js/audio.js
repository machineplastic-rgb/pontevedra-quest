/* =====================================================================
   Pontevedra Quest — Club de Caballeros
   Sistema de audio completo, todo sintetizado en vivo con Web Audio API.
   Script clásico (sin módulos). Expone window.AUDIO.
   Secciones: núcleo/buses · utilidades · muestras · instrumentos ·
              secuenciador · pistas · ambientes · efectos · risas · API
   ===================================================================== */
(function () {
  'use strict';

  var W = window;
  var AC = W.AudioContext || W.webkitAudioContext;

  // ---------------------------------------------------------------
  // Estado global
  // ---------------------------------------------------------------
  var ctx = null;          // AudioContext
  var SR = 44100;          // sample rate real (se ajusta al crear)
  var B = null;            // buses
  var S = {};              // muestras renderizadas (AudioBuffer)
  var WV = {};             // ondas periódicas
  var voices = 0;          // voces vivas (aprox.)
  var MAXV = 110;          // límite de voces
  var LOOK = 0.16;         // ventana de programación (s)
  var timer = null;
  var muted = false;
  var vols = { music: 0.8, ambient: 0.75, sfx: 0.9 };
  var duckOn = false;
  var drunkT = 0, drunkC = 0, lastPump = 0;
  var tracks = [];         // pistas vivas (incluidas las que se apagan)
  var curTrack = null, curName = null;
  var beds = [], curBed = null, curBedName = null;
  var wantMusic = null, wantAmb = null; // pedidos antes de init
  var lastBlip = 0;
  var MUTE_KEY = 'pq_audio_muted';

  try { muted = W.localStorage.getItem(MUTE_KEY) === '1'; } catch (e) {}

  // ---------------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------------
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function irnd(a, b) { return Math.floor(rnd(a, b + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function chance(p) { return Math.random() < p; }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function now() { return ctx ? ctx.currentTime : 0; }
  function fin(x, d) { return (typeof x === 'number' && isFinite(x)) ? x : d; }

  // Desconecta nodos al terminar una fuente
  function cleanup(src, nodes) {
    voices++;
    src.onended = function () {
      voices--;
      try { src.disconnect(); } catch (e) {}
      if (nodes) for (var i = 0; i < nodes.length; i++) { try { nodes[i].disconnect(); } catch (e) {} }
    };
  }

  // Envolvente segura: ataque lineal, caída exponencial, liberación
  function env(p, t, a, peak, dTau, sus, tRel, rTau) {
    peak = fin(peak, 0); sus = fin(sus, 0);
    p.setValueAtTime(0, t);
    p.linearRampToValueAtTime(peak, t + a);
    var ta = t + a;
    if (tRel > ta) {
      p.setTargetAtTime(sus, ta, dTau);
      var v = sus + (peak - sus) * Math.exp(-(tRel - ta) / dTau);
      p.setValueAtTime(v, tRel);
    } else tRel = ta;
    p.setTargetAtTime(0, tRel, rTau);
    return tRel + rTau * 6;
  }

  function G(v) { var g = ctx.createGain(); g.gain.value = v == null ? 1 : v; return g; }
  function F(type, f, q, gain) {
    var b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f;
    b.Q.value = q == null ? 0.7 : q; if (gain != null) b.gain.value = gain; return b;
  }
  function O(type, f) {
    var o = ctx.createOscillator();
    if (WV[type]) o.setPeriodicWave(WV[type]);
    else o.type = (type === 'square' || type === 'sawtooth' || type === 'triangle') ? type : (type === 'sine' || !type ? 'sine' : 'sawtooth');
    o.frequency.value = f || 440; return o;
  }
  function P(v) { // panoramizador (si existe)
    if (ctx.createStereoPanner) { var p = ctx.createStereoPanner(); p.pan.value = clamp(v || 0, -1, 1); return p; }
    return G(1);
  }
  function src(buf, rate, loop) {
    var s = ctx.createBufferSource(); s.buffer = buf;
    s.playbackRate.value = rate || 1; if (loop) s.loop = true; return s;
  }
  // conecta a destino seco + envío de reverb opcional
  function route(node, dest, wet, echo) {
    node.connect(dest.dry);
    var extra = [];
    if (wet > 0 && dest.wet) { var w = G(wet); node.connect(w); w.connect(dest.wet); extra.push(w); }
    if (echo > 0 && dest.echo) { var e = G(echo); node.connect(e); e.connect(dest.echo); extra.push(e); }
    return extra;
  }

  // ---------------------------------------------------------------
  // DSP en JS para renderizar muestras
  // ---------------------------------------------------------------
  function biq(d, type, f, q, gainDb) { // biquad RBJ in-place
    var w = 2 * Math.PI * clamp(f, 10, SR * 0.45) / SR, cs = Math.cos(w), sn = Math.sin(w);
    var al = sn / (2 * (q || 0.707)), A = Math.pow(10, (gainDb || 0) / 40);
    var b0, b1, b2, a0, a1, a2;
    if (type === 'lp') { b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    else if (type === 'hp') { b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    else if (type === 'bp') { b0 = al; b1 = 0; b2 = -al; a0 = 1 + al; a1 = -2 * cs; a2 = 1 - al; }
    else { b0 = 1 + al * A; b1 = -2 * cs; b2 = 1 - al * A; a0 = 1 + al / A; a1 = -2 * cs; a2 = 1 - al / A; } // peak
    b0 /= a0; b1 /= a0; b2 /= a0; a1 /= a0; a2 /= a0;
    var x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (var i = 0; i < d.length; i++) {
      var x = d[i], y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y; d[i] = y;
    }
  }
  function norm(d, peak) {
    var m = 0, i;
    for (i = 0; i < d.length; i++) { var a = Math.abs(d[i]); if (a > m) m = a; }
    if (m > 0) { var k = (peak || 0.9) / m; for (i = 0; i < d.length; i++) d[i] *= k; }
  }
  function fadeEnds(d, inS, outS) {
    var n = d.length, i, a = Math.floor(inS * SR), b = Math.floor(outS * SR);
    for (i = 0; i < a && i < n; i++) d[i] *= i / a;
    for (i = 0; i < b && i < n; i++) d[n - 1 - i] *= i / b;
  }
  function mkBuf(sec, ch) { return ctx.createBuffer(ch || 1, Math.max(2, Math.floor(sec * SR)), SR); }

  // buffer estéreo en bucle sin costuras: fn(L, R, n) rellena n+fade muestras
  function loopBuf(sec, fadeSec, fill) {
    var n = Math.floor(sec * SR), fd = Math.floor(fadeSec * SR);
    var L = new Float32Array(n + fd), R = new Float32Array(n + fd);
    fill(L, R, n + fd);
    var b = ctx.createBuffer(2, n, SR), oL = b.getChannelData(0), oR = b.getChannelData(1), i;
    for (i = 0; i < n; i++) {
      if (i < fd) { var a = i / fd; oL[i] = L[i] * a + L[n + i] * (1 - a); oR[i] = R[i] * a + R[n + i] * (1 - a); }
      else { oL[i] = L[i]; oR[i] = R[i]; }
    }
    return b;
  }

  // ---------------------------------------------------------------
  // Ruidos y texturas (se renderizan una vez y se reutilizan)
  // ---------------------------------------------------------------
  var RENDER = {
    white: function () {
      return loopBuf(3, 0.05, function (L, R, n) { for (var i = 0; i < n; i++) { L[i] = Math.random() * 2 - 1; R[i] = Math.random() * 2 - 1; } });
    },
    pink: function () {
      return loopBuf(4, 0.1, function (L, R, n) {
        [L, R].forEach(function (d) {
          var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
          for (var i = 0; i < n; i++) {
            var w = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
            b2 = 0.96900 * b2 + w * 0.1538520; b3 = 0.86650 * b3 + w * 0.3104856;
            b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
            d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
          }
        });
      });
    },
    brown: function () {
      return loopBuf(4, 0.2, function (L, R, n) {
        [L, R].forEach(function (d) {
          var y = 0;
          for (var i = 0; i < n; i++) { y = (y + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = y * 3.2; }
        });
      });
    },
    // llovizna sobre piedra: gotitas sueltas
    rain: function () {
      return loopBuf(5, 0.2, function (L, R, n) {
        var i, k;
        for (i = 0; i < n; i++) { var w = (Math.random() * 2 - 1) * 0.04; L[i] = w; R[i] = (Math.random() * 2 - 1) * 0.04; }
        var drops = Math.floor(n / SR * 70);
        for (k = 0; k < drops; k++) {
          var st = Math.floor(Math.random() * (n - 2000)), heavy = Math.random() < 0.12;
          var f = heavy ? rnd(500, 1400) : rnd(2200, 7500), dec = heavy ? rnd(0.012, 0.025) : rnd(0.002, 0.007);
          var amp = heavy ? rnd(0.25, 0.5) : rnd(0.08, 0.3), pan = Math.random();
          var len = Math.min(Math.floor(dec * 6 * SR), 2000), ph = 0, dp = 2 * Math.PI * f / SR;
          for (i = 0; i < len; i++) {
            var e = Math.exp(-i / (dec * SR)) * amp;
            var s = (Math.sin(ph) * 0.6 + (Math.random() * 2 - 1) * 0.4) * e; ph += dp * (1 + i / len * 0.3);
            L[st + i] += s * (1 - pan); R[st + i] += s * pan;
          }
        }
        biq(L, 'lp', 9000, 0.7); biq(R, 'lp', 9000, 0.7);
        norm(L, 0.7); norm(R, 0.7);
      });
    },
    // grillos: varios bichos con su ritmo
    crick: function () {
      return loopBuf(6, 0.3, function (L, R, n) {
        var cr = [];
        for (var c = 0; c < 4; c++) cr.push({ f: rnd(3900, 5200), per: rnd(0.45, 0.85), pul: irnd(2, 4), pan: rnd(0.1, 0.9), amp: rnd(0.4, 1), off: rnd(0, 0.5), drift: rnd(0, 6.28) });
        for (var i = 0; i < n; i++) {
          var t = i / SR, sL = 0, sR = 0;
          for (c = 0; c < cr.length; c++) {
            var q = cr[c], tt = (t + q.off) % q.per, pIdx = Math.floor(tt / 0.035);
            if (pIdx < q.pul) {
              var pt = tt - pIdx * 0.035;
              if (pt < 0.022) {
                var e = Math.sin(Math.PI * pt / 0.022); e *= e;
                var sw = 0.6 + 0.4 * Math.sin(t * 0.7 + q.drift);
                var s = Math.sin(2 * Math.PI * q.f * t) * e * q.amp * sw;
                sL += s * (1 - q.pan); sR += s * q.pan;
              }
            }
          }
          L[i] = sL; R[i] = sR;
        }
        norm(L, 0.6); norm(R, 0.6);
      });
    },
    // agua corriente: burbujas + lecho filtrado
    water: function () {
      return loopBuf(6, 0.3, function (L, R, n) {
        var i, k;
        for (i = 0; i < n; i++) { L[i] = (Math.random() * 2 - 1) * 0.15; R[i] = (Math.random() * 2 - 1) * 0.15; }
        biq(L, 'bp', 900, 0.5); biq(R, 'bp', 1000, 0.5);
        var nb = Math.floor(n / SR * 140);
        for (k = 0; k < nb; k++) {
          var st = Math.floor(Math.random() * (n - 3000)), f0 = 300 * Math.pow(8, Math.random());
          var dec = rnd(0.004, 0.02) * (1000 / f0 + 0.3), len = Math.min(Math.floor(dec * 5 * SR), 3000);
          var amp = rnd(0.05, 0.25), pan = Math.random(), ph = 0;
          for (i = 0; i < len; i++) {
            var tt = i / SR, f = f0 * (1 + tt / dec * 0.12);
            ph += 2 * Math.PI * f / SR;
            var s = Math.sin(ph) * Math.exp(-tt / dec) * amp;
            L[st + i] += s * (1 - pan * 0.7); R[st + i] += s * (0.3 + pan * 0.7);
          }
        }
        norm(L, 0.7); norm(R, 0.7);
      });
    }
  };

  // ---------------------------------------------------------------
  // Muestras de instrumentos (Karplus-Strong, aditivas, percusión)
  // ---------------------------------------------------------------
  // cuerda pulsada: devuelve {b: buffer, f: frecuencia real}
  function ks(f0, sec, t60, s, bright, pickPos) {
    var b = mkBuf(sec), d = b.getChannelData(0), n = d.length;
    var p = Math.max(2, Math.round(SR / f0 - s)), fr = SR / (p + s);
    var g = Math.pow(0.001, 1 / (fr * t60)), i;
    var exc = new Float32Array(p), y = 0, m = 0;
    for (i = 0; i < p; i++) { y += bright * ((Math.random() * 2 - 1) - y); exc[i] = y; m += y; }
    m /= p;
    var pp = Math.max(1, Math.floor(p * pickPos));
    for (i = 0; i < p; i++) d[i] = (exc[i] - m) - (i >= pp ? (exc[i - pp] - m) : 0) * 0.8;
    for (i = p; i < n; i++) d[i] = g * ((1 - s) * d[i - p] + s * (i - p - 1 >= 0 ? d[i - p - 1] : 0));
    // cuerpo: un poco de calidez
    biq(d, 'pk', 220, 1.2, 3); biq(d, 'hp', 60, 0.7);
    // nivelar por el cuerpo de la nota (no por el pico del ataque) y suavizar picos
    var w = Math.min(n, Math.floor(0.4 * SR)), e = 0;
    for (i = 0; i < w; i++) e += d[i] * d[i];
    var kk = 0.2 / Math.max(1e-6, Math.sqrt(e / w));
    for (i = 0; i < n; i++) { var x = d[i] * kk; d[i] = x > 0.6 || x < -0.6 ? 0.95 * Math.tanh(x / 0.95) : x; }
    fadeEnds(d, 0.0008, 0.05);
    return { b: b, f: fr };
  }
  // suma de parciales: [ratio, amp, decay]
  function additive(f0, sec, parts, att, noiseAmt) {
    var b = mkBuf(sec), d = b.getChannelData(0), n = d.length, i, k;
    for (k = 0; k < parts.length; k++) {
      var pr = parts[k], f = f0 * pr[0];
      if (f > SR * 0.45) continue;
      var w = 2 * Math.PI * f / SR, a = pr[1], dc = pr[2], ph = Math.random() * 6.28;
      var len = Math.min(n, Math.floor(dc * 7 * SR));
      var c = Math.cos(w), s0 = Math.sin(ph), s1 = Math.sin(ph - w), kk = 2 * c; // oscilador recursivo
      var dm = Math.exp(-1 / (dc * SR)), e = a;
      for (i = 0; i < len; i++) { var s2 = kk * s0 - s1; s1 = s0; s0 = s2; d[i] += s1 * e; e *= dm; }
    }
    if (noiseAmt) for (i = 0; i < Math.min(n, SR * 0.01); i++) d[i] += (Math.random() * 2 - 1) * noiseAmt * (1 - i / (SR * 0.01));
    var A = Math.floor((att || 0.001) * SR);
    for (i = 0; i < A; i++) d[i] *= i / A;
    norm(d, 0.85); fadeEnds(d, 0, 0.03);
    return { b: b, f: f0 };
  }
  // percusión con función generadora f(t, i) por muestra
  function perc(sec, fn, post) {
    var b = mkBuf(sec), d = b.getChannelData(0), n = d.length, st = { ph: 0, y: 0 };
    for (var i = 0; i < n; i++) d[i] = fn(i / SR, st);
    if (post) post(d);
    norm(d, 0.9); fadeEnds(d, 0, 0.01);
    return { b: b, f: 0 };
  }
  function wn() { return Math.random() * 2 - 1; }

  var SMP = {
    kick: function () { return perc(0.55, function (t, s) { var f = 48 + 110 * Math.exp(-t / 0.035); s.ph += 2 * Math.PI * f / SR; return Math.sin(s.ph) * Math.exp(-t / 0.22) + (t < 0.003 ? wn() * 0.3 : 0); }, function (d) { biq(d, 'lp', 4000, 0.7); }); },
    kick2: function () { return perc(0.5, function (t, s) { var f = 46 + 60 * Math.exp(-t / 0.03); s.ph += 2 * Math.PI * f / SR; return Math.tanh(1.6 * Math.sin(s.ph) * Math.exp(-t / 0.28)); }, function (d) { biq(d, 'lp', 900, 0.7); }); },
    snare: function () {
      return perc(0.35, function (t, s) {
        s.ph += 2 * Math.PI * (180 + 40 * Math.exp(-t / 0.01)) / SR;
        return Math.sin(s.ph) * Math.exp(-t / 0.05) * 0.7 + wn() * Math.exp(-t / 0.1) * 0.8;
      }, function (d) { biq(d, 'hp', 140, 0.7); biq(d, 'pk', 3500, 1, 4); });
    },
    brush: function () { return perc(0.4, function (t) { var a = t < 0.02 ? t / 0.02 : Math.exp(-(t - 0.02) / 0.09); return wn() * a; }, function (d) { biq(d, 'bp', 3500, 0.5); biq(d, 'lp', 7000, 0.7); }); },
    brushtap: function () { return perc(0.18, function (t) { return wn() * Math.exp(-t / 0.03); }, function (d) { biq(d, 'bp', 2500, 0.6); }); },
    hat: function () { return perc(0.12, hatGen(0.022), function (d) { biq(d, 'hp', 7000, 0.7); biq(d, 'hp', 7000, 0.7); }); },
    ohat: function () { return perc(0.55, hatGen(0.16), function (d) { biq(d, 'hp', 6500, 0.7); biq(d, 'hp', 6500, 0.7); }); },
    crash: function () { return perc(1.8, hatGen(0.55, 0.9), function (d) { biq(d, 'hp', 4000, 0.7); biq(d, 'lp', 12000, 0.7); }); },
    shaker: function () { return perc(0.12, function (t) { var a = t < 0.012 ? t / 0.012 : Math.exp(-(t - 0.012) / 0.03); return wn() * a; }, function (d) { biq(d, 'bp', 6000, 0.8); }); },
    // pandeireta: parches + sonajas
    pand: function () { return perc(0.4, pandGen(true), function (d) { biq(d, 'hp', 120, 0.7); }); },
    pandj: function () { return perc(0.3, pandGen(false), function (d) { biq(d, 'hp', 3000, 0.7); }); },
    bombo: function () {
      return perc(1.3, function (t, s) {
        s.ph += 2 * Math.PI * (58 + 22 * Math.exp(-t / 0.06)) / SR;
        var body = Math.sin(s.ph) * Math.exp(-t / 0.45) + Math.sin(s.ph * 1.58) * 0.3 * Math.exp(-t / 0.2);
        return body + wn() * 0.4 * Math.exp(-t / 0.012);
      }, function (d) { biq(d, 'lp', 2500, 0.7); });
    },
    clap: function () {
      return perc(0.35, function (t) {
        var a = 0, k; for (k = 0; k < 3; k++) { var tk = t - k * 0.011; if (tk >= 0 && tk < 0.011) a = Math.exp(-tk / 0.004); }
        if (t >= 0.033) a = Math.exp(-(t - 0.033) / 0.07); return wn() * a;
      }, function (d) { biq(d, 'bp', 1300, 1.1); biq(d, 'pk', 2500, 1, 3); });
    },
    snap: function () { return perc(0.12, function (t) { return wn() * Math.exp(-t / 0.012); }, function (d) { biq(d, 'bp', 2200, 2); }); },
    timp: function () {
      var r = additive(73.4, 2.2, [[1, 1, 0.9], [1.5, 0.5, 0.6], [1.98, 0.35, 0.45], [2.44, 0.2, 0.3], [2.9, 0.1, 0.2]], 0.002, 0.25);
      biq(r.b.getChannelData(0), 'lp', 2500, 0.7); return r;
    },
    rim: function () { return additive(820, 0.12, [[1, 1, 0.025], [2.4, 0.5, 0.012], [3.9, 0.3, 0.008]], 0.0005, 0.4); },
    tick: function () { return additive(2600, 0.06, [[1, 1, 0.006], [0.45, 0.6, 0.012]], 0.0003, 0.2); },
    wood: function () { return additive(1050, 0.2, [[1, 1, 0.05], [2.7, 0.35, 0.02]], 0.0005, 0.15); },
    heart: function () {
      return perc(0.7, function (t, s) {
        var a = 0, f = 50;
        if (t < 0.18) { a = Math.exp(-t / 0.05) * (t < 0.008 ? t / 0.008 : 1); f = 55 - 15 * t / 0.18; }
        else { var u = t - 0.22; if (u > 0) { a = 0.75 * Math.exp(-u / 0.06) * (u < 0.008 ? u / 0.008 : 1); f = 48 - 10 * u; } }
        s.ph += 2 * Math.PI * f / SR; return Math.sin(s.ph) * a;
      }, function (d) { biq(d, 'lp', 300, 0.7); });
    },
    drip: function () {
      return perc(0.25, function (t, s) {
        var f = 900 * Math.pow(2.8, Math.min(t / 0.028, 1)); s.ph += 2 * Math.PI * f / SR;
        return Math.sin(s.ph) * Math.exp(-t / 0.035) * (t < 0.001 ? t / 0.001 : 1);
      });
    },
    // cristales y metales
    clink0: function () { return glass(2400); }, clink1: function () { return glass(2900); },
    clink2: function () { return glass(3400); }, clink3: function () { return glass(2100); },
    cutl0: function () { return additive(2600, 0.5, [[1, 1, 0.12], [2.76, 0.6, 0.07], [5.4, 0.4, 0.04], [8.9, 0.2, 0.02]], 0.0003, 0.3); },
    cutl1: function () { return additive(3300, 0.5, [[1, 1, 0.1], [2.3, 0.7, 0.06], [4.7, 0.3, 0.03]], 0.0003, 0.3); },
    plate: function () { return additive(1150, 0.5, [[1, 1, 0.11], [1.62, 0.6, 0.07], [2.9, 0.4, 0.04], [4.1, 0.2, 0.02]], 0.0004, 0.35); },
    coin: function () { return additive(3200, 1.4, [[1, 1, 0.5], [1.47, 0.7, 0.4], [2.1, 0.5, 0.3], [2.8, 0.35, 0.2], [3.6, 0.2, 0.12]], 0.0003, 0.2); },
    step: function () { return perc(0.18, function (t) { return wn() * Math.exp(-t / 0.018) + Math.sin(t * 2 * Math.PI * 90) * Math.exp(-t / 0.03) * 0.8; }, function (d) { biq(d, 'bp', 1400, 0.7); biq(d, 'lp', 5000, 0.7); }); },
    stepw: function () { return perc(0.2, function (t) { return wn() * Math.exp(-t / 0.025) * 0.6 + Math.sin(t * 2 * Math.PI * 140) * Math.exp(-t / 0.04); }, function (d) { biq(d, 'lp', 1800, 0.8); }); }
  };
  function glass(f) { return additive(f, 1.3, [[1, 1, 0.55], [2.32, 0.55, 0.3], [4.25, 0.3, 0.16], [6.63, 0.15, 0.08]], 0.0003, 0.15); }
  function hatGen(dec, amp) {
    var fr = [205.3, 304.4, 369.6, 522.7, 540, 800].map(function (x) { return x * 2.1; });
    return function (t) {
      var s = 0; for (var k = 0; k < fr.length; k++) s += (Math.sin(2 * Math.PI * fr[k] * t) > 0 ? 1 : -1);
      return (s / 6 * 0.6 + wn() * 0.5) * Math.exp(-t / dec) * (amp || 1);
    };
  }
  function pandGen(skin) {
    var hits = []; for (var k = 0; k < 6; k++) hits.push({ t: rnd(0, 0.018), f: rnd(4800, 9500), a: rnd(0.5, 1) });
    return function (t, s) {
      var v = 0;
      for (var k = 0; k < hits.length; k++) { var u = t - hits[k].t; if (u >= 0) v += Math.sin(2 * Math.PI * hits[k].f * u) * Math.exp(-u / 0.05) * hits[k].a * 0.5 + wn() * Math.exp(-u / 0.02) * 0.25; }
      if (skin) { s.ph += 2 * Math.PI * (190 - 40 * Math.min(t / 0.1, 1)) / SR; v += Math.sin(s.ph) * Math.exp(-t / 0.07) * 1.4; }
      return v;
    };
  }

  // instrumentos muestreados por altura: varias bases por octava
  var PITCHED = {
    guitar: { bases: [98, 196, 392, 784], mk: function (f) { return ks(f, 2.6, 2.4 * Math.pow(196 / f, 0.35), 0.5, 0.35, 0.13); } },
    harp: { bases: [98, 196, 392, 784, 1568], mk: function (f) { return ks(f, 3.6, 3.6 * Math.pow(196 / f, 0.3), 0.32, 0.55, 0.5); } },
    pizz: { bases: [98, 196, 392, 784], mk: function (f) { return ks(f, 0.9, 0.55, 0.5, 0.2, 0.2); } },
    celesta: { bases: [261.6, 523.3, 1046.5], mk: function (f) { return additive(f, 2.2, [[1, 1, 0.9], [2, 0.35, 0.35], [3, 0.12, 0.2], [4.1, 0.15, 0.08], [0.5, 0.05, 0.6]], 0.001, 0.05); } },
    bell: { bases: [261.6, 523.3, 1046.5], mk: function (f) { return additive(f, 4, [[0.5, 0.35, 2.2], [1, 1, 1.6], [1.19, 0.45, 1.1], [1.5, 0.35, 0.9], [2, 0.4, 0.7], [2.5, 0.2, 0.45], [3, 0.18, 0.35], [4.2, 0.12, 0.2], [5.4, 0.08, 0.12]], 0.001, 0.08); } },
    handbell: { bases: [1046.5], mk: function (f) { return additive(f, 5, [[1, 1, 2.2], [2.01, 0.45, 1.2], [2.76, 0.3, 0.8], [3.98, 0.2, 0.5], [5.4, 0.12, 0.3]], 0.0008, 0.05); } },
    church: { bases: [130.8], mk: function (f) { return additive(f, 7, [[0.5, 0.6, 4.5], [1, 1, 3.5], [1.2, 0.6, 2.8], [1.5, 0.45, 2.2], [2, 0.5, 1.8], [2.52, 0.3, 1.1], [3.01, 0.25, 0.8], [4.17, 0.15, 0.5], [5.43, 0.1, 0.3]], 0.002, 0.12); } },
    timp: { bases: [73.4], mk: function () { return SMP.timp(); } },
    drip: { bases: [900], mk: function () { var r = SMP.drip(); r.f = 1600; return r; } }
  };
  function getS(name) {
    if (S[name]) return S[name];
    var r = null;
    try {
      if (RENDER[name]) r = { b: RENDER[name](), f: 0 };
      else if (SMP[name]) r = SMP[name]();
      else {
        var m = /^(\w+)_(\d+(?:\.\d+)?)$/.exec(name);
        if (m && PITCHED[m[1]]) r = PITCHED[m[1]].mk(parseFloat(m[2]));
      }
    } catch (e) { r = null; }
    if (r) S[name] = r;
    return r;
  }
  // elige base más cercana y devuelve {b, rate}
  function pitched(inst, freq) {
    var P_ = PITCHED[inst]; if (!P_) return null;
    var best = P_.bases[0], bd = 1e9;
    for (var i = 0; i < P_.bases.length; i++) { var dd = Math.abs(Math.log(freq / P_.bases[i])); if (dd < bd) { bd = dd; best = P_.bases[i]; } }
    var s = getS(inst + '_' + best); if (!s) return null;
    return { b: s.b, rate: freq / s.f };
  }
  // precarga escalonada para no bloquear
  function preload() {
    var list = ['white', 'pink', 'brown', 'kick', 'snare', 'hat', 'ohat', 'pand', 'pandj', 'bombo', 'clap', 'rim', 'tick', 'brush', 'brushtap', 'shaker', 'kick2', 'crash', 'snap', 'wood', 'heart', 'drip', 'timp',
      'guitar_196', 'guitar_392', 'guitar_98', 'harp_392', 'harp_784', 'harp_196', 'pizz_196', 'pizz_392', 'pizz_98', 'celesta_523.3', 'celesta_1046.5', 'bell_523.3', 'bell_261.6', 'bell_1046.5',
      'handbell_1046.5', 'church_130.8', 'clink0', 'clink1', 'clink2', 'clink3', 'cutl0', 'cutl1', 'plate', 'coin', 'step', 'stepw', 'harp_1568', 'guitar_784', 'harp_98', 'celesta_261.6', 'pizz_784', 'rain', 'crick', 'water'];
    var i = 0;
    function next() {
      if (!ctx) return;
      var t0 = Date.now();
      while (i < list.length && Date.now() - t0 < 12) { getS(list[i]); i++; }
      if (i < list.length) setTimeout(next, 16);
    }
    setTimeout(next, 30);
  }

  // ondas periódicas
  function mkWave(amps) {
    var n = amps.length + 1, re = new Float32Array(n), im = new Float32Array(n);
    for (var i = 1; i < n; i++) im[i] = amps[i - 1];
    try { return ctx.createPeriodicWave(re, im); } catch (e) { return null; }
  }
  function initWaves() {
    var a, i;
    a = []; for (i = 1; i <= 40; i++) a.push(1 / Math.pow(i, 1.45)); WV.glot = mkWave(a);
    a = []; for (i = 1; i <= 30; i++) a.push((i % 2 ? 1 : 0.45) / i); WV.reed = mkWave(a);
    WV.chanter = mkWave([1, 0.85, 0.9, 0.72, 0.8, 0.6, 0.52, 0.55, 0.42, 0.36, 0.3, 0.3, 0.24, 0.2, 0.18, 0.14, 0.12, 0.1, 0.08, 0.07]);
    a = []; for (i = 1; i <= 24; i++) a.push((i % 2 ? 1 : 0.15) / i); WV.clar = mkWave(a);
    for (var k in WV) if (!WV[k]) delete WV[k];
  }

  // ---------------------------------------------------------------
  // Núcleo: buses, reverb, eco, compresor
  // ---------------------------------------------------------------
  function impulse(sec) {
    var n = Math.floor(sec * SR), b = ctx.createBuffer(2, n, SR), tau = sec / 6.9;
    for (var c = 0; c < 2; c++) {
      var d = b.getChannelData(c), lp = 0;
      for (var i = 0; i < n; i++) {
        var t = i / SR, w = wn(); lp += 0.22 * (w - lp);
        var hi = w - lp;
        d[i] = (lp * 1.8 * Math.exp(-t / tau) + hi * 0.7 * Math.exp(-t / (tau * 0.38))) * (t < 0.012 ? t / 0.012 : 1);
      }
      for (var k = 0; k < 7; k++) { var p = Math.floor(rnd(0.008, 0.075) * SR); d[p] += rnd(-0.6, 0.6); }
    }
    return b;
  }
  function chain(dest, chorus) {
    var c = { in: G(1) };
    c.wob = ctx.createDelay(0.2); c.wob.delayTime.value = 0.03;
    c.lp = F('lowpass', 18000, 0.7);
    c.vol = G(vols.music);
    c.in.connect(c.wob); c.wob.connect(c.lp);
    if (chorus) {
      c.cho = ctx.createDelay(0.1); c.cho.delayTime.value = 0.016; c.choG = G(0);
      c.in.connect(c.cho); c.cho.connect(c.choG); c.choG.connect(c.lp);
    }
    c.lp.connect(c.vol); c.vol.connect(dest);
    return c;
  }
  function buildBuses() {
    B = {};
    B.master = G(muted ? 0 : 1);
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 2.5; comp.attack.value = 0.008; comp.release.value = 0.25;
    var lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -2.5; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12;
    B.out = G(0.8);
    B.master.connect(comp); comp.connect(lim); lim.connect(B.out); B.out.connect(ctx.destination);
    // reverb compartida
    B.verbIn = G(1); B.verb = ctx.createConvolver();
    try { B.verb.buffer = impulse(2.6); } catch (e) {}
    B.verbOut = G(0.75);
    B.verbIn.connect(B.verb); B.verb.connect(B.verbOut); B.verbOut.connect(B.master);
    // eco con realimentación
    B.echoIn = G(1); B.dly = ctx.createDelay(1.5); B.dly.delayTime.value = 0.36;
    B.fb = G(0.34); var hp = F('highpass', 280, 0.7), lp = F('lowpass', 2600, 0.7);
    B.echoOut = G(0.55); var e2v = G(0.25);
    B.echoIn.connect(hp); hp.connect(B.dly); B.dly.connect(lp); lp.connect(B.fb); B.fb.connect(B.dly);
    lp.connect(B.echoOut); B.echoOut.connect(B.master); B.echoOut.connect(e2v); e2v.connect(B.verbIn);
    // música (3 cadenas con efecto borracho)
    B.mus = { dry: chain(B.master, true), wet: chain(B.verbIn), echo: chain(B.echoIn) };
    B.lfo = [O('sine', 0.33), O('sine', 0.12), O('sine', 0.9)];
    B.dg = [G(0), G(0), G(0)];
    for (var i = 0; i < 3; i++) { B.lfo[i].connect(B.dg[i]); B.lfo[i].start(); }
    ['dry', 'wet', 'echo'].forEach(function (k) { B.dg[0].connect(B.mus[k].wob.delayTime); B.dg[1].connect(B.mus[k].wob.delayTime); });
    B.dg[2].connect(B.mus.dry.cho.delayTime);
    // ambiente y efectos
    B.amb = { dry: G(vols.ambient), wet: G(vols.ambient) };
    B.amb.dry.connect(B.master); B.amb.wet.connect(B.verbIn);
    B.sfx = { dry: G(vols.sfx), wet: G(vols.sfx), echo: G(vols.sfx) };
    B.sfx.dry.connect(B.master); B.sfx.wet.connect(B.verbIn); B.sfx.echo.connect(B.echoIn);
  }
  function musicGain() {
    if (!B) return;
    var g = vols.music * (duckOn ? 0.6 : 1), t = now();
    ['dry', 'wet', 'echo'].forEach(function (k) { var p = B.mus[k].vol.gain; p.cancelScheduledValues(t); p.setTargetAtTime(g, t, 0.25); });
  }
  function applyDrunk() {
    if (!B) return;
    var l = drunkT, t = now();
    B.dg[0].gain.setTargetAtTime(l * 0.0065, t, 0.8);
    B.dg[1].gain.setTargetAtTime(l * 0.011, t, 0.8);
    B.dg[2].gain.setTargetAtTime(l * 0.0016, t, 0.8);
    B.mus.dry.choG.gain.setTargetAtTime(l * 0.5, t, 0.8);
    var f = 18000 * Math.pow(0.05, Math.pow(l, 1.5)), q = 0.7 + 2.3 * l * l;
    ['dry', 'wet', 'echo'].forEach(function (k) {
      B.mus[k].lp.frequency.setTargetAtTime(f, t, 0.8); B.mus[k].lp.Q.setTargetAtTime(q, t, 0.8);
    });
  }
  function setEcho(sec) {
    if (!B) return;
    B.dly.delayTime.setTargetAtTime(clamp(sec, 0.18, 0.75), now(), 0.3);
  }
  var SFXD = function () { return B.sfx; };

  function driveCurve(k) {
    var n = 1024, c = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = i / (n - 1) * 2 - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); }
    return c;
  }

  // ---------------------------------------------------------------
  // Canales por pista: filtros, formantes, trémolo, envíos
  // ---------------------------------------------------------------
  function mkChannel(tr, cfg) {
    var inp = G(cfg.g == null ? 0.5 : cfg.g), last = inp, ns = tr.nodes;
    ns.push(inp);
    if (cfg.drive) {
      var ws = ctx.createWaveShaper(); ws.curve = driveCurve(cfg.drive); try { ws.oversample = '2x'; } catch (e) {}
      last.connect(ws); last = ws; ns.push(ws);
    }
    if (cfg.fmt) {
      var sum = G(1); ns.push(sum);
      cfg.fmt.forEach(function (fm) {
        var bp = F('bandpass', fm[0], fm[1]), bg = G(fm[2]);
        last.connect(bp); bp.connect(bg); bg.connect(sum); ns.push(bp, bg);
      });
      last = sum;
    }
    (cfg.f || []).forEach(function (fc) {
      // [tipo, frec, Q, ganancia?] o [tipo, frec, Q, [lfoHz, lfoProf]]
      var gv = typeof fc[3] === 'number' ? fc[3] : null, lf = fc[3] && fc[3].length ? fc[3] : fc[4];
      var bq = F(fc[0], fc[1], fc[2], gv); last.connect(bq); last = bq; ns.push(bq);
      if (lf) {
        var lo = O('sine', lf[0]), lg = G(lf[1]); lo.connect(lg); lg.connect(bq.frequency);
        lo.start(); tr.persist.push(lo); ns.push(lg);
      }
    });
    if (cfg.trem) {
      var tg = G(1 - cfg.trem[1]), lo2 = O('sine', cfg.trem[0]), lg2 = G(cfg.trem[1]);
      lo2.connect(lg2); lg2.connect(tg.gain); lo2.start(); tr.persist.push(lo2); ns.push(tg, lg2);
      last.connect(tg); last = tg;
    }
    if (cfg.pan) { var pn = P(cfg.pan); last.connect(pn); last = pn; ns.push(pn); }
    last.connect(tr.dry);
    if (cfg.rev) { var s = G(cfg.rev); last.connect(s); s.connect(tr.wet); ns.push(s); }
    if (cfg.echo) { var e = G(cfg.echo); last.connect(e); e.connect(tr.echo); ns.push(e); }
    return { in: inp, cfg: cfg, tr: tr };
  }

  // ---------------------------------------------------------------
  // Instrumentos (cada nota: pocos nodos, se limpian solos)
  // ---------------------------------------------------------------
  var INST = {};
  function go(oscs, t, end, nodes) {
    for (var i = 0; i < oscs.length; i++) { if (!oscs[i]._on) { oscs[i].start(t); oscs[i].stop(end); } }
    cleanup(oscs[0], oscs.slice(1).concat(nodes || []));
  }
  // vibrato por nota (el LFO se arranca y para aquí mismo)
  function vib(oscs, t, rate, cents, delay, end) {
    var lo = O('sine', rate), lg = G(0);
    lo._on = true;
    lo.connect(lg);
    for (var i = 0; i < oscs.length; i++) lg.connect(oscs[i].detune);
    lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(cents, t + (delay || 0.01));
    lo.start(t); lo.stop(end);
    return [lo, lg];
  }

  function smpNote(ch, inst, t, m, dur, v, cut) {
    var r = pitched(inst, mtof(m)); if (!r) return;
    var s = src(r.b, r.rate), g = G(v);
    s.connect(g); g.connect(ch.in);
    var len = r.b.duration / r.rate, end = t + len;
    if (cut && dur + 0.25 < len) { g.gain.setValueAtTime(v, t + dur); g.gain.setTargetAtTime(0, t + dur, 0.05); end = t + dur + 0.3; }
    s.start(t); s.stop(end);
    cleanup(s, [g]);
  }
  INST.guitar = function (ch, t, m, d, v, ev) { smpNote(ch, 'guitar', t, m, d, v, ev.mute || ch.cfg.cut); };
  INST.harp = function (ch, t, m, d, v, ev) { smpNote(ch, 'harp', t, m, d, v, ch.cfg.cut); };
  INST.pizz = function (ch, t, m, d, v) { smpNote(ch, 'pizz', t, m, d, v, false); };
  INST.celesta = function (ch, t, m, d, v) { smpNote(ch, 'celesta', t, m, d, v, false); };
  INST.bell = function (ch, t, m, d, v) { smpNote(ch, 'bell', t, m, d, v, false); };
  INST.handbell = function (ch, t, m, d, v) { smpNote(ch, 'handbell', t, m, d, v, false); };
  INST.church = function (ch, t, m, d, v) { smpNote(ch, 'church', t, m, d, v, false); };
  INST.timp = function (ch, t, m, d, v) { smpNote(ch, 'timp', t, m, d, v, false); };
  INST.drop = function (ch, t, m, d, v) { smpNote(ch, 'drip', t, m, d, v, false); };
  // percusión muestreada
  INST.smp = function (ch, t, m, d, v, ev) {
    var r = getS(ev.s || ch.cfg.s); if (!r) return;
    var s = src(r.b, (ev.r || ch.cfg.r || 1) * rnd(0.985, 1.015)), g = G(v);
    s.connect(g); g.connect(ch.in); s.start(t);
    cleanup(s, [g]);
  };
  // acordeón: dos lengüetas desafinadas (musette)
  INST.acc = function (ch, t, m, d, v) {
    var f = mtof(m), g = G(0), a = O('reed', f), b = O('reed', f);
    a.detune.value = -8; b.detune.value = 9;
    a.connect(g); b.connect(g); g.connect(ch.in);
    var end = env(g.gain, t, 0.022, v * 0.36, 0.35, v * 0.27, t + d, 0.045);
    go([a, b], t, end, [g]);
  };
  // pad de sierras con ataque lento
  INST.pad = function (ch, t, m, d, v) {
    var f = mtof(m), g = G(0), a = O('sawtooth', f), b = O('sawtooth', f);
    a.detune.value = -9; b.detune.value = 10;
    a.connect(g); b.connect(g); g.connect(ch.in);
    var att = ch.cfg.att || 0.7, rel = ch.cfg.rel || 0.9;
    var end = env(g.gain, t, Math.min(att, d * 0.8 + 0.05), v * 0.2, 1.2, v * 0.17, t + d, rel / 3);
    go([a, b], t, end, [g]);
  };
  // cuerdas frotadas con vibrato
  INST.str = function (ch, t, m, d, v) {
    var f = mtof(m), g = G(0), a = O('sawtooth', f), b = O('sawtooth', f);
    a.detune.value = -6; b.detune.value = 7;
    a.connect(g); b.connect(g); g.connect(ch.in);
    var att = ch.cfg.att || 0.3, rel = ch.cfg.rel || 0.5;
    var end = env(g.gain, t, Math.min(att, d * 0.7 + 0.02), v * 0.22, 0.8, v * 0.19, t + d, rel / 3);
    var vv = vib([a, b], t, rnd(4.8, 5.6), 7, 0.4, end);
    go([a, b, vv[0]], t, end, [g, vv[1]]);
  };
  // coro "aah": fuente glótica + formantes del canal
  INST.choir = function (ch, t, m, d, v) {
    var f = mtof(m), g = G(0), a = O('glot', f), b = O('glot', f), c = O('sawtooth', f * 1.002);
    a.detune.value = -6; b.detune.value = 6; var cg = G(0.25);
    a.connect(g); b.connect(g); c.connect(cg); cg.connect(g); g.connect(ch.in);
    var att = ch.cfg.att || 0.5, rel = ch.cfg.rel || 0.8;
    var end = env(g.gain, t, Math.min(att, d * 0.7 + 0.03), v * 0.5, 1, v * 0.45, t + d, rel / 3);
    var vv = vib([a, b, c], t, rnd(4.6, 5.4), 11, 0.6, end);
    go([a, b, c, vv[0]], t, end, [g, cg, vv[1]]);
  };
  // bajo: seno + sierra filtrada
  INST.bass = function (ch, t, m, d, v) {
    var f = mtof(m), g = G(0), a = O('sine', f), b = O('sawtooth', f), lp = F('lowpass', f * 6, 1.1), bg = G(0.45);
    a.connect(g); b.connect(lp); lp.connect(bg); bg.connect(g); g.connect(ch.in);
    lp.frequency.setValueAtTime(f * 9, t); lp.frequency.setTargetAtTime(f * 2.5, t, 0.12);
    var end = env(g.gain, t, 0.006, v * 0.55, 0.3, v * 0.4, t + d, 0.05);
    go([a, b], t, end, [g, lp, bg]);
  };
  // contrabajo pulsado (walking)
  INST.upright = function (ch, t, m, d, v) {
    var f = mtof(m), g = G(0), a = O('sine', f), b = O('triangle', f * 2), lp = F('lowpass', 900, 0.8), bg = G(0.3);
    a.connect(g); b.connect(lp); lp.connect(bg); bg.connect(g); g.connect(ch.in);
    lp.frequency.setValueAtTime(1800, t); lp.frequency.setTargetAtTime(500, t, 0.08);
    var end = env(g.gain, t, 0.005, v * 0.65, 0.35, v * 0.18, t + d, 0.06);
    go([a, b], t, end, [g, lp, bg]);
  };
  // bajo sintético con filtro resonante
  INST.synbass = function (ch, t, m, d, v) {
    var f = mtof(m), g = G(0), a = O('sawtooth', f), b = O('square', f * 0.5), lp = F('lowpass', f * 4, 7), bg = G(0.4);
    a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); g.connect(ch.in);
    var top = f * (6 + 10 * v);
    lp.frequency.setValueAtTime(top, t); lp.frequency.setTargetAtTime(f * 1.6, t, 0.09);
    var end = env(g.gain, t, 0.004, v * 0.45, 0.2, v * 0.3, t + d, 0.04);
    go([a, b], t, end, [g, lp, bg]);
  };
  INST.sub = function (ch, t, m, d, v) {
    var f = mtof(m), g = G(0), a = O('sine', f);
    a.connect(g); g.connect(ch.in);
    var end = env(g.gain, t, 0.02, v * 0.6, 0.6, v * 0.5, t + d, 0.15);
    go([a], t, end, [g]);
  };
  // piano eléctrico FM
  INST.ep = function (ch, t, m, d, v) {
    var f = mtof(m), g = G(0), c = O('sine', f), mo = O('sine', f), mg = G(0);
    mo.connect(mg); mg.connect(c.frequency); c.connect(g); g.connect(ch.in);
    mg.gain.setValueAtTime(f * (0.9 + 2 * v), t); mg.gain.setTargetAtTime(f * 0.2, t, 0.28);
    var ns = [g, mg], os = [c, mo];
    if (f < 1200) {
      var t2 = O('sine', f * 14), tg = G(0); t2.connect(tg); tg.connect(c.frequency);
      tg.gain.setValueAtTime(f * 0.7 * v, t); tg.gain.setTargetAtTime(0, t, 0.025); os.push(t2); ns.push(tg);
    }
    var end = env(g.gain, t, 0.003, v * 0.42, 1.3, v * 0.06, t + d, 0.14);
    go(os, t, end, ns);
  };
  // marimba FM (minijuego)
  INST.mallet = function (ch, t, m, d, v) {
    var f = mtof(m), g = G(0), c = O('sine', f), mo = O('sine', f * 4), mg = G(0);
    mo.connect(mg); mg.connect(c.frequency); c.connect(g); g.connect(ch.in);
    mg.gain.setValueAtTime(f * 1.6 * v, t); mg.gain.setTargetAtTime(0, t, 0.018);
    var end = env(g.gain, t, 0.002, v * 0.5, 0.22, 0, t + Math.min(d, 0.5), 0.06);
    go([c, mo], t, end, [g, mg]);
  };
  // flauta: seno + soplo + vibrato tardío
  INST.flute = function (ch, t, m, d, v) {
    var f = mtof(m), g = G(0), a = O('sine', f), b = O('triangle', f), bg = G(0.18);
    a.connect(g); b.connect(bg); bg.connect(g); g.connect(ch.in);
    var end = env(g.gain, t, 0.05, v * 0.4, 0.4, v * 0.33, t + d, 0.06);
    var vv = vib([a, b], t, 5.2, 9, 0.45, end);
    var nz = src(getS('white').b, 1, true), nf = F('bandpass', Math.min(f * 2, 8000), 1.5), ng = G(0);
    nz.connect(nf); nf.connect(ng); ng.connect(g);
    ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(v * 0.5, t + 0.012); ng.gain.setTargetAtTime(v * 0.05, t + 0.012, 0.04);
    nz.start(t, Math.random() * 2); nz.stop(end); nz._on = true;
    go([a, b, vv[0], nz], t, end, [g, bg, vv[1], nf, ng]);
  };
  // silbido alegre
  INST.whistle = function (ch, t, m, d, v) {
    var f = mtof(m), g = G(0), a = O('sine', f);
    a.connect(g); g.connect(ch.in);
    a.detune.setValueAtTime(-90, t); a.detune.setTargetAtTime(0, t, 0.025);
    var end = env(g.gain, t, 0.03, v * 0.38, 0.5, v * 0.32, t + d, 0.04);
    var vv = vib([a], t, 6, 14, 0.25, end);
    go([a, vv[0]], t, end, [g, vv[1]]);
  };
  // saxo hortera: caña + filtro + scoop + vibrato
  INST.sax = function (ch, t, m, d, v) {
    var f = mtof(m), g = G(0), a = O('sawtooth', f), b = O('clar', f), bg = G(0.5), lp = F('lowpass', f * 3, 1.5);
    a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); g.connect(ch.in);
    lp.frequency.setValueAtTime(f * 2, t); lp.frequency.linearRampToValueAtTime(f * (4 + 3 * v), t + 0.07); lp.frequency.setTargetAtTime(f * 3.2, t + 0.07, 0.3);
    a.detune.setValueAtTime(-70, t); a.detune.setTargetAtTime(0, t, 0.035);
    b.detune.setValueAtTime(-70, t); b.detune.setTargetAtTime(0, t, 0.035);
    var end = env(g.gain, t, 0.04, v * 0.42, 0.5, v * 0.34, t + d, 0.07);
    var vv = vib([a, b], t, 5.3, 16, Math.min(0.5, d * 0.6), end);
    go([a, b, vv[0]], t, end, [g, bg, lp, vv[1]]);
  };
  // metales (fanfarria)
  INST.brass = function (ch, t, m, d, v) {
    var f = mtof(m), g = G(0), a = O('sawtooth', f), b = O('sawtooth', f), lp = F('lowpass', f * 2, 1.2);
    a.detune.value = -5; b.detune.value = 5;
    a.connect(lp); b.connect(lp); lp.connect(g); g.connect(ch.in);
    lp.frequency.setValueAtTime(f * 1.2, t); lp.frequency.linearRampToValueAtTime(f * (4 + 4 * v), t + 0.06); lp.frequency.setTargetAtTime(f * 3.5, t + 0.06, 0.25);
    var end = env(g.gain, t, 0.03, v * 0.3, 0.4, v * 0.25, t + d, 0.06);
    var vv = vib([a, b], t, 5.5, 6, 0.5, end);
    go([a, b, vv[0]], t, end, [g, lp, vv[1]]);
  };
  // trombón con sordina wah (derrota)
  INST.trombone = function (ch, t, m, d, v, ev) {
    d = Math.max(d, 0.25);
    var f = mtof(m), g = G(0), a = O('sawtooth', f), b = O('square', f), bg = G(0.3), lp = F('lowpass', 400, 4);
    a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(g); g.connect(ch.in);
    var fq = lp.frequency;
    fq.setValueAtTime(350, t); fq.linearRampToValueAtTime(1500, t + 0.14); fq.setTargetAtTime(700, t + 0.14, d * 0.4);
    fq.setValueAtTime(700 + 800 * Math.exp(-(d - 0.14) / (d * 0.4)), t + d); fq.linearRampToValueAtTime(300, t + d + 0.12);
    var end = env(g.gain, t, 0.04, v * 0.42, 0.6, v * 0.36, t + d, 0.07);
    var os = [a, b], ns = [g, bg, lp];
    if (ev.slide) {
      [a, b].forEach(function (o) { o.detune.setValueAtTime(0, t + d * 0.55); o.detune.linearRampToValueAtTime(-100 * ev.slide, t + d + 0.1); });
    }
    if (ev.wob) { var vv = vib([a, b], t, 5.5, 28, d * 0.4, end); os.push(vv[0]); ns.push(vv[1]); }
    go(os, t, end, ns);
  };
  // clarinete sigiloso
  INST.clar = function (ch, t, m, d, v) {
    var f = mtof(m), g = G(0), a = O('clar', f), lp = F('lowpass', Math.min(f * 5, 6000), 0.8);
    a.connect(lp); lp.connect(g); g.connect(ch.in);
    var end = env(g.gain, t, 0.035, v * 0.4, 0.4, v * 0.33, t + d, 0.05);
    var vv = vib([a], t, 5, 6, 0.4, end);
    go([a, vv[0]], t, end, [g, lp, vv[1]]);
  };
  // guitarra eléctrica: power chord (1-5-8) por el drive del canal
  INST.power = function (ch, t, m, d, v, ev) {
    var g = G(0), lp = F('lowpass', ev.pm ? 900 : 3800, 0.9), os = [];
    [0, 7, 12].forEach(function (iv, k) {
      var o = O('sawtooth', mtof(m + iv)); o.detune.value = (k - 1) * 6; o.connect(lp); os.push(o);
    });
    lp.connect(g); g.connect(ch.in);
    var end = env(g.gain, t, 0.004, v * 0.3, ev.pm ? 0.08 : 0.5, v * (ev.pm ? 0.05 : 0.22), t + d, 0.04);
    go(os, t, end, [g, lp]);
  };
  // voz de pulso continua para notas sueltas de gaita (sin mono)
  INST.chanter = function (ch, t, m, d, v) {
    var f = mtof(m), g = G(0), a = O('chanter', f);
    a.connect(g); g.connect(ch.in);
    var end = env(g.gain, t, 0.015, v * 0.4, 0.5, v * 0.36, t + d, 0.03);
    go([a], t, end, [g]);
  };

  // ---------------------------------------------------------------
  // Voz monofónica continua (gaita): legato real + adornos
  // ---------------------------------------------------------------
  function Mono(tr, ch, o) {
    o = o || {};
    this.o1 = O(o.wave || 'chanter', 440); this.o2 = O('sawtooth', 440); this.o2.detune.value = 5;
    this.g2 = G(o.mix2 == null ? 0.22 : o.mix2); this.amp = G(0);
    this.vib = O('sine', o.vibR || 5.4); this.vg = G(o.vibD == null ? 4 : o.vibD);
    this.vib.connect(this.vg); this.vg.connect(this.o1.detune); this.vg.connect(this.o2.detune);
    this.o1.connect(this.amp); this.o2.connect(this.g2); this.g2.connect(this.amp); this.amp.connect(ch.in);
    var t = now();
    this.o1.start(t); this.o2.start(t); this.vib.start(t);
    tr.persist.push(this.o1, this.o2, this.vib); tr.nodes.push(this.g2, this.amp, this.vg);
    this.on = false; this.lastEnd = -1; this.lastN = -1; this.lvl = o.lvl || 0.5; this.lastT = 0;
  }
  Mono.prototype.note = function (t, ev, dur, spb) {
    var a = this.amp.gain, f1 = this.o1.frequency, f2 = this.o2.frequency;
    if (t < this.lastT) t = this.lastT + 0.001;
    var v = (ev.v || 0.7) * this.lvl, f = mtof(ev.n);
    var legIn = this.on && Math.abs(t - this.lastEnd) < 0.03;
    var gl = Math.min(0.045, spb * 0.1);
    var grace = ev.gn != null ? ev.gn : ((ev.orn || (legIn && ev.n === this.lastN)) ? ev.n + (ev.n === this.lastN ? 5 : 2) : null);
    if (grace != null && legIn && t - gl > this.lastT + 0.01) {
      f1.setValueAtTime(mtof(grace), t - gl); f2.setValueAtTime(mtof(grace), t - gl);
    } else if (grace != null && !legIn) {
      f1.setValueAtTime(mtof(grace), t); f2.setValueAtTime(mtof(grace), t);
      a.setValueAtTime(0, t); a.linearRampToValueAtTime(v, t + 0.01);
      t += gl; dur = Math.max(0.03, dur - gl);
    } else if (!legIn) {
      a.setValueAtTime(0, t); a.linearRampToValueAtTime(v, t + 0.014);
    }
    f1.setValueAtTime(f, t); f2.setValueAtTime(f, t);
    if (legIn) { a.setValueAtTime(v * 0.82, t); a.linearRampToValueAtTime(v, t + Math.min(0.03, dur * 0.5)); }
    var te = t + Math.max(dur, 0.05);
    if (!ev.leg) {
      a.setValueAtTime(v, te - 0.012); a.linearRampToValueAtTime(0, te + 0.035);
      this.on = false;
    } else this.on = true;
    this.lastEnd = te; this.lastN = ev.n; this.lastT = te;
  };
  // drones persistentes (ronco de gaita, bordones)
  function drone(tr, ch, notes, wave, lvl, fadeIn) {
    var g = G(0), t = now();
    g.connect(ch.in); tr.nodes.push(g);
    notes.forEach(function (n, i) {
      var o = O(wave || 'clar', mtof(n)); o.detune.value = (i - 1) * 3;
      o.connect(g); o.start(t); tr.persist.push(o);
    });
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lvl, t + (fadeIn || 2));
    return g;
  }
  // lecho de ruido persistente (viento musical)
  function noiseBed(tr, ch, type, lvl) {
    var r = getS(type || 'pink'); if (!r) return;
    var s = src(r.b, 1, true), g = G(lvl);
    s.connect(g); g.connect(ch.in); s.start(now(), Math.random() * 2); tr.persist.push(s); tr.nodes.push(g);
  }

  // ---------------------------------------------------------------
  // Ayudas de composición: notas, melodías, patrones, acordes
  // ---------------------------------------------------------------
  var NN = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function pcOf(s) { return (NN[s[0]] + (s[1] === '#' ? 1 : s[1] === 'b' ? -1 : 0) + 12) % 12; }
  function nm(s) {
    if (typeof s === 'number') return s;
    var m = /^([A-G])([#b]?)(-?\d)$/.exec(s); if (!m) return 60;
    return 12 * (parseInt(m[3], 10) + 1) + NN[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }
  function pd(x) { if (x.indexOf('/') > 0) { var p = x.split('/'); return parseFloat(p[0]) / parseFloat(p[1]); } return parseFloat(x); }
  // melodía: "D5:1 E5:.5~ r:1 F#5:2!"  (~ adorno, ! acento, * picado)
  function mel(E, c, b, str, o) {
    o = o || {};
    var toks = str.replace(/\|/g, ' ').trim().split(/\s+/), out = [], i;
    for (i = 0; i < toks.length; i++) {
      var m = /^([A-G][#b]?-?\d|r)(?::([\d.\/]+))?([~!*]*)$/.exec(toks[i]);
      if (!m) continue;
      var d = m[2] ? pd(m[2]) : (o.d || 1), fl = m[3] || '';
      if (m[1] !== 'r') {
        out.push({ b: b, dd: d, c: c, n: nm(m[1]) + (o.tr || 0), v: (o.v || 0.7) * (fl.indexOf('!') >= 0 ? 1.18 : 1) * (o.hv === false ? 1 : rnd(0.92, 1.04)), orn: fl.indexOf('~') >= 0, st: fl.indexOf('*') >= 0 });
      } else out.push(null);
      b += d;
    }
    for (i = 0; i < out.length; i++) {
      var e = out[i]; if (!e) continue;
      var nx = out[i + 1];
      e.leg = !e.st && (nx ? true : (i === out.length - 1 && !!o.legEnd));
      e.d = e.st ? e.dd * 0.45 : (o.mono ? e.dd : e.dd * (o.gate || 0.92));
      if (o.oct) e.n += 12 * o.oct;
      E.push(e);
    }
    return b;
  }
  // patrón de golpes: x golpe, X acento, o fantasma, . silencio
  function pat(E, c, b, str, step, v, o) {
    str = str.replace(/[|\s]/g, ''); o = o || {};
    for (var i = 0; i < str.length; i++) {
      var ch = str[i]; if (ch !== 'x' && ch !== 'X' && ch !== 'o') continue;
      E.push({ b: b + i * step, d: o.d || step, c: c, n: o.n, s: o.s, r: o.r, v: v * (ch === 'X' ? 1.3 : ch === 'o' ? 0.45 : 1) * rnd(0.9, 1.05) });
    }
    return b + str.length * step;
  }
  var QL = {
    '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], m9: [0, 3, 7, 10, 14],
    maj9: [0, 4, 7, 11, 14], sus2: [0, 2, 7], sus4: [0, 5, 7], '7sus4': [0, 5, 7, 10], dim: [0, 3, 6], dim7: [0, 3, 6, 9],
    add9: [0, 4, 7, 14], madd9: [0, 3, 7, 14], '6': [0, 4, 7, 9], m6: [0, 3, 7, 9], '9': [0, 4, 7, 10, 14], '5': [0, 7],
    aug: [0, 4, 8], m7b5: [0, 3, 6, 10], '69': [0, 4, 7, 9, 14], m11: [0, 3, 7, 10, 14, 17], '7b9': [0, 4, 7, 10, 13]
  };
  function chd(name) {
    var m = /^([A-G][#b]?)([^\/]*)(?:\/([A-G][#b]?))?$/.exec(name);
    if (!m) return { r: 0, iv: [0, 4, 7], bs: 0 };
    var r = pcOf(m[1]);
    return { r: r, iv: QL[m[2]] || QL[''], bs: m[3] ? pcOf(m[3]) : r };
  }
  function near(pc, center) { var lo = center - 6; return lo + (((pc - lo) % 12) + 12) % 12; }
  function voicing(c, center) {
    var out = [];
    c.iv.forEach(function (iv) { var m = near((c.r + iv) % 12, center); if (out.indexOf(m) < 0) out.push(m); });
    return out.sort(function (a, b) { return a - b; });
  }
  function prog(str) {
    var b = 0;
    return str.trim().split(/\s+/).map(function (tk) {
      var p = tk.split(':'), d = p[1] ? pd(p[1]) : 4, o = { c: chd(p[0]), b: b, d: d, name: p[0] };
      b += d; return o;
    });
  }
  // acordes sostenidos
  function padsP(E, c, P, b0, center, v, gate) {
    P.forEach(function (p) { E.push({ b: b0 + p.b, d: p.d * (gate || 1.02), c: c, n: voicing(p.c, center), v: v }); });
  }
  // arpegio: índices sobre [bajo, acorde, acorde+8va]
  function arpP(E, c, P, b0, patt, step, center, v, hold) {
    P.forEach(function (p) {
      var vs = voicing(p.c, center), pool = [near(p.c.bs, center - 12)].concat(vs, vs.map(function (x) { return x + 12; }));
      var n = Math.round(p.d / step);
      for (var i = 0; i < n; i++) {
        var ix = patt[i % patt.length]; if (ix == null || ix < 0) continue;
        E.push({ b: b0 + p.b + i * step, d: hold || step * 3, c: c, n: pool[Math.min(ix, pool.length - 1)], v: v * (i === 0 ? 1.1 : 1) * rnd(0.82, 1.04) });
      }
    });
  }
  // líneas de bajo
  function bassP(E, c, P, b0, style, center, v, bpb) {
    bpb = bpb || 4;
    P.forEach(function (p, k) {
      var r = near(p.c.bs, center), fifth = r + 7 > center + 9 ? r - 5 : r + 7, b = b0 + p.b, i;
      var nx = P[(k + 1) % P.length], nr = near(nx.c.bs, center);
      if (style === 'root') E.push({ b: b, d: p.d, c: c, n: r, v: v });
      else if (style === 'half') { for (i = 0; i < p.d; i += 2) E.push({ b: b + i, d: 1.9, c: c, n: (i / 2) % 2 ? fifth : r, v: v * (i ? 0.9 : 1) }); }
      else if (style === 'waltz') { for (i = 0; i < p.d; i += bpb) E.push({ b: b + i, d: 0.9, c: c, n: (k + i / bpb) % 2 ? fifth : r, v: v }); }
      else if (style === 'eighth') { for (i = 0; i < p.d; i += 0.5) E.push({ b: b + i, d: 0.42, c: c, n: r, v: v * (i % 1 ? 0.8 : 1) }); }
      else if (style === 'off') { for (i = 0; i < p.d; i += 1) { E.push({ b: b + i + 0.5, d: 0.4, c: c, n: r, v: v }); if (chance(0.25)) E.push({ b: b + i + 0.75, d: 0.2, c: c, n: r + 12, v: v * 0.6 }); } }
      else if (style === 'oct') { for (i = 0; i < p.d; i += 0.5) E.push({ b: b + i, d: 0.3, c: c, n: (i * 2) % 2 ? r + 12 : r, v: v * ((i * 2) % 2 ? 0.75 : 1) }); }
      else if (style === 'pulse') { for (i = 0; i < p.d; i += 1) E.push({ b: b + i, d: 0.6, c: c, n: r, v: v * (i ? 0.75 : 1) }); }
      else if (style === 'walk') {
        var tones = [r, r + p.c.iv[1], r + p.c.iv[2], r + (p.c.iv[3] || 12)];
        for (i = 0; i < p.d; i++) {
          var n;
          if (i === 0) n = r;
          else if (i === p.d - 1) n = nr + (chance(0.5) ? 1 : -1);
          else n = pick(tones.slice(1));
          while (n > center + 10) n -= 12; while (n < center - 10) n += 12;
          E.push({ b: b + i, d: 0.9, c: c, n: n, v: v * (i === 0 ? 1.05 : rnd(0.8, 0.95)) });
        }
      }
    });
  }
  // armonía en terceras diatónicas por debajo
  function third(n, scale) {
    for (var k = 3; k <= 4; k++) { if (scale.indexOf(((n - k) % 12 + 12) % 12) >= 0) return n - k; }
    return n - 3;
  }
  function harm(E, src, c, scale, vmul) {
    src.forEach(function (e) { E.push({ b: e.b, d: e.d, c: c, n: third(e.n, scale), v: e.v * (vmul || 0.7), leg: e.leg }); });
  }
  function slice(E, from) { return E.slice(from); }
  var SC = { D: [2, 4, 6, 7, 9, 11, 0], G: [7, 9, 11, 0, 2, 4, 6], C: [0, 2, 4, 5, 7, 9, 11], A: [9, 11, 1, 2, 4, 6, 8], Am: [9, 11, 0, 2, 4, 5, 7], Eb: [3, 5, 7, 8, 10, 0, 2], Dm: [2, 4, 5, 7, 9, 10, 0] };

  // ---------------------------------------------------------------
  // Secuenciador con look-ahead
  // ---------------------------------------------------------------
  function holdRamp(p, t, target, dur) {
    if (p.cancelAndHoldAtTime) { try { p.cancelAndHoldAtTime(t); } catch (e) { var v0 = p.value; p.cancelScheduledValues(t); p.setValueAtTime(v0, t); } }
    else { var v = p.value; p.cancelScheduledValues(t); p.setValueAtTime(v, t); }
    p.linearRampToValueAtTime(target, t + dur);
  }

  function Track(name, def, fade) {
    var t = now(), self = this;
    this.name = name; this.def = def; this.nodes = []; this.persist = [];
    this.dry = G(0); this.wet = G(0); this.echo = G(0);
    this.dry.connect(B.mus.dry.in); this.wet.connect(B.mus.wet.in); this.echo.connect(B.mus.echo.in);
    var lvl = def.gain || 1; // nivelado de sonoridad entre pistas
    [this.dry, this.wet, this.echo].forEach(function (g) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lvl, t + fade); });
    this.ch = {};
    Object.keys(def.ch).forEach(function (k) {
      try {
        var cfg = def.ch[k], c = mkChannel(self, cfg);
        if (cfg.mono) c.mono = new Mono(self, c, cfg.mono);
        self.ch[k] = c;
      } catch (e) {} // un canal roto no tumba la pista
    });
    if (def.init) { try { def.init(this); } catch (e) {} }
    this.lenB = def.bars * (def.bpb || 4);
    this.loopN = 0; this.loopB = 0; this.refT = t + 0.06; this.refB = 0; this.idx = 0; this.dying = 0;
    this.events = this.make(0);
    setEcho(60 / def.bpm * (def.echoB || 0.75));
  }
  Track.prototype.make = function (n) {
    var E = [], len = this.lenB, sw = this.def.swing;
    try { this.def.build(E, n, this); } catch (e) { E = []; }
    if (sw) E.forEach(function (e) { var fr = e.b - Math.floor(e.b); if (Math.abs(fr - 0.5) < 0.01) e.b += sw; });
    E = E.filter(function (e) { return e && isFinite(e.b) && e.b >= 0 && e.b < len; });
    E.sort(function (a, b) { return a.b - b.b; });
    if (!E.length) E.push({ b: 0, d: 0.1, c: '_', n: 60, v: 0 });
    return E;
  };
  Track.prototype.tick = function (hz, tn) {
    if (this.dying && tn > this.dying) return;
    var spb = 60 / this.def.bpm * (1 + 0.08 * drunkC), guard = 0;
    while (guard++ < 400) {
      if (this.idx >= this.events.length) {
        this.loopN++; this.loopB += this.lenB; this.events = this.make(this.loopN); this.idx = 0;
        continue;
      }
      var ev = this.events[this.idx], ab = this.loopB + ev.b;
      var t = this.refT + (ab - this.refB) * spb;
      if (t > hz) break;
      if (t < tn - 0.1) { var sh = tn + 0.03 - t; this.refT += sh; t += sh; }
      this.refT = t; this.refB = ab;
      if (t < tn) t = tn;
      try { playEv(this, ev, t, spb); } catch (e) {}
      this.idx++;
    }
  };
  Track.prototype.stop = function (fade) {
    var t = now(); this.dying = t + fade;
    [this.dry, this.wet, this.echo].forEach(function (g) { holdRamp(g.gain, t, 0, fade); });
  };
  Track.prototype.kill = function () {
    this.persist.forEach(function (s) { try { s.stop(); } catch (e) {} try { s.disconnect(); } catch (e) {} });
    this.nodes.concat([this.dry, this.wet, this.echo]).forEach(function (n) { try { n.disconnect(); } catch (e) {} });
    this.persist = []; this.nodes = [];
  };
  function playEv(tr, ev, t, spb) {
    var ch = tr.ch[ev.c]; if (!ch) return;
    var d = (ev.d || 0.5) * spb;
    if (ch.mono) { ch.mono.note(t, ev, d, spb); return; }
    if (voices > MAXV) return;
    var fn = INST[ch.cfg.inst]; if (!fn) return;
    var v = clamp(ev.v == null ? 0.7 : ev.v, 0, 1.5), hum = ch.cfg.hum || 0;
    if (ev.n && ev.n.length) {
      var k = Math.min(1, 1.25 / Math.sqrt(ev.n.length)), st = ev.strum || ch.cfg.strum || 0;
      for (var i = 0; i < ev.n.length; i++) fn(ch, t + i * st + (hum ? rnd(0, hum) : 0), ev.n[i], d, v * k, ev);
    } else {
      var tt = t + (hum ? rnd(0, hum) : 0), n0 = ev.n == null ? 60 : ev.n;
      if (ev.orn && tt - 0.055 > now()) fn(ch, tt - 0.055, ev.gn || n0 + 2, 0.06, v * 0.6, {});
      fn(ch, tt, n0, d, v, ev);
    }
  }

  // ---------------------------------------------------------------
  // Motor de ambientes: lechos continuos + eventos aleatorios
  // ---------------------------------------------------------------
  function Bed(name, def, fade) {
    var t = now();
    this.name = name; this.nodes = []; this.persist = []; this.dying = 0;
    this.out = G(0); this.wetG = G(0);
    this.out.connect(B.amb.dry); this.wetG.connect(B.amb.wet);
    var lvl = def.gain || 1;
    [this.out, this.wetG].forEach(function (g) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lvl, t + fade); });
    this.dest = { dry: this.out, wet: this.wetG };
    this.gens = [];
    try { def.init(this); } catch (e) {}
    var self = this;
    (def.gens || []).forEach(function (g) { self.gens.push({ min: g[0], max: g[1], fn: g[2], next: t + rnd(0.3, Math.min(g[1], 6)) }); });
  }
  Bed.prototype.tick = function (hz, tn) {
    if (this.dying && tn > this.dying) return;
    for (var i = 0; i < this.gens.length; i++) {
      var g = this.gens[i], guard = 0;
      while (g.next < hz && guard++ < 20) {
        var t = Math.max(g.next, tn);
        if (voices < MAXV) { try { g.fn(this, t); } catch (e) {} }
        g.next = t + rnd(g.min, g.max);
      }
    }
  };
  Bed.prototype.kill = function () {
    this.persist.forEach(function (s) { try { s.stop(); } catch (e) {} try { s.disconnect(); } catch (e) {} });
    this.nodes.concat([this.out, this.wetG]).forEach(function (n) { try { n.disconnect(); } catch (e) {} });
    this.persist = []; this.nodes = [];
  };
  Bed.prototype.stopFade = function (fade) {
    var t = now(); this.dying = t + fade;
    [this.out, this.wetG].forEach(function (g) { holdRamp(g.gain, t, 0, fade); });
  };
  // capa continua de ruido filtrado: filtros [[tipo,f,q,lfo?]], nivel, pan
  function layer(bed, type, filters, lvl, opt) {
    opt = opt || {};
    var r = getS(type); if (!r) return null;
    var s = src(r.b, opt.rate || 1, true), last = s, ns = bed.nodes, t = now();
    filters.forEach(function (fc) {
      var f = F(fc[0], fc[1], fc[2]); last.connect(f); last = f; ns.push(f);
      if (fc[3]) { var lo = O('sine', fc[3][0]), lg = G(fc[3][1]); lo.connect(lg); lg.connect(f.frequency); lo.start(t); bed.persist.push(lo); ns.push(lg); }
    });
    var g = G(lvl); last.connect(g); ns.push(g);
    if (opt.am) { // modulación lenta de amplitud
      var am = G(1 - opt.am[1]), lo2 = O('sine', opt.am[0]), lg2 = G(opt.am[1]);
      lo2.connect(lg2); lg2.connect(am.gain); lo2.start(t); bed.persist.push(lo2); ns.push(am, lg2);
      g.connect(am); g = am;
    }
    g.connect(bed.out);
    if (opt.wet) { var w = G(opt.wet); g.connect(w); w.connect(bed.wetG); ns.push(w); }
    s.start(t, Math.random() * (r.b.duration - 0.1)); bed.persist.push(s);
    return g;
  }
  // tono continuo (zumbidos, motores)
  function tone(bed, type, f, lvl, filters, lfo) {
    var o = O(type, f), last = o, t = now(), ns = bed.nodes;
    (filters || []).forEach(function (fc) { var fl = F(fc[0], fc[1], fc[2]); last.connect(fl); last = fl; ns.push(fl); });
    var g = G(lvl); last.connect(g); g.connect(bed.out); ns.push(g);
    if (lfo) { var lo = O('sine', lfo[0]), lg = G(lfo[1]); lo.connect(lg); lg.connect(o.frequency); lo.start(t); bed.persist.push(lo); ns.push(lg); }
    o.start(t); bed.persist.push(o);
    return { o: o, g: g };
  }

  // ---------------------------------------------------------------
  // PISTAS DE MÚSICA
  // ---------------------------------------------------------------
  // filtros de timbre compartidos
  var GF = [['highpass', 260, 0.7], ['peaking', 1150, 1.2, 4], ['peaking', 2800, 1.5, 3], ['lowpass', 5200, 0.7]]; // gaita
  var AF = [['highpass', 160, 0.7], ['peaking', 1300, 1, 3], ['lowpass', 3800, 0.7]];                             // acordeón
  var SXF = [['peaking', 700, 1.2, 4], ['peaking', 1700, 1.5, 3], ['lowpass', 4500, 0.7]];                         // saxo
  // formantes de coro (ganancia compensada: los pasabanda estrechos dejan pasar poco)
  var VA = [[750, 5, 4], [1200, 7, 2.2], [2650, 9, 1.2]];    // vocal "a"
  var VO = [[430, 5, 3.2], [850, 7, 1.5], [2500, 9, 0.6]];   // vocal "o"
  var VU = [[330, 5, 2.6], [760, 7, 0.8], [2400, 9, 0.3]];   // vocal "u"
  // himno del Club de Caballeros (gancho de 4 compases + respuesta)
  var HOOK1 = 'A4:.75 D5:.25 D5:1~ E5:.5 F#5:.5 A5:1 | G5:.75 F#5:.25 E5:1 D5:.5 E5:.5 F#5:1 | A5:.75 G5:.25 F#5:.5 E5:.5 D5:.5 C5:.5 E5:1 | D5:3~ r:1';
  var HOOK2 = 'A4:.75 D5:.25 D5:1~ E5:.5 F#5:.5 A5:1 | B5:.75 A5:.25 G5:1 F#5:.5 G5:.5 A5:1 | D6:1~ C6:.5 B5:.5 A5:.5 G5:.5 F#5:.5 E5:.5 | D5:3~ r:1';
  var HOOKB = 'F#5:1.5 E5:.5 D5:1 B4:1 | D5:1.5 E5:.5 G5:2 | E5:1 F#5:.5 E5:.5 C#5:1 A4:1 | D5:4 | F#5:1.5 G5:.5 A5:1 B5:1 | G5:1.5 F#5:.5 E5:1 D5:1 | E5:1 G5:1 F#5:1 E5:1 | A5:2 G5:.5 F#5:.5 E5:1';
  var PROG_A = 'D:4 G:4 C:2 Am:2 D:4 D:4 G:4 C:2 G:2 D:4';
  var PROG_B = 'Bm:4 G:4 A:4 D:4 Bm:4 G:4 Em:4 A:4';

  var T = {};

  // --- Título: épico-folk, gaita sobre ronco ---
  T.titulo = {
    bpm: 96, gain: 1, bars: 32,
    ch: {
      gaita: { mono: { lvl: 0.5 }, g: 0.3, rev: 0.22, echo: 0.07, f: GF },
      gh: { inst: 'chanter', g: 0.09, rev: 0.25, f: GF, pan: 0.3 },
      drone: { g: 0.15, f: [['lowpass', 1100, 0.7]], rev: 0.2 },
      str: { inst: 'str', g: 0.15, att: 0.7, rel: 1.2, f: [['lowpass', 2400, 0.7]], rev: 0.35, pan: -0.15 },
      choir: { inst: 'choir', g: 0.2, fmt: VA, rev: 0.5, att: 0.8 },
      harp: { inst: 'harp', g: 0.19, rev: 0.3, pan: -0.3, hum: 0.006 },
      bass: { inst: 'bass', g: 0.3 },
      bombo: { inst: 'smp', s: 'bombo', g: 0.4, rev: 0.15 },
      pand: { inst: 'smp', s: 'pand', g: 0.13, pan: 0.35, rev: 0.12 },
      timp: { inst: 'timp', g: 0.3, rev: 0.35 },
      bell: { inst: 'bell', g: 0.1, rev: 0.45, echo: 0.12, pan: 0.2 }
    },
    init: function (tr) { drone(tr, tr.ch.drone, [38, 50], 'clar', 0.5, 3); },
    build: function (E, n) {
      var PA = prog(PROG_A), PB = prog(PROG_B), PC = prog('D:4 C:4 G:4 D:4 D:4 C:4 G:4 A:4');
      mel(E, 'gaita', 0, HOOK1 + ' ' + HOOK2, { mono: true, v: 0.72 });
      mel(E, 'gaita', 32, HOOKB, { mono: true, v: 0.66 });
      var k = E.length; mel(E, 'gaita', 64, HOOK1 + ' ' + HOOK2, { mono: true, v: 0.8 });
      harm(E, E.slice(k), 'gh', SC.D, 0.6);
      if (n % 2 === 1) mel(E, 'gaita', 96, 'A5:4~ G5:4 B5:4 A5:4 | A5:4~ C6:4 B5:2 D6:2 C#6:4', { mono: true, v: 0.55 });
      padsP(E, 'str', PA, 0, 62, 0.45); padsP(E, 'str', PB, 32, 62, 0.5); padsP(E, 'str', PA, 64, 62, 0.5); padsP(E, 'str', PC, 96, 60, 0.55);
      padsP(E, 'choir', PA, 64, 60, 0.55); padsP(E, 'choir', prog('D:4 C:4 G:4 A:4'), 112, 57, 0.5);
      var hp = pick([[0, 2, 3, 4, 5, 4, 3, 2], [0, 3, 2, 4, 3, 5, 4, 2], [0, 2, 4, 5, 6, 5, 4, 2]]);
      arpP(E, 'harp', PA, 0, hp, 0.5, 62, 0.4); arpP(E, 'harp', PB, 32, [0, 1, 2, 3, 4, 3, 2, 1], 0.5, 60, 0.36);
      arpP(E, 'harp', PA, 64, hp, 0.5, 62, 0.32); arpP(E, 'harp', PC, 96, [0, 2, 3, 4, -1, 4, 3, -1], 0.5, 62, 0.4);
      bassP(E, 'bass', PA, 0, 'root', 40, 0.55); bassP(E, 'bass', PB, 32, 'half', 40, 0.55);
      bassP(E, 'bass', PA, 64, 'half', 40, 0.65); bassP(E, 'bass', PC, 96, 'root', 40, 0.5);
      for (var i = 0; i < 32; i++) {
        var b = i * 4, sec = Math.floor(i / 8), last = i % 8 === 7;
        if (sec === 0) { pat(E, 'bombo', b, last ? pick(['X...x.xx', 'X...xxXX']) : 'X...x...', 0.5, 0.65); pat(E, 'pand', b, 'xoxoxoxo', 0.5, 0.5); }
        else if (sec === 1) { pat(E, 'bombo', b, last ? 'x..xx.XX' : 'X.......', 0.5, 0.55); pat(E, 'pand', b, 'x...x...', 0.5, 0.45); }
        else if (sec === 2) { pat(E, 'bombo', b, last ? pick(['X.xxX.XX', 'XxxxXXXX']) : 'X..xX...', 0.5, 0.75); pat(E, 'pand', b, 'XoxoXoxx', 0.5, 0.55); }
        else {
          pat(E, 'bombo', b, i === 31 ? 'xxxxxxXX' : (i === 30 ? 'x.x.x.x.' : 'X.......'), 0.5, 0.42 + (i - 24) * 0.045);
          if (i >= 28) pat(E, 'pand', b, 'x.x.x.x.', 0.5, 0.4);
        }
      }
      E.push({ b: 0, d: 4, c: 'timp', n: 38, v: 0.7 }, { b: 32, d: 4, c: 'timp', n: 35, v: 0.6 }, { b: 64, d: 4, c: 'timp', n: 38, v: 0.85 });
      pat(E, 'timp', 124, 'ooooxxxxxxxxXXXX', 0.25, 0.45, { n: 33 });
      mel(E, 'bell', 96, 'A5:.75 D6:.25 D6:1 E6:.5 F#6:.5 A6:1 | G6:.75 E6:.25 C6:1 G5:2', { v: 0.55 });
      mel(E, 'bell', 112, 'A5:.75 D6:.25 D6:1 E6:.5 F#6:.5 A6:1 | G6:.75 E6:.25 C6:1 ' + (n % 2 ? 'E6:2' : 'G5:2'), { v: 0.5 });
    }
  };

  // --- Intro: nostalgia mediterránea, guitarra y arpa ---
  T.intro = {
    bpm: 80, gain: 2.8, bars: 24,
    ch: {
      lead: { inst: 'harp', g: 0.26, rev: 0.35, echo: 0.12, pan: 0.15, hum: 0.006 },
      gtr: { inst: 'guitar', g: 0.23, rev: 0.22, pan: -0.25, hum: 0.008 },
      pad: { inst: 'pad', g: 0.1, att: 1.6, rel: 2.4, f: [['lowpass', 1300, 0.7, [0.06, 400]]], rev: 0.45 },
      fl: { inst: 'flute', g: 0.2, rev: 0.4, echo: 0.12, pan: 0.1 },
      sub: { inst: 'sub', g: 0.14 },
      cel: { inst: 'celesta', g: 0.07, rev: 0.55, echo: 0.25, pan: 0.35 }
    },
    build: function (E, n) {
      var PA = prog(PROG_A), PB = prog('Bm:4 A:4 G:4 F#:4 Bm:4 A:4 G:4 F#:2 A7:2');
      mel(E, 'lead', 0, HOOK1 + ' ' + HOOK2, { v: 0.6 });
      mel(E, 'lead', 32, 'F#5:1.5 E5:.5 D5:1 C#5:1 | E5:1.5 D5:.5 C#5:1 B4:1 | D5:1 C#5:.5 B4:.5 A4:1 G4:1 | A#4:3 r:1 | B4:1 D5:1 F#5:1.5 E5:.5 | E5:1 C#5:1 A4:1.5 C#5:.5 | D5:1 B4:1 G4:1 B4:1 | A#4:2 C#5:1 E5:1', { v: 0.58 });
      if (n % 2) mel(E, 'fl', 64, HOOK1 + ' ' + HOOK2, { v: 0.55 });
      else { mel(E, 'fl', 64, HOOK1, { v: 0.55 }); mel(E, 'lead', 80, HOOK2, { v: 0.6 }); }
      var gp = pick([[0, 2, 3, 4, 1, 3, 2, 4], [0, 3, 2, 4, 1, 4, 2, 3]]);
      [[PA, 0], [PB, 32], [PA, 64]].forEach(function (s) {
        arpP(E, 'gtr', s[0], s[1], gp, 0.5, 57, 0.4);
        padsP(E, 'pad', s[0], s[1], 62, 0.38);
        bassP(E, 'sub', s[0], s[1], 'root', 40, 0.5);
      });
      for (var b = 0; b < 96; b += 8) if (chance(0.5)) E.push({ b: b + pick([0, 2, 3.5, 6]), d: 1, c: 'cel', n: pick([81, 83, 86, 88, 90, 93]), v: rnd(0.35, 0.6) });
    }
  };

  // --- Bar Estrella: vals/mazurca de taberna gallega ---
  var EST_A = 'D5:1 G5:1 B5:1 | A5:2 G5:1 | F#5:1 A5:1 C6:1 | B5:2 A5:1 | A5:1 F#5:.5 G5:.5 A5:1 | C6:1 B5:1 A5:1 | G5:1 B5:1 D6:1 | G5:2 D5:1 | D5:1 G5:1 B5:1 | D6:1.5 C6:.5 B5:1 | E6:1 C6:1 A5:1 | G5:2 E5:1 | D5:1 G5:1 B5:1 | A5:1 C6:1 F#5:1 | G5:3 | G5:1 r:2';
  var EST_B = 'B4:1 E5:1 G5:1 | F#5:2 D#5:1 | A5:1 F#5:1 D#5:1 | E5:3 | G5:1 F#5:1 E5:1 | E5:1 A5:1 C6:1 | C6:1 B5:.5 A5:.5 F#5:1 | G5:3 | E5:1 G5:1 C6:1 | C6:1 A5:1 F#5:1 | B5:1 D6:1 B5:1 | G5:2 E5:1 | A5:1 C6:1 E6:1 | D6:1 C6:1 F#5:1 | G5:3 | G5:1 r:1 D5:1';
  T.estrella = {
    bpm: 120, gain: 1.8, bpb: 3, bars: 48,
    ch: {
      acc: { inst: 'acc', g: 0.3, f: AF, rev: 0.18, trem: [0.3, 0.1], pan: 0.1 },
      acch: { inst: 'acc', g: 0.15, f: AF, rev: 0.18, pan: 0.3 },
      gtr: { inst: 'guitar', g: 0.2, pan: -0.3, strum: 0.012, hum: 0.004, cut: true, rev: 0.15 },
      bass: { inst: 'upright', g: 0.42 },
      br: { inst: 'smp', s: 'brushtap', g: 0.07, pan: 0.25 }
    },
    build: function (E, n) {
      var PA = prog('G:3 G:3 D7:3 D7:3 D7:3 D7:3 G:3 G:3 G:3 G7:3 C:3 C:3 G/D:3 D7:3 G:3 G:3');
      var PB = prog('Em:3 B7:3 B7:3 Em:3 Em:3 Am:3 D7:3 G:3 C:3 D7:3 G:3 Em:3 Am:3 D7:3 G:3 G:3');
      mel(E, 'acc', 0, EST_A, { v: 0.7 });
      mel(E, 'acc', 48, EST_B, { v: 0.68, tr: n % 2 ? 0 : 0 });
      var k = E.length; mel(E, 'acc', 96, EST_A, { v: 0.72 });
      harm(E, E.slice(k), 'acch', SC.G, 0.6);
      E.forEach(function (e) { if (e.c === 'acc' && e.dd >= 1 && chance(0.18)) e.orn = true; });
      [[PA, 0], [PB, 48], [PA, 96]].forEach(function (s) {
        bassP(E, 'bass', s[0], s[1], 'waltz', 43, 0.6, 3);
        s[0].forEach(function (p) {
          var vs = voicing(p.c, 60);
          E.push({ b: s[1] + p.b + 1, d: 0.5, c: 'gtr', n: vs, v: 0.5 }, { b: s[1] + p.b + 2, d: 0.5, c: 'gtr', n: vs, v: 0.42 });
        });
        for (var i = 0; i < 16; i++) pat(E, 'br', s[1] + i * 3, 'oxx', 1, 0.5);
      });
    }
  };

  // --- Tensión cómica: ¡que vuelve la señora! ---
  T.tension = {
    bpm: 132, gain: 1.6, bars: 32,
    ch: {
      pz: { inst: 'pizz', g: 0.42, rev: 0.15, hum: 0.003 },
      clar: { inst: 'clar', g: 0.12, rev: 0.2, pan: 0.25 },
      bass: { inst: 'bass', g: 0.26 },
      hat: { inst: 'smp', s: 'hat', g: 0.09, pan: 0.3 },
      tk: { inst: 'smp', s: 'wood', g: 0.1, pan: -0.3, rev: 0.1 },
      str: { inst: 'str', g: 0.08, att: 0.2, rel: 0.4, f: [['lowpass', 1800, 0.7]], rev: 0.3 },
      cel: { inst: 'celesta', g: 0.1, rev: 0.35, echo: 0.15 }
    },
    build: function (E, n) {
      var M1 = 'E3:.5 r:.5 G3:.5 r:.5 A3:.5 r:.5 A#3:.5 B3:.5 | r:.5 E4:.5 r:.5 D4:.5 r:.5 B3:.5 r:.5 A3:.5';
      var M2 = 'E3:.5 r:.5 G3:.5 r:.5 A3:.5 r:.5 A#3:.5 B3:.5 | r:.5 G4:.5 F#4:.5 F4:.5 E4:1 r:1';
      var roots = [40, 40, 36, 35];
      for (var s = 0; s < 4; s++) {
        var b0 = s * 32, tr = s === 2 ? 5 : 0;
        mel(E, 'pz', b0, M1 + ' ' + M2 + ' ' + M1 + ' ' + (n % 2 ? M2 : M1), { v: 0.75, tr: tr, gate: 0.5 });
        if (s === 3) mel(E, 'clar', b0, M1 + ' ' + M2 + ' ' + M1 + ' ' + M2, { v: 0.6, tr: 12, gate: 0.5 });
        for (var i = 0; i < 8; i++) {
          var b = b0 + i * 4, r = roots[i % 4] + tr;
          pat(E, 'bass', b, 'Xxxxxxxx', 0.5, 0.5, { n: r, d: 0.35 });
          if (s === 0) pat(E, 'hat', b, 'x.x.x.x.', 0.5, 0.6); else pat(E, 'hat', b, 'xoxoXoxoxoxoXoxo', 0.25, 0.55);
          pat(E, 'tk', b, 'x.x.', 1, 0.6, { r: 1 }); pat(E, 'tk', b, '.x.x', 1, 0.5, { r: 0.72 });
        }
        if (s === 2) { [[45, 52], [46, 53], [47, 54], [48, 55]].forEach(function (nn, j) { E.push({ b: b0 + j * 8, d: 8, c: 'str', n: nn, v: 0.5 + j * 0.08 }); }); }
        else if (s > 0) E.push({ b: b0, d: 32, c: 'str', n: [40, 47], v: 0.35 });
        E.push({ b: b0 + 31, d: 0.5, c: 'cel', n: 88, v: 0.6 }, { b: b0 + 31.5, d: 0.5, c: 'cel', n: 83, v: 0.5 });
      }
    }
  };

  // --- Bodega: arpegios misteriosos, bordón grave, gotas ---
  T.bodega = {
    bpm: 70, gain: 1.1, bars: 24,
    ch: {
      harp: { inst: 'harp', g: 0.22, rev: 0.45, echo: 0.14, pan: 0.2, hum: 0.012 },
      gtr: { inst: 'guitar', g: 0.2, rev: 0.3, pan: -0.25, hum: 0.01 },
      drone: { g: 0.2, f: [['lowpass', 420, 0.8, [0.05, 120]]], rev: 0.3 },
      drip: { inst: 'drop', g: 0.08, rev: 0.55, echo: 0.35, pan: 0.35 },
      str: { inst: 'str', g: 0.08, att: 2.5, rel: 3, f: [['lowpass', 1200, 0.7]], rev: 0.5 },
      cel: { inst: 'celesta', g: 0.07, rev: 0.6, echo: 0.3, pan: -0.3 },
      mel: { inst: 'harp', g: 0.2, rev: 0.5, echo: 0.2, pan: -0.1 }
    },
    init: function (tr) { drone(tr, tr.ch.drone, [33, 45], 'clar', 0.45, 4); },
    build: function (E, n) {
      var PA = prog('Am:4 Fmaj7:4 Dm:4 E7:4 Am:4 F:4 Dm:4 E:4'), PB = prog('F:4 G:4 Em:4 Am:4 Dm:4 Am:4 Bdim:4 E7:4');
      var pats = [[0, 2, 3, 4, 5, 4, 3, 2], [0, 3, 4, 5, 4, 3, 2, 1], [0, 2, 4, 3, 5, 4, 2, 3]];
      [[PA, 0], [PB, 32], [PA, 64]].forEach(function (s) {
        arpP(E, 'harp', s[0], s[1], pick(pats), 0.5, 64, 0.38);
        arpP(E, 'gtr', s[0], s[1], [0, -1, 2, -1], 1, 52, 0.4);
      });
      padsP(E, 'str', PB, 32, 57, 0.5);
      mel(E, 'mel', 64, 'E5:2 C5:2 | A4:4 | F5:2 D5:2 | B4:3 G#4:1 | E5:2 C5:2 | A4:4 | D5:2 F5:2 | E5:4', { v: 0.6 });
      for (var b = 0; b < 96; b += 0.5) if (chance(0.12)) E.push({ b: b, d: 0.5, c: 'drip', n: pick([81, 84, 86, 88, 91, 93]), v: rnd(0.4, 0.8) });
      for (b = 0; b < 96; b += 4) if (chance(0.35)) E.push({ b: b + pick([0, 1.5, 2, 3]), d: 1, c: 'cel', n: pick([76, 79, 81, 84, 88]), v: rnd(0.3, 0.55) });
    }
  };

  // --- Plaza de noche: guitarra punteada, pad, gaita lejana ---
  T.plaza = {
    bpm: 88, gain: 3.2, bars: 32,
    ch: {
      gtr: { inst: 'guitar', g: 0.27, rev: 0.25, pan: -0.12, hum: 0.008 },
      pad: { inst: 'pad', g: 0.09, att: 1.8, rel: 2.5, f: [['lowpass', 1500, 0.7, [0.05, 500]]], rev: 0.5 },
      gaita: { mono: { lvl: 0.45 }, g: 0.13, f: GF.concat([['lowpass', 2600, 0.7]]), rev: 0.75, echo: 0.3, pan: 0.45 },
      cel: { inst: 'celesta', g: 0.06, rev: 0.55, echo: 0.3, pan: 0.3 },
      sub: { inst: 'sub', g: 0.15 }
    },
    build: function (E, n) {
      var PA = prog('G:4 Em:4 C:4 D:4 G:4 Bm:4 C:4 D:4'), PB = prog('Em:4 C:4 G:4 D:4 C:4 D:4 G:4 G:4');
      var tp = pick([[0, 3, 1, 4, 0, 3, 2, 4], [0, 2, 4, 3, 0, 2, 3, 4], [0, 3, 4, 2, 0, 3, 4, 1]]);
      [[PA, 0], [PB, 32], [PA, 64], [PB, 96]].forEach(function (s) {
        arpP(E, 'gtr', s[0], s[1], tp, 0.5, 60, 0.42);
        padsP(E, 'pad', s[0], s[1], 62, 0.4);
        bassP(E, 'sub', s[0], s[1], 'root', 40, 0.5);
      });
      mel(E, 'gaita', n % 2 ? 96 : 32, 'D5:2~ E5:1 G5:1 | A5:3 G5:1 | E5:2 D5:1 B4:1 | D5:4 | G5:2~ A5:1 B5:1 | A5:2 G5:1 E5:1 | D5:2 E5:1 D5:1 | B4:4', { mono: true, v: 0.6 });
      for (var b = 0; b < 128; b += 8) if (chance(0.5)) E.push({ b: b + pick([0, 2, 3.5]), d: 1, c: 'cel', n: pick([79, 83, 86, 88, 91]), v: rnd(0.35, 0.6) });
    }
  };

  // --- Calle: paseo de vinos, contrabajo caminando + escobillas ---
  var CAL_A = 'E5:.5 G5:.5 C6:1 B5:.5 A5:.5 G5:1 | A5:1.5 G5:.5 E5:1 C#5:1 | D5:.5 F5:.5 A5:1 G5:.5 F5:.5 D5:1 | G5:3 r:1 | E5:.5 G5:.5 C6:1 B5:.5 A5:.5 G5:1 | A5:1.5 G5:.5 E5:1 C#5:1 | D5:.5 F#5:.5 A5:1 C6:.5 B5:.5 A5:1 | G5:2 r:2';
  var CAL_B = 'A5:1 C6:1 A5:.5 G5:.5 F5:1 | A5:1 C6:1 Eb6:2 | E6:1.5 D6:.5 C6:1 G5:1 | A5:1 C#6:1 E6:1 G6:1 | F#6:1.5 E6:.5 D6:1 C6:1 | B5:1 D6:1 F6:2 | E6:1 C6:1 G5:1 E5:1 | D5:1 F5:1 G5:1 B5:1';
  T.calle = {
    bpm: 104, gain: 1.6, bars: 32, swing: 0.16,
    ch: {
      bass: { inst: 'upright', g: 0.45 },
      gtr: { inst: 'guitar', g: 0.17, pan: -0.28, strum: 0.008, cut: true, rev: 0.12 },
      br: { inst: 'smp', s: 'brush', g: 0.14, pan: 0.2, rev: 0.1 },
      hat: { inst: 'smp', s: 'hat', g: 0.05, pan: 0.35 },
      wh: { inst: 'whistle', g: 0.2, rev: 0.25, echo: 0.1, pan: 0.1 },
      acc: { inst: 'acc', g: 0.2, f: AF, rev: 0.2, pan: 0.15 }
    },
    build: function (E, n) {
      var PA = prog('C:4 A7:4 Dm:4 G7:4 C:4 A7:4 D7:4 G7:4'), PB = prog('F:4 F#dim7:4 C/G:4 A7:4 D7:4 G7:4 C:4 G7:4');
      [[PA, 0], [PA, 32], [PB, 64], [PA, 96]].forEach(function (s) {
        bassP(E, 'bass', s[0], s[1], 'walk', 40, 0.62);
        s[0].forEach(function (p) { var vs = voicing(p.c, 58); for (var j = 0; j < p.d; j++) E.push({ b: s[1] + p.b + j, d: 0.35, c: 'gtr', n: vs, v: j % 2 ? 0.5 : 0.38 }); });
        for (var i = 0; i < 8; i++) {
          var b = s[1] + i * 4;
          pat(E, 'br', b, 'x.x.', 1, 0.5, { s: 'brush' }); pat(E, 'br', b, '.x.x', 1, 0.55, { s: 'brushtap' });
          pat(E, 'br', b, '.o.o.o.o', 0.5, 0.7, { s: 'brushtap' }); pat(E, 'hat', b, '.x.x', 1, 0.5);
        }
      });
      mel(E, 'wh', 0, CAL_A, { v: 0.65 });
      if (n % 2) mel(E, 'wh', 32, CAL_A, { v: 0.6, tr: 12 * 0 }); else mel(E, 'acc', 32, CAL_A, { v: 0.6, tr: -12 });
      mel(E, 'acc', 64, CAL_B, { v: 0.62, tr: -12 });
      mel(E, 'wh', 96, CAL_A, { v: 0.7 }); mel(E, 'acc', 96, CAL_A, { v: 0.45, tr: -12 });
    }
  };

  // --- Bareto: folk-rock gallego con gaita ---
  var EGF = [['highpass', 90, 0.7], ['peaking', 1800, 1, 3], ['lowpass', 4200, 0.7]];
  T.bareto = {
    bpm: 128, gain: 1, bars: 32,
    ch: {
      kick: { inst: 'smp', s: 'kick', g: 0.48 },
      snare: { inst: 'smp', s: 'snare', g: 0.3, rev: 0.12 },
      hat: { inst: 'smp', s: 'hat', g: 0.1, pan: 0.25 },
      crash: { inst: 'smp', s: 'crash', g: 0.1, pan: -0.2, rev: 0.1 },
      bass: { inst: 'bass', g: 0.36 },
      g1: { inst: 'power', g: 0.1, drive: 4, f: EGF, pan: -0.4 },
      g2: { inst: 'power', g: 0.09, drive: 4, f: EGF, pan: 0.4, hum: 0.01 },
      gaita: { mono: { lvl: 0.5 }, g: 0.28, f: GF, rev: 0.18, echo: 0.08 },
      pand: { inst: 'smp', s: 'pand', g: 0.09, pan: 0.45 },
      acc: { inst: 'acc', g: 0.1, f: AF, pan: -0.15, rev: 0.15 }
    },
    build: function (E, n) {
      var PA = prog('Am:4 G:4 F:4 G:4 Am:4 G:4 F:4 E:4'), PB = prog('C:4 G:4 Am:4 F:4 C:4 G:4 F:4 E:4');
      var H1 = 'A5:.5 A5:.5 C6:.5 B5:.5 A5:.5 G5:.5 E5:1 | G5:.5 G5:.5 B5:.5 A5:.5 G5:.5 E5:.5 D5:1 | F5:.5 A5:.5 C6:1 B5:.5 A5:.5 G5:1 | E5:.5 G5:.5 B5:1.5 A5:.5 G5:1';
      var H2 = 'A5:.5 A5:.5 C6:.5 B5:.5 A5:.5 G5:.5 E5:1 | G5:.5 G5:.5 B5:.5 A5:.5 G5:.5 E5:.5 D5:1 | F5:.5 A5:.5 C6:1 D6:.5 C6:.5 B5:.5 A5:.5 | G#5:2 B5:1 E6:1';
      var HB = 'E6:1.5 D6:.5 C6:1 G5:1 | D6:1.5 C6:.5 B5:1 G5:1 | C6:1 B5:.5 A5:.5 E5:1 A5:1 | F5:1 A5:1 C6:2 | E6:1.5 D6:.5 C6:1 G5:1 | D6:1 B5:1 G5:1 B5:1 | A5:1 C6:1 F6:1 E6:.5 D6:.5 | E6:2 B5:1 G#5:1';
      mel(E, 'gaita', 0, H1 + ' ' + H2, { mono: true, v: 0.75 });
      mel(E, 'gaita', 32, HB, { mono: true, v: 0.72 });
      mel(E, 'gaita', 64, H1 + ' ' + H2, { mono: true, v: 0.8 });
      // solo improvisado (pentatónica de La menor)
      var pent = [69, 72, 74, 76, 79, 81, 84], b = 96, ix = 3, last = null;
      while (b < 126) {
        var d = pick([0.5, 0.5, 0.5, 1, 0.25, 0.25]); ix = clamp(ix + irnd(-2, 2), 0, pent.length - 1);
        last = { b: b, d: d, dd: d, c: 'gaita', n: pent[ix], v: rnd(0.6, 0.8), leg: true, orn: d >= 0.5 && chance(0.2) };
        E.push(last); b += d;
      }
      if (last) last.leg = false;
      [[PA, 0], [PB, 32], [PA, 64], [PA, 96]].forEach(function (s, k) {
        bassP(E, 'bass', s[0], s[1], 'eighth', 40, 0.6);
        s[0].forEach(function (p) {
          var r = near(p.c.bs, 45), j;
          if (k === 1) { for (j = 0; j < p.d; j += 2) { E.push({ b: s[1] + p.b + j, d: 1.8, c: 'g1', n: r, v: 0.6 }, { b: s[1] + p.b + j, d: 1.8, c: 'g2', n: r, v: 0.55 }); } }
          else for (j = 0; j < p.d; j += 0.5) {
            var pm = k !== 3;
            E.push({ b: s[1] + p.b + j, d: 0.4, c: 'g1', n: r, v: 0.6, pm: pm }, { b: s[1] + p.b + j, d: 0.4, c: 'g2', n: r, v: 0.5, pm: pm });
          }
        });
        if (k === 1) padsP(E, 'acc', s[0], s[1], 64, 0.4);
        E.push({ b: s[1], d: 2, c: 'crash', v: 0.8 });
        for (var i = 0; i < 8; i++) {
          var bb = s[1] + i * 4, lastBar = i === 7;
          pat(E, 'kick', bb, k === 1 ? 'x..xx...' : 'x...x.x.', 0.5, 0.8);
          pat(E, 'snare', bb, lastBar ? '..x.xxXX' : '..x...x.', 0.5, 0.8);
          if (k === 3) { pat(E, 'hat', bb, 'xoxoXoxoxoxoXoxo', 0.25, 0.55); pat(E, 'pand', bb, 'x.x.x.x.', 0.5, 0.6); }
          else pat(E, 'hat', bb, 'XxXxXxXx', 0.5, 0.6);
        }
      });
    }
  };

  // --- Pub: lounge/house oscuro y sensual ---
  T.pub = {
    bpm: 118, gain: 1, bars: 32,
    ch: {
      kick: { inst: 'smp', s: 'kick2', g: 0.42 },
      clap: { inst: 'smp', s: 'clap', g: 0.09, rev: 0.25 },
      hat: { inst: 'smp', s: 'hat', g: 0.06, pan: 0.2 },
      ohat: { inst: 'smp', s: 'ohat', g: 0.05, pan: 0.25 },
      shk: { inst: 'smp', s: 'shaker', g: 0.05, pan: -0.3 },
      bass: { inst: 'synbass', g: 0.3, f: [['lowpass', 1100, 0.7]] },
      ep: { inst: 'ep', g: 0.26, trem: [3.2, 0.22], rev: 0.25, echo: 0.06 },
      pad: { inst: 'pad', g: 0.07, att: 2, rel: 2, f: [['lowpass', 1200, 0.8, [0.04, 500]]], rev: 0.5 },
      arp: { inst: 'ep', g: 0.1, echo: 0.4, rev: 0.3, pan: 0.3 }
    },
    build: function (E, n) {
      var P1 = prog('Fm9:8 Dbmaj7:8 Bbm9:8 C7sus4:4 C7:4');
      for (var s = 0; s < 4; s++) {
        var b0 = s * 32;
        P1.forEach(function (p) {
          var vs = voicing(p.c, 63), b = b0 + p.b, r = near(p.c.bs, 38), j;
          for (j = 0; j < p.d; j += 4) {
            E.push({ b: b + j, d: 1.2, c: 'ep', n: vs, v: 0.5 }, { b: b + j + 1.5, d: 0.6, c: 'ep', n: vs, v: 0.36 }, { b: b + j + 3, d: 0.8, c: 'ep', n: vs, v: 0.42 });
            if (!(s === 2 && p.b < 16)) pat(E, 'bass', b + j, chance(0.7) ? 'x..x..x...x..x..' : 'x..x..x...x.x.x.', 0.25, 0.6, { n: r, d: 0.3 });
          }
          if (s >= 1) padsP(E, 'pad', [p], b0, 60, 0.4);
        });
        if (s >= 2) arpP(E, 'arp', P1, b0, [1, 2, 3, 4, 5, 4, 3, 2], 0.5, 72, 0.4, 0.4);
        for (var i = 0; i < 8; i++) {
          var bb = b0 + i * 4, brk = s === 2 && i < 4;
          if (!brk) pat(E, 'kick', bb, 'x...x...x...x...', 0.25, 0.75);
          pat(E, 'hat', bb, '..x...x...x...x.', 0.25, brk ? 0.3 : 0.55);
          if (s >= 1 && !brk) { pat(E, 'clap', bb, '....x.......x...', 0.25, 0.6); pat(E, 'shk', bb, 'oxoxoxoxoxoxoxox', 0.25, 0.55); }
          if (s === 3) pat(E, 'ohat', bb, '..x...x...x...x.', 0.25, 0.4);
        }
      }
    }
  };

  // --- Beso: baladón romántico con saxo hortera ---
  T.beso = {
    bpm: 72, gain: 1.1, bars: 16,
    ch: {
      ep: { inst: 'ep', g: 0.26, trem: [3.5, 0.2], rev: 0.3 },
      pad: { inst: 'pad', g: 0.09, att: 1.5, rel: 2, f: [['lowpass', 1800, 0.7, [0.05, 400]]], rev: 0.5 },
      str: { inst: 'str', g: 0.07, att: 1.2, rel: 1.5, f: [['lowpass', 2500, 0.7]], rev: 0.55, pan: -0.2 },
      sax: { inst: 'sax', g: 0.3, f: SXF, rev: 0.35, echo: 0.12, pan: 0.1 },
      bass: { inst: 'bass', g: 0.3 },
      kick: { inst: 'smp', s: 'kick2', g: 0.3 },
      snap: { inst: 'smp', s: 'snap', g: 0.12, rev: 0.35, pan: 0.2 },
      hat: { inst: 'smp', s: 'hat', g: 0.035, pan: 0.3 },
      harp: { inst: 'harp', g: 0.2, rev: 0.5, pan: -0.3 }
    },
    build: function (E, n) {
      var PA = prog('Ebmaj7:4 Cm7:4 Abmaj7:4 Bb7sus4:2 Bb7:2 Ebmaj7:4 Cm7:4 Abmaj7:4 Bb7sus4:2 Bb7:2');
      var PB = prog('Gm7:4 Cm7:4 Fm7:4 Bb7:4 Abmaj7:4 Gm7:4 Fm7:2 Gm7:2 Abmaj7:2 Bb7:2');
      mel(E, 'sax', 0, 'r:1 G4:.5 Bb4:.5 D5:1.5 Eb5:.5 | C5:2 r:.5 G4:.5 C5:.5 D5:.5 | Eb5:1.5 D5:.5 C5:1 Bb4:.5 Ab4:.5 | Bb4:4 | r:.5 G4:.5 Bb4:.5 D5:.5 F5:1.5 Eb5:.5 | Eb5:1 D5:.5 C5:.5 G4:2 | C5:.5 D5:.5 Eb5:.5 G5:.5 F5:1 Eb5:.5 C5:.5 | D5:3 r:1', { v: 0.7 });
      mel(E, 'sax', 32, 'Bb4:1.5 D5:.5 F5:2 | G5:1.5 F5:.5 Eb5:1 C5:1 | Ab5:1 G5:.5 F5:.5 Eb5:1 C5:1 | D5:2 F5:1 Ab5:1 | G5:3 Eb5:1 | F5:1.5 D5:.5 Bb4:2 | C5:1 Eb5:1 Bb4:1 D5:1 | Eb5:1 C5:1 D5:2', { v: 0.72 });
      [[PA, 0], [PB, 32]].forEach(function (s) {
        s[0].forEach(function (p) {
          var vs = voicing(p.c, 62);
          E.push({ b: s[1] + p.b, d: p.d * 0.95, c: 'ep', n: vs, v: 0.45, strum: 0.02 });
          if (p.d >= 4) E.push({ b: s[1] + p.b + 2.5, d: 1.2, c: 'ep', n: vs, v: 0.3 });
        });
        padsP(E, 'pad', s[0], s[1], 60, 0.4); padsP(E, 'str', s[0], s[1], 67, 0.35);
        bassP(E, 'bass', s[0], s[1], 'half', 39, 0.55);
        for (var i = 0; i < 8; i++) {
          var b = s[1] + i * 4;
          pat(E, 'kick', b, 'x......x..x.....', 0.25, 0.7); pat(E, 'snap', b, '....x.......x...', 0.25, 0.7); pat(E, 'hat', b, 'x.x.x.x.', 0.5, 0.5);
        }
      });
      var gl = [63, 65, 67, 70, 72, 75, 77, 79, 82, 84, 87, 89, 91, 94];
      gl.forEach(function (m, i) { E.push({ b: 62 + i * 2 / gl.length, d: 2, c: 'harp', n: m, v: 0.35 + i * 0.02 }); });
      if (n % 2) gl.forEach(function (m, i) { E.push({ b: 30 + i * 2 / gl.length, d: 2, c: 'harp', n: m, v: 0.35 + i * 0.02 }); });
    }
  };

  // --- Ruinas: coros, campanas y arpa bajo la luna ---
  T.ruinas = {
    bpm: 66, gain: 1.3, bars: 24,
    ch: {
      choir: { inst: 'choir', g: 0.2, fmt: VA, rev: 0.55, att: 1.2, rel: 2 },
      choir2: { inst: 'choir', g: 0.13, fmt: VO, rev: 0.6, att: 1.6, rel: 2.4, pan: 0.2 },
      harp: { inst: 'harp', g: 0.21, rev: 0.45, echo: 0.12, hum: 0.01, pan: -0.2 },
      bell: { inst: 'bell', g: 0.1, rev: 0.6, echo: 0.2, pan: 0.25 },
      cel: { inst: 'celesta', g: 0.06, rev: 0.6, echo: 0.25, pan: -0.3 },
      drone: { g: 0.1, f: [['lowpass', 500, 0.7]], rev: 0.4 }
    },
    init: function (tr) { drone(tr, tr.ch.drone, [38, 45], 'clar', 0.4, 4); },
    build: function (E, n) {
      var PA = prog('Dm:8 Bb:8 C:8 Am:8'), PB = prog('Dm:8 Gm:8 Bb:8 A:8'), PC = prog('F:8 C:8 Dm:8 A:8');
      [[PA, 0], [PB, 32], [PC, 64]].forEach(function (s, k) {
        padsP(E, k === 1 ? 'choir2' : 'choir', s[0], s[1], k === 2 ? 64 : 60, 0.5);
        if (k === 2) padsP(E, 'choir2', s[0], s[1], 55, 0.4);
        arpP(E, 'harp', s[0], s[1], pick([[0, 2, 3, 4, 5, 4, 3, 2], [0, 3, 4, 5, 6, 5, 4, 3]]), 0.5, 60, 0.35);
      });
      mel(E, 'bell', 0, 'A5:3 F5:1 | D5:4 | Bb5:3 A5:1 | F5:4 | C6:3 G5:1 | E5:4 | A5:2 C6:2 | E5:4', { v: 0.55 });
      PB.forEach(function (p) { var vs = voicing(p.c, 79); for (var j = 0; j < p.d; j += 2) if (chance(0.55)) E.push({ b: 32 + p.b + j, d: 2, c: 'bell', n: pick(vs), v: rnd(0.35, 0.55) }); });
      PC.forEach(function (p) { var vs = voicing(p.c, 84); for (var j = 0; j < p.d; j += 0.5) if (chance(0.3)) E.push({ b: 64 + p.b + j, d: 1, c: 'cel', n: pick(vs), v: rnd(0.3, 0.6) }); });
    }
  };

  // --- Cripta: bordones, campanas disonantes, latido ---
  T.cripta = {
    bpm: 60, gain: 1, bars: 16,
    ch: {
      drone: { g: 0.16, f: [['lowpass', 380, 0.9, [0.03, 120]]], rev: 0.4 },
      heart: { inst: 'smp', s: 'heart', g: 0.5, rev: 0.15 },
      bell: { inst: 'bell', g: 0.08, rev: 0.75, echo: 0.3, pan: 0.3 },
      str: { inst: 'str', g: 0.09, att: 3, rel: 3, f: [['lowpass', 900, 0.7]], rev: 0.55, pan: -0.2 },
      moan: { inst: 'choir', g: 0.1, fmt: VU, rev: 0.75, att: 2, rel: 3 },
      wind: { g: 0.05, f: [['bandpass', 600, 1.2, [0.07, 350]]], rev: 0.5 }
    },
    init: function (tr) { drone(tr, tr.ch.drone, [24, 36, 37], 'clar', 0.5, 4); noiseBed(tr, tr.ch.wind, 'pink', 1); },
    build: function (E, n) {
      for (var i = 0; i < 64; i++) if (i % 16 !== 15) E.push({ b: i, d: 1, c: 'heart', v: (0.35 + 0.4 * i / 64) * rnd(0.9, 1.05) });
      for (var b = 0; b < 64; b += 2) if (chance(0.3)) {
        var root = pick([72, 73, 78, 79, 84, 85]);
        E.push({ b: b + pick([0, 0.5, 1]), d: 2, c: 'bell', n: chance(0.5) ? [root, root + 6] : [root, root + 1], v: rnd(0.3, 0.5) });
      }
      E.push({ b: 0, d: 14, c: 'str', n: [48, 54], v: 0.45 }, { b: 16, d: 14, c: 'str', n: [47, 48], v: 0.45 }, { b: 32, d: 14, c: 'str', n: [44, 50], v: 0.5 }, { b: 48, d: 14, c: 'str', n: [43, 49], v: 0.55 });
      E.push({ b: 8 + irnd(0, 4), d: 6, c: 'moan', n: pick([48, 51]), v: 0.5 }, { b: 40 + irnd(0, 4), d: 6, c: 'moan', n: pick([47, 50]), v: 0.5 });
    }
  };

  // --- Alameda: folk mágico nocturno, arpa y flauta ---
  T.alameda = {
    bpm: 84, gain: 1.8, bars: 32,
    ch: {
      harp: { inst: 'harp', g: 0.23, rev: 0.4, echo: 0.1, hum: 0.008, pan: -0.15 },
      fl: { inst: 'flute', g: 0.24, rev: 0.4, echo: 0.15, pan: 0.15 },
      fl2: { inst: 'flute', g: 0.12, rev: 0.45, pan: -0.25 },
      pad: { inst: 'pad', g: 0.08, att: 2, rel: 2.5, f: [['lowpass', 1500, 0.7, [0.05, 500]]], rev: 0.5 },
      crl: { inst: 'smp', s: 'tick', r: 1.7, g: 0.025, pan: -0.6, rev: 0.2 },
      crr: { inst: 'smp', s: 'tick', r: 1.9, g: 0.022, pan: 0.6, rev: 0.2 },
      sub: { inst: 'sub', g: 0.14 },
      cel: { inst: 'celesta', g: 0.06, rev: 0.5, echo: 0.3, pan: 0.3 }
    },
    build: function (E, n) {
      var PA = prog('A:4 E/G#:4 F#m:4 D:4 A:4 D:4 E:4 E:4'), PB = prog('D:4 E:4 C#m:4 F#m:4 Bm:4 E:4 A:4 A:4');
      var FA = 'E5:1 A5:1 C#6:1.5 B5:.5 | B5:2 G#5:1 E5:1 | F#5:1 A5:1 C#6:1 E6:1 | D6:3 C#6:.5 B5:.5 | C#6:1.5 B5:.5 A5:1 E5:1 | F#5:1 A5:1 D6:2 | B5:1 G#5:1 E5:1 D#5:1 | E5:4';
      var FB = 'F#5:1.5 A5:.5 D6:2 | E6:1.5 D6:.5 B5:2 | C#6:1 E6:1 G#5:2 | A5:1 C#6:1 F#5:2 | D5:1 F#5:1 B5:1.5 A5:.5 | G#5:1 B5:1 E6:2 | C#6:1 B5:1 A5:1 E5:1 | A5:4';
      mel(E, 'fl', 0, FA, { v: 0.62 }); mel(E, 'fl', 32, FB, { v: 0.62 });
      var k = E.length; mel(E, 'fl', 64, FA, { v: 0.6 }); harm(E, E.slice(k), 'fl2', SC.A, 0.7);
      k = E.length; mel(E, 'fl', 96, FB, { v: 0.65 }); if (n % 2) harm(E, E.slice(k), 'fl2', SC.A, 0.7);
      [[PA, 0], [PB, 32], [PA, 64], [PB, 96]].forEach(function (s) {
        arpP(E, 'harp', s[0], s[1], [0, 2, 3, 4, 5, 4, 3, 2], 0.5, 64, 0.36);
        padsP(E, 'pad', s[0], s[1], 62, 0.38); bassP(E, 'sub', s[0], s[1], 'root', 40, 0.5);
      });
      for (var b = 0; b < 128; b++) {
        if (chance(0.45)) pat(E, 'crl', b, 'xx.', 1 / 3, 0.6);
        if (chance(0.35)) pat(E, 'crr', b + 1 / 6, 'x.x', 1 / 3, 0.55);
      }
      for (b = 0; b < 128; b += 8) if (chance(0.4)) E.push({ b: b + pick([0, 2, 3.5]), d: 1, c: 'cel', n: pick([81, 85, 88, 92, 93]), v: rnd(0.3, 0.55) });
    }
  };

  // --- Meiga: muiñeira 6/8 en menor, brujeril ---
  T.meiga = {
    bpm: 110, gain: 1.1, bpb: 2, bars: 40,
    ch: {
      gaita: { mono: { lvl: 0.5, vibD: 6 }, g: 0.3, f: GF, rev: 0.25, echo: 0.06 },
      drone: { g: 0.15, f: [['lowpass', 1000, 0.7]], rev: 0.25 },
      pand: { inst: 'smp', s: 'pand', g: 0.15, pan: 0.3, rev: 0.12 },
      pandj: { inst: 'smp', s: 'pandj', g: 0.1, pan: 0.35 },
      bombo: { inst: 'smp', s: 'bombo', g: 0.36, rev: 0.15 },
      pz: { inst: 'pizz', g: 0.22, pan: -0.25 },
      cel: { inst: 'celesta', g: 0.07, rev: 0.6, echo: 0.3, pan: -0.3 },
      bell: { inst: 'bell', g: 0.06, rev: 0.7, pan: 0.3 }
    },
    init: function (tr) { drone(tr, tr.ch.drone, [33, 45], 'clar', 0.5, 3); },
    build: function (E, n) {
      var MA = 'E5:1/2 F5:1/6 E5:1/3 A5:2/3 B5:1/3 | C6:1/3 B5:1/3 A5:1/3 E5:2/3 C5:1/3 | D5:1/2 E5:1/6 D5:1/3 G5:2/3 A5:1/3 | B5:1/3 A5:1/3 G5:1/3 D5:1/3 B4:1/3 G4:1/3 | E5:1/2 F5:1/6 E5:1/3 A5:2/3 B5:1/3 | C6:1/3 D6:1/3 E6:1/3 C6:2/3 A5:1/3 | B5:1/2 C6:1/6 B5:1/3 G#5:1/3 F5:1/3 E5:1/3 | A5:1 A5:2/3 r:1/3';
      var MB = 'E6:1/2 D6:1/6 C6:1/3 G5:2/3 C6:1/3 | D6:1/2 C6:1/6 B5:1/3 G5:2/3 B5:1/3 | C6:1/3 B5:1/3 A5:1/3 E5:1/3 A5:1/3 C6:1/3 | B5:1/2 C6:1/6 B5:1/3 G#5:2/3 E5:1/3 | E6:1/2 D6:1/6 C6:1/3 G5:2/3 C6:1/3 | D6:1/3 E6:1/3 D6:1/3 B5:2/3 G5:1/3 | G#5:1/3 A5:1/3 B5:1/3 F5:1/3 E5:1/3 D5:1/3 | C5:1/3 B4:1/3 G#4:1/3 A4:1';
      mel(E, 'gaita', 0, MA + ' ' + MA, { mono: true, v: 0.75 });
      mel(E, 'gaita', 32, MB + ' ' + MB, { mono: true, v: 0.75 });
      E.forEach(function (e) { if (e.c === 'gaita' && e.dd >= 0.6 && chance(0.4)) e.orn = true; });
      mel(E, 'gaita', 64, 'A5:2~ G#5:2 G5:2 F#5:2 F5:2 E5:4 r:2', { mono: true, v: 0.55 });
      var CA = ['Am', 'Am', 'G', 'G', 'Am', 'Am', 'E', 'Am'], CB = ['C', 'G', 'Am', 'E', 'C', 'G', 'E', 'Am'];
      for (var i = 0; i < 40; i++) {
        var b = i * 2;
        if (i < 32) {
          var nmC = i < 16 ? CA[i % 8] : CB[i % 8], r = near(chd(nmC).bs, 45);
          E.push({ b: b, d: 0.5, c: 'pz', n: r, v: 0.6 }, { b: b + 1, d: 0.5, c: 'pz', n: r + 7 > 52 ? r - 5 : r + 7, v: 0.5 });
          pat(E, 'pand', b, 'X..x..', 1 / 3, 0.75); pat(E, 'pandj', b, '.xx.xx', 1 / 3, 0.5);
          pat(E, 'bombo', b, i >= 16 ? 'x..x..' : (i % 8 === 7 ? 'x.xx.x' : 'x.....'), 1 / 3, 0.7);
        } else {
          pat(E, 'bombo', b, 'x..o..', 1 / 3, 0.6); pat(E, 'pandj', b, 'x.....', 1 / 3, 0.5);
          if (chance(0.6)) E.push({ b: b + pick([0, 1 / 3, 1, 4 / 3]), d: 1, c: 'cel', n: pick([81, 82, 85, 88, 89, 92]), v: rnd(0.35, 0.6) });
          if (i % 4 === 0) E.push({ b: b, d: 2, c: 'bell', n: pick([69, 70, 75]), v: 0.5 });
        }
      }
    }
  };

  // --- Parking: bajo sintético mínimo, tic-tac, ganas de salir ---
  T.parking = {
    bpm: 100, gain: 3.2, bars: 32,
    ch: {
      bass: { inst: 'synbass', g: 0.3, f: [['lowpass', 1500, 1, [0.03, 900]]] },
      hat: { inst: 'smp', s: 'hat', g: 0.07, pan: 0.3 },
      rim: { inst: 'smp', s: 'rim', g: 0.1, pan: -0.2, rev: 0.3, echo: 0.2 },
      kick: { inst: 'smp', s: 'kick2', g: 0.4 },
      clap: { inst: 'smp', s: 'clap', g: 0.08, rev: 0.35 },
      pl: { inst: 'ep', g: 0.12, echo: 0.45, rev: 0.3, pan: 0.25 },
      pad: { inst: 'pad', g: 0.06, att: 3, rel: 3, f: [['lowpass', 900, 0.8, [0.04, 300]]], rev: 0.5 },
      tick: { inst: 'smp', s: 'tick', g: 0.05, pan: -0.35 }
    },
    build: function (E, n) {
      var P = prog('Em:16 C:8 D:8'), seq = [0, 0, 12, 0, 0, 10, 0, 12, 0, 0, 7, 0, 10, 0, 12, 7];
      for (var s = 0; s < 4; s++) {
        var b0 = s * 32;
        P.forEach(function (p) {
          var r = near(p.c.bs, 36);
          for (var j = 0; j < p.d; j += 4) for (var q = 0; q < 16; q++) {
            if (s === 0 && q % 2) continue;
            E.push({ b: b0 + p.b + j + q * 0.25, d: 0.2, c: 'bass', n: r + seq[q], v: q === 0 ? 0.75 : (q % 4 === 0 ? 0.6 : 0.45) });
          }
          if (s >= 2) padsP(E, 'pad', [p], b0, 59, 0.4);
        });
        if (s >= 2) arpP(E, 'pl', P, b0, [1, -1, 2, -1, 3, -1, 2, 4], 0.5, 71, 0.4, 0.3);
        for (var i = 0; i < 8; i++) {
          var b = b0 + i * 4;
          pat(E, 'hat', b, 'xoxoxoxoxoxoxoxo', 0.25, 0.5);
          pat(E, 'tick', b, 'xxxx', 1, 0.6);
          if (s >= 1) { pat(E, 'kick', b, 'x.....x.x.......', 0.25, 0.75); pat(E, 'rim', b, '....x..x....x...', 0.25, 0.55); }
          if (s === 3) pat(E, 'clap', b, '....x.......x...', 0.25, 0.6);
        }
      }
    }
  };

  // --- Carretera: rock-folk de viaje, himno a toda pastilla ---
  T.carretera = {
    bpm: 140, gain: 1, bars: 32,
    ch: {
      kick: { inst: 'smp', s: 'kick', g: 0.48 },
      snare: { inst: 'smp', s: 'snare', g: 0.3, rev: 0.12 },
      hat: { inst: 'smp', s: 'hat', g: 0.09, pan: 0.25 },
      crash: { inst: 'smp', s: 'crash', g: 0.1, pan: -0.2, rev: 0.1 },
      bass: { inst: 'bass', g: 0.36 },
      g1: { inst: 'power', g: 0.09, drive: 4, f: EGF, pan: -0.4 },
      g2: { inst: 'power', g: 0.08, drive: 4, f: EGF, pan: 0.4, hum: 0.01 },
      gaita: { mono: { lvl: 0.5 }, g: 0.28, f: GF, rev: 0.18, echo: 0.08 },
      gh: { inst: 'chanter', g: 0.08, f: GF, pan: 0.3, rev: 0.2 },
      pand: { inst: 'smp', s: 'pand', g: 0.08, pan: 0.45 },
      acc: { inst: 'acc', g: 0.1, f: AF, pan: -0.15, rev: 0.15 }
    },
    build: function (E, n) {
      var PA = prog(PROG_A), PB = prog('Bm:4 G:4 D:4 A:4 Bm:4 G:4 A:4 A:4');
      var CB = 'F#5:.5 A5:.5 B5:1 A5:.5 F#5:.5 E5:.5 D5:.5 | D5:.5 G5:.5 B5:1 A5:.5 G5:.5 F#5:.5 G5:.5 | A5:1 F#5:.5 D5:.5 F#5:1 A5:1 | E5:.5 F#5:.5 E5:.5 C#5:.5 A4:2 | F#5:.5 A5:.5 B5:1 D6:.5 B5:.5 A5:.5 F#5:.5 | G5:.5 B5:.5 D6:1 B5:.5 G5:.5 E5:1 | A5:.5 C#6:.5 E6:1 C#6:.5 A5:.5 E5:1 | A5:2 C#6:1 E6:1';
      mel(E, 'gaita', 0, HOOK1 + ' ' + HOOK2, { mono: true, v: 0.78 });
      var k = E.length; mel(E, 'gaita', 32, HOOK1 + ' ' + HOOK2, { mono: true, v: 0.8 }); harm(E, E.slice(k), 'gh', SC.D, 0.6);
      mel(E, 'gaita', 64, CB, { mono: true, v: 0.78 });
      mel(E, 'gaita', 96, HOOK1 + ' ' + HOOK2, { mono: true, v: 0.82 });
      [[PA, 0], [PA, 32], [PB, 64], [PA, 96]].forEach(function (s, k2) {
        bassP(E, 'bass', s[0], s[1], 'eighth', 40, 0.62);
        s[0].forEach(function (p) {
          var r = near(p.c.bs, 45);
          for (var j = 0; j < p.d; j += 0.5) {
            var pm = k2 === 0;
            E.push({ b: s[1] + p.b + j, d: 0.4, c: 'g1', n: r, v: 0.6, pm: pm }, { b: s[1] + p.b + j, d: 0.4, c: 'g2', n: r, v: 0.5, pm: pm });
          }
        });
        if (k2 === 2) padsP(E, 'acc', s[0], s[1], 64, 0.4);
        E.push({ b: s[1], d: 2, c: 'crash', v: 0.8 });
        for (var i = 0; i < 8; i++) {
          var bb = s[1] + i * 4, lastBar = i === 7;
          pat(E, 'kick', bb, 'x..xx...', 0.5, 0.8);
          pat(E, 'snare', bb, lastBar ? (n % 2 ? '..x.xxXX' : '..x.XxXx') : '..x...x.', 0.5, 0.8);
          pat(E, 'hat', bb, 'XxXxXxXx', 0.5, 0.6);
          if (k2 >= 1) pat(E, 'pand', bb, '.x.x.x.x', 0.5, 0.55);
        }
      });
    }
  };

  // --- Control de la Guardia Civil: suspense cómico ---
  T.control = {
    bpm: 90, gain: 2, bars: 32,
    ch: {
      str: { inst: 'str', g: 0.14, att: 0.15, rel: 0.5, f: [['lowpass', 2000, 0.7]], rev: 0.3, pan: -0.15 },
      pz: { inst: 'pizz', g: 0.34, rev: 0.15 },
      timp: { inst: 'timp', g: 0.34, rev: 0.3 },
      tk: { inst: 'smp', s: 'wood', g: 0.07, pan: 0.3 },
      clar: { inst: 'clar', g: 0.22, rev: 0.25, pan: 0.15 },
      sub: { inst: 'sub', g: 0.13 }
    },
    build: function (E, n) {
      var PA = prog('Dm:4 Dm:4 Gm/D:4 Dm:4 Bb:4 A7:4 Dm:4 A7:4'), PB = prog('Dm:4 Gm:4 A7:4 Dm:4 Dm:4 Gm:4 A7:4 Dm:4');
      var SLY = 'D3:.5 r:.5 D3:.5 F3:.5 r:.5 E3:.5 Eb3:.5 D3:.5 | r:.5 A2:.5 r:.5 C3:.5 r:.5 C#3:.5 D3:1';
      var SLY2 = 'Bb2:.5 r:.5 Bb2:.5 D3:.5 r:.5 C3:.5 B2:.5 Bb2:.5 | A2:.5 r:.5 E3:.5 r:.5 G3:.5 r:.5 C#3:1';
      var CL1 = 'A4:.5 r:.5 A4:.5 Bb4:.5 A4:1 F4:1 | G4:.5 r:.5 G4:.5 A4:.5 G4:1 E4:1 | F4:.5 G4:.5 A4:.5 Bb4:.5 C#5:1 D5:1 | A4:3 r:1';
      var CL2 = 'D5:.5 r:.5 D5:.5 E5:.5 F5:1 D5:1 | Bb4:.5 r:.5 Bb4:.5 C5:.5 D5:1 Bb4:1 | A4:.5 Bb4:.5 C#5:.5 E5:.5 G5:1 E5:1 | D5:2 r:2';
      for (var s = 0; s < 4; s++) {
        var b0 = s * 32, P = s < 2 ? PA : PB;
        if (s < 2) mel(E, 'pz', b0, SLY + ' ' + SLY + ' ' + SLY2 + ' ' + SLY, { v: 0.75, gate: 0.5 });
        else bassP(E, 'pz', P, b0, 'pulse', 50, 0.6);
        if (s >= 1) padsP(E, 'str', P, b0, 52, s === 3 ? 0.55 : 0.4, 0.95);
        if (s >= 2) mel(E, 'clar', b0, CL1 + ' ' + (s === 3 || n % 2 ? CL2 : CL1), { v: 0.68 });
        bassP(E, 'sub', P, b0, 'root', 38, 0.45);
        for (var i = 0; i < 8; i++) {
          var b = b0 + i * 4;
          pat(E, 'tk', b, 'x.x.', 1, 0.55, { r: 1 }); pat(E, 'tk', b, '.x.x', 1, 0.45, { r: 0.8 });
        }
        E.push({ b: b0, d: 2, c: 'timp', n: 38, v: 0.75 }, { b: b0 + 20, d: 2, c: 'timp', n: 33, v: 0.55 });
      }
      pat(E, 'timp', 124, 'oooooxxxxxxxxXXX', 0.25, 0.5, { n: 33 });
    }
  };

  // --- Santa Compaña: campanilla lejana, canto de ánimas, viento ---
  T.compana = {
    bpm: 50, gain: 1.6, bars: 16,
    ch: {
      hb: { inst: 'handbell', g: 0.15, rev: 0.7, echo: 0.15, f: [['lowpass', 3500, 0.7]], pan: 0.2 },
      choir: { inst: 'choir', g: 0.2, fmt: VO, rev: 0.65, att: 0.8, rel: 1.5 },
      org: { inst: 'choir', g: 0.12, fmt: VO, rev: 0.65, att: 0.8, rel: 1.5, pan: -0.15 },
      low: { inst: 'choir', g: 0.12, fmt: VU, rev: 0.7, att: 3, rel: 3 },
      wind: { g: 0.12, f: [['bandpass', 500, 0.8, [0.07, 350]], ['lowpass', 2000, 0.7]], rev: 0.3 },
      drone: { g: 0.08, f: [['lowpass', 300, 0.7]], rev: 0.4 }
    },
    init: function (tr) { drone(tr, tr.ch.drone, [38, 45], 'clar', 0.5, 5); noiseBed(tr, tr.ch.wind, 'pink', 1); },
    build: function (E, n) {
      var CH = 'D4:2 F4:1 E4:1 | D4:2 C4:2 | D4:1 F4:1 G4:2 | A4:4 | A4:2 G4:1 F4:1 | G4:2 E4:2 | F4:1 E4:1 D4:2 | D4:4';
      var k = E.length; mel(E, 'choir', 0, CH, { v: 0.6, tr: -12, gate: 1 });
      E.slice(k).forEach(function (e) { E.push({ b: e.b, d: e.d, c: 'org', n: e.n - 5, v: e.v * 0.8 }); });
      k = E.length; mel(E, 'choir', 32, CH, { v: 0.62, tr: -12, gate: 1 });
      E.slice(k).forEach(function (e) { E.push({ b: e.b, d: e.d, c: 'org', n: e.n - 7, v: e.v * 0.8 }); });
      var PL = prog('Dm:8 C:8 Dm:8 Am:8');
      padsP(E, 'low', PL, 0, 50, 0.5); padsP(E, 'low', PL, 32, 50, 0.55);
      for (var i = 0; i < 16; i++) {
        E.push({ b: i * 4, d: 4, c: 'hb', n: 86, v: 0.6 });
        if (chance(0.35)) E.push({ b: i * 4 + 0.5, d: 3, c: 'hb', n: 86, v: 0.32 });
      }
    }
  };

  // --- Balneario al amanecer: sereno, agua y campanitas ---
  T.balneario = {
    bpm: 70, gain: 3.2, bars: 32,
    ch: {
      pad: { inst: 'pad', g: 0.09, att: 2.5, rel: 3, f: [['lowpass', 1800, 0.7, [0.04, 600]]], rev: 0.5 },
      str: { inst: 'str', g: 0.05, att: 3, rel: 3, f: [['lowpass', 2200, 0.7]], rev: 0.55, pan: 0.2 },
      bell: { inst: 'bell', g: 0.07, rev: 0.6, echo: 0.2, pan: -0.2 },
      harp: { inst: 'harp', g: 0.2, rev: 0.45, echo: 0.15, hum: 0.01, pan: 0.15 },
      drop: { inst: 'drop', g: 0.07, rev: 0.55, echo: 0.35, pan: 0.35 },
      ep: { inst: 'ep', g: 0.12, rev: 0.45, trem: [2.5, 0.15], pan: -0.15 },
      sub: { inst: 'sub', g: 0.12 }
    },
    build: function (E, n) {
      var PA = prog('Cmaj7:8 Fmaj7/C:8 Am7:8 G6:8'), PB = prog('Fmaj7:8 Em7:8 Dm7:8 Gsus4:4 G:4');
      [[PA, 0], [PB, 32], [PA, 64], [PB, 96]].forEach(function (s, k) {
        padsP(E, 'pad', s[0], s[1], 60, 0.4);
        if (k >= 2) padsP(E, 'str', s[0], s[1], 67, 0.35);
        arpP(E, 'harp', s[0], s[1], pick([[0, 2, 3, 4, 5, 4, 3, 2], [0, 3, 4, 5, -1, 4, 3, -1], [0, 2, 4, 5, 6, 5, 4, 2]]), 0.5, 64, 0.32);
        bassP(E, 'sub', s[0], s[1], 'root', 40, 0.45);
        s[0].forEach(function (p) {
          var vs = voicing(p.c, 64), hv = voicing(p.c, 84), j;
          if (k % 2) { E.push({ b: s[1] + p.b, d: 3, c: 'ep', n: vs, v: 0.35, strum: 0.04 }); if (p.d > 4) E.push({ b: s[1] + p.b + 4, d: 3, c: 'ep', n: vs, v: 0.3, strum: 0.04 }); }
          for (j = 0; j < p.d; j += 4) if (chance(0.5)) E.push({ b: s[1] + p.b + j + pick([0, 1, 2]), d: 2, c: 'bell', n: pick(hv), v: rnd(0.3, 0.5) });
        });
      });
      for (var b = 0; b < 128; b += 0.5) if (chance(0.1)) E.push({ b: b, d: 0.5, c: 'drop', n: pick([84, 86, 88, 91, 93, 96]), v: rnd(0.35, 0.7) });
    }
  };

  // --- Créditos: el himno con banda completa ---
  T.creditos = {
    bpm: 108, gain: 1, bars: 32,
    ch: {
      gaita: { mono: { lvl: 0.5 }, g: 0.3, f: GF, rev: 0.22, echo: 0.07 },
      gh: { inst: 'chanter', g: 0.09, f: GF, pan: 0.3, rev: 0.25 },
      drone: { g: 0.11, f: [['lowpass', 1100, 0.7]], rev: 0.2 },
      kick: { inst: 'smp', s: 'kick', g: 0.42 },
      snare: { inst: 'smp', s: 'snare', g: 0.27, rev: 0.15 },
      hat: { inst: 'smp', s: 'hat', g: 0.08, pan: 0.25 },
      crash: { inst: 'smp', s: 'crash', g: 0.1, pan: -0.2, rev: 0.1 },
      bombo: { inst: 'smp', s: 'bombo', g: 0.28, rev: 0.15 },
      pand: { inst: 'smp', s: 'pand', g: 0.1, pan: 0.4 },
      bass: { inst: 'bass', g: 0.34 },
      g1: { inst: 'power', g: 0.07, drive: 3, f: EGF, pan: -0.4 },
      g2: { inst: 'power', g: 0.06, drive: 3, f: EGF, pan: 0.4, hum: 0.01 },
      str: { inst: 'str', g: 0.13, att: 0.5, rel: 1, f: [['lowpass', 2600, 0.7]], rev: 0.35, pan: -0.1 },
      choir: { inst: 'choir', g: 0.18, fmt: VA, rev: 0.5, att: 0.6 },
      brass: { inst: 'brass', g: 0.14, rev: 0.3, pan: 0.15 },
      harp: { inst: 'harp', g: 0.16, rev: 0.3, pan: -0.3, hum: 0.006 },
      bell: { inst: 'bell', g: 0.08, rev: 0.45, echo: 0.12, pan: 0.2 }
    },
    init: function (tr) { drone(tr, tr.ch.drone, [38, 50], 'clar', 0.5, 2); },
    build: function (E, n) {
      var PA = prog(PROG_A), PB = prog(PROG_B);
      mel(E, 'gaita', 0, HOOK1 + ' ' + HOOK2, { mono: true, v: 0.75 });
      var k = E.length; mel(E, 'gaita', 32, HOOK1 + ' ' + HOOK2, { mono: true, v: 0.8 }); harm(E, E.slice(k), 'gh', SC.D, 0.6);
      mel(E, 'gaita', 64, HOOKB, { mono: true, v: 0.75 });
      k = E.length; mel(E, 'gaita', 96, HOOK1 + ' ' + HOOK2, { mono: true, v: 0.85 }); harm(E, E.slice(k), 'gh', SC.D, 0.6);
      mel(E, 'brass', 96, HOOK1 + ' ' + HOOK2, { v: 0.55, tr: -12 });
      mel(E, 'bell', 96, HOOK1, { v: 0.45, tr: 12 });
      [[PA, 0], [PA, 32], [PB, 64], [PA, 96]].forEach(function (s, sec) {
        bassP(E, 'bass', s[0], s[1], sec === 0 ? 'half' : 'eighth', 40, 0.58);
        padsP(E, 'str', s[0], s[1], 62, 0.45);
        if (sec >= 1) padsP(E, 'choir', s[0], s[1], 60, 0.5);
        if (sec === 2) padsP(E, 'brass', s[0], s[1], 60, 0.35);
        arpP(E, 'harp', s[0], s[1], [0, 2, 3, 4, 5, 4, 3, 2], 0.5, 62, sec === 0 ? 0.4 : 0.3);
        if (sec !== 2) s[0].forEach(function (p) {
          var r = near(p.c.bs, 45);
          for (var j = 0; j < p.d; j += 2) E.push({ b: s[1] + p.b + j, d: 1.8, c: 'g1', n: r, v: 0.55 }, { b: s[1] + p.b + j + 0.01, d: 1.8, c: 'g2', n: r, v: 0.5 });
        });
        E.push({ b: s[1], d: 2, c: 'crash', v: 0.8 });
        for (var i = 0; i < 8; i++) {
          var b = s[1] + i * 4, lastBar = i === 7;
          if (sec === 2) { pat(E, 'bombo', b, lastBar ? 'x.x.xxXX' : 'X...x...', 0.5, 0.7); pat(E, 'pand', b, 'xoxoxoxo', 0.5, 0.5); continue; }
          pat(E, 'kick', b, sec === 0 ? 'x...x...' : 'x..xx...', 0.5, 0.8);
          pat(E, 'snare', b, lastBar ? '..x.xxXX' : '..x...x.', 0.5, sec === 0 ? 0.65 : 0.8);
          pat(E, 'hat', b, 'XxXxXxXx', 0.5, 0.55);
          if (sec >= 1) pat(E, 'pand', b, '.x.x.x.x', 0.5, 0.5);
          if (sec === 3 && i % 2 === 0) pat(E, 'bombo', b, 'X.......', 0.5, 0.6);
        }
      });
    }
  };

  // --- Minijuego: saltarín y peculiar ---
  T.minijuego = {
    bpm: 140, gain: 1.4, bars: 32,
    ch: {
      bass: { inst: 'synbass', g: 0.28 },
      mal: { inst: 'mallet', g: 0.32, rev: 0.15, pan: 0.1 },
      pz: { inst: 'pizz', g: 0.22, pan: -0.25 },
      clap: { inst: 'smp', s: 'clap', g: 0.15, rev: 0.15 },
      kick: { inst: 'smp', s: 'kick', g: 0.4 },
      hat: { inst: 'smp', s: 'hat', g: 0.08, pan: 0.3 },
      cel: { inst: 'celesta', g: 0.08, rev: 0.3, pan: 0.3 }
    },
    build: function (E, n) {
      var PA = prog('C:4 Am:4 F:4 G:4 C:4 F:4 G:4 C:4'), PB = prog('F:4 G:4 Em:4 Am:4 Dm:4 G:4 C:4 G7:4');
      var MA = 'C5:.5* E5:.5* G5:.5* C6:.5 r:.5 G5:.5* A5:.5 G5:.5 | A5:.5* C6:.5* A5:.5* E5:.5 r:.5 E5:.5* G5:.5 E5:.5 | F5:.5* A5:.5* C6:.5* F5:.5 r:.5 A5:.5* G5:.5 F5:.5 | G5:.5* B5:.5* D6:.5* G5:.5 r:.5 D6:.5* C6:.5 B5:.5 | E5:.5* G5:.5* C6:.5* E6:.5 r:.5 D6:.5* C6:.5 A5:.5 | F5:.5* A5:.5* C6:.5* F6:.5 r:.5 E6:.5* D6:.5 C6:.5 | B5:.5* G5:.5* D5:.5* G5:.5 B5:.5* D6:.5* F6:.5 E6:.5 | D6:1 C6:.5* B5:.5* C6:1! r:1';
      mel(E, 'mal', 0, MA, { v: 0.7 });
      mel(E, 'mal', 32, MA, { v: 0.7 }); mel(E, 'cel', 32, MA, { v: 0.45, tr: 12 });
      PB.forEach(function (p) {
        var vs = voicing(p.c, 76);
        for (var j = 0; j < p.d; j += 0.5) if (chance(0.7)) E.push({ b: 64 + p.b + j, d: 0.3, c: 'mal', n: pick(vs) + (chance(0.2) ? 12 : 0), v: rnd(0.5, 0.75) });
      });
      mel(E, 'mal', 96, MA, { v: 0.75 }); mel(E, 'pz', 96, MA, { v: 0.4, tr: -12, gate: 0.4 });
      [[PA, 0], [PA, 32], [PB, 64], [PA, 96]].forEach(function (s) {
        bassP(E, 'bass', s[0], s[1], 'oct', 40, 0.6);
        s[0].forEach(function (p) { var vs = voicing(p.c, 64); for (var j = 0; j < p.d; j++) E.push({ b: s[1] + p.b + j + 0.5, d: 0.25, c: 'pz', n: vs, v: 0.45 }); });
        for (var i = 0; i < 8; i++) {
          var b = s[1] + i * 4;
          pat(E, 'kick', b, 'x.x.', 1, 0.8);
          pat(E, 'clap', b, i === 7 ? '.x.xxxXX' : '..x...x.', 0.5, 0.7);
          pat(E, 'hat', b, '.x.x.x.x', 0.5, 0.6);
        }
      });
    }
  };

  // --- Derrota: trombón triste "wah-wah-wah-waaah" ---
  T.derrota = {
    bpm: 70, gain: 1.4, bars: 8,
    ch: {
      tb: { inst: 'trombone', g: 0.38, rev: 0.25 },
      pad: { inst: 'pad', g: 0.11, att: 1, rel: 2, f: [['lowpass', 1400, 0.7]], rev: 0.5 },
      harp: { inst: 'harp', g: 0.15, rev: 0.4, hum: 0.01 },
      sub: { inst: 'sub', g: 0.1 }
    },
    build: function (E, n) {
      var t = n % 2 ? -5 : 0;
      E.push({ b: 0, d: 0.85, c: 'tb', n: 58 + t, v: 0.7 }, { b: 1, d: 0.85, c: 'tb', n: 57 + t, v: 0.68 },
        { b: 2, d: 0.85, c: 'tb', n: 56 + t, v: 0.66 }, { b: 3, d: 3.6, c: 'tb', n: 55 + t, v: 0.75, slide: 0.6, wob: true });
      var P = prog('Gm:4 Eb:4 Cm:4 D:4 Gm:4 D7:4');
      padsP(E, 'pad', P, 8, 60, 0.4);
      arpP(E, 'harp', P, 8, [0, 2, 3, 4, 5, 4, 3, 2], 0.5, 62, 0.3);
      bassP(E, 'sub', P, 8, 'root', 40, 0.4);
    }
  };

  // ---------------------------------------------------------------
  // Generadores de sonido compartidos (ambientes y efectos)
  // ---------------------------------------------------------------
  var VOW = { a: [700, 1220, 2600], e: [480, 1850, 2550], i: [300, 2250, 2950], o: [500, 900, 2450], u: [330, 780, 2350] };
  var VOWL = ['a', 'e', 'i', 'o', 'u', 'a', 'e', 'o'];

  // golpe de ruido filtrado
  function nhit(dest, t, o) {
    var r = getS(o.buf || 'white'); if (!r) return;
    var s = src(r.b, o.rate || 1, true), fl = F(o.type || 'bandpass', o.f || 1000, o.q || 1), g = G(0), p = P(o.pan || 0);
    s.connect(fl); fl.connect(g); g.connect(p);
    var d = o.d || 0.2, a = o.a || 0.004, lvl = o.lvl || 0.3, hold = o.hold || 0;
    if (o.f2) fl.frequency.exponentialRampToValueAtTime(Math.max(30, o.f2), t + (o.ft || d));
    if (o.pan2 != null && p.pan) p.pan.linearRampToValueAtTime(o.pan2, t + d);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lvl, t + a);
    if (hold) g.gain.setValueAtTime(lvl, t + a + hold);
    var rel = Math.max(0.004, (d - a - hold) / 4);
    g.gain.setTargetAtTime(0, t + a + hold, rel);
    var ns = [fl, g, p].concat(route(p, dest, o.wet || 0, o.echo || 0));
    s.start(t, Math.random() * 2); s.stop(t + a + hold + rel * 6);
    cleanup(s, ns);
  }
  // tono con envolvente de altura
  function tn(dest, t, o) {
    var osc = O(o.type || 'sine', o.f || 440), g = G(0), last = osc, ns = [g], extra = [];
    if (o.f2) {
      var ft = t + (o.ft || 0.1);
      if (o.lin) osc.frequency.linearRampToValueAtTime(o.f2, ft); else osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f2), ft);
      if (o.f3) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.f3), ft + (o.ft3 || 0.1));
    }
    if (o.lp) { var f = F('lowpass', o.lp, o.q || 0.7); last.connect(f); last = f; ns.push(f); }
    if (o.bp) { var f2 = F('bandpass', o.bp, o.bq || 1); last.connect(f2); last = f2; ns.push(f2); }
    last.connect(g);
    var p = P(o.pan || 0); g.connect(p); ns.push(p);
    var a = o.a || 0.004, lvl = o.lvl || 0.3;
    var end = env(g.gain, t, a, lvl, o.dk || 0.3, o.sus == null ? lvl : o.sus, t + a + (o.hold || 0), o.r || 0.05);
    if (o.vib) { var vv = vib([osc], t, o.vib[0], o.vib[1], o.vib[2] || 0.05, end); extra.push(vv[0]); ns.push(vv[1]); }
    ns = ns.concat(route(p, dest, o.wet || 0, o.echo || 0));
    osc.start(t); osc.stop(end);
    cleanup(osc, ns.concat(extra));
    return end;
  }
  // muestra puntual
  function shit(dest, name, t, rate, lvl, pan, wet, lp, echo) {
    var r = getS(name); if (!r) return;
    var s = src(r.b, rate || 1), g = G(lvl), last = g, ns = [g];
    s.connect(g);
    if (lp) { var f = F('lowpass', lp, 0.7); g.connect(f); last = f; ns.push(f); }
    var p = P(pan || 0); last.connect(p); ns.push(p);
    ns = ns.concat(route(p, dest, wet || 0, echo || 0));
    s.start(t); cleanup(s, ns);
  }
  // nota de instrumento muestreado hacia un destino
  function pnote(dest, inst, t, m, lvl, pan, wet, echo) {
    var r = pitched(inst, mtof(m)); if (!r) return;
    var s = src(r.b, r.rate), g = G(lvl), p = P(pan || 0);
    s.connect(g); g.connect(p);
    var ns = [g, p].concat(route(p, dest, wet || 0, echo || 0));
    s.start(t); cleanup(s, ns);
  }
  // canal falso para usar los instrumentos en efectos
  function fakeCh(dest, lvl, pan, wet, echo, life) {
    var g = G(lvl), p = P(pan || 0); g.connect(p);
    var ns = [g, p].concat(route(p, dest, wet || 0, echo || 0));
    setTimeout(function () { ns.forEach(function (n) { try { n.disconnect(); } catch (e) {} }); }, (life || 6) * 1000);
    return { in: g, cfg: {} };
  }
  // voz hablada sintética: sílabas [{v:'a', d, p, fr (fricativa s/j), fd}]
  function say(dest, t, syl, o) {
    o = o || {};
    var f0 = o.f0 || 140, k = o.k || 1, osc = O('glot', f0), nz = src(getS('white').b, 1, true);
    var vg = G(0), ng = G(0), nf = F('bandpass', 3000, 1);
    var f1 = F('bandpass', 700, 5), f2 = F('bandpass', 1200, 7), f3 = F('bandpass', 2600, 9);
    var g1 = G(3.5), g2 = G(2.1), g3 = G(1), gn = G(0.8), sum = G(1), lp = F('lowpass', o.lp || 5000, 0.7), out = G(o.lvl || 0.3), p = P(o.pan || 0);
    osc.connect(vg); nz.connect(nf); nf.connect(ng);
    [vg, ng].forEach(function (x) { x.connect(f1); x.connect(f2); x.connect(f3); });
    ng.connect(gn); gn.connect(sum); // fricativas directas (s, j)
    f1.connect(g1); g1.connect(sum); f2.connect(g2); g2.connect(sum); f3.connect(g3); g3.connect(sum);
    sum.connect(lp); lp.connect(out); out.connect(p);
    var ns = [vg, ng, nf, f1, f2, f3, g1, g2, g3, gn, sum, lp, out, p].concat(route(p, dest, o.wet || 0, o.echo || 0));
    var tt = t;
    osc.frequency.setValueAtTime(f0, t);
    syl.forEach(function (s) {
      var vw = VOW[s.v] || VOW.a, d = s.d || 0.15, fd = s.fd || 0;
      if (s.fr) {
        nf.frequency.setValueAtTime(s.fr, tt);
        ng.gain.setValueAtTime(0, tt); ng.gain.linearRampToValueAtTime(s.fl || 0.6, tt + fd * 0.4); ng.gain.linearRampToValueAtTime(0, tt + fd);
        tt += fd * 0.8;
      }
      f1.frequency.setTargetAtTime(vw[0] * k, tt, 0.012); f2.frequency.setTargetAtTime(vw[1] * k, tt, 0.012); f3.frequency.setTargetAtTime(vw[2] * k, tt, 0.012);
      var pf = f0 * (s.p || 1);
      osc.frequency.setValueAtTime(pf * 1.03, tt); osc.frequency.exponentialRampToValueAtTime(pf * (s.pe || 0.92), tt + d);
      vg.gain.setValueAtTime(0, tt); vg.gain.linearRampToValueAtTime(s.a || 1, tt + 0.02);
      vg.gain.linearRampToValueAtTime((s.a || 1) * 0.7, tt + d * 0.7); vg.gain.linearRampToValueAtTime(0, tt + d);
      tt += d + (s.gap || 0);
    });
    var end = tt + 0.1;
    osc.start(t); osc.stop(end); nz.start(t, Math.random() * 2); nz.stop(end);
    cleanup(osc, ns.concat([nz]));
    return end;
  }
  // murmullo: una voz lejana de la multitud
  function babble(dest, t, o) {
    o = o || {};
    var fem = o.fem != null ? o.fem : chance(0.45), f0 = (fem ? rnd(185, 260) : rnd(95, 150)), k = fem ? 1.16 : 1;
    var n = irnd(o.min || 3, o.max || 9), syl = [];
    for (var i = 0; i < n; i++) syl.push({ v: pick(VOWL), d: rnd(0.09, 0.2), p: rnd(0.88, 1.15) * (i === n - 1 ? 0.9 : 1), a: rnd(0.55, 1), fr: chance(0.35) ? rnd(2500, 6000) : 0, fd: 0.05, fl: 0.25, gap: chance(0.15) ? rnd(0.05, 0.2) : 0 });
    say(dest, t, syl, { f0: f0, k: k, lvl: o.lvl || 0.1, lp: o.lp || 1600, pan: o.pan != null ? o.pan : rnd(-0.8, 0.8), wet: o.wet || 0.3 });
  }
  // crujido de madera (stick-slip)
  function creak(dest, t, o) {
    o = o || {};
    var d = o.d || rnd(0.3, 0.8), f = o.f || rnd(25, 55), bp = o.bp || rnd(700, 1500);
    var osc = O('sawtooth', f), b1 = F('bandpass', bp, 5), b2 = F('bandpass', bp * 2.3, 6), g = G(0), p = P(o.pan != null ? o.pan : rnd(-0.6, 0.6));
    osc.connect(b1); osc.connect(b2); b1.connect(g); b2.connect(g); g.connect(p);
    for (var tt = t; tt < t + d; tt += rnd(0.02, 0.07)) osc.frequency.setValueAtTime(f * rnd(0.6, 1.7), tt);
    var lvl = o.lvl || 0.1;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lvl, t + 0.05); g.gain.setValueAtTime(lvl * 0.8, t + d - 0.06); g.gain.linearRampToValueAtTime(0, t + d);
    var ns = [b1, b2, g, p].concat(route(p, dest, o.wet || 0.2));
    osc.start(t); osc.stop(t + d + 0.02); cleanup(osc, ns);
  }
  function steps(dest, t, n, gap, o) {
    o = o || {};
    var p0 = o.pan0 != null ? o.pan0 : rnd(-0.8, 0.8), p1 = o.pan1 != null ? o.pan1 : -p0 * 0.5;
    for (var i = 0; i < n; i++) {
      var tt = t + i * gap * rnd(0.95, 1.05);
      shit(dest, o.s || 'step', tt, (i % 2 ? 0.92 : 1.02) * (o.rate || 1) * rnd(0.97, 1.03), (o.lvl || 0.2) * rnd(0.8, 1), p0 + (p1 - p0) * i / Math.max(1, n - 1), o.wet || 0.3, o.lp);
    }
  }
  function bark(dest, t, o) {
    o = o || {};
    var n = irnd(1, 3);
    for (var i = 0; i < n; i++) {
      var tt = t + i * rnd(0.28, 0.4), f = rnd(380, 520);
      tn(dest, tt, { type: 'sawtooth', f: f, f2: f * 0.6, ft: 0.12, a: 0.008, hold: 0.04, r: 0.03, lvl: o.lvl || 0.05, bp: rnd(900, 1300), bq: 2, lp: o.lp || 1400, pan: o.pan || 0.5, wet: 0.6 });
      nhit(dest, tt, { type: 'bandpass', f: 1500, q: 1, d: 0.08, lvl: (o.lvl || 0.05) * 0.4, pan: o.pan || 0.5, wet: 0.5 });
    }
  }
  function owl(dest, t, o) {
    o = o || {};
    var pan = o.pan != null ? o.pan : rnd(-0.8, 0.8), lvl = o.lvl || 0.06, f = rnd(380, 460);
    var seq = pick([[0, 0.9, 1.15, 1.45], [0, 0.55], [0]]);
    seq.forEach(function (dt, i) {
      var long = i === seq.length - 1 && seq.length > 1;
      tn(dest, t + dt, { type: 'sine', f: f * 0.96, f2: f, ft: 0.06, f3: f * 0.9, ft3: long ? 0.5 : 0.18, a: 0.04, hold: long ? 0.45 : 0.15, r: 0.06, lvl: lvl, lp: 1200, pan: pan, wet: 0.7, vib: long ? [7, 20, 0.2] : null });
    });
  }
  function rustle(dest, t, o) {
    o = o || {};
    var d = o.d || rnd(0.6, 1.6), r = getS('white'); if (!r) return;
    var s = src(r.b, 1, true), f = F('bandpass', o.f || rnd(2500, 5000), 0.8), g = G(0), p = P(o.pan != null ? o.pan : rnd(-0.8, 0.8));
    s.connect(f); f.connect(g); g.connect(p);
    var lvl = o.lvl || 0.05, tt;
    g.gain.setValueAtTime(0, t);
    for (tt = t; tt < t + d; tt += rnd(0.02, 0.06)) g.gain.linearRampToValueAtTime(lvl * rnd(0.1, 1) * Math.sin(Math.PI * (tt - t) / d), tt);
    g.gain.linearRampToValueAtTime(0, t + d + 0.03);
    var ns = [f, g, p].concat(route(p, dest, o.wet || 0.2));
    s.start(t, Math.random() * 2); s.stop(t + d + 0.05); cleanup(s, ns);
  }
  function bird(dest, t, o) {
    o = o || {};
    var n = irnd(2, 6), pan = rnd(-0.9, 0.9), base = rnd(2200, 4200), lvl = o.lvl || 0.035, tt = t, kind = irnd(0, 2);
    for (var i = 0; i < n; i++) {
      var d = rnd(0.05, 0.12);
      if (kind === 0) tn(dest, tt, { f: base * 1.3, f2: base * 0.8, ft: d, a: 0.005, hold: d * 0.5, r: 0.015, lvl: lvl, pan: pan, wet: 0.4 });
      else if (kind === 1) tn(dest, tt, { f: base * 0.8, f2: base * 1.4, ft: d, a: 0.005, hold: d * 0.5, r: 0.015, lvl: lvl, pan: pan, wet: 0.4, vib: [28, 120] });
      else tn(dest, tt, { f: base, f2: base * 1.15, ft: d * 0.5, f3: base * 0.85, ft3: d * 0.5, a: 0.004, hold: d * 0.6, r: 0.012, lvl: lvl, pan: pan, wet: 0.4 });
      tt += d + rnd(0.04, 0.15);
    }
  }
  function gust(dest, t, o) {
    o = o || {};
    var d = o.d || rnd(2, 4), r = getS('pink'); if (!r) return;
    var s = src(r.b, 1, true), f = F('bandpass', o.f || 400, o.q || 1.2), g = G(0), p = P(o.pan || rnd(-0.5, 0.5));
    s.connect(f); f.connect(g); g.connect(p);
    f.frequency.setValueAtTime((o.f || 400) * 0.7, t); f.frequency.linearRampToValueAtTime((o.f || 400) * 2, t + d * 0.45); f.frequency.linearRampToValueAtTime((o.f || 400) * 0.8, t + d);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(o.lvl || 0.15, t + d * 0.45); g.gain.linearRampToValueAtTime(0, t + d);
    if (p.pan) p.pan.linearRampToValueAtTime(-(o.pan || 0.3), t + d);
    var ns = [f, g, p].concat(route(p, dest, o.wet || 0.3));
    s.start(t, Math.random() * 3); s.stop(t + d + 0.05); cleanup(s, ns);
  }
  function thump(dest, t, f, lvl, d, pan, wet) {
    tn(dest, t, { f: f * 1.6, f2: f, ft: 0.03, a: 0.003, r: d || 0.06, lvl: lvl, pan: pan || 0, wet: wet || 0 });
  }
  function radio(dest, t, o) {
    o = o || {};
    var lvl = o.lvl || 0.05, pan = o.pan || 0.4;
    nhit(dest, t, { type: 'bandpass', f: 2500, q: 0.7, d: 0.12, lvl: lvl * 1.6, pan: pan });
    var n = irnd(5, 12), syl = [];
    for (var i = 0; i < n; i++) syl.push({ v: pick(VOWL), d: rnd(0.07, 0.15), p: rnd(0.9, 1.2), a: rnd(0.6, 1), fr: chance(0.4) ? 4000 : 0, fd: 0.05, fl: 0.4 });
    var end = say(dest, t + 0.12, syl, { f0: rnd(110, 140), lvl: lvl * 2.2, lp: 2600, pan: pan, wet: 0.1 });
    nhit(dest, end, { type: 'bandpass', f: 2500, q: 0.7, d: 0.15, lvl: lvl * 1.4, pan: pan });
    tn(dest, end + 0.16, { type: 'sine', f: 1450, a: 0.003, hold: 0.07, r: 0.01, lvl: lvl * 0.6, pan: pan });
  }
  function chant(dest, t, o) {
    o = o || {};
    var notes = o.notes || [pick([50, 53, 55])], d = o.d || rnd(2.5, 4);
    notes.forEach(function (m) {
      say(dest, t, [{ v: pick(['o', 'u', 'a']), d: d, p: 1, pe: 0.99, a: 1 }], { f0: mtof(m), lvl: o.lvl || 0.03, lp: 1500, pan: rnd(-0.5, 0.5), wet: 0.8 });
    });
  }
  function crackle(dest, t, o) {
    var n = irnd(1, 4);
    for (var i = 0; i < n; i++) nhit(dest, t + rnd(0, 0.15), { type: 'highpass', f: rnd(2000, 5000), d: 0.012, lvl: (o && o.lvl) || 0.03, pan: rnd(-0.3, 0.3), wet: 0.3 });
  }
  function carDoor(dest, t, o) {
    o = o || {};
    var lvl = o.lvl || 0.1, pan = o.pan != null ? o.pan : rnd(-0.8, 0.8), wet = o.wet || 0.7;
    shit(dest, 'rim', t, 0.55, lvl * 0.6, pan, wet, 3000);
    nhit(dest, t + 0.02, { type: 'lowpass', f: 400, d: 0.25, lvl: lvl * 1.5, pan: pan, wet: wet, buf: 'brown' });
    thump(dest, t + 0.02, 70, lvl * 1.4, 0.07, pan, wet);
  }

  // ---------------------------------------------------------------
  // AMBIENTES
  // ---------------------------------------------------------------
  var AMB = {};
  function crowdWash(bed, lvl, lp) {
    layer(bed, 'pink', [['bandpass', 480, 0.9, [0.13, 140]], ['lowpass', lp || 1600, 0.7]], lvl * 4, { am: [0.21, 0.3], wet: 0.3 });
    layer(bed, 'pink', [['bandpass', 1000, 1.2, [0.09, 250]], ['lowpass', lp || 1600, 0.7]], lvl * 2.4, { am: [0.17, 0.35], wet: 0.3, rate: 0.9 });
  }
  function clinkA(bed, t, lvl) { shit(bed.dest, pick(['clink0', 'clink1', 'clink2', 'clink3']), t, rnd(0.85, 1.2), lvl, rnd(-0.8, 0.8), 0.35, 7000); }

  AMB.estrella = {
    init: function (bed) { layer(bed, 'brown', [['lowpass', 250, 0.7]], 0.1); crowdWash(bed, 0.045); },
    gens: [
      [0.2, 0.8, function (b, t) { babble(b.dest, t, { lvl: rnd(0.04, 0.09), lp: 1800, wet: 0.35 }); }],
      [1.5, 5, function (b, t) { shit(b.dest, pick(['cutl0', 'cutl1', 'plate']), t, rnd(0.85, 1.25), rnd(0.03, 0.08), rnd(-0.7, 0.7), 0.3, 6000); }],
      [3, 9, function (b, t) { clinkA(b, t, rnd(0.03, 0.06)); }],
      [7, 18, function (b, t) { creak(b.dest, t, { bp: rnd(600, 1100), lvl: 0.04, d: rnd(0.25, 0.5) }); }],
      [10, 25, function (b, t) { laughAt('gente', b.dest, t, { lvl: 0.25, lp: 2000, pan: rnd(-0.8, 0.8) }); }]
    ]
  };
  AMB.bodega = {
    init: function (bed) { layer(bed, 'brown', [['lowpass', 180, 0.7]], 0.18); tone(bed, 'clar', 55, 0.015, [['lowpass', 300, 0.7]]); },
    gens: [
      [0.8, 3.5, function (b, t) { shit(b.dest, 'drip', t, rnd(0.6, 1.4), rnd(0.03, 0.07), rnd(-0.8, 0.8), 0.7, 0, 0.15); }],
      [5, 12, function (b, t) { creak(b.dest, t, { bp: rnd(400, 800), f: rnd(18, 35), lvl: 0.05, d: rnd(0.4, 1) }); }],
      [12, 25, function (b, t) { thump(b.dest, t, 50, 0.04, 0.2, rnd(-0.5, 0.5), 0.6); }]
    ]
  };
  AMB.plaza = { gain: 2.5,
    init: function (bed) { layer(bed, 'pink', [['bandpass', 400, 0.6, [0.05, 250]], ['lowpass', 1800, 0.7]], 0.2, { am: [0.09, 0.45], wet: 0.2 }); },
    gens: [
      [2, 7, function (b, t) { var n = irnd(1, 3); for (var i = 0; i < n; i++) babble(b.dest, t + i * rnd(0.3, 1), { lvl: 0.035, lp: 900, wet: 0.6 }); }],
      [12, 28, function (b, t) { steps(b.dest, t, irnd(5, 10), rnd(0.45, 0.55), { lvl: 0.06, lp: 3000, wet: 0.5 }); }],
      [18, 45, function (b, t) { bark(b.dest, t, { lvl: 0.035, lp: 1100, pan: rnd(-0.9, 0.9) }); }],
      [6, 14, function (b, t) { gust(b.dest, t, { lvl: 0.08, f: 450 }); }]
    ]
  };
  AMB.calle = {
    init: function (bed) {
      layer(bed, 'rain', [['highpass', 350, 0.7]], 0.5, { wet: 0.15 });
      layer(bed, 'rain', [['highpass', 600, 0.7]], 0.3, { rate: 0.93 });
      layer(bed, 'pink', [['lowpass', 500, 0.7]], 0.06);
    },
    gens: [
      [0.35, 1.1, function (b, t) { shit(b.dest, 'drip', t, rnd(0.45, 0.75), rnd(0.05, 0.1), 0.55, 0.4, 3500); }],
      [0.9, 2.5, function (b, t) { shit(b.dest, 'drip', t, rnd(0.5, 0.9), rnd(0.03, 0.06), -0.6, 0.4, 3000); }],
      [1.5, 4, function (b, t) { babble(b.dest, t, { lvl: 0.03, lp: 700, wet: 0.5, pan: rnd(0.3, 0.9) }); }],
      [12, 28, function (b, t) { laughAt('gente', b.dest, t, { lvl: 0.12, lp: 800, pan: 0.7 }); }]
    ]
  };
  AMB.bareto = { gain: 0.7,
    init: function (bed) { layer(bed, 'brown', [['lowpass', 300, 0.7]], 0.1); crowdWash(bed, 0.075, 2000); },
    gens: [
      [0.08, 0.35, function (b, t) { babble(b.dest, t, { lvl: rnd(0.06, 0.13), lp: 2200, wet: 0.3 }); }],
      [0.8, 2.5, function (b, t) { clinkA(b, t, rnd(0.04, 0.09)); }],
      [4, 10, function (b, t) { laughAt(pick(['gente', 'gente2']), b.dest, t, { lvl: rnd(0.25, 0.4), lp: 2500, pan: rnd(-0.8, 0.8) }); }],
      [5, 12, function (b, t) { shit(b.dest, 'plate', t, rnd(0.8, 1.1), 0.04, rnd(-0.8, 0.8), 0.3, 5000); }]
    ]
  };
  AMB.pub = { gain: 0.7,
    init: function (bed) { crowdWash(bed, 0.04, 1400); layer(bed, 'brown', [['lowpass', 200, 0.7]], 0.08); },
    gens: [
      [0.508, 0.508, function (b, t) { shit(b.dest, 'kick2', t, 0.9, 0.16, 0.3, 0.1, 140); }],
      [1.016, 1.016, function (b, t) { tn(b.dest, t + 0.254, { type: 'sawtooth', f: pick([43.7, 43.7, 36.7, 49]), a: 0.01, hold: 0.15, r: 0.05, lvl: 0.05, lp: 160, pan: 0.3 }); }],
      [0.2, 0.7, function (b, t) { babble(b.dest, t, { lvl: rnd(0.04, 0.08), lp: 1500, wet: 0.35 }); }],
      [2, 6, function (b, t) { var p = rnd(-0.7, 0.7); for (var i = 0; i < irnd(2, 4); i++) shit(b.dest, pick(['clink1', 'clink2']), t + i * rnd(0.05, 0.12), rnd(2.2, 3), 0.02, p, 0.3); }],
      [8, 20, function (b, t) { laughAt('gente2', b.dest, t, { lvl: 0.2, lp: 2000, pan: rnd(-0.8, 0.8) }); }]
    ]
  };
  AMB.ruinas = { gain: 1.4,
    init: function (bed) {
      layer(bed, 'pink', [['bandpass', 320, 0.7, [0.05, 150]], ['lowpass', 1500, 0.7]], 0.2, { am: [0.07, 0.5], wet: 0.3 });
      layer(bed, 'white', [['bandpass', 700, 18, [0.04, 250]]], 0.6, { am: [0.06, 0.7], wet: 0.5 });
      layer(bed, 'white', [['bandpass', 1150, 25, [0.06, 300]]], 0.4, { am: [0.11, 0.7], wet: 0.5 });
    },
    gens: [
      [9, 22, function (b, t) { owl(b.dest, t, { lvl: 0.05 }); }],
      [3, 8, function (b, t) { rustle(b.dest, t, { lvl: 0.035 }); }],
      [7, 15, function (b, t) { gust(b.dest, t, { lvl: 0.1, f: 500, d: rnd(3, 5) }); }]
    ]
  };
  AMB.cripta = {
    init: function (bed) {
      tone(bed, 'clar', 41, 0.06, [['lowpass', 260, 0.7]], [0.05, 0.3]); tone(bed, 'sine', 61.7, 0.04);
      layer(bed, 'brown', [['lowpass', 220, 0.7]], 0.1);
    },
    gens: [
      [1, 4, function (b, t) { shit(b.dest, 'drip', t, rnd(0.5, 1.1), rnd(0.04, 0.08), rnd(-0.8, 0.8), 0.8, 0, 0.2); }],
      [0.3, 2, function (b, t) { crackle(b.dest, t, { lvl: 0.02 }); }],
      [12, 25, function (b, t) { gust(b.dest, t, { lvl: 0.06, f: 250, d: rnd(3, 5), wet: 0.6 }); }]
    ]
  };
  AMB.alameda = {
    init: function (bed) {
      layer(bed, 'crick', [['highpass', 2000, 0.7]], 0.35, { wet: 0.2 });
      layer(bed, 'crick', [['highpass', 2000, 0.7]], 0.2, { rate: 0.94 });
      layer(bed, 'water', [['lowpass', 1400, 0.7]], 0.12, { wet: 0.3 });
    },
    gens: [
      [4, 10, function (b, t) { rustle(b.dest, t, { lvl: 0.03 }); }],
      [14, 32, function (b, t) { owl(b.dest, t, { lvl: 0.04 }); }],
      [8, 16, function (b, t) { gust(b.dest, t, { lvl: 0.04, f: 600 }); }]
    ]
  };
  AMB.parking = { gain: 1.6,
    init: function (bed) {
      bed.hum = tone(bed, 'sawtooth', 100, 0.03, [['lowpass', 400, 0.7]]);
      tone(bed, 'square', 200, 0.008, [['bandpass', 3000, 2]]);
      layer(bed, 'brown', [['lowpass', 150, 0.7]], 0.08);
    },
    gens: [
      [4, 12, function (b, t) {
        if (!b.hum) return; var p = b.hum.g.gain;
        p.setValueAtTime(0.03, t); p.setValueAtTime(0.005, t + 0.05); p.setValueAtTime(0.035, t + 0.09); p.setValueAtTime(0.01, t + 0.14); p.setValueAtTime(0.03, t + 0.2);
        nhit(b.dest, t, { type: 'highpass', f: 5000, d: 0.02, lvl: 0.02 });
      }],
      [6, 18, function (b, t) { carDoor(b.dest, t, { lvl: 0.06, wet: 0.85 }); }],
      [2, 6, function (b, t) { shit(b.dest, 'drip', t, rnd(0.6, 1.2), 0.04, rnd(-0.8, 0.8), 0.8); }],
      [15, 35, function (b, t) { gust(b.dest, t, { lvl: 0.04, f: 200, d: 3, wet: 0.8 }); }]
    ]
  };
  AMB.carretera = { gain: 0.7,
    init: function (bed) {
      tone(bed, 'sawtooth', 42, 0.08, [['lowpass', 220, 1]], [0.15, 2.5]);
      layer(bed, 'brown', [['bandpass', 400, 1.5]], 0.15, { am: [27, 0.25] });
      tone(bed, 'sine', 84, 0.04, null, [0.15, 5]);
      layer(bed, 'brown', [['lowpass', 500, 0.7]], 0.35);
      layer(bed, 'pink', [['bandpass', 1200, 0.5]], 0.025, { am: [0.3, 0.2] });
    },
    gens: [
      [4, 10, function (b, t) { thump(b.dest, t, 55, 0.08, 0.05); thump(b.dest, t + rnd(0.12, 0.18), 50, 0.07, 0.05); }],
      [10, 25, function (b, t) { var p = pick([-1, 1]); nhit(b.dest, t, { type: 'bandpass', f: 600, f2: 300, q: 0.8, d: 1.6, a: 0.7, lvl: 0.08, pan: -0.8 * p, pan2: 0.8 * p, buf: 'pink' }); }]
    ]
  };
  AMB.control = {
    init: function (bed) {
      tone(bed, 'sawtooth', 26, 0.06, [['lowpass', 140, 1.2]], [0.7, 1.2]);
      layer(bed, 'brown', [['bandpass', 280, 1.5]], 0.25, { am: [12.5, 0.5] });
      layer(bed, 'pink', [['bandpass', 450, 0.7, [0.06, 200]], ['lowpass', 1500, 0.7]], 0.12, { am: [0.08, 0.4] });
    },
    gens: [
      [5, 12, function (b, t) { radio(b.dest, t, { lvl: 0.04, pan: rnd(0.2, 0.7) }); }],
      [9, 20, function (b, t) { gust(b.dest, t, { lvl: 0.05, f: 500 }); }]
    ]
  };
  AMB.compana = { gain: 1.4,
    init: function (bed) {
      layer(bed, 'pink', [['bandpass', 380, 0.8, [0.05, 200]], ['lowpass', 1600, 0.7]], 0.25, { am: [0.06, 0.5], wet: 0.3 });
      layer(bed, 'white', [['bandpass', 900, 20, [0.05, 300]]], 0.5, { am: [0.09, 0.7], wet: 0.5 });
    },
    gens: [
      [8, 14, function (b, t) { pnote(b.dest, 'handbell', t, 86, 0.05, rnd(-0.6, 0.6), 0.8); }],
      [10, 20, function (b, t) { chant(b.dest, t, { notes: [pick([50, 52]), pick([45, 57])], lvl: 0.025 }); }],
      [6, 12, function (b, t) { gust(b.dest, t, { lvl: 0.1, f: 450, d: rnd(3, 5) }); }]
    ]
  };
  AMB.balneario = {
    init: function (bed) {
      layer(bed, 'water', [['lowpass', 5000, 0.7]], 0.3, { wet: 0.2 });
      layer(bed, 'water', [['bandpass', 900, 0.6]], 0.15, { rate: 0.85 });
      layer(bed, 'white', [['highpass', 4000, 0.7]], 0.03, { am: [0.07, 0.6] });
    },
    gens: [
      [1.5, 5, function (b, t) { bird(b.dest, t, { lvl: 0.03 }); }],
      [8, 18, function (b, t) { nhit(b.dest, t, { type: 'highpass', f: 3500, d: 2.5, a: 1, lvl: 0.03, wet: 0.3 }); }]
    ]
  };

  // ---------------------------------------------------------------
  // EFECTOS (one-shots). Cada uno: function (dest, t, opts)
  // ---------------------------------------------------------------
  var FX = {};
  function inst(dest, name, t, m, d, v, lvl, pan, wet, echo) {
    var ch = fakeCh(dest, lvl, pan, wet, echo, d + 4);
    try { INST[name](ch, t, m, d, v, {}); } catch (e) {}
  }
  FX.click = function (d, t) {
    tn(d, t, { f: 1800, f2: 900, ft: 0.02, a: 0.001, r: 0.012, lvl: 0.2 });
    nhit(d, t, { type: 'highpass', f: 4000, d: 0.015, lvl: 0.04 });
  };
  FX.hover = function (d, t) { tn(d, t, { f: 2400, f2: 2650, ft: 0.03, a: 0.003, r: 0.01, lvl: 0.07 }); };
  FX.tap = function (d, t) {
    tn(d, t, { type: 'triangle', f: 700, f2: 450, ft: 0.03, a: 0.002, r: 0.02, lvl: 0.25 });
    nhit(d, t, { type: 'bandpass', f: 2500, q: 1, d: 0.02, lvl: 0.05 });
  };
  FX.open = function (d, t) {
    nhit(d, t, { type: 'bandpass', f: 600, f2: 2400, q: 1.2, d: 0.18, a: 0.06, lvl: 0.06 });
    pnote(d, 'celesta', t + 0.02, 76, 0.18, -0.1, 0.2); pnote(d, 'celesta', t + 0.09, 83, 0.16, 0.1, 0.2);
  };
  FX.close = function (d, t) {
    nhit(d, t, { type: 'bandpass', f: 2200, f2: 500, q: 1.2, d: 0.18, a: 0.05, lvl: 0.05 });
    pnote(d, 'celesta', t + 0.02, 83, 0.15, 0.1, 0.2); pnote(d, 'celesta', t + 0.09, 76, 0.14, -0.1, 0.2);
  };
  FX.pickup = function (d, t) {
    [72, 76, 79, 84].forEach(function (m, i) { pnote(d, 'celesta', t + i * 0.055, m, 0.2, -0.2 + i * 0.13, 0.25, 0.1); });
    pnote(d, 'harp', t + 0.22, 88, 0.12, 0.2, 0.3);
    nhit(d, t + 0.18, { type: 'highpass', f: 7000, d: 0.35, a: 0.05, lvl: 0.04, wet: 0.4 });
  };
  FX.use = function (d, t) {
    shit(d, 'wood', t, 0.8, 0.25, 0, 0.1);
    tn(d, t + 0.04, { type: 'triangle', f: 600, f2: 900, ft: 0.05, a: 0.003, r: 0.03, lvl: 0.08 });
  };
  FX.error = function (d, t) {
    tn(d, t, { type: 'triangle', f: 233, a: 0.005, hold: 0.08, r: 0.04, lvl: 0.2, lp: 900 });
    tn(d, t + 0.14, { type: 'triangle', f: 185, a: 0.005, hold: 0.14, r: 0.06, lvl: 0.2, lp: 900 });
  };
  FX.ok = function (d, t) { pnote(d, 'celesta', t, 84, 0.2, -0.1, 0.2); pnote(d, 'celesta', t + 0.1, 88, 0.2, 0.1, 0.25); };
  FX.door = function (d, t) {
    shit(d, 'rim', t, 0.6, 0.12, 0.1, 0.2, 3000);
    creak(d, t + 0.05, { f: 32, bp: 850, d: 0.75, lvl: 0.12, pan: 0, wet: 0.3 });
    shit(d, 'stepw', t + 0.85, 0.5, 0.35, 0, 0.35);
    thump(d, t + 0.85, 75, 0.25, 0.08, 0, 0.3);
  };
  FX.trampilla = function (d, t) {
    creak(d, t, { f: 22, bp: 450, d: 1.0, lvl: 0.14, pan: 0, wet: 0.4 });
    shit(d, 'kick', t + 1.05, 0.6, 0.45, 0, 0.4);
    nhit(d, t + 1.05, { type: 'lowpass', f: 450, d: 0.35, lvl: 0.25, buf: 'brown', wet: 0.4 });
    nhit(d, t + 1.1, { type: 'bandpass', f: 3000, q: 0.6, d: 0.7, a: 0.15, lvl: 0.03, wet: 0.3 });
  };
  FX.pasos = function (d, t, o) { steps(d, t, (o && o.n) || 4, 0.42, { s: 'stepw', lvl: 0.25, pan0: -0.2, pan1: 0.2, wet: 0.2 }); };
  FX.correr = function (d, t, o) { steps(d, t, (o && o.n) || 8, 0.17, { s: 'step', lvl: 0.22, rate: 1.1, pan0: -0.4, pan1: 0.4, wet: 0.15 }); };
  FX.clink = function (d, t) { shit(d, pick(['clink0', 'clink1', 'clink2', 'clink3']), t, rnd(0.9, 1.1), 0.3, rnd(-0.2, 0.2), 0.2); };
  FX.servir = function (d, t) {
    var r = getS('water'); if (!r) return;
    var s = src(r.b, 1.3, true), f = F('bandpass', 450, 3), g = G(0), p = P(0.1);
    s.connect(f); f.connect(g); g.connect(p);
    f.frequency.setValueAtTime(450, t); f.frequency.exponentialRampToValueAtTime(1700, t + 1.5);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.08); g.gain.setValueAtTime(0.5, t + 1.4); g.gain.linearRampToValueAtTime(0, t + 1.6);
    var ns = [f, g, p].concat(route(p, d, 0.15));
    s.start(t, Math.random() * 3); s.stop(t + 1.7); cleanup(s, ns);
    nhit(d, t, { type: 'bandpass', f: 1200, q: 0.8, d: 0.12, lvl: 0.12 });
  };
  FX.trago = function (d, t) {
    for (var i = 0; i < 3; i++) {
      var tt = t + i * 0.38;
      tn(d, tt, { f: 190, f2: 85, ft: 0.09, a: 0.006, r: 0.03, lvl: 0.35, lp: 600 });
      nhit(d, tt, { type: 'lowpass', f: 400, d: 0.08, lvl: 0.12, buf: 'brown' });
    }
    say(d, t + 1.2, [{ v: 'a', d: 0.45, p: 1.1, pe: 0.8, a: 0.6, fr: 1500, fd: 0.1, fl: 0.5 }], { f0: 150, lvl: 0.15, lp: 3000 });
  };
  FX.eructo = function (d, t) {
    var osc = O('sawtooth', 80), b1 = F('bandpass', 520, 3), b2 = F('bandpass', 1050, 4), lp = F('lowpass', 1600, 0.7), g = G(0), g2 = G(0.6), p = P(0);
    osc.connect(b1); osc.connect(b2); b1.connect(lp); b2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(p);
    var D = rnd(0.6, 0.9), tt;
    osc.frequency.setValueAtTime(85, t);
    for (tt = t; tt < t + D; tt += rnd(0.012, 0.03)) {
      osc.frequency.setValueAtTime((85 - 22 * (tt - t) / D) * rnd(0.85, 1.15), tt);
      g.gain.setValueAtTime(0.9 * rnd(0.5, 1) * Math.min(1, (tt - t) / 0.04) * (1 - 0.5 * (tt - t) / D), tt);
    }
    g.gain.setValueAtTime(0.3, t + D); g.gain.linearRampToValueAtTime(0, t + D + 0.06);
    var ns = [b1, b2, lp, g, g2, p].concat(route(p, d, 0.15));
    osc.start(t); osc.stop(t + D + 0.1); cleanup(osc, ns);
  };
  FX.hipo = function (d, t) {
    nhit(d, t, { type: 'bandpass', f: 2000, q: 1, d: 0.02, lvl: 0.12 });
    say(d, t + 0.01, [{ v: 'i', d: 0.09, p: 1, pe: 1.6, a: 1 }], { f0: 320, lvl: 0.12, lp: 4000 });
  };
  FX.beso = function (d, t) {
    tn(d, t, { f: 170, a: 0.02, hold: 0.09, r: 0.02, lvl: 0.12, lp: 400 });
    nhit(d, t + 0.13, { type: 'bandpass', f: 1800, q: 1.5, d: 0.03, lvl: 0.6 });
    tn(d, t + 0.13, { f: 950, f2: 380, ft: 0.03, a: 0.001, r: 0.012, lvl: 0.18 });
    nhit(d, t + 0.17, { type: 'bandpass', f: 1200, q: 0.8, d: 0.18, a: 0.03, lvl: 0.04 });
  };
  FX.corazon = function (d, t) {
    shit(d, 'heart', t, 1, 0.6, 0, 0.1); shit(d, 'heart', t + 0.75, 1, 0.65, 0, 0.1);
    pnote(d, 'harp', t + 0.1, 84, 0.12, -0.2, 0.4, 0.2); pnote(d, 'harp', t + 0.2, 91, 0.1, 0.2, 0.4, 0.2);
  };
  FX.fantasma = function (d, t) {
    var a = O('sine', 220), b = O('triangle', 221), lp = F('lowpass', 900, 2), g = G(0), p = P(0);
    a.connect(lp); b.connect(lp); lp.connect(g); g.connect(p);
    [a, b].forEach(function (o) {
      o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(330, t + 0.8);
      o.frequency.exponentialRampToValueAtTime(260, t + 1.4); o.frequency.exponentialRampToValueAtTime(170, t + 2.2);
    });
    var vv = vib([a, b], t, 5, 45, 0.3, t + 2.6);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.15, t + 0.6); g.gain.setValueAtTime(0.15, t + 1.6); g.gain.linearRampToValueAtTime(0, t + 2.5);
    var ns = [lp, g, p, vv[1], b, vv[0]].concat(route(p, d, 0.8, 0.3));
    a.start(t); b.start(t); a.stop(t + 2.6); b.stop(t + 2.6); cleanup(a, ns);
    gust(d, t, { lvl: 0.1, f: 600, d: 2.6, wet: 0.6 });
  };
  FX.magia = function (d, t) {
    var sc = [72, 74, 76, 79, 81, 84, 86, 88, 91, 93, 96, 98];
    sc.forEach(function (m, i) { pnote(d, 'celesta', t + i * 0.045, m, 0.12, -0.6 + i * 0.1, 0.5, 0.25); });
    pnote(d, 'bell', t + 0.55, 96, 0.12, 0.3, 0.6, 0.3);
    nhit(d, t, { type: 'highpass', f: 6500, d: 1.3, a: 0.3, lvl: 0.05, wet: 0.6 });
  };
  FX.vela = function (d, t) {
    nhit(d, t, { type: 'bandpass', f: 2500, q: 0.8, d: 0.12, lvl: 0.3 });
    nhit(d, t + 0.06, { type: 'bandpass', f: 3500, q: 0.8, d: 0.08, lvl: 0.2 });
    nhit(d, t + 0.12, { type: 'lowpass', f: 200, f2: 1000, ft: 0.3, d: 0.5, a: 0.12, lvl: 0.45, buf: 'brown', wet: 0.2 });
  };
  FX.sarcofago = function (d, t) {
    var r = getS('brown'); if (!r) return;
    var s = src(r.b, 1, true), f = F('bandpass', 320, 2), g = G(0), p = P(0);
    s.connect(f); f.connect(g); g.connect(p);
    for (var tt = t; tt < t + 1.6; tt += rnd(0.02, 0.05)) g.gain.linearRampToValueAtTime(rnd(0.3, 0.9) * Math.min(1, (tt - t) / 0.2), tt);
    g.gain.linearRampToValueAtTime(0, t + 1.7);
    var ns = [f, g, p].concat(route(p, d, 0.35));
    s.start(t, Math.random() * 2); s.stop(t + 1.75); cleanup(s, ns);
    nhit(d, t, { type: 'bandpass', f: 1300, q: 3, d: 1.6, a: 0.2, hold: 1.1, lvl: 0.06, wet: 0.3 });
    tn(d, t, { f: 45, a: 0.2, hold: 1.2, r: 0.1, lvl: 0.12 });
    shit(d, 'kick', t + 1.65, 0.5, 0.5, 0, 0.5);
  };
  FX.motor = function (d, t) {
    var cr = O('sawtooth', 160), crl = F('lowpass', 900, 1), cg = G(0), am = G(0.5), lfo = O('square', 7), lg = G(0.5), p = P(0);
    cr.connect(crl); crl.connect(am); am.connect(cg); lfo.connect(lg); lg.connect(am.gain); cg.connect(p);
    cg.gain.setValueAtTime(0, t); cg.gain.linearRampToValueAtTime(0.15, t + 0.05); cg.gain.setValueAtTime(0.15, t + 1.0); cg.gain.linearRampToValueAtTime(0, t + 1.15);
    cr.frequency.setValueAtTime(140, t); cr.frequency.linearRampToValueAtTime(190, t + 1.0);
    var e = O('sawtooth', 30), e2 = O('square', 15), el = F('lowpass', 300, 1.5), eg = G(0), e2g = G(0.4);
    e.connect(el); e2.connect(e2g); e2g.connect(el); el.connect(eg); eg.connect(p);
    var t1 = t + 1.0;
    [e, e2].forEach(function (o, i) {
      var k = i ? 0.5 : 1;
      o.frequency.setValueAtTime(25 * k, t1); o.frequency.linearRampToValueAtTime(75 * k, t1 + 0.45);
      o.frequency.exponentialRampToValueAtTime(34 * k, t1 + 1.3);
    });
    el.frequency.setValueAtTime(250, t1); el.frequency.linearRampToValueAtTime(900, t1 + 0.45); el.frequency.exponentialRampToValueAtTime(320, t1 + 1.3);
    eg.gain.setValueAtTime(0, t1); eg.gain.linearRampToValueAtTime(0.35, t1 + 0.1); eg.gain.setValueAtTime(0.3, t1 + 1.3); eg.gain.linearRampToValueAtTime(0, t1 + 2.0);
    var ns = [crl, cg, am, lg, el, eg, e2g, p, lfo, e, e2].concat(route(p, d, 0.1));
    [cr, lfo].forEach(function (o) { o.start(t); o.stop(t + 1.2); });
    [e, e2].forEach(function (o) { o.start(t1); o.stop(t1 + 2.05); });
    cleanup(e, ns.concat([cr]));
  };
  FX.claxon = function (d, t, o) {
    var len = (o && o.d) || 0.4, a = O('square', 415), b = O('square', 520), bp = F('bandpass', 1400, 0.7), lp = F('lowpass', 3500, 0.7), g = G(0), p = P(o && o.pan || 0);
    a.connect(bp); b.connect(bp); bp.connect(lp); lp.connect(g); g.connect(p);
    var end = env(g.gain, t, 0.015, 0.22, 0.5, 0.2, t + len, 0.02);
    var ns = [bp, lp, g, p, b].concat(route(p, d, 0.15));
    a.start(t); b.start(t); a.stop(end); b.stop(end); cleanup(a, ns);
  };
  FX.frenazo = function (d, t) {
    var a = O('sawtooth', 1100), bp = F('bandpass', 2200, 3), g = G(0), p = P(0);
    a.connect(bp); bp.connect(g); g.connect(p);
    a.frequency.setValueAtTime(1150, t); a.frequency.linearRampToValueAtTime(820, t + 1.2);
    var vv = vib([a], t, 13, 70, 0.02, t + 1.35);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.4, t + 0.04); g.gain.setTargetAtTime(0, t + 0.6, 0.2);
    var ns = [bp, g, p, vv[1], vv[0]].concat(route(p, d, 0.2));
    a.start(t); a.stop(t + 1.35); cleanup(a, ns);
    nhit(d, t, { type: 'bandpass', f: 2600, q: 4, d: 1.2, hold: 0.4, lvl: 0.3 });
  };
  FX.choque = function (d, t) {
    nhit(d, t, { type: 'lowpass', f: 2200, f2: 400, d: 0.7, lvl: 0.35, buf: 'brown', wet: 0.3 });
    nhit(d, t, { type: 'highpass', f: 1500, d: 0.35, lvl: 0.25, wet: 0.3 });
    tn(d, t, { f: 70, f2: 32, ft: 0.35, a: 0.002, r: 0.12, lvl: 0.5 });
    for (var i = 0; i < 3; i++) shit(d, pick(['cutl0', 'cutl1']), t + rnd(0, 0.1), rnd(0.35, 0.6), 0.3, rnd(-0.5, 0.5), 0.3);
    for (i = 0; i < 12; i++) shit(d, pick(['clink0', 'clink1', 'clink2', 'clink3']), t + 0.05 + rnd(0, 0.5), rnd(1.4, 3), rnd(0.05, 0.14), rnd(-0.8, 0.8), 0.3);
  };
  FX.mu = function (d, t) {
    var D = rnd(1.4, 1.7), f0 = rnd(105, 115);
    var a = O('sawtooth', f0), n2 = O('sawtooth', f0 * 1.005), lp = F('lowpass', 300, 1), b1 = F('bandpass', 380, 4), b2 = F('bandpass', 850, 5);
    var g1 = G(0.6), g2 = G(1), g3 = G(0.4), sum = G(0), p = P(0);
    a.connect(lp); n2.connect(lp); a.connect(b1); a.connect(b2); n2.connect(b1);
    lp.connect(g1); b1.connect(g2); b2.connect(g3); g1.connect(sum); g2.connect(sum); g3.connect(sum); sum.connect(p);
    [a, n2].forEach(function (o) {
      o.frequency.setValueAtTime(f0 * 0.9, t); o.frequency.linearRampToValueAtTime(f0 * 1.15, t + 0.35);
      o.frequency.linearRampToValueAtTime(f0 * 1.05, t + D * 0.6); o.frequency.linearRampToValueAtTime(f0 * 0.75, t + D);
    });
    lp.frequency.setValueAtTime(250, t); lp.frequency.linearRampToValueAtTime(700, t + 0.4); lp.frequency.linearRampToValueAtTime(400, t + D);
    b1.frequency.setValueAtTime(300, t); b1.frequency.linearRampToValueAtTime(450, t + 0.4); b1.frequency.linearRampToValueAtTime(320, t + D);
    b2.frequency.setValueAtTime(700, t); b2.frequency.linearRampToValueAtTime(950, t + 0.4); b2.frequency.linearRampToValueAtTime(720, t + D);
    g2.gain.setValueAtTime(0.2, t); g2.gain.linearRampToValueAtTime(1, t + 0.35);
    sum.gain.setValueAtTime(0, t); sum.gain.linearRampToValueAtTime(0.35, t + 0.25); sum.gain.setValueAtTime(0.35, t + D - 0.35); sum.gain.linearRampToValueAtTime(0, t + D);
    var vv = vib([a, n2], t, 5.5, 12, 0.4, t + D + 0.05);
    var ns = [lp, b1, b2, g1, g2, g3, sum, p, n2, vv[0], vv[1]].concat(route(p, d, 0.25));
    a.start(t); n2.start(t); a.stop(t + D + 0.05); n2.stop(t + D + 0.05); cleanup(a, ns);
    nhit(d, t + D - 0.3, { type: 'bandpass', f: 700, q: 1, d: 0.5, a: 0.15, lvl: 0.04 });
  };
  FX.sirena = function (d, t) {
    var a = O('square', 650), lp = F('lowpass', 2200, 0.8), g = G(0), p = P(-0.4);
    a.connect(lp); lp.connect(g); g.connect(p);
    a.frequency.setValueAtTime(650, t);
    for (var i = 0; i < 7; i++) { var tt = t + i * 0.45, f = i % 2 ? 650 : 870, pf = i % 2 ? 870 : 650; a.frequency.setValueAtTime(pf, tt); a.frequency.setTargetAtTime(f, tt, 0.012); }
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 1.2); g.gain.setValueAtTime(0.12, t + 2.5); g.gain.linearRampToValueAtTime(0, t + 3.2);
    if (p.pan) p.pan.linearRampToValueAtTime(0.4, t + 3.2);
    var ns = [lp, g, p].concat(route(p, d, 0.3));
    a.start(t); a.stop(t + 3.25); cleanup(a, ns);
  };
  FX.viento = function (d, t) {
    gust(d, t, { lvl: 0.5, f: 450, d: 2.6, wet: 0.4 });
    nhit(d, t, { type: 'bandpass', f: 700, f2: 1100, q: 15, d: 2.4, a: 1, lvl: 0.3, wet: 0.5 });
  };
  FX.sal = function (d, t) {
    for (var i = 0; i < 3; i++) {
      shit(d, 'shaker', t + i * 0.22, rnd(1.3, 1.6), 0.3, 0.1, 0.1);
      for (var k = 0; k < 6; k++) nhit(d, t + i * 0.22 + rnd(0.01, 0.12), { type: 'highpass', f: 6000, d: 0.006, lvl: 0.06, pan: rnd(-0.2, 0.3) });
    }
  };
  FX.campana = function (d, t, o) { pnote(d, 'church', t, (o && o.n) || 50, 0.45, 0, 0.6); };
  FX.moneda = function (d, t) {
    shit(d, 'coin', t, rnd(0.95, 1.05), 0.3, 0, 0.15);
    shit(d, 'coin', t + 0.1, 1.02, 0.14, 0.05, 0.15);
    shit(d, 'coin', t + 0.17, 1.04, 0.07, 0.1, 0.15);
  };
  FX.movil = function (d, t) {
    inst(d, 'mallet', t, 88, 0.2, 0.9, 0.35, 0.1, 0.15);
    inst(d, 'mallet', t + 0.13, 95, 0.3, 0.9, 0.35, 0.1, 0.15);
  };
  FX.foto = function (d, t) {
    nhit(d, t, { type: 'bandpass', f: 3000, q: 2, d: 0.02, lvl: 0.35 });
    tn(d, t + 0.01, { type: 'sawtooth', f: 300, f2: 500, ft: 0.06, a: 0.003, hold: 0.04, r: 0.01, lvl: 0.03, bp: 2000 });
    nhit(d, t + 0.08, { type: 'bandpass', f: 2200, q: 2, d: 0.03, lvl: 0.3 });
  };
  FX.pagina = function (d, t) {
    nhit(d, t, { type: 'bandpass', f: 1500, f2: 4500, q: 0.9, d: 0.3, a: 0.09, lvl: 0.35 });
    for (var i = 0; i < 4; i++) nhit(d, t + rnd(0.05, 0.25), { type: 'highpass', f: 3000, d: 0.01, lvl: 0.05 });
  };
  FX.logro = function (d, t) {
    [72, 76, 79, 84].forEach(function (m, i) { inst(d, 'celesta', t + i * 0.08, m, 1, 0.8, 0.25, -0.3 + i * 0.2, 0.3, 0.1); inst(d, 'harp', t + i * 0.08, m - 12, 1, 0.7, 0.2, 0, 0.3); });
    [84, 88, 91].forEach(function (m) { inst(d, 'bell', t + 0.34, m, 2, 0.6, 0.12, 0, 0.45, 0.15); });
    inst(d, 'brass', t + 0.34, 72, 0.6, 0.6, 0.12, 0, 0.3);
    nhit(d, t + 0.3, { type: 'highpass', f: 7000, d: 0.6, a: 0.1, lvl: 0.05, wet: 0.5 });
  };
  FX.fallo = function (d, t) {
    inst(d, 'trombone', t, 52, 0.22, 0.65, 0.35, 0, 0.2);
    inst(d, 'trombone', t + 0.27, 51, 0.22, 0.62, 0.35, 0, 0.2);
    var ch = fakeCh(d, 0.35, 0, 0.2, 0, 4);
    try { INST.trombone(ch, t + 0.54, 50, 0.7, 0.66, { slide: 0.5, wob: true }); } catch (e) {}
  };
  FX.victoria = function (d, t) {
    [[0, 67, 0.11], [0.13, 67, 0.11], [0.26, 67, 0.11], [0.4, 72, 0.9]].forEach(function (n) {
      inst(d, 'brass', t + n[0], n[1], n[2], 0.85, 0.3, 0, 0.25); inst(d, 'brass', t + n[0], n[1] - 12, n[2], 0.7, 0.18, 0, 0.25);
    });
    [60, 64, 67].forEach(function (m) { inst(d, 'brass', t + 0.4, m, 0.9, 0.6, 0.14, 0, 0.3); });
    pnote(d, 'timp', t + 0.4, 36, 0.5, 0, 0.3);
    shit(d, 'crash', t + 0.4, 1, 0.18, 0.2, 0.2);
    [79, 84, 88, 91, 96].forEach(function (m, i) { pnote(d, 'celesta', t + 0.45 + i * 0.05, m, 0.1, -0.4 + i * 0.2, 0.4, 0.2); });
  };
  FX.tic = function (d, t, o) { shit(d, 'tick', t, (o && o.hi) ? 1.5 : 1, 0.3, 0, 0.05); };
  FX.whoosh = function (d, t) { nhit(d, t, { type: 'bandpass', f: 400, f2: 2500, ft: 0.2, q: 1.5, d: 0.4, a: 0.15, lvl: 0.45, pan: -0.6, pan2: 0.6 }); };
  FX.pop = function (d, t) {
    tn(d, t, { f: 300, f2: 1200, ft: 0.05, a: 0.002, r: 0.02, lvl: 0.25 });
    nhit(d, t, { type: 'highpass', f: 3000, d: 0.01, lvl: 0.06 });
  };
  FX.chupito = function (d, t) {
    tn(d, t, { f: 170, f2: 90, ft: 0.06, a: 0.001, r: 0.03, lvl: 0.45 });
    shit(d, 'stepw', t, 1.3, 0.3, 0, 0.15);
    shit(d, pick(['clink0', 'clink2']), t + 0.005, rnd(1.3, 1.5), 0.08, 0, 0.1);
    nhit(d, t + 0.02, { type: 'bandpass', f: 1500, q: 0.8, d: 0.12, lvl: 0.06 });
  };
  FX.brindis = function (d, t) {
    [0, 0.05, 0.11, 0.16, 0.24].forEach(function (dt) { shit(d, pick(['clink0', 'clink1', 'clink2', 'clink3']), t + dt, rnd(0.85, 1.2), rnd(0.15, 0.25), rnd(-0.6, 0.6), 0.3); });
    var voices4 = [[120, 1, -0.5], [140, 1, 0.5], [105, 1, -0.2], [210, 1.15, 0.25]];
    voices4.forEach(function (v, i) {
      say(d, t + 0.35 + i * rnd(0.02, 0.06), [{ v: 'a', d: 0.13, p: 1, pe: 1.05, fr: 5500, fd: 0.09, fl: 0.5 }, { v: 'u', d: 0.28, p: 1.3, pe: 1.1, a: 1 }], { f0: v[0], k: v[1], lvl: 0.07, lp: 4000, pan: v[2], wet: 0.25 });
    });
  };
  FX.cremallera = function (d, t) {
    var a = O('square', 60), hp = F('highpass', 1500, 0.7), bp = F('bandpass', 3000, 0.8), g = G(0), p = P(0);
    a.connect(hp); hp.connect(bp); bp.connect(g); g.connect(p);
    a.frequency.setValueAtTime(60, t); a.frequency.exponentialRampToValueAtTime(260, t + 0.45);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.35, t + 0.03); g.gain.setValueAtTime(0.35, t + 0.42); g.gain.linearRampToValueAtTime(0, t + 0.47);
    var ns = [hp, bp, g, p].concat(route(p, d, 0.1));
    a.start(t); a.stop(t + 0.5); cleanup(a, ns);
    nhit(d, t, { type: 'bandpass', f: 4500, q: 1, d: 0.45, a: 0.05, hold: 0.3, lvl: 0.08 });
  };
  FX.tela = function (d, t) {
    var n = irnd(2, 3);
    for (var i = 0; i < n; i++) nhit(d, t + i * rnd(0.15, 0.25), { type: 'bandpass', f: rnd(1500, 3500), q: 0.8, d: 0.25, a: 0.06, lvl: 0.25, pan: rnd(-0.3, 0.3) });
  };
  FX.grito = function (d, t) {
    var D = 1.0;
    var syl = [{ v: 'a', d: D, p: 1, pe: 1.9, a: 1 }];
    say(d, t, syl, { f0: 330, k: 1.2, lvl: 0.2, lp: 6000, wet: 0.3 });
    nhit(d, t, { type: 'bandpass', f: 2500, q: 0.8, d: D, a: 0.05, hold: 0.6, lvl: 0.06 });
  };
  FX.ronquido = function (d, t) {
    var a = O('sawtooth', 28), bp = F('bandpass', 500, 1), lp = F('lowpass', 1200, 0.7), g = G(0), p = P(0);
    a.connect(bp); bp.connect(lp); lp.connect(g); g.connect(p);
    a.frequency.setValueAtTime(26, t); a.frequency.linearRampToValueAtTime(34, t + 0.9);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.7, t + 0.6); g.gain.linearRampToValueAtTime(0, t + 1.0);
    var ns = [bp, lp, g, p].concat(route(p, d, 0.1));
    a.start(t); a.stop(t + 1.05); cleanup(a, ns);
    nhit(d, t, { type: 'bandpass', f: 900, q: 1, d: 1.0, a: 0.5, lvl: 0.08 });
    nhit(d, t + 1.25, { type: 'highpass', f: 2000, d: 0.8, a: 0.2, lvl: 0.06 });
    tn(d, t + 1.3, { f: 1300, f2: 1550, ft: 0.6, a: 0.15, hold: 0.4, r: 0.08, lvl: 0.035 });
  };

  // ---------------------------------------------------------------
  // RISAS: síntesis formante "ja-ja-ja" con voz propia por personaje
  // ---------------------------------------------------------------
  var LAUGH = {
    ramis: { f0: 290, rise: 1.25, fall: 0.965, rate: 7.5, syl: [6, 10], ph: [2, 3], vow: ['i', 'i', 'e'], br: 0.35, vd: 0.55, gap: [0.25, 0.4], inh: 0.85, wheeze: true, lvl: 0.14, wet: 0.15, k: 1.18 },
    marc: { f0: 120, rise: 1.2, fall: 0.97, rate: 5.2, syl: [5, 8], ph: [1, 2], vow: ['a', 'a', 'o'], br: 0.3, vd: 0.6, gap: [0.3, 0.45], inh: 0.6, lvl: 0.45, wet: 0.12, k: 1, rough: 0.04, belly: true },
    marcos: { f0: 175, rise: 1.15, fall: 0.97, rate: 6.8, syl: [4, 7], ph: [2, 3], vow: ['e', 'e', 'i'], br: 0.25, vd: 0.45, gap: [0.2, 0.35], inh: 0.3, snort: 0.85, nasal: true, lvl: 0.45, wet: 0.12, k: 1.05 },
    angel: { f0: 98, rise: 1.15, fall: 0.975, rate: 4.4, syl: [5, 8], ph: [1, 2], vow: ['o', 'o', 'a'], br: 0.35, vd: 0.65, gap: [0.35, 0.5], inh: 0.6, lvl: 0.45, wet: 0.15, k: 0.95, rough: 0.05, belly: true },
    senora: { f0: 300, rise: 1.3, fall: 0.96, rate: 7, syl: [6, 9], ph: [2, 3], vow: ['i', 'e', 'i'], br: 0.45, vd: 0.5, gap: [0.25, 0.4], inh: 0.6, lvl: 0.14, wet: 0.15, k: 1.2, vibD: 70, vibR: 7.5 },
    chica: { f0: 270, rise: 1.2, fall: 0.97, rate: 6.5, syl: [4, 6], ph: [1, 2], vow: ['i', 'a', 'i'], br: 0.5, vd: 0.5, gap: [0.25, 0.35], inh: 0.5, lvl: 0.24, wet: 0.18, k: 1.2 },
    fantasma: { f0: 92, rise: 1.25, fall: 0.97, rate: 3.6, syl: [5, 7], ph: [1, 2], vow: ['o', 'o', 'a'], br: 0.2, vd: 0.7, gap: [0.4, 0.6], inh: 0, lvl: 0.4, wet: 0.95, echo: 0.45, k: 0.9, vibD: 25, vibR: 5, belly: true },
    gc: { f0: 108, rise: 1.08, fall: 0.98, rate: 5.5, syl: [3, 5], ph: [1, 2], vow: ['e', 'e', 'o'], br: 0.35, vd: 0.45, gap: [0.3, 0.45], inh: 0.3, lvl: 0.54, wet: 0.12, k: 0.95, rough: 0.09 },
    meiga: { f0: 330, rise: 1.35, fall: 0.955, rate: 8, syl: [7, 11], ph: [2, 2], vow: ['i', 'i', 'e'], br: 0.4, vd: 0.5, gap: [0.2, 0.3], inh: 0.4, lvl: 0.17, wet: 0.35, k: 1.25, vibD: 50, vibR: 9, nasal: true, endHigh: true },
    camarero: { f0: 135, rise: 1.18, fall: 0.97, rate: 5.8, syl: [4, 7], ph: [1, 2], vow: ['a', 'e', 'a'], br: 0.3, vd: 0.55, gap: [0.3, 0.4], inh: 0.5, lvl: 0.34, wet: 0.12, k: 1, rough: 0.03 },
    recep: { f0: 240, rise: 1.15, fall: 0.975, rate: 6, syl: [3, 5], ph: [1, 1], vow: ['i', 'e', 'i'], br: 0.45, vd: 0.45, gap: [0.25, 0.35], inh: 0.3, lvl: 0.16, wet: 0.15, k: 1.18 },
    gente: { f0: 0, rise: 1.2, fall: 0.97, rate: 6, syl: [4, 7], ph: [1, 2], vow: ['a', 'e', 'a'], br: 0.35, vd: 0.55, gap: [0.3, 0.4], inh: 0.4, lvl: 0.3, wet: 0.2, k: 1 },
    gente2: { f0: 0, rise: 1.3, fall: 0.96, rate: 6.5, syl: [5, 9], ph: [2, 3], vow: ['a', 'a', 'o'], br: 0.35, vd: 0.55, gap: [0.25, 0.4], inh: 0.6, lvl: 0.3, wet: 0.2, k: 1 }
  };
  LAUGH.gc1 = LAUGH.gc; LAUGH.gc2 = LAUGH.gc;

  function laughAt(who, dest, t, o) {
    o = o || {};
    var L = LAUGH[who]; if (!L) return 0;
    var f0 = L.f0, k = L.k;
    if (!f0) { var fem = chance(0.45); f0 = fem ? rnd(200, 280) : rnd(100, 150); k = fem ? 1.16 : 1; }
    if (who === 'gc2') f0 *= 1.12;
    f0 *= rnd(0.94, 1.06); k *= rnd(0.97, 1.03);
    var wr = getS('white'); if (!wr) return 0;
    var osc = O('glot', f0), nz = src(wr.b, 1, true);
    var vg = G(0), ng = G(0), nf = F('bandpass', 2200, 0.8), nb = G(0.25);
    var f1 = F('bandpass', 700, 4), f2 = F('bandpass', 1200, 6), f3 = F('bandpass', 2600, 8);
    var g1 = G(3.5), g2 = G(2), g3 = G(L.nasal ? 1.6 : 0.9), sum = G(1);
    var body = F('lowpass', 420, 0.7), bg = G(L.belly ? 0.4 : 0.15);
    var lp = F('lowpass', o.lp || 7000, 0.7), out = G((o.lvl || 1) * L.lvl), p = P(o.pan != null ? o.pan : 0);
    osc.connect(vg); nz.connect(nf); nf.connect(ng);
    [vg, ng].forEach(function (x) { x.connect(f1); x.connect(f2); x.connect(f3); });
    ng.connect(nb); nb.connect(sum);
    f1.connect(g1); g1.connect(sum); f2.connect(g2); g2.connect(sum); f3.connect(g3); g3.connect(sum);
    vg.connect(body); body.connect(bg); bg.connect(sum);
    sum.connect(lp); lp.connect(out); out.connect(p);
    var ns = [vg, ng, nf, nb, f1, f2, f3, g1, g2, g3, sum, body, bg, lp, out, p, nz].concat(route(p, dest, o.wet != null ? o.wet : L.wet, o.echo != null ? o.echo : (L.echo || 0)));
    var stops = [nz];
    if (L.rough) {
      var rb = getS('brown');
      if (rb) { var rs = src(rb.b, 1, true), rg = G(f0 * L.rough); rs.connect(rg); rg.connect(osc.frequency); stops.push(rs); ns.push(rs, rg); }
    }
    var vibs = null;
    function setV(vw, tt, kk) {
      f1.frequency.setTargetAtTime(vw[0] * kk, tt, 0.01); f2.frequency.setTargetAtTime(vw[1] * kk, tt, 0.01); f3.frequency.setTargetAtTime(vw[2] * kk, tt, 0.01);
    }
    var tt = t, nPh = irnd(L.ph[0], L.ph[1]), ph, s;
    osc.frequency.setValueAtTime(f0, t);
    for (ph = 0; ph < nPh; ph++) {
      var nS = irnd(L.syl[0], L.syl[1]), pitch = f0 * L.rise * rnd(0.95, 1.05) * (ph ? 0.95 : 1), amp = 1;
      for (s = 0; s < nS; s++) {
        var sd = (1 / L.rate) * rnd(0.85, 1.15) * (1 + s * 0.025), fr = sd * 0.28, vd = sd * L.vd, tv = tt + fr * 0.7;
        ng.gain.setValueAtTime(0, tt); ng.gain.linearRampToValueAtTime(L.br * amp, tt + fr * 0.5); ng.gain.linearRampToValueAtTime(L.br * amp * 0.15, tt + fr);
        setV(VOW[pick(L.vow)], tv - 0.01, k);
        osc.frequency.setValueAtTime(pitch * 1.06, tv); osc.frequency.exponentialRampToValueAtTime(pitch * 0.9, tv + vd);
        vg.gain.setValueAtTime(0, tv); vg.gain.linearRampToValueAtTime(amp, tv + 0.012);
        vg.gain.linearRampToValueAtTime(amp * 0.55, tv + vd * 0.75); vg.gain.linearRampToValueAtTime(0, tv + vd);
        ng.gain.linearRampToValueAtTime(0, tv + vd);
        pitch *= L.fall * rnd(0.985, 1.01); amp *= rnd(0.9, 0.97);
        tt += sd;
      }
      if (ph < nPh - 1) {
        if (chance(L.inh)) {
          var id = rnd(0.25, 0.45), ti = tt + 0.05;
          setV(VOW.i, ti, k * 1.1);
          ng.gain.setValueAtTime(0, ti); ng.gain.linearRampToValueAtTime(L.br * 0.8, ti + id * 0.7); ng.gain.linearRampToValueAtTime(0, ti + id);
          if (L.wheeze) {
            osc.frequency.setValueAtTime(f0 * 2.2, ti); osc.frequency.linearRampToValueAtTime(f0 * 2.8, ti + id);
            vg.gain.setValueAtTime(0, ti); vg.gain.linearRampToValueAtTime(0.22, ti + 0.06); vg.gain.linearRampToValueAtTime(0, ti + id);
          }
          tt = ti + id + 0.06;
        }
        if (L.snort && chance(L.snort)) {
          var sdur = 0.17, q;
          setV([260, 950, 2000], tt, 1);
          for (q = 0; q < 8; q++) ng.gain.setValueAtTime(q % 2 ? 0.08 : L.br * 1.8, tt + q * 0.021);
          ng.gain.setValueAtTime(0, tt + sdur);
          osc.frequency.setValueAtTime(f0 * 0.35, tt);
          vg.gain.setValueAtTime(0.35, tt); vg.gain.setValueAtTime(0, tt + sdur);
          tt += sdur + 0.12;
        }
        tt += rnd(L.gap[0], L.gap[1]) * 0.5;
      }
    }
    if (L.endHigh) {
      var te = tt + 0.05, dl = rnd(0.6, 0.9);
      setV(VOW.i, te, k);
      osc.frequency.setValueAtTime(f0 * 1.6, te); osc.frequency.exponentialRampToValueAtTime(f0 * 2.1, te + dl * 0.6); osc.frequency.exponentialRampToValueAtTime(f0 * 1.4, te + dl);
      vg.gain.setValueAtTime(0, te); vg.gain.linearRampToValueAtTime(0.9, te + 0.05); vg.gain.linearRampToValueAtTime(0.6, te + dl * 0.8); vg.gain.linearRampToValueAtTime(0, te + dl);
      tt = te + dl;
    }
    var end = tt + 0.25;
    if (L.vibD) { vibs = vib([osc], t, L.vibR || 6, L.vibD, 0.05, end); ns.push(vibs[0], vibs[1]); }
    osc.start(t); osc.stop(end);
    stops.forEach(function (x) { x.start(t, Math.random() * 2); x.stop(end); });
    cleanup(osc, ns);
    return end - t;
  }
  function groupLaugh(dest, t, lvl) {
    [['ramis', 0, -0.6], ['angel', 0.08, 0.25], ['marc', 0.14, 0.55], ['marcos', 0.3, -0.25]].forEach(function (x) {
      laughAt(x[0], dest, t + x[1] + rnd(0, 0.05), { lvl: (lvl || 1) * 0.55, pan: x[2] });
    });
  }

  // ---------------------------------------------------------------
  // BLIPS de diálogo: tic de voz suave por personaje
  // ---------------------------------------------------------------
  var BLIP = {
    ramis: [520, 'triangle', 2600, 0.09], marc: [210, 'triangle', 1500, 0.1], marcos: [330, 'square', 1700, 0.06],
    angel: [175, 'triangle', 1200, 0.11], senora: [440, 'sine', 3000, 0.09], chica: [620, 'sine', 3500, 0.08],
    fantasma: [150, 'sine', 900, 0.11], gc: [160, 'square', 900, 0.07], meiga: [600, 'sawtooth', 1800, 0.06],
    narrador: [300, 'sine', 2000, 0.08], recep: [500, 'triangle', 2500, 0.08], camarero: [260, 'triangle', 1800, 0.09],
    gente: [350, 'triangle', 2000, 0.08]
  };
  BLIP.gc1 = BLIP.gc; BLIP.gc2 = BLIP.gc; BLIP.grupo = BLIP.gente;
  var BSTEP = [-2, 0, 0, 2, 4, 2, -1];
  function blipAt(who, t) {
    var b = BLIP[who] || BLIP.narrador, f = b[0] * Math.pow(2, (pick(BSTEP) + rnd(-0.25, 0.25)) / 12);
    var osc = O(b[1], f), lp = F(b[1] === 'square' || b[1] === 'sawtooth' ? 'bandpass' : 'lowpass', b[2], b[1] === 'sine' ? 0.7 : 1.2), g = G(0), p = P(0);
    osc.connect(lp); lp.connect(g); g.connect(p);
    osc.frequency.setValueAtTime(f * 1.03, t); osc.frequency.exponentialRampToValueAtTime(f * 0.94, t + 0.045);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(b[3], t + 0.004); g.gain.setTargetAtTime(0, t + 0.012, 0.012);
    var wet = who === 'fantasma' ? 0.6 : (who === 'meiga' ? 0.25 : 0.05);
    var ns = [lp, g, p].concat(route(p, B.sfx, wet, 0));
    osc.start(t); osc.stop(t + 0.09); cleanup(osc, ns);
  }

  // ---------------------------------------------------------------
  // Bucle del programador
  // ---------------------------------------------------------------
  function pump(hz) {
    var tn = now(), dt = Math.min(0.25, Math.max(0, tn - lastPump)), i;
    lastPump = tn;
    drunkC += (drunkT - drunkC) * Math.min(1, dt * 0.6);
    for (i = tracks.length - 1; i >= 0; i--) {
      var tr = tracks[i];
      if (tr.dying && tn > tr.dying + 0.2) { try { tr.kill(); } catch (e) {} tracks.splice(i, 1); continue; }
      try { tr.tick(hz, tn); } catch (e) {}
    }
    for (i = beds.length - 1; i >= 0; i--) {
      var bd = beds[i];
      if (bd.dying && tn > bd.dying + 0.2) { try { bd.kill(); } catch (e) {} beds.splice(i, 1); continue; }
      try { bd.tick(hz, tn); } catch (e) {}
    }
  }
  function loop() {
    if (!ctx || ctx.state !== 'running') return;
    pump(ctx.currentTime + LOOK);
  }
  function running() { return !!(ctx && B && ctx.state === 'running'); }
  function unlock() {
    try {
      var b = ctx.createBuffer(1, 1, SR), s = ctx.createBufferSource();
      s.buffer = b; s.connect(ctx.destination); s.start(0);
    } catch (e) {}
  }
  function resume() {
    try { var pr = ctx.resume(); if (pr && pr.catch) pr.catch(function () {}); } catch (e) {}
  }
  function onVis() {
    try {
      if (!ctx) return;
      if (document.hidden) { var p = ctx.suspend(); if (p && p.catch) p.catch(function () {}); }
      else resume();
    } catch (e) {}
  }
  function onGesture() {
    try {
      if (!ctx) { if (wantMusic || wantAmb) API.init(); return; }
      if (ctx.state !== 'running' && !document.hidden) { unlock(); resume(); }
    } catch (e) {}
  }
  function subDest(vol) {
    var d = { dry: G(vol), wet: G(vol), echo: G(vol) };
    d.dry.connect(B.sfx.dry); d.wet.connect(B.sfx.wet); d.echo.connect(B.sfx.echo);
    setTimeout(function () { ['dry', 'wet', 'echo'].forEach(function (k) { try { d[k].disconnect(); } catch (e) {} }); }, 9000);
    return d;
  }
  function dest(opts) {
    var v = opts && typeof opts.vol === 'number' ? clamp(opts.vol, 0, 2) : 1;
    return v === 1 ? B.sfx : subDest(v);
  }

  // ---------------------------------------------------------------
  // API pública
  // ---------------------------------------------------------------
  var API = {
    init: function () {
      try {
        if (!AC) return;
        if (!ctx) {
          try { ctx = new AC({ latencyHint: 'interactive' }); } catch (e) { ctx = new AC(); }
          SR = ctx.sampleRate || 44100;
          try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
          initWaves(); buildBuses(); preload();
          timer = setInterval(function () { try { loop(); } catch (e) {} }, 25);
          try { document.addEventListener('visibilitychange', onVis, false); } catch (e) {}
        }
        unlock();
        if (ctx.state !== 'running' && !document.hidden) resume();
        if (wantMusic) { var m = wantMusic; wantMusic = null; API.music(m.n, m.o); }
        if (wantAmb) { var a = wantAmb; wantAmb = null; API.ambient(a.n, a.o); }
      } catch (e) {}
    },
    setMuted: function (b) {
      try {
        muted = !!b;
        try { W.localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) {}
        if (B) { var t = now(); B.master.gain.cancelScheduledValues(t); B.master.gain.setTargetAtTime(muted ? 0 : 1, t, 0.05); }
      } catch (e) {}
    },
    isMuted: function () { return muted; },
    setVolumes: function (o) {
      try {
        if (!o) return;
        if (typeof o.music === 'number') vols.music = clamp(o.music, 0, 1);
        if (typeof o.ambient === 'number') vols.ambient = clamp(o.ambient, 0, 1);
        if (typeof o.sfx === 'number') vols.sfx = clamp(o.sfx, 0, 1);
        if (!B) return;
        var t = now();
        musicGain();
        [B.amb.dry, B.amb.wet].forEach(function (g) { g.gain.setTargetAtTime(vols.ambient, t, 0.1); });
        [B.sfx.dry, B.sfx.wet, B.sfx.echo].forEach(function (g) { g.gain.setTargetAtTime(vols.sfx, t, 0.05); });
      } catch (e) {}
    },
    music: function (name, opts) {
      try {
        if (name && !T[name]) return;
        var fade = opts && typeof opts.fade === 'number' ? Math.max(0.05, opts.fade) : 1.5;
        if (!ctx || !B) { wantMusic = { n: name || null, o: opts }; return; }
        name = name || null;
        if (name === curName) return;
        if (curTrack) curTrack.stop(fade);
        curTrack = null; curName = null;
        if (name) { curTrack = new Track(name, T[name], fade); tracks.push(curTrack); curName = name; }
        while (tracks.length > 3) { try { tracks[0].kill(); } catch (e) {} tracks.shift(); }
      } catch (e) {}
    },
    ambient: function (name, opts) {
      try {
        if (name && !AMB[name]) return;
        var fade = opts && typeof opts.fade === 'number' ? Math.max(0.05, opts.fade) : 2;
        if (!ctx || !B) { wantAmb = { n: name || null, o: opts }; return; }
        name = name || null;
        if (name === curBedName) return;
        if (curBed) curBed.stopFade(fade);
        curBed = null; curBedName = null;
        if (name) { curBed = new Bed(name, AMB[name], fade); beds.push(curBed); curBedName = name; }
        while (beds.length > 3) { try { beds[0].kill(); } catch (e) {} beds.shift(); }
      } catch (e) {}
    },
    sfx: function (name, opts) {
      try {
        if (!running() || muted || !FX[name] || voices > MAXV + 40) return;
        FX[name](dest(opts), now() + 0.01, opts || {});
      } catch (e) {}
    },
    laugh: function (who, opts) {
      try {
        if (!running() || muted || voices > MAXV + 40) return;
        var d = dest(opts), t = now() + 0.02;
        if (who === 'grupo') groupLaugh(d, t, 1);
        else if (LAUGH[who]) laughAt(who, d, t, { pan: opts && opts.pan });
      } catch (e) {}
    },
    blip: function (who) {
      try {
        if (!running() || muted) return;
        var t = now();
        if (t - lastBlip < 0.045) return;
        lastBlip = t;
        blipAt(who, t + 0.005);
      } catch (e) {}
    },
    drunk: function (level) {
      try { drunkT = clamp(fin(+level, 0), 0, 1); applyDrunk(); } catch (e) {}
    },
    duck: function (on) {
      try { duckOn = !!on; musicGain(); } catch (e) {}
    }
  };

  // reanudar tras gestos (iOS, pestañas, llamadas)
  try {
    ['pointerdown', 'touchend', 'keydown', 'mousedown'].forEach(function (ev) { document.addEventListener(ev, onGesture, true); });
  } catch (e) {}

  W.AUDIO = API;

  // ganchos internos solo para pruebas (no forman parte de la API)
  if (W.__AUDIO_TEST__ && typeof W.__AUDIO_TEST__ === 'object') {
    var X = W.__AUDIO_TEST__;
    X.T = T; X.AMB = AMB; X.FX = FX; X.LAUGH = LAUGH; X.BLIP = BLIP; X.SMP = SMP; X.RENDER = RENDER; X.PITCHED = PITCHED;
    X.pump = function (h) { pump(h); }; X.getS = getS; X.tracks = function () { return tracks; }; X.beds = function () { return beds; };
    X.voices = function () { return voices; }; X.ctx = function () { return ctx; };
    X.laughAt = function (w, t) { return laughAt(w, B.sfx, t, {}); };
    X.groupLaugh = function (t) { groupLaugh(B.sfx, t, 1); };
    X.blipAt = function (w, t) { blipAt(w, t); };
    X.B = function () { return B; };
    // renderizado offline para medir niveles (raw: sin compresor/limitador)
    X.offline = function (oc, raw) {
      ctx = oc; SR = oc.sampleRate; S = {}; MAXV = 1e9; WV = {}; tracks = []; beds = []; curTrack = null; curName = null; curBed = null; curBedName = null; voices = 0; lastPump = 0;
      initWaves(); buildBuses();
      if (raw) { try { B.master.disconnect(); } catch (e) {} B.master.connect(oc.destination); }
    };
  }
})();
