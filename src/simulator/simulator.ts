import type { OperatorBuild } from "../types/operator";
import operatorsData from "../data/operators";
import type {
  InflictionType,
  SimBuff,
  SimInfliction,
  SimStatusType,
} from "../types/simulator/infliction";
import { INFLICTION_TYPE_LIST } from "../types/simulator/infliction";
import type {
  SimEntity,
  SimEntityId,
  SimEnvWithGlobalBuffs,
  SimEvent,
  SimComboState,
} from "../types/simulator/simulator";
import type { DamageBonusLogEntry } from "./damage/damageBonuses";
import type {
  DamageBreakdown,
  DamageContext,
  DamageModel,
} from "./damage/damageModel";
import { pushLog, type SimLog, type SimLogEntryCat } from "./log";
import { SimRegistry } from "./listeners/registry";

import { makeId } from "../shared/lib/id";

import { buildDamageContext } from "./damage/damageEngine";
// import { dispatchAfterHit } from "./listeners/handlers";
import { createDefaultDamageModel } from "./damage/damageModel";

// import resolver methods
import "./resolvers";
import {
  DEFAULT_INFLICTION_DURATION_FRAMES,
  resolveBuffApplication,
  resolveBuffExpiration,
  resolveInflictionExpiration,
  resolveStatusApplication,
  resolveInflictionApplication,
} from "./resolvers";
import { BuffId } from "../data/buffs/BuffDef";
import {
  COMBUSTION_BUFF_ID,
  COMBUSTION_DOT_INTERVAL_FRAMES,
} from "../data/buffs/reactions/combustion";

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

const EVENT_PREFIX = "SimEvent_";
export const COMBO_AVAILABLE_WINDOW_FRAMES = 300;

function makeEventId() {
  return makeId(EVENT_PREFIX);
}

export type SimRead = {
  readonly nowInFrames: number;
  readonly env: SimEnvWithGlobalBuffs;
  getEntity(id: SimEntityId | null): SimEntity | null;
  /** Returns operator build if this entityId corresponds to an operator, else undefined. */
  getBuild(entityId: SimEntityId): OperatorBuild | undefined;
  /** Lookup an event by id (useful for provenance via SimEventBase.ref). */
  getEvent(id: string): SimEvent | undefined;
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
    breakdown?: DamageBreakdown,
    amount?: number,
  ) => void;
  /** Apply raw damage (integer) to target hp. */
  applyDamage: (targetId: SimEntityId, amount: number) => void;
  upsertBuff: (targetId: SimEntityId, buff: SimBuff) => void;
  removeBuff: (targetId: SimEntityId, buffId: BuffId) => void;
  /**
  //  * Add stacks to a buff (creating it if missing), clamping to [0, maxStacks].
  //  * Optionally emits a log entry when stacks change.
  //  */
  // // addBuffStacks: (params: {
  //   targetId: SimEntityId;
  //   buffId: BuffId;
  //   delta: number;
  //   maxStacks: number;
  //   logOnChange?: {
  //     cat: SimLogEntryCat;
  //     format: (before: number, after: number) => string;
  //   };
  // }) => void;
  addInfliction: (
    targetId: SimEntityId,
    inflictionType: InflictionType,
    stacks: number,
  ) => void;
  removeInfliction: (
    targetId: SimEntityId,
    inflictionType: InflictionType,
  ) => void;
};

type SimResolvers = {
  /** should return whether the status is triggered */
  resolveStatusApplication: (
    triggerPlugins: () => void,
    ev: Extract<SimEvent, { type: "statusApply" }>,
  ) => void;
  resolveBuffApplication: (
    ev: Extract<SimEvent, { type: "buffApply" }>,
  ) => void;
  resolveBuffExpiration: (
    ev: Extract<SimEvent, { type: "buffExpire" }>,
  ) => void;
  resolveInflictionApplication: (
    ev: Extract<SimEvent, { type: "inflictionApply" }>,
  ) => void;
  resolveInflictionExpiration: (
    ev: Extract<SimEvent, { type: "inflictionExpire" }>,
  ) => void;
};

