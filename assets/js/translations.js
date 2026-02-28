/**
 * Paivapo Institution — i18n translations
 * English primary, Shona placeholder
 */
const TRANSLATIONS = {
  en: {
    // Nav
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.catalog': 'Catalog',
    'nav.wishlist': 'Books We Need',
    'nav.donate': 'Donate',
    'nav.visit': 'Visit Us',
    'nav.contact': 'Contact',
    'nav.partners': 'Partners',

    // Hero
    'hero.tagline': 'A library for the curious, the critical, and the community.',

    // Homepage
    'home.mission.label': 'Our Mission',
    'home.mission.text': 'Paivapo Institution is a community library in Zimbabwe. We collect, preserve, and share books across art, ecology, and literature. Access to books should be ordinary, not exceptional.',
    'home.featured': 'Featured Books',
    'home.stats.books': 'Books',
    'home.stats.categories': 'Categories',
    'home.stats.opening': 'Opening',
    'home.cta.visit': 'Visit Us',
    'home.cta.donate': 'Donate',
    'home.cta.browse': 'Browse Catalog',
    'home.partners': 'Our Partners',

    // About
    'about.title': 'About',
    'about.team': 'Our Team',
    'about.space': 'The Space',

    // Catalog
    'catalog.title': 'Book Catalog',
    'catalog.search': 'Search by title or author...',
    'catalog.all': 'All',
    'catalog.art': 'Art',
    'catalog.ecology': 'Ecology',
    'catalog.literature': 'Literature',
    'catalog.sort': 'Sort A–Z',
    'catalog.wishlist.add': 'Add to Wishlist',

    // Wishlist
    'wishlist.title': 'Books We Need',
    'wishlist.desc': 'Help us build our collection. These are the titles we are looking for.',
    'wishlist.donate': 'Donate This Book',

    // Donate
    'donate.title': 'Support Paivapo',
    'donate.money': 'Donate Money',
    'donate.book': 'Donate a Book',

    // Visit
    'visit.title': 'Visit Us',
    'visit.opening': 'Opening',
    'visit.hours': 'Hours',
    'visit.address': 'Address',
    'visit.expect': 'What to Expect',

    // Contact
    'contact.title': 'Contact',
    'contact.name': 'Name',
    'contact.email': 'Email',
    'contact.message': 'Message',
    'contact.send': 'Send Message',

    // Partners
    'partners.title': 'Partners & Sponsors',
    'partners.founding': 'Founding Partners',
    'partners.partners': 'Partners',
    'partners.supporters': 'Supporters',
    'partners.cta': 'Become a Partner',

    // Footer
    'footer.built': 'Built with care for Zimbabwe',

    // Common
    'common.readmore': 'Read More',
    'common.loading': 'Loading...',
  },

  sn: {
    // Nav
    'nav.home': 'Kumba',
    'nav.about': 'Nezvayo',
    'nav.catalog': 'Mabhuku',
    'nav.wishlist': 'Mabhuku Atinoda',
    'nav.donate': 'Batsira',
    'nav.visit': 'Tishanyire',
    'nav.contact': 'Taura Nesu',
    'nav.partners': 'Vadiwa',

    // Hero
    'hero.tagline': '[Shona translation coming soon]',

    // Homepage
    'home.mission.label': 'Chinangwa Chedu',
    'home.mission.text': '[Shona translation coming soon]',
    'home.featured': 'Mabhuku Akanakisa',
    'home.stats.books': 'Mabhuku',
    'home.stats.categories': 'Mhando',
    'home.stats.opening': 'Kuvhura',
    'home.cta.visit': 'Tishanyire',
    'home.cta.donate': 'Batsira',
    'home.cta.browse': 'Tarisa Mabhuku',
    'home.partners': 'Vadiwa Vedu',

    // About
    'about.title': 'Nezvayo',
    'about.team': 'Vanhu Vedu',
    'about.space': 'Nzvimbo',

    // Catalog
    'catalog.title': 'Mabhuku Ese',
    'catalog.search': '[Shona translation coming soon]',
    'catalog.all': 'Ese',
    'catalog.art': 'Hunyanzvi',
    'catalog.ecology': 'Zvinhu Zvemvura',
    'catalog.literature': 'Tsamba',
    'catalog.sort': '[Shona translation coming soon]',
    'catalog.wishlist.add': '[Shona translation coming soon]',

    // Wishlist
    'wishlist.title': 'Mabhuku Atinoda',
    'wishlist.desc': '[Shona translation coming soon]',
    'wishlist.donate': '[Shona translation coming soon]',

    // Donate
    'donate.title': 'Batsira Paivapo',
    'donate.money': '[Shona translation coming soon]',
    'donate.book': '[Shona translation coming soon]',

    // Visit
    'visit.title': 'Tishanyire',
    'visit.opening': '[Shona translation coming soon]',
    'visit.hours': '[Shona translation coming soon]',
    'visit.address': '[Shona translation coming soon]',
    'visit.expect': '[Shona translation coming soon]',

    // Contact
    'contact.title': 'Taura Nesu',
    'contact.name': 'Zita',
    'contact.email': 'Email',
    'contact.message': 'Mashoko',
    'contact.send': '[Shona translation coming soon]',

    // Partners
    'partners.title': 'Vadiwa Nevanobatsira',
    'partners.founding': '[Shona translation coming soon]',
    'partners.partners': 'Vadiwa',
    'partners.supporters': '[Shona translation coming soon]',
    'partners.cta': '[Shona translation coming soon]',

    // Footer
    'footer.built': '[Shona translation coming soon]',

    // Common
    'common.readmore': '[Shona translation coming soon]',
    'common.loading': '[Shona translation coming soon]',
  }
};

/**
 * Get current language from localStorage or default to English
 */
function getCurrentLang() {
  return localStorage.getItem('paivapo-lang') || 'en';
}

/**
 * Set language preference
 */
function setLang(lang) {
  localStorage.setItem('paivapo-lang', lang);
  applyTranslations(lang);
}

/**
 * Translate a key
 */
function t(key) {
  const lang = getCurrentLang();
  return TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key] || key;
}

/**
 * Apply translations to all elements with data-i18n attribute
 */
function applyTranslations(lang) {
  if (!lang) lang = getCurrentLang();
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translation = TRANSLATIONS[lang]?.[key] || TRANSLATIONS['en']?.[key];
    if (translation) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translation;
      } else {
        el.textContent = translation;
      }
    }
  });

  // Update lang toggle button text
  const toggleBtn = document.querySelector('.lang-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = lang === 'en' ? 'SN' : 'EN';
    toggleBtn.setAttribute('aria-label',
      lang === 'en' ? 'Switch to Shona' : 'Switch to English');
  }

  document.documentElement.lang = lang === 'sn' ? 'sn' : 'en';
}
