# Changelog

## 2026.06.19-2218

- Conformed to the refined `tool_template` shared structure
- Upgraded toolchain to Svelte 5.56.3, Vite 8, `@sveltejs/vite-plugin-svelte` 7, and Biome 2.5.0; CI Node bumped to 24
- Normalised `src/app.css` and `.gitignore` to the canonical shared versions
- Displayed the build version next to the repository link in the right-panel footer
- Added `svelte.config.js` (`vitePreprocess`) and `.markdownlint.json` (David Anson Markdown Lint) config

## 2026.04.22-2337

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
