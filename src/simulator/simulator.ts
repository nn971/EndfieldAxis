import type { OperatorBuild } from "../types/operator";
import operatorsData from "../data/operators";
import type {
  BuffKey,
  BuffTypeId,
  InflictionType,
  SimBuff,
  SimInfliction,
} from "../types/simulator/infliction";
import { INFLICTION_TYPE_LIST } from "../types/simulator/infliction";
import type {
  SimEntity,
  SimEntityId,
  SimEnv,
  SimEvent,
  SimComboState,
} from "../types/simulator/simulator";
import type { SimEventDraft } from "./scripts";
import type {
  DamageBreakdown,
  DamageContext,
  DamageModel,
} from "./damage/damageModel";
import {
  pushLog,
  type SimLog,
  type SimLogEntryCat,
  type SimLogMessage,
} from "./log/log";
import { logMsg } from "./log/logMessages";
import { SimRegistry } from "./listeners/registry";
import { DistOmit, makeSimEventId } from "../shared/lib/utils";

// import { dispatchAfterHit } from "./listeners/handlers";
import { createDefaultDamageModel } from "./damage/damageModel";

// import resolver methods
import "./resolvers";
import {
  resolveBuffApplication,
  resolveBuffExpiration,
  resolveCastScriptStart,
  resolveInflictionExpiration,
  resolveInflictionRemoval,
  resolveStatusApplication,
  resolveInflictionApplication,
  resolveHit,
  resolveReactionTick,
  resolveComboTriggered,
  resolveComboCooldownEnd,
  resolveSpRecover,
  resolveSpReturn,
  resolveCastEnd,
  resolveCastStart,
  validateEventWhen,
  resolveComboTriggerElapse,
  resolveStaggerExpire,
} from "./resolvers";
import { materializeDrafts } from "./scripts";

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

export const COMBO_AVAILABLE_WINDOW_FRAMES = 300;

export type SimRead = {
  readonly nowGameInFrames: number;
  readonly nowRealInFrames: number;
  readonly env: SimEnv;
  getEntity(id: SimEntityId | null): SimEntity | null;
  hasBuffType(targetId: SimEntityId, buffTypeId: BuffTypeId): boolean;
  getBuffByKey(targetId: SimEntityId, buffKey: BuffKey): SimBuff | undefined;
  /** Returns operator build if this entityId corresponds to an operator, else undefined. */
  getBuild(entityId: SimEntityId): OperatorBuild | undefined;
  /** Lookup an event by id (useful for provenance via SimEventBase.ref). */
  getEvent(id: string | null): SimEvent | undefined;
  random(): number;
};

export type SimOps = {
  /** Deterministic sequence generator for event ordering within the same frame. */
  nextSeq: () => number;
  /** Insert an event into the future event queue. */
  scheduleAtRealFrame: (ev: SimEvent) => void;
  scheduleDraftsAtRealFrame: (
    drafts: readonly SimEventDraft[],
    opts?: { defaultRef?: string },
  ) => void;
  /** Insert an event into the future event queue. */
  scheduleAtGameFrame: (
    ev: DistOmit<SimEvent, "frame">,
    gameFrame: number,
    minRealFrame?: number,
  ) => void;
  scheduleDraftsAtGameFrame: (
    drafts: readonly SimEventDraft[],
    opts?: { defaultRef?: string; minRealFrame?: number },
  ) => void;
  random: () => number;
  /** Pop the next event in chronological order. */
  popNextEvent: () => SimEvent | null;
  /** Advance simulation time to the given frame. */
  advanceToFrame: (frame: number) => void;
  /** Append a log entry (includes frame + env reference). */
  log: (
    cat: SimLogEntryCat,
    message: string | SimLogMessage,
    ctx?: DamageContext,
    breakdown?: DamageBreakdown,
    amount?: number,
  ) => void;
  /** Apply raw damage (integer) to target hp. */
  applyDamage: (targetId: SimEntityId, amount: number) => void;
  addBuff: (targetId: SimEntityId, buff: SimBuff) => void;
  removeBuff: (targetId: SimEntityId, buffKey: BuffKey) => void;
  addInfliction: (
    targetId: SimEntityId,
    inflictionType: InflictionType,
    stacks: number,
  ) => void;
  removeInfliction: (
    targetId: SimEntityId,
    inflictionType: InflictionType,
  ) => void;
  gainUltimateEnergy: (operatorId: SimEntityId, amount: number) => number;
  triggerCombo: (operatorId: SimEntityId, frame: number) => boolean;
  recoverTeamSp: (amount: number, frame: number) => number;
  returnTeamSp: (amount: number, frame: number) => number;
};

