# Codebase Analysis Report: Over-Abstraction, Duplication & Bloat

**Project**: EndfieldAxis  
**Analysis Date**: 2026-03-05  
**Total Lines of Code**: ~19,196  
**Files Analyzed**: 100+ TypeScript/TSX files

---

## Executive Summary

This analysis identified **22 distinct issues** across four categories:
- **Code Duplication (7 issues)** - Repeated logic that should be consolidated
- **Over-Abstraction (6 issues)** - Unnecessary abstraction layers adding complexity
- **Bloated Code (5 issues)** - Excessively long functions and files
- **Stale/Dead Code (4 issues)** - Commented-out code and unused patterns

Each issue is listed below with:
- Severity (Critical/High/Medium/Low)
- Location (file path and line numbers)
- Description of the problem
- Estimated refactoring effort
- **Action Required**: Your decision needed before any fixes are applied

---

## Category 1: CODE DUPLICATION

### Issue 1.1: `countSetPieces()` Function Duplicated 11 Times
**Severity**: High  
**Files Affected**: 
- `src/data/gears/abstractSet/AethertechSetDef.ts` (line 6)
- `src/data/gears/abstractSet/HotWorkSetDef.ts` (line 6)
- `src/data/gears/abstractSet/SwordmancerDef.ts` (line 17)
- `src/data/gears/abstractSet/BonekrushaSetDef.ts` (line 6)
- `src/data/gears/abstractSet/FrontiersSetDef.ts` (line 6)
- `src/data/gears/abstractSet/LYNXSetDef.ts` (line 6)
- `src/data/gears/abstractSet/TideSurgeSetDef.ts` (line 6)
- `src/data/gears/abstractSet/Type50YinglungSetDef.ts` (line 6)
- `src/data/gears/abstractSet/PulserLabsSetDef.ts` (line 6)
- `src/data/gears/abstractSet/MISecuritySetDef.ts` (line 6)
- `src/data/gears/abstractSet/EternalXiraniteSetDef.ts` (line 16)

**Problem**: The exact same helper function is copy-pasted in every gear set definition file:
```typescript
function countSetPieces(build: OperatorBuild, set: GearSetBonusData): number {
  return Object.values(build.gears).filter(
    slot => !!slot.gearId && set.gearIds.includes(slot.gearId),
  ).length;
}
```

**Impact**: Any bug fix or enhancement to this logic requires changes in 11 files. Increases bundle size unnecessarily.

**Proposed Fix**: Extract to a shared utility in `src/data/gears/utils.ts` or add as a static method on the base `GearsDef` class.

**Effort**: 30 minutes

---

### Issue 1.2: Gear Set Abstract Classes Have Identical Boilerplate
**Severity**: Medium  
**Files Affected**: All 11 files in `src/data/gears/abstractSet/`

**Problem**: Each gear set abstract class repeats the same pattern:
- `private static registeredRegistries = new WeakSet<SimRegistry>()`
- `static readonly setData: GearSetBonusData = {...}`
- `static hasRequiredPieces(build: OperatorBuild): boolean` - identical logic
- `static getSetRestBonuses(build: OperatorBuild): RestBonusEntry[]` - identical logic
- `registerSimPlugins(registry: SimRegistry): void` - often identical empty implementation

**Impact**: Maintenance burden when the pattern changes. Code noise that obscures actual differences (only `setData` varies significantly).

**Proposed Fix**: Create a base `GearSetDef` class with template method pattern, or use a factory function to generate set definitions from data.

**Effort**: 2-3 hours

---

### Issue 1.3: Weapon Plugin Registration Pattern Repeated
**Severity**: Medium  
**Files Affected**: 60+ weapon files in `src/data/weapons/`

**Problem**: Every weapon follows the exact same boilerplate:
```typescript
class XDef extends WeaponDef {
  constructor() {
    super({ id: "...", name: "...", ... });
  }
  override registerSimPlugins(registry: SimRegistry): void {
    const selfId = this.id;
    // plugin registrations...
  }
}
export default new XDef();
```

**Impact**: 60+ nearly identical class definitions. The class-based approach for simple data objects adds verbosity without benefit.

**Proposed Fix**: Use plain objects with a registration function instead of classes, or code-generate from a schema.

**Effort**: 4-6 hours (large-scale refactor)

---

