import { BuffId } from "../data/buffs/BuffDef";
import type {
  InflictionType,
  SimStatusType,
} from "../types/simulator/infliction";
import type { DmgType, SkillType } from "../data/operators/OperatorDef";
import type { SimEventDraft } from "./listeners/drafts";
import type { SimEventWhen } from "../types/simulator/when";

export type SkillCompileContext = {
  sourceId: string;
  targetId: string;
  startFrame: number;
  /** Skill type is carried by hit events so listeners can distinguish skill hits from normal attacks. */
  skillType: SkillType;
  sourceBuild?: {
    skillRanks?: Record<string, number>;
  };
};

export type SkillOpFn = (ctx: SkillCompileContext) => SimEventDraft[];

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
    when?: SimEventWhen;
  },
): SkillOpFn {
  return ctx => {
    const events: SimEventDraft[] = [];

    const hitEv: SimEventDraft = {
      type: "hit",
      frame: ctx.startFrame + frame,

      sourceId: ctx.sourceId,
      targetId: ctx.targetId,

      damageType: (opts.dmgType ?? "physical") as any,
      dmgMultiplier: opts.dmgMultiplier,
      when: opts.when,
    };

    const withStatus = Boolean(opts.withStatus);
    if (withStatus) {
      if (!opts.statusType)
        throw new Error(
          `physicalHit(frame=${frame}): withStatus=true but statusType missing`,
        );
      events.push({
        type: "statusApply",
        frame: ctx.startFrame + frame,

        sourceId: ctx.sourceId,
        targetId: ctx.targetId,

        statusType: opts.statusType,
        when: opts.when,
      } satisfies SimEventDraft);
    }

    events.push(hitEv);
    return events;
  };
}

export function applyBuff(
  frame: number,
  buffId: BuffId,
  opts?: { isForced?: boolean; when?: SimEventWhen },
): SkillOpFn {
  return ctx => {
    const ev: SimEventDraft = {
      type: "buffApply",
      frame: ctx.startFrame + frame,
      sourceId: ctx.sourceId,
      ownerId: ctx.targetId,
      buffId,
      isForced: opts?.isForced,
      when: opts?.when,
    };
    return [ev];
  };
}

export function physicalHitByRank(
  frame: number,
  opts: {
    rankTable: readonly number[];
    dmgType?: DmgType;
    withStatus?: boolean;
    statusType?: SimStatusType;
    when?: SimEventWhen;
  },
): SkillOpFn {
  return ctx =>
    physicalHit(frame, {
      dmgType: opts.dmgType,
      dmgMultiplier: pickSkillValueByRank(ctx, opts.rankTable, ctx.skillType),
      withStatus: opts.withStatus,
      statusType: opts.statusType,
      when: opts.when,
    })(ctx);
}

export function artsHit(
  frame: number,
  opts: {
    dmgType: Exclude<DmgType, "physical">;
    dmgMultiplier?: number;
    when?: SimEventWhen;
  },
): SkillOpFn {
  return physicalHit(frame, {
    dmgType: opts.dmgType,
    dmgMultiplier: opts.dmgMultiplier,
    when: opts.when,
  });
}

export function artsHitByRank(
  frame: number,
  opts: {
    rankTable: readonly number[];
    dmgType: Exclude<DmgType, "physical">;
    withInfliction?: boolean;
    when?: SimEventWhen;
  },
): SkillOpFn {
  return ctx => {
    const events = artsHit(frame, {
      dmgType: opts.dmgType,
      dmgMultiplier: pickSkillValueByRank(ctx, opts.rankTable, ctx.skillType),
      when: opts.when,
    })(ctx);

    if (opts.withInfliction) {
      events.push({
        type: "inflictionApply",
        frame: ctx.startFrame + frame,
        sourceId: ctx.sourceId,
        ownerId: ctx.targetId,
        inflictionType: opts.dmgType as InflictionType,
        inflictionStacks: 1,
        when: opts.when,
      } satisfies SimEventDraft);
    }

    return events;
  };
}

export function spRecoverByRank(
  frame: number,
  opts: {
    rankTable: readonly number[];
    ratio?: number;
  },
): SkillOpFn {
  return ctx => {
    const amount =
      pickSkillValueByRank(ctx, opts.rankTable, ctx.skillType) *
      Number(opts.ratio ?? 1);
    return [
      {
        type: "spRecover",
        frame: ctx.startFrame + frame,
        sourceId: ctx.sourceId,
        amount,
      } satisfies SimEventDraft,
    ];
  };
}