type SimWorldInit = {
  entities: SimEntity[];
  buildByOperatorId: Record<string, OperatorBuild>;
  nowInFrames?: number;
  futureEvents?: SimEvent[];
  registry: SimRegistry;
  damageModel?: DamageModel;
  teamOperatorIds?: string[];
};

/** Larger seq happens first in the same frame */
function sortEventsInPlace(queue: SimEvent[]): void {
  queue.sort((a, b) => {
    if (a.frame !== b.frame) return a.frame - b.frame;
    return b.seq - a.seq;
  });
}

function setEmptyInflictions(e: SimEntity): void {
  const inflictions = e.inflictions as Record<InflictionType, SimInfliction>;
  for (const type of INFLICTION_TYPE_LIST) {
    inflictions[type] ??= {
      type: type,
      stacks: 0,
      lastApplyFrame: -1,
    };
  }
}

export class SimWorld {
  // Publicly readable, but mutations should go through ops.
  public readonly env: SimEnvWithGlobalBuffs;
  public nowInFrames: number;
  public readonly log: SimLog = [];
  public readonly processedEvents: SimEvent[] = [];

  private queue: SimEvent[] = [];
  private seqCounter = 1;
  private buildByOperatorId?: Record<string, OperatorBuild>;
  public readonly registry: SimRegistry;
  public readonly damageModel: DamageModel;

  private readonly eventById = new Map<string, SimEvent>();
  private currentEvent: SimEvent | null = null;
  private readonly teamOperatorOrder: string[];
  private readonly comboQueue: SimEntityId[] = [];
  private readonly blockedCastStartIds = new Set<string>();

  public readonly read: SimRead;
  public readonly ops: SimOps;
  public readonly resolvers: SimResolvers;

