# TMC Access UI guidelines

- Keep the current Vietnamese interface, role-specific screens, responsive
  mobile/kiosk layouts and the Instrument Sans font served from `client/public`.
- Use the installed `@figma/astraui` components/tokens and stylesheet, imported
  before Tailwind in `client/src/index.css`. Retain the existing MUI theme bridge
  for tables, date pickers and drawers.
- Use Tailwind CSS v4 utilities and the existing theme variables. Global fonts
  and theme wiring belong in `client/src/index.css`.
- Keep reusable UI in `client/src/components`, feature screens in
  `client/src/features`, and browser configuration in `client/vite.config.ts`.
- Figma title/language/robots/site metadata belongs in
  `client/.figma/make/site.json`; the client Vite config applies it to HTML.
- The old scaffold referenced `@figma/astraui-kit` setup instructions, but that
  package is not currently declared or installed. Do not assume those files
  exist. If a UI ticket introduces the kit, read its exact package-local setup
  and guideline paths and apply its instructions as part of that ticket.
- UI role guards improve navigation; authorization for real operations remains
  the API's responsibility. Preserve the distinction between demo and real data.
