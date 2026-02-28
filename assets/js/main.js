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
      const res = await fetch(path);
      if (!res.ok) throw new Error('Failed to load ' + path);
      return await res.json();
    } catch (e) {
      console.warn('Could not load', path, e);
      return null;
    }
  }

  /* ---- Render Featured Books (Homepage) ---- */
  async function initFeaturedBooks() {
    const track = document.querySelector('.carousel__track');
    if (!track) return;

    const books = await loadJSON('data/books.json');
    if (!books) return;

    hideLoader('featured-loader');
    const featured = books.filter(b => b.featured);
    track.innerHTML = featured.map(book => `
      <div class="carousel__item">
        <article class="book-card">
          <div class="book-card__cover">
            <img data-src="${book.cover_url}" alt="Cover of ${book.title} by ${book.author}" loading="lazy">
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

  /* ---- Catalog Page (Saint Heron-inspired split view) ---- */
  async function initCatalog() {
    const listEl = document.getElementById('catalog-list');
    const coversEl = document.getElementById('catalog-covers');
    if (!listEl || !coversEl) return;

    const books = await loadJSON('data/books.json');
    hideLoader('catalog-loader');
    if (!books) return;

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

      // Always sort A-Z for the list view
      filtered.sort((a, b) => a.title.localeCompare(b.title));
      return filtered;
    }

    function renderCatalog() {
      var filtered = getFiltered();

      if (filtered.length === 0) {
        listEl.innerHTML = '<div class="empty-state"><p>No books found.</p></div>';
        coversEl.innerHTML = '';
        return;
      }

      // Left: text list
      listEl.innerHTML = filtered.map(book => `
        <a class="catalog-list__item" data-book-id="${book.id}" role="button" tabindex="0">
          ${book.title}
          <span class="catalog-list__category">${book.category}</span>
          <span class="catalog-list__author">${book.author}</span>
        </a>
      `).join('');

      // Right: cover grid
      coversEl.innerHTML = filtered.map(book => `
        <div class="catalog-cover-item" data-book-id="${book.id}" role="button" tabindex="0" aria-label="View ${book.title}">
          <img data-src="${book.cover_url}" alt="Cover of ${book.title}" loading="lazy">
        </div>
      `).join('');

      initLazyLoad();

      // Attach click handlers
      listEl.querySelectorAll('.catalog-list__item').forEach(el => {
        el.addEventListener('click', () => openBookModal(el.dataset.bookId));
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') openBookModal(el.dataset.bookId); });
      });

      coversEl.querySelectorAll('.catalog-cover-item').forEach(el => {
        el.addEventListener('click', () => openBookModal(el.dataset.bookId));
        el.addEventListener('keydown', (e) => { if (e.key === 'Enter') openBookModal(el.dataset.bookId); });
      });
    }

    // Book detail modal
    function openBookModal(bookId) {
      var book = books.find(b => b.id === bookId);
      if (!book) return;

      var modal = document.getElementById('book-modal');
      var coverEl = document.getElementById('book-modal-cover');
      var infoEl = document.getElementById('book-modal-info');

      coverEl.innerHTML = '<img src="' + book.cover_url + '" alt="Cover of ' + book.title + '">';

      infoEl.innerHTML =
        '<div>' +
          '<div class="book-modal__category">' + book.category + '</div>' +
          '<h2 class="book-modal__title">' + book.title + '</h2>' +
          '<p class="book-modal__desc">' + book.description + '</p>' +
        '</div>' +
        '<div class="book-modal__footer">' +
          '<div>' +
            '<div class="book-modal__author">' + book.author + '</div>' +
            '<div class="book-modal__year">' + book.year + '</div>' +
          '</div>' +
          '<span class="book-modal__badge">In Collection</span>' +
        '</div>';

      modal.hidden = false;
      document.body.style.overflow = 'hidden';
    }

    function closeBookModal() {
      var modal = document.getElementById('book-modal');
      if (modal) {
        modal.hidden = true;
        document.body.style.overflow = '';
      }
    }

    // Modal close handlers
    var closeBtn = document.getElementById('book-modal-close');
    var overlay = document.getElementById('book-modal-overlay');
    if (closeBtn) closeBtn.addEventListener('click', closeBookModal);
    if (overlay) overlay.addEventListener('click', closeBookModal);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeBookModal();
    });

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
          <p class="wishlist-item__reason">"${item.reason}"</p>
        </div>
        <div>
          <a href="${item.amazon_url}" target="_blank" rel="noopener" class="btn btn--outline">
            Donate This Book &rarr;
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
      founding: { label: 'Founding Partners', items: [] },
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
          <div class="event-card__date">${formatted} &mdash; ${evt.time}</div>
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

  /* ---- Initialise ---- */
  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initLangToggle();
    initLazyLoad();

    // Apply saved language
    if (typeof applyTranslations === 'function') {
      applyTranslations(getCurrentLang());
    }

    // Page-specific initialisers
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
