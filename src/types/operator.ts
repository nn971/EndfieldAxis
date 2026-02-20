import type { SimStatusType, SimBuffType } from "./simulator/infliction";

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

export type OperatorAttributeType =
  | "strength"
  | "agility"
  | "intellect"
  | "will";

export interface OperatorStatSnapshot {
  attack: number;
  strength: number;
  agility: number;
  intellect: number;
  will: number;
}

export interface OperatorDef {
  id: OperatorId;
  name: string;
  avatar: string;

  attributes: {
    main: OperatorAttributeType;
    sub: OperatorAttributeType;
  };

  stats: {
    level1: OperatorStatSnapshot;
    level90: OperatorStatSnapshot;
  };

  skills: {
    [key in SkillType]?: SkillDef;
  };
}

export interface OperatorBuild {
  level: number; // 1..90

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
