import type { SimRegistry } from "../../../simulator/listeners/registry";
import { BuffDef } from "../BuffDef";

/** Triggers Cryo damage 1.2 * (1+stacksConsumed).
 *  Last for 6s/7s/8s/9s.
 *  When become vulnerable or suffers physical status,
 *  triggers Shatter damage 1.2 * (1+stacks)
 */

export const SOLIDIFICATION_BUFF_ID = "buff.solidification" as const;
export const SOLIDIFICATION_BASE_DURATION_FRAMES = 360;
export const SOLIDIFICATION_EXTRA_DURATION_PER_STACK_FRAMES = 60;

export const SOLIDIFICATION_SHATTER_BASE_MUL = 2.5;
export const SOLIDIFICATION_SHATTER_PER_STACK_MUL = 1.5;

export const SOLIDIFICATION_INITIAL_HIT_BASE_MUL = 0.6;
export const SOLIDIFICATION_INITIAL_HIT_PER_STACK_MUL = 0.4;

class SolidificationBuffDef extends BuffDef {
  constructor() {
    super({
      id: SOLIDIFICATION_BUFF_ID,
      name: "Solidification",
      icon: "SOLIDIFICATION.png",
      durationFrames: 360,
      maxStacks: 4,
    });
  }

  override registerSimPlugins(registry: SimRegistry): void {
    const spawnShatter = function* (
      params: {
        sourceId: string;
        targetId: string;
        stacks: number;
        ref?: string | null;
      },
      emit: { buffRemove: (draft: any) => any; hit: (draft: any) => any },
    ) {
      yield emit.buffRemove({
        targetId: params.targetId,
        buffId: SOLIDIFICATION_BUFF_ID,
        ref: params.ref,
      });
      yield emit.hit({
        sourceId: params.sourceId,
        targetId: params.targetId,
        damageType: "physical",
        dmgMultiplier:
          SOLIDIFICATION_SHATTER_BASE_MUL +
          params.stacks * SOLIDIFICATION_SHATTER_PER_STACK_MUL,
        ref: params.ref,
      });
    };

    registry.registerOnStatusApply({
      id: "buff.solidification.shatter.onPhysicalStatus",
      fn: function* (ctx) {
        const { read, ev, sourceId, targetId, emit } = ctx;
        if (ev?.type !== "statusApply" || !sourceId || !targetId) return;
        if (
          ev.statusType !== "lift" &&
          ev.statusType !== "knockDown" &&
          ev.statusType !== "crush" &&
          ev.statusType !== "breach"
        ) {
          return;
        }

        const target = read.getEntity(targetId);
        const stacks = Number(
          (target as any).buffs?.[SOLIDIFICATION_BUFF_ID]?.stacks ?? 0,
        );
        if (stacks <= 0) return;

        yield* spawnShatter(
          {
            sourceId,
            targetId,
            stacks,
            ref: ev.id,
          },
          emit,
        );
      },
    });

    registry.registerOnInflictionApply({
      id: "buff.solidification.shatter.onVulnerable",
      fn: function* (ctx) {
        const { read, ev, sourceId, targetId, emit } = ctx;
        if (ev?.type !== "inflictionApply" || !sourceId || !targetId) return;
        if (ev.inflictionType !== "vulnerable") return;

        const target = read.getEntity(targetId);
        const stacks = Number(
          (target as any).buffs?.[SOLIDIFICATION_BUFF_ID]?.stacks ?? 0,
        );
        if (stacks <= 0) return;

        yield* spawnShatter(
          {
            sourceId,
            targetId,
            stacks,
            ref: ev.id,
          },
          emit,
        );
      },
    });
  }
}

export default new SolidificationBuffDef();
