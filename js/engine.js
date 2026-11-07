'use strict';
/* =====================================================================
   PONTEVEDRA QUEST — motor
   Escenario fijo de 1600x1000. Fondos ilustrados, personajes recortados
   que respiran y se tambalean según lo que han bebido, diálogos con caras,
   bolsa de objetos, minijuegos y guardado automático.
   ===================================================================== */
const $ = (id) => document.getElementById(id);
const W = 1600, H = 1000;
const PROTA = ['ramis', 'marc', 'marcos', 'angel'];
const LV = ['Sobrio', 'Alegre', 'Achispado', 'Piripi', 'Cogorza', 'Mamado'];
const LVC = ['#5fd68f', '#a6e05a', '#ffc94a', '#ff9a3c', '#ef5a64', '#e04bd2'];
const NAMES = {
  ramis: 'Ramis', marc: 'Marc', marcos: 'Marcos', angel: 'Ángel', senora: 'Doña Maruxa', chica: 'La chica del pub',
  fantasma: 'Don Xesús', gc1: 'Guardia Civil', gc2: 'Sargento Seoane', meiga: 'A meiga Pura', camarero: 'Brais, el camarero',
  gente: 'Parroquiano', recep: 'Recepcionista', narrador: '',
  // la gente de la noche (v5)
  uxia: 'Uxía', noa: 'Noa', sabela: 'Sabela', xurxo: 'Xurxo', nando: 'Nando', dj: 'DJ Raxo', vera: 'Vera', iago: 'Iago',
  peregrino: 'Toño, el peregrino', antia: 'Antía, la camarera', guiri: 'Gary, el guiri', lua: 'Lúa', portero: 'Rubén, el portero',
  tino: 'Tino', carla: 'Carla (@carlaviral)',
};
const SECOND = ['senora', 'chica', 'fantasma', 'gc1', 'gc2', 'meiga', 'camarero', 'gente', 'recep'];
// gente de la calle: vienen de una sola hoja, dibujados más pequeños que los protas
const CROWD_IDS = ['uxia', 'noa', 'sabela', 'xurxo', 'nando', 'dj', 'vera', 'iago', 'peregrino', 'antia', 'guiri', 'lua', 'portero', 'tino', 'carla'];
const isProta = (id) => PROTA.includes(id);
const isCrowd = (id) => CROWD_IDS.includes(id);

const G = {
  img: {}, t: 0, dt: 0, last: 0, scene: null, sceneId: null, actors: {}, props: [], busy: 0, mode: null,
  holding: null, reveal: 0, particles: [], fade: 1, fadeTo: 0, fadeSpeed: 2, shake: 0, flashA: 0, flashC: '#fff',
  scale: 1, offX: 0, offY: 0, hover: null, tweens: [], dlgOpen: false, started: false, camZoom: 1, camX: 800, camY: 500,
};
let S = null; // estado de la partida (se guarda)

function newState() {
  return {
    v: 1, scene: 'estrella', active: 'angel', drunk: { ramis: 0, marc: 0, marcos: 0, angel: 0 },
    inv: ['llaves', 'movil', 'cartera'], flags: {}, obj: '', logros: [], seen: {},
    stats: { copas: 0, cafes: 0, sustos: 0, derrotas: 0, besoSeg: 0, chupitosTirados: 0 }, startT: Date.now(),
  };
}

/* ---------------- utilidades ---------------- */
const TEST = /[?&]test/.test(location.search);
const wait = (ms) => (TEST ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[(Math.random() * a.length) | 0];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
function sfx(n, o) { try { AUDIO.sfx(n, o); } catch (e) {} }
function music(n) { try { AUDIO.music(n); } catch (e) {} }
function ambient(n) { try { AUDIO.ambient(n); } catch (e) {} }
function flag(k, v) { if (v === undefined) return !!S.flags[k]; S.flags[k] = v; }
function has(i) { return S.inv.includes(i); }

/* ---------------- carga de imágenes ---------------- */
function loadImages(list, onProg) {
  let done = 0;
  return Promise.all(list.map((src) => new Promise((res) => {
    const im = new Image();
    im.onload = () => { G.img[src] = im; done++; onProg && onProg(done / list.length); res(); };
    im.onerror = () => { done++; onProg && onProg(done / list.length); res(); };
    im.src = 'img/' + src + '.webp';
  })));
}
function assetList() {
  const l = ['bg/estrella', 'bg/bodega', 'bg/plaza', 'bg/calle', 'bg/bareto', 'bg/pub', 'bg/ruinas', 'bg/cripta', 'bg/alameda', 'bg/parking', 'bg/titulo', 'bg/disco', 'bg/antro', 'bg/intro'];
  PROTA.forEach((p) => { l.push('chars/' + p, 'chars/' + p + '_lado'); BODY.forEach((v) => l.push('chars/' + p + v)); ['normal', 'risa', 'borracho', 'sorpresa'].forEach((m) => l.push('faces/' + p + '_' + m)); });
  SECOND.forEach((s) => { l.push('chars/' + s, 'chars/' + s + '_risa', 'faces/' + s + '_normal', 'faces/' + s + '_risa'); });
  CROWD_IDS.forEach((s) => l.push('chars/' + s, 'faces/' + s + '_normal'));
  Object.keys(ITEMS).forEach((k) => l.push('items/' + ITEMS[k].img));
  ['peugeot_lado', 'peugeot_atras', 'vaca', 'compana', 'cruceiro', 'estrella', 'b1906', 'chupitos', 'vino'].forEach((k) => l.push('items/' + k));
  return [...new Set(l)];
}
// imágenes personalizables para los sitios que todavía no tienen ilustración
function loadOptionalBg(names) {
  return Promise.all(names.map((n) => new Promise((res) => {
    const im = new Image(); im.onload = () => { G.img['bg/' + n] = im; res(); }; im.onerror = () => res(); im.src = 'img/bg/' + n + '.webp';
  })));
}

/* ---------------- escalado del escenario ---------------- */
function fit() {
  const w = innerWidth, h = innerHeight;
  const s = Math.min(w / W, h / H);
  G.scale = s; G.offX = (w - W * s) / 2; G.offY = (h - H * s) / 2;
  $('stage').style.transform = `translate(${G.offX}px,${G.offY}px) scale(${s})`;
  document.body.classList.toggle('small', s < 0.55);
  const portrait = h > w * 1.1 && w < 900;
  $('rotate').classList.toggle('hidden', !portrait || G.rotOk);
}
function toStage(e) { return { x: (e.clientX - G.offX) / G.scale, y: (e.clientY - G.offY) / G.scale }; }

/* ---------------- canvas y efectos ---------------- */
const cv = $('cv'), ctx = cv.getContext('2d');
const buf = document.createElement('canvas'); buf.width = W; buf.height = H;
const bx = buf.getContext('2d');
let vignette = null;
function makeVignette() {
  vignette = document.createElement('canvas'); vignette.width = W; vignette.height = H;
  const v = vignette.getContext('2d');
  const gr = v.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.55)');
  v.fillStyle = gr; v.fillRect(0, 0, W, H);
}

// tintado de personajes según la luz de cada sitio (se cachea)
const tintCache = new Map();
function tinted(src, tint) {
  const img = G.img[src]; if (!img) return null;
  if (!tint) return img;
  const key = src + '|' + tint.c + '|' + tint.a + '|' + (tint.d || 0);
  let c = tintCache.get(key);
  if (c) return c;
  c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  x.globalCompositeOperation = 'source-atop';
  if (tint.d) { x.fillStyle = `rgba(0,0,20,${tint.d})`; x.fillRect(0, 0, c.width, c.height); }
  x.globalAlpha = tint.a; x.fillStyle = tint.c; x.fillRect(0, 0, c.width, c.height);
  tintCache.set(key, c);
  return c;
}

