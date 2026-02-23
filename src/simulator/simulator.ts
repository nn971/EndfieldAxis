import type { OperatorBuild } from "../types/operator";
import type {
  SimBuff,
  SimInfliction,
  SimStatusType,
} from "../types/simulator/infliction";
import type { DamageType } from "../types/operator";
import type {
  SimEntity,
  SimEntityId,
  SimEnv,
  SimEvent,
} from "../types/simulator/simulator";
import { makeId } from "../shared/lib/id";
import type { DamageContext, DamageModel } from "./damage/damageModel";
import { pushLog, type SimLog, type SimLogEntryCat } from "./log";
import { SimRegistry } from "./listeners/registry";

import { buildDamageContext } from "./damage/damageEngine";
// import { dispatchAfterHit } from "./listeners/handlers";
import { createDefaultDamageModel } from "./damage/damageModel";

// import resolver methods
import "./resolvers";
import {
  resolveBuffApplication,
  resolveBuffExpiration,
  resolveInflictionExpiration,
  resolveStatusApplication,
} from "./resolvers";
import { BuffId } from "../data/buffs/BuffDef";

/**
 * SimWorld
 *
 * Owns *all* mutable state for a single simulation run:
 * - entities (hp / buffs / inflictions)
 * - current frame
 * - event queue + sequence counter
 * - log
 * - optional operator-build snapshot (static for the run)
 *
 * It exposes two public surfaces:
 * - world.read: intended read-only access
 * - world.ops: intended mutation access (the only place that should mutate)
 */

export type SimRead = {
  readonly nowInFrames: number;
  readonly env: SimEnv;
  getEntity(id: SimEntityId): SimEntity;
  /** Returns operator build if this entityId corresponds to an operator, else undefined. */
  getBuild(entityId: SimEntityId): OperatorBuild | undefined;
};

export type SimOps = {
  /** Deterministic sequence generator for event ordering within the same frame. */
  nextSeq: () => number;
  /** Insert an event into the future event queue. */
  schedule: (ev: SimEvent) => void;
  /** Pop the next event in chronological order. */
  popNextEvent: () => SimEvent | null;
  /** Advance simulation time to the given frame. */
  advanceToFrame: (frame: number) => void;
  /** Append a log entry (includes frame + env reference). */
  log: (
    cat: SimLogEntryCat,
    message: string,
    ctx?: DamageContext,
    breakdown?: Record<string, unknown>,
    amount?: number,
  ) => void;
  /** Apply raw damage (integer) to target hp. */
  applyDamage: (targetId: SimEntityId, amount: number) => void;
  upsertBuff: (targetId: SimEntityId, buff: SimBuff) => void;
  removeBuff: (targetId: SimEntityId, buffId: BuffId) => void;
  /**
   * Add stacks to a buff (creating it if missing), clamping to [0, maxStacks].
   * Optionally emits a log entry when stacks change.
   */
  // addBuffStacks: (params: {
  //   targetId: SimEntityId;
  //   buffId: BuffId;
  //   delta: number;
  //   maxStacks: number;
  //   logOnChange?: {
  //     cat: SimLogEntryCat;
  //     format: (before: number, after: number) => string;
  //   };
  // }) => void;
  upsertInfliction: (targetId: SimEntityId, inf: SimInfliction) => void;
  removeInfliction: (targetId: SimEntityId, inflictionType: DamageType) => void;
};

type SimResolvers = {
  /** should return whether the status is triggered */
  resolveStatusApplication: (
    sourceId: SimEntityId,
    targetId: SimEntityId,
    statusType: SimStatusType,
  ) => boolean;
  resolveBuffApplication: (
    sourceId: SimEntityId,
    targetId: SimEntityId,
    buffId: BuffId,
  ) => void;
  resolveBuffExpiration: (entityId: SimEntityId, buffId: BuffId) => void;
  resolveInflictionExpiration: (
    sourceId: SimEntityId,
    inflictionType: DamageType,
  ) => void;
};

