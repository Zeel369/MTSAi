# MTSAi Design System
**Version 2.0 — Updated March 2026**

> This document reflects the design system as it is actually implemented across all 5 pages. All tokens, patterns, and components described here correspond to live code in `assets/ds.css` and `assets/ds.js`. Keep this document in sync with the codebase.

---

## 1. Brand Foundation

### Creative Direction: Civic Precision
The MTSAi design language communicates **government-grade trust with urban-scale ambition**. The aesthetic sits between a policy dossier and a premium technology platform — authoritative enough for a Secretary of State, capable enough for a Chief Technology Officer.

Every design decision supports one of three signals:
1. **Trust** — this institution is credible and governable
2. **Precision** — this platform is technically rigorous
3. **Scale** — this solution is ready for cities, not pilots

---

## 2. Brand Colors

### Official Palette

| Token | Hex | RGB | Role |
|-------|-----|-----|------|
| **Saffron** | `#FF9933` | rgb(255, 153, 51) | Primary energy · CTAs · accents · highlights |
| **Trust Blue** | `#0052CC` | rgb(0, 82, 204) | Primary authority · interactive states · links |
| **Trust Green** | `#53AA00` | rgb(83, 170, 0) | Active · compliant · success · live states |
| **Alert Red** | `#D82B2B` | rgb(216, 43, 43) | Warnings · errors · prohibited · risk |
| **Black** | `#000000` | rgb(0, 0, 0) | Maximum contrast surfaces |
| **White** | `#FFFFFF` | rgb(255, 255, 255) | Light sections · card surfaces |
| **Gray 100** | `#161616` | rgb(22, 22, 22) | Dark section backgrounds · body bg |
| **Gray 10** | `#F4F4F4` | rgb(244, 244, 244) | Light section backgrounds |

### CSS Custom Properties (ds.css :root)

```css
--navy:        #161616;    /* Gray 100 — dark canvas */
--navy-hi:     #0d1f40;    /* Dark blue intermediate for gradients */
--orange:      #FF9933;    /* Saffron */
--orange-dim:  rgba(255,153,51,.15);
--blue:        #0052CC;    /* Trust Blue */
--blue-mid:    #0052CC;
--green:       #53AA00;    /* Trust Green */
--green-dim:   rgba(83,170,0,.15);
--red:         #D82B2B;    /* Alert Red */
--red-dim:     rgba(216,43,43,.15);
--surface:     #F4F4F4;    /* Gray 10 */
--surface-lo:  #EBEBEB;    /* Slightly darker light surface */
--surface-hi:  #e2e2e2;
--outline:     #737685;
--outline-v:   #c3c6d6;
--on-surface:  #1a1c1c;
```

### Tailwind Config (inline `<script>` in each page)

```js
colors: {
  "brand-orange": "#FF9933",
  "brand-navy":   "#161616",
  "brand-green":  "#53AA00",
  "brand-red":    "#D82B2B",
  "primary":      "#0052CC",
  "surface":      "#F4F4F4",
  "surface-container-low": "#EBEBEB",
  "background":   "#F4F4F4",
  ...
}
```

### Color Role Assignment

**Saffron `#FF9933`** — used for:
- All primary CTA buttons (`bg-brand-orange`)
- Accent lines (`.accent-line`, `border-left: 3px solid`)
- Glow effects (`.glow-o`)
- Eyebrow accent bars
- Border beam animation (start color)
- Shimmer text gradient
- Active nav indicators
- Data labels and callouts

**Trust Blue `#0052CC`** — used for:
- Primary interactive color throughout
- Architecture layer cards (beamed)
- Secondary section tones (architecture, governance)
- Gradient text `.tg-blue`
- Border beam animation (end color)
- Aurora blob fill color
- `dot-bg` pattern
- Progress bar fill (`.pb--blue`)

**Trust Green `#53AA00`** — used for:
- "System Online" pulse dot in nav
- "Live" status indicators
- Phase 1 & 2 "Complete" roadmap dots
- Active state indicators
- Success toast type

**Alert Red `#D82B2B`** — used for:
- "Not Collected" privacy block markers
- Error state indicators
- Form validation errors
- Error toast type

**Gray 100 `#161616`** — used for:
- Body background (`bg-brand-navy`)
- All dark section backgrounds
- Scrollbar track
- Overlay / modal backdrop base

**Gray 10 `#F4F4F4`** — used for:
- Light section backgrounds (`bg-surface`)
- Card surfaces in light contexts
- Scrollbar and contrast layers

