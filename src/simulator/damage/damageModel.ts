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

  // Total damage
  rawDamage: number;
};

export type DamageResult = {
  amount: number; // integer damage applied to HP
  breakdown: DamageBreakdown;
};

export type RoundingPolicy = {
  // Round a floating-point raw damage into an integer final damage.
  roundFinal: (rawDamage: number) => number;

  // Round interpolated operator attack/attribute values from level scaling.
  roundScaledStat: (scaledValue: number) => number;
};

export const defaultRoundingPolicy: RoundingPolicy = {
  // TODO: Endfield rounding policy is unknown. Keep easy to tweak later.
  roundFinal: raw => Math.max(0, Math.round(raw)),
  roundScaledStat: scaled => Math.max(0, Math.round(scaled)),
};

export type DamageModel = {
  compute: (ctx: DamageContext) => DamageResult;
};

const DEFAULT_STAT_SNAPSHOT: OperatorStatSnapshot = {
  attack: 0,
  strength: 0,
  agility: 0,
  intellect: 0,
  will: 0,
};

function factorFromSum(sum: number): number {
  // "Each multiplier is additive within itself." We encode buckets as 1 + sum.
  return 1 + sum;
}

const MAX_LEVEL = 90;

function clampOperatorLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  if (level < 1) return 1;
  if (level > MAX_LEVEL) return MAX_LEVEL;
  return level;
}

function clampWeaponLevel(level: number): number {
  if (!Number.isFinite(level)) return 1;
  if (level < 1) return 1;
  if (level > MAX_LEVEL) return MAX_LEVEL;
  return level;
}

function interpolateLevelStat(
  level: number,
  lv1: number,
  lv90: number,
  roundingPolicy: RoundingPolicy,
): number {
  const clamped = clampOperatorLevel(level);
  const t = (clamped - 1) / 89;
  const raw = lv1 + (lv90 - lv1) * t;
  return roundingPolicy.roundScaledStat(raw);
}

/** WARNING: should not in use */
function getLevelStats(params: {
  level: number;
  roundingPolicy: RoundingPolicy;
  level1?: OperatorStatSnapshot;
  level90?: OperatorStatSnapshot;
}): OperatorStatSnapshot {
  const lv1 = params.level1 ?? DEFAULT_STAT_SNAPSHOT;
  const lv90 = params.level90 ?? lv1;

  return {
    attack: interpolateLevelStat(
      params.level,
      lv1.attack,
      lv90.attack,
      params.roundingPolicy,
    ),
    strength: interpolateLevelStat(
      params.level,
      lv1.strength,
      lv90.strength,
      params.roundingPolicy,
    ),
    agility: interpolateLevelStat(
      params.level,
      lv1.agility,
      lv90.agility,
      params.roundingPolicy,
    ),
    intellect: interpolateLevelStat(
      params.level,
      lv1.intellect,
      lv90.intellect,
      params.roundingPolicy,
    ),
    will: interpolateLevelStat(
      params.level,
      lv1.will,
      lv90.will,
      params.roundingPolicy,
    ),
  };
}

/** WARNING: should not in use */
function getAttributeValue(
  stats: OperatorStatSnapshot,
  attributeType?: OperatorAttributeType,
): number {
  if (!attributeType) return 0;
  return Number(stats[attributeType] ?? 0);
}

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
      let levelStats = DEFAULT_STAT_SNAPSHOT;
      let attributeBonusRatio = 0;

      if (restStat) {
        operatorAttack = Number(restStat.operatorAttack ?? 0);
        weaponAttack = Number(restStat.weaponAttack ?? 0);
        attributeBonusRatio = Number(restStat.attributesBonusRatio ?? 0);
      } else {
        throw new Error(`Can not find operator build for id=${ctx.source.id}`);
        // if (!ctx.source) throw new Error(`unhandled case: damage with no source`);
        // --- Attack stage ---
        // const operatorLevel = clampOperatorLevel(
        //   Number(ctx.sourceBuild?.level ?? 1),
        // );
        // levelStats = getLevelStats({
        //   level: operatorLevel,
        //   roundingPolicy,
        //   level1: opDef?.stats?.level1,
        //   level90: opDef?.stats?.level90,
        // });
        // operatorAttack = Number(levelStats.attack ?? 0);

        // const weapon = ctx.sourceBuild?.weapon;
        // let weaponAttack = 0;
        // if (weapon != undefined && weapon.id != null) {
        //   const weaponDef = weaponsData[weapon.id];
        //   if (!weaponDef) {
        //     console.warn(`Weapon not found: ${JSON.stringify(weapon.id)}`);
        //   } else {
        //     const weaponLevel = clampWeaponLevel(Number(weapon.level));
        //     weaponAttack = interpolateLevelStat(
        //       weaponLevel,
        //       weaponDef?.atkStat?.level1 ?? 0,
        //       weaponDef?.atkStat?.level90 ?? 0,
        //       roundingPolicy,
        //     );
        //   }
        // }

        // const mainAttributePoints = getAttributeValue(
        //   levelStats,
        //   opDef?.attributes?.main,
        // );
        // const secondaryAttributePoints = getAttributeValue(
        //   levelStats,
        //   opDef?.attributes?.sub,
        // );
        // attributeBonusRatio =
        //   mainAttributePoints * 0.005 + secondaryAttributePoints * 0.002;
      }

      const atkIncRatio = bonuses.atkIncRatio;
      const atkIncFlat = bonuses.atkIncFlat;

      const atkFinal =
        ((operatorAttack + weaponAttack) * (1 + atkIncRatio) + atkIncFlat) *
        (1 + attributeBonusRatio);

      // --- Multipliers ---
      const dmgSkillMultiplier = Number(ctx.dmgSkillMultiplier ?? 1);

      // ratio buckets
      const dmgIncRatio = factorFromSum(bonuses.dmgIncRatio);
      const dmgAmpRatio = factorFromSum(bonuses.dmgAmpRatio);
      const rcvDmgIncRatio = factorFromSum(bonuses.rcvDmgIncRatio);
      const rcvDmgAmpRatio = factorFromSum(bonuses.rcvDmgAmpRatio);

      // TODO Set enemy defend to 50 for this moment
      // const defendMul = factorFromSum(sumRatio(atoms, "defendMul"));
      const defendMul = 0.5;

      const resistanceMul = factorFromSum(bonuses.resistanceMul);
      const staggerMul = factorFromSum(bonuses.staggerMul);
      const criticalHitMul = factorFromSum(bonuses.criticalHitMul);

      // TODO move these booleans elsewhere
      // const isPhysicalStatusDamage = Boolean(
      //   (ctx.meta as any)?.isPhysicalStatusDamage,
      // );
      // const statusSpecialMulRaw = Number(
      //   (ctx.meta as any)?.statusSpecialMul ?? 1,
      // );
      // const statusSpecialMul = Number.isFinite(statusSpecialMulRaw)
      //   ? statusSpecialMulRaw
      //   : 1;

      // Only status damage benefits from SpecialMultiplier.
      // const specialMul = isPhysicalStatusDamage
      //   ? statusSpecialMul * factorFromSum(bonuses.specialMul)
      //   : 1;
      const specialMul = 1;

      const rawDamage =
        atkFinal *
        dmgSkillMultiplier *
        dmgIncRatio *
        dmgAmpRatio *
        rcvDmgIncRatio *
        rcvDmgAmpRatio *
        defendMul *
        resistanceMul *
        staggerMul *
        criticalHitMul *
        specialMul;

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
          rawDamage,
        },
      };
    },
  };
}
