/**
 * Paivapo Institution — Main JavaScript
 * Lightweight, no dependencies
 */

(function () {
  'use strict';

  /* ---- Mobile Navigation ---- */
  function initNav() {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('.nav');
    if (!hamburger || !nav) return;

    hamburger.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('is-open');
      hamburger.classList.toggle('is-active');
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // Close on link click
    nav.querySelectorAll('.nav__link').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('is-open');
        hamburger.classList.remove('is-active');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---- Gooey navbar (desktop) ----
     Vanilla port of the "gooey navbar" pattern: every tab is a black pill in one
     SVG path; the active and hovered tabs push their neighbours apart and a
     tangent-arc "neck" bridges the gap. Built from the existing .nav__list links
     so the mobile menu keeps working untouched. */
  function initGooeyNav() {
    var header = document.querySelector('.header');
    var inner = header && header.querySelector('.header__inner');
    var list = inner && inner.querySelector('.nav__list');
    if (!list) return;
    var allLinks = Array.prototype.slice.call(list.querySelectorAll('a.nav__link'));
    if (allLinks.length < 2) return;

    var small = window.innerWidth < 600;
    // On phones the "Paivapo" pill is dropped: panels close with the x or by tapping outside
    var srcLinks = small ? allLinks.filter(function (a) { return /#/.test(a.getAttribute('href') || ''); }) : allLinks;
    if (srcLinks.length < 2) srcLinks = allLinks;

    var GAP = 0, NECK_RATIO = 0.35, STIFF = 260, DAMP = 30, MASS = 1;
    var FONT_SIZE = small ? 13 : 14, PAD_X = small ? 12 : 18, PAD_Y = small ? 10 : 11, PUSH = small ? 18 : 28;
    var pillH = FONT_SIZE + PAD_Y * 2;
    var radius = Math.min(10, pillH / 2);

    var root = document.createElement('div');
    root.className = 'gnav';
    var svgNS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'gnav__svg');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var path = document.createElementNS(svgNS, 'path');
    path.setAttribute('fill', '#F4F1EA');
    path.setAttribute('fill-rule', 'nonzero');
    svg.appendChild(path);
    var navEl = document.createElement('nav');
    navEl.className = 'gnav__links';
    navEl.setAttribute('aria-label', 'Main navigation');
    root.appendChild(svg);
    root.appendChild(navEl);

    var activeIndex = srcLinks.findIndex(function (a) { return a.classList.contains('nav__link--active'); });
    var hoveredIndex = null;
    var links = srcLinks.map(function (a, i) {
      var el = document.createElement('a');
      el.className = 'gnav__link';
      el.href = a.getAttribute('href');
      el.textContent = a.textContent.trim();
      if (i === activeIndex) el.setAttribute('aria-current', 'page');
      el.addEventListener('mouseenter', function () { setHover(i); });
      el.addEventListener('click', function (e) {
        // On the canvas page, nav items open panels instead of navigating
        var detail = { index: i, href: el.getAttribute('href'), link: el, defaultPrevented: false };
        var ev = new CustomEvent('paivapo:nav', { detail: detail, cancelable: true });
        if (!document.dispatchEvent(ev)) e.preventDefault();
      });
      navEl.appendChild(el);
      return el;
    });

    inner.appendChild(root);
    header.classList.add('has-gnav');

    function setActive(i) {
      activeIndex = i;
      links.forEach(function (el, k) {
        if (k === i) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current');
      });
      kick();
    }

    // Mark the pill for an open panel (id) or, with null, the home pill if there is one
    function setActivePanel(id) {
      var idx = links.findIndex(function (el) {
        var href = el.getAttribute('href') || '';
        return id ? href.slice(-(id.length + 1)) === '#' + id : href.indexOf('#') === -1;
      });
      setActive(idx);
    }

    var measureCanvas = document.createElement('canvas');
    function labelWidth(text) {
      var ctx = measureCanvas.getContext('2d');
      if (!ctx) return text.length * FONT_SIZE * 0.78;
      ctx.font = '500 ' + FONT_SIZE + 'px ' + (getComputedStyle(navEl).fontFamily || 'system-ui, sans-serif');
      return ctx.measureText(text).width;
    }

    var base = [];         // rest rects
    var push = [];         // spring position per gap
    var vel = [];          // spring velocity per gap
    var targets = [];
    var animId = null;

    function layout() {
      var x = 0;
      base = links.map(function (el) {
        var w = Math.ceil(labelWidth(el.textContent) + PAD_X * 2);
        var r = { x: x, y: 0, width: w, height: pillH };
        el.style.width = w + 'px';
        el.style.height = pillH + 'px';
        x += w + GAP;
        return r;
      });
      var total = x - GAP;
      root.style.width = total + 'px';
      root.style.height = pillH + 'px';
      if (push.length !== base.length - 1) {
        push = base.slice(0, -1).map(function (_, i) { return (i === activeIndex || i + 1 === activeIndex) ? 1 : 0; });
        vel = push.map(function () { return 0; });
      }
      computeTargets();
      render(push);
    }

    function computeTargets() {
      function isT(i) { return i === hoveredIndex || i === activeIndex; }
      targets = base.slice(0, -1).map(function (_, i) { return (isT(i) || isT(i + 1)) ? 1 : 0; });
    }

    function num(n) { return (Math.round(n * 100) / 100).toString(); }

    function pillPath(r) {
      var rc = Math.min(radius, r.width / 2, r.height / 2);
      var x = r.x, y = r.y, w = r.width, h = r.height;
      return 'M' + num(x) + ' ' + num(y + rc) +
        ' A' + num(rc) + ' ' + num(rc) + ' 0 0 1 ' + num(x + rc) + ' ' + num(y) +
        ' L' + num(x + w - rc) + ' ' + num(y) +
        ' A' + num(rc) + ' ' + num(rc) + ' 0 0 1 ' + num(x + w) + ' ' + num(y + rc) +
        ' L' + num(x + w) + ' ' + num(y + h - rc) +
        ' A' + num(rc) + ' ' + num(rc) + ' 0 0 1 ' + num(x + w - rc) + ' ' + num(y + h) +
        ' L' + num(x + rc) + ' ' + num(y + h) +
        ' A' + num(rc) + ' ' + num(rc) + ' 0 0 1 ' + num(x) + ' ' + num(y + h - rc) + ' Z';
    }

    // Tangent-arc bridge between two neighbouring pills, scaled by the push factor
    function bridgePath(e, t, neck, factor) {
      if (factor <= 0.02) return null;
      var a = e.height, o = e.y + a / 2;
      var s = Math.min(radius, a / 2, e.width / 2, t.width / 2);
      if (s <= 0) return null;
      var c = e.x + e.width, l = t.x, u = l - c;
      if (u < 0) return null;
      var d = Math.min((neck / 2) * factor, a / 2 - 0.5);
      var f = u / 2 + s, p = d - a / 2 + s, m = 2 * (p - s);
      if (Math.abs(m) < 1e-4) return null;
      var h = (s * s - f * f - p * p) / m;
      if (!(h > 0) || s + h < f) return null;
      var g = Math.sqrt(Math.max(0, (s + h) * (s + h) - f * f));
      var mid = (c + l) / 2, v = c - s, y = e.y + s;
      var ee = mid - v, b = e.y + s - g - y, hyp = Math.hypot(ee, b) || 1;
      var te = v + (s * ee) / hyp, S = y + (s * b) / hyp, C = 2 * mid - te;
      return 'M' + num(te) + ' ' + num(S) +
        ' A' + num(h) + ' ' + num(h) + ' 0 0 0 ' + num(C) + ' ' + num(S) +
        ' L' + num(C) + ' ' + num(2 * o - S) +
        ' A' + num(h) + ' ' + num(h) + ' 0 0 0 ' + num(te) + ' ' + num(2 * o - S) + ' Z';
    }

    function render(factors) {
      var n = base.length;
      if (!n) return;
      var pos = new Array(n);
      pos[0] = base[0].x;
      for (var i = 1; i < n; i++) pos[i] = pos[i - 1] + base[i - 1].width + GAP + PUSH * (factors[i - 1] || 0);
      var last = n - 1;
      var expansion = pos[last] + base[last].width - pos[0] - (base[last].x + base[last].width - base[0].x);
      var offset = -expansion / 2; // anchored to the centre
      var rects = base.map(function (r, i) {
        var tx = pos[i] + offset - r.x;
        links[i].style.transform = 'translateX(' + tx.toFixed(2) + 'px)';
        return { x: r.x + tx, y: r.y, width: r.width, height: r.height };
      });
      var d = rects.map(pillPath);
      for (var j = 0; j < n - 1; j++) {
        var br = bridgePath(rects[j], rects[j + 1], pillH * NECK_RATIO, factors[j] || 0);
        if (br) d.push(br);
      }
      path.setAttribute('d', d.join(' '));
    }

    var lastT = 0;
    function step(now) {
      var dt = Math.min((now - lastT) / 1000, 1 / 30);
      lastT = now;
      var moving = false;
      for (var i = 0; i < targets.length; i++) {
        var tgt = targets[i], p = push[i], v = vel[i] || 0;
        var force = -STIFF * (p - tgt) - DAMP * v;
        var nv = v + (force / MASS) * dt;
        var np = p + nv * dt;
        if (Math.abs(np - tgt) > 0.001 || Math.abs(nv) > 0.01) { push[i] = np; vel[i] = nv; moving = true; }
        else { push[i] = tgt; vel[i] = 0; }
      }
      render(push);
      animId = moving ? requestAnimationFrame(step) : null;
    }

    function kick() {
      computeTargets();
      if (animId) return;
      lastT = performance.now();
      animId = requestAnimationFrame(step);
    }

    function setHover(i) {
      if (hoveredIndex === i) return;
      hoveredIndex = i;
      links.forEach(function (el, k) { el.classList.toggle('is-hovered', k === i); });
      kick();
    }

    root.addEventListener('mousemove', function (e) {
      var rect = root.getBoundingClientRect();
      var x = e.clientX - rect.left, best = null, min = Infinity;
      links.forEach(function (el, i) {
        var r = el.getBoundingClientRect();
        var lx = r.left - rect.left, rx = lx + r.width;
        var dist = x < lx ? lx - x : x > rx ? x - rx : 0;
        if (dist < min) { min = dist; best = i; }
      });
      setHover(best);
    });
    root.addEventListener('mouseleave', function () { setHover(null); });

    // Rebuild when labels change language
    document.addEventListener('paivapo:langchange', function () {
      links.forEach(function (el, i) { el.textContent = srcLinks[i].textContent.trim(); });
      layout();
    });

    var resizeTimer = null;
    var onResize = function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if ((window.innerWidth < 600) !== small) {
          // Crossed the phone breakpoint: rebuild with the other pill set and sizes
          window.removeEventListener('resize', onResize);
          root.remove();
          header.classList.remove('has-gnav');
          var open = window.PaivapoNav && window.PaivapoNav.openPanel ? window.PaivapoNav.openPanel() : null;
          initGooeyNav();
          if (open && window.PaivapoNav) window.PaivapoNav.setActivePanel(open);
        } else {
          layout();
        }
      }, 120);
    };
    window.addEventListener('resize', onResize);

    layout();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

    var prev = window.PaivapoNav || {};
    window.PaivapoNav = { setActive: setActive, setActivePanel: setActivePanel, links: links, openPanel: prev.openPanel };
  }

  /* ---- Nav panels on the canvas page ----
     About, Visit, Support and Contact open as a side panel over the books.
     Content comes from the same JSON the full pages use, kept to essentials. */
  function initPanels() {
    var panel = document.getElementById('panel');
    var body = document.getElementById('panel-body');
    var scrim = document.getElementById('panel-scrim');
    var closeBtn = document.getElementById('panel-close');
    if (!panel || !body || !scrim) return;

    var PANELS = ['about', 'visit', 'support', 'contact'];
    var data = null;
    var openId = null;
    var lastFocus = null;

    async function loadAll() {
      if (data) return data;
      var r = await Promise.all([
        loadJSON('data/settings.json'), loadJSON('data/pages/about.json'), loadJSON('data/pages/visit.json'),
        loadJSON('data/pages/donate.json'), loadJSON('data/pages/contact.json'), loadJSON('data/team.json'),
        loadJSON('data/partners.json'), loadJSON('data/books.json')
      ]);
      data = { settings: r[0] || {}, about: r[1] || {}, visit: r[2] || {}, donate: r[3] || {}, contact: r[4] || {},
               team: r[5] || [], partners: r[6] || [], books: r[7] || [] };
      return data;
    }

    function fact(label, html, wide) {
      if (!html) return '';
      return '<div class="panel__fact' + (wide ? ' panel__fact--wide' : '') + '"><div class="panel__label">' + escapeHTML(label) + '</div><div class="panel__value">' + html + '</div></div>';
    }
    function note(text) {
      return text ? '<small>' + escapeHTML(text) + '</small>' : '';
    }
    function externalUrl(u) {
      if (!u) return '';
      return /^https?:/.test(u) ? u : 'https://' + u;
    }

    var KICKER = { about: 'About', visit: 'Visit', support: 'Support', contact: 'Contact' };

    function render(id, d) {
      var s = d.settings;
      if (id === 'about') {
        var count = visibleBooks(d.books).length;
        var partners = d.partners.map(function (p) {
          var url = externalUrl(p.url);
          return '<li>' + (url ? '<a href="' + escapeHTML(url) + '" target="_blank" rel="noopener">' + escapeHTML(p.name) + '</a>' : '<span>' + escapeHTML(p.name) + '</span>') + '</li>';
        }).join('');
        return '<h2 class="panel__title" id="panel-title">About</h2>' +
          '<p class="panel__lead">' + escapeHTML(s.mission || '') + '</p>' +
          '<div class="panel__facts">' +
            fact('Founder', escapeHTML(s.founder || '')) +
            fact('Where', escapeHTML(s.location || '')) +
            fact('Collection', count + ' titles, across art, ecology and literature', true) +
          '</div>' +
          (partners ? '<div class="panel__section"><div class="panel__label">Partners</div><ul class="panel__list">' + partners + '</ul></div>' : '') +
          '<div class="panel__cta"><a class="btn btn--outline" href="about.html">Full story</a></div>';
      }
      if (id === 'visit') {
        var lat = parseFloat(s.map_lat), lng = parseFloat(s.map_lng);
        var map = '';
        if (!isNaN(lat) && !isNaN(lng)) {
          var box = (lng - 0.11).toFixed(3) + '%2C' + (lat - 0.07).toFixed(3) + '%2C' + (lng + 0.11).toFixed(3) + '%2C' + (lat + 0.07).toFixed(3);
          map = '<div class="panel__map"><iframe src="https://www.openstreetmap.org/export/embed.html?bbox=' + box + '&layer=mapnik&marker=' + lat + '%2C' + lng + '" title="Map of ' + escapeHTML(s.location || 'the library') + '" loading="lazy"></iframe></div>';
        }
        return '<h2 class="panel__title" id="panel-title">Visit</h2>' +
          map +
          '<div class="panel__facts">' +
            fact('Hours', escapeHTML(s.opening_hours || d.visit.hours_text || '') + note(d.visit.hours_note)) +
            fact('Address', (d.visit.address_text || escapeHTML(s.location || '')) + note(d.visit.address_note)) +
          '</div>' +
          '<div class="panel__cta"><a class="btn btn--outline" href="visit.html">Visit page</a></div>';
      }
      if (id === 'support') {
        var email = s.email || 'hello@paivapo.org';
        return '<h2 class="panel__title" id="panel-title">Support</h2>' +
          '<p class="panel__lead">' + escapeHTML(d.donate.description || '') + '</p>' +
          '<div class="panel__actions">' +
            '<a class="panel__action" href="wishlist.html">' +
              '<span class="panel__action-title">Give a book</span>' +
              '<span class="panel__action-arrow" aria-hidden="true">&rarr;</span>' +
              '<span class="panel__action-sub">From our list, shipped to Masvingo</span>' +
            '</a>' +
            '<a class="panel__action" href="mailto:' + escapeHTML(email) + '?subject=Donation%20to%20Paivapo">' +
              '<span class="panel__action-title">Give money</span>' +
              '<span class="panel__action-arrow" aria-hidden="true">&rarr;</span>' +
              '<span class="panel__action-sub">By email, for now</span>' +
            '</a>' +
          '</div>' +
          (s.charity_note ? '<p class="panel__note">' + escapeHTML(s.charity_note) + '</p>' : '');
      }
      if (id === 'contact') {
        var mail = d.contact.info_email || s.email || 'hello@paivapo.org';
        var socials = (d.contact.info_social_links || []).map(function (l) {
          return '<a class="btn btn--outline" href="' + escapeHTML(externalUrl(l.url)) + '" target="_blank" rel="noopener">' + escapeHTML(l.label) + '</a>';
        }).join('');
        return '<h2 class="panel__title" id="panel-title">Contact</h2>' +
          '<a class="panel__email" href="mailto:' + escapeHTML(mail) + '">' + escapeHTML(mail) + '</a>' +
          (socials ? '<div class="panel__buttons">' + socials + '</div>' : '') +
          '<div class="panel__facts">' +
            fact(d.contact.info_zimbabwe_title || 'Zimbabwe', d.contact.info_zimbabwe_text || '') +
            fact(d.contact.info_london_title || 'London', d.contact.info_london_text || '') +
          '</div>';
      }
      return '';
    }

    async function open(id, fromHistory) {
      if (PANELS.indexOf(id) === -1) return;
      var d = await loadAll();
      body.innerHTML = render(id, d);
      var kicker = document.getElementById('panel-kicker');
      if (kicker) kicker.textContent = KICKER[id] || '';
      body.scrollTop = 0;
      if (!openId) lastFocus = document.activeElement;
      openId = id;
      panel.hidden = false;
      scrim.hidden = false;
      requestAnimationFrame(function () { panel.classList.add('is-open'); });
      panel.setAttribute('data-panel', id);
      if (closeBtn) closeBtn.focus();
      if (window.PaivapoNav) window.PaivapoNav.setActivePanel(id);
      if (!fromHistory && location.hash !== '#' + id) history.pushState({ panel: id }, '', '#' + id);
    }

    function close(fromHistory) {
      if (!openId) return;
      openId = null;
      panel.classList.remove('is-open');
      scrim.hidden = true;
      var done = function () { if (!openId) { panel.hidden = true; panel.removeAttribute('data-panel'); } };
      panel.addEventListener('transitionend', done, { once: true });
      setTimeout(done, 450);
      if (window.PaivapoNav) window.PaivapoNav.setActivePanel(null);
      if (!fromHistory && location.hash) history.pushState(null, '', location.pathname + location.search);
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
      lastFocus = null;
    }

    function hashId(href) {
      var m = /#([a-z]+)$/.exec(href || '');
      return m ? m[1] : null;
    }

    // Nav clicks: hash links open panels, the Paivapo pill closes them
    document.addEventListener('paivapo:nav', function (e) {
      var id = hashId(e.detail.href);
      if (id && PANELS.indexOf(id) !== -1) { e.preventDefault(); if (openId === id) close(); else open(id); return; }
      if (/(^|\/)index\.html$/.test(e.detail.href) || e.detail.href === './' || e.detail.href === '/') { e.preventDefault(); close(); }
    });

    if (closeBtn) closeBtn.addEventListener('click', function () { close(); });
    scrim.addEventListener('click', function () { close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && openId) close();
    });
    window.addEventListener('popstate', function () {
      var id = hashId(location.hash);
      if (id && PANELS.indexOf(id) !== -1) open(id, true); else close(true);
    });

    // Let the nav ask which panel is open (it rebuilds itself across the phone breakpoint)
    window.PaivapoNav = window.PaivapoNav || {};
    window.PaivapoNav.openPanel = function () { return openId; };

    // Deep link: index.html#visit opens the Visit panel
    var initial = hashId(location.hash);
    if (initial && PANELS.indexOf(initial) !== -1) open(initial, true);
  }

  /* ---- Yellow dot cursor (mouse devices only) ---- */
  function initCursorDot() {
    if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var dot = document.createElement('div');
    dot.className = 'cursor-dot';
    dot.setAttribute('aria-hidden', 'true');
    document.body.appendChild(dot);
    document.body.classList.add('has-cursor-dot');

    var x = -100, y = -100, raf = null;
    function paint() {
      raf = null;
      dot.style.transform = 'translate3d(' + x + 'px, ' + y + 'px, 0) translate(-50%, -50%)';
    }
    var interactive = 'a, button, [role="button"], input, select, textarea, label, .canvas-card, .catalog-list__item';
    document.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      x = e.clientX; y = e.clientY;
      dot.classList.add('is-visible');
      var over = e.target && e.target.closest ? e.target.closest(interactive) : null;
      dot.classList.toggle('is-link', !!over);
      if (!raf) raf = requestAnimationFrame(paint);
    }, { passive: true });
    document.addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse') dot.classList.add('is-pressed'); });
    document.addEventListener('pointerup', function () { dot.classList.remove('is-pressed'); });
    document.addEventListener('mouseleave', function () { dot.classList.remove('is-visible'); });
    document.documentElement.addEventListener('mouseleave', function () { dot.classList.remove('is-visible'); });
    document.documentElement.addEventListener('mouseenter', function () { dot.classList.add('is-visible'); });
  }

  /* ---- Language Toggle ---- */
  function initLangToggle() {
    const btn = document.querySelector('.lang-toggle');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const current = getCurrentLang();
      const next = current === 'en' ? 'sn' : 'en';
      setLang(next);
    });
  }

  /* ---- Lazy Load Images ---- */
  function initLazyLoad() {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '200px' });

      document.querySelectorAll('img[data-src]').forEach(img => {
        observer.observe(img);
      });
    } else {
      // Fallback: load all images immediately
      document.querySelectorAll('img[data-src]').forEach(img => {
        img.src = img.dataset.src;
      });
    }
  }

  /* ---- Hide Loader ---- */
  function hideLoader(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('is-hidden');
  }

  /* ---- Load JSON Data ---- */
  async function loadJSON(path) {
    try {
      var url = path + '?v=' + Date.now();
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load ' + path);
      return await res.json();
    } catch (e) {
      console.warn('Could not load', path, e);
      return null;
    }
  }

  /* ---- Book helpers ---- */
  function escapeHTML(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function hasCover(book) {
    var url = book.cover_url || '';
    return url && url.indexOf('placeholder.svg') === -1;
  }

  // Books without a cover image get a typographic tile instead of a grey box.
  function coverHTML(book, opts) {
    opts = opts || {};
    if (hasCover(book)) {
      var srcAttr = opts.lazy ? 'data-src' : 'src';
      return '<img ' + srcAttr + '="' + escapeHTML(book.cover_url) + '" alt="Cover of ' + escapeHTML(book.title) + '" loading="lazy">';
    }
    var alt = (parseInt(book.id, 10) || 0) % 2 === 1 ? ' cover-fallback--alt' : '';
    return '<div class="cover-fallback' + alt + '" role="img" aria-label="' + escapeHTML(book.title) + '">' +
      '<span class="cover-fallback__title">' + escapeHTML(book.title) + '</span>' +
      '<span class="cover-fallback__author">' + escapeHTML(book.author || book.publisher || '') + '</span>' +
      '</div>';
  }

  // Public catalogue: skip entries flagged hidden (unconfirmed titles etc.)
  function visibleBooks(books) {
    return books.filter(b => !b.hidden);
  }

  // Sort key that ignores leading articles and punctuation
  function sortTitle(t) {
    return String(t || '').toLowerCase().replace(/^[\s\[\]"'…\.]+/, '').replace(/^(the|a|an)\s+/, '');
  }

  /* ---- Render Featured books (Homepage) ---- */
  async function initFeaturedBooks() {
    const track = document.querySelector('.carousel__track');
    if (!track) return;

    const books = await loadJSON('data/books.json');
    if (!books) return;

    hideLoader('featured-loader');
    const featured = visibleBooks(books).filter(b => b.featured);
    track.innerHTML = featured.map(book => `
      <div class="carousel__item">
        <article class="book-card">
          <div class="book-card__cover">
            ${coverHTML(book, { lazy: true })}
          </div>
          <div class="book-card__info">
            <span class="book-card__category">${book.category}</span>
            <h3 class="book-card__title">${book.title}</h3>
            <p class="book-card__author">${book.author}</p>
            <p class="book-card__desc">${book.description}</p>
          </div>
        </article>
      </div>
    `).join('');

    initLazyLoad();

    // Auto-advance the carousel (pauses on hover)
    var items = track.querySelectorAll('.carousel__item');
    if (items.length > 1) {
      var idx = 0;
      var paused = false;
      track.addEventListener('mouseenter', function () { paused = true; });
      track.addEventListener('mouseleave', function () { paused = false; });
      var base = items[0].offsetLeft;
      setInterval(function () {
        if (paused) return;
        idx = (idx + 1) % items.length;
        track.scrollTo({ left: items[idx].offsetLeft - base, behavior: 'smooth' });
      }, 3200);
    }
  }

  /* ---- Render Book Count (Homepage Stats) ---- */
  async function initStats() {
    const bookCountEl = document.getElementById('book-count');
    if (!bookCountEl) return;

    const books = await loadJSON('data/books.json');
    if (books) {
      bookCountEl.textContent = books.length;
    }
  }

  /* ---- Partners Strip (Homepage) ---- */
  async function initPartnersStrip() {
    const strip = document.querySelector('.partners-strip');
    if (!strip) return;

    const partners = await loadJSON('data/partners.json');
    if (!partners) return;

    strip.innerHTML = partners.map(p => `
      <a href="${p.url}" target="_blank" rel="noopener" title="${p.name}">
        <img data-src="${p.logo_url}" alt="${p.name} logo" loading="lazy">
      </a>
    `).join('');

    initLazyLoad();
  }

  /* ---- Catalog Page (hover-reveal list, Corvi-Mora style) ---- */
  async function initCatalog() {
    const listEl = document.getElementById('catalog-list');
    if (!listEl) return;

    const preview = document.getElementById('catalog-hover-preview');

    const allBooks = await loadJSON('data/books.json');
    hideLoader('catalog-loader');
    if (!allBooks) return;
    const books = visibleBooks(allBooks);

    let currentFilter = 'all';
    let searchQuery = '';

    function getFiltered() {
      let filtered = [...books];

      if (currentFilter !== 'all') {
        filtered = filtered.filter(b => b.category === currentFilter);
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(b =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
        );
      }

      // Always sort A-Z for the list view (ignoring "The", "A", "An")
      filtered.sort((a, b) => sortTitle(a.title).localeCompare(sortTitle(b.title)));
      return filtered;
    }

    function showPreview(bookId) {
      if (!preview) return;
      var book = books.find(b => b.id === bookId);
      if (!book) return;
      if (preview.dataset.bookId !== bookId) {
        preview.innerHTML = coverHTML(book);
        preview.dataset.bookId = bookId;
      }
      preview.classList.add('is-visible');
    }
    function hidePreview() {
      if (preview) preview.classList.remove('is-visible');
    }

    function renderCatalog() {
      var filtered = getFiltered();

      if (filtered.length === 0) {
        listEl.innerHTML = '<div class="empty-state"><p>No books found.</p></div>';
        return;
      }

      listEl.innerHTML = filtered.map(book => `
        <a class="catalog-list__item" data-book-id="${book.id}" role="button" tabindex="0" aria-label="View ${escapeHTML(book.title)}">
          <span class="catalog-list__title">${escapeHTML(book.title)}</span>
          <span class="catalog-list__meta">
            <span class="catalog-list__author">${escapeHTML(book.author || book.publisher || '')}</span>
            <span class="catalog-list__category">${escapeHTML(book.category)}</span>
          </span>
        </a>
      `).join('');

      listEl.querySelectorAll('.catalog-list__item').forEach(el => {
        el.addEventListener('click', () => openBookModal(el.dataset.bookId));
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') openBookModal(el.dataset.bookId); });
        el.addEventListener('mouseenter', () => showPreview(el.dataset.bookId));
        el.addEventListener('mouseleave', hidePreview);
      });
    }

    // Floating cover preview follows the cursor (desktop affordance)
    if (preview) {
      listEl.addEventListener('mousemove', (e) => {
        var x = e.clientX + 24;
        if (x + 240 > window.innerWidth) x = e.clientX - 24 - 230;
        preview.style.left = x + 'px';
        preview.style.top = e.clientY + 'px';
      });
      listEl.addEventListener('mouseleave', hidePreview);
    }

    function openBookModal(bookId) {
      var book = books.find(b => b.id === bookId);
      if (book) showBookModal(book);
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentFilter = btn.dataset.filter;
        renderCatalog();
      });
    });

    // Search input
    const searchInput = document.getElementById('catalog-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderCatalog();
      });
    }

    renderCatalog();
  }

  /* ---- Book detail modal (catalogue page and homepage canvas) ---- */
  var lastModalTrigger = null;

  function showBookModal(book) {
    var modal = document.getElementById('book-modal');
    var coverEl = document.getElementById('book-modal-cover');
    var infoEl = document.getElementById('book-modal-info');
    if (!modal || !coverEl || !infoEl) return;

    coverEl.innerHTML = coverHTML(book);

    var metaBits = [];
    if (book.publisher && book.publisher !== book.author) metaBits.push(escapeHTML(book.publisher));
    if (book.editor) metaBits.push('Edited by ' + escapeHTML(book.editor));
    if (book.translator) metaBits.push('Translated by ' + escapeHTML(book.translator));

    infoEl.innerHTML =
      '<div>' +
        '<div class="book-modal__category">' + escapeHTML(book.category) + '</div>' +
        '<h2 class="book-modal__title">' + escapeHTML(book.title) + '</h2>' +
        '<p class="book-modal__desc">' + escapeHTML(book.description) + '</p>' +
        (metaBits.length ? '<p class="book-modal__meta">' + metaBits.join(' · ') + '</p>' : '') +
      '</div>' +
      '<div class="book-modal__footer">' +
        '<div>' +
          '<div class="book-modal__author">' + escapeHTML(book.author) + '</div>' +
          '<div class="book-modal__year">' + escapeHTML(book.year || '') + '</div>' +
        '</div>' +
        '<span class="book-modal__badge">In Collection</span>' +
      '</div>';

    lastModalTrigger = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    var closeBtn = document.getElementById('book-modal-close');
    if (closeBtn) closeBtn.focus();
  }

  function closeBookModal() {
    var modal = document.getElementById('book-modal');
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (lastModalTrigger && typeof lastModalTrigger.focus === 'function') lastModalTrigger.focus();
    lastModalTrigger = null;
  }

  function initBookModal() {
    if (!document.getElementById('book-modal')) return;
    var closeBtn = document.getElementById('book-modal-close');
    var overlay = document.getElementById('book-modal-overlay');
    if (closeBtn) closeBtn.addEventListener('click', closeBookModal);
    if (overlay) overlay.addEventListener('click', closeBookModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeBookModal();
    });
  }

  /* ---- Homepage: infinite canvas of the collection ----
     One block of cards is laid out 3 x 3; as you pan, the position wraps by
     one block width/height so the grid never ends. Drag (pointer), wheel and
     arrow keys all pan; a click without a drag opens the book. */
  async function initBookCanvas() {
    var canvas = document.getElementById('book-canvas');
    if (!canvas) return;
    var matrixEl = canvas.querySelector('.canvas__matrix');
    if (!matrixEl) return;

    var all = await loadJSON('data/books.json');
    hideLoader('canvas-loader');
    if (!all) return;
    var books = visibleBooks(all);
    if (!books.length) return;

    var listLink = document.getElementById('canvas-list-link');
    if (listLink) listLink.textContent = 'Browse all ' + books.length + ' titles';

    // Fill the block's last row so there are no holes (the canvas repeats anyway)
    var cols = 4;
    var cells = books.slice();
    for (var p = 0; cells.length % cols !== 0; p++) cells.push(books[p % books.length]);

    function cardHTML(book, interactive) {
      return '<button type="button" class="canvas-card" data-book-id="' + escapeHTML(book.id) + '"' +
        (interactive ? '' : ' tabindex="-1"') + '>' +
        '<span class="canvas-card__cover">' + coverHTML(book) + '</span>' +
        '<span class="canvas-card__title">' + escapeHTML(book.title) + '</span>' +
        '<span class="canvas-card__author">' + escapeHTML(book.author || book.publisher || '') + '</span>' +
        '</button>';
    }

    var html = '';
    for (var b = 0; b < 9; b++) {
      var isCenter = b === 4;
      html += '<div class="canvas__block"' + (isCenter ? ' data-center="true"' : ' aria-hidden="true"') + '>' +
        cells.map(function (c) { return cardHTML(c, isCenter); }).join('') + '</div>';
    }
    matrixEl.innerHTML = html;
    var block = matrixEl.querySelector('[data-center]');

    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var current = { x: 0, y: 0 };
    var target = { x: 0, y: 0 };
    var velocity = { x: 0, y: 0 };
    var dim = { w: 0, h: 0 };
    var dragging = false;
    var dragStart = { x: 0, y: 0 };
    var dragStartTarget = { x: 0, y: 0 };
    var lastPointer = { x: 0, y: 0, t: 0 };
    var dragDistance = 0;
    var initialised = false;

    function measure() {
      var r = block.getBoundingClientRect();
      var cw = canvas.clientWidth, ch = canvas.clientHeight;
      if (!(r.width > 0 && r.height > 0 && cw > 0 && ch > 0)) return;
      // getBoundingClientRect includes the current skew/translate; use offset sizes instead
      dim = { w: block.offsetWidth, h: block.offsetHeight };
      if (!initialised) {
        // Start on the centre block, with its centre in the middle of the viewport
        var ix = -dim.w + (cw - dim.w) / 2;
        var iy = -dim.h + (ch - dim.h) / 2;
        current = { x: ix, y: iy };
        target = { x: ix, y: iy };
        matrixEl.style.transform = 'translate3d(' + ix.toFixed(2) + 'px, ' + iy.toFixed(2) + 'px, 0)';
        initialised = true;
      }
    }

    function markMoved() {
      canvas.classList.add('has-moved');
    }

    function loop() {
      var w = dim.w, h = dim.h;

      if (!dragging && (Math.abs(velocity.x) > 0.01 || Math.abs(velocity.y) > 0.01)) {
        velocity.x *= 0.95;
        velocity.y *= 0.95;
        target.x += velocity.x;
        target.y += velocity.y;
      }

      var lerp = reduceMotion ? 1 : (dragging ? 0.16 : 0.09);
      current.x += (target.x - current.x) * lerp;
      current.y += (target.y - current.y) * lerp;

      if (w > 0 && h > 0) {
        while (current.x < -w * 1.75) { current.x += w; target.x += w; dragStartTarget.x += w; }
        while (current.x > -w * 0.25) { current.x -= w; target.x -= w; dragStartTarget.x -= w; }
        while (current.y < -h * 1.75) { current.y += h; target.y += h; dragStartTarget.y += h; }
        while (current.y > -h * 0.25) { current.y -= h; target.y -= h; dragStartTarget.y -= h; }
      }

      var skewX = reduceMotion ? 0 : Math.max(Math.min(velocity.x * 0.08, 3), -3);
      var skewY = reduceMotion ? 0 : Math.max(Math.min(velocity.y * 0.08, 3), -3);

      matrixEl.style.transform = 'translate3d(' + current.x.toFixed(2) + 'px, ' + current.y.toFixed(2) + 'px, 0) skew(' + skewX.toFixed(2) + 'deg, ' + skewY.toFixed(2) + 'deg)';

      requestAnimationFrame(loop);
    }

    // Pointer drag with inertia
    canvas.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('.canvas__mark')) return;
      dragging = true;
      dragDistance = 0;
      dragStart = { x: e.clientX, y: e.clientY };
      dragStartTarget = { x: target.x, y: target.y };
      lastPointer = { x: e.clientX, y: e.clientY, t: performance.now() };
      velocity = { x: 0, y: 0 };
      canvas.classList.add('is-dragging');
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    });

    canvas.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var mult = 0.85;
      var dx = (e.clientX - dragStart.x) * mult;
      var dy = (e.clientY - dragStart.y) * mult;
      dragDistance += Math.hypot(e.clientX - lastPointer.x, e.clientY - lastPointer.y);

      var now = performance.now();
      var dt = Math.max(now - lastPointer.t, 1);
      var vx = ((e.clientX - lastPointer.x) / dt) * 12;
      var vy = ((e.clientY - lastPointer.y) / dt) * 12;
      velocity = { x: velocity.x * 0.25 + vx * 0.75, y: velocity.y * 0.25 + vy * 0.75 };

      lastPointer = { x: e.clientX, y: e.clientY, t: now };
      target.x = dragStartTarget.x + dx;
      target.y = dragStartTarget.y + dy;
      if (dragDistance > 6) markMoved();
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      canvas.classList.remove('is-dragging');
      try { if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }

      // A press without a drag is a click on whatever is under the pointer
      if (e.type === 'pointerup' && dragDistance < 6) {
        var el = document.elementFromPoint(e.clientX, e.clientY);
        var card = el && el.closest ? el.closest('.canvas-card') : null;
        if (card) openFromCard(card);
      }
    }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    function openFromCard(card) {
      var book = books.find(function (b) { return b.id === card.dataset.bookId; });
      if (book) showBookModal(book);
    }

    // Keyboard activation of a card (Enter/Space produce a click with detail 0)
    matrixEl.addEventListener('click', function (e) {
      if (e.detail !== 0) return;
      var card = e.target.closest('.canvas-card');
      if (card) openFromCard(card);
    });

    // Wheel / trackpad: two-axis pan
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      var s = 0.45;
      var dx = -e.deltaX * s;
      var dy = -e.deltaY * s;
      velocity = { x: velocity.x * 0.3 + dx * 0.7, y: velocity.y * 0.3 + dy * 0.7 };
      target.x += dx;
      target.y += dy;
      markMoved();
    }, { passive: false });

    // Arrow keys pan when the canvas itself has focus
    canvas.addEventListener('keydown', function (e) {
      if (e.target !== canvas) return;
      var step = 120;
      var moved = true;
      if (e.key === 'ArrowLeft') target.x += step;
      else if (e.key === 'ArrowRight') target.x -= step;
      else if (e.key === 'ArrowUp') target.y += step;
      else if (e.key === 'ArrowDown') target.y -= step;
      else moved = false;
      if (moved) { e.preventDefault(); markMoved(); }
    });

    // Images change the block height as they load: keep re-measuring
    if ('ResizeObserver' in window) {
      new ResizeObserver(measure).observe(canvas);
      new ResizeObserver(measure).observe(block);
    } else {
      window.addEventListener('resize', measure);
    }

    measure();
    requestAnimationFrame(loop);
  }

  /* ---- Wishlist Page ---- */
  async function initWishlist() {
    const list = document.getElementById('wishlist-list');
    if (!list) return;

    const items = await loadJSON('data/wishlist.json');
    hideLoader('wishlist-loader');
    if (!items) return;

    list.innerHTML = items.map(item => `
      <div class="wishlist-item">
        <div>
          <span class="wishlist-item__category">${item.category}</span>
          <h3 class="wishlist-item__title">${item.title}</h3>
          <p class="wishlist-item__author">${item.author}</p>
          <p class="wishlist-item__reason">${item.reason}</p>
        </div>
        <div>
          <a href="${item.amazon_url}" target="_blank" rel="noopener" class="btn btn--outline">
            Donate this book
          </a>
        </div>
      </div>
    `).join('');
  }

  /* ---- Team Section (About) ---- */
  async function initTeam() {
    const grid = document.getElementById('team-grid');
    if (!grid) return;

    const team = await loadJSON('data/team.json');
    hideLoader('team-loader');
    if (!team) return;

    grid.innerHTML = team.map(member => `
      <div class="team-card">
        <div class="team-card__image">
          <img data-src="${member.image_url}" alt="${member.name}" loading="lazy">
        </div>
        <h3 class="team-card__name">${member.name}</h3>
        <p class="team-card__role">${member.role}</p>
        <p class="team-card__bio">${member.bio}</p>
      </div>
    `).join('');

    initLazyLoad();
  }

  /* ---- Gallery (Visit page) ---- */
  async function initGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    const gallery = await loadJSON('data/gallery.json');
    hideLoader('gallery-loader');
    if (!gallery) return;

    grid.innerHTML = gallery.map(item => `
      <div class="gallery-grid__item">
        <img data-src="${item.image_url}" alt="${item.alt}" loading="lazy">
        <div class="gallery-grid__caption">${item.caption}</div>
      </div>
    `).join('');

    initLazyLoad();
  }

  /* ---- Partners Page ---- */
  async function initPartners() {
    const container = document.getElementById('partners-container');
    if (!container) return;

    const partners = await loadJSON('data/partners.json');
    hideLoader('partners-loader');
    if (!partners) return;

    const tiers = {
      founding: { label: 'Founding partners', items: [] },
      partner: { label: 'Partners', items: [] },
      supporter: { label: 'Supporters', items: [] }
    };

    partners.forEach(p => {
      if (tiers[p.tier]) {
        tiers[p.tier].items.push(p);
      }
    });

    container.innerHTML = Object.entries(tiers)
      .filter(([, tier]) => tier.items.length > 0)
      .map(([, tier]) => `
        <div class="partner-tier">
          <h3 class="partner-tier__title">${tier.label}</h3>
          ${tier.items.map(p => `
            <div class="partner-card">
              <div class="partner-card__logo">
                <img data-src="${p.logo_url}" alt="${p.name}" loading="lazy">
              </div>
              <div>
                <h4 class="partner-card__name">
                  <a href="${p.url}" target="_blank" rel="noopener">${p.name}</a>
                </h4>
                <p class="partner-card__desc">${p.description}</p>
              </div>
            </div>
          `).join('')}
        </div>
      `).join('');

    initLazyLoad();
  }

  /* ---- Events Page ---- */
  async function initEvents() {
    const grid = document.getElementById('events-grid');
    if (!grid) return;

    const events = await loadJSON('data/events.json');
    hideLoader('events-loader');
    if (!events) return;

    grid.innerHTML = events.map(evt => {
      const date = new Date(evt.date);
      const formatted = date.toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
      return `
        <article class="event-card">
          <div class="event-card__date">${formatted}, ${evt.time}</div>
          <h3 class="event-card__title">${evt.title}</h3>
          <p class="event-card__location">${evt.location}</p>
          <p class="event-card__desc">${evt.description}</p>
        </article>
      `;
    }).join('');
  }

  /* ---- Countdown (Visit page) ---- */
  function initCountdown() {
    const el = document.getElementById('countdown');
    if (!el) return;

    const target = new Date('2026-03-31T10:00:00+02:00');

    function update() {
      const now = new Date();
      const diff = target - now;

      if (diff <= 0) {
        el.innerHTML = '<p style="font-family:var(--font-serif);font-size:var(--text-3xl);color:var(--color-accent);">We are open.</p>';
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      el.innerHTML = `
        <div class="countdown__item">
          <div class="countdown__number">${days}</div>
          <div class="countdown__label">Days</div>
        </div>
        <div class="countdown__item">
          <div class="countdown__number">${hours}</div>
          <div class="countdown__label">Hours</div>
        </div>
        <div class="countdown__item">
          <div class="countdown__number">${minutes}</div>
          <div class="countdown__label">Minutes</div>
        </div>
        <div class="countdown__item">
          <div class="countdown__number">${seconds}</div>
          <div class="countdown__label">Seconds</div>
        </div>
      `;
    }

    update();
    setInterval(update, 1000);
  }

  /* ---- Helper: set text or innerHTML by ID ---- */
  function setText(id, text) {
    var el = document.getElementById(id);
    if (el && text != null) el.textContent = text;
  }
  function setHTML(id, html) {
    var el = document.getElementById(id);
    if (el && html != null) el.innerHTML = html;
  }

  /* ---- Page Content: Home ---- */
  async function initPageHome() {
    var d = await loadJSON('data/pages/home.json');
    if (!d) return;
    setText('pc-hero-title', d.hero_title);
    setText('pc-hero-subtitle', d.hero_subtitle);
    setText('pc-cta-browse', d.cta_browse);
    setText('pc-cta-donate', d.cta_donate);
    setText('pc-cta-visit', d.cta_visit);
    setText('pc-mission-label', d.mission_label);
    setText('pc-mission-text', d.mission_text);
    setText('pc-featured-label', d.featured_label);
    setText('pc-featured-title', d.featured_title);
    setText('pc-partners-label', d.partners_label);
    // Stats
    var statsEl = document.getElementById('pc-stats');
    if (statsEl && d.stats && d.stats.length) {
      statsEl.innerHTML = d.stats.map(function(s) {
        return '<div><div class="stat__number">' + s.number + '</div><div class="stat__label">' + s.label + '</div></div>';
      }).join('');
    }
  }

  /* ---- Page Content: About ---- */
  async function initPageAbout() {
    var d = await loadJSON('data/pages/about.json');
    if (!d) return;
    setText('pc-title', d.title);
    setText('pc-description', d.description);
    setText('pc-story-label', d.story_label);
    setText('pc-team-label', d.team_label);
    setText('pc-team-title', d.team_title);
    setText('pc-space-label', d.space_label);
    setText('pc-space-title', d.space_title);
    setText('pc-space-desc', d.space_description);
    // Story paragraphs
    var storyEl = document.getElementById('pc-story');
    if (storyEl && d.story_paragraphs && d.story_paragraphs.length) {
      storyEl.innerHTML = d.story_paragraphs.map(function(p, i) {
        var mb = i < d.story_paragraphs.length - 1 ? ' style="margin-bottom:var(--space-lg);"' : '';
        return '<p' + mb + '>' + p + '</p>';
      }).join('');
    }
  }

  /* ---- Page Content: Catalog ---- */
  async function initPageCatalog() {
    var d = await loadJSON('data/pages/catalog.json');
    if (!d) return;
    setText('pc-title', d.title);
    setText('pc-description', d.description);
    setText('pc-cta-text', d.cta_text);
    var ctaBtn = document.getElementById('pc-cta-button');
    if (ctaBtn && d.cta_button) ctaBtn.innerHTML = d.cta_button;
    var searchEl = document.getElementById('catalog-search');
    if (searchEl && d.search_placeholder) searchEl.placeholder = d.search_placeholder;
  }

  /* ---- Page Content: Wishlist ---- */
  async function initPageWishlist() {
    var d = await loadJSON('data/pages/wishlist.json');
    if (!d) return;
    setText('pc-title', d.title);
    setText('pc-description', d.description);
    setText('pc-buy-title', d.buy_title);
    setText('pc-buy-text', d.buy_text);
    var buyBtn = document.getElementById('pc-buy-button');
    if (buyBtn && d.buy_button) buyBtn.innerHTML = d.buy_button;
  }

  /* ---- Page Content: Donate ---- */
  async function initPageDonate() {
    var d = await loadJSON('data/pages/donate.json');
    if (!d) return;
    setText('pc-title', d.title);
    setText('pc-description', d.description);
    setText('pc-money-title', d.money_title);
    setText('pc-money-desc', d.money_description);
    var moneyBtn = document.getElementById('pc-money-button');
    if (moneyBtn && d.money_button) moneyBtn.innerHTML = d.money_button;
    setText('pc-money-note', d.money_note);
    setText('pc-book-title', d.book_title);
    setText('pc-book-desc', d.book_description);
    var bookBtn = document.getElementById('pc-book-button');
    if (bookBtn && d.book_button) bookBtn.innerHTML = d.book_button;
    setText('pc-book-note', d.book_note);
    setText('pc-how-label', d.how_label);
    setHTML('pc-charity-note', d.charity_note);
    // How items
    var howEl = document.getElementById('pc-how-items');
    if (howEl && d.how_items && d.how_items.length) {
      howEl.innerHTML = d.how_items.map(function(item, i) {
        var border = i < d.how_items.length - 1 ? 'border-right:var(--border-w) solid var(--color-border);' : '';
        return '<div style="padding:var(--space-lg);' + border + '">' +
          '<h4 style="font-size:var(--text-xl);margin-bottom:var(--space-sm);letter-spacing:-0.01em;">' + item.title + '</h4>' +
          '<p class="text-sm text-muted">' + item.text + '</p></div>';
      }).join('');
    }
  }

  /* ---- Page Content: Visit ---- */
  async function initPageVisit() {
    var d = await loadJSON('data/pages/visit.json');
    if (!d) return;
    setText('pc-title', d.title);
    setText('pc-description', d.description);
    setText('pc-opening-label', d.opening_label);
    setText('pc-opening-date', d.opening_date_display);
    setText('pc-gallery-label', d.gallery_label);
    setText('pc-gallery-title', d.gallery_title);
    setText('pc-hours-title', d.hours_title);
    setText('pc-hours-text', d.hours_text);
    setText('pc-hours-note', d.hours_note);
    setText('pc-address-title', d.address_title);
    setHTML('pc-address-text', d.address_text);
    setText('pc-address-note', d.address_note);
    setText('pc-expect-title', d.expect_title);
    // Expect items
    var expectEl = document.getElementById('pc-expect-items');
    if (expectEl && d.expect_items && d.expect_items.length) {
      expectEl.innerHTML = d.expect_items.map(function(item) {
        return '<li>' + item + '</li>';
      }).join('');
    }
  }

  /* ---- Page Content: Contact ---- */
  async function initPageContact() {
    var d = await loadJSON('data/pages/contact.json');
    if (!d) return;
    setText('pc-title', d.title);
    setText('pc-description', d.description);
    var form = document.getElementById('pc-form');
    if (form && d.form_action) form.action = d.form_action;
    setText('pc-name-label', d.form_name_label);
    setText('pc-email-label', d.form_email_label);
    setText('pc-message-label', d.form_message_label);
    setText('pc-form-button', d.form_button);
    var emailLink = document.getElementById('pc-info-email');
    if (emailLink && d.info_email) {
      emailLink.textContent = d.info_email;
      emailLink.href = 'mailto:' + d.info_email;
    }
    setText('pc-zimbabwe-title', d.info_zimbabwe_title);
    setHTML('pc-zimbabwe-text', d.info_zimbabwe_text);
    setText('pc-london-title', d.info_london_title);
    setHTML('pc-london-text', d.info_london_text);
    setText('pc-social-title', d.info_social_title);
    var socialEl = document.getElementById('pc-social-links');
    if (socialEl && d.info_social_links && d.info_social_links.length) {
      socialEl.innerHTML = d.info_social_links.map(function(link) {
        return '<a href="' + link.url + '" target="_blank" rel="noopener" style="display:block;margin-bottom:var(--space-sm);font-weight:700;">' + link.label + '</a>';
      }).join('');
    }
  }

  /* ---- Page Content: Partners ---- */
  async function initPagePartners() {
    var d = await loadJSON('data/pages/partners.json');
    if (!d) return;
    setText('pc-title', d.title);
    setText('pc-description', d.description);
    setText('pc-cta-title', d.cta_title);
    setText('pc-cta-text', d.cta_text);
    var ctaBtn = document.getElementById('pc-cta-button');
    if (ctaBtn && d.cta_button) ctaBtn.innerHTML = d.cta_button;
  }

  /* ---- Page Content: Events ---- */
  async function initPageEvents() {
    var d = await loadJSON('data/pages/events.json');
    if (!d) return;
    setText('pc-title', d.title);
    setText('pc-description', d.description);
  }

  /* ---- Load page content based on current page ---- */
  function initPageContent() {
    var path = window.location.pathname;
    var page = path.split('/').pop() || 'index.html';
    if (page === '' || page === 'index.html') initPageHome();
    else if (page === 'about.html') initPageAbout();
    else if (page === 'catalog.html') initPageCatalog();
    else if (page === 'wishlist.html') initPageWishlist();
    else if (page === 'donate.html') initPageDonate();
    else if (page === 'visit.html') initPageVisit();
    else if (page === 'contact.html') initPageContact();
    else if (page === 'partners.html') initPagePartners();
    else if (page === 'events.html') initPageEvents();
  }

  /* ---- Initialise ---- */
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initLangToggle();
    initGooeyNav();
    initPanels();
    initCursorDot();
    initLazyLoad();

    // Apply saved language
    if (typeof applyTranslations === 'function') {
      applyTranslations(getCurrentLang());
    }

    // Load CMS-editable page content
    initPageContent();

    // Page-specific initialisers
    initBookModal();
    initBookCanvas();
    initFeaturedBooks();
    initStats();
    initPartnersStrip();
    initCatalog();
    initWishlist();
    initTeam();
    initGallery();
    initPartners();
    initEvents();
    initCountdown();
  });
})();
