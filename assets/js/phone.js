/* Viz Zora: the phone.
   A CSS 3D phone (stacked slices for thickness, a 2D canvas for its screen) stands behind the page.
   Each section says where it goes (data-phone: hero, start, end, dim) and what it shows
   (data-mode: feed, network, reel, code, doc, chat). It spins when the screen changes,
   leans toward the pointer, and throws hearts when it is clicked. No dependencies. */
(function () {
  'use strict';

  var stage = document.getElementById('stage');
  var scene = document.getElementById('scene');
  var phone = document.getElementById('phone');
  var orbit = document.getElementById('orbit');
  var canvas = document.getElementById('screen');
  if (!stage || !canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');

  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lowPower = (navigator.hardwareConcurrency || 8) <= 4;

  var C = { orange: '#FF5A1F', pink: '#FF3D8B', amber: '#FFB23F', blue: '#6EA8FF', mint: '#4FE3C1' };
  var PALETTE = [C.orange, C.pink, C.amber, C.blue, C.mint];
  var MODE_COLOR = { feed: C.orange, network: C.pink, reel: C.amber, code: C.blue, doc: C.mint, chat: C.orange };

  /* ---------- build: body slices and orbiting icons ---------- */
  var front = phone.querySelector('.phone__face--front');
  var THICK = 18, SLICES = lowPower ? 6 : 10;
  for (var s = 0; s < SLICES; s++) {
    var slice = document.createElement('span');
    slice.className = 'phone__slice';
    slice.style.transform = 'translateZ(' + (-THICK / 2 + s * THICK / (SLICES - 1)).toFixed(2) + 'px)';
    phone.insertBefore(slice, front);
  }

  var ORBS = [
    ['heart', C.pink, 1], ['play', C.amber, 0], ['chat-circle-dots', C.blue, 0],
    ['megaphone', C.orange, 1], ['thumbs-up', C.mint, 0], ['user-plus', C.amber, 0],
    ['share-fat', C.pink, 0], ['bell', C.blue, 0], ['trend-up', C.mint, 1]
  ];
  if (lowPower) ORBS = ORBS.slice(0, 5);
  var orbs = ORBS.map(function (o, i) {
    var el = document.createElement('i');
    el.className = 'orb ph-fill ph-' + o[0] + (o[2] ? ' orb--lg' : '');
    el.style.setProperty('--c', o[1]);
    orbit.appendChild(el);
    return {
      el: el,
      a: i / ORBS.length * Math.PI * 2,
      r: 168 + (i % 3) * 30,
      y: ((i * 67) % 250) - 125,
      w: (0.26 + (i % 4) * 0.05) * (i % 2 ? 1 : -1),
      ph: i * 1.3
    };
  });

  /* ---------- where the phone stands for each section ---------- */
  var sections = [].slice.call(document.querySelectorAll('[data-phone]'));
  var hero = document.querySelector('.hero');
  var active = sections[0] || null;
  var activeIdx = 0;
  var state = 'hero';
  var mode = 'feed';
  var pendingMode = null;
  var modeAt = 0;
  var spin = 0;
  var px = 0, py = 0, bump = 0;
  var cur = { x: 0, y: 0, s: 0.8, o: 0, yaw: 0, rx: 0, ry: 0 };
  var snapNext = true;

  function target() {
    var vw = window.innerWidth, vh = window.innerHeight;
    var end = root.dir === 'rtl' ? -1 : 1;        // which way is the inline-end side
    var base = Math.min(1.12, Math.max(0.6, Math.min(vh / 820, vw < 1024 ? 2 : vw / 1180)));
    if (vw < 1024) {
      if (state === 'hero' && hero) {
        // the phone rises from the bottom edge to the middle as the hero scrolls past
        var r = hero.getBoundingClientRect();
        var p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
        return { x: 0, y: vh * (0.42 - 0.38 * p), s: base * (0.74 + 0.1 * p), o: 1, yaw: -12 * end };
      }
      return { x: end * vw * 0.34, y: vh * 0.1, s: base * 0.72, o: 0.14, yaw: -26 * end };
    }
    switch (state) {
      case 'hero': return { x: end * vw * 0.28, y: 6, s: base, o: 1, yaw: -18 * end };
      case 'end': return { x: end * vw * 0.28, y: 0, s: base * 0.94, o: 1, yaw: -18 * end };
      case 'start': return { x: -end * vw * 0.28, y: 0, s: base * 0.94, o: 1, yaw: 18 * end };
      default: return { x: end * vw * 0.45, y: vh * 0.08, s: base * 0.8, o: 0.16, yaw: -30 * end };
    }
  }

  function activate(sec, now) {
    if (sec === active) return;
    var idx = sections.indexOf(sec);
    var dir = idx > activeIdx ? 1 : -1;
    active = sec; activeIdx = idx;
    state = sec.dataset.phone || 'dim';
    var m = sec.dataset.mode || mode;
    if (m !== mode && m !== pendingMode) {
      spin += dir;                 // one full turn: the screen changes while the back is showing
      pendingMode = m;
      modeAt = now + 300;
    }
    stage.style.setProperty('--k', MODE_COLOR[m] || C.orange);
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) activate(en.target, performance.now()); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    sections.forEach(function (sec) { io.observe(sec); });
  }

  /* ---------- pointer: lean toward it, hearts on click ---------- */
  if (window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', function (e) {
      px = e.clientX / window.innerWidth * 2 - 1;
      py = e.clientY / window.innerHeight * 2 - 1;
    }, { passive: true });
  }

  function burst(x, y) {
    bump = 0.07;
    if (reduce || !document.body.animate) return;
    for (var i = 0; i < 12; i++) {
      var h = document.createElement('i');
      h.className = 'burst ph-fill ph-heart';
      h.style.left = x + 'px';
      h.style.top = y + 'px';
      h.style.color = PALETTE[i % 3];
      document.body.appendChild(h);
      var ang = Math.random() * Math.PI * 2;
      var dist = 70 + Math.random() * 150;
      var dx = Math.cos(ang) * dist;
      var dy = Math.sin(ang) * dist - 90;
      h.animate([
        { transform: 'translate(-50%,-50%) scale(.3)', opacity: 1 },
        { transform: 'translate(calc(-50% + ' + dx.toFixed(0) + 'px), calc(-50% + ' + dy.toFixed(0) + 'px)) scale(' + (0.9 + Math.random()).toFixed(2) + ') rotate(' + ((Math.random() - 0.5) * 80).toFixed(0) + 'deg)', opacity: 0 }
      ], { duration: 900 + Math.random() * 600, easing: 'cubic-bezier(.16,1,.3,1)' }).onfinish = (function (el) {
        return function () { el.remove(); };
      })(h);
    }
  }

  document.addEventListener('pointerdown', function (e) {
    if (cur.o < 0.5) return;
    if (e.target.closest && e.target.closest('a, button, input, textarea, label, summary')) return;
    var r = phone.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
    burst(e.clientX, e.clientY);
  });

  /* ---------- the screen: six small scenes drawn on a 360 x 780 canvas ---------- */
  var W = 360, H = 780;
  var NIGHT = '#0C0A12';

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function frac(x) { return x - Math.floor(x); }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function easeOut(p) { return 1 - Math.pow(1 - clamp01(p), 3); }
  function hash(i) { var v = Math.sin(i * 127.1 + 3.7) * 43758.5453; return v - Math.floor(v); }
  function box(x, y, w, h, r, fill) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
    ctx.fillStyle = fill; ctx.fill();
  }
  function bar(x, y, w, h, fill) { box(x, y, w, h, h / 2, fill); }
  function dot(x, y, r, fill) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, 6.2832); ctx.fillStyle = fill; ctx.fill(); }
  function ring(x, y, r, stroke, lw) { ctx.beginPath(); ctx.arc(x, y, Math.max(0, r), 0, 6.2832); ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  function sun(x0, y0, x1, y1) {
    var g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, C.amber); g.addColorStop(0.5, C.orange); g.addColorStop(1, C.pink);
    return g;
  }
  function heart(x, y, size, fill) {
    ctx.save(); ctx.translate(x, y); ctx.scale(size, size);
    ctx.beginPath(); ctx.moveTo(0, 7);
    ctx.bezierCurveTo(-15, -4, -8, -16, 0, -7);
    ctx.bezierCurveTo(8, -16, 15, -4, 0, 7);
    ctx.fillStyle = fill; ctx.fill(); ctx.restore();
  }
  function check(x, y, size, stroke) {
    ctx.beginPath(); ctx.moveTo(x - size, y); ctx.lineTo(x - size * 0.25, y + size * 0.7); ctx.lineTo(x + size, y - size * 0.7);
    ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
  }

  var SCREENS = {
    /* a profile that grows */
    feed: function (t) {
      ctx.fillStyle = NIGHT; ctx.fillRect(0, 0, W, H);
      dot(54, 104, 31, sun(23, 73, 85, 135)); dot(54, 104, 26, NIGHT); dot(54, 104, 22, sun(32, 82, 76, 126));
      bar(102, 86, 116, 13, '#F5F2F8'); bar(102, 110, 76, 9, '#6F6880');
      box(252, 84, 84, 36, 18, sun(252, 84, 336, 120)); bar(271, 98, 46, 8, '#1A0A03');

      box(24, 156, 312, 132, 18, '#15111F');
      bar(42, 174, 70, 9, '#6F6880');
      var prog = easeOut(frac(t / 7) * 1.25), n = 24, lx = 0, ly = 0;
      ctx.beginPath();
      for (var i = 0; i <= n; i++) {
        var u = i / n; if (u > prog) break;
        lx = 44 + u * 272; ly = 268 - (u * u * 66 + Math.sin(i * 1.3) * 5 + u * 8);
        if (i === 0) ctx.moveTo(lx, ly); else ctx.lineTo(lx, ly);
      }
      ctx.strokeStyle = sun(44, 0, 316, 0); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
      dot(lx, ly, 11, rgba(C.pink, 0.3)); dot(lx, ly, 5.5, '#fff');

      for (var k = 0; k < 9; k++) {
        var col = k % 3, row = (k / 3) | 0;
        var glow = Math.max(0, Math.sin(t * 1.2 - k * 0.7));
        box(24 + col * 106, 304 + row * 106, 100, 100, 14, rgba(PALETTE[k % 5], 0.22 + 0.5 * glow));
      }
      var cyc = t / 1.5, tile = ((cyc | 0) * 4) % 9, pp = frac(cyc);
      heart(24 + (tile % 3) * 106 + 50, 304 + ((tile / 3) | 0) * 106 + 54 - pp * 30, 1.9 * easeOut(pp * 3), rgba('#FFFFFF', 1 - pp));

      ctx.fillStyle = '#0F0D16'; ctx.fillRect(0, 716, W, 64);
      for (var b = 0; b < 5; b++) {
        if (b === 2) { dot(180, 748, 17, sun(163, 731, 197, 765)); bar(172, 746, 16, 4, '#1A0A03'); bar(178, 740, 4, 16, '#1A0A03'); }
        else dot(44 + b * 68, 748, 5, b === 0 ? '#F5F2F8' : '#5E5870');
      }
    },

    /* a brand in the middle, influencers around it, the message going out */
    network: function (t) {
      ctx.fillStyle = NIGHT; ctx.fillRect(0, 0, W, H);
      bar(24, 78, 150, 13, '#F5F2F8'); bar(24, 102, 92, 9, '#6F6880');
      var cx = 180, cy = 372, n = 7;
      for (var i = 0; i < n; i++) {
        var a = i / n * 6.2832 + t * 0.14;
        var rad = 112 + (i % 2) * 40;
        var nx = cx + Math.cos(a) * rad, ny = cy + Math.sin(a) * rad * 1.08;
        var col = PALETTE[(i + 1) % 5];
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(nx, ny);
        ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1.5; ctx.stroke();
        for (var f = 0; f < 3; f++) {
          var fa = a + (f - 1) * 0.75;
          var fx = nx + Math.cos(fa) * 34, fy = ny + Math.sin(fa) * 34;
          ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(fx, fy); ctx.strokeStyle = rgba(col, 0.3); ctx.lineWidth = 1; ctx.stroke();
          dot(fx, fy, 4.5, rgba(col, 0.6));
        }
        var p = frac(t * 0.42 + i * 0.37);
        dot(cx + (nx - cx) * p, cy + (ny - cy) * p, 4.5, '#fff');
        if (p > 0.8) ring(nx, ny, 20 + (p - 0.8) * 90, rgba(col, (1 - p) * 4), 2);
        dot(nx, ny, 19 + (i % 3) * 3, col); dot(nx, ny, 13 + (i % 3) * 3, NIGHT); dot(nx, ny, 7, col);
      }
      ring(cx, cy, 50 + Math.sin(t * 2) * 5, rgba(C.pink, 0.35), 2);
      dot(cx, cy, 40, sun(cx - 40, cy - 40, cx + 40, cy + 40)); dot(cx, cy, 15, '#fff');

      box(24, 610, 312, 104, 18, '#15111F');
      for (var b = 0; b < 7; b++) {
        var hgt = 14 + (b + 1) * 9 * easeOut(frac(t / 6) * 1.6 - b * 0.08);
        box(46 + b * 40, 696 - hgt, 24, hgt, 6, b === 6 ? sun(0, 696 - hgt, 0, 696) : rgba(C.pink, 0.3 + b * 0.08));
      }
    },

    /* a reel playing */
    reel: function (t) {
      var g = ctx.createLinearGradient(0, 0, W * 0.7, H);
      g.addColorStop(0, C.amber); g.addColorStop(0.5, C.orange); g.addColorStop(1, C.pink);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (var i = 0; i < 6; i++) {
        dot(180 + Math.sin(t * 0.4 + i * 2.1) * 150, 330 + Math.cos(t * 0.33 + i * 1.7) * 250, 50 + i * 16, 'rgba(255,255,255,.09)');
      }
      var v = ctx.createLinearGradient(0, 430, 0, H);
      v.addColorStop(0, 'rgba(8,6,13,0)'); v.addColorStop(1, 'rgba(8,6,13,.82)');
      ctx.fillStyle = v; ctx.fillRect(0, 430, W, H - 430);

      var pr = 50 + Math.sin(t * 2.2) * 3;
      dot(180, 340, pr, 'rgba(8,6,13,.32)'); ring(180, 340, pr, 'rgba(255,255,255,.85)', 2.5);
      ctx.beginPath(); ctx.moveTo(167, 318); ctx.lineTo(204, 340); ctx.lineTo(167, 362); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();

      var hp = frac(t / 2.4);
      dot(318, 486, 23, 'rgba(8,6,13,.35)'); heart(318, 488, 1.05 + 0.6 * Math.max(0, 1 - hp * 5), hp < 0.5 ? C.pink : '#fff');
      dot(318, 548, 23, 'rgba(8,6,13,.35)'); box(306, 539, 24, 16, 8, '#fff');
      dot(318, 610, 23, 'rgba(8,6,13,.35)');
      ctx.beginPath(); ctx.moveTo(308, 617); ctx.lineTo(329, 608); ctx.lineTo(310, 601); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();

      dot(42, 652, 17, '#fff'); bar(68, 645, 112, 11, '#fff');
      bar(24, 684, 226, 8, 'rgba(255,255,255,.68)'); bar(24, 702, 150, 8, 'rgba(255,255,255,.68)');
      bar(24, 742, 312, 5, 'rgba(255,255,255,.28)'); bar(24, 742, Math.max(5, 312 * frac(t / 8)), 5, '#fff');
    },

    /* code being written, then shipped */
    code: function (t) {
      ctx.fillStyle = '#090B12'; ctx.fillRect(0, 0, W, H);
      box(16, 66, 328, 566, 18, '#10131D');
      dot(40, 90, 5, C.pink); dot(58, 90, 5, C.amber); dot(76, 90, 5, C.mint);
      bar(110, 85, 92, 10, '#2A3044');
      var INDENT = [0, 1, 2, 2, 1, 1, 2, 3, 2, 1, 0, 0, 1, 2, 2, 1, 0];
      var COLS = [C.blue, C.mint, C.amber, C.pink, '#7C849C'];
      var cycle = frac(t / 10), typed = Math.min(1, cycle * 1.3) * 2600, used = 0, endX = 34, endY = 130, full = true;
      for (var i = 0; i < INDENT.length && full; i++) {
        var x = 34 + INDENT[i] * 20, y = 124 + i * 29, segs = 2 + ((hash(i) * 3) | 0);
        for (var s2 = 0; s2 < segs; s2++) {
          var w = 26 + hash(i * 7 + s2) * 64;
          if (x + w > 320) break;
          var left = typed - used;
          if (left <= 0) { full = false; break; }
          var dw = Math.min(w, left);
          bar(x, y, dw, 10, COLS[(i + s2 * 2) % 5]);
          used += w; endX = x + dw + 5; endY = y;
          if (dw < w) { full = false; break; }
          x += w + 9;
        }
      }
      if (!full && frac(t * 1.6) < 0.6) box(endX, endY - 3, 8, 16, 2, '#fff');

      var done = cycle > 0.78;
      box(16, 648, 328, 70, 18, '#10131D');
      dot(46, 683, 13, done ? C.mint : rgba(C.amber, 0.9));
      if (done) check(46, 683, 6, '#06140F');
      bar(72, 668, 110, 10, '#F5F2F8');
      bar(72, 690, 240, 7, '#232838'); bar(72, 690, Math.max(7, 240 * Math.min(1, cycle / 0.78)), 7, done ? C.mint : C.blue);
    },

    /* a thesis being put in order, chapter by chapter */
    doc: function (t) {
      ctx.fillStyle = NIGHT; ctx.fillRect(0, 0, W, H);
      box(22, 62, 316, 668, 16, '#F4F1EC');
      bar(52, 96, 176, 15, '#1B1724'); bar(52, 122, 110, 8, '#8C8798');
      var prog = frac(t / 11) * 5.2;
      for (var c = 0; c < 4; c++) {
        var y0 = 168 + c * 134, local = prog - c;
        bar(52, y0, 120 + hash(c) * 60, 12, '#1B1724');
        for (var l = 0; l < 4; l++) {
          var ly = y0 + 28 + l * 21, lw = 180 + hash(c * 5 + l) * 78;
          if (local > 0 && local < 1 && l < local * 4.6) box(48, ly - 5, Math.min(lw + 8, (local * 4.6 - l) * (lw + 8)), 18, 5, rgba(C.amber, 0.5));
          bar(52, ly, lw, 8, '#B9B4C2');
        }
        if (local >= 1) { dot(302, y0 + 6, 13, C.mint); check(302, y0 + 6, 6, '#06140F'); }
        else ring(302, y0 + 6, 12, '#CFCAD6', 2);
      }
      var done = clamp01(prog / 4);
      box(36, 168, 5, 520, 3, '#DDD8E2');
      if (done > 0) box(36, 168, 5, 520 * done, 3, C.mint);
    },

    /* a conversation on WhatsApp */
    chat: function (t) {
      ctx.fillStyle = NIGHT; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#13101B'; ctx.fillRect(0, 0, W, 118);
      dot(46, 84, 21, sun(25, 63, 67, 105)); bar(80, 72, 100, 12, '#F5F2F8'); bar(80, 93, 52, 7, C.mint);
      var MSG = [[1, 176, 2], [0, 206, 2], [1, 128, 1], [0, 158, 1], [1, 196, 2], [0, 120, 1]];
      var tt = (t % 12) / 1.5, y = 146;
      for (var i = 0; i < MSG.length; i++) {
        var m = MSG[i], age = tt - i, hgt = 30 + m[2] * 19;
        if (age < 0) break;
        var x = m[0] ? 20 : W - 20 - m[1];
        if (m[0] && age < 0.45) {
          box(20, y, 72, 40, 20, '#1E1A29');
          for (var d = 0; d < 3; d++) dot(42 + d * 14, y + 20 - Math.max(0, Math.sin(t * 9 - d * 0.9)) * 5, 4, '#8C8798');
          break;
        }
        var ap = easeOut((age - (m[0] ? 0.45 : 0)) * 4);
        ctx.globalAlpha = ap;
        box(x, y + (1 - ap) * 14, m[1], hgt, 20, m[0] ? '#1E1A29' : sun(x, y, x + m[1], y + hgt));
        for (var l = 0; l < m[2]; l++) {
          bar(x + 16, y + (1 - ap) * 14 + 17 + l * 19, (m[1] - 32) * (l === m[2] - 1 && m[2] > 1 ? 0.62 : 1), 8, m[0] ? '#CFC9DA' : 'rgba(26,10,3,.72)');
        }
        ctx.globalAlpha = 1;
        y += hgt + 14;
      }
      box(16, 700, 268, 50, 25, '#1A1724'); bar(38, 721, 120, 8, '#5E5870');
      dot(318, 725, 25, sun(293, 700, 343, 750));
      ctx.beginPath(); ctx.moveTo(310, 714); ctx.lineTo(330, 725); ctx.lineTo(310, 736); ctx.closePath(); ctx.fillStyle = '#1A0A03'; ctx.fill();
    }
  };

  function draw(t) {
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    (SCREENS[mode] || SCREENS.feed)(t);
  }

  /* ---------- the loop ---------- */
  var raf = 0, lastDraw = 0;
  var FRAME_MS = lowPower ? 50 : 33;

  function place(now) {
    var t = now / 1000;
    var tg = target();
    var k = snapNext ? 1 : 0.085;
    cur.x += (tg.x - cur.x) * k;
    cur.y += (tg.y - cur.y) * k;
    cur.s += (tg.s - cur.s) * k;
    cur.o += (tg.o - cur.o) * (snapNext ? 1 : 0.07);
    cur.yaw += (tg.yaw + spin * 360 - cur.yaw) * (snapNext ? 1 : 0.07);
    cur.rx += (-py * 7 - cur.rx) * 0.06;
    cur.ry += (px * 10 - cur.ry) * 0.06;
    snapNext = false;
    bump *= 0.9;

    var fy = reduce ? 0 : Math.sin(t * 1.1) * 8;
    scene.style.transform = 'translate3d(' + cur.x.toFixed(1) + 'px,' + (cur.y + fy).toFixed(1) + 'px,0) scale(' + (cur.s * (1 + bump)).toFixed(4) + ')';
    phone.style.transform = 'rotateX(' + cur.rx.toFixed(2) + 'deg) rotateY(' + (cur.yaw + cur.ry).toFixed(2) + 'deg) rotateZ(' + (reduce ? 0 : Math.sin(t * 0.7) * 1.5).toFixed(2) + 'deg)';
    stage.style.opacity = cur.o.toFixed(3);

    for (var i = 0; i < orbs.length; i++) {
      var o = orbs[i], a = o.a + (reduce ? 0 : t * o.w);
      o.el.style.transform = 'translate3d(' + (Math.cos(a) * o.r).toFixed(1) + 'px,' + (o.y + Math.sin(a + o.ph) * 44).toFixed(1) + 'px,' + (Math.sin(a) * o.r).toFixed(1) + 'px)';
    }

    if (pendingMode && now >= modeAt) { mode = pendingMode; pendingMode = null; lastDraw = 0; }
    if (cur.o > 0.2 && now - lastDraw >= FRAME_MS) { draw(reduce ? 3.2 : t); lastDraw = now; }
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    place(now);
  }
  function start() {
    if (raf) return;
    if (reduce) {
      // no motion: place it and redraw only when the section changes
      setInterval(function () { snapNext = true; place(performance.now()); }, 400);
      place(performance.now());
      raf = -1;
      return;
    }
    raf = requestAnimationFrame(frame);
  }
  function stop() { if (raf > 0) cancelAnimationFrame(raf); raf = 0; }

  document.addEventListener('visibilitychange', function () {
    if (reduce) return;
    if (document.hidden) stop(); else start();
  });
  window.addEventListener('vz:lang', function () { snapNext = true; });

  stage.style.setProperty('--k', MODE_COLOR.feed);
  start();

  // for checks from the console: jump straight to the resting position
  window.__vz = { snap: function () { snapNext = true; if (pendingMode) { mode = pendingMode; pendingMode = null; } place(performance.now()); return { state: state, mode: mode, cur: cur }; } };
})();
