// Simulator types are intentionally not imported here to avoid type-level cycles.

import { WeaponId, WeaponSkillId } from "../data/weapons/WeaponDef";
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

/** also serves as infliction type */
export type DamageType = "physical" | "heat" | "electric" | "cryo" | "nature";
export const DAMAGE_TYPE_LIST = [
  "physical",
  "heat",
  "electric",
  "cryo",
  "nature",
] as DamageType[];

export type RestStatBonusBucket =
  | "baseAtk" // only used for add operatorAtk and weaponAtk
  | OperatorAttributeType
  | "atkIncRatio"
  | "atkIncFlat"
  | "artsIntensity"
  | "comboCooldownReduction"
  | "ultimateGainEfficiency"
  | "staggerEfficiency"
  | "physicalDmgIncRatio"
  | "ultimateDmgIncRatio";

/**
 * A single atom of build-static rest-stat bonus.
 *
 * - `bucket` tells what numeric slot it contributes to.
 * - `addValue` is the raw additive value stored in that bucket.
 * - `log` is a human-readable explanation for UI inspection.
 */
export type RestBonusEntry = {
  source:
    | "level" // operator & weapon level scaling
    | "trust" // trust bonuses main attribute
    | "potential"
    | "talent"
    | "weapon"
    | "gear";
  bucket: RestStatBonusBucket;
  addValue: number;
  // addRatio: number;
  log: string;
};

export type RestStatSnapshot = {
  /** Split for damage breakdown UI. */
  operatorAttack: number;
  weaponAttack: number;
  /** operatorAttack + weaponAttack */
  baseAtk: number;

  atkIncRatio: number;
  atkIncFlat: number;

  /** Operator attributes after static build bonuses (level + weapon skills + gears). */
  attributes: Record<OperatorAttributeType, number>;
  attributesBonusRatio: number; // fully depend on attributes; for convenience of damage model.

  criticalHitChance: number;
  criticalHitDmgIncRatio: number;

  artsIntensity: number;

  comboCooldownReduction: number;
  ultimateGainEfficiency: number;

  staggerEfficiency: number;
  dmgIncRatio: Record<DamageType, number>;

  // Hidden buckets
  ultimateDmgIncRatio: number;

  /** Human-readable atoms, suitable for inspection / debugging. */
  log: RestBonusEntry[];
};

export interface OperatorBuild {
  id: OperatorId;
  level: number; // 1..90

  potentialRank: number; // 0..5
  trustRank: number; // 0..4
  skillRanks: Record<string, number>;
  talentRanks: Record<string, number>;
  weapon: {
    id: WeaponId | null;
    level: number;
    skillRanks: { s1: number; s2: number; s3: number };
  };
  gears: Record<
    "armor" | "gloves" | "kit1" | "kit2",
    { gearId: GearsId | null; ranks: [number, number, number] }
  >;

  restStat: RestStatSnapshot;
}
