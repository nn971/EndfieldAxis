/**
 * Damage bonuses are collected by event listeners (buffs, talents, etc.)
 * and then fed into DamageModel as already-aggregated bucket totals.
 */

export type DamageBucket =
  | "atkIncRatio" // 百分比加攻
  | "atkIncFlat" // 固定值加攻
  | "dmgIncRatio" // 增伤
  | "dmgAmpRatio" // 增幅
  | "rcvDmgIncRatio" // 易伤
  | "rcvDmgAmpRatio" // 脆弱
  | "defendMul" // 防御
  | "resistanceMul" // 抗性
  | "staggerMul" // 失衡
  | "criticalHitMul" // 暴击
  | "specialMul"; // 特殊系数（连击、源石技艺强度）

export const DAMAGE_BUCKETS: readonly DamageBucket[] = [
  "atkIncRatio",
  "atkIncFlat",
  "dmgIncRatio",
  "dmgAmpRatio",
  "rcvDmgIncRatio",
  "rcvDmgAmpRatio",
  "defendMul",
  "resistanceMul",
  "staggerMul",
  "criticalHitMul",
  "specialMul",
] as const;

export type DamageBonusLogEntry = {
  bucket: DamageBucket;
  addValue: number;
  isRatio?: boolean;
  /** Debug label shown in breakdown. */
  note?: string;
};

export type DamageBonusSnapshot = Record<DamageBucket, number> & {
  log: DamageBonusLogEntry[];
};

// function makeZeroTotals(): Record<DamageBucket, number> {
//   return Object.fromEntries(DAMAGE_BUCKETS.map(b => [b, 0])) as Record<
//     DamageBucket,
//     number
//   >;
// }

export function createEmptyDamageBonuses(): DamageBonusSnapshot {
  return {
    ...(Object.fromEntries(DAMAGE_BUCKETS.map(b => [b, 0])) as Record<
      DamageBucket,
      number
    >),
    log: [],
  };
}

export class DamageBonusCollector {
  private snap: DamageBonusSnapshot;

  constructor() {
    this.snap = createEmptyDamageBonuses();
  }

  // addRatio(bucket: DamageBucket, delta: number, note?: string): void {
  //   if (!Number.isFinite(delta) || delta === 0) return;
  //   this.snap.ratio[bucket] += delta;
  //   this.snap.log.push({ bucket, addRatio: delta, note });
  // }

  addValue(bucket: DamageBucket, delta: number, note?: string): void {
    if (!Number.isFinite(delta) || delta === 0) return;
    this.snap[bucket] += delta;
    this.snap.log.push({ bucket, addValue: delta, note });
  }

  snapshot(): DamageBonusSnapshot {
    // defensive copy so callers don't accidentally mutate while keeping
    // object shape JSON-friendly.
    return {
      ...this.snap,
    };
  }
}
