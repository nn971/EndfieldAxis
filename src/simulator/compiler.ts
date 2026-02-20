import { getOperator } from "../data/operators";
import { makeId } from "../shared/lib/id";
import { SkillOp, SkillType } from "../types/operator";
import type { SimEvent } from "../types/simulator/simulator";

const EVENT_PREFIX = "SimEvent_";
function makeEventId() {
  return makeId(EVENT_PREFIX);
}

function compileOp(
  op: SkillOp,
  sourceId: string,
  targetId: string,
  startFrame: number,
  skillType: SkillType,
  nextSeq: () => number,
): SimEvent[] {
  const events: SimEvent[] = [];
  switch (op.type) {
    case "physicalHit":
      events.push({
        id: makeEventId(),
        type: "hit",
        frame: startFrame + op.frame,
        seq: nextSeq(),

        sourceId: sourceId,
        targetId: targetId,

        hitType: "physical",
        skillType,
        dmgMultiplier: op.dmgMultiplier,
      });

      if (op.withStatus) {
        if (!op.statusType)
          throw new Error(
            `op = ${JSON.stringify(op)}\n op.withStatus is true but op.statusId is not set`,
          );
        events.push({
          id: makeEventId(),
          type: "statusApply",
          frame: startFrame + op.frame,
          seq: nextSeq(),

          sourceId: sourceId,
          targetId: targetId,

          statusType: op.statusType,
        });
      }
      return events; // TODO

    case "applyBuff": {
      events.push({
        id: makeEventId(),
        type: "buffApply",
        frame: startFrame + op.frame,
        seq: nextSeq(),

        sourceId: sourceId,
        targetId: targetId,

        buffType: op.buffType,
      });
      return events;
    }
    default: {
      throw new Error(`Unknown op type ${(op as any).type}`);
    }
  }
  //   if (entry.op === "physicalStatusHit") {
  //     const kind = String((entry as any).kind ?? "crush");
  //     const baseDamage = Number((entry as any).baseDamage ?? 0);
  //     const baseCrushBurst =
  //       (entry as any).baseCrushBurst != null
  //         ? Number((entry as any).baseCrushBurst)
  //         : undefined;

  //     return [{ op: "physicalStatusHit", kind, baseDamage, baseCrushBurst }];
  //   }
}

export function compileSkillCast(params: {
  sourceId: string;
  skillType: SkillType;
  targetId: string;
  startFrame: number;
  nextSeq: () => number;
}): SimEvent[] {
  const { sourceId, skillType, targetId, startFrame, nextSeq } = params;
  const operator = getOperator(sourceId);
  if (!operator) return [];
  const skill = operator.skills[skillType];
  if (!skill) return [];

  const events: SimEvent[] = [];

  // event for cast.start
  const startEventId = makeEventId();
  events.push({
    id: startEventId,
    type: "castStart",
    frame: startFrame,
    seq: nextSeq(),

    sourceId: sourceId,
    targetId: targetId,

    skillType: skillType,
  });

  // events for skill ops
  for (const op of skill?.timeline ?? []) {
    const eventsToAdd = compileOp(
      op,
      sourceId,
      targetId,
      startFrame,
      skillType,
      nextSeq,
    );
    if (!eventsToAdd || eventsToAdd.length === 0) continue; // should not happen

    for (const ev of eventsToAdd) {
      events.push(ev);
    }
  }

  // event for cast.end
  events.push({
    id: makeEventId(),
    type: "castEnd",
    frame: startFrame + skill.durationFrames,
    seq: nextSeq(),

    sourceId: sourceId,
    targetId: targetId,

    ref: startEventId, // reference to the cast.start event

    skillType: skillType,
  });

  return events;
}
