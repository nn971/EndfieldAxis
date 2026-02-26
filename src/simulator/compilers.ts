import operatorsData from "../data/operators";
import { makeId } from "../shared/lib/id";
import { SkillType } from "../data/operators/OperatorDef";
import type { SimEvent } from "../types/simulator/simulator";
import type { OperatorBuild } from "../types/operator";

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
  // Here we need to reverse the order because larger seq happens earlier.
  for (const step of skill?.timeline?.reverse() ?? []) {
    if (typeof step !== "function") {
      throw new Error(
        `Skill timeline step must be function. Found: ${JSON.stringify(step)}`,
      );
    }
    const eventsToAdd = (step as any)({
      sourceId,
      targetId,
      startFrame,
      skillType,
      sourceBuild: buildByOperatorId?.[sourceId],
      nextSeq,
      makeEventId,
    });
    for (const ev of (eventsToAdd ?? []) as SimEvent[]) {
      // Link timeline events to the castStart event so downstream logic can
      // reconstruct provenance via SimEventBase.ref.
      (ev as any).ref ??= startEventId;

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
