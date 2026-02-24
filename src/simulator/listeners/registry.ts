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
  priority: number;
  fn: TFn;
};

function sortEntries<TFn>(arr: ListenerEntry<TFn>[]): void {
  arr.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return a.id.localeCompare(b.id);
  });
}

export class SimRegistry {
  private globalDamageBonus: ListenerEntry<GlobalDamageBonusListener>[] = [];
  private buffDamageBonus: Partial<
    Record<BuffId, ListenerEntry<BuffDamageBonusListener>[]>
  > = {};

  private afterHitGlobal: ListenerEntry<AfterHitTrigger>[] = [];
  private afterHitByOperatorId: Record<
    OperatorId,
    ListenerEntry<AfterHitTrigger>[]
  > = {};

  private onCastStartGlobal: ListenerEntry<OnCastTrigger>[] = [];
  private onCastEndGlobal: ListenerEntry<OnCastTrigger>[] = [];

  private onStatusApplyGlobal: ListenerEntry<OnStatusApplyTrigger>[] = [];
  private onStatusApplyByWielderWeaponId: Partial<
    Record<WeaponId, ListenerEntry<OnStatusApplyTrigger>[]>
  > = {};

  private onBuffApplyGlobal: ListenerEntry<OnBuffApplyTrigger>[] = [];
  private onBuffApplyByBuffId: Partial<
    Record<BuffId, ListenerEntry<OnBuffApplyTrigger>[]>
  > = {};

  private onBuffConsumedGlobal: ListenerEntry<OnBuffConsumedTrigger>[] = [];
  private onBuffConsumedByBuffId: Partial<
    Record<BuffId, ListenerEntry<OnBuffConsumedTrigger>[]>
  > = {};

  private onInflictionApplyGlobal: ListenerEntry<OnInflictionApplyTrigger>[] =
    [];
  private onInflictionApplyByBuffId: Partial<
    Record<BuffId, ListenerEntry<OnInflictionApplyTrigger>[]>
  > = {};

  private onInflictionConsumedGlobal: ListenerEntry<OnInflictionConsumedTrigger>[] =
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

