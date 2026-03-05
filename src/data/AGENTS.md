# AGENTS.md — src/data/

## Purpose
Content definitions — operators, weapons, gears, buffs, reactions.
TypeScript modules (not JSON) enabling type safety and simulator hooks.

## Structure
```
src/data/
├── operators/
│   ├── OperatorDef.ts     # Base types: OperatorDef, SkillDef, etc.
│   ├── index.ts           # Glob imports all operator modules
│   └── *.ts               # One file per operator (default export)
├── weapons/
│   ├── WeaponDef.ts       # Weapon types + skill stats
│   ├── weaponSkillStats.ts
│   ├── index.ts
│   └── */                 # By weapon type: sword/, greatsword/, etc.
├── gears/
│   ├── GearsDef.ts        # Armor/gloves/kit definitions
│   ├── index.ts
│   └── */                 # armor/, gloves/, kit/, abstractSet/
└── buffs/
    ├── BuffDef.ts         # Buff types + registry
    ├── index.ts
    ├── common/            # Shared buffs
    ├── reactions/         # Elemental reactions
    ├── weapons/           # Weapon-specific buffs
    └── operators/         # Operator-specific buffs
```

## Key Patterns

### Operator Definition
```typescript
export default new (class extends OperatorDef {
  id = "estella" as OperatorId;
  name = "Estella";
  weaponType = "sword";
  skills = {
    ultimate: {
      name: "Ultimate Name",
      durationFrames: 180,
      icon: "path/to/icon",
      script: (ctx) => {
        // SimScript: schedule hit events, buffs, etc.
      }
    }
  };
})();
```

### Content Index Pattern
All content folders use `import.meta.glob()`:
```typescript
const modules = import.meta.glob("./*.ts", { eager: true });
export default Object.fromEntries(
  Object.values(modules).map(m => [m.default.id, m.default])
);
```

### Buff IDs
- Use constants: `buff.<operator>.<name>` or `buff.weapon.<name>`
- Unique across all content — check before adding
- Store in `BuffDef.ts` or reaction-specific files

### Weapon/Gear Stats
- Weapons have skill trees with unlockable bonuses
- Gears have 3 ranks each (armor, gloves, kit1, kit2)
- Abstract sets provide set bonuses at 2/4 pieces

## Anti-Patterns
- **NEVER** change operator IDs — breaks saved solutions
- **NEVER** duplicate buff logic in UI — keep in resolvers
- **NEVER** use plain `string` for IDs — use `OperatorId`, `BuffId` types
- **AVOID** inline skill formulas — use `SimScript` DSL

## Related
- `src/simulator/` — consumes these definitions
- `src/features/solution/statUpdater.ts` — computes gear/weapon stats
- `src/types/operator.ts` — `OperatorBuild` shape
