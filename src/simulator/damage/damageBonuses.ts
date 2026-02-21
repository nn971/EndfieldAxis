/**
 * Damage bonuses are collected by event listeners (buffs, talents, etc.)
 * and then fed into DamageModel as already-aggregated bucket totals.
 */

export type DamageBucket =
  | "attackIncMul" // 百分比加攻
  | "attackIncValue" // 固定值加攻
  | "skillMul" // 技能倍率（目前不走 bucket，保留作未来扩展）
  | "outgoingIncMul" // 增伤
  | "outgoingAmpMul" // 增幅
  | "incomingIncMul" // 易伤
  | "incomingAmpMul" // 脆弱
  | "defendMul" // 防御
  | "resistanceMul" // 抗性
  | "staggerMul" // 失衡
  | "criticalHitMul" // 暴击
  | "specialMul"; // 特殊系数（连击、源石技艺强度）

export const DAMAGE_BUCKETS: readonly DamageBucket[] = [
  "attackIncMul",
  "attackIncValue",
  "skillMul",
  "outgoingIncMul",
  "outgoingAmpMul",
  "incomingIncMul",
  "incomingAmpMul",
  "defendMul",
  "resistanceMul",
  "staggerMul",
  "criticalHitMul",
  "specialMul",
] as const;

export type DamageBonusLogEntry = {
  bucket: DamageBucket;

  /** Additive ratio within the same bucket, e.g. +0.2 means +20%. */
  addRatio?: number;

  /** Additive flat value within the same bucket (mostly for attack). */
  addValue?: number;

  /** Debug label shown in breakdown. */
  note?: string;
};

export type DamageBonusSnapshot = {
  /** Additive totals for ratio buckets (each bucket becomes 1 + ratio[bucket]). */
  ratio: Record<DamageBucket, number>;
  /** Additive totals for flat-value buckets (mostly attackIncValue). */
  value: Record<DamageBucket, number>;
  /** Human-readable log entries for breakdown. */
  log: DamageBonusLogEntry[];
};

function makeZeroTotals(): Record<DamageBucket, number> {
  return Object.fromEntries(DAMAGE_BUCKETS.map(b => [b, 0])) as Record<
    DamageBucket,
    number
  >;
}

export function createEmptyDamageBonuses(): DamageBonusSnapshot {
  return {
    ratio: makeZeroTotals(),
    value: makeZeroTotals(),
    log: [],
  };
}

export class DamageBonusCollector {
  private snap: DamageBonusSnapshot;

  constructor() {
    this.snap = createEmptyDamageBonuses();
  }

  addRatio(bucket: DamageBucket, delta: number, note?: string): void {
    if (!Number.isFinite(delta) || delta === 0) return;
    this.snap.ratio[bucket] += delta;
    this.snap.log.push({ bucket, addRatio: delta, note });
  }

  addValue(bucket: DamageBucket, delta: number, note?: string): void {
    if (!Number.isFinite(delta) || delta === 0) return;
    this.snap.value[bucket] += delta;
    this.snap.log.push({ bucket, addValue: delta, note });
  }

  snapshot(): DamageBonusSnapshot {
    // defensive copy so callers don't accidentally mutate while keeping
    // object shape JSON-friendly.
    return {
      ratio: { ...this.snap.ratio },
      value: { ...this.snap.value },
      log: [...this.snap.log],
    };
  }
}
