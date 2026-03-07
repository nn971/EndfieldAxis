import type { SkillType } from "../../data/operators/OperatorDef";
import { getCastStartFreezeFrames } from "./freezeConfig";
import type { SkillBox } from "../../types/editor";

export type FreezeWindowKind = "combo" | "ultimate";

export type FreezeWindow = {
  startReal: number;
  endReal: number;
  kind: FreezeWindowKind;
  castStartId: string;
  operatorId: string;
};

export type FreezeFrameResolver = (
  operatorId: string,
  skillType: SkillType,
) => number;

export type FreezeTimeline = {
  freezeWindows: FreezeWindow[];
  frozenWindows: { startReal: number; endReal: number }[];
  illegalCastStartIds: Set<string>;
  illegalCastStartReasonById: Map<string, string[]>;
  scriptStartRealByCastStartId: Map<string, number>;
  realToGame: (real: number) => number;
  gameToRealAtOrAfter: (game: number, minReal: number) => number;
};

type FrozenInterval = {
  startReal: number;
  endReal: number;
};

const STRICT_ULTIMATE_FREEZE_REASON = "strict:ultimate-freeze";
const STRICT_COMBO_FREEZE_REASON = "strict:combo-freeze";

function toFreezeWindowKind(skillType: SkillType): FreezeWindowKind | null {
  if (skillType === "comboSkill") return "combo";
  if (skillType === "ultimate") return "ultimate";
  return null;
}

