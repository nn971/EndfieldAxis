import type { SimBuff } from "../../types/simulator/infliction";
import type { SimEntityId, SimEvent } from "../../types/simulator/simulator";
import type { SimEventDraft, SimScript } from "../scripts";
import type { DamageBonusCollector } from "../damage/damageBonuses";
import type { SimOps, SimRead } from "../simulator";
import operatorsData from "../../data/operators";
import buffsData from "../../data/buffs";
import weaponsData from "../../data/weapons";
import gearsData from "../../data/gears";
import { BuffId } from "../../data/buffs/BuffDef";
import { DamageType } from "../../types/operator";
import {
  sortPluginsByGameOrder,
  type PluginOrderingBucket,
} from "./pluginOrder";
import type { SimEventWhen } from "../../types/simulator/when";
import {
  runSimScript,
  type SimScriptContext,
  type SimScriptOps,
} from "../scripts";
import type { SkillType } from "../../data/operators/OperatorDef";

/**
 * Listener/registry layer:
 * - The simulator core only emits events and asks the registry to run listeners.
 * - Buffs/operators define listeners elsewhere ("content"), and are auto-registered.
 */

export type DamageBonusListenerContext = {
  read: SimRead;
  /** The event that caused this damage. For status procs, this can be undefined. */
  ev?: SimEvent;
  type: DamageType;

  sourceId: SimEntityId;
  targetId: SimEntityId;
  collector: DamageBonusCollector;
};

export type GlobalDamageBonusListener = (
  ctx: DamageBonusListenerContext,
) => void;

export type BuffDamageBonusListenerContext = DamageBonusListenerContext & {
  role: "source" | "target";
  buff: Readonly<SimBuff>;
};
export type BuffDamageBonusListener = (
  ctx: BuffDamageBonusListenerContext,
) => void;

export type AfterHitTriggerContext = {
  read: SimRead;
  ops: SimOps;
  ev: Extract<SimEvent, { type: "hit" }>;
  sourceId: SimEntityId;
  targetId: SimEntityId;
};
export type AfterHitTrigger = SimScript;

export type OnCastTriggerContext = {
  read: SimRead;
  ops: SimOps;
  ev: Extract<SimEvent, { type: "castStart" | "castEnd" }>;
  sourceId: SimEntityId;
  targetId?: SimEntityId;
};
export type OnCastTrigger = SimScript;

export type OnStatusApplyTriggerContext = {
  read: SimRead;
  ops: SimOps;
  ev: Extract<SimEvent, { type: "statusApply" }>;
  sourceId: SimEntityId;
  targetId: SimEntityId;
};
export type OnStatusApplyTrigger = SimScript;

export type OnBuffApplyTriggerContext = {
  read: SimRead;
  ops: SimOps;
  ev: Extract<SimEvent, { type: "buffApply" }>;
  sourceId?: SimEntityId;
  targetId: SimEntityId;
};
export type OnBuffApplyTrigger = SimScript;

export type OnBuffConsumedTriggerContext = {
  read: SimRead;
  ops: SimOps;
  ev: Extract<SimEvent, { type: "buffRemove" }>;
  sourceId?: SimEntityId;
  targetId: SimEntityId;
};
export type OnBuffConsumedTrigger = SimScript;

export type OnInflictionApplyTriggerContext = {
  read: SimRead;
  ops: SimOps;
  ev: Extract<SimEvent, { type: "inflictionApply" }>;
  sourceId: SimEntityId;
  targetId: SimEntityId;
};
export type OnInflictionApplyTrigger = SimScript;

export type OnInflictionConsumedTriggerContext = {
  read: SimRead;
  ops: SimOps;
  ev: Extract<SimEvent, { type: "inflictionExpire" }>;
  sourceId: SimEntityId;
};
export type OnInflictionConsumedTrigger = SimScript;

export type OnSpRecoverTriggerContext = {
  read: SimRead;
  ops: SimOps;
  ev: Extract<SimEvent, { type: "spRecover" }>;
  sourceId: SimEntityId;
};
export type OnSpRecoverTrigger = SimScript;

export type OnSpReturnTriggerContext = {
  read: SimRead;
  ops: SimOps;
  ev: Extract<SimEvent, { type: "spReturn" }>;
  sourceId: SimEntityId;
};
export type OnSpReturnTrigger = SimScript;

type ListenerEntry<TFn> = {
  id: string;
  priority: number; // currently not in use. all priority are 0
  fn: TFn;
  when?: TriggerWhen;
  cooldown?: number;
  match?: (ctx: TriggerContext) => boolean;
};

