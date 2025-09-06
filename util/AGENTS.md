# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React 18 app source. Main logic in `src/App.js`; styles in `src/App.css`; entry in `src/index.js` and `src/index.css`.
- `public/`: Static assets (`public/index.html`, `public/wordlist.txt`, `public/common.txt`). Network wordlists must live here; fetch with `fetch(process.env.PUBLIC_URL + '/wordlist.txt')`.
- `build/`: Production bundle created by `npm run build`. Do not edit by hand.
- Tests live next to files or under `src/__tests__/`.

## Build, Test, and Development Commands
- `npm install` — Install dependencies.
- `npm start` — Run dev server at `http://localhost:3000` with fast refresh and lint hints.
- `npm test` — Run Jest in watch mode (`a` to run all).
- `npm run build` — Create optimized production build in `build/`.
- `npm run deploy` — Build then `rsync` to `robteix.com:/data/www/wsolver/` (maintainers only; requires SSH access).

## Coding Style & Naming Conventions
- Language: Modern ES modules + React function components with Hooks.
- Indentation: 2 spaces; include semicolons; prefer single quotes in JS.
- Components: PascalCase filenames (e.g., `WordListPanel.js`); colocate styles in `App.css` or CSS modules.
- Constants: `UPPER_SNAKE_CASE`.
- Linting: ESLint via `react-scripts` (`extends: react-app`). Fix warnings before committing.

## Testing Guidelines
- Frameworks: Jest + React Testing Library.
- Location: `*.test.js` next to files or under `src/__tests__/` (e.g., `src/App.test.js`).
- Coverage focus: filtering rules and duplicate-letter logic in `App.js`.
- Command: `npm test -- --coverage` for a report.

## Commit & Pull Request Guidelines
- Commits: Short, imperative subjects (~50–72 chars). Examples: "add virtual keyboard on mobile", "improve docs". Add a body when useful.
- PRs: Describe intent, list key changes, link issues, and include screenshots/GIFs for UI tweaks. Ensure `npm test` passes and avoid unrelated refactors.

## Security & Configuration Tips
- Do not commit secrets or private keys. CRA only exposes env vars prefixed with `REACT_APP_`.
- Keep network-fetched wordlists in `public/` and reference them with `process.env.PUBLIC_URL`.

## Agent-Specific Instructions
- Scope: Place this file at the repo root to apply repo-wide; a deeper `AGENTS.md` overrides for its subtree.
- Keep changes minimal and focused; follow existing patterns and naming. Do not modify `build/`. Update docs when behavior changes; prefer proposing over destructive actions.

