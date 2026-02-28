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

  /* ---- Catalog Page ---- */
  async function initCatalog() {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;

    const books = await loadJSON('data/books.json');
    if (!books) return;

    let currentFilter = 'all';
    let currentSort = 'title';
    let searchQuery = '';

    function renderBooks() {
      let filtered = [...books];

      // Filter by category
      if (currentFilter !== 'all') {
        filtered = filtered.filter(b => b.category === currentFilter);
      }

      // Filter by search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(b =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q)
        );
      }

      // Sort
      if (currentSort === 'title') {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
      } else if (currentSort === 'title-desc') {
        filtered.sort((a, b) => b.title.localeCompare(a.title));
      } else if (currentSort === 'author') {
        filtered.sort((a, b) => a.author.localeCompare(b.author));
      } else if (currentSort === 'year') {
        filtered.sort((a, b) => b.year - a.year);
      }

      if (filtered.length === 0) {
        grid.innerHTML = `
          <div class="empty-state" style="grid-column: 1/-1">
            <div class="empty-state__icon">&#9671;</div>
            <p>No books found matching your search.</p>
          </div>`;
        return;
      }

      grid.innerHTML = filtered.map(book => `
        <article class="book-card">
          <div class="book-card__cover">
            <img data-src="${book.cover_url}" alt="Cover of ${book.title} by ${book.author}" loading="lazy">
          </div>
          <div class="book-card__info">
            <span class="book-card__category">${book.category}</span>
            <h3 class="book-card__title">${book.title}</h3>
            <p class="book-card__author">${book.author}</p>
            <p class="book-card__desc">${book.description}</p>
            <span class="book-card__year">${book.year}</span>
          </div>
        </article>
      `).join('');

      initLazyLoad();
    }

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentFilter = btn.dataset.filter;
        renderBooks();
      });
    });

    // Search input
    const searchInput = document.getElementById('catalog-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderBooks();
      });
    }

    // Sort select
    const sortSelect = document.getElementById('catalog-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderBooks();
      });
    }

    renderBooks();
  }

  /* ---- Wishlist Page ---- */
  async function initWishlist() {
    const list = document.getElementById('wishlist-list');
    if (!list) return;

    const items = await loadJSON('data/wishlist.json');
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