  registerAfterHit(params: {
    id: string;
    fn: AfterHitTrigger;
    priority?: number;
  }): void {
    this.afterHitGlobal.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
    });
  }

  registerAfterHitForOperator(params: {
    operatorId: OperatorId;
    id: string;
    fn: AfterHitTrigger;
    priority?: number;
  }): void {
    const list = (this.afterHitByOperatorId[params.operatorId] ??=
      []) as ListenerEntry<AfterHitTrigger>[];
    list.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
    });
  }

  registerOnCastStart(params: {
    id: string;
    fn: OnCastTrigger;
    priority?: number;
  }): void {
    this.onCastStartGlobal.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
    });
  }

  registerOnCastEnd(params: {
    id: string;
    fn: OnCastTrigger;
    priority?: number;
  }): void {
    this.onCastEndGlobal.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
    });
  }

  registerOnStatusApply(params: {
    id: string;
    fn: OnStatusApplyTrigger;
    priority?: number;
  }): void {
    this.onStatusApplyGlobal.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
    });
  }

  registerOnStatusApplyIfWielded(params: {
    weaponId: WeaponId;
    id: string;
    fn: OnStatusApplyTrigger;
    priority?: number;
  }): void {
    const list = (this.onStatusApplyByWielderWeaponId[params.weaponId] ??=
      []) as ListenerEntry<OnStatusApplyTrigger>[];
    list.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
    });
  }

  registerOnBuffApply(params: {
    id: string;
    fn: OnBuffApplyTrigger;
    priority?: number;
  }): void {
    this.onBuffApplyGlobal.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
    });
  }

  registerOnBuffApplyForBuff(params: {
    buffId: BuffId;
    id: string;
    fn: OnBuffApplyTrigger;
    priority?: number;
  }): void {
    const list = (this.onBuffApplyByBuffId[params.buffId] ??=
      []) as ListenerEntry<OnBuffApplyTrigger>[];
    list.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
    });
  }

  registerOnBuffConsumed(params: {
    id: string;
    fn: OnBuffConsumedTrigger;
    priority?: number;
  }): void {
    this.onBuffConsumedGlobal.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
    });
  }

  registerOnBuffConsumedForBuff(params: {
    buffId: BuffId;
    id: string;
    fn: OnBuffConsumedTrigger;
    priority?: number;
  }): void {
    const list = (this.onBuffConsumedByBuffId[params.buffId] ??=
      []) as ListenerEntry<OnBuffConsumedTrigger>[];
    list.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
    });
  }

  registerOnInflictionApply(params: {
    id: string;
    fn: OnInflictionApplyTrigger;
    priority?: number;
  }): void {
    this.onInflictionApplyGlobal.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
    });
  }

  registerOnInflictionApplyForBuff(params: {
    buffId: BuffId;
    id: string;
    fn: OnInflictionApplyTrigger;
    priority?: number;
  }): void {
    const list = (this.onInflictionApplyByBuffId[params.buffId] ??=
      []) as ListenerEntry<OnInflictionApplyTrigger>[];
    list.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
    });
  }

  registerOnInflictionConsumed(params: {
    id: string;
    fn: OnInflictionConsumedTrigger;
    priority?: number;
  }): void {
    this.onInflictionConsumedGlobal.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
    });
  }

  finalize(): void {
    /** TODO Fix the order of these so that it triggers as real game does,
     *  and of course in the same order during each simulation.
     *  Note: Priorly triggered events happens later, due to the seq.
     */
    sortEntries(this.globalDamageBonus);
    sortEntries(this.afterHitGlobal);
    for (const key of Object.keys(this.afterHitByOperatorId)) {
      sortEntries(this.afterHitByOperatorId[key as OperatorId]!);
    }
    sortEntries(this.onCastStartGlobal);
    sortEntries(this.onCastEndGlobal);
    /** within onStatusApply: Swordmancer prior than Sundering Steel
     *                        Swordmancer prior than Crystal Shattered
     */
    sortEntries(this.onStatusApplyGlobal);
    for (const key of Object.keys(this.onStatusApplyByWielderWeaponId)) {
      sortEntries(this.onStatusApplyByWielderWeaponId[key as WeaponId]!);
    }
    sortEntries(this.onBuffApplyGlobal);
    for (const key of Object.keys(this.onBuffApplyByBuffId)) {
      sortEntries(this.onBuffApplyByBuffId[key as BuffId]!);
    }
    sortEntries(this.onBuffConsumedGlobal);
    for (const key of Object.keys(this.onBuffConsumedByBuffId)) {
      sortEntries(this.onBuffConsumedByBuffId[key as BuffId]!);
    }
    sortEntries(this.onInflictionApplyGlobal);
    for (const key of Object.keys(this.onInflictionApplyByBuffId)) {
      sortEntries(this.onInflictionApplyByBuffId[key as BuffId]!);
    }
    sortEntries(this.onInflictionConsumedGlobal);
    for (const key of Object.keys(this.buffDamageBonus)) {
      sortEntries(this.buffDamageBonus[key as BuffId]!);
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
    const out: SimEvent[] = [];
    for (const e of this.afterHitGlobal) {
      out.push(...(e.fn(ctx) ?? []));
    }

    const list = this.afterHitByOperatorId[ctx.sourceId as OperatorId];
    if (!list || list.length === 0) return out;
    for (const e of list) {
      out.push(...(e.fn(ctx) ?? []));
    }
    return out;
  }

  runOnCastStart(ctx: OnCastTriggerContext): SimEvent[] {
    const out: SimEvent[] = [];
    for (const e of this.onCastStartGlobal) out.push(...(e.fn(ctx) ?? []));
    return out;
  }

  runOnCastEnd(ctx: OnCastTriggerContext): SimEvent[] {
    const out: SimEvent[] = [];
    for (const e of this.onCastEndGlobal) out.push(...(e.fn(ctx) ?? []));
    return out;
  }

  runOnStatusApply(ctx: OnStatusApplyTriggerContext): SimEvent[] {
    const out: SimEvent[] = [];
    for (const e of this.onStatusApplyGlobal) out.push(...(e.fn(ctx) ?? []));

    const sourceBuild = ctx.read.getBuild(ctx.sourceId);
    const weaponId = sourceBuild?.weapon.id;
    if (!weaponId) return out;

    const weaponListeners = this.onStatusApplyByWielderWeaponId[weaponId];
    if (!weaponListeners || weaponListeners.length === 0) return out;
    for (const e of weaponListeners) out.push(...(e.fn(ctx) ?? []));

    return out;
  }

  runOnBuffApply(ctx: OnBuffApplyTriggerContext): SimEvent[] {
    const out: SimEvent[] = [];
    for (const e of this.onBuffApplyGlobal) out.push(...(e.fn(ctx) ?? []));

    const list = this.onBuffApplyByBuffId[ctx.ev.buffId];
    if (!list || list.length === 0) return out;
    for (const e of list) out.push(...(e.fn(ctx) ?? []));
    return out;
  }

  runOnBuffConsumed(ctx: OnBuffConsumedTriggerContext): SimEvent[] {
    const out: SimEvent[] = [];
    for (const e of this.onBuffConsumedGlobal) out.push(...(e.fn(ctx) ?? []));

    const list = this.onBuffConsumedByBuffId[ctx.ev.buffId];
    if (!list || list.length === 0) return out;
    for (const e of list) out.push(...(e.fn(ctx) ?? []));
    return out;
  }

  runOnInflictionApply(ctx: OnInflictionApplyTriggerContext): SimEvent[] {
    const out: SimEvent[] = [];
    for (const e of this.onInflictionApplyGlobal) {
      out.push(...(e.fn(ctx) ?? []));
    }

    const target = ctx.read.getEntity(ctx.targetId);
    const buffIds = Object.keys((target as any).buffs ?? {}) as BuffId[];
    if (buffIds.length === 0) return out;

    for (const buffId of buffIds) {
      const list = this.onInflictionApplyByBuffId[buffId];
      if (!list || list.length === 0) continue;
      for (const e of list) out.push(...(e.fn(ctx) ?? []));
    }
    return out;
  }

  runOnInflictionConsumed(ctx: OnInflictionConsumedTriggerContext): SimEvent[] {
    const out: SimEvent[] = [];
    for (const e of this.onInflictionConsumedGlobal) {
      out.push(...(e.fn(ctx) ?? []));
    }
    return out;
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
