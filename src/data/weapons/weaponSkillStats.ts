import type { OperatorAttributeType } from "../operators/OperatorDef";

export type WeaponSkillRestBonus = {
  /** Flat attribute points (e.g. +12 agility). */
  attributes?: Partial<Record<OperatorAttributeType, number>>;
  /** Additive ratio (e.g. +0.1 means +10%). */
  attackIncMul?: number;
  /** Flat value attack bonus. */
  attackIncValue?: number;
  /** Additive ratio outgoing damage increase (currently used for physical). */
  outgoingIncMul?: number;
  note?: string;
};

function clampRank(rank: number): number {
  if (!Number.isFinite(rank)) return 1;
  return Math.max(1, Math.min(9, Math.round(rank)));
}

type Size = "L" | "M" | "S";
type SkillFamily = "agilityboost" | "physicaldmgboost" | "attackboost";
/** Weapon skill boost values by ranks:
 * bump = max(0, rank - 8)
 * value = floor((A * rank + B) / 9) + C * bump
 *
 * (Flat boost by values, and ratio boost by 10*percentage.)
 */
const PARAMS: Record<
  SkillFamily,
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
  family: SkillFamily,
  size: Size,
  rank: number,
): number {
  const r = Math.max(1, Math.min(9, Math.round(rank)));
  const bump = Math.max(0, r - 8);
  const { A, B, C } = PARAMS[family][size];
  return Math.floor((A * r + B) / 9) + C * bump;
}
// agility points: ticks
// percent with 1 decimal: ticks / 10
// simulator ratio: ticks / 1000

/**
 * Build-static rest-stat bonuses from weapon skill id + rank.
 */
export function getWeaponSkillRestBonuses(
  skillId: string,
  rank: number,
): WeaponSkillRestBonus[] {
  const r = clampRank(rank);
  const [name, size] = String(skillId).split(".");
  const s = size ?? "";

  if (s != "L" && s != "M" && s != "S") return [];
  else {
    switch (name) {
      case "agilityboost": {
        const add = evalSkillBoostValues("agilityboost", s as Size, r);
        return [
          {
            attributes: { agility: add },
            note: `Weapon skill ${skillId}: +${add} agility (rank ${r})`,
          },
        ];
      }
      case "attackboost": {
        const add = evalSkillBoostValues("attackboost", s as Size, r) * 0.001;
        return [
          {
            attackIncMul: add,
            note: `Weapon skill ${skillId}: +${add * 100}% ATK (rank ${r})`,
          },
        ];
      }
      case "physicaldmgboost": {
        const add =
          evalSkillBoostValues("physicaldmgboost", s as Size, r) * 0.001;
        return [
          {
            // TODO: should be applied only to physical damage
            outgoingIncMul: add,
            note: `Weapon skill ${skillId}: +${add * 100}% physical dmg (rank ${r})`,
          },
        ];
      }
      default:
        return [];
    }
  }
}