type SimWorldInit = {
  entities: SimEntity[];
  buildByOperatorId: Record<string, OperatorBuild>;
  nowInFrames?: number;
  futureEvents?: SimEvent[];
  registry: SimRegistry;
  damageModel?: DamageModel;
};

/** Larger seq happens first in the same frame */
function sortEventsInPlace(queue: SimEvent[]): void {
  queue.sort((a, b) => {
    if (a.frame !== b.frame) return a.frame - b.frame;
    return b.seq - a.seq;
  });
}

export class SimWorld {
  // Publicly readable, but mutations should go through ops.
  public readonly env: SimEnv;
  public nowInFrames: number;
  public readonly log: SimLog = [];

  private queue: SimEvent[] = [];
  private seqCounter = 1;
  private buildByOperatorId?: Record<string, OperatorBuild>;
  public readonly registry: SimRegistry;
  public readonly damageModel: DamageModel;

  public readonly read: SimRead;
  public readonly ops: SimOps;
  public readonly resolvers: SimResolvers;

  constructor(init: SimWorldInit) {
    this.buildByOperatorId = init.buildByOperatorId;
    const entitiesById: Record<string, SimEntity> = {};
    for (const e of init.entities) {
      entitiesById[e.id] = e;
    }
    this.env = { entitiesById };
    this.nowInFrames = init.nowInFrames ?? 0;

    if (init.futureEvents && init.futureEvents.length > 0) {
      // Clone to avoid accidental external mutation.
      this.queue = [...init.futureEvents];
      sortEventsInPlace(this.queue);
      // Ensure seqCounter is ahead of any provided seq values.
      const maxSeq = this.queue.reduce((m, ev) => Math.max(m, ev.seq ?? 0), 0);
      this.seqCounter = Math.max(this.seqCounter, maxSeq + 1);
    }

    this.registry = init.registry;
    this.damageModel = init.damageModel ?? createDefaultDamageModel();

    // Note: we expose read/ops as stable objects so callers can pass e.g. world.ops.nextSeq.
    const self = this;
    this.read = {
      get nowInFrames() {
        return self.nowInFrames;
      },
      get env() {
        return self.env;
      },
      getEntity: (id: SimEntityId) => self.getEntityOrThrow(id),
      getBuild: (entityId: SimEntityId) => self.buildByOperatorId?.[entityId],
    };

    this.ops = {
      nextSeq: () => this.nextSeq(),
      schedule: (ev: SimEvent) => this.schedule(ev),
      popNextEvent: () => this.popNextEvent(),
      advanceToFrame: (frame: number) => this.advanceToFrame(frame),
      log: (cat, message, ctx, breakdown, amount) =>
        this.appendLog(cat, message, ctx, breakdown, amount),
      applyDamage: (targetId, amount) => this.applyDamage(targetId, amount),
      upsertBuff: (targetId, buff) => this.upsertBuff(targetId, buff),
      removeBuff: (targetId, buffId) => this.removeBuff(targetId, buffId),
      // addBuffStacks: params => this.addBuffStacks(params),
      upsertInfliction: (targetId, inf) => this.upsertInfliction(targetId, inf),
      removeInfliction: (targetId, inflictionType) =>
        this.removeInfliction(targetId, inflictionType),
    };

    this.resolvers = {
      resolveBuffApplication: (sourceId, targetId, buffId) =>
        resolveBuffApplication(self, sourceId, targetId, buffId),
      resolveBuffExpiration: (entityId, buffId) =>
        resolveBuffExpiration(self, entityId, buffId),
      resolveInflictionExpiration: (sourceId, inflictionType) =>
        resolveInflictionExpiration(self, sourceId, inflictionType),
      resolveStatusApplication: (sourceId, targetId, statusType) =>
        resolveStatusApplication(self, sourceId, targetId, statusType),
    };
  }

  // ----- Read helpers -----
  private getEntityOrThrow(id: SimEntityId): SimEntity {
    const ent = this.env.entitiesById[id];
    if (!ent) throw new Error(`Unknown entity id=${id}`);
    return ent;
  }

