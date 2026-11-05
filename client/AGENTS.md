# Client development

Read the root `AGENTS.md` first. The client owns all React, Vite, Tailwind,
browser dependencies, static assets, Figma metadata and UI guidelines.

- Start with `src/App.tsx` for UI work and follow imports only as needed.
- Follow `guidelines/Guidelines.md` for UI changes. Preserve Astra tokens and the
  existing MUI bridge rather than replacing the design system.
- Tailwind v4 is imported in `src/index.css`; keep CSS imports before font rules.
  Do not introduce Tailwind/PostCSS configuration files without a concrete need.
- Use double quotes for strings containing apostrophes, or escape apostrophes.
  Close JSX tags and balance braces. Export components as default exports.
- `@` resolves to `client/src` in Vite and TypeScript, including on Windows.
- `VITE_API_URL` is the browser API base URL. Never expose backend secrets as
  `VITE_*` variables. Use `client/.env.example` as the configuration template.
- Run `pnpm --dir client typecheck` and `pnpm --dir client build` from the repo root.
- Figma hooks live under `.figma/make/` in this package and build `client/dist`.
  Their scripts resolve paths independently of the caller's working directory.
