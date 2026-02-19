import { getOperator } from "../data/operators";
import { getWeapon } from "../data/weapons";
import type { OperatorBuild } from "../types/operator";
import type { SimEntity } from "../types/simulator/simulator";

/**
 * DamageModel is a pure computation layer.
 * The simulator should only:
 *   1) update buffs/debuffs/statuses via events
 *   2) call DamageModel at the moment a damage instance happens
 *   3) apply the returned integer damage to HP
 */

export type DamageKind = "physical" | "lift" | "crush";

export type DamageBucket =
  | "attackIncRatio" // 百分比加攻
  | "attackIncValue" // 固定值加攻
  | "skillMul" // 技能倍率
  | "outgoingIncMul" // 增伤
  | "outgoingAmpMul" // 增幅
  | "incomingIncMul" // 易伤
  | "incomingAmpMul" // 脆弱
  | "defendMul" // 防御
  | "resistanceMul" // 抗性
  | "staggerMul" // 失衡
  | "criticalHitMul" // 暴击
  | "specialMul"; // 特殊系数（连击、源石技艺强度）

export type DamageAtom = {
  bucket: DamageBucket;

  /** Additive ratio within the same bucket, e.g. +0.2 means +20%. */
  addRatio?: number;

  /** Additive flat value within the same bucket (mostly for attack). */
  addValue?: number;

  /** Debug label shown in breakdown. */
  note?: string;
};

export type DamageContext = {
  frame: number;
  kind: DamageKind;

  source: SimEntity;
  target: SimEntity;

  // Skill multiplier shown in your Endfield formula as DmgSkillMultiplier.
  // For status proc damage we usually pass 1.
  dmgSkillMultiplier: number;

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
  attackIncRatio: number;
  attackIncValue: number;
  mainAttributePoints: number;
  secondaryAttributePoints: number;
  attributeRatio: number;
  attackFinal: number;

  // Multipliers
  dmgSkillMultiplier: number;
  outgoingIncMul: number;
  outgoingAmpMul: number;
  incomingIncMul: number;
  incomingAmpMul: number;
  defendMul: number;
  resistanceMul: number;
  staggerMul: number;
  criticalHitMul: number;
  specialMul: number;

  // Debug atoms used
  atoms: DamageAtom[];

  // Final
  rawDamage: number;
};

export type DamageResult = {
  amount: number; // integer damage applied to HP
  breakdown: DamageBreakdown;
};

export type RoundingPolicy = {
  // Round a floating-point raw damage into an integer final damage.
  roundFinal: (rawDamage: number) => number;
};

export const defaultRoundingPolicy: RoundingPolicy = {
  // TODO: Endfield rounding policy is unknown. We start with floor-at-end.
  roundFinal: raw => Math.max(0, Math.floor(raw)),
};

export type DamageModel = {
  compute: (ctx: DamageContext) => DamageResult;
};

// TEMP constants (placeholders while reverse-engineering exact in-game formulas).
export const LIFT_SPECIAL_MULTIPLIER = 1.2;

function sumRatio(atoms: DamageAtom[], bucket: DamageBucket): number {
  let s = 0;
  for (const a of atoms) if (a.bucket === bucket) s += a.addRatio ?? 0;
  return s;
}

function sumValue(atoms: DamageAtom[], bucket: DamageBucket): number {
  let s = 0;
  for (const a of atoms) if (a.bucket === bucket) s += a.addValue ?? 0;
  return s;
}

function factorFromSum(sum: number): number {
  // "Each multiplier is additive within itself." We encode buckets as 1 + sum.
  return 1 + sum;
}

