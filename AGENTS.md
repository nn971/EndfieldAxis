# AGENTS.md

## Purpose
EndfieldAxis is an in-browser team rotation planner and deterministic combat simulator.
Users pick a 4-operator team, place skill casts on a frame timeline, edit builds,
run simulation, then inspect logs plus render overlays (buff/infliction/energy tracks).

## Stack
- Vite + React 19 + TypeScript (`strict: true`)
- Redux Toolkit + React-Redux
- Tailwind CSS v4
- No backend; all simulation/runtime logic is local TS code

## Agent priorities
1. Keep changes minimal and targeted.
2. Preserve deterministic simulation ordering.
3. Keep preview/drag UI state local; commit once interaction completes.
4. Keep IDs stable and explicit in data content.
5. Recompute build-derived stats after build mutation (`statUpdater`).

## Build, lint, test, and dev commands

### Setup and dev
```bash
npm install
npm run dev
```

### Production build
```bash
npm run build
```

### Lint
```bash
npm run lint
```
Lint a single file (recommended while iterating):
```bash
npx eslint src/features/sim/SimPanel.tsx
```

### Type check (manual)
```bash
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.node.json --noEmit
```

### Tests
- There is currently no test runner configured (`npm test` script is absent).
- There are no `*.test.*` / `*.spec.*` files in the repository right now.
- If Vitest is added, run a single test file with:
```bash
npx vitest run src/path/to/file.test.ts
```
- Single test case pattern (after Vitest exists):
```bash
npx vitest run src/path/to/file.test.ts -t "case name"
```

## Required pre-PR validation
Run at minimum:
```bash
npm run lint
npm run build
```
When touching typing-heavy logic, also run:
```bash
npx tsc -p tsconfig.app.json --noEmit
```

## Architecture map
- `src/features/solution/`: canonical committed app state (`SolutionState`), reducers, selectors, save/load.
- `src/features/axis/`: timeline editor UI and drag/preview logic for lanes + skill boxes.
- `src/features/operator/`: operator build editor and commit callbacks.
- `src/features/sim/`: run-panel entrypoint that compiles timeline data to sim events.
- `src/simulator/`: event queue, world state, resolvers, listeners/plugins, damage pipeline.
- `src/data/`: content definitions (operators, buffs, weapons, gear, reactions).
- `src/types/`: editor/simulator/operator shared type contracts.

## Core domain rules to preserve
1. Redux contains committed state only.
2. Pointer/drag/slider interactions can hold local preview state.
3. Timeline skill boxes are source-of-truth for scheduled casts.
4. Simulation must remain deterministic (frame + sequence ordering).
5. Data-driven formulas belong in content + resolver/plugin systems, not ad hoc UI code.

## Code style and conventions

### Formatting
- Follow `.prettierrc.json`: `tabWidth: 2`, `semi: true`, `arrowParens: avoid`.
- Keep line wrapping and punctuation consistent with surrounding file style.
- Use ASCII/UTF-8-safe text unless a file already uses intentional Unicode.

### Imports
- Prefer relative imports (project does not use path aliases).
- Group imports as: external packages, internal modules, then type-only imports.
- Prefer `import type` (or `type` specifier) for type-only symbols.
- Avoid unused imports; keep lint clean.

### TypeScript
- Preserve strict typing; avoid `any` unless unavoidable and justified.
- Prefer domain types (`OperatorId`, `SkillType`, `SimEvent`, etc.) over plain `string`.
- Use utility types (`Partial`, `Omit`, `Record`) and discriminated unions where appropriate.
- Use `satisfies`/`as const` in literal-driven data definitions.
- Keep reducer payloads explicit with `PayloadAction<...>`.

### Naming
- Components/classes/types: `PascalCase`.
- Variables/functions: `camelCase`.
- Constants: `UPPER_SNAKE_CASE` for true constants; otherwise scoped `camelCase` is fine.
- IDs should be descriptive and stable (`buff.*`, `gear.*`, `sb_*`, etc.).

### React + Redux patterns
- Prefer functional components and hooks.
- Keep temporary interaction state local (drag/preview/slider state).
- Dispatch final mutations at interaction end, not every pointer move, unless required.
- Use typed hooks/selectors from `src/app/hooks.ts` and `src/features/solution/selectors.ts`.
- In reducers, prefer early returns for missing entities and predictable updates.

### Simulator and content logic
- Preserve deterministic ordering for events and render artifacts.
- Include stable tie-breakers (id/skill/operator/frame) when sorting.
- Do not introduce nondeterministic operations in event generation/resolution.
- Keep plugin/listener ordering assumptions intact.
- When adding content definitions, ensure IDs are unique and formulas explicit.

### Error handling and logging
- Fail fast (`throw new Error`) for impossible simulator invariants.
- Use `console.warn` for recoverable issues (migration mismatch, partial data, TODO cases).
- Keep error messages specific and include IDs/frames when useful.
- Do not swallow exceptions silently.

### Comments and docs
- Add comments only for non-obvious intent or invariants.
- Prefer clear naming and small helper functions over verbose comments.
- Update serialization/migration notes when persisted shape changes.

## File and module guidance
- App composition entry: `src/App.tsx`
- Store setup: `src/app/store.ts`
- Main state slice: `src/features/solution/solutionSlice.ts`
- Save/load and migration: `src/features/solution/solutionSL.ts`
- Sim runtime: `src/simulator/simulator.ts`
- Sim run panel: `src/features/sim/SimPanel.tsx`
- Operator build editor: `src/features/operator/OperatorEditor.tsx`

## Subdirectory AGENTS.md
- `src/data/AGENTS.md` — Content definitions (operators, weapons, gears, buffs)
- `src/features/axis/AGENTS.md` — Timeline editor UI
- `src/features/operator/AGENTS.md` — Operator build editor
- `src/features/solution/AGENTS.md` — Redux state and persistence
- `src/features/sim/AGENTS.md` — Simulation runner
- `src/simulator/AGENTS.md` — Combat simulator core

## Cursor/Copilot rules status
- `.cursor/rules/`: not present
- `.cursorrules`: not present
- `.github/copilot-instructions.md`: not present

If these files are added later, treat them as higher-priority repository instructions
and update this document to reference any mandatory constraints.
