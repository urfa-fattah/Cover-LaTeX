# Academic Cover Page Generator

A single-file, offline-first web app for creating print-ready A4 cover pages for university assignments, lab reports, and project reports.

**[▶ Open the app](./index.html)** · **[⬇ Install as PWA](#installation)**

---

## ✨ Features

### Templates
- **Assignment** — one student, one teacher
- **Lab Report** — adds experiment number, date performed, date submitted
- **Project Report** — multiple students in a table, group name

### Content
- University, faculty, and department names
- University logo (PNG / JPG / SVG, up to 500 KB)
- Course code & name, document type, document title or experiment name
- Submitted By: name, registration no., class roll, group (optional), submission date
- Submitted To: up to 5 teachers, each with name, initials, designation, department
- **Custom fields** — add any number of extra lines and choose exactly where each goes:
  - Its own block (positioned in Layout & Order)
  - Anchored to a specific spot: after the university name, after the logo, under "Submitted By" heading, as a row in the info table, after each teacher, etc.

### Layout & Spacing
- **Drag-and-drop reordering** of the four main sections
- **Show/hide** any section
- **Vertical spacing modes**: Top (natural flow), Justify (auto-fill), Evenly (equal gaps), Custom (per-section pixel gap)
- **Spacing density** multiplier (0–200%) for fine-tuning
- **Fit & Scale**: Auto-Fit toggle + 40–130% manual Content Scale slider
- **Live overflow warning** — red pill appears under the page when content won't fit

### Appearance
- Font: Times New Roman, Georgia, Palatino, Garamond, Cambria, Arial, Calibri
- Border: double line, single line, or none
- Custom text color and rule color
- Per-element font sizes (11 adjustable elements)

### Export
- **PDF** — single-page A4, generated locally
- **PNG** — 3× high-resolution raster
- **DOCX** — editable Word document with all fields, tables, and logo
- **JSON** — export/import full settings (with clipboard fallback)
- **Print** — direct browser print stylesheet

### PWA / Offline
- Installable as a standalone app on desktop, Android, and iOS
- Full offline support via service worker with cache-first strategy
- Auto-save to `localStorage` on every change

---

## 🚀 Quick Start

### Option 1 — Just open it
Download `index.html` and open it in any modern browser. That's it. No build step, no server required.

### Option 2 — Serve locally (recommended for PWA)
```bash
# Python 3
python3 -m http.server 8080

# or Node
npx serve .
```
Then visit `http://localhost:8080`.

The service worker requires HTTP(S) — `file://` URLs won't register it. Everything else works fine from a local file.

### Option 3 — Deploy
Drop the three files onto any static host:

| File | Purpose |
|------|---------|
| `index.html` | The entire application |
| `manifest.json` | PWA metadata |
| `sw.js` | Service worker (offline cache) |

Works on **GitHub Pages**, **Netlify**, **Vercel**, **Cloudflare Pages**, or any static host — no configuration needed.

---

## 📱 Installation

### Desktop (Chrome / Edge)
1. Open the app
2. Click the **⬇ Install** button in the header, or the install icon in the address bar
3. Confirm

### Android (Chrome)
1. Open the app
2. Tap **⋮** → **Install app** (or **Add to Home screen**)
3. Confirm

### iOS (Safari)
1. Open the app in Safari
2. Tap the **Share** button
3. Tap **Add to Home Screen**
4. Confirm

Once installed, the app launches in its own window, works entirely offline, and remembers all your settings.

---

## 📖 How to Use

### Basic workflow
1. Pick a **template type** (Assignment / Lab Report / Project)
2. Fill in institution details and upload a logo
3. Enter course code, document type, and title
4. Fill in "Submitted By" (and "Submitted To" for teachers)
5. Adjust **Fit & Scale** if content overflows
6. Export as PDF, PNG, or DOCX

### Making content fit on one page
If the red overflow pill appears below the preview:

- **Auto-Fit is on by default** — it shrinks the entire page slightly until everything fits. The green pill shows the scale it settled on (e.g. "Fits at 87% scale").
- **Fine-tune with the Content Scale slider** — drag right to enlarge, left to shrink. Presets: 60 / 75 / 85 / 100 / 110%.
- **Or reduce font sizes** individually in the *Font Sizes* section for finer control.
- **Or adjust Vertical Spacing** — if you have free space, "Justify" mode distributes it evenly between sections; the density slider controls how aggressively.

### Custom fields
Add a custom field and pick where it goes:

| Anchor | Renders as |
|--------|-----------|
| Own block | A separate block you can drag in the Layout panel |
| Top of page | Above the university name |
| After University / Faculty / Dept | Directly under that line |
| After Logo | Under the logo image |
| After Course / Document Type / Title | Under that element |
| Under "Submitted By" heading | Between the heading and the info table |
| As a row in the info table | `Label : Value` row inside the table |
| End of Submitted By | Below everything in that section |
| After each teacher | Repeated under every teacher in Submitted To |

### Saving & restoring
- **Auto-save**: everything is written to `localStorage` as you type
- **Export Settings** → downloads a `.json` file with the entire state
- **Import Settings** → restores from that `.json`
- **Reset** → wipes everything and returns to defaults

> ⚠️ Export your settings before clearing browser data — `localStorage` is wiped along with the site.

---

## 🔧 Technical Details

### Stack
Zero build step. Everything is vanilla JS + Bootstrap Icons. Dependencies are loaded from CDN:

| Library | Used for |
|---------|----------|
| [Bootstrap 5.3](https://getbootstrap.com) | Layout + form styling |
| [Bootstrap Icons](https://icons.getbootstrap.com) | Icon set |
| [html2pdf.js](https://github.com/eKoopmans/html2pdf.js) | PDF fallback path |
| [html-to-image](https://github.com/bubkoo/html-to-image) | PNG rasterization + primary PDF path |
| [docx](https://github.com/dolanmiu/docx) | Word document generation |

### A4 layout
The preview uses the CSS pixel equivalent of A4 at 96 DPI:

```
794 × 1123 px  →  210 × 297 mm
Content area: 82px margins on all sides → 630 × 959 px
```

Everything is sized in pixels for pixel-perfect preview; export converts to mm for PDF and to EMUs for DOCX.

### Auto-Fit algorithm
When enabled, the content container is measured with `offsetHeight` (unaffected by CSS transforms), then `transform: scale(factor)` is applied where `factor = min(1, contentHeight / 959)`. This is a top-origin scale so the header stays at the top of the page.

### PDF generation
Rather than relying on `html2pdf`'s page-break logic (which introduced a blank second page due to mm-conversion rounding), the primary path:
1. Rasterizes the A4 page to a PNG via `html-to-image`
2. Creates a `jsPDF` document and calls `addImage(img, 0, 0, 210, 297)`
3. Saves — exactly one page, no rounding surprises

### Storage
All app state lives under a single `localStorage` key (`acpg_state_v7`). The logo is stored as a base64 data URI inside the state, so the storage bar in the sidebar shows live usage against the typical 5 MB browser quota.

---

## 🌐 Browser Support

| Browser | Status |
|---------|--------|
| Chrome / Edge (desktop) | ✅ Full support |
| Safari 15+ (macOS) | ✅ Full support |
| Firefox (desktop) | ✅ Full support (PDF export may be slower) |
| Chrome (Android) | ✅ Full support, installable |
| Safari (iOS 15+) | ✅ Full support, installable via Add to Home Screen |
| Firefox (Android) | ⚠️ Works, but PWA install prompt not shown |

Requires `Promise`, `async/await`, CSS Custom Properties, `FileReader`, and `Blob`. That's every browser since 2018.

---

## 🐛 Known Issues & Caveats

- **SVG logos are not embedded in DOCX exports** — DOCX only accepts raster images. Convert your logo to PNG for Word exports. PNG/JPG logos work perfectly.
- **PDF export on iOS Safari** can be slow for large logos. Consider exporting PNG instead and printing from Photos.
- **Custom fonts** beyond the seven built-in choices aren't supported out of the box. Add them to `FONT_FIELDS` in the HTML to extend the list.
- **The service worker caches from `cdn.jsdelivr.net` and `cdnjs.cloudflare.com`.** If those CDNs go down, the app still works offline (cached), but a fresh install without connectivity won't be able to precache.
- **Import is destructive.** Importing a settings file fully replaces the current state. Export first if you want to keep your current setup.

---

## 🛠 Customizing

### Add a font
In `index.html`, find the `f-style-font` `<select>` and add an option:
```html
<option value="'Roboto', sans-serif">Roboto</option>
```
Then add the Google Fonts `<link>` in the `<head>` and add the font to `PRECACHE_URLS` in `sw.js`.

### Add an anchor point for custom fields
In `index.html`, find `CF_ANCHORS` and add a new pair:
```js
['afterFooter', 'After footer text']
```
Then in the corresponding block renderer (e.g. `blockSubmittedToHtml`), insert:
```js
${cfAt('afterFooter')}
```
And in `DOCX_BLOCK_BUILDERS`, add the same in the DOCX builder.

### Change the A4 margins
Find `A4_CONTENT_H` and the `.a4-content-clip` CSS rule — both use `82px`. Change both to the same new value.

---

## 📄 License

MIT — free to use, modify, and distribute.

---

## 🙏 Credits

Built with [Bootstrap](https://getbootstrap.com), [Bootstrap Icons](https://icons.getbootstrap.com), [html2pdf.js](https://github.com/eKoopmans/html2pdf.js), [html-to-image](https://github.com/bubkoo/html-to-image), and [docx](https://github.com/dolanmiu/docx).

Designed with students in mind — because nobody should spend an hour formatting a cover page at 2 a.m.