  // ----- Queue helpers -----
  private nextSeq(): number {
    return this.seqCounter++;
  }

  private schedule(ev: SimEvent): void {
    this.queue.push(ev);
    sortEventsInPlace(this.queue);
  }

  private popNextEvent(): SimEvent | null {
    if (this.queue.length === 0) return null;
    return this.queue.shift() ?? null;
  }

  private advanceToFrame(frame: number): void {
    this.nowInFrames = frame;
  }

  // ----- Log -----
  private appendLog(
    cat: SimLogEntryCat,
    message: string,
    ctx?: DamageContext,
    breakdown?: Record<string, unknown>,
    amount?: number,
  ): void {
    pushLog(
      this.log,
      cat,
      this.nowInFrames,
      this.env,
      message,
      ctx,
      breakdown,
      amount,
    );
  }

  // ----- Mutations (worldOps) -----
  private applyDamage(targetId: SimEntityId, amount: number): void {
    const ent = this.getEntityOrThrow(targetId);
    const dmg = Math.max(0, Math.floor(Number(amount) || 0));
    (ent as any).hp = Math.max(0, Number((ent as any).hp ?? 0) - dmg);
  }

  private upsertBuff(targetId: SimEntityId, buff: SimBuff): void {
    const ent = this.getEntityOrThrow(targetId);
    (ent as any).buffs ??= {};
    (ent as any).buffs[buff.id] = buff;
  }

  private removeBuff(targetId: SimEntityId, buffId: BuffId): void {
    const ent = this.getEntityOrThrow(targetId);
    if (!(ent as any).buffs) return;
    delete (ent as any).buffs[buffId];
  }

  // private addBuffStacks(params: {
  //   targetId: SimEntityId;
  //   buffId: BuffId;
  //   delta: number;
  //   maxStacks: number;
  //   logOnChange?: {
  //     cat: SimLogEntryCat;
  //     format: (before: number, after: number) => string;
  //   };
  // }): void {
  //   const ent = this.getEntityOrThrow(params.targetId);
  //   ent.buffs ??= {};
  //   const existing = ent.buffs[params.buffId] as SimBuff | undefined;
  //   const before = Math.max(0, Number((existing as any)?.stacks ?? 0));
  //   const after = Math.max(
  //     0,
  //     Math.min(
  //       params.maxStacks,
  //       before + Math.trunc(Number(params.delta) || 0),
  //     ),
  //   );

  //   if (!existing) {
  //     ent.buffs[params.buffId] = {
  //       id: params.buffId,
  //       stacks: after,
  //       lastApplyFrame: this.nowInFrames,
  //     } as any;
  //   } else {
  //     (existing as any).stacks = after;
  //     (existing as any).lastApplyFrame = this.nowInFrames;
  //     ent.buffs[params.buffId] = existing;
  //   }

  //   if (params.logOnChange && before !== after) {
  //     this.appendLog(
  //       params.logOnChange.cat,
  //       params.logOnChange.format(before, after),
  //     );
  //   }
  // }

  private upsertInfliction(targetId: SimEntityId, inf: SimInfliction): void {
    const ent = this.getEntityOrThrow(targetId);
    (ent as any).inflictions ??= {};
    (ent as any).inflictions[inf.type] = inf;
  }

  private removeInfliction(
    targetId: SimEntityId,
    inflictionType: DamageType,
  ): void {
    const ent = this.getEntityOrThrow(targetId);
    if (!(ent as any).inflictions) return;
    delete (ent as any).inflictions[inflictionType];
  }

