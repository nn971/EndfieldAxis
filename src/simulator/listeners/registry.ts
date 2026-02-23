import type { SimBuff } from "../../types/simulator/infliction";
import type { SimEntityId, SimEvent } from "../../types/simulator/simulator";
import type { DamageBonusCollector } from "../damage/damageBonuses";
import type { SimOps, SimRead } from "../simulator";
import operatorsData from "../../data/operators";
import buffsData from "../../data/buffs";
import weaponsData from "../../data/weapons";
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
  /** Allocate a unique seq for spawned events. */
  nextSeq: () => number;
  /** Allocate a unique id for spawned events. */
  makeEventId: () => string;
};
export type AfterHitTrigger = (ctx: AfterHitTriggerContext) => SimEvent[];

export type BeforeApplyStatusTriggerContext = {
  read: SimRead;
  ev: Extract<SimEvent, { type: "statusApply" }>;
  sourceId: SimEntityId;
  targetId: SimEntityId;
  /** Allocate a unique seq for spawned events. */
  nextSeq: () => number;
  /** Allocate a unique id for spawned events. */
  makeEventId: () => string;
};
export type BeforeApplyStatusTrigger = (
  ctx: BeforeApplyStatusTriggerContext,
) => SimEvent[];

export type AfterBuffApplyTriggerContext = {
  read: SimRead;
  ev: Extract<SimEvent, { type: "buffApply" }>;
  sourceId: SimEntityId;
  targetId: SimEntityId;
  /** Allocate a unique seq for spawned events. */
  nextSeq: () => number;
  /** Allocate a unique id for spawned events. */
  makeEventId: () => string;
};
export type AfterBuffApplyTrigger = (
  ctx: AfterBuffApplyTriggerContext,
) => SimEvent[];

