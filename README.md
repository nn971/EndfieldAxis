# EndfieldAxis (Vite + React + Redux Toolkit + TypeScript)

This project is a refactor of the original Vite + React scaffold into:

- **Vite**
- **React**
- **Redux Toolkit** (RTK, Redux Toolkit)
- **React-Redux** (bindings)
- **TypeScript**

## Quick start

```bash
npm install
npm run dev
```

## Project structure (high level)

- `src/app/` — store setup (`store.ts`) + typed hooks (`hooks.ts`)
- `src/features/solution/` — RTK slice + selectors for the main committed editor state
- `src/features/axis/` — Axis editor UI (still uses local preview state; commits via Redux actions)
- `src/features/operator/` — Operator editor UI (preview sliders; commits via Redux actions)
- `src/shared/` — small shared helpers

## Notes

- The Redux store holds **committed** state.
- Dragging / slider interactions keep **preview** state locally and dispatch a single commit action at the end.
