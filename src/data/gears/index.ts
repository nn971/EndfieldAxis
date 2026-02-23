import type { RestBonusEntry } from "../../types/operator";
import type { GearsDef, GearsId } from "./GearsDef";

export type GearSetBonusData = {
  id: string;
  name: string;
  minPieces: number;
  gearIds: GearsId[];
  restBonuses: Pick<RestBonusEntry, "bucket" | "addValue" | "log">[];
  statusProc?: {
    onlyPhysicalStatus: boolean;
    damageType: "physical";
    dmgMultiplier: number;
  };
};

const gearModules = import.meta.glob(
  ["./**/*.ts", "!./index.ts", "!./GearsDef.ts", "!./abstractSet/**/*.ts"],
  {
    eager: true,
  },
) as Record<string, { default: GearsDef }>;

const gearsData = Object.fromEntries(
  Object.values(gearModules).map(mod => {
    const gear = mod.default as unknown as GearsDef;
    return [gear.id, gear];
  }),
) as Record<GearsId, GearsDef>;

type GearsSetDefClass = {
  setData: GearSetBonusData;
};

const setModules = import.meta.glob("./abstractSet/*.ts", {
  eager: true,
}) as Record<string, { default?: GearsSetDefClass }>;

const gearsSetData = Object.fromEntries(
  Object.values(setModules)
    .map(mod => mod.default)
    .filter((def): def is GearsSetDefClass => Boolean(def?.setData))
    .map(def => [def.setData.id, def.setData]),
) as Record<string, GearSetBonusData>;

export { gearsSetData };
export default gearsData;
