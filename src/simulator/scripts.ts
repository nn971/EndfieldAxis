import type { SkillType } from "../data/operators/OperatorDef";
import type { SimRead } from "./simulator";
import type { SimEvent, SimEventType } from "../types/simulator/simulator";
import { makeSimEventId } from "../shared/lib/utils";

type DistOmit<T, K extends PropertyKey> = T extends any ? Omit<T, K> : never;
type WithOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type SimEventDraft = DistOmit<SimEvent, "id" | "seq">;
type Draft<T extends SimEvent> = DistOmit<
  T,
  "id" | "seq" | "type" | "frame" | "ref"
>;

type EmitDraftByType = {
  hit: WithOptional<Draft<Extract<SimEvent, { type: "hit" }>>, "sourceId" | "targetId">;
  statusApply: WithOptional<
    Draft<Extract<SimEvent, { type: "statusApply" }>>,
    "sourceId" | "targetId"
  >;
  buffApply: WithOptional<
    Draft<Extract<SimEvent, { type: "buffApply" }>>,
    "sourceId" | "ownerId"
  >;
  buffRemove: WithOptional<Draft<Extract<SimEvent, { type: "buffRemove" }>>, "ownerId">;
  inflictionApply: WithOptional<
    Draft<Extract<SimEvent, { type: "inflictionApply" }>>,
    "sourceId" | "ownerId"
  >;
  spRecover: WithOptional<Draft<Extract<SimEvent, { type: "spRecover" }>>, "sourceId">;
  spReturn: WithOptional<Draft<Extract<SimEvent, { type: "spReturn" }>>, "sourceId">;
  comboTriggered: WithOptional<
    Draft<Extract<SimEvent, { type: "comboTriggered" }>>,
    "sourceId" | "targetId"
  >;
  reactionTick: WithOptional<
    Draft<Extract<SimEvent, { type: "reactionTick" }>>,
    "sourceId" | "targetId"
  >;
};

export type SimScriptEmit = {
  [K in keyof EmitDraftByType]: (draft: EmitDraftByType[K]) => SimScriptCommand;
};

export type SimScriptContext = {
  read: SimRead;
  emit: SimScriptEmit;

  /** @deprecated */
  sourceId?: string;
  /** @deprecated */
  targetId?: string;
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
      draft: DistOmit<SimEventDraft, "frame" | "ref">;
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
  draft: DistOmit<SimEventDraft, "frame" | "ref">,
): SimScriptCommand {
  return {
    type: "emit",
    draft: draft as DistOmit<SimEventDraft, "frame" | "ref">,
  };
}

function makeCtxEmit(ctx: Pick<SimScriptContext, "sourceId" | "targetId">): SimScriptEmit {
  return {
    hit: draft =>
      emitCommand({
        ...draft,
        sourceId: draft.sourceId ?? ctx.sourceId,
        targetId: draft.targetId ?? ctx.targetId,
        type: "hit",
      } as DistOmit<SimEventDraft, "frame" | "ref">),
    statusApply: draft =>
      emitCommand({
        ...draft,
        sourceId: draft.sourceId ?? ctx.sourceId,
        targetId: draft.targetId ?? ctx.targetId,
        type: "statusApply",
      } as DistOmit<SimEventDraft, "frame" | "ref">),
    buffApply: draft =>
      emitCommand({
        ...draft,
        sourceId: draft.sourceId ?? ctx.sourceId,
        ownerId: draft.ownerId ?? ctx.targetId,
        type: "buffApply",
      } as DistOmit<SimEventDraft, "frame" | "ref">),
    buffRemove: draft =>
      emitCommand({
        ...draft,
        ownerId: draft.ownerId ?? ctx.targetId,
        type: "buffRemove",
      } as DistOmit<SimEventDraft, "frame" | "ref">),
    inflictionApply: draft =>
      emitCommand({
        ...draft,
        sourceId: draft.sourceId ?? ctx.sourceId,
        ownerId: draft.ownerId ?? ctx.targetId,
        type: "inflictionApply",
      } as DistOmit<SimEventDraft, "frame" | "ref">),
    spRecover: draft =>
      emitCommand({
        ...draft,
        sourceId: draft.sourceId ?? ctx.sourceId,
        type: "spRecover",
      } as DistOmit<SimEventDraft, "frame" | "ref">),
    spReturn: draft =>
      emitCommand({
        ...draft,
        sourceId: draft.sourceId ?? ctx.sourceId,
        type: "spReturn",
      } as DistOmit<SimEventDraft, "frame" | "ref">),
    comboTriggered: draft =>
      emitCommand({
        ...draft,
        sourceId: draft.sourceId ?? ctx.sourceId,
        targetId: draft.targetId ?? ctx.targetId,
        type: "comboTriggered",
      } as DistOmit<SimEventDraft, "frame" | "ref">),
    reactionTick: draft =>
      emitCommand({
        ...draft,
        sourceId: draft.sourceId ?? ctx.sourceId,
        targetId: draft.targetId ?? ctx.targetId,
        type: "reactionTick",
      } as DistOmit<SimEventDraft, "frame" | "ref">),
  };
}

export const emit = {
  /** @deprecated Prefer ctx.emit.* from SimScriptContext */
  ...makeCtxEmit({ sourceId: undefined, targetId: undefined }),
};

export function runSimScript(params: {
  script: SimScript;
  ctx: SimScriptContext;
  baseFrame: number;
}): SimEventDraft[] {
  const { script, ctx, baseFrame } = params;
  const runtimeCtx = {
    ...ctx,
    emit: makeCtxEmit(ctx),
  } satisfies SimScriptContext;
  const out: SimEventDraft[] = [];
  let frameCursor = baseFrame;

  for (const op of script(runtimeCtx)) {
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