**White `#FFFFFF`** — used for:
- High-contrast light sections (every 2–3 sections)
- Card surfaces in bento grids
- Text on dark backgrounds
- Internal card surfaces (`.bg-white`)

---

## 3. Typography

### Font Stack

| Family | Weight | Role |
|--------|--------|------|
| **Space Grotesk** | 700–800 | Section headlines, H1–H3, brand name, CTA labels |
| **Inter** | 300–600 | Body copy, card descriptions, UI text |
| **JetBrains Mono** | 400–500 | Eyebrow labels, data values, status tags, code |

```css
fontFamily: {
  "headline": ["Space Grotesk"],
  "body":     ["Inter"],
  "mono":     ["JetBrains Mono"]
}
```

### Type Scale in Use

| Level | Classes | Size | Use |
|-------|---------|------|-----|
| Hero H1 | `text-5xl md:text-6xl lg:text-7xl` | 48–72px | Page hero only |
| Section H2 | `text-5xl md:text-6xl` | 48–60px | Major section titles |
| Sub-H2 | `text-4xl md:text-5xl` | 36–48px | Secondary sections |
| Card H3 | `text-2xl` | 24px | Card titles |
| Card H4 | `text-xl` / `text-lg` | 20–18px | Card subtitles |
| Body | `text-base` / `text-lg` | 16–18px | All body copy |
| Label | `text-sm` | 14px | Card descriptions |
| Eyebrow | `text-[11px]` mono | 11px | Section eyebrows |
| Micro | `text-[10px]` / `text-[9px]` mono | 10–9px | Data labels, badges |

### Typographic Rules

- **Tracking:** `tracking-tighter` on all Space Grotesk headlines
- **Leading:** `leading-none` or `leading-[.88]` for large headings; `leading-relaxed` / `leading-[1.7]` for body
- **Eyebrow labels:** Always `font-mono uppercase tracking-[.25em]` at 11px, preceded by `.accent-line`
- **Section numbers:** `§01` through `§10` format using the eyebrow style, JetBrains Mono
- **Gradient text:** `.tg-blue` (Trust Blue → light blue), `.tg-gold` (Saffron → amber)
- **Shimmer text:** `.shimmer` — Saffron shimmer sweep for hero headline accent word

---

## 4. Surface Hierarchy & Section Logic

### Dark/Light Alternation Pattern

Sections alternate between dark (brand-navy) and light (white/gray) backgrounds to create natural visual rhythm.

```
Hero         → Dark  (bg-brand-navy, noise, aurora, grid-bg)
§01 Phil.    → Light (bg-surface #F4F4F4, dot-bg)
§02 Problem  → White (bg-white)           ← pure white for contrast reset
§03 IUDM     → Dark  (bg-brand-navy, noise, aurora) ← CORE section, py-44
§04 Arch.    → Light (bg-surface, grid-bg-lt)
§05 Privacy  → White (bg-white)           ← py-40, trust-critical
§06 SuperApp → Dark  (bg-brand-navy, noise, grid-bg)
§07 Caps     → Light (bg-surface, dot-bg)
§08 Govt     → Light (bg-surface, dot-bg)
§09 Roadmap  → Light (bg-surface-container-low #EBEBEB)
§10 FAQ      → White (bg-white)
CTA          → Dark  (ani-grad animated)
```

### Visual Weight Rule

Not all sections are equal. Sections that carry the core argument get more vertical space:

| Priority | Section | Padding |
|----------|---------|---------|
| Critical | §03 IUDM (core differentiator) | `py-44` |
| High | §05 Privacy (trust-critical) | `py-40` |
| Standard | All other sections | `py-32` |
| Compact | §07 Capabilities (tag cloud) | `py-24` |
| Narrow | §10 FAQ | `py-28` |

### Background Texture Layers

