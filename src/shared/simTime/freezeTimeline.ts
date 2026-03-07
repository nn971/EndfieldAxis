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
  illegalCastStartIds: Set<string>;
  illegalCastStartReasonById: Map<string, string[]>;
  scriptStartRealByCastStartId: Map<string, number>;
  realToGame: (real: number) => number;
  gameToRealAtOrAfter: (game: number, minReal: number) => number;
};

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
  if (a.operatorId !== b.operatorId) return a.operatorId.localeCompare(b.operatorId);
  if (a.skillType !== b.skillType) return a.skillType.localeCompare(b.skillType);
  return a.id.localeCompare(b.id);
}

function buildFrozenPrefixResolver(
  freezeWindows: FreezeWindow[],
): (real: number) => number {
  return real => {
    let frozen = 0;
    for (const window of freezeWindows) {
      if (real <= window.startReal) break;
      const overlapEnd = Math.min(real, window.endReal);
      if (overlapEnd <= window.startReal) continue;
      frozen += overlapEnd - window.startReal;
      if (real < window.endReal) break;
    }
    return frozen;
  };
}

export function buildFreezeTimeline(
  skillBoxes: SkillBox[],
  resolveFreezeFrames: FreezeFrameResolver = getCastStartFreezeFrames,
): FreezeTimeline {
  const freezeWindows: FreezeWindow[] = [];
  const illegalCastStartIds = new Set<string>();
  const illegalCastStartReasonById = new Map<string, string[]>();
  const scriptStartRealByCastStartId = new Map<string, number>();

  let activeFreezeWindow: FreezeWindow | null = null;
  let currentChainCastStartIds: string[] = [];
  let currentChainEndReal = -1;

  const resetChain = () => {
    currentChainCastStartIds = [];
    currentChainEndReal = -1;
  };

  const sortedCastStarts = [...skillBoxes].sort(compareCastStart);
  for (const castStart of sortedCastStarts) {
    const castStartReal = castStart.startFrame;

    if (activeFreezeWindow && castStartReal >= activeFreezeWindow.endReal) {
      activeFreezeWindow = null;
      resetChain();
    }

    if (
      !activeFreezeWindow &&
      currentChainCastStartIds.length > 0 &&
      castStartReal >= currentChainEndReal
    ) {
      resetChain();
    }

    const isInsideActiveWindow =
      activeFreezeWindow !== null &&
      castStartReal >= activeFreezeWindow.startReal &&
      castStartReal < activeFreezeWindow.endReal;

    if (isInsideActiveWindow) {
      const activeWindow = activeFreezeWindow;
      if (!activeWindow) {
        throw new Error("Freeze timeline invariant: inside active window with no active window");
      }

      if (activeWindow.kind === "ultimate") {
        illegalCastStartIds.add(castStart.id);
        const reasons = illegalCastStartReasonById.get(castStart.id) ?? [];
        reasons.push("strict.inside_ultimate");
        illegalCastStartReasonById.set(castStart.id, reasons);
        continue;
      }

      const canInterrupt =
        castStart.skillType === "comboSkill" || castStart.skillType === "ultimate";
      if (!canInterrupt) {
        illegalCastStartIds.add(castStart.id);
        const reasons = illegalCastStartReasonById.get(castStart.id) ?? [];
        reasons.push("strict.inside_combo_non_interruptible");
        illegalCastStartReasonById.set(castStart.id, reasons);
        continue;
      }

      activeWindow.endReal = castStartReal;
      activeFreezeWindow = null;
      currentChainEndReal = castStartReal;
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

    currentChainEndReal = Math.max(currentChainEndReal, castStartReal + freezeFrames);
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
      freezeWindows.push(nextWindow);
      activeFreezeWindow = nextWindow;
    }
  }

  const normalizedFreezeWindows = freezeWindows.filter(
    window => window.endReal > window.startReal,
  );
  const frozenPrefix = buildFrozenPrefixResolver(normalizedFreezeWindows);

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

    for (const window of normalizedFreezeWindows) {
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
    freezeWindows: normalizedFreezeWindows,
    illegalCastStartIds,
    illegalCastStartReasonById,
    scriptStartRealByCastStartId,
    realToGame,
    gameToRealAtOrAfter,
  };
}

const debugTimeline = buildFreezeTimeline([
  {
    id: "dbg_combo_120",
    operatorId: "op.alpha",
    skillType: "comboSkill",
    startFrame: 120,
    durationFrames: 1,
  },
  {
    id: "dbg_ultimate_150",
    operatorId: "op.beta",
    skillType: "ultimate",
    startFrame: 150,
    durationFrames: 1,
  },
  {
    id: "dbg_normal_160",
    operatorId: "op.gamma",
    skillType: "normalSkill",
    startFrame: 160,
    durationFrames: 1,
  },
]);

export const debugExample = {
  castStartOrder: ["dbg_combo_120", "dbg_ultimate_150", "dbg_normal_160"],
  freezeWindows: debugTimeline.freezeWindows,
  illegalCastStartIds: Array.from(debugTimeline.illegalCastStartIds).sort(),
  scriptStartRealByCastStartId: Object.fromEntries(
    Array.from(debugTimeline.scriptStartRealByCastStartId.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    ),
  ),
};