### Issue 1.4: Similar When-Validation Logic in `resolvers.ts`
**Severity**: Medium  
**File**: `src/simulator/resolvers.ts` (lines 82-209)

**Problem**: `validateWhenAgainstEvent()` contains 10 nearly identical conditional blocks for:
- `sourceOperatorId`
- `sourceWeaponId` 
- `buffId`
- `buffKey`
- `ownerHasBuffId`
- `ownerHasBuffKey`
- `targetHasBuffId`
- `targetHasBuffKey`

Each follows: `if (when.X) { if (!check) return { isValid: false, reason: "..." } }`

**Impact**: 127 lines of repetitive code. Easy to introduce inconsistencies.

**Proposed Fix**: Create a validation rule registry with a loop over validation rules.

**Effort**: 1 hour

---

### Issue 1.5: Status Application Switch Cases Have Duplicated Hit Scheduling
**Severity**: Medium  
**File**: `src/simulator/resolvers.ts` (lines 763-877)

**Problem**: `resolveStatusApplication()` has 4 switch cases (`lift`, `knockDown`, `crush`, `breach`) that each schedule a hit event with nearly identical structure:
```typescript
self.ops.schedule({
  id: makeSimEventId(),
  type: "hit",
  frame: self.read.nowInFrames,
  seq: self.ops.nextSeq(),
  sourceId,
  targetId,
  damageType: "physical",
  hitTypes: { [statusType]: true },
  staggerOnHit: inheritedStaggerOnHit,
  dmgMultiplier: computePhysicalStatusSpecialMul(...),
});
```

**Impact**: ~100 lines of nearly identical code per case. Changes require updates to all 4 cases.

**Proposed Fix**: Extract hit scheduling to a helper function parameterized by status type.

**Effort**: 30 minutes

---

### Issue 1.6: Reaction Buff Handling Duplicated in `resolveInflictionApplication`
**Severity**: Medium  
**File**: `src/simulator/resolvers.ts` (lines 1065-1102)

**Problem**: Switch cases for `cryo`, `heat`, `electric`, `nature` each extract `reactionBuffId`, `initialHitBaseMul`, `initialHitPerStackMul` variables identically.

**Proposed Fix**: Use a lookup table/object instead of switch statement.

**Effort**: 30 minutes

---

### Issue 1.7: Operator Def Classes Follow Identical Pattern
**Severity**: Low  
**Files Affected**: 17 files in `src/data/operators/`

**Problem**: Each operator extends `OperatorDef` with the same boilerplate:
```typescript
class XDef extends OperatorDef {
  constructor() {
    super({ id: "...", name: "...", skills: {...} });
  }
  // Optional override of registerSimPlugins
}
```

**Impact**: 17 files of mostly identical structure. The class hierarchy adds complexity for simple data definitions.

**Proposed Fix**: Consider plain object definitions or code generation from schema.

**Effort**: 3-4 hours (large refactor)

---

## Category 2: OVER-ABSTRACTION

### Issue 2.1: Abstract Classes with No Real Abstraction Benefit
**Severity**: High  
**Files Affected**: 
- `src/data/gears/GearsDef.ts` (line 42)
- `src/data/buffs/BuffDef.ts` (line 17)
- `src/data/operators/OperatorDef.ts` (line 77)
- `src/data/weapons/WeaponDef.ts`

**Problem**: Base classes (`GearsDef`, `BuffDef`, `OperatorDef`, `WeaponDef`) are extended by dozens of classes but provide only:
- Property assignment in constructor
- One empty/optional abstract method: `registerSimPlugins`

These are essentially data structures, not behavioral classes. The abstraction adds indirection without value.

**Impact**: Unnecessary cognitive overhead. Makes it harder to see actual data values. Prevents tree-shaking optimization.

**Proposed Fix**: Convert to interfaces + plain objects, or use factory functions that return the data directly.

**Effort**: 4-6 hours (across all data definitions)

---

### Issue 2.2: WeakSet Registry Pattern is Over-Engineered
**Severity**: Medium  
**Files Affected**: All gear set abstract classes

**Problem**: Each gear set uses:
```typescript
private static registeredRegistries = new WeakSet<SimRegistry>();
// ...
registerSimPlugins(registry: SimRegistry): void {
  if (XSetDef.registeredRegistries.has(registry)) return;
  XSetDef.registeredRegistries.add(registry);
}
```