export type OnCastTriggerContext = {
  read: SimRead;
  ev: Extract<SimEvent, { type: "castStart" | "castEnd" }>;
  sourceId: SimEntityId;
  targetId?: SimEntityId;
  nextSeq: () => number;
  makeEventId: () => string;
};
export type OnCastTrigger = (ctx: OnCastTriggerContext) => SimEvent[];

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

  private beforeApplyStatusByWeaponId: Record<
    WeaponId,
    ListenerEntry<BeforeApplyStatusTrigger>[]
  > = {};

  private afterBuffApplyByBuffId: Partial<
    Record<BuffId, ListenerEntry<AfterBuffApplyTrigger>[]>
  > = {};

  private onCastStartGlobal: ListenerEntry<OnCastTrigger>[] = [];
  private onCastEndGlobal: ListenerEntry<OnCastTrigger>[] = [];

  /** Register a global damage-bonus listener (not tied to a buff). */
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

  /** Register a damage-bonus listener for a specific buff type. */
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

  /** Register a global after-hit trigger (rare; most are operator-specific). */
  registerAfterHitGlobal(params: {
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

  /** Register an after-hit trigger that only runs when source.id matches operatorId. */
  registerAfterHitForOperator(params: {
    operatorId: string;
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

  /** Register an before-apply-status trigger that only runs when source is holding a weapon whose id matches weaponId. */
  registerBeforeApplyStatusForWeapon(params: {
    weaponId: WeaponId;
    id: string;
    fn: BeforeApplyStatusTrigger;
    priority?: number;
  }): void {
    const list = (this.beforeApplyStatusByWeaponId[params.weaponId] ??=
      []) as ListenerEntry<BeforeApplyStatusTrigger>[];
    list.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
    });
  }

  /** Register an after-buff-apply trigger for a specific buffId (e.g. crystal -> long wish). */
  registerAfterBuffApplyForBuff(params: {
    buffId: BuffId;
    id: string;
    fn: AfterBuffApplyTrigger;
    priority?: number;
  }): void {
    const list = (this.afterBuffApplyByBuffId[params.buffId] ??=
      []) as ListenerEntry<AfterBuffApplyTrigger>[];
    list.push({
      id: params.id,
      fn: params.fn,
      priority: params.priority ?? 0,
    });
  }

  registerOnCastStartGlobal(params: {
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

  registerOnCastEndGlobal(params: {
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

  /**
   * Freeze ordering. Call once after all plugins are registered.
   * This guarantees deterministic results independent of glob import order.
   */
  finalize(): void {
    sortEntries(this.globalDamageBonus);
    sortEntries(this.afterHitGlobal);
    for (const key of Object.keys(this.afterHitByOperatorId)) {
      sortEntries(this.afterHitByOperatorId[key]!);
    }
    for (const key of Object.keys(this.beforeApplyStatusByWeaponId)) {
      sortEntries(this.beforeApplyStatusByWeaponId[key]!);
    }
    for (const key of Object.keys(this.afterBuffApplyByBuffId)) {
      sortEntries(this.afterBuffApplyByBuffId[key as BuffId]!);
    }
    sortEntries(this.onCastStartGlobal);
    sortEntries(this.onCastEndGlobal);
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
      const spawned = e.fn(ctx) ?? [];
      for (const ev of spawned) out.push(ev);
    }

    const list = this.afterHitByOperatorId[ctx.sourceId];
    if (!list || list.length === 0) return out;
    for (const e of list) {
      const spawned = e.fn(ctx) ?? [];
      for (const ev of spawned) out.push(ev);
    }
    return out;
  }

  runBeforeApplyStatus(ctx: BeforeApplyStatusTriggerContext): SimEvent[] {
    const sourceBuild = ctx.read.getBuild(ctx.sourceId);
    if (!sourceBuild) return [];
    if (!sourceBuild.weapon.id) return [];
    const list = this.beforeApplyStatusByWeaponId[sourceBuild.weapon.id];
    if (!list || list.length === 0) return [];

    const out: SimEvent[] = [];
    for (const e of list) {
      const spawned = e.fn(ctx) ?? [];
      for (const ev of spawned) out.push(ev);
    }
    return out;
  }

  runAfterBuffApply(ctx: AfterBuffApplyTriggerContext): SimEvent[] {
    const list = this.afterBuffApplyByBuffId[ctx.ev.buffId];
    if (!list || list.length === 0) return [];
    const out: SimEvent[] = [];
    for (const e of list) {
      const spawned = e.fn(ctx) ?? [];
      for (const ev of spawned) out.push(ev);
    }
    return out;
  }

  runOnCastStart(ctx: OnCastTriggerContext): SimEvent[] {
    const out: SimEvent[] = [];
    for (const e of this.onCastStartGlobal) {
      const spawned = e.fn(ctx) ?? [];
      for (const ev of spawned) out.push(ev);
    }
    return out;
  }

  runOnCastEnd(ctx: OnCastTriggerContext): SimEvent[] {
    const out: SimEvent[] = [];
    for (const e of this.onCastEndGlobal) {
      const spawned = e.fn(ctx) ?? [];
      for (const ev of spawned) out.push(ev);
    }
    return out;
  }
}

export type SimPluginRegisterFn = (registry: SimRegistry) => void;

/** Load plugin modules for operators, buffs under src/data and let them register listeners into a single SimRegistry. */
export function loadSimRegistry(): SimRegistry {
  const registry = new SimRegistry();

  // Register operator-bound listeners from the operator defs themselves.
  for (const op of Object.values(operatorsData)) {
    const anyOp = op as any;
    if (typeof anyOp?.registerSimPlugins === "function") {
      anyOp.registerSimPlugins(registry);
    }
  }

  // Register weapon-bound listeners (e.g. before-apply-status triggers).
  for (const w of Object.values(weaponsData)) {
    const anyW = w as any;
    if (typeof anyW?.registerSimPlugins === "function") {
      anyW.registerSimPlugins(registry);
    }
  }

  // Register damage bonuses from buffs defined in the data layer.
  for (const buff of Object.values(buffsData)) {
    const anyBuffDef = buff as any;
    if (typeof anyBuffDef?.registerSimPlugins === "function") {
      anyBuffDef.registerSimPlugins(registry);
    }
  }

  registry.finalize();
  return registry;
}
