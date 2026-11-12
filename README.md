# Viz Zora · landing page

A static one-page site for Viz Zora, an Algerian communication agency (page management, influencer
campaigns, video), with a digital services pole and academic support. Plain HTML, CSS and JavaScript,
no build step. Arabic (right-to-left) is the default language, French is one tap away.

A 3D phone stands behind the whole page. It follows the scroll, spins when its screen changes, and
shows a different scene for each section: a growing profile, an influencer network, a reel, code,
a thesis being put in order, and a WhatsApp chat. Clicking it throws hearts.

```
index.html            the page (Arabic in the markup, French in data-fr attributes)
assets/css/style.css  all styles: night theme, sunrise gradient, one colour per pillar
assets/js/main.js     intro, language switch, phone menu, reveals, pointer effects, quote form
assets/js/phone.js    the phone: CSS 3D body, canvas screen, orbiting icons, hearts
assets/favicon.svg    browser tab icon
```

## Preview locally

```bash
python -m http.server 5530
```

Then open http://localhost:5530. Add `?lang=fr` to open it in French.

## How the phone is driven

Each section carries two attributes:

- `data-phone`: where the phone stands. `hero`, `start` or `end` (beside the text), `dim` (faded, off to the side).
- `data-mode`: what its screen shows. `feed`, `network`, `reel`, `code`, `doc` or `chat`.

The screens are drawn in `SCREENS` in `assets/js/phone.js`, on a 360 x 780 grid, with shapes only
(no text), so they work in both languages.

## Media

Web-ready files live in `assets/media/` (about 23 MB): the Viz Zora ad at 720p, the voice-over and AI
clips, the Rimene poster, three screenshots from the developer's portfolio, and one poster frame per
video in `assets/media/posters/`. The raw sources (`ad/`, `assets/Iman/`, `assets/Yasmine/`) stay out of
the repository through `.gitignore`.

To add a piece of work, copy a `.work` tile in the `#work` section of `index.html`: `data-cat` is the
filter (`voice`, `ai`, `design`, `code`), `data-kind` is `video` or `image`, `data-src` is the file,
and `--ar` is its width/height. Code projects are plain links.

## Things to fill in before going live

- **Contact details**: `CONFIG` at the top of `assets/js/main.js` (WhatsApp, Instagram, Facebook,
  TikTok, phone, e-mail). Until the WhatsApp number is set, the quote form opens WhatsApp without a
  recipient.
- **Client permission**: the gallery shows ads made for Rimene, Zoom Home, Amnaqe Promotion and a
  clinic. Check each client is happy to appear before promoting the site.
- **Logo**: the half-sun mark and the "Viz Zora" wordmark are placeholders for the real logo.
- **Fonts and icons** load from Google Fonts and unpkg (Phosphor icons).

## Editing text

Every sentence has its Arabic version as the element's text and its French version in `data-fr`:

```html
<h2 data-fr="Parlons de votre projet">لنتحدّث عن مشروعكم</h2>
```

Change both together. The page uses no em-dashes.
