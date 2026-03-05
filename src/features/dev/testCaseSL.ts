import { serializeSolution } from "../solution/solutionSL";
import type { SkillType } from "../../data/operators/OperatorDef";
import type { SolutionState } from "../../types/editor";
import { DAMAGE_BUCKETS } from "../../simulator/damage/damageBonuses";
import type { SimEventType } from "../../types/simulator/simulator";
import type { SimHitDamageSnapshot } from "../../types/simDamage";
import {
  toEventTypeSequence,
  type RunSolutionSimResult,
} from "../sim/runSolutionSim";

export const CURRENT_SIM_TEST_CASE_VERSION = 2;
const NUMBER_EPSILON = 1e-9;

type SimSeriesPoint = {
  frame: number;
  seq: number;
  value: number;
};

export type SimTestCompareMode =
  | "eventTypes"
  | "hitDamageBuckets"
  | "enemyStaggerSeries";

export type SimTestCase = {
  version: number;
  solution: SolutionState;
  expected: {
    eventTypes: SimEventType[];
    hitDamageBuckets: SimHitDamageSnapshot[];
    enemyStaggerSeries: SimSeriesPoint[];
  };
};

type CompareResult = {
  ok: boolean;
  code: CompareCode;
  meta?: Record<string, unknown>;
};

type DeserializeErrorCode =
  | "invalid_json"
  | "not_object"
  | "unsupported_version"
  | "missing_solution"
  | "missing_expected"
  | "invalid_eventTypes"
  | "invalid_hitBuckets"
  | "invalid_staggerSeries";

type CompareCode =
  | "event_count_mismatch"
  | "event_mismatch"
  | "hit_count_mismatch"
  | "hit_mismatch"
  | "stagger_count_mismatch"
  | "stagger_mismatch"
  | "pass";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function numberEq(a: number, b: number): boolean {
  return Math.abs(a - b) <= NUMBER_EPSILON;
}

function isSkillTypeOrNull(v: unknown): v is SkillType | null {
  return (
    v === null ||
    v === "normalAttack" ||
    v === "normalSkill" ||
    v === "comboSkill" ||
    v === "ultimate"
  );
}

function normalizeSolution(solution: SolutionState): SolutionState {
  return JSON.parse(serializeSolution(solution)) as SolutionState;
}

function validateHitDamageSnapshot(
  v: unknown,
): v is SimHitDamageSnapshot {
  if (!isPlainObject(v)) return false;
  if (
    !isFiniteNumber(v.frame) ||
    !isFiniteNumber(v.seq) ||
    typeof v.hitEventId !== "string" ||
    !(typeof v.castStartEventId === "string" || v.castStartEventId === null) ||
    !isSkillTypeOrNull(v.castSkillType) ||
    typeof v.sourceId !== "string" ||
    typeof v.targetId !== "string" ||
    typeof v.damageType !== "string" ||
    !isFiniteNumber(v.amount)
  ) {
    return false;
  }
  if (!isPlainObject(v.buckets)) return false;
  for (const bucket of DAMAGE_BUCKETS) {
    if (!isFiniteNumber(v.buckets[bucket])) return false;
  }
  return true;
}

function validateSimSeriesPoint(v: unknown): v is SimSeriesPoint {
  if (!isPlainObject(v)) return false;
  return (
    isFiniteNumber(v.frame) &&
    isFiniteNumber(v.seq) &&
    isFiniteNumber(v.value)
  );
}

export function createSimTestCase(
  solution: SolutionState,
  result: RunSolutionSimResult,
): SimTestCase {
  return {
    version: CURRENT_SIM_TEST_CASE_VERSION,
    solution: normalizeSolution(solution),
    expected: {
      eventTypes: toEventTypeSequence(result.processedEvents),
      hitDamageBuckets: result.hitDamageSnapshots,
      enemyStaggerSeries: result.simRenderCache.enemyStaggerSeries,
    },
  };
}

export function serializeSimTestCase(testCase: SimTestCase): string {
  return JSON.stringify(testCase, null, 2);
}

export function deserializeSimTestCase(
  text: string,
):
  | { ok: true; testCase: SimTestCase }
  | { ok: false; code: DeserializeErrorCode; meta?: Record<string, unknown> } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, code: "invalid_json" };
  }

  if (!isPlainObject(raw)) {
    return { ok: false, code: "not_object" };
  }
  if (raw.version !== 2) {
    return {
      ok: false,
      code: "unsupported_version",
      meta: {
        version: raw.version,
        expectedVersion: CURRENT_SIM_TEST_CASE_VERSION,
      },
    };
  }
  if (!isPlainObject(raw.solution)) {
    return { ok: false, code: "missing_solution" };
  }
  if (!isPlainObject(raw.expected)) {
    return { ok: false, code: "missing_expected" };
  }

  const eventTypes = raw.expected.eventTypes;
  if (!Array.isArray(eventTypes) || !eventTypes.every(v => typeof v === "string")) {
    return { ok: false, code: "invalid_eventTypes" };
  }

  const hitDamageBuckets = raw.expected.hitDamageBuckets;
  if (
    !Array.isArray(hitDamageBuckets) ||
    !hitDamageBuckets.every(validateHitDamageSnapshot)
  ) {
    return {
      ok: false,
      code: "invalid_hitBuckets",
    };
  }

  const enemyStaggerSeries = raw.expected.enemyStaggerSeries;
  if (
    !Array.isArray(enemyStaggerSeries) ||
    !enemyStaggerSeries.every(validateSimSeriesPoint)
  ) {
    return {
      ok: false,
      code: "invalid_staggerSeries",
    };
  }

  return { ok: true, testCase: raw as SimTestCase };
}

