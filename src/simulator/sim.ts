import type { OperatorBuild } from "../types/operator";
import {
  type SimEntityId,
  type SimEntity,
  type SimEvent,
  type SimEnv,
  type SimWorld,
} from "../types/simulator/simulator";
import { logDamage, pushLog } from "./log";
import {
  resolveStatusApplication,
  resolveInflictionExpiration,
  resolveBuffApplication,
  resolveBuffExpiration,
} from "./resolver";
import {
  createDefaultDamageModel,
  type DamageModel,
  type DamageContext,
} from "./damageModel";

/* SimWorld Builder */
export function createSimWorld(
  entities: SimEntity[],
  nowInFrames: number = 0,
  futureEvents: SimEvent[] = [],
): SimWorld {
  // Normalize entities so callers can stay lightweight.
  const normalized: SimEntity[] = entities.map(e => ({
    ...e,
    hp: Number((e as any).hp ?? 999999),
    inflictions: (e as any).inflictions ?? {},
    buffs: (e as any).buffs ?? {},
  }));

  const entitiesById: Record<SimEntityId, SimEntity> = Object.fromEntries(
    normalized.map(e => [e.id, e]),
  );
  const env = { entitiesById } as SimEnv;

  return {
    env,
    nowInFrames,
    futureEvents,
  };
}

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

const DEFAULT_DAMAGE_MODEL = createDefaultDamageModel();

// run sim
export type RunSimInput = {
  world: SimWorld;
  queue: SimEvent[];
  nextSeq: () => number;

  // Snapshot of operator build (static during combat).
  // Used by DamageModel for attack + attribute ratio.
  buildByOperatorId?: Record<string, OperatorBuild>;

  damageModel?: DamageModel;

  // Optional safety guard
  maxSteps?: number;
};

export type RunSimResult = {
  world: SimWorld;
  log: string[];
};

export function runSim(input: RunSimInput): RunSimResult {
  const { world, queue, nextSeq } = input;
  world.futureEvents = queue;
  const damageModel = input.damageModel ?? DEFAULT_DAMAGE_MODEL;
  const buildByOperatorId = input.buildByOperatorId;
  const log: string[] = [];

  pushLog(log, world.nowInFrames, "SIM start");

  let steps = 0;
  const maxSteps = input.maxSteps ?? 10000; // TODO: tune

  while (true) {
    if (steps++ > maxSteps) {
      pushLog(log, world.nowInFrames, `ABORT: exceeded maxSteps=${maxSteps}`);
      break;
    }

    if (queue.length === 0) break;
    const ev = popNext(queue);
    if (!ev) break;

    world.nowInFrames = ev.frame;

    const source = ev.sourceId ? world.env.entitiesById[ev.sourceId] : null;
    const target = ev.targetId ? world.env.entitiesById[ev.targetId] : null;

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
        if (!target) throw new Error(`undefined target`);
        if (!source) throw new Error(`undefined source`);

        const dmgSkillMultiplier = Number(ev.dmgMultiplier ?? 1);

        const ctx: DamageContext = {
          frame: ev.frame,
          kind: "physical",
          source,
          target,
          dmgSkillMultiplier,
          sourceBuild: buildByOperatorId?.[source.id],
          meta: {
            note: `source=${source.name} target=${target.name}`,
          },
        };

        const res = damageModel.compute(ctx);
        target.hp -= res.amount;

        pushLog(
          log,
          ev.frame,
          `HIT: dmgMul=${dmgSkillMultiplier} (source=${source.name} target=${target.name})`,
        );
        logDamage(log, ev.frame, ctx, res.amount);

        // Showy debug hook: you asked to leave hooks for future exact damage computation.
        // TODO: Replace with exact Endfield rounding / defenses / resistances / crit.
        pushLog(
          log,
          ev.frame,
          `  breakdown: atk=${res.breakdown.attackFinal.toFixed(2)} incomingInc=${res.breakdown.incomingIncMul.toFixed(
            2,
          )} special=${res.breakdown.specialMul.toFixed(2)} raw=${res.breakdown.rawDamage.toFixed(2)} hp=${target.hp}`,
        );

        break;
      }

      case "statusApply": {
        if (!target) throw new Error(`undefined target`);
        if (!source) throw new Error(`undefined source`);
        resolveStatusApplication(
          world,
          log,
          source.id,
          target.id,
          ev.statusType!,
          nextSeq,
          damageModel,
          buildByOperatorId,
        );
        break;
      }

      case "buffApply": {
        if (!target) throw new Error(`undefined target`);
        if (!source) throw new Error(`undefined source`);
        resolveBuffApplication(
          world,
          log,
          source.id,
          target.id,
          ev.buffType!,
          nextSeq,
        );
        break;
      }

      case "buffExpire": {
        // sourceId holds the entity who owns the buff.
        if (!ev.sourceId)
          throw new Error(`event with type buffExpire but no sourceId`);
        resolveBuffExpiration(world, log, ev.sourceId, ev.buffType!);
        break;
      }

      case "inflictionExpire": {
        if (!ev.sourceId)
          throw new Error(`event with type inflictionExpire but no sourceId`);
        resolveInflictionExpiration(
          world,
          log,
          ev.sourceId,
          ev.inflictionType!,
        );
        break;
      }

      default: {
        // Exhaustiveness guard (runtime)
        const _never: never = ev as never;
        pushLog(
          log,
          world.nowInFrames,
          `WARN: unknown event ${(_never as any)?.type}`,
        );
      }
    }
  }

  pushLog(log, world.nowInFrames, "SIM end");
  return { world, log };
}