  constructor(init: SimWorldInit) {
    this.buildByOperatorId = init.buildByOperatorId;
    const entitiesById: Record<string, SimEntity> = {};
    for (const e of init.entities) {
      entitiesById[e.id] = e;
      setEmptyInflictions(e);
      this.ensureComboState(e);
    }
    this.env = { entitiesById, globalBuffs: {} };
    this.nowInFrames = init.nowInFrames ?? 0;
    this.teamOperatorOrder = [...(init.teamOperatorIds ?? [])];

    if (init.futureEvents && init.futureEvents.length > 0) {
      // Clone to avoid accidental external mutation.
      this.queue = [...init.futureEvents];
      for (const e of this.queue) this.eventById.set(e.id, e);
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
      getEvent: (id: string) => self.eventById.get(id),
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
      addInfliction: (targetId, inflictionType, stacks) =>
        this.addInfliction(targetId, inflictionType, stacks),
      removeInfliction: (targetId, inflictionType) =>
        this.removeInfliction(targetId, inflictionType),
    };

    this.resolvers = {
      resolveBuffApplication: ev => resolveBuffApplication(self, ev),
      resolveBuffExpiration: ev => resolveBuffExpiration(self, ev),
      resolveInflictionApplication: ev =>
        resolveInflictionApplication(self, ev),
      resolveInflictionExpiration: ev => resolveInflictionExpiration(self, ev),
      resolveStatusApplication: (triggerPlugins, ev) =>
        resolveStatusApplication(self, triggerPlugins, ev),
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
    // Auto-fill ref to the currently handled event, unless caller set it explicitly.
    if ((ev as any).ref === undefined && this.currentEvent) {
      (ev as any).ref = this.currentEvent.id;
    }
    this.queue.push(ev);
    this.eventById.set(ev.id, ev);
    sortEventsInPlace(this.queue);
  }

  private popNextEvent(): SimEvent | null {
    if (this.queue.length === 0) return null;
    return this.queue.shift() ?? null;
  }

  private advanceToFrame(frame: number): void {
    const delta = Math.max(0, frame - this.nowInFrames);
    this.nowInFrames = frame;
    if (delta <= 0) return;

    for (const ent of Object.values(this.env.entitiesById)) {
      const combo = ent.combo;
      if (!combo) continue;
      combo.cooldown = Math.max(0, combo.cooldown - delta);
      if (combo.pending && combo.availableUntilFrame < frame) {
        combo.pending = false;
        combo.availableUntilFrame = -1;
        this.removeFromComboQueue(ent.id);
      }
    }
  }

  private ensureComboState(entity: SimEntity): void {
    if (entity.type !== "operator") return;
    entity.combo ??= {
      cooldown: 0,
      pending: false,
      availableUntilFrame: -1,
      lastTriggerFrame: -1,
    } satisfies SimComboState;
  }

  private removeFromComboQueue(operatorId: SimEntityId): void {
    const idx = this.comboQueue.indexOf(operatorId);
    if (idx >= 0) this.comboQueue.splice(idx, 1);
  }

  private getTeamOrderIndex(operatorId: SimEntityId): number {
    const idx = this.teamOperatorOrder.indexOf(operatorId);
    return idx >= 0 ? idx : Number.MAX_SAFE_INTEGER;
  }

  private triggerCombo(operatorId: SimEntityId, frame: number): boolean {
    const ent = this.getEntityOrThrow(operatorId);
    if (ent.type !== "operator") return false;
    const combo = ent.combo;
    if (!combo) return false;
    if (combo.cooldown > 0) return false;

    combo.lastTriggerFrame = frame;
    combo.availableUntilFrame = frame + COMBO_AVAILABLE_WINDOW_FRAMES;

    if (combo.pending) {
      this.removeFromComboQueue(operatorId);
      this.comboQueue.unshift(operatorId);
      return true;
    }

    combo.pending = true;

    const myOrder = this.getTeamOrderIndex(operatorId);
    let insertAt = this.comboQueue.length;
    for (let i = 0; i < this.comboQueue.length; i++) {
      const queuedId = this.comboQueue[i]!;
      const queuedCombo = this.getEntityOrThrow(queuedId).combo;
      if (!queuedCombo) continue;
      if (queuedCombo.lastTriggerFrame !== frame) continue;

      const queuedOrder = this.getTeamOrderIndex(queuedId);
      if (myOrder < queuedOrder) {
        insertAt = i;
        break;
      }
    }

    this.comboQueue.splice(insertAt, 0, operatorId);
    return true;
  }

  private scheduleComboTriggerElapse(
    operatorId: SimEntityId,
    triggerEventId: string,
    frame: number,
  ): void {
    this.ops.schedule({
      id: makeEventId(),
      type: "comboTriggerElapse",
      frame: frame + COMBO_AVAILABLE_WINDOW_FRAMES,
      seq: this.ops.nextSeq(),
      sourceId: operatorId,
      ref: triggerEventId,
    });
  }

  private getComboCooldownFrames(operatorId: SimEntityId): number {
    const opDef = operatorsData[operatorId];
    const cooldownTable = opDef?.getComboCooldownSecondsByRank() ?? null;
    if (!cooldownTable || cooldownTable.length === 0) return 0;

    const build = this.read.getBuild(operatorId);
    const rank = Math.max(
      1,
      Math.floor(Number(build?.skillRanks?.comboSkill ?? 9)),
    );
    const cooldownSec = Number(
      cooldownTable[Math.min(cooldownTable.length - 1, rank - 1)] ?? 0,
    );
    const cdr = Math.max(
      0,
      Number(build?.restStat?.comboCooldownReduction ?? 0),
    );
    return Math.max(1, Math.round(cooldownSec * (1 - cdr) * 60));
  }

  private validateComboCast(ev: Extract<SimEvent, { type: "castStart" }>): {
    isLegal: boolean;
    reason?: string;
  } {
    if (ev.skillType !== "comboSkill") return { isLegal: true };

    const source = this.getEntityOrThrow(ev.sourceId);
    const combo = source.combo;
    if (!combo)
      return { isLegal: false, reason: "operator has no combo state" };
    if (combo.cooldown > 0)
      return { isLegal: false, reason: "combo is on cooldown" };
    if (!combo.pending)
      return { isLegal: false, reason: "combo was not triggered" };
    if (ev.frame > combo.availableUntilFrame) {
      combo.pending = false;
      combo.availableUntilFrame = -1;
      this.removeFromComboQueue(ev.sourceId);
      return { isLegal: false, reason: "combo trigger expired" };
    }
    if (this.comboQueue[0] !== ev.sourceId) {
      return { isLegal: false, reason: "combo is not first in pending queue" };
    }

    this.removeFromComboQueue(ev.sourceId);
    combo.pending = false;
    combo.availableUntilFrame = -1;

    const cooldownFrames = this.getComboCooldownFrames(ev.sourceId);
    combo.cooldown = cooldownFrames;

    if (cooldownFrames > 0) {
      this.ops.schedule({
        id: makeEventId(),
        type: "comboCooldownEnd",
        frame: ev.frame + cooldownFrames,
        seq: this.ops.nextSeq(),
        sourceId: ev.sourceId,
        ref: ev.id,
      });
    }

    return { isLegal: true };
  }

  // ----- Log -----
  private appendLog(
    cat: SimLogEntryCat,
    message: string,
    ctx?: DamageContext,
    breakdown?: DamageBreakdown,
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

  private addInfliction(
    entityId: SimEntityId,
    inflictionType: InflictionType,
    stacks: number = 1,
  ): void {
    const ent = this.getEntityOrThrow(entityId);
    const currentStacks = ent.inflictions[inflictionType].stacks;
    const afterStacks = Math.min(currentStacks + stacks, 4);
    ent.inflictions[inflictionType].stacks = afterStacks;
    ent.inflictions[inflictionType].lastApplyFrame = this.nowInFrames;
  }

  private removeInfliction(
    entityId: SimEntityId,
    inflictionType: InflictionType,
  ): void {
    const ent = this.getEntityOrThrow(entityId);
    ent.inflictions[inflictionType].stacks = 0;
    ent.inflictions[inflictionType].lastApplyFrame = -1;
  }

  // ----- Run Sim -----
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

      this.currentEvent = ev;

      // Block combo skill casting when invalid; we shall not do that right now.
      // if (
      //   ev.type !== "castStart" &&
      //   ev.ref &&
      //   this.blockedCastStartIds.has(ev.ref)
      // ) {
      //   continue;
      // }
      // if (ev.type === "castStart") {
      //   const validation = this.validateComboCast(ev);
      //   ev.comboValidation = validation;
      //   if (!validation.isLegal) this.blockedCastStartIds.add(ev.id);
      // }

      this.processedEvents.push(ev);

      const source = ev.sourceId
        ? (this.read.getEntity(ev.sourceId) as SimEntity)
        : null;
      const target = ev.targetId
        ? (this.read.getEntity(ev.targetId) as SimEntity)
        : null;

      switch (ev.type) {
        case "castStart": {
          const comboLegal = ev.comboValidation?.isLegal ?? true;
          const comboReason = ev.comboValidation?.reason;
          if (!comboLegal) {
            this.ops.log(
              "act",
              `"${source?.name}" failed to cast "${ev.skillType}" (${comboReason ?? "illegal combo cast"})`,
            );
            break;
          }

          this.ops.log(
            "act",
            `"${source?.name}" cast "${ev.skillType}" on "${target?.name}"`,
          );

          const spawned = this.registry.runOnCastStart({
            read: this.read,
            ev: ev,
            sourceId: ev.sourceId,
            targetId: ev.targetId,
            nextSeq: this.ops.nextSeq,
            makeEventId: () => makeId("SimEvent_"),
          });
          for (const sev of spawned) this.ops.schedule(sev);
          break;
        }

        case "castEnd": {
          this.ops.log(
            "act",
            `"${source?.name}" finished casting "${ev.skillType}" on "${target?.name}"`,
          );

          const spawned = this.registry.runOnCastEnd({
            read: this.read,
            ev: ev,
            sourceId: ev.sourceId,
            targetId: ev.targetId,
            nextSeq: this.ops.nextSeq,
            makeEventId: () => makeId("SimEvent_"),
          });
          for (const sev of spawned) this.ops.schedule(sev);
          break;
        }

        case "hit": {
          if (!target) throw new Error(`undefined target`);
          if (!source) throw new Error(`undefined source`);

          // // Skill category tag (for listeners / future gating).
          // if (ev.skillType) {
          //   hitTypes[ev.skillType] = true;
          // }

          // // Physical status burst tag (lift/knockDown/crush/breach).
          // const directStatusHitType =
          //   ev.HitType === "lift" ||
          //   ev.HitType === "knockDown" ||
          //   ev.HitType === "crush" ||
          //   ev.HitType === "breach"
          //     ? (ev.HitType as SimStatusType)
          //     : null;

          // let statusHitType: SimStatusType | null = directStatusHitType;

          // // Fallback: infer status from parent statusApply event.
          // const ref = (ev as any).ref;
          // if (typeof ref === "string") {
          //   const parent = this.read.getEvent(ref);
          //   if (parent?.type === "statusApply") {
          //     const st = (parent as any).statusType;
          //   }
          // }

          const dmgSkillMultiplier = Number(ev.dmgMultiplier ?? 1);

          const ctx = buildDamageContext({
            registry: this.registry,
            read: this.read,
            frame: ev.frame,
            damageType: ev.damageType,
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
            `"${source.name}" hit "${target.name}" for ${res.amount} damage (hp left: ${(targetAfter as any).hp})`,
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
          const triggerPlugins = () => {
            const spawned = this.registry.runOnStatusApply({
              read: this.read,
              ev,
              sourceId: source.id,
              targetId: target.id,
              nextSeq: this.ops.nextSeq,
              makeEventId: () => makeId("SimEvent_"),
            });

            for (const sev of spawned) {
              // console.log(sev);
              this.ops.schedule(sev);
            }
          };
          this.resolvers.resolveStatusApplication(triggerPlugins, ev);

          break;
        }

        case "buffApply": {
          if (!target) throw new Error(`undefined target`);
          this.resolvers.resolveBuffApplication(ev);

          const spawned = this.registry.runOnBuffApply({
            read: this.read,
            ev: ev,
            sourceId: source?.id,
            targetId: target.id,
            nextSeq: this.ops.nextSeq,
            makeEventId: () => makeId("SimEvent_"),
          });
          for (const sev of spawned) this.ops.schedule(sev);
          break;
        }

        case "buffRemove": {
          if (!ev.sourceId)
            throw new Error(`event with type buffRemove but no sourceId`);
          const owner = this.read.getEntity(ev.sourceId);
          this.ops.removeBuff(ev.sourceId, ev.buffId);
          this.ops.log(
            "buff",
            `BUFF ${ev.buffId} removed (entity=${(owner as any).name})`,
          );

          const spawned = this.registry.runOnBuffConsumed({
            read: this.read,
            ev,
            sourceId: ev.sourceId,
            nextSeq: this.ops.nextSeq,
            makeEventId: () => makeId("SimEvent_"),
          });
          for (const sev of spawned) this.ops.schedule(sev);
          break;
        }

        case "buffExpire": {
          // sourceId holds the entity who owns the buff.
          if (!ev.sourceId)
            throw new Error(`event with type buffExpire but no sourceId`);
          this.resolvers.resolveBuffExpiration(ev);
          break;
        }

        case "inflictionApply": {
          this.resolvers.resolveInflictionApplication(ev);
          break;
        }

        case "inflictionExpire": {
          if (!ev.sourceId)
            throw new Error(`event with type inflictionExpire but no sourceId`);
          this.resolvers.resolveInflictionExpiration(ev);
          break;
        }

        case "reactionTick": {
          const tickTarget = this.read.getEntity(ev.targetId ?? null);
          if (!tickTarget) break;
          if (ev.reactionBuffId !== COMBUSTION_BUFF_ID) break;

          const combustion = (tickTarget as any).buffs?.[COMBUSTION_BUFF_ID] as SimBuff | undefined;
          if (!combustion) break;

          const tickSourceId = String((combustion as any).meta?.reactionSourceId ?? ev.sourceId);
          if (!tickSourceId) break;

          const tickMultiplier = Number((combustion as any).meta?.combustionTickMultiplier ?? 0);
          if (tickMultiplier > 0) {
            this.ops.schedule({
              id: makeEventId(),
              type: "hit",
              frame: ev.frame,
              seq: this.ops.nextSeq(),
              sourceId: tickSourceId,
              targetId: ev.targetId,
              damageType: "heat",
              dmgMultiplier: tickMultiplier,
              ref: ev.id,
            } as SimEvent);
          }

          this.ops.schedule({
            id: makeEventId(),
            type: "reactionTick",
            frame: ev.frame + COMBUSTION_DOT_INTERVAL_FRAMES,
            seq: this.ops.nextSeq(),
            sourceId: tickSourceId,
            targetId: ev.targetId,
            reactionBuffId: COMBUSTION_BUFF_ID,
            ref: ev.id,
          } as SimEvent);
          break;
        }

        case "comboTriggered": {
          const sourceId = ev.sourceId;
          const sourceEnt = this.read.getEntity(sourceId);
          if (!sourceEnt)
            throw new Error(`Can not find entity id=(${sourceId})`);
          if (sourceEnt.type !== "operator") break;

          const accepted = this.triggerCombo(sourceId, ev.frame);
          if (!accepted) break;

          this.scheduleComboTriggerElapse(sourceId, ev.id, ev.frame);
          this.ops.log("act", `"${sourceEnt.name}" combo triggered`);
          break;
        }

        case "comboTriggerElapse": {
          const sourceId = ev.sourceId;
          const sourceEnt = this.read.getEntity(sourceId);
          if (!sourceEnt)
            throw new Error(`Can not find entity id=(${sourceId})`);
          if (sourceEnt.type !== "operator") break;

          const combo = sourceEnt.combo;
          if (!combo) break;
          if (!combo.pending) break;
          if (combo.availableUntilFrame > ev.frame) break;

          combo.pending = false;
          combo.availableUntilFrame = -1;
          this.removeFromComboQueue(sourceId);
          this.ops.log("act", `"${sourceEnt.name}" combo trigger elapsed`);
          break;
        }

        case "comboCooldownEnd": {
          const sourceId = ev.sourceId;
          const sourceEnt = this.read.getEntity(sourceId);
          if (!sourceEnt)
            throw new Error(`Can not find entity id=(${sourceId})`);
          if (sourceEnt.type !== "operator") break;

          const combo = sourceEnt.combo;
          if (!combo) break;
          combo.cooldown = 0;
          break;
        }

        case "spRecover": {
          // Placeholder for future SP/energy subsystem.
          this.ops.log(
            "dev",
            `spRecover placeholder: source=${ev.sourceId}, amount=${ev.amount}`,
          );
          break;
        }

        default: {
          // Exhaustiveness guard (runtime)
          const _never: never = ev as never;
          this.ops.log("dev", `WARN: unknown event ${(_never as any)?.type}`);
        }
      }

      this.currentEvent = null;
    }

    this.ops.log("sim", "SIM end");
  }
}