/* ---------------- actores ---------------- */
// k = escala: píxeles de escenario por píxel de la imagen. Los secundarios vienen dibujados más pequeños.
function actor(id, o) {
  const prev = G.actors[id] || {};
  const a = Object.assign({
    id, sprite: 'chars/' + id, x: 800, y: 980, k: 0.62, flip: false, alpha: 1, phase: Math.random() * 6, visible: true,
    talking: false, walking: false, ghost: id === 'fantasma', z: 0, laughUntil: 0, hop: 0,
  }, prev, o || {});
  G.actors[id] = a; return a;
}
function removeActor(id) { delete G.actors[id]; }
// todos un 20 % más grandes que al principio (se veían pequeños frente a los fondos)
const CHAR_SCALE = 1.2;
function aScale(a) { return a.k * (isProta(a.id) ? 1 : (a.ks || (isCrowd(a.id) ? 1.85 : 1.72))) * CHAR_SCALE; }
// pose de cuerpo según la borrachera: alegre (1), piripi (2-3) y mamado (4-5)
const BODY = ['_alegre', '_piripi', '_mamado'];
function bodySprite(id) {
  const lv = S ? S.drunk[id] : 0, v = lv >= 4 ? '_mamado' : lv >= 2 ? '_piripi' : lv === 1 ? '_alegre' : '';
  return v && G.img['chars/' + id + v] ? 'chars/' + id + v : 'chars/' + id;
}
function actorBox(a) {
  const img = G.img[a.sprite]; if (!img) return null;
  const k = aScale(a); const w = img.width * k, h = img.height * k;
  return { x: a.x - w / 2, y: a.y - h, w, h };
}
function drawActor(c, a) {
  if (!a.visible || a.alpha <= 0) return;
  let sprite = a.sprite;
  if (a.laughUntil > G.t && G.img['chars/' + a.id + '_risa'] && !isProta(a.id)) sprite = 'chars/' + a.id + '_risa';
  const body = isProta(a.id) && a.sprite === 'chars/' + a.id && !a.noBody;
  if (body) sprite = bodySprite(a.id);
  const img = tinted(sprite, G.scene && G.scene.tint && !a.ghost ? G.scene.tint : null);
  if (!img) return;
  const t = G.t, lvl = isProta(a.id) ? S.drunk[a.id] : (a.drunkLvl || 0);
  let k = aScale(a);
  // si el sprite de risa viene de otra hoja, se iguala la altura (las poses de borrachera ya vienen a escala)
  if (!body && sprite !== a.sprite && G.img[a.sprite]) k = k * G.img[a.sprite].height / G.img[sprite].height;
  const w = img.width * k, h = img.height * k;
  const breathe = 1 + Math.sin(t * 2.2 + a.phase) * 0.008;
  const sway = lvl * 0.011 * Math.sin(t * (0.9 + lvl * 0.18) + a.phase) + (lvl >= 4 ? 0.012 * Math.sin(t * 2.7 + a.phase) : 0);
  const talk = a.talking ? Math.abs(Math.sin(t * 11 + a.phase)) * 7 : 0;
  // los que bailan botan al ritmo (bpm de la escena)
  const walk = (a.walking ? Math.abs(Math.sin(t * 8.5 + a.phase)) * 12 : 0) + (a.dance ? Math.abs(Math.sin(t * Math.PI * (G.scene && G.scene.bpm || 124) / 60 + a.phase * 0.2)) * 14 * h / 500 : 0);
  const ghostF = a.ghost ? Math.sin(t * 1.6 + a.phase) * 12 - 18 : 0;
  const hop = a.hop > 0 ? Math.sin(a.hop * Math.PI) * 40 : 0;
  // sombra en el suelo
  if (!a.ghost && !a.noShadow) {
    c.save(); c.translate(a.x + Math.sin(t * 0.9 + a.phase) * lvl * 3, a.y - 4); c.scale(1, 0.2);
    const g = c.createRadialGradient(0, 0, 4, 0, 0, w * 0.5);
    g.addColorStop(0, 'rgba(0,0,0,0.5)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, w * 0.5, 0, Math.PI * 2); c.fill(); c.restore();
  }
  c.save();
  c.translate(a.x, a.y - talk - walk - hop + ghostF);
  c.rotate(sway + (a.walking ? Math.sin(t * 8.5 + a.phase) * 0.025 : 0) + (a.dance ? Math.sin(t * Math.PI * (G.scene && G.scene.bpm || 124) / 120 + a.phase) * 0.05 : 0));
  c.scale(a.flip ? -1 : 1, breathe);
  c.globalAlpha = a.alpha * (a.ghost ? 0.78 + Math.sin(t * 2.3) * 0.08 : 1);
  if (a.ghost) { c.shadowColor = 'rgba(150,220,255,0.9)'; c.shadowBlur = 40; }
  if (a.glow) { c.shadowColor = a.glow; c.shadowBlur = 30; }
  c.drawImage(img, -w / 2, -h, w, h);
  c.restore();
}
function tween(obj, props, dur, ez) {
  if (TEST) { Object.assign(obj, props); return Promise.resolve(); }
  return new Promise((res) => {
    const from = {}; for (const k in props) from[k] = obj[k];
    G.tweens.push({ obj, from, to: props, t0: G.t, dur: Math.max(0.01, dur), ez: ez || ease, res });
  });
}
function updTweens() {
  G.tweens = G.tweens.filter((tw) => {
    const k = clamp((G.t - tw.t0) / tw.dur, 0, 1), e = tw.ez(k);
    for (const p in tw.to) tw.obj[p] = tw.from[p] + (tw.to[p] - tw.from[p]) * e;
    if (k >= 1) { tw.res(); return false; }
    return true;
  });
}
// andar (deslizando con saltito); los protas se ponen de perfil
async function walk(id, x, dur, o) {
  const a = G.actors[id]; if (!a) return;
  o = o || {};
  const dir = x > a.x ? 1 : -1;
  const side = isProta(id) && G.img['chars/' + id + '_lado'] && !o.front;
  const old = a.sprite, oldFlip = a.flip;
  if (side) a.sprite = 'chars/' + id + '_lado';
  a.flip = side ? dir < 0 : (o.flip !== undefined ? o.flip : dir < 0);
  a.walking = true;
  if (o.sound !== false) sfx(o.run ? 'correr' : 'pasos');
  await tween(a, { x }, dur || Math.abs(x - a.x) / 380, (k) => k);
  a.walking = false;
  if (side && !o.keepSide) { a.sprite = old.endsWith('_lado') ? 'chars/' + id : old; a.flip = false; }
  else if (!side && !o.keepSide) a.flip = oldFlip;
}
function hopA(id) { const a = G.actors[id]; if (!a) return; a.hop = 0.001; tween(a, { hop: 1 }, 0.45, (k) => k).then(() => (a.hop = 0)); }

/* ---------------- partículas ---------------- */
function emit(kind, x, y, n, o) {
  for (let i = 0; i < (n || 1); i++) {
    const p = { kind, x: x + rnd(-(o && o.sx || 0), (o && o.sx || 0)), y: y + rnd(-(o && o.sy || 0), (o && o.sy || 0)), vx: 0, vy: 0, life: 0, max: 2, s: 4, r: Math.random() * 6 };
    switch (kind) {
      case 'heart': p.vx = rnd(-40, 40); p.vy = rnd(-140, -70); p.max = rnd(1.6, 2.6); p.s = rnd(16, 34); break;
      case 'dust': p.vx = rnd(-6, 6); p.vy = rnd(-8, 4); p.max = rnd(4, 8); p.s = rnd(1.5, 3.5); break;
      case 'firefly': p.vx = rnd(-20, 20); p.vy = rnd(-14, 6); p.max = rnd(4, 7); p.s = rnd(2, 4); break;
      case 'rain': p.vx = -60; p.vy = rnd(900, 1200); p.max = 1.2; p.s = rnd(14, 26); break;
      case 'fog': p.vx = rnd(8, 24); p.vy = rnd(-3, 3); p.max = rnd(10, 16); p.s = rnd(120, 260); break;
      case 'steam': p.vx = rnd(-10, 10); p.vy = rnd(-40, -20); p.max = rnd(3, 6); p.s = rnd(40, 90); break;
      case 'spark': p.vx = rnd(-120, 120); p.vy = rnd(-160, 40); p.max = rnd(0.6, 1.2); p.s = rnd(3, 7); break;
      case 'salt': p.vx = rnd(-30, 30); p.vy = rnd(-30, 30); p.max = rnd(1.5, 3); p.s = rnd(2, 4); break;
      case 'bubble': p.vx = rnd(-10, 10); p.vy = rnd(-60, -30); p.max = rnd(1.5, 3); p.s = rnd(6, 14); break;
      case 'leaf': p.vx = rnd(10, 40); p.vy = rnd(30, 60); p.max = rnd(6, 10); p.s = rnd(6, 11); break;
      case 'star': p.vx = 0; p.vy = 0; p.max = rnd(0.6, 1.6); p.s = rnd(1.5, 3); break;
      case 'zzz': p.vx = rnd(10, 30); p.vy = rnd(-50, -30); p.max = 2; p.s = 30; break;
      case 'note': p.vx = rnd(-30, 30); p.vy = rnd(-70, -40); p.max = 2.2; p.s = 30; break;
    }
    if (o && o.color) p.color = o.color;
    if (G.particles.length < 600) G.particles.push(p);
  }
}
function updParticles(dt) {
  const sc = G.scene;
  if (sc && sc.emit && !G.mode) for (const e of sc.emit) {
    e.acc = (e.acc || 0) + e.rate * dt;
    while (e.acc >= 1) { e.acc--; emit(e.kind, rnd(e.x0, e.x1), rnd(e.y0, e.y1), 1, e); }
  }
  for (const p of G.particles) {
    p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (p.kind === 'heart' || p.kind === 'bubble') p.vx += Math.sin(G.t * 3 + p.r) * 30 * dt;
    if (p.kind === 'leaf') p.vx += Math.sin(G.t * 2 + p.r) * 40 * dt;
    if (p.kind === 'firefly' || p.kind === 'dust') { p.vx += rnd(-10, 10) * dt; p.vy += rnd(-10, 10) * dt; }
  }
  G.particles = G.particles.filter((p) => p.life < p.max);
}
function drawParticles(c) {
  for (const p of G.particles) {
    const k = p.life / p.max, fade = Math.sin(Math.PI * Math.min(1, k)) ;
    c.save();
    switch (p.kind) {
      case 'heart': c.globalAlpha = 1 - k; c.fillStyle = p.color || (p.r > 3 ? '#ff4d7d' : '#ff8fb5'); heartPath(c, p.x, p.y, p.s); c.fill(); break;
      case 'dust': c.globalAlpha = fade * 0.55; c.fillStyle = p.color || '#ffe7b0'; c.beginPath(); c.arc(p.x, p.y, p.s, 0, 7); c.fill(); break;
      case 'firefly': { c.globalCompositeOperation = 'lighter'; const a = fade * (0.5 + 0.5 * Math.sin(G.t * 6 + p.r)); const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 6);
        g.addColorStop(0, `rgba(220,255,150,${a})`); g.addColorStop(1, 'rgba(220,255,150,0)'); c.fillStyle = g; c.fillRect(p.x - p.s * 6, p.y - p.s * 6, p.s * 12, p.s * 12); break; }
      case 'rain': c.globalAlpha = 0.35; c.strokeStyle = '#b9c8ff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(p.x - p.s * 0.06, p.y - p.s); c.stroke(); break;
      case 'fog': { c.globalAlpha = fade * (p.color ? 0.18 : 0.12); const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s);
        g.addColorStop(0, p.color || '#c8d0ff'); g.addColorStop(1, 'rgba(200,208,255,0)'); c.fillStyle = g; c.fillRect(p.x - p.s, p.y - p.s, p.s * 2, p.s * 2); break; }
      case 'steam': { c.globalAlpha = fade * 0.25; const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * (1 + k));
        g.addColorStop(0, '#ffffff'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(p.x - p.s * 2, p.y - p.s * 2, p.s * 4, p.s * 4); break; }
      case 'spark': c.globalCompositeOperation = 'lighter'; c.globalAlpha = 1 - k; c.fillStyle = p.color || '#ffe28a'; c.beginPath(); c.arc(p.x, p.y, p.s * (1 - k), 0, 7); c.fill(); break;
      case 'salt': c.globalAlpha = 1 - k * 0.6; c.fillStyle = '#ffffff'; c.fillRect(p.x, p.y, p.s, p.s); break;
      case 'bubble': c.globalAlpha = 1 - k; c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.arc(p.x, p.y, p.s, 0, 7); c.stroke(); break;
      case 'leaf': c.globalAlpha = fade * 0.8; c.fillStyle = p.r > 3 ? '#6b8f3a' : '#a07a2a'; c.translate(p.x, p.y); c.rotate(G.t * 2 + p.r); c.beginPath(); c.ellipse(0, 0, p.s, p.s * 0.45, 0, 0, 7); c.fill(); break;
      case 'star': c.globalCompositeOperation = 'lighter'; c.globalAlpha = fade; c.fillStyle = '#fff8dc'; c.beginPath(); c.arc(p.x, p.y, p.s, 0, 7); c.fill(); break;
      case 'zzz': case 'note': c.globalAlpha = 1 - k; c.fillStyle = '#fff'; c.font = "bold 34px 'Patrick Hand', cursive"; c.fillText(p.kind === 'zzz' ? 'z' : pick(['♪', '♫']), p.x, p.y); break;
    }
    c.restore();
  }
}
function heartPath(c, x, y, s) {
  c.beginPath(); c.moveTo(x, y + s * 0.3);
  c.bezierCurveTo(x, y, x - s * 0.5, y, x - s * 0.5, y + s * 0.3);
  c.bezierCurveTo(x - s * 0.5, y + s * 0.6, x, y + s * 0.8, x, y + s);
  c.bezierCurveTo(x, y + s * 0.8, x + s * 0.5, y + s * 0.6, x + s * 0.5, y + s * 0.3);
  c.bezierCurveTo(x + s * 0.5, y, x, y, x, y + s * 0.3); c.closePath();
}

