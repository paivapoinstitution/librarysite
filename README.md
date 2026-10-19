# Paivapo Institution

A community library in Masvingo, Zimbabwe, dedicated to collecting, preserving, and sharing books across art, ecology, and literature. Founded by artist Felix Shumba.

Live site: https://paivapoinstitution.github.io/librarysite/

---

## How the site works

Pure static site: no build step, no framework. HTML pages load their copy and listings from JSON files in `/data/` at runtime (`assets/js/main.js`). Edit the JSON, commit, and GitHub Pages redeploys within a minute.

| File | Purpose |
|------|---------|
| `data/books.json` | Full book catalogue |
| `data/wishlist.json` | Books the library needs |
| `data/partners.json` | Partners and sponsors |
| `data/team.json` | Team members |
| `data/gallery.json` | Visit page photos |
| `data/events.json` | Events (page hidden from nav by default) |
| `data/settings.json` | Site-wide settings |
| `data/pages/*.json` | Per-page copy (hero, mission, labels, CTAs) |

### Admin panel

`/admin/index.html` edits every JSON file above and publishes straight to GitHub with a personal access token (no downloads). The Books tab can look up an ISBN on Open Library to fill title, author, cover and year.

Book records support a few fields the form does not show (`publisher`, `editor`, `translator`, `copies`, `donated_by`, `needs_review`). They are preserved when you edit a book in the panel. Tick **Hide from public catalogue** for records whose title or details are still to be confirmed; they stay in the data but are not listed on the site.

### Homepage and navigation

The homepage is an infinite canvas of the whole collection (every book in `data/books.json` that is not hidden). Drag, scroll or use the arrow keys to pan; click a book to open its details. There is no page scroll on the homepage.

The nav has five items: Paivapo, About, Visit, Support, Contact. On the homepage the last four open a side panel over the books (deep-linkable as `index.html#about` and so on) built from `data/settings.json`, `data/pages/*.json` and `data/partners.json`. On the other pages the same items link back to those panels. The nav is rendered as the "gooey" pill bar by `main.js` from the plain list in each page's header; the header is transparent and blended, so it reads black on white pages and inverted over the books.

### Language toggle

English is primary. Shona strings live in `assets/js/translations.js`. Entries still marked `[Shona translation coming soon]` fall back to English on the site, so the toggle never shows the marker.

---

## Deployment

GitHub Pages serves the `main` branch from the repository root. `.nojekyll` disables the Jekyll build.

### Custom domain

1. Add a `CNAME` file in the repository root containing the domain (for example `paivapo.org`).
2. At the DNS provider, add a CNAME record pointing to `paivapoinstitution.github.io` (or A records to the GitHub Pages IPs).
3. In the repository settings under Pages, enter the custom domain and enable HTTPS.

---

## File structure

```
/
├── index.html          # Homepage
├── about.html          # Story, team, the space
├── catalog.html        # Catalogue (hover-reveal list + detail modal)
├── wishlist.html       # Books we need / donate-a-book
├── donate.html         # Donation options
├── visit.html          # Visit info, gallery, map
├── contact.html        # Contact form
├── partners.html       # Partners and sponsors
├── events.html         # Events (hidden from nav)
├── admin/
│   ├── index.html      # CMS admin panel
│   └── book-search.html
├── assets/
│   ├── css/style.css   # Design system (black, white, yellow; Inter)
│   ├── js/main.js      # Site functionality
│   ├── js/translations.js
│   └── images/placeholder.svg
└── data/               # All content (see table above)
```

## Activating the events page

`events.html` exists but is not linked. To show it, add this to the navigation list in each page:

```html
<li><a href="events.html" class="nav__link">Events</a></li>
```

## Technical notes

- Lazy-loaded images, minimal JS, CSS custom properties
- Typography: Inter (Google Fonts)
- Semantic HTML, ARIA labels, skip link
- Map: OpenStreetMap embed (no API key)
- Contact form: Formspree endpoint, set in `data/pages/contact.json`

## Contact

hello@paivapo.org