type TriggerContext =
  | AfterHitTriggerContext
  | OnCastTriggerContext
  | OnStatusApplyTriggerContext
  | OnBuffApplyTriggerContext
  | OnBuffConsumedTriggerContext
  | OnInflictionApplyTriggerContext
  | OnInflictionConsumedTriggerContext
  | OnSpRecoverTriggerContext
  | OnSpReturnTriggerContext;

type TriggerWhen = SimEventWhen;

type RegisterTriggerParams<TCtx extends TriggerContext> = {
  id: string;
  fn: SimScript;
  priority?: number;
  cooldown?: number;
  when?: TriggerWhen;
  match?: (ctx: TCtx) => boolean;
};

function normalizeCooldown(cooldown: number | undefined): number | undefined {
  const value = Math.floor(Number(cooldown));
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return value;
}

function normalizeRank(value: unknown): number {
  const rank = Number(value);
  if (!Number.isFinite(rank)) return 0;
  return Math.max(0, Math.round(rank));
}

function makeScriptOps(ops: SimOps): SimScriptOps {
  return {
    gainUltimateEnergy: (operatorId, amount) =>
      ops.gainUltimateEnergy(operatorId, amount),
  };
}

function sortEntries<TFn>(
  arr: ListenerEntry<TFn>[],
  bucket: PluginOrderingBucket,
): void {
  sortPluginsByGameOrder({
    entries: arr,
    bucket,
  });
}

export class SimRegistry {
  private readonly lastTriggeredFrameByKey = new Map<string, number>();

  private globalDamageBonus: ListenerEntry<GlobalDamageBonusListener>[] = [];
  private buffDamageBonus: Partial<
    Record<BuffId, ListenerEntry<BuffDamageBonusListener>[]>
  > = {};

  private afterHit: ListenerEntry<AfterHitTrigger>[] = [];
  private onCastStart: ListenerEntry<OnCastTrigger>[] = [];
  private onCastEnd: ListenerEntry<OnCastTrigger>[] = [];
  private onStatusApply: ListenerEntry<OnStatusApplyTrigger>[] = [];
  private onBuffApply: ListenerEntry<OnBuffApplyTrigger>[] = [];
  private onBuffConsumed: ListenerEntry<OnBuffConsumedTrigger>[] = [];
  private onInflictionApply: ListenerEntry<OnInflictionApplyTrigger>[] = [];
  private onInflictionConsumed: ListenerEntry<OnInflictionConsumedTrigger>[] =
    [];
  private onSpRecover: ListenerEntry<OnSpRecoverTrigger>[] = [];
  private onSpReturn: ListenerEntry<OnSpReturnTrigger>[] = [];

