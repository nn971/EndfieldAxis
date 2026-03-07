# AGENTS.md — src/features/sim/

## Purpose
Simulation run panel — compile timeline skill boxes into simulated combat,
execute deterministic simulation, display logs and damage statistics.

## Structure
```
src/features/sim/
├── SimPanel.tsx              # Run panel UI (~130 lines)
├── runSolutionSim.ts         # Main simulation runner (~530 lines)
├── DamageStatisticPanel.tsx  # Damage breakdown UI
└── formatSimLog.ts           # Log message formatter
```

## Key Patterns

### Simulation Execution Flow
```
User clicks "Run"
  ↓
runSolutionSim({ teamOperatorIds, skillBoxes, builds })
  ↓
1. Build freeze timeline (latency compensation)
2. Compile skill boxes → SimEvents
3. Initialize SimWorld with registry
4. Process event queue (frame + seq order)
5. Aggregate damage, render cache, log
  ↓
Dispatch results to Redux (render cache, damage cache)
Display log in console-style panel
```

### Event Compilation
Skill boxes become simulation events:
```typescript
skillBox: {
  operatorId, skillType, startFrame, durationFrames
}
↓
SimEvents: castStart, hit, buffApply, castEnd...
```

### Run Result
```typescript
RunSolutionSimResult = {
  env: SimEnv;                    // Final world state
  log: SimLog;                    // Structured event log
  processedEvents: SimEvent[];    // All executed events
  resourceSamples: Resource[];    // HP/SP over time
  simRenderCache: SimRenderCache; // For timeline overlays
  totalDamage: number;
  hitDamageSnapshots: Hit[];      // Per-hit damage details
}
```

### Redux Integration
```typescript
// After simulation completes:
dispatch(simRenderCacheReplaced(result.simRenderCache));
dispatch(simDamageCacheReplaced({
  totalDamage: result.totalDamage,
  hitDamageSnapshots: result.hitDamageSnapshots
}));
```

## Anti-Patterns
- **NEVER** run simulation on every render — only on explicit Run click
- **NEVER** modify skill boxes during simulation
- **AVOID** heavy post-processing in render — memoize with useMemo

## Related
- `src/simulator/simulator.ts` — SimWorld implementation
- `src/simulator/resolvers.ts` — Event resolution logic
- `src/features/axis/AxisEditor.tsx` — Consumes simRenderCache for overlays
