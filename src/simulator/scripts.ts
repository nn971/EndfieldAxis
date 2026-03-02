import type { SkillType } from "../data/operators/OperatorDef";
import type { SimRead } from "./simulator";
import type { SimEvent } from "../types/simulator/simulator";
import { makeSimEventId } from "../shared/lib/utils";

export type StripEventRuntimeFields<T> = T extends SimEvent
  ? Omit<T, "id" | "seq">
  : never;
export type SimEventDraft = StripEventRuntimeFields<SimEvent>;

export type DraftAllocator = {
  nextSeq: () => number;
  makeId?: () => string;
};

export type OmitFrame<T> = T extends SimEventDraft ? Omit<T, "frame"> : never;

export type DraftEmitter = {
  now: <T extends SimEventDraft>(draft: OmitFrame<T>) => T;
  after: <T extends SimEventDraft>(
    deltaFrames: number,
    draft: OmitFrame<T>,
  ) => T;
};

export function createDraftEmitter(baseFrame: number): DraftEmitter {
  return {
    now: draft => ({ ...draft, frame: baseFrame }) as any,
    after: (deltaFrames, draft) =>
      ({ ...draft, frame: baseFrame + deltaFrames }) as any,
  };
}

export function materializeDrafts(
  drafts: readonly SimEventDraft[],
  alloc: DraftAllocator,
  opts?: { defaultRef?: string },
): SimEvent[] {
  const makeId = alloc.makeId ?? makeSimEventId;
  const grouped = new Map<number, SimEventDraft[]>();

  for (const draft of drafts) {
    const list = grouped.get(draft.frame);
    if (list) {
      list.push(draft);
      continue;
    }
    grouped.set(draft.frame, [draft]);
  }

  const frames = [...grouped.keys()].sort((a, b) => a - b);
  const frameSeqEntries = new Map<SimEventDraft, number>();

  for (const frame of frames) {
    const frameDrafts = grouped.get(frame) ?? [];
    for (let i = frameDrafts.length - 1; i >= 0; i -= 1) {
      frameSeqEntries.set(frameDrafts[i], alloc.nextSeq());
    }
  }

  return drafts.map(draft => {
    const ref = draft.ref ?? opts?.defaultRef;
    return {
      ...draft,
      id: makeId(),
      seq: frameSeqEntries.get(draft) ?? alloc.nextSeq(),
      ...(ref !== undefined ? { ref } : {}),
    } as SimEvent;
  });
}

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
      draft: OmitFrame<SimEventDraft>;
    };

export type SimScript = (
  ctx: SimScriptContext,
) => Generator<SimScriptCommand, void, undefined>;

/**
 * New unified event scripting commands used by both skills and plugins.
 */
export function delay(frames: number): SimScriptCommand {
  return {
    type: "delay",
    frames: Math.max(0, Math.floor(Number(frames) || 0)),
  };
}

function emitCommand<T extends SimEventDraft>(
  draft: OmitFrame<T>,
): SimScriptCommand {
  return { type: "emit", draft: draft as OmitFrame<SimEventDraft> };
}

type Draft<T extends SimEvent> = Omit<T, "type" | "frame" | "ref">;

export const emit = {
  hit: (draft: Draft<Extract<SimEvent, { type: "hit" }>>) =>
    emitCommand({ ...draft, type: "hit" }),
  statusApply: (
    draft: OmitFrame<Extract<SimEventDraft, { type: "statusApply" }>>,
  ) => emitCommand(draft),
  buffApply: (
    draft: OmitFrame<Extract<SimEventDraft, { type: "buffApply" }>>,
  ) => emitCommand(draft),
  inflictionApply: (
    draft: OmitFrame<Extract<SimEventDraft, { type: "inflictionApply" }>>,
  ) => emitCommand(draft),
  spRecover: (
    draft: OmitFrame<Extract<SimEventDraft, { type: "spRecover" }>>,
  ) => emitCommand(draft),
  spReturn: (draft: OmitFrame<Extract<SimEventDraft, { type: "spReturn" }>>) =>
    emitCommand(draft),
  comboTriggered: (
    draft: OmitFrame<Extract<SimEventDraft, { type: "comboTriggered" }>>,
  ) => emitCommand(draft),
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