  public runSim(maxSteps: number = 10000) {
    // const session = { world, registry, damageModel };

    this.ops.log("sim", "SIM start");

    let steps = 0;

    while (true) {
      if (steps++ > maxSteps) {
        this.ops.log("sim", `ABORT: exceeded maxSteps=${maxSteps}`);
        break;
      }

      const ev = this.ops.popNextEvent();
      if (!ev) break;

      this.ops.advanceToFrame(ev.frame);

      const source = ev.sourceId
        ? (this.read.getEntity(ev.sourceId) as SimEntity)
        : null;
      const target = ev.targetId
        ? (this.read.getEntity(ev.targetId) as SimEntity)
        : null;

      switch (ev.type) {
        case "castStart": {
          this.ops.log(
            "act",
            `"${source?.name}" cast "${ev.skillType}" on "${target?.name}"`,
          );
          break;
        }

        case "castEnd": {
          this.ops.log(
            "act",
            `"${source?.name}" finished casting "${ev.skillType}" on "${target?.name}"`,
          );
          break;
        }

        case "hit": {
          if (!target) throw new Error(`undefined target`);
          if (!source) throw new Error(`undefined source`);

          const dmgSkillMultiplier = Number(ev.dmgMultiplier ?? 1);

          const ctx = buildDamageContext({
            registry: this.registry,
            read: this.read,
            frame: ev.frame,
            kind: "physical",
            sourceId: source.id,
            targetId: target.id,
            dmgSkillMultiplier,
            ev,
            meta: {
              note: `source=${source.name} target=${target.name}`,
              hitEvent: ev,
            },
          });

          const res = this.damageModel.compute(ctx);
          this.ops.applyDamage(target.id, res.amount);

          const targetAfter = this.read.getEntity(target.id);

          this.ops.log(
            "dmg",
            `"${source.name}" hit "${target.name}" for ${res.amount} damage by ${ev.HitType} (hp left: ${(targetAfter as any).hp})`,
            ctx,
            res.breakdown,
            res.amount,
          );

          const spawned = this.registry.runAfterHit({
            read: this.read,
            ev: ev,
            sourceId: source.id,
            targetId: target.id,
            nextSeq: this.ops.nextSeq,
            makeEventId: () => makeId("SimEvent_"),
          });
          for (const sev of spawned) this.ops.schedule(sev);
          break;
        }

        case "statusApply": {
          if (!target) throw new Error(`undefined target`);
          if (!source) throw new Error(`undefined source`);

          // First resolve the status (mutates inflictions and may schedule proc hits).
          const success = this.resolvers.resolveStatusApplication(
            source.id,
            target.id,
            ev.statusType!,
          );

          // Trigger listeners only if status successfully triggered TODO why isn't this working?
          if (!success) break;

          // Then run triggers that want to react to a status application.
          // Since same-frame events execute by descending seq, spawned events will run
          // before any proc hits scheduled by the resolver above.
          const spawned = this.registry.runBeforeApplyStatus({
            read: this.read,
            ev: ev,
            sourceId: source.id,
            targetId: target.id,
            nextSeq: this.ops.nextSeq,
            makeEventId: () => makeId("SimEvent_"),
          });
          for (const sev of spawned) this.ops.schedule(sev);
          break;
        }

        case "buffApply": {
          if (!target) throw new Error(`undefined target`);
          if (!source) throw new Error(`undefined source`);
          this.resolvers.resolveBuffApplication(
            source.id,
            target.id,
            ev.buffId!,
          );
          break;
        }

        case "buffExpire": {
          // sourceId holds the entity who owns the buff.
          if (!ev.sourceId)
            throw new Error(`event with type buffExpire but no sourceId`);
          this.resolvers.resolveBuffExpiration(ev.sourceId, ev.buffId!);
          break;
        }

        case "inflictionExpire": {
          if (!ev.sourceId)
            throw new Error(`event with type inflictionExpire but no sourceId`);
          this.resolvers.resolveInflictionExpiration(
            ev.sourceId,
            ev.inflictionType!,
          );
          break;
        }

        default: {
          // Exhaustiveness guard (runtime)
          const _never: never = ev as never;
          this.ops.log("dev", `WARN: unknown event ${(_never as any)?.type}`);
        }
      }
    }

    this.ops.log("sim", "SIM end");
  }
}
