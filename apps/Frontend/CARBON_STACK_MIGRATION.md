# Carbon Ultimate Stack — Migration Instructions for Claude Code

> **Purpose:** These instructions tell Claude Code exactly how to audit an existing IBM Carbon React project and upgrade it to the Ultimate Stack. Read this file fully before making any changes. Follow each phase in order.

---

## Stack Definition

This is the target stack. Every decision in this document maps back to these seven layers.

| Layer | Package(s) | Role |
|-------|-----------|------|
| 01 · Core | `@carbon/react` `@carbon/icons-react` `@carbon/tokens` | Base component system |
| 02 · Styling | `sass` + Carbon SCSS | Theming engine (White theme) |
| 03a · Animation engine | `@react-spring/web` | Physics-based spring animations |
| 03b · Transitions | `useTransition` (built into `@react-spring/web`) | Mount/unmount list animations |
| 03c · Sequencing | `useChain` (built into `@react-spring/web`) | Staggered choreography |
| 03d · Gestures | `@use-gesture/react` | Drag, scroll, pinch interactions |
| 04 · Data viz | `@carbon/charts-react` `@carbon/charts` `d3` | IBM-native charts |
| 05 · State | `zustand` `immer` | Global state management |
| 06 · Framework | `next` (App Router) | SSR, RSC, routing |

---

## Before You Start

### Read the project first

Before touching any file, run the following audit and report findings:

```bash
# 1. Check current package.json dependencies
cat package.json

# 2. Check what animation library is currently installed
grep -r "framer-motion\|react-spring\|react-transition" package.json

# 3. Check current Carbon version
grep "@carbon" package.json

# 4. Check if SASS is set up
find . -name "*.scss" -not -path "*/node_modules/*" | head -20

# 5. Check current Next.js version and router type
grep '"next"' package.json
grep -r "app\|pages" --include="*.tsx" --include="*.ts" -l | grep -v node_modules | head -10
```

Report what you find before proceeding. If anything is ambiguous, ask the user before continuing.

---

## Phase 1 — Install Missing Packages

Only install packages that are not already present. Check `package.json` before running any install command.

```bash
# Layer 01 — Carbon core (check first, may already be installed)
npm install @carbon/react @carbon/icons-react @carbon/tokens

# Layer 02 — SASS
npm install --save-dev sass

# Layer 03 — React Spring (all four)
npm install @react-spring/web
npm install @use-gesture/react        # optional but recommended

# Layer 04 — Carbon Charts
npm install @carbon/charts-react @carbon/charts d3

# Layer 05 — State
npm install zustand immer

# Verify install succeeded
npm ls @react-spring/web @carbon/react zustand
```

**If the project already has `framer-motion`:** Do NOT remove it automatically. Flag it to the user and ask whether to keep it alongside React Spring or remove it. Removing it may break existing animations.

---

## Phase 2 — Create the Shared Springs Config

