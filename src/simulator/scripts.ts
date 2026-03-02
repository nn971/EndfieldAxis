import type { SkillType } from "../data/operators/OperatorDef";
import type { SimRead } from "./simulator";
import type { SimEvent, SimEventType } from "../types/simulator/simulator";
import { DistOmit, makeSimEventId, WithOptional } from "../shared/lib/utils";

export type SimEventDraft = DistOmit<SimEvent, "id" | "seq">;
type Draft<T extends SimEvent> = DistOmit<
  T,
  "id" | "seq" | "type" | "frame" | "ref"
>;

type EmitDraftByType = {
  hit: WithOptional<
    Draft<Extract<SimEvent, { type: "hit" }>>,
    "sourceId" | "targetId"
  >;
  statusApply: WithOptional<
    Draft<Extract<SimEvent, { type: "statusApply" }>>,
    "sourceId" | "targetId"
  >;
  buffApply: WithOptional<
    Draft<Extract<SimEvent, { type: "buffApply" }>>,
    "sourceId" | "targetId"
  >;
  buffRemove: WithOptional<
    Draft<Extract<SimEvent, { type: "buffRemove" }>>,
    "targetId"
  >;
  inflictionApply: WithOptional<
    Draft<Extract<SimEvent, { type: "inflictionApply" }>>,
    "sourceId" | "targetId"
  >;
  spRecover: WithOptional<
    Draft<Extract<SimEvent, { type: "spRecover" }>>,
    "sourceId"
  >;
  spReturn: WithOptional<
    Draft<Extract<SimEvent, { type: "spReturn" }>>,
    "sourceId"
  >;
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

  sourceId?: string;
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

function makeCtxEmit(
  ctx: Pick<SimScriptContext, "sourceId" | "targetId">,
): SimScriptEmit {
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
        targetId: draft.targetId ?? ctx.targetId,
        type: "buffApply",
      } as DistOmit<SimEventDraft, "frame" | "ref">),
    buffRemove: draft =>
      emitCommand({
        ...draft,
        targetId: draft.targetId ?? ctx.targetId,
        type: "buffRemove",
      } as DistOmit<SimEventDraft, "frame" | "ref">),
    inflictionApply: draft =>
      emitCommand({
        ...draft,
        sourceId: draft.sourceId ?? ctx.sourceId,
        targetId: draft.targetId ?? ctx.targetId,
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
  ctx: Omit<SimScriptContext, "emit">;
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
  const out: SimEvent[] = new Array(drafts.length);

  // Queue pops larger seq first within the same frame.
  // Assign seq in reverse emit order so script emit order is preserved.
  for (let i = drafts.length - 1; i >= 0; i -= 1) {
    const draft = drafts[i]!;
    const ref = draft.ref ?? opts?.defaultRef;
    out[i] = {
      ...draft,
      id: id(),
      seq: nextSeq(),
      ...(ref !== undefined ? { ref } : {}),
    } as SimEvent;
  }

  return out;
}
export function getSkillRank(
  ctx: SimScriptContext,
  skillType: SkillType = ctx.skillType,
): number {
  const rank = Number(ctx.sourceBuild?.skillRanks?.[skillType] ?? 9);
  if (!Number.isFinite(rank)) return 9;
  return Math.max(1, Math.min(12, Math.round(rank)));
}
/** Rank table format: [lv1..lv9, m1, m2, m3]. */

export function pickSkillValueByRank(
  ctx: SimScriptContext,
  table: readonly number[],
  skillType: SkillType = ctx.skillType,
): number {
  if (!Array.isArray(table) || table.length !== 12) {
    throw new Error(
      `pickSkillValueByRank requires a 12-value table, got length=${table?.length ?? 0}`,
    );
  }
  const rank = getSkillRank(ctx, skillType);
  return Number(table[rank - 1] ?? table[8]);
}
