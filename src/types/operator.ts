// Simulator types are intentionally not imported here to avoid type-level cycles.

import { WeaponId } from "../data/weapons/WeaponDef";
import type { GearsId } from "../data/gears/GearsDef";
import {
  OperatorAttributeType,
  OperatorId,
} from "../data/operators/OperatorDef";

// type OutcomingDmgIncRatioBucket = "physical";

// type RestStatBonusesBucket =
//   | OperatorAttributeType
//   | "atkIncRatio"
//   | "atkIncValue"
//   | OutcomingDmgIncRatioBucket;

/** Bucket keys are intentionally aligned with damage buckets where possible. */
type RestStatBonusesBucket =
  | "baseAtk"
  | OperatorAttributeType
  | "attackIncMul" // ratio
  | "attackIncValue" // flat
  | "outgoingIncMul"; // ratio (currently only used for physical)

export type RestStatBonusEntry = {
  source:
    | "level" // operator & weapon level scaling
    | "potential"
    | "talent"
    | "weapon"
    | "gear";
  sourceId?: string;

  bucket: RestStatBonusesBucket;
  addRatio?: number;
  addValue?: number;

  note?: string;
};

export type RestStatSnapshot = {
  /** Split for damage breakdown UI. */
  operatorAttack: number;
  weaponAttack: number;
  /** operatorAttack + weaponAttack */
  baseAtk: number;

  /** Operator attributes after static build bonuses (level + weapon skills + gears). */
  attributes: Record<OperatorAttributeType, number>;

  /** Static damage buckets contributed by the build (weapon skills / gears). */
  damageBonusRatio: Partial<Record<"attackIncMul" | "outgoingIncMul", number>>;
  damageBonusValue: Partial<Record<"attackIncValue", number>>;

  /** Human-readable atoms, suitable for inspection / debugging. */
  log: RestStatBonusEntry[];
};

export interface OperatorBuild {
  id: OperatorId;
  level: number; // 1..90

  potentialRank: number; // 0..5
  skillRanks: Record<string, number>;
  talentRanks: Record<string, number>;
  weapon: {
    id: WeaponId | null;
    level: number;
    skillRanks: Record<string, number>;
  } | null;
  gears: Record<
    "armor" | "gloves" | "kit1" | "kit2",
    { gearId: GearsId | null; ranks: [number, number, number] }
  >;

  restStat: RestStatSnapshot;
}