type SimResolvers = {
  resolveCastStart: (ev: Extract<SimEvent, { type: "castStart" }>) => void;
  resolveCastScriptStart: (
    ev: Extract<SimEvent, { type: "castScriptStart" }>,
  ) => void;
  resolveCastEnd: (ev: Extract<SimEvent, { type: "castEnd" }>) => void;
  resolveHit: (ev: Extract<SimEvent, { type: "hit" }>) => void;
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
  resolveInflictionRemoval: (
    ev: Extract<SimEvent, { type: "inflictionRemove" }>,
  ) => void;
  resolveReactionTick: (
    ev: Extract<SimEvent, { type: "reactionTick" }>,
  ) => void;
  resolveComboTriggered: (
    ev: Extract<SimEvent, { type: "comboTriggered" }>,
  ) => void;
  resolveComboTriggerElapse: (
    ev: Extract<SimEvent, { type: "comboTriggerElapse" }>,
  ) => void;
  resolveComboCooldownEnd: (
    ev: Extract<SimEvent, { type: "comboCooldownEnd" }>,
  ) => void;
  resolveSpRecover: (ev: Extract<SimEvent, { type: "spRecover" }>) => void;
  resolveSpReturn: (ev: Extract<SimEvent, { type: "spReturn" }>) => void;
  resolveStaggerExpire: (
    ev: Extract<SimEvent, { type: "staggerExpire" }>,
  ) => void;
};

type SimWorldInit = {
  entities: SimEntity[];
  buildByOperatorId: Record<string, OperatorBuild>;
  nowRealInFrames?: number;
  nowInFrames?: number;
  seed?: number;
  futureEvents?: SimEvent[];
  realToGame?: (realFrame: number) => number;
  gameToRealAtOrAfter?: (gameFrame: number, minRealFrame: number) => number;
  registry: SimRegistry;
  damageModel?: DamageModel;
  teamOperatorIds?: string[];
  controlledOperatorId?: string;
};