// luces: halos que parpadean, neones que fallan, velas
function noise1(x) { return Math.sin(x * 1.7) * 0.5 + Math.sin(x * 3.1 + 1.3) * 0.3 + Math.sin(x * 7.3 + 2.1) * 0.2; }
function drawFx(c, list) {
  if (!list) return;
  for (const f of list) {
    if (f.cond && !f.cond()) continue;
    const t = G.t + (f.seed || 0);
    if (f.type === 'glow' || f.type === 'candle') {
      const fl = f.type === 'candle' ? 0.75 + 0.25 * noise1(t * 6) : 1 - (f.flicker || 0) * (0.5 + 0.5 * noise1(t * 2.5));
      const r = f.r * (f.type === 'candle' ? 0.9 + 0.1 * noise1(t * 4) : 1);
      c.save(); c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
      g.addColorStop(0, hexA(f.color, (f.a || 0.35) * fl)); g.addColorStop(1, hexA(f.color, 0));
      c.fillStyle = g; c.fillRect(f.x - r, f.y - r, r * 2, r * 2); c.restore();
    } else if (f.type === 'neon') {
      // de vez en cuando el neón falla
      const cyc = (t % (f.period || 7));
      const off = cyc > (f.period || 7) - 0.5 && Math.sin(t * 60) > 0;
      c.save();
      if (off) { c.fillStyle = 'rgba(5,5,15,0.65)'; c.fillRect(f.x - f.w / 2, f.y - f.h / 2, f.w, f.h); }
      else {
        c.globalCompositeOperation = 'lighter';
        const r = Math.max(f.w, f.h) * 0.9, a = (f.a || 0.3) * (0.85 + 0.15 * Math.sin(t * 9));
        const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
        g.addColorStop(0, hexA(f.color, a)); g.addColorStop(1, hexA(f.color, 0)); c.fillStyle = g; c.fillRect(f.x - r, f.y - r, r * 2, r * 2);
      }
      c.restore();
    } else if (f.type === 'beam') {
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (f.a || 0.12) * (0.8 + 0.2 * Math.sin(t * 0.7));
      const g = c.createLinearGradient(f.x0, f.y0, f.x1, f.y1); g.addColorStop(0, f.color); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.beginPath(); c.moveTo(f.x0 - f.w0, f.y0); c.lineTo(f.x0 + f.w0, f.y0); c.lineTo(f.x1 + f.w1, f.y1); c.lineTo(f.x1 - f.w1, f.y1); c.closePath(); c.fill(); c.restore();
    } else if (f.type === 'tube') {
      // fluorescente que tartamudea
      const bad = f.bad && (t % 5) < 0.6 && Math.sin(t * 40) > 0.2;
      c.save();
      if (bad) { c.fillStyle = 'rgba(0,0,10,0.5)'; c.fillRect(f.x - f.w / 2, f.y - 14, f.w, 28); }
      else { c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.w * 0.7); g.addColorStop(0, 'rgba(255,230,180,0.22)'); g.addColorStop(1, 'rgba(255,230,180,0)'); c.fillStyle = g; c.fillRect(f.x - f.w, f.y - f.w * 0.7, f.w * 2, f.w * 1.4); }
      c.restore();
    } else if (f.type === 'shimmer') {
      // reflejos en suelo mojado
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 6; i++) { const yy = f.y + i * 9; c.globalAlpha = 0.05 + 0.04 * Math.sin(t * 3 + i); c.fillStyle = f.color; c.fillRect(f.x - f.w / 2 + Math.sin(t * 2 + i) * 6, yy, f.w, 3); }
      c.restore();
    } else if (f.type === 'stars') {
      if (!f.pts) { f.pts = []; for (let i = 0; i < f.n; i++) f.pts.push([rnd(f.x0, f.x1), rnd(f.y0, f.y1), Math.random() * 6]); }
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const [x, y, p] of f.pts) { const a = 0.5 + 0.5 * Math.sin(t * 2 + p * 3); c.globalAlpha = a * 0.8; c.fillStyle = '#fffbe6'; c.fillRect(x, y, 2, 2); }
      c.restore();
    } else if (f.type === 'draw' && f.fn) f.fn(c, t);
  }
}
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(a, 0, 1)})`;
}

/* ---------------- frases sueltas cuando no pasa nada ---------------- */
function updIdle(dt) {
  if (!S || !G.started || G.busy || G.dlgOpen || G.mode || !G.scene || !G.scene.pos || typeof IDLE_LINES === 'undefined') { G.idleT = 8; return; }
  if (G.bubble && G.t > G.bubble.until) G.bubble = null;
  G.idleT = (G.idleT === undefined ? 8 : G.idleT) - dt;
  if (G.idleT > 0) return;
  const crowd = Object.keys(G.actors).filter((id) => isCrowd(id) && typeof crowdIdle === 'function' && crowdIdle(id).length);
  G.idleT = crowd.length ? rnd(6, 10) : rnd(10, 16);
  const ids = PROTA.filter((p) => G.actors[p]); if (!ids.length) return;
  // a veces habla alguien de la gente de la noche
  const who = crowd.length && Math.random() < 0.55 ? pick(crowd) : pick(ids);
  let txt = isCrowd(who) ? pick(crowdIdle(who)) : pick(IDLE_LINES[who] || ['…']);
  // en los sitios con la música a tope no se oye nada
  if (G.scene.loud && isProta(who) && Math.random() < 0.5) txt = pick(['¿¡QUÉ!?', '¡NO TE OIGO!', '¿¡CÓMO DICES!?', '¡QUE SÍ, QUE VALE!', '¿HAS DICHO PULPO?', '¡ESTA CANCIÓN ES UN TEMAZO!']);
  if (isProta(who) && S.drunk[who] >= 3) txt += ' ¡hip!';
  G.bubble = { who, txt, until: G.t + 3.4 };
  hopA(who);
  try { for (let i = 0; i < 3; i++) setTimeout(() => AUDIO.blip(who), i * 90); } catch (er) {}
}
function drawBubble(c) {
  const b = G.bubble; if (!b) return;
  const a = G.actors[b.who], bb = a && actorBox(a); if (!bb) return;
  c.save(); c.font = "30px 'Patrick Hand', cursive";
  const tw = Math.min(460, c.measureText(b.txt).width + 36), x = clamp(a.x, tw / 2 + 10, W - tw / 2 - 10), y = Math.max(150, bb.y - 30);
  const k = Math.min(1, (b.until - G.t) * 3, (G.t - (b.until - 3.4)) * 6);
  c.globalAlpha = clamp(k, 0, 1);
  c.fillStyle = 'rgba(255,250,235,.96)'; c.strokeStyle = '#2a1a08'; c.lineWidth = 4;
  c.beginPath(); c.roundRect(x - tw / 2, y - 58, tw, 52, 18); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(a.x - 12, y - 8); c.lineTo(a.x, y + 10); c.lineTo(a.x + 10, y - 8); c.closePath(); c.fill();
  c.fillStyle = '#2a1a08'; c.textAlign = 'center'; c.fillText(b.txt, x, y - 22, tw - 24);
  c.restore();
}

/* ---------------- dibujo de la escena ---------------- */
function renderScene(c) {
  const sc = G.scene;
  c.save();
  c.fillStyle = '#05060f'; c.fillRect(0, 0, W, H);
  if (G.camZoom !== 1) { c.translate(W / 2, H / 2); c.scale(G.camZoom, G.camZoom); c.translate(-G.camX, -G.camY); }
  if (sc) {
    if (sc.draw) sc.draw(c, G.t);
    else { const bg = G.img['bg/' + sc.bg]; if (bg) c.drawImage(bg, 0, 0, W, H); }
    drawFx(c, sc.fxBack);
    // objetos en la escena
    for (const p of G.props) if (!p.cond || p.cond()) {
      const im = G.img['items/' + p.img]; if (!im) continue;
      const h = p.h, w = im.width * h / im.height;
      c.save(); c.translate(p.x, p.y + Math.sin(G.t * 2 + p.x) * (p.float || 0));
      if (p.glow || (G.reveal > G.t && p.hs)) { c.shadowColor = 'rgba(255,230,150,.9)'; c.shadowBlur = 20 + 8 * Math.sin(G.t * 5); }
      c.drawImage(tinted('items/' + p.img, sc.tint) || im, -w / 2, -h, w, h); c.restore();
    }
    const list = Object.values(G.actors).sort((a, b) => (a.z - b.z) || (a.y - b.y));
    for (const a of list) drawActor(c, a);
    if (S && G.started && !G.busy && !G.dlgOpen) { const a = G.actors[S.active], bb = a && actorBox(a); if (bb && a.visible) {
      const y = bb.y - 18 + Math.sin(G.t * 4) * 6; c.save(); c.fillStyle = '#ffd98a'; c.strokeStyle = '#3a2408'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(a.x - 16, y - 22); c.lineTo(a.x + 16, y - 22); c.lineTo(a.x, y); c.closePath(); c.stroke(); c.fill(); c.restore(); } }
    drawFx(c, sc.fx);
    if (sc.drawTop) sc.drawTop(c, G.t);
    if (!G.busy && !G.dlgOpen) drawBubble(c);
  }
  drawParticles(c);
  // zonas a la vista (lupa)
  if (G.reveal > G.t && sc && !G.mode) drawReveal(c);
  else if (sc && !G.mode && !G.busy) drawExits(c);
  c.restore();
}
function drawExits(c) {
  for (const e of visExits()) {
    const [x, y, w, h] = e.r, cx = x + w / 2, cy = y + h / 2;
    const a = 0.55 + 0.25 * Math.sin(G.t * 3), dir = e.arrow || 'up';
    c.save(); c.translate(cx, cy); c.globalAlpha = a;
    c.rotate({ up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[dir]);
    c.fillStyle = '#ffd98a'; c.strokeStyle = '#3a2408'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(0, -30); c.lineTo(26, 6); c.lineTo(10, 6); c.lineTo(10, 30); c.lineTo(-10, 30); c.lineTo(-10, 6); c.lineTo(-26, 6); c.closePath();
    c.stroke(); c.fill(); c.restore();
  }
}
function drawReveal(c) {
  const k = 0.6 + 0.4 * Math.sin(G.t * 6);
  c.save(); c.font = "30px 'Patrick Hand', cursive"; c.textAlign = 'center';
  for (const h of [...visHotspots(), ...visExits()]) {
    const [x, y, w, hh] = h.r;
    c.strokeStyle = `rgba(255,217,138,${k})`; c.lineWidth = 4; c.setLineDash([14, 10]); c.lineDashOffset = -G.t * 40;
    c.strokeRect(x, y, w, hh); c.setLineDash([]);
    const tw = c.measureText(h.name).width + 24;
    const lx = clamp(x + w / 2, tw / 2 + 6, W - tw / 2 - 6), ly = clamp(y + Math.min(hh / 2, 40), 130, H - 30);
    c.fillStyle = 'rgba(10,8,20,.85)'; c.fillRect(lx - tw / 2, ly - 22, tw, 38);
    c.fillStyle = '#ffd98a'; c.fillText(h.name, lx, ly + 7);
  }
  c.restore();
}

function frame(ms) {
  const now = ms / 1000; G.dt = Math.min(0.05, now - (G.last || now)); G.last = now; G.t += G.dt;
  updTweens(); updParticles(G.dt); updIdle(G.dt);
  if (G.mode && G.mode.update) G.mode.update(G.dt);
  // pintar en el búfer
  bx.setTransform(1, 0, 0, 1, 0, 0);
  if (G.mode && G.mode.draw) G.mode.draw(bx, G.t); else renderScene(bx);
  if (vignette) bx.drawImage(vignette, 0, 0);
  // efecto borrachera de quien manejas: el mundo baila y se ve doble
  const lvl = G.mode && G.mode.drunk !== undefined ? G.mode.drunk : (S && G.scene && !G.scene.noDrunk ? S.drunk[S.active] : 0);
  G.drunkFx += ((lvl || 0) - G.drunkFx) * Math.min(1, G.dt * 1.5);
  const d = G.drunkFx;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save();
  let sx = 0, sy = 0;
  if (G.shake > 0) { sx = rnd(-1, 1) * G.shake * 18; sy = rnd(-1, 1) * G.shake * 18; G.shake = Math.max(0, G.shake - G.dt * 2); }
  if (d > 0.05) {
    const rot = Math.sin(G.t * 0.7) * 0.006 * d, zz = 1 + 0.012 * d;
    ctx.translate(W / 2 + sx, H / 2 + sy); ctx.rotate(rot); ctx.scale(zz, zz); ctx.translate(-W / 2, -H / 2);
    ctx.drawImage(buf, 0, 0);
    if (d >= 1.5) {
      ctx.globalAlpha = Math.min(0.42, (d - 1) * 0.11);
      ctx.drawImage(buf, Math.sin(G.t * 1.3) * 7 * d, Math.cos(G.t * 1.1) * 4 * d);
    }
  } else { ctx.translate(sx, sy); ctx.drawImage(buf, 0, 0); }
  ctx.restore();
  // fundidos y destellos
  if (G.fade !== G.fadeTo) { const s = G.fadeSpeed * G.dt; G.fade = G.fade < G.fadeTo ? Math.min(G.fadeTo, G.fade + s) : Math.max(G.fadeTo, G.fade - s); }
  if (G.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${G.fade})`; ctx.fillRect(0, 0, W, H); }
  if (G.flashA > 0) { ctx.fillStyle = G.flashC; ctx.globalAlpha = G.flashA; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; G.flashA = Math.max(0, G.flashA - G.dt * 2.5); }
  requestAnimationFrame(frame);
}
function fadeTo(v, sec) { if (TEST) { G.fade = G.fadeTo = v; return Promise.resolve(); } G.fadeTo = v; G.fadeSpeed = 1 / Math.max(0.05, sec || 0.6); return wait((sec || 0.6) * 1000 + 30); }
function flash(c, a) { G.flashC = c || '#fff'; G.flashA = a || 0.8; }
function shake(v) { G.shake = v || 0.6; }

