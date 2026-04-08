# MTSAi Frontend (static site)

## CSS bundle

Design-system sources live under `assets/design-system/`. The shipped file is **`assets/css/bundle.css`**, built by concatenating those sources.

Before deploy (or after editing any `assets/design-system/**/*.css` file), run from this directory:

```bash
npm run build:css
```

This runs `python3 ../../scripts/build_frontend_bundle.py` and regenerates `assets/css/bundle.css`.

## Page shell

Pages load **`assets/css/bundle.css`** then **`assets/css/page-shell.css`**. The shell imports **`premium-enhancements.css`** from the same folder. Ensure all three files deploy together so `@import url("premium-enhancements.css")` resolves.

## Launch assets

| File | Purpose |
|------|---------|
| `robots.txt` | Crawler rules; serve at site root `/robots.txt` |
| `sitemap.xml` | Search engines; serve at `/sitemap.xml` (URL declared in `robots.txt`) |
| `404.html` | Configure the host to use as the not-found page (e.g. Cloudflare Pages **404 handling**, S3 **Error document**, nginx `error_page 404`) |

## Contact form

[`contact.html`](contact.html) posts to Formspree. The endpoint is set via:

```html
<meta name="mtsai:form-endpoint" content="https://formspree.io/f/…">
```

Override `content` if you use a different Formspree form.