Dark sections use layered depth:
1. Base: `bg-brand-navy` (#161616)
2. `.noise` class — SVG fractalNoise at 2% opacity (removes digital flatness)
3. `.grid-bg` or `.dot-bg` pattern at 15–25% opacity
4. `.aurora` — animated radial gradient blobs (Trust Blue + Saffron)

Light sections use:
1. Base: `bg-white` or `bg-surface`
2. `.dot-bg` or `.grid-bg-lt` pattern at 30–60% opacity

---

## 5. Animation System

### Scroll Entrance Animations

#### FadeUp — `.fu` / `.fu.in`
The primary scroll entrance. Elements start `opacity:0; translateY(32px)` and transition to visible on scroll entry.

```css
.fu { opacity:0; transform:translateY(32px); transition:opacity .75s cubic-bezier(.23,1,.32,1), transform .75s ...; }
.fu.in { opacity:1; transform:translateY(0); }
```

**Staggering:** Pass `transition-delay` on individual `.fu` elements:
```html
<span class="fu">Line 1</span>
<span class="fu" style="transition-delay:.09s">Line 2</span>
<span class="fu" style="transition-delay:.18s">Line 3</span>
```

**Hero H1 Rule:** Each headline line must be its own `.fu` element with 90ms offsets. Never apply `.fu` to the `<h1>` element itself.

#### Stagger Container — `[data-stagger]`
Apply `data-stagger="N"` to a container to auto-stagger all direct children via `DS.Stagger.initAll()`. `N` = delay in milliseconds between each child.

```html
<div class="flex flex-wrap gap-3" data-stagger="45">
  <span>Tag 1</span>
  <span>Tag 2</span>
  ...
</div>
```
JS automatically adds `.fu` to children and sets `transitionDelay`. Runs before `DS.FadeUp.initAll()`.

### Progress Bar — `.pb` / `.pb.go`
Width animates from 0 to `var(--w)` on scroll entry via IntersectionObserver.

```html
<div class="pb h-full bg-brand-orange" style="--w:82%" data-p="82"></div>
```

### Counter — `[data-counter]`
Counts from 0 to `data-target` with easing over 2.2s on scroll entry.

```html
<span class="counter" data-counter data-target="1247" data-format="compact"></span>
```
Formats: `currency` ($M/$B), `compact` (K/M), default (localeString + `data-suffix`).

### Named Keyframes

| Name | Effect | Used on |
|------|--------|---------|
| `ab1/ab2/ab3` | Aurora blob drift | `.ab` elements in dark sections |
| `beam-r` | Conic gradient rotation | `.beam::before` border effect |
| `grad-shift` | Gradient position shift | `.ani-grad` hero/CTA backgrounds |
| `sh` | Shimmer sweep L→R | `.shimmer` headline text |
| `ping` | Scale pulse | `.pulse-dot::before` status dots |
| `float` | Vertical oscillation | `.float` hero panel |
| `met` | Meteor diagonal fall | `.meteor` elements |
| `mq` | Marquee scroll | `.mq` / `.tick` strips |
| `blink` | Cursor blink | `.cursor` terminal element |
| `ds-skelShim` | Skeleton loading sweep | `.ds-skel-line` |
| `ds-sheetIn/Out` | Sheet slide up/down | `.ds-sheet-panel` |
| `spin` | Form submit spinner | `.btn-loading::after` |

### Transition Tokens

```css
--trans-fast: 150ms cubic-bezier(.4,0,.2,1)
--trans-base: 250ms cubic-bezier(.4,0,.2,1)
--trans-slow: 400ms cubic-bezier(.23,1,.32,1)
```

---

## 6. Interactive Components

All components live in `assets/ds.css` (CSS) and `assets/ds.js` (behavior). Classes use the `ds-` prefix. Auto-initialized on `DOMContentLoaded`.

### Component Inventory

| Component | CSS Class | JS Module | Notes |
|-----------|-----------|-----------|-------|
| Accordion | `.ds-acc` | `DS.Accordion` | Single or multi-open; light variant `.ds-acc--light` |
| Alert/Banner | `.ds-alert` | `DS.Alert` | Dismissible; types: info/success/warning/error |
| Avatar | `.ds-avatar` | — | Sizes: `--sm/md/lg/xl`; `.ds-avatar-group` for stacked |
| Badge | `.ds-badge` | — | `--info/success/warning/error` |
| Breadcrumb | `.ds-breadcrumb` | — | Separator auto-generated via CSS |
| Carousel | `.ds-carousel` | `DS.Carousel` | Drag/swipe; dot navigation |
| Command Palette | `.ds-command` | `DS.Command` | Cmd+K trigger; search filtering; keyboard nav |
| Comparison Table | `.ds-cmp` | — | Light/dark rows; check/cross cells |
| Data Table | `.ds-dt-wrap > .ds-dt` | `DS.DataTable` | Click-to-sort columns; `data-sort` state; `--lt` variant |
| Dialog/Modal | `[data-dialog]` | `DS.Dialog` | Focus trap; Escape close; backdrop click close |
| Dropdown Menu | `.ds-dropdown` | `DS.Dropdown` | Arrow key nav; outside close; `--right` placement |
| Feature Card | `.ds-feat` | — | Icon + title + body |
| Form Elements | `.ds-input/.ds-select/.ds-textarea/.ds-check/.ds-radio` | `DS.Form` | Live validation; error messages |
| Job Card | `.ds-job` | `DS.Jobs` | Accordion-style; one-open-at-a-time |
| Pagination | `.ds-page` | — | `.ds-page-btn`; `.active`; `--lt` variant |
| Popover | `.ds-popover` | `DS.Popover` | Click toggle; `--right/--top`; Escape close |
| Progress Bar (linear) | `.ds-progress` | — | `--w` CSS var; fill color variants; label |
| Progress Steps | `.ds-steps` | — | Numbered step indicator |
| Section Header | `.ds-sec-eyebrow/.ds-sec-title/.ds-sec-body` | — | `--lt` variants for light sections |
| Separator | `.ds-sep` | — | `.ds-sep--v` (vertical); `.ds-sep--label` |
| Sheet/Drawer | `.ds-sheet-panel` | `DS.Sheet` | `data-sheet-open/close`; `--right` variant; body scroll lock |
| Skeleton | `.ds-skel-line/.ds-skel-box` | — | Shimmer loading placeholders |
| Stat Card | `.ds-stat` | — | Large number + label + optional delta |
| Tabs | `.ds-tabs` | `DS.Tabs` | Underline + pill variants; keyboard nav |
| Team Card | `.ds-team-card` | — | Avatar + name + title + bio |
| Toast | `.ds-toast` | `DS.Toast` | `DS.Toast.success/error/warning/info(title, msg, duration)` |
| Toggle/Switch | `.ds-toggle-wrap` | `DS.Toggle` | Checkbox-driven; `data-toggle-target`; `--lt` variant |
| Tooltip | `.ds-tip` | — | CSS-only; `data-tip` attribute |

### Boot Sequence (ds.js)

```js
document.addEventListener('DOMContentLoaded', () => {
  DS.Nav.init();          DS.ScrollBar.init();
  DS.Accordion.initAll(); DS.Dialog.init();
  DS.Tabs.initAll();      DS.Command.init();
  DS.Toast.init();        DS.Carousel.initAll();
  DS.Alert.init();        DS.Spotlight.init();
  DS.Counter.initAll();   DS.ProgressBar.initAll();
  DS.Stagger.initAll();   // ← must run before FadeUp
  DS.FadeUp.initAll();    DS.Jobs.init();
  DS.Popover.init();      DS.Sheet.init();
  DS.Toggle.init();       DS.Dropdown.init();
  DS.DataTable.initAll(); DS.ChapterNav.init();
});
```

---

## 7. Page-Level Patterns

### Section Anatomy

Every content section follows this structure:

```html
<section class="py-32 px-6 md:px-10 [bg-class]" id="[id]"
         data-chapter="§0N" data-chapter-title="Section Name">
  <div class="max-w-7xl mx-auto">
    <!-- Section header block -->
    <div class="fu mb-16">
      <span class="accent-line"></span>
      <span class="font-mono text-[11px] uppercase tracking-[.25em] [text-color] block mb-4">
        Eyebrow Label
      </span>
      <h2 class="text-5xl md:text-6xl font-headline font-bold tracking-tighter [text-color] leading-none">
        §0N. Section Title
      </h2>
    </div>
    <!-- Content grid -->
  </div>
</section>
```

### Sticky Chapter Indicator

Every section with `data-chapter` and `data-chapter-title` is tracked by `DS.ChapterNav`. A fixed bottom-left pill updates as the user scrolls:

```html
<!-- Placed just before </body> on index.html -->
<div id="chapter-nav">
  <div class="chapter-label">
    <span class="chapter-id"></span>
    <span class="chapter-sep">·</span>
    <span class="chapter-name"></span>
  </div>
</div>
```

Implemented on: `index.html` (§01–§10). Extend to other pages by adding `data-chapter` attributes to their sections.

### Card Spotlight Effect

Cards with `.spot` class track cursor position and emit a radial glow:

```css
.spot::after {
  background: radial-gradient(circle 280px at var(--mx,50%) var(--my,50%),
    rgba(255,153,51,.08) 0%, transparent 70%);
}
.spot:hover { transform: translateY(-4px); }
```

JS (`DS.Spotlight`) sets `--mx` and `--my` CSS variables via `mousemove`.

### Border Beam

Cards with `.beam` animate a conic gradient border that sweeps Saffron → Trust Blue:

```css
.beam::before {
  background: conic-gradient(from var(--ba),
    transparent 0deg, #FF9933 60deg, #0052CC 120deg, transparent 180deg);
  animation: beam-r 3s linear infinite;
}
```

### Animated Gradient Background (`.ani-grad`)

Used on hero and CTA sections. Animates between Gray 100 and Trust Blue:

```css
/* index.html hero/CTA */
background: linear-gradient(270deg, #161616, #0d1f40, #0052CC, #161616);
background-size: 400% 400%;
animation: grad-shift 12s ease infinite;

/* Other pages (simpler static version) */
background: linear-gradient(160deg, #161616 0%, #0d1f40 50%, #161616 100%);
```

### CTA Button Anatomy

Primary CTA (Saffron fill):
```html
<button class="group relative px-9 py-4 bg-brand-orange text-white
               font-headline font-bold uppercase tracking-widest text-[11px]
               overflow-hidden glow-o flex items-center gap-2">
  <span class="relative z-10">Label</span>
  <span class="material-symbols-outlined relative z-10 text-sm
               group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
  <!-- Fill animation overlay -->
  <div class="absolute inset-0 bg-white/15 translate-y-full
              group-hover:translate-y-0 transition-transform duration-300"></div>
</button>
```

Secondary CTA (ghost with fill):
```html
<a class="group relative px-9 py-4 font-headline font-bold uppercase
          tracking-widest text-[11px] text-white/70 hover:text-white
          flex items-center gap-2 overflow-hidden transition-colors"
   style="border:1px solid rgba(255,255,255,.12)">
  <span class="relative z-10">Label</span>
  <div class="absolute inset-0 bg-white/8 translate-y-full
              group-hover:translate-y-0 transition-transform duration-300"></div>
</a>
```

### Form Submit Loading State

Add `.btn-loading` to the submit button during async form submission. A CSS spinner appears via `::after` pseudoelement:

```js
btn.classList.add('btn-loading');   // on submit
btn.classList.remove('btn-loading'); // in finally block
```

---

## 8. Engagement Patterns

These interaction patterns were added to elevate perceived quality beyond a standard layout.

### Per-Line Hero Stagger
Hero `<h1>` lines each get individual `.fu` with 90ms offsets:

```html
<h1 class="... tracking-tighter leading-[.88]">
  <span class="text-white block fu">Line One</span>
  <span class="text-white block fu" style="transition-delay:.09s">Line Two</span>
  <span class="shimmer block fu" style="transition-delay:.18s">Line Three</span>
  <span class="text-white block fu" style="transition-delay:.28s">Subtitle.</span>
</h1>
```

### Capability Tag / Chip Stagger
Tag cloud containers use `data-stagger` for sequential chip entry:

```html
<div class="flex flex-wrap gap-3" data-stagger="45">
  <span class="px-5 py-2.5 bg-white ...">Tag</span>
  ...
</div>
```

### Eyebrow Label Standard
All section eyebrow labels follow this exact pattern:

```html
<span class="accent-line"></span>
<span class="font-mono text-[11px] uppercase tracking-[.25em] text-outline block mb-4">
  Eyebrow Text
</span>
```

The CSS rule `.accent-line + span { font-size: 11px; font-weight: 500; }` in each page's `<style>` block ensures consistent sizing without touching every instance.

---

## 9. Do's and Don'ts

### Do

- **Do use `py-44`/`py-40` on your most important dark sections.** More vertical space = more importance. The IUDM section (§03) gets `py-44` because it is the core differentiator.
- **Do alternate white sections with gray sections.** Pure `bg-white` sections act as visual resets. Use them every 2–3 sections, not uniformly.
- **Do stagger grid items.** Any grid of 3+ equal cards should use `data-stagger` or manual `transition-delay` so cards cascade in rather than appearing as a block.
- **Do apply `.fu` to each H1 line individually.** One `.fu` on the `<h1>` tag makes the whole headline enter at once — low impact. Line-by-line stagger feels assembled.
- **Do use the chapter indicator on long pages.** Add `data-chapter="§0N" data-chapter-title="Name"` to every `<section>` on pages with 6+ sections.
- **Do use Saffron for CTAs only.** Saffron should primarily appear on interactive calls to action (buttons, links). Overusing it as a general highlight dilutes its signal.
- **Do use Trust Blue for authority signals.** Architecture layers, governance structures, and institutional credibility moments should use `#0052CC`.
- **Do use JetBrains Mono for all data labels.** Numbers, status tags, eyebrows, badges — all monospace. This creates a distinct textural layer separate from body text.
- **Do apply `.noise` to dark sections.** The SVG noise texture at 2% removes the "too digital" flatness and adds material quality.

### Don't

- **Don't apply `.fu` to container elements** that hold many children. Apply it to individual cards/elements for precise control.
- **Don't use Tailwind's built-in `green-*` or `red-*` scale.** Always use `brand-green` / `brand-red` so colors stay on-brand.
- **Don't invent new hex values.** All colors must come from the 8-color brand palette. If you need a transparency variant, use `rgba()` or Tailwind's `/opacity` modifier on an existing brand color.
- **Don't use equal `py-32` on every section.** Uniform padding creates a flat, undifferentiated rhythm. Vary padding intentionally.
- **Don't center-align body text** beyond 3 lines. Section headings may be centered; body paragraphs and card text should be left-aligned.
- **Don't put borders around section containers.** Structural boundaries are defined by background color shifts, not strokes.
- **Don't use `#FFD700` (gold).** It is not in the brand palette. The shimmer, beam, and gradient text all use Saffron (`#FF9933`) and amber (`#FFB347`) variants instead.
- **Don't use `#031133` or `#FF7A00`.** These were the pre-brand-audit colors. They no longer appear anywhere in the codebase and must not be reintroduced.

---

## 10. File Architecture

```
trial/
├── index.html          Main landing page (§01–§10, 12 sections)
├── about.html          Company story (9 sections)
├── government.html     Policy brief (9 sections)
├── careers.html        Recruitment hub (5 sections)
├── solutions.html      Technical documentation (9 sections)
├── DESIGN.md           This document
└── assets/
    ├── ds.css          Component library (1,200+ lines)
    │                   — CSS custom properties
    │                   — 28 component definitions
    │                   — Keyframe animations
    │                   — Chapter indicator
    ├── ds.js           Behavior library (780+ lines)
    │                   — 20 JS modules (DS.*)
    │                   — DOMContentLoaded boot sequence
    │                   — IntersectionObserver patterns
    └── (no build step) — Pure Tailwind CDN + vanilla JS
```

### Dependency Stack

| Dependency | Source | Purpose |
|------------|--------|---------|
| Tailwind CSS v3 | CDN (`cdn.tailwindcss.com`) | Utility classes |
| Space Grotesk | Google Fonts | Headline font |
| Inter | Google Fonts | Body font |
| JetBrains Mono | Google Fonts | Label/mono font |
| Material Symbols Outlined | Google Fonts | Icons |
| Formspree | External API | Form submission endpoint |

No npm, no build pipeline, no framework. All pages open directly in a browser.

---

## 11. Gap Analysis — Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| Accordion | ✅ Built | Light + dark variants |
| Alert/Banner | ✅ Built | 4 types |
| Avatar | ✅ Built | 4 sizes + group stack |
| Badge | ✅ Built | 4 semantic types |
| Breadcrumb | ✅ Built | CSS only |
| Carousel | ✅ Built | Drag/swipe |
| Command Palette | ✅ Built | Cmd+K |
| Comparison Table | ✅ Built | — |
| Data Table | ✅ Built | Sortable columns |
| Dialog/Modal | ✅ Built | Focus trap |
| Dropdown Menu | ✅ Built | Keyboard nav |
| Feature Card | ✅ Built | — |
| Form Elements | ✅ Built | Live validation |
| Job Card | ✅ Built | Accordion-style |
| Pagination | ✅ Built | Light + dark |
| Popover | ✅ Built | 3 placement variants |
| Progress Bar (linear) | ✅ Built | Color variants |
| Progress Steps | ✅ Built | — |
| Section Header | ✅ Built | Light + dark |
| Separator | ✅ Built | Horizontal + vertical + label |
| Sheet/Drawer | ✅ Built | Bottom + right slide |
| Skeleton | ✅ Built | Shimmer animation |
| Stat Card | ✅ Built | — |
| Tabs | ✅ Built | Underline + pill |
| Team Card | ✅ Built | — |
| Toast | ✅ Built | 4 types + auto-dismiss |
| Toggle/Switch | ✅ Built | Checkbox-driven |
| Tooltip | ✅ Built | CSS only |
| Calendar | ⬜ Not built | Future: booking/scheduling UI |
| Date Picker | ⬜ Not built | Future: form date inputs |
| Context Menu | ⬜ Not built | Future: right-click menus |
| Notification Center | ⬜ Not built | Future: activity feed |