Create this file at `lib/springs.ts` (or `src/lib/springs.ts` depending on the project's folder structure). If the `lib/` directory does not exist, create it.

```ts
// lib/springs.ts
// Shared React Spring physics configs mapped to Carbon's two motion modes.
// Import carbonSprings everywhere instead of hardcoding tension/friction values.

export const carbonSprings = {
  // Productive — fast, task-focused, no bounce.
  // Use for: dropdowns, toggles, tooltips, row expand, tab switches.
  productive: { tension: 300, friction: 30, mass: 0.8 },

  // Expressive — noticeable, smooth, for significant UI moments.
  // Use for: page transitions, modals opening, hero section reveals.
  expressive: { tension: 180, friction: 26, mass: 1 },

  // Micro — instant, tight feedback.
  // Use for: button press, icon state change, focus ring flash.
  micro: { tension: 500, friction: 40, mass: 0.5 },
} as const

export type SpringMode = keyof typeof carbonSprings
```

---

## Phase 3 — Set Up Global Styles

### 3.1 — Find or create the global SCSS entry point

Look for an existing global stylesheet in this order:
1. `app/globals.scss`
2. `src/app/globals.scss`
3. `styles/globals.scss`
4. `src/styles/globals.scss`

If none exists, create `app/globals.scss`.

### 3.2 — Add Carbon SCSS imports

The imports must appear at the **top** of the global stylesheet, before any custom styles. Do not duplicate if already present.

```scss
// ─── Carbon base styles ───────────────────────────────────────────────────
@use '@carbon/react/scss/globals/scss/styles';

// ─── Carbon Charts ────────────────────────────────────────────────────────
// Import separately as it ships its own CSS
// (handled via CSS import in layout.tsx — see Phase 4)

// ─── Your custom overrides go below ───────────────────────────────────────
```

### 3.3 — Verify globals.scss is imported in layout

Check `app/layout.tsx` (or `src/app/layout.tsx`). It must import the global stylesheet. Add if missing:

```tsx
// At the very top of layout.tsx, before any other imports
import './globals.scss'
import '@carbon/charts/styles.css'
```

---

## Phase 4 — Update Root Layout

Open `app/layout.tsx`. Apply the following changes:

### 4.1 — Required imports at the top

```tsx
import './globals.scss'                    // Carbon SCSS + your overrides
import '@carbon/charts/styles.css'         // Carbon Charts CSS
import { Theme } from '@carbon/react'
```

### 4.2 — Wrap children in Carbon Theme

The `<Theme>` component must wrap all children. Use `theme="white"` for the light theme.

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Theme theme="white">
          {children}
        </Theme>
      </body>
    </html>
  )
}
```

**Important:** `<Theme>` is a Carbon client component. If your layout.tsx is a Server Component (default in Next.js App Router), you must either:
- Add `'use client'` to layout.tsx (simplest), OR
- Extract `<Theme>` into a separate `app/providers.tsx` client component and import that in layout.

Preferred pattern (avoids making the whole layout a client component):

```tsx
// app/providers.tsx
'use client'
import { Theme } from '@carbon/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return <Theme theme="white">{children}</Theme>
}
```

```tsx
// app/layout.tsx  — stays a Server Component
import './globals.scss'
import '@carbon/charts/styles.css'
import { Providers } from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

---

## Phase 5 — Create Animation Utilities

Create these utility components. Place them in `components/motion/` or `src/components/motion/`.

### 5.1 — `AnimatedPanel.tsx` — slide-in panel wrapper

```tsx
// components/motion/AnimatedPanel.tsx
'use client'
import { animated, useSpring } from '@react-spring/web'
import { carbonSprings } from '@/lib/springs'
import type { ReactNode } from 'react'

interface AnimatedPanelProps {
  open: boolean
  direction?: 'right' | 'left' | 'up' | 'down'
  children: ReactNode
}

const offsets: Record<NonNullable<AnimatedPanelProps['direction']>, string> = {
  right: 'translateX(32px)',
  left:  'translateX(-32px)',
  up:    'translateY(-32px)',
  down:  'translateY(32px)',
}

export function AnimatedPanel({ open, direction = 'right', children }: AnimatedPanelProps) {
  const spring = useSpring({
    opacity:   open ? 1 : 0,
    transform: open ? 'translateX(0px) translateY(0px)' : offsets[direction],
    config: carbonSprings.expressive,
  })
  return <animated.div style={spring}>{children}</animated.div>
}
```

### 5.2 — `AnimatedList.tsx` — mount/unmount list items

```tsx
// components/motion/AnimatedList.tsx
'use client'
import { animated, useTransition } from '@react-spring/web'
import { carbonSprings } from '@/lib/springs'
import type { ReactNode } from 'react'

interface AnimatedListProps<T> {
  items: T[]
  keyFn: (item: T) => string | number
  renderItem: (item: T) => ReactNode
}

export function AnimatedList<T>({ items, keyFn, renderItem }: AnimatedListProps<T>) {
  const transitions = useTransition(items, {
    keys: keyFn,
    from:  { opacity: 0, height: 0, transform: 'translateY(-8px)' },
    enter: { opacity: 1, height: 'auto', transform: 'translateY(0px)' },
    leave: { opacity: 0, height: 0, transform: 'translateY(-8px)' },
    config: carbonSprings.productive,
  })
  return (
    <>
      {transitions((style, item) => (
        <animated.div style={{ overflow: 'hidden', ...style }}>
          {renderItem(item)}
        </animated.div>
      ))}
    </>
  )
}
```

### 5.3 — `StaggeredGrid.tsx` — dashboard card entrance

```tsx
// components/motion/StaggeredGrid.tsx
'use client'
import { animated, useTrail } from '@react-spring/web'
import { carbonSprings } from '@/lib/springs'
import type { ReactNode, CSSProperties } from 'react'

interface StaggeredGridProps {
  items: ReactNode[]
  style?: CSSProperties
}

export function StaggeredGrid({ items, style }: StaggeredGridProps) {
  const trail = useTrail(items.length, {
    from: { opacity: 0, y: 16 },
    to:   { opacity: 1, y: 0 },
    config: carbonSprings.productive,
    // 20ms stagger — matches Carbon choreography spec exactly
    delay: (i: number) => i * 20,
  })
  return (
    <div style={style}>
      {trail.map((springStyle, i) => (
        <animated.div key={i} style={springStyle}>
          {items[i]}
        </animated.div>
      ))}
    </div>
  )
}
```

