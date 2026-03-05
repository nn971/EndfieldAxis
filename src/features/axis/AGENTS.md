# AGENTS.md — src/features/axis/

## Purpose
Timeline editor UI — drag/drop skill boxes across lanes, resize, reorder lanes.
Uses local preview state during interactions, commits to Redux on completion.

## Structure
```
src/features/axis/
├── AxisEditor.tsx   # Main timeline component (~970 lines)
└── AGENTS.md        # This file
```

## Key Patterns

### Local vs Committed State
- **Local state**: drag position, resize preview, lane hover highlights
- **Committed state**: skill box positions, lane order via Redux actions
- Dispatch `onCommitSkillBoxPatch`, `onCommitLaneReorder` at interaction end

### Skill Box Model
```typescript
interface SkillBox {
  id: string;              // stable ID (sb_* prefix)
  operatorId: string;      // which operator's lane
  skillType: SkillType;    // normalAttack | normalSkill | comboSkill | ultimate
  startFrame: number;      // timeline position (frames)
  durationFrames: number;  // box width in frames
}
```

### Timeline Rendering
- SVG-based overlay for buff/infliction/energy tracks from `simRenderCache`
- Frame-based coordinate system (x-axis = time in frames)
- Lane rows = operators in `teamOperatorIds` order

### Drag Behavior
- Pointer down → capture start position
- Pointer move → update local preview (no Redux)
- Pointer up → compute final frame, dispatch `skillBoxPatched`
- Cross-lane drops → change `operatorId`, keep `startFrame`

## Anti-Patterns
- **NEVER** dispatch Redux actions on every pointer move
- **NEVER** mutate `skillBoxes` prop directly
- **AVOID** computing heavy SVG paths in render — memoize with `useMemo`

## Related
- `src/features/solution/solutionSlice.ts` — Redux actions dispatched here
- `src/types/editor.ts` — `SkillBox`, `SimRenderCache` types
- `src/simulator/` — produces the render cache for overlays
