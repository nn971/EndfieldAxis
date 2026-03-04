import type { SkillType } from "../data/operators/OperatorDef";
import type { DamageBucket } from "../simulator/damage/damageBonuses";
import type { DamageType } from "./operator";

export type SimHitDamageSnapshot = {
  frame: number;
  seq: number;
  hitEventId: string;
  castStartEventId: string | null;
  castSkillType: SkillType | null;
  sourceId: string;
  targetId: string;
  damageType: DamageType;
  amount: number;
  buckets: Record<DamageBucket, number>;
};

export type SimDamageCache = {
  totalDamage: number;
  hitDamageSnapshots: SimHitDamageSnapshot[];
};

export function makeEmptySimDamageCache(): SimDamageCache {
  return {
    totalDamage: 0,
    hitDamageSnapshots: [],
  };
}
