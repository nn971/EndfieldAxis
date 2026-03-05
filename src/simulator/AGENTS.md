# AGENTS.md — src/simulator/

## Purpose
Deterministic combat simulator — event queue, world state, resolvers, damage pipeline.
Compiles timeline skill boxes into simulated combat events with frame-accurate timing.

## Structure
```
src/simulator/
├── simulator.ts           # SimWorld: event queue, world state, read/ops API
├── resolvers.ts           # Event resolution logic (~1500 lines)
├── scripts.ts             # SimScript DSL for skill event drafts
├── log.ts / logMessages.ts # Structured logging + i18n messages
├── damage/
│   ├── damageModel.ts     # Damage context + model creation
│   ├── damageEngine.ts    # Damage calculation pipeline
│   ├── damageBonuses.ts   # Bonus aggregation
│   └── statusDamage.ts    # Arts reactions (solidification, combustion, etc.)
└── listeners/
    ├── registry.ts        # SimRegistry for plugins/listeners
    └── pluginOrder.ts     # Listener priority constants
```

## Core Architecture

### SimWorld
- Owns all mutable state for one simulation run
- `world.read` — read-only access to entities, buffs, frame
- `world.ops` — mutation API (schedule events, add buffs, deal damage)
- Event queue processed in `(frame, sequence)` order — deterministic

### Event System
```typescript
SimEvent = {
  id: string;           // unique (makeSimEventId)
  frame: number;        // when it fires
  seq: number;          // ordering tie-breaker
  type: EventType;      // hit | buffApply | castStart | ...etc
  // ...type-specific fields
}
```
- Events scheduled into future queue via `ops.schedule()`
- Processed in chronological order by `simulator.ts`

### Resolvers
- `resolveHit()` — damage calculation, buff triggers, stagger
- `resolveBuffApplication()` — apply buffs with stacking rules
- `resolveCastStart/End()` — skill execution lifecycle
- `resolveReactionTick()` — arts reaction DoT ticks
- All resolvers receive `(world: SimWorld, event: SimEvent)`

### Determinism Rules
- **Frame + sequence ordering** — no Date.now(), no Math.random() without seed
- **Stable tie-breakers** — id/skill/operator/frame when sorting
- **Pure resolvers** — same input world state always produces same output

### SimScript (scripts.ts)
- DSL for declaring skill event drafts
- `materializeDrafts()` converts drafts to scheduled events
- Scripts attached to `SkillDef.script` in operator data

## Anti-Patterns
- **NEVER** use nondeterministic operations (Date, unseeded random)
- **NEVER** mutate world state outside `world.ops` methods
- **NEVER** break event ordering invariants
- **AVOID** ad hoc damage formulas — use `damage/` pipeline

## Related
- `src/data/operators/` — skill scripts reference these resolvers
- `src/features/sim/runSolutionSim.ts` — entry point: compile + run sim
- `src/types/simulator/` — SimEvent, SimEntity, Buff types
