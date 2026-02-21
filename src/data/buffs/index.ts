import type { BuffId, BuffDef } from "./BuffDef";

/** Buff data is stored as TypeScript modules which are plugins to the simulator. */

const modules = import.meta.glob(
  ["./**/*.ts", "!./index.ts", "!./BuffDef.ts"],
  {
    eager: true,
  },
) as Record<string, { default: BuffDef }>;

const buffsData = Object.fromEntries(
  Object.values(modules).map(mod => {
    const buff = mod.default as unknown as BuffDef;
    return [buff.id, buff];
  }),
) as Record<BuffId, BuffDef>;

export default buffsData;
