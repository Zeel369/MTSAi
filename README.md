# MTSAi Website

Monorepo for the MTSAi government platform — IBM Carbon design system frontend and backend services.

## Structure

```
apps/
  Frontend/     — IBM Carbon site (Mac, active build target)
  Backend/      — Backend services (Windows laptop)
packages/
  design-system/  — Shared IBM Carbon tokens, base styles, components
  shared-types/   — Shared TypeScript/API contracts (frontend ↔ backend)
docs/             — Architecture, content guides, reference
```

## Workflow

- **Mac**: primary development in `apps/Frontend` and `packages/design-system`
- **Windows**: primary development in `apps/Backend`
- Both machines push to this repo via feature branches

## Reference

- Old site reference/archive: `REDESIGn/` (separate repo, do not import wholesale)
- IBM Carbon design system: `packages/design-system`
