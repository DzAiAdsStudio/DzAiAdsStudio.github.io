/* Viz Zora: intro, language switch, menu, reveals, pointer effects, marquee, quote form. No dependencies. */
(function () {
  'use strict';

  /* ---------- to fill in with the client's details ---------- */
  var CONFIG = {
    whatsapp: '',   // international format, digits only, e.g. "213550000000"
    instagram: '',  // full profile URL, e.g. "https://instagram.com/vizzora"
    facebook: '',   // full page URL, e.g. "https://facebook.com/vizzora"
    tiktok: '',     // full profile URL, e.g. "https://tiktok.com/@vizzora"
    phone: '',      // shown as a call link, e.g. "+213 550 00 00 00"
    email: ''       // contact address
  };

  var STR = {
    ar: {
      title: 'Viz Zora · وكالة اتصال وحلول رقمية',
      desc: 'Viz Zora وكالة اتصال جزائرية: تسيير صفحات الماركات، حملات المؤثرين، فيديوهات احترافية، حلول رقمية ومرافقة أكاديمية.',
      hello: 'السلام عليكم، أنا ',
      need: 'أحتاج: ',
      sent: 'فتحنا واتساب في نافذة جديدة. إن لم تُفتح، ',
      sentLink: 'اضغطوا هنا',
      listSep: '، '
    },
    fr: {
      title: 'Viz Zora · Boîte de communication et solutions digitales',
      desc: 'Viz Zora, boîte de communication algérienne : gestion de pages, campagnes d\'influence, vidéos professionnelles, solutions digitales et accompagnement académique.',
      hello: 'Bonjour, je suis ',
      need: 'J\'ai besoin de : ',
      sent: 'WhatsApp s\'est ouvert dans une nouvelle fenêtre. Sinon, ',
      sentLink: 'cliquez ici',
      listSep: ', '
    }
  };

  var html = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  function all(sel, root) { return [].slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- intro ---------- */
  var loader = document.getElementById('loader');
  function pageReady() {
    html.classList.remove('is-loading');
    html.classList.add('is-ready');
  }
  if (loader && html.classList.contains('is-loading')) {
    var t0 = performance.now();
    var fonts = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    var cap = new Promise(function (res) { setTimeout(res, 2000); });
    Promise.race([fonts, cap]).then(function () {
      setTimeout(function () {
        loader.classList.add('is-out');
        pageReady();
        try { sessionStorage.setItem('vz-intro', '1'); } catch (e) {}
        setTimeout(function () { loader.remove(); }, 800);
      }, Math.max(0, 1100 - (performance.now() - t0)));
    });
  } else {
    if (loader) loader.remove();
    pageReady();
  }

  /* ---------- marquee: clone the group so the loop has no seam ---------- */
  var track = document.querySelector('.marquee__track');
  if (track && !reduceMotion) {
    var clone = track.firstElementChild.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
    track.classList.add('is-live');
  }

  /* ---------- language (Arabic lives in the markup, French in data-fr) ---------- */
  var textEls = all('[data-fr]');
  var ariaEls = all('[data-fr-aria-label]');
  var splitEls = all('[data-split]');
  textEls.forEach(function (el) { el.dataset.ar = el.textContent.trim(); });
  ariaEls.forEach(function (el) { el.dataset.arAriaLabel = el.getAttribute('aria-label'); });

  // headings: every word in its own mask, so it can rise into place
  function split(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach(function (word, i) {
      var mask = document.createElement('span');
      var inner = document.createElement('span');
      mask.className = 'w';
      inner.className = 'w__in';
      inner.style.setProperty('--wi', i);
      inner.textContent = word;
      mask.appendChild(inner);
      el.appendChild(mask);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  }

  var langBtns = all('.lang__btn');
  var metaDesc = document.querySelector('meta[name="description"]');
  var current = 'ar';

  function setLang(lang, save) {
    current = lang === 'fr' ? 'fr' : 'ar';
    html.lang = current;
    html.dir = current === 'ar' ? 'rtl' : 'ltr';
    textEls.forEach(function (el) { el.textContent = el.dataset[current]; });
    splitEls.forEach(split);
    ariaEls.forEach(function (el) {
      el.setAttribute('aria-label', current === 'fr' ? el.dataset.frAriaLabel : el.dataset.arAriaLabel);
    });
    langBtns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === current)); });
    document.title = STR[current].title;
    if (metaDesc) metaDesc.setAttribute('content', STR[current].desc);
    if (save) { try { localStorage.setItem('vz-lang', current); } catch (e) {} }
    window.dispatchEvent(new Event('vz:lang'));
  }

  langBtns.forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.dataset.lang, true); });
  });
  if (html.lang === 'fr') setLang('fr', false);
  else splitEls.forEach(split);

  /* ---------- phone menu ---------- */
  var nav = document.getElementById('nav');
  var menuBtn = document.querySelector('.menu-btn');
  function closeMenu() {
    nav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.firstElementChild.className = 'ph ph-list';
  }
  if (nav && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.firstElementChild.className = open ? 'ph ph-x' : 'ph ph-list';
    });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- scroll: reveals and the active nav link (IntersectionObserver, no scroll listener) ---------- */
  var reveals = all('.reveal').concat(splitEls);
  if (!('IntersectionObserver' in window) || reduceMotion) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var once = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); once.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { once.observe(el); });

    var navLinks = all('.nav a');
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    all('main section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ---------- pointer: a light that follows the cursor on panels, buttons that lean toward it ---------- */
  if (finePointer && !reduceMotion) {
    document.addEventListener('pointermove', function (e) {
      var el = e.target.closest && e.target.closest('.panel');
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    }, { passive: true });

    all('.btn').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        b.style.translate = (dx * 0.16).toFixed(1) + 'px ' + (dy * 0.28).toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', function () { b.style.translate = ''; });
    });
  }

  /* ---------- contact links from CONFIG ---------- */
  function waUrl(text) {
    var base = 'https://wa.me/' + String(CONFIG.whatsapp).replace(/\D/g, '');
    return text ? base + '?text=' + encodeURIComponent(text) : base;
  }
  var hrefs = {
    whatsapp: CONFIG.whatsapp ? waUrl('') : '',
    instagram: CONFIG.instagram,
    facebook: CONFIG.facebook,
    tiktok: CONFIG.tiktok,
    phone: CONFIG.phone ? 'tel:' + String(CONFIG.phone).replace(/[^\d+]/g, '') : '',
    email: CONFIG.email ? 'mailto:' + CONFIG.email : ''
  };
  all('[data-contact]').forEach(function (a) {
    var href = hrefs[a.dataset.contact];
    if (!href) return;
    a.href = href;
    a.parentElement.hidden = false;
    if (a.dataset.contact === 'phone') { var v = a.querySelector('[data-value]'); if (v) v.textContent = CONFIG.phone; }
    if (a.dataset.contact === 'email') { var e = a.querySelector('[data-value]'); if (e) e.textContent = CONFIG.email; }
  });
  all('.socials').forEach(function (ul) {
    if (ul.querySelector('li:not([hidden])')) ul.hidden = false;
  });

  /* ---------- quote form: builds a WhatsApp message ---------- */
  var form = document.getElementById('quote');
  if (form) {
    var nameInput = form.elements.name;
    var nameErr = document.getElementById('f-name-err');
    var status = form.querySelector('.form__status');

    var clearNameError = function () {
      nameInput.removeAttribute('aria-invalid');
      nameErr.hidden = true;
    };
    nameInput.addEventListener('input', clearNameError);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = STR[current];
      var name = nameInput.value.trim();
      if (!name) {
        nameInput.setAttribute('aria-invalid', 'true');
        nameErr.hidden = false;
        nameInput.focus();
        return;
      }
      clearNameError();

      var brand = form.elements.brand.value.trim();
      var message = form.elements.message.value.trim();
      var needs = all('input[name="need"]:checked', form)
        .map(function (i) { return i.nextElementSibling.textContent.trim(); });

      var lines = [s.hello + name + (brand ? ' (' + brand + ')' : '') + '.'];
      if (needs.length) lines.push(s.need + needs.join(s.listSep) + '.');
      if (message) lines.push(message);

      var url = waUrl(lines.join('\n'));
      window.open(url, '_blank', 'noopener');

      status.textContent = s.sent;
      var link = document.createElement('a');
      link.href = url; link.target = '_blank'; link.rel = 'noopener';
      link.textContent = s.sentLink;
      status.appendChild(link);
      status.appendChild(document.createTextNode('.'));
      status.hidden = false;
    });
  }

  /* ---------- footer year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