export function compareSimTestCase(
  testCase: SimTestCase,
  result: RunSolutionSimResult,
  mode: SimTestCompareMode,
): CompareResult {
  if (mode === "eventTypes") {
    const expected = testCase.expected.eventTypes;
    const actual = toEventTypeSequence(result.processedEvents);

    if (expected.length !== actual.length) {
      return {
        ok: false,
        code: "event_count_mismatch",
        meta: { expected: expected.length, actual: actual.length },
      };
    }

    for (let i = 0; i < expected.length; i++) {
      if (expected[i] !== actual[i]) {
        return {
          ok: false,
          code: "event_mismatch",
          meta: {
            index: i,
            expected: expected[i],
            actual: actual[i],
          },
        };
      }
    }

    return {
      ok: true,
      code: "pass",
      meta: { mode, count: actual.length },
    };
  }

  if (mode === "hitDamageBuckets") {
    const expectedHits = testCase.expected.hitDamageBuckets;
    const actualHits = result.hitDamageSnapshots;
    if (expectedHits.length !== actualHits.length) {
      return {
        ok: false,
        code: "hit_count_mismatch",
        meta: { expected: expectedHits.length, actual: actualHits.length },
      };
    }

    for (let i = 0; i < expectedHits.length; i++) {
      const expected = expectedHits[i];
      const actual = actualHits[i];

      if (
        expected.frame !== actual.frame ||
        expected.seq !== actual.seq ||
        expected.sourceId !== actual.sourceId ||
        expected.targetId !== actual.targetId ||
        expected.damageType !== actual.damageType
      ) {
        return {
          ok: false,
          code: "hit_mismatch",
          meta: {
            index: i,
            field: "identity",
            expected:
              `frame=${expected.frame}, seq=${expected.seq}, source=${expected.sourceId}, ` +
              `target=${expected.targetId}, type=${expected.damageType}`,
            actual:
              `frame=${actual.frame}, seq=${actual.seq}, source=${actual.sourceId}, ` +
              `target=${actual.targetId}, type=${actual.damageType}`,
            expectedFrame: expected.frame,
            actualFrame: actual.frame,
            expectedSeq: expected.seq,
            actualSeq: actual.seq,
            expectedSource: expected.sourceId,
            actualSource: actual.sourceId,
            expectedTarget: expected.targetId,
            actualTarget: actual.targetId,
            expectedType: expected.damageType,
            actualType: actual.damageType,
          },
        };
      }

      for (const bucket of DAMAGE_BUCKETS) {
        const expectedValue = Number(expected.buckets[bucket] ?? 0);
        const actualValue = Number(actual.buckets[bucket] ?? 0);
        if (!numberEq(expectedValue, actualValue)) {
          return {
            ok: false,
            code: "hit_mismatch",
            meta: {
              index: i,
              field: "bucket",
              bucket,
              expected: expectedValue,
              actual: actualValue,
            },
          };
        }
      }
    }

    return {
      ok: true,
      code: "pass",
      meta: { mode, count: actualHits.length },
    };
  }

  const expectedStagger = testCase.expected.enemyStaggerSeries;
  const actualStagger = result.simRenderCache.enemyStaggerSeries;
  if (expectedStagger.length !== actualStagger.length) {
    return {
      ok: false,
      code: "stagger_count_mismatch",
      meta: { expected: expectedStagger.length, actual: actualStagger.length },
    };
  }

  for (let i = 0; i < expectedStagger.length; i++) {
    const expected = expectedStagger[i];
    const actual = actualStagger[i];
    if (expected.frame !== actual.frame || expected.seq !== actual.seq) {
      return {
        ok: false,
        code: "stagger_mismatch",
        meta: {
          index: i,
          field: "identity",
          expected: `frame=${expected.frame}, seq=${expected.seq}`,
          actual: `frame=${actual.frame}, seq=${actual.seq}`,
          expectedFrame: expected.frame,
          actualFrame: actual.frame,
          expectedSeq: expected.seq,
          actualSeq: actual.seq,
          expectedValue: expected.value,
          actualValue: actual.value,
        },
      };
    }
    if (!numberEq(expected.value, actual.value)) {
      return {
        ok: false,
        code: "stagger_mismatch",
        meta: {
          index: i,
          field: "value",
          expected: expected.value,
          actual: actual.value,
          expectedFrame: expected.frame,
          actualFrame: actual.frame,
          expectedSeq: expected.seq,
          actualSeq: actual.seq,
          expectedValue: expected.value,
          actualValue: actual.value,
        },
      };
    }
  }

  return {
    ok: true,
    code: "pass",
    meta: { mode, count: actualStagger.length },
  };
}
