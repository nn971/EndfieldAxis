import type { GearsDef, GearsId } from "./GearsDef";

const modules = import.meta.glob(
  ["./**/*.ts", "!./index.ts", "!./GearsDef.ts"],
  {
    eager: true,
  },
) as Record<string, { default: GearsDef }>;

const gearsData = Object.fromEntries(
  Object.values(modules).map(mod => {
    const gear = mod.default as unknown as GearsDef;
    return [gear.id, gear];
  }),
) as Record<GearsId, GearsDef>;

export default gearsData;
