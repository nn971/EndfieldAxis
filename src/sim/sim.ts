import {
  SimEntityId,
  SimEntity,
  SimEvent,
  SimEnv,
  SimWorld,
} from "../types/sim/simulator";
import { pushLog } from "./log";
import {
  resolveStatusApplication,
  resolveInflictionExpiration,
  resolveBuffApplication,
  resolveBuffExpiration,
} from "./resolver";

// TEMP: crystal debuff increases physical damage taken by 20%.
// TODO: move to data-driven content and unify with a real damage model.
const CRYSTAL_PHYSICAL_TAKEN_MULTIPLIER = 1.2;

/* SimWorld Builder */
export function createSimWorld(
  entities: SimEntity[],
  nowInFrames: number = 0,
  futureEvents: SimEvent[] = [],
): SimWorld {
  // Normalize entity shape so resolver logic can assume maps exist.
  const normalized = entities.map(e => {
    const anyE = e as any;
    return {
      ...anyE,
      hp: anyE.hp ?? 1,
      inflictions: anyE.inflictions ?? {},
      buffs: anyE.buffs ?? {},
    } as SimEntity;
  });

  const entitiesById: Record<SimEntityId, SimEntity> = Object.fromEntries(
    normalized.map(e => [e.id, e]),
  );
  const env = { entitiesById: entitiesById } as SimEnv;

  return {
    env: env,
    nowInFrame: nowInFrames,
    futureEvents: futureEvents,
  };
}

/* TEMP resolver */
// export function getStacks(
//   world: SimWorld,
//   entityId: SimEntityId,
//   statusId: SimStatusId,
// ): number {
//   return world.env.entitiesById[entityId]?.inflictions?.[statusId]?.stacks ?? 0;
// }

// export function setStacks(
//   world: SimWorld,
//   statusLib: Record<SimStatusId, SimStatusDef>,
//   entityId: SimEntityId,
//   statusId: SimStatusId,
//   stacks: number,
// ): void {
//   const def = statusLib[statusId];
//   const max = def?.maxStacks ?? stacks;
//   const next = Math.max(0, Math.min(max, Math.floor(stacks)));

//   const ent = world.env.entitiesById[entityId];
//   if (!ent) return;

//   if (next <= 0) {
//     if (ent.statuses[statusId]) delete ent.statuses[statusId];
//     return;
//   }

//   ent.statuses[statusId] = { id: statusId, stacks: next } as SimInfliction;
// }
// export function addStacks(
//   world: SimWorld,
//   statusLib: Record<SimStatusId, SimStatusDef>,
//   entityId: SimEntityId,
//   statusId: SimStatusId,
//   delta: number,
// ): { before: number; after: number } {
//   const before = getStacks(world, entityId, statusId);
//   setStacks(world, statusLib, entityId, statusId, before + delta);
//   const after = getStacks(world, entityId, statusId);
//   return { before, after };
// }
// export function consumeAllStacks(
//   world: SimWorld,
//   statusLib: Record<SimStatusId, SimStatusDef>,
//   entityId: SimEntityId,
//   statusId: SimStatusId,
// ): number {
//   const before = getStacks(world, entityId, statusId);
//   if (before <= 0) return 0;
//   setStacks(world, statusLib, entityId, statusId, 0);
//   return before;
// }
export type PhysicalStatusKind = "crush" | "breach" | "lift" | "knockDown";

export type SkillOpPhysicalStatusHit = {
  op: "physicalStatusHit";
  kind: PhysicalStatusKind;
  baseDamage: number;
  baseCrushBurst?: number;
};

export type SkillOp = SkillOpPhysicalStatusHit;

export type SimEventCastStart = SimEvent & {
  type: "cast.start";
  casterId: SimEntityId;
  targetId: SimEntityId;
  skillId: string;
  skillName?: string;
  durationFrames: number;
};

export type SimEventCastEnd = SimEvent & {
  type: "cast.end";
  casterId: SimEntityId;
  targetId: SimEntityId;
  skillId: string;
  skillName?: string;
};

export type SimEventSkillOp = SimEvent & {
  type: "skill.op";
  casterId: SimEntityId;
  targetId: SimEntityId;
  skillId: string;
  skillName?: string;
  op: SkillOp;
};

// export type SimScheduledEvent =
//   | SimEventCastStart
//   | SimEventCastEnd
//   | SimEventSkillOp;
// function execSkillOp(
//   world: SimWorld,
//   statusLib: Record<SimStatusId, SimStatusDef>,
//   damageModel: DamageModel,
//   log: string[],
//   ev: SimScheduledEvent,
// ): void {
//   const { frame, casterId, targetId, op } = ev;

//   if (op.op === "physicalStatusHit") {
//     pushLog(
//       log,
//       frame,
//       `OP: physicalStatusHit kind=${op.kind} (caster=${casterId} target=${targetId})`,
//     );

//     // Base damage (v0: logged only)
//     const base = damageModel.computeBaseDamage({
//       baseDamage: op.baseDamage,
//       casterId,
//       targetId,
//       op,
//     });
//     if (base !== 0) pushLog(log, frame, `DMG base=${base} (tag=base)`);

//     if (op.kind === "crush") {
//       resolveCrush(
//         world,
//         statusLib,
//         damageModel,
//         log,
//         frame,
//         casterId,
//         targetId,
//         op.baseCrushBurst ?? 0,
//       );
//     } else {
//       // For v0 we only implement crush.
//       pushLog(log, frame, `TODO: kind=${op.kind} not implemented`);
//     }

//     return;
//   }

//   // If we add more ops later, they go here.
//   const _never: never = op as never;
//   pushLog(log, frame, `WARN: unknown op ${(_never as any)?.op}`);
// }

