# Paivapo Institution

A community library in Zimbabwe dedicated to collecting, preserving, and sharing books across art, ecology, and literature. Founded by artist Felix Shumba.

**Opening March 2026 in Harare, Zimbabwe.**

---

## Setup & Deployment

### 1. GitHub Pages Deployment

1. Push all files to a GitHub repository
2. Go to **Settings → Pages**
3. Under "Build and deployment", select **Deploy from a branch**
4. Choose **main** branch and **/ (root)** folder
5. Click Save
6. Site will be live at `https://[username].github.io/[repo-name]/`

### 2. Custom Domain (Optional)

1. Create a file called `CNAME` in the repository root containing your domain:
   ```
   paivapo.org
   ```
2. Configure your DNS provider:
   - Add a CNAME record pointing to `[username].github.io`
   - Or add A records pointing to GitHub Pages IPs
3. In repository Settings → Pages, enter your custom domain

---

## Content Management

All site content is managed through JSON files in the `/data/` directory.

### Using the Admin Panel

1. Open `/admin/index.html` in your browser (locally or via the live site)
2. The admin panel loads existing data from your `/data/` JSON files
3. Add, edit, or delete items using the interface
4. Click **Download [filename].json** to export updated data
5. Replace the corresponding file in `/data/` and commit to GitHub
6. Changes will be live once GitHub Pages rebuilds (usually under a minute)

### Data Files

| File | Purpose |
|------|---------|
| `data/books.json` | Full book catalog |
| `data/wishlist.json` | Books the library needs |
| `data/partners.json` | Partners and sponsors |
| `data/team.json` | Team members (edit manually) |
| `data/gallery.json` | Visit page photos |
| `data/events.json` | Events (page hidden from nav by default) |
| `data/settings.json` | Site-wide settings |

### Adding Books via ISBN

The admin panel can auto-populate book data from the [Open Library API](https://openlibrary.org/developers/api):

1. Go to the admin panel → Books tab
2. Enter an ISBN in the lookup field
3. Click **Look Up ISBN** — title, author, cover, and year will be filled automatically
4. Select a category, edit the description, toggle featured if desired
5. Click **Add Book**, then download and commit the updated `books.json`

---

## File Structure

```
/
├── index.html          # Homepage
├── about.html          # About — story, team, Biennale note
├── catalog.html        # Searchable book catalog
├── wishlist.html       # Books we need / donate-a-book
├── donate.html         # Donation options
├── visit.html          # Visit info, map, countdown
├── contact.html        # Contact form
├── partners.html       # Partners & sponsors
├── events.html         # Events (hidden from nav)
├── admin/
│   └── index.html      # CMS admin panel
├── assets/
│   ├── css/
│   │   └── style.css   # Design system
│   ├── js/
│   │   ├── main.js     # Site functionality
│   │   └── translations.js  # English/Shona i18n
│   └── images/
│       └── placeholder.svg
├── data/
│   ├── books.json
│   ├── wishlist.json
│   ├── partners.json
│   ├── team.json
│   ├── gallery.json
│   ├── events.json
│   └── settings.json
└── README.md
```

---

## Activating the Events Page

The Events page exists at `/events.html` but is not linked in the navigation. To activate it, add the following to the navigation list in each HTML page:

```html
<li><a href="events.html" class="nav__link">Events</a></li>
```

---

## Language Toggle

The site supports English (primary) and Shona. The Shona translations in `translations.js` are placeholders — replace `[Shona translation coming soon]` with actual translations as they become available.

---

## Technical Notes

- **Pure static site** — no build tools, no frameworks, no server required
- **Performance** — lazy-loaded images, minimal JS, CSS custom properties
- **Typography** — DM Serif Display + DM Sans (Google Fonts)
- **Accessibility** — semantic HTML, ARIA labels, skip links, color contrast
- **Map** — OpenStreetMap embed (no API key needed)
- **Contact form** — Formspree endpoint (replace placeholder action URL)

---

## Contact

hello@paivapo.org

---

*Built with care for Zimbabwe.*
