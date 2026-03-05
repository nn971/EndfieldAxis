# AGENTS.md — src/features/solution/

## Purpose
Canonical committed application state (`SolutionState`) and all Redux operations.
This is the single source of truth for: team composition, skill boxes (timeline), operator builds, and simulation caches.

## Structure
```
src/features/solution/
├── solutionSlice.ts      # Redux slice: reducers + actions
├── solutionSL.ts         # Save/load serialization + migration
├── selectors.ts          # Typed selectors + derived memoized data
├── statUpdater.ts        # Recompute build-derived stats after mutations
└── types.ts              # Extended types for solution domain
```

## Key Patterns

### State Shape
- `teamOperatorIds: string[]` — 4 lanes of operator IDs in order
- `controlledOperatorId: string` — which operator is currently being edited
- `skillBoxes: SkillBox[]` — scheduled skill casts (the timeline)
- `buildByOperatorId: Record<string, OperatorBuild>` — per-operator builds
- `simRenderCache/simDamageCache` — computed simulation outputs

### Reducer Conventions
- Use `PayloadAction<T>` with explicit payload types
- Mutations via Immer (immer-enabled in createSlice)
- Early return for guard clauses (missing entities)
- Call `statUpdater(build)` after any build mutation

### Save/Load (solutionSL.ts)
- `CURRENT_SOLUTION_VERSION` — bump when serialized shape changes
- `serializeSolution()` — strips runtime caches, canonicalizes ordering
- `deserializeSolution()` — validates, migrates old versions, returns `{ok, solution|error}`
- Always canonicalize before serialize: sort skillBoxes by (frame, operator, skill, id)

### Selectors
- Use `createSelector` from RTK for memoized derived data
- Keep selectors in `selectors.ts`, not inline in components
- Import typed hooks from `src/app/hooks.ts`

## Anti-Patterns
- **NEVER** mutate `skillBoxes` array directly — use slice actions
- **NEVER** store UI preview state here (drags, sliders) — keep local
- **NEVER** forget to call `statUpdater()` after build mutation
- **AVOID** adding runtime-only fields to persisted state

## Related
- `src/features/axis/` — timeline editor UI (commits via these actions)
- `src/features/operator/` — build editor (commits via `operatorBuildPatched`)
- `src/features/sim/` — runs sim and commits cache via `simRenderCacheReplaced`