### 5.4 — `DraggableCard.tsx` — gesture-driven card (optional)

Only create this if `@use-gesture/react` is installed.

```tsx
// components/motion/DraggableCard.tsx
'use client'
import { animated, useSpring } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { carbonSprings } from '@/lib/springs'
import type { ReactNode } from 'react'

export function DraggableCard({ children }: { children: ReactNode }) {
  const [{ x, y }, api] = useSpring(() => ({ x: 0, y: 0, config: carbonSprings.productive }))

  const bind = useDrag(({ offset: [ox, oy], last }) => {
    api.start(last ? { x: 0, y: 0 } : { x: ox, y: oy, immediate: true })
  })

  return (
    <animated.div {...bind()} style={{ x, y, touchAction: 'none', cursor: 'grab' }}>
      {children}
    </animated.div>
  )
}
```

---

## Phase 6 — Update Existing Animation Code

### 6.1 — Replacing Framer Motion patterns

If the project currently uses Framer Motion, apply these replacements:

| Framer Motion pattern | React Spring equivalent |
|----------------------|------------------------|
| `<motion.div animate={{ opacity: 1 }}>` | `<animated.div style={useSpring({ opacity: 1 })}>` |
| `<AnimatePresence>` mount/unmount | `useTransition` from `@react-spring/web` |
| `variants` + `staggerChildren` | `useTrail` from `@react-spring/web` |
| `whileHover={{ scale: 1.02 }}` | `useSpring` with hover state via `onMouseEnter`/`onMouseLeave` |
| `transition={{ duration: 0.15, ease: [0.2,0,0.38,0.9] }}` | `config: carbonSprings.productive` |
| `transition={{ duration: 0.4 }}` | `config: carbonSprings.expressive` |

**Do not refactor existing Framer Motion code automatically.** Only replace when:
1. The user explicitly asks you to refactor a specific component, OR
2. You are creating a new component that needs animation

### 6.2 — What NOT to animate

Carbon handles these internally. Do not add React Spring to them:

- `Button` hover/active/focus states
- `Dropdown` open/close
- `Toggle` switch
- `Loading` skeleton pulse
- `DataTable` sort shuffle
- `Tooltip` fade
- `Modal` (use `@carbon/ibm-products` `Tearsheet` instead for animated modals)
- `InlineNotification` fade (Carbon does this)

Only add React Spring to **layout-level** transitions that Carbon doesn't own:
- Page route transitions
- Custom side panels / drawers you build yourself
- Dashboard card entrance on first load
- Notification stacks you manage yourself with a state array
- Drag-to-reorder lists
- Hero section content reveals

---

## Phase 7 — Set Up Zustand State

Create a base store structure. If stores already exist in the project, do not overwrite — only add the structure below if no store exists.

```ts
// store/index.ts
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface AppState {
  // UI state
  sideNavOpen: boolean
  theme: 'white' | 'g10' | 'g90' | 'g100'
  // Actions
  toggleSideNav: () => void
  setTheme: (theme: AppState['theme']) => void
}

export const useAppStore = create<AppState>()(
  immer((set) => ({
    sideNavOpen: false,
    theme: 'white',
    toggleSideNav: () => set((state) => { state.sideNavOpen = !state.sideNavOpen }),
    setTheme: (theme) => set((state) => { state.theme = theme }),
  }))
)
```

---

## Phase 8 — Verify `next.config.ts`

Open `next.config.ts` (or `next.config.js`). Ensure `@carbon/react` is in `transpilePackages`. If the field does not exist, add it:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@carbon/react', '@carbon/icons-react', '@carbon/charts-react'],
  // Keep any existing config keys — do not remove them
}

