# Trailview theme — DaisyUI config + integration instructions

This document has two parts:

1. **The theme config** — DaisyUI theme object, supporting CSS variables, and Tailwind extensions
2. **Claude Code instructions** — a task doc for wiring it into your Next.js project

Feed this to Claude Code as a single instruction file. It covers install, config, and the design-system prompt update.

---

## Theme decisions summary

Every decision made during design review, for reference:

| Token | Value | Chosen in |
|---|---|---|
| Primary | `#2F5233` (Forest) — deep, blue-leaning green | Round 1 |
| Primary dark | `#1F3A22` | derived |
| Primary soft | `rgba(47, 82, 51, 0.10)` — tint surface | derived |
| Accent | `#E89B4A` (Classic trail orange) — for GPX tracks | Round 3 |
| Accent dark | `#B47329` | derived |
| Accent soft | `rgba(232, 155, 74, 0.15)` | derived |
| Success | `#5E8C4A` (Moss) | Round 4 |
| Error | `#B8452E` (Rust) | Round 4 |
| Info | `#5C7B8A` (Slate) | Round 4 |
| Warning | `#C7923A` (muted amber — semantic complement) | derived for completeness |
| Page bg (`base-100` in layout) | `#FAF6EC` | Round 2 |
| Card surface | `#FFFDF6` | Round 2 |
| Tonal surface | `#F1ECDD` | Round 2 |
| Border color | `#E4DEC9` | Round 2 |
| Text primary | `#2C2C2A` | — |
| Text muted | `rgba(44, 44, 42, 0.65)` | — |
| Card border | `1px solid rgba(44, 44, 42, 0.14)` | Round 5 |
| Inner border | `1px solid rgba(44, 44, 42, 0.10)` | Round 5 |
| Card shadow | `0 1px 2px rgba(44,44,42,0.04), 0 4px 10px rgba(44,44,42,0.05)` | Round 6 |
| Medallion shape | `rounded-xl` (12px) soft square | Round 7 |
| Status pill style | Outlined: `bg-base-100` + 1px colored border + colored dark text | Round 8 |
| Type | System default (`-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`) | Round 9 |

A note on DaisyUI's naming: DaisyUI expects `base-100` to be the most prominent surface (page background). Your design system currently uses `base-100` for the card surface and `bg` for the page. I'm **keeping your design-system mental model intact** and mapping it to DaisyUI's convention below — watch the `base-100 / base-200 / base-300` comments in the config.

---

## Part 1: the theme config

### `app/globals.css` — add these variables below your Tailwind directives