/* ---------------- zonas clicables ---------------- */
function visHotspots() { const sc = G.scene; return sc && sc.hs ? sc.hs.filter((h) => !h.cond || h.cond()) : []; }
function visExits() { const sc = G.scene; return sc && sc.exits ? sc.exits.filter((h) => !h.cond || h.cond()) : []; }
function inR(p, r) { return p.x >= r[0] && p.x <= r[0] + r[2] && p.y >= r[1] && p.y <= r[1] + r[3]; }
function pickAt(p) {
  const acts = Object.values(G.actors).filter((a) => a.visible && a.alpha > 0.2 && !a.noClick).sort((a, b) => (b.z - a.z) || (b.y - a.y));
  for (const a of acts) {
    const bb = actorBox(a); if (!bb) continue;
    const r = [bb.x + bb.w * 0.18, bb.y + bb.h * 0.04, bb.w * 0.64, bb.h * 0.94];
    if (inR(p, r)) return { kind: 'actor', a };
  }
  for (const pr of G.props) if (pr.hs && (!pr.cond || pr.cond())) {
    const im = G.img['items/' + pr.img]; if (!im) continue; const w = im.width * pr.h / im.height;
    if (inR(p, [pr.x - w / 2 - 10, pr.y - pr.h - 10, w + 20, pr.h + 20])) return { kind: 'hs', h: pr.hs };
  }
  // las zonas más pequeñas ganan
  const hs = visHotspots().filter((h) => inR(p, h.r)).sort((a, b) => a.r[2] * a.r[3] - b.r[2] * b.r[3]);
  if (hs.length) return { kind: 'hs', h: hs[0] };
  for (const e of visExits()) if (inR(p, e.r)) return { kind: 'exit', e };
  return null;
}

