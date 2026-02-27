import { BuffId } from "../data/buffs/BuffDef";
import type { InflictionType } from "../types/simulator/infliction";
import type { DmgType, SkillType } from "../data/operators/OperatorDef";
import type { SimStatusType } from "../types/simulator/infliction";
import type { SimEvent } from "../types/simulator/simulator";

export type SkillCompileContext = {
  sourceId: string;
  targetId: string;
  startFrame: number;
  /** Skill type is carried by hit events so listeners can distinguish skill hits from normal attacks. */
  skillType: SkillType;
  sourceBuild?: {
    skillRanks?: Record<string, number>;
  };
  nextSeq: () => number;
  makeEventId: () => string;
};

export type SkillOpFn = (ctx: SkillCompileContext) => SimEvent[];

function clampSkillRank(rank: number): number {
  if (!Number.isFinite(rank)) return 9;
  return Math.max(1, Math.min(12, Math.round(rank)));
}

export function getSkillRank(
  ctx: SkillCompileContext,
  skillType: SkillType = ctx.skillType,
): number {
  const rank = Number(ctx.sourceBuild?.skillRanks?.[skillType] ?? 9);
  return clampSkillRank(rank);
}

/** Rank table format: [lv1..lv9, m1, m2, m3]. */
export function pickSkillValueByRank(
  ctx: SkillCompileContext,
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

export function physicalHit(
  frame: number,
  opts: {
    dmgType?: DmgType;
    dmgMultiplier?: number;
    withStatus?: boolean;
    statusType?: SimStatusType;
  },
): SkillOpFn {
  return ctx => {
    const events: SimEvent[] = [];

    // NOTE: In SimWorld, same-frame events are executed by descending seq (larger seq first).
    // We allocate hitSeq first, then statusSeq, so statusApply executes before the hit.
    const hitSeq = ctx.nextSeq();

    const hitEv: SimEvent = {
      id: ctx.makeEventId(),
      type: "hit",
      frame: ctx.startFrame + frame,
      seq: hitSeq,

      sourceId: ctx.sourceId,
      targetId: ctx.targetId,

      damageType: (opts.dmgType ?? "physical") as any,
      dmgMultiplier: opts.dmgMultiplier,
    };

    const withStatus = Boolean(opts.withStatus);
    if (withStatus) {
      if (!opts.statusType)
        throw new Error(
          `physicalHit(frame=${frame}): withStatus=true but statusType missing`,
        );

      const statusSeq = ctx.nextSeq();
      events.push({
        id: ctx.makeEventId(),
        type: "statusApply",
        frame: ctx.startFrame + frame,
        seq: statusSeq,

        sourceId: ctx.sourceId,
        targetId: ctx.targetId,

        statusType: opts.statusType,
      } satisfies SimEvent);
    }

    events.push(hitEv);
    return events;
  };
}

export function applyBuff(frame: number, buffId: BuffId): SkillOpFn {
  return ctx => {
    const ev: SimEvent = {
      id: ctx.makeEventId(),
      type: "buffApply",
      frame: ctx.startFrame + frame,
      seq: ctx.nextSeq(),
      sourceId: ctx.sourceId,
      targetId: ctx.targetId,
      buffId,
    };
    return [ev];
  };
}

export function applyInfliction(
  frame: number,
  inflictionType: InflictionType,
  stacks: number = 1,
): SkillOpFn {
  return ctx => {
    const ev: SimEvent = {
      id: ctx.makeEventId(),
      type: "inflictionApply",
      frame: ctx.startFrame + frame,
      seq: ctx.nextSeq(),
      sourceId: ctx.sourceId,
      targetId: ctx.targetId,
      inflictionType,
      inflictionStacks: Math.max(1, Math.floor(Number(stacks) || 1)),
    };
    return [ev];
  };
}

export function physicalHitByRank(
  frame: number,
  opts: {
    rankTable: readonly number[];
    rankSkillType?: SkillType;
    dmgType?: DmgType;
    withStatus?: boolean;
    statusType?: SimStatusType;
  },
): SkillOpFn {
  return ctx =>
    physicalHit(frame, {
      dmgType: opts.dmgType,
      dmgMultiplier: pickSkillValueByRank(
        ctx,
        opts.rankTable,
        opts.rankSkillType ?? ctx.skillType,
      ),
      withStatus: opts.withStatus,
      statusType: opts.statusType,
    })(ctx);
}
