import operatorsData from "../data/operators";
import { SkillType } from "../data/operators/OperatorDef";
import type { SimEvent } from "../types/simulator/simulator";
import type { OperatorBuild } from "../types/operator";
import { makeSimEventId } from "../shared/lib/utils";
import { SkillCompileContextclampSkillRank } from "./skillOps";

/** @deprecated */

export function compileSkillCast(params: {
  sourceId: string;
  skillType: SkillType;
  targetId: string;
  startFrame: number;
  nextSeq: () => number;
  buildByOperatorId?: Record<string, OperatorBuild>;
}): SimEvent[] {
  const {
    sourceId,
    skillType,
    targetId,
    startFrame,
    nextSeq,
    buildByOperatorId,
  } = params;
  const operator = operatorsData[sourceId];
  if (!operator) {
    console.warn(
      `Unknown operator with id ${sourceId} while compiling skill cast`,
    );
    return [];
  }
  const skill = operator.skills[skillType];
  if (!skill) {
    console.warn(
      `Unknown skill type ${skillType} for operator ${sourceId} while compiling skill cast`,
    );
    return [];
  }

  const events: SimEvent[] = [];

  // event for cast.start
  const startEventId = makeSimEventId();
  events.push({
    id: startEventId,
    type: "castStart",
    frame: startFrame,
    seq: nextSeq(),

    sourceId: sourceId,
    targetId: targetId,

    skillType: skillType,
  });

  // Legacy timeline compilation has been intentionally disabled.
  // Skills now emit runtime events via unified script plugins on castStart.
  // Kept buildByOperatorId in signature temporarily for compatibility while callers migrate.
  void buildByOperatorId;

  // event for cast.end
  events.push({
    id: makeSimEventId(),
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