/* ---------------- interfaz ---------------- */
const VICON = { Mirar: '👁', Hablar: '💬', Coger: '✋', Usar: '⚙', Abrir: '🗝', Beber: '🍺', Entrar: '🚪', Ir: '➜', Pedir: '🍷', Elegir: '★', Bailar: '💃', Sentarse: '🪑', Tocar: '✋', Leer: '📜', Rezar: '🙏', Subir: '⬆', Bajar: '⬇', Conducir: '🚗', Pagar: '💶', Ligar: '😏', Probar: '🍮' };
function closeMenus() { $('verbs').classList.add('hidden'); $('label').classList.add('hidden'); }
function openVerbs(p, title, opts) {
  const v = $('verbs'); v.innerHTML = '';
  const h = document.createElement('h4'); h.textContent = title; v.appendChild(h);
  const w = document.createElement('div'); w.className = 'who'; w.textContent = 'como ' + NAMES[S.active]; v.appendChild(w);
  for (const o of opts) {
    const b = document.createElement('button');
    b.innerHTML = `<span>${VICON[o.v] || '•'}</span>${o.label || o.v}`;
    b.onclick = (e) => { e.stopPropagation(); sfx('click'); closeMenus(); run(o.fn); };
    v.appendChild(b);
  }
  v.classList.remove('hidden');
  const r = v.getBoundingClientRect(), bw = r.width / G.scale, bh = r.height / G.scale;
  v.style.left = clamp(p.x + 20, 10, W - bw - 10) + 'px';
  v.style.top = clamp(p.y - bh / 2, 110, H - bh - 140) + 'px';
}
// ejecuta una acción bloqueando la entrada mientras dura
async function run(fn) {
  if (!fn) return;
  G.busy++;
  try { await fn(); } catch (e) { console.error(e); }
  G.busy--;
  updParty(); save();
}
function onTap(p) {
  closeMenus();
  const hit = pickAt(p);
  if (G.holding) { useHolding(hit); return; }
  if (!hit) { emit('spark', p.x, p.y, 4); return; }
  sfx('tap');
  if (hit.kind === 'exit') { run(() => exitTo(hit.e)); return; }
  if (hit.kind === 'actor') { actorMenu(p, hit.a); return; }
  const hs = hit.h;
  const opts = [];
  for (const k in hs.verbs || {}) opts.push({ v: k.split('|')[0], label: k.split('|')[1] || k.split('|')[0], fn: hs.verbs[k] });
  if (S.inv.length) opts.push({ v: 'Usar', label: 'Usar objeto…', fn: async () => { openBag(true, hs); } });
  if (opts.length === 1 && !S.inv.length) { run(opts[0].fn); return; }
  openVerbs(p, hs.name, opts);
}
function actorMenu(p, a) {
  const sc = G.scene, opts = [];
  if (isProta(a.id)) {
    if (a.id !== S.active) opts.push({ v: 'Elegir', label: 'Jugar con ' + NAMES[a.id], fn: async () => setActive(a.id) });
    opts.push({ v: 'Hablar', label: a.id === S.active ? 'Pensar en voz alta' : 'Hablar con ' + NAMES[a.id], fn: async () => hintTalk(a.id) });
    if (S.inv.length) opts.push({ v: 'Usar', label: 'Darle un objeto…', fn: async () => openBag(true, { actor: a.id }) });
  }
  const def = (sc && sc.npc && sc.npc[a.id]) || (isCrowd(a.id) && typeof crowdDef === 'function' ? crowdDef(a.id) : null);
  if (def) for (const k in def) if (k !== 'name') opts.push({ v: k.split('|')[0], label: k.split('|')[1] || k.split('|')[0], fn: def[k] });
  if (S.inv.length && !isProta(a.id)) opts.push({ v: 'Usar', label: 'Dar / usar objeto…', fn: async () => openBag(true, { actor: a.id }) });
  if (!opts.length) return;
  openVerbs(p, (def && def.name) || NAMES[a.id], opts);
}
async function useHolding(hit) {
  const item = G.holding; setHolding(null);
  if (!hit) return;
  if (hit.kind === 'hs') await run(() => useItemOn(item, hit.h));
  else if (hit.kind === 'actor') await run(() => useItemOn(item, { actor: hit.a.id }));
}
async function useItemOn(item, target) {
  const sc = G.scene;
  if (target.actor) {
    const f = sc.give && sc.give[target.actor] && (sc.give[target.actor][item] || sc.give[target.actor]['*']);
    if (f) return f(item);
    if (isProta(target.actor) && typeof GIVE_PROTA === 'function') { const r = GIVE_PROTA(item, target.actor); if (r) return r; }
    if (isProta(target.actor)) return say(target.actor, pick(['Guárdalo tú, que yo lo pierdo todo.', 'Eso es de la bolsa del Club. Es de todos.', '¿Y yo qué hago con eso?']));
    return say(S.active, pick(['No creo que le interese.', 'Mejor no.', 'Me miraría raro.']));
  }
  const f = target.items && (target.items[item] || target.items['*']);
  if (f) return f(item);
  return say(S.active, pick(['Eso ahí no pinta nada.', 'No funciona. Ni con fe.', 'Ni idea de para qué serviría eso ahí.', 'Mmm… no.']));
}
function setHolding(item) {
  G.holding = item;
  const h = $('holding');
  if (!item) { h.classList.add('hidden'); return; }
  h.querySelector('img').src = 'img/items/' + ITEMS[item].img + '.webp';
  h.querySelector('span').textContent = 'Usar ' + itemName(item) + '… toca dónde';
  h.classList.remove('hidden');
}
function itemName(i) { const it = ITEMS[i]; return typeof it.name === 'function' ? it.name() : it.name; }
function itemDesc(i) { const it = ITEMS[i]; return typeof it.desc === 'function' ? it.desc() : it.desc; }

