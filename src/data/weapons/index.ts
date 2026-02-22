import type { WeaponId, WeaponDef } from "./WeaponDef";

const modules = import.meta.glob(
  ["./**/*.ts", "!./index.ts", "!./WeaponDef.ts", "!./weaponSkillStats.ts"],
  {
    eager: true,
  },
) as Record<string, { default: WeaponDef }>;

const weaponsData = Object.fromEntries(
  Object.values(modules).map(mod => {
    const weapon = mod.default as unknown as WeaponDef;
    // console.log(`Loaded weapon: ${weapon.id} - ${weapon.name}`);
    return [weapon.id, weapon];
  }),
) as Record<WeaponId, WeaponDef>;

export default weaponsData;