  registerGlobalDamageBonus(params: {
    id: string;
    fn: GlobalDamageBonusListener;
    priority?: number;
  }): void {
    this.globalDamageBonus.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
    });
  }

  registerBuffDamageBonus(params: {
    id: string;
    fn: BuffDamageBonusListener;
    priority?: number;
  }): void {
    const buffId = params.id as BuffId;
    let list = this.buffDamageBonus[buffId];
    if (!list) {
      list = [];
      this.buffDamageBonus[buffId] = list;
    }
    list.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
    });
  }

  registerAfterHit(
    params: RegisterTriggerParams<AfterHitTriggerContext>,
  ): void {
    this.afterHit.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
      cooldown: normalizeCooldown(params.cooldown),
      when: params.when,
      match: params.match as ListenerEntry<AfterHitTrigger>["match"],
    });
  }

  registerOnCastStart(
    params: RegisterTriggerParams<OnCastTriggerContext>,
  ): void {
    this.onCastStart.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
      cooldown: normalizeCooldown(params.cooldown),
      when: params.when,
      match: params.match as ListenerEntry<OnCastTrigger>["match"],
    });
  }

  registerOnCastEnd(params: RegisterTriggerParams<OnCastTriggerContext>): void {
    this.onCastEnd.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
      cooldown: normalizeCooldown(params.cooldown),
      when: params.when,
      match: params.match as ListenerEntry<OnCastTrigger>["match"],
    });
  }

  registerOnStatusApply(
    params: RegisterTriggerParams<OnStatusApplyTriggerContext>,
  ): void {
    this.onStatusApply.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
      cooldown: normalizeCooldown(params.cooldown),
      when: params.when,
      match: params.match as ListenerEntry<OnStatusApplyTrigger>["match"],
    });
  }

  registerOnBuffApply(
    params: RegisterTriggerParams<OnBuffApplyTriggerContext>,
  ): void {
    this.onBuffApply.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
      cooldown: normalizeCooldown(params.cooldown),
      when: params.when,
      match: params.match as ListenerEntry<OnBuffApplyTrigger>["match"],
    });
  }

  registerOnBuffConsumed(
    params: RegisterTriggerParams<OnBuffConsumedTriggerContext>,
  ): void {
    this.onBuffConsumed.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
      cooldown: normalizeCooldown(params.cooldown),
      when: params.when,
      match: params.match as ListenerEntry<OnBuffConsumedTrigger>["match"],
    });
  }

  registerOnInflictionApply(
    params: RegisterTriggerParams<OnInflictionApplyTriggerContext>,
  ): void {
    this.onInflictionApply.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
      cooldown: normalizeCooldown(params.cooldown),
      when: params.when,
      match: params.match as ListenerEntry<OnInflictionApplyTrigger>["match"],
    });
  }

  registerOnInflictionConsumed(
    params: RegisterTriggerParams<OnInflictionConsumedTriggerContext>,
  ): void {
    this.onInflictionConsumed.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
      cooldown: normalizeCooldown(params.cooldown),
      when: params.when,
      match:
        params.match as ListenerEntry<OnInflictionConsumedTrigger>["match"],
    });
  }

  registerOnSpRecover(
    params: RegisterTriggerParams<OnSpRecoverTriggerContext>,
  ): void {
    this.onSpRecover.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
      cooldown: normalizeCooldown(params.cooldown),
      when: params.when,
      match: params.match as ListenerEntry<OnSpRecoverTrigger>["match"],
    });
  }

  registerOnSpReturn(
    params: RegisterTriggerParams<OnSpReturnTriggerContext>,
  ): void {
    this.onSpReturn.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
      cooldown: normalizeCooldown(params.cooldown),
      when: params.when,
      match: params.match as ListenerEntry<OnSpReturnTrigger>["match"],
    });
  }

  finalize(): void {
    sortEntries(this.globalDamageBonus, "globalDamageBonus");
    sortEntries(this.afterHit, "afterHit");
    sortEntries(this.onCastStart, "onCastStart");
    sortEntries(this.onCastEnd, "onCastEnd");
    sortEntries(this.onStatusApply, "onStatusApply");
    sortEntries(this.onBuffApply, "onBuffApply");
    sortEntries(this.onBuffConsumed, "onBuffConsumed");
    sortEntries(this.onInflictionApply, "onInflictionApply");
    sortEntries(this.onInflictionConsumed, "onInflictionConsumed");
    sortEntries(this.onSpRecover, "onSpRecover");
    sortEntries(this.onSpReturn, "onSpReturn");
    for (const key of Object.keys(this.buffDamageBonus)) {
      sortEntries(this.buffDamageBonus[key as BuffId]!, "buffDamageBonus");
    }
  }

  runGlobalDamageBonus(ctx: DamageBonusListenerContext): void {
    for (const e of this.globalDamageBonus) e.fn(ctx);
  }

  runBuffDamageBonus(ctx: BuffDamageBonusListenerContext): void {
    const list = this.buffDamageBonus[ctx.buff.id];
    if (!list || list.length === 0) {
      // console.warn(
      //   `No damage bonus listeners registered for buffId=${ctx.buff.id}`,
      // );
      return;
    }
    for (const e of list) e.fn(ctx);
  }

  runAfterHit(ctx: AfterHitTriggerContext): SimEventDraft[] {
    return this.runTriggers(this.afterHit, ctx, "afterHit");
  }

  runOnCastStart(ctx: OnCastTriggerContext): SimEventDraft[] {
    return this.runTriggers(this.onCastStart, ctx, "onCastStart");
  }

  runOnCastEnd(ctx: OnCastTriggerContext): SimEventDraft[] {
    return this.runTriggers(this.onCastEnd, ctx, "onCastEnd");
  }

  runOnStatusApply(ctx: OnStatusApplyTriggerContext): SimEventDraft[] {
    return this.runTriggers(this.onStatusApply, ctx, "onStatusApply");
  }

  runOnBuffApply(ctx: OnBuffApplyTriggerContext): SimEventDraft[] {
    return this.runTriggers(this.onBuffApply, ctx, "onBuffApply");
  }

  runOnBuffConsumed(ctx: OnBuffConsumedTriggerContext): SimEventDraft[] {
    return this.runTriggers(this.onBuffConsumed, ctx, "onBuffConsumed");
  }

  runOnInflictionApply(ctx: OnInflictionApplyTriggerContext): SimEventDraft[] {
    return this.runTriggers(this.onInflictionApply, ctx, "onInflictionApply");
  }

  runOnInflictionConsumed(
    ctx: OnInflictionConsumedTriggerContext,
  ): SimEventDraft[] {
    return this.runTriggers(
      this.onInflictionConsumed,
      ctx,
      "onInflictionConsumed",
    );
  }

  runOnSpRecover(ctx: OnSpRecoverTriggerContext): SimEventDraft[] {
    return this.runTriggers(this.onSpRecover, ctx, "onSpRecover");
  }

  runOnSpReturn(ctx: OnSpReturnTriggerContext): SimEventDraft[] {
    return this.runTriggers(this.onSpReturn, ctx, "onSpReturn");
  }

  private runTriggers<TCtx extends TriggerContext>(
    entries: ListenerEntry<SimScript>[],
    ctx: TCtx,
    bucket: PluginOrderingBucket,
  ): SimEventDraft[] {
    const out: SimEventDraft[] = [];
    for (const e of entries) {
      if (!this.matchesListener(e, ctx)) {
        continue;
      }

      if (this.isCooldownBlocked(e, ctx, bucket)) {
        continue;
      }

      const drafts = runSimScript({
        script: e.fn,
        baseFrame: ctx.read.nowGameInFrames,
        ctx: this.buildScriptContext(ctx),
      });
      if (drafts.length > 0) {
        this.markCooldownTriggered(e, ctx, bucket);
        out.push(...drafts);
      }
    }
    return out;
  }

  private isCooldownBlocked<TCtx extends TriggerContext>(
    entry: ListenerEntry<SimScript>,
    ctx: TCtx,
    bucket: PluginOrderingBucket,
  ): boolean {
    if (!entry.cooldown) return false;

    const stateKey = this.getCooldownStateKey(entry, ctx, bucket);
    const lastTriggeredFrame = this.lastTriggeredFrameByKey.get(stateKey);
    if (lastTriggeredFrame === undefined) return false;
    return ctx.read.nowRealInFrames - lastTriggeredFrame < entry.cooldown;
  }

  private markCooldownTriggered<TCtx extends TriggerContext>(
    entry: ListenerEntry<SimScript>,
    ctx: TCtx,
    bucket: PluginOrderingBucket,
  ): void {
    if (!entry.cooldown) return;
    const stateKey = this.getCooldownStateKey(entry, ctx, bucket);
    this.lastTriggeredFrameByKey.set(stateKey, ctx.read.nowRealInFrames);
  }

  private getCooldownStateKey<TCtx extends TriggerContext>(
    entry: ListenerEntry<SimScript>,
    ctx: TCtx,
    bucket: PluginOrderingBucket,
  ): string {
    const scope = this.getCooldownScope(ctx) ?? "global";
    return JSON.stringify([bucket, entry.id, scope]);
  }

  private getCooldownScope(ctx: TriggerContext): string | null {
    if ("sourceId" in ctx && ctx.sourceId) {
      return `source:${ctx.sourceId}`;
    }
    if ("targetId" in ctx && ctx.targetId) {
      return `target:${ctx.targetId}`;
    }
    if ("sourceId" in ctx.ev && ctx.ev.sourceId) {
      return `source:${ctx.ev.sourceId}`;
    }
    if ("targetId" in ctx.ev && ctx.ev.targetId) {
      return `target:${ctx.ev.targetId}`;
    }
    return null;
  }

  private buildScriptContext(
    ctx: TriggerContext,
  ): Omit<SimScriptContext, "emit" | "byRank"> {
    const sourceId = "sourceId" in ctx ? ctx.sourceId : ctx.ev.targetId;
    const targetId =
      "targetId" in ctx && ctx.targetId ? ctx.targetId : sourceId;
    const skillType = this.getSkillTypeFromEvent(ctx.ev);
    const sourceBuild = sourceId ? ctx.read.getBuild(sourceId) : undefined;
    const defaultHitStaggerOnHit =
      ctx.ev.type === "castStart" && sourceId
        ? Number(operatorsData[sourceId]?.skills[skillType]?.staggerOnHit ?? 0)
        : 0;

    return {
      read: ctx.read,
      ops: makeScriptOps(ctx.ops),
      ev: ctx.ev,
      sourceId,
      targetId,
      startFrame: ctx.read.nowRealInFrames,
      startRealFrame: ctx.read.nowRealInFrames,
      skillType,
      defaultHitStaggerOnHit,
      sourceBuild,
      sourcePotentialRank: normalizeRank(sourceBuild?.potentialRank),
      sourceTalent1Rank: normalizeRank(sourceBuild?.talentRanks?.talent1),
      sourceTalent2Rank: normalizeRank(sourceBuild?.talentRanks?.talent2),
    };
  }

  private getSkillTypeFromEvent(ev: SimEvent): SkillType {
    if (ev.type === "castStart" || ev.type === "castEnd") {
      return ev.skillType;
    }
    return "normalSkill";
  }

  private matchesListener<TCtx extends TriggerContext>(
    entry: ListenerEntry<SimScript>,
    ctx: TCtx,
  ): boolean {
    if (entry.when && !this.matchesWhen(ctx, entry.when)) return false;
    if (entry.match && !entry.match(ctx)) return false;
    return true;
  }

  private matchesWhen(ctx: TriggerContext, when: TriggerWhen): boolean {
    const sourceId = "sourceId" in ctx ? ctx.sourceId : undefined;

    if (when.sourceOperatorId && sourceId !== when.sourceOperatorId) {
      return false;
    }

    if (when.sourceWeaponId) {
      if (!sourceId) return false;
      const sourceBuild = ctx.read.getBuild(sourceId);
      if (sourceBuild?.weapon.id !== when.sourceWeaponId) return false;
    }

    if (when.buffId) {
      if (!("ev" in ctx && "buffId" in ctx.ev)) return false;
      if (ctx.ev.buffId !== when.buffId) return false;
    }

    if (when.buffKey) {
      if (!("ev" in ctx && "buffId" in ctx.ev)) return false;
      const eventBuffKey = ctx.ev.buffKey ?? ctx.ev.buffId;
      if (eventBuffKey !== when.buffKey) return false;
    }

    if (when.ownerHasBuffId) {
      const targetId = this.getOwnerIdForContext(ctx);
      if (!targetId) return false;
      if (!ctx.read.hasBuffType(targetId, when.ownerHasBuffId)) return false;
    }

    if (when.ownerHasBuffKey) {
      const targetId = this.getOwnerIdForContext(ctx);
      if (!targetId) return false;
      if (!ctx.read.getBuffByKey(targetId, when.ownerHasBuffKey)) return false;
    }

    if (when.targetHasBuffId) {
      const targetId = "targetId" in ctx ? ctx.targetId : undefined;
      if (!targetId) return false;
      if (!ctx.read.hasBuffType(targetId, when.targetHasBuffId)) return false;
    }

    if (when.targetHasBuffKey) {
      const targetId = "targetId" in ctx ? ctx.targetId : undefined;
      if (!targetId) return false;
      if (!ctx.read.getBuffByKey(targetId, when.targetHasBuffKey)) return false;
    }

    return true;
  }

  private getOwnerIdForContext(ctx: TriggerContext): SimEntityId | undefined {
    if (ctx.ev.type === "buffApply" || ctx.ev.type === "buffRemove") {
      return ctx.ev.targetId;
    }
    if (
      ctx.ev.type === "inflictionApply" ||
      ctx.ev.type === "inflictionExpire"
    ) {
      return ctx.ev.targetId;
    }
    if (ctx.ev.type === "spRecover" || ctx.ev.type === "spReturn") {
      return ctx.ev.sourceId;
    }
    if ("targetId" in ctx && ctx.targetId) return ctx.targetId;
    return undefined;
  }
}

