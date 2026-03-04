import {
  makeEmptySimRenderCache,
  type SolutionState,
  type SkillBox,
} from "../../types/editor";
import { makeEmptySimDamageCache } from "../../types/simDamage";

// Bump this when you change the serialized shape.
export const CURRENT_SOLUTION_VERSION = 2;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isSkillBox(v: unknown): v is SkillBox {
  if (!isPlainObject(v)) return false;
  return (
    typeof v.id === "string" &&
    typeof v.operatorId === "string" &&
    typeof v.skillType === "string" &&
    typeof v.startFrame === "number" &&
    typeof v.durationFrames === "number"
  );
}

/**
 * Canonicalize ordering to make saved JSON diffs friendlier.
 */
function canonicalizeSolution(sol: SolutionState): SolutionState {
  const skillBoxes = [...sol.skillBoxes].sort((a, b) => {
    if (a.startFrame !== b.startFrame) return a.startFrame - b.startFrame;
    if (a.operatorId !== b.operatorId)
      return a.operatorId.localeCompare(b.operatorId);
    if (a.skillType !== b.skillType)
      return a.skillType.localeCompare(b.skillType);
    return a.id.localeCompare(b.id);
  });

  return {
    ...sol,
    skillBoxes,
  };
}

function stripRuntimeFields(sol: SolutionState): SolutionState {
  return {
    ...sol,
    simRenderCache: makeEmptySimRenderCache(),
    simDamageCache: makeEmptySimDamageCache(),
  };
}

export function serializeSolution(sol: SolutionState): string {
  const normalized: SolutionState = {
    ...sol,
    version: sol.version ?? CURRENT_SOLUTION_VERSION,
  };
  return JSON.stringify(
    stripRuntimeFields(canonicalizeSolution(normalized)),
    null,
    2,
  );
}

export function deserializeSolution(
  text: string,
): { ok: true; solution: SolutionState } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: "Invalid JSON (parse failed)." };
  }

  // Migration entry point.
  const migrated = migrateToCurrent(raw);
  if (!migrated.ok) return migrated;

  const validated = validateSolution(migrated.solution);
  if (!validated.ok) return validated;
  return { ok: true, solution: canonicalizeSolution(validated.solution) };
}

function migrateToCurrent(
  raw: unknown,
): { ok: true; solution: SolutionState } | { ok: false; error: string } {
  // v0 (legacy): allow missing "version" and treat it as v1 if other fields match.
  if (!isPlainObject(raw))
    return { ok: false, error: "Solution must be a JSON object." };

  const version = typeof raw.version === "number" ? raw.version : 0;
  if (version === 0) {
    // Only migrate if it looks like a v1 solution minus the version field.
    const candidate: any = {
      ...raw,
      version: CURRENT_SOLUTION_VERSION,
      simRenderCache: makeEmptySimRenderCache(),
      simDamageCache: makeEmptySimDamageCache(),
      damageWatches: [],
    };
    return { ok: true, solution: candidate as SolutionState };
  }

  // v1 migration: migrate to current version by coercing controlledOperatorId
  if (version === 1) {
    const rawAny: any = raw as any;
    const teamOperatorIds: string[] = Array.isArray(rawAny.teamOperatorIds)
      ? rawAny.teamOperatorIds
      : [];
    const hasValidControlled: boolean =
      typeof rawAny.controlledOperatorId === "string" &&
      teamOperatorIds.includes(rawAny.controlledOperatorId);
    const migrated: any = {
      ...rawAny,
      version: CURRENT_SOLUTION_VERSION,
      simRenderCache: makeEmptySimRenderCache(),
      simDamageCache: makeEmptySimDamageCache(),
      damageWatches: [],
    };
    if (!hasValidControlled && teamOperatorIds.length > 0) {
      migrated.controlledOperatorId = teamOperatorIds[0];
    } else {
      migrated.controlledOperatorId = rawAny.controlledOperatorId;
    }
    return { ok: true, solution: migrated as SolutionState };
  }

  if (version === CURRENT_SOLUTION_VERSION) {
    const rawAny: any = raw as any;
    const next = {
      ...(raw as unknown as SolutionState),
      simRenderCache: makeEmptySimRenderCache(),
      simDamageCache: makeEmptySimDamageCache(),
      damageWatches: Array.isArray(rawAny.damageWatches)
        ? rawAny.damageWatches
        : [],
    };
    return { ok: true, solution: next };
  }

  return {
    ok: false,
    error: `Unsupported solution version ${String(version)} (expected ${CURRENT_SOLUTION_VERSION}).`,
  };
}

function validateSolution(
  sol: unknown,
): { ok: true; solution: SolutionState } | { ok: false; error: string } {
  if (!isPlainObject(sol))
    return { ok: false, error: "Solution must be an object." };

  if (typeof sol.version !== "number") {
    return { ok: false, error: "Solution.version must be a number." };
  }
  if (!Array.isArray(sol.teamOperatorIds) || sol.teamOperatorIds.length !== 4) {
    return {
      ok: false,
      error: "Solution.teamOperatorIds must be an array of length 4.",
    };
  }
  if (!Array.isArray(sol.skillBoxes) || !sol.skillBoxes.every(isSkillBox)) {
    return { ok: false, error: "Solution.skillBoxes has invalid entries." };
  }
  if (!isPlainObject(sol.buildByOperatorId)) {
    return {
      ok: false,
      error: "Solution.buildByOperatorId must be an object map.",
    };
  }

  // Sanity check: builds exist for every operator referenced by team + boxes.
  const needed = new Set<string>(sol.teamOperatorIds as string[]);
  for (const b of sol.skillBoxes as SkillBox[]) needed.add(b.operatorId);
  for (const opId of needed) {
    if (!(opId in sol.buildByOperatorId)) {
      return {
        ok: false,
        error: `Missing buildByOperatorId entry for operatorId: ${opId}`,
      };
    }
  }

  return { ok: true, solution: sol as unknown as SolutionState };
}
