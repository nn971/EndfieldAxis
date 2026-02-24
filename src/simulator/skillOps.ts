import { BuffId } from "../data/buffs/BuffDef";
import type { DmgType, SkillType } from "../data/operators/OperatorDef";
import type { SimStatusType } from "../types/simulator/infliction";
import type { SimEvent } from "../types/simulator/simulator";

export type SkillCompileContext = {
  sourceId: string;
  targetId: string;
  startFrame: number;
  /** Skill type is carried by hit events so listeners can distinguish skill hits from normal attacks. */
  skillType: SkillType;
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
      hitTypes: {
        [ctx.skillType as SkillType]: true,
      },
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
