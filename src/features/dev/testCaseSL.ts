import { serializeSolution } from "../solution/solutionSL";
import type { SolutionState } from "../../types/editor";
import { DAMAGE_BUCKETS, type DamageBucket } from "../../simulator/damage/damageBonuses";
import type { SimEventType } from "../../types/simulator/simulator";
import {
  toEventTypeSequence,
  type RunSolutionSimResult,
  type SimHitDamageSnapshot,
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
  message: string;
};

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function numberEq(a: number, b: number): boolean {
  return Math.abs(a - b) <= NUMBER_EPSILON;
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
): { ok: true; testCase: SimTestCase } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "Invalid JSON (parse failed)." };
  }

  if (!isPlainObject(raw)) {
    return { ok: false, error: "Test case must be a JSON object." };
  }
  if (raw.version !== 2) {
    return {
      ok: false,
      error: `Unsupported test case version ${String(raw.version)} (expected 2).`,
    };
  }
  if (!isPlainObject(raw.solution)) {
    return { ok: false, error: "Test case solution is missing or invalid." };
  }
  if (!isPlainObject(raw.expected)) {
    return { ok: false, error: "Test case expected section is missing." };
  }

  const eventTypes = raw.expected.eventTypes;
  if (!Array.isArray(eventTypes) || !eventTypes.every(v => typeof v === "string")) {
    return { ok: false, error: "Expected eventTypes must be an array of strings." };
  }

  const hitDamageBuckets = raw.expected.hitDamageBuckets;
  if (
    !Array.isArray(hitDamageBuckets) ||
    !hitDamageBuckets.every(validateHitDamageSnapshot)
  ) {
    return {
      ok: false,
      error:
        "Expected hitDamageBuckets must be an array of hit snapshots with complete bucket values.",
    };
  }

  const enemyStaggerSeries = raw.expected.enemyStaggerSeries;
  if (
    !Array.isArray(enemyStaggerSeries) ||
    !enemyStaggerSeries.every(validateSimSeriesPoint)
  ) {
    return {
      ok: false,
      error:
        "Expected enemyStaggerSeries must be an array of points with frame, seq, and value.",
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
        message: `Event count mismatch: expected ${expected.length}, got ${actual.length}.`,
      };
    }

    for (let i = 0; i < expected.length; i++) {
      if (expected[i] !== actual[i]) {
        return {
          ok: false,
          message: `Event mismatch at index ${i}: expected ${expected[i]}, got ${actual[i]}.`,
        };
      }
    }

    return {
      ok: true,
      message: `Pass: ${actual.length} events match by type.`,
    };
  }

  if (mode === "hitDamageBuckets") {
    const expectedHits = testCase.expected.hitDamageBuckets;
    const actualHits = result.hitDamageSnapshots;
    if (expectedHits.length !== actualHits.length) {
      return {
        ok: false,
        message: `Hit count mismatch: expected ${expectedHits.length}, got ${actualHits.length}.`,
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
          message:
            `Hit mismatch at index ${i}: ` +
            `expected [frame=${expected.frame}, seq=${expected.seq}, source=${expected.sourceId}, target=${expected.targetId}, type=${expected.damageType}], ` +
            `got [frame=${actual.frame}, seq=${actual.seq}, source=${actual.sourceId}, target=${actual.targetId}, type=${actual.damageType}].`,
        };
      }

      for (const bucket of DAMAGE_BUCKETS) {
        const expectedValue = Number(expected.buckets[bucket] ?? 0);
        const actualValue = Number(actual.buckets[bucket] ?? 0);
        if (!numberEq(expectedValue, actualValue)) {
          return {
            ok: false,
            message:
              `Bucket mismatch at hit index ${i} (${bucket}): ` +
              `expected ${expectedValue}, got ${actualValue}.`,
          };
        }
      }
    }

    return {
      ok: true,
      message: `Pass: ${actualHits.length} hit events match all damage buckets.`,
    };
  }

  const expectedStagger = testCase.expected.enemyStaggerSeries;
  const actualStagger = result.simRenderCache.enemyStaggerSeries;
  if (expectedStagger.length !== actualStagger.length) {
    return {
      ok: false,
      message: `Enemy stagger point count mismatch: expected ${expectedStagger.length}, got ${actualStagger.length}.`,
    };
  }

  for (let i = 0; i < expectedStagger.length; i++) {
    const expected = expectedStagger[i];
    const actual = actualStagger[i];
    if (expected.frame !== actual.frame || expected.seq !== actual.seq) {
      return {
        ok: false,
        message:
          `Enemy stagger point mismatch at index ${i}: ` +
          `expected [frame=${expected.frame}, seq=${expected.seq}], ` +
          `got [frame=${actual.frame}, seq=${actual.seq}].`,
      };
    }
    if (!numberEq(expected.value, actual.value)) {
      return {
        ok: false,
        message:
          `Enemy stagger value mismatch at index ${i}: ` +
          `expected ${expected.value}, got ${actual.value}.`,
      };
    }
  }

  return {
    ok: true,
    message: `Pass: ${actualStagger.length} enemy stagger points match.`,
  };
}
