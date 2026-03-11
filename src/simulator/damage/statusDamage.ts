import type { SimStatusType } from "../../types/simulator/infliction";

const PHYSICAL_STATUS_LIFT_KNOCKDOWN_BASE_MUL = 1.2;
const PHYSICAL_STATUS_CRUSH_BASE_MUL = 1.5;
const PHYSICAL_STATUS_BREACH_BASE_MUL = 0.5;

const PHYSICAL_LEVEL_MUL_DIVISOR = 426.5;
const ARTS_LEVEL_MUL_DIVISOR = 213.25;

function clampLevel(level: number): number {
  return Math.min(90, Math.max(1, Number.isFinite(level) ? level : 1));
}

function clampArtsIntensity(artsIntensity: number): number {
  return Number.isFinite(artsIntensity) ? artsIntensity : 0;
}

function computePhysicalLevelMul(level: number): number {
  return 1 + (level + 9) / PHYSICAL_LEVEL_MUL_DIVISOR;
}

function computeArtsLevelMul(level: number): number {
  return 1 + (level + 9) / ARTS_LEVEL_MUL_DIVISOR;
}

function computeArtsMul(artsIntensity: number): number {
  return 1 + artsIntensity / 100;
}

export function computePhysicalStatusMultiplier(
  statusType: SimStatusType,
  level: number,
  artsIntensity: number,
  vulnerableStacks: number = 0,
): number {
  const clampedLevel = clampLevel(level);
  const clampedArts = clampArtsIntensity(artsIntensity);
  const consumed = Math.max(0, vulnerableStacks);

  const levelMul = computePhysicalLevelMul(clampedLevel);
  const artsMul = computeArtsMul(clampedArts);

  let baseMul = 1;
  switch (statusType) {
    case "lift":
    case "knockDown":
      baseMul = PHYSICAL_STATUS_LIFT_KNOCKDOWN_BASE_MUL;
      break;
    case "crush":
      baseMul = PHYSICAL_STATUS_CRUSH_BASE_MUL * (1 + consumed);
      break;
    case "breach":
      baseMul = PHYSICAL_STATUS_BREACH_BASE_MUL * (1 + consumed);
      break;
    default: {
      const _exhaustiveCheck: never = statusType;
      console.warn(
        `unknown statusType ${_exhaustiveCheck} when computing physical status multiplier`,
      );
      baseMul = 1;
    }
  }

  return baseMul * levelMul * artsMul;
}

export const SOLIDIFICATION_INITIAL_HIT_BASE_MUL = 0.6;
export const SOLIDIFICATION_INITIAL_HIT_PER_STACK_MUL = 0.4;
export const COMBUSTION_INITIAL_HIT_BASE_MUL = 0.5;
export const COMBUSTION_INITIAL_HIT_PER_STACK_MUL = 0.35;
export const ELECTRIFICATION_INITIAL_HIT_BASE_MUL = 0.5;
export const ELECTRIFICATION_INITIAL_HIT_PER_STACK_MUL = 0.35;
export const CORROSION_INITIAL_HIT_BASE_MUL = 0.5;
export const CORROSION_INITIAL_HIT_PER_STACK_MUL = 0.35;

export type ArtsReactionType =
  | "solidification"
  | "combustion"
  | "electrification"
  | "corrosion";