// bolsa
let bagSel = null, bagTarget = null;
function openBag(forUse, target) {
  bagTarget = target || null; bagSel = null;
  const box = $('bagitems'); box.innerHTML = '';
  for (const i of S.inv) {
    const d = document.createElement('div'); d.className = 'it';
    d.innerHTML = `<img src="img/items/${ITEMS[i].img}.webp" alt=""><p>${itemName(i)}</p>`;
    d.onclick = (e) => {
      e.stopPropagation(); sfx('click');
      [...box.children].forEach((c) => c.classList.remove('sel')); d.classList.add('sel'); bagSel = i;
      $('bagdesc').textContent = itemDesc(i); renderBagBtns();
    };
    box.appendChild(d);
  }
  $('bagdesc').textContent = S.inv.length ? (forUse ? '¿Qué objeto quieres usar?' : 'Toca un objeto para verlo.') : 'La bolsa está vacía. Como la cartera de Ramis.';
  renderBagBtns();
  $('bag').classList.remove('hidden'); sfx('open');
}
function renderBagBtns() {
  let bb = document.querySelector('.bagbtns'); if (bb) bb.remove();
  bb = document.createElement('div'); bb.className = 'bagbtns';
  if (bagSel) {
    const u = document.createElement('button'); u.className = 'gold'; u.textContent = bagTarget ? 'Usar aquí' : 'Usar…';
    u.onclick = (e) => {
      e.stopPropagation(); const it = bagSel, tg = bagTarget; closeBag();
      if (tg) run(() => useItemOn(it, tg)); else setHolding(it);
    };
    bb.appendChild(u);
  }
  const c = document.createElement('button'); c.className = 'gold'; c.textContent = 'Cerrar';
  c.onclick = (e) => { e.stopPropagation(); closeBag(); };
  bb.appendChild(c);
  $('bagClose').classList.add('hidden');
  $('bagdesc').after(bb);
}
function closeBag() { $('bag').classList.add('hidden'); sfx('close'); }
function give(i, from) {
  if (!has(i)) S.inv.push(i);
  sfx('pickup'); updParty();
  const b = $('bBolsa'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
  toast('🎒', 'Nuevo objeto', itemName(i));
}
function takeItem(i) { S.inv = S.inv.filter((x) => x !== i); updParty(); }

// grupo (los 4) con su borrachera
function buildParty() {
  const p = $('party'); p.innerHTML = '';
  for (const id of PROTA) {
    const d = document.createElement('div'); d.className = 'pm'; d.id = 'pm_' + id;
    d.innerHTML = `<img alt=""><div class="pn">${NAMES[id]}</div><div class="seg">${'<s></s>'.repeat(5)}</div><div class="pl"></div>`;
    d.onclick = (e) => { e.stopPropagation(); if (G.busy || G.mode) return; sfx('click'); setActive(id); };
    p.appendChild(d);
  }
  updParty();
}
function face(id, mood) {
  if (isCrowd(id)) return 'img/faces/' + id + '_normal.webp';
  if (!isProta(id)) return 'img/faces/' + id + '_' + (mood === 'risa' ? 'risa' : 'normal') + '.webp';
  if (!mood || mood === 'auto') mood = S.drunk[id] >= 3 ? 'borracho' : 'normal';
  return 'img/faces/' + id + '_' + mood + '.webp';
}
function updParty() {
  if (!S) return;
  for (const id of PROTA) {
    const d = $('pm_' + id); if (!d) continue;
    const lv = S.drunk[id];
    d.classList.toggle('on', S.active === id); d.classList.toggle('drv', id === 'marcos');
    const src = face(id, lv >= 3 ? 'borracho' : 'normal'); const im = d.querySelector('img'); if (!im.src.endsWith(src)) im.src = src;
    d.style.setProperty('--c', LVC[lv]);
    d.querySelectorAll('s').forEach((s, i) => s.classList.toggle('on', i < lv));
    d.querySelector('.pl').textContent = LV[lv];
  }
  $('bolsaN').textContent = S.inv.length || '';
  $('objtxt').textContent = S.obj || '';
  $('obj').classList.toggle('hidden', !S.obj);
  try { AUDIO.drunk(clamp(S.drunk[S.active] / 5, 0, 1)); } catch (e) {}
}
function setActive(id) {
  if (S.active === id) return;
  S.active = id; updParty(); hopA(id);
  toast('★', 'Ahora juegas con', NAMES[id]);
}
function setObj(t) {
  S.obj = t; updParty();
  const o = $('obj'); o.classList.remove('flash'); void o.offsetWidth; o.classList.add('flash');
}
// borrachera: +n o -n; devuelve el nivel
function drink(id, n, quiet) {
  const before = S.drunk[id];
  S.drunk[id] = clamp(before + n, 0, 5);
  if (n > 0) { S.stats.copas += n; if (id === 'marcos') S.stats.marcosCopas = (S.stats.marcosCopas || 0) + n; if (!quiet) sfx('trago'); }
  if (n < 0 && id === 'marcos') S.stats.cafes++;
  // si cambia de pose (alegre, piripi, mamado), saltito para que se note
  const band = (l) => (l >= 4 ? 3 : l >= 2 ? 2 : l);
  if (band(before) !== band(S.drunk[id])) hopA(id);
  updParty();
  if (S.drunk.ramis >= 5) logro('vivido');
  return S.drunk[id];
}
function toast(icon, title, text) {
  const t = $('toast');
  t.innerHTML = `<div class="ti">${icon}</div><div><b>${title}</b><span>${text}</span></div>`;
  t.classList.remove('hidden'); t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
  clearTimeout(t._h); t._h = setTimeout(() => t.classList.add('hidden'), 3600);
}
function logro(id) {
  if (!S || S.logros.includes(id) || !LOGROS[id]) return;
  S.logros.push(id); sfx('logro');
  setTimeout(() => toast(LOGROS[id].i, 'Logro', LOGROS[id].t), 400);
}

/* ---------------- diálogos ---------------- */
let advanceFn = null;
function slur(t, lv) {
  if (lv >= 4) t = t.replace(/s([aeiouáéíóú ])/gi, (m, v) => (Math.random() < 0.55 ? 'sh' + v : m));
  if (lv >= 3 && Math.random() < 0.45) t += pick([' ¡Hip!', ' *hip*', ' ¡HIC!']);
  return t;
}
async function say(who, text, mood, o) {
  o = o || {};
  if (TEST) { (G.log = G.log || []).push((NAMES[who] || who) + ': ' + text); return; }
  const dlg = $('dlg'), port = $('dport').querySelector('img'), nm = $('dname'), tx = $('dtext');
  G.dlgOpen = true; closeMenus();
  dlg.classList.remove('hidden', 'narr', 'right');
  // con la música a tope el cuadro tiembla al ritmo
  dlg.classList.toggle('loud', !!(G.scene && G.scene.loud && !G.mode && who !== 'narrador'));
  if (who === 'narrador') dlg.classList.add('narr');
  else {
    port.src = face(who, mood);
    nm.textContent = o.name || NAMES[who];
    if (!isProta(who)) dlg.classList.add('right');
  }
  const lv = isProta(who) ? S.drunk[who] : 0;
  if (isProta(who) && !o.noSlur) text = slur(text, lv);
  if (lv >= 3 && /hip|HIC/i.test(text)) sfx('hipo');
  const a = G.actors[who]; if (a) a.talking = true;
  if (mood === 'risa') {
    // la risa suena como mucho cada pocos segundos, para que no canse
    const now = performance.now();
    if (!G.lastLaugh || now - G.lastLaugh > 5000) { G.lastLaugh = now; try { AUDIO.laugh(who === 'gc1' || who === 'gc2' ? 'gc' : who); } catch (er) {} }
    if (a) a.laughUntil = G.t + 1.6;
  }
  port.classList.add('talk');
  // máquina de escribir
  const html = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  const plain = html.replace(/<[^>]+>/g, '');
  let shown = 0, done = false;
  tx.innerHTML = '';
  const total = plain.length;
  const speed = who === 'narrador' ? 0.024 : 0.019;
  await new Promise((res) => {
    let acc = 0, lastBlip = 0;
    const tick = () => {
      if (done) return;
      acc += 1;
      shown = Math.min(total, shown + 1);
      tx.innerHTML = cutHtml(html, shown);
      if (shown - lastBlip >= 3 && who !== 'narrador') { lastBlip = shown; try { AUDIO.blip(who === 'gc1' || who === 'gc2' ? 'gc' : who); } catch (e) {} }
      if (shown >= total) { done = true; if (a) a.talking = false; port.classList.remove('talk'); finish(); return; }
      setTimeout(tick, speed * 1000 * (/[.,!?…]/.test(plain[shown - 1]) ? 6 : 1));
    };
    let finished = false;
    const finish = () => {
      if (finished) return; finished = true;
      if (o.noWait) { advanceFn = null; res(); return; }
      advanceFn = () => { advanceFn = null; res(); };
      if (o.auto) setTimeout(() => advanceFn && advanceFn(), o.auto);
    };
    advanceFn = () => { done = true; tx.innerHTML = html; if (a) a.talking = false; port.classList.remove('talk'); finish(); };
    tick();
  });
  if (a) a.talking = false;
  if (!o.keep) { dlg.classList.add('hidden'); G.dlgOpen = false; }
  await wait(60);
}
function cutHtml(html, n) {
  let out = '', c = 0, inTag = false;
  for (const ch of html) {
    if (ch === '<') inTag = true;
    if (inTag) { out += ch; if (ch === '>') inTag = false; continue; }
    if (c >= n) break; out += ch; c++;
  }
  if ((out.match(/<em>/g) || []).length > (out.match(/<\/em>/g) || []).length) out += '</em>';
  return out;
}
const narr = (t, o) => say('narrador', t, null, o);
async function choose(opts, prompt) {
  opts = opts.filter((o) => !o.cond || o.cond());
  if (TEST) { const o = (G.pickFn && G.pickFn(opts, prompt)) || opts[0]; (G.log = G.log || []).push('  [elige] ' + o.t); return o.v !== undefined ? o.v : o.t; }
  if (prompt) await say('narrador', prompt, null, { keep: true, noWait: true });
  G.dlgOpen = false; advanceFn = null;
  const box = $('choices'); box.innerHTML = '';
  return new Promise((res) => {
    opts.forEach((o) => {
      const b = document.createElement('button');
      b.innerHTML = o.t + (o.sub ? `<small>${o.sub}</small>` : '');
      b.onclick = (e) => { e.stopPropagation(); sfx('click'); box.classList.add('hidden'); $('dlg').classList.add('hidden'); G.dlgOpen = false; res(o.v !== undefined ? o.v : o.t); };
      box.appendChild(b);
    });
    box.classList.remove('hidden');
  });
}
function advance() { if (advanceFn) { sfx('tap', { soft: true }); advanceFn(); } }

/* ---------------- carteles, guardado ---------------- */
async function card(title, sub, ms) {
  if (TEST) { (G.log = G.log || []).push('== ' + title); return; }
  const c = $('card'); c.innerHTML = `<div class="cin"><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ''}</div>`;
  c.classList.remove('hidden'); sfx('pagina');
  await wait(ms || 2600); c.classList.add('hidden');
}
function save() { try { if (S && G.started && !S.over) localStorage.setItem('pq_save_v1', JSON.stringify(S)); } catch (e) {} }
function loadSave() { try { const s = JSON.parse(localStorage.getItem('pq_save_v1')); return s && s.v === 1 ? s : null; } catch (e) { return null; } }
function clearSave() { try { localStorage.removeItem('pq_save_v1'); } catch (e) {} }

/* ---------------- cambio de escena ---------------- */
async function goScene(id, o) {
  o = o || {};
  closeMenus(); setHolding(null);
  await fadeTo(1, o.fast ? 0.3 : 0.45);
  const sc = SCENES[id]; S.scene = id; G.sceneId = id; G.scene = sc;
  G.actors = {}; G.particles = []; G.props = sc.props ? sc.props.slice() : []; G.camZoom = 1;
  if (sc.setup) sc.setup();
  // los 4 en su sitio
  if (sc.pos) PROTA.forEach((p) => { if (sc.pos[p]) actor(p, { x: sc.pos[p][0], y: sc.pos[p][1], k: sc.k || 0.62, sprite: 'chars/' + p, flip: false }); });
  if (sc.npcs) for (const n of sc.npcs) if (!n.cond || n.cond()) actor(n.id, Object.assign({ k: sc.k || 0.62 }, n));
  if (sc.emit) sc.emit.forEach((e) => { for (let i = 0; i < e.pre || 0; i++) emit(e.kind, rnd(e.x0, e.x1), rnd(e.y0, e.y1), 1, e); });
  music(sc.music || null); ambient(sc.ambient || null);
  $('hud').classList.toggle('hidden', !!sc.noHud);
  updParty(); save();
  // cambio de sitio: fundido a negro (sin andar, que no hay animación de caminar)
  await wait(200);
  await fadeTo(0, 0.6);
  if (!S.seen[id] && sc.title) card(sc.title, sc.sub);
  const first = !S.seen[id]; S.seen[id] = true;
  if (first && sc.enter) await sc.enter(); else if (!first && sc.reenter) await sc.reenter();
  save();
}
async function exitTo(e) {
  if (e.check) { const ok = await e.check(); if (!ok) return; }
  if (e.fn) return e.fn();
  sfx('pasos');
  await goScene(e.to);
}

/* ---------------- pistas de los amigos ---------------- */
async function hintTalk(id) {
  const h = typeof HINT === 'function' ? HINT(id) : null;
  if (h) await say(id, h); else await say(id, '…');
}

/* ---------------- entrada ---------------- */
function bindInput() {
  const st = $('stage');
  st.addEventListener('pointerdown', (e) => {
    try { AUDIO.init(); } catch (er) {}
    if (e.target.closest('button') || e.target.closest('.it') || e.target.closest('#verbs') || e.target.closest('.bagin') || e.target.closest('.mbox')) return;
    const p = toStage(e);
    if (G.mode && G.mode.down) { G.mode.down(p, e); return; }
    if (G.dlgOpen) { advance(); return; }
    if (!$('bag').classList.contains('hidden')) { closeBag(); return; }
    if (!$('verbs').classList.contains('hidden')) { closeMenus(); return; }
    if (G.busy || !G.started || !G.scene) return;
    onTap(p);
  });
  st.addEventListener('pointermove', (e) => {
    const p = toStage(e);
    if (G.mode && G.mode.move) { G.mode.move(p, e); return; }
    if (e.pointerType !== 'mouse' || G.busy || G.dlgOpen || !G.started || !G.scene) { $('label').classList.add('hidden'); return; }
    const hit = pickAt(p), l = $('label');
    let name = null;
    if (hit) name = hit.kind === 'exit' ? '➜ ' + hit.e.name : hit.kind === 'actor' ? ((G.scene.npc && G.scene.npc[hit.a.id] && G.scene.npc[hit.a.id].name) || NAMES[hit.a.id]) : hit.h.name;
    if (G.holding && name) name = 'Usar ' + itemName(G.holding) + ' con ' + name.replace('➜ ', '');
    if (name) { l.textContent = name; l.style.left = p.x + 'px'; l.style.top = p.y + 'px'; l.classList.remove('hidden'); st.style.cursor = 'pointer'; }
    else { l.classList.add('hidden'); st.style.cursor = 'default'; }
  });
  st.addEventListener('pointerup', (e) => { if (G.mode && G.mode.up) G.mode.up(toStage(e), e); });
  addEventListener('keydown', (e) => {
    if (G.mode && G.mode.key) { G.mode.key(e.key, true); }
    if ((e.key === ' ' || e.key === 'Enter') && G.dlgOpen) { e.preventDefault(); advance(); }
    if (e.key === 'Escape') { closeMenus(); setHolding(null); if (!$('bag').classList.contains('hidden')) closeBag(); }
  });
  addEventListener('keyup', (e) => { if (G.mode && G.mode.key) G.mode.key(e.key, false); });
  $('holding').querySelector('button').onclick = (e) => { e.stopPropagation(); setHolding(null); };
  $('bBolsa').onclick = (e) => { e.stopPropagation(); if (G.busy || G.mode) return; openBag(false); };
  $('bLupa').onclick = (e) => { e.stopPropagation(); G.reveal = G.t + 3; sfx('magia'); };
  addEventListener('resize', fit);
  addEventListener('orientationchange', () => setTimeout(fit, 200));
}