```css
@import "tailwindcss";

@plugin "daisyui" {
  themes: trailview --default;
}

@plugin "daisyui/theme" {
  name: "trailview";
  default: true;
  prefersdark: false;
  color-scheme: "light";

  /* Surfaces — DaisyUI convention: base-100 is page bg */
  --color-base-100: #FAF6EC;    /* page */
  --color-base-200: #FFFDF6;    /* floating card surface */
  --color-base-300: #F1ECDD;    /* tonal inner surface */
  --color-base-content: #2C2C2A;

  /* Primary */
  --color-primary: #2F5233;
  --color-primary-content: #FFFDF6;

  /* Secondary — use accent (trail orange) */
  --color-secondary: #E89B4A;
  --color-secondary-content: #2C2C2A;

  /* Accent — unused slot; mirror primary for any daisy components that reach for it */
  --color-accent: #E89B4A;
  --color-accent-content: #2C2C2A;

  /* Neutral — dark earth, used for text-on-dark like buttons, etc */
  --color-neutral: #2C2C2A;
  --color-neutral-content: #FAF6EC;

  /* Semantic */
  --color-info: #5C7B8A;
  --color-info-content: #FFFDF6;
  --color-success: #5E8C4A;
  --color-success-content: #FFFDF6;
  --color-warning: #C7923A;
  --color-warning-content: #2C2C2A;
  --color-error: #B8452E;
  --color-error-content: #FFFDF6;

  /* Rounding — set DaisyUI component radii to match design system */
  --radius-selector: 999px;      /* selectors (toggles, radios, checkboxes) */
  --radius-field: 16px;           /* inputs, rows → rounded-2xl */
  --radius-box: 24px;             /* cards, modals → rounded-3xl */

  /* Component sizing and noise */
  --size-selector: 0.25rem;
  --size-field: 0.25rem;
  --border: 1px;                  /* match crisp 1px decision */
  --depth: 1;                     /* subtle shadow, not pronounced */
  --noise: 0;                     /* no texture */
}

/* Custom CSS variables for design-system-specific tokens not covered by DaisyUI */
:root {
  /* Text tones */
  --color-text-muted: rgba(44, 44, 42, 0.65);
  --color-text-dim: rgba(44, 44, 42, 0.5);

  /* Soft tints (for accent surfaces) */
  --color-primary-soft: rgba(47, 82, 51, 0.10);
  --color-accent-soft: rgba(232, 155, 74, 0.15);
  --color-success-soft: rgba(94, 140, 74, 0.18);
  --color-info-soft: rgba(92, 123, 138, 0.18);
  --color-error-soft: rgba(184, 69, 46, 0.15);
  --color-warning-soft: rgba(199, 146, 58, 0.18);

  /* Dark variants (for text on tinted surfaces) */
  --color-primary-dark: #1F3A22;
  --color-accent-dark: #B47329;
  --color-success-dark: #3E6030;
  --color-info-dark: #3E5562;
  --color-error-dark: #8A2D1C;
  --color-warning-dark: #8A641D;

  /* Structure */
  --border-card: rgba(44, 44, 42, 0.14);
  --border-inner: rgba(44, 44, 42, 0.10);

  /* Shadow */
  --shadow-card: 0 1px 2px rgba(44, 44, 42, 0.04), 0 4px 10px rgba(44, 44, 42, 0.05);
}

/* Global resets to align DaisyUI output with design system */
html, body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-weight: 400;
  -webkit-font-smoothing: antialiased;
  background: var(--color-base-100);
  color: var(--color-base-content);
}

/* Ensure DaisyUI btn elements use font-weight 500, never 700 */
.btn { font-weight: 500; }
```

### `tailwind.config.ts` — extend with utility classes for soft tints

If you're on Tailwind v4 (which DaisyUI 5 targets), most of this goes into `globals.css` via `@theme`. If you're on Tailwind v3, use the JS config.

**For Tailwind v4** — add to `globals.css`:

```css
@theme {
  /* Soft tint backgrounds as utilities: bg-primary-soft, bg-success-soft, etc. */
  --color-primary-soft: rgba(47, 82, 51, 0.10);
  --color-accent-soft: rgba(232, 155, 74, 0.15);
  --color-success-soft: rgba(94, 140, 74, 0.18);
  --color-info-soft: rgba(92, 123, 138, 0.18);
  --color-error-soft: rgba(184, 69, 46, 0.15);
  --color-warning-soft: rgba(199, 146, 58, 0.18);

  /* Dark text variants on tints: text-primary-dark, text-success-dark, etc. */
  --color-primary-dark: #1F3A22;
  --color-accent-dark: #B47329;
  --color-success-dark: #3E6030;
  --color-info-dark: #3E5562;
  --color-error-dark: #8A2D1C;
  --color-warning-dark: #8A641D;

  /* Custom border colors */
  --color-border-card: rgba(44, 44, 42, 0.14);
  --color-border-inner: rgba(44, 44, 42, 0.10);

  /* Custom shadow */
  --shadow-card: 0 1px 2px rgba(44, 44, 42, 0.04), 0 4px 10px rgba(44, 44, 42, 0.05);
}
```

