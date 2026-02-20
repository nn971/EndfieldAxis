import type { SimBuff, SimBuffType } from "../../types/simulator/infliction";
import type { SimEntityId, SimEvent } from "../../types/simulator/simulator";
import type { DamageBonusCollector } from "../damageBonuses";
import type { DamageKind } from "../damageModel";
import type { SimOps, SimRead } from "../simulator";

/**
 * Listener/registry layer:
 * - The simulator core only emits events and asks the registry to run listeners.
 * - Buffs/operators define listeners elsewhere ("content"), and are auto-registered.
 */

export type HitEvent = Extract<SimEvent, { type: "hit" }>;

export type DamageBonusListenerContext = {
  read: SimRead;
  /** The event that caused this damage. For status procs, this can be undefined. */
  ev?: SimEvent;
  kind: DamageKind;
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
  ev: HitEvent;
  sourceId: SimEntityId;
  targetId: SimEntityId;
};

export type AfterHitTrigger = (ctx: AfterHitTriggerContext) => void;

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
    Record<SimBuffType, ListenerEntry<BuffDamageBonusListener>[]>
  > = {};

  private afterHitGlobal: ListenerEntry<AfterHitTrigger>[] = [];
  private afterHitByOperatorId: Record<
    string,
    ListenerEntry<AfterHitTrigger>[]
  > = {};

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
    buffType: SimBuffType;
    id: string;
    fn: BuffDamageBonusListener;
    priority?: number;
  }): void {
    const list = (this.buffDamageBonus[params.buffType] ??=
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
    for (const key of Object.keys(this.buffDamageBonus)) {
      sortEntries(this.buffDamageBonus[key as SimBuffType]!);
    }
  }

  runGlobalDamageBonus(ctx: DamageBonusListenerContext): void {
    for (const e of this.globalDamageBonus) e.fn(ctx);
  }

  runBuffDamageBonus(ctx: BuffDamageBonusListenerContext): void {
    const list = this.buffDamageBonus[ctx.buff.type];
    if (!list || list.length === 0) return;
    for (const e of list) e.fn(ctx);
  }

  runAfterHit(ctx: AfterHitTriggerContext): void {
    for (const e of this.afterHitGlobal) e.fn(ctx);
    const list = this.afterHitByOperatorId[ctx.sourceId];
    if (!list || list.length === 0) return;
    for (const e of list) e.fn(ctx);
  }
}

export type SimPluginRegisterFn = (registry: SimRegistry) => void;
