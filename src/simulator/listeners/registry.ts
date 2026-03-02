import type { SimBuff } from "../../types/simulator/infliction";
import type { SimEntityId, SimEvent } from "../../types/simulator/simulator";
import type { SimEventDraft, SimScript } from "../scripts";
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
import type { SimEventWhen } from "../../types/simulator/when";
import { runSimScript, type SimScriptContext } from "../scripts";
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
  ev: Extract<SimEvent, { type: "hit" }>;
  sourceId: SimEntityId;
  targetId: SimEntityId;
};
export type AfterHitTrigger = SimScript;

export type OnCastTriggerContext = {
  read: SimRead;
  ev: Extract<SimEvent, { type: "castStart" | "castEnd" }>;
  sourceId: SimEntityId;
  targetId?: SimEntityId;
};
export type OnCastTrigger = SimScript;

export type OnStatusApplyTriggerContext = {
  read: SimRead;
  ev: Extract<SimEvent, { type: "statusApply" }>;
  sourceId: SimEntityId;
  targetId: SimEntityId;
};
export type OnStatusApplyTrigger = SimScript;

export type OnBuffApplyTriggerContext = {
  read: SimRead;
  ev: Extract<SimEvent, { type: "buffApply" }>;
  sourceId?: SimEntityId;
  targetId: SimEntityId;
};
export type OnBuffApplyTrigger = SimScript;

export type OnBuffConsumedTriggerContext = {
  read: SimRead;
  ev: Extract<SimEvent, { type: "buffRemove" }>;
  sourceId: SimEntityId;
};
export type OnBuffConsumedTrigger = SimScript;

export type OnInflictionApplyTriggerContext = {
  read: SimRead;
  ev: Extract<SimEvent, { type: "inflictionApply" }>;
  sourceId: SimEntityId;
  targetId: SimEntityId;
};
export type OnInflictionApplyTrigger = SimScript;

export type OnInflictionConsumedTriggerContext = {
  read: SimRead;
  ev: Extract<SimEvent, { type: "inflictionExpire" }>;
  sourceId: SimEntityId;
};
export type OnInflictionConsumedTrigger = SimScript;

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

type TriggerWhen = SimEventWhen;

type RegisterTriggerParams<TCtx extends TriggerContext> = {
  id: string;
  fn: SimScript;
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
    params: RegisterTriggerParams<AfterHitTriggerContext>,
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
    params: RegisterTriggerParams<OnCastTriggerContext>,
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
    params: RegisterTriggerParams<OnCastTriggerContext>,
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
    params: RegisterTriggerParams<OnStatusApplyTriggerContext>,
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
    params: RegisterTriggerParams<OnBuffApplyTriggerContext>,
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
    params: RegisterTriggerParams<OnBuffConsumedTriggerContext>,
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
    params: RegisterTriggerParams<OnInflictionApplyTriggerContext>,
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
    params: RegisterTriggerParams<OnInflictionConsumedTriggerContext>,
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

  runAfterHit(ctx: AfterHitTriggerContext): SimEventDraft[] {
    return this.runTriggers(this.afterHit, ctx);
  }

  runOnCastStart(ctx: OnCastTriggerContext): SimEventDraft[] {
    return this.runTriggers(this.onCastStart, ctx);
  }

  runOnCastEnd(ctx: OnCastTriggerContext): SimEventDraft[] {
    return this.runTriggers(this.onCastEnd, ctx);
  }

  runOnStatusApply(ctx: OnStatusApplyTriggerContext): SimEventDraft[] {
    return this.runTriggers(this.onStatusApply, ctx);
  }

  runOnBuffApply(ctx: OnBuffApplyTriggerContext): SimEventDraft[] {
    return this.runTriggers(this.onBuffApply, ctx);
  }

  runOnBuffConsumed(ctx: OnBuffConsumedTriggerContext): SimEventDraft[] {
    return this.runTriggers(this.onBuffConsumed, ctx);
  }

  runOnInflictionApply(ctx: OnInflictionApplyTriggerContext): SimEventDraft[] {
    return this.runTriggers(this.onInflictionApply, ctx);
  }

  runOnInflictionConsumed(
    ctx: OnInflictionConsumedTriggerContext,
  ): SimEventDraft[] {
    return this.runTriggers(this.onInflictionConsumed, ctx);
  }

  private runTriggers<TCtx extends TriggerContext>(
    entries: ListenerEntry<SimScript>[],
    ctx: TCtx,
  ): SimEventDraft[] {
    const out: SimEventDraft[] = [];
    for (const e of entries) {
      if (!this.matchesListener(e, ctx)) {
        continue;
      }

      out.push(
        ...runSimScript({
          script: e.fn,
          baseFrame: ctx.ev.frame,
          ctx: this.buildScriptContext(ctx),
        }),
      );
    }
    return out;
  }

  private buildScriptContext(ctx: TriggerContext): SimScriptContext {
    const sourceId = "sourceId" in ctx ? ctx.sourceId : ctx.ev.ownerId;
    const targetId =
      "targetId" in ctx && ctx.targetId ? ctx.targetId : sourceId;

    return {
      read: ctx.read,
      ev: ctx.ev,
      sourceId,
      targetId,
      startFrame: ctx.ev.frame,
      skillType: this.getSkillTypeFromEvent(ctx.ev),
      sourceBuild: sourceId ? ctx.read.getBuild(sourceId) : undefined,
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

    if (when.ownerHasBuffId) {
      const ownerId = this.getOwnerIdForContext(ctx);
      if (!ownerId) return false;
      const owner = ctx.read.getEntity(ownerId);
      if (!(owner as any)?.buffs?.[when.ownerHasBuffId]) return false;
    }

    if (when.targetHasBuffId) {
      const targetId = "targetId" in ctx ? ctx.targetId : undefined;
      if (!targetId) return false;
      const target = ctx.read.getEntity(targetId);
      if (!(target as any)?.buffs?.[when.targetHasBuffId]) return false;
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
