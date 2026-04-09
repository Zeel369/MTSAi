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
| `sitemap.xml` | Search engines; serve at `/sitemap.xml` (URL declared in `robots.txt`). Canonical home is `https://mtsai.in/` only (no duplicate `index.html` entry). |
| `404.html` | Configure the host to use as the not-found page (e.g. Cloudflare Pages **404 handling**, S3 **Error document**, nginx `error_page 404`) |
| `img/og-cover.png` | Open Graph / Twitter card image (`1200×630`); referenced as `https://mtsai.in/img/og-cover.png` in page meta |

Before deploy, run **`npm run predeploy`** (rebuilds `bundle.css` and runs internal + external link checks). **GitHub Actions** runs the same command on pushes and PRs to **`main`** ([`.github/workflows/link-check.yml`](../../.github/workflows/link-check.yml)).

## Deploy

**Recommended:** Publish the **contents of this directory** (`apps/Frontend`) as the **web root** on your host (e.g. Cloudflare Pages, Netlify, S3 static website, nginx `root`). URLs must resolve as `/index.html` → `/`, `/assets/css/bundle.css`, `/img/…`, etc., with **no** extra path prefix.

**Optional:** `npm run build` runs Vite and outputs a multi-page build to **`dist/`**. Use this only if you rely on Rollup’s HTML pipeline; asset paths in HTML must still match how you serve the site. Most deployments use the **folder as-is** without running Vite.

After each deploy, run **manual contact QA** (see below) on the **live** origin.

## Contact form

[`contact.html`](contact.html) posts to Formspree. The endpoint is set via:

```html
<meta name="mtsai:form-endpoint" content="https://formspree.io/f/…">
```

Override `content` if you use a different Formspree form.

### Manual QA (production)

On **`https://mtsai.in`** (or your production origin), test **`contact.html`** once per release:

1. **Government** — full two-step flow, required fields, consent, submit; confirm message in Formspree inbox.
2. **Strategic Partner** — include territory + experience fields; submit; confirm delivery.
3. **Public Integrity** — include concern detail; submit; confirm delivery.

Check spam if messages are missing. On failure, the form surfaces a fallback to email **ssg@miracletraffic.ai**.
