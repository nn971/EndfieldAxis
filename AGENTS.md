# AGENTS.md

## Project purpose

EndfieldAxis is an in-browser **team rotation planner + combat simulator** for Arknights: Endfield-style operator kits.

Users build a 4-operator team, lay out skill usage on a frame-based timeline ("Axis"), tweak each operator build, then run a deterministic event simulation to inspect damage/buff/infliction behavior and produce render overlays for the timeline.

## Tech stack

- Vite + React + TypeScript
- Redux Toolkit for committed editor state
- Tailwind utility classes for UI styling

## Fast start

```bash
npm install
npm run dev
```

## High-level architecture

- `src/features/solution/`
  - Canonical app state (`SolutionState`) and reducers.
  - Save/load serialization and browser storage helpers.
- `src/features/axis/`
  - Timeline editor UI for lane order + skill boxes.
  - Uses temporary drag/preview state locally, commits final mutations through Redux actions.
- `src/features/operator/`
  - Operator build editor (level, ranks, gear, weapon).
- `src/features/sim/`
  - "Run" action entrypoint that compiles timeline boxes into sim events.
  - Builds post-sim render cache (buff bars / markers) and text log output.
- `src/simulator/`
  - Event queue, world state, resolvers, plugin listeners, and damage engine.
- `src/data/`
  - Game content definitions: operators, buffs, weapons, gear, and reaction logic.

## Core domain model to understand before editing

1. **Committed vs preview state**
   - Redux keeps committed state only.
   - Pointer/drag interactions in editors keep local preview state and commit once at interaction end.
2. **Timeline = source of casts**
   - Each skill box represents a cast window (`operatorId`, `skillType`, `startFrame`, `durationFrames`).
   - Simulation compiles sorted skill boxes into scheduled events.
3. **Simulation is deterministic**
   - Events are processed by frame and sequence.
   - `SimWorld` owns mutable sim state (`entities`, buffs, inflictions, logs, queue).
4. **Content-driven formulas**
   - Stat and effect behavior is largely data-defined under `src/data/**` and resolver/plugin code in `src/simulator/**`.

## Working conventions for contributors/agents

- Prefer minimal, targeted changes; keep domain constants and IDs explicit.
- Preserve deterministic ordering when introducing new event generation.
- If adding data content (operator/weapon/buff), ensure IDs remain stable and unique.
- Keep UI preview behavior local; avoid dispatching on every drag frame unless intentionally changing UX/perf tradeoffs.
- Recompute dependent stats when mutating operator builds (see existing `statUpdater` usage).

## Validation checklist

Run these before finalizing:

```bash
npm run lint
npm run build
```

## Useful orientation files

- App composition: `src/App.tsx`
- Store setup: `src/app/store.ts`
- Main state slice: `src/features/solution/solutionSlice.ts`
- Simulator runtime: `src/simulator/simulator.ts`
- Sim entry panel: `src/features/sim/SimPanel.tsx`