function toNonNegativeFiniteInt(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

function compareCastStart(a: SkillBox, b: SkillBox): number {
  if (a.startFrame !== b.startFrame) return a.startFrame - b.startFrame;
  if (a.operatorId !== b.operatorId)
    return a.operatorId.localeCompare(b.operatorId);
  if (a.skillType !== b.skillType)
    return a.skillType.localeCompare(b.skillType);
  return a.id.localeCompare(b.id);
}

function buildFrozenPrefixResolver(
  frozenWindows: FrozenInterval[],
): (real: number) => number {
  return real => {
    let frozen = 0;
    for (const window of frozenWindows) {
      if (real <= window.startReal) break;
      const overlapEnd = Math.min(real, window.endReal);
      if (overlapEnd <= window.startReal) continue;
      frozen += overlapEnd - window.startReal;
      if (real < window.endReal) break;
    }
    return frozen;
  };
}

function normalizeFrozenIntervals(
  intervals: FrozenInterval[],
): FrozenInterval[] {
  const sorted = intervals
    .filter(interval => interval.endReal > interval.startReal)
    .sort((a, b) => {
      if (a.startReal !== b.startReal) return a.startReal - b.startReal;
      return a.endReal - b.endReal;
    });

  if (sorted.length === 0) return [];

  const out: FrozenInterval[] = [];
  let current: FrozenInterval = { ...sorted[0] };

  for (let i = 1; i < sorted.length; i += 1) {
    const next = sorted[i];
    if (next.startReal > current.endReal) {
      out.push(current);
      current = { ...next };
      continue;
    }
    current.endReal = Math.max(current.endReal, next.endReal);
  }

  out.push(current);
  return out;
}

function subtractFrozenIntervals(
  minuend: FrozenInterval[],
  subtrahend: FrozenInterval[],
): FrozenInterval[] {
  if (minuend.length === 0) return [];
  if (subtrahend.length === 0)
    return minuend.map(interval => ({ ...interval }));

  const out: FrozenInterval[] = [];
  let j = 0;

  for (const base of minuend) {
    let cursor = base.startReal;

    while (j < subtrahend.length && subtrahend[j].endReal <= cursor) {
      j += 1;
    }

    let k = j;
    while (k < subtrahend.length && subtrahend[k].startReal < base.endReal) {
      const blocker = subtrahend[k];

      if (blocker.startReal > cursor) {
        out.push({
          startReal: cursor,
          endReal: Math.min(blocker.startReal, base.endReal),
        });
      }

      cursor = Math.max(cursor, blocker.endReal);
      if (cursor >= base.endReal) break;
      k += 1;
    }

    if (cursor < base.endReal) {
      out.push({ startReal: cursor, endReal: base.endReal });
    }
  }

  return out;
}

function toOverlayWindows(params: {
  comboRawIntervals: FrozenInterval[];
  ultimateRawIntervals: FrozenInterval[];
}): FreezeWindow[] {
  const comboUnion = normalizeFrozenIntervals(params.comboRawIntervals);
  const ultimateUnion = normalizeFrozenIntervals(params.ultimateRawIntervals);
  const comboOnly = subtractFrozenIntervals(comboUnion, ultimateUnion);

  const comboWindows: FreezeWindow[] = comboOnly.map(segment => ({
    ...segment,
    kind: "combo",
    castStartId: `seg:combo:${segment.startReal}:${segment.endReal}`,
    operatorId: "",
  }));

  const ultimateWindows: FreezeWindow[] = ultimateUnion.map(segment => ({
    ...segment,
    kind: "ultimate",
    castStartId: `seg:ultimate:${segment.startReal}:${segment.endReal}`,
    operatorId: "",
  }));

  return [...comboWindows, ...ultimateWindows].sort((a, b) => {
    if (a.startReal !== b.startReal) return a.startReal - b.startReal;
    if (a.endReal !== b.endReal) return a.endReal - b.endReal;
    return a.kind.localeCompare(b.kind);
  });
}

function addIllegalReason(
  illegalCastStartReasonById: Map<string, string[]>,
  castStartId: string,
  reason: string,
): void {
  const existing = illegalCastStartReasonById.get(castStartId);
  if (!existing) {
    illegalCastStartReasonById.set(castStartId, [reason]);
    return;
  }
  if (!existing.includes(reason)) {
    existing.push(reason);
  }
}

export function buildFreezeTimeline(
  skillBoxes: SkillBox[],
  resolveFreezeFrames: FreezeFrameResolver = getCastStartFreezeFrames,
): FreezeTimeline {
  const rawFreezeWindows: FreezeWindow[] = [];
  const illegalCastStartIds = new Set<string>();
  const illegalCastStartReasonById = new Map<string, string[]>();
  const scriptStartRealByCastStartId = new Map<string, number>();

  const activeFreezeWindows: FreezeWindow[] = [];
  const comboRawIntervals: FrozenInterval[] = [];
  const ultimateRawIntervals: FrozenInterval[] = [];
  let currentChainCastStartIds: string[] = [];
  let currentChainEndReal = -1;

  const resetChain = () => {
    currentChainCastStartIds = [];
    currentChainEndReal = -1;
  };

  const sortedCastStarts = [...skillBoxes].sort(compareCastStart);
  for (const castStart of sortedCastStarts) {
    const castStartReal = castStart.startFrame;

    for (let i = activeFreezeWindows.length - 1; i >= 0; i -= 1) {
      if (activeFreezeWindows[i].endReal <= castStartReal) {
        activeFreezeWindows.splice(i, 1);
      }
    }

    if (
      activeFreezeWindows.length === 0 &&
      currentChainCastStartIds.length > 0 &&
      castStartReal >= currentChainEndReal
    ) {
      resetChain();
    }

    const hasActiveUltimate = activeFreezeWindows.some(
      window =>
        window.kind === "ultimate" &&
        castStartReal >= window.startReal &&
        castStartReal < window.endReal,
    );

    const hasActiveCombo = activeFreezeWindows.some(
      window =>
        window.kind === "combo" &&
        castStartReal >= window.startReal &&
        castStartReal < window.endReal,
    );

    let isIllegal = false;
    if (hasActiveUltimate) {
      addIllegalReason(
        illegalCastStartReasonById,
        castStart.id,
        STRICT_ULTIMATE_FREEZE_REASON,
      );
      isIllegal = true;
    } else if (
      hasActiveCombo &&
      castStart.skillType !== "comboSkill" &&
      castStart.skillType !== "ultimate"
    ) {
      addIllegalReason(
        illegalCastStartReasonById,
        castStart.id,
        STRICT_COMBO_FREEZE_REASON,
      );
      isIllegal = true;
    }

    if (isIllegal) {
      illegalCastStartIds.add(castStart.id);
      continue;
    }

    const kind = toFreezeWindowKind(castStart.skillType);
    if (!kind) continue;

    const freezeFrames = toNonNegativeFiniteInt(
      resolveFreezeFrames(castStart.operatorId, castStart.skillType),
    );

    if (currentChainCastStartIds.length === 0) {
      currentChainEndReal = castStartReal;
    }
    currentChainCastStartIds.push(castStart.id);

    currentChainEndReal = Math.max(
      currentChainEndReal,
      castStartReal + freezeFrames,
    );
    for (const chainCastStartId of currentChainCastStartIds) {
      scriptStartRealByCastStartId.set(chainCastStartId, currentChainEndReal);
    }

    if (freezeFrames > 0) {
      const nextWindow: FreezeWindow = {
        startReal: castStartReal,
        endReal: castStartReal + freezeFrames,
        kind,
        castStartId: castStart.id,
        operatorId: castStart.operatorId,
      };
      rawFreezeWindows.push(nextWindow);
      activeFreezeWindows.push(nextWindow);

      if (kind === "combo") {
        comboRawIntervals.push({
          startReal: nextWindow.startReal,
          endReal: nextWindow.endReal,
        });
      } else {
        ultimateRawIntervals.push({
          startReal: nextWindow.startReal,
          endReal: nextWindow.endReal,
        });
      }
    }
  }

  const frozenWindows = normalizeFrozenIntervals(
    rawFreezeWindows.map(window => ({
      startReal: window.startReal,
      endReal: window.endReal,
    })),
  );
  const freezeWindows = toOverlayWindows({
    comboRawIntervals,
    ultimateRawIntervals,
  });
  const frozenPrefix = buildFrozenPrefixResolver(frozenWindows);

  const realToGame = (real: number): number => {
    if (!Number.isFinite(real)) {
      throw new Error(`realToGame expected finite real, got ${String(real)}`);
    }
    return real - frozenPrefix(real);
  };

  const gameToRealAtOrAfter = (game: number, minReal: number): number => {
    if (!Number.isFinite(game) || !Number.isFinite(minReal)) {
      throw new Error(
        `gameToRealAtOrAfter expected finite numbers, got game=${String(game)} minReal=${String(minReal)}`,
      );
    }

    let cursorReal = minReal;
    let cursorGame = realToGame(minReal);

    if (cursorGame >= game) {
      return minReal;
    }

    for (const window of frozenWindows) {
      if (window.endReal <= cursorReal) {
        continue;
      }

      const walkableEnd = Math.max(cursorReal, window.startReal);
      if (walkableEnd > cursorReal) {
        const walkableLength = walkableEnd - cursorReal;
        if (cursorGame + walkableLength >= game) {
          return cursorReal + (game - cursorGame);
        }
        cursorReal = walkableEnd;
        cursorGame += walkableLength;
      }

      if (window.endReal > cursorReal) {
        cursorReal = window.endReal;
      }
    }

    return cursorReal + (game - cursorGame);
  };

  return {
    freezeWindows,
    frozenWindows,
    illegalCastStartIds,
    illegalCastStartReasonById,
    scriptStartRealByCastStartId,
    realToGame,
    gameToRealAtOrAfter,
  };
}

const debugTimeline = buildFreezeTimeline([
  {
    id: "dbg_combo_100",
    operatorId: "op.alpha",
    skillType: "comboSkill",
    startFrame: 100,
    durationFrames: 1,
  },
  {
    id: "dbg_normal_110",
    operatorId: "op.gamma",
    skillType: "normalSkill",
    startFrame: 110,
    durationFrames: 1,
  },
  {
    id: "dbg_ultimate_120",
    operatorId: "op.beta",
    skillType: "ultimate",
    startFrame: 120,
    durationFrames: 1,
  },
  {
    id: "dbg_combo_125",
    operatorId: "op.delta",
    skillType: "comboSkill",
    startFrame: 125,
    durationFrames: 1,
  },
  {
    id: "dbg_normal_180",
    operatorId: "op.epsilon",
    skillType: "normalSkill",
    startFrame: 180,
    durationFrames: 1,
  },
]);

export const debugExample = {
  castStartOrder: [
    "dbg_combo_100",
    "dbg_normal_110",
    "dbg_ultimate_120",
    "dbg_combo_125",
    "dbg_normal_180",
  ],
  freezeWindows: debugTimeline.freezeWindows,
  frozenWindows: debugTimeline.frozenWindows,
  illegalCastStartIds: Array.from(debugTimeline.illegalCastStartIds).sort(),
  illegalCastStartReasonById: Object.fromEntries(
    Array.from(debugTimeline.illegalCastStartReasonById.entries())
      .map(
        ([castStartId, reasons]) => [castStartId, [...reasons].sort()] as const,
      )
      .sort(([a], [b]) => a.localeCompare(b)),
  ),
  scriptStartRealByCastStartId: Object.fromEntries(
    Array.from(debugTimeline.scriptStartRealByCastStartId.entries()).sort(
      ([a], [b]) => a.localeCompare(b),
    ),
  ),
};