export default nextConfig
```

**Do not remove any existing keys from `next.config.ts`.** Only add `transpilePackages` if it's missing, or append Carbon packages to an existing array.

---

## Phase 9 — TypeScript Config Check

Check `tsconfig.json` for a path alias. If `@/*` is not mapped, add it:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

This enables `import { carbonSprings } from '@/lib/springs'` throughout the project.

---

## Brand & Theming Rules

### Carbon White theme token reference

These are the correct light theme values. Use them whenever writing custom CSS or inline styles — never hardcode arbitrary hex values.

| Token | Value | Use |
|-------|-------|-----|
| `--cds-background` | `#ffffff` | Page background |
| `--cds-layer-01` | `#f4f4f4` | Cards, side nav |
| `--cds-layer-02` | `#ffffff` | Panels on layer-01 |
| `--cds-text-primary` | `#161616` | All body text |
| `--cds-text-secondary` | `#525252` | Labels, captions |
| `--cds-interactive` | `#0f62fe` | Links, focus rings |
| `--cds-button-primary` | `#0f62fe` | Primary buttons |
| `--cds-border-subtle-01` | `#e0e0e0` | Dividers, card borders |
| `--cds-border-strong-01` | `#8d8d8d` | Input underlines |
| `--cds-support-success` | `#198038` | Success states |
| `--cds-support-warning` | `#f1c21b` | Warning states |
| `--cds-support-error` | `#da1e28` | Error states |
| `--cds-support-info` | `#0043ce` | Info states |

### IBM Plex typography

Carbon uses IBM Plex exclusively. If the project imports other fonts, flag this to the user. Do not remove other fonts automatically — just note the conflict.

```tsx
// In layout.tsx or a _document equivalent
import { IBM_Plex_Sans, IBM_Plex_Mono, IBM_Plex_Serif } from 'next/font/google'

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-sans',
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-ibm-plex-mono',
})
```

### Motion rules (Carbon compliance)

React Spring configs must honour these IBM motion constraints:

- **No bounce.** Spring configs must have `friction` high enough that the animation never overshoots. Test: `tension / (2 * sqrt(tension * mass)) < friction` should be true for no bounce.
- **Productive motion is faster than expressive.** Never use `expressive` config for a micro-interaction.
- **No diagonal paths.** When animating both `x` and `y`, stagger them: animate `x` first, then `y` after a small delay. Never animate both simultaneously in a straight diagonal.
- **Stagger maximum 500ms total.** If staggering N items at 20ms each, ensure `N * 20ms ≤ 500ms`. For large lists, cap the stagger and let the rest animate together.

---

## Common Mistakes to Avoid

| Mistake | Correct approach |
|---------|-----------------|
| Wrapping a Carbon component directly with `animated()` | Wrap the output `<div>` around the Carbon component instead |
| Using `animated.button` around `<Button>` | Use `<animated.div><Button/></animated.div>` |
| Adding `useSpring` to a toggle or dropdown | Carbon already animates these — leave them alone |
| Using `height: 'auto'` in `useSpring` (breaks) | Use `useTransition` with `height: 0` → `height: 'auto'` pattern, or use a ref to measure the actual height |
| Animating `display: none` → `display: block` | Opacity + height approach; React Spring cannot animate the `display` property |
| Importing from `framer-motion` and `@react-spring/web` in the same component | Pick one per component. Mixing them in one component creates conflicting RAF loops |
| Removing `'use client'` from animation components | All React Spring hooks require a client component. Every file using `useSpring`, `useTransition`, `useTrail`, or `useChain` must have `'use client'` at the top |

---

## Final Checklist

Run through this after completing all phases:

- [ ] `package.json` contains all seven stack layers
- [ ] `lib/springs.ts` exists with all three configs
- [ ] `app/globals.scss` imports `@carbon/react/scss/globals/scss/styles`
- [ ] `app/layout.tsx` imports `globals.scss` and `@carbon/charts/styles.css`
- [ ] `<Theme theme="white">` wraps all children in layout
- [ ] `next.config.ts` has Carbon packages in `transpilePackages`
- [ ] `tsconfig.json` has `@/*` path alias
- [ ] All animation utility components are in `components/motion/`
- [ ] `store/index.ts` exists with base Zustand store
- [ ] No custom hex colours used in new code — only `var(--cds-*)` tokens
- [ ] Every file using React Spring hooks has `'use client'` directive
- [ ] No React Spring code wraps Carbon's built-in animated components

---

## Reference — Complete Install Command

```bash
# Run this in the project root to install the full stack at once
npm install \
  @carbon/react \
  @carbon/icons-react \
  @carbon/tokens \
  @react-spring/web \
  @use-gesture/react \
  @carbon/charts-react \
  @carbon/charts \
  d3 \
  zustand \
  immer

npm install --save-dev sass

# Verify
npm ls @carbon/react @react-spring/web zustand next
```

---

*Generated by Claude · IBM Carbon Ultimate Stack · White Theme · React Spring · v11*