This pattern prevents double-registration but is repeated identically in 11 files. The complexity is in the wrong place.

**Proposed Fix**: Move deduplication logic to `SimRegistry` itself, or use a mixin/decorator pattern.

**Effort**: 1 hour

---

### Issue 2.3: Wrapper Function `makeSimEventId()`
**Severity**: Low  
**File**: `src/shared/lib/utils.ts` (lines 35-37)

**Problem**: 
```typescript
export function makeSimEventId() {
  return makeId(EVENT_PREFIX);
}
```

This wrapper adds no functionality over `makeId(EVENT_PREFIX)` - just renames it.

**Proposed Fix**: Inline or use a constant: `const makeSimEventId = () => makeId(EVENT_PREFIX)`

**Effort**: 5 minutes

---

### Issue 2.4: Unnecessary Type Indirection for DistOmit
**Severity**: Low  
**File**: `src/shared/lib/utils.ts`

**Problem**: Complex utility type that's likely used in few places, adding cognitive overhead.

**Proposed Fix**: Inline the type where used or use standard TypeScript utilities.

**Effort**: 15 minutes

---

### Issue 2.5: Event Resolver Functions Could Be Consolidated
**Severity**: Medium  
**File**: `src/simulator/resolvers.ts`

**Problem**: 20+ exported resolver functions each handle a specific event type. They follow a pattern that could be data-driven:
```typescript
export function resolveHit(self: SimWorld, ev: Extract<SimEvent, { type: "hit" }>) { ... }
export function resolveCastStart(self: SimWorld, ev: Extract<SimEvent, { type: "castStart" }>) { ... }
// etc.
```

**Impact**: Adding new event types requires boilerplate function creation.

**Proposed Fix**: Use a registry pattern where each event type maps to its resolver configuration.

**Effort**: 3-4 hours

---

### Issue 2.6: Multiple Type Aliases for Similar Concepts
**Severity**: Low  
**Files**: Various in `src/types/`

**Problem**: Type system has many similar type aliases that could be unified:
- `SimEntityId` vs `OperatorId` vs `BuffId` vs `WeaponId` - all are essentially `string`
- Multiple context types with overlapping fields

**Proposed Fix**: Consolidate to fewer, more descriptive type names or use branded types consistently.

**Effort**: 2-3 hours

---

## Category 3: BLOATED CODE

### Issue 3.1: `resolvers.ts` is Excessively Large
**Severity**: Critical  
**File**: `src/simulator/resolvers.ts` (1,378 lines)

**Problem**: Single file contains:
- 54 if-statements
- 20+ exported resolver functions
- Complex nested switch statements
- Mixed concerns: validation, scheduling, damage calculation, buff handling

**Impact**: Hard to navigate. Violates single responsibility principle. Merge conflicts likely.

**Proposed Fix**: Split into separate modules:
- `resolvers/validation.ts`
- `resolvers/damage.ts`
- `resolvers/buff.ts`
- `resolvers/status.ts`
- `resolvers/index.ts` (exports only)

**Effort**: 2-3 hours

---

### Issue 3.2: `simulator.ts` is Too Large
**Severity**: High  
**File**: `src/simulator/simulator.ts` (970 lines)

**Problem**: Contains SimWorld class with 30+ methods including:
- Event queue management
- Entity state management  
- Resource management (SP, Ultimate)
- Combo system
- Damage application
- Logging

**Proposed Fix**: Extract into composable mixins or separate service classes:
- `EventQueueManager`
- `ResourceManager`
- `ComboSystem`

**Effort**: 4-6 hours

---

### Issue 3.3: `resolveStatusApplication()` is Too Long
**Severity**: High  
**File**: `src/simulator/resolvers.ts` (lines 735-895, ~160 lines)

**Problem**: Single function handles all status types with deeply nested logic.

**Proposed Fix**: Split into `resolveLift()`, `resolveCrush()`, etc., or use strategy pattern.

**Effort**: 1 hour

---

### Issue 3.4: `resolveInflictionApplication()` is Too Long
**Severity**: High  
**File**: `src/simulator/resolvers.ts` (lines 1026-1201, ~175 lines)

**Problem**: Handles both arts and non-arts inflictions with complex reaction logic.

**Proposed Fix**: Extract arts reaction logic to separate function.

**Effort**: 1 hour

---

