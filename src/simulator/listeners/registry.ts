import type { SimBuff } from "../../types/simulator/infliction";
import type { SimEntityId, SimEvent } from "../../types/simulator/simulator";
import type { DamageBonusCollector } from "../damage/damageBonuses";
import type { SimRead } from "../simulator";
import operatorsData from "../../data/operators";
import buffsData from "../../data/buffs";
import weaponsData from "../../data/weapons";
import gearsData from "../../data/gears";
import { BuffId } from "../../data/buffs/BuffDef";
import { WeaponId } from "../../data/weapons/WeaponDef";
import { OperatorId } from "../../data/operators/OperatorDef";
import { DamageType } from "../../types/operator";
import {
  sortPluginsByGameOrder,
  type PluginOrderingBucket,
} from "./pluginOrder";

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
  ev: Extract<SimEvent, { type: "hit" }>;
  sourceId: SimEntityId;
  targetId: SimEntityId;
  nextSeq: () => number;
  makeEventId: () => string;
};
export type AfterHitTrigger = (ctx: AfterHitTriggerContext) => SimEvent[];

export type OnCastTriggerContext = {
  read: SimRead;
  ev: Extract<SimEvent, { type: "castStart" | "castEnd" }>;
  sourceId: SimEntityId;
  targetId?: SimEntityId;
  nextSeq: () => number;
  makeEventId: () => string;
};
export type OnCastTrigger = (ctx: OnCastTriggerContext) => SimEvent[];

export type OnStatusApplyTriggerContext = {
  read: SimRead;
  ev: Extract<SimEvent, { type: "statusApply" }>;
  sourceId: SimEntityId;
  targetId: SimEntityId;
  nextSeq: () => number;
  makeEventId: () => string;
};
export type OnStatusApplyTrigger = (
  ctx: OnStatusApplyTriggerContext,
) => SimEvent[];

export type OnBuffApplyTriggerContext = {
  read: SimRead;
  ev: Extract<SimEvent, { type: "buffApply" }>;
  sourceId?: SimEntityId;
  targetId: SimEntityId;
  nextSeq: () => number;
  makeEventId: () => string;
};
export type OnBuffApplyTrigger = (ctx: OnBuffApplyTriggerContext) => SimEvent[];

export type OnBuffConsumedTriggerContext = {
  read: SimRead;
  ev: Extract<SimEvent, { type: "buffRemove" }>;
  sourceId: SimEntityId;
  nextSeq: () => number;
  makeEventId: () => string;
};
export type OnBuffConsumedTrigger = (
  ctx: OnBuffConsumedTriggerContext,
) => SimEvent[];

export type OnInflictionApplyTriggerContext = {
  read: SimRead;
  ev: Extract<SimEvent, { type: "inflictionApply" }>;
  sourceId: SimEntityId;
  targetId: SimEntityId;
  nextSeq: () => number;
  makeEventId: () => string;
};
export type OnInflictionApplyTrigger = (
  ctx: OnInflictionApplyTriggerContext,
) => SimEvent[];

export type OnInflictionConsumedTriggerContext = {
  read: SimRead;
  ev: Extract<SimEvent, { type: "inflictionExpire" }>;
  sourceId: SimEntityId;
  nextSeq: () => number;
  makeEventId: () => string;
};
export type OnInflictionConsumedTrigger = (
  ctx: OnInflictionConsumedTriggerContext,
) => SimEvent[];

type ListenerEntry<TFn> = {
  id: string;
  priority: number; // currently not in use. all priority are 0
  fn: TFn;
  when?: TriggerWhen;
  match?: (ctx: TriggerContext) => boolean;
};

type TriggerContext =
  | AfterHitTriggerContext
  | OnCastTriggerContext
  | OnStatusApplyTriggerContext
  | OnBuffApplyTriggerContext
  | OnBuffConsumedTriggerContext
  | OnInflictionApplyTriggerContext
  | OnInflictionConsumedTriggerContext;

type TriggerWhen = {
  sourceOperatorId?: OperatorId;
  sourceWeaponId?: WeaponId;
  buffId?: BuffId;
  ownerHasBuffId?: BuffId;
};

