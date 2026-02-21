import { BuffId } from "../data/buffs/BuffDef";
import type { DmgType } from "../data/operators/OperatorDef";
import type { SimStatusType } from "../types/simulator/infliction";
import type { SimEvent } from "../types/simulator/simulator";

export type SkillCompileContext = {
  sourceId: string;
  targetId: string;
  startFrame: number;
  /** Skill type is carried by hit events so listeners can distinguish skill hits from normal attacks. */
  skillType: string;
  nextSeq: () => number;
  makeEventId: () => string;
};

export type SkillOpFn = (ctx: SkillCompileContext) => SimEvent[];

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
    events.push({
      id: ctx.makeEventId(),
      type: "hit",
      frame: ctx.startFrame + frame,
      seq: ctx.nextSeq(),

      sourceId: ctx.sourceId,
      targetId: ctx.targetId,

      hitType: (opts.dmgType ?? "physical") as any,
      skillType: ctx.skillType as any,
      dmgMultiplier: opts.dmgMultiplier,
    });

    const withStatus = Boolean(opts.withStatus);
    if (withStatus) {
      if (!opts.statusType)
        throw new Error(
          `physicalHit(frame=${frame}): withStatus=true but statusType missing`,
        );
      events.push({
        id: ctx.makeEventId(),
        type: "statusApply",
        frame: ctx.startFrame + frame,
        seq: ctx.nextSeq(),

        sourceId: ctx.sourceId,
        targetId: ctx.targetId,

        statusType: opts.statusType,
      });
    }

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