**For Tailwind v3** — extend in `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";
import daisyui from "daisyui";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "primary-soft": "rgba(47, 82, 51, 0.10)",
        "accent-soft": "rgba(232, 155, 74, 0.15)",
        "success-soft": "rgba(94, 140, 74, 0.18)",
        "info-soft": "rgba(92, 123, 138, 0.18)",
        "error-soft": "rgba(184, 69, 46, 0.15)",
        "warning-soft": "rgba(199, 146, 58, 0.18)",
        "primary-dark": "#1F3A22",
        "accent-dark": "#B47329",
        "success-dark": "#3E6030",
        "info-dark": "#3E5562",
        "error-dark": "#8A2D1C",
        "warning-dark": "#8A641D",
        "border-card": "rgba(44, 44, 42, 0.14)",
        "border-inner": "rgba(44, 44, 42, 0.10)",
      },
      boxShadow: {
        card: "0 1px 2px rgba(44, 44, 42, 0.04), 0 4px 10px rgba(44, 44, 42, 0.05)",
      },
      borderRadius: {
        "3xl": "24px",
        "2xl": "16px",
        xl: "12px",
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        trailview: {
          "primary": "#2F5233",
          "primary-content": "#FFFDF6",
          "secondary": "#E89B4A",
          "secondary-content": "#2C2C2A",
          "accent": "#E89B4A",
          "accent-content": "#2C2C2A",
          "neutral": "#2C2C2A",
          "neutral-content": "#FAF6EC",
          "base-100": "#FAF6EC",
          "base-200": "#FFFDF6",
          "base-300": "#F1ECDD",
          "base-content": "#2C2C2A",
          "info": "#5C7B8A",
          "info-content": "#FFFDF6",
          "success": "#5E8C4A",
          "success-content": "#FFFDF6",
          "warning": "#C7923A",
          "warning-content": "#2C2C2A",
          "error": "#B8452E",
          "error-content": "#FFFDF6",
        },
      },
    ],
  },
};

export default config;
```

### `app/layout.tsx` — add the theme attribute

```tsx
<html lang="en" data-theme="trailview">
```

---

## Part 2: class usage cheat sheet

After the theme lands, components in the project should rely on these classes:

| Purpose | Tailwind / DaisyUI classes |
|---|---|
| Page background | `bg-base-100` (automatic on body; rarely need to set) |
| Floating card (outer) | `bg-base-200 border border-border-card rounded-3xl shadow-card p-5` |
| Tonal surface (inner) | `bg-base-300 border border-border-inner rounded-2xl p-4` |
| Medallion | `w-9 h-9 rounded-xl bg-base-200 border border-border-inner flex items-center justify-center flex-shrink-0` |
| Pill — success | `inline-flex items-center gap-1.5 bg-base-200 border border-success text-success-dark px-2.5 py-0.5 rounded-full text-xs font-medium` |
| Pill — info | same pattern, swap to `border-info text-info-dark` |
| Pill — error | `border-error text-error-dark` |
| Pill — primary | `border-primary text-primary-dark` |
| Filled button | `btn btn-primary rounded-full` |
| Tonal button | `bg-base-300 border border-border-inner text-base-content rounded-full px-4 py-2 text-sm font-medium` |
| Outlined button | `btn btn-outline rounded-full` |
| Status banner (success) | `flex items-center gap-3 bg-success-soft rounded-2xl p-4` — title uses `text-success-dark` |
| Status banner (error) | `bg-error-soft` + `text-error-dark` |
| Status banner (info) | `bg-info-soft` + `text-info-dark` |
| Headline | `text-2xl md:text-4xl font-medium tracking-tight` |
| Section label | `text-[11px] tracking-wider font-medium text-base-content/60 uppercase` |

---

# Claude Code task: integrate Trailview theme

## Goal

Install DaisyUI (if not already), configure the custom `trailview` theme, update `app/layout.tsx` to apply it, and update `prompts/ui.md` with the new locked design tokens.

## Prerequisites

Check current dependencies:

```bash
cat package.json | grep -E "(tailwindcss|daisyui)"
```

If DaisyUI is not installed:

```bash
npm install -D daisyui@latest
```