type RegisterTriggerParams<TFn, TCtx extends TriggerContext> = {
  id: string;
  fn: TFn;
  priority?: number;
  when?: TriggerWhen;
  match?: (ctx: TCtx) => boolean;
};

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
    const list = (this.buffDamageBonus[params.id] ??=
      []) as ListenerEntry<BuffDamageBonusListener>[];
    list.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
    });
  }

  registerAfterHit(
    params: RegisterTriggerParams<AfterHitTrigger, AfterHitTriggerContext>,
  ): void {
    this.afterHit.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
      when: params.when,
      match: params.match as ListenerEntry<AfterHitTrigger>["match"],
    });
  }

  registerOnCastStart(
    params: RegisterTriggerParams<OnCastTrigger, OnCastTriggerContext>,
  ): void {
    this.onCastStart.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
      when: params.when,
      match: params.match as ListenerEntry<OnCastTrigger>["match"],
    });
  }

  registerOnCastEnd(
    params: RegisterTriggerParams<OnCastTrigger, OnCastTriggerContext>,
  ): void {
    this.onCastEnd.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
      when: params.when,
      match: params.match as ListenerEntry<OnCastTrigger>["match"],
    });
  }

  registerOnStatusApply(
    params: RegisterTriggerParams<
      OnStatusApplyTrigger,
      OnStatusApplyTriggerContext
    >,
  ): void {
    this.onStatusApply.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
      when: params.when,
      match: params.match as ListenerEntry<OnStatusApplyTrigger>["match"],
    });
  }

  registerOnBuffApply(
    params: RegisterTriggerParams<
      OnBuffApplyTrigger,
      OnBuffApplyTriggerContext
    >,
  ): void {
    this.onBuffApply.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
      when: params.when,
      match: params.match as ListenerEntry<OnBuffApplyTrigger>["match"],
    });
  }

  registerOnBuffConsumed(
    params: RegisterTriggerParams<
      OnBuffConsumedTrigger,
      OnBuffConsumedTriggerContext
    >,
  ): void {
    this.onBuffConsumed.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
      when: params.when,
      match: params.match as ListenerEntry<OnBuffConsumedTrigger>["match"],
    });
  }

  registerOnInflictionApply(
    params: RegisterTriggerParams<
      OnInflictionApplyTrigger,
      OnInflictionApplyTriggerContext
    >,
  ): void {
    this.onInflictionApply.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
      when: params.when,
      match: params.match as ListenerEntry<OnInflictionApplyTrigger>["match"],
    });
  }

  registerOnInflictionConsumed(
    params: RegisterTriggerParams<
      OnInflictionConsumedTrigger,
      OnInflictionConsumedTriggerContext
    >,
  ): void {
    this.onInflictionConsumed.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
      when: params.when,
      match:
        params.match as ListenerEntry<OnInflictionConsumedTrigger>["match"],
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
      console.warn(
        `No damage bonus listeners registered for buffId=${ctx.buff.id}`,
      );
      return;
    }
    for (const e of list) e.fn(ctx);
  }

  runAfterHit(ctx: AfterHitTriggerContext): SimEvent[] {
    return this.runTriggers(this.afterHit, ctx);
  }

  runOnCastStart(ctx: OnCastTriggerContext): SimEvent[] {
    return this.runTriggers(this.onCastStart, ctx);
  }

  runOnCastEnd(ctx: OnCastTriggerContext): SimEvent[] {
    return this.runTriggers(this.onCastEnd, ctx);
  }

  runOnStatusApply(ctx: OnStatusApplyTriggerContext): SimEvent[] {
    return this.runTriggers(this.onStatusApply, ctx);
  }

  runOnBuffApply(ctx: OnBuffApplyTriggerContext): SimEvent[] {
    return this.runTriggers(this.onBuffApply, ctx);
  }

  runOnBuffConsumed(ctx: OnBuffConsumedTriggerContext): SimEvent[] {
    return this.runTriggers(this.onBuffConsumed, ctx);
  }

  runOnInflictionApply(ctx: OnInflictionApplyTriggerContext): SimEvent[] {
    return this.runTriggers(this.onInflictionApply, ctx);
  }

  runOnInflictionConsumed(ctx: OnInflictionConsumedTriggerContext): SimEvent[] {
    const out: SimEvent[] = [];
    for (const e of this.onInflictionConsumed) {
      if (
        !this.matchesListener(
          e as ListenerEntry<(ctx: TriggerContext) => SimEvent[]>,
          ctx,
        )
      )
        continue;
      out.push(...(e.fn(ctx) ?? []));
    }
    return out;
  }

  private runTriggers<TCtx extends TriggerContext>(
    entries: ListenerEntry<(ctx: TCtx) => SimEvent[]>[],
    ctx: TCtx,
  ): SimEvent[] {
    const out: SimEvent[] = [];
    for (const e of entries) {
      if (!this.matchesListener(e, ctx)) {
        continue;
      }
      out.push(...(e.fn(ctx) ?? []));
    }
    return out;
  }

  private matchesListener<TCtx extends TriggerContext>(
    entry: ListenerEntry<(ctx: TCtx) => SimEvent[]>,
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

    if (when.ownerHasBuffId) {
      const ownerId = this.getOwnerIdForContext(ctx);
      if (!ownerId) return false;
      const owner = ctx.read.getEntity(ownerId);
      if (!(owner as any)?.buffs?.[when.ownerHasBuffId]) return false;
    }

    return true;
  }

  private getOwnerIdForContext(ctx: TriggerContext): SimEntityId | undefined {
    if (ctx.ev.type === "buffApply" || ctx.ev.type === "buffRemove") {
      return ctx.ev.ownerId;
    }
    if (
      ctx.ev.type === "inflictionApply" ||
      ctx.ev.type === "inflictionExpire"
    ) {
      return ctx.ev.ownerId;
    }
    if ("targetId" in ctx && ctx.targetId) return ctx.targetId;
    return undefined;
  }
}

export type SimPluginRegisterFn = (registry: SimRegistry) => void;

export function loadSimRegistry(): SimRegistry {
  const registry = new SimRegistry();

  for (const op of Object.values(operatorsData)) {
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
