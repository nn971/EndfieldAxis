import type { SkillType } from "../data/operators/OperatorDef";
import type { SimRead } from "./simulator";
import type { SimEvent, SimEventType } from "../types/simulator/simulator";
import { makeSimEventId } from "../shared/lib/utils";

type DistOmit<T, K extends PropertyKey> = T extends any ? Omit<T, K> : never;

export type SimEventDraft = DistOmit<SimEvent, "id" | "seq">;
type Draft<T extends SimEvent> = DistOmit<T, "id" | "seq" | "type" | "frame">;

export type SimScriptContext = {
  read: SimRead;
  sourceId: string;
  targetId: string;
  startFrame: number;
  skillType: SkillType;
  sourceBuild?: {
    skillRanks?: Record<string, number>;
  };
  ev?: SimEvent;
};

export type SimScriptCommand =
  | {
      type: "delay";
      frames: number;
    }
  | {
      type: "emit";
      draft: DistOmit<SimEventDraft, "frame">;
    };

export type SimScript = (
  ctx: SimScriptContext,
) => Generator<SimScriptCommand, void, undefined>;

export function delay(frames: number): SimScriptCommand {
  return {
    type: "delay",
    frames: Math.max(0, Math.floor(Number(frames) || 0)),
  };
}

function emitCommand(
  draft: DistOmit<SimEventDraft, "frame">,
): SimScriptCommand {
  return { type: "emit", draft: draft as DistOmit<SimEventDraft, "frame"> };
}

let A: Extract<SimEvent, { type: "hit" }>;

export const emit = {
  hit: (draft: Draft<Extract<SimEvent, { type: "hit" }>>) =>
    emitCommand({ ...draft, type: "hit" }),
  statusApply: (draft: Draft<Extract<SimEvent, { type: "statusApply" }>>) =>
    emitCommand({ ...draft, type: "statusApply" }),
  buffApply: (draft: Draft<Extract<SimEvent, { type: "buffApply" }>>) =>
    emitCommand({ ...draft, type: "buffApply" }),
  inflictionApply: (
    draft: Draft<Extract<SimEvent, { type: "inflictionApply" }>>,
  ) => emitCommand({ ...draft, type: "inflictionApply" }),
  spRecover: (draft: Draft<Extract<SimEvent, { type: "spRecover" }>>) =>
    emitCommand({ ...draft, type: "spRecover" }),
  spReturn: (draft: Draft<Extract<SimEvent, { type: "spReturn" }>>) =>
    emitCommand({ ...draft, type: "spReturn" }),
  comboTriggered: (
    draft: Draft<Extract<SimEvent, { type: "comboTriggered" }>>,
  ) => emitCommand({ ...draft, type: "comboTriggered" }),
};

export function runSimScript(params: {
  script: SimScript;
  ctx: SimScriptContext;
  baseFrame: number;
}): SimEventDraft[] {
  const { script, ctx, baseFrame } = params;
  const out: SimEventDraft[] = [];
  let frameCursor = baseFrame;

  for (const op of script(ctx)) {
    if (!op) continue;

    if (op.type === "delay") {
      frameCursor += Math.max(0, Math.floor(Number(op.frames) || 0));
      continue;
    }

    out.push({
      ...op.draft,
      frame: frameCursor,
    } as SimEventDraft);
  }

  return out;
}

export function materializeDrafts(
  drafts: readonly SimEventDraft[],
  nextSeq: () => number,
  makeId?: () => string,
  opts?: { defaultRef?: string },
): SimEvent[] {
  const id = makeId ?? makeSimEventId;

  return drafts.map(draft => {
    const ref = draft.ref ?? opts?.defaultRef;
    return {
      ...draft,
      id: id(),
      seq: nextSeq(),
      ...(ref !== undefined ? { ref } : {}),
    } as SimEvent;
  });
}

/** @deprecated Use generator-style `SimScript` + `emit` helpers instead. */
export type DraftEmitter = {
  now: <T extends SimEventDraft>(draft: Omit<T, "frame">) => T;
  after: <T extends SimEventDraft>(
    deltaFrames: number,
    draft: Omit<T, "frame">,
  ) => T;
};

/** @deprecated Use generator-style `SimScript` + `emit` helpers instead. */
export function createDraftEmitter(baseFrame: number): DraftEmitter {
  return {
    now: draft => ({ ...draft, frame: baseFrame }) as any,
    after: (deltaFrames, draft) =>
      ({ ...draft, frame: baseFrame + deltaFrames }) as any,
  };
}