Determine Tailwind version:

```bash
cat package.json | grep tailwindcss
```

- If Tailwind v4: use the Tailwind v4 / DaisyUI v5 path (CSS-first)
- If Tailwind v3: use the JS config path

## Files to modify

### 1. `app/globals.css`

Replace the Tailwind imports with the full block above (the `@plugin "daisyui/theme"` block for v4, or the `@tailwind base / components / utilities` setup plus plugin registration for v3). Copy the complete `@plugin "daisyui/theme"` block for `trailview` and the `:root` custom variables block exactly as written above.

Do not add any other theme; `trailview` is the only theme and is `--default`.

### 2. `tailwind.config.ts`

If Tailwind v3, replace with the config block above (extend colors, shadows, radii, register daisyui plugin with the `trailview` theme).

If Tailwind v4, skip this — it's all in `globals.css` via `@theme`. Delete the file if it only contained legacy config.

### 3. `app/layout.tsx`

Add `data-theme="trailview"` to the `<html>` tag:

```tsx
<html lang="en" data-theme="trailview">
```

This is the only change needed here.

### 4. `prompts/ui.md`

Replace the existing "Color intent" and "Shape" sections with the following locked token list. Leave the rest of the document (surface hierarchy, spacing, typography rules, medallion pattern, buttons, segmented controls) intact, but update the specific values to match the locked theme.

**Changes to `prompts/ui.md`:**

- Under "Shape", update the medallion corner from `rounded-full` to `rounded-xl` (12px). The medallion is now a soft-square, not a circle.
- Under "Color intent", replace the "earthy green primary + orange trail accent" paragraph with this concrete list:
  - Primary: `#2F5233` Forest
  - Accent / secondary: `#E89B4A` Trail orange (reserved for GPX track rendering + track-color indicators)
  - Success: `#5E8C4A` Moss · Error: `#B8452E` Rust · Info: `#5C7B8A` Slate · Warning: `#C7923A` (all earth-tuned, not traditional semantic)
  - Page: `#FAF6EC` · Card surface: `#FFFDF6` · Tonal surface: `#F1ECDD` · Border: `#E4DEC9`
- Under "The medallion row pattern (reusable)", update the medallion spec from `rounded-full` to `rounded-xl` with the same 36×36 dimensions and base-200 background.
- Under "Status banners / strips", note that tinted banners use `bg-*-soft` with `text-*-dark` for the title.
- Add a new short section titled "Status pills" specifying that all status pills use the **outlined** style: `bg-base-200 border border-{semantic} text-{semantic}-dark rounded-full` — not tinted fills.

### 5. Leave alone

- Do not touch any component files (`HikeCard`, `HikeInfoCard`, `MapControlsPanel`, etc.). Those will be updated in a separate pass once the theme is live.
- Do not touch `PROJECT_CONTEXT.md`. Juan will update that manually.

## Verification

1. `npm run dev` — server starts without errors.
2. Open the app at `localhost:3000`. The page background should render as `#FAF6EC` (warm cream).
3. Any existing DaisyUI button (e.g. `btn btn-primary`) should render with the forest green `#2F5233`.
4. In Chrome DevTools, inspect `<html>` — it should show `data-theme="trailview"`. Inspect `body` — computed `background-color` should be `rgb(250, 246, 236)`.
5. No console errors or Tailwind warnings.

## Deliverables

PR description should include:

- Which Tailwind version was detected (v3 vs v4)
- Whether DaisyUI was already installed or was just added
- A screenshot of the current `/` page rendered with the new theme
- A note listing the exact sections of `prompts/ui.md` that were modified

## Out of scope

- Do NOT refactor any components to use the new tokens. That is a separate task — let Juan review the raw theme first.
- Do NOT add dark-mode tokens. Dark mode is explicitly deferred in PROJECT_CONTEXT.
- Do NOT install any fonts. Type is system default, no loader required.
- Do NOT create a demo/showcase page. The theme will be validated against existing components in the follow-up pass.