export type SimPluginRegisterFn = (registry: SimRegistry) => void;

export function loadSimRegistry(): SimRegistry {
  const registry = new SimRegistry();

  for (const op of Object.values(operatorsData)) {
    for (const [skillType, skillDef] of Object.entries(op.skills ?? {})) {
      const script = (skillDef as any)?.script;
      if (typeof script !== "function") continue;

      registry.registerOnCastStart({
        id: `operator.${op.id}.skill.${skillType}.script`,
        match: ({ ev }) => ev.sourceId === op.id && ev.skillType === skillType,
        fn: script,
      });
    }

    const anyOp = op as any;
    if (typeof anyOp?.registerSimPlugins === "function") {
      anyOp.registerSimPlugins(registry);
    }
  }

  for (const w of Object.values(weaponsData)) {
    const anyW = w as any;
    if (typeof anyW?.registerSimPlugins === "function") {
      anyW.registerSimPlugins(registry);
    }
  }

  for (const buff of Object.values(buffsData)) {
    const anyBuffDef = buff as any;
    if (typeof anyBuffDef?.registerSimPlugins === "function") {
      anyBuffDef.registerSimPlugins(registry);
    }
  }

  for (const gear of Object.values(gearsData)) {
    const anyGear = gear as any;
    if (typeof anyGear?.registerSimPlugins === "function") {
      anyGear.registerSimPlugins(registry);
    }
  }

  registry.finalize();
  return registry;
}
