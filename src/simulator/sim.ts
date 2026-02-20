import type { OperatorBuild } from "../types/operator";
import {
  type SimEntityId,
  type SimEntity,
  type SimEvent,
  type SimEnv,
  type SimWorld,
} from "../types/simulator/simulator";
import { SimLog, pushLog } from "./log";
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
    log: [] as SimLog,
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
  finalWorld: SimWorld;
};

export function runSim(input: RunSimInput): RunSimResult {
  const { world, queue, nextSeq } = input;
  world.futureEvents = queue;
  const damageModel = input.damageModel ?? DEFAULT_DAMAGE_MODEL;
  const buildByOperatorId = input.buildByOperatorId;

  pushLog(world.log, "sim", world.nowInFrames, world.env, "SIM start");

  let steps = 0;
  const maxSteps = input.maxSteps ?? 10000; // TODO: tune

  while (true) {
    if (steps++ > maxSteps) {
      pushLog(
        world.log,
        "sim",
        world.nowInFrames,
        world.env,
        `ABORT: exceeded maxSteps=${maxSteps}`,
      );
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
          world.log,
          "act",
          ev.frame,
          world.env,
          `"${source?.name}" cast "${ev.skillType}" on "${target?.name}"`,
        );
        break;
      }

      case "castEnd": {
        pushLog(
          world.log,
          "act",
          ev.frame,
          world.env,
          `"${source?.name}" finished casting "${ev.skillType}" on "${target?.name}"`,
        );
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
          world.log,
          "dmg",
          ev.frame,
          world.env,
          `"${source.name}" hit "${target.name}" for ${res.amount} damage (hp left: ${target.hp})`,
          ctx,
          res.amount,
        );
        break;
      }

      case "statusApply": {
        if (!target) throw new Error(`undefined target`);
        if (!source) throw new Error(`undefined source`);
        resolveStatusApplication(
          world,
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
        resolveBuffExpiration(world, ev.sourceId, ev.buffType!);
        break;
      }

      case "inflictionExpire": {
        if (!ev.sourceId)
          throw new Error(`event with type inflictionExpire but no sourceId`);
        resolveInflictionExpiration(world, ev.sourceId, ev.inflictionType!);
        break;
      }

      default: {
        // Exhaustiveness guard (runtime)
        const _never: never = ev as never;
        pushLog(
          world.log,
          "dev",
          world.nowInFrames,
          world.env,
          `WARN: unknown event ${(_never as any)?.type}`,
        );
      }
    }
  }

  pushLog(world.log, "sim", world.nowInFrames, world.env, "SIM end");
  return { finalWorld: world };
}
