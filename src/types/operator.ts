import type { SimStatusType, SimBuffType } from "./sim/infliction";

export type DmgType = "physical" | "heat" | "electric" | "cryo" | "nature";

export type SkillType =
  | "normalAttack"
  | "normalSkill"
  | "comboSkill"
  | "ultimate";
// | string;

export type SkillOpType =
  | "physicalHit" // one hit of damage, possibly with status
  | "applyBuff"; // apply a timed buff/debuff (e.g. enemy gets "crystal")
// | string;

export type SkillOp =
  | {
      frame: number;
      type: "physicalHit";
      dmgType?: DmgType;
      dmgMultiplier?: number;
      withStatus: boolean;
      statusType?: SimStatusType;
    }
  | {
      frame: number;
      type: "applyBuff";
      buffType: SimBuffType;
    };

export interface SkillDef {
  name: SkillType;
  durationFrames: number;
  icon: string;
  timeline?: SkillOp[];
}

export type OperatorId = string;

export interface OperatorDef {
  id: OperatorId;
  name: string;
  avatar: string;

  // Base attack used by DamageModel (Endfield: "OperatorAttack").
  // TODO: Confirm whether level scaling applies in-game; for now this is a direct value.
  baseAttack?: number;

  // skillDurationsFrames: Record<SkillType, number>; // TEMP

  skills: {
    [key in SkillType]?: SkillDef;
  };
}

export interface OperatorBuild {
  level: number; // 1..90

  // Endfield damage formula inputs (static during combat).
  mainAttributePoints?: number;
  secondaryAttributePoints?: number;

  potentialRank: number; // 0..5
  skillRanks: Record<string, number>;
  talentRanks: Record<string, number>;
  weapon: {
    weaponId: string;
    level: number;
    skillRanks: Record<string, number>;
  };
  gears: Record<
    "armor" | "gloves" | "kit1" | "kit2",
    { gearId: string | null; ranks: [number, number, number] }
  >;
}
