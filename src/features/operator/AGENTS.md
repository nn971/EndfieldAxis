# AGENTS.md — src/features/operator/

## Purpose
Operator build editor UI — edit levels, potential, skills, weapons, and gear.
Uses local preview state (sliders) during interactions, commits to Redux on completion.

## Structure
```
src/features/operator/
├── OperatorEditor.tsx    # Main editor component (~450 lines)
├── Tabs.tsx              # Build/Weapon/Gears tabs (~870 lines)
└── formatRestBonusLog.ts # Log formatting helper
```

## Key Patterns

### Preview Slider Pattern
- Sliders hold **local state** during drag
- `onCommit` callback fires at interaction end
- Dispatch single Redux action instead of continuous updates

### Tab Architecture
```
OperatorBuildTab  → Level, potential, skill ranks
WeaponTab         → Weapon selection, skill tree unlocks
GearsTab          → Armor, gloves, kit slots + set bonuses
```

### Build Model
```typescript
interface OperatorBuild {
  level: number;              // 1-90
  potentialRank: number;      // 0-5
  skillRanks: SkillRanks;     // Per-skill levels
  weaponId: WeaponId;         // Equipped weapon
  weaponSkillUnlocked: boolean[]; // Skill tree state
  gears: GearsSlots;          // 4 gear slots
}
```

### Commit Flow
1. User adjusts slider (local preview)
2. Pointer up triggers `onCommit(value)`
3. Parent computes `Partial<OperatorBuild>` patch
4. Dispatch `operatorBuildPatched({ operatorId, patch })`
5. `statUpdater()` recomputes derived stats automatically

## Anti-Patterns
- **NEVER** dispatch Redux actions on every slider change
- **NEVER** forget to call `statUpdater()` after build changes
- **AVOID** computing gear set bonuses in UI — use `statUpdater`

## Related
- `src/features/solution/solutionSlice.ts` — `operatorBuildPatched` action
- `src/features/solution/statUpdater.ts` — Recomputes stats after mutation
- `src/shared/components/PreviewSlider.tsx` — Slider component with preview