// function resolveCrush(
//   world: SimWorld,
//   statusLib: Record<SimStatusId, SimStatusDef>,
//   damageModel: DamageModel,
//   log: string[],
//   frame: number,
//   casterId: SimEntityId,
//   targetId: SimEntityId,
//   baseCrushBurst: number,
// ): void {
//   const stacks = getStacks(world, targetId, "vulnerable");

//   if (stacks <= 0) {
//     const { before, after } = addStacks(
//       world,
//       statusLib,
//       targetId,
//       "vulnerable",
//       1,
//     );
//     pushLog(log, frame, `STATUS vulnerable +1 (${before} -> ${after})`);
//     return;
//   }

//   const consumed = consumeAllStacks(world, statusLib, targetId, "vulnerable");
//   pushLog(log, frame, `STATUS vulnerable consumed=${consumed} (now 0)`);

//   if (baseCrushBurst !== 0 && consumed > 0) {
//     const burst = damageModel.computeCrushBurstDamage({
//       baseCrushBurst,
//       stacksConsumed: consumed,
//       casterId,
//       targetId,
//     });
//     if (burst !== 0)
//       pushLog(
//         log,
//         frame,
//         `DMG crushBurst=${burst} (tag=crushBurst stacks=${consumed})`,
//       );
//   }
// }

/* Simulator core logic */
export function makeQueue(): SimEvent[] {
  return [];
}

export function schedule(queue: SimEvent[], ev: SimEvent): void {
  /* insert sorted by (frame, seq) */
  let lo = 0,
    hi = queue.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const m = queue[mid];
    if (m.frame < ev.frame || (m.frame === ev.frame && m.seq <= ev.seq))
      lo = mid + 1;
    else hi = mid;
  }
  queue.splice(lo, 0, ev);
}

function popNext(queue: SimEvent[]): SimEvent | null {
  return queue.length ? queue.shift()! : null;
}

export type DamageModel = {
  computeBaseDamage(ctx: {
    baseDamage: number;
    casterId: SimEntityId;
    targetId: SimEntityId;
    op: SkillOp;
  }): number;
  computeCrushBurstDamage(ctx: {
    baseCrushBurst: number;
    stacksConsumed: number;
    casterId: SimEntityId;
    targetId: SimEntityId;
  }): number;
};
export const defaultDamageModel: DamageModel = {
  computeBaseDamage: ({ baseDamage }) => baseDamage,
  computeCrushBurstDamage: ({ baseCrushBurst, stacksConsumed }) =>
    baseCrushBurst * stacksConsumed,
};

// run sim
export type RunSimInput = {
  world: SimWorld;
  queue: SimEvent[];
  nextSeq: () => number;
  // statusLib: Record<SimStatusId, SimStatusDef>;
  damageModel?: DamageModel;
  // optional safety guard
  maxSteps?: number;
};

export type RunSimResult = {
  world: SimWorld;
  log: string[];
};

export function runSim(input: RunSimInput): RunSimResult {
  const { world, queue, nextSeq } = input;
  world.futureEvents = queue;
  const damageModel = input.damageModel ?? defaultDamageModel;
  const log: string[] = [];

  pushLog(log, world.nowInFrame, "SIM start");

  let steps = 0;
  const maxSteps = input.maxSteps ?? 10000; //TODO
  while (true) {
    if (steps++ > maxSteps) {
      pushLog(log, world.nowInFrame, `ABORT: exceeded maxSteps=${maxSteps}`);
      break;
    }

    if (queue.length === 0) break;
    const ev = popNext(queue);
    if (!ev) break;

    world.nowInFrame = ev.frame;

    const source = world.env.entitiesById[ev.sourceId!];
    const target = world.env.entitiesById[ev.targetId!];
    switch (ev.type) {
      case "castStart": {
        pushLog(
          log,
          ev.frame,
          `CAST start: ${ev.skillType} of ${source?.name} (target=${target?.name})`,
        );
        break;
      }
      case "castEnd": {
        pushLog(log, ev.frame, `CAST end: ${ev.skillType} of ${source?.name}`);
        break;
      }

      case "hit": {
        const isCrystaled = Boolean(target?.buffs?.crystal);
        const dmgTakenMultiplier =
          ev.hitType === "physical" && isCrystaled
            ? CRYSTAL_PHYSICAL_TAKEN_MULTIPLIER
            : 1;
        pushLog(
          log,
          ev.frame,
          `HIT: type=${ev.hitType} dmgMultiplier=${ev.dmgMultiplier} isCrystaled=${isCrystaled} dmgTakenMultiplier=${dmgTakenMultiplier} (source=${source?.name} target=${target?.name}) // TODO damage`,
        );
        break;
      }

      case "statusApply": {
        resolveStatusApplication(
          world,
          log,
          ev.targetId!,
          ev.statusType!,
          nextSeq,
          ev.sourceId,
        );
        break;
      }

      case "buffApply": {
        resolveBuffApplication(
          world,
          log,
          ev.targetId!,
          ev.buffType!,
          nextSeq,
          ev.sourceId,
        );
        break;
      }

      case "buffExpire": {
        resolveBuffExpiration(world, log, ev.targetId!, ev.buffType!);
        break;
      }
      case "inflictionExpire": {
        resolveInflictionExpiration(
          world,
          log,
          ev.sourceId!,
          ev.inflictionType!,
        );
        break;
      }
      default: {
        // Exhaustiveness guard (runtime)
        const _never: never = ev as never;
        pushLog(
          log,
          world.nowInFrame,
          `WARN: unknown event ${(_never as any)?.type}`,
        );
      }
    }
  }

  pushLog(log, world.nowInFrame, "SIM end");
  return { world, log };
}
