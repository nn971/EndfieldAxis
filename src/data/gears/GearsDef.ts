import { SimRegistry } from "../../simulator/listeners/registry";
import type { RestBonusEntry, RestStatBonusBucket } from "../../types/operator";
// import { OperatorAttributeType } from "../operators/OperatorDef";

export type GearsId = string;

export type GearsType = "armor" | "gloves" | "kit";
export const GearsTypeName = {
  armor: "Armor",
  gloves: "Gloves",
  kit: "Kit",
} as Record<GearsType, string>;

export type GearsDefInit = {
  id: GearsId;
  type: GearsType;
  name: string;
  icon: string;
  defend: number;
  bonusBuckets: {
    s1: RestStatBonusBucket;
    s2: RestStatBonusBucket;
    s3?: RestStatBonusBucket;
  };
  bonusValuesByRank: {
    s1: [number, number, number, number];
    s2: [number, number, number, number];
    s3?: [number, number, number, number];
  };
};

export type GearBonusKey = "s1" | "s2" | "s3";
const GEAR_BONUS_KEYS: readonly GearBonusKey[] = ["s1", "s2", "s3"];

export type GearRestBonus = {
  key: GearBonusKey;
  bucket: RestStatBonusBucket;
  /** 0..3 */
  rank: number;
  addValue: number;
};

export class GearsDef {
  public readonly id: GearsId;
  public readonly type: GearsType;
  public readonly name: string;
  public readonly icon: string;

  public readonly defend: number;
  public readonly bonusBuckets: {
    s1: RestStatBonusBucket;
    s2: RestStatBonusBucket;
    s3?: RestStatBonusBucket;
  };
  public readonly bonusValuesByRank: {
    s1: [number, number, number, number];
    s2: [number, number, number, number];
    s3?: [number, number, number, number];
  };

  constructor(init: GearsDefInit) {
    this.id = init.id;
    this.type = init.type;
    this.name = init.name;
    this.icon = init.icon;
    this.defend = init.defend;
    this.bonusBuckets = init.bonusBuckets;
    this.bonusValuesByRank = init.bonusValuesByRank;
  }

  registerSimPlugins(_registry: SimRegistry): void {}

  /**
   * Static rest-stat bonuses contributed by artificing ranks.
   *
   * Convention: ranks[0/1/2] correspond to s1/s2/s3.
   */
  getRestStatBonuses(ranks: [number, number, number]): GearRestBonus[] {
    const clamp = (r: number) =>
      Math.max(0, Math.min(3, Number.isFinite(r) ? Math.round(r) : 0));

    const rk: Record<GearBonusKey, number> = {
      s1: clamp(ranks[0]),
      s2: clamp(ranks[1]),
      s3: clamp(ranks[2]),
    };

    const bonuses: GearRestBonus[] = [];
    for (const key of GEAR_BONUS_KEYS) {
      const valueByRank = this.bonusValuesByRank[key];
      const bucket = this.bonusBuckets[key];
      if (!valueByRank || !bucket) continue;

      const rank = rk[key];
      const addValue = valueByRank[rank] ?? 0;
      bonuses.push({ key, bucket, rank, addValue });
    }
    return bonuses;
  }

  /**
   * Convenience wrapper returning log-ready rest bonus atoms.
   *
   * NOTE: kept separate from getRestStatBonuses so UI code can reuse the raw
   * bonus (bucket + value) without forcing a log format.
   */
  getRestAttributeBonus(
    ranks: [number, number, number],
    slotKey?: string,
  ): RestBonusEntry[] {
    return this.getRestStatBonuses(ranks)
      .filter(b => b.addValue !== 0)
      .map(b => ({
        source: "gear" as const,
        bucket: b.bucket,
        addValue: b.addValue,
        log: {
          code: "gear_slot_bonus",
          meta: {
            gearId: this.id,
            slotKey,
            bonusKey: b.key,
            rank: b.rank,
          },
        },
      }));
  }
}
