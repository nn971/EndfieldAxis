// Simulator types are intentionally not imported here to avoid type-level cycles.

import { WeaponId } from "../data/weapons/WeaponDef";
import type { GearsId } from "../data/gears/GearsDef";

export interface OperatorBuild {
  level: number; // 1..90

  potentialRank: number; // 0..5
  skillRanks: Record<string, number>;
  talentRanks: Record<string, number>;
  weapon: {
    id: WeaponId;
    level: number;
    skillRanks: Record<string, number>;
  } | null;
  gears: Record<
    "armor" | "gloves" | "kit1" | "kit2",
    { gearId: GearsId | null; ranks: [number, number, number] }
  >;
}
