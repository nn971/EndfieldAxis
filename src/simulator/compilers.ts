import operatorsData from "../data/operators";
import { makeId } from "../shared/lib/id";
import { SkillType } from "../data/operators/OperatorDef";
import type { SimEvent } from "../types/simulator/simulator";

const EVENT_PREFIX = "SimEvent_";
function makeEventId() {
  return makeId(EVENT_PREFIX);
}

export function compileSkillCast(params: {
  sourceId: string;
  skillType: SkillType;
  targetId: string;
  startFrame: number;
  nextSeq: () => number;
}): SimEvent[] {
  const { sourceId, skillType, targetId, startFrame, nextSeq } = params;
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
  for (const step of skill?.timeline ?? []) {
    if (typeof step !== "function") {
      throw new Error(
        `Skill timeline must be function steps now. Found: ${JSON.stringify(step)}`,
      );
    }
    const eventsToAdd = (step as any)({
      sourceId,
      targetId,
      startFrame,
      skillType,
      nextSeq,
      makeEventId,
    });
    for (const ev of (eventsToAdd ?? []) as SimEvent[]) {
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