function collectAtoms(ctx: DamageContext): DamageAtom[] {
  const atoms: DamageAtom[] = [];

  // --- Built-in hooks by damage kind ---
  // User rule: lift / crush damage uses SpecialMultiplier; normal hits do not.
  if (ctx.kind === "lift") {
    atoms.push({
      bucket: "specialMul",
      addRatio: LIFT_SPECIAL_MULTIPLIER - 1,
      note: "lift.special(1.2)",
    });
  }

  // --- Target buffs / debuffs ---
  // crystal: debuff on enemy, lasts 300 frames, increases physical damage suffered by 20%.
  // IMPORTANT (user correction): crystal affects incomingIncMul, NOT incomingAmpMul.
  if (ctx.target.buffs?.crystal) {
    atoms.push({
      bucket: "incomingIncMul",
      addRatio: 0.2,
      note: "buff.crystal(+20% incomingInc)",
    });
  }

  // --- Future hooks ---
  if (ctx.isTargetStaggered) {
    atoms.push({
      bucket: "staggerMul",
      addRatio: 0.3,
      note: "hook.stagger(+0.3)",
    });
  }

  if (ctx.isCriticalHit) {
    // Placeholder. We don't know crit formula yet.
    atoms.push({
      bucket: "criticalHitMul",
      addRatio: 0,
      note: "hook.crit(TODO)",
    });
  }

  return atoms;
}

export function createDefaultDamageModel(params?: {
  roundingPolicy?: RoundingPolicy;
}): DamageModel {
  const roundingPolicy = params?.roundingPolicy ?? defaultRoundingPolicy;

  return {
    compute(ctx: DamageContext): DamageResult {
      const atoms = collectAtoms(ctx);

      // if (!ctx.source) throw new Error(`unhandled case: damage with no source`);
      // --- Attack stage ---
      const opDef = getOperator(ctx.source.id);
      const operatorAttack = Number(opDef?.baseAttack ?? 0);

      const weaponId = ctx.sourceBuild?.weapon?.weaponId;
      const weaponAttack = Number(
        (weaponId ? getWeapon(weaponId)?.attack : 0) ?? 0,
      );

      const attackIncRatio = sumRatio(atoms, "attackIncRatio");
      const attackIncValue = sumValue(atoms, "attackIncValue");

      const mainAttributePoints = Number(
        ctx.sourceBuild?.mainAttributePoints ?? 0,
      );
      const secondaryAttributePoints = Number(
        ctx.sourceBuild?.secondaryAttributePoints ?? 0,
      );
      const attributeRatio =
        mainAttributePoints * 0.005 + secondaryAttributePoints * 0.002;

      const attackFinal =
        ((operatorAttack + weaponAttack) * (1 + attackIncRatio) +
          attackIncValue) *
        (1 + attributeRatio);

      // --- Multipliers ---
      const dmgSkillMultiplier = Number(ctx.dmgSkillMultiplier ?? 1);

      // ratio buckets
      const outgoingIncMul = factorFromSum(sumRatio(atoms, "outgoingIncMul"));
      const outgoingAmpMul = factorFromSum(sumRatio(atoms, "outgoingAmpMul"));
      const incomingIncMul = factorFromSum(sumRatio(atoms, "incomingIncMul"));
      const incomingAmpMul = factorFromSum(sumRatio(atoms, "incomingAmpMul"));

      // TODO Set enemy defend to 50 for this moment
      // const defendMul = factorFromSum(sumRatio(atoms, "defendMul"));
      const defendMul = 0.5;

      const resistanceMul = factorFromSum(sumRatio(atoms, "resistanceMul"));
      const staggerMul = factorFromSum(sumRatio(atoms, "staggerMul"));
      const criticalHitMul = factorFromSum(sumRatio(atoms, "criticalHitMul"));

      // SpecialMultiplier only applies to lift / crush damage kinds.
      const specialMul =
        ctx.kind === "physical"
          ? 1
          : factorFromSum(sumRatio(atoms, "specialMul"));

      const rawDamage =
        attackFinal *
        dmgSkillMultiplier *
        outgoingIncMul *
        outgoingAmpMul *
        incomingIncMul *
        incomingAmpMul *
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
          attackIncRatio,
          attackIncValue,
          mainAttributePoints,
          secondaryAttributePoints,
          attributeRatio,
          attackFinal,

          dmgSkillMultiplier,
          outgoingIncMul,
          outgoingAmpMul,
          incomingIncMul,
          incomingAmpMul,
          defendMul,
          resistanceMul,
          staggerMul,
          criticalHitMul,
          specialMul,

          atoms,
          rawDamage,
        },
      };
    },
  };
}