export type SimResourceSample = {
  frame: number;
  seq: number;
  teamSp: {
    real: number;
    fake: number;
    total: number;
  };
  ultimateCurrentByOperatorId: Record<string, number>;
  enemyStaggerMilli: number;
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
  public readonly env: SimEnv;
  public nowRealInFrames: number;
  public nowGameInFrames: number;
  public readonly log: SimLog = [];
  public readonly processedEvents: SimEvent[] = [];
  public readonly resourceSamples: SimResourceSample[] = [];

  private queue: SimEvent[] = [];
  private seqCounter = 1;
  private buildByOperatorId?: Record<string, OperatorBuild>;
  public readonly registry: SimRegistry;
  public readonly damageModel: DamageModel;

  private readonly eventById = new Map<string, SimEvent>();
  private currentEvent: SimEvent | null = null;
  private readonly teamOperatorOrder: string[];
  private readonly comboQueue: SimEntityId[] = [];
  public readonly controlledOperatorId?: string;

  private rngState: number;
  private readonly realToGame: (realFrame: number) => number;
  private readonly gameToRealAtOrAfter: (
    gameFrame: number,
    minRealFrame: number,
  ) => number;

  public readonly read: SimRead;
  public readonly ops: SimOps;
  private readonly resolvers: SimResolvers;

  constructor(init: SimWorldInit) {
    this.controlledOperatorId = init.controlledOperatorId;
    this.buildByOperatorId = init.buildByOperatorId;
    this.rngState = init.seed ?? 12345;
    this.realToGame = init.realToGame ?? (realFrame => realFrame);
    this.gameToRealAtOrAfter =
      init.gameToRealAtOrAfter ??
      ((gameFrame, minRealFrame) => Math.max(gameFrame, minRealFrame));
    const entitiesById: Record<string, SimEntity> = {};
    for (const e of init.entities) {
      entitiesById[e.id] = e;
      setEmptyInflictions(e);
      this.ensureComboState(e);
    }
    this.env = {
      entitiesById,
      globalBuffs: {},
      resources: {
        teamSp: {
          real: 200,
          fake: 0,
          cap: 300,
          regenPerSecond: 8,
          lastRegenGameFrame: this.realToGame(
            init.nowRealInFrames ?? init.nowInFrames ?? 0,
          ),
        },
        ultimateByOperatorId: {},
      },
    };
    this.nowRealInFrames = init.nowRealInFrames ?? init.nowInFrames ?? 0;
    this.nowGameInFrames = this.realToGame(this.nowRealInFrames);
    this.teamOperatorOrder = [...(init.teamOperatorIds ?? [])];

    for (const ent of Object.values(entitiesById)) {
      if (ent.type !== "operator") continue;
      const cost = this.getUltimateEnergyCost(ent.id);
      this.env.resources.ultimateByOperatorId[ent.id] = {
        current: cost,
        max: cost,
      };
    }

    this.captureResourceSample(this.nowRealInFrames, -1);

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
      get nowGameInFrames() {
        return self.nowGameInFrames;
      },
      get nowRealInFrames() {
        return self.nowRealInFrames;
      },
      get env() {
        return self.env;
      },
      getEntity: (id: SimEntityId) => self.getEntityOrThrow(id),
      hasBuffType: (targetId, buffTypeId) =>
        self.hasBuffType(targetId, buffTypeId),
      getBuffByKey: (targetId, buffKey) => self.getBuffByKey(targetId, buffKey),
      getBuild: (entityId: SimEntityId) => self.buildByOperatorId?.[entityId],
      getEvent: (id: string | null) =>
        id ? self.eventById.get(id) : undefined,
      random: () => self.random(),
    };

    this.ops = {
      nextSeq: () => this.nextSeq(),
      scheduleAtRealFrame: (ev: SimEvent) => this.scheduleAtRealFrame(ev),
      scheduleDraftsAtRealFrame: (drafts, opts) =>
        this.scheduleDraftsAtRealFrame(drafts, opts),
      scheduleAtGameFrame: (ev, gameFrame, minRealFrame) =>
        this.scheduleAtGameFrame(ev, gameFrame, minRealFrame),
      scheduleDraftsAtGameFrame: (drafts, opts) =>
        this.scheduleDraftsAtGameFrame(drafts, opts),
      random: () => this.random(),
      popNextEvent: () => this.popNextEvent(),
      advanceToFrame: (frame: number) => this.advanceToFrame(frame),
      log: (cat, message, ctx, breakdown, amount) =>
        this.appendLog(cat, message, ctx, breakdown, amount),
      applyDamage: (targetId, amount) => this.applyDamage(targetId, amount),
      addBuff: (targetId, buff) => this.addBuff(targetId, buff),
      removeBuff: (targetId, buffKey) => this.removeBuff(targetId, buffKey),
      // addBuffStacks: params => this.addBuffStacks(params),
      addInfliction: (targetId, inflictionType, stacks) =>
        this.addInfliction(targetId, inflictionType, stacks),
      removeInfliction: (targetId, inflictionType) =>
        this.removeInfliction(targetId, inflictionType),
      gainUltimateEnergy: (operatorId, amount) =>
        this.gainUltimateEnergy(operatorId, amount),
      triggerCombo: (operatorId, frame) => this.triggerCombo(operatorId, frame),
      recoverTeamSp: (amount, frame) => this.recoverTeamSp(amount, frame),
      returnTeamSp: (amount, frame) => this.returnTeamSp(amount, frame),
    };

    this.resolvers = {
      resolveCastStart: ev => resolveCastStart(self, ev),
      resolveCastScriptStart: ev => resolveCastScriptStart(self, ev),
      resolveCastEnd: ev => resolveCastEnd(self, ev),
      resolveHit: ev => resolveHit(self, ev),
      resolveBuffApplication: ev => resolveBuffApplication(self, ev),
      resolveBuffExpiration: ev => resolveBuffExpiration(self, ev),
      resolveInflictionApplication: ev =>
        resolveInflictionApplication(self, ev),
      resolveInflictionExpiration: ev => resolveInflictionExpiration(self, ev),
      resolveInflictionRemoval: ev => resolveInflictionRemoval(self, ev),
      resolveStatusApplication: (triggerPlugins, ev) =>
        resolveStatusApplication(self, triggerPlugins, ev),
      resolveReactionTick: ev => resolveReactionTick(self, ev),
      resolveComboTriggered: ev => resolveComboTriggered(self, ev),
      resolveComboTriggerElapse: ev => resolveComboTriggerElapse(self, ev),
      resolveComboCooldownEnd: ev => resolveComboCooldownEnd(self, ev),
      resolveSpRecover: ev => resolveSpRecover(self, ev),
      resolveSpReturn: ev => resolveSpReturn(self, ev),
      resolveStaggerExpire: ev => resolveStaggerExpire(self, ev),
    };
  }

  // ----- Read helpers -----
  private getEntityOrThrow(id: SimEntityId): SimEntity {
    const ent = this.env.entitiesById[id];
    if (!ent) throw new Error(`Unknown entity id=${id}`);
    return ent;
  }

  private hasBuffType(targetId: SimEntityId, buffTypeId: BuffTypeId): boolean {
    const buffs = this.getEntityOrThrow(targetId).buffs;
    return Object.values(buffs).some(buff => buff.id === buffTypeId);
  }

  private getBuffByKey(
    targetId: SimEntityId,
    buffKey: BuffKey,
  ): SimBuff | undefined {
    return this.getEntityOrThrow(targetId).buffs[buffKey];
  }

  private resolveBuffKeyForRemoval(
    targetId: SimEntityId,
    buffKeyOrId: BuffKey,
  ): BuffKey | null {
    const buffs = this.getEntityOrThrow(targetId).buffs;
    if (buffs[buffKeyOrId]) return buffKeyOrId;

    const matchedByType = Object.keys(buffs)
      .filter(key => buffs[key]?.id === buffKeyOrId)
      .sort((a, b) => a.localeCompare(b));

    return matchedByType[0] ?? null;
  }

  private captureResourceSample(frame: number, seq: number): void {
    const enemyStaggerMilli = Number(
      this.env.entitiesById.enemy1?.stagger?.currentMilli ?? 0,
    );

    const ultimateCurrentByOperatorId: Record<string, number> = {};
    const sortedOperatorIds = Object.keys(
      this.env.resources.ultimateByOperatorId,
    ).sort((a, b) => a.localeCompare(b));

    for (const operatorId of sortedOperatorIds) {
      const state = this.env.resources.ultimateByOperatorId[operatorId];
      ultimateCurrentByOperatorId[operatorId] = Number(state?.current ?? 0);
    }

    this.resourceSamples.push({
      frame,
      seq,
      teamSp: {
        real: Number(this.env.resources.teamSp.real),
        fake: Number(this.env.resources.teamSp.fake),
        total: Number(
          this.env.resources.teamSp.real + this.env.resources.teamSp.fake,
        ),
      },
      ultimateCurrentByOperatorId,
      enemyStaggerMilli,
    });
  }

  // ----- Queue helpers -----
  private nextSeq(): number {
    return this.seqCounter++;
  }

  private scheduleAtRealFrame(ev: SimEvent): void {
    // Auto-fill ref to the currently handled event, unless caller set it explicitly.
    if ((ev as any).ref === undefined && this.currentEvent) {
      (ev as any).ref = this.currentEvent.id;
    }
    this.queue.push(ev as SimEvent);
    this.eventById.set(ev.id, ev as SimEvent);
    sortEventsInPlace(this.queue);
  }

  private scheduleDraftsAtRealFrame(
    drafts: readonly SimEventDraft[],
    opts?: { defaultRef?: string },
  ): void {
    const events = materializeDrafts(
      drafts,
      () => this.nextSeq(),
      makeSimEventId,
      opts,
    );
    for (const ev of events) {
      this.scheduleAtRealFrame(ev);
    }
  }

  private scheduleAtGameFrame(
    ev: DistOmit<SimEvent, "frame">,
    gameFrame: number,
    minRealFrame?: number,
  ): void {
    const minReal = Math.max(
      this.nowRealInFrames,
      minRealFrame ?? this.nowRealInFrames,
    );
    const realFrame = this.gameToRealAtOrAfter(gameFrame, minReal);
    this.scheduleAtRealFrame({
      ...(ev as SimEvent),
      frame: realFrame,
    });
  }

  private scheduleDraftsAtGameFrame(
    drafts: readonly SimEventDraft[],
    opts?: { defaultRef?: string; minRealFrame?: number },
  ): void {
    const minRealFrame = Math.max(
      this.nowRealInFrames,
      opts?.minRealFrame ?? this.nowRealInFrames,
    );
    const realDrafts = drafts.map(draft => ({
      ...draft,
      frame: this.gameToRealAtOrAfter(draft.frame, minRealFrame),
    }));
    this.scheduleDraftsAtRealFrame(realDrafts, {
      defaultRef: opts?.defaultRef,
    });
  }

  private popNextEvent(): SimEvent | null {
    if (this.queue.length === 0) return null;
    return this.queue.shift() ?? null;
  }

  private random(): number {
    this.rngState += 0x6d2b79f5;
    let t = this.rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  private advanceToFrame(frame: number): void {
    const deltaRealFrames = Math.max(0, frame - this.nowRealInFrames);
    this.nowRealInFrames = frame;
    this.nowGameInFrames = this.realToGame(frame);
    if (deltaRealFrames <= 0) return;

    for (const ent of Object.values(this.env.entitiesById)) {
      const combo = ent.combo;
      if (!combo) continue;
      combo.cooldown = Math.max(0, combo.cooldown - deltaRealFrames);
      if (combo.pending && combo.availableUntilFrame < this.nowGameInFrames) {
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

  /** TODO maybe there is an approach better than make this public */
  public removeFromComboQueue(operatorId: SimEntityId): void {
    const idx = this.comboQueue.indexOf(operatorId);
    if (idx >= 0) this.comboQueue.splice(idx, 1);
  }

  private getTeamOrderIndex(operatorId: SimEntityId): number {
    const idx = this.teamOperatorOrder.indexOf(operatorId);
    return idx >= 0 ? idx : Number.MAX_SAFE_INTEGER;
  }

  private getUltimateEnergyCost(operatorId: SimEntityId): number {
    const opDef = operatorsData[operatorId];
    const build = this.buildByOperatorId?.[operatorId];
    const potentialRank = Number(build?.potentialRank ?? 0);
    const raw = Number(opDef?.getUltimateEnergyCost?.(potentialRank) ?? 100);
    return Number.isFinite(raw) ? Math.max(1, raw) : 100;
  }

  private syncTeamSpRegen(frame: number): void {
    const teamSp = this.env.resources.teamSp;
    const deltaFrames = Math.max(0, frame - teamSp.lastRegenGameFrame);
    if (deltaFrames <= 0) return;

    const regen = (deltaFrames / 60) * teamSp.regenPerSecond;
    this.gainRealTeamSp(regen);
    teamSp.lastRegenGameFrame = frame;
  }

  private getTeamSpTotal(): number {
    const teamSp = this.env.resources.teamSp;
    return teamSp.real + teamSp.fake;
  }

  private gainRealTeamSp(amount: number): number {
    const teamSp = this.env.resources.teamSp;
    const gain = Math.max(0, Number(amount) || 0);
    if (gain <= 0) return 0;

    let remaining = gain;
    let actual = 0;

    const totalBefore = this.getTeamSpTotal();
    const room = Math.max(0, teamSp.cap - totalBefore);
    if (room > 0) {
      const add = Math.min(room, remaining);
      teamSp.real += add;
      actual += add;
      remaining -= add;
    }

    if (
      remaining > 0 &&
      this.getTeamSpTotal() >= teamSp.cap &&
      teamSp.fake > 0
    ) {
      const convert = Math.min(teamSp.fake, remaining);
      teamSp.fake -= convert;
      teamSp.real += convert;
      actual += convert;
    }

    return actual;
  }

  private gainFakeTeamSp(amount: number): number {
    const teamSp = this.env.resources.teamSp;
    const gain = Math.max(0, Number(amount) || 0);
    if (gain <= 0) return 0;

    const totalBefore = this.getTeamSpTotal();
    const room = Math.max(0, teamSp.cap - totalBefore);
    const add = Math.min(room, gain);
    teamSp.fake += add;
    return add;
  }

  /** TODO maybe there is an approach better than make this public */
  public spendTeamSp(
    amount: number,
    frame: number,
  ): { spent: number; realSpent: number; fakeSpent: number; isLegal: boolean } {
    // console.log(`spent ${amount} at ${frame}`);
    this.syncTeamSpRegen(this.realToGame(frame));
    const teamSp = this.env.resources.teamSp;
    const spend = Math.max(0, Number(amount) || 0);
    const before = this.getTeamSpTotal();
    const isLegal = before >= spend;
    let remaining = Math.min(before, spend);

    const fakeSpent = Math.min(teamSp.fake, remaining);
    teamSp.fake -= fakeSpent;
    remaining -= fakeSpent;

    const realSpent = Math.min(teamSp.real, remaining);
    teamSp.real -= realSpent;

    return {
      spent: fakeSpent + realSpent,
      realSpent,
      fakeSpent,
      isLegal,
    };
  }

  /** TODO maybe there is an approach better than make this public */
  public spendUltimateEnergy(operatorId: SimEntityId): {
    spent: number;
    isLegal: boolean;
    cost: number;
  } {
    const state = this.env.resources.ultimateByOperatorId[operatorId];
    const cost = this.getUltimateEnergyCost(operatorId);
    if (!state) return { spent: 0, isLegal: false, cost };

    const before = state.current;
    const isLegal = before >= cost;
    const spent = Math.min(before, cost);
    state.current = Math.max(0, before - cost);
    return { spent, isLegal, cost };
  }

  /** TODO maybe there is an approach better than make this public */
  public findLastHitEventIdForCast(castStartId: string): string | null {
    let best: Extract<SimEvent, { type: "hit" }> | null = null;
    for (const ev of this.eventById.values()) {
      if (ev.type !== "hit") continue;
      if (ev.ref !== castStartId) continue;
      if (!best) {
        best = ev;
        continue;
      }
      if (ev.frame > best.frame) {
        best = ev;
        continue;
      }
      if (ev.frame === best.frame && ev.seq < best.seq) {
        best = ev;
      }
    }
    return best?.id ?? null;
  }

  /** TODO maybe there is an approach better than make this public */
  public readonly normalSkillCastById = new Map<
    string,
    {
      spent: number;
      realSpent: number;
      fakeSpent: number;
    }
  >();

  // ----- Log -----
  private appendLog(
    cat: SimLogEntryCat,
    message: string | SimLogMessage,
    ctx?: DamageContext,
    breakdown?: DamageBreakdown,
    amount?: number,
  ): void {
    pushLog(
      this.log,
      cat,
      this.read.nowRealInFrames,
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

  private addBuff(targetId: SimEntityId, buff: SimBuff): void {
    const ent = this.getEntityOrThrow(targetId);
    (ent as any).buffs ??= {};
    (ent as any).buffs[buff.key] = buff;
  }

  private removeBuff(targetId: SimEntityId, buffKey: BuffKey): void {
    const ent = this.getEntityOrThrow(targetId);
    if (!(ent as any).buffs) return;

    const keyToRemove = this.resolveBuffKeyForRemoval(targetId, buffKey);
    if (!keyToRemove) return;

    delete (ent as any).buffs[keyToRemove];
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
    ent.inflictions[inflictionType].lastApplyFrame = this.nowGameInFrames;
  }

  private removeInfliction(
    entityId: SimEntityId,
    inflictionType: InflictionType,
  ): void {
    const ent = this.getEntityOrThrow(entityId);
    ent.inflictions[inflictionType].stacks = 0;
    ent.inflictions[inflictionType].lastApplyFrame = -1;
  }

  private triggerCombo(operatorId: SimEntityId, realFrame: number): boolean {
    /** returns whether combo is triggered successfully */
    const ent = this.getEntityOrThrow(operatorId);
    if (ent.type !== "operator") return false;
    const combo = ent.combo;
    if (!combo) return false;
    if (combo.cooldown > 0) return false;

    combo.lastTriggerFrame = realFrame;
    combo.availableUntilFrame = realFrame + COMBO_AVAILABLE_WINDOW_FRAMES;

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
      if (queuedCombo.lastTriggerFrame !== realFrame) continue;

      const queuedOrder = this.getTeamOrderIndex(queuedId);
      if (myOrder < queuedOrder) {
        insertAt = i;
        break;
      }
    }

    this.comboQueue.splice(insertAt, 0, operatorId);
    return true;
  }

  private gainUltimateEnergy(operatorId: SimEntityId, amount: number): number {
    const state = this.env.resources.ultimateByOperatorId[operatorId];
    if (!state) return 0;
    const baseGain = Math.max(0, Number(amount) || 0);
    const build = this.buildByOperatorId?.[operatorId];
    const rawEfficiency = Number(build?.restStat?.ultimateGainEfficiency ?? 0);
    const efficiency = Math.max(
      0,
      Number.isFinite(rawEfficiency) ? rawEfficiency : 0,
    );
    const gain = baseGain * (1 + efficiency);
    const before = state.current;
    state.current = Math.min(state.max, before + gain);
    return state.current - before;
  }

  private returnTeamSp(amount: number, frame: number): number {
    this.syncTeamSpRegen(this.realToGame(frame));
    return this.gainFakeTeamSp(amount);
  }

  private recoverTeamSp(amount: number, frame: number): number {
    this.syncTeamSpRegen(this.realToGame(frame));
    return this.gainRealTeamSp(amount);
  }

  // ----- Run Sim -----
  public runSim(maxSteps: number = 10000) {
    // const session = { world, registry, damageModel };

    this.ops.log("sim", logMsg.simStart());

    let steps = 0;
    let lastSampledGameFrame = this.nowGameInFrames;

    while (true) {
      if (steps++ > maxSteps) {
        this.ops.log("sim", logMsg.simAbortMaxSteps(maxSteps));
        break;
      }

      const ev = this.ops.popNextEvent();
      if (!ev) break;

      const gameFrameBeforeAdvance = this.realToGame(ev.frame);

      if (
        gameFrameBeforeAdvance === lastSampledGameFrame &&
        ev.frame > this.nowRealInFrames
      ) {
        const freezeStartReal = this.nowRealInFrames;
        const freezeEndReal = ev.frame;

        this.ops.advanceToFrame(freezeStartReal);
        this.syncTeamSpRegen(this.nowGameInFrames);
        this.captureResourceSample(freezeStartReal, this.seqCounter++);

        this.ops.advanceToFrame(freezeEndReal);
        this.captureResourceSample(freezeEndReal, this.seqCounter++);
      } else {
        this.ops.advanceToFrame(ev.frame);
        this.syncTeamSpRegen(this.nowGameInFrames);
        this.captureResourceSample(ev.frame, ev.seq + 0.5);
      }

      lastSampledGameFrame = this.nowGameInFrames;

      // console.log(ev.frame, ev.type);

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

      const whenValidation = validateEventWhen(this.read, ev);
      if (!whenValidation.isValid) {
        this.ops.log(
          "dev",
          logMsg.devDismissEventWhenMismatch({
            eventType: ev.type,
            eventId: ev.id,
            reason: whenValidation.reason ?? "unknown reason",
          }),
        );
        continue;
      }

      switch (ev.type) {
        case "castStart": {
          this.resolvers.resolveCastStart(ev);
          break;
        }

        case "castScriptStart": {
          this.resolvers.resolveCastScriptStart(ev);
          break;
        }

        case "castEnd": {
          this.resolvers.resolveCastEnd(ev);
          break;
        }

        case "hit": {
          this.resolvers.resolveHit(ev);
          break;
        }

        case "statusApply": {
          const source = ev.sourceId
            ? (this.read.getEntity(ev.sourceId) as SimEntity)
            : null;
          const target = ev.targetId
            ? (this.read.getEntity(ev.targetId) as SimEntity)
            : null;
          if (!target) throw new Error(`undefined target`);
          if (!source) throw new Error(`undefined source`);
          const triggerPlugins = () => {
            const spawned = this.registry.runOnStatusApply({
              read: this.read,
              ops: this.ops,
              ev,
              sourceId: source.id,
              targetId: target.id,
            });
            this.ops.scheduleDraftsAtGameFrame(spawned, {
              minRealFrame: this.nowRealInFrames,
            });
          };
          this.resolvers.resolveStatusApplication(triggerPlugins, ev);

          break;
        }

        case "buffApply": {
          const source = ev.sourceId
            ? (this.read.getEntity(ev.sourceId) as SimEntity)
            : null;
          const owner = ev.targetId
            ? (this.read.getEntity(ev.targetId) as SimEntity)
            : null;
          if (!owner) throw new Error(`undefined target`);
          this.resolvers.resolveBuffApplication(ev);

          const spawned = this.registry.runOnBuffApply({
            read: this.read,
            ops: this.ops,
            ev: ev,
            sourceId: source?.id,
            targetId: owner.id,
          });
          this.ops.scheduleDraftsAtGameFrame(spawned, {
            minRealFrame: this.nowRealInFrames,
          });
          break;
        }

        case "buffRemove": {
          const owner = this.read.getEntity(ev.targetId);
          this.ops.removeBuff(ev.targetId, ev.buffKey ?? ev.buffId);
          this.ops.log(
            "buff",
            logMsg.buffRemoved({
              buffId: ev.buffId,
              targetId: ev.targetId,
              targetName: (owner as any)?.name,
            }),
          );

          const spawned = this.registry.runOnBuffConsumed({
            read: this.read,
            ops: this.ops,
            ev,
            sourceId: ev.targetId,
          });
          this.ops.scheduleDraftsAtGameFrame(spawned, {
            minRealFrame: this.nowRealInFrames,
          });
          break;
        }

        case "buffExpire": {
          this.resolvers.resolveBuffExpiration(ev);
          break;
        }

        case "inflictionApply": {
          this.resolvers.resolveInflictionApplication(ev);
          break;
        }

        case "inflictionExpire": {
          if (!ev.targetId)
            throw new Error(`event with type inflictionExpire but no sourceId`);
          this.resolvers.resolveInflictionExpiration(ev);
          break;
        }

        case "inflictionRemove": {
          this.resolvers.resolveInflictionRemoval(ev);
          break;
        }

        case "reactionTick": {
          this.resolvers.resolveReactionTick(ev);
          break;
        }

        case "comboTriggered": {
          this.resolvers.resolveComboTriggered(ev);
          break;
        }

        case "comboTriggerElapse": {
          this.resolvers.resolveComboTriggerElapse(ev);
          break;
        }

        case "comboCooldownEnd": {
          this.resolvers.resolveComboCooldownEnd(ev);
          break;
        }

        case "spReturn": {
          this.resolvers.resolveSpReturn(ev);
          const drafts = this.registry.runOnSpReturn({
            read: this.read,
            ops: this.ops,
            ev,
            sourceId: ev.sourceId,
          });
          this.ops.scheduleDraftsAtGameFrame(drafts, {
            minRealFrame: this.nowRealInFrames,
          });
          break;
        }

        case "spRecover": {
          this.resolvers.resolveSpRecover(ev);
          const drafts = this.registry.runOnSpRecover({
            read: this.read,
            ops: this.ops,
            ev,
            sourceId: ev.sourceId,
          });
          this.ops.scheduleDraftsAtGameFrame(drafts, {
            minRealFrame: this.nowRealInFrames,
          });
          break;
        }

        case "staggerExpire": {
          this.resolvers.resolveStaggerExpire(ev);
          break;
        }

        default: {
          // Exhaustiveness guard (runtime)
          const _never: never = ev as never;
          this.ops.log(
            "dev",
            logMsg.devWarnUnknownEvent((_never as any)?.type),
          );
        }
      }

      this.currentEvent = null;
      this.captureResourceSample(ev.frame, ev.seq);
    }

    this.ops.log("sim", logMsg.simEnd());
  }
}
