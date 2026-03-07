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

src/shared/simTime/        # Dual clock mechanics (freeze timeline)
├── freezeTimeline.ts      # Real/game frame conversion
└── freezeConfig.ts        # Freeze window durations
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
  frame: number;        // when it fires (ALWAYS real frame)
  seq: number;          // ordering tie-breaker
  type: EventType;      // hit | buffApply | castStart | ...etc
  // ...type-specific fields
}
```
- Events scheduled into future queue via `ops.schedule()`
- Processed in chronological order by `simulator.ts`

### Dual Clock Mechanics (Real vs Game Frames)

The simulator maintains two time axes:
- **Real frames**: Wall-clock timeline progression; event.frame is ALWAYS real frame
- **Game frames**: In-game time that pauses during "freeze windows" (combo skills, ultimates)

```typescript
// Current time accessors
world.read.nowRealInFrames  // Current real frame
world.read.nowGameInFrames  // Current game frame (<= real frame)

// Scheduling APIs
world.ops.scheduleAtRealFrame(event)              // Schedule at specific real frame
world.ops.scheduleAtGameFrame(event, gameFrame)   // Converts game→real then schedules
```

**Freeze Windows** (`src/shared/simTime/freezeTimeline.ts`):
- Combo skills and ultimates create freeze windows where game time stops
- `realToGame(real)` subtracts frozen time from real frame
- `gameToRealAtOrAfter(game, minReal)` finds the real frame corresponding to a game frame

**Critical Rules**:
- **event.frame is ALWAYS real frame** — the scheduler converts game frames internally
- **Be careful not to confuse real frame with game frame when passing parameters**
- Use `scheduleAtGameFrame` when skill durations are specified in game frames
- Use `scheduleAtRealFrame` when you already have the real frame
- Most buff durations and DoT ticks use game frames; cast starts use real frames

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
- **NEVER** confuse real frame with game frame when passing parameters to scheduling APIs
- **ALWAYS** remember that `event.frame` is always real frame (scheduler converts game→real internally)
- **AVOID** ad hoc damage formulas — use `damage/` pipeline
- **AVOID** mixing real and game frame arithmetic — use `freezeTimeline` conversion functions

## Related
- `src/data/operators/` — skill scripts reference these resolvers
- `src/features/sim/runSolutionSim.ts` — entry point: compile + run sim
- `src/types/simulator/` — SimEvent, SimEntity, Buff types
- `src/shared/simTime/freezeTimeline.ts` — Real/game frame conversion logic
- `src/shared/simTime/freezeConfig.ts` — Freeze window duration configuration
