# Radiant Frontend

Next.js 16 App Router + Effect ecosystem + Tailwind CSS v4.

## File Structure

```
app/                    Next.js routing (pages, layouts, route handlers) — keep thin
src/
  assets/               Static images and SVGs
  components/           General purpose UI components (flat — no subfolders)
  context/              React state (Effect Atoms, providers)
  data/                 Data files (translations, large JSON datasets)
  hooks/                React hooks
  pgs/                  Page-specific components, organized by route
    home/
    radiosList/
    radioDashboard/
  features/             Domain-specific code (audio, scheduling, etc.)
  lib/                  External library integrations (fonts, i18n, styled-components, auth)
  utils/                General purpose utility functions
```

## Path Aliases

`@/*` maps to `src/*` via `tsconfig.json`.

```ts
import { Button } from "@/components/Button"
import { cn } from "@/utils/cn"
```

## Where to put things

- **Reusable UI primitive** (Button, Card, Dialog) → `src/components/`
- **Component used by one page only** → `src/pages/<pageName>/`
- **Hook used across pages** → `src/hooks/`
- **Hook scoped to one page** → `src/pages/<pageName>/`
- **External library wrapper** → `src/lib/`
- **General utility** → `src/utils/`
- **State management** → `src/context/`
- **Static asset** (image, SVG) → `src/assets/`
- **Translation or dataset** → `src/data/`
- **Domain logic** (audio processing, playout) → `src/features/<domain>/`
- **New page route** → `app/<route>/page.tsx`
