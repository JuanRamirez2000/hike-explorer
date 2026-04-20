# Codebase Audit: Refactor Suggestions (NO CODE CHANGES)

You are performing a **read-only audit**. Do not modify any files. Your output is a single markdown report.

## Scope
Walk the entire repo except: `node_modules/`, `.next/`, `.vercel/`, `supabase/.temp/`, `dist/`, `build/`, `*.lock`, `*.md` docs, and generated types.

Read `PROJECT_CONTEXT.md` and `AGENTS.md` FIRST so suggestions respect locked decisions (e.g. track_points as rows, TS-only stack, denormalized bbox). Do NOT flag locked decisions as refactor candidates.

## What to flag (in priority order)
1. **Files >300 lines** or components with >3 responsibilities → suggest split boundaries
2. **Duplicated logic** across files (same calc, same fetch pattern, same type shape) → suggest extraction target
3. **Naming inconsistencies** — camelCase vs kebab-case filenames, vague names (`utils.ts`, `helpers.ts`, `data`, `handleStuff`), mismatches between filename and default export
4. **Type/schema drift** — places where Drizzle inferred types should replace hand-written interfaces, or `any`/`unknown` that have a known shape
5. **Server/client boundary smells** — `"use client"` files importing server-only code, server actions mixed with pure helpers, client components that could be server components
6. **Tech debt markers** — TODO/FIXME/HACK comments, commented-out code, unused exports, dead files
7. **Coupling issues** — a `lib/` file importing from `app/`, circular imports, components reaching into sibling internals
8. **Hot paths needing attention** — viewshed, GPX parser, track_point writes: flag anything that loads full arrays where streaming is possible

## What to IGNORE
- Style/formatting (Prettier's job)
- Performance micro-opts without measurement
- Anything in `[LOCKED]` sections of PROJECT_CONTEXT.md
- Rewrites for personal preference — only flag concrete maintainability wins

## Output format
Single file: `REFACTOR_AUDIT.md` in repo root. Structure:

```
## Summary
- Files scanned: N
- Suggestions: N (High: X, Medium: Y, Low: Z)
- Top 3 highest-impact items

## Suggestions
### [Priority] path/to/file.ts:LINE — Short title
**Category:** (split | dedupe | naming | types | boundary | debt | coupling | hotpath)
**Current:** 1-2 sentences on what's there
**Suggested:** 1-2 sentences on the change
**Why:** 1 sentence on the payoff
**Effort:** (S | M | L)
```

Sort by priority (High → Low), then by effort (S first within each priority).

## Rules
- DO NOT refactor, rename, move, or edit any code.
- DO NOT create stub files or scaffolding.
- If you're unsure whether something is intentional, mark it Low priority with "verify intent" in the Why.
- Keep each suggestion to ~6 lines. No code blocks longer than 5 lines.
- End with a "Deferred / Needs Discussion" section for anything that touches a `[LOCKED]` decision or crosses Stage 2/3 boundaries.