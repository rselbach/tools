# Repository Guidelines

## Project Structure & Module Organization
- `src/`: React 18 app source. Main logic in `src/App.js`; styles in `src/App.css`; entry in `src/index.js` and `src/index.css`. Tests live next to files or in `src/__tests__/`.
- `public/`: Static assets served at runtime (e.g., `public/index.html`, `public/wordlist.txt`, `public/common.txt`). Network wordlists must live here to be fetchable via `fetch(process.env.PUBLIC_URL + '/wordlist.txt')`.
- `build/`: Production bundle created by the build step. Do not edit by hand.

## Build, Test, and Development Commands
- `npm install` — Install dependencies.
- `npm start` — Run dev server at `http://localhost:3000` with fast refresh and lint hints.
- `npm run build` — Create optimized production build in `build/`.
- `npm test` — Run Jest in watch mode (`a` to run all tests).
- `npm run deploy` — Build then `rsync` to `robteix.com:/data/www/wsolver/` (maintainers only; requires SSH access).

## Coding Style & Naming Conventions
- Language: Modern ES modules + React function components with Hooks.
- Indentation: 2 spaces; include semicolons; prefer single quotes in JS.
- Components: PascalCase filenames (e.g., `WordListPanel.js`); colocate styles in CSS modules or `App.css` as done here.
- Constants: `UPPER_SNAKE_CASE`.
- Linting: ESLint via `react-scripts` (`extends: react-app`). Fix warnings before committing.

## Testing Guidelines
- Frameworks: Jest + React Testing Library (bundled with `react-scripts`).
- Location: `*.test.js` next to the file or under `src/__tests__/` (e.g., `src/App.test.js`).
- Coverage: Aim to cover filtering rules and duplicate-letter logic in `App.js`.
- Commands: `npm test -- --coverage` for coverage report.

## Commit & Pull Request Guidelines
- Commits: Short, imperative subjects (~50–72 chars). Examples: "add virtual keyboard on mobile", "improve docs". Add a body when useful.
- PRs: Describe intent, list key changes, and include screenshots/GIFs for UI tweaks. Link related issues. Ensure `npm test` passes and avoid unrelated refactors.

## Security & Configuration Tips
- Do not commit secrets or private keys. CRA only exposes env vars prefixed with `REACT_APP_`.
- Keep network-fetched wordlists in `public/` and reference them with `process.env.PUBLIC_URL`.

## Agent-Specific Instructions
- Scope: This file applies repo-wide; a deeper `AGENTS.md` overrides for its subtree.
- Keep changes minimal and focused; follow existing patterns and naming.
- Do not modify `build/`. Update docs when behavior changes. Prefer proposing over destructive actions.
