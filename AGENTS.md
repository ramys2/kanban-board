# Repository Guidelines

## Project Structure & Module Organization

This is a dependency-free, browser-only Kanban board. Keep changes small and preserve the no-build design.

- `index.html` defines the page shell, controls, dialog, and reusable templates.
- `styles.css` contains all layout, component, drag-state, and responsive styling.
- `app.js` owns board state, rendering, editing, drag and drop, local persistence, and JSON import/export.
- `favicon.svg` is the browser-tab asset.
- `task.md` is the product specification; `README.md` documents user-facing behavior.

There is currently no separate test directory or generated output. Add tests under `tests/` if automated coverage is introduced.

## Build, Test, and Development Commands

No installation or build is required. Open `index.html` directly, or run a local static server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`. Before submitting JavaScript changes, run:

```bash
node --check app.js
```

This checks syntax only; Node.js is a contributor convenience, not an application dependency.

## Coding Style & Naming Conventions

Use two-space indentation in HTML, CSS, and JavaScript. Follow the existing JavaScript style: strict mode, semicolons, double-quoted strings, `const` by default, and small functions with early returns. Use `camelCase` for variables/functions, `UPPER_SNAKE_CASE` for constants, and kebab-case for CSS classes and asset names. Prefer browser-native APIs and avoid frameworks, packages, build tooling, or unnecessary abstractions.

Keep UI text brief and accessible. Preserve labels, keyboard behavior, focus styles, and reduced-motion support when modifying controls.

## Testing Guidelines

There is no automated test framework or coverage requirement yet. Manually verify creating, renaming, deleting, and reordering columns and tasks; moving tasks between columns; local-storage restoration; and JSON save/load round trips. Test invalid JSON and unsupported versions. Check current Chrome, Firefox, or Safari behavior for drag and drop and `<dialog>` changes.

## Commit & Pull Request Guidelines

History uses short, lowercase summaries such as `added doc`. Continue with focused descriptions, preferably imperative, for example `fix task reorder index`. Keep unrelated changes in separate commits.

Pull requests should explain the user-visible outcome, list manual checks performed, and link relevant issues. Include before/after screenshots for visual changes and a sample board file when changing the JSON format. Call out format-version or local-storage compatibility impacts explicitly.
