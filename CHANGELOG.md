# Changelog

## 2026-06-20 - 05:06

- Added a hard collision safety net: if the agent penetrates an obstacle (high speed / low max force), it is pushed back to the surface and its inward velocity is cancelled, so it can never clip through cover
- Lateral avoidance force now uses Buckland's proximity multiplier `1 + (boxLen − localX)/boxLen`, so nearer obstacles produce a harder steer instead of under-steering

## 2026-06-19 - 23:18

- Migrated the package manager from npm to **pnpm** (global pnpm via Volta)
- Updated CI (`deploy.yml`) to set up pnpm via `pnpm/action-setup` and run `pnpm install --frozen-lockfile` + `pnpm run build`
- Updated README commands to pnpm
- `pnpm-lock.yaml` (imported from the previous `package-lock.json`, which was removed)
- Node pin `"volta": { "node": "24.17.0" }` in `package.json`

## 2026-06-19 - 22:18

- Conformed to the refined `tool_template` shared structure
- Upgraded toolchain to Svelte 5.56.3, Vite 8, `@sveltejs/vite-plugin-svelte` 7, and Biome 2.5.0; CI Node bumped to 24
- Normalised `src/app.css` and `.gitignore` to the canonical shared versions
- Displayed the build version next to the repository link in the right-panel footer
- Added `svelte.config.js` (`vitePreprocess`) and `.markdownlint.json` (David Anson Markdown Lint) config

## 2026-04-22 - 23:37

- Initial release of the Local Space Obstacle Avoidance interactive tool
- Implemented Reynolds' five-phase local-space obstacle avoidance algorithm (GDC 1999 / Buckland 2005)
- `pointToLocalSpace` and `vectorToWorldSpace` dot-product transform helpers
- Single agent with wander (jittered circle projection) and seek (target placement) steering
- Detection box visualisation — turns red on active threat
- Local axes overlay showing heading (+X) and side (+Y) vectors
- Force vector decomposition: braking (red), lateral (purple), world resultant (orange)
- Phase badge in telemetry panel showing the active algorithm phase (0–5)
- Obstacle placement / removal by click; target placement / removal by click
- Keyboard shortcuts: T Trail, B Box, L Local Axes, F Forces, R Reset, O Obstacle, G Target, Esc Select
- Collapsible left/right sidebars with toggle buttons
- Glossary modal with nine entries covering local-space transform, detection box, force components, and more
- Sidebar theory covering all five algorithm phases with formula cards
- Game examples: Halo, F.E.A.R., GTA V
