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

## Things to fill in before going live

- **Contact details and socials**: `CONFIG` at the top of `assets/js/main.js` (WhatsApp number, Instagram,
  Facebook and TikTok URLs, phone, e-mail). Each one appears in the contact section, and the socials also
  appear as round icons in the footer, as soon as its value is set; empty ones stay hidden. Until the
  WhatsApp number is set, the quote form opens WhatsApp without a recipient.
- **Videos**: the three reel tiles in the video section are coloured stand-ins. Put a real `<video>`
  or still inside each `.reel__frame` (see the `TODO client` comment in `index.html`).
- **Logo**: the half-sun mark and the "Viz Zora" wordmark are placeholders for the client's logo.
- **Fonts and icons** load from Google Fonts and unpkg (Phosphor icons). Copy them into `assets/`
  before publishing if the site must not depend on those services.

## Editing text

Every sentence has its Arabic version as the element's text and its French version in `data-fr`:

```html
<h2 data-fr="Parlons de votre projet">لنتحدّث عن مشروعكم</h2>
```

Change both together. The page uses no em-dashes.