export function computeArtsReactionMultiplier(
  reactionType: ArtsReactionType,
  consumedStacks: number,
  level: number,
  artsIntensity: number,
): number {
  const clampedLevel = clampLevel(level);
  const clampedArts = clampArtsIntensity(artsIntensity);
  const consumed = Math.max(0, consumedStacks);

  const levelMul = computeArtsLevelMul(clampedLevel);
  const artsMul = computeArtsMul(clampedArts);

  let baseMul = 1;
  switch (reactionType) {
    case "solidification":
      baseMul =
        SOLIDIFICATION_INITIAL_HIT_BASE_MUL +
        consumed * SOLIDIFICATION_INITIAL_HIT_PER_STACK_MUL;
      break;
    case "combustion":
      baseMul =
        COMBUSTION_INITIAL_HIT_BASE_MUL +
        consumed * COMBUSTION_INITIAL_HIT_PER_STACK_MUL;
      break;
    case "electrification":
      baseMul =
        ELECTRIFICATION_INITIAL_HIT_BASE_MUL +
        consumed * ELECTRIFICATION_INITIAL_HIT_PER_STACK_MUL;
      break;
    case "corrosion":
      baseMul =
        CORROSION_INITIAL_HIT_BASE_MUL +
        consumed * CORROSION_INITIAL_HIT_PER_STACK_MUL;
      break;
    default: {
      const _exhaustiveCheck: never = reactionType;
      console.warn(
        `unknown reactionType ${_exhaustiveCheck} when computing arts reaction multiplier`,
      );
      baseMul = 1;
    }
  }

  return baseMul * levelMul * artsMul;
}

export const ARTS_BURST_DELAY_FRAMES = 12;
export const ARTS_BURST_BASE_MUL = 1.6;
export const ARTS_BURST_PER_STACK_MUL = 0;

export function computeArtsBurstMultiplier(
  stacks: number,
  level: number,
  artsIntensity: number,
): number {
  const clampedLevel = clampLevel(level);
  const clampedArts = clampArtsIntensity(artsIntensity);
  const stackCount = Math.max(0, stacks);

  const levelMul = computeArtsLevelMul(clampedLevel);
  const artsMul = computeArtsMul(clampedArts);
  const baseMul = ARTS_BURST_BASE_MUL + stackCount * ARTS_BURST_PER_STACK_MUL;

  return baseMul * levelMul * artsMul;
}

export const SOLIDIFICATION_SHATTER_BASE_MUL = 1.2;
export const SOLIDIFICATION_SHATTER_PER_STACK_MUL = 1.2;

export function computeSolidificationShatterMultiplier(
  solidificationStacks: number,
  level: number,
  artsIntensity: number,
): number {
  const clampedLevel = clampLevel(level);
  const clampedArts = clampArtsIntensity(artsIntensity);
  const stacks = Math.max(0, solidificationStacks);

  const levelMul = computeArtsLevelMul(clampedLevel);
  const artsMul = computeArtsMul(clampedArts);
  const baseMul =
    SOLIDIFICATION_SHATTER_BASE_MUL +
    stacks * SOLIDIFICATION_SHATTER_PER_STACK_MUL;

  // console.log(
  //   `level: ${level}, artsIntensity: ${artsIntensity}, solidificationStacks: ${solidificationStacks}`,
  // );
  // console.log(baseMul * levelMul * artsMul);
  return baseMul * levelMul * artsMul;
}

export const SOLIDIFICATION_BASE_DURATION_FRAMES = 360;
export const SOLIDIFICATION_EXTRA_DURATION_PER_STACK_FRAMES = 60;
export const COMBUSTION_DOT_BASE_MUL = 0.2;
export const COMBUSTION_DOT_PER_STACK_MUL = 0.12;
export const COMBUSTION_DOT_INTERVAL_FRAMES = 60;
export const ELECTRIFICATION_BASE_DURATION_FRAMES = 720;
export const ELECTRIFICATION_EXTRA_DURATION_PER_STACK_FRAMES = 360;
export const ELECTRIFICATION_RCV_ARTS_BASE = 0.12;
export const ELECTRIFICATION_RCV_ARTS_PER_STACK = 0.04;
export const CORROSION_REDUCTION_PER_SECOND_BASE = 0.04;
export const CORROSION_REDUCTION_PER_SECOND_PER_STACK = 0.02;
export const CORROSION_MIN_RESISTANCE_BASE = -0.2;
export const CORROSION_MIN_RESISTANCE_PER_STACK = -0.08;
export const COMBUSTION_DURATION_FRAMES = 600;
export const CORROSION_DURATION_FRAMES = 900;
