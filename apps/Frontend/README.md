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

**Static-only hosts (S3, nginx, some CDNs):** Publish the **contents of this directory** (`apps/Frontend`) as the **web root**. URLs must resolve as `/index.html` → `/`, `/assets/css/bundle.css`, `/img/…`, etc. For **`contact.html`** you must either deploy a separate API elsewhere and set `<meta name="mtsai:form-endpoint" content="https://…">` to that URL, or use **Vercel** below.

**Vercel (static + intake API):** Use the **repository root** as the Vercel project root (not `apps/Frontend` alone) so [`vercel.json`](../../vercel.json) can serve **`apps/Frontend`** as static output **and** deploy [`api/intake.js`](../../api/intake.js) at **`/api/intake`**. Set environment variables (see Contact form).

**Optional:** `npm run build` runs Vite and outputs a multi-page build to **`dist/`**. Use this only if you rely on Rollup’s HTML pipeline; asset paths in HTML must still match how you serve the site.

After each deploy, run **manual contact QA** (see below) on the **live** origin.

## Contact form

[`contact.html`](contact.html) POSTs JSON to the URL in:

```html
<meta name="mtsai:form-endpoint" content="/api/intake">
```

Use a **path** (same origin on Vercel) or a full **https://…** URL if the API is on another host.

### Vercel + Resend (intake email)

In the Vercel project, set:

| Variable | Example | Purpose |
|----------|---------|---------|
| `RESEND_API_KEY` | `re_…` | [Resend](https://resend.com) API key |
| `INTAKE_TO_EMAIL` | `ssg@miracletraffic.ai` | Recipient(s); comma-separated for multiple |
| `INTAKE_FROM_EMAIL` | `MTSAi Intake <intake@yourdomain.com>` | Must use a **verified domain** in Resend |

Optional **`ALLOWED_ORIGINS`**: comma-separated extra allowed `Origin` values (e.g. a staging URL). Production **`https://mtsai.in`** and **`https://www.mtsai.in`** are always allowed; Vercel preview URLs are allowed automatically when `VERCEL_URL` is present.

### Manual QA (production)

On the **live** origin, test **`contact.html`** once per release:

1. **Government** — full two-step flow, required fields, consent, submit; confirm email received.
2. **Strategic Partner** — territory + experience; submit; confirm delivery.
3. **Public Integrity** — concern detail; submit; confirm delivery.

Check spam if messages are missing. On failure, the form surfaces a fallback to email **ssg@miracletraffic.ai**.
