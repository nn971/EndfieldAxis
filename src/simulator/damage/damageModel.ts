import operatorsData from "../../data/operators";
import weaponsData from "../../data/weapons";
import type { DamageType, OperatorBuild } from "../../types/operator";
import type {
  OperatorAttributeType,
  OperatorStatSnapshot,
} from "../../data/operators/OperatorDef";
import type { SimEntity } from "../../types/simulator/simulator";
import type { DamageBonusLogEntry, DamageBonusSnapshot } from "./damageBonuses";

/**
 * DamageModel is a pure computation layer.
 * The simulator should only:
 *   1) update buffs/debuffs/statuses via events
 *   2) call DamageModel at the moment a damage instance happens
 *   3) apply the returned integer damage to HP
 */

export type DamageContext = {
  frame: number;
  type: DamageType;

  source: SimEntity;
  target: SimEntity;

  // Skill multiplier shown in your Endfield formula as DmgSkillMultiplier.
  // For status proc damage we usually pass 1.
  dmgSkillMultiplier: number;

  /**
   * Final aggregated bonuses (bucket totals + breakdown log).
   * The simulator is responsible for running listeners (buffs / talents / etc.)
   * and filling this snapshot.
   */
  bonuses: DamageBonusSnapshot;

  // Optional snapshot of the operator build. If absent, DamageModel will fall back
  // to neutral values (attributes = 0, weaponAttack = 0).
  sourceBuild?: OperatorBuild;

  // Hook for future: e.g. staggered target.
  isTargetStaggered?: boolean;

  // Hook for future: e.g. crit.
  isCriticalHit?: boolean;

  // Hook for future: special meta (like vuln stacks consumed).
  meta?: Record<string, unknown>;
};

export type DamageBreakdown = {
  // Attack stage
  operatorAttack: number;
  weaponAttack: number;
  atkIncRatio: number;
  atkIncFlat: number;
  attributeBonusRatio: number;
  atkFinal: number;

  // Multipliers
  dmgFinalMultiplier: number; // should serve as either skill multiplier or status multiplier
  dmgIncMul: number;
  dmgAmpMul: number;
  rcvDmgIncMul: number;
  rcvDmgAmpMul: number;
  defendMul: number;
  resistanceMul: number;
  staggerMul: number;
  criticalHitMul: number;

  specialMul: number; // Link; Not yet realized

  // Debug atoms used
  bonusLog: DamageBonusLogEntry[];

  // Raw damage
  rawOutcoming: number;
  rawDamage: number;
};

export type DamageResult = {
  amount: number; // integer damage applied to HP
  breakdown: DamageBreakdown;
};

// TODO Write testcase to test this
export type RoundingPolicy = {
  /** Round the outcoming damage
   *  Current guess: round
   */
  roundOutcoming: (rawDamage: number) => number;

  /** Round a floating-point raw damage into an integer final damage.
   *  Current guess: round
   */
  roundFinal: (rawDamage: number) => number;

  /** Round interpolated operator attack/attribute values from level scaling.
   *  Current guess: floor
   */
  roundScaledStat: (scaledValue: number) => number;
};

export const defaultRoundingPolicy: RoundingPolicy = {
  roundOutcoming: raw => Math.max(0, raw),
  roundFinal: raw => Math.max(0, Math.round(raw)),
  roundScaledStat: scaled => Math.max(0, Math.floor(scaled)),
};

export type DamageModel = {
  compute: (ctx: DamageContext) => DamageResult;
};

export function createDefaultDamageModel(params?: {
  roundingPolicy?: RoundingPolicy;
}): DamageModel {
  const roundingPolicy = params?.roundingPolicy ?? defaultRoundingPolicy;

  return {
    compute(ctx: DamageContext): DamageResult {
      const bonuses = ctx.bonuses;

      // --- Attack stage ---
      const opDef = operatorsData[ctx.source.id];
      if (!opDef)
        throw new Error(`Operator not found: ${JSON.stringify(ctx.source.id)}`);

      // Prefer precomputed restStat from the build; fallback to level interpolation
      // only when restStat is missing (older saved solutions / dev states).
      const restStat = ctx.sourceBuild?.restStat;

      let operatorAttack = 0;
      let weaponAttack = 0;
      // let levelStats = DEFAULT_STAT_SNAPSHOT;
      let attributeBonusRatio = 0;

      if (restStat) {
        operatorAttack = Number(restStat.operatorAttack ?? 0);
        weaponAttack = Number(restStat.weaponAttack ?? 0);
        attributeBonusRatio = Number(restStat.attributesBonusRatio ?? 0);
      } else {
        throw new Error(`Can not find operator build for id=${ctx.source.id}`);
      }

      const baseAtk = operatorAttack + weaponAttack;
      const atkIncRatio = bonuses.atkIncRatio;
      const atkIncFlat = bonuses.atkIncFlat;

      // const atkIncByRatio = Math.floor(baseAtk * atkIncRatio);
      // const atkFinal =
      //   (baseAtk + atkIncByRatio + atkIncFlat) * (1 + attributeBonusRatio);

      const atkFinal =
        (baseAtk * (1 + atkIncRatio) + atkIncFlat) * (1 + attributeBonusRatio);

      // --- Multipliers ---
      const dmgSkillMultiplier = Number(ctx.dmgSkillMultiplier ?? 1);

      // ratio buckets
      const dmgIncRatio = 1 + bonuses.dmgIncRatio;
      const dmgAmpRatio = 1 + bonuses.dmgAmpRatio;
      const rcvDmgIncRatio = 1 + bonuses.rcvDmgIncRatio;
      const rcvDmgAmpRatio = 1 + bonuses.rcvDmgAmpRatio;

      // TODO Set enemy defend to 50 for this moment
      // const defendMul = factorFromSum(sumRatio(atoms, "defendMul"));
      const defendMul = 0.5;

      const resistanceMul = 1 + bonuses.resistanceMul;
      const staggerMul = 1 + bonuses.staggerMul;
      const criticalHitMul = 1 + bonuses.criticalHitMul;

      const specialMul = 1 + bonuses.specialMul;

      const rawOutcoming =
        atkFinal *
        dmgSkillMultiplier *
        dmgIncRatio *
        dmgAmpRatio *
        criticalHitMul *
        specialMul;
      const amoutOutcoming = defaultRoundingPolicy.roundOutcoming(rawOutcoming);
      const rawDamage =
        amoutOutcoming *
        rcvDmgIncRatio *
        rcvDmgAmpRatio *
        defendMul *
        resistanceMul *
        staggerMul;
      const amount = roundingPolicy.roundFinal(rawDamage);

      return {
        amount,
        breakdown: {
          operatorAttack,
          weaponAttack,
          atkIncRatio: atkIncRatio,
          atkIncFlat: atkIncFlat,
          attributeBonusRatio,
          atkFinal: atkFinal,

          dmgFinalMultiplier: dmgSkillMultiplier,
          dmgIncMul: dmgIncRatio,
          dmgAmpMul: dmgAmpRatio,
          rcvDmgIncMul: rcvDmgIncRatio,
          rcvDmgAmpMul: rcvDmgAmpRatio,
          defendMul,
          resistanceMul,
          staggerMul,
          criticalHitMul,
          specialMul,

          bonusLog: bonuses.log,
          rawOutcoming,
          rawDamage,
        },
      };
    },
  };
}