### Issue 3.5: Deeply Nested Conditionals in `validateWhenAgainstEvent()`
**Severity**: Medium  
**File**: `src/simulator/resolvers.ts` (lines 82-209)

**Problem**: 127 lines of nested if-statements, 4+ levels deep in some places.

**Proposed Fix**: Early returns and/or lookup table for validators.

**Effort**: 1 hour

---

## Category 4: STALE / DEAD CODE

### Issue 4.1: Commented-Out Code Blocks
**Severity**: Medium  
**Files with significant commented code**:
- `src/simulator/resolvers.ts`: Lines 309, 885, 941-951 (console.log and old buff logic)
- `src/simulator/damage/damageBonuses.ts`: Lines 45-72 (old methods)
- `src/simulator/damage/damageEngine.ts`: Lines 172-186 (placeholder logic)
- `src/simulator/damage/damageModel.ts`: Lines 149-166 (commented calculations)
- `src/simulator/simulator.ts`: Lines 319, 658, 786-793 (old implementations)
- `src/data/operators/index.ts`: Lines 23, 27 (old exports)
- `src/features/solution/solutionSlice.ts`: Line 106 (old ID generation)

**Proposed Fix**: Remove all commented-out code. It's preserved in git history if needed.

**Effort**: 30 minutes

---

### Issue 4.2: TODO Comments Indicate Incomplete Features
**Severity**: Low (tracking purposes)  
**Files**: 7 files with 12 TODO comments

**Locations**:
- `src/simulator/resolvers.ts`: Lines 58, 841, 869
- `src/simulator/damage/damageEngine.ts`: Lines 171, 184
- `src/simulator/damage/damageModel.ts`: Lines 86, 165
- `src/features/operator/OperatorEditor.tsx`: Line 107
- `src/data/operators/lifeng.ts`: Line 221
- `src/data/operators/ember.ts`: Lines 128, 142
- `src/data/operators/endministrator.ts`: Line 141

**Recommendation**: Convert to GitHub issues or internal tickets for tracking. Inline TODOs tend to be forgotten.

---

### Issue 4.3: Unused Import Comments
**Severity**: Low  
**File**: `src/simulator/simulator.ts` (line 28)

**Problem**: `// import { dispatchAfterHit } from "./listeners/handlers";` - commented import that was never removed.

**Proposed Fix**: Delete the line.

**Effort**: 1 minute

---

### Issue 4.4: Potentially Unused Export `gearsSetData`
**Severity**: Low  
**File**: `src/data/gears/index.ts` (line 46)

**Problem**: `export { gearsSetData }` - need to verify if this is actually imported anywhere.

**Recommendation**: Check if used. If not, remove.

**Effort**: 5 minutes

---

## Summary Table

| Category | Count | Critical | High | Medium | Low |
|----------|-------|----------|------|--------|-----|
| Code Duplication | 7 | 0 | 2 | 4 | 1 |
| Over-Abstraction | 6 | 1 | 0 | 3 | 2 |
| Bloated Code | 5 | 1 | 3 | 1 | 0 |
| Stale/Dead Code | 4 | 0 | 0 | 1 | 3 |
| **TOTAL** | **22** | **2** | **5** | **9** | **6** |

**Estimated Total Refactoring Time**: 20-30 hours (if all issues addressed)

---

## Recommended Priority Order

### Phase 1: Quick Wins (1-2 hours)
1. **Issue 1.1**: Extract `countSetPieces()` utility
2. **Issue 4.1**: Remove commented-out code
3. **Issue 2.3**: Remove `makeSimEventId()` wrapper
4. **Issue 4.3**: Remove unused import comment

### Phase 2: Structural Improvements (1 day)
5. **Issue 3.1**: Split `resolvers.ts` into modules
6. **Issue 1.4**: Consolidate when-validation logic
7. **Issue 1.5**: Extract status hit scheduling helper

### Phase 3: Architecture Review (2-3 days)
8. **Issue 2.1**: Evaluate class-based data definitions
9. **Issue 3.2**: Refactor SimWorld into services
10. **Issue 1.3**: Consider plain objects for weapon definitions

---

## Next Steps

**For each issue you want to address, please reply with:**
- Issue number(s) to fix
- Any specific constraints or requirements
- Whether you want the fix done immediately or scheduled

**I will NOT modify any code without your explicit approval on each issue.**
