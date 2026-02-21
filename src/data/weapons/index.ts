import type { WeaponId, WeaponDef } from "./WeaponDef";

const modules = import.meta.glob(
  ["./**/*.ts", "!./index.ts", "!./WeaponDef.ts"],
  {
    eager: true,
  },
) as Record<string, { default: WeaponDef }>;

const weaponsData = Object.fromEntries(
  Object.values(modules).map(mod => {
    const weapon = mod.default as unknown as WeaponDef;
    return [weapon.id, weapon];
  }),
) as Record<WeaponId, WeaponDef>;

export default weaponsData;
