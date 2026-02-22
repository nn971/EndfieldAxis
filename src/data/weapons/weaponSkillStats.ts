import weaponsData from ".";
import { RestBonusEntry, RestStatBonusBucket } from "../../types/operator";
import { BaseWeaponSkillId, Size, WeaponId } from "./WeaponDef";

// export type WeaponSkillRestBonus = {
//   /** Flat attribute points (e.g. +12 agility). */
//   attributes?: Partial<Record<OperatorAttributeType, number>>;
//   /** Additive ratio (e.g. +0.1 means +10%). */
//   attackIncMul?: number;
//   /** Flat value attack bonus. */
//   attackIncValue?: number;
//   /** Additive ratio outgoing damage increase (currently used for physical). */
//   outgoingIncMul?: number;
//   note?: string;
// };

function clampRank(rank: number): number {
  if (!Number.isFinite(rank)) return 1;
  return Math.max(1, Math.min(9, Math.round(rank)));
}

/** Weapon skill boost values by ranks:
 * bump = max(0, rank - 8),
 * value = floor((A * rank + B) / 9) + C * bump
 *
 * (Flat boost by values, and ratio boost by 10*percentage.)
 */
const PARAMS: Record<
  BaseWeaponSkillId,
  Record<Size, { A: number; B: number; C: number }>
> = {
  agilityboost: {
    L: { A: 144, B: 44, C: 8 },
    M: { A: 115, B: 30, C: 6 },
    S: { A: 86, B: 24, C: 5 },
  },
  physicaldmgboost: {
    L: { A: 400, B: 104, C: 22 },
    M: { A: 320, B: 84, C: 18 },
    S: { A: 240, B: 63, C: 13 },
  },
  attackboost: {
    L: { A: 360, B: 90, C: 20 },
    M: { A: 288, B: 72, C: 16 },
    S: { A: 216, B: 54, C: 12 },
  },
};

function evalSkillBoostValues(
  family: BaseWeaponSkillId,
  size: Size,
  rank: number,
  isRatio: boolean = false,
): number {
  const r = Math.max(1, Math.min(9, Math.round(rank)));
  const bump = Math.max(0, r - 8);
  const { A, B, C } = PARAMS[family][size];
  const v = Math.floor((A * r + B) / 9) + C * bump;
  return isRatio ? v / 1000 : v;
}
// agility points: ticks
// percent with 1 decimal: ticks / 10
// simulator ratio: ticks / 1000

/**
 * Build-static rest-stat bonus atom from a weapon skill (id + rank).
 *
 * This function is intentionally pure (does not mutate the RestStatSnapshot).
 */
export function getWeaponSkillRestBonus(
  weaponId: WeaponId,
  skill: "s1" | "s2" | "s3",
  rank: number,
): RestBonusEntry | null {
  const r = clampRank(rank);

  if (skill != "s3") {
    const skillDef = weaponsData[weaponId][skill];
    const s = (skillDef as { size: Size }).size;
    switch ((skillDef as { id: WeaponId }).id) {
      case "agilityboost": {
        const addValue = evalSkillBoostValues("agilityboost", s, r);
        return {
          source: "weapon",
          bucket: "agility",
          addValue,
          log: `Weapon ${weaponId} ${skill} agilityboost (rank ${r})`,
        };
      }
      case "attackboost": {
        const addValue = evalSkillBoostValues("attackboost", s, r, true);
        return {
          source: "weapon",
          bucket: "atkIncRatio",
          addValue,
          log: `Weapon ${weaponId} ${skill} attackboost (rank ${r})`,
        };
      }
      case "physicaldmgboost": {
        const addValue = evalSkillBoostValues("physicaldmgboost", s, r, true);
        return {
          source: "weapon",
          bucket: "physicalDmgIncRatio",
          addValue,
          log: `Weapon ${weaponId} ${skill} physicaldmgboost (rank ${r})`,
        };
      }
      default:
        console.warn(
          `Unknown weapon skill id ${(skillDef as { id: WeaponId }).id} for rest bonus calculation; returning null.`,
        );
        return null;
    }
  } else {
    const skillDef = weaponsData[weaponId].s3;
    const addValue = skillDef.bonus.byRank(r);
    const bucket = skillDef.bonus.bucket as RestStatBonusBucket;
    return {
      source: "weapon",
      bucket,
      addValue,
      log:
        `Weapon ${weaponId} s3 ${String((skillDef as any).id ?? "")}`.trim() +
        ` (rank ${r})`,
    };
  }
}